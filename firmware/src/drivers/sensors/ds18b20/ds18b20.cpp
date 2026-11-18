/**
 * AgroSmart 2.0 – DS18B20 Digital Waterproof Temperature Probe Driver
 * Target: EWS All-in-One Arduino Mega IoT Grove Kit (Pin D7)
 */

#include "ds18b20.h"

Ds18b20Sensor::Ds18b20Sensor(uint8_t oneWirePin)
  : m_pin(oneWirePin),
    m_lastTemperatureC(25.0f),
    m_isConnected(false),
    m_isValid(false),
    m_lastCrc(0)
{
}

void Ds18b20Sensor::init() {
#ifdef ARDUINO
  pinMode(m_pin, INPUT_PULLUP);
  m_isConnected = resetBus();
#else
  m_isConnected = true;
  m_isValid = true;
#endif
}

uint8_t Ds18b20Sensor::calculateCrc8(const uint8_t *data, uint8_t length) {
  uint8_t crc = 0;
  for (uint8_t i = 0; i < length; i++) {
    uint8_t inbyte = data[i];
    for (uint8_t bit = 8; bit > 0; bit--) {
      uint8_t mix = (crc ^ inbyte) & 0x01;
      crc >>= 1;
      if (mix) {
        crc ^= 0x8C; // DOW CRC polynomial: X^8 + X^5 + X^4 + 1
      }
      inbyte >>= 1;
    }
  }
  return crc;
}

bool Ds18b20Sensor::requestTemperatures() {
#ifdef ARDUINO
  if (!resetBus()) {
    m_isConnected = false;
    m_isValid = false;
    return false;
  }
  writeByte(0xCC); // Skip ROM command
  writeByte(0x44); // Convert T command
  return true;
#else
  return m_isConnected;
#endif
}

bool Ds18b20Sensor::readTemperature() {
#ifdef ARDUINO
  if (!resetBus()) {
    m_isConnected = false;
    m_isValid = false;
    return false;
  }

  writeByte(0xCC); // Skip ROM
  writeByte(0xBE); // Read Scratchpad

  uint8_t scratchpad[9];
  for (uint8_t i = 0; i < 9; i++) {
    scratchpad[i] = readByte();
  }

  m_lastCrc = calculateCrc8(scratchpad, 8);
  if (m_lastCrc != scratchpad[8]) {
    m_isValid = false;
    return false;
  }

  int16_t rawTemp = (int16_t)((scratchpad[1] << 8) | scratchpad[0]);
  float tempC = (float)rawTemp * 0.0625f;

  // 85.0°C is the DS18B20 power-on reset value (indicates read before conversion completed)
  if (tempC >= 84.99f && tempC <= 85.01f) {
    m_isValid = false;
    return false;
  }

  // Agronomic safety bounds check
  if (tempC < TEMP_MIN_VALID_C || tempC > TEMP_MAX_VALID_C) {
    m_isValid = false;
    return false;
  }

  m_lastTemperatureC = tempC;
  m_isConnected = true;
  m_isValid = true;
  return true;
#else
  return m_isValid;
#endif
}

float Ds18b20Sensor::getTemperatureC() const {
  return m_lastTemperatureC;
}

bool Ds18b20Sensor::isConnected() const {
  return m_isConnected;
}

bool Ds18b20Sensor::isValid() const {
  return m_isValid;
}

void Ds18b20Sensor::injectTemperature(float tempC, bool crcValid) {
  m_isConnected = true;
  if (!crcValid) {
    m_isValid = false;
    return;
  }
  // Check power-on reset 85°C
  if (tempC >= 84.99f && tempC <= 85.01f) {
    m_isValid = false;
    return;
  }
  if (tempC < TEMP_MIN_VALID_C || tempC > TEMP_MAX_VALID_C) {
    m_isValid = false;
    return;
  }
  m_lastTemperatureC = tempC;
  m_isValid = true;
}

#ifdef ARDUINO
bool Ds18b20Sensor::resetBus() {
  pinMode(m_pin, OUTPUT);
  digitalWrite(m_pin, LOW);
  delayMicroseconds(480);
  pinMode(m_pin, INPUT_PULLUP);
  delayMicroseconds(70);
  uint8_t presence = digitalRead(m_pin);
  delayMicroseconds(410);
  return (presence == LOW);
}

void Ds18b20Sensor::writeBit(uint8_t bit) {
  pinMode(m_pin, OUTPUT);
  digitalWrite(m_pin, LOW);
  if (bit) {
    delayMicroseconds(10);
    pinMode(m_pin, INPUT_PULLUP);
    delayMicroseconds(55);
  } else {
    delayMicroseconds(65);
    pinMode(m_pin, INPUT_PULLUP);
    delayMicroseconds(5);
  }
}

uint8_t Ds18b20Sensor::readBit() {
  pinMode(m_pin, OUTPUT);
  digitalWrite(m_pin, LOW);
  delayMicroseconds(3);
  pinMode(m_pin, INPUT_PULLUP);
  delayMicroseconds(10);
  uint8_t bit = digitalRead(m_pin);
  delayMicroseconds(53);
  return bit;
}

void Ds18b20Sensor::writeByte(uint8_t byte) {
  for (uint8_t i = 0; i < 8; i++) {
    writeBit(byte & 0x01);
    byte >>= 1;
  }
}

uint8_t Ds18b20Sensor::readByte() {
  uint8_t byte = 0;
  for (uint8_t i = 0; i < 8; i++) {
    if (readBit()) {
      byte |= (1 << i);
    }
  }
  return byte;
}
#endif
