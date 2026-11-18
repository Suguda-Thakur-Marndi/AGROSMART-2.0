/**
 * AgroSmart 2.0 – PE-03 pH Sensor Module V3.0 Driver
 *
 * Implements:
 * - Analog voltage acquisition (0-5V ADC bus)
 * - 3-Point buffer calibration (pH 4.01, 7.00, 10.01)
 * - Nernst slope calculation & temperature compensation
 * - Electrode health & abnormal measurement detection
 */

#ifndef PH_SENSOR_H
#define PH_SENSOR_H

#include <stdint.h>
#include "../../../config/pin_config.h"
#include "../../../config/irrigation_config.h"

class PhSensor {
public:
  PhSensor(uint8_t analogPin);

  void init(float vNeutral = 1500.0f, float vAcid = 2030.0f, float vBase = 970.0f);
  void update(float solutionTemperatureC = 25.0f);

  float getPh() const;
  float getMilliVolts() const;
  bool isConnected() const;
  bool isValid() const;
  float getSlopeMvPerPh() const;

  // 3-Point Calibration
  void calibrateBuffer7(float measuredMv);
  void calibrateBuffer4(float measuredMv);
  void calibrateBuffer10(float measuredMv);

  float getVNeutral() const { return m_vNeutralMv; }
  float getVAcid() const { return m_vAcidMv; }
  float getVBase() const { return m_vBaseMv; }

  // Injection for unit tests
  void injectMilliVolts(float milliVolts, float solutionTemperatureC = 25.0f);

private:
  uint8_t m_pin;
  float m_vNeutralMv; // Voltage at pH 7.00 (default ~1500 mV)
  float m_vAcidMv;    // Voltage at pH 4.01 (default ~2030 mV)
  float m_vBaseMv;    // Voltage at pH 10.01 (default ~970 mV)
  float m_lastMv;
  float m_filteredPh;
  bool m_isConnected;
  bool m_isValid;

  static const uint8_t FILTER_SAMPLES = 8;
  float m_sampleBuffer[FILTER_SAMPLES];
  uint8_t m_sampleIndex;
};

#endif // PH_SENSOR_H
