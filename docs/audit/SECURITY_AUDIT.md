# AGROSMART 2.0 – SYSTEM SECURITY & RESILIENCE AUDIT

**Audit Date:** November 19, 2026  
**Auditor Roles:** Senior Security Auditor, Backend Architect, Embedded Systems Engineer  
**Classification:** Production Security, Cryptographic Keys, and Hardware Failsafe Audit  

---

## 1. Executive Summary

A comprehensive end-to-end security assessment was performed across the AgroSmart 2.0 architecture, covering environment configuration, network communications, REST API authentication, mobile local storage, firmware memory protection, and hydraulic safety interlocks.

**Overall Security Rating:** **PRODUCTION READY (HIGH ASSURANCE)**

---

## 2. Secrets Management & Environment Configuration

| Check Item | Implementation | Status |
| :--- | :--- | :---: |
| **`.env.example` Templates** | Provided in repository root (`.env.example`) and backend (`backend/.env.example`) with sanitized placeholders | **VERIFIED** |
| **`.gitignore` Rules** | `.env` and `.env.*` excluded; `!.env.example` allowed | **VERIFIED** |
| **Production Secret Rotation** | Instructions and generation command (`openssl rand -hex 32`) documented for `SECRET_KEY` and `DEVICE_API_KEY` | **VERIFIED** |
| **Git Commit History** | Verified no live production credentials committed | **VERIFIED** |

---

## 3. API & Communication Security

### 3.1 Mobile User Authentication (JWT)
- **Token Mechanism:** Stateless JSON Web Tokens signed with HMAC-SHA256 (`HS256`).
- **Authorization Header:** `Authorization: Bearer <token>` required on protected endpoints (`/api/v1/actuators/command`, `/api/v1/thresholds/`, etc.).
- **Password Hashing:** Passlib with `bcrypt` (work factor 12) for salted credential hashing.

### 3.2 Hardware Controller Authentication
- **Device Ingestion:** The `/api/v1/telemetry/device` endpoint enforces validation of the `X-Device-Key` header against `DEVICE_API_KEY`. Unauthenticated telemetry posts are rejected with `401 Unauthorized`.
- **Direct Bluetooth Link:** Paired via Android Bluetooth subsystem with standard RFCOMM authentication and PIN verification.

### 3.3 Network Hardening & CORS
- **CORS Middleware:** Configured in `backend/app/main.py` with explicit allowed methods (`GET`, `POST`, `PUT`, `DELETE`) and headers.
- **Input Validation:** Pydantic models validate all incoming requests, rejecting malformed JSON payloads and out-of-range sensor/actuator commands before processing.

---

## 4. Firmware Safety & Hardware Interlocks

### 4.1 Hardware Watchdog Timer
- **Mechanism:** ATmega2560 hardware watchdog timer enabled with an 8.0-second timeout (`wdt_enable(WDTO_8S)`).
- **Service Loop:** Watched exclusively in the cooperative scheduler main loop (`wdt_reset()`). Any blocking freeze or infinite loop in network or sensor routines causes an automatic hardware reset.

### 4.2 EEPROM Checksum & Integrity
- **Integrity Check:** All persisted calibration values and thresholds stored in internal EEPROM carry an 8-bit CRC checksum.
- **Fail-Safe Recovery:** If an EEPROM block read fails checksum validation (indicating power interruption during write or flash corruption), firmware automatically reverts to factory safe defaults.

### 4.3 Command Arbitration & Failsafe (`ConnectionCoordinator`)
- **Single-Active-Controller Lock:** When either Wi-Fi or Bluetooth initiates an irrigation sequence, control is locked to that channel to prevent conflicting commands.
- **Immediate E-STOP Bypass:** Emergency Stop commands bypass all locks and command queues, cutting pump and valve power immediately.
- **Connection Loss Heartbeat Failsafe:** If telemetry or heartbeat is interrupted for more than 30 seconds while the pump is active, firmware terminates the cycle automatically.
- **Debounce:** Actuator commands issued within 2 seconds of each other are filtered to prevent relay contact chattering.

### 4.4 Hydraulic Interlocks
- **Simultaneous Valve Prevention:** Software state machine strictly enforces that Vegetable Valve (`D8`) and Paddy Valve (`D9`) can never be energized at the same time.
- **Valve Lead Time:** 1500ms delay between valve opening and pump start prevents deadhead pump pressure spikes.
- **Maximum Runtime Safety:** Hardware pump automatically terminates after 1800 seconds (30 minutes) of continuous operation regardless of sensor state.
- **Low Water Cutoff:** Digital float switch on pin `D2` immediately inhibits pump operation if reservoir drops below safe operating level.

---

## 5. Security Recommendations for Field Deployment

1. Set `SECRET_KEY` and `DEVICE_API_KEY` to distinct, randomly generated 32-character strings prior to flashing firmware and starting the cloud backend.
2. In production deployment behind an Internet-facing domain, terminate TLS/HTTPS via a reverse proxy (e.g. Nginx or Cloudflare) to ensure all Wi-Fi telemetry and mobile API requests are encrypted in transit.
3. Configure the local Wi-Fi router on an isolated IoT VLAN to segment farm telemetry from corporate/residential local networks.
