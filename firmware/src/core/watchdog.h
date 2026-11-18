/**
 * AgroSmart 2.0 – Watchdog & Hardware Safety Timer
 *
 * Configures the AVR ATmega2560 hardware watchdog timer (WDTO_8S).
 * If firmware execution locks up or an AT command hangs, the MCU safely resets
 * to a known safe boot state (Pump OFF, Valves CLOSED).
 */

#ifndef WATCHDOG_H
#define WATCHDOG_H

#ifdef ARDUINO
  #include <avr/wdt.h>
  #include <Arduino.h>

  inline void watchdogInit() {
    wdt_enable(WDTO_8S); // 8-second hardware watchdog timeout
  }

  inline void watchdogReset() {
    wdt_reset(); // Pat the watchdog
  }

  inline void watchdogDisable() {
    wdt_disable();
  }
#else
  // Native desktop testing stub
  inline void watchdogInit() {}
  inline void watchdogReset() {}
  inline void watchdogDisable() {}
#endif

#endif // WATCHDOG_H
