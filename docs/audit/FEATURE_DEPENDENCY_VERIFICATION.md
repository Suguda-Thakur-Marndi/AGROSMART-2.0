# AGROSMART 2.0 – FEATURE DEPENDENCY & SENSOR DATA INTEGRITY AUDIT

**Audit Date:** November 19, 2026  
**Auditor Roles:** Senior Full-Stack Engineer, Mobile Architect, QA Lead  
**Classification:** Application-Wide Telemetry Consumption & Single-Source-of-Truth Audit  

---

## 1. Single Source of Truth Architectural Principle

To eliminate data discrepancies and prevent fake or inconsistent readings across different screens, AgroSmart 2.0 enforces a strict **Single Source of Truth** pattern:

```
                      [ LIVE INCOMING TELEMETRY ]
                   (Wi-Fi WebSocket / REST / Bluetooth)
                                   │
                                   ▼
             [ DeviceCommunicationService.handleIncomingTelemetry ]
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
 [ useSensorStore ]       [ useIrrigationStore ]      [ useAppStore ]
 - vegetableZone          - pumpStatus                - notifications
 - paddyZone              - recentCommands            - connectionState
 - lastUpdated            - recentEvents              - isDemoMode: false
         │                         │                         │
         └─────────────────────────┼─────────────────────────┘
                                   │
                                   ▼
       ┌───────────────────────────┴───────────────────────────┐
       ▼               ▼                ▼           ▼          ▼
  [ Dashboard ]  [ Zone Views ]   [ Analytics ] [ Alerts ] [ Pump Hub ]
```

---

## 2. Feature-by-Feature Dependency Verification

### 2.1 Dashboard (`mobile/app/(tabs)/index.tsx`)
- **Live Sensor Cards:**
  - `vegMoisture`: Pulled directly from `vegetableZone?.soilMoisture?.value`. Displays `--%` and `Sensor Offline` when unlinked in LIVE mode.
  - `vegPH`: Pulled from `vegetableZone?.ph?.value`. Displays exact 2-decimal reading (e.g. `6.82 pH`).
  - `soilTemp`: Pulled from `vegetableZone?.soilTemperature?.value` (DS18B20 1-Wire probe).
  - `airTemp` & `airHumidity`: Pulled from `vegetableZone?.airTemperature?.value` and `airHumidity?.value` (DHT11).
- **Device Connection Status:**
  - Displays dynamic state badge: `CONNECTED (Wi-Fi 192.168.0.200)` or `CONNECTED (Bluetooth AgroSmart-BT)` with live RSSI signal meter.
- **Active Irrigation Status:**
  - `PumpStatusCard` renders real hardware state: `IDLE`, `LEAD_VALVE_OPEN (1.5s)`, `RUNNING (12V DC, 1.0A)`, `LAG_VALVE_BLEED (1.0s)`, or `EMERGENCY_STOP`.
- **Last Updated Timestamp:**
  - Formatted dynamically from `lastUpdated` ISO-8601 string (e.g. `Updated 4s ago`).

### 2.2 Field Monitoring Screens (`zone-vegetable.tsx`, `zone-paddy.tsx`, `farm.tsx`)
- **Plot A: Vegetable Field (`zone-vegetable.tsx`):**
  - Mapped to Grove Analog Port `A0` (Capacitive Moisture Sensor 1) and Solenoid Valve 1 (`D8`).
  - Configured ON threshold: $35.0\%$, OFF threshold: $55.0\%$.
  - Displays real moisture percentage, calibrated dry reference (~785 ADC) and wet reference (~320 ADC).
- **Plot B: Paddy Field (`zone-paddy.tsx`):**
  - Mapped to Grove Analog Port `A1` and Solenoid Valve 2 (`D9`).
  - Configured ON threshold: $60.0\%$, OFF threshold: $80.0\%$.
  - **Single Sensor Safeguard:** When physical probe 2 is not connected on `A1`, `paddyMoisture` reads `-1.0` and the screen shows `Sensor Not Installed / Bench Pending` instead of fabricating a fake value.

### 2.3 Analytics & Historical Reports (`mobile/app/(tabs)/analytics.tsx`)
- **Telemetry History API:**
  - Connects to `/api/v1/analytics/sensor-history/{device_id}?hours=24`.
  - Queries `sensor_readings` database table populated by real ESP-01 Wi-Fi telemetry packets.
- **Historical Charts:**
  - Scalable SVG hydro-sparkline charts plot real historical timestamps against soil moisture, temperature, and pH.
  - Zero random numbers: if fewer than 2 readings exist in database, renders clean `No historical readings yet — awaiting controller ingest` placeholder.
- **Water Consumption Accounting:**
  - Calculated by `/api/v1/analytics/water-summary/{device_id}` from completed irrigation sessions:
    $$\text{Volume (L)} = \frac{\text{Duration (seconds)}}{60} \times \text{Calibrated Flow Rate (15.0 L/min for Veg, 12.0 L/min for Paddy)}$$

### 2.4 Notifications & Alerts (`mobile/app/notifications.tsx`)
- **Live Event Consumption:**
  - Consumes `useAppStore.notifications` array populated in real time by `DeviceCommunicationService` and backend WebSockets.
- **Generated Alerts:**
  - `Low Vegetable Moisture`: Fired when `veg_moisture < 35.0%`.
  - `Acidic / Alkaline Soil Alert`: Fired when `ph < 5.50` or `ph > 7.50`.
  - `Hardware Fault`: Decoded from ATmega2560 error bitmask (e.g. 1-Wire CRC failure, DHT11 timeout, E-STOP active).
  - Zero static fake cellular notifications.

### 2.5 Automatic Irrigation Engine
- **Firmware Level:**
  - Evaluates `g_vegMoisture` every 1000ms in `IrrigationStateMachine::update()`.
  - If `vegMoisture >= 0.0f` and `vegMoisture < 35.0%`, transitions from `IDLE` to `VEG_VALVE_OPEN`.
  - Enforces $1500\,\text{ms}$ valve lead time before energizing pump MOSFET (`D6`).
  - Terminates automatically when `vegMoisture >= 55.0%` or max runtime (15 min) is reached.
- **Safety Interlock:**
  - Rejects invalid readings ($<0\%$ or $>100\%$) and immediately shuts down pump if sensor error is detected.

### 2.6 Manual Irrigation Control (`pump-control.tsx`, `irrigation.tsx`)
- **Action Execution:**
  - All manual controls (`Start Pump`, `Vegetable Drip`, `Paddy Flood`, `Emergency Stop`) call `deviceCommunicationService`.
  - Commands are dispatched via active transport (Wi-Fi REST or direct Bluetooth) with duplicate debounce protection (800ms).
  - Status updates in UI occur only after hardware acknowledgment is received.

---

## 3. Telemetry Integrity Verification Matrix

| UI Component | Data Source | Live Value Behavior | Disconnected Behavior | Verification Status |
| :--- | :--- | :--- | :--- | :---: |
| **Veg Moisture Card** | `vegetableZone.soilMoisture.value` | Live 0–100% | Displays `--%` / `Offline` | **VERIFIED** |
| **Paddy Moisture Card**| `paddyZone.soilMoisture.value` | Live 0–100% | Displays `Not Installed` | **VERIFIED** |
| **Soil pH Meter** | `vegetableZone.ph.value` | Live 0–14.0 pH | Displays `-- pH` / `Uncalibrated` | **VERIFIED** |
| **Soil Temp (DS18B20)**| `vegetableZone.soilTemperature.value` | Live -55 to 125°C | Displays `--°C` / `Offline` | **VERIFIED** |
| **Air Temp/Hum (DHT11)**| `vegetableZone.airTemperature.value` | Live 0–50°C, 20–90% | Displays `--°C` / `Offline` | **VERIFIED** |
| **Pump Status Card** | `pumpStatus.state` | Real `ON` / `OFF` | Retains last ACK state | **VERIFIED** |
| **Valve Indicators** | `pumpStatus.valveVegetable / valvePaddy`| Real `OPEN` / `CLOSED` | Displays `CLOSED` on fault | **VERIFIED** |
| **Water Usage Summary**| `/api/v1/analytics/water-summary` | Real session math | Zero liters until session logged| **VERIFIED** |
| **Live Notifications** | `useAppStore.notifications` | Real threshold alerts | Default controller status | **VERIFIED** |
