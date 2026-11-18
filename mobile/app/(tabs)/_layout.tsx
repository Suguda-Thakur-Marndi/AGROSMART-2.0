import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants';
import { useIrrigationStore } from '../../store/irrigationStore';

export default function TabsLayout() {
  const { pumpStatus } = useIrrigationStore();
  const isPumpRunning = pumpStatus?.state === 'ON';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.stitch.primaryContainer,
        tabBarInactiveTintColor: Colors.stitch.outline,
        tabBarStyle: {
          backgroundColor: Colors.stitch.surfaceContainerLowest, // #FFFEF9 Warm white dock
          borderTopColor: Colors.stitch.border,                  // #E3E7DC
          borderTopWidth: 1,
          height: Platform.OS === 'android' ? 68 : 82,
          paddingBottom: Platform.OS === 'android' ? 10 : 24,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#183D2B',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          ...Typography.labelSm,
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.4,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconContainer, focused && styles.tabIconFocused]}>
              <MaterialCommunityIcons
                name={focused ? 'view-dashboard' : 'view-dashboard-outline'}
                size={22}
                color={focused ? Colors.stitch.primaryContainer : color}
              />
              {focused && <View style={styles.activeDot} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="farm"
        options={{
          title: 'Farm',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconContainer, focused && styles.tabIconFocused]}>
              <MaterialCommunityIcons
                name={focused ? 'sprout' : 'sprout-outline'}
                size={22}
                color={focused ? Colors.stitch.primaryContainer : color}
              />
              {focused && <View style={styles.activeDot} />}
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
          },
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconContainer, focused && styles.tabIconFocused]}>
              <MaterialCommunityIcons
                name={isPumpRunning ? 'water-pump' : focused ? 'water' : 'water-outline'}
                size={22}
                color={
                  isPumpRunning
                    ? Colors.stitch.warningAmber
                    : focused
                    ? Colors.stitch.primaryContainer
                    : color
                }
              />
              {focused && <View style={styles.activeDot} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconContainer, focused && styles.tabIconFocused]}>
              <MaterialCommunityIcons
                name={focused ? 'chart-box' : 'chart-box-outline'}
                size={22}
                color={focused ? Colors.stitch.primaryContainer : color}
              />
              {focused && <View style={styles.activeDot} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconContainer, focused && styles.tabIconFocused]}>
              <MaterialCommunityIcons
                name={focused ? 'account-cog' : 'account-cog-outline'}
                size={22}
                color={focused ? Colors.stitch.primaryContainer : color}
              />
              {focused && <View style={styles.activeDot} />}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  tabIconFocused: {
    backgroundColor: Colors.stitch.secondaryContainer,
  },
  activeDot: {
    position: 'absolute',
    bottom: -4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.stitch.secondary,
  },
});
