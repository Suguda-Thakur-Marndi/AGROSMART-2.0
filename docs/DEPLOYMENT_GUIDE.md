# AgroSmart 2.0 – Production Deployment & Operations Guide

## 1. System Architecture Overview

AgroSmart 2.0 comprises three decoupled subsystems:
1. **Embedded Firmware:** Runs autonomously on EWS Arduino Mega IoT Grove Kit (ATmega2560).
2. **FastAPI Backend Server:** Runs on a farm LAN computer or cloud VM (Python 3.15, SQLite+aiosqlite).
3. **Android Mobile Application:** Built with React Native & Expo Router (`com.agrosmart.iot`).

---

## 2. Arduino Firmware Deployment

1. Connect the EWS Arduino Mega IoT Kit via USB cable to the programming workstation.
2. Launch Arduino IDE or CLI.
3. Select Board: **Arduino Mega or Mega 2560** (Processor: ATmega2560).
4. Select the active COM port (e.g., `COM3`).
5. Open `firmware/src/main.cpp`.
6. Ensure Wi-Fi credentials in `firmware/src/config/wifi_config.h` match the on-site 2.4 GHz Wi-Fi router.
7. Click **Upload**.
8. Verify initial boot on Serial Monitor at 115200 baud:
   ```
   [AgroSmart 2.0] Booting...
   [AgroSmart 2.0] Calibration loaded from EEPROM.
   [AgroSmart 2.0] Ready.
   ```

---

## 3. Backend Server Deployment

### Prerequisites:
- Python 3.10+ installed.
- Network access on port 8000.

### Starting the Server:
```powershell
cd "c:\Users\sugud\OneDrive\Documents\AGROSMART 2.0\backend"
.\.venv\Scripts\uvicorn.exe app.main:app --host 0.0.0.0 --port 8000
```

### Verification:
```powershell
Invoke-RestMethod http://localhost:8000/health
```
Expected output:
```json
{
  "status": "ok",
  "app": "AgroSmart 2.0 API",
  "version": "2.0.0",
  "database": "sqlite+aiosqlite"
}
```

---

## 4. Mobile Android Application Deployment

### Running in Development / Expo Go:
```powershell
cd "c:\Users\sugud\OneDrive\Documents\AGROSMART 2.0\mobile"
npx expo start
```
Scan the displayed QR code with the Expo Go Android app.

### Building Standalone Android Release APK:
```powershell
cd "c:\Users\sugud\OneDrive\Documents\AGROSMART 2.0\mobile"
npx eas build -p android --profile preview
```
