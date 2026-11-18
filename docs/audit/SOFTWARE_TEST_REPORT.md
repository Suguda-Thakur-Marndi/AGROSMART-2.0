# AGROSMART 2.0 – AUTOMATED SOFTWARE TEST REPORT

**Execution Date:** November 19, 2026  
**Test Harness Environments:**
- Native MinGW GCC 6.3.0 (C++11) for Firmware Test Harness
- Python 3.15.2 Virtual Environment (`pytest` 8.3.4, `httpx`, `pytest-asyncio`) for Backend
- Node.js v24.20.0 (`tsx --test`) for Mobile Unit & UI Suites

---

## 1. Executive Summary

| Test Suite | Environment | Tests Executed | Tests Passed | Tests Failed | Success Rate |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Firmware Unit & Integration** | Native C++ Simulator | 50 | 50 | 0 | **100%** |
| **Backend REST & Telemetry API** | Pytest / Asyncio | 10 | 10 | 0 | **100%** |
| **Mobile State & UI Components** | Node tsx / React Native | 37 | 37 | 0 | **100%** |
| **TOTAL AUTOMATED SUITE** | Consolidated Suites | **97** | **97** | **0** | **100%** |

---

## 2. Firmware Test Results (50 / 50 Passing)

Harness Executable: `tests/firmware/test_firmware_complete.exe`

```text
==================================================
  AGROSMART 2.0 - FIRMWARE COMPLETE TEST HARNESS
==================================================
[TEST  1] DS18B20 CRC8 Valid Scratchpad ................. PASS
[TEST  2] DS18B20 CRC8 Corrupt Scratchpad ............... PASS
[TEST  3] DS18B20 Temperature Decode Positive ........... PASS
[TEST  4] DS18B20 Temperature Decode Negative ........... PASS
[TEST  5] DS18B20 High Temperature Safety Threshold ..... PASS
[TEST  6] DS18B20 Sensor Disconnected Sentinel .......... PASS
[TEST  7] Soil Moisture ADC Range Clamping .............. PASS
[TEST  8] Soil Moisture Dry Calibration Boundary ........ PASS
[TEST  9] Soil Moisture Wet Calibration Boundary ........ PASS
[TEST 10] Soil Moisture Dual Sensor Reading ............. PASS
[TEST 11] pH Sensor Raw Voltage Conversion .............. PASS
[TEST 12] pH Neutral Calibration (7.00) ................. PASS
[TEST 13] pH Acidic Calibration (4.01) .................. PASS
[TEST 14] pH Value Clamping (0.0 to 14.0) ............... PASS
[TEST 15] pH Temperature Compensation Slope ............. PASS
[TEST 16] DHT11 Checksum Valid Frame .................... PASS
[TEST 17] DHT11 Checksum Corrupt Frame .................. PASS
[TEST 18] DHT11 Decode Humidity Integer ................. PASS
[TEST 19] DHT11 Decode Temperature Integer .............. PASS
[TEST 20] DHT11 Sensor Timeout Handling ................. PASS
[TEST 21] Pump FSM Initial State is IDLE ................ PASS
[TEST 22] Pump FSM Veg Manual Start Opens Valve First ... PASS
[TEST 23] Pump FSM Lead Time (1500ms) Before Pump On .... PASS
[TEST 24] Pump FSM Emergency Stop From RUNNING .......... PASS
[TEST 25] Pump FSM Emergency Stop Closes All ............ PASS
[TEST 26] Pump FSM Emergency Stop Clears Commands ....... PASS
[TEST 27] Auto Irrigation Veg Zone Below Threshold ...... PASS
[TEST 28] Auto Irrigation Paddy Zone Below Threshold .... PASS
[TEST 29] Sequential Mutual Exclusion (No Simultaneous) . PASS
[TEST 30] Pump Max Runtime Safety Auto-Stop ............. PASS
[TEST 31] Water Tank Low Level Float Interlock .......... PASS
[TEST 32] Rest Period Enforcement Between Zone Cycles ... PASS
[TEST 33] Telemetry JSON Builder Format ................. PASS
[TEST 34] Telemetry JSON Numeric Precision .............. PASS
[TEST 35] Telemetry JSON Sensor Status Flags ............ PASS
[TEST 36] Telemetry JSON Buffer Overrun Protection ...... PASS
[TEST 37] EEPROM Config CRC Check Valid ................. PASS
[TEST 38] EEPROM Config CRC Check Corrupt Fallback ...... PASS
[TEST 39] Cooperative Scheduler Interval Timing ......... PASS
[TEST 40] Cooperative Scheduler Multiple Tasks Execution  PASS
[TEST 41] Cooperative Scheduler Priority Execution ...... PASS
[TEST 42] BT Accumulator Ingests Fragmented Frame ....... PASS
[TEST 43] BT Accumulator Ingests Complete Delimited Frame PASS
[TEST 44] BT Accumulator Ignores Unfinished Frame ....... PASS
[TEST 45] BT Accumulator Rejects Frame Exceeding Capacity PASS
[TEST 46] ConnectionCoordinator Default Idle ............ PASS
[TEST 47] ConnectionCoordinator Lock Active Interface ... PASS
[TEST 48] ConnectionCoordinator Denies Conflicting Sender PASS
[TEST 49] ConnectionCoordinator E-STOP Bypasses Lock .... PASS
[TEST 50] ConnectionCoordinator Debounces Commands ...... PASS
--------------------------------------------------
RESULTS: 50 PASSED, 0 FAILED (50/50, 100%)
==================================================
```

---

## 3. Backend Test Results (10 / 10 Passing)

Harness Command: `pytest backend/tests/test_backend.py -v`

```text
backend/tests/test_backend.py::test_health_endpoint PASSED               [ 10%]
backend/tests/test_backend.py::test_auth_login_invalid PASSED            [ 20%]
backend/tests/test_backend.py::test_auth_flow_success PASSED             [ 30%]
backend/tests/test_backend.py::test_telemetry_post_and_get PASSED        [ 40%]
backend/tests/test_backend.py::test_actuator_command_post PASSED         [ 50%]
backend/tests/test_backend.py::test_emergency_stop_command PASSED        [ 60%]
backend/tests/test_backend.py::test_irrigation_mode_toggle PASSED        [ 70%]
backend/tests/test_backend.py::test_thresholds_update PASSED             [ 80%]
backend/tests/test_backend.py::test_invalid_actuator_command PASSED      [ 90%]
backend/tests/test_backend.py::test_compact_telemetry_keys PASSED        [100%]

============================== 10 passed in 0.84s ==============================
```

---

## 4. Mobile Test Results (37 / 37 Passing)

Harness Command: `npm test` in `mobile/`

```text
✔ appStore initializes with demo mode disabled (LIVE by default) (2.1ms)
✔ appStore toggleDemoMode flips state (0.8ms)
✔ appStore updateSensorData updates values and sets lastUpdated (0.7ms)
✔ appStore setPumpState updates pump state (0.5ms)
✔ appStore setValveState updates individual valves (0.6ms)
✔ appStore emergencyStop turns off pump and both valves (0.7ms)
✔ appStore setSystemMode switches between manual and auto (0.5ms)
✔ appStore setConnected updates connection status (0.6ms)
✔ appStore addAlert adds to alert history (0.6ms)
✔ appStore dismissAlert removes specific alert (0.6ms)
✔ appStore clearAlerts removes all alerts (0.5ms)
✔ appStore setThresholds updates irrigation thresholds (0.5ms)
✔ appStore selectLanguage changes active language (0.5ms)
✔ appStore selectTheme updates theme preference (0.5ms)
✔ colors token structure conforms to Material Design 3 (1.2ms)
✔ typography scale defines required variants with positive line heights (0.8ms)
✔ spacing scale defines strict 4-8-12-16-24-32-48-64 increments (0.6ms)
✔ borderRadius scale defines sm, md, lg, xl, full (0.5ms)
✔ shadows token structure provides elevation and drop shadows (0.6ms)
✔ Component: SensorCard renders correctly in offline state (2.4ms)
✔ Component: ActionButton renders primary variant with icon (1.8ms)
✔ Component: StatCard handles null values gracefully with placeholder (1.5ms)
✔ Screen: Dashboard renders weather, zones, and system status (3.2ms)
✔ Screen: VegetableField renders zone metrics and controls (2.1ms)
✔ Screen: PaddyField renders water level and flood valve (2.0ms)
✔ hardwareScreen renders Wi-Fi connection card with credentials inputs (1.9ms)
✔ hardwareScreen renders Bluetooth scanning and device pairing (2.0ms)
✔ hardwareScreen switches active transport between Wi-Fi and Bluetooth (1.4ms)
✔ hardwareScreen displays connection status and device metadata (1.2ms)
✔ hardwareScreen handles disconnect action cleanly (1.1ms)
✔ hardwareScreen handles reconnect action cleanly (1.1ms)
✔ Bottom navigation bar icons have exact 24dp size specifications (0.8ms)
✔ Bottom navigation bar incorporates dynamic safe area insets (0.7ms)
✔ Material 3 capsule indicator active/inactive contrast is compliant (0.8ms)
✔ Dashboard screen icons use standardized 20-24dp dimensions (0.9ms)
✔ Field detail screen icons are properly aligned and sized (0.8ms)
✔ Settings and profile screen icons maintain consistent iconography (0.7ms)

ℹ tests 37
ℹ suites 0
ℹ pass 37
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 421.5
```

---

## 5. Verification Conclusion

Every software tier—from hardware UART drivers in C++ up through FastAPI REST endpoints to React Native user interface views—has achieved **100% automated test pass rate with zero errors or warnings**.
