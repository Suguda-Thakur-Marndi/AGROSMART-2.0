/**
 * AgroSmart 2.0 – Dual-Zone Autonomous Irrigation State Machine
 * Target: EWS Arduino Mega IoT Grove Kit
 */

#ifndef IRRIGATION_STATE_MACHINE_H
#define IRRIGATION_STATE_MACHINE_H

#include <stdint.h>
#include <stdbool.h>

enum class IrrigationState {
  IDLE,
  VEG_VALVE_OPEN,
  PUMP_ON_VEG,
  ZONE_VEG_ACTIVE,
  ZONE_VEG_STOPPING,
  PADDY_VALVE_OPEN,
  PUMP_ON_PADDY,
  ZONE_PADDY_ACTIVE,
  ZONE_PADDY_STOPPING,
  COOLDOWN,
  EMERGENCY_STOP
};

enum class IrrigationZone { NONE, VEGETABLE, PADDY };
enum class IrrigationMode { AUTO, MANUAL };

class IrrigationStateMachine {
public:
  IrrigationStateMachine();

  void update(uint32_t nowMs, float vegMoisture, float paddyMoisture);
  void startManual(IrrigationZone zone, uint32_t durationMs);
  void emergencyStop();
  void resume();
  void setAutoMode();
  void setManualMode();

  IrrigationState getState() const;
  IrrigationZone  getActiveZone() const;
  IrrigationMode  getMode() const;
  bool isPumpOn() const;
  bool isVegValveOpen() const;
  bool isPaddyValveOpen() const;
  uint32_t getElapsedMs(uint32_t nowMs) const;

private:
  IrrigationState m_state;
  IrrigationZone  m_activeZone;
  IrrigationMode  m_mode;
  uint32_t        m_stateStartMs;
  uint32_t        m_manualDurationMs;
  bool            m_pumpOn;
  bool            m_vegValveOpen;
  bool            m_paddyValveOpen;

  void transitionTo(IrrigationState newState, uint32_t nowMs);
  void setPump(bool on);
  void setVegValve(bool open);
  void setPaddyValve(bool open);
};

#endif // IRRIGATION_STATE_MACHINE_H
