/**
 * AgroSmart 2.0 – Capacitive Soil Moisture Sensor V1.2 Driver Implementation
 */

#include "capacitive_moisture.h"

CapacitiveMoistureSensor::CapacitiveMoistureSensor(uint8_t analogPin)
    : m_pin(analogPin),
      m_dryAdc(785),
      m_wetAdc(320),
      m_lastRawAdc(0),
      m_filteredPercent(0.0f),
      m_isConnected(false),
      m_isValid(false),
      m_sampleIndex(0) {
  for (uint8_t i = 0; i < FILTER_SAMPLES; ++i) {
    m_sampleBuffer[i] = 785;
  }
}

void CapacitiveMoistureSensor::init(uint16_t dryAdc, uint16_t wetAdc) {
  setCalibration(dryAdc, wetAdc);
#ifdef ARDUINO
  pinMode(m_pin, INPUT);
#endif
  update();
}

void CapacitiveMoistureSensor::setCalibration(uint16_t dryAdc, uint16_t wetAdc) {
  // Ensure dry reference is strictly greater than wet reference for capacitive V1.2
  // (Capacitive probe outputs higher voltage/ADC in dry air, lower in water)
  if (dryAdc > wetAdc + 50) {
    m_dryAdc = dryAdc;
    m_wetAdc = wetAdc;
  } else {
    m_dryAdc = 785;
    m_wetAdc = 320;
  }
}

void CapacitiveMoistureSensor::injectRawAdc(uint16_t rawAdc) {
  m_lastRawAdc = rawAdc;

  // Disconnection detection
  if (rawAdc < MOISTURE_DISCONNECT_ADC_LOW || rawAdc > MOISTURE_DISCONNECT_ADC_HIGH) {
    m_isConnected = false;
    m_isValid = false;
    return;
  }

  m_isConnected = true;
  m_isValid = true;

  // Add to circular sample buffer
  m_sampleBuffer[m_sampleIndex] = rawAdc;
  m_sampleIndex = (m_sampleIndex + 1) % FILTER_SAMPLES;

  // Calculate moving average
  uint32_t sum = 0;
  for (uint8_t i = 0; i < FILTER_SAMPLES; ++i) {
    sum += m_sampleBuffer[i];
  }
  float avgAdc = (float)sum / (float)FILTER_SAMPLES;

  // Inverted mapping: Dry ADC -> 0%, Wet ADC -> 100%
  float percent = 100.0f * (float)(m_dryAdc - avgAdc) / (float)(m_dryAdc - m_wetAdc);

  if (percent < 0.0f) percent = 0.0f;
  if (percent > 100.0f) percent = 100.0f;

  m_filteredPercent = percent;
}

void CapacitiveMoistureSensor::update() {
#ifdef ARDUINO
  uint16_t raw = analogRead(m_pin);
  injectRawAdc(raw);
#endif
}

float CapacitiveMoistureSensor::getMoisturePercent() const {
  return m_filteredPercent;
}

uint16_t CapacitiveMoistureSensor::getRawAdc() const {
  return m_lastRawAdc;
}

bool CapacitiveMoistureSensor::isConnected() const {
  return m_isConnected;
}

bool CapacitiveMoistureSensor::isValid() const {
  return m_isValid;
}
