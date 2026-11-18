/**
 * AgroSmart 2.0 – Screen: Notifications & Alerts Center
 * Faithful implementation of Google Stitch UI/UX design
 *
 * Categorizes and displays real-time hardware alerts:
 * - Soil moisture threshold warnings
 * - Irrigation pump start/stop and solenoid valve lead/lag logs
 * - Microclimate heat/evaporation advisories
 * - Cellular A7672S connectivity events
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, MaterialIcons, Feather } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Spacing, BorderRadius, Shadow } from '../constants/Spacing';
import { Typography } from '../constants/Typography';
import { StitchHeader } from '../components/navigation/StitchHeader';
import { StitchCard } from '../components/cards/StitchCard';
import { useAppStore } from '../store/appStore';

interface NotificationItem {
  id: string;
  category: 'alert' | 'cycle' | 'advisory' | 'system';
  severity: 'warning' | 'success' | 'info';
  title: string;
  body: string;
  timestamp: string;
  zone?: string;
  isRead: boolean;
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif_1',
    category: 'alert',
    severity: 'warning',
    title: 'Plot A Soil Moisture Approaching 35%',
    body: 'Capacitive V1.2 reading at 38% VWC. Sequential irrigation queued for next pump window.',
    timestamp: '10 min ago',
    zone: 'Plot A (Vegetable)',
    isRead: false,
  },
  {
    id: 'notif_2',
    category: 'cycle',
    severity: 'success',
    title: 'Plot B Flood Cycle Completed',
    body: 'Solenoid Valve 2 successfully closed after 30-min run. ~360 L delivered. 4.2 cm standing depth maintained.',
    timestamp: 'Yesterday, 07:30 AM',
    zone: 'Plot B (Paddy)',
    isRead: true,
  },
  {
    id: 'notif_3',
    category: 'advisory',
    severity: 'info',
    title: 'Canopy Evaporation Advisory',
    body: 'DHT11 reported 29°C canopy temperature with 65% RH. Soil dry-down accelerated by +12%.',
    timestamp: 'Yesterday, 02:15 PM',
    zone: 'Microclimate',
    isRead: true,
  },
  {
    id: 'notif_4',
    category: 'system',
    severity: 'success',
    title: 'A7672S Cellular Link Nominal',
    body: 'MQTTS keep-alive ACK confirmed. RSSI: -67 dBm (CSQ 24/31). All 4 sensor probe streams verified.',
    timestamp: '2 days ago',
    zone: 'Gateway',
    isRead: true,
  },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const { markAllRead } = useAppStore();

  const [activeFilter, setActiveFilter] = useState<
    'all' | 'alerts' | 'cycles' | 'advisories'
  >('all');
  const [items, setItems] = useState<NotificationItem[]>(DEFAULT_NOTIFICATIONS);

  const filteredItems = items.filter((item) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'alerts') return item.category === 'alert';
    if (activeFilter === 'cycles') return item.category === 'cycle';
    if (activeFilter === 'advisories') return item.category === 'advisory';
    return true;
  });

  const handleMarkAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    markAllRead();
    Alert.alert('Notifications Cleared', 'All alerts marked as read.');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Stitch Top Header */}
      <StitchHeader
        title="Notifications"
        subtitle="System Alerts"
        showBack
        onBack={() => router.back()}
        onNotificationPress={() => {}}
        onProfilePress={() => router.push('/profile')}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'alerts', label: 'Alerts' },
              { id: 'cycles', label: 'Pump Cycles' },
              { id: 'advisories', label: 'Advisories' },
            ] as const
          ).map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterPill,
                activeFilter === filter.id && styles.filterPillActive,
              ]}
              onPress={() => setActiveFilter(filter.id)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterPillText,
                  activeFilter === filter.id && styles.filterPillTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Notifications List */}
        <View style={styles.listSection}>
          {filteredItems.map((item) => (
            <StitchCard
              key={item.id}
              style={[
                styles.notifCard,
                !item.isRead && styles.notifCardUnread,
              ]}
            >
              <View style={styles.notifHeaderRow}>
                <View style={styles.notifIconWrap}>
                  {item.severity === 'warning' ? (
                    <MaterialIcons
                      name="warning"
                      size={20}
                      color={Colors.stitch.error}
                    />
                  ) : item.category === 'cycle' ? (
                    <MaterialCommunityIcons
                      name="water-pump"
                      size={20}
                      color={Colors.stitch.secondary}
                    />
                  ) : item.category === 'advisory' ? (
                    <Feather
                      name="wind"
                      size={20}
                      color={Colors.stitch.water}
                    />
                  ) : (
                    <MaterialIcons
                      name="verified"
                      size={20}
                      color={Colors.stitch.secondary}
                    />
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <View style={styles.titleTimeRow}>
                    <Text style={styles.notifTitle}>{item.title}</Text>
                    <Text style={styles.notifTimestamp}>{item.timestamp}</Text>
                  </View>
                  <Text style={styles.notifBody}>{item.body}</Text>

                  {item.zone && (
                    <View style={styles.zoneTag}>
                      <Text style={styles.zoneTagText}>{item.zone}</Text>
                    </View>
                  )}
                </View>
              </View>
            </StitchCard>
          ))}
        </View>

        {/* Mark All Read Button */}
        <TouchableOpacity
          style={styles.markReadBtn}
          activeOpacity={0.85}
          onPress={handleMarkAllRead}
        >
          <MaterialCommunityIcons
            name="check-all"
            size={20}
            color={Colors.stitch.primary}
          />
          <Text style={styles.markReadBtnText}>Mark All as Read</Text>
        </TouchableOpacity>

        <View style={{ height: Spacing.space2xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.stitch.surfaceContainerLow,
  },
  scrollContent: {
    paddingHorizontal: Spacing.margin,
    paddingTop: Spacing.spaceSm,
    paddingBottom: Spacing.space2xl,
  },

  // Filter Row
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.spaceLg,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.stitch.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.stitch.border,
    ...Shadow.sm,
  },
  filterPillActive: {
    backgroundColor: Colors.stitch.primaryContainer,
    borderColor: Colors.stitch.primaryContainer,
  },
  filterPillText: {
    ...Typography.labelMedium,
    color: Colors.stitch.onSurfaceVariant,
  },
  filterPillTextActive: {
    color: Colors.neutral.white,
    fontWeight: '700',
  },

  // List Section
  listSection: {
    gap: Spacing.spaceSm,
    marginBottom: Spacing.spaceLg,
  },
  notifCard: {
    gap: 8,
  },
  notifCardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.stitch.secondary,
  },
  notifHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  notifIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.stitch.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  titleTimeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  notifTitle: {
    ...Typography.labelMedium,
    color: Colors.stitch.primary,
    fontWeight: '700',
    flex: 1,
  },
  notifTimestamp: {
    ...Typography.labelSmall,
    color: Colors.stitch.outline,
    fontSize: 10,
  },
  notifBody: {
    ...Typography.bodySmall,
    color: Colors.stitch.onSurfaceVariant,
    lineHeight: 18,
    marginTop: 4,
  },
  zoneTag: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.stitch.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginTop: 6,
  },
  zoneTagText: {
    ...Typography.labelSmall,
    color: Colors.stitch.secondary,
    fontWeight: '600',
    fontSize: 9,
  },

  // Mark Read Button
  markReadBtn: {
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.stitch.surfaceContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadow.sm,
  },
  markReadBtnText: {
    ...Typography.labelMedium,
    color: Colors.stitch.primary,
    fontWeight: '700',
  },
});
