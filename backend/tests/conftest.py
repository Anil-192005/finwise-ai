import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.session import Base, get_db
from app.main import app
from app.db.init_db import init_db

TEST_DATABASE_URL = "sqlite:///./test_finwise.db"

test_engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    # Seed system categories
    db = TestingSessionLocal()
    init_db(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)

@pytest.fixture()
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture()
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

@pytest.fixture()
def auth_headers_user1(client):
    reg_data = {
        "full_name": "User One",
        "email": "user1@example.com",
        "password": "Password123!",
        "confirm_password": "Password123!",
        "preferred_currency": "INR"
    }
    res = client.post("/api/v1/auth/register", json=reg_data)
    if res.status_code == 201:
        token = res.json()["access_token"]
    else:
        login_res = client.post("/api/v1/auth/login", json={"email": "user1@example.com", "password": "Password123!"})
        token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture()
def auth_headers_user2(client):
    reg_data = {
        "full_name": "User Two",
        "email": "user2@example.com",
        "password": "Password123!",
        "confirm_password": "Password123!",
        "preferred_currency": "USD"
    }
    res = client.post("/api/v1/auth/register", json=reg_data)
    if res.status_code == 201:
        token = res.json()["access_token"]
    else:
        login_res = client.post("/api/v1/auth/login", json={"email": "user2@example.com", "password": "Password123!"})
        token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
