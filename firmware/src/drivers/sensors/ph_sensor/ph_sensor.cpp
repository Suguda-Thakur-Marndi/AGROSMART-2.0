/**
 * AgroSmart 2.0 – PE-03 pH Sensor Module V3.0 Driver Implementation
 */

#include "ph_sensor.h"

PhSensor::PhSensor(uint8_t analogPin)
    : m_pin(analogPin),
      m_vNeutralMv(1500.0f),
      m_vAcidMv(2030.0f),
      m_vBaseMv(970.0f),
      m_lastMv(1500.0f),
      m_filteredPh(7.0f),
      m_isConnected(false),
      m_isValid(false),
      m_sampleIndex(0) {
  for (uint8_t i = 0; i < FILTER_SAMPLES; ++i) {
    m_sampleBuffer[i] = 1500.0f;
  }
}

void PhSensor::init(float vNeutral, float vAcid, float vBase) {
  m_vNeutralMv = vNeutral;
  m_vAcidMv = vAcid;
  m_vBaseMv = vBase;
#ifdef ARDUINO
  pinMode(m_pin, INPUT);
#endif
  update(25.0f);
}

void PhSensor::calibrateBuffer7(float measuredMv) {
  if (measuredMv > 800.0f && measuredMv < 2200.0f) {
    m_vNeutralMv = measuredMv;
  }
}

void PhSensor::calibrateBuffer4(float measuredMv) {
  if (measuredMv > m_vNeutralMv + 200.0f) {
    m_vAcidMv = measuredMv;
  }
}

void PhSensor::calibrateBuffer10(float measuredMv) {
  if (measuredMv < m_vNeutralMv - 200.0f) {
    m_vBaseMv = measuredMv;
  }
}

float PhSensor::getSlopeMvPerPh() const {
  float deltaV = (m_vAcidMv - m_vBaseMv);
  float deltaPh = (10.01f - 4.01f);
  return deltaV / deltaPh; // Typically ~177 mV for 3 pH units ≈ 59 mV/pH
}

void PhSensor::injectMilliVolts(float milliVolts, float solutionTemperatureC) {
  m_lastMv = milliVolts;

  // Signal conditioning voltage window validation (0.1V to 4.9V)
  if (milliVolts < 100.0f || milliVolts > 4900.0f) {
    m_isConnected = false;
    m_isValid = false;
    return;
  }

  m_isConnected = true;

  // Add to circular buffer
  m_sampleBuffer[m_sampleIndex] = milliVolts;
  m_sampleIndex = (m_sampleIndex + 1) % FILTER_SAMPLES;

  // Average mV
  float sum = 0.0f;
  for (uint8_t i = 0; i < FILTER_SAMPLES; ++i) {
    sum += m_sampleBuffer[i];
  }
  float avgMv = sum / (float)FILTER_SAMPLES;

  // Piecewise 3-point slope calculation
  float ph = 7.0f;
  if (avgMv >= m_vNeutralMv) {
    // Acidic region (pH 4.01 to 7.00)
    float acidSlope = (m_vAcidMv - m_vNeutralMv) / (7.00f - 4.01f);
    if (acidSlope > 20.0f) {
      ph = 7.00f - ((avgMv - m_vNeutralMv) / acidSlope);
    }
  } else {
    // Basic / Alkaline region (pH 7.00 to 10.01)
    float baseSlope = (m_vNeutralMv - m_vBaseMv) / (10.01f - 7.00f);
    if (baseSlope > 20.0f) {
      ph = 7.00f + ((m_vNeutralMv - avgMv) / baseSlope);
    }
  }

  // Nernst temperature compensation: slope shifts by (T + 273.15) / 298.15
  float tempKelvin = solutionTemperatureC + 273.15f;
  float tempFactor = tempKelvin / 298.15f;
  if (tempFactor > 0.8f && tempFactor < 1.2f) {
    float deviationFromNeutral = ph - 7.0f;
    ph = 7.0f + (deviationFromNeutral / tempFactor);
  }

  // Clamp and validate
  if (ph >= PH_MIN_VALID && ph <= PH_MAX_VALID) {
    m_filteredPh = ph;
    m_isValid = true;
  } else {
    m_isValid = false;
  }
}

void PhSensor::update(float solutionTemperatureC) {
#ifdef ARDUINO
  int rawAdc = analogRead(m_pin);
  // Convert 10-bit ADC to mV on 5.0V bus: ADC * (5000.0 / 1023.0)
  float mv = (float)rawAdc * (5000.0f / 1023.0f);
  injectMilliVolts(mv, solutionTemperatureC);
#endif
}

float PhSensor::getPh() const {
  return m_filteredPh;
}

float PhSensor::getMilliVolts() const {
  return m_lastMv;
}

bool PhSensor::isConnected() const {
  return m_isConnected;
}

bool PhSensor::isValid() const {
  return m_isValid;
}
