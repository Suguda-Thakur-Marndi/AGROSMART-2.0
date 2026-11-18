/**
 * AgroSmart 2.0 – Bluetooth Communication Driver Implementation
 */

#include "bluetooth_driver.h"
#include <string.h>
#include <stdio.h>

#ifdef ARDUINO
#include <Arduino.h>
#define BT_SERIAL Serial2
#endif

BluetoothDriver::BluetoothDriver()
  : m_connected(false),
    m_paired(false),
    m_lastHeartbeatMs(0),
    m_ringHead(0),
    m_ringTail(0),
    m_ringCount(0),
    m_hasPendingCommand(false)
{
  memset(m_ringBuffer, 0, sizeof(m_ringBuffer));
  memset(m_pendingCommand, 0, sizeof(m_pendingCommand));
}

void BluetoothDriver::init(uint32_t baudRate) {
#ifdef ARDUINO
  BT_SERIAL.begin(baudRate);
  delay(100);
#else
  (void)baudRate;
  m_connected = true;
  m_paired = true;
#endif
}

bool BluetoothDriver::isConnected() const {
  return m_connected;
}

bool BluetoothDriver::isPaired() const {
  return m_paired;
}

bool BluetoothDriver::enqueue(const char* msg) {
  if (m_ringCount >= BT_RING_BUFFER_SIZE) {
    m_ringTail = (m_ringTail + 1) % BT_RING_BUFFER_SIZE;
    m_ringCount--;
  }
  strncpy(m_ringBuffer[m_ringHead], msg, BT_MAX_MSG_LEN - 1);
  m_ringBuffer[m_ringHead][BT_MAX_MSG_LEN - 1] = '\0';
  m_ringHead = (m_ringHead + 1) % BT_RING_BUFFER_SIZE;
  m_ringCount++;
  return true;
}

bool BluetoothDriver::dequeue(char* out, size_t maxLen) {
  if (m_ringCount == 0) return false;
  strncpy(out, m_ringBuffer[m_ringTail], maxLen - 1);
  out[maxLen - 1] = '\0';
  m_ringTail = (m_ringTail + 1) % BT_RING_BUFFER_SIZE;
  m_ringCount--;
  return true;
}

void BluetoothDriver::flushQueue() {
  char buf[BT_MAX_MSG_LEN];
  while (m_ringCount > 0 && m_connected) {
    if (dequeue(buf, sizeof(buf))) {
#ifdef ARDUINO
      BT_SERIAL.println(buf);
#endif
    }
  }
}

bool BluetoothDriver::sendTelemetry(const char* telemetryFrame) {
  if (!m_connected) {
    enqueue(telemetryFrame);
    return false;
  }
#ifdef ARDUINO
  BT_SERIAL.println(telemetryFrame);
  return true;
#else
  return true;
#endif
}

bool BluetoothDriver::sendAck(const char* cmdId, const char* action, bool success, const char* msg) {
  char ackBuffer[BT_MAX_MSG_LEN];
  snprintf(ackBuffer, sizeof(ackBuffer),
    "{\"ack\":%s,\"cmd_id\":\"%s\",\"action\":\"%s\",\"msg\":\"%s\"}",
    success ? "true" : "false", cmdId, action, msg ? msg : "OK");

  if (!m_connected) {
    return false;
  }
#ifdef ARDUINO
  BT_SERIAL.println(ackBuffer);
  return true;
#else
  return true;
#endif
}

bool BluetoothDriver::pollCommand(char* buf, size_t maxLen) {
#ifdef ARDUINO
  static char s_rxBuf[BT_MAX_MSG_LEN];
  static size_t s_rxLen = 0;

  while (BT_SERIAL.available()) {
    char c = (char)BT_SERIAL.read();
    if (c == '\n' || c == '\r') {
      if (s_rxLen > 0) {
        s_rxBuf[s_rxLen] = '\0';
        strncpy(buf, s_rxBuf, maxLen - 1);
        buf[maxLen - 1] = '\0';
        s_rxLen = 0;
        return true;
      }
    } else {
      if (s_rxLen < sizeof(s_rxBuf) - 1) {
        s_rxBuf[s_rxLen++] = c;
      } else {
        // Line too long: flush to prevent corrupted command
        s_rxLen = 0;
      }
    }
  }
#endif

  if (!m_hasPendingCommand) return false;
  strncpy(buf, m_pendingCommand, maxLen - 1);
  buf[maxLen - 1] = '\0';
  m_hasPendingCommand = false;
  return true;
}

uint8_t BluetoothDriver::getQueuedCount() const {
  return m_ringCount;
}

void BluetoothDriver::injectConnected(bool connected) {
  m_connected = connected;
  m_paired = connected;
}

void BluetoothDriver::injectCommand(const char* cmd) {
  strncpy(m_pendingCommand, cmd, BT_MAX_MSG_LEN - 1);
  m_pendingCommand[BT_MAX_MSG_LEN - 1] = '\0';
  m_hasPendingCommand = true;
}
