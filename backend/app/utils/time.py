from datetime import datetime, time
from typing import Union


def parse_time_to_minutes(val: Union[str, time, int]) -> int:
    """
    Convert a time format to minutes from midnight (0 to 1439).
    Supports: "09:30", "09:30:00", time object, or integer minutes.
    """
    if isinstance(val, int):
        return val
    if isinstance(val, time):
        return val.hour * 60 + val.minute
    if isinstance(val, str):
        parts = val.strip().split(":")
        hour = int(parts[0])
        minute = int(parts[1]) if len(parts) > 1 else 0
        return hour * 60 + minute
    raise ValueError(f"Cannot parse time to minutes: {val}")


def minutes_to_time_str(minutes: int) -> str:
    """Convert minutes from midnight to HH:MM format."""
    norm_mins = minutes % 1440
    hours = norm_mins // 60
    mins = norm_mins % 60
    return f"{hours:02d}:{mins:02d}"


def minutes_to_datetime_today(minutes: int) -> datetime:
    """Return today's datetime with the given minutes from midnight."""
    now = datetime.now()
    norm_mins = minutes % 1440
    hours = norm_mins // 60
    mins = norm_mins % 60
    return now.replace(hour=hours, minute=mins, second=0, microsecond=0)
