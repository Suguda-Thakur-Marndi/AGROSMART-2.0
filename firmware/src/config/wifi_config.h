/**
 * AgroSmart 2.0 – Wi-Fi & Backend Communication Configuration
 *
 * Exclusively uses Wi-Fi via onboard ESP8266 module on Arduino Mega Serial1.
 * Cellular A7672S and Bluetooth are disabled per hardware connectivity mandate.
 */

#ifndef WIFI_CONFIG_H
#define WIFI_CONFIG_H

// Default Wi-Fi Access Point credentials
#define DEFAULT_WIFI_SSID            "AgroSmart_Farm_AP"
#define DEFAULT_WIFI_PASS            "agro_smart_2026"

// FastAPI Backend Endpoint Configuration
#define BACKEND_HOST                 "192.168.1.100" // Configure to local LAN IP or cloud domain
#define BACKEND_PORT                 8000
#define BACKEND_TELEMETRY_PATH       "/api/v1/telemetry/ingest"
#define BACKEND_COMMAND_POLL_PATH    "/api/v1/devices/agrosmart-mega-01/commands/poll"

// Device Identity & Security Tokens
#define DEVICE_ID                    "agrosmart-mega-01"
#define DEVICE_AUTH_TOKEN            "agt_live_mega2560_sec_key_2026"

// Timing & Intervals
#define TELEMETRY_SEND_INTERVAL_MS   5000   // Send telemetry every 5 seconds
#define COMMAND_POLL_INTERVAL_MS     2000   // Poll for backend commands every 2 seconds
#define HEARTBEAT_INTERVAL_MS        30000  // Send keep-alive every 30 seconds
#define WIFI_RECONNECT_INTERVAL_MS   10000  // Attempt reconnection every 10 seconds on drop

// Offline Telemetry Ring Buffer Capacity (Stores up to 20 readings during network drop)
#define OFFLINE_BUFFER_CAPACITY      20

#endif // WIFI_CONFIG_H
