import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { WifiConnectionProvider } from '../../mobile/services/connection/WifiConnectionProvider';
import { BluetoothConnectionProvider } from '../../mobile/services/connection/BluetoothConnectionProvider';
import { connectionManager } from '../../mobile/services/connection/ConnectionManager';
import { OutgoingIrrigationCommand } from '../../mobile/types/connection';

describe('AgroSmart 2.0 – Wi-Fi & Bluetooth Connection Providers', () => {
  test('WifiConnectionProvider: scan returns available farm networks', async () => {
    const wifi = new WifiConnectionProvider();
    const networks = await wifi.scan();
    assert.ok(Array.isArray(networks));
    assert.ok(networks.length > 0);
    const agroAp = networks.find((n) => n.ssid === 'AgroSmart_Farm_AP');
    assert.ok(agroAp, 'AgroSmart_Farm_AP should be present in scan');
    assert.strictEqual(agroAp.isSecure, true);
  });

  test('WifiConnectionProvider: connect and disconnect lifecycle', async () => {
    const wifi = new WifiConnectionProvider();
    assert.strictEqual(wifi.getState(), 'NOT_CONNECTED');

    const connected = await wifi.connect({ ssid: 'AgroSmart_Farm_AP' });
    assert.strictEqual(connected, true);
    assert.strictEqual(wifi.getState(), 'CONNECTED');

    await wifi.disconnect();
    assert.strictEqual(wifi.getState(), 'NOT_CONNECTED');
  });

  test('BluetoothConnectionProvider: scan returns supported controllers', async () => {
    const bt = new BluetoothConnectionProvider();
    const devices = await bt.scan();
    assert.ok(Array.isArray(devices));
    assert.ok(devices.length >= 2);
    const classicDev = devices.find((d) => d.name === 'AgroSmart-Mega-BT');
    assert.ok(classicDev, 'AgroSmart-Mega-BT must be discovered');
    assert.strictEqual(classicDev.type, 'CLASSIC');

    const bleDev = devices.find((d) => d.name === 'AgroSmart-BLE-01');
    assert.ok(bleDev, 'AgroSmart-BLE-01 must be discovered');
    assert.strictEqual(bleDev.type, 'BLE');
  });

  test('BluetoothConnectionProvider: pair and connect lifecycle', async () => {
    const bt = new BluetoothConnectionProvider();
    assert.strictEqual(bt.getState(), 'NOT_CONNECTED');

    const connected = await bt.connect();
    assert.strictEqual(connected, true);
    assert.strictEqual(bt.getState(), 'CONNECTED');

    await bt.disconnect();
    assert.strictEqual(bt.getState(), 'NOT_CONNECTED');
  });

  test('ConnectionManager: single active connection arbitration', async () => {
    // 1. Connect Wi-Fi
    await connectionManager.connect('wifi', { ssid: 'AgroSmart_Farm_AP' });
    assert.strictEqual(connectionManager.getActiveType(), 'wifi');
    assert.strictEqual(connectionManager.getStatus().state, 'CONNECTED');
    assert.strictEqual(connectionManager.getStatus().label, 'Connected via Wi-Fi');

    // 2. Switch to Bluetooth: must safely disconnect Wi-Fi first
    await connectionManager.connect('bluetooth');
    assert.strictEqual(connectionManager.getActiveType(), 'bluetooth');
    assert.strictEqual(connectionManager.getStatus().state, 'CONNECTED');
    assert.strictEqual(connectionManager.getStatus().label, 'Connected via Bluetooth');

    // 3. Disconnect
    await connectionManager.disconnect();
    assert.strictEqual(connectionManager.getActiveType(), 'none');
    assert.strictEqual(connectionManager.getStatus().state, 'NOT_CONNECTED');
    assert.strictEqual(connectionManager.getStatus().label, 'Not Connected');
  });

  test('Safety: Duplicate command prevention on rapid dispatch', async () => {
    await connectionManager.connect('wifi');
    const cmd: OutgoingIrrigationCommand = {
      commandId: 'cmd_unique_test_001',
      action: 'START',
      zone: 'vegetable',
      durationSeconds: 120,
      timestamp: new Date().toISOString(),
    };

    const ack1 = await connectionManager.sendCommand(cmd);
    assert.strictEqual(ack1.success, true);

    // Immediate duplicate with same commandId
    const ack2 = await connectionManager.sendCommand(cmd);
    assert.strictEqual(ack2.success, false);
    assert.match(ack2.message || '', /Duplicate command dropped/);

    await connectionManager.disconnect();
  });
});
