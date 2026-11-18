import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants';
import { useIrrigationStore } from '../../store/irrigationStore';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { pumpStatus } = useIrrigationStore();
  const isPumpRunning = pumpStatus?.state === 'ON';

  // Compute safe bottom padding:
  // On Android with 3-button nav (insets.bottom ~48dp) or gesture bar (~16-24dp),
  // we add insets.bottom so the bottom navigation bar is NEVER obscured by the system bar.
  // When insets.bottom is 0 (devices with hardware keys or hidden bar), fall back to 8dp padding.
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 16);
  const tabBarHeight = 62 + bottomInset;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.stitch.primaryContainer,
        tabBarInactiveTintColor: Colors.stitch.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: Colors.stitch.surfaceContainerLowest, // #FFFEF9 Warm white dock
          borderTopColor: Colors.stitch.border,                  // #E3E7DC Botanical Border
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingBottom: bottomInset,
          paddingTop: 6,
          elevation: 10,
          shadowColor: '#183D2B',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 10,
        },
        tabBarItemStyle: {
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 2,
        },
        tabBarLabelStyle: {
          ...Typography.labelSm,
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.3,
          marginTop: 3,
          marginBottom: 1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconPill, focused && styles.tabIconPillFocused]}>
              <MaterialCommunityIcons
                name={focused ? 'view-dashboard' : 'view-dashboard-outline'}
                size={24}
                color={focused ? Colors.stitch.primaryContainer : Colors.stitch.onSurfaceVariant}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="farm"
        options={{
          title: 'Farm',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconPill, focused && styles.tabIconPillFocused]}>
              <MaterialCommunityIcons
                name={focused ? 'sprout' : 'sprout-outline'}
                size={24}
                color={focused ? Colors.stitch.primaryContainer : Colors.stitch.onSurfaceVariant}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="irrigation"
        options={{
          title: 'Irrigation',
          tabBarBadge: isPumpRunning ? '12V' : undefined,
          tabBarBadgeStyle: {
            backgroundColor: Colors.stitch.warningAmber,
            color: Colors.neutral.white,
            fontSize: 9,
            fontWeight: '800',
            lineHeight: 12,
            minWidth: 16,
            height: 16,
            borderRadius: 8,
            alignSelf: 'center',
          },
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconPill, focused && styles.tabIconPillFocused]}>
              <MaterialCommunityIcons
                name={isPumpRunning ? 'water-pump' : focused ? 'water' : 'water-outline'}
                size={24}
                color={
                  isPumpRunning
                    ? Colors.stitch.warningAmber
                    : focused
                    ? Colors.stitch.primaryContainer
                    : Colors.stitch.onSurfaceVariant
                }
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconPill, focused && styles.tabIconPillFocused]}>
              <MaterialCommunityIcons
                name={focused ? 'chart-box' : 'chart-box-outline'}
                size={24}
                color={focused ? Colors.stitch.primaryContainer : Colors.stitch.onSurfaceVariant}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconPill, focused && styles.tabIconPillFocused]}>
              <MaterialCommunityIcons
                name={focused ? 'account-cog' : 'account-cog-outline'}
                size={24}
                color={focused ? Colors.stitch.primaryContainer : Colors.stitch.onSurfaceVariant}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconPill: {
    width: 48,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  tabIconPillFocused: {
    backgroundColor: Colors.stitch.secondaryContainer, // #ACF3B9 Material 3 organic green
  },
});
