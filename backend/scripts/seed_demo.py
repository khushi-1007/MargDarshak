import sys
import os

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import asyncio
from app.db.seed import seed_database
from app.db.session import SessionLocal
from app.models.route import Route, RouteStatus
from app.models.optimisation_run import OptimisationTriggerType
from app.services.optimisation.reoptimiser import DynamicReoptimiser

async def main():
    print("Seeding MargDarshak Jaipur Demo Fleet & Orders...")
    result = seed_database()
    print("Seed result:", result)

    db = SessionLocal()
    try:
        route_count = db.query(Route).count()
        if route_count == 0:
            print("Generating initial optimized routes for Jaipur fleet...")
            reoptimiser = DynamicReoptimiser(db)
            opt_res = await reoptimiser.reoptimise_fleet(trigger_type=OptimisationTriggerType.MANUAL)
            routes = opt_res.get("routes", [])
            for r in routes:
                r.status = RouteStatus.IN_PROGRESS
            db.commit()
            print(f"Generated and activated {len(routes)} routes.")
        else:
            print(f"Found {route_count} existing routes.")
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(main())

