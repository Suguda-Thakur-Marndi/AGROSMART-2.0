import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.core.config import settings
from app.db.session import create_all_tables
from app.main import app


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    await create_all_tables()


@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "app" in data


@pytest.mark.asyncio
async def test_user_registration_and_login():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Register
        reg_payload = {
            "email": "farmer@agrosmart.io",
            "password": "FarmPassword2026!",
            "full_name": "AgroSmart Farmer",
        }
        res = await ac.post("/api/v1/auth/register", json=reg_payload)
        assert res.status_code in [201, 400]  # 400 if already created in previous run

        # Login
        login_payload = {
            "email": "farmer@agrosmart.io",
            "password": "FarmPassword2026!",
        }
        res_login = await ac.post("/api/v1/auth/login", json=login_payload)
        assert res_login.status_code == 200
        login_data = res_login.json()
        assert "access_token" in login_data
        assert login_data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_post_telemetry_with_device_key():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        telemetry_payload = {
            "device_id": "agrosmart-mega-01",
            "veg_moisture": 42.5,
            "paddy_moisture": 68.0,
            "ph": 6.85,
            "soil_temp": 24.5,
            "air_temp": 29.0,
            "air_humidity": 72.0,
            "pump_active": False,
            "veg_valve": False,
            "paddy_valve": False,
            "irrigation_mode": "auto",
            "active_zone": "none",
            "error_bitmask": 0,
        }
        headers = {"X-Device-Key": settings.DEVICE_API_KEY}
        res = await ac.post("/api/v1/telemetry", json=telemetry_payload, headers=headers)
        assert res.status_code == 201
        data = res.json()
        assert data["device_id"] == "agrosmart-mega-01"
        assert data["veg_moisture"] == 42.5


@pytest.mark.asyncio
async def test_get_latest_telemetry():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/telemetry/latest/agrosmart-mega-01")
        assert res.status_code == 200
        data = res.json()
        assert data["device_id"] == "agrosmart-mega-01"
        assert "veg_moisture" in data


@pytest.mark.asyncio
async def test_list_devices():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/devices")
        assert res.status_code == 200
        devices = res.json()
        assert isinstance(devices, list)
        assert any(d["device_id"] == "agrosmart-mega-01" for d in devices)


@pytest.mark.asyncio
async def test_post_irrigation_command():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        cmd_payload = {
            "device_id": "agrosmart-mega-01",
            "command_type": "manual_veg",
            "payload": {"duration_minutes": 10},
        }
        res = await ac.post("/api/v1/irrigation/command", json=cmd_payload)
        assert res.status_code == 201
        data = res.json()
        assert data["command_type"] == "manual_veg"
        assert data["status"] == "pending"


@pytest.mark.asyncio
async def test_device_poll_commands():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/devices/agrosmart-mega-01/commands")
        assert res.status_code == 200
        cmds = res.json()
        assert isinstance(cmds, list)
        assert len(cmds) >= 1


@pytest.mark.asyncio
async def test_notifications():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Get notifications
        res = await ac.get("/api/v1/notifications")
        assert res.status_code == 200
        notifs = res.json()
        assert isinstance(notifs, list)

        # Mark all read
        res_read = await ac.put("/api/v1/notifications/read-all")
        assert res_read.status_code == 200
        assert res_read.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_analytics_water_summary():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/analytics/water-summary/agrosmart-mega-01")
        assert res.status_code == 200
        data = res.json()
        assert data["device_id"] == "agrosmart-mega-01"
        assert "total_water_liters_est" in data


@pytest.mark.asyncio
async def test_irrigation_config():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/irrigation/config/agrosmart-mega-01")
        assert res.status_code == 200
        config = res.json()
        assert "vegetable_zone" in config
        assert "paddy_zone" in config
        assert config["vegetable_zone"]["flow_rate_lpm"] == 15.0
        assert config["paddy_zone"]["flow_rate_lpm"] == 12.0
