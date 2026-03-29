from __future__ import annotations

import os
from typing import Any

import requests

from src.llm.llm_service import ask_llm

API_BASE_URL = os.getenv("VISIONGUARD_API_BASE", "http://127.0.0.1:8000")


def api_get(path: str, timeout: float = 20.0) -> Any:
    url = f"{API_BASE_URL.rstrip('/')}/{path.lstrip('/')}"
    response = requests.get(url, timeout=timeout)
    response.raise_for_status()
    return response.json()


def list_runs() -> list[dict[str, Any]]:
    return api_get("/runs")


def fetch_context(run_id: str, max_segments: int = 300) -> dict[str, Any]:
    return api_get(f"/runs/{run_id}/context?max_segments={int(max_segments)}")


def choose_run_id() -> str:
    runs = list_runs()
    if not runs:
        raise RuntimeError("No runs found. Process a video with --save-events-db first.")

    print("Available runs:")
    for idx, run in enumerate(runs, start=1):
        print(
            f"  {idx}. id={run.get('id')} run_name={run.get('run_name')} "
            f"started_at={run.get('started_at')} ended_at={run.get('ended_at')}"
        )

    while True:
        raw = input("Select run number or paste run_id: ").strip()
        if not raw:
            continue

        if raw.isdigit():
            pos = int(raw)
            if 1 <= pos <= len(runs):
                return str(runs[pos - 1]["id"])
            print("Invalid number. Try again.")
            continue

        return raw


def chat_loop() -> None:
    print("VisionGuard Local Chat (Ollama)")
    print(f"API base: {API_BASE_URL}")
    print("Type /exit to quit, /reload to refresh context.")

    try:
        run_id = choose_run_id()
    except Exception as exc:  # noqa: BLE001
        print(f"Failed to load runs from API: {exc}")
        print("Make sure the FastAPI server is running at VISIONGUARD_API_BASE.")
        return
    max_segments = 300
    context = fetch_context(run_id, max_segments=max_segments)
    print("\nContext loaded:")
    print(f"  run_id: {context.get('run_id')}")
    print(f"  summary: {context.get('summary')}")
    print(f"  segments: {len(context.get('segments', []))}\n")

    while True:
        question = input("you> ").strip()
        if not question:
            continue
        if question.lower() in {"/exit", "exit", "quit"}:
            print("bye")
            return
        if question.lower().startswith("/reload"):
            context = fetch_context(run_id, max_segments=max_segments)
            print("Context reloaded.")
            print(f"  summary: {context.get('summary')}")
            print(f"  segments: {len(context.get('segments', []))}")
            continue

        try:
            answer = ask_llm(context=context, question=question)
        except Exception as exc:  # noqa: BLE001
            print(f"assistant> error: {exc}")
            continue

        print(f"assistant> {answer}\n")


if __name__ == "__main__":
    chat_loop()
