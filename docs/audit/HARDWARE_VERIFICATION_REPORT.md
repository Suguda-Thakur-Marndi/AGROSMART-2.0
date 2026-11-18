# AGROSMART 2.0 – HARDWARE VERIFICATION & CIRCUIT AUDIT REPORT

**Inspection Date:** November 19, 2026  
**Auditor Roles:** Senior Embedded Hardware Engineer, IoT Integration Specialist  
**Target Hardware:** EWS All-in-One Arduino Mega IoT Grove Kit  

---

## 1. Physical Board Inspection Summary

A comprehensive visual and circuit audit of the physical **EWS All-in-One Arduino Mega IoT Grove Kit** was performed. The inspection revealed three RF/communication modules, a central ATmega2560 MCU, Grove interface headers, and specific electrical requirements for high-current actuation.

```
       +-----------------------------------------------------------+
       |               EWS ARDUINO MEGA IOT GROVE KIT              |
       |                                                           |
       |  [ USB DEBUG ]               [ ATmega2560 16MHz MCU ]     |
       |  Serial0 (Pins 0/1)                                       |
       |                                                           |
       |  [ ESP-01 ESP8266 ]          [ BLUETOOTH MODULE ]         |
       |  Serial1 (Pins 18/19)        Serial2 (Pins 16/17)         |
       |  115200 Baud                 9600 Baud                    |
       |                                                           |
       |  [ A7672S LTE Cat-1 ]        [ GROVE DIGITAL / ANALOG ]   |
       |  Serial3 (Pins 14/15)        A0, A1, A2, D4, D6, D7, D8, D9|
       |  *SOFTWARE DISABLED*                                      |
       +-----------------------------------------------------------+
```

---

## 2. Microcontroller UART Peripherals & Circuit Independence

The ATmega2560 incorporates four completely independent hardware USART engines. Each peripheral is wired to a dedicated subsystem on the EWS board:

| Serial Port | Hardware Pins | Connected Subsystem | Baud Rate | Active Operational Status |
| :--- | :---: | :--- | :---: | :--- |
| **`Serial0`** | Pins 0 (RX), 1 (TX) | USB-to-UART / Serial Monitor | 115200 | Active for flashing and runtime diagnostics |
| **`Serial1`** | Pins 19 (RX1), 18 (TX1)| ESP-01 (ESP8266 Wi-Fi) | 115200 | **Active Primary Wi-Fi Telemetry & REST API** |
| **`Serial2`** | Pins 17 (RX2), 16 (TX2)| Dedicated Bluetooth Module | 9600 | **Active Local Direct Pairing & Offline Control** |
| **`Serial3`** | Pins 15 (RX3), 14 (TX3)| SIMCom A7672S Cellular | 115200 | **Explicitly Disabled in Firmware** (No cellular dependency) |

> [!NOTE]
> Because each communication module is wired to its own dedicated hardware UART pins, there is zero pin contention or bus collision. Software command arbitration between Wi-Fi and Bluetooth is managed strictly by the `ConnectionCoordinator` class.

---

## 3. Sensor Pin Verification & Signal Conditioning

| Sensor Function | Physical Pin | Hardware Interface | Required Range / Spec | Signal Conditioning & Calibration Status |
| :--- | :---: | :---: | :---: | :--- |
| **Vegetable Soil Moisture** | `A0` | Analog (0–5V) | 0–100% Relative | Capacitive V1.2. Dry/Wet ADC calibration required. |
| **Paddy Soil Moisture** | `A1` | Analog (0–5V) | 0–100% Relative | Capacitive V1.2. Dry/Wet ADC calibration required. |
| **Bharat pH Sensor** | `A2` | Analog (0–5V) | 0–14.0 pH | PE-03 Electrode. 2-Point buffer calibration (4.01/7.00) required. |
| **DHT11 Air Temp / Hum** | `D4` | Digital GPIO | 20–90% RH, 0–50°C | Single-wire bit-banged protocol with 10kΩ pull-up resistor. |
| **DS18B20 Water Temp** | `D7` | Digital 1-Wire | -55°C to +125°C | Waterproof probe. Dedicated 4.7kΩ pull-up resistor to 5V rail. |

---

## 4. Actuator Driver & Power Requirements

The ATmega2560 Grove digital output pins (`D6`, `D8`, `D9`) deliver 5V logic at a maximum current of 20–40mA. They **must not** be connected directly to inductive actuators.

| Actuator Function | Signal Pin | Required Operating Voltage | Current Draw | Interfacing Driver Required |
| :--- | :---: | :---: | :---: | :--- |
| **Shared Water Pump** | `D6` | 12V DC | 1.0A | Logic-level N-MOSFET (e.g. IRLZ44N) or 10A Relay Module |
| **Vegetable Drip Valve** | `D8` | 12V DC | 0.5A | Logic-level N-MOSFET or Relay Module |
| **Paddy Flood Valve** | `D9` | 12V DC | 0.5A | Logic-level N-MOSFET or Relay Module |

### Mandatory Electrical Safeguards:
1. **Flyback Diodes:** A 1N4007 diode must be wired across the positive (+12V) and switched ground terminals of each inductive coil (Cathode to +12V, Anode to MOSFET drain).
2. **Common Star Ground:** The 12V DC power supply ground and the Arduino Mega GND must be tied together at a single point to prevent ground bounce and ADC sensor noise.
3. **Power Fuse:** An inline 2.0A fast-acting fuse should protect the +12V power supply rail.

---

## 5. Physical Solenoid Valve Availability Verification

- **Solenoid Valve 1 (Vegetable Branch, `D8`):** Physically available on test bench.
- **Solenoid Valve 2 (Paddy Branch, `D9`):** Not physically verified on test bench.
- **Operational Impact:** Dual-zone independent hydraulic actuation is fully implemented and protected in firmware/software, but remains **HARDWARE PENDING** until a second physical 12V solenoid valve is plumbed and wired.

---

## 6. Physical Commissioning Readiness

| Commissioning Step | Prerequisite | Status |
| :--- | :--- | :---: |
| **Firmware Flashing via USB** | USB cable connected to PC COM port | **READY TO FLASH** |
| **Soil Moisture Dry/Wet ADC Calibration** | Dry soil sample and water vessel | **HARDWARE PENDING** |
| **pH Electrode Buffer Calibration** | pH 4.01 and 7.00 standard buffer solutions | **HARDWARE PENDING** |
| **12V Actuator Bench Wiring** | External 12V 3A PSU, MOSFETs, flyback diodes | **HARDWARE PENDING** |
| **Direct Wi-Fi / Bluetooth Bench Link** | Local 2.4GHz Wi-Fi AP & Android Bluetooth pairing | **HARDWARE PENDING** |
