# AGROSMART 2.0 – SECURITY & ACCESS CONTROL AUDIT

**Audit Date:** November 18, 2026  
**Auditor:** Application Security Lead & Embedded Systems Architect  

---

## 1. Authentication & Authorization Architecture

### 1.1 Mobile Client to Backend Security
- **Authentication Scheme:** OAuth2 Password flow with JSON Web Tokens (JWT).
- **Password Storage:** Salted and hashed using `passlib` with the `bcrypt` algorithm (cost factor 12).
- **Token Format:** Signed HS256 JWT tokens containing `user_id`, `email`, and expiration timestamp (`exp`).
- **Token Lifecycle:** 24-hour default expiration for access tokens.
- **Protected Endpoints:** All `/api/v1/irrigation`, `/api/v1/devices`, and `/api/v1/analytics` endpoints enforce Bearer authentication via FastAPI dependency injection (`get_current_user`).

### 1.2 IoT Edge Device to Backend Security
- **Authentication Scheme:** Cryptographic Device API Key header (`X-Device-Key`).
- **Key Generation:** 32-byte cryptographically secure pseudorandom token (`secrets.token_urlsafe(32)`).
- **Key Storage:** Stored as a SHA-256 hash in the `devices` database table to prevent plaintext compromise in database dumps.
- **Revocation:** Individual edge devices can be immediately decommissioned or revoked from the backend admin portal without impacting other nodes.

---

## 2. Firmware Security & Safety Boundaries

### 2.1 Watchdog & Deadlock Prevention
- **Hardware Watchdog:** AVR Watchdog Timer (WDT) enabled with an 8.0-second timeout period.
- **Strobe Logic:** `wdt_reset()` is executed strictly inside the primary superloop after all driver tasks report normal execution.
- **Infinite Loop Defense:** Any blocking call (e.g. frozen UART transmission or unacknowledged sensor bus) triggers an automatic hardware reset to return all actuators to their default de-energized state.

### 2.2 Memory Safety & Buffer Protections
- **Zero Dynamic Allocation:** The Arduino Mega firmware strictly avoids `malloc()`, `calloc()`, and dynamic `std::string` concatenation inside the runtime loop to eliminate SRAM heap fragmentation (critical on ATmega2560's 8KB SRAM).
- **Fixed Circular Buffers:** UART reception uses fixed-size ring buffers with boundary overflow guards.
- **EEPROM Integrity:** Configuration memory blocks are validated using a CRC32 checksum. Corrupt data triggers an immediate fallback to hardcoded factory safe parameters.

---

## 3. Physical & Hydraulic Safety Interlocks

| Threat | Impact | Firmware Safeguard | Software Safeguard |
| :--- | :--- | :--- | :--- |
| **Pipeline Burst / Hydraulic Deadhead** | High pressure ruptures pipe if pump runs with both valves closed | 1500 ms valve lead time before pump activation; pump will not start if valve pin state is LOW | Backend command validator checks valve status |
| **Simultaneous Valve Opening** | Reduced pressure, uneven flow, electrical overload | Mutual exclusion logic in state machine prevents both pins D8 & D9 HIGH | Actuator coordinator drops multi-zone commands |
| **Pump Dry Run / Runaway Flooding** | Motor overheating or field flooding | Hard maximum runtime timer (Zone 1: 10m, Zone 2: 20m) auto-shuts down pump | Backend watchdog flags abnormally long active sessions |
| **Sensor Disconnection** | Erroneous 0% reading causing continuous watering | Disconnection detection (ADC > 900) flags FAULT and blocks auto-irrigation | Backend triggers sensor alert notification |
| **Emergency STOP Failure** | Hardware damage during emergency | Active-low direct digital write to pump & valves bypassing all state transitions | App Emergency Stop button sends priority bypass packet |

---

## 4. Network Boundary & Local Attack Vectors

- **Local Wi-Fi Encryption:** Target network requires WPA2-PSK or WPA3-Personal. Open or unencrypted public SSIDs are prohibited.
- **CORS Configuration:** Backend implements explicit Cross-Origin Resource Sharing (CORS) whitelists, preventing cross-site scripting triggers from arbitrary web origins.
- **Telemetry Rate Limiting:** Telemetry ingestion endpoint limits requests to 1 packet per 2000 ms per device key, mitigating denial-of-service attempts against the database.
