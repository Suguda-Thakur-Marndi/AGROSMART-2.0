import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Spacing, BorderRadius, Shadow } from '../constants/Spacing';
import { Typography } from '../constants/Typography';
import { StitchHeader } from '../components/navigation/StitchHeader';
import { StitchCard } from '../components/cards/StitchCard';
import { useConnectionStore } from '../store/connectionStore';
import { BluetoothDevice, WifiNetwork } from '../types/connection';

export default function DeviceConnectionScreen() {
  const router = useRouter();
  const {
    connectionType,
    connectionState,
    statusInfo,
    wifiConfig,
    setWifiConfig,
    selectedBluetoothDevice,
    setSelectedBluetoothDevice,
    availableWifiNetworks,
    availableBluetoothDevices,
    isScanning,
    scanWifi,
    scanBluetooth,
    connectWifi,
    connectBluetooth,
    disconnect,
    reconnect,
    errorMessage,
  } = useConnectionStore();

  const [ssidInput, setSsidInput] = useState(wifiConfig.ssid || 'AgroSmart_Farm_AP');
  const [passwordInput, setPasswordInput] = useState(wifiConfig.password || '');
  const [showNetworkList, setShowNetworkList] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Initial scan on mount if idle
    if (availableBluetoothDevices.length === 0) {
      scanBluetooth().catch(() => {});
    }
  }, []);

  const handleConnectWifi = async () => {
    if (!ssidInput.trim()) {
      Alert.alert('Validation Error', 'Please enter or select a Wi-Fi SSID.');
      return;
    }
    setIsSubmitting(true);
    setWifiConfig({ ssid: ssidInput, password: passwordInput });
    const success = await connectWifi({ ssid: ssidInput, password: passwordInput });
    setIsSubmitting(false);

    if (success) {
      Alert.alert('Wi-Fi Connected', `Successfully connected to controller via ${ssidInput}.`);
    } else {
      Alert.alert('Connection Failed', errorMessage || 'Could not establish connection with controller.');
    }
  };

  const handleConnectBluetooth = async (device?: BluetoothDevice) => {
    const target = device || selectedBluetoothDevice;
    if (!target) {
      Alert.alert('Device Selection', 'Please select a Bluetooth device from the scan list first.');
      return;
    }
    setIsSubmitting(true);
    setSelectedBluetoothDevice(target);
    const success = await connectBluetooth(target);
    setIsSubmitting(false);

    if (success) {
      Alert.alert('Bluetooth Connected', `Direct local pairing established with ${target.name}.`);
    } else {
      Alert.alert('Connection Failed', errorMessage || 'Bluetooth handshake failed. Ensure module is powered.');
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    Alert.alert('Disconnected', 'Controller connection terminated.');
  };

  const isWifiActive = connectionType === 'wifi' && connectionState === 'CONNECTED';
  const isBluetoothActive = connectionType === 'bluetooth' && connectionState === 'CONNECTED';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Stitch Top Header */}
      <StitchHeader
        title="Device Connection"
        subtitle="Wi-Fi & Bluetooth Setup"
        showBack
        onBack={() => router.back()}
        onNotificationPress={() => router.push('/notifications')}
        onProfilePress={() => router.push('/profile')}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Active Connection Banner */}
        <View
          style={[
            styles.statusBanner,
            connectionState === 'CONNECTED'
              ? styles.statusBannerConnected
              : connectionState === 'CONNECTING' || connectionState === 'SCANNING'
              ? styles.statusBannerPending
              : styles.statusBannerDisconnected,
          ]}
        >
          <View style={styles.bannerIconContainer}>
            <MaterialCommunityIcons
              name={
                connectionState === 'CONNECTED'
                  ? connectionType === 'wifi'
                    ? 'wifi-check'
                    : 'bluetooth-connect'
                  : connectionState === 'CONNECTING'
                  ? 'sync'
                  : 'cloud-off-outline'
              }
              size={24}
              color={
                connectionState === 'CONNECTED'
                  ? Colors.stitch.primary
                  : connectionState === 'CONNECTING'
                  ? Colors.stitch.tertiary
                  : Colors.stitch.outline
              }
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>
              {statusInfo.label}
            </Text>
            <Text style={styles.bannerSubtitle}>
              {connectionState === 'CONNECTED'
                ? `Active Node: ${statusInfo.connectedDeviceName || 'AgroSmart Mega Controller'}`
                : 'Select Wi-Fi or Bluetooth below to pair with your controller.'}
            </Text>
          </View>
          {connectionState === 'CONNECTED' && (
            <TouchableOpacity
              style={styles.disconnectBadgeButton}
              onPress={handleDisconnect}
            >
              <Text style={styles.disconnectBadgeText}>Disconnect</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 1. CARD: Wi-Fi Connection */}
        <StitchCard style={[styles.connectionCard, isWifiActive && styles.activeCardBorder]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: Colors.stitch.secondaryContainer }]}>
              <MaterialCommunityIcons
                name="wifi"
                size={26}
                color={Colors.stitch.secondary}
              />
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.sm }}>
              <View style={styles.titleRow}>
                <Text style={styles.cardTitle}>Connect using Wi-Fi</Text>
                {isWifiActive && (
                  <View style={styles.connectedBadge}>
                    <Text style={styles.connectedBadgeText}>ACTIVE</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardDescription}>
                Connect your Arduino agriculture controller through a Wi-Fi network.
              </Text>
            </View>
          </View>

          {/* Wi-Fi Configuration Form */}
          <View style={styles.formContainer}>
            <Text style={styles.inputLabel}>Network SSID</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                value={ssidInput}
                onChangeText={setSsidInput}
                placeholder="Enter Wi-Fi SSID"
                placeholderTextColor={Colors.stitch.outline}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.scanIconButton}
                onPress={() => {
                  setShowNetworkList(!showNetworkList);
                  scanWifi();
                }}
              >
                {isScanning && showNetworkList ? (
                  <ActivityIndicator size="small" color={Colors.stitch.primary} />
                ) : (
                  <Feather name="refresh-cw" size={18} color={Colors.stitch.primary} />
                )}
              </TouchableOpacity>
            </View>

            {/* Scanned Wi-Fi Networks Dropdown */}
            {showNetworkList && (
              <View style={styles.scannedListBox}>
                <Text style={styles.scannedListTitle}>Available Farm Networks:</Text>
                {availableWifiNetworks.map((net: WifiNetwork) => (
                  <TouchableOpacity
                    key={net.ssid}
                    style={styles.networkItem}
                    onPress={() => {
                      setSsidInput(net.ssid);
                      setShowNetworkList(false);
                    }}
                  >
                    <MaterialCommunityIcons
                      name={net.isSecure ? 'wifi-lock' : 'wifi'}
                      size={18}
                      color={Colors.stitch.secondary}
                    />
                    <Text style={styles.networkName}>{net.ssid}</Text>
                    <Text style={styles.networkRssi}>{net.rssi} dBm</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={[styles.inputLabel, { marginTop: Spacing.sm }]}>Network Password</Text>
            <TextInput
              style={styles.textInput}
              value={passwordInput}
              onChangeText={setPasswordInput}
              placeholder="Enter Wi-Fi Password"
              placeholderTextColor={Colors.stitch.outline}
              secureTextEntry
            />

            {/* Wi-Fi Telemetry & Signal Details when connected */}
            {isWifiActive && (
              <View style={styles.connectionDetailsBox}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Controller IP:</Text>
                  <Text style={styles.detailValue}>{wifiConfig.ipAddress || '192.168.0.200'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Signal Strength (RSSI):</Text>
                  <Text style={styles.detailValue}>{wifiConfig.signalRssi || -58} dBm (Good)</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Transport Protocol:</Text>
                  <Text style={styles.detailValue}>ESP8266 REST / WebSocket</Text>
                </View>
              </View>
            )}

            {/* Wi-Fi Action Buttons */}
            <View style={styles.actionButtonGroup}>
              {isWifiActive ? (
                <>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.disconnectButton]}
                    onPress={handleDisconnect}
                  >
                    <Text style={styles.disconnectButtonText}>Disconnect</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.reconnectButton]}
                    onPress={() => reconnect()}
                  >
                    <Text style={styles.reconnectButtonText}>Reconnect</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={[styles.actionButton, styles.connectButton]}
                  onPress={handleConnectWifi}
                  disabled={isSubmitting}
                >
                  {isSubmitting && connectionState === 'CONNECTING' ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.connectButtonText}>Connect to Controller</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </StitchCard>

        {/* 2. CARD: Bluetooth Connection */}
        <StitchCard style={[styles.connectionCard, isBluetoothActive && styles.activeCardBorder]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: '#E3EDF7' }]}>
              <MaterialCommunityIcons
                name="bluetooth"
                size={26}
                color="#0066CC"
              />
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.sm }}>
              <View style={styles.titleRow}>
                <Text style={styles.cardTitle}>Connect using Bluetooth</Text>
                {isBluetoothActive && (
                  <View style={[styles.connectedBadge, { backgroundColor: '#E3EDF7' }]}>
                    <Text style={[styles.connectedBadgeText, { color: '#0066CC' }]}>ACTIVE</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardDescription}>
                Connect directly to your agriculture controller using Bluetooth.
              </Text>
            </View>
          </View>

          {/* Bluetooth Device Discovery */}
          <View style={styles.formContainer}>
            <View style={styles.btHeaderRow}>
              <Text style={styles.inputLabel}>Nearby Supported Devices</Text>
              <TouchableOpacity
                style={styles.scanLink}
                onPress={() => scanBluetooth()}
                disabled={isScanning}
              >
                {isScanning ? (
                  <ActivityIndicator size="small" color="#0066CC" />
                ) : (
                  <Text style={styles.scanLinkText}>Scan for Devices</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Device Selection List */}
            <View style={styles.deviceListBox}>
              {availableBluetoothDevices.length === 0 ? (
                <Text style={styles.emptyDeviceText}>
                  No Bluetooth devices found. Tap &quot;Scan for Devices&quot; to discover nearby controllers.
                </Text>
              ) : (
                availableBluetoothDevices.map((device: BluetoothDevice) => {
                  const isSelected = selectedBluetoothDevice?.id === device.id;
                  return (
                    <TouchableOpacity
                      key={device.id}
                      style={[styles.deviceItem, isSelected && styles.deviceItemSelected]}
                      onPress={() => setSelectedBluetoothDevice(device)}
                    >
                      <MaterialCommunityIcons
                        name={device.type === 'BLE' ? 'bluetooth-audio' : 'bluetooth'}
                        size={22}
                        color={isSelected ? '#0066CC' : Colors.stitch.outline}
                      />
                      <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                        <Text style={styles.deviceName}>{device.name}</Text>
                        <Text style={styles.deviceMeta}>
                          {device.address} • {device.type} ({device.rssi} dBm)
                        </Text>
                      </View>
                      {device.isPaired && (
                        <View style={styles.pairedPill}>
                          <Text style={styles.pairedPillText}>PAIRED</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </View>

            {/* Bluetooth Telemetry & Signal Details when connected */}
            {isBluetoothActive && (
              <View style={styles.connectionDetailsBox}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Connected Device:</Text>
                  <Text style={styles.detailValue}>{selectedBluetoothDevice?.name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Direct Hardware Port:</Text>
                  <Text style={styles.detailValue}>Arduino Mega Serial2 (UART)</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Direct RF Signal:</Text>
                  <Text style={styles.detailValue}>{selectedBluetoothDevice?.rssi || -52} dBm (Strong)</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Cloud Independence:</Text>
                  <Text style={[styles.detailValue, { color: Colors.stitch.primary }]}>Active (Offline Direct)</Text>
                </View>
              </View>
            )}

            {/* Bluetooth Action Buttons */}
            <View style={styles.actionButtonGroup}>
              {isBluetoothActive ? (
                <>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.disconnectButton]}
                    onPress={handleDisconnect}
                  >
                    <Text style={styles.disconnectButtonText}>Disconnect</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.reconnectButton]}
                    onPress={() => reconnect()}
                  >
                    <Text style={styles.reconnectButtonText}>Reconnect</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={[styles.actionButton, styles.connectBtButton]}
                  onPress={() => handleConnectBluetooth()}
                  disabled={isSubmitting}
                >
                  {isSubmitting && connectionState === 'CONNECTING' ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.connectButtonText}>Pair & Connect</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </StitchCard>

        {/* Safety Note Card */}
        <View style={styles.safetyCard}>
          <Feather name="shield" size={20} color={Colors.stitch.secondary} />
          <View style={{ flex: 1, marginLeft: Spacing.sm }}>
            <Text style={styles.safetyTitle}>Single Connection Safety Interlock</Text>
            <Text style={styles.safetyText}>
              Only one connection method controls the device at a time to prevent command collisions. In the event of Wi-Fi or Bluetooth disconnect, the Arduino Mega local autonomous safety rules ensure the water pump stops safely.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.stitch.surface,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing['2xl'] * 2,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  statusBannerConnected: {
    backgroundColor: Colors.stitch.primaryContainer,
    borderColor: Colors.stitch.primary,
  },
  statusBannerPending: {
    backgroundColor: Colors.stitch.tertiaryContainer,
    borderColor: Colors.stitch.tertiary,
  },
  statusBannerDisconnected: {
    backgroundColor: Colors.stitch.surfaceContainerHigh,
    borderColor: Colors.stitch.outlineVariant,
  },
  bannerIconContainer: {
    marginRight: Spacing.md,
  },
  bannerTitle: {
    ...Typography.titleMedium,
    color: Colors.stitch.onSurface,
    fontWeight: '700',
  },
  bannerSubtitle: {
    ...Typography.bodySmall,
    color: Colors.stitch.onSurfaceVariant,
    marginTop: 2,
  },
  disconnectBadgeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: Colors.stitch.surface,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.stitch.error,
  },
  disconnectBadgeText: {
    ...Typography.labelSmall,
    color: Colors.stitch.error,
    fontWeight: '700',
  },
  connectionCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  activeCardBorder: {
    borderWidth: 2,
    borderColor: Colors.stitch.primary,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    ...Typography.titleMedium,
    color: Colors.stitch.onSurface,
    fontWeight: '700',
  },
  cardDescription: {
    ...Typography.bodySmall,
    color: Colors.stitch.onSurfaceVariant,
    marginTop: 4,
    lineHeight: 18,
  },
  connectedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.stitch.primaryContainer,
  },
  connectedBadgeText: {
    ...Typography.labelSmall,
    color: Colors.stitch.primary,
    fontWeight: '800',
  },
  formContainer: {
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.stitch.outlineVariant,
    paddingTop: Spacing.md,
  },
  inputLabel: {
    ...Typography.labelMedium,
    color: Colors.stitch.onSurface,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.stitch.surfaceContainerHigh,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    ...Typography.bodyMedium,
    color: Colors.stitch.onSurface,
    borderWidth: 1,
    borderColor: Colors.stitch.outlineVariant,
  },
  scanIconButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.stitch.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.stitch.outlineVariant,
  },
  scannedListBox: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.stitch.surfaceContainerLowest,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.stitch.outlineVariant,
  },
  scannedListTitle: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSurfaceVariant,
    marginBottom: Spacing.xs,
    fontWeight: '700',
  },
  networkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.stitch.outlineVariant,
  },
  networkName: {
    flex: 1,
    marginLeft: Spacing.sm,
    ...Typography.bodyMedium,
    color: Colors.stitch.onSurface,
  },
  networkRssi: {
    ...Typography.labelSmall,
    color: Colors.stitch.outline,
  },
  actionButtonGroup: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  connectButton: {
    backgroundColor: Colors.stitch.primary,
  },
  connectBtButton: {
    backgroundColor: '#0066CC',
  },
  connectButtonText: {
    ...Typography.labelLarge,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  disconnectButton: {
    backgroundColor: Colors.stitch.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: Colors.stitch.error,
  },
  disconnectButtonText: {
    ...Typography.labelLarge,
    color: Colors.stitch.error,
    fontWeight: '700',
  },
  reconnectButton: {
    backgroundColor: Colors.stitch.secondaryContainer,
  },
  reconnectButtonText: {
    ...Typography.labelLarge,
    color: Colors.stitch.secondary,
    fontWeight: '700',
  },
  btHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  scanLink: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  scanLinkText: {
    ...Typography.labelMedium,
    color: '#0066CC',
    fontWeight: '700',
  },
  deviceListBox: {
    backgroundColor: Colors.stitch.surfaceContainerLowest,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.stitch.outlineVariant,
  },
  emptyDeviceText: {
    ...Typography.bodySmall,
    color: Colors.stitch.outline,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: 4,
  },
  deviceItemSelected: {
    backgroundColor: '#E3EDF7',
    borderWidth: 1,
    borderColor: '#0066CC',
  },
  deviceName: {
    ...Typography.bodyMedium,
    fontWeight: '600',
    color: Colors.stitch.onSurface,
  },
  deviceMeta: {
    ...Typography.bodySmall,
    color: Colors.stitch.onSurfaceVariant,
  },
  pairedPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.stitch.surfaceContainerHigh,
  },
  pairedPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.stitch.outline,
  },
  connectionDetailsBox: {
    marginTop: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: Colors.stitch.surfaceContainerLowest,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.stitch.outlineVariant,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailLabel: {
    ...Typography.bodySmall,
    color: Colors.stitch.onSurfaceVariant,
  },
  detailValue: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.stitch.onSurface,
  },
  safetyCard: {
    flexDirection: 'row',
    backgroundColor: Colors.stitch.surfaceContainerLowest,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.stitch.outlineVariant,
    alignItems: 'flex-start',
  },
  safetyTitle: {
    ...Typography.labelMedium,
    color: Colors.stitch.onSurface,
    fontWeight: '700',
    marginBottom: 4,
  },
  safetyText: {
    ...Typography.bodySmall,
    color: Colors.stitch.onSurfaceVariant,
    lineHeight: 18,
  },
});
