/**
 * AgroSmart 2.0 – Bluetooth Communication Driver (BLE & Classic SPP)
 * Target: EWS Arduino Mega 2560 (Hardware Serial2 on Pins 16 TX2, 17 RX2)
 */

#ifndef BLUETOOTH_DRIVER_H
#define BLUETOOTH_DRIVER_H

#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>

#define BT_RING_BUFFER_SIZE  8
#define BT_MAX_MSG_LEN       160
#define BT_DEFAULT_BAUD      9600

class BluetoothDriver {
public:
  BluetoothDriver();

  void init(uint32_t baudRate = BT_DEFAULT_BAUD);
  bool isConnected() const;
  bool isPaired() const;

  bool enqueue(const char* msg);
  bool dequeue(char* out, size_t maxLen);
  void flushQueue();

  bool sendTelemetry(const char* telemetryFrame);
  bool sendAck(const char* cmdId, const char* action, bool success, const char* msg);
  bool pollCommand(char* buf, size_t maxLen);

  uint8_t getQueuedCount() const;

  // Test injection helpers (for native unit test harness)
  void injectConnected(bool connected);
  void injectCommand(const char* cmd);

private:
  bool     m_connected;
  bool     m_paired;
  uint32_t m_lastHeartbeatMs;

  char    m_ringBuffer[BT_RING_BUFFER_SIZE][BT_MAX_MSG_LEN];
  uint8_t m_ringHead;
  uint8_t m_ringTail;
  uint8_t m_ringCount;

  bool m_hasPendingCommand;
  char m_pendingCommand[BT_MAX_MSG_LEN];
};

#endif // BLUETOOTH_DRIVER_H
