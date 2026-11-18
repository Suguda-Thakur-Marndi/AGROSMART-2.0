/**
 * AgroSmart 2.0 – Telemetry JSON Builder
 * Builds compact JSON packets for Wi-Fi upload. No malloc, static buffer only.
 */

#ifndef TELEMETRY_BUILDER_H
#define TELEMETRY_BUILDER_H

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

class TelemetryBuilder {
public:
  TelemetryBuilder();

  /**
   * Build a JSON telemetry packet.
   * @return Pointer to internal static buffer (valid until next call to build())
   */
  const char* build(
    uint32_t    timestampMs,
    float       vegMoisture,
    float       paddyMoisture,
    float       ph,
    float       soilTemp,
    float       airTemp,
    float       airHumidity,
    bool        pumpOn,
    bool        vegValve,
    bool        paddyValve,
    const char* mode,
    const char* zone,
    uint8_t     errorMask
  );

  static const size_t BUFFER_SIZE = 256;

private:
  char m_buffer[BUFFER_SIZE];
};

#endif // TELEMETRY_BUILDER_H
