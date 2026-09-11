# MargDarshak
### Intelligent Dynamic Fleet Optimisation

**"When reality changes, the route changes with it."**

MargDarshak is a dynamic fleet decision engine built for **MUJ HACKX 4.0 — Logistics PS #2: Intelligent Fleet Route Optimisation**. It continuously re-optimises a fleet's delivery plan as real-world conditions — traffic, weather, breakdowns, and urgent orders — change during execution, instead of producing a single static route and hoping the world cooperates.

> **Optimization decides. AI explains. Events trigger. Data measures.**

---

## Table of Contents

- [Overview](#overview)
- [The Problem](#the-problem)
- [Our Solution](#our-solution)
- [Core Workflow](#core-workflow)
- [Dynamic Re-optimisation & Cascading Failure Handling](#dynamic-re-optimisation--cascading-failure-handling)
- [Event & Weather/Traffic Integration](#event--weathertraffic-integration)
- [Route Versioning](#route-versioning)
- [Application Modules](#application-modules)
- [Screens](#screens)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Optimisation Engine](#optimisation-engine)
- [AI Layer](#ai-layer)
- [Database Entities](#database-entities)
- [Dataset Strategy](#dataset-strategy)
- [Target Users & Market](#target-users--market)
- [USP & Competitive Positioning](#usp--competitive-positioning)
- [Business Model & Value](#business-model--value)
- [KPIs & Evaluation](#kpis--evaluation)
- [Demo Scenario](#demo-scenario)
- [36-Hour MVP Scope](#36-hour-mvp-scope)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Limitations](#limitations)
- [Roadmap](#roadmap)
- [Judge Questions & Answers](#judge-questions--answers)
- [Team](#team)
- [License](#license)

---

## Overview

Most route planning tools solve a snapshot: given today's orders and today's map, compute a route. MargDarshak treats routing as a **continuous decision process**. The moment an order, a road, a vehicle, or the weather changes, the plan is re-evaluated and — where the numbers justify it — updated, with the dispatcher told exactly why.

MargDarshak is not a maps product and not a full enterprise Transportation Management System (TMS). It is a focused **decision and re-optimisation layer** that sits on top of a fleet's operational data and answers one question, continuously: *given everything we now know, what is the best feasible plan?*

## The Problem

Fleet dispatchers managing multi-vehicle, multi-stop deliveries run into the same failure mode repeatedly:

- Static route plans are built once and go stale within minutes of real-world disruption.
- Manual re-dispatching during an incident is slow and error-prone.
- Vehicle capacity is either underused or silently overloaded.
- An urgent order forces a dispatcher to manually rework an existing schedule.
- Traffic and weather shift ETAs, but the plan doesn't shift with them.
- A single vehicle breakdown can cascade into missed SLAs across several routes.
- Delivery time windows create SLA pressure that isn't reflected in the plan.
- Fuel, toll, and overtime costs are rarely optimised jointly with distance.
- Dispatchers are told a route changed, but not *why*.
- What was planned and what actually happened are never compared, so nothing improves.

## Our Solution

MargDarshak addresses this with four cooperating layers:

1. **A deterministic optimisation core** that generates feasible, cost-aware multi-vehicle routes under real operational constraints (capacity, time windows, driver hours, priority).
2. **An event engine** that ingests traffic, weather, breakdowns, and priority-order signals through a single normalized interface and determines which routes are affected.
3. **A re-optimisation loop** that regenerates the fleet plan when an event materially changes feasibility or cost — including cascading scenarios where a fallback vehicle also becomes unavailable.
4. **An AI explanation layer** that translates the optimiser's decisions into plain-language reasoning for dispatchers, without ever being the thing that computes the route.

This separation is intentional: **the optimiser is deterministic and auditable; the AI is explanatory, not authoritative.**

---

## Core Workflow

```mermaid
flowchart TD
    A[Dispatcher imports orders via CSV/API] --> B[Dispatcher configures fleet: vehicles, drivers, capacity, cost/km]
    B --> C[Geocoding: addresses to coordinates]
    C --> D[Routing layer: distance/time matrix]
    D --> E[Optimisation engine: OR-Tools CVRP/VRPTW]
    E --> F[Feasible multi-vehicle route plan]
    F --> G[Dispatcher control tower: live map, ETA, cost, SLA risk]
    G --> H[Fleet dispatched]
    H --> I{Event occurs?}
    I -- Traffic / Weather / Breakdown / Priority order --> J[Event engine assesses impact]
    J --> K[Affected vehicles & orders identified]
    K --> L[Re-optimisation triggered]
    L --> M[New route version generated]
    M --> N[Driver receives resequencing update]
    N --> O[AI explanation service describes the change]
    I -- No event --> P[Execution continues]
    O --> Q[Delivery status recorded]
    P --> Q
    Q --> R[Plan-vs-actual analytics]
    R --> S[Historical deviations feed future ETA/cost estimates]
```

Orders carry order ID, pickup/delivery location, package weight, priority, delivery time window, and vehicle/load requirements. Vehicles carry type, capacity, cost/km, fuel/energy type, assigned driver, remaining driver hours, and availability status.

## Dynamic Re-optimisation & Cascading Failure Handling

MargDarshak does not assume a single fallback vehicle will always be available. When a vehicle drops out, the system re-optimises using the *current* fleet state — and if the new state also fails, it re-optimises again rather than silently degrading the plan.

**Example progression:**

```
Initial state:
  V1 → A, B, C
  V2 → D, E, F
  V3 → G, H, I

V2 breaks down
  → D, E, F reassigned to V1/V3 if capacity and time windows allow

V3 also becomes unavailable
  → System re-optimises again against the remaining fleet
```

The re-optimisation can resolve to one of three outcomes:

| Outcome | Description |
|---|---|
| **Fully feasible** | All orders can still be served within constraints. |
| **Partially feasible** | High-priority orders are protected; lower-priority orders may be delayed. |
| **No feasible solution** | The system explains why and recommends concrete actions: activate a standby vehicle, request an external carrier, extend a delivery window, split a delivery, or reprioritise orders. |

**MargDarshak never silently violates a hard constraint.** If capacity, time window, or driver-hour limits cannot all be satisfied, the system reports infeasibility explicitly rather than returning a plan that quietly breaks the rules. This behavior is referred to as **Dynamic Operational Resilience**.

## Event & Weather/Traffic Integration

All disruption signals — regardless of source — enter through one normalized event interface, so the optimisation and explanation layers don't need to know where an event came from.

```mermaid
flowchart LR
    A1[Weather API] --> N[Normalized Event Interface]
    A2[Traffic API] --> N
    A3[Fleet Telemetry] --> N
    A4[Dispatcher-Triggered Event] --> N
    A5[Internal Event Simulator] --> N
    N --> B[Event Engine]
    B --> C[Affected Routes Identified]
    C --> D[Travel Time / Risk / Constraint Update]
    D --> E[Re-optimisation]
    E --> F[New Route Version]
```

For the hackathon MVP, weather and traffic are exercised through a **deterministic event simulator** rather than live third-party feeds, which guarantees a reproducible demo. The simulator and any future live Weather/Traffic API integration share the same normalized event interface, so plugging in a real feed later does not require changes to the optimisation or explanation logic.

**MVP:** Simulate Traffic, Simulate Heavy Rain, Simulate Road Closure, Simulate Vehicle Breakdown, Add Priority Order — all deterministic, dispatcher-triggered.
**Planned:** Live weather/traffic API ingestion via the same event interface.
**Future:** Fleet telemetry-driven automatic event detection (e.g. GPS-inferred breakdowns).

## Route Versioning

Routes are never overwritten — each recalculation produces a new, immutable version tied to the event that caused it. This gives auditability, a route-change history, and the data needed for plan-vs-actual analytics.

```
Vehicle V02:
  v1: A → B → C → D                (initial plan)
  v2: A → C → B → D                (event: traffic congestion)
  v3: A → X → C → B → D            (event: priority order inserted)
```

Each version records the triggering event, the affected stops, and the resulting distance/cost/ETA deltas.

## Application Modules

| # | Module | Description | Status |
|---|---|---|---|
| 1 | Authentication & Roles | Dispatcher / Driver / Admin roles | MVP |
| 2 | Fleet Management | Create and manage vehicles and drivers | MVP |
| 3 | Order Management | Upload, import, and validate delivery orders | MVP |
| 4 | Routing & Optimisation | Generate multi-vehicle, constraint-aware plans | MVP |
| 5 | Live Map / Control Tower | Vehicles, routes, stops, and alerts on a map | MVP |
| 6 | Event Engine | Traffic, weather, breakdown, road closure, priority order | MVP |
| 7 | Dynamic Re-optimisation | Regenerate a feasible plan on event impact | MVP |
| 8 | Driver Guidance | Updated route, next stop, ETA | MVP |
| 9 | What-If Simulator | Test hypothetical fleet decisions before committing | Planned (Should-Have) |
| 10 | Analytics | Cost, SLA, utilisation, plan-vs-actual | MVP (basic) / Planned (advanced) |
| 11 | AI Explanation | Plain-language reasoning for routing decisions | Planned (Should-Have) |

## Screens

- **Dashboard** — fleet KPIs, active alerts, order queue, on-time %, current cost.
- **Live Map** — vehicle markers, route polylines, stops, active incidents.
- **Vehicle Panel** — capacity, current load, driver hours, active route, ETA.
- **Route Details** — ordered stops, time windows, distance, cost, route status.
- **Event Center** — traffic, weather, breakdown, priority-order events and resulting route changes.
- **What-If Simulator** *(Planned)* — scenario controls with side-by-side plan comparison.
- **Analytics** *(Planned, advanced)* — planned vs. actual, cost, SLA, utilisation trends.
- **AI Explanation** *(Planned)* — natural-language answers to questions like "Why was V3 selected?"

---

## System Architecture

```mermaid
flowchart TB
    subgraph Frontend
        FE[Next.js + TypeScript + Tailwind + shadcn/ui<br/>MapLibre GL / Leaflet]
    end
    subgraph Backend
        API[FastAPI + Pydantic]
        SVC1[Optimizer Service]
        SVC2[Routing Service]
        SVC3[Event Service]
        SVC4[Analytics Service]
        SVC5[AI Explanation Service]
    end
    subgraph Data
        DB[(PostgreSQL + PostGIS)]
    end
    subgraph External
        OSM[OpenStreetMap]
        OSRM[OSRM / GraphHopper]
        WX[Weather API]
        TR[Traffic API]
        LLM[LLM API]
    end

    FE <--> API
    API --> SVC1
    API --> SVC2
    API --> SVC3
    API --> SVC4
    API --> SVC5
    SVC1 --> DB
    SVC2 --> DB
    SVC3 --> DB
    SVC4 --> DB
    SVC2 --> OSM
    SVC2 --> OSRM
    SVC3 --> WX
    SVC3 --> TR
    SVC5 --> LLM
```

- **Frontend** renders the dashboard, live map, and control-tower views, and communicates with the backend over REST and WebSockets for real-time route updates.
- **Backend** exposes a FastAPI service layer split by responsibility: optimisation, routing/geocoding, event handling, analytics, and AI explanation — kept as separate services so the deterministic core (optimizer, routing) is never entangled with the AI layer.
- **Database** uses PostgreSQL with PostGIS for geospatial queries (nearest-stop lookups, geofencing for event impact).
- **External services** — OpenStreetMap for geographic data, OSRM/GraphHopper for distance/time matrices, and a pluggable Weather/Traffic API behind the normalized event interface.

## Technology Stack

| Layer | Technology | Status |
|---|---|---|
| Frontend | Next.js, TypeScript, Tailwind CSS, shadcn/ui | MVP |
| Map rendering | MapLibre GL JS or Leaflet | MVP |
| Backend | Python, FastAPI, Pydantic | MVP |
| ORM | SQLAlchemy | MVP |
| Database | PostgreSQL, PostGIS | MVP |
| Optimisation | Google OR-Tools | MVP |
| Geographic data | OpenStreetMap | MVP |
| Routing engine | OSRM or GraphHopper | MVP |
| Real-time updates | WebSockets | MVP |
| Caching / pub-sub | Redis | Planned |
| AI / LLM | LLM API for explanations, summaries, dispatcher Q&A | Planned |
| Auth | JWT-based role authentication (Auth.js or custom) | MVP |
| Deployment | Vercel (frontend), Railway/Render/AWS (backend), Supabase/Neon (Postgres) | Planned |
| Testing | Pytest (backend), Vitest (frontend unit), Playwright (E2E) | MVP (Pytest, Vitest) / Planned (Playwright) |

This is the intended engineering stack for the hackathon build; items marked **Planned** are part of the architecture but are not required for the 36-hour MVP to function end-to-end.

## Optimisation Engine

MargDarshak uses **Google OR-Tools** as its optimisation engine rather than building a custom VRP solver from scratch — the goal is a credible, working decision layer, not novel solver research.

**Problem classes targeted:**
- Capacitated Vehicle Routing Problem (CVRP)
- Vehicle Routing Problem with Time Windows (VRPTW)
- Multi-vehicle routing with priority handling

**Optimisation flow:**

```
Current fleet/order state
   → constraint set (capacity, time windows, driver hours, priority)
   → OR-Tools solve
   → feasible route plan
   → [event occurs]
   → impact assessment
   → re-optimisation
   → new route version
```

The engine is tuned to produce **high-quality feasible solutions quickly enough for interactive re-optimisation**. It does not claim globally optimal routes — OR-Tools' metaheuristic solvers return strong feasible solutions within a time budget, and that time/quality trade-off will be documented against the configuration actually used.

## AI Layer

The guiding principle is strict separation of concerns:

> **Optimization decides. AI explains. Events trigger. Data measures.**

The LLM layer is **never** used to compute distance, capacity, ETA, feasibility, vehicle assignment, or cost — those remain fully deterministic, sitting in the optimiser and routing services. The AI layer is scoped to:

- Explaining why a route changed, in plain language, grounded in the actual route-version diff and triggering event.
- Summarising fleet status for a dispatcher.
- Answering dispatcher questions such as "Why was V3 selected?" by reading from route/event data rather than generating figures independently.

| Capability | Status |
|---|---|
| Route-change explanation from route-version diffs | Planned |
| Fleet summary generation | Planned |
| Dispatcher Q&A over route/event data | Planned |
| Predictive ETA intelligence | Future |

## Database Entities

| Entity | Key Fields |
|---|---|
| `users` | id, name, role (dispatcher/driver/admin), credentials |
| `drivers` | id, name, license info, remaining hours, assigned vehicle |
| `vehicles` | id, vehicle number, type, capacity, cost/km, fuel/energy type, driver_id, status, current_location |
| `orders` | id, customer, pickup coordinates, drop coordinates, weight, priority, time window, status |
| `locations` | id, address, latitude, longitude |
| `routes` | id, vehicle_id, optimisation_run_id, distance, duration, cost, status, created_at |
| `route_stops` | id, route_id, order_id, sequence, eta |
| `route_versions` | id, route_id, version_number, triggering_event_id, created_at |
| `events` | id, type (traffic/weather/breakdown/priority/closure), affected_area, payload, created_at |
| `traffic_events` | id, event_id, affected_road_segment, delay_estimate |
| `optimisation_runs` | id, triggered_by, input_snapshot, output_route_ids, runtime, created_at |
| `deliveries` | id, order_id, route_stop_id, actual_arrival, status |

---

## Dataset Strategy

MargDarshak's prototype uses a deliberate hybrid data strategy rather than relying on a single dataset, since commercial fleet/delivery telemetry is generally proprietary and not available for a hackathon build.

1. **Synthetic operational data** — orders, fleet, drivers, capacities, costs, priorities, time windows, breakdowns, and traffic/weather scenarios, generated programmatically to exercise the full workflow.
2. **Real geographic data** — OpenStreetMap road and location data for a demo city, **Jaipur**, using representative delivery areas such as Malviya Nagar, Mansarovar, C-Scheme, Vaishali Nagar, Jagatpura, Raja Park, Tonk Road, Sitapura, Vidhyadhar Nagar, and Sodala. These are geographic reference points for realistic routing, not real customers.
3. **Public benchmark datasets** — Solomon VRPTW and CVRPLIB/CVRP benchmarks, used to validate optimisation quality, feasibility rate, and runtime independent of the synthetic demo data.

> The prototype uses controlled synthetic operational scenarios over realistic geographic data because commercial delivery/fleet telemetry is generally proprietary. Algorithmic evaluation is additionally performed using public routing benchmarks.

## Target Users & Market

**Primary users:** fleet managers, dispatchers, logistics operators, 3PL providers, regional fleet operators, SME fleet owners.

**Potential verticals:** e-commerce and last-mile delivery, FMCG distribution, field service, pharma logistics, spare-parts delivery, regional transportation, EV delivery fleets.

**Strongest initial segment for the hackathon MVP:** regional and SME fleet operators managing multiple vehicles and time-sensitive deliveries — a segment large enough to matter but underserved by heavyweight enterprise TMS platforms.

## USP & Competitive Positioning

**Primary USP:**
> Continuous fleet-level re-optimisation under real-world disruptions.

**Secondary differentiators:**
1. Fleet-level rather than single-vehicle optimisation.
2. Constraint-aware routing (capacity, time windows, driver hours, priority).
3. Event-driven re-optimisation, not manual re-dispatch.
4. Cascading failure / resilience handling.
5. Joint cost + SLA optimisation instead of distance-only routing.
6. Explainable routing decisions.
7. What-if scenario simulation.
8. Plan-vs-actual feedback loop.

**Positioning statement:**
> MargDarshak is not just a route planner; it is a dynamic fleet decision engine that adapts the entire delivery plan as operational reality changes.

**On competitors:** the logistics and routing space already includes established players — Locus, FarEye, Shipsy, OptimoRoute, and toolkits like Google OR-Tools itself. MargDarshak does not claim to be more mature or more accurate than these enterprise products. Its differentiation is a focused **event → decision → explanation** loop, demonstrated end-to-end:

```
Traffic spike detected
  → affected route identified
  → alternative plans evaluated
  → new route selected
  → dispatcher sees: why it changed, ETA impact, cost impact, SLA impact
```

MargDarshak is positioned as a focused decision layer and prototype, not a replacement for Google Maps or a full enterprise TMS.

## Business Model & Value

**Illustrative SaaS tiers** (not final pricing):

| Tier | Target | Includes |
|---|---|---|
| Starter | Small fleets | Basic optimisation, basic dashboard, CSV import |
| Growth | Regional fleets | APIs, advanced analytics, what-if simulation, dynamic events |
| Enterprise | Large fleets | TMS/ERP integration, telematics, custom constraints, SSO, private deployment, enterprise support |

**Illustrative pricing models:** per active vehicle/month, per optimisation run, per delivery stop, or a hybrid subscription-plus-usage model. Exact figures are not fixed and would be validated against real customer economics.

**Value delivered:**

- **Cost savings** — fewer kilometres, lower fuel and toll spend, reduced overtime, lower cost per delivery.
- **Service improvement** — fewer late deliveries, better SLA adherence, lower ETA deviation.
- **Asset utilisation** — better vehicle utilisation, reduced idle capacity, fewer empty/inefficient kilometres.
- **Labour efficiency** — fewer manual dispatcher interventions, faster response to disruptions.

## KPIs & Evaluation

**North Star KPI:**
> Cost-to-Serve per Delivery

**Secondary North Star:**
> On-Time Delivery Rate at Minimum Operating Cost

**Supporting KPIs:** total route distance, total operating cost, fuel cost, toll cost, overtime, on-time delivery %, vehicle utilisation, late deliveries, empty kilometres, ETA accuracy, reroute count, dispatcher intervention count.

**Evaluation is layered rather than a single "accuracy" number:**

| Layer | Metrics |
|---|---|
| Optimisation | Feasibility rate, total distance, total cost, runtime, late deliveries, vehicle utilisation, comparison to baseline, benchmark gap on Solomon/CVRPLIB where applicable |
| Event handling | Successful re-routing rate, constraint-violation rate, recovery time, SLA preservation |
| ETA | MAE/MAPE where actual execution data exists; no prediction-accuracy claims otherwise |
| AI explanation | Factual consistency with underlying route data, absence of unsupported claims, correctness of stated reasons |

---

## Demo Scenario

The hackathon demo is built around a single reproducible narrative:

**Starting state:** 4 vehicles, 20 orders, mixed time windows, some priority orders. The optimiser generates an initial plan.

| Step | Event | System Response |
|---|---|---|
| 1 | Traffic congestion on an active route | Affected route identified, plan re-optimised |
| 2 | Vehicle V03 breaks down | Its orders redistributed across remaining fleet |
| 3 | Fallback vehicle V04 also becomes unavailable | System re-optimises again against the new fleet state (cascading failure handling) |
| 4 | An urgent priority order arrives | Inserted into the best feasible route without violating constraints |
| 5 | Dispatcher asks "what if I remove V02?" | What-If Simulator returns cost, SLA, distance, and utilisation impact without committing the change |

This sequence is designed to demonstrate detection, decision, explanation, and resilience within a single, reproducible run.

## 36-Hour MVP Scope

**Must Have**
- Multi-vehicle optimisation (capacity + time windows)
- Cost function combining distance, fuel, and time
- Live map of vehicles and routes
- Dynamic rerouting on event
- Traffic and vehicle-breakdown event simulator
- Priority-order insertion into an active route
- Route version history
- Basic analytics dashboard

**Should Have**
- Cascading failure handling
- What-if simulation
- AI-generated route-change explanations
- Weather as an additional event source

**Nice to Have**
- Live weather API integration
- Live traffic API integration
- AI dispatcher chat interface
- Predictive ETA
- Driver-facing mobile interface

**Explicitly Out of Scope for the Hackathon**
- Custom research-grade VRP solver
- Full enterprise TMS feature set
- Hardware/GPS integration
- Complex ML forecasting
- Unnecessary microservice sprawl
- Blockchain
- Full-scale enterprise authentication/permissions system

---

## Getting Started

> The commands below reflect the intended project setup. Package manifests (`package.json`, `requirements.txt`) will pin exact versions once implementation begins.

### Prerequisites
- Node.js (LTS) and npm
- Python 3.11+
- PostgreSQL with the PostGIS extension
- An OR-Tools-compatible Python environment

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Database
```bash
# PostgreSQL with PostGIS enabled
createdb margdarshak
psql margdarshak -c "CREATE EXTENSION postgis;"
```

## Environment Variables

```env
# Backend
DATABASE_URL=postgresql://user:password@localhost:5432/margdarshak
JWT_SECRET=your-jwt-secret

# AI layer
LLM_API_KEY=your-llm-api-key

# Routing / mapping
ROUTING_API_KEY=your-osrm-or-graphhopper-key   # if using a hosted routing service

# Optional event sources
WEATHER_API_KEY=your-weather-api-key
TRAFFIC_API_KEY=your-traffic-api-key
REDIS_URL=redis://localhost:6379
```

## Project Structure

```
margdarshak/
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── types/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   │   ├── optimizer/
│   │   │   ├── routing/
│   │   │   ├── events/
│   │   │   ├── analytics/
│   │   │   └── ai/
│   │   └── db/
│   └── tests/
├── data/
│   ├── orders.csv
│   ├── vehicles.csv
│   ├── drivers.csv
│   └── scenarios/
├── docs/
└── README.md
```

## Testing

| Layer | Tool | Scope |
|---|---|---|
| Backend | Pytest | Optimiser constraints, event-impact logic, API endpoints |
| Frontend unit | Vitest | Component and utility logic |
| End-to-end | Playwright | Dashboard, live map, and event-simulation flows |

Optimisation quality is additionally validated against public **Solomon VRPTW** and **CVRPLIB** benchmark instances to measure feasibility rate, cost, and runtime independent of the synthetic demo data.

## Limitations

- The MVP demonstrates disruption handling through a deterministic event simulator, not live third-party traffic/weather feeds.
- Routing distance/time data depends on OpenStreetMap coverage and the chosen routing engine's accuracy for the demo region.
- OR-Tools returns strong feasible solutions within a time budget; it does not guarantee a globally optimal route for every instance.
- Demo orders, fleets, and disruption events are synthetic; no real fleet telemetry or customer data is used in the prototype.
- The AI explanation layer, when implemented, is scoped to describing decisions already made by the optimiser — it does not independently verify real-world outcomes.

## Roadmap

**Post-hackathon (Future):**
- Live weather and traffic API integration through the existing normalized event interface
- Fleet telemetry-driven automatic event detection
- Predictive ETA modelling from accumulated plan-vs-actual data
- Multi-depot optimisation
- EV fleet-specific constraints (charging windows, range)
- Field-service and spare-parts logistics variants
- TMS/ERP and telematics integrations for enterprise deployment
- AI dispatcher chat with broader operational Q&A

## Judge Questions & Answers

**Why not Google Maps?**
Maps products compute point-to-point routes; they don't manage fleet-level capacity, time-window, and driver constraints, or re-optimise a whole plan when one vehicle fails.

**Why not just shortest path?**
Shortest path ignores capacity, time windows, driver hours, and cost — a fleet plan has to satisfy all of these jointly, which is why this is framed as a constrained optimisation problem, not a pathfinding problem.

**Is the route globally optimal?**
No claim of global optimality is made. OR-Tools is configured to return high-quality feasible solutions within a runtime budget suitable for interactive re-optimisation.

**Why use OR-Tools instead of writing a custom solver?**
Building a competitive VRP solver from scratch is a research problem in itself; OR-Tools is a proven, well-supported library that lets the team focus engineering effort on the decision/event layer that is the actual differentiator.

**Why use AI at all if it doesn't compute the route?**
Dispatchers need to trust and act on route changes quickly. The AI layer turns a route-version diff into a plain-language reason, which is a real operational need distinct from computing the route itself.

**What happens if two backup vehicles also fail?**
The system re-optimises again against whichever vehicles remain, following the cascading failure handling behavior described above, rather than assuming a single fallback is always sufficient.

**What happens if no feasible route exists?**
The system reports infeasibility explicitly and recommends concrete actions — activating a standby vehicle, requesting an external carrier, extending a delivery window, splitting a delivery, or reprioritising orders.

**How does weather change the route?**
A weather event enters the normalized event interface, updates affected travel-time/risk parameters, and triggers re-optimisation exactly like a traffic or breakdown event.

**Where does the data come from? Is it real?**
Delivery, fleet, and disruption data are synthetic and generated for the demo; road and geographic data come from OpenStreetMap for a real city (Jaipur); optimisation quality is additionally validated against public VRP benchmarks.

**How do you evaluate performance?**
Separately by layer: optimisation quality against benchmarks, event-handling success and recovery time, ETA accuracy where actual data exists, and factual consistency of AI explanations against the underlying route data.

**How does this save money?**
By jointly optimising distance, fuel, tolls, and overtime rather than distance alone, and by reducing manual dispatcher intervention time during disruptions.

**Who pays for it?**
The intended customer is the fleet operator (SME/regional first), via a per-vehicle or usage-based SaaS subscription.

**Who are your competitors?**
Locus, FarEye, Shipsy, and OptimoRoute operate in adjacent or overlapping space, alongside toolkits like OR-Tools itself. MargDarshak is positioned as a focused decision layer, not a claim to be more mature than these established products.

**How does it scale?**
The optimisation and event services are structured independently of the frontend, so re-optimisation runs can be scaled horizontally as fleet size and event volume grow; this is an architectural intention, not a benchmarked result at hackathon stage.

**How do you prevent route thrashing (re-optimising too often)?**
Re-optimisation is intended to trigger only when an event materially changes feasibility or cost beyond a defined threshold — this threshold logic is part of the planned event-engine design.

**What if traffic/weather data is wrong?**
Because the optimiser consumes traffic/weather as one input among several deterministic constraints, an inaccurate signal affects ETA/cost estimates for that event but does not violate hard constraints like capacity or time windows.

**Why would an SME use this instead of an enterprise TMS?**
Enterprise TMS platforms are heavyweight and expensive to deploy; MargDarshak targets the specific pain point of dynamic re-optimisation for fleets that don't need (or can't justify) a full TMS.

**How will live integrations work?**
Live weather/traffic APIs and fleet telemetry are designed to plug into the same normalized event interface the simulator already uses, so no changes to the optimisation or explanation logic are required.

**What is genuinely innovative here?**
Not the VRP solver itself, but the combination of fleet-level constraint-aware optimisation, cascading-failure-aware re-optimisation, and AI-grounded explanation, presented as one coherent decision loop.

## Team

*Team member names and roles to be added.*

## License

*No license has been finalized for this project yet.*
