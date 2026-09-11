from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.logging import logger
from app.services.notifications.broadcaster import broadcaster

router = APIRouter()


@router.websocket("/ws/fleet")
async def fleet_websocket_endpoint(websocket: WebSocket):
    await broadcaster.connect(websocket)
    try:
        # Send initial connected greeting
        await websocket.send_json({
            "type": "CONNECTION_ESTABLISHED",
            "message": "Connected to MargDarshak Real-Time Fleet Stream",
            "active_clients": len(broadcaster.active_connections)
        })
        while True:
            data = await websocket.receive_text()
            # Respond to ping / heartbeat
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        broadcaster.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket client error: {e}")
        broadcaster.disconnect(websocket)
