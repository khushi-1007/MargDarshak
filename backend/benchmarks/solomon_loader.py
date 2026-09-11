import re
from typing import Any, Dict, List


class SolomonParser:
    """
    Parses standard Solomon VRPTW benchmark instances (e.g. C101, R101, RC101).
    Format has vehicle count, capacity, and customer table with:
    CUST NO.  XCOORD.   YCOORD.    DEMAND   READY TIME  DUE DATE   SERVICE TIME
    """

    @staticmethod
    def parse_text(text: str) -> Dict[str, Any]:
        lines = [line.strip() for line in text.strip().split("\n") if line.strip()]
        
        name = lines[0] if lines else "Solomon_Instance"
        num_vehicles = 25
        capacity = 200.0

        # Look for VEHICLE and CAPACITY section
        for i, line in enumerate(lines):
            if "NUMBER" in line and "CAPACITY" in line:
                if i + 1 < len(lines):
                    parts = re.split(r"\s+", lines[i + 1])
                    if len(parts) >= 2:
                        num_vehicles = int(parts[0])
                        capacity = float(parts[1])
                break

        # Look for CUSTOMER section
        customers = []
        cust_start = False
        for line in lines:
            if "CUST NO." in line:
                cust_start = True
                continue
            if cust_start:
                parts = re.split(r"\s+", line)
                if len(parts) >= 7 and parts[0].isdigit():
                    customers.append({
                        "cust_no": int(parts[0]),
                        "x": float(parts[1]),
                        "y": float(parts[2]),
                        "demand": float(parts[3]),
                        "ready_time": float(parts[4]),
                        "due_date": float(parts[5]),
                        "service_time": float(parts[6])
                    })

        return {
            "name": name,
            "num_vehicles": num_vehicles,
            "capacity": capacity,
            "depot": customers[0] if customers else None,
            "customers": customers[1:] if len(customers) > 1 else [],
            "total_customers": len(customers) - 1 if customers else 0
        }
