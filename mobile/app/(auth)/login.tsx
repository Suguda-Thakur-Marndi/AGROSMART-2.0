/**
 * AgroSmart 2.0 – Login Screen
 * Faithful implementation of Google Stitch UI/UX design
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Spacing, BorderRadius, Shadow } from '../../constants/Spacing';
import { Typography } from '../../constants/Typography';
import { StitchCard } from '../../components/cards/StitchCard';
import { useAppStore } from '../../store/appStore';

export default function LoginScreen() {
  const router = useRouter();
  const { setAuthenticated, setDemoMode } = useAppStore();
  const [email, setEmail] = useState('farmer@agrosmart.io');
  const [password, setPassword] = useState('password123');

  const handleLogin = () => {
    setAuthenticated(true, {
      id: 'usr-1',
      email,
      name: 'Farmer John',
      farmName: 'Green Valley Dual-Zone AgroFarm',
      createdAt: new Date().toISOString(),
    });
    router.replace('/(tabs)');
  };

  const handleDemoAccess = () => {
    setDemoMode(true);
    setAuthenticated(true, {
      id: 'demo-usr',
      email: 'demo@agrosmart.io',
      name: 'AgroSmart Demo Operator',
      farmName: 'AgroSmart 2.0 Demonstration Farm',
      createdAt: new Date().toISOString(),
    });
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Brand Header */}
          <View style={styles.brandHeader}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons
                name="sprout"
                size={38}
                color={Colors.stitch.primary}
              />
            </View>
            <Text style={styles.appName}>AgroSmart 2.0</Text>
            <Text style={styles.appTagline}>
              Industrial IoT Smart Agriculture & Irrigation
            </Text>
          </View>

          {/* Login Card */}
          <StitchCard style={styles.loginCard}>
            <Text style={styles.cardHeadline}>Sign In to Farm Console</Text>
            <Text style={styles.cardSubtitle}>
              Access real-time telemetry, valves & pump sequencing
            </Text>

            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>OPERATOR EMAIL</Text>
              <View style={styles.inputBox}>
                <MaterialCommunityIcons
                  name="email-outline"
                  size={20}
                  color={Colors.stitch.onSurfaceVariant}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="name@farm.com"
                  placeholderTextColor={Colors.stitch.outline}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>ACCESS KEY / PASSWORD</Text>
              <View style={styles.inputBox}>
                <MaterialCommunityIcons
                  name="lock-outline"
                  size={20}
                  color={Colors.stitch.onSurfaceVariant}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••••••"
                  placeholderTextColor={Colors.stitch.outline}
                  secureTextEntry
                />
              </View>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              style={styles.signInBtn}
              activeOpacity={0.85}
              onPress={handleLogin}
            >
              <Text style={styles.signInBtnText}>Enter Farm Console</Text>
              <MaterialIcons
                name="arrow-forward"
                size={20}
                color={Colors.neutral.white}
              />
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR EXPLORE DEMO</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Demo Mode Button */}
            <TouchableOpacity
              style={styles.demoBtn}
              activeOpacity={0.85}
              onPress={handleDemoAccess}
            >
              <MaterialIcons
                name="play-circle-filled"
                size={20}
                color={Colors.stitch.onSecondaryContainer}
              />
              <Text style={styles.demoBtnText}>Launch Live Interactive Demo</Text>
            </TouchableOpacity>
          </StitchCard>

          {/* Hardware Subtitle */}
          <View style={styles.hardwareFooter}>
            <MaterialCommunityIcons
              name="developer-board"
              size={16}
              color={Colors.stitch.secondary}
            />
            <Text style={styles.hardwareFooterText}>
              Powered by EWS Arduino Mega IoT Grove Architecture
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.stitch.surfaceContainerLow,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.margin,
    paddingTop: Spacing.spaceXl,
    paddingBottom: Spacing.space2xl,
    justifyContent: 'center',
  },

  // Brand Header
  brandHeader: {
    alignItems: 'center',
    marginBottom: Spacing.spaceXl,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.stitch.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.spaceSm,
    ...Shadow.md,
  },
  appName: {
    ...Typography.headlineMedium,
    color: Colors.stitch.primary,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  appTagline: {
    ...Typography.bodyMedium,
    color: Colors.stitch.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 4,
  },

  // Login Card
  loginCard: {
    padding: Spacing.spaceLg,
    gap: Spacing.spaceMd,
    ...Shadow.md,
  },
  cardHeadline: {
    ...Typography.headlineSmall,
    color: Colors.stitch.primary,
    fontWeight: '700',
  },
  cardSubtitle: {
    ...Typography.bodySmall,
    color: Colors.stitch.onSurfaceVariant,
    fontSize: 11,
    marginTop: -2,
  },

  // Input Group
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSurfaceVariant,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.stitch.surfaceContainerLow,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.stitch.border,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    ...Typography.bodyLarge,
    color: Colors.stitch.onSurface,
  },

  // Sign In Button
  signInBtn: {
    height: 50,
    backgroundColor: Colors.stitch.primaryContainer,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: Spacing.spaceXs,
    ...Shadow.sm,
  },
  signInBtnText: {
    ...Typography.labelMedium,
    color: Colors.neutral.white,
    fontWeight: '700',
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.stitch.border,
  },
  dividerText: {
    ...Typography.labelSmall,
    color: Colors.stitch.outline,
    fontSize: 9,
    letterSpacing: 0.5,
  },

  // Demo Button
  demoBtn: {
    height: 48,
    backgroundColor: Colors.stitch.secondaryContainer,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadow.sm,
  },
  demoBtnText: {
    ...Typography.labelMedium,
    color: Colors.stitch.onSecondaryContainer,
    fontWeight: '700',
  },

  // Hardware Footer
  hardwareFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.spaceXl,
  },
  hardwareFooterText: {
    ...Typography.bodySmall,
    color: Colors.stitch.onSurfaceVariant,
    fontSize: 11,
  },
});
