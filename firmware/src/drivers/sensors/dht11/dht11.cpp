/**
 * AgroSmart 2.0 – DHT11 Ambient Temperature & Humidity Sensor Driver
 * Target: EWS All-in-One Arduino Mega IoT Grove Kit (Pin D4)
 */

#include "dht11.h"
#include <string.h>

Dht11Sensor::Dht11Sensor(uint8_t dataPin)
  : m_pin(dataPin),
    m_lastTemperatureC(25.0f),
    m_lastHumidityPercent(60.0f),
    m_isConnected(false),
    m_isValid(false)
{
}

void Dht11Sensor::init() {
#ifdef ARDUINO
  pinMode(m_pin, INPUT_PULLUP);
  m_isConnected = true;
#else
  m_isConnected = true;
  m_isValid = false; // No real data until read() or inject called
#endif
}

bool Dht11Sensor::read() {
#ifdef ARDUINO
  uint8_t data[5] = {0};
  if (readRawData(data) != 0) {
    m_isConnected = false;
    m_isValid = false;
    return false;
  }
  // Verify checksum
  uint8_t checksum = (data[0] + data[1] + data[2] + data[3]) & 0xFF;
  if (checksum != data[4]) {
    m_isConnected = true;
    m_isValid = false;
    return false;
  }
  float humidity = (float)data[0];    // Integer part only (DHT11)
  float temperature = (float)data[2]; // Integer part only

  // Bounds check
  if (humidity < HUMIDITY_MIN_VALID_PERCENT || humidity > HUMIDITY_MAX_VALID_PERCENT) {
    m_isValid = false;
    return false;
  }
  if (temperature < TEMP_MIN_VALID_C || temperature > TEMP_MAX_VALID_C) {
    m_isValid = false;
    return false;
  }

  m_lastHumidityPercent = humidity;
  m_lastTemperatureC = temperature;
  m_isConnected = true;
  m_isValid = true;
  return true;
#else
  // No hardware in test mode; use inject
  return m_isValid;
#endif
}

float Dht11Sensor::getTemperatureC() const {
  return m_lastTemperatureC;
}

float Dht11Sensor::getHumidityPercent() const {
  return m_lastHumidityPercent;
}

bool Dht11Sensor::isConnected() const {
  return m_isConnected;
}

bool Dht11Sensor::isValid() const {
  return m_isValid;
}

void Dht11Sensor::injectReading(float tempC, float humidityPercent, bool checksumValid) {
  m_isConnected = true;
  if (!checksumValid) {
    m_isValid = false;
    return;
  }
  if (humidityPercent < HUMIDITY_MIN_VALID_PERCENT || humidityPercent > HUMIDITY_MAX_VALID_PERCENT) {
    m_isValid = false;
    return;
  }
  if (tempC < TEMP_MIN_VALID_C || tempC > TEMP_MAX_VALID_C) {
    m_isValid = false;
    return;
  }
  m_lastTemperatureC = tempC;
  m_lastHumidityPercent = humidityPercent;
  m_isValid = true;
}

#ifdef ARDUINO
uint8_t Dht11Sensor::readRawData(uint8_t data[5]) {
  // Send start signal
  pinMode(m_pin, OUTPUT);
  digitalWrite(m_pin, LOW);
  delay(18); // DHT11 needs >18ms start pulse
  digitalWrite(m_pin, HIGH);
  delayMicroseconds(40);
  pinMode(m_pin, INPUT_PULLUP);

  // Wait for DHT11 response low
  uint16_t timeout = 0;
  while (digitalRead(m_pin) == HIGH) {
    if (++timeout > 10000) return 1; // timeout
  }
  // Response: 80us low then 80us high
  while (digitalRead(m_pin) == LOW) {
    if (++timeout > 10000) return 1;
  }
  while (digitalRead(m_pin) == HIGH) {
    if (++timeout > 10000) return 1;
  }

  // Read 40 bits
  for (uint8_t i = 0; i < 40; i++) {
    // Wait for bit start (low)
    while (digitalRead(m_pin) == LOW) {
      if (++timeout > 10000) return 1;
    }
    // Measure high pulse duration: 26-28us = 0, 70us = 1
    uint16_t highTime = 0;
    while (digitalRead(m_pin) == HIGH) {
      highTime++;
      delayMicroseconds(1);
      if (highTime > 100) break;
    }
    data[i / 8] <<= 1;
    if (highTime > 40) {
      data[i / 8] |= 1;
    }
  }
  return 0;
}
#endif
