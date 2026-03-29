from src.database.models import ActionAlert, EventSegment, VideoRun  # noqa: F401
from src.database.session import Base, engine


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
