import os
import sys
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.security import create_access_token, get_password_hash
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.organization import Organization
from app.models.user import User, UserRole

from sqlalchemy.pool import StaticPool

# Use an in-memory SQLite for high-speed deterministic testing with StaticPool
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        # Create default organization & admin/dispatcher
        org = Organization(id="test-org-1", name="Test Logistics", city="Jaipur")
        db.add(org)
        
        dispatcher = User(
            id="test-dispatcher-1",
            name="Test Dispatcher",
            email="dispatcher@test.com",
            hashed_password=get_password_hash("testpass123"),
            role=UserRole.DISPATCHER,
            organization_id=org.id
        )
        admin = User(
            id="test-admin-1",
            name="Test Admin",
            email="admin@test.com",
            hashed_password=get_password_hash("adminpass123"),
            role=UserRole.ADMIN,
            organization_id=org.id
        )
        db.add_all([dispatcher, admin])
        db.commit()

        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def dispatcher_token():
    return create_access_token(subject="test-dispatcher-1", role="dispatcher")


@pytest.fixture(scope="function")
def auth_headers(dispatcher_token):
    return {"Authorization": f"Bearer {dispatcher_token}"}
