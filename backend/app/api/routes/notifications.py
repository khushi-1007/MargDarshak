from typing import Any, Dict, List
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_roles
from app.db.session import get_db
from app.models.event import Event
from app.models.user import User, UserRole
from app.schemas.common import ApiResponse
from app.services.notifications.broadcaster import broadcaster

router = APIRouter(prefix="/notifications", tags=["Notifications"])


class BroadcastMessageRequest(BaseModel):
    event_type: str
    data: Dict[str, Any]


@router.post("/broadcast", response_model=ApiResponse[dict])
async def broadcast_manual_message(
    req: BroadcastMessageRequest,
    current_user: User = Depends(require_roles(UserRole.DISPATCHER, UserRole.ADMIN))
):
    await broadcaster.broadcast(req.event_type, req.data)
    return ApiResponse.ok({"status": "broadcast_sent", "active_clients": len(broadcaster.active_connections)})


@router.get("/recent", response_model=ApiResponse[List[dict]])
def get_recent_notifications(limit: int = 15, db: Session = Depends(get_db)):
    events = db.query(Event).order_by(Event.created_at.desc()).limit(limit).all()
    out = [
        {
            "id": e.id,
            "type": e.type.value,
            "title": e.title,
            "description": e.description,
            "severity": e.severity.value,
            "created_at": e.created_at
        }
        for e in events
    ]
    return ApiResponse.ok(out)
