"""Fixture bersama: database SQLite sementara + akun siswa siap login."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import Base, get_db
from app.main import app
from app.models import SchoolClass, Student
from app.security import hash_password

PASSWORD = "rahasia-s01"
PASSWORD_S02 = "rahasia-s02"


@pytest.fixture
def db_factory():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    TestSession = sessionmaker(bind=engine, expire_on_commit=False)
    with TestSession() as db:
        db.add(SchoolClass(code="8A-2026"))
        db.add(Student(code="S01", class_code="8A-2026", username="8a-2026-s01", password_hash=hash_password(PASSWORD)))
        db.add(
            Student(code="S02", class_code="8A-2026", username="8a-2026-s02", password_hash=hash_password(PASSWORD_S02))
        )
        db.add(Student(code="S03", class_code="8A-2026"))  # belum punya akun
        db.commit()
    return TestSession


@pytest.fixture
def client(db_factory):
    def override():
        db = db_factory()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override
    yield TestClient(app)
    app.dependency_overrides.clear()


def login(client, username="8a-2026-s01", password=PASSWORD):
    r = client.post("/api/auth/login", json={"username": username, "password": password})
    assert r.status_code == 200, r.text
    return r.json()["token"]


def bearer(token):
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth(client):
    """Header Authorization untuk siswa S01 yang sudah login."""
    return bearer(login(client))
