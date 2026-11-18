/**
 * AgroSmart 2.0 – EEPROM Storage Implementation
 */

#include "eeprom_storage.h"
#include <string.h>

#ifdef ARDUINO
#include <EEPROM.h>
#endif

// Simulated EEPROM for host-side (MinGW) testing
#ifndef ARDUINO
static uint8_t s_fakeEeprom[64] = {0};

static void eeprom_write_byte(uint16_t addr, uint8_t val) {
  if (addr < sizeof(s_fakeEeprom)) s_fakeEeprom[addr] = val;
}

static uint8_t eeprom_read_byte(uint16_t addr) {
  if (addr < sizeof(s_fakeEeprom)) return s_fakeEeprom[addr];
  return 0xFF;
}
#endif

// DOW CRC-8 polynomial: X^8 + X^5 + X^4 + 1 (0x8C reflected)
uint8_t EepromStorage::computeCrc8(const uint8_t* data, size_t len) {
  uint8_t crc = 0;
  for (size_t i = 0; i < len; i++) {
    uint8_t byte = data[i];
    for (uint8_t bit = 8; bit > 0; bit--) {
      uint8_t mix = (crc ^ byte) & 0x01;
      crc >>= 1;
      if (mix) crc ^= 0x8C;
      byte >>= 1;
    }
  }
  return crc;
}

EepromStorage::EepromStorage() {}

bool EepromStorage::save(const CalibrationData& data) {
  CalibrationData toWrite = data;
  toWrite.magic = MAGIC_BYTE;
  // Compute CRC over all bytes except the crc8 field (last byte)
  toWrite.crc8 = computeCrc8(reinterpret_cast<const uint8_t*>(&toWrite),
                               sizeof(CalibrationData) - 1);

  const uint8_t* bytes = reinterpret_cast<const uint8_t*>(&toWrite);
  for (size_t i = 0; i < sizeof(CalibrationData); i++) {
#ifdef ARDUINO
    EEPROM.update(EEPROM_START + i, bytes[i]);
#else
    eeprom_write_byte(EEPROM_START + i, bytes[i]);
#endif
  }
  return true;
}

bool EepromStorage::load(CalibrationData& out) {
  uint8_t* bytes = reinterpret_cast<uint8_t*>(&out);
  for (size_t i = 0; i < sizeof(CalibrationData); i++) {
#ifdef ARDUINO
    bytes[i] = EEPROM.read(EEPROM_START + i);
#else
    bytes[i] = eeprom_read_byte(EEPROM_START + i);
#endif
  }

  // Check magic byte
  if (out.magic != MAGIC_BYTE) return false;

  // Verify CRC
  uint8_t expectedCrc = computeCrc8(bytes, sizeof(CalibrationData) - 1);
  return (expectedCrc == out.crc8);
}
