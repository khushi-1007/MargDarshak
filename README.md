# MargDarshak

> **When reality changes, the route should change with it.**

**MargDarshak** is an intelligent fleet-level decision and route optimisation platform that continuously re-optimises delivery plans as operational conditions change.

Instead of optimising a single driver's route in isolation, MargDarshak optimises the **entire fleet** while considering real operational constraints such as vehicle capacity, driver hours, delivery time windows, delivery priority, traffic, weather, vehicle breakdowns, operating cost, and SLA impact.

---

## 🚚 What is MargDarshak?

Traditional fleet planning often assumes that the plan created in the morning will remain valid throughout the day.

Reality is different.

A fleet may face:

- Traffic congestion
- Vehicle breakdowns
- Weather disruptions
- Road closures
- New urgent orders
- Driver-hour constraints
- Vehicle capacity limitations
- Tight delivery windows
- Increasing SLA pressure

A static route plan quickly becomes outdated.

MargDarshak continuously closes this loop:

```text
PLAN
  ↓
MONITOR
  ↓
EVENT
  ↓
RE-OPTIMISE
  ↓
EXPLAIN
  ↓
EXECUTE
  ↓
MONITOR AGAIN
````

### Product Principle

> **Optimization decides. AI explains. Events trigger. Data measures.**

---

# 🎯 Problem Statement

**MUJ HACKX 4.0 — PS #2: Intelligent Fleet Route Optimisation**

The challenge is to build a fleet-wide routing system that dynamically adapts multi-stop plans as operational conditions change while balancing:

* Traffic
* Weather
* Delivery priority
* Vehicle capacity
* Driver working hours
* Delivery time windows
* Fuel / operating cost
* Tolls
* Overtime
* SLA impact

MargDarshak addresses this as a **fleet decision problem**, not simply a navigation problem.

---

# 💡 Our Solution

MargDarshak continuously maintains the best feasible fleet plan.

When an operational event occurs:

```text
Traffic / Weather / Breakdown / Critical Order
                    ↓
             Event Handler
                    ↓
          Update Operating State
                    ↓
             Re-optimisation
                    ↓
              Feasibility Check
                    ↓
             Updated Fleet Plan
                    ↓
          WebSocket / Live UI Update
                    ↓
             Dispatcher + Driver
```

The system can determine whether the resulting fleet state is:

* `FEASIBLE`
* `PARTIALLY_FEASIBLE`
* `INFEASIBLE`

This means the system does not hide operational failure. It explicitly communicates when the current fleet cannot serve every order and recommends mitigation.

---

# ⭐ Key Differentiator

MargDarshak is **not another navigation application**.

Navigation systems primarily answer:

> "What is the best route for this vehicle?"

MargDarshak answers:

> **"What should the entire fleet do now, given the current operational constraints?"**

### Our Core Wedge

* Fleet-level optimisation
* Constraint-aware planning
* Event-driven re-planning
* Cascading failure handling
* Priority-aware order insertion
* Explainable optimisation decisions
* Real-time dispatcher control tower
* Driver execution view
* Non-destructive what-if simulation
* Plan-vs-actual analytics

---

# 🧠 Core Architecture

```text
                         ┌─────────────────────────┐
                         │       FRONTEND          │
                         │ Fleet Control Tower     │
                         │ Dispatcher + Driver UI  │
                         └────────────┬────────────┘
                                      │
                               REST + WebSocket
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │        FASTAPI          │
                         │       API Layer         │
                         └────────────┬────────────┘
                                      │
             ┌────────────────────────┼────────────────────────┐
             │                        │                        │
             ▼                        ▼                        ▼
      ┌─────────────┐        ┌──────────────┐        ┌──────────────┐
      │  Database   │        │ Event Engine │        │  Analytics   │
      │ SQLAlchemy  │        │ Reoptimiser  │        │   Services   │
      └─────────────┘        └───────┬──────┘        └──────────────┘
                                     │
                                     ▼
                          ┌──────────────────────┐
                          │     Google OR-Tools  │
                          │      CVRPTW Solver   │
                          └──────────┬───────────┘
                                     │
                          ┌──────────┴──────────┐
                          │                     │
                          ▼                     ▼
                    ┌─────────────┐      ┌──────────────┐
                    │     OSRM    │      │ OpenWeather  │
                    │ Real Routes │      │ Real Weather │
                    └─────────────┘      └──────────────┘
                          │                     │
                          └──────────┬──────────┘
                                     │
                                     ▼
                           RouteDecisionFacts
                                     │
                                     ▼
                            ┌─────────────────┐
                            │    Sarvam AI    │
                            │  AI Explanation │
                            └─────────────────┘

Fallback providers are used only when external services
are unavailable or fail.
```

---

# 🏗️ Technology Stack

## Backend

* Python
* FastAPI
* Uvicorn
* SQLAlchemy 2.x
* SQLite for local/demo persistence
* PostgreSQL-compatible architecture
* Google OR-Tools
* Pydantic
* WebSockets
* HTTPX
* Sarvam AI SDK

## Frontend

* React
* TypeScript
* Vite
* React-Leaflet
* Tailwind CSS

## External Services

* **Sarvam AI** — grounded natural-language explanations
* **OpenWeather** — live weather events/data
* **OSRM** — real road-network routing
* Optional Redis support for future infrastructure/caching needs

---

# ⚙️ How the Optimisation Works

MargDarshak uses a **Capacitated Vehicle Routing Problem with Time Windows (CVRPTW)** approach.

The solver considers:

### Hard / Operational Constraints

* Vehicle capacity
* Delivery time windows
* Driver maximum working hours
* Vehicle availability
* Vehicle eligibility
* Depot start/end constraints

### Objective Factors

The optimisation objective incorporates:

* Distance
* Fuel / operating cost
* Driver wages
* Overtime
* SLA / lateness penalties
* Priority-aware order handling

The system therefore optimises **operational cost and feasibility**, not simply shortest distance.

---

# 🔄 Dynamic Re-optimisation

One of the core features of MargDarshak is continuous re-planning.

### Example

A baseline plan is created:

```text
V01 → 5 orders
V02 → 4 orders
V03 → 5 orders
V04 → 3 orders
V05 → 3 orders
```

Then V03 breaks down.

Instead of manually redispatching orders:

```text
V03 BREAKDOWN
     ↓
Affected orders identified
     ↓
Remaining fleet evaluated
     ↓
OR-Tools re-optimisation
     ↓
Orders reassigned
     ↓
New routes generated
     ↓
WebSocket update
     ↓
Dashboard + Driver update
```

---

# 🚨 Cascading Failure Handling

MargDarshak supports multiple simultaneous fleet disruptions.

Example:

```text
V03 breaks
   ↓
Re-optimise
   ↓
V04 breaks
   ↓
Re-optimise again
```

The system can return:

### FEASIBLE

All required orders can still be served.

### PARTIALLY_FEASIBLE

The remaining fleet cannot serve everything within the constraints.

The system protects important orders and identifies orders requiring mitigation.

Possible recommendations include:

* Deploy backup vehicle
* Use external courier
* Defer lower-priority deliveries

### INFEASIBLE

No valid solution is available under the current constraints.

---

# 🚑 Priority Order Insertion

Urgent orders can arrive after the fleet is already operating.

Example:

```text
New Order
Priority: CRITICAL
Type: ICU Oxygen Cylinder
```

MargDarshak dynamically inserts the order into the fleet plan while considering:

* Priority
* Vehicle capacity
* Delivery window
* Driver hours
* Existing route state
* Additional cost
* SLA impact

The route is then updated in real time.

---

# 🌦️ Real Weather Integration

MargDarshak integrates with **OpenWeather**.

Flow:

```text
OpenWeather
     ↓
Current Weather
     ↓
Weather Event / Impact Assessment
     ↓
Travel-time Impact
     ↓
Re-optimisation
     ↓
Updated Fleet Plan
```

The backend currently exposes a live weather endpoint:

```text
GET /api/v1/events/weather/current
```

The weather integration has a deterministic fallback for external-service failures.

---

# 🗺️ Real Road Routing

MargDarshak uses **OSRM** for real road-network distance and duration data.

Configured through:

```env
ROUTING_API_URL=https://router.project-osrm.org
```

The backend retrieves:

* Road distance
* Travel duration
* Routing matrices
* Route geometry where applicable

These values are then passed into the optimisation engine.

If the external routing service becomes unavailable, the system can fall back to the deterministic routing provider.

---

# 🤖 Explainable AI with Sarvam

The AI layer is intentionally separated from the optimisation engine.

### Important Architectural Rule

> **The LLM never performs optimisation.**

OR-Tools determines:

* Assignments
* Feasibility
* Cost
* Distance
* ETA-related metrics
* Constraint satisfaction

Sarvam AI receives structured `RouteDecisionFacts` and explains the resulting decision.

### Example

```text
Why did the route change?

Vehicle V03 became unavailable because of a breakdown.
Its affected orders were reassigned to the remaining active fleet
based on capacity, driver-hour availability, SLA requirements,
and incremental routing cost.
```

This keeps AI explanations grounded in actual system facts.

---

# 🧩 Deterministic Fallback Architecture

External services are not allowed to become a single point of failure.

Normal path:

```text
Sarvam AI       → Real API
OpenWeather     → Real API
OSRM            → Real API
```

Failure path:

```text
Sarvam failure
       ↓
Deterministic AI explanation

OpenWeather failure
       ↓
Mock weather provider

OSRM failure
       ↓
Mock routing provider
```

Fallbacks are **resilience mechanisms**, not the normal execution path.

---

# 🖥️ Product Interfaces

## 1. Fleet Control Tower

The primary dispatcher dashboard provides:

* Live fleet KPIs
* Vehicle state
* Active orders
* Interactive map
* Route visualization
* Event stream
* AI insights
* Route change information
* Analytics
* Re-optimisation controls

---

## 2. Live Operations Map

The control tower displays:

* Vehicle positions
* Depot
* Delivery stops
* Route polylines
* Disruption markers
* Route changes
* Current fleet state

The map is powered by real backend state.

---

## 3. Driver Console

The driver view provides:

* Assigned vehicle
* Assigned stops
* Delivery sequence
* Current stop
* ETA
* Navigation
* Delivery status
* Delivery confirmation
* Issue reporting
* Dispatcher communication

The driver interface is connected to the same backend state used by the dispatcher.

---

## 4. What-If Simulation

The what-if engine creates a **non-destructive simulation**.

Example:

```text
What if Vehicle V02 becomes unavailable?
```

The backend:

1. Clones the current state
2. Applies the scenario
3. Runs optimisation
4. Compares baseline vs scenario
5. Returns deltas
6. Leaves production state unchanged

The frontend displays:

* Plan A
* Plan B
* Cost delta
* Distance delta
* SLA delta
* Unassigned orders
* Recommended mitigation

---

# 🔌 API Configuration

Create a local `.env` file in the backend.

Example:

```env
DATABASE_URL=sqlite:///./margdarshak.db

JWT_SECRET=your_generated_secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

ENVIRONMENT=development
DEBUG=True

SARVAM_API_KEY=your_sarvam_key
SARVAM_MODEL=sarvam-105b-conversations

WEATHER_API_KEY=your_openweather_key

ROUTING_API_URL=https://router.project-osrm.org

REDIS_URL=

SOLVER_TIME_LIMIT_SECONDS=15
```

### Important

Never commit the real `.env` file.

The repository should contain only a safe `.env.example`.

---

# 🔐 Security

API credentials are intentionally kept server-side.

Never expose these in frontend code:

```text
SARVAM_API_KEY
WEATHER_API_KEY
JWT_SECRET
```

The frontend communicates with the backend, and the backend communicates with the external services.

The repository uses `.gitignore` rules to exclude:

```text
.env
.env.*
*.db
*.sqlite3
__pycache__/
.pytest_cache/
venv/
.venv/
node_modules/
.next/
```

---

# 📁 Project Structure

A simplified structure:

```text
MargDarshak/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   │   ├── optimisation/
│   │   │   ├── routing/
│   │   │   ├── weather/
│   │   │   ├── traffic/
│   │   │   ├── events/
│   │   │   ├── simulation/
│   │   │   ├── analytics/
│   │   │   ├── ai/
│   │   │   └── notifications/
│   │   ├── config.py
│   │   └── main.py
│   │
│   ├── tests/
│   ├── scripts/
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── .gitignore
└── README.md
```

---

# 🚀 Getting Started

## Prerequisites

Install:

* Python 3.11+
* Node.js 18+
* npm

External API credentials:

* Sarvam AI API key
* OpenWeather API key

OSRM can use the configured public endpoint for development/demo usage.

---

# 1. Clone the Repository

```bash
git clone https://github.com/khushi-1007/MargDarshak.git
cd MargDarshak
```

---

# 2. Backend Setup

```bash
cd backend
```

Create a virtual environment:

### Windows

```powershell
python -m venv .venv
.venv\Scripts\activate
```

### Linux / macOS

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create `.env`:

```text
backend/.env
```

Use the configuration shown above.

---

# 3. Start Backend

From the `backend` directory:

```bash
uvicorn app.main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

Swagger / OpenAPI:

```text
http://127.0.0.1:8000/docs
```

Health check:

```text
http://127.0.0.1:8000/health
```

---

# 4. Frontend Setup

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

The frontend should communicate with the backend rather than external services directly.

---

# 🧪 Testing

## Backend

Run the complete backend test suite:

```bash
pytest tests -v
```

### Current verified result

```text
52 passed
0 failed
0 skipped
```

The suite covers areas including:

* AI explanation
* Authentication
* RBAC
* Analytics
* Benchmark parsing
* Solver scalability
* Capacity constraints
* Driver hours
* Priority protection
* Orders
* Providers and fallbacks
* Re-optimisation
* Security
* Simulation
* WebSockets
* Vehicle lifecycle

---

# 🌐 Frontend Build Verification

Build the frontend:

```bash
npm run build
```

The latest full-system verification completed the frontend build successfully with zero TypeScript/build errors.

---

# 🔄 End-to-End Demo Flow

The complete verified demo flow is:

```text
1. Login
2. Open Fleet Control Tower
3. Load active fleet
4. Load orders
5. View live map
6. Fetch live weather
7. Run initial optimisation
8. Display routes
9. Trigger traffic disruption
10. Observe automatic re-optimisation
11. Break Vehicle V03
12. Observe order reassignment
13. Break Vehicle V04
14. Observe PARTIALLY_FEASIBLE state
15. Add critical ICU oxygen order
16. Observe priority insertion
17. Ask why the route changed
18. Receive Sarvam AI explanation
19. Open What-If simulation
20. Simulate a vehicle/road disruption
21. Verify production state remains unchanged
22. Open Driver Console
23. Confirm driver route updates
24. Mark delivery complete
25. Observe WebSocket state synchronization
```

---

# 📡 WebSocket

Fleet updates are delivered through:

```text
/ws/fleet
```

The WebSocket layer supports live events such as:

* Connection handshake
* Event creation
* Optimisation completion
* Route updates
* Fleet state changes
* Driver updates

The frontend automatically processes real-time updates and reconnects when needed.

---

# 📊 Analytics

MargDarshak can measure:

* Total distance
* Total operating cost
* Delivery cost
* SLA compliance
* On-time delivery
* Late deliveries
* Vehicle utilisation
* Driver hours
* Route changes
* ETA deviation
* Operational events

The analytics layer is database-backed rather than based on static frontend values.

---

# 🧪 Demo / Seed Data

The hackathon demo uses a synthetic Jaipur operational environment.

Examples include:

* Jaipur depot
* V01–V05 demo vehicles
* Synthetic delivery orders
* Jaipur locations such as:

  * Malviya Nagar
  * C-Scheme
  * Tonk Road
  * Sitapura
  * Vaishali Nagar
  * Mansarovar
  * Raja Park

This synthetic data is used for reproducible demonstrations and testing.

It is **not presented as proprietary customer data**.

---

# 📈 Performance

The verified optimisation benchmark includes:

| Orders | Vehicles | Result   |
| -----: | -------: | -------- |
|     10 |        3 | Feasible |
|     20 |        5 | Feasible |
|     50 |       10 | Feasible |
|    100 |       20 | Feasible |

Actual runtime varies depending on:

* Network latency
* Routing provider response
* Scenario complexity
* Solver time limits
* System hardware

---

# 🛡️ Resilience

MargDarshak is designed to degrade gracefully.

### If Sarvam fails

```text
Sarvam unavailable
       ↓
Deterministic explainer
       ↓
Operational system remains available
```

### If OpenWeather fails

```text
OpenWeather unavailable
       ↓
Mock Weather Provider
       ↓
Event system remains operational
```

### If OSRM fails

```text
OSRM unavailable
       ↓
Mock Routing Provider
       ↓
Optimisation remains available
```

This ensures external APIs are not a single point of failure.

---

# 💼 Target Customers

MargDarshak is designed for organisations operating delivery or service fleets.

Potential customers include:

* Regional fleet operators
* 3PL providers
* E-commerce logistics
* D2C delivery fleets
* FMCG distribution
* Pharmaceutical logistics
* Cold-chain operations
* Field-service organisations

A natural initial focus is fleets where operational disruptions directly create cost and SLA pressure.

---

# 💰 Business Model

A subscription model is envisioned around:

> **Per active vehicle / month**

### Starter

For small fleets:

* Basic planning
* Fleet dashboard

### Growth

For regional fleet operators:

* Dynamic re-optimisation
* What-if simulation
* AI explanations
* Operational analytics

### Enterprise

For larger operators:

* TMS / ERP integrations
* Telematics
* Custom workflows
* Advanced enterprise deployment

---

# 📈 Go-To-Market

A simple adoption path:

```text
1. Free route audit
          ↓
2. Compare customer plan vs MargDarshak
          ↓
3. Demonstrate measurable operational improvement
          ↓
4. Convert to subscription
```

The core value metric is:

> **Cost-to-Serve per Delivery while meeting the promised SLA**

---

# 🎯 Impact

### Without MargDarshak

* Manual dispatcher calls
* Guesswork during breakdowns
* Static morning plans
* Opaque route changes
* Missed SLAs
* Unplanned overtime
* Inefficient fleet utilisation

### With MargDarshak

* Automated fleet re-optimisation
* Instant order redistribution
* Constraint-aware allocation
* Priority protection
* Explainable decisions
* Real-time dispatcher visibility
* Driver synchronisation
* Continuous adaptation

---

# 🆚 Positioning

MargDarshak acknowledges that route optimisation is not a new problem.

The differentiation is in **how the fleet responds when the world changes**.

| Alternative               | Typical Gap                             | MargDarshak                       |
| ------------------------- | --------------------------------------- | --------------------------------- |
| Navigation tools          | Limited fleet decision logic            | Fleet-level optimisation          |
| Spreadsheets              | Manual / static                         | Event-driven re-planning          |
| Enterprise TMS            | Can be complex/heavy for smaller fleets | Focused operational control tower |
| Single-route optimisation | Vehicle-centric                         | Entire fleet optimisation         |

MargDarshak is not trying to replace every logistics platform.

Its core wedge is:

> **Continuous fleet-level decision-making under changing operational constraints.**

---

# 🔬 Explainability Principle

A major architectural principle is:

```text
OR-Tools
   ↓
Authoritative decision
   ↓
Structured RouteDecisionFacts
   ↓
Sarvam AI
   ↓
Human-readable explanation
```

This prevents the LLM from becoming the source of truth for operational decisions.

The AI explains what the optimisation engine already decided.

---

# 🔒 Security Principles

* API secrets remain server-side
* `.env` excluded from Git
* JWT signing secrets remain backend-only
* API keys are never sent to the frontend
* Authentication and RBAC protect sensitive endpoints
* Error logs sanitize sensitive credentials
* Frontend uses backend API contracts
* What-if simulations are isolated from production state

---

# 🧭 Future Roadmap

Potential future improvements include:

### Phase 1

* Production-grade routing provider
* Vehicle telematics integration
* Real GPS tracking
* Better historical analytics

### Phase 2

* Predictive ETA
* Demand forecasting
* Driver behaviour analytics
* Automated capacity planning

### Phase 3

* Multi-depot optimisation
* Cross-region fleet coordination
* TMS / ERP integrations
* Advanced enterprise integrations
* Predictive disruption handling

---

# ⚠️ Current Limitations

### Public OSRM Endpoint

The current development setup uses:

```text
https://router.project-osrm.org
```

This is suitable for development/demo use but is a shared public routing service.

For production deployment, a managed or self-hosted routing infrastructure should be used.

### Sarvam Quota

Live AI explanations require:

* Valid Sarvam credentials
* Available API quota
* Network connectivity

A deterministic fallback protects the operational workflow when Sarvam is unavailable.

### Synthetic Demo Data

The hackathon environment uses synthetic Jaipur fleet/order data for reproducibility.

Production deployments would connect to customer operational data sources.

---

# ✅ Current Verification Status

The latest full-system QA verified:

```text
Backend startup             ✅
Frontend startup            ✅
Frontend build              ✅
52/52 backend tests         ✅
Integration suites          ✅
22/22 browser demo steps    ✅
Sarvam live API             ✅
OpenWeather live API        ✅
OSRM live API               ✅
OR-Tools optimisation       ✅
Database persistence        ✅
WebSockets                  ✅
Authentication              ✅
RBAC                        ✅
What-if isolation           ✅
Driver console              ✅
Live map                    ✅
No frontend hardcoding      ✅
No API secrets in frontend  ✅
```

---

# 👥 Team

**Team:** Kasukabe Defence Group
**Team ID:** 014
**Hackathon:** MUJ HACKX 4.0
**Problem Statement:** PS #2 — Intelligent Fleet Route Optimisation

---

# 📚 References

* Google OR-Tools Vehicle Routing Problem
* IBEF India Logistics market research
* Locus
* FarEye
* Shipsy

---

# 🏁 Final Message

> **We don't just optimise routes.**
>
> **We optimise how the entire fleet responds when reality changes.**
>
> **When reality changes, the route should change with it.**

---

## License

This project is currently intended as a hackathon / prototype implementation.

Add an explicit open-source license before distributing the project publicly if required.

```
```
