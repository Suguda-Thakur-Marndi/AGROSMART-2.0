/**
 * AgroSmart 2.0 – Main Firmware Entry Point
 * Target: EWS All-in-One Arduino Mega IoT Grove Kit (ATmega2560)
 *
 * Architecture:
 *   - 4 scheduled tasks via Scheduler (sensors/5s, FSM/1s, telemetry/10s, safety/2s)
 *   - Autonomous irrigation (never depends on network/app for safety)
 *   - Wi-Fi telemetry with ring buffer (offline queuing up to 20 packets)
 *   - AVR watchdog (8s reset if loop stalls)
 */

#ifdef ARDUINO
#include <Arduino.h>
#endif

#include "config/pin_config.h"
#include "config/irrigation_config.h"
#include "config/wifi_config.h"
#include "core/scheduler.h"
#include "core/watchdog.h"
#include "drivers/sensors/capacitive_moisture/capacitive_moisture.h"
#include "drivers/sensors/ph_sensor/ph_sensor.h"
#include "drivers/sensors/ds18b20/ds18b20.h"
#include "drivers/sensors/dht11/dht11.h"
#include "drivers/communication/wifi/wifi_esp8266.h"
#include "drivers/communication/bluetooth/bluetooth_driver.h"
#include "drivers/communication/connection_coordinator.h"
#include "irrigation/irrigation_state_machine.h"
#include "safety/safety_interlock.h"
#include "telemetry/telemetry_builder.h"
#include "storage/eeprom_storage.h"

// ============================================================================
// GLOBAL INSTANCES
// ============================================================================
static CapacitiveMoistureSensor vegMoistureSensor(PIN_ANALOG_MOISTURE_VEG);
static CapacitiveMoistureSensor paddyMoistureSensor(PIN_ANALOG_MOISTURE_PADDY);
static PhSensor                 phSensor(PIN_ANALOG_PH_SENSOR);
static Ds18b20Sensor            ds18b20(PIN_DIGITAL_DS18B20);
static Dht11Sensor              dht11(PIN_DIGITAL_DHT11);
static WifiEsp8266              wifi;
static BluetoothDriver          bluetoothDriver;
static IrrigationStateMachine   irrigationFSM;
static ConnectionCoordinator    connectionCoordinator(wifi, bluetoothDriver, irrigationFSM);
static SafetyInterlock          safetyInterlock;
static TelemetryBuilder         telemetryBuilder;
static EepromStorage            eepromStorage;
static CooperativeScheduler     scheduler;

// ============================================================================
// CACHED SENSOR VALUES (updated every 5s by taskReadSensors)
// ============================================================================
static float g_vegMoisture   = 50.0f;
static float g_paddyMoisture = 70.0f;
static float g_ph            = 7.0f;
static float g_soilTempC     = 25.0f;
static float g_airTempC      = 28.0f;
static float g_airHumidity   = 65.0f;

// ============================================================================
// SCHEDULER TASKS
// ============================================================================

static void taskReadSensors() {
  vegMoistureSensor.update();
  paddyMoistureSensor.update();

  if (vegMoistureSensor.isValid())   g_vegMoisture   = vegMoistureSensor.getMoisturePercent();
  if (paddyMoistureSensor.isValid()) g_paddyMoisture = paddyMoistureSensor.getMoisturePercent();

#ifdef ARDUINO
  phSensor.update(g_soilTempC);
  if (phSensor.isValid()) g_ph = phSensor.getPh();

  if (ds18b20.requestTemperatures()) {
    // Allow 750ms conversion time before reading
    // (handled by scheduler interval – sensor task runs every 5s)
    if (ds18b20.readTemperature() && ds18b20.isValid()) {
      g_soilTempC = ds18b20.getTemperatureC();
    }
  }

  if (dht11.read() && dht11.isValid()) {
    g_airTempC    = dht11.getTemperatureC();
    g_airHumidity = dht11.getHumidityPercent();
  }
#endif
}

static void taskRunFSM() {
#ifdef ARDUINO
  uint32_t now = millis();
#else
  uint32_t now = 0;
#endif
  connectionCoordinator.update(now);
  irrigationFSM.update(now, g_vegMoisture, g_paddyMoisture);
}

static void taskSendTelemetry() {
  const char* mode = (irrigationFSM.getMode() == IrrigationMode::AUTO) ? "auto" : "manual";
  const char* zone = "none";
  switch (irrigationFSM.getActiveZone()) {
    case IrrigationZone::VEGETABLE: zone = "veg";   break;
    case IrrigationZone::PADDY:     zone = "paddy"; break;
    default: break;
  }

#ifdef ARDUINO
  uint32_t ts = millis();
#else
  uint32_t ts = 0;
#endif

  const char* json = telemetryBuilder.build(
    ts, g_vegMoisture, g_paddyMoisture, g_ph,
    g_soilTempC, g_airTempC, g_airHumidity,
    irrigationFSM.isPumpOn(),
    irrigationFSM.isVegValveOpen(),
    irrigationFSM.isPaddyValveOpen(),
    mode, zone, safetyInterlock.getFaultMask()
  );
  
  // Transmit over Wi-Fi
  wifi.sendTelemetry(json);
  
  // Transmit over Bluetooth if paired/connected
  if (bluetoothDriver.isConnected()) {
    bluetoothDriver.sendTelemetry(json);
  }
}

static void taskCheckSafety() {
  bool safe = safetyInterlock.checkSensors(
    g_vegMoisture, g_paddyMoisture, g_ph,
    g_soilTempC, g_airTempC, g_airHumidity
  );
  if (!safe) {
    // Sensor fault: halt irrigation immediately
    irrigationFSM.emergencyStop();
  }
}

// ============================================================================
// ARDUINO ENTRY POINTS
// ============================================================================
#ifdef ARDUINO
void setup() {
  Serial.begin(DEBUG_SERIAL_BAUD);
  Serial.println(F("[AgroSmart 2.0] Booting..."));

  // Safety: pump and valves default OFF on power-up
  pinMode(PIN_ACTUATOR_PUMP_MOSFET, OUTPUT); digitalWrite(PIN_ACTUATOR_PUMP_MOSFET, LOW);
  pinMode(PIN_ACTUATOR_VALVE_VEG,   OUTPUT); digitalWrite(PIN_ACTUATOR_VALVE_VEG,   LOW);
  pinMode(PIN_ACTUATOR_VALVE_PADDY, OUTPUT); digitalWrite(PIN_ACTUATOR_VALVE_PADDY, LOW);
  pinMode(PIN_STATUS_LED,           OUTPUT); digitalWrite(PIN_STATUS_LED,           LOW);

  // Initialize sensors
  vegMoistureSensor.init(785, 320);
  paddyMoistureSensor.init(785, 320);
  phSensor.init(1500.0f, 2030.0f, 970.0f);
  ds18b20.init();
  dht11.init();

  // Load calibration from EEPROM
  CalibrationData cal;
  if (eepromStorage.load(cal)) {
    vegMoistureSensor.setCalibration(cal.vegDryAdc, cal.vegWetAdc);
    paddyMoistureSensor.setCalibration(cal.paddyDryAdc, cal.paddyWetAdc);
    phSensor.init(cal.phNeutralMv, cal.phAcidMv, cal.phBaseMv);
    Serial.println(F("[AgroSmart 2.0] Calibration loaded from EEPROM."));
  } else {
    Serial.println(F("[AgroSmart 2.0] No EEPROM calibration found, using defaults."));
  }

  // Initialize Wi-Fi
  wifi.init();
  wifi.connectAP(DEFAULT_WIFI_SSID, DEFAULT_WIFI_PASS);

  // Initialize Bluetooth (Hardware Serial2 on Pins 16 TX2, 17 RX2)
  bluetoothDriver.init(9600);

  // Schedule tasks
  scheduler.addTask(taskReadSensors,   5000);  // Every 5 seconds
  scheduler.addTask(taskRunFSM,        1000);  // Every 1 second
  scheduler.addTask(taskSendTelemetry, 10000); // Every 10 seconds
  scheduler.addTask(taskCheckSafety,   2000);  // Every 2 seconds
  // Enable AVR watchdog (8 second reset)
  watchdogInit();

  Serial.println(F("[AgroSmart 2.0] Ready."));
  digitalWrite(PIN_STATUS_LED, HIGH);
}

void loop() {
  watchdogReset();
  scheduler.run(millis());
}
#endif
