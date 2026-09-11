def test_vehicle_lifecycle_and_breakdown(client, auth_headers):
    # 1. Create vehicle
    create_payload = {
        "vehicle_number": "RJ-14-TEST-99",
        "vehicle_type": "LIGHT_COMMERCIAL",
        "capacity_kg": 1500.0,
        "fuel_type": "DIESEL",
        "cost_per_km": 14.0,
        "fuel_cost_per_km": 8.5
    }
    create_resp = client.post("/api/v1/vehicles", json=create_payload, headers=auth_headers)
    assert create_resp.status_code == 200
    v_id = create_resp.json()["data"]["id"]

    # 2. Inspect status
    get_resp = client.get(f"/api/v1/vehicles/{v_id}", headers=auth_headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["data"]["status"] == "AVAILABLE"

    # 3. Trigger breakdown
    bd_resp = client.post(f"/api/v1/vehicles/{v_id}/breakdown", json={"reason": "Alternator failure"}, headers=auth_headers)
    assert bd_resp.status_code == 200
    assert bd_resp.json()["success"] is True

    # Check vehicle is marked BREAKDOWN
    v_check = client.get(f"/api/v1/vehicles/{v_id}", headers=auth_headers).json()["data"]
    assert v_check["status"] == "BREAKDOWN"

    # 4. Restore vehicle
    restore_resp = client.post(f"/api/v1/vehicles/{v_id}/restore", headers=auth_headers)
    assert restore_resp.status_code == 200
    assert restore_resp.json()["data"]["status"] == "AVAILABLE"
