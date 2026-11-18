/**
 * AgroSmart 2.0 – Connection Coordinator & Safety Arbitration Implementation
 */

#include "connection_coordinator.h"
#include <string.h>
#include <stdio.h>
#include <stdlib.h>

#define CONTROLLER_TIMEOUT_MS  30000UL // 30s timeout releases controller lock
#define DUP_FILTER_WINDOW_MS   2000UL  // 2s duplicate rejection window

ConnectionCoordinator::ConnectionCoordinator(WifiEsp8266& wifi, BluetoothDriver& bt, IrrigationStateMachine& fsm)
  : m_wifi(wifi),
    m_bt(bt),
    m_fsm(fsm),
    m_activeController(ActiveController::NONE),
    m_lastHeartbeatMs(0),
    m_controllerLockTimeoutMs(CONTROLLER_TIMEOUT_MS),
    m_lastExecutedCmdTimeMs(0)
{
  memset(m_lastExecutedCmdId, 0, sizeof(m_lastExecutedCmdId));
}

void ConnectionCoordinator::update(uint32_t nowMs) {
  // 1. Controller Lock Inactivity Timeout: release lock if no traffic
  if (m_activeController != ActiveController::NONE) {
    if (nowMs - m_lastHeartbeatMs >= m_controllerLockTimeoutMs) {
      // Safety: If manual irrigation is active and phone connection dropped, stop pump
      if (m_fsm.getMode() == IrrigationMode::MANUAL && m_fsm.isPumpOn()) {
        m_fsm.emergencyStop();
      }
      m_activeController = ActiveController::NONE;
    }
  }

  // 2. Poll Wi-Fi commands
  char wifiBuf[160];
  if (m_wifi.pollCommand(wifiBuf, sizeof(wifiBuf))) {
    processCommand(ActiveController::WIFI, wifiBuf, nowMs);
  }

  // 3. Poll Bluetooth commands
  char btBuf[160];
  if (m_bt.pollCommand(btBuf, sizeof(btBuf))) {
    processCommand(ActiveController::BLUETOOTH, btBuf, nowMs);
  }
}

ActiveController ConnectionCoordinator::getActiveController() const {
  return m_activeController;
}

bool ConnectionCoordinator::hasActiveConnection() const {
  return m_activeController != ActiveController::NONE;
}

void ConnectionCoordinator::recordHeartbeat(ActiveController source, uint32_t nowMs) {
  m_activeController = source;
  m_lastHeartbeatMs = nowMs;
}

uint32_t ConnectionCoordinator::getLastHeartbeatMs() const {
  return m_lastHeartbeatMs;
}

bool ConnectionCoordinator::isDuplicate(const char* cmdId, uint32_t nowMs) {
  if (cmdId == NULL || strlen(cmdId) == 0) return false;
  if (strcmp(m_lastExecutedCmdId, cmdId) == 0 && (nowMs - m_lastExecutedCmdTimeMs < DUP_FILTER_WINDOW_MS)) {
    return true; // Duplicate within window
  }
  return false;
}

void ConnectionCoordinator::parseCommandString(const char* raw, ParsedCommand& out) {
  memset(&out, 0, sizeof(out));
  out.isValid = false;
  if (!raw || strlen(raw) == 0) return;

  // Check for simple JSON e.g. {"cmd_id":"123","action":"START","zone":"vegetable","duration":180}
  const char* idPtr = strstr(raw, "\"cmd_id\":\"");
  if (idPtr) {
    idPtr += 10;
    size_t i = 0;
    while (*idPtr && *idPtr != '\"' && i < sizeof(out.cmdId) - 1) {
      out.cmdId[i++] = *idPtr++;
    }
    out.cmdId[i] = '\0';
  }

  const char* actPtr = strstr(raw, "\"action\":\"");
  if (actPtr) {
    actPtr += 10;
    size_t i = 0;
    while (*actPtr && *actPtr != '\"' && i < sizeof(out.action) - 1) {
      out.action[i++] = *actPtr++;
    }
    out.action[i] = '\0';
  } else {
    // Check plain string action (e.g. "EMERGENCY_STOP" or "PING")
    if (strstr(raw, "EMERGENCY_STOP")) {
      strncpy(out.action, "EMERGENCY_STOP", sizeof(out.action) - 1);
    } else if (strstr(raw, "STOP")) {
      strncpy(out.action, "STOP", sizeof(out.action) - 1);
    } else if (strstr(raw, "PING")) {
      strncpy(out.action, "PING", sizeof(out.action) - 1);
    }
  }

  const char* zonePtr = strstr(raw, "\"zone\":\"");
  if (zonePtr) {
    zonePtr += 8;
    size_t i = 0;
    while (*zonePtr && *zonePtr != '\"' && i < sizeof(out.zone) - 1) {
      out.zone[i++] = *zonePtr++;
    }
    out.zone[i] = '\0';
  }

  const char* durPtr = strstr(raw, "\"duration\":");
  if (durPtr) {
    durPtr += 11;
    out.durationSec = (uint32_t)atoi(durPtr);
  } else {
    out.durationSec = 180; // default 3 mins
  }

  out.isValid = (strlen(out.action) > 0);
}

bool ConnectionCoordinator::processCommand(ActiveController source, const char* rawCmd, uint32_t nowMs) {
  ParsedCommand cmd;
  parseCommandString(rawCmd, cmd);
  if (!cmd.isValid) return false;

  // SAFETY EXCEPTION: EMERGENCY_STOP is ALWAYS executed regardless of controller lock!
  if (strcmp(cmd.action, "EMERGENCY_STOP") == 0) {
    m_fsm.emergencyStop();
    if (source == ActiveController::BLUETOOTH) {
      m_bt.sendAck(cmd.cmdId, cmd.action, true, "EMERGENCY_STOP_EXECUTED");
    }
    recordHeartbeat(source, nowMs);
    return true;
  }

  // SAFETY 1: Single Active Controller Arbitration
  if (m_activeController != ActiveController::NONE && m_activeController != source) {
    if (nowMs - m_lastHeartbeatMs < m_controllerLockTimeoutMs) {
      // Reject command: device locked by other interface
      if (source == ActiveController::BLUETOOTH) {
        m_bt.sendAck(cmd.cmdId, cmd.action, false, "REJECTED_DEVICE_LOCKED_BY_WIFI");
      }
      return false;
    }
  }

  // Record active controller authority and refresh heartbeat
  recordHeartbeat(source, nowMs);

  // SAFETY 2: Duplicate Command Prevention
  if (isDuplicate(cmd.cmdId, nowMs)) {
    if (source == ActiveController::BLUETOOTH) {
      m_bt.sendAck(cmd.cmdId, cmd.action, false, "DROPPED_DUPLICATE_COMMAND");
    }
    return false;
  }

  // Record command ID to debounce future retries
  strncpy(m_lastExecutedCmdId, cmd.cmdId, sizeof(m_lastExecutedCmdId) - 1);
  m_lastExecutedCmdId[sizeof(m_lastExecutedCmdId) - 1] = '\0';
  m_lastExecutedCmdTimeMs = nowMs;

  // Execute Action on FSM
  if (strcmp(cmd.action, "START") == 0) {
    IrrigationZone zone = IrrigationZone::VEGETABLE;
    if (strcmp(cmd.zone, "paddy") == 0) {
      zone = IrrigationZone::PADDY;
    }
    uint32_t durMs = cmd.durationSec * 1000UL;
    m_fsm.startManual(zone, durMs);

    if (source == ActiveController::BLUETOOTH) {
      m_bt.sendAck(cmd.cmdId, cmd.action, true, "PUMP_START_ACCEPTED");
    }
    return true;
  } else if (strcmp(cmd.action, "STOP") == 0) {
    m_fsm.emergencyStop();
    if (source == ActiveController::BLUETOOTH) {
      m_bt.sendAck(cmd.cmdId, cmd.action, true, "PUMP_STOP_ACCEPTED");
    }
    return true;
  } else if (strcmp(cmd.action, "PING") == 0) {
    if (source == ActiveController::BLUETOOTH) {
      m_bt.sendAck(cmd.cmdId, cmd.action, true, "PONG_AGROSMART_2_0");
    }
    return true;
  }

  return false;
}
