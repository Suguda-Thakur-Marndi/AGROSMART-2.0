# AgroSmart 2.0 — IoT Smart Agriculture System

AgroSmart 2.0 is a full-stack IoT platform for smart, sensor-driven agriculture management. It monitors and controls two distinct growing zones — a **Vegetable Field** and a **Paddy Field** — through a connected hardware controller, a cloud backend, and a React Native mobile app.

---

## System Overview

```
[Sensors] → [Arduino Mega + A7672S] → [Backend (FastAPI)] → [Mobile App (React Native / Expo)]
```

### Hardware
| Component | Role |
|---|---|
| **EWS All-in-One Arduino Mega IoT Grove Kit** | Main controller — reads sensors, drives pump/valves, runs irrigation logic |
| **A7672S 4G LTE Cellular Module** | UART-connected to Arduino Mega; HTTP POST telemetry + MQTT command reception |
| **Capacitive Soil Moisture Sensor V1.2** | Analog soil moisture (per zone) |
| **PE-03 pH Electrode + pH Sensor Module V3.0** | Analog pH reading (per zone) |
| **DS18B20 Waterproof Temperature Probe** | OneWire soil temperature (per zone) |
| **DHT11** | Ambient temperature + humidity |
| **Water Pump** | Single shared pump for irrigation |
| **Solenoid Valves (×2)** ⚠️ | Zone isolation — not yet confirmed in inventory |

### Two-Zone Layout
| Zone | Crop Type | Key Concerns |
|---|---|---|
| **Zone A** | Vegetable Field | Precise moisture, pH, frequent short irrigation cycles |
| **Zone B** | Paddy Field | Flood-tolerant, longer irrigation, temperature monitoring |

---

## Repository Structure

```
AGROSMART 2.0/
├── mobile/          # React Native / Expo 58 mobile application
├── backend/         # Python FastAPI backend + PostgreSQL
├── firmware/        # Arduino Mega C++ firmware (PlatformIO)
├── tests/           # Cross-layer integration & unit tests
└── docs/            # Architecture docs, API specs, wiring diagrams
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Mobile** | React Native 0.88.1, Expo 58, TypeScript, Expo Router, Zustand, TanStack Query |
| **Backend** | Python FastAPI, PostgreSQL, SQLAlchemy, Pydantic, MQTT, WebSocket |
| **Firmware** | C++ (Arduino / PlatformIO), AT commands (A7672S), OneWire, DHT lib |

---

## Getting Started

### Mobile
```bash
cd mobile
npm install
npx expo start
```

### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Firmware
Open `/firmware` in PlatformIO (VS Code extension) and flash to the Arduino Mega board.

---

## License
Proprietary — AgroSmart 2.0 Project.
