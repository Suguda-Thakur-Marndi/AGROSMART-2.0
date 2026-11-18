/**
 * AgroSmart 2.0 – Irrigation & Safety Configuration
 *
 * Enforces dual-zone agronomic thresholds, single shared pump limits,
 * sequential hydraulic lock, and MOSFET electrical protections.
 */

#ifndef IRRIGATION_CONFIG_H
#define IRRIGATION_CONFIG_H

#include <stdint.h>

// ============================================================================
// PUMP ELECTRICAL SPECIFICATIONS (12V DC, 1A Rated Current)
// ============================================================================
#define PUMP_RATED_VOLTAGE_V         12.0f
#define PUMP_RATED_CURRENT_A         1.0f
#define PUMP_MAX_STARTUP_CURRENT_A   2.5f

// Calibrated hydraulic flow coefficients (Litres per Minute)
#define FLOW_COEFF_VEG_LPM           15.0f // Drip manifold delivery rate
#define FLOW_COEFF_PADDY_LPM         12.0f // Open furrow / pipe inflow rate

// Valve lead / lag timing to protect single 12V pump from dead-heading
#define VALVE_LEAD_TIME_MS           1500  // Valve opens 1.5s BEFORE pump energizes
#define VALVE_LAG_TIME_MS            1000  // Pump de-energizes 1.0s BEFORE valve closes

// Mandatory thermal cooldown period between consecutive pump cycles
#define PUMP_COOLDOWN_TIME_MS        180000 // 3 minutes cooldown

// ============================================================================
// ZONE 1: VEGETABLE FIELD (Drip Irrigation)
// ============================================================================
#define VEG_MOISTURE_ON_THRESHOLD    35.0f // Start irrigation when VWC < 35%
#define VEG_MOISTURE_OFF_THRESHOLD   55.0f // Stop irrigation when VWC >= 55%
#define VEG_MAX_RUNTIME_MINUTES      15    // Watchdog max run: 15 minutes
#define VEG_DEFAULT_MANUAL_MINUTES   10    // Default manual cycle: 10 minutes

// ============================================================================
// ZONE 2: LOWLAND PADDY FIELD (Submerged Flood Inflow)
// ============================================================================
#define PADDY_MOISTURE_ON_THRESHOLD  60.0f // Start flood when saturation < 60%
#define PADDY_MOISTURE_OFF_THRESHOLD 80.0f // Stop flood when saturation >= 80%
#define PADDY_MAX_RUNTIME_MINUTES    30    // Watchdog max run: 30 minutes
#define PADDY_DEFAULT_MANUAL_MINUTES 20    // Default manual flood: 20 minutes

// ============================================================================
// SENSOR BOUNDS & FAULT TOLERANCE LIMITS
// ============================================================================
#define MOISTURE_MIN_VALID_PERCENT   0.0f
#define MOISTURE_MAX_VALID_PERCENT   100.0f
#define MOISTURE_DISCONNECT_ADC_LOW  40    // Short circuit / probe disconnected
#define MOISTURE_DISCONNECT_ADC_HIGH 1010  // Open circuit / probe disconnected

#define PH_MIN_VALID                 0.0f
#define PH_MAX_VALID                 14.0f
#define TEMP_MIN_VALID_C             -10.0f
#define TEMP_MAX_VALID_C             60.0f
#define HUMIDITY_MIN_VALID_PERCENT   0.0f
#define HUMIDITY_MAX_VALID_PERCENT   100.0f

#endif // IRRIGATION_CONFIG_H
