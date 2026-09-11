import re
from typing import Any, Dict, List


class CVRPLIBParser:
    """
    Parses standard CVRPLIB instance formats (.vrp / TSPLIB-style).
    Extracts NODE_COORD_SECTION, DEMAND_SECTION, DEPOT_SECTION, CAPACITY.
    """

    @staticmethod
    def parse_text(text: str) -> Dict[str, Any]:
        lines = [l.strip() for l in text.strip().split("\n") if l.strip()]
        
        name = "CVRPLIB_Instance"
        capacity = 100.0
        coords = {}
        demands = {}
        depot = 1

        mode = None
        for line in lines:
            if line.startswith("NAME"):
                name = line.split(":")[-1].strip()
            elif line.startswith("CAPACITY"):
                capacity = float(line.split(":")[-1].strip())
            elif line.startswith("NODE_COORD_SECTION"):
                mode = "COORDS"
                continue
            elif line.startswith("DEMAND_SECTION"):
                mode = "DEMANDS"
                continue
            elif line.startswith("DEPOT_SECTION"):
                mode = "DEPOT"
                continue
            elif line.startswith("EOF"):
                break
            
            if mode == "COORDS":
                parts = re.split(r"\s+", line)
                if len(parts) >= 3 and parts[0].isdigit():
                    coords[int(parts[0])] = (float(parts[1]), float(parts[2]))
            elif mode == "DEMANDS":
                parts = re.split(r"\s+", line)
                if len(parts) >= 2 and parts[0].isdigit():
                    demands[int(parts[0])] = float(parts[1])
            elif mode == "DEPOT":
                val = int(line.strip())
                if val > 0:
                    depot = val

        nodes = []
        for nid, (x, y) in coords.items():
            nodes.append({
                "id": nid,
                "x": x,
                "y": y,
                "demand": demands.get(nid, 0.0),
                "is_depot": (nid == depot)
            })

        return {
            "name": name,
            "capacity": capacity,
            "depot_id": depot,
            "nodes": nodes,
            "num_nodes": len(nodes)
        }
