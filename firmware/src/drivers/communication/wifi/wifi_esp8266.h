/**
 * AgroSmart 2.0 – ESP8266 Wi-Fi Driver (AT Command Interface)
 * Target: EWS Arduino Mega IoT Grove Kit, Serial1 (Pins 18/19) @ 115200 baud
 */

#ifndef WIFI_ESP8266_H
#define WIFI_ESP8266_H

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

#define WIFI_RING_BUFFER_SIZE 20
#define WIFI_MAX_MSG_LEN 256

class WifiEsp8266 {
public:
  WifiEsp8266();
  void init();
  bool connectAP(const char* ssid, const char* password);
  bool isConnected() const;
  bool sendTelemetry(const char* jsonStr);
  bool pollCommand(char* buf, size_t maxLen);
  uint8_t getQueuedCount() const;

  // Test injection helpers (available in all builds)
  void injectConnected(bool connected);
  void injectCommandResponse(const char* json);

private:
  bool   m_connected;
  char   m_ringBuffer[WIFI_RING_BUFFER_SIZE][WIFI_MAX_MSG_LEN];
  uint8_t m_ringHead;
  uint8_t m_ringTail;
  uint8_t m_ringCount;
  char   m_pendingCommand[WIFI_MAX_MSG_LEN];
  bool   m_hasPendingCommand;
  uint8_t m_reconnectAttempts;

  bool enqueue(const char* msg);
  bool dequeue(char* out, size_t maxLen);
  void flushQueue();

#ifdef ARDUINO
  bool sendAtCommand(const char* cmd, const char* expectedResponse, uint16_t timeoutMs);
  bool waitForResponse(const char* expected, uint16_t timeoutMs);
#endif
};

#endif // WIFI_ESP8266_H
