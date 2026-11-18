/**
 * @file pump_controller.h
 * @brief AgroSmart 2.0 – Modular 12V DC Water Pump & Dual-Zone Valve Controller
 * 
 * Hardware Specifications:
 * - Pump: 12V DC, 1A rated current, common shared pump
 * - Driver: Logic-level N-channel MOSFET (e.g. IRLZ44N, FQP30N06L, AO3400)
 * - Gate Resistor: 100 - 220 Ohms (inrush current limiter from 5V MCU pin)
 * - Gate Pull-Down: 10 kOhms to GND (guarantees OFF state on reset/bootloader)
 * - Flyback Diode: 1N4007 or Schottky across pump motor inductive load
 * - Power Supply: 12V DC Regulated (3A recommended), separate rail with common GND
 * - In-line Fuse: 2A Slow-Blow on +12V rail
 * 
 * Architecture Rules:
 * - NO GPIO assignments until board pinout is verified (pins default to PIN_UNASSIGNED = -1)
 * - Simulated mode enabled by default for safe pre-hardware test benching
 * - Sequential dual-zone scheduling by default (Zone 1 -> Cooldown -> Zone 2)
 * - Valve-before-pump lead sequencing (1500 ms)
 * - Pump-before-valve lag sequencing (1000 ms)
 * - Immediate Emergency STOP (<10 ms software response)
 * - Maximum runtime watchdog protection
 * - Automatic safe shutdown on sensor faults
 * - Shared-pipe mode if physical zone valves are absent
 */

#ifndef AGROSMART_PUMP_CONTROLLER_H
#define AGROSMART_PUMP_CONTROLLER_H

#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

#define PUMP_PIN_UNASSIGNED (-1)

/**
 * @brief Irrigation Zones
 */
typedef enum {
    ZONE_NONE = 0,
    ZONE_VEGETABLE = 1,
    ZONE_PADDY = 2,
    ZONE_SHARED = 3
} IrrigationZone;

/**
 * @brief Actuator Operating States
 */
typedef enum {
    PUMP_STATE_OFF = 0,
    PUMP_STATE_STARTING = 1,    /**< Target valve opening; waiting lead time */
    PUMP_STATE_RUNNING = 2,     /**< Pump energized and actively delivering water */
    PUMP_STATE_STOPPING = 3,    /**< Pump de-energized; waiting lag time to close valve */
    PUMP_STATE_COOLDOWN = 4,    /**< Minimum off-time / inter-zone thermal rest */
    PUMP_STATE_FAULT = 5,       /**< Safety trip (timeout, sensor fault, etc.) */
    PUMP_STATE_EMERGENCY_STOP = 6 /**< Emergency stopped by user or critical interlock */
} PumpState;

/**
 * @brief Valve Physical States
 */
typedef enum {
    VALVE_STATE_CLOSED = 0,
    VALVE_STATE_OPEN = 1,
    VALVE_STATE_NOT_INSTALLED = 2
} ValveState;

/**
 * @brief Irrigation Control Modes
 */
typedef enum {
    CONTROL_MODE_AUTO = 0,
    CONTROL_MODE_MANUAL = 1,
    CONTROL_MODE_EMERGENCY_STOP = 2
} ControlMode;

/**
 * @brief Hardware Electrical & Electrical Driver Configuration
 */
typedef struct {
    int8_t pump_pin;            /**< Logic-level MOSFET gate pin (-1 if unassigned) */
    int8_t valve1_pin;          /**< Valve 1 (Vegetable) driver pin (-1 if unassigned) */
    int8_t valve2_pin;          /**< Valve 2 (Paddy) driver pin (-1 if unassigned) */
    bool simulated_mode;        /**< When true, skips physical GPIO writes for testing */
    bool shared_pipe_mode;      /**< When true, operates without physical valves */
    
    // Electrical Specifications (Documentation & Verification)
    float rated_voltage_v;      /**< 12.0 V DC */
    float rated_current_a;      /**< 1.0 A */
    float power_supply_rating_a;/**< 3.0 A recommended */
    uint16_t gate_resistor_ohms;/**< 100 - 220 Ohms */
    uint16_t pull_down_ohms;    /**< 10,000 Ohms (10k) */
    
    // Safety Timing Thresholds (Milliseconds)
    uint32_t valve_lead_time_ms;   /**< Default: 1500 ms (open valve before pump start) */
    uint32_t valve_lag_time_ms;    /**< Default: 1000 ms (close valve after pump stop) */
    uint32_t min_off_time_ms;      /**< Default: 600,000 ms (10 min anti-flapping rest) */
    uint32_t max_runtime_ms_veg;   /**< Default: 1,800,000 ms (30 min max for vegetables) */
    uint32_t max_runtime_ms_paddy; /**< Default: 3,600,000 ms (60 min max for paddy) */
    uint32_t inter_zone_cooldown_ms;/**< Default: 180,000 ms (3 min rest between zones) */
} PumpHardwareConfig;

/**
 * @brief Comprehensive Status Report
 */
typedef struct {
    PumpState state;
    ControlMode mode;
    IrrigationZone active_zone;
    IrrigationZone queued_zone;
    ValveState valve1_vegetable;
    ValveState valve2_paddy;
    bool is_pump_energized;
    bool shared_pipe_mode;
    bool is_simulated;
    
    uint32_t current_run_seconds;
    uint32_t daily_runtime_seconds;
    uint32_t total_vegetable_seconds;
    uint32_t total_paddy_seconds;
    
    bool fault_timeout;
    bool fault_sensor;
    char last_fault_reason[64];
} PumpStatusReport;

#ifdef __cplusplus
}

/**
 * @brief C++ Class Interface for Arduino Mega Firmware
 */
class PumpController {
public:
    PumpController();
    
    /**
     * @brief Initialize pump and valve driver pins and safety interlocks
     * Initializes all pins to LOW (OFF) immediately.
     */
    void init(const PumpHardwareConfig& config);
    
    /**
     * @brief Request irrigation for a specific zone with requested duration
     * @param zone ZONE_VEGETABLE, ZONE_PADDY, or ZONE_SHARED
     * @param duration_seconds Duration in seconds (bounded by max_runtime)
     * @param mode AUTO or MANUAL
     * @return true if accepted or queued, false if rejected due to fault or emergency stop
     */
    bool requestIrrigation(IrrigationZone zone, uint32_t duration_seconds, ControlMode mode, uint32_t current_millis = 0);
    
    /**
     * @brief Gracefully stop irrigation for a zone (with pump-before-valve lag)
     */
    void stopIrrigation(IrrigationZone zone, uint32_t current_millis = 0);
    
    /**
     * @brief Instantaneous Emergency Stop (<10ms)
     * Trips pump MOSFET gate LOW immediately, halts all active & queued requests,
     * closes all valves after bleed lag, and enters locked EMERGENCY_STOP state.
     */
    void emergencyStop();
    
    /**
     * @brief Reset fault / emergency stop condition back to IDLE
     */
    bool resetFault();
    
    /**
     * @brief Notify pump controller of an external sensor failure
     * Immediately trips safe shutdown if the faulty sensor belongs to the active zone.
     */
    void notifySensorFault(IrrigationZone zone, const char* fault_reason);
    
    /**
     * @brief Main periodic update loop (call from Arduino loop())
     * Non-blocking state machine evaluation and safety timing enforcement.
     * @param current_millis Current system time in milliseconds
     */
    void update(uint32_t current_millis);
    
    /**
     * @brief Set or toggle shared-pipe irrigation mode (when physical valves are absent)
     */
    void setSharedPipeMode(bool enable);
    
    /**
     * @brief Get current comprehensive status report
     */
    PumpStatusReport getStatus() const;
    
    /**
     * @brief Quick state inspection
     */
    bool isPumpRunning() const { return m_report.state == PUMP_STATE_RUNNING; }
    IrrigationZone getActiveZone() const { return m_report.active_zone; }
    PumpState getState() const { return m_report.state; }

    // Mock callback injection for unit testing / simulated hardware test bench
    typedef void (*PinWriteHook)(int8_t pin, uint8_t val, void* user_data);
    void setPinWriteHook(PinWriteHook hook, void* user_data) {
        m_pin_write_hook = hook;
        m_pin_write_user_data = user_data;
    }

private:
    void applyGpio(int8_t pin, uint8_t level);
    void enterState(PumpState new_state, uint32_t current_millis);
    void startActiveZoneActuation(uint32_t current_millis);
    void startActiveZonePump(uint32_t current_millis);
    void finishStopSequence(uint32_t current_millis);

    PumpHardwareConfig m_config;
    PumpStatusReport m_report;
    
    uint32_t m_state_entry_millis;
    uint32_t m_requested_duration_ms;
    uint32_t m_zone_start_millis;
    uint32_t m_last_stop_millis;
    
    // Sequential irrigation queue
    IrrigationZone m_pending_zone;
    uint32_t m_pending_duration_seconds;
    ControlMode m_pending_mode;

    PinWriteHook m_pin_write_hook;
    void* m_pin_write_user_data;
};

#endif // __cplusplus

#endif // AGROSMART_PUMP_CONTROLLER_H
