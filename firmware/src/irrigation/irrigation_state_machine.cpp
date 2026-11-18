/**
 * AgroSmart 2.0 – Irrigation State Machine Implementation
 */

#include "irrigation_state_machine.h"
#include "../config/pin_config.h"
#include "../config/irrigation_config.h"

#ifdef ARDUINO
#include <Arduino.h>
#endif

IrrigationStateMachine::IrrigationStateMachine()
  : m_state(IrrigationState::IDLE),
    m_activeZone(IrrigationZone::NONE),
    m_mode(IrrigationMode::AUTO),
    m_stateStartMs(0),
    m_manualDurationMs(0),
    m_pumpOn(false),
    m_vegValveOpen(false),
    m_paddyValveOpen(false)
{
}

void IrrigationStateMachine::transitionTo(IrrigationState newState, uint32_t nowMs) {
  m_state = newState;
  m_stateStartMs = nowMs;
}

void IrrigationStateMachine::setPump(bool on) {
  m_pumpOn = on;
#ifdef ARDUINO
  digitalWrite(PIN_ACTUATOR_PUMP_MOSFET, on ? HIGH : LOW);
#endif
}

void IrrigationStateMachine::setVegValve(bool open) {
  m_vegValveOpen = open;
#ifdef ARDUINO
  digitalWrite(PIN_ACTUATOR_VALVE_VEG, open ? HIGH : LOW);
#endif
}

void IrrigationStateMachine::setPaddyValve(bool open) {
  m_paddyValveOpen = open;
#ifdef ARDUINO
  digitalWrite(PIN_ACTUATOR_VALVE_PADDY, open ? HIGH : LOW);
#endif
}

void IrrigationStateMachine::update(uint32_t nowMs, float vegMoisture, float paddyMoisture) {
  uint32_t elapsed = nowMs - m_stateStartMs;

  switch (m_state) {
    case IrrigationState::IDLE:
      if (m_mode == IrrigationMode::AUTO) {
        if (vegMoisture < VEG_MOISTURE_ON_THRESHOLD) {
          m_activeZone = IrrigationZone::VEGETABLE;
          setVegValve(true);
          transitionTo(IrrigationState::VEG_VALVE_OPEN, nowMs);
        } else if (paddyMoisture < PADDY_MOISTURE_ON_THRESHOLD) {
          m_activeZone = IrrigationZone::PADDY;
          setPaddyValve(true);
          transitionTo(IrrigationState::PADDY_VALVE_OPEN, nowMs);
        }
      }
      break;

    case IrrigationState::VEG_VALVE_OPEN:
      if (elapsed >= VALVE_LEAD_TIME_MS) {
        setPump(true);
        transitionTo(IrrigationState::PUMP_ON_VEG, nowMs);
      }
      break;

    case IrrigationState::PUMP_ON_VEG:
      transitionTo(IrrigationState::ZONE_VEG_ACTIVE, nowMs);
      break;

    case IrrigationState::ZONE_VEG_ACTIVE: {
      bool moistureSatisfied = (m_mode == IrrigationMode::AUTO)
        ? (vegMoisture >= VEG_MOISTURE_OFF_THRESHOLD)
        : false;
      bool durationElapsed = (m_mode == IrrigationMode::MANUAL)
        ? (elapsed >= m_manualDurationMs)
        : false;
      bool maxRuntime = (elapsed >= (uint32_t)VEG_MAX_RUNTIME_MINUTES * 60000UL);
      if (moistureSatisfied || durationElapsed || maxRuntime) {
        setPump(false);
        transitionTo(IrrigationState::ZONE_VEG_STOPPING, nowMs);
      }
      break;
    }

    case IrrigationState::ZONE_VEG_STOPPING:
      if (elapsed >= VALVE_LAG_TIME_MS) {
        setVegValve(false);
        m_activeZone = IrrigationZone::NONE;
        transitionTo(IrrigationState::COOLDOWN, nowMs);
      }
      break;

    case IrrigationState::PADDY_VALVE_OPEN:
      if (elapsed >= VALVE_LEAD_TIME_MS) {
        setPump(true);
        transitionTo(IrrigationState::PUMP_ON_PADDY, nowMs);
      }
      break;

    case IrrigationState::PUMP_ON_PADDY:
      transitionTo(IrrigationState::ZONE_PADDY_ACTIVE, nowMs);
      break;

    case IrrigationState::ZONE_PADDY_ACTIVE: {
      bool moistureSatisfied = (m_mode == IrrigationMode::AUTO)
        ? (paddyMoisture >= PADDY_MOISTURE_OFF_THRESHOLD)
        : false;
      bool durationElapsed = (m_mode == IrrigationMode::MANUAL)
        ? (elapsed >= m_manualDurationMs)
        : false;
      bool maxRuntime = (elapsed >= (uint32_t)PADDY_MAX_RUNTIME_MINUTES * 60000UL);
      if (moistureSatisfied || durationElapsed || maxRuntime) {
        setPump(false);
        transitionTo(IrrigationState::ZONE_PADDY_STOPPING, nowMs);
      }
      break;
    }

    case IrrigationState::ZONE_PADDY_STOPPING:
      if (elapsed >= VALVE_LAG_TIME_MS) {
        setPaddyValve(false);
        m_activeZone = IrrigationZone::NONE;
        transitionTo(IrrigationState::COOLDOWN, nowMs);
      }
      break;

    case IrrigationState::COOLDOWN:
      if (elapsed >= PUMP_COOLDOWN_TIME_MS) {
        transitionTo(IrrigationState::IDLE, nowMs);
      }
      break;

    case IrrigationState::EMERGENCY_STOP:
      // Stays here until resume() is called
      break;
  }
}

void IrrigationStateMachine::startManual(IrrigationZone zone, uint32_t durationMs) {
  // Sequential lock: only start if IDLE
  if (m_state != IrrigationState::IDLE) return;
  m_mode = IrrigationMode::MANUAL;
  m_manualDurationMs = durationMs;
  m_activeZone = zone;
  if (zone == IrrigationZone::VEGETABLE) {
    setVegValve(true);
    transitionTo(IrrigationState::VEG_VALVE_OPEN, 0);
  } else if (zone == IrrigationZone::PADDY) {
    setPaddyValve(true);
    transitionTo(IrrigationState::PADDY_VALVE_OPEN, 0);
  }
}

void IrrigationStateMachine::emergencyStop() {
  setPump(false);
  setVegValve(false);
  setPaddyValve(false);
  m_activeZone = IrrigationZone::NONE;
  transitionTo(IrrigationState::EMERGENCY_STOP, 0);
}

void IrrigationStateMachine::resume() {
  if (m_state == IrrigationState::EMERGENCY_STOP) {
    transitionTo(IrrigationState::IDLE, 0);
  }
}

void IrrigationStateMachine::setAutoMode() {
  m_mode = IrrigationMode::AUTO;
}

void IrrigationStateMachine::setManualMode() {
  m_mode = IrrigationMode::MANUAL;
}

IrrigationState IrrigationStateMachine::getState() const { return m_state; }
IrrigationZone  IrrigationStateMachine::getActiveZone() const { return m_activeZone; }
IrrigationMode  IrrigationStateMachine::getMode() const { return m_mode; }
bool IrrigationStateMachine::isPumpOn() const { return m_pumpOn; }
bool IrrigationStateMachine::isVegValveOpen() const { return m_vegValveOpen; }
bool IrrigationStateMachine::isPaddyValveOpen() const { return m_paddyValveOpen; }
uint32_t IrrigationStateMachine::getElapsedMs(uint32_t nowMs) const {
  return nowMs - m_stateStartMs;
}
