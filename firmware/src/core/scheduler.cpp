/**
 * AgroSmart 2.0 – Cooperative Non-Blocking Task Scheduler Implementation
 */

#include "scheduler.h"

CooperativeScheduler::CooperativeScheduler() : m_taskCount(0) {
  for (uint8_t i = 0; i < MAX_TASKS; ++i) {
    m_tasks[i].callback = 0;
    m_tasks[i].intervalMs = 0;
    m_tasks[i].lastRunMs = 0;
    m_tasks[i].isEnabled = false;
  }
}

bool CooperativeScheduler::addTask(TaskCallback callback, uint32_t intervalMs, bool startEnabled) {
  if (m_taskCount >= MAX_TASKS || callback == 0) {
    return false;
  }

  m_tasks[m_taskCount].callback = callback;
  m_tasks[m_taskCount].intervalMs = intervalMs;
  m_tasks[m_taskCount].lastRunMs = 0;
  m_tasks[m_taskCount].isEnabled = startEnabled;
  m_taskCount++;
  return true;
}

void CooperativeScheduler::run(uint32_t currentMillis) {
  for (uint8_t i = 0; i < m_taskCount; ++i) {
    if (m_tasks[i].isEnabled && m_tasks[i].callback != 0) {
      if (currentMillis - m_tasks[i].lastRunMs >= m_tasks[i].intervalMs) {
        m_tasks[i].lastRunMs = currentMillis;
        m_tasks[i].callback();
      }
    }
  }
}
