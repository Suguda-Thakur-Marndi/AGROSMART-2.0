/**
 * @file pump_controller.cpp
 * @brief AgroSmart 2.0 – Modular 12V DC Water Pump & Dual-Zone Valve Controller
 */

#include "pump_controller.h"
#include <string.h>

#if defined(ARDUINO)
    #include <Arduino.h>
#else
    #ifndef OUTPUT
        #define OUTPUT 1
    #endif
    #ifndef INPUT
        #define INPUT 0
    #endif
    #ifndef LOW
        #define LOW 0
    #endif
    #ifndef HIGH
        #define HIGH 1
    #endif
#endif

PumpController::PumpController()
    : m_state_entry_millis(0)
    , m_requested_duration_ms(0)
    , m_zone_start_millis(0)
    , m_last_stop_millis(0)
    , m_pending_zone(ZONE_NONE)
    , m_pending_duration_seconds(0)
    , m_pending_mode(CONTROL_MODE_AUTO)
    , m_pin_write_hook(nullptr)
    , m_pin_write_user_data(nullptr)
{
    memset(&m_config, 0, sizeof(m_config));
    memset(&m_report, 0, sizeof(m_report));
    
    // Default safe pin configuration: Unassigned (-1) to prevent inventing GPIO
    m_config.pump_pin = PUMP_PIN_UNASSIGNED;
    m_config.valve1_pin = PUMP_PIN_UNASSIGNED;
    m_config.valve2_pin = PUMP_PIN_UNASSIGNED;
    m_config.simulated_mode = true;
    m_config.shared_pipe_mode = false;
    
    // Electrical Specs
    m_config.rated_voltage_v = 12.0f;
    m_config.rated_current_a = 1.0f;
    m_config.power_supply_rating_a = 3.0f;
    m_config.gate_resistor_ohms = 220;
    m_config.pull_down_ohms = 10000;
    
    // Timing Defaults
    m_config.valve_lead_time_ms = 1500;
    m_config.valve_lag_time_ms = 1000;
    m_config.min_off_time_ms = 600000;      // 10 minutes
    m_config.max_runtime_ms_veg = 1800000;   // 30 minutes
    m_config.max_runtime_ms_paddy = 3600000; // 60 minutes
    m_config.inter_zone_cooldown_ms = 180000;// 3 minutes
    
    // Report Initial State
    m_report.state = PUMP_STATE_OFF;
    m_report.mode = CONTROL_MODE_AUTO;
    m_report.active_zone = ZONE_NONE;
    m_report.queued_zone = ZONE_NONE;
    m_report.valve1_vegetable = VALVE_STATE_CLOSED;
    m_report.valve2_paddy = VALVE_STATE_CLOSED;
    m_report.is_pump_energized = false;
    m_report.shared_pipe_mode = false;
    m_report.is_simulated = true;
}

void PumpController::init(const PumpHardwareConfig& config) {
    m_config = config;
    
    // Fallback safety defaults if fields are unpopulated
    if (m_config.max_runtime_ms_veg == 0) m_config.max_runtime_ms_veg = 1800000;
    if (m_config.max_runtime_ms_paddy == 0) m_config.max_runtime_ms_paddy = 3600000;
    if (m_config.valve_lead_time_ms == 0) m_config.valve_lead_time_ms = 1500;
    if (m_config.valve_lag_time_ms == 0) m_config.valve_lag_time_ms = 1000;
    if (m_config.inter_zone_cooldown_ms == 0) m_config.inter_zone_cooldown_ms = 180000;

    m_report.is_simulated = m_config.simulated_mode;
    m_report.shared_pipe_mode = m_config.shared_pipe_mode;
    
    // CRITICAL SAFETY RULE 8: Pump and valve outputs MUST initialize to LOW (OFF) on MCU boot
    if (m_config.pump_pin != PUMP_PIN_UNASSIGNED && !m_config.simulated_mode) {
#if defined(ARDUINO)
        pinMode(m_config.pump_pin, OUTPUT);
        digitalWrite(m_config.pump_pin, LOW);
#endif
    }
    applyGpio(m_config.pump_pin, LOW);

    if (m_config.valve1_pin != PUMP_PIN_UNASSIGNED && !m_config.simulated_mode) {
#if defined(ARDUINO)
        pinMode(m_config.valve1_pin, OUTPUT);
        digitalWrite(m_config.valve1_pin, LOW);
#endif
    }
    applyGpio(m_config.valve1_pin, LOW);

    if (m_config.valve2_pin != PUMP_PIN_UNASSIGNED && !m_config.simulated_mode) {
#if defined(ARDUINO)
        pinMode(m_config.valve2_pin, OUTPUT);
        digitalWrite(m_config.valve2_pin, LOW);
#endif
    }
    applyGpio(m_config.valve2_pin, LOW);
    
    m_report.state = PUMP_STATE_OFF;
    m_report.active_zone = ZONE_NONE;
    m_report.queued_zone = ZONE_NONE;
    m_report.valve1_vegetable = m_config.shared_pipe_mode ? VALVE_STATE_NOT_INSTALLED : VALVE_STATE_CLOSED;
    m_report.valve2_paddy = m_config.shared_pipe_mode ? VALVE_STATE_NOT_INSTALLED : VALVE_STATE_CLOSED;
    m_report.is_pump_energized = false;
    m_report.fault_timeout = false;
    m_report.fault_sensor = false;
    m_report.last_fault_reason[0] = '\0';
}

void PumpController::applyGpio(int8_t pin, uint8_t level) {
    if (m_pin_write_hook) {
        m_pin_write_hook(pin, level, m_pin_write_user_data);
    }
#if defined(ARDUINO)
    if (pin != PUMP_PIN_UNASSIGNED && !m_config.simulated_mode) {
        digitalWrite(pin, level);
    }
#endif
}

bool PumpController::requestIrrigation(IrrigationZone zone, uint32_t duration_seconds, ControlMode mode, uint32_t current_millis) {
    // Cannot request if in emergency stop or un-cleared fault
    if (m_report.state == PUMP_STATE_EMERGENCY_STOP || m_report.state == PUMP_STATE_FAULT) {
        return false;
    }
    
    // In shared pipe mode, remap zone request to shared
    if (m_config.shared_pipe_mode) {
        zone = ZONE_SHARED;
    }
    
    if (zone == ZONE_NONE) {
        return false;
    }

    // Bound requested duration to zone max runtime
    uint32_t max_ms = (zone == ZONE_PADDY) ? m_config.max_runtime_ms_paddy : m_config.max_runtime_ms_veg;
    uint32_t max_sec = max_ms / 1000;
    if (duration_seconds == 0 || duration_seconds > max_sec) {
        duration_seconds = max_sec;
    }
    
    // If pump is already running for the active zone
    if (m_report.state == PUMP_STATE_RUNNING || m_report.state == PUMP_STATE_STARTING) {
        if (m_report.active_zone == zone) {
            // Already irrigating this zone, refresh duration
            m_requested_duration_ms = duration_seconds * 1000;
            return true;
        } else {
            // SEQUENTIAL SCHEDULING: Enqueue requested zone
            m_pending_zone = zone;
            m_pending_duration_seconds = duration_seconds;
            m_pending_mode = mode;
            m_report.queued_zone = zone;
            return true;
        }
    }
    
    // Pump is idle/off: initiate irrigation sequence
    m_report.active_zone = zone;
    m_report.mode = mode;
    m_requested_duration_ms = duration_seconds * 1000;
    m_pending_zone = ZONE_NONE;
    m_report.queued_zone = ZONE_NONE;

    startActiveZoneActuation(current_millis);
    return true;
}

void PumpController::startActiveZoneActuation(uint32_t current_millis) {
    m_state_entry_millis = current_millis;
    m_zone_start_millis = current_millis;
    
    // CRITICAL SAFETY RULE 3: Open selected valve BEFORE starting pump (lead time)
    if (!m_config.shared_pipe_mode) {
        if (m_report.active_zone == ZONE_VEGETABLE) {
            applyGpio(m_config.valve1_pin, HIGH);
            m_report.valve1_vegetable = VALVE_STATE_OPEN;
        } else if (m_report.active_zone == ZONE_PADDY) {
            applyGpio(m_config.valve2_pin, HIGH);
            m_report.valve2_paddy = VALVE_STATE_OPEN;
        }
    }

    m_report.state = PUMP_STATE_STARTING;
}

void PumpController::startActiveZonePump(uint32_t current_millis) {
    // Energize logic-level MOSFET gate pin
    applyGpio(m_config.pump_pin, HIGH);
    m_report.is_pump_energized = true;
    m_report.state = PUMP_STATE_RUNNING;
    m_state_entry_millis = current_millis;
    m_zone_start_millis = current_millis;
}

void PumpController::stopIrrigation(IrrigationZone zone, uint32_t current_millis) {
    if (m_report.active_zone == zone || zone == ZONE_NONE) {
        if (m_report.state == PUMP_STATE_RUNNING || m_report.state == PUMP_STATE_STARTING) {
            // CRITICAL SAFETY RULE 4: Stop pump BEFORE closing selected valve (lag time)
            applyGpio(m_config.pump_pin, LOW);
            m_report.is_pump_energized = false;
            m_report.state = PUMP_STATE_STOPPING;
            m_state_entry_millis = current_millis;
        }
    }
    
    if (m_pending_zone == zone) {
        m_pending_zone = ZONE_NONE;
        m_report.queued_zone = ZONE_NONE;
    }
}

void PumpController::emergencyStop() {
    // CRITICAL SAFETY RULE 5: Immediate (<10ms) emergency stop
    applyGpio(m_config.pump_pin, LOW);
    m_report.is_pump_energized = false;
    
    // Bleed valves closed
    applyGpio(m_config.valve1_pin, LOW);
    applyGpio(m_config.valve2_pin, LOW);
    m_report.valve1_vegetable = m_config.shared_pipe_mode ? VALVE_STATE_NOT_INSTALLED : VALVE_STATE_CLOSED;
    m_report.valve2_paddy = m_config.shared_pipe_mode ? VALVE_STATE_NOT_INSTALLED : VALVE_STATE_CLOSED;

    m_pending_zone = ZONE_NONE;
    m_report.queued_zone = ZONE_NONE;
    m_report.active_zone = ZONE_NONE;
    m_report.mode = CONTROL_MODE_EMERGENCY_STOP;
    m_report.state = PUMP_STATE_EMERGENCY_STOP;
    
    strncpy(m_report.last_fault_reason, "EMERGENCY_STOP_TRIGGERED", sizeof(m_report.last_fault_reason) - 1);
}

bool PumpController::resetFault() {
    if (m_report.state == PUMP_STATE_EMERGENCY_STOP || m_report.state == PUMP_STATE_FAULT) {
        m_report.state = PUMP_STATE_OFF;
        m_report.mode = CONTROL_MODE_AUTO;
        m_report.fault_timeout = false;
        m_report.fault_sensor = false;
        m_report.last_fault_reason[0] = '\0';
        m_report.active_zone = ZONE_NONE;
        m_report.queued_zone = ZONE_NONE;
        return true;
    }
    return false;
}

void PumpController::notifySensorFault(IrrigationZone zone, const char* fault_reason) {
    // CRITICAL SAFETY RULE 2: Shut down if active zone sensor fails
    if (m_report.active_zone == zone || zone == ZONE_SHARED) {
        applyGpio(m_config.pump_pin, LOW);
        m_report.is_pump_energized = false;
        
        applyGpio(m_config.valve1_pin, LOW);
        applyGpio(m_config.valve2_pin, LOW);
        m_report.valve1_vegetable = m_config.shared_pipe_mode ? VALVE_STATE_NOT_INSTALLED : VALVE_STATE_CLOSED;
        m_report.valve2_paddy = m_config.shared_pipe_mode ? VALVE_STATE_NOT_INSTALLED : VALVE_STATE_CLOSED;

        m_report.state = PUMP_STATE_FAULT;
        m_report.fault_sensor = true;
        if (fault_reason) {
            strncpy(m_report.last_fault_reason, fault_reason, sizeof(m_report.last_fault_reason) - 1);
        } else {
            strncpy(m_report.last_fault_reason, "SENSOR_FAULT_DETECTED", sizeof(m_report.last_fault_reason) - 1);
        }
    }
}

void PumpController::update(uint32_t current_millis) {
    switch (m_report.state) {
        case PUMP_STATE_STARTING: {
            // Wait for valve lead time before energizing pump
            if (current_millis - m_state_entry_millis >= m_config.valve_lead_time_ms) {
                startActiveZonePump(current_millis);
            }
            break;
        }

        case PUMP_STATE_RUNNING: {
            uint32_t elapsed_ms = current_millis - m_zone_start_millis;
            m_report.current_run_seconds = elapsed_ms / 1000;

            // Check zone maximum runtime watchdog
            uint32_t max_allowed_ms = (m_report.active_zone == ZONE_PADDY)
                ? m_config.max_runtime_ms_paddy
                : m_config.max_runtime_ms_veg;
            
            // CRITICAL SAFETY RULE 6: Enforce maximum runtime watchdog
            if (elapsed_ms >= max_allowed_ms) {
                applyGpio(m_config.pump_pin, LOW);
                m_report.is_pump_energized = false;
                applyGpio(m_config.valve1_pin, LOW);
                applyGpio(m_config.valve2_pin, LOW);
                m_report.state = PUMP_STATE_FAULT;
                m_report.fault_timeout = true;
                strncpy(m_report.last_fault_reason, "MAX_RUNTIME_EXCEEDED", sizeof(m_report.last_fault_reason) - 1);
                return;
            }

            // Normal duration completion
            if (elapsed_ms >= m_requested_duration_ms) {
                // Trip pump off first
                applyGpio(m_config.pump_pin, LOW);
                m_report.is_pump_energized = false;
                m_report.state = PUMP_STATE_STOPPING;
                m_state_entry_millis = current_millis;
            }
            break;
        }

        case PUMP_STATE_STOPPING: {
            // Wait for pump spin-down lag time before closing valve
            if (current_millis - m_state_entry_millis >= m_config.valve_lag_time_ms) {
                finishStopSequence(current_millis);
            }
            break;
        }

        case PUMP_STATE_COOLDOWN: {
            // Check if inter-zone cooldown is complete
            if (current_millis - m_state_entry_millis >= m_config.inter_zone_cooldown_ms) {
                if (m_pending_zone != ZONE_NONE) {
                    IrrigationZone next_zone = m_pending_zone;
                    uint32_t next_dur = m_pending_duration_seconds;
                    ControlMode next_mode = m_pending_mode;
                    m_pending_zone = ZONE_NONE;
                    m_report.queued_zone = ZONE_NONE;
                    requestIrrigation(next_zone, next_dur, next_mode, current_millis);
                } else {
                    m_report.state = PUMP_STATE_OFF;
                }
            }
            break;
        }

        case PUMP_STATE_OFF:
        case PUMP_STATE_FAULT:
        case PUMP_STATE_EMERGENCY_STOP:
        default:
            break;
    }
}

void PumpController::finishStopSequence(uint32_t current_millis) {
    // Close zone valves
    if (!m_config.shared_pipe_mode) {
        applyGpio(m_config.valve1_pin, LOW);
        applyGpio(m_config.valve2_pin, LOW);
        m_report.valve1_vegetable = VALVE_STATE_CLOSED;
        m_report.valve2_paddy = VALVE_STATE_CLOSED;
    }

    // Accumulate total runtimes
    uint32_t session_sec = m_report.current_run_seconds;
    m_report.daily_runtime_seconds += session_sec;
    if (m_report.active_zone == ZONE_VEGETABLE) {
        m_report.total_vegetable_seconds += session_sec;
    } else if (m_report.active_zone == ZONE_PADDY) {
        m_report.total_paddy_seconds += session_sec;
    }
    m_report.current_run_seconds = 0;
    m_last_stop_millis = current_millis;

    // Check if sequential pending zone exists
    if (m_pending_zone != ZONE_NONE) {
        m_report.state = PUMP_STATE_COOLDOWN;
        m_state_entry_millis = current_millis;
        m_report.active_zone = ZONE_NONE;
    } else {
        m_report.state = PUMP_STATE_OFF;
        m_report.active_zone = ZONE_NONE;
    }
}

void PumpController::setSharedPipeMode(bool enable) {
    m_config.shared_pipe_mode = enable;
    m_report.shared_pipe_mode = enable;
    if (enable) {
        m_report.valve1_vegetable = VALVE_STATE_NOT_INSTALLED;
        m_report.valve2_paddy = VALVE_STATE_NOT_INSTALLED;
    } else {
        m_report.valve1_vegetable = VALVE_STATE_CLOSED;
        m_report.valve2_paddy = VALVE_STATE_CLOSED;
    }
}

PumpStatusReport PumpController::getStatus() const {
    return m_report;
}
