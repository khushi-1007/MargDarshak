import sys
import os

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.seed import seed_database

if __name__ == "__main__":
    print("Seeding MargDarshak Jaipur Demo Fleet & Orders...")
    result = seed_database()
    print("Seed result:", result)
