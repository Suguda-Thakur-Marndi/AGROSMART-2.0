import {
  generateDemoZoneData,
  generateDemoPumpStatus,
  generateDemoWaterSummary,
  generateDemoHistory,
  generateDemoNotifications,
} from '../utils/demoData';
import { ZoneId } from '../types';

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const demoService = {
  async getZoneData(zoneId: ZoneId) {
    await delay(200 + Math.random() * 300);
    return generateDemoZoneData(zoneId);
  },

  async getPumpStatus() {
    await delay(150 + Math.random() * 200);
    return generateDemoPumpStatus();
  },

  async getWaterSummary() {
    await delay(300 + Math.random() * 200);
    return generateDemoWaterSummary();
  },

  async getSensorHistory(zoneId: ZoneId, days: number = 7) {
    await delay(400 + Math.random() * 300);
    return generateDemoHistory(days);
  },

  async getNotifications() {
    await delay(200);
    return generateDemoNotifications();
  },
};
