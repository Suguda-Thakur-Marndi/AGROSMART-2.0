# AgroSmart 2.0 — Live Data Verification & Mock Data Removal Audit

**Date:** 2026-11-19  
**Status:** VERIFIED & HARDENED  
**System Version:** AgroSmart 2.0 Real-Hardware Release Candidate  

---

## 1. Executive Summary

This report certifies that **all simulated, random, and synthetic mock data generators have been completely decoupled and removed from all LIVE operational flows** across the AgroSmart 2.0 application stack:
- **Firmware:** Generates only real ADC and digital pin conversions.
- **Backend:** Ingests and persists genuine telemetry packets without synthetic injection.
- **Mobile Application:** Default operational mode is **LIVE HARDWARE MODE**. Sensor stores initialize with `null` or `--` when disconnected. No random values (`Math.random()`) are generated in live providers. Demo mode is strictly opt-in with a persistent visual badge.

---

## 2. Operational Mode Separation Architecture

### 2.1 Mode Definitions

| Characteristic | LIVE HARDWARE MODE (Default) | DEMO MODE (Explicit Opt-In) |
| :--- | :--- | :--- |
| **Default on Boot** | **YES (`DEMO_MODE_DEFAULT = false`)** | NO (Must be toggled in Settings) |
| **Visual Badge** | Live status indicator (`Live Hardware` / `Offline`) | Persistent Orange `DEMO MODE` Badge |
| **Data Source** | Real hardware (`dataSource: 'live'`) | Static agronomic presets (`dataSource: 'demo'`) |
| **Disconnected State** | Displays `--`, `No Data`, or `Sensor Offline` | Displays simulated readings |
| **Telemetry Ingestion** | ESP8266 Wi-Fi / Serial2 Bluetooth frames | Local synthetic state |
| **Actuator Control** | Dispatches real commands to hardware pins | Simulates UI switch states only |

### 2.2 Strict Zero-Mock Enforcement Verification

1. **`mobile/constants/index.ts`**:
   - `DEMO_MODE_DEFAULT` set to `false`.
   - On initial launch or app restart, the system defaults to Live Hardware Mode.

2. **`mobile/services/connection/WifiConnectionProvider.ts`**:
   - Stripped all `Math.random()` simulation generators.
   - Queries `GET /api/v1/telemetry/latest/{deviceId}` from the backend.
   - When device is offline or uncalibrated, returns null values with `isOnline: false`.

3. **`mobile/services/connection/BluetoothConnectionProvider.ts`**:
   - Stripped all synthetic interval generators.
   - Accepts real UART string frames (`$AGRO,...#` and JSON telemetry).
   - Feeds parsed sensor readings directly to `DeviceCommunicationService`.

4. **`mobile/store/sensorStore.ts`**:
   - Initial state sets sensor values to `null`.
   - Removed silent automatic fallback to `getDemoVegetableZone()` on fetch failure.
   - Explicitly records `deviceStatus: 'offline'` when no hardware frames arrive.

5. **`mobile/app/(tabs)/index.tsx`**:
   - Replaced all hardcoded values:
     - `Moisture`: Renders `${vegMoisture}%` if valid, otherwise `--`.
     - `pH`: Safe null-checked `vegPH.toFixed(1)` or `--`.
     - `Water Accounting`: Estimates volume dynamically from `pumpStatus.dailyRuntimeSeconds` (or `0 L (Est.)` when 0). Hardcoded `~240 L` only shows in explicit Demo Mode.
   - Added null-safe bounds protection in `HeroStatusCard`.

---

## 3. End-to-End Live Telemetry Flow

```
+-----------------------------------------------------------------------------------+
| PHYSICAL SENSORS                                                                  |
| • Soil Moisture V1.2 (A0/A1)   • Bharat pH V3.0 (A2)   • DS18B20 (D7) • DHT11 (D4)|
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| ARDUINO MEGA 2560 FIRMWARE                                                       |
| • Analog smoothing (10-sample window) & temperature compensation                  |
| • TelemetryBuilder compact JSON packet:                                           |
|   {"device_id":"...","vm":42,"pm":75,"ph":6.8,"st":25.4,"at":28.0,"ah":65,...}    |
+---------------------+---------------------------------------+---------------------+
                      | Serial1 (115200 baud)                 | Serial2 (9600 baud)
                      v                                       v
        +---------------------------+           +---------------------------+
        | ESP8266 Wi-Fi Module      |           | HC-05 / HM-10 Bluetooth   |
        +-------------+-------------+           +-------------+-------------+
                      | HTTP POST                             | Serial SPP / BLE
                      v                                       v
        +---------------------------+           +---------------------------+
        | FastAPI Backend           |           | Mobile Direct Connect     |
        | /api/v1/telemetry/ingest  |           | BluetoothProvider         |
        +-------------+-------------+           +-------------+-------------+
                      | REST / WS                             |
                      +-------------------+-------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| AGROSMART 2.0 ANDROID APPLICATION (Zustand Stores & Stitch UI)                    |
| • sensorStore: records real values (or `--` when offline)                         |
| • connectionStore: displays real active connection state & RSSI                   |
| • irrigationStore: monitors real pump feedback & valve interlocking               |
+-----------------------------------------------------------------------------------+
```

---

## 4. Disconnection & Fault Handling Test Matrix

| Condition | Firmware Response | Mobile App UI Response | Verified |
| :--- | :--- | :--- | :--- |
| **Moisture probe disconnected (ADC < 50)** | Sets `m_connected = false`, fault bit 0x01 | Zone card displays `Sensor Offline / --%` | YES |
| **pH probe open-circuit (ADC > 950)** | Marks pH reading invalid, fault bit 0x02 | Zone card displays `Calib Needed / --` | YES |
| **DS18B20 85°C power-on default** | Rejects packet, marks invalid | Temperature reads `--°C` | YES |
| **Wi-Fi connection drop** | Stores telemetry, Coordinator starts 30s timer | Connection banner: `Disconnected (Wi-Fi)` | YES |
| **No telemetry for > 30s during irrigation** | Coordinator triggers automatic pump shutdown | Notification: `Irrigation halted: comms lost` | YES |

---

## 5. Certification

All mock data injection in live execution paths has been successfully eradicated. AgroSmart 2.0 strictly operates on genuine hardware telemetry in Live Mode.
