/**
 * AgroSmart 2.0 – Safety Interlock Implementation
 */

#include "safety_interlock.h"
#include "../config/irrigation_config.h"
#include <string.h>

SafetyInterlock::SafetyInterlock()
  : m_faultMask(0x00),
    m_emergencyStop(false)
{
  memset(m_lastFaultReason, 0, sizeof(m_lastFaultReason));
}

bool SafetyInterlock::checkSensors(float vegMoist, float paddyMoist, float ph,
                                    float soilTemp, float airTemp, float airHum) {
  m_faultMask = 0x00;

  // Check vegetable moisture
  if (vegMoist < MOISTURE_MIN_VALID_PERCENT || vegMoist > MOISTURE_MAX_VALID_PERCENT) {
    m_faultMask |= static_cast<uint8_t>(FaultCode::MOISTURE_VEG_FAULT);
  }

  // Check paddy moisture
  if (paddyMoist < MOISTURE_MIN_VALID_PERCENT || paddyMoist > MOISTURE_MAX_VALID_PERCENT) {
    m_faultMask |= static_cast<uint8_t>(FaultCode::MOISTURE_PADDY_FAULT);
  }

  // Check pH
  if (ph < PH_MIN_VALID || ph > PH_MAX_VALID) {
    m_faultMask |= static_cast<uint8_t>(FaultCode::PH_FAULT);
  }

  // Check soil temperature
  if (soilTemp < TEMP_MIN_VALID_C || soilTemp > TEMP_MAX_VALID_C) {
    m_faultMask |= static_cast<uint8_t>(FaultCode::SOIL_TEMP_FAULT);
  }

  // Check air temperature
  if (airTemp < TEMP_MIN_VALID_C || airTemp > TEMP_MAX_VALID_C) {
    m_faultMask |= static_cast<uint8_t>(FaultCode::AIR_TEMP_FAULT);
  }

  // Check humidity
  if (airHum < HUMIDITY_MIN_VALID_PERCENT || airHum > HUMIDITY_MAX_VALID_PERCENT) {
    m_faultMask |= static_cast<uint8_t>(FaultCode::HUMIDITY_FAULT);
  }

  return (m_faultMask == 0x00);
}

bool SafetyInterlock::isSafeToIrrigate() const {
  return (m_faultMask == 0x00 && !m_emergencyStop);
}

uint8_t SafetyInterlock::getFaultMask() const {
  return m_faultMask;
}

void SafetyInterlock::triggerEmergencyStop(const char* reason) {
  m_emergencyStop = true;
  m_faultMask |= static_cast<uint8_t>(FaultCode::EMERGENCY_STOP_ACTIVE);
  if (reason) {
    strncpy(m_lastFaultReason, reason, sizeof(m_lastFaultReason) - 1);
    m_lastFaultReason[sizeof(m_lastFaultReason) - 1] = '\0';
  }
}

void SafetyInterlock::clearFaults() {
  // Only clears sensor faults – NOT the emergency stop flag (manual reset required)
  m_faultMask &= static_cast<uint8_t>(FaultCode::EMERGENCY_STOP_ACTIVE);
}

bool SafetyInterlock::isEmergencyStopActive() const {
  return m_emergencyStop;
}

const char* SafetyInterlock::getLastFaultReason() const {
  return m_lastFaultReason;
}
