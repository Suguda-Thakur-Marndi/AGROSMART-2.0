/**
 * AgroSmart 2.0 – EEPROM Calibration Storage
 * Persists sensor calibration data to ATmega2560 EEPROM.
 * Uses CRC-8 (DOW polynomial) to detect corruption.
 */

#ifndef EEPROM_STORAGE_H
#define EEPROM_STORAGE_H

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

#pragma pack(push, 1)
struct CalibrationData {
  uint8_t  magic;        // 0xA5 = valid data present
  uint16_t vegDryAdc;    // Capacitive moisture: dry ADC reading (~785)
  uint16_t vegWetAdc;    // Capacitive moisture: wet ADC reading (~320)
  uint16_t paddyDryAdc;  // Paddy moisture dry ADC
  uint16_t paddyWetAdc;  // Paddy moisture wet ADC
  float    phNeutralMv;  // pH 7.00 buffer voltage (mV)
  float    phAcidMv;     // pH 4.01 buffer voltage (mV)
  float    phBaseMv;     // pH 10.01 buffer voltage (mV)
  uint8_t  crc8;         // CRC over all preceding bytes
};
#pragma pack(pop)

class EepromStorage {
public:
  EepromStorage();

  bool load(CalibrationData& out);
  bool save(const CalibrationData& data);

  static uint8_t computeCrc8(const uint8_t* data, size_t len);

  static const uint8_t  MAGIC_BYTE    = 0xA5;
  static const uint16_t EEPROM_START  = 0;

private:
  static const size_t DATA_SIZE = sizeof(CalibrationData) - 1; // Exclude crc8 byte
};

#endif // EEPROM_STORAGE_H
