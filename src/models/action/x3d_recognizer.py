import argparse
from pathlib import Path
from typing import Dict, List, Tuple

import cv2
import numpy as np
import torch
import torch.nn.functional as F
from pytorchvideo.models.hub import x3d_l, x3d_m, x3d_s, x3d_xs


class X3DRecognizer:
	def __init__(self, device: str, num_frames: int, side_size: int, crop_size: int, model_name: str):
		self.device = device if torch.cuda.is_available() and device.startswith("cuda") else "cpu"
		self.num_frames = num_frames
		self.side_size = side_size
		self.crop_size = crop_size
		self.model_name = model_name
		self.mean = torch.tensor([0.45, 0.45, 0.45]).view(3, 1, 1, 1)
		self.std = torch.tensor([0.225, 0.225, 0.225]).view(3, 1, 1, 1)

		builders = {
			"x3d_xs": x3d_xs,
			"x3d_s": x3d_s,
			"x3d_m": x3d_m,
			"x3d_l": x3d_l,
		}
		if model_name not in builders:
			raise ValueError(f"Unsupported action model: {model_name}. Choose from: {list(builders.keys())}")

		self.model = builders[model_name](pretrained=True).to(self.device).eval()

	def uniform_temporal_subsample(self, video: torch.Tensor) -> torch.Tensor:
		# video: [C, T, H, W]
		t = video.shape[1]
		if t == self.num_frames:
			return video
		idx = torch.linspace(0, max(t - 1, 0), self.num_frames).long()
		return video[:, idx, :, :]

	def short_side_scale(self, video: torch.Tensor) -> torch.Tensor:
		# video: [C, T, H, W]
		_, _, h, w = video.shape
		if h == 0 or w == 0:
			return video
		if h < w:
			new_h = self.side_size
			new_w = int(w * self.side_size / h)
		else:
			new_w = self.side_size
			new_h = int(h * self.side_size / w)

		# Interpolate expects [N, C, H, W], so treat time as batch.
		video_btchw = video.permute(1, 0, 2, 3)
		video_btchw = F.interpolate(
			video_btchw,
			size=(new_h, new_w),
			mode="bilinear",
			align_corners=False,
		)
		return video_btchw.permute(1, 0, 2, 3)

	@staticmethod
	def center_crop_video(video: torch.Tensor, out_h: int, out_w: int) -> torch.Tensor:
		_, _, h, w = video.shape
		top = max((h - out_h) // 2, 0)
		left = max((w - out_w) // 2, 0)
		return video[:, :, top : top + out_h, left : left + out_w]

	def preprocess(self, frames_bgr: List[np.ndarray]) -> torch.Tensor:
		rgb_frames = [cv2.cvtColor(frame, cv2.COLOR_BGR2RGB) for frame in frames_bgr]
		np_video = np.stack(rgb_frames, axis=0)  # [T, H, W, C]
		tensor_video = torch.from_numpy(np_video).permute(3, 0, 1, 2).float()  # [C, T, H, W]
		tensor_video = self.uniform_temporal_subsample(tensor_video)
		tensor_video = tensor_video / 255.0
		tensor_video = (tensor_video - self.mean) / self.std
		tensor_video = self.short_side_scale(tensor_video)
		tensor_video = self.center_crop_video(tensor_video, self.crop_size, self.crop_size)
		tensor_video = tensor_video.unsqueeze(0)  # [1, C, T, H, W]
		return tensor_video.to(self.device)

	@torch.no_grad()
	def infer(self, frames_bgr: List[np.ndarray]) -> Tuple[int, float]:
		clip = self.preprocess(frames_bgr)
		logits = self.model(clip)
		probs = torch.softmax(logits, dim=1)
		score, class_idx = torch.max(probs, dim=1)
		return int(class_idx.item()), float(score.item())


def load_action_label_map(label_map_path: str, num_classes: int = 400) -> Dict[int, str]:
	default_map = {i: f"class_{i}" for i in range(num_classes)}
	path = Path(label_map_path)
	if not path.is_file():
		print(f"Warning: label map file not found: {label_map_path}. Using class indices.")
		return default_map

	labels = [line.strip() for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]
	if not labels:
		print(f"Warning: label map is empty: {label_map_path}. Using class indices.")
		return default_map

	return {i: labels[i] if i < len(labels) else f"class_{i}" for i in range(num_classes)}


def apply_action_model_presets(args: argparse.Namespace) -> None:
	presets = {
		"x3d_l": {"clip_len": 16, "side_size": 356, "crop_size": 312},
	}
	preset = presets.get(args.action_model)
	if preset is None:
		return

	adjustments: List[str] = []
	for key, min_value in preset.items():
		current_value = getattr(args, key)
		if current_value < min_value:
			setattr(args, key, min_value)
			adjustments.append(f"{key}={min_value}")

	if args.track_crop_size < args.side_size:
		args.track_crop_size = args.side_size
		adjustments.append(f"track_crop_size={args.track_crop_size}")

	if adjustments:
		print(
			"Info: auto-adjusted action input settings for "
			f"{args.action_model}: {', '.join(adjustments)}"
		)
