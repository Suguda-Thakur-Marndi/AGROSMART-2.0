# 12V DC Water Pump & Valve Driver Schematic & Electrical Guide

**System:** AgroSmart 2.0  
**Module:** Modular 12V DC Pump Controller & Dual-Zone Valve Driver  
**Component Location:** `firmware/drivers/pump_controller/`  
**Date:** November 2026  

---

## 1. Pump & Driver Electrical Specifications

| Parameter | Value | Verification Notes |
|---|---|---|
| **Pump Operating Voltage** | 12.0 V DC | Dedicated regulated 12V DC external supply rail |
| **Rated Operating Current** | 1.0 A continuous | Full load continuous current |
| **Inrush / Startup Current** | ~2.2 A – 2.8 A | Inductive startup motor surge ($<200\text{ ms}$) |
| **Recommended Power Supply** | 12V DC, 3.0 A Regulated | High-headroom power adapter preventing voltage sag during startup |
| **Main Inline Fuse** | 2.0 A Slow-Blow | Placed on the positive (+12V) rail immediately after power input |
| **Driver Topology** | Low-Side N-Channel Logic-Level MOSFET | E.g. IRLZ44N, FQP30N06L, or AO3400 |
| **MOSFET Gate-Source Threshold ($V_{GS(th)}$)**| $1.0\text{V} - 2.5\text{V}$ | Fully saturated ($R_{DS(on)} < 0.03\Omega$) at $5.0\text{V}$ Arduino Mega output |
| **Gate Inrush Resistor ($R_{\text{gate}}$)** | $150\,\Omega$ – $220\,\Omega$ | Limits ATmega2560 pin charging peak current ($<25\text{ mA}$) |
| **Gate Pull-Down Resistor ($R_{\text{pd}}$)** | $10\text{ k}\Omega$ | Guarantees gate is held at $0\text{V}$ (OFF) during MCU reset & floating boot |
| **Flyback Snubbing Diode** | 1N4007 or 1N5819 | Fast flyback absorption of inductive inductive voltage spikes (Back-EMF) |

---

## 2. Low-Side MOSFET Circuit Schematic

```
                                  +12V DC Power Supply Rail (3A)
                                               |
                                          [Inline Fuse] (2A Slow-Blow)
                                               |
                     +-------------------------+-------------------------+
                     |                                                   |
                     |                                                   |
                     +--[Cathode (Band)]--+                             +12V to Valve Drivers
                     |                    |                              (Identical circuits)
               +-----+-----+              |
               |  12V DC   |       [Flyback Diode]
               |   Water   |       (1N4007/1N5819)
               |   Pump    |              |
               +-----+-----+              |
                     |                    |
                     +---[Anode]----------+
                     |
                     |  (Pump Negative Terminal)
                     v
                [Drain (D)]
               +-----------+
               |  N-Ch     |
Arduino Mega   |  MOSFET   |
GPIO Pin       | (IRLZ44N) |
(TBD on Board) |           |
    |          |           |
    +-[220Ω]---+ [Gate (G)]|
    |          |           |
    |          +-----------+
    |                |
  [10kΩ]             v
 Pull-down      [Source (S)]
    |                |
    +----------------+-------------------------+
                                               |
                                            COMMON GND
                                               |
                     +-------------------------+-------------------------+
                     |                                                   |
             Arduino Mega GND                                    12V Supply Return (-)
```

---

## 3. Critical Safety Rules & Pre-Flight Verification

### Rule 1: Power Separation with Common Ground
- **NEVER** attempt to power the 12V pump from the Arduino Mega 5V rail or Vin barrel jack. The pump's 1A continuous (and 2.5A startup surge) will immediately overheat or destroy the onboard linear regulator (AMS1117 / LP2985).
- Connect the **12V DC Power Supply Ground (-)** directly to the **Arduino Mega GND**. The low-side MOSFET requires this common reference to switch reliably with 5V logic.

### Rule 2: Gate Inrush & Floating Gate Prevention
- The ATmega2560 I/O pin outputs 5V. Directly connecting a capacitive MOSFET gate ($C_{\text{iss}} \approx 1700\text{ pF}$) creates an instantaneous current spike above the 40 mA microcontroller absolute maximum rating. The **$220\,\Omega$ series gate resistor** limits this peak to $\approx 22\text{ mA}$.
- The **$10\text{ k}\Omega$ pull-down resistor** connected directly between Gate and Ground ensures that while the Arduino is booting, resetting, or uploading code via A7672S, the gate cannot float high and trigger unintended pump activation.

### Rule 3: Inductive Kickback Snubbing
- A DC motor is a high-inductance load. When the MOSFET abruptly cuts current, the magnetic field collapses, producing a positive voltage transient ($V = -L \frac{di}{dt}$) that can exceed $100\text{V}$, instantly destroying the MOSFET drain.
- The **flyback diode (1N4007)** MUST be connected in anti-parallel directly across the pump motor terminals (Cathode with silver band connected to +12V, Anode connected to Pump Negative/Drain).

### Rule 4: Bench Verification Before Connecting Actual Pump
1. Replace the 12V pump temporarily with a **12V indicator LED + $1\text{ k}\Omega$ resistor** or a 12V 5W automotive lamp.
2. Verify with a digital multimeter that the output switches cleanly between $0.0\text{V}$ and $12.0\text{V}$ under test commands.
3. Verify that the MOSFET tab/case remains cool to the touch ($<35^\circ\text{C}$). At $R_{DS(on)} = 0.028\,\Omega$ and $1.0\text{A}$, conduction power loss is only $P = I^2 R = (1.0)^2 \times 0.028 = 28\text{ mW}$ (no bulky heatsink required under normal continuous load).
4. Only connect the actual submersible pump after simulated software and test bench electrical verification passes.

---

## 4. Dual-Zone Solenoid Valve Drivers

The two 12V zone valves (Valve 1 for Vegetable Field, Valve 2 for Paddy Field) utilize identical low-side MOSFET or relay driver circuits powered by the same protected 12V rail.

- **Valve 1 Driver:** Controlled via dedicated output pin (unassigned until board verification).
- **Valve 2 Driver:** Controlled via dedicated output pin (unassigned until board verification).
- **Shared Pipe Mode:** When physical valves are omitted or unbranched, the firmware operates in `shared_pipe_mode = true`, bypassing valve sequencing and tagging water distribution as shared.
