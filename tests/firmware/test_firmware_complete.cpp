/**
 * AgroSmart 2.0 – Complete Firmware Unit Test Suite
 * Compiled with MinGW g++ (no Arduino dependency)
 *
 * Tests 25 scenarios across all firmware modules.
 * Run: tests\firmware\test_firmware_complete.exe
 */

#include <cstdio>
#include <cstdint>
#include <cstdlib>
#include <cstring>
#include <cmath>

// ---- Include all firmware modules ----
#include "drivers/sensors/capacitive_moisture/capacitive_moisture.h"
#include "drivers/sensors/ph_sensor/ph_sensor.h"
#include "drivers/sensors/ds18b20/ds18b20.h"
#include "drivers/sensors/dht11/dht11.h"
#include "drivers/communication/wifi/wifi_esp8266.h"
#include "irrigation/irrigation_state_machine.h"
#include "safety/safety_interlock.h"
#include "telemetry/telemetry_builder.h"
#include "storage/eeprom_storage.h"
#include "core/scheduler.h"

// ============================================================================
// TEST FRAMEWORK
// ============================================================================
static int s_pass = 0;
static int s_fail = 0;
static int s_testNum = 0;

#define ASSERT(cond, desc) do { \
  s_testNum++; \
  if (cond) { \
    printf("[PASS] Test %2d: %s\n", s_testNum, desc); \
    s_pass++; \
  } else { \
    printf("[FAIL] Test %2d: %s\n", s_testNum, desc); \
    s_fail++; \
  } \
} while(0)

#define ASSERT_NEAR(val, expected, tol, desc) \
  ASSERT(fabsf((float)(val) - (float)(expected)) <= (float)(tol), desc)

// ============================================================================
// SCHEDULER TASK COUNTERS (for Test 25)
// ============================================================================
static int g_task1Count = 0;
static int g_task2Count = 0;

static void schedulerTask1() { g_task1Count++; }
static void schedulerTask2() { g_task2Count++; }

// ============================================================================
// TESTS
// ============================================================================
int main() {
  printf("=============================================================\n");
  printf("  AgroSmart 2.0 – Firmware Unit Test Suite\n");
  printf("=============================================================\n\n");

  // -------------------------------------------------------------------------
  // TEST 1-5: DS18B20 Driver
  // -------------------------------------------------------------------------

  // Test 1: CRC-8 known vector
  {
    // Scratchpad from DS18B20 at 25°C: {0x50,0x05,0x4B,0x46,0x1F,0xFF,0x0C,0x10,0xAC}
    uint8_t data[] = {0x50, 0x05, 0x4B, 0x46, 0x1F, 0xFF, 0x0C, 0x10};
    uint8_t crc = Ds18b20Sensor::calculateCrc8(data, 8);
    // CRC of this scratchpad is 0x8C (DOW polynomial, verified)
    ASSERT(crc == 0x8C, "DS18B20 CRC-8 known vector → 0x8C");
  }

  // Test 2: Valid temperature injection
  {
    Ds18b20Sensor ds(7);
    ds.init();
    ds.injectTemperature(25.5f, true);
    ASSERT(ds.isValid() && ds.isConnected(), "DS18B20 inject 25.5°C → isValid=true");
    ASSERT_NEAR(ds.getTemperatureC(), 25.5f, 0.01f, "DS18B20 getTemperatureC() == 25.5°C");
  }

  // Test 3: Power-on reset value (85°C) → invalid
  {
    Ds18b20Sensor ds(7);
    ds.init();
    ds.injectTemperature(85.0f, true);
    ASSERT(!ds.isValid(), "DS18B20 inject 85°C (power-on reset) → isValid=false");
  }

  // Test 4: Out-of-range temperature (70°C > TEMP_MAX_VALID_C=60°C) → invalid
  {
    Ds18b20Sensor ds(7);
    ds.init();
    ds.injectTemperature(70.0f, true);
    ASSERT(!ds.isValid(), "DS18B20 inject 70°C (out of range) → isValid=false");
  }

  // Test 5: Bad CRC → invalid
  {
    Ds18b20Sensor ds(7);
    ds.init();
    ds.injectTemperature(25.0f, false); // crcValid=false
    ASSERT(!ds.isValid(), "DS18B20 inject bad CRC → isValid=false");
  }

  // -------------------------------------------------------------------------
  // TEST 6-9: Capacitive Moisture Sensor
  // -------------------------------------------------------------------------

  // Test 6: Dry ADC (785) → ~0%
  {
    CapacitiveMoistureSensor ms(0);
    ms.init(785, 320);
    ms.injectRawAdc(785);
    ASSERT_NEAR(ms.getMoisturePercent(), 0.0f, 2.0f, "Moisture: inject ADC=785 → ~0%");
  }

  // Test 7: Wet ADC (320) → ~100% (inject 5x to fill moving average buffer)
  {
    CapacitiveMoistureSensor ms(0);
    ms.init(785, 320);
    for (int i = 0; i < 5; i++) ms.injectRawAdc(320); // Fill 5-sample buffer
    ASSERT_NEAR(ms.getMoisturePercent(), 100.0f, 2.0f, "Moisture: inject ADC=320 (5x) → ~100%");
  }

  // Test 8: Midpoint ADC → ~50% (inject 5x to fill moving average buffer)
  {
    CapacitiveMoistureSensor ms(0);
    ms.init(785, 320);
    for (int i = 0; i < 5; i++) ms.injectRawAdc(552); // Fill 5-sample buffer
    ASSERT_NEAR(ms.getMoisturePercent(), 50.0f, 5.0f, "Moisture: inject ADC=552 (mid, 5x) → ~50%");
  }

  // Test 9: Short-circuit ADC (15) → disconnected
  {
    CapacitiveMoistureSensor ms(0);
    ms.init(785, 320);
    ms.injectRawAdc(15);
    ASSERT(!ms.isConnected(), "Moisture: inject ADC=15 (short) → isConnected=false");
  }

  // -------------------------------------------------------------------------
  // TEST 10-12: pH Sensor
  // -------------------------------------------------------------------------

  // Test 10: Neutral buffer (1500mV) → pH ~7.0
  {
    PhSensor ph(2);
    ph.init(1500.0f, 2030.0f, 970.0f);
    ph.injectMilliVolts(1500.0f, 25.0f);
    ASSERT(ph.isValid(), "pH: inject 1500mV → isValid=true");
    ASSERT_NEAR(ph.getPh(), 7.0f, 0.3f, "pH: inject 1500mV → pH ~7.0");
  }

  // Test 11: Acid buffer (2030mV) → pH ~4.0 (inject 8x to fill moving average buffer)
  {
    PhSensor ph(2);
    ph.init(1500.0f, 2030.0f, 970.0f);
    for (int i = 0; i < 8; i++) ph.injectMilliVolts(2030.0f, 25.0f); // Fill 8-sample buffer
    ASSERT(ph.isValid(), "pH: inject 2030mV (8x) → isValid=true");
    ASSERT_NEAR(ph.getPh(), 4.0f, 0.4f, "pH: inject 2030mV (8x) → pH ~4.0");
  }

  // Test 12: Calibrate then verify accuracy
  {
    PhSensor ph(2);
    ph.init(1500.0f, 2030.0f, 970.0f);
    ph.calibrateBuffer7(1510.0f); // Fine-tune calibration
    ph.injectMilliVolts(1510.0f, 25.0f);
    float result = ph.getPh();
    ASSERT(result >= 6.5f && result <= 7.5f, "pH: calibrate+inject → pH within 6.5–7.5");
  }

  // -------------------------------------------------------------------------
  // TEST 13-15: DHT11 Sensor
  // -------------------------------------------------------------------------

  // Test 13: Valid inject
  {
    Dht11Sensor dht(4);
    dht.init();
    dht.injectReading(28.0f, 65.0f, true);
    ASSERT(dht.isValid(), "DHT11: inject 28°C, 65% → isValid=true");
    ASSERT_NEAR(dht.getTemperatureC(), 28.0f, 0.01f, "DHT11: getTemperatureC() == 28.0°C");
    ASSERT_NEAR(dht.getHumidityPercent(), 65.0f, 0.01f, "DHT11: getHumidityPercent() == 65.0%");
  }

  // Test 14: Bad checksum
  {
    Dht11Sensor dht(4);
    dht.init();
    dht.injectReading(28.0f, 65.0f, false); // checksumValid=false
    ASSERT(!dht.isValid(), "DHT11: bad checksum → isValid=false");
  }

  // Test 15: Out-of-range humidity
  {
    Dht11Sensor dht(4);
    dht.init();
    dht.injectReading(25.0f, 105.0f, true); // 105% > 100% limit
    ASSERT(!dht.isValid(), "DHT11: humidity=105% → isValid=false");
  }

  // -------------------------------------------------------------------------
  // TEST 16-20: Irrigation State Machine
  // -------------------------------------------------------------------------

  // Test 16: Initial state is IDLE
  {
    IrrigationStateMachine fsm;
    ASSERT(fsm.getState() == IrrigationState::IDLE, "FSM: initial state == IDLE");
  }

  // Test 17: startManual(VEGETABLE) → leaves IDLE
  {
    IrrigationStateMachine fsm;
    fsm.startManual(IrrigationZone::VEGETABLE, 10000);
    ASSERT(fsm.getState() != IrrigationState::IDLE, "FSM: startManual(VEG) → not IDLE");
    ASSERT(fsm.getActiveZone() == IrrigationZone::VEGETABLE,
           "FSM: startManual(VEG) → activeZone == VEGETABLE");
  }

  // Test 18: emergencyStop() → EMERGENCY_STOP
  {
    IrrigationStateMachine fsm;
    fsm.emergencyStop();
    ASSERT(fsm.getState() == IrrigationState::EMERGENCY_STOP,
           "FSM: emergencyStop() → state == EMERGENCY_STOP");
    ASSERT(!fsm.isPumpOn(), "FSM: emergencyStop() → pumpOn == false");
    ASSERT(!fsm.isVegValveOpen(), "FSM: emergencyStop() → vegValve == false");
  }

  // Test 19: Auto mode triggers veg zone when moisture < 35%
  {
    IrrigationStateMachine fsm;
    fsm.setAutoMode();
    fsm.update(1000, 25.0f, 70.0f); // vegMoisture=25% < 35% threshold
    ASSERT(fsm.getState() != IrrigationState::IDLE,
           "FSM: auto mode + vegMoist=25% → not IDLE (veg zone activated)");
    ASSERT(fsm.getActiveZone() == IrrigationZone::VEGETABLE,
           "FSM: auto mode + vegMoist=25% → activeZone == VEGETABLE");
  }

  // Test 20: Sequential lock – cannot start PADDY while VEG is active
  {
    IrrigationStateMachine fsm;
    fsm.startManual(IrrigationZone::VEGETABLE, 60000);
    IrrigationZone zoneBefore = fsm.getActiveZone();
    fsm.startManual(IrrigationZone::PADDY, 60000); // Should be ignored
    ASSERT(fsm.getActiveZone() == IrrigationZone::VEGETABLE,
           "FSM: sequential lock – startManual(PADDY) ignored while VEG active");
    (void)zoneBefore;
  }

  // -------------------------------------------------------------------------
  // TEST 21-22: Safety Interlock
  // -------------------------------------------------------------------------

  // Test 21: All valid readings → safe to irrigate
  {
    SafetyInterlock si;
    bool ok = si.checkSensors(45.0f, 65.0f, 7.0f, 24.0f, 28.0f, 65.0f);
    ASSERT(ok && si.isSafeToIrrigate(), "SafetyInterlock: all valid → isSafeToIrrigate=true");
  }

  // Test 22: pH out of range (15.0 > 14.0) → not safe
  {
    SafetyInterlock si;
    bool ok = si.checkSensors(45.0f, 65.0f, 15.0f, 24.0f, 28.0f, 65.0f);
    ASSERT(!ok && !si.isSafeToIrrigate(),
           "SafetyInterlock: pH=15.0 (invalid) → isSafeToIrrigate=false");
    ASSERT(si.getFaultMask() & 0x04, "SafetyInterlock: PH_FAULT bit set in fault mask");
  }

  // -------------------------------------------------------------------------
  // TEST 23: Telemetry Builder
  // -------------------------------------------------------------------------

  // Test 23: build() returns non-null with expected keys
  {
    TelemetryBuilder tb;
    const char* json = tb.build(12345UL, 42.1f, 68.3f, 6.8f, 24.5f, 29.1f, 72.0f,
                                false, false, false, "auto", "none", 0);
    ASSERT(json != nullptr, "TelemetryBuilder: build() returns non-null pointer");
    ASSERT(strstr(json, "\"vm\"") != nullptr, "TelemetryBuilder: JSON contains \"vm\" key");
    ASSERT(strstr(json, "\"pump\"") != nullptr, "TelemetryBuilder: JSON contains \"pump\" key");
    ASSERT(strstr(json, "\"ts\"") != nullptr, "TelemetryBuilder: JSON contains \"ts\" key");
  }

  // -------------------------------------------------------------------------
  // TEST 24: EEPROM Storage
  // -------------------------------------------------------------------------

  // Test 24: Save + Load round-trip
  {
    EepromStorage es;
    CalibrationData dataIn = {};
    dataIn.magic       = EepromStorage::MAGIC_BYTE;
    dataIn.vegDryAdc   = 790;
    dataIn.vegWetAdc   = 315;
    dataIn.paddyDryAdc = 800;
    dataIn.paddyWetAdc = 310;
    dataIn.phNeutralMv = 1510.0f;
    dataIn.phAcidMv    = 2040.0f;
    dataIn.phBaseMv    = 965.0f;
    es.save(dataIn);

    CalibrationData dataOut = {};
    bool loaded = es.load(dataOut);
    ASSERT(loaded, "EepromStorage: load() returns true after save()");
    ASSERT(dataOut.vegDryAdc == 790 &&
           dataOut.vegWetAdc == 315 &&
           dataOut.phNeutralMv == 1510.0f,
           "EepromStorage: loaded values match saved values");
  }

  // -------------------------------------------------------------------------
  // TEST 25: Cooperative Scheduler
  // -------------------------------------------------------------------------

  // Test 25: Tasks fire at correct intervals
  {
    CooperativeScheduler sched;
    sched.addTask(schedulerTask1, 1000); // Fire every 1000ms
    sched.addTask(schedulerTask2, 2000); // Fire every 2000ms
    g_task1Count = 0;
    g_task2Count = 0;

    sched.run(0);    // t=0: set lastRunMs, may fire depending on impl
    // Reset counters to avoid t=0 initialization fires
    g_task1Count = 0;
    g_task2Count = 0;

    sched.run(1001); // t=1001ms: task1 (1000ms) should fire
    ASSERT(g_task1Count >= 1, "Scheduler: task1 fires at t=1001ms (interval=1000ms)");
    ASSERT(g_task2Count == 0, "Scheduler: task2 NOT fired at t=1001ms (interval=2000ms)");

    sched.run(2001); // t=2001ms: task2 (2000ms) should fire
    ASSERT(g_task2Count >= 1, "Scheduler: task2 fires at t=2001ms (interval=2000ms)");
  }

  // ============================================================================
  // RESULTS
  // ============================================================================
  printf("\n=============================================================\n");
  printf("  Results: %d/%d tests passed", s_pass, s_testNum);
  if (s_fail == 0) {
    printf("  ✓ ALL TESTS PASSED\n");
  } else {
    printf("  ✗ %d TESTS FAILED\n", s_fail);
  }
  printf("=============================================================\n");

  return (s_fail == 0) ? 0 : 1;
}
