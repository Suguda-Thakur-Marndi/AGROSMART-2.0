/**
 * AgroSmart 2.0 – DS18B20 Digital Waterproof Temperature Probe Driver
 *
 * Implements:
 * - Dallas 1-Wire protocol timing
 * - Scratchpad acquisition (9 bytes)
 * - Hardware CRC-8 verification (Polynomial: X^8 + X^5 + X^4 + 1)
 * - Power-on reset (85.0°C) and bus disconnection detection
 */

#ifndef DS18B20_H
#define DS18B20_H

#include <stdint.h>
#include "../../../config/pin_config.h"
#include "../../../config/irrigation_config.h"

class Ds18b20Sensor {
public:
  Ds18b20Sensor(uint8_t oneWirePin);

  void init();
  bool requestTemperatures();
  bool readTemperature();

  float getTemperatureC() const;
  bool isConnected() const;
  bool isValid() const;
  uint8_t getLastCrc() const { return m_lastCrc; }

  // Hardware CRC-8 calculation helper
  static uint8_t calculateCrc8(const uint8_t *data, uint8_t length);

  // Testing injection
  void injectTemperature(float tempC, bool crcValid = true);

private:
  uint8_t m_pin;
  float m_lastTemperatureC;
  bool m_isConnected;
  bool m_isValid;
  uint8_t m_lastCrc;

#ifdef ARDUINO
  bool resetBus();
  void writeBit(uint8_t bit);
  uint8_t readBit();
  void writeByte(uint8_t byte);
  uint8_t readByte();
#endif
};

#endif // DS18B20_H
