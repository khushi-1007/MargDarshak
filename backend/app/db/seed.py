import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.driver import Driver, DriverStatus
from app.models.event import Event, EventSeverity, EventStatus, EventType
from app.models.order import Order, OrderPriority, OrderStatus
from app.models.organization import Organization
from app.models.user import User, UserRole
from app.models.vehicle import FuelType, Vehicle, VehicleStatus, VehicleType


def seed_database(db: Session = None) -> dict:
    """Seeds Jaipur synthetic demo dataset."""
    close_db = False
    if db is None:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        close_db = True

    try:
        # Check if already seeded
        if db.query(User).filter(User.email == "dispatcher@margdarshak.ai").first():
            return {"status": "already_seeded"}

        # 1. Organization
        org = Organization(
            id=str(uuid.uuid4()),
            name="MargDarshak Jaipur Logistics Hub",
            city="Jaipur"
        )
        db.add(org)

        # 2. Users
        admin_user = User(
            id=str(uuid.uuid4()),
            name="Fleet Admin",
            email="admin@margdarshak.ai",
            hashed_password=get_password_hash("admin123"),
            role=UserRole.ADMIN,
            organization_id=org.id
        )
        dispatcher_user = User(
            id=str(uuid.uuid4()),
            name="Jaipur Dispatcher",
            email="dispatcher@margdarshak.ai",
            hashed_password=get_password_hash("dispatch123"),
            role=UserRole.DISPATCHER,
            organization_id=org.id
        )
        db.add_all([admin_user, dispatcher_user])

        # 3. Drivers
        drivers_data = [
            ("Rajesh Sharma", "+91-9829011111", 8.0, 26.9124, 75.7873),
            ("Vikram Singh", "+91-9829022222", 8.0, 26.9124, 75.7873),
            ("Amit Verma", "+91-9829033333", 8.0, 26.9124, 75.7873),
            ("Suresh Meena", "+91-9829044444", 8.0, 26.9124, 75.7873),
            ("Pooja Choudhary", "+91-9829055555", 8.0, 26.9124, 75.7873),
        ]
        created_drivers = []
        for name, phone, hours, lat, lng in drivers_data:
            d = Driver(
                id=str(uuid.uuid4()),
                name=name,
                phone=phone,
                max_work_hours=hours,
                hours_remaining=hours,
                status=DriverStatus.AVAILABLE,
                current_lat=lat,
                current_lng=lng,
                organization_id=org.id
            )
            db.add(d)
            created_drivers.append(d)
        db.flush()

        # 4. Vehicles (Calibrated for multi-vehicle dispatch & cascading capacity constraints)
        vehicles_data = [
            ("RJ-14-GA-1001", VehicleType.ELECTRIC_VAN, 65.0, FuelType.ELECTRIC, 10.0, 5.0, 1.0, 3.0, created_drivers[0].id),
            ("RJ-14-GB-2002", VehicleType.LIGHT_COMMERCIAL, 75.0, FuelType.DIESEL, 13.0, 9.0, 1.2, 3.5, created_drivers[1].id),
            ("RJ-14-GC-3003", VehicleType.MEDIUM_TRUCK, 70.0, FuelType.DIESEL, 16.0, 12.0, 1.5, 4.0, created_drivers[2].id),
            ("RJ-14-GD-4004", VehicleType.LIGHT_COMMERCIAL, 60.0, FuelType.CNG, 11.0, 7.0, 1.1, 3.0, created_drivers[3].id),
            ("RJ-14-GE-5005", VehicleType.THREE_WHEELER, 40.0, FuelType.CNG, 8.0, 4.0, 0.8, 2.5, created_drivers[4].id),
        ]
        created_vehicles = []
        for v_num, v_type, cap, fuel, c_km, f_km, toll, ot, d_id in vehicles_data:
            v = Vehicle(
                id=str(uuid.uuid4()),
                vehicle_number=v_num,
                vehicle_type=v_type,
                capacity_kg=cap,
                fuel_type=fuel,
                cost_per_km=c_km,
                fuel_cost_per_km=f_km,
                toll_factor=toll,
                overtime_cost_per_minute=ot,
                driver_id=d_id,
                status=VehicleStatus.AVAILABLE,
                current_lat=26.9124,
                current_lng=75.7873,
                available_from="08:00",
                available_until="20:00",
                organization_id=org.id
            )
            db.add(v)
            created_vehicles.append(v)
        db.flush()

        # 5. Orders (20 Synthetic Orders in Jaipur)
        orders_data = [
            ("ORD-1001", "Synthetic Client A", "9829100001", 26.9066, 75.7410, "Vaishali Nagar, Near Amrapali Circle", 35.0, OrderPriority.NORMAL, "09:00", "13:00", 15),
            ("ORD-1002", "Synthetic Client B", "9829100002", 26.8530, 75.8150, "Malviya Nagar, Sector 4 Market", 50.0, OrderPriority.HIGH, "10:00", "14:00", 20),
            ("ORD-1003", "Synthetic Client C", "9829100003", 26.8680, 75.7600, "Mansarovar, Varun Path Commercial Complex", 120.0, OrderPriority.NORMAL, "09:30", "15:00", 20),
            ("ORD-1004", "Synthetic Hospital Care", "9829100004", 26.9110, 75.8010, "C-Scheme, Subhash Marg Healthcare Center", 25.0, OrderPriority.CRITICAL, "09:00", "11:30", 15),
            ("ORD-1005", "Synthetic Retailer D", "9829100005", 26.8970, 75.8280, "Raja Park, Lane 2 Distribution Point", 65.0, OrderPriority.NORMAL, "11:00", "16:00", 15),
            ("ORD-1006", "Synthetic Factory E", "9829100006", 26.7770, 75.8360, "Sitapura Industrial Area, RIICO Phase 3", 350.0, OrderPriority.NORMAL, "10:00", "17:00", 30),
            ("ORD-1007", "Synthetic Store F", "9829100007", 26.9450, 75.7480, "Jhotwara Industrial Area, Road No 1", 180.0, OrderPriority.HIGH, "09:30", "13:30", 25),
            ("ORD-1008", "Synthetic Market G", "9829100008", 26.9630, 75.7820, "Vidhyadhar Nagar, Sector 2 Central Arcade", 40.0, OrderPriority.NORMAL, "12:00", "17:00", 15),
            ("ORD-1009", "Synthetic Trader H", "9829100009", 26.9200, 75.8230, "Bapu Bazar, Old City Gate 4", 85.0, OrderPriority.NORMAL, "11:00", "15:30", 20),
            ("ORD-1010", "Synthetic Tech Hub I", "9829100010", 26.8480, 75.8050, "Jawahar Circle, Tonk Road Plaza", 15.0, OrderPriority.HIGH, "13:00", "18:00", 15),
            ("ORD-1011", "Synthetic Logistics J", "9829100011", 26.8830, 75.7720, "Gopalpura Bypass, Near Kisan Dharamkanta", 90.0, OrderPriority.LOW, "10:00", "18:00", 15),
            ("ORD-1012", "Synthetic Mart K", "9829100012", 26.8930, 75.7530, "Nirman Nagar, Janpath Wholesale Point", 45.0, OrderPriority.NORMAL, "10:30", "16:00", 15),
            ("ORD-1013", "Synthetic Pharmacy L", "9829100013", 26.9010, 75.7940, "Civil Lines, Near Raj Bhavan Junction", 18.0, OrderPriority.CRITICAL, "09:00", "12:00", 10),
            ("ORD-1014", "Synthetic Hardware M", "9829100014", 26.8950, 75.8450, "Jawahar Nagar, Sector 4 Commercial Row", 110.0, OrderPriority.NORMAL, "11:00", "17:00", 20),
            ("ORD-1015", "Synthetic Textile N", "9829100015", 26.8420, 75.7880, "Sanganer Town, Stadium Road Hub", 220.0, OrderPriority.HIGH, "10:00", "15:00", 25),
            ("ORD-1016", "Synthetic Electronics O", "9829100016", 26.9250, 75.7920, "MI Road, Panch Batti Showroom", 30.0, OrderPriority.NORMAL, "12:00", "18:00", 15),
            ("ORD-1017", "Synthetic Appliances P", "9829100017", 26.9380, 75.8120, "Subhash Nagar, Shopping Center", 70.0, OrderPriority.LOW, "11:00", "19:00", 15),
            ("ORD-1018", "Synthetic Auto Parts Q", "9829100018", 26.7950, 75.8200, "Pratap Nagar, Sector 11 Depot", 140.0, OrderPriority.NORMAL, "09:30", "16:30", 20),
            ("ORD-1019", "Synthetic Supplies R", "9829100019", 26.8850, 75.8100, "Bapu Nagar, Near University Gate", 55.0, OrderPriority.NORMAL, "13:00", "18:00", 15),
            ("ORD-1020", "Synthetic Express S", "9829100020", 26.9150, 75.7650, "Shyam Nagar, Metro Pillar 104", 40.0, OrderPriority.HIGH, "10:00", "14:00", 15),
        ]

        for ext_id, c_name, phone, lat, lng, addr, wt, prio, w_s, w_e, dur in orders_data:
            o = Order(
                id=str(uuid.uuid4()),
                external_order_id=ext_id,
                customer_name=c_name,
                customer_phone=phone,
                pickup_lat=26.9124,
                pickup_lng=75.7873,
                pickup_address="Jaipur Central Logistic Hub, Transport Nagar",
                delivery_lat=lat,
                delivery_lng=lng,
                delivery_address=addr,
                weight_kg=wt,
                priority=prio,
                window_start=w_s,
                window_end=w_e,
                service_duration_minutes=dur,
                status=OrderStatus.PENDING,
                organization_id=org.id
            )
            db.add(o)

        # 6. Pre-configured Demo Events
        events_data = [
            (EventType.TRAFFIC, EventSeverity.MEDIUM, "Congestion on JLN Marg", "Peak traffic slowdown between Jawahar Circle and Gandhi Nagar.", 26.8750, 75.8100, 2.5, {"delay_factor": 1.6}),
            (EventType.WEATHER, EventSeverity.HIGH, "Heavy Monsoon Downpour", "Heavy localized rain impacting visibility and road speeds across Jaipur.", 26.9124, 75.7873, 5.0, {"delay_factor": 1.4}),
            (EventType.ROAD_CLOSURE, EventSeverity.HIGH, "Emergency Road Repair: MI Road", "Diversion in place between Ajmeri Gate and Panch Batti.", 26.9180, 75.8050, 1.0, {"closed_segment": "MI_ROAD_SECTION_2"}),
        ]
        for e_type, sev, title, desc, lat, lng, rad, meta in events_data:
            ev = Event(
                id=str(uuid.uuid4()),
                type=e_type,
                severity=sev,
                title=title,
                description=desc,
                location_lat=lat,
                location_lng=lng,
                radius_km=rad,
                status=EventStatus.ACTIVE,
                event_metadata=meta
            )
            db.add(ev)

        db.commit()
        return {
            "status": "success",
            "organization": org.name,
            "vehicles": len(vehicles_data),
            "drivers": len(drivers_data),
            "orders": len(orders_data),
            "events": len(events_data)
        }
    finally:
        if close_db:
            db.close()
