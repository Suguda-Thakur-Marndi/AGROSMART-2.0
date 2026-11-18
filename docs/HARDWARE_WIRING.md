# AgroSmart 2.0 – Complete Hardware Wiring & Schematic Guide

## 1. Power Supply Architecture

The system utilizes a split-rail architecture to ensure sensor signal integrity and prevent inductive pump noise from triggering MCU resets:

```
[AC Mains 230V/110V]
        |
        +---> [12V DC, 3A Regulated Adapter] ===> +12V Rail (Pump & Valves)
        |                                              |
        |                                       [2A Inline Fuse]
        |                                              |
        |                                       +------+------+
        |                                       |             |
        |                                    [Pump +]     [Valves +]
        |
        +---> [5V DC, 2A USB Adapter] ==========> Arduino Mega 5V & Grove Sensors
                                                       |
        [Star Ground Junction] <=======================+ (Common GND)
```

---

## 2. 12V DC Common Pump MOSFET Driver Circuit

The common water pump (12V DC, 1A rated, 2.5A startup inrush) is controlled via a low-side N-channel logic-level MOSFET:

```
                          +12V DC (Fused 2A)
                                  |
                                  +--------+
                                  |        |
                               [PUMP]   [1N4007 Diode] (Cathode to +12V)
                                  |        |
                                  +--------+
                                  |
                                Drain
Arduino Mega D6 ---[ 220Ω ]--- Gate (IRLZ44N)
                                  |
                              [ 10kΩ ]
                                  |
                               Source --- STAR GROUND (Arduino GND + 12V GND)
```

### Component Values:
- **MOSFET:** IRLZ44N, STP36NF06L, or AO4406A (Logic-level threshold $V_{GS(th)} \le 2.0\text{V}$, $R_{DS(on)} < 0.03\Omega$).
- **Gate Resistor:** $220\Omega, 1/4\text{W}$ series damping resistor to suppress parasitic oscillation.
- **Pull-Down Resistor:** $10\text{k}\Omega, 1/4\text{W}$ connected between Gate and Source to hold the MOSFET solidly OFF during MCU bootloader execution.
- **Flyback Diode:** 1N4007 (1000V, 1A) or 1N5819 Schottky connected reverse-biased across motor terminals.
- **Protection Fuse:** 2.0A fast-acting inline blade fuse on the +12V positive rail.

---

## 3. Sensor Wiring Details

### A. Capacitive Soil Moisture Sensors (Zone 1 & Zone 2)
- **VCC:** Connect to Grove 5.0V.
- **GND:** Connect to Grove GND.
- **AOUT (Zone 1):** Connect to Arduino Mega **A0**.
- **AOUT (Zone 2):** Connect to Arduino Mega **A1**.

### B. Bharat pH Sensor Module V3.0 (PE-03 Glass Electrode)
- **VCC:** Connect to Grove 5.0V.
- **GND:** Connect to Grove GND.
- **Po (Analog pH):** Connect to Arduino Mega **A2**.
- **BNC:** Connect PE-03 glass bulb probe to the onboard BNC jack.

### C. DS18B20 Digital Waterproof Stainless Temperature Probe
- **RED (VCC):** Connect to 5.0V.
- **BLACK (GND):** Connect to GND.
- **YELLOW/BLUE (DATA):** Connect to Arduino Mega **D7**.
- **PULL-UP:** $4.7\text{k}\Omega$ metal film resistor placed between DATA (D7) and 5.0V rail.

### D. DHT11 Ambient Temperature & Humidity Sensor
- **VCC:** Connect to Grove 5.0V.
- **GND:** Connect to Grove GND.
- **DATA:** Connect to Arduino Mega **D4**.
