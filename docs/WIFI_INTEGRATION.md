# AgroSmart 2.0 – Wi-Fi & REST API Integration Guide

## 1. Overview
The AgroSmart 2.0 system uses **Wi-Fi ONLY** via the onboard ESP8266 module on Arduino Mega Hardware `Serial1` (Pins 18 TX1, 19 RX1) running at 115200 baud. The cellular A7672S module is disabled.

---

## 2. AT Command Initialization Sequence

The Arduino Mega controls the ESP8266 through standard AT commands during boot:

```
[Mega] ---> AT+RST
[ESP]  <--- ready
[Mega] ---> AT+CWMODE=1          (Station Mode)
[ESP]  <--- OK
[Mega] ---> AT+CWJAP="SSID","PASSWORD"
[ESP]  <--- WIFI CONNECTED / WIFI GOT IP
```

---

## 3. Telemetry Payload Contract

Every 10 seconds, the Arduino Mega formats and dispatches a compact JSON telemetry packet over TCP to the FastAPI backend:

### HTTP Request:
- **Method:** `POST`
- **Path:** `/api/v1/telemetry`
- **Header:** `X-Device-Key: agrosmart-device-key-2024`
- **Content-Type:** `application/json`

### Payload:
```json
{
  "device_id": "agrosmart-mega-01",
  "veg_moisture": 42.5,
  "paddy_moisture": 68.0,
  "ph": 6.85,
  "soil_temp": 24.5,
  "air_temp": 29.0,
  "air_humidity": 72.0,
  "pump_active": false,
  "veg_valve": false,
  "paddy_valve": false,
  "irrigation_mode": "auto",
  "active_zone": "none",
  "error_bitmask": 0
}
```

---

## 4. Offline Telemetry Ring Buffer

If the farm Wi-Fi network drops, the firmware's `WifiEsp8266` driver automatically diverts telemetry packets into a static circular ring buffer holding up to 20 samples (representing ~3.5 minutes of continuous monitoring).
When Wi-Fi reconnects, the driver flushes the backlog to the backend in FIFO order without losing historical data.
