import pytest
from app.services.notifications.broadcaster import broadcaster


def test_websocket_fleet_connection_and_heartbeat(client):
    with client.websocket_connect("/ws/fleet") as websocket:
        init_data = websocket.receive_json()
        assert init_data["type"] == "CONNECTION_ESTABLISHED"
        assert "active_clients" in init_data

        # Heartbeat test
        websocket.send_text("ping")
        resp = websocket.receive_text()
        assert resp == "pong"


@pytest.mark.asyncio
async def test_websocket_broadcast_delivery(client):
    with client.websocket_connect("/ws/fleet") as websocket:
        # Receive greeting
        _ = websocket.receive_json()

        # Broadcast test event
        await broadcaster.broadcast("ROUTE_UPDATED", {
            "optimisation_run_id": "test-run-123",
            "trigger": "TRAFFIC",
            "affected_vehicles": ["V01", "V02"],
            "orders_reassigned": 2,
            "cost_delta": 45.5,
            "distance_delta_km": 3.2
        })

        event_data = websocket.receive_json()
        assert event_data["type"] == "ROUTE_UPDATED"
        assert "timestamp" in event_data
        assert event_data["data"]["optimisation_run_id"] == "test-run-123"
        assert event_data["data"]["trigger"] == "TRAFFIC"
        assert event_data["data"]["cost_delta"] == 45.5
