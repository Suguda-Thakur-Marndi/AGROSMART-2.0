export * from './Colors';
export * from './Typography';
export * from './Spacing';
export * from './theme';

export const APP_NAME = 'AgroSmart 2.0';
export const APP_VERSION = '2.0.0';

// API configuration
const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';
const devHostIp = '192.168.0.200';

export const API_BASE_URL = isDev
  ? `http://${devHostIp}:8000/api/v1`
  : 'https://api.agrosmart.app/api/v1';

export const WS_BASE_URL = isDev
  ? `ws://${devHostIp}:8000/ws`
  : 'wss://api.agrosmart.app/ws';

export const MQTT_BROKER_URL = 'mqtt://localhost:1883';

// Demo mode flag
export const DEMO_MODE_DEFAULT = true;

// Sensor limits for validation
export const SENSOR_LIMITS = {
  soil_moisture:   { min: 0,   max: 100 },
  ph:              { min: 0,   max: 14  },
  soil_temperature:{ min: -40, max: 85  },
  air_temperature: { min: -40, max: 85  },
  air_humidity:    { min: 0,   max: 100 },
};

// Irrigation defaults
export const IRRIGATION_DEFAULTS = {
  vegetable: {
    onThreshold:        35,
    offThreshold:       55,
    maxRuntimeMinutes:  30,
    minOffTimeMinutes:  10,
  },
  paddy: {
    onThreshold:        60,
    offThreshold:       80,
    maxRuntimeMinutes:  60,
    minOffTimeMinutes:  15,
  },
};

// Polling intervals (ms)
export const POLLING = {
  sensors:      5000,
  pumpStatus:   2000,
  deviceStatus: 10000,
};
