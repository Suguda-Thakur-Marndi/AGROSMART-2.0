/**
 * AgroSmart 2.0 – Connection Coordinator & Safety Arbitration
 * Controls authority between Wi-Fi and Bluetooth transports.
 */

#ifndef CONNECTION_COORDINATOR_H
#define CONNECTION_COORDINATOR_H

#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>
#include "wifi/wifi_esp8266.h"
#include "bluetooth/bluetooth_driver.h"
#include "../../irrigation/irrigation_state_machine.h"

enum class ActiveController {
  NONE,
  WIFI,
  BLUETOOTH
};

struct ParsedCommand {
  char     cmdId[32];
  char     action[16];   // "START", "STOP", "EMERGENCY_STOP", "PING"
  char     zone[16];     // "vegetable", "paddy"
  uint32_t durationSec;
  bool     isValid;
};

class ConnectionCoordinator {
public:
  ConnectionCoordinator(WifiEsp8266& wifi, BluetoothDriver& bt, IrrigationStateMachine& fsm);

  void update(uint32_t nowMs);

  ActiveController getActiveController() const;
  bool hasActiveConnection() const;

  // Process incoming command from specific transport
  bool processCommand(ActiveController source, const char* rawCmd, uint32_t nowMs);

  // Safety checks
  bool isDuplicate(const char* cmdId, uint32_t nowMs);
  void parseCommandString(const char* raw, ParsedCommand& out);

  // Heartbeat tracking
  void recordHeartbeat(ActiveController source, uint32_t nowMs);
  uint32_t getLastHeartbeatMs() const;

private:
  WifiEsp8266&            m_wifi;
  BluetoothDriver&        m_bt;
  IrrigationStateMachine& m_fsm;

  ActiveController m_activeController;
  uint32_t         m_lastHeartbeatMs;
  uint32_t         m_controllerLockTimeoutMs;

  char     m_lastExecutedCmdId[32];
  uint32_t m_lastExecutedCmdTimeMs;
};

#endif // CONNECTION_COORDINATOR_H
