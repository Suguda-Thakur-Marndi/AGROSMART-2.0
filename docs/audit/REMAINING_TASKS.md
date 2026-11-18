# AGROSMART 2.0 – REMAINING BLOCKERS & COMMISSIONING ROADMAP (STAGE 2)

**Document Version:** 2.1.0  
**Status:** Software Complete (98.0%) / Hardware Bench Commissioning Pending (0.0%)  

---

## 1. Critical Hardware Blockers (Must Be Resolved Before Operation)

### Blocker B-01: Physical Verification of Solenoid Valve 2 (Zone 2 - Paddy)
- **Classification:** **BLOCKED**
- **Impact:** The hydraulic architecture assumes two independent solenoid valves to direct water from the single shared pump. If only one valve exists on the bench, automated dual-zone switching cannot function.
- **Resolution:**
  - Verify whether a second 12V DC solenoid valve is physically present on the bench.
  - If only one physical valve exists, update firmware configuration to operate in single-zone mode (`DEFAULT_ZONE = VEGETABLE`), disabling automatic switching to the paddy branch to avoid deadheading the pump.

### Blocker B-02: External Actuator Driver & Flyback Protection Circuits
- **Classification:** **HARDWARE PENDING**
- **Impact:** Arduino pins `D6`, `D8`, `D9` cannot directly sink/source the $1.0\,\text{A}$ current required by the pump or the $0.4\,\text{A}$ required by the solenoids.
- **Resolution:**
  - Wire an external logic-level N-Channel MOSFET (IRLZ44N) breakout board for pin `D6` (Pump).
  - Wire relay or MOSFET driver channels for pins `D8` and `D9`.
  - Solder 1N4007 flyback diodes directly across the pump and solenoid terminals.
  - Install a 2.0A fast-acting inline fuse on the 12V DC power supply positive lead.

---

## 2. High-Priority Hardware Commissioning Tasks

Following the procedures in [HARDWARE_COMMISSIONING_CHECKLIST.md](file:///c:/Users/sugud/OneDrive/Documents/AGROSMART 2.0/docs/audit/HARDWARE_COMMISSIONING_CHECKLIST.md):

### Task HW-01: Flash Compiled Firmware to ATmega2560
- **Owner:** Embedded Engineer
- **Action:** Connect Arduino Mega via USB. Compile `firmware/src/main.cpp` using Arduino CLI or AVR-GCC for target `arduino:avr:mega:cpu=atmega2560` and upload via avrdude. Confirm serial boot banner at 115200 baud.

### Task HW-02: Capacitive Soil Moisture Sensor Two-Point Calibration
- **Owner:** Field Hardware Engineer
- **Action:**
  1. Measure dry air ADC count on `A0` (expect $\approx 800-870$).
  2. Measure water submersion ADC count on `A0` (expect $\approx 320-380$).
  3. Repeat for `A1`. Commit calibrated ADC values to EEPROM.

### Task HW-03: Bharat pH Module V3.0 Potentiometer Calibration
- **Owner:** Field Hardware Engineer
- **Action:** Submerge PE-03 glass electrode in standard $\text{pH } 7.00$ buffer solution. Adjust onboard potentiometer until analog voltage at pin `A2` reads exactly $2.50\,\text{V}$. Verify in $\text{pH } 4.01$ buffer ($\approx 3.05\,\text{V}$).

### Task HW-04: Onboard ESP8266 Wi-Fi UART Association
- **Owner:** IoT / Network Engineer
- **Action:** Power Grove shield. Confirm ESP8266 answers `AT` on `Serial1` (115200 baud). Configure 2.4 GHz SSID and password in `wifi_config.h`. Verify HTTP/1.1 POST telemetry packets reach FastAPI backend.

### Task HW-05: Hydraulic Pressure & Valve Sequencing Test
- **Owner:** Plumber / Mechanical Engineer
- **Action:** Submerge pump in water reservoir. Execute test cycle. Verify 1500 ms valve lead time allows valve to open before pump engages. Verify zero leaks across pipe manifold under $15 - 25\,\text{PSI}$ working pressure.

---

## 3. High-Priority Mobile & Backend Validation Tasks

### Task SW-01: Android Mobile Client Live Screen Verification
- **Classification:** **HARDWARE PENDING**
- **Action:**
  1. In the `mobile/` directory, launch the Expo server with a clean cache:
     ```powershell
     npx expo start -c
     ```
  2. On the physical Android phone, open Expo Go, dismiss previous error screen, and connect to `exp://<LAN-IP>:8081`.
  3. Verify that the dashboard, live sensor cards, and emergency stop button render cleanly without errors.

### Task SW-02: FastAPI Production PostgreSQL Migration
- **Classification:** **SOFTWARE VERIFIED**
- **Action:** When transitioning from SQLite to PostgreSQL, generate Alembic migration version (`alembic revision --autogenerate -m "Initial schema"`) and apply to PostgreSQL database instance.
