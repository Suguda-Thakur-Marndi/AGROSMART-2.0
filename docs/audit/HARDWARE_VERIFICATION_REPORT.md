# AGROSMART 2.0 – HARDWARE INTEGRATION & BENCH VERIFICATION REPORT (STAGE 2)

**Report Date:** November 18, 2026  
**Auditor:** Senior Embedded Systems & Hardware QA Engineer  
**Hardware Kit:** EWS All-in-One Arduino Mega IoT Grove Kit (ATmega2560 @ 16MHz)  

---

## 1. Hardware Bill of Materials (BOM) & Status Matrix

| Component | Target Interface | Pin / Port | Operational Voltage | Software Verification | Hardware Verification | Detailed Findings & Pin Reality |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **ATmega2560 MCU** | Core Controller | N/A | 5.0V DC | **VERIFIED** | **HARDWARE PENDING** | AVR-GCC compiles; USB flashing via avrdude pending on physical board. |
| **Capacitive Moisture 1** | Analog Voltage | `A0` (Pin 54) | 3.3V - 5.0V | **SOFTWARE VERIFIED** | **HARDWARE PENDING** | Moving average filter verified; physical dry air ($ADC_{\text{air}}$) and wet ($ADC_{\text{water}}$) zero points pending. |
| **Capacitive Moisture 2** | Analog Voltage | `A1` (Pin 55) | 3.3V - 5.0V | **SOFTWARE VERIFIED** | **HARDWARE PENDING** | Paddy basin sensor; bench immersion test pending. |
| **Bharat pH Module V3.0** | Analog Voltage | `A2` (Pin 56) | 5.0V DC | **SOFTWARE VERIFIED** | **HARDWARE PENDING** | Conditioned mV curve verified; physical potentiometer tuning in pH 7.00 buffer pending. |
| **DS18B20 Temp Probe** | Dallas 1-Wire | `D7` (Pin 7) | 5.0V DC | **SOFTWARE VERIFIED** | **HARDWARE PENDING** | CRC-8 polynomial verified; physical 4.7kΩ pull-up resistor and ice-water check pending. |
| **DHT11 Canopy Sensor** | Single-Wire Digital| `D4` (Pin 4) | 5.0V DC | **SOFTWARE VERIFIED** | **HARDWARE PENDING** | Checksum algorithm verified; physical 2000 ms sampling interval check pending. |
| **Main Irrigation Pump** | MOSFET Gate | `D6` (Pin 6) | 12V DC, 1.0A | **SOFTWARE VERIFIED** | **HARDWARE PENDING** | **Software Configuration**: Grove D6 port requires external IRLZ44N MOSFET board, 220Ω series resistor, 10kΩ pull-down, and 1N4007 flyback diode. |
| **Vegetable Solenoid** | Switched 12V Line | `D8` (Pin 8) | 12V DC, 0.4A | **SOFTWARE VERIFIED** | **HARDWARE PENDING** | **Software Configuration**: Grove D8 port requires external driver module with 1N4007 flyback diode. |
| **Paddy Solenoid** | Switched 12V Line | `D9` (Pin 9) | 12V DC, 0.4A | **SOFTWARE VERIFIED** | **BLOCKED / NOT HARDWARE VERIFIED** | **Physical Availability Unconfirmed**: If second physical valve is missing from bench, Zone 2 actuation cannot function. |
| **ESP8266 Wi-Fi Module**| UART Serial1 | `Pin 18 (TX1), 19 (RX1)`| 3.3V Regulated | **SOFTWARE VERIFIED** | **HARDWARE PENDING** | AT-command parser verified in simulation; physical UART communication to ESP8266 pending. |

---

## 2. Critical Pin & Hardware Discrepancy Findings

### 2.1 Pin Assignments D6, D8, D9 (Software vs Physical Hardware)
- **Software Definition:**
  - `PIN_ACTUATOR_PUMP_MOSFET = 6`
  - `PIN_ACTUATOR_VALVE_VEG = 8`
  - `PIN_ACTUATOR_VALVE_PADDY = 9`
- **Physical Reality:** These pin numbers correspond to the digital header pins on the EWS Arduino Mega Grove shield. They are **not hardwired on-chip power switches**. An ATmega2560 GPIO pin is rated for a maximum of $20\,\text{mA}$ Continuous ($40\,\text{mA}$ Absolute Maximum).
- **Mandatory Driver Circuit:** Connecting the 12V 1A pump or solenoid coils directly to pins D6, D8, or D9 will permanently destroy the microcontroller. External N-channel logic-level MOSFETs (e.g. IRLZ44N) or isolated relay breakout modules **MUST** be placed between the Arduino GPIO pins and the 12V actuators.

### 2.2 Solenoid Valve Physical Availability & Dual-Zone Feasibility
- **Finding:** The reference hardware documentation (`Smart_HydroponicSystem_with_IoT-main`) only specifies a single valve relay (`valveRelayPin = 7`) and single pump relay (`pumpRelayPin = 6`).
- **Audit Determination:** Dual independent zone irrigation requires two distinct, physically connected 12V solenoid valves. Because a second physical valve has not been confirmed on the user's bench:
  - **Single-zone irrigation (Common Pump + Valve 1):** HARDWARE PENDING.
  - **Independent dual-zone irrigation (Valve 1 + Valve 2):** **BLOCKED / NOT HARDWARE VERIFIED**.

### 2.3 Android Client on Physical Hardware
- **Finding:** The mobile application was launched on a physical Android device, but failed to load the interface due to an `InternalError: Cannot read properties of undefined (reading 'transformFile')` Metro bundler crash on port 8082.
- **Resolution:** Hermes Android export succeeded with 1,923 modules bundled. End-to-end user interface testing on the physical phone screen is **HARDWARE PENDING** upon connecting to port 8081.

### 2.4 Physical Wi-Fi Communication
- **Finding:** Wi-Fi driver functions (`connectAP`, `sendTelemetry`) operate using test stubs when compiled on host PC (`#ifndef ARDUINO`).
- **Determination:** Hardware `Serial1` AT communication with the physical ESP8266 module is **HARDWARE PENDING**.

---

## 3. Physical Safety & Pre-Power Verification Requirements

Before applying 12V DC power to the actuator rail:
1. **Galvanic Isolation:** Confirm that +12V is nowhere connected to the Arduino Mega +5V rail.
2. **Flyback Diodes:** Verify 1N4007 diodes are installed across inductive loads (cathode to +12V, anode to MOSFET drain).
3. **Fuse Protection:** Confirm a 2.0A inline fuse is present on the 12V positive rail.
4. **Hydraulic Interlock:** Verify that the pump cannot physically spin up until at least one solenoid valve is physically energized and open.
