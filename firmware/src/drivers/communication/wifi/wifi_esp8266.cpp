/**
 * AgroSmart 2.0 – ESP8266 Wi-Fi AT Command Driver Implementation
 */

#include "wifi_esp8266.h"
#include <string.h>
#include <stdio.h>

#ifdef ARDUINO
#include <Arduino.h>
#define WIFI_SERIAL Serial1
#endif

WifiEsp8266::WifiEsp8266()
  : m_connected(false),
    m_ringHead(0),
    m_ringTail(0),
    m_ringCount(0),
    m_hasPendingCommand(false),
    m_reconnectAttempts(0)
{
  memset(m_ringBuffer, 0, sizeof(m_ringBuffer));
  memset(m_pendingCommand, 0, sizeof(m_pendingCommand));
}

void WifiEsp8266::init() {
#ifdef ARDUINO
  WIFI_SERIAL.begin(115200);
  delay(1000);
  // Reset module
  sendAtCommand("AT+RST", "ready", 5000);
  delay(2000);
  // Set station mode
  sendAtCommand("AT+CWMODE=1", "OK", 2000);
  m_connected = false;
#else
  // Stub: treat as connected in test mode
  m_connected = true;
#endif
}

bool WifiEsp8266::connectAP(const char* ssid, const char* password) {
#ifdef ARDUINO
  char cmd[128];
  snprintf(cmd, sizeof(cmd), "AT+CWJAP=\"%s\",\"%s\"", ssid, password);
  if (sendAtCommand(cmd, "WIFI GOT IP", 15000)) {
    m_connected = true;
    m_reconnectAttempts = 0;
    flushQueue(); // Send any queued telemetry
    return true;
  }
  m_reconnectAttempts++;
  m_connected = false;
  return false;
#else
  m_connected = true;
  return true;
#endif
}

bool WifiEsp8266::isConnected() const {
  return m_connected;
}

bool WifiEsp8266::enqueue(const char* msg) {
  if (m_ringCount >= WIFI_RING_BUFFER_SIZE) {
    // Buffer full: overwrite oldest (tail)
    m_ringTail = (m_ringTail + 1) % WIFI_RING_BUFFER_SIZE;
    m_ringCount--;
  }
  strncpy(m_ringBuffer[m_ringHead], msg, WIFI_MAX_MSG_LEN - 1);
  m_ringBuffer[m_ringHead][WIFI_MAX_MSG_LEN - 1] = '\0';
  m_ringHead = (m_ringHead + 1) % WIFI_RING_BUFFER_SIZE;
  m_ringCount++;
  return true;
}

bool WifiEsp8266::dequeue(char* out, size_t maxLen) {
  if (m_ringCount == 0) return false;
  strncpy(out, m_ringBuffer[m_ringTail], maxLen - 1);
  out[maxLen - 1] = '\0';
  m_ringTail = (m_ringTail + 1) % WIFI_RING_BUFFER_SIZE;
  m_ringCount--;
  return true;
}

void WifiEsp8266::flushQueue() {
  char buf[WIFI_MAX_MSG_LEN];
  while (m_ringCount > 0 && m_connected) {
    if (dequeue(buf, sizeof(buf))) {
#ifdef ARDUINO
      // Send HTTP POST via AT+CIPSEND
      // (simplified: just log in production)
      WIFI_SERIAL.println(buf);
#endif
    }
  }
}

bool WifiEsp8266::sendTelemetry(const char* jsonStr) {
  if (!m_connected) {
    // Queue for later
    enqueue(jsonStr);
    return false;
  }

#ifdef ARDUINO
  char cmd[64];
  uint16_t len = (uint16_t)strlen(jsonStr);
  // Open TCP connection to backend
  sendAtCommand("AT+CIPSTART=\"TCP\",\"192.168.1.100\",8000", "OK", 3000);
  snprintf(cmd, sizeof(cmd), "AT+CIPSEND=%u", len);
  if (sendAtCommand(cmd, ">", 2000)) {
    WIFI_SERIAL.print(jsonStr);
    return waitForResponse("SEND OK", 3000);
  }
  return false;
#else
  // Test stub: always succeeds when connected
  return true;
#endif
}

bool WifiEsp8266::pollCommand(char* buf, size_t maxLen) {
  if (!m_hasPendingCommand) return false;
  strncpy(buf, m_pendingCommand, maxLen - 1);
  buf[maxLen - 1] = '\0';
  m_hasPendingCommand = false;
  return true;
}

uint8_t WifiEsp8266::getQueuedCount() const {
  return m_ringCount;
}

void WifiEsp8266::injectConnected(bool connected) {
  m_connected = connected;
  if (connected) {
    m_reconnectAttempts = 0;
    flushQueue();
  }
}

void WifiEsp8266::injectCommandResponse(const char* json) {
  strncpy(m_pendingCommand, json, WIFI_MAX_MSG_LEN - 1);
  m_pendingCommand[WIFI_MAX_MSG_LEN - 1] = '\0';
  m_hasPendingCommand = true;
}

#ifdef ARDUINO
bool WifiEsp8266::sendAtCommand(const char* cmd, const char* expectedResponse, uint16_t timeoutMs) {
  WIFI_SERIAL.println(cmd);
  return waitForResponse(expectedResponse, timeoutMs);
}

bool WifiEsp8266::waitForResponse(const char* expected, uint16_t timeoutMs) {
  char response[256] = {0};
  uint16_t idx = 0;
  uint32_t start = millis();
  while ((millis() - start) < timeoutMs) {
    while (WIFI_SERIAL.available()) {
      char c = (char)WIFI_SERIAL.read();
      if (idx < 255) response[idx++] = c;
      response[idx] = '\0';
      if (strstr(response, expected)) return true;
    }
  }
  return false;
}
#endif
