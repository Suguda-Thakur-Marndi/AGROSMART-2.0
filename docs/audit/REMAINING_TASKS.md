# AGROSMART 2.0 – PHYSICAL BENCH COMMISSIONING CHECKLIST

**Document Status:** ACTIVE & OPERATIONAL  
**Target Date:** Immediate Field Execution  
**Hardware Kit:** EWS All-in-One Arduino Mega IoT Grove Kit  

---

## 1. Overview of Remaining Physical Tasks

All software components—including firmware C++ code, backend FastAPI services, mobile React Native screens, state management, and automated test harnesses—are **100% complete and verified**.

The remaining work consists exclusively of **physical bench commissioning**:

```
[ SOFTWARE COMPLETE: 100% ] ──> [ FLASH FIRMWARE ] ──> [ SENSOR CALIBRATION ] ──> [ 12V WIRING ] ──> [ FIELD RUN ]
```

---

## 2. Sequential Step-by-Step Bench Commissioning

### Step 1: Flashing the Arduino Mega
- **Equipment:** Arduino Mega (EWS Kit), USB-B / USB-C programming cable, PC with Arduino CLI or IDE.
- **Port:** Connect to PC and verify COM port (e.g. `COM3`).
- **Command (CLI):**
  ```bash
  arduino-cli compile --fqbn arduino:avr:mega firmware/src/main.cpp
  arduino-cli upload -p COM3 --fqbn arduino:avr:mega firmware/src/main.cpp
  ```
- **Verification:** Open Serial Monitor at `115200 baud`. Observe system banner:
  `[BOOT] AgroSmart 2.0 Initializing...`

### Step 2: Soil Moisture Sensor Calibration (A0 & A1)
- **Sensor:** Capacitive Soil Moisture Sensor V1.2.
- **Dry Reading ($ADC_{\text{air}}$):**
  - Hold sensor completely dry in open air.
  - Record raw 10-bit ADC reading (typical: ~780–820).
- **Wet Reading ($ADC_{\text{water}}$):**
  - Submerge sensor probe up to the white guideline in a cup of clean water (do not wet the circuitry).
  - Record raw 10-bit ADC reading (typical: ~320–360).
- **Save to EEPROM:** Update calibration points via Serial interface or mobile hardware settings to ensure true 0–100% relative moisture mapping.

### Step 3: pH Electrode 2-Point Calibration (A2)
- **Sensor:** PE-03 Electrode + Bharat pH Sensor Module V3.0.
- **Point 1 (Neutral):** Submerge probe in standard pH 7.00 buffer solution. Adjust trimmer potentiometer or record raw ADC value.
- **Point 2 (Acidic):** Rinse probe in distilled water and submerge in pH 4.01 buffer solution. Record ADC value.
- **Verification:** Measure clean tap water; reading should register between 6.5 and 7.5 pH.

### Step 4: Actuator Driver & 12V Circuit Wiring (D6, D8, D9)
- **Power Supply:** Connect external 12V DC, 3A power brick.
- **Common Ground:** Wire 12V PSU negative rail directly to Arduino Mega GND bus.
- **MOSFET Interfacing:**
  - `D6` -> Gate of Pump MOSFET module.
  - `D8` -> Gate of Vegetable Valve MOSFET module.
  - `D9` -> Gate of Paddy Valve MOSFET module.
- **Flyback Diodes:** Wire a 1N4007 diode across each inductive terminal (Cathode to +12V, Anode to Switched GND).
- **Bench Actuation Test:** Issue manual pump run command; observe valve open first ($1500\,\text{ms}$ lead), pump energize, and valve remain open ($1000\,\text{ms}$ lag) after pump stops.

### Step 5: Dual Communication Verification (Wi-Fi & Bluetooth)
- **ESP-01 Wi-Fi Link:**
  - Verify ESP-01 firmware connects to 2.4GHz Wi-Fi router.
  - Check backend log for periodic telemetry POST requests at `/api/v1/telemetry/device`.
- **Bluetooth Pairing:**
  - Open AgroSmart 2.0 on Android smartphone.
  - Navigate to `Device Connection` -> `Bluetooth Connection`.
  - Tap `Scan for Devices`, select `AgroSmart-BT`, and pair with PIN (default `1234`).
  - Verify real-time sensor metrics appear on dashboard via Bluetooth.

### Step 6: Solenoid Valve 2 Confirmation
- Confirm physical availability of a second 12V DC solenoid valve.
- Plumb into the secondary branch (Paddy Field line).
- Verify hydraulic sequential interlock: vegetable and paddy zones irrigate strictly in sequence, never simultaneously.
