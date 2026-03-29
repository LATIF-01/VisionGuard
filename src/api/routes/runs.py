from typing import List, Optional
from collections import Counter

from fastapi import APIRouter, Depends, Query, HTTPException, Body
from sqlalchemy.orm import Session

from src.api.schemas import ActionAlertOut, EventSegmentOut, LLMContextResponse, VideoRunOut, MinimalEventSegmentOut
from src.database.models import ActionAlert, EventSegment, VideoRun
from src.llm.llm_service import ask_llm
from src.api.deps import get_db

router = APIRouter(tags=["runs"])


@router.get("/runs", response_model=List[VideoRunOut], tags=["runs"])
def list_runs(limit: int = Query(default=20, ge=1, le=200), db: Session = Depends(get_db)):
    return db.query(VideoRun).order_by(VideoRun.started_at.desc()).limit(limit).all()


@router.get("/runs/{run_id}/segments", response_model=List[EventSegmentOut], tags=["segments"])
def list_segments(
    run_id: str,
    stable_id: Optional[int] = Query(default=None),
    limit: int = Query(default=500, ge=1, le=5000),
    db: Session = Depends(get_db),
):
    q = db.query(EventSegment).filter(EventSegment.run_id == run_id)
    if stable_id is not None:
        q = q.filter(EventSegment.stable_id == stable_id)
    return q.order_by(EventSegment.start_frame.asc()).limit(limit).all()


@router.get("/runs/{run_id}/alerts", response_model=List[ActionAlertOut], tags=["alerts"])
def list_alerts(
    run_id: str,
    stable_id: Optional[int] = Query(default=None),
    severity: Optional[str] = Query(default=None),
    limit: int = Query(default=500, ge=1, le=5000),
    db: Session = Depends(get_db),
):
    q = db.query(ActionAlert).filter(ActionAlert.run_id == run_id)
    if stable_id is not None:
        q = q.filter(ActionAlert.stable_id == stable_id)
    if severity is not None:
        q = q.filter(ActionAlert.severity == severity)
    return q.order_by(ActionAlert.frame_idx.asc()).limit(limit).all()


@router.get("/runs/{run_id}/context", response_model=LLMContextResponse, tags=["context"])
def llm_context(
    run_id: str,
    max_segments: int = Query(default=300, ge=1, le=2000),
    db: Session = Depends(get_db),
):
    run = db.query(VideoRun).filter(VideoRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    segments = (
        db.query(EventSegment)
        .filter(EventSegment.run_id == run_id)
        .order_by(EventSegment.start_timestamp_s.asc())
        .limit(max_segments)
        .all()
    )

    if not segments:
        if run.ended_at is None:
            summary = "No event segments found yet. This run appears active or was interrupted before finalize/commit."
        else:
            summary = "No event segments found for this run."
        compact_segments: List[MinimalEventSegmentOut] = []
    else:
        action_counter = Counter(seg.action_label for seg in segments)
        top_actions = ", ".join(f"{name} ({count})" for name, count in action_counter.most_common(5))
        unique_tracks = len({seg.stable_id for seg in segments})
        duration_s = max(seg.end_timestamp_s for seg in segments)
        summary = (
            f"Run {run_id} contains {len(segments)} segments across {unique_tracks} tracks "
            f"over about {duration_s:.1f}s. Top actions: {top_actions}."
        )
        compact_segments = [
            MinimalEventSegmentOut(
                stable_id=seg.stable_id,
                object_label=seg.object_label,
                action_label=seg.action_label,
                start_timestamp_s=seg.start_timestamp_s,
                end_timestamp_s=seg.end_timestamp_s,
            )
            for seg in segments
        ]

    return LLMContextResponse(run_id=run_id, summary=summary, segments=compact_segments)


@router.post("/runs/{run_id}/llm", tags=["llm"])
def ask_run_llm(
    run_id: str,
    question: str = Body(..., embed=True),
    db: Session = Depends(get_db),
):
    run = db.query(VideoRun).filter(VideoRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    segments = (
        db.query(EventSegment)
        .filter(EventSegment.run_id == run_id)
        .order_by(EventSegment.start_timestamp_s.asc())
        .limit(300)
        .all()
    )

    compact_segments = [
        MinimalEventSegmentOut(
            stable_id=seg.stable_id,
            object_label=seg.object_label,
            action_label=seg.action_label,
            start_timestamp_s=seg.start_timestamp_s,
            end_timestamp_s=seg.end_timestamp_s,
        )
        for seg in segments
    ]

    context = {
        "run_id": run_id,
        "summary": f"Run {run_id} with {len(segments)} segments.",
        "segments": compact_segments,
    }
    answer = ask_llm(context, question)
    return {"answer": answer}