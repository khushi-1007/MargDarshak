# MargDarshak: Intelligent Dynamic Fleet Optimisation Backend

> **“When reality changes, the route changes with it.”**

MargDarshak is an enterprise-grade fleet-level decision and route optimisation platform backend designed for modern logistics SaaS applications.

Rather than merely calculating the shortest static path between points, MargDarshak continuously generates and re-optimises feasible multi-vehicle delivery plans while enforcing:
- Vehicle capacities (kg)
- Driver shift hours and overtime limits
- Customer delivery time windows
- Priority-weighted drop penalties and SLA protection (CRITICAL > HIGH > NORMAL > LOW)
- Multi-factor cost objective (distance wear, fuel, tolls, overtime, and SLA lateness)
- Cascading operational failures (vehicle breakdowns, consecutive vehicle outages)
- Real-time events (traffic jams, monsoon storms, road closures, emergency orders)
- Non-destructive what-if scenario simulations
- Grounded, zero-hallucination AI decision explanations
- Real-time fleet telemetry broadcasting over WebSockets (`/ws/fleet`)

---

## 1. Core Principles

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   OPTIMIZATION  │  ──> │   AI EXPLAINS   │  ──> │ EVENTS TRIGGER  │  ──> │  DATA MEASURES  │
│     DECIDES     │      │ (Strict Schema) │      │ (Dynamic Re-opt)│      │(Plan vs Actual) │
│ (Google OR-Tools│      │                 │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘      └─────────────────┘
```

1. **OPTIMIZATION DECIDES**: Google OR-Tools solves multi-vehicle CVRPTW with hard capacity, time windows, driver hours, and vehicle eligibility. No LLM is used for mathematical route calculations.
2. **AI EXPLAINS**: The AI Explanation Service receives only verifiable, structured facts (deltas, vehicles, trade-offs) and produces grounded explanations without inventing metrics.
3. **EVENTS TRIGGER**: Real-time traffic, rain, road closures, or breakdowns dynamically trigger re-optimisation and record immutable route versions.
4. **DATA MEASURES**: Live delivery execution records planned vs. actual distance, time, and cost deviations.

---

## 2. Final Folder Structure

```
backend/
├── app/
│   ├── main.py                          # FastAPI app entrypoint, CORS, lifespan, exception handlers
│   ├── config.py                        # Pydantic Settings (DB, JWT, Routing, Weather, AI)
│   │
│   ├── api/
│   │   ├── routes/
│   │   │   ├── auth.py                  # Register, Login, Me (JWT, RBAC)
│   │   │   ├── orders.py                # CRUD, CSV import with validation, status filters
│   │   │   ├── vehicles.py              # CRUD, status transitions, breakdown, restore
│   │   │   ├── drivers.py               # CRUD, work hours, location tracking
│   │   │   ├── routes.py                # Route inspection, stop updates, version history
│   │   │   ├── optimisation.py          # Trigger solver, list runs, get run details
│   │   │   ├── events.py                # Event creation, simulate traffic/weather/breakdown/priority
│   │   │   ├── analytics.py             # Overview, cost, SLA, utilisation, plan-vs-actual
│   │   │   ├── simulation.py            # What-if scenario modeling (cloned state, non-destructive)
│   │   │   ├── notifications.py         # Broadcast & notification feed
│   │   │   ├── ai.py                    # Grounded route decision explanation endpoint
│   │   │   └── benchmarks.py            # Solomon VRPTW & CVRPLIB instance runner
│   │   └── websocket.py                 # /ws/fleet WebSocket connection manager
│   │
│   ├── core/
│   │   ├── security.py                  # Native bcrypt hashing, JWT creation & validation
│   │   ├── exceptions.py                # Custom domain exceptions (NoFeasiblePlan, etc.)
│   │   ├── logging.py                   # Structured logger
│   │   └── dependencies.py              # Auth dependencies, DB session injection, RBAC guards
│   │
│   ├── db/
│   │   ├── base.py                      # SQLAlchemy declarative base
│   │   ├── session.py                   # Engine and sessionmaker (SQLite fallback / PostgreSQL)
│   │   └── seed.py                      # Deterministic Jaipur demo dataset seeder
│   │
│   ├── models/
│   │   ├── user.py                      # User model & Role enum (admin, dispatcher, driver)
│   │   ├── organization.py              # Organization model
│   │   ├── driver.py                    # Driver status, working hours, coordinates
│   │   ├── vehicle.py                   # Vehicle types, capacity, fuel/toll/overtime rates, status
│   │   ├── order.py                     # Priority, time window, weight, status, vehicle requirements
│   │   ├── location.py                  # Geocoded locations/stops
│   │   ├── route.py                     # Planned route metrics (distance, cost, fuel, toll, overtime)
│   │   ├── route_stop.py                # Sequence, planned vs actual arrival/departure
│   │   ├── route_version.py             # Version history for routes (never overwrite)
│   │   ├── event.py                     # Events (traffic, weather, breakdown, closure, priority)
│   │   ├── optimisation_run.py          # Solvers run metadata, triggers, feasibility, objective score
│   │   ├── delivery.py                  # Plan vs actual delivery execution telemetry
│   │   └── simulation.py                # Scenario definitions & outcome snapshots
│   │
│   ├── schemas/
│   │   ├── common.py                    # Standard response wrappers: {"success": true, "data": ..., "meta": ...}
│   │   ├── auth.py                      # Token, UserCreate, UserResponse, Login
│   │   ├── orders.py                    # OrderCreate, OrderUpdate, OrderResponse, CSVImport
│   │   ├── vehicles.py                  # VehicleCreate, VehicleUpdate, VehicleResponse, BreakdownRequest
│   │   ├── drivers.py                   # DriverCreate, DriverUpdate, DriverResponse
│   │   ├── routes.py                    # RouteResponse, RouteStopResponse, RouteVersionResponse
│   │   ├── optimisation.py              # OptimisationRequest, OptimisationResult, SolverMeta
│   │   ├── events.py                    # EventCreate, EventSimulateRequest, EventResponse, ImpactSummary
│   │   ├── analytics.py                 # AnalyticsOverview, CostMetrics, SLAMetrics, UtilisationMetrics
│   │   ├── simulation.py                # ScenarioRequest, ScenarioComparisonResponse
│   │   └── ai.py                        # GroundedExplanationRequest, GroundedExplanationResponse
│   │
│   ├── services/
│   │   ├── optimisation/
│   │   │   ├── solver.py                # OR-Tools VRPTW solver (RoutingIndexManager, RoutingModel)
│   │   │   ├── constraints.py           # Capacity, Time Windows, Driver Hours, Vehicle Eligibility
│   │   │   ├── objective.py             # Distance cost, fuel cost, toll factor, overtime, SLA lateness penalty
│   │   │   └── reoptimiser.py           # Dynamic re-optimisation pipeline & delta comparison
│   │   │
│   │   ├── routing/
│   │   │   ├── provider_base.py         # Abstract RoutingProvider interface
│   │   │   ├── mock_provider.py         # Deterministic mock with realistic Jaipur Haversine + road factors
│   │   │   ├── osrm_provider.py         # OSRM HTTP API provider with mock fallback
│   │   │   └── matrix.py                # Distance & duration matrix service with in-memory caching
│   │   │
│   │   ├── weather/
│   │   │   ├── weather_base.py          # Abstract WeatherProvider
│   │   │   ├── mock_weather.py          # Deterministic weather simulator (Rain/Clear/Storm)
│   │   │   └── openweather_provider.py  # OpenWeatherMap API driver
│   │   │
│   │   ├── traffic/
│   │   │   ├── traffic_base.py          # Abstract TrafficProvider
│   │   │   └── mock_traffic.py          # Segment congestion provider (1.2x - 2.5x duration delay)
│   │   │
│   │   ├── events/
│   │   │   ├── processor.py             # Event intake, routing impact analyzer, state transitioner
│   │   │   ├── impact.py                # Delta calculation (routes changed, cost delta, SLA delta)
│   │   │   └── handlers.py              # Specific event handlers (Breakdown, Traffic, RoadClosure, PriorityOrder)
│   │   │
│   │   ├── simulation/
│   │   │   └── simulator.py             # What-if sandbox (clones state, runs solver, diffs metrics)
│   │   │
│   │   ├── analytics/
│   │   │   └── service.py               # Aggregates KPI metrics, plan vs actual deviations
│   │   │
│   │   ├── ai/
│   │   │   └── explainer.py             # Fact-grounded decision explanation engine (strict schema)
│   │   │
│   │   └── notifications/
│   │       └── broadcaster.py           # Real-time WebSocket event dispatcher
│   │
│   └── utils/
│       ├── geo.py                       # Haversine distance, coordinate validation, bounding boxes
│       └── time.py                      # Time conversions (minutes from midnight, datetime ISO)
│
├── tests/
│   ├── conftest.py                      # In-memory SQLite fixture with StaticPool and client
│   ├── test_auth.py                     # JWT and RBAC tests
│   ├── test_orders.py                   # Order CRUD and CSV import tests
│   ├── test_vehicles.py                 # Vehicle lifecycle and breakdown tests
│   ├── test_solver.py                   # OR-Tools unit tests: capacity, time-windows, penalties, feasibility
│   ├── test_reoptimisation.py           # Dynamic re-optimisation & cascading failures
│   ├── test_simulation.py               # What-if sandbox tests
│   ├── test_analytics.py                # Plan vs actual & KPIs
│   └── test_ai_explainer.py             # Fact-grounded AI explanation tests
│
├── benchmarks/
│   ├── __init__.py
│   ├── solomon_loader.py                # Parser for Solomon VRPTW instances (C101, R101, RC101)
│   └── cvrplib_loader.py                # Parser for CVRPLIB instances
│
├── scripts/
│   ├── seed_demo.py                     # CLI script to seed Jaipur demo fleet & orders
│   └── run_demo_scenario.py             # Automated 17-step hackathon demo flow runner
│
├── alembic/                             # Alembic migrations directory
├── alembic.ini                          # Alembic configuration
├── Dockerfile                           # Production-ready Python container
├── docker-compose.yml                   # Services: backend, postgres (postgis), redis
├── requirements.txt                     # Pinned dependencies
├── .env.example                         # Complete configuration template
└── README.md                            # Documentation
```

---

## 3. Quickstart & Setup Commands

### Prerequisites
- Python 3.11+ or 3.12+
- `pip`
- Docker & Docker Compose (Optional for containerized run)

### Local Environment Setup
```bash
# Clone the repository and navigate to backend
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default `.env` configuration uses SQLite (`sqlite:///./margdarshak.db`), requiring **zero external dependencies** to run locally.

---

## 4. Database Migrations & Seeding

### Initialize / Seed Demo Fleet
MargDarshak features an automated database initializer and Jaipur synthetic fleet generator (5 vehicles, 5 drivers, 20 real-coordinate orders, and pre-configured events):

```bash
python -m scripts.seed_demo
```

### Run Migrations with Alembic (Optional for PostgreSQL)
```bash
alembic upgrade head
```

---

## 5. Running the Backend Server

Start the live ASGI dev server:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Once running:
- **Interactive Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Healthcheck**: [http://localhost:8000/health](http://localhost:8000/health)
- **WebSocket Fleet Stream**: `ws://localhost:8000/ws/fleet`

---

## 6. Running Tests

Run the automated test suite with pytest:
```bash
pytest backend/tests -v
```

All 11 tests execute in an isolated in-memory database with Google OR-Tools CVRPTW validation:
- `test_auth.py`: Password hashing & JWT validation
- `test_orders.py`: Order CRUD & CSV import validation
- `test_vehicles.py`: Vehicle status transitions & breakdown hooks
- `test_solver.py`: OR-Tools capacity & time-window feasibility
- `test_reoptimisation.py`: Dynamic breakdown & cascading failure handling
- `test_simulation.py`: Non-destructive what-if sandbox verification
- `test_analytics.py`: Financial metrics, SLAs, & Plan vs Actual
- `test_ai_explainer.py`: Fact-grounded explanation assertions

---

## 7. Running the 17-Step Hackathon Demo

Execute the complete end-to-end hackathon demo scenario in a single command:
```bash
python -m scripts.run_demo_scenario
```
This runs:
1. Loads 20 Jaipur orders and 5 vehicles.
2. Solves initial fleet routes.
3. Dispatcher activates fleet.
4. Simulates traffic congestion event on JLN Marg -> Dynamic re-optimisation.
5. Simulates V03 engine breakdown -> Reassigns orders to available units.
6. Simulates cascading secondary failure (V04 breakdown) -> Dynamic re-optimisation across surviving fleet.
7. Inserts emergency ICU oxygen delivery order (CRITICAL priority).
8. Runs non-destructive what-if scenario removing V02.
9. Calls Grounded AI Explainer: *“Why was Order ORD-1003 assigned to V04 instead of V02?”*
10. Broadcasts telemetry over WebSocket `/ws/fleet`.

---

## 8. API Endpoints Overview

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Register a new user | Public |
| `POST` | `/api/v1/auth/login` | Authenticate and receive JWT token | Public |
| `GET` | `/api/v1/auth/me` | Current authenticated profile | Authenticated |
| `POST` | `/api/v1/orders` | Create an order with time windows & weight | Dispatcher, Admin |
| `GET` | `/api/v1/orders` | Filter orders (status, priority, vehicle) | Authenticated |
| `POST` | `/api/v1/orders/import` | Bulk import orders from CSV with validation | Dispatcher, Admin |
| `POST` | `/api/v1/vehicles` | Register vehicle with capacity & cost factors | Dispatcher, Admin |
| `GET` | `/api/v1/vehicles` | List fleet vehicles & current status | Authenticated |
| `POST` | `/api/v1/vehicles/{id}/breakdown` | Trigger breakdown, reassign orders, broadcast | Dispatcher, Admin |
| `POST` | `/api/v1/vehicles/{id}/restore` | Restore vehicle to operational status | Dispatcher, Admin |
| `POST` | `/api/v1/optimisation/run` | Run Google OR-Tools multi-vehicle routing | Dispatcher, Admin |
| `GET` | `/api/v1/optimisation/runs/{id}` | Inspect solver runtime, routes, & metadata | Authenticated |
| `GET` | `/api/v1/routes/{id}/versions` | View immutable route history snapshots | Authenticated |
| `PATCH` | `/api/v1/routes/stops/{id}` | Update stop status & record Plan vs Actual telemetry | Authenticated |
| `POST` | `/api/v1/events/simulate` | Simulate traffic, rain, breakdown, or closure | Dispatcher, Admin |
| `POST` | `/api/v1/simulation` | Run non-destructive what-if scenario | Dispatcher, Admin |
| `GET` | `/api/v1/analytics/overview` | Platform KPIs (on-time %, costs, fleet count) | Authenticated |
| `GET` | `/api/v1/analytics/plan-vs-actual` | Distance, ETA, and cost deviation telemetry | Authenticated |
| `POST` | `/api/v1/ai/explain` | Grounded decision explanation from strict facts | Authenticated |
| `POST` | `/api/v1/benchmarks/solomon` | Parse and benchmark standard Solomon VRPTW instance | Authenticated |
| `WS` | `/ws/fleet` | Real-time WebSocket fleet event stream | Public / Client |

---

## 9. Example Requests & Responses

### 1. Trigger Vehicle Breakdown & Re-optimisation
`POST /api/v1/vehicles/{id}/breakdown`
```json
{
  "reason": "Engine overheating near Mansarovar",
  "current_lat": 26.8680,
  "current_lng": 75.7600
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "event_id": "f85e463a-86b2-4d2a-b6bc-6e47f2db890f",
    "trigger": "VEHICLE_BREAKDOWN",
    "routes_changed": 2,
    "orders_reassigned": 4,
    "cost_delta": 180.0,
    "distance_delta_km": 4.2,
    "eta_delta_minutes": 6.0,
    "sla_violations_added": 0,
    "vehicles_affected": ["RJ-14-GC-3003"],
    "mitigation_recommendations": []
  }
}
```

### 2. Query Grounded AI Decision Explanation
`POST /api/v1/ai/explain`
```json
{
  "question": "Why was Order ORD-1003 reassigned to V04?",
  "facts": {
    "trigger": "VEHICLE_BREAKDOWN",
    "vehicle_unavailable": "V03",
    "affected_orders": ["ORD-1003", "ORD-1006"],
    "candidate_vehicles": ["V01", "V04"],
    "selected_vehicle": "V04",
    "selection_reasons": [
      "sufficient_capacity",
      "within_driver_hours",
      "lowest_incremental_cost"
    ],
    "cost_delta": 180.0,
    "distance_delta_km": 4.2,
    "eta_delta_minutes": 6.0,
    "sla_violations_added": 0
  }
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "explanation": "Following the breakdown of vehicle V03, 2 active orders (ORD-1003, ORD-1006) required emergency reassignment. Vehicle V04 was selected among candidates ['V01', 'V04'] due to sufficient remaining payload capacity, compliance with driver shift hours, lowest incremental routing cost. Operational trade-offs: net cost increase of INR 180.00, additional 4.2 km travel, 6.0 min ETA delay, 0 additional SLA violations.",
    "engine": "MargDarshak Deterministic Explainer",
    "confidence": 1.0
  }
}
```

---

## 10. Frontend Integration Guide (Next.js / TypeScript)

### Standard Response Envelope
All REST API responses follow this consistent structure:
```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  meta: Record<string, any>;
  error?: {
    code: string;
    message: string;
    details: Record<string, any>;
  };
}
```

### Real-Time WebSocket Hook (React / Next.js)
```typescript
import { useEffect, useState } from 'react';

export function useFleetStream() {
  const [fleetUpdates, setFleetUpdates] = useState<any[]>([]);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws/fleet');

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('Live Fleet Event:', message);
      // Handles: ROUTE_UPDATED, VEHICLE_BREAKDOWN, DELIVERY_STATUS_CHANGE, etc.
      setFleetUpdates((prev) => [message, ...prev.slice(0, 50)]);
    };

    return () => ws.close();
  }, []);

  return fleetUpdates;
}
```

---

## 11. Docker Deployment

Launch full stack with PostgreSQL (PostGIS) and Redis:
```bash
docker compose up --build
```
This launches:
- `margdarshak_backend`: FastAPI running on port `8000`
- `margdarshak_postgres`: PostGIS 16 on port `5432`
- `margdarshak_redis`: Redis on port `6379`

---

## 12. Known Limitations & Next Steps

### Known Limitations
- Current routing matrices in local mode use Haversine * 1.3 city road factor approximation unless configured with live OSRM (`ROUTING_API_URL`).
- OpenWeatherMap API requires `WEATHER_API_KEY` for live live weather; otherwise utilizes deterministic conditions.

### Recommended Next Implementation Steps
1. Add Celery / RQ background task queue for massive fleet instances (>500 vehicles / 5,000 orders).
2. Wire Mapbox / Leaflet frontend components to visualize route polylines and live driver markers.
3. Integrate live GPS mobile app telemetry for drivers updating stop arrivals in real time.
