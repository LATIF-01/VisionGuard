import argparse

from src.models.action.x3d_recognizer import X3DRecognizer
from src.pipeline.video_action_pipeline import run

def parse_args() -> argparse.Namespace:
	parser = argparse.ArgumentParser(description="YOLO tracking + X3D action recognition")
	parser.add_argument("--input", required=True, help="Input video path")
	parser.add_argument("--output", default="output_actions.mp4", help="Output video path")
	parser.add_argument("--yolo-weights", default="yolov8n.pt", help="YOLO model weights")
	parser.add_argument("--enable-segmentation", action="store_true", help="Enable person segmentation masking for embeddings")
	parser.add_argument("--seg-weights", default="yolov8n-seg.pt", help="Segmentation model weights")
	parser.add_argument("--seg-conf", type=float, default=0.25, help="Segmentation confidence threshold")
	parser.add_argument("--seg-mask-threshold", type=float, default=0.5, help="Mask binarization threshold")
	parser.add_argument("--seg-min-foreground-ratio", type=float, default=0.15, help="Minimum foreground ratio to trust segmented embeddings")
	parser.add_argument("--visualize-seg-mask", action="store_true", help="Overlay segmentation mask on output video")
	parser.add_argument("--seg-overlay-alpha", type=float, default=0.35, help="Overlay alpha for segmentation mask visualization")
	parser.add_argument(
		"--action-model",
		default="x3d_l",
		choices=["x3d_xs", "x3d_s", "x3d_m", "x3d_l"],
		help="Action model: x3d_xs (fastest) to x3d_l (most accurate). All from Kinetics-400.",
	)
	parser.add_argument(
		"--action-label-map",
		default="config/kinetics_400_labels.txt",
		help="Path to action class labels (one label per line)",
	)
	parser.add_argument(
		"--tracker",
		default="config/botsort_occlusion.yaml",
		help="YOLO tracker config. Options: botsort_occlusion.yaml (balanced) or botsort_best_quality.yaml (strongest IDs)",
	)
	parser.add_argument("--device", default="cuda:0", help="Device: cuda:0 or cpu")

	parser.add_argument("--person-class-id", type=int, default=0, help="YOLO person class id")
	parser.add_argument("--clip-len", type=int, default=16, help="Frames per action clip")
	parser.add_argument("--infer-stride", type=int, default=4, help="Run action every N frames")
	parser.add_argument("--smooth-window", type=int, default=8, help="Prediction smoothing window")
	parser.add_argument("--expand-scale", type=float, default=1.2, help="BBox expansion scale")
	parser.add_argument("--min-box-size", type=int, default=12, help="Skip tiny tracks")
	parser.add_argument("--reid-reassociate-threshold", type=float, default=0.75, help="Similarity threshold to map new raw IDs to old stable IDs")
	parser.add_argument("--reid-max-gap-frames", type=int, default=300, help="Max frame gap for stable ID reassociation")
	parser.add_argument("--reid-margin-threshold", type=float, default=0.08, help="Minimum best-vs-second-best similarity margin for reassociation")
	parser.add_argument("--reid-min-probe-frames", type=int, default=2, help="Minimum observations of a new raw track before reassociation")
	parser.add_argument("--reid-tentative-max-age-frames", type=int, default=120, help="Max age of a new stable ID that is still eligible for late merge")
	parser.add_argument("--reid-tentative-max-gallery", type=int, default=4, help="Max gallery size for a stable ID to still be treated as tentative")
	parser.add_argument("--memory-min-fused-similarity", type=float, default=0.55, help="Minimum fused similarity to allow embedding memory update")
	parser.add_argument("--memory-min-det-conf", type=float, default=0.25, help="Minimum detection confidence to allow embedding memory update")

	parser.add_argument("--side-size", type=int, default=256, help="Short side resize for X3D")
	parser.add_argument("--crop-size", type=int, default=224, help="Center crop size for X3D")
	parser.add_argument(
		"--event-log-path",
		default="",
		help="Optional path to write JSONL runtime events (one event per line)",
	)
	parser.add_argument(
		"--event-log-flush-every",
		type=int,
		default=100,
		help="Flush event log file every N events",
	)
	parser.add_argument(
		"--event-log-frames",
		action="store_true",
		help="Also log per-frame summary events (in addition to per-track events)",
	)
	parser.add_argument(
		"--save-events-db",
		action="store_true",
		help="Persist deduplicated track events into PostgreSQL",
	)
	parser.add_argument(
		"--db-run-name",
		default="",
		help="Optional human-readable name for the DB run",
	)
	parser.add_argument(
		"--track-crop-size",
		type=int,
		default=256,
		help="Resize each tracked person crop to a fixed size before buffering",
	)
	parser.add_argument(
		"--enable-alerts",
		action="store_true",
		help="Enable action-based alert generation",
	)
	parser.add_argument(
		"--alert-rules-path",
		default="config/alert_rules.json",
		help="Path to JSON alert rules",
	)
	parser.add_argument(
		"--alert-min-score",
		type=float,
		default=0.7,
		help="Fallback minimum action score for generated default alert rule",
	)
	parser.add_argument(
		"--alert-min-consecutive",
		type=int,
		default=3,
		help="Fallback consecutive hits required for generated default alert rule",
	)
	parser.add_argument(
		"--alert-cooldown-frames",
		type=int,
		default=60,
		help="Fallback cooldown for generated default alert rule",
	)
	return parser.parse_args()


if __name__ == "__main__":
	run(parse_args())