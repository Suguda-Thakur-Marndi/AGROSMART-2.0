# AgroSmart 2.0 – Sensor Calibration & Verification Manual

## 1. Capacitive Soil Moisture Sensor V1.2 (2-Point Calibration)

Capacitive moisture sensors measure the dielectric permittivity of the soil surrounding the probe. The raw output is an analog voltage that maps inversely to soil volumetric water content (VWC).

### Step-by-Step Procedure:

1. **Dry Air Reference Calibration (0% VWC):**
   - Clean the probe with isopropyl alcohol and dry thoroughly.
   - Suspend the probe in ambient air, keeping fingers and metallic objects at least 10 cm away from the PCB trace.
   - Open Arduino Serial Monitor at 115200 baud.
   - Record the stable raw 10-bit ADC value ($ADC_{dry}$). Expected value: **~785 ADC** (range: 750–820).

2. **Saturated Water Reference Calibration (100% VWC):**
   - Fill a container with non-demineralized tap water.
   - Submerge the probe up to the marked white component line (do NOT submerge the onboard electronic components).
   - Stir gently to eliminate air bubbles clinging to the solder mask.
   - Record the stable raw 10-bit ADC value ($ADC_{wet}$). Expected value: **~320 ADC** (range: 300–350).

3. **Software Conversion Formula:**
   $$\text{Moisture } (\%) = 100 \times \frac{ADC_{dry} - ADC_{raw}}{ADC_{dry} - ADC_{wet}}$$
   Clamped to $[0.0\%, 100.0\%]$.

---

## 2. Bharat PE-03 Glass pH Electrode (3-Point Buffer Calibration)

The PE-03 glass combination electrode measures hydrogen ion activity. The raw millivolt signal is conditioned by the Bharat V3.0 analog amplifier board to output a DC voltage between 0.1V and 4.9V.

### Step-by-Step Procedure:

1. **Neutral Buffer Calibration (pH 7.00):**
   - Rinse the glass electrode bulb with distilled water and blot dry with lint-free tissue.
   - Immerse probe in standard **pH 7.00 buffer solution** at 25°C.
   - Allow 60 seconds for reading stabilization.
   - Adjust the trimpot on the Bharat V3.0 board or execute software calibrateBuffer7:
     Target millivolt reading: **$1500\text{ mV}$** ($1.50\text{V} \pm 20\text{mV}$).

2. **Acidic Buffer Calibration (pH 4.01):**
   - Rinse thoroughly with distilled water.
   - Immerse probe in standard **pH 4.01 buffer solution** at 25°C.
   - Allow 60 seconds for reading stabilization.
   - Execute software calibrateBuffer4:
     Target millivolt reading: **$2030\text{ mV}$** ($2.03\text{V} \pm 40\text{mV}$).

3. **Alkaline Buffer Calibration (pH 10.01):**
   - Rinse thoroughly with distilled water.
   - Immerse probe in standard **pH 10.01 buffer solution** at 25°C.
   - Record millivolt reading:
     Target millivolt reading: **$970\text{ mV}$** ($0.97\text{V} \pm 40\text{mV}$).

4. **Nernst Equation & Temperature Compensation:**
   The firmware calculates the Nernst slope:
   $$S = \frac{V_{neutral} - V_{acid}}{7.00 - 4.01} \approx 177.26\text{ mV/pH}$$
   Temperature compensation is applied dynamically using real-time solution temperature from the DS18B20 digital probe:
   $$T_{factor} = \frac{T_{solution} + 273.15}{298.15}$$
