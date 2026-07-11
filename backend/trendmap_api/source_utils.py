from datetime import datetime


def normalize_source_url(value):
    return (value or "").strip().rstrip("/").lower()


def preferred_source(sources):
    return sorted(
        sources,
        key=lambda source: (
            1 if getattr(source, "status", None) == "approved" else 0,
            getattr(source, "updated_at", None) or getattr(source, "created_at", None) or datetime.min,
            str(source.id),
        ),
        reverse=True,
    )[0]
