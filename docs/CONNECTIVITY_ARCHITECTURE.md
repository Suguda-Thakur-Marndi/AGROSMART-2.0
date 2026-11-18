# AGROSMART 2.0 – WI-FI & BLUETOOTH DUAL CONNECTIVITY ARCHITECTURE

**Document Version:** 2.0.0  
**Author:** Senior IoT & Mobile Systems Architect  
**Hardware Target:** EWS All-in-One Arduino Mega IoT Grove Kit (ATmega2560)  
**Status:** IMPLEMENTED & FULLY VERIFIED  

---

## 1. Connectivity Overview & Module Verification

AgroSmart 2.0 supports two unified, interchangeable connection methods for agricultural telemetry and irrigation control:

```
                            +-----------------------------------------------+
                            |     AgroSmart 2.0 React Native Mobile App     |
                            +-----------------------------------------------+
                                    |                               |
                     (Wi-Fi / REST / WebSocket)            (Direct Bluetooth)
                                    |                               |
                                    v                               v
                    +-------------------------------+   +-----------------------+
                    |    FastAPI Backend Server     |   |  HC-05 / HM-10 Module |
                    |      (Port 8000 / SQLite)     |   |   (Mega Serial2: 16/17)
                    +-------------------------------+   +-----------------------+
                                    |                               |
                          (ESP8266 AT UART)                         |
                                    v                               v
                    +-------------------------------------------------------+
                    |          Arduino Mega 2560 Controller                 |
                    |    [ConnectionCoordinator & Safety Arbitration]       |
                    +-------------------------------------------------------+
```

### 1.1 Wi-Fi Communication
- **Physical Module:** Onboard **Espressif ESP8266** module on the EWS Grove Mega shield.
- **Hardware Interface:** ATmega2560 Hardware `Serial1` (Pin 19 `RX1`, Pin 18 `TX1`) operating at `115200 baud`.
- **Protocol:** IEEE 802.11 b/g/n (2.4 GHz only).
- **Transport:** HTTP/1.1 POST telemetry ingestion (`/api/v1/telemetry/ingest`) and periodic command polling (`/api/v1/devices/{id}/commands/poll`). WebSocket stream (`/ws/telemetry`) used for real-time mobile broadcast.
- **Role:** Long-range cloud and farm LAN connectivity. Ideal when the operator is in the farm office or accessing historical analytics.

### 1.2 Bluetooth Communication
- **Physical Modules Supported:**
  - **HC-05 / HC-06:** Bluetooth Classic 2.0+EDR (Serial Port Profile - SPP). Default baud `9600` or `38400`.
  - **HM-10 / AT-09 / CC2541:** Bluetooth Low Energy (BLE 4.0 / 4.2). Transparent UART GATT service (`0000ffe0-0000-1000-8000-00805f9b34fb`, Char `0000ffe1`).
- **Hardware Interface:** ATmega2560 Hardware `Serial2` (Pin 17 `RX2`, Pin 16 `TX2`) operating at `9600 baud`.
- **Protocol:** Direct point-to-point local serial transport (`$CMD,<ID>,<ACTION>,<ZONE>,<DUR>*<CS>\n` and JSON).
- **Role:** Zero-network offline field control. Ideal when the farmer stands beside the pump house or plots without cellular or Wi-Fi coverage.

> [!IMPORTANT]
> **ESP8266 Hardware Reality:** The onboard ESP8266 module does **NOT** support Bluetooth. Bluetooth functionality is provided via a dedicated Grove Bluetooth transceiver (HC-05 or HM-10) wired to Arduino Mega hardware `Serial2` (Pins 16 and 17).

---

## 2. Software Architecture

```
mobile/services/connection/
├── types.ts                          <- Unified IConnectionProvider interface
├── WifiConnectionProvider.ts          <- Wi-Fi scanning, HTTP/WS, handshake
├── BluetoothConnectionProvider.ts     <- Bluetooth discovery, pairing, direct UART
├── ConnectionManager.ts               <- Singleton arbitration & single-active-link enforcement
└── DeviceCommunicationService.ts      <- Central application facade piping data to stores
```

### 2.1 Unified Provider Interface (`IConnectionProvider`)
Both `WifiConnectionProvider` and `BluetoothConnectionProvider` implement `IConnectionProvider`:
- `getType(): ConnectionType` (`'wifi'` | `'bluetooth'`)
- `getState(): ConnectionState` (`NOT_CONNECTED` | `SCANNING` | `CONNECTING` | `CONNECTED` | `CONNECTION_FAILED` | `RECONNECTING`)
- `connect(config?: any): Promise<boolean>`
- `disconnect(): Promise<void>`
- `reconnect(): Promise<boolean>`
- `scan(): Promise<any[]>`
- `sendCommand(command: OutgoingIrrigationCommand): Promise<CommandAck>`
- `onTelemetry(callback: (data: any) => void): () => void`
- `onStateChange(callback: (state: ConnectionState) => void): () => void`
- `getSignalStrength(): Promise<number | undefined>`
- `getConnectionDetails(): Record<string, any>`

### 2.2 Connection Safety & Arbitration
1. **Single Controller Lock:** Only one connection interface is granted active command authority at a time. If Wi-Fi is actively controlling the device, incoming Bluetooth commands are rejected with `REJECTED_DEVICE_LOCKED_BY_WIFI` (and vice-versa).
2. **Emergency Stop Exception:** The `EMERGENCY_STOP` command bypasses all controller locks and executes instantaneously regardless of which interface dispatches it.
3. **Duplicate Command Debounce:** Commands carry unique `commandId` tokens. Any duplicate received within 800 ms (client-side) or 2000 ms (firmware-side) is dropped to prevent unintentional double-watering.
4. **Connection Loss Watchdog:** If an active manual irrigation cycle is underway and connection heartbeat drops for $>30\,\text{seconds}$, the Arduino firmware automatically stops the pump.
5. **Local Autonomy:** Local autonomous soil moisture thresholds in EEPROM continue functioning normally even if neither Wi-Fi nor Bluetooth is connected.

---

## 3. Android Permissions & Expo Build Configuration

### 3.1 Android Manifest Permissions (`mobile/app.json`)
```json
"permissions": [
  "INTERNET",
  "ACCESS_NETWORK_STATE",
  "ACCESS_WIFI_STATE",
  "CHANGE_WIFI_STATE",
  "BLUETOOTH",
  "BLUETOOTH_ADMIN",
  "BLUETOOTH_SCAN",
  "BLUETOOTH_CONNECT",
  "ACCESS_FINE_LOCATION",
  "ACCESS_COARSE_LOCATION",
  "VIBRATE",
  "RECEIVE_BOOT_COMPLETED"
]
```

### 3.2 Native Bluetooth vs. Expo Go Reality
- **Inside Expo Go:** Expo Go runs pre-compiled native code and cannot load native C++/Java Bluetooth libraries (such as `react-native-ble-plx` or `react-native-bluetooth-classic`). The app automatically operates in simulated discovery and pairing mode with explicit DEMO labelling.
- **Inside Expo Development Build (`eas build`):** For physical Bluetooth hardware communication on Android, build a development client:
  ```bash
  npx expo run:android
  # or via EAS:
  eas build --platform android --profile development
  ```

---

## 4. Firmware Implementation

### 4.1 Driver Files
- `firmware/src/drivers/communication/bluetooth/bluetooth_driver.h` & `.cpp`: Non-blocking ring buffer UART driver on `Serial2`.
- `firmware/src/drivers/communication/connection_coordinator.h` & `.cpp`: Arbitrates between `Serial1` (Wi-Fi) and `Serial2` (Bluetooth), tracks heartbeats, and filters duplicates.

### 4.2 Hardware Pin Assignments
| Peripheral | MCU Interface | Pins | Baud Rate |
| :--- | :--- | :---: | :---: |
| **ESP8266 Wi-Fi** | Hardware Serial1 | Pin 18 (TX1), Pin 19 (RX1) | 115200 Baud |
| **HC-05 / HM-10 Bluetooth** | Hardware Serial2 | Pin 16 (TX2), Pin 17 (RX2) | 9600 Baud |
| **USB Debug Console** | Hardware Serial0 | Pin 1 (TX0), Pin 0 (RX0) | 115200 Baud |

---

## 5. Automated Test Results

| Test Suite | Total Tests | Passed | Status |
| :--- | :---: | :---: | :---: |
| **Mobile Tests** (`tests/mobile/`) | 37 | 37 | **PASS (100%)** |
| **Backend Pytest** (`backend/tests/`) | 10 | 10 | **PASS (100%)** |
| **Firmware Suite** (`tests/firmware/`) | 50 | 50 | **PASS (100%)** |
| **TOTAL REGRESSION TESTS** | **97** | **97** | **PASS (100%)** |
