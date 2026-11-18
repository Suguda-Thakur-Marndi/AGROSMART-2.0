# AGROSMART 2.0 – ARDUINO TO ANDROID END-TO-END INTEGRATION AUDIT

**Audit Date:** November 19, 2026  
**Auditor Roles:** Senior IoT Integration Engineer, Full-Stack System Architect, Embedded Firmware Engineer  
**Classification:** Complete Hardware-to-Mobile Telemetry & Command Pipeline Audit  

---

## 1. Executive Summary & Pipeline Topology

This audit traces and validates the entire bidirectional pipeline of AgroSmart 2.0:
1. **Sensors → Arduino Mega → Firmware Drivers → Serialization → Transport (Wi-Fi ESP-01 / Bluetooth Serial2) → FastAPI Backend / SQLite DB → Android App Stores → Dashboard & Dependent Screens**
2. **Android UI Action → Command Service → Transport (Wi-Fi REST / Direct Bluetooth) → Arduino Mega Command Dispatcher → Pump / Solenoid Valve Drivers → Hardware ACK → Android UI Confirmation**

```
 [ SENSORS ]
 Capacitive Moisture (A0/A1)
 Bharat pH Module (A2)
 DS18B20 1-Wire (D7)
 DHT11 Ambient (D4)
       │
       ▼
 [ ARDUINO MEGA (ATmega2560) ]
 Task Scheduler (5s Sensor Task, 1s FSM, 10s Telemetry)
 TelemetryBuilder (Compact Static JSON, 256B)
       │
       ├─────────────────────────────────────────────┐
       ▼ (Serial1 @ 115200)                          ▼ (Serial2 @ 9600)
 [ ESP-01 WI-FI MODULE ]                      [ BLUETOOTH MODULE ]
 AT+CIPSEND HTTP POST                          Direct Frame Accumulator
       │                                             │
       ▼                                             │
 [ FASTAPI BACKEND (8000) ]                          │
 /api/v1/telemetry/ingest                            │
 X-Device-Key Authentication                         │
 Ingestion, Threshold Evaluator, Notifications       │
 SQLite / PostgreSQL Storage                         │
 WebSocket Broadcaster (/ws/{device_id})             │
       │                                             │
       ▼                                             │
 [ ANDROID APPLICATION (Expo SDK 52 / React Native) ]│
 DeviceCommunicationService ◄────────────────────────┘
 Zustand Stores: sensorStore, irrigationStore, appStore
 Google Stitch UI: Dashboard, Fields, Analytics, Notifications, Pump Control
```

---

## 2. Stage-by-Stage Telemetry Pipeline Verification

### 2.1 Physical Sensors to Arduino Mega HAL
- **Capacitive Soil Moisture Sensor V1.2 (`A0` for Vegetable, `A1` for Paddy):**
  - Read via 10-bit ADC (0–1023). 5-sample moving average filter removes ADC noise.
  - Dry/Wet linear interpolation: $0\% = \text{DryAdc}$ (~785), $100\% = \text{WetAdc}$ (~320).
  - Disconnect detection: ADC < 20 or ADC > 1000 flags probe disconnected.
  - **Physical Reality:** The physical bench kit has **one** Capacitive Moisture Sensor V1.2 installed at `A0`. If `A1` is disconnected, firmware assigns sentinel `-1.0f`, preventing fake readings or false auto-irrigation triggers.
- **Bharat pH Sensor Module V3.0 (`A2`):**
  - Voltage acquisition from PE-03 glass electrode with Nernst temperature compensation:
    $$V_{\text{comp}} = V_{\text{raw}} \times \frac{298.15}{273.15 + T_{\text{soil}}}$$
  - Calibrated against pH 7.00 (neutral offset 1500mV) and pH 4.01 (acidic slope 59.16 mV/pH).
  - Out of range detection: pH < 0.0 or pH > 14.0 flags sensor invalid.
- **DS18B20 Waterproof Stainless Probe (`D7`):**
  - Maxim Dallas 1-Wire protocol with hardware CRC-8 verification.
  - 12-bit digital resolution (0.0625°C precision). Power-on reset sentinel 85°C rejected.
- **DHT11 Microclimate Sensor (`D4`):**
  - Bit-banged single-wire digital pulse protocol (40-bit frame).
  - Checksum validation: $(\text{Byte}_0 + \text{Byte}_1 + \text{Byte}_2 + \text{Byte}_3) \land \text{0xFF} == \text{Byte}_4$.

### 2.2 Telemetry Serialization (`TelemetryBuilder`)
- Formats compact JSON without dynamic memory allocation (`m_buffer[256]`):
  ```json
  {"device_id":"agrosmart-mega-01","ts":125000,"vm":38.5,"pm":-1.0,"ph":6.80,"st":24.5,"at":28.0,"ah":65.0,"pump":0,"vv":0,"pv":0,"mode":"auto","zone":"none","err":0}
  ```
- Units and ranges strictly adhere to physical constraints:
  - `vm` (Vegetable Moisture): 0.0–100.0% (-1.0 = offline)
  - `pm` (Paddy Moisture): 0.0–100.0% (-1.0 = not installed)
  - `ph`: 0.00–14.00
  - `st` (Soil Temperature): -55.0 to +125.0°C
  - `at` (Air Temperature): 0.0 to +50.0°C
  - `ah` (Air Humidity): 20.0 to 90.0% RH
  - `pump`, `vv`, `pv`: 0 (OFF) or 1 (ON)
  - `err`: 8-bit safety fault bitmask

### 2.3 Wi-Fi Communication Link (ESP-01 on `Serial1`)
- **Baud Rate:** 115200 baud on hardware UART pins 18 (TX1) and 19 (RX1).
- **Protocol:** HTTP/1.1 POST to `http://192.168.0.200:8000/api/v1/telemetry/ingest`.
- **Authentication:** `X-Device-Key: agrosmart-device-key-2024` header verified against `settings.DEVICE_API_KEY`.
- **Offline Ring Buffer:** In the event of Wi-Fi AP drop, up to 20 packets are queued in local SRAM and flushed sequentially upon reconnection.

### 2.4 Bluetooth Local Communication Link (Module on `Serial2`)
- **Baud Rate:** 9600 baud on hardware UART pins 16 (TX2) and 17 (RX2).
- **Accumulator:** Non-blocking byte-by-byte buffer (`m_rxBuffer[256]`) with newline delimiter parsing.
- **Direct Mode:** In field scenarios without Wi-Fi or backend server, the Android app receives telemetry directly over RFCOMM and updates local stores in real time.

### 2.5 FastAPI Backend Ingestion & Database Persistence
- **Ingestion Handler:** `/api/v1/telemetry/ingest` in `backend/app/api/v1/telemetry.py`.
- **Normalization:** Automatically maps compact keys (`vm`, `pm`, `st`, `at`, `ah`, `vv`, `pv`, `err`) or verbose keys.
- **Database Tables:**
  - `devices`: Upserts device record, updates `is_online=True` and `last_seen=now()`.
  - `sensor_readings`: Appends historical row for analytics and charts.
  - `notifications`: Evaluates thresholds and creates notifications (e.g. `Low Vegetable Moisture`, `Acidic Soil Alert`, `Hardware Fault`).
- **Live Push:** Calls `manager.broadcast(device_id, payload)` to push live readings over WebSockets (`/ws/{device_id}`) immediately to connected phones.

### 2.6 Android Client Telemetry Consumption
- **Central Consumer:** `DeviceCommunicationService.getInstance().handleIncomingTelemetry(data)`.
- **Store Synchronization:**
  - Updates `useSensorStore` with validated `ZoneSensorData` for both vegetable and paddy zones.
  - Detects offline sensors (-1 / null) and displays `--` / `Offline` without fake values.
  - Updates `useIrrigationStore` with reported pump and valve states (`pumpStatus.reportedByDevice = true`).
  - Pushes real-time threshold warnings into `useAppStore.notifications`.

---

## 3. Bidirectional Command Pipeline Verification (Android → Arduino)

### 3.1 Command Flow
1. **User Action:** User taps "Start Quick Irrigation", "Request Vegetable Drip", or "EMERGENCY STOP" on phone.
2. **Service Dispatch:** `DeviceCommunicationService` generates unique command ID (`cmd_<timestamp>_<random>`) and issues it via `ConnectionManager`.
3. **Transport Routing:**
   - **Wi-Fi Route:** HTTP POST to `/api/v1/irrigation/command`. Backend records `DeviceCommand(status="pending")`. Arduino polling task fetches pending commands from `/api/v1/devices/{device_id}/commands/poll`.
   - **Bluetooth Route:** Direct serial transmission to Arduino Mega `Serial2`:
     `$CMD,<ID>,<ACTION>,<ZONE>,<DURATION>*<CHECKSUM>\n`
4. **Arduino Command Handling (`ConnectionCoordinator`):**
   - Validates interface authority (locks active controller to prevent concurrent Wi-Fi/BT conflicts).
   - Bypasses locks immediately if command is `EMERGENCY_STOP`.
   - Debounces duplicate command IDs received within 2 seconds.
5. **Actuator Execution:**
   - `IrrigationStateMachine` activates Valve 1 (`D8`) or Valve 2 (`D9`).
   - Waits $1500\,\text{ms}$ lead time before energizing Pump MOSFET (`D6`).
   - Pump runs for configured duration or until moisture threshold reached.
   - Pump turns OFF first; valve remains open for $1000\,\text{ms}$ lag time to bleed residual pressure.
6. **Hardware Acknowledgment:**
   - Arduino emits ACK packet back to sender.
   - Android updates command state from `PENDING` to `CONFIRMED`.

---

## 4. Key Integration Fixes Applied

| Pipeline Stage | Discrepancy / Defect Identified | Engineering Resolution Applied |
| :--- | :--- | :--- |
| **Firmware Wi-Fi Config** | `DEVICE_AUTH_TOKEN` was `agt_live_mega2560_sec_key_2026`, while backend expected `agrosmart-device-key-2024` (403 Forbidden). | Aligned `DEVICE_AUTH_TOKEN` in `firmware/src/config/wifi_config.h` to `agrosmart-device-key-2024`. Set default `BACKEND_HOST` to `192.168.0.200`. |
| **Backend Telemetry Service** | Notification triggers tested `packet.veg_moisture` instead of normalized `veg_moist` (compact key `vm`), causing threshold alerts to never fire. | Updated `telemetry_service.py` to evaluate normalized `veg_moist`, `paddy_moist`, `ph_val`, and `err_bits`. Added pH alerts (<5.5 / >7.5) and hardware error decoding. |
| **Backend WebSockets** | Ingested telemetry was persisted in SQLite but never broadcast to connected WebSockets. | Added `manager.broadcast(device_id, payload)` in `telemetry_service.py`, enabling real-time telemetry streaming to mobile apps. |
| **Mobile Telemetry Handler** | `DeviceCommunicationService.ts` checked `if (sensorState.vegetableZone)`, which was null on boot, dropping incoming telemetry. | Rewrote `handleIncomingTelemetry` to safely initialize and populate `ZoneSensorData` for both zones from incoming payloads. |
| **Mobile UI Actions** | Buttons in `HomeScreen`, `SmartIrrigationWaterControlScreen`, and `PumpControlScreen` modified local store without calling hardware service. | Connected all action handlers to `deviceCommunicationService.startIrrigation()`, `stopIrrigation()`, and `emergencyStop()`, awaiting real hardware ACKs. |
| **Notifications Screen** | `notifications.tsx` showed static fake notifications referencing cellular A7672S. | Connected `notifications.tsx` to `useAppStore.notifications` with live telemetry threshold alerts and zero fake cellular entries. |
| **Single-Sensor Reality** | Disconnected Paddy sensor on A1 initialized to fake 70%. | Handled disconnected/uninstalled sensors with `-1.0` sentinels, rendering `--` and `Offline` in UI without fake numbers. |
