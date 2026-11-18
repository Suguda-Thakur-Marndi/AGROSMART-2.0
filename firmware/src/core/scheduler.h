/**
 * AgroSmart 2.0 – Cooperative Non-Blocking Task Scheduler
 *
 * Runs all sensor polling, irrigation safety, pump sequencing, and Wi-Fi
 * communications deterministically without blocking `delay()` calls.
 */

#ifndef SCHEDULER_H
#define SCHEDULER_H

#include <stdint.h>

typedef void (*TaskCallback)();

struct ScheduledTask {
  TaskCallback callback;
  uint32_t intervalMs;
  uint32_t lastRunMs;
  bool isEnabled;
};

class CooperativeScheduler {
public:
  static const uint8_t MAX_TASKS = 8;

  CooperativeScheduler();

  bool addTask(TaskCallback callback, uint32_t intervalMs, bool startEnabled = true);
  void run(uint32_t currentMillis);

private:
  ScheduledTask m_tasks[MAX_TASKS];
  uint8_t m_taskCount;
};

#endif // SCHEDULER_H
