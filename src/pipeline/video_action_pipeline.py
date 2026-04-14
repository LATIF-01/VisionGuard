from collections import Counter, defaultdict, deque
from dataclasses import dataclass
from queue import Queue
from threading import Thread
from typing import Any, Deque, Dict, Optional, Tuple

import cv2
import numpy as np
from ultralytics import YOLO

from src.alerts.engine import ActionAlertEngine
from src.alerts.models import AlertRule
from src.alerts.rule_loader import load_alert_rules
from src.events.db_event_sink import DBEventSink
from src.events.video_event_logger import VideoEventLogger
from src.models.action.x3d_recognizer import (
	X3DRecognizer,
	apply_action_model_presets,
	load_action_label_map,
)
from src.models.detection.box_utils import expand_box, get_object_label
from src.models.segmentation.person_mask import apply_person_segmentation_mask
from src.models.tracking.embedding_manager import EmbeddingManager


@dataclass
class ActionState:
	label: str
	score: float


class AsyncVideoEventLogger:
	"""Background writer for JSONL events to reduce main-loop I/O stalls."""

	def __init__(self, logger: VideoEventLogger):
		self._logger = logger
		self._queue: Queue = Queue()
		self._stop_sentinel = object()
		self._worker_error: Optional[BaseException] = None
		self._closed = False
		self._thread = Thread(target=self._run, name="event-log-writer", daemon=True)
		self._thread.start()

	def _run(self) -> None:
		try:
			while True:
				item = self._queue.get()
				if item is self._stop_sentinel:
					break

				kind, payload = item
				if kind == "track":
					self._logger.log_track(payload)
				elif kind == "alert":
					self._logger.log_alert(payload)
				elif kind == "frame":
					self._logger.log_frame(
						frame_idx=int(payload["frame_idx"]),
						timestamp_s=float(payload["timestamp_s"]),
						active_track_count=int(payload["active_track_count"]),
						tracked_person_count=int(payload["tracked_person_count"]),
					)
		except BaseException as exc:
			self._worker_error = exc

	def _enqueue(self, kind: str, payload: Dict[str, Any]) -> None:
		if self._worker_error is not None:
			raise RuntimeError(f"Async event logger worker failed: {self._worker_error}")
		if self._closed:
			return
		self._queue.put((kind, payload))

	def log_track(self, payload: Dict[str, Any]) -> None:
		self._enqueue("track", payload)

	def log_alert(self, payload: Dict[str, Any]) -> None:
		self._enqueue("alert", payload)

	def log_frame(self, *, frame_idx: int, timestamp_s: float, active_track_count: int, tracked_person_count: int) -> None:
		self._enqueue(
			"frame",
			{
				"frame_idx": int(frame_idx),
				"timestamp_s": float(timestamp_s),
				"active_track_count": int(active_track_count),
				"tracked_person_count": int(tracked_person_count),
			},
		)

	def close(self) -> None:
		if self._closed:
			return
		self._closed = True
		self._queue.put(self._stop_sentinel)
		self._thread.join()
		self._logger.close()
		if self._worker_error is not None:
			raise RuntimeError(f"Async event logger worker failed: {self._worker_error}")


class AsyncDBEventSink:
	"""Background DB writer for track and alert events."""

	def __init__(
		self,
		*,
		input_path: str,
		output_path: str,
		fps: float,
		frame_width: int,
		frame_height: int,
		run_name: str = "",
	):
		self._sink_kwargs = {
			"input_path": input_path,
			"output_path": output_path,
			"fps": float(fps),
			"frame_width": int(frame_width),
			"frame_height": int(frame_height),
			"run_name": run_name,
		}
		self._sink: Optional[DBEventSink] = None
		self._run_id = ""
		self._queue: Queue = Queue()
		self._stop_sentinel = object()
		self._worker_error: Optional[BaseException] = None
		self._closed = False
		self._thread = Thread(target=self._run, name="db-event-writer", daemon=True)
		self._thread.start()

	@property
	def run_id(self) -> str:
		return self._run_id

	def _run(self) -> None:
		try:
			self._sink = DBEventSink(**self._sink_kwargs)
			self._run_id = self._sink.run_id
			while True:
				item = self._queue.get()
				if item is self._stop_sentinel:
					break

				kind, payload = item
				if kind == "track":
					self._sink.add_track_event(payload)
				elif kind == "alert":
					self._sink.add_alert(payload)
				elif kind == "finalize":
					self._sink.finalize(total_frames=int(payload.get("total_frames", 0)))
		except BaseException as exc:
			self._worker_error = exc

	def _enqueue(self, kind: str, payload: Dict[str, Any]) -> None:
		if self._worker_error is not None:
			raise RuntimeError(f"Async DB sink worker failed: {self._worker_error}")
		if self._closed:
			return
		self._queue.put((kind, payload))

	def add_track_event(self, payload: Dict[str, Any]) -> None:
		self._enqueue("track", payload)

	def add_alert(self, payload: Dict[str, Any]) -> None:
		self._enqueue("alert", payload)

	def finalize(self, total_frames: int) -> None:
		if self._closed:
			return
		self._closed = True
		self._queue.put(("finalize", {"total_frames": int(total_frames)}))
		self._queue.put(self._stop_sentinel)
		self._thread.join()
		if self._worker_error is not None:
			raise RuntimeError(f"Async DB sink worker failed: {self._worker_error}")


def run(args) -> None:
	apply_action_model_presets(args)

	detector = YOLO(args.yolo_weights)
	segmenter = YOLO(args.seg_weights) if args.enable_segmentation else None
	recognizer = X3DRecognizer(
		device=args.device,
		num_frames=args.clip_len,
		side_size=args.side_size,
		crop_size=args.crop_size,
		model_name=args.action_model,
	)

	embedding_mgr = EmbeddingManager(device=args.device)

	label_map = load_action_label_map(args.action_label_map, num_classes=400)

	clip_buffers: Dict[int, Deque[np.ndarray]] = defaultdict(lambda: deque(maxlen=args.clip_len))
	pred_hist: Dict[int, Deque[str]] = defaultdict(lambda: deque(maxlen=args.smooth_window))
	action_state: Dict[int, ActionState] = {}

	raw_to_stable: Dict[int, int] = {}
	stable_last_seen: Dict[int, int] = {}
	stable_gallery: Dict[int, Deque[np.ndarray]] = defaultdict(lambda: deque(maxlen=12))
	raw_probe_gallery: Dict[int, Deque[np.ndarray]] = defaultdict(lambda: deque(maxlen=4))
	stable_birth_frame: Dict[int, int] = {}
	next_stable_id = 1
	frame_idx = 0
	event_logger = VideoEventLogger(args.event_log_path, args.event_log_flush_every) if args.event_log_path else None
	async_event_logger = AsyncVideoEventLogger(event_logger) if event_logger is not None else None
	async_db_sink = None
	alert_engine = None

	if args.enable_alerts:
		configured_rules = load_alert_rules(args.alert_rules_path)
		if not configured_rules:
			configured_rules = [
				AlertRule(
					name="default_high_conf_action",
					severity="medium",
					action_labels=None,
					min_action_score=float(args.alert_min_score),
					min_consecutive_hits=int(args.alert_min_consecutive),
					cooldown_frames=int(args.alert_cooldown_frames),
					message_template="High-confidence action '{action_label}' detected for subject {stable_id}.",
				)
			]
		alert_engine = ActionAlertEngine(configured_rules)

	def probe_and_query(raw_id: int, fallback_embedding: np.ndarray) -> Tuple[Deque[np.ndarray], np.ndarray]:
		probe = raw_probe_gallery[raw_id]
		if len(probe) <= 1:
			return probe, fallback_embedding
		query = np.mean(np.stack(list(probe), axis=0), axis=0).astype(np.float32)
		query = query / (np.linalg.norm(query) + 1e-5)
		return probe, query

	def best_reid_candidate(
		query_embedding: np.ndarray,
		active_ids: set,
		reserved_ids: set,
		exclude_sid: int = -1,
	) -> Tuple[int, float, float]:
		best_sid, best_sim, second_best = None, 0.0, 0.0
		for sid, gallery in stable_gallery.items():
			if sid == exclude_sid or sid in active_ids or sid in reserved_ids:
				continue
			if frame_idx - stable_last_seen.get(sid, -10**9) > args.reid_max_gap_frames:
				continue
			sim = embedding_mgr.max_similarity_to_gallery(query_embedding, gallery)
			if sim > best_sim:
				second_best, best_sim, best_sid = best_sim, sim, sid
			elif sim > second_best:
				second_best = sim
		return best_sid, best_sim, second_best

	def merge_stable_state(old_sid: int, new_sid: int) -> None:
		if old_sid in clip_buffers:
			clip_buffers[new_sid].extend(clip_buffers[old_sid])
			clip_buffers.pop(old_sid, None)
		if old_sid in pred_hist:
			pred_hist[new_sid].extend(pred_hist[old_sid])
			pred_hist.pop(old_sid, None)
		if old_sid in action_state and new_sid not in action_state:
			action_state[new_sid] = action_state[old_sid]
		action_state.pop(old_sid, None)
		if old_sid in stable_gallery:
			stable_gallery[new_sid].extend(stable_gallery[old_sid])
			stable_gallery.pop(old_sid, None)
		stable_last_seen.pop(old_sid, None)
		stable_birth_frame.pop(old_sid, None)

	def should_update_identity_memory(stable_id: int, fused_embedding: np.ndarray, det_conf: float, seg_ok: bool) -> bool:
		"""Allow memory updates only for reliable samples to avoid identity contamination."""
		if not seg_ok:
			return False
		if det_conf < args.memory_min_det_conf:
			return False
		fused_sim = embedding_mgr.fused_similarity_to_track(stable_id, fused_embedding)
		if fused_sim < args.memory_min_fused_similarity:
			return False
		return True

	cap = cv2.VideoCapture(args.input)
	if not cap.isOpened():
		raise RuntimeError(f"Could not open input video: {args.input}")

	fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
	frame_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
	frame_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

	if args.save_events_db:
		async_db_sink = AsyncDBEventSink(
			input_path=args.input,
			output_path=args.output,
			fps=float(fps),
			frame_width=frame_w,
			frame_height=frame_h,
			run_name=args.db_run_name,
		)

	writer = cv2.VideoWriter(
		args.output,
		cv2.VideoWriter_fourcc(*"mp4v"),
		fps,
		(frame_w, frame_h),
	)

	while True:
		ok, frame = cap.read()
		if not ok:
			break

		active_stable_ids_this_frame = set()
		frame_person_count = 0

		results = detector.track(
			source=frame,
			persist=True,
			tracker=args.tracker,
			verbose=False,
		)
		boxes = results[0].boxes

		if boxes is not None and boxes.id is not None:
			xyxy = boxes.xyxy.cpu().numpy()
			class_ids = boxes.cls.int().cpu().numpy()
			track_ids = boxes.id.int().cpu().numpy()
			confs = boxes.conf.cpu().numpy()
			action_expand_scale = max(float(args.action_expand_scale), float(args.expand_scale))

			present_raw_ids = {int(tid) for tid in track_ids}
			reserved_stable_ids = {
				raw_to_stable[rid]
				for rid in present_raw_ids
				if rid in raw_to_stable
			}
			stable_owner_this_frame: Dict[int, int] = {}
			action_sample_frame = (frame_idx % args.infer_stride) == 0

			for box, cls_id, track_id, conf in zip(xyxy, class_ids, track_ids, confs):
				raw_track_id = int(track_id)
				obj_label = get_object_label(detector.names, int(cls_id))
				if cls_id != args.person_class_id:
					continue

				frame_person_count += 1

				raw_x1, raw_y1, raw_x2, raw_y2 = map(lambda v: int(round(float(v))), box)
				if raw_x1 > raw_x2:
					raw_x1, raw_x2 = raw_x2, raw_x1
				if raw_y1 > raw_y2:
					raw_y1, raw_y2 = raw_y2, raw_y1
				x1, y1, x2, y2 = expand_box(raw_x1, raw_y1, raw_x2, raw_y2, frame_w, frame_h, args.expand_scale)

				if (x2 - x1) < args.min_box_size or (y2 - y1) < args.min_box_size:
					continue

				if x1 >= x2 or y1 >= y2 or x1 < 0 or y1 < 0 or x2 > frame_w or y2 > frame_h:
					continue

				emb_crop = frame[y1:y2, x1:x2]
				if emb_crop.size == 0 or emb_crop.shape[0] < 10 or emb_crop.shape[1] < 10:
					continue

				action_crop: Optional[np.ndarray] = None
				if action_sample_frame:
					action_x1, action_y1, action_x2, action_y2 = expand_box(
						raw_x1,
						raw_y1,
						raw_x2,
						raw_y2,
						frame_w,
						frame_h,
						action_expand_scale,
					)

					if (action_x2 - action_x1) >= args.min_box_size and (action_y2 - action_y1) >= args.min_box_size:
						if (
							action_x1 < action_x2
							and action_y1 < action_y2
							and action_x1 >= 0
							and action_y1 >= 0
							and action_x2 <= frame_w
							and action_y2 <= frame_h
						):
							action_crop = frame[action_y1:action_y2, action_x1:action_x2]
							if action_crop.size == 0 or action_crop.shape[0] < 10 or action_crop.shape[1] < 10:
								action_crop = None

				mask_bin = None
				mask_ratio = 0.0
				if segmenter is not None:
					emb_crop, mask_bin, mask_ratio = apply_person_segmentation_mask(
						crop_bgr=emb_crop,
						segmenter=segmenter,
						person_class_id=args.person_class_id,
						seg_conf=args.seg_conf,
						mask_threshold=args.seg_mask_threshold,
						min_foreground_ratio=args.seg_min_foreground_ratio,
					)

				if args.visualize_seg_mask and mask_bin is not None:
					region = frame[y1:y2, x1:x2]
					if region.shape[:2] == mask_bin.shape[:2]:
						alpha_map = (mask_bin.astype(np.float32) * args.seg_overlay_alpha)[:, :, None]
						seg_color = np.zeros_like(region, dtype=np.float32)
						seg_color[:, :, 1] = 255.0
						blended = region.astype(np.float32) * (1.0 - alpha_map) + seg_color * alpha_map
						frame[y1:y2, x1:x2] = blended.astype(np.uint8)

				crop_rgb = cv2.cvtColor(emb_crop, cv2.COLOR_BGR2RGB)
				identity_update_ok = (segmenter is None) or (mask_ratio >= args.seg_min_foreground_ratio)

				region_embeddings = embedding_mgr.extract_region_embeddings(crop_rgb)
				_, _, _, _, fused_embedding = region_embeddings
				stable_id_event = "reused"
				reid_best_sim = None
				reid_second_best_sim = None

				if raw_track_id in raw_to_stable:
					stable_id = raw_to_stable[raw_track_id]

					owner = stable_owner_this_frame.get(stable_id)
					if owner is not None and owner != raw_track_id:
						stable_id = next_stable_id
						stable_birth_frame[stable_id] = frame_idx
						next_stable_id += 1
						raw_to_stable[raw_track_id] = stable_id
						stable_id_event = "owner_collision_new"

					probe = raw_probe_gallery[raw_track_id]
					stable_age = frame_idx - stable_birth_frame.get(stable_id, frame_idx)
					if (
						len(probe) >= args.reid_min_probe_frames
						and stable_age <= args.reid_tentative_max_age_frames
						and len(stable_gallery.get(stable_id, [])) <= args.reid_tentative_max_gallery
					):
						_, query_embedding = probe_and_query(raw_track_id, fused_embedding)
						best_sid, best_sim, second_best_sim = best_reid_candidate(
							query_embedding,
							active_stable_ids_this_frame,
							reserved_stable_ids,
							exclude_sid=stable_id,
						)
						reid_best_sim = float(best_sim)
						reid_second_best_sim = float(second_best_sim)

						if (
							best_sid is not None
							and best_sim >= args.reid_reassociate_threshold
							and (best_sim - second_best_sim) >= args.reid_margin_threshold
						):
							old_sid = stable_id
							stable_id = best_sid
							raw_to_stable[raw_track_id] = stable_id
							merge_stable_state(old_sid, stable_id)
							stable_id_event = "late_merge"
				else:
					probe, query_embedding = probe_and_query(raw_track_id, fused_embedding)
					best_sid, best_sim, second_best_sim = best_reid_candidate(
						query_embedding,
						active_stable_ids_this_frame,
						reserved_stable_ids,
					)
					reid_best_sim = float(best_sim)
					reid_second_best_sim = float(second_best_sim)

					match_margin = best_sim - second_best_sim
					if (
						best_sid is not None
						and best_sim >= args.reid_reassociate_threshold
						and match_margin >= args.reid_margin_threshold
						and len(probe) >= args.reid_min_probe_frames
					):
						stable_id = best_sid
						stable_id_event = "reassociated"
					else:
						stable_id = next_stable_id
						stable_birth_frame[stable_id] = frame_idx
						next_stable_id += 1
						stable_id_event = "new"

					raw_to_stable[raw_track_id] = stable_id

				memory_update_ok = should_update_identity_memory(stable_id, fused_embedding, float(conf), identity_update_ok)

				active_stable_ids_this_frame.add(stable_id)
				stable_owner_this_frame[stable_id] = raw_track_id
				if memory_update_ok:
					raw_probe_gallery[raw_track_id].append(fused_embedding)
					stable_last_seen[stable_id] = frame_idx
					stable_gallery[stable_id].append(fused_embedding)

				embedding_mgr.check_embedding_consistency(
					stable_id,
					crop_rgb,
					debug=False,
					region_embeddings=region_embeddings,
				)

				if memory_update_ok:
					embedding_mgr.store_embedding(
						stable_id,
						crop_rgb,
						frame_idx,
						float(conf),
						region_embeddings=region_embeddings,
					)

				if action_crop is not None:
					action_crop = cv2.resize(
						action_crop,
						(args.track_crop_size, args.track_crop_size),
						interpolation=(
							cv2.INTER_LINEAR
							if action_crop.shape[0] >= args.track_crop_size
							else cv2.INTER_CUBIC
						),
					)

					clip_buffers[stable_id].append(action_crop)

				if action_sample_frame and len(clip_buffers[stable_id]) == args.clip_len:
					pred_idx, pred_score = recognizer.infer(list(clip_buffers[stable_id]))
					pred_label = label_map.get(pred_idx, str(pred_idx))
					pred_hist[stable_id].append(pred_label)
					smooth_label = Counter(pred_hist[stable_id]).most_common(1)[0][0]
					action_state[stable_id] = ActionState(label=smooth_label, score=pred_score)

				action_text = "action:pending"
				if stable_id in action_state:
					state = action_state[stable_id]
					action_text = f"action:{state.label} ({state.score:.2f})"
					action_label = state.label
					action_score = float(state.score)
				else:
					action_label = "pending"
					action_score = 0.0

				text = f"ID {stable_id} obj:{obj_label} det:{conf:.2f} | {action_text}"

				event_payload = {
					"frame_idx": frame_idx,
					"timestamp_s": round(frame_idx / max(fps, 1e-6), 3),
					"raw_track_id": raw_track_id,
					"stable_id": int(stable_id),
					"stable_id_event": stable_id_event,
					"object_label": obj_label,
					"det_conf": round(float(conf), 4),
					"bbox_xyxy": [int(x1), int(y1), int(x2), int(y2)],
					"mask_ratio": round(float(mask_ratio), 4),
					"identity_update_ok": bool(identity_update_ok),
					"memory_update_ok": bool(memory_update_ok),
					"action_label": action_label,
					"action_score": round(float(action_score), 4),
					"reid_best_sim": None if reid_best_sim is None else round(float(reid_best_sim), 4),
					"reid_second_best_sim": None if reid_second_best_sim is None else round(float(reid_second_best_sim), 4),
				}

				if async_event_logger is not None:
					async_event_logger.log_track(event_payload)
				if async_db_sink is not None:
					async_db_sink.add_track_event(event_payload)

				if alert_engine is not None and alert_engine.has_rules:
					generated_alerts = alert_engine.process_track_event(event_payload)
					for alert in generated_alerts:
						alert_payload = {
							"rule_name": alert.rule_name,
							"severity": alert.severity,
							"stable_id": alert.stable_id,
							"action_label": alert.action_label,
							"action_score": round(float(alert.action_score), 4),
							"frame_idx": alert.frame_idx,
							"timestamp_s": round(float(alert.timestamp_s), 3),
							"message": alert.message,
							"metadata": alert.metadata,
						}
						if async_event_logger is not None:
							async_event_logger.log_alert(alert_payload)
						if async_db_sink is not None:
							async_db_sink.add_alert(alert_payload)

				cv2.rectangle(frame, (x1, y1), (x2, y2), (30, 220, 30), 2)
				cv2.putText(
					frame,
					text,
					(x1, max(18, y1 - 8)),
					cv2.FONT_HERSHEY_SIMPLEX,
					0.55,
					(30, 220, 30),
					2,
				)

		writer.write(frame)
		if async_event_logger is not None and args.event_log_frames:
			async_event_logger.log_frame(
				frame_idx=frame_idx,
				timestamp_s=frame_idx / max(fps, 1e-6),
				active_track_count=len(active_stable_ids_this_frame),
				tracked_person_count=frame_person_count,
			)
		frame_idx += 1

	cap.release()
	writer.release()
	if async_db_sink is not None:
		async_db_sink.finalize(total_frames=frame_idx)
		print(f"Saved deduplicated events to DB run_id: {async_db_sink.run_id}")
	if async_event_logger is not None:
		async_event_logger.close()
		print(f"Saved event log to: {args.event_log_path}")
	print(f"Saved output to: {args.output}")
