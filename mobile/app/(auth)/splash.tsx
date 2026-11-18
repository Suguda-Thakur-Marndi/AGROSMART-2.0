/**
 * AgroSmart 2.0 – Splash Screen
 * Faithful implementation of Google Stitch UI/UX design
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Spacing, BorderRadius, Shadow } from '../../constants/Spacing';
import { Typography } from '../../constants/Typography';
import { useAppStore } from '../../store/appStore';

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, isDemoMode } = useAppStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAuthenticated || isDemoMode) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
    }, 1800);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isDemoMode, router]);

  return (
    <LinearGradient
      colors={[Colors.stitch.primaryContainer, Colors.stitch.primary]}
      style={styles.container}
    >
      <View style={styles.ambientGlow} />

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons
            name="sprout"
            size={52}
            color={Colors.stitch.primary}
          />
        </View>
        <Text style={styles.title}>AgroSmart 2.0</Text>
        <Text style={styles.tagline}>
          Autonomous Dual-Zone Irrigation & Telemetry
        </Text>

        <View style={styles.hardwareBadge}>
          <Text style={styles.hardwareBadgeText}>
            EWS Arduino Mega IoT Grove Kit
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.version}>v2.0.0 • Production Industrial IoT</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.spaceLg,
    position: 'relative',
  },
  ambientGlow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(172, 243, 185, 0.12)',
    top: '25%',
  },
  content: {
    alignItems: 'center',
    zIndex: 2,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.stitch.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.spaceLg,
    ...Shadow.lg,
  },
  title: {
    ...Typography.displayMedium,
    color: Colors.neutral.white,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  tagline: {
    ...Typography.bodyLarge,
    color: Colors.stitch.secondaryFixedDim,
    textAlign: 'center',
    marginTop: 8,
  },
  hardwareBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.spaceLg,
  },
  hardwareBadgeText: {
    ...Typography.labelSmall,
    color: Colors.stitch.secondaryContainer,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footer: {
    position: 'absolute',
    bottom: Spacing.space2xl,
  },
  version: {
    ...Typography.labelSmall,
    color: Colors.stitch.onPrimaryContainer,
    fontSize: 11,
  },
});
