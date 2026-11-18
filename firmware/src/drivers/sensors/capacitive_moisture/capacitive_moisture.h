/**
 * AgroSmart 2.0 – Capacitive Soil Moisture Sensor V1.2 Driver
 *
 * Implements:
 * - 10-bit Analog ADC acquisition (0-1023)
 * - 5-sample moving average / median filtering to reject electrical switching noise
 * - Dry calibration (0% VWC) & Wet calibration (100% VWC) mapping
 * - Disconnected / short-circuited probe detection
 */

#ifndef CAPACITIVE_MOISTURE_H
#define CAPACITIVE_MOISTURE_H

#include <stdint.h>
#include "../../../config/pin_config.h"
#include "../../../config/irrigation_config.h"

class CapacitiveMoistureSensor {
public:
  CapacitiveMoistureSensor(uint8_t analogPin);

  void init(uint16_t dryAdc = 785, uint16_t wetAdc = 320);
  void update();

  float getMoisturePercent() const;
  uint16_t getRawAdc() const;
  bool isConnected() const;
  bool isValid() const;

  void setCalibration(uint16_t dryAdc, uint16_t wetAdc);
  uint16_t getDryAdc() const { return m_dryAdc; }
  uint16_t getWetAdc() const { return m_wetAdc; }

  // Inject raw reading for unit testing
  void injectRawAdc(uint16_t rawAdc);

private:
  uint8_t m_pin;
  uint16_t m_dryAdc;
  uint16_t m_wetAdc;
  uint16_t m_lastRawAdc;
  float m_filteredPercent;
  bool m_isConnected;
  bool m_isValid;

  static const uint8_t FILTER_SAMPLES = 5;
  uint16_t m_sampleBuffer[FILTER_SAMPLES];
  uint8_t m_sampleIndex;
};

#endif // CAPACITIVE_MOISTURE_H
