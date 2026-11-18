# AgroSmart 2.0 – Verified Hardware Pin Mapping

Target Board: **EWS All-in-One Arduino Mega IoT Grove Kit (ATmega2560)**  
Microcontroller Architecture: AVR 8-bit, 16 MHz, 5.0V Logic Bus  
Primary Connectivity: Onboard ESP8266 Wi-Fi Module (Serial1 UART @ 115200 baud)

---

## 1. Pin Assignment Table

| Pin | Physical Port Type | Signal Type | Target Peripheral / Sensor | Operational Voltage / Logic | Driver / Notes |
|---|---|---|---|---|---|
| **A0** (54) | Grove Analog Port A0 | Analog Input | Capacitive Soil Moisture Sensor V1.2 (Zone 1 – Vegetable Drip Field) | 0.0 – 5.0V (10-bit ADC: 0–1023) | Air baseline: ~785 ADC (0% VWC), Submerged: ~320 ADC (100% VWC). Disconnect fault if <40 or >1010. |
| **A1** (55) | Grove Analog Port A1 | Analog Input | Capacitive Soil Moisture Sensor V1.2 (Zone 2 – Lowland Paddy Field) | 0.0 – 5.0V (10-bit ADC: 0–1023) | Same inverted capacitive curve: higher voltage in dry soil, lower in water. |
| **A2** (56) | Grove Analog Port A2 | Analog Input | Bharat pH Sensor Module V3.0 (PE-03 Electrode) | 0.0 – 5.0V conditioned mV | Midpoint: ~1500 mV (pH 7.00), Acid: ~2030 mV (pH 4.01), Base: ~970 mV (pH 10.01). Temp-compensated. |
| **D4** (4) | Grove Digital Port D4 | Bidirectional Digital | DHT11 Ambient Temperature & Humidity Sensor | 5.0V Single-Wire Protocol | 40-bit frame, 18ms host start pulse, checksum-validated. Measures canopy temp (0–50°C) and RH (20–90%). |
| **D7** (7) | Grove Digital Port D7 | Bidirectional Digital | DS18B20 Waterproof Stainless Probe (Dallas 1-Wire) | 5.0V Dallas 1-Wire Bus | 4.7kΩ external pull-up resistor to 5V rail. CRC-8 polynomial $X^8+X^5+X^4+1$, 12-bit precision (0.0625°C). |
| **D6** (6) | Grove Digital Port D6 | Digital Output | 12V DC, 1A Common Water Pump MOSFET Gate Driver | 5.0V Logic Output (Active HIGH) | Logic-Level N-Channel MOSFET (IRLZ44N). 220Ω series gate resistor, 10kΩ pull-down to GND. |
| **D8** (8) | Grove Digital Port D8 | Digital Output | Solenoid Valve 1 Driver (Zone 1 – Vegetable Drip Manifold) | 5.0V Logic Output (Active HIGH) | 12V DC, 500mA solenoid driver. Sequentially interlocked with Valve 2. Lead: 1.5s, Lag: 1.0s. |
| **D9** (9) | Grove Digital Port D9 | Digital Output | Solenoid Valve 2 Driver (Zone 2 – Paddy Flood Manifold) | 5.0V Logic Output (Active HIGH) | 12V DC, 500mA solenoid driver. Never energized simultaneously with Valve 1. |
| **D13** (13) | Onboard LED | Digital Output | System Heartbeat & Operational Status LED | 5.0V Active HIGH | Solid ON = System ready, Blinking = Active irrigation cycle, Strobe = Emergency Stop active. |
| **Serial** (0/1) | USB Bridge | UART (0 RX, 1 TX) | USB Host Development & Debug Console | 5.0V UART (115200 Baud) | Real-time diagnostic logging and serial command testing. |
| **Serial1** (18/19) | Onboard Header | UART (19 RX1, 18 TX1) | Onboard ESP8266 Wi-Fi Module | 3.3V/5.0V Level-Shifted (115200 Baud) | Dedicated AT-command transport for REST telemetry upload and command polling. |

---

## 2. Safety & Electrical Rules

1. **Galvanic Separation:** The 12V DC high-current rail supplying the 1A water pump and solenoid valves is powered by an external 12V 3A regulated power brick and must NEVER be tied directly to the Arduino's 5V VCC pin.
2. **Common Ground:** The Arduino 0V ground and the 12V power supply negative rail MUST be securely bonded at a star-ground junction near the MOSFET source terminal.
3. **Inductive Flyback:** An ultrafast/standard diode (1N4007 or 1N5819) is soldered directly across the DC pump terminals (cathode to +12V, anode to MOSFET drain) to extinguish back-EMF voltage spikes.
4. **Boot State Safety:** All actuator GPIOs (D6, D8, D9) initialize to `OUTPUT` and `LOW` in the earliest execution phase of `setup()`.
