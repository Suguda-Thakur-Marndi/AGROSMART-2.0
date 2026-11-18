# AgroSmart 2.0 – System Technical Architecture & Specifications

**Project:** AgroSmart 2.0 – Complete IoT Smart Agriculture System  
**Document Version:** 2.0.0  
**Status:** Approved Architecture Baseline  
**Date:** November 2026  
**Authors:** Senior IoT Architect, Embedded Systems Engineer, React Native Developer, Backend Engineer  

---

## 1. Executive Summary & System Objectives

**AgroSmart 2.0** is an industrial-grade Internet of Things (IoT) precision agriculture monitoring and autonomous irrigation management platform. The system is designed to monitor and autonomously irrigate two distinct agricultural zones:
1. **Zone 1: Vegetable Field** (requiring shallow-root moisture regulation, pH sensitivity, and frequent controlled irrigation cycles)
2. **Zone 2: Paddy Field** (requiring continuous water management, flood tolerance, and extended irrigation periods)

### Critical Physical Constraint
Both zones are supplied by **one single common water pump** discharging into a **shared main pipeline** branching through a two-way manifold into two independently actuated solenoid valves (**Valve 1** for Vegetable Field, **Valve 2** for Paddy Field).

The system must ensure:
- **Local Embedded Autonomy:** The microcontroller retains 100% local irrigation authority and safety interlocks even during total cellular or cloud network outages.
- **Hydraulic Safety:** No deadhead pumping (pump running against closed valves), water hammer mitigation, and sequential zone scheduling by default to prevent pressure drops.
- **Data Integrity:** Strict segregation between live hardware telemetry and simulated demo data. Disconnected sensors must never report fabricated or frozen zero values.
- **No Direct Actuation from Cloud:** Cloud and mobile clients submit *requested commands*; the controller validates all physical conditions before actuation and responds with *confirmed hardware state*.

---

## 2. Hardware Inventory & Technical Specifications

Based on the actual hardware inventory:

| Item | Component | Model / Spec | Interface to MCU | Electrical Specs | Role in AgroSmart 2.0 |
|---|---|---|---|---|---|
| 1 | **Main Controller** | EWS All-in-One Arduino Mega IoT Grove Kit (ATmega2560) | Direct Grove Sockets & Onboard Breakouts | 5V VCC, 16MHz, 256KB Flash, 8KB SRAM, 4KB EEPROM | Core brain: Sensor acquisition, calibration, local irrigation FSM, safety interlocks |
| 2 | **Cellular Modem** | A7672S LTE Cat-1 Module | UART (Hardware Serial1: TX1 Pin 18, RX1 Pin 19) + AT Commands | 3.4V–4.2V (VCC via onboard regulator), 2A peak pulse current | Cellular uplink to Cloud Backend (HTTP POST telemetry / MQTT commands / Heartbeat) |
| 3 | **Soil Moisture Sensor** | Capacitive Soil Moisture Sensor V1.2 | Analog Voltage (Grove A0 for Zone 1; A1 for Zone 2 when second probe fitted) | 3.3V–5.5V input; Output: 1.2V (saturated) to 3.0V (dry air) | Corrosion-free volumetric water content measurement |
| 4 | **pH Sensor & Electrode** | PE-03 pH Electrode + pH Sensor Module V3.0 | Analog Voltage (Grove A2) | 5.0V VCC; BNC connector to PE-03 probe; Output: 0–4.14V (approx. 2.5V at pH 7) | Sample-based soil solution / irrigation water pH monitoring |
| 5 | **Soil/Water Temp Sensor** | DS18B20 Waterproof Probe | Dallas 1-Wire Protocol (Digital Pin D4 with 4.7kΩ pull-up) | 3.0V–5.5V; 9 to 12-bit configurable resolution (-55°C to +125°C, ±0.5°C) | Zone soil temperature & water source thermal tracking |
| 6 | **Ambient Climate Sensor** | DHT11 Sensor | Single-wire proprietary digital bus (Digital Pin D7) | 3.5V–5.5V; Temp: 0–50°C (±2°C); Humidity: 20–90% RH (±5% RH) | Ambient atmospheric temperature and relative humidity |
| 7 | **Common Water Pump** | 12V DC Submersible/Centrifugal Pump (1A rated) | Low-side Logic N-Ch MOSFET (Pin unassigned until verified) | 12.0V DC external rail (3A supply); 220Ω gate resistor, 10kΩ gate pull-down, 1N4007 flyback diode, 2A inline fuse, Common GND | Primary shared water delivery source for Vegetable and Paddy fields |
| 8 | **Zone Valves (Optional / Modular)** | Solenoid Valves 1 & 2 (12V DC Normally Closed) | Low-side N-Ch MOSFET or Relay drivers (Pins unassigned) | 12V DC external supply; 1N4007 flyback diode across coils; Shared-pipe mode supported if absent | Independent crop zone fluid path isolation (Valve 1 Vegetable, Valve 2 Paddy) |

> [!IMPORTANT]
> **Main Controller Note:** The system uses the **EWS All-in-One Arduino Mega IoT Kit** (ATmega2560), NOT an ESP32. Firmware is engineered specifically for AVR architecture (AVR libc, hardware UARTs Serial0-Serial3, 5V logic).

---

## 3. Irrigation Hydraulic Architecture & Dual-Zone Control

```
                         +--------------------+
                         |    Water Source    |
                         | (Well / Reservoir) |
                         +---------+----------+
                                   |
                                   | [Suction Pipe]
                                   v
                         +--------------------+
                         | Common Water Pump  |
                         +---------+----------+
                                   |
                             [Check Valve]
                                   |
                         +---------+----------+
                         | Shared Main Line   |
                         +---------+----------+
                                   |
                         +---------+----------+
                         |  Two-Way Manifold  |
                         +----+----------+----+
                              |          |
                              v          v
                        [Valve 1]     [Valve 2]
                     (Vegetable Zone) (Paddy Zone)
                              |          |
                              v          v
                        Vegetable      Paddy
                          Field        Field
```

### Hydraulic State Matrix & Operational Policies

1. **Deadhead Prevention:** Under no circumstance may the pump run while both Valve 1 and Valve 2 are closed.
2. **Valve-Before-Pump Sequencing:** 
   - Starting irrigation: Open target zone valve -> Delay $T_{\text{valve\_settle}}$ (1500 ms) -> Start Pump Relay.
   - Stopping irrigation: Stop Pump Relay -> Delay $T_{\text{pump\_spin\_down}}$ (1000 ms) -> Close target zone valve.
3. **Sequential Zone Scheduling (Default Policy):**
   - If both Vegetable and Paddy zones request irrigation simultaneously, the system prioritizes the zone with the greatest moisture deficit ($\Delta M = M_{\text{threshold}} - M_{\text{current}}$) or follows configured priority (`PRIORITY_VEGETABLE` / `PRIORITY_PADDY`).
   - The second zone is queued into `PENDING_QUEUE`.
   - After Zone 1 completes its cycle, a mandatory `INTER_ZONE_COOLDOWN` (e.g. 180 seconds) is enforced to allow pump motor thermal dissipation and pressure relief before Zone 2 commences.
4. **Shared Single-Pipe Fallback Mode:**
   - If the physical installation lacks independent valves (single unbranched line), the firmware and UI switch into `SHARED_IRRIGATION_MODE`. In this mode, no claim of independent zone volume or moisture delivery is made, and telemetry explicitly tags all water distribution as shared.

---

## 4. Sensor Interfacing, Signal Processing & Calibration

### 4.1. Capacitive Soil Moisture Sensor V1.2
- **Operating Principle:** Dielectric permittivity measurement of soil using high-frequency resonance. Corrosion-resistant compared to resistive probes.
- **ADC Sampling:** 10-bit AVR ADC (0 to 1023, where 1023 = 5.0V).
- **Calibration Formula:**
  $$\text{Moisture} (\%) = \text{clamp}\left( \frac{\text{ADC}_{\text{dry}} - \text{ADC}_{\text{raw}}}{\text{ADC}_{\text{dry}} - \text{ADC}_{\text{wet}}} \times 100\%,\ 0\%,\ 100\% \right)$$
  - Default factory values: $\text{ADC}_{\text{dry}} \approx 780$ (in air), $\text{ADC}_{\text{wet}} \approx 320$ (in water).
- **Fault Detection:**
  - If $\text{ADC}_{\text{raw}} > 980$: Sensor disconnected or open circuit $\rightarrow$ Set status `ERROR_DISCONNECTED`.
  - If $\text{ADC}_{\text{raw}} < 150$: Probe short-circuit $\rightarrow$ Set status `ERROR_SHORT_CIRCUIT`.

### 4.2. PE-03 pH Electrode & Signal Conditioning Module V3.0
- **Operating Principle:** Combination glass electrode generating mV output proportional to hydrogen ion activity ($E = E_0 - \frac{2.303 RT}{F} \text{pH}$).
- **Signal Conditioning:** Amplifies mV potential around a 2.5V reference offset.
- **Two/Three-Point Calibration Equation:**
  $$V_{\text{in}} = \text{ADC}_{\text{raw}} \times \left( \frac{5.00}{1024.0} \right)$$
  $$\text{pH} = 7.00 + \frac{V_{\text{in}} - V_{\text{neutral\_7.0}}}{S_{\text{slope}}}$$
  - Buffer points: pH 4.01, pH 7.00, pH 10.01 stored in EEPROM with calibration timestamp.
- **Classification:** Categorized as **sample-based solution measurement**. If used in soil, requires standard 1:2.5 or 1:5 soil-to-distilled-water slurry extraction.

### 4.3. DS18B20 Digital Temperature Probe
- **Protocol:** Dallas Semiconductor 1-Wire bus with 4.7kΩ pull-up resistor.
- **Resolution:** Configured for 11-bit ($0.125^\circ\text{C}$ step, 375 ms conversion).
- **Integrity Check:** Hardware 8-bit CRC polynomial ($X^8 + X^5 + X^4 + 1$). Readings with CRC mismatch or reporting exactly $+85.0^\circ\text{C}$ (power-on reset default indicating missed conversion) are flagged invalid.

### 4.4. DHT11 Ambient Temperature & Humidity
- **Protocol:** Custom single-bus bidirectional protocol (80µs pull-low handshake, followed by 40 bits of data).
- **Checksum Validation:**
  $$\text{Byte}_4 = (\text{Byte}_0 + \text{Byte}_1 + \text{Byte}_2 + \text{Byte}_3) \pmod{256}$$
- **Rate Limit:** Polled at maximum once every 2.5 seconds to avoid self-heating.

---

## 5. Embedded Irrigation State Machine & Safety Interlocks

```
                    +--------------------+
                    |       RESET        |
                    +---------+----------+
                              | Init outputs LOW
                              v
                    +--------------------+
      +------------>|        IDLE        |<------------+
      |             +---------+----------+             |
      |                       |                        |
      | Zone Request Valid    | Zone Request Valid     | Timeout / Target Met
      | (Vegetable)           | (Paddy)                |
      v                       v                        |
+---------------+       +---------------+              |
| START_DELAY_V |       | START_DELAY_P |              |
| Open Valve 1  |       | Open Valve 2  |              |
+-------+-------+       +-------+-------+              |
        | 1.5s                  | 1.5s                 |
        v                       v                      |
+---------------+       +---------------+              |
|  IRRIGATING_V |       |  IRRIGATING_P |              |
|   Pump: ON    |       |   Pump: ON    |              |
+-------+-------+       +-------+-------+              |
        |                       |                      |
        | Stop Trigger          | Stop Trigger         |
        v                       v                      |
+---------------+       +---------------+              |
|  STOP_PUMP_V  |       |  STOP_PUMP_P  |              |
|   Pump: OFF   |       |   Pump: OFF   |              |
+-------+-------+       +-------+-------+              |
        | 1.0s                  | 1.0s                 |
        v                       v                      |
+---------------+       +---------------+              |
| CLOSE_VALVE_V |       | CLOSE_VALVE_P |--------------+
+-------+-------+       +---------------+
        |
        v
+---------------+
|   COOLDOWN    | (Minimum OFF-time before next cycle)
+---------------+
```

### The 10 Mandatory Pump Safety Rules

1. **Zero-Zone Inhibit:** Never start the pump if no valid zone is requesting water.
2. **Sensor Fault Lockout:** Invalidate automatic irrigation if the zone's primary soil moisture sensor fails disconnected, shorted, or out-of-range ($0\% < M < 100\%$).
3. **Valve-Before-Pump Lead:** Open the designated zone valve at least 1500 ms before energizing the pump relay.
4. **Pump-Before-Valve Lag:** De-energize the pump relay at least 1000 ms before closing the zone valve.
5. **Instantaneous Emergency Stop:** Emergency stop de-energizes the pump immediately ($<10\text{ ms}$ ISR/loop priority), closes all valves after a 1000 ms bleed delay, and locks the state machine until manually cleared.
6. **Maximum Run Time Enforcement (Watchdog):** Hard limit per cycle (Vegetable: default 30 min; Paddy: default 60 min). Upon timeout, the zone enters `FAULT_TIMEOUT` lockout.
7. **Minimum Off-Time (Cycle Anti-Flapping):** Enforces a minimum rest duration (10–15 min) between pump operations to prevent contactor and pump motor overheating.
8. **Power-On Safe State:** On boot/MCU reset, all digital outputs (`PUMP_PIN`, `VALVE1_PIN`, `VALVE2_PIN`) are explicitly initialized to `LOW` before peripheral setup.
9. **Autonomous Local Fallback:** In the event of A7672S cellular loss, SIM disconnect, or cloud server timeout, the Arduino Mega continues normal automatic irrigation using active local thresholds.
10. **Zero Cloud Authority over Safety:** The cloud cannot override hardware safety interlocks (such as running past `maxRuntime` or running with closed valves).

---

## 6. End-to-End Communication Architecture

```
[Sensors]
   │
   ▼
[Arduino Mega 2560]
   │ UART (AT commands)
   ▼
[A7672S Cellular 4G Module]
   │ 4G LTE Network
   ├──────────────────────────────┬──────────────────────────────┐
   │ HTTP POST /telemetry         │ MQTT /cmd & /status          │ WebSocket /live
   ▼                              ▼                              ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   FastAPI Cloud Backend Service                        │
│                                                                        │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │
│  │ Device & Auth Svc│  │  Telemetry Store │  │ Command & Ack Engine │  │
│  └────────┬─────────┘  └────────┬─────────┘  └──────────┬───────────┘  │
│           │                     │                       │              │
│           └─────────────────────┼───────────────────────┘              │
│                                 ▼                                      │
│                      [PostgreSQL 16 Database]                          │
└─────────────────────────────────┬──────────────────────────────────────┘
                                  │ HTTPS REST / WSS
                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│             AgroSmart 2.0 Mobile Application (React Native/Expo)       │
│                                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │ Zustand Store│  │TanStack Query│  │ Gifted Charts│  │Demo Engine │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Telemetry Payload Schema (Device $\rightarrow$ Backend)
```json
{
  "device_id": "AGRO-MEGA-001",
  "firmware_version": "2.0.0",
  "timestamp": "2026-11-18T07:54:33Z",
  "uptime_seconds": 86420,
  "signal_csq": 24,
  "sensors": {
    "vegetable": {
      "soil_moisture_pct": 34.2,
      "soil_moisture_raw": 512,
      "soil_moisture_valid": true,
      "ph": 6.45,
      "soil_temp_c": 26.8,
      "soil_temp_valid": true
    },
    "paddy": {
      "soil_moisture_pct": 68.5,
      "soil_moisture_raw": 372,
      "soil_moisture_valid": true,
      "ph": 6.80,
      "soil_temp_c": 27.2,
      "soil_temp_valid": true
    },
    "ambient": {
      "air_temp_c": 31.4,
      "air_humidity_pct": 64.0,
      "valid": true
    }
  },
  "actuators": {
    "pump": {
      "state": "ON",
      "mode": "AUTO",
      "current_run_seconds": 482,
      "daily_runtime_seconds": 3240,
      "reported_by_device": true
    },
    "valves": {
      "valve_1_vegetable": "OPEN",
      "valve_2_paddy": "CLOSED"
    }
  },
  "system_flags": {
    "active_zone": "vegetable",
    "emergency_stop": false,
    "sensor_fault": false,
    "shared_pipe_mode": false
  }
}
```

### Command Handshake Flow (Mobile $\rightarrow$ Backend $\rightarrow$ Device $\rightarrow$ Confirm)
1. **Initiation:** Mobile app issues command with unique UUID:  
   `POST /api/v1/devices/{id}/commands` with `{ "command_id": "cmd-8f3a", "action": "PUMP_START", "zone": "vegetable", "duration_min": 15 }`
2. **Pending State:** Backend records command as `PENDING`, pushes to MQTT topic `agrosmart/{id}/commands`.
3. **Device Ack:** Arduino Mega parses command via A7672S, verifies safety interlocks:
   - If interlocks pass: Arduino Mega transmits `ACK` via UART `{"cmd_id": "cmd-8f3a", "status": "EXECUTING"}`.
   - If interlocks fail: Arduino Mega transmits `NACK` with error code `{"cmd_id": "cmd-8f3a", "status": "REJECTED", "reason": "VALVE_1_FAULT"}`.
4. **Hardware Confirmation:** Once the valve settles and pump relay closes, the controller publishes confirmed state `CONFIRMED`. Mobile app UI updates from "Sending..." to "Active (Confirmed by Hardware)".

---

## 7. Water Usage Accounting Model

Since the physical inventory includes **one common pump** without an in-line pulse flow meter:
- **Calculation Formula:**
  $$\text{Volume (Litres)} = \text{Pump Runtime (minutes)} \times Q_{\text{calibrated}} (\text{L/min})$$
  - Default calibrated flow rate: $Q_{\text{calibrated}} = 12.0\text{ L/min}$ (customizable per installation in settings).
- **Zone Accounting:**
  - When Valve 1 is open and Valve 2 closed: Runtime is attributed to **Vegetable Field**.
  - When Valve 2 is open and Valve 1 closed: Runtime is attributed to **Paddy Field**.
  - If operated in unbranched shared mode: Runtime is attributed to **Shared Pool**.
- **Transparency Mandate:** The UI and API explicitly tag all calculated volumes with `isEstimated: true` and `dataSource: "calculated"`.

---

## 8. Mobile Application UI/UX Design System Specification

### 8.1. Color Palette
- **Primary Forest Green:** `#1A5C2A` (Dominant brand header, splash background)
- **Primary Natural Green:** `#2E7D32` (Active vegetable cards, primary CTA buttons)
- **Primary Light Green:** `#4CAF50` (Optimal status indicators, toggle active)
- **Accent Soft Blue:** `#2196F3` (Paddy field badges, moisture gauges, water metrics)
- **Accent Deep Water Blue:** `#1565C0` (Paddy headers, saturated indicators)
- **Accent Natural Yellow/Amber:** `#F9A825` / `#FF8F00` (Pump running badge, dry warning)
- **Surface / Neutral:**
  - Pure White `#FFFFFF` (Card surfaces, clean text inverse)
  - Background Light Gray-Green `#F5F7F5` (Screen backgrounds)
  - Dark Charcoal `#1B1B1B` (High contrast primary typography)
  - Muted Charcoal `#4A4A4A` (Secondary labels, metadata)
  - Border/Divider `#E0E0E0` / `#EEEEEE`
- **Safety / Semantic:**
  - Emergency Stop Red: `#D32F2F`
  - Success Green: `#2E7D32`
  - Warning Amber: `#E65100`

### 8.2. Typography Hierarchy
System font family with clear optical weight distribution:
- **Display Large:** 40px / 700 bold (Splash & hero statistics)
- **Headline Large:** 24px / 700 bold (Screen headers, zone titles)
- **Headline Medium:** 20px / 600 semi-bold (Section card titles)
- **Title Large:** 16px / 600 semi-bold (Sub-headers, list group headers)
- **Body Large:** 16px / 400 regular (Primary reading text, inputs)
- **Body Medium:** 14px / 400 regular (Descriptions, secondary indicators)
- **Label Medium:** 12px / 500 medium (Status badges, pill tags)
- **Caption:** 10px / 400 regular (Timestamps, estimated disclaimers)

### 8.3. Spacing, Radii & Elevations
- **Spacing Scale:** xs: 4px, sm: 8px, md: 12px, base: 16px, lg: 20px, xl: 24px, 2xl: 32px
- **Border Radii:** sm: 8px, md: 12px, lg: 16px, xl: 20px, full: 9999px
- **Elevations (Shadows):**
  - Card Shadow (`md`): `elevation: 3`, `shadowOffset: { width: 0, height: 2 }`, `shadowOpacity: 0.08`, `shadowRadius: 6`
  - Floating Action / Emergency Button (`lg`): `elevation: 6`, `shadowOpacity: 0.14`, `shadowRadius: 12`

### 8.4. Bottom Navigation Structure (5 Core Tabs)
1. **Home (`/`):** Comprehensive farm health, current weather, active irrigation summary, quick action bar, demo mode toggle.
2. **Farm (`/farm`):** Detailed independent zone cards (Vegetable Field vs. Paddy Field), crop presets, per-zone sensor summaries.
3. **Irrigation (`/irrigation`):** Shared pump status, valve controls, auto/manual mode switch, scheduling table, emergency STOP.
4. **Analytics (`/analytics`):** Historical moisture/pH/temperature trends (Gifted Charts), water consumption breakdown by zone and time period.
5. **Profile (`/profile`):** Device connectivity, hardware diagnostics, sensor calibration wizard, farmer profile settings.

---

## 9. 14 Target Mobile Application Screens

| Screen # | Screen Route | Purpose | Key UI Components |
|---|---|---|---|
| 1 | `(auth)/splash` | Brand launch & auth check | Forest green gradient, AgroSmart logo, version tag, auth route check |
| 2 | `(auth)/login` | Farmer login & registration | Phone/email auth, password toggle, quick demo-mode bypass |
| 3 | `(tabs)/index` | Home Dashboard | Live farm status, quick metrics grid, pump widget, live/demo banner |
| 4 | `(tabs)/farm` | Farm Overview | Dual zone status cards, soil comparison, quick schedule overview |
| 5 | `zone-vegetable` | Vegetable Field Monitoring | Moisture gauge, pH gauge, soil temp, irrigation status, water used |
| 6 | `zone-paddy` | Paddy Field Monitoring | Flood-level moisture gauge, water temp, soil condition, valve state |
| 7 | `sensor-detail` | Sensor Monitoring & Diagnostics | Detailed telemetry list, raw ADC readings, calibration status, error flags |
| 8 | `(tabs)/irrigation` | Smart Irrigation Control | Auto/Manual toggle, threshold sliders, schedule list, run timer |
| 9 | `pump-control` | Shared Pump Management | Large pump state indicator, Valve 1/2 state, interlock status, Emergency STOP |
| 10 | `water-management` | Water Management & Accounting | Daily/weekly/monthly estimated consumption, zone comparison bar chart |
| 11 | `(tabs)/analytics` | Analytics & Reports | Multi-day line charts (Gifted Charts), moisture dry-down curve, export PDF |
| 12 | `notifications` | Notification Center | Critical alerts (dry soil, pump timeout, sensor fault), filter by read/unread |
| 13 | `device-connectivity`| Device Connectivity Monitor | A7672S signal strength (CSQ), cellular operator, IP, MQTT ping, heartbeat |
| 14 | `(tabs)/profile` | Settings, Calibration & Profile | Farm profile, calibration wizards (dry/wet, pH 4/7/10), demo toggle |

---

## 10. Implementation Phase Roadmap

```
PHASE 1: Project inspection, architecture, Expo setup and design system. [CURRENT]
PHASE 2: Complete mobile UI and navigation (all 14 screens & routes).
PHASE 3: Demo sensor data and interactive dashboards.
PHASE 4: Backend, database and API development (FastAPI + PostgreSQL).
PHASE 5: Arduino sensor integration (AVR drivers for Grove sensors).
PHASE 6: Pump and two-zone valve integration (electrical isolation, sequencing).
PHASE 7: Automatic irrigation state machine and safety testing.
PHASE 8: Live communication and offline operation (A7672S AT commands, MQTT).
PHASE 9: Complete application testing and Android production build.
```

---
*End of Technical Architecture Document.*
