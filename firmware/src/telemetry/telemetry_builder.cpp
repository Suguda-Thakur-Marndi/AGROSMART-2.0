/**
 * AgroSmart 2.0 – Telemetry Builder Implementation
 */

#include "telemetry_builder.h"
#include <stdio.h>
#include <string.h>

TelemetryBuilder::TelemetryBuilder() {
  memset(m_buffer, 0, sizeof(m_buffer));
}

const char* TelemetryBuilder::build(
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
  uint8_t     errorMask)
{
  snprintf(m_buffer, BUFFER_SIZE,
    "{\"device_id\":\"agrosmart-mega-01\",\"ts\":%lu,\"vm\":%.1f,\"pm\":%.1f,\"ph\":%.2f,"
    "\"st\":%.1f,\"at\":%.1f,\"ah\":%.1f,"
    "\"pump\":%d,\"vv\":%d,\"pv\":%d,"
    "\"mode\":\"%s\",\"zone\":\"%s\",\"err\":%d}",
    (unsigned long)timestampMs,
    vegMoisture, paddyMoisture, ph,
    soilTemp, airTemp, airHumidity,
    pumpOn ? 1 : 0,
    vegValve ? 1 : 0,
    paddyValve ? 1 : 0,
    mode ? mode : "auto",
    zone ? zone : "none",
    (int)errorMask
  );
  return m_buffer;
}
