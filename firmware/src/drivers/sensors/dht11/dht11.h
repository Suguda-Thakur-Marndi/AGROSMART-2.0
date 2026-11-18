/**
 * AgroSmart 2.0 – DHT11 Ambient Temperature & Humidity Sensor Driver
 * Target: EWS All-in-One Arduino Mega IoT Grove Kit (Pin D4)
 *
 * Implements:
 * - 40-bit digital frame capture
 * - Hardware checksum verification (Byte4 == (Byte0 + Byte1 + Byte2 + Byte3) & 0xFF)
 * - Measurement bounds and disconnected probe detection
 */

#ifndef DHT11_H
#define DHT11_H

#include <stdint.h>
#include "../../../config/pin_config.h"
#include "../../../config/irrigation_config.h"

class Dht11Sensor {
public:
  Dht11Sensor(uint8_t dataPin);

  void init();
  bool read();

  float getTemperatureC() const;
  float getHumidityPercent() const;
  bool isConnected() const;
  bool isValid() const;

  // Injection helper for unit tests
  void injectReading(float tempC, float humidityPercent, bool checksumValid = true);

private:
  uint8_t m_pin;
  float m_lastTemperatureC;
  float m_lastHumidityPercent;
  bool m_isConnected;
  bool m_isValid;

#ifdef ARDUINO
  uint8_t readRawData(uint8_t data[5]);
#endif
};

#endif // DHT11_H