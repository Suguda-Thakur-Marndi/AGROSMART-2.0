/**
 * AgroSmart 2.0 – Safety Interlock Module
 */

#ifndef SAFETY_INTERLOCK_H
#define SAFETY_INTERLOCK_H

#include <stdint.h>
#include <stdbool.h>

enum class FaultCode : uint8_t {
  NONE                  = 0x00,
  MOISTURE_VEG_FAULT    = 0x01,
  MOISTURE_PADDY_FAULT  = 0x02,
  PH_FAULT              = 0x04,
  SOIL_TEMP_FAULT       = 0x08,
  AIR_TEMP_FAULT        = 0x10,
  HUMIDITY_FAULT        = 0x20,
  PUMP_TIMEOUT          = 0x40,
  EMERGENCY_STOP_ACTIVE = 0x80
};

class SafetyInterlock {
public:
  SafetyInterlock();

  bool checkSensors(float vegMoist, float paddyMoist, float ph,
                    float soilTemp, float airTemp, float airHum);
  bool isSafeToIrrigate() const;
  uint8_t getFaultMask() const;
  void triggerEmergencyStop(const char* reason);
  void clearFaults();
  bool isEmergencyStopActive() const;
  const char* getLastFaultReason() const;

private:
  uint8_t m_faultMask;
  bool    m_emergencyStop;
  char    m_lastFaultReason[64];
};

#endif // SAFETY_INTERLOCK_H
