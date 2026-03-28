#!/usr/bin/env python3
"""Test X3D-L model directly."""

import sys
sys.path.insert(0, '.')

from main import X3DRecognizer
import numpy as np

# Create dummy frames
frames = [np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8) for _ in range(16)]

# Test X3D-L
print("Testing X3D-L...")
recognizer = X3DRecognizer(
    device="cuda:0",
    num_frames=16,
    side_size=356,
    crop_size=312,
    model_name="x3d_l"
)

try:
    pred_idx, pred_score = recognizer.infer(frames)
    print(f"✓ Success! Action class: {pred_idx}, Confidence: {pred_score:.4f}")
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
