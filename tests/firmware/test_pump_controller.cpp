/**
 * @file test_pump_controller.cpp
 * @brief Automated Test Suite for 12V DC Pump & Valve Controller
 */

#include <iostream>
#include <cassert>
#include <vector>
#include <cstring>
#include "../../firmware/drivers/pump_controller/pump_controller.h"

struct GpioLogEntry {
    int8_t pin;
    uint8_t val;
};

static std::vector<GpioLogEntry> g_gpio_log;

static void pinWriteHook(int8_t pin, uint8_t val, void* user_data) {
    (void)user_data;
    GpioLogEntry entry;
    entry.pin = pin;
    entry.val = val;
    g_gpio_log.push_back(entry);
}

static void clearLog() {
    g_gpio_log.clear();
}

static int countWrites(int8_t pin, uint8_t val) {
    int count = 0;
    for (size_t i = 0; i < g_gpio_log.size(); ++i) {
        if (g_gpio_log[i].pin == pin && g_gpio_log[i].val == val) {
            count++;
        }
    }
    return count;
}

// Test 1: Initialization Safe State
void test_initialization() {
    std::cout << "Testing: Initialization & Safe Power-On Defaults... ";
    PumpController controller;
    controller.setPinWriteHook(pinWriteHook, nullptr);
    clearLog();

    PumpHardwareConfig cfg;
    memset(&cfg, 0, sizeof(cfg));
    cfg.pump_pin = 10;
    cfg.valve1_pin = 11;
    cfg.valve2_pin = 12;
    cfg.simulated_mode = false;
    cfg.shared_pipe_mode = false;
    cfg.valve_lead_time_ms = 1500;
    cfg.valve_lag_time_ms = 1000;
    cfg.max_runtime_ms_veg = 1800000;
    cfg.max_runtime_ms_paddy = 3600000;
    cfg.inter_zone_cooldown_ms = 180000;

    controller.init(cfg);

    // CRITICAL: Must write LOW to all actuator pins on boot
    assert(countWrites(10, 0) >= 1);
    assert(countWrites(11, 0) >= 1);
    assert(countWrites(12, 0) >= 1);

    PumpStatusReport r = controller.getStatus();
    assert(r.state == PUMP_STATE_OFF);
    assert(r.valve1_vegetable == VALVE_STATE_CLOSED);
    assert(r.valve2_paddy == VALVE_STATE_CLOSED);
    assert(r.is_pump_energized == false);
    assert(r.active_zone == ZONE_NONE);

    std::cout << "PASSED\n";
}

// Test 2: Valve-Before-Pump Lead Sequencing
void test_valve_before_pump_lead() {
    std::cout << "Testing: Valve-Before-Pump Lead Sequencing (1500ms)... ";
    PumpController controller;
    controller.setPinWriteHook(pinWriteHook, nullptr);

    PumpHardwareConfig cfg;
    memset(&cfg, 0, sizeof(cfg));
    cfg.pump_pin = 10;
    cfg.valve1_pin = 11;
    cfg.valve2_pin = 12;
    cfg.simulated_mode = false;
    cfg.valve_lead_time_ms = 1500;
    cfg.valve_lag_time_ms = 1000;
    cfg.max_runtime_ms_veg = 1800000;
    cfg.max_runtime_ms_paddy = 3600000;

    controller.init(cfg);
    clearLog();

    // Request Vegetable Zone irrigation at t=0
    bool accepted = controller.requestIrrigation(ZONE_VEGETABLE, 60, CONTROL_MODE_AUTO, 0);
    assert(accepted == true);

    // Valve 1 must open immediately
    assert(countWrites(11, 1) >= 1);
    // Pump must NOT be energized yet
    assert(countWrites(10, 1) == 0);
    assert(controller.getStatus().state == PUMP_STATE_STARTING);

    // Step 500 ms forward
    controller.update(500);
    assert(countWrites(10, 1) == 0); // Still waiting for lead time

    // Step 1499 ms forward
    controller.update(1499);
    assert(countWrites(10, 1) == 0);

    // Step 1500 ms forward
    controller.update(1500);
    // Pump must now be energized
    assert(countWrites(10, 1) == 1);
    assert(controller.getStatus().state == PUMP_STATE_RUNNING);
    assert(controller.getStatus().active_zone == ZONE_VEGETABLE);

    std::cout << "PASSED\n";
}

// Test 3: Pump-Before-Valve Lag Sequencing
void test_pump_before_valve_lag() {
    std::cout << "Testing: Pump-Before-Valve Lag Sequencing (1000ms)... ";
    PumpController controller;
    controller.setPinWriteHook(pinWriteHook, nullptr);

    PumpHardwareConfig cfg;
    memset(&cfg, 0, sizeof(cfg));
    cfg.pump_pin = 10;
    cfg.valve1_pin = 11;
    cfg.valve2_pin = 12;
    cfg.simulated_mode = false;
    cfg.valve_lead_time_ms = 1500;
    cfg.valve_lag_time_ms = 1000;
    cfg.max_runtime_ms_veg = 1800000;
    cfg.max_runtime_ms_paddy = 3600000;

    controller.init(cfg);
    controller.requestIrrigation(ZONE_VEGETABLE, 60, CONTROL_MODE_AUTO, 0);
    controller.update(1500);
    assert(controller.getStatus().state == PUMP_STATE_RUNNING);

    clearLog();
    // Stop irrigation at t=2000
    controller.stopIrrigation(ZONE_VEGETABLE, 2000);

    // Pump must turn OFF immediately
    assert(countWrites(10, 0) >= 1);
    // Valve 1 must NOT close yet (waiting 1000ms lag time)
    assert(countWrites(11, 0) == 0);
    assert(controller.getStatus().state == PUMP_STATE_STOPPING);

    // Step 500 ms after stop (t=2500)
    controller.update(2500);
    assert(countWrites(11, 0) == 0);

    // Step 1000 ms after stop (t=3000)
    controller.update(3000);
    // Valve 1 must now be closed
    assert(countWrites(11, 0) >= 1);
    assert(controller.getStatus().state == PUMP_STATE_OFF);

    std::cout << "PASSED\n";
}

// Test 4: Immediate Emergency STOP (<10ms)
void test_emergency_stop() {
    std::cout << "Testing: Immediate Emergency STOP (<10ms)... ";
    PumpController controller;
    controller.setPinWriteHook(pinWriteHook, nullptr);

    PumpHardwareConfig cfg;
    memset(&cfg, 0, sizeof(cfg));
    cfg.pump_pin = 10;
    cfg.valve1_pin = 11;
    cfg.valve2_pin = 12;
    cfg.simulated_mode = false;
    cfg.valve_lead_time_ms = 1500;
    cfg.valve_lag_time_ms = 1000;

    controller.init(cfg);
    controller.requestIrrigation(ZONE_VEGETABLE, 60, CONTROL_MODE_AUTO, 0);
    controller.update(1500);
    assert(controller.getStatus().state == PUMP_STATE_RUNNING);

    clearLog();
    controller.emergencyStop();

    // Pump must turn OFF immediately
    assert(countWrites(10, 0) >= 1);
    assert(controller.getStatus().state == PUMP_STATE_EMERGENCY_STOP);

    // Subsequent irrigation requests must be REJECTED
    bool res = controller.requestIrrigation(ZONE_PADDY, 60, CONTROL_MODE_MANUAL, 2000);
    assert(res == false);

    // Fault reset restores system
    bool reset_ok = controller.resetFault();
    assert(reset_ok == true);
    assert(controller.getStatus().state == PUMP_STATE_OFF);

    std::cout << "PASSED\n";
}

// Test 5: Sequential Zone Scheduling
void test_sequential_scheduling() {
    std::cout << "Testing: Sequential Dual-Zone Scheduling... ";
    PumpController controller;
    controller.setPinWriteHook(pinWriteHook, nullptr);

    PumpHardwareConfig cfg;
    memset(&cfg, 0, sizeof(cfg));
    cfg.pump_pin = 10;
    cfg.valve1_pin = 11;
    cfg.valve2_pin = 12;
    cfg.simulated_mode = false;
    cfg.valve_lead_time_ms = 1500;
    cfg.valve_lag_time_ms = 1000;
    cfg.inter_zone_cooldown_ms = 5000; // 5 seconds for test

    controller.init(cfg);
    // Start Zone 1 for 10 seconds at t=0
    controller.requestIrrigation(ZONE_VEGETABLE, 10, CONTROL_MODE_AUTO, 0);
    controller.update(1500);
    assert(controller.getStatus().state == PUMP_STATE_RUNNING);

    // While Zone 1 is running, Zone 2 requests irrigation
    bool queued = controller.requestIrrigation(ZONE_PADDY, 20, CONTROL_MODE_AUTO, 2000);
    assert(queued == true);
    assert(controller.getStatus().queued_zone == ZONE_PADDY);

    // Advance time until Zone 1 completes (10 seconds run -> 1500 + 10000 = 11500 ms)
    controller.update(11500);
    assert(controller.getStatus().state == PUMP_STATE_STOPPING);

    // Step through lag time (1000ms -> 12500 ms)
    controller.update(12500);
    // Must now be in COOLDOWN between zones
    assert(controller.getStatus().state == PUMP_STATE_COOLDOWN);

    // Step through inter-zone cooldown (5000 ms -> 17500 ms)
    controller.update(17500);
    // Zone 2 should now automatically start!
    assert(controller.getStatus().state == PUMP_STATE_STARTING || controller.getStatus().state == PUMP_STATE_RUNNING);
    assert(controller.getStatus().active_zone == ZONE_PADDY);

    std::cout << "PASSED\n";
}

// Test 6: Maximum Runtime Watchdog Protection
void test_max_runtime_watchdog() {
    std::cout << "Testing: Watchdog Maximum Runtime Protection... ";
    PumpController controller;
    controller.setPinWriteHook(pinWriteHook, nullptr);

    PumpHardwareConfig cfg;
    memset(&cfg, 0, sizeof(cfg));
    cfg.pump_pin = 10;
    cfg.valve1_pin = 11;
    cfg.simulated_mode = false;
    cfg.valve_lead_time_ms = 1000;
    cfg.max_runtime_ms_veg = 5000; // 5 second max runtime for test

    controller.init(cfg);
    controller.requestIrrigation(ZONE_VEGETABLE, 100, CONTROL_MODE_MANUAL, 0);
    controller.update(1000);
    assert(controller.getStatus().state == PUMP_STATE_RUNNING);

    clearLog();
    // Simulate exceeding max runtime at t=7000 (6000 ms elapsed > 5000 ms max)
    controller.update(7000);
    assert(controller.getStatus().state == PUMP_STATE_FAULT);
    assert(controller.getStatus().fault_timeout == true);
    assert(countWrites(10, 0) >= 1); // Pump shut down

    std::cout << "PASSED\n";
}

// Test 7: Sensor Fault Safe Shutdown
void test_sensor_fault_shutdown() {
    std::cout << "Testing: Sensor Fault Immediate Safe Shutdown... ";
    PumpController controller;
    controller.setPinWriteHook(pinWriteHook, nullptr);

    PumpHardwareConfig cfg;
    memset(&cfg, 0, sizeof(cfg));
    cfg.pump_pin = 10;
    cfg.valve1_pin = 11;
    cfg.simulated_mode = false;
    cfg.valve_lead_time_ms = 1000;

    controller.init(cfg);
    controller.requestIrrigation(ZONE_VEGETABLE, 60, CONTROL_MODE_AUTO, 0);
    controller.update(1000);
    assert(controller.getStatus().state == PUMP_STATE_RUNNING);

    clearLog();
    controller.notifySensorFault(ZONE_VEGETABLE, "MOISTURE_PROBE_DISCONNECTED");
    assert(controller.getStatus().state == PUMP_STATE_FAULT);
    assert(controller.getStatus().fault_sensor == true);
    assert(countWrites(10, 0) >= 1); // Pump instantly shut down

    std::cout << "PASSED\n";
}

// Test 8: Shared-Pipe Mode Fallback
void test_shared_pipe_mode() {
    std::cout << "Testing: Shared-Pipe Mode Fallback... ";
    PumpController controller;
    controller.setPinWriteHook(pinWriteHook, nullptr);

    PumpHardwareConfig cfg;
    memset(&cfg, 0, sizeof(cfg));
    cfg.pump_pin = 10;
    cfg.valve1_pin = -1; // No physical valves
    cfg.valve2_pin = -1;
    cfg.simulated_mode = false;
    cfg.shared_pipe_mode = true;
    cfg.valve_lead_time_ms = 500;

    controller.init(cfg);
    assert(controller.getStatus().valve1_vegetable == VALVE_STATE_NOT_INSTALLED);
    assert(controller.getStatus().valve2_paddy == VALVE_STATE_NOT_INSTALLED);

    controller.requestIrrigation(ZONE_VEGETABLE, 30, CONTROL_MODE_AUTO, 0);
    assert(controller.getStatus().active_zone == ZONE_SHARED);

    std::cout << "PASSED\n";
}

int main() {
    std::cout << "\n======================================================\n";
    std::cout << "   AGROSMART 2.0 – PUMP CONTROLLER FIRMWARE TEST SUITE\n";
    std::cout << "   Hardware Spec: 12V DC, 1A Rated Current, MOSFET Driver\n";
    std::cout << "======================================================\n\n";

    test_initialization();
    test_valve_before_pump_lead();
    test_pump_before_valve_lag();
    test_emergency_stop();
    test_sequential_scheduling();
    test_max_runtime_watchdog();
    test_sensor_fault_shutdown();
    test_shared_pipe_mode();

    std::cout << "\n>> ALL 8 FIRMWARE PUMP CONTROLLER TESTS PASSED (100% SUCCESS)\n\n";
    return 0;
}
