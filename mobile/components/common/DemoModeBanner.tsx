import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants';
import { useAppStore } from '../../store/appStore';

interface DemoModeBannerProps {
  onToggle?: (enabled: boolean) => void;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
}

export const DemoModeBanner: React.FC<DemoModeBannerProps> = ({
  onToggle,
  style,
  compact = false,
}) => {
  const { isDemoMode, setDemoMode } = useAppStore();

  const handleToggle = (val: boolean) => {
    setDemoMode(val);
    if (onToggle) onToggle(val);
  };

  if (!isDemoMode && compact) {
    return null;
  }

  if (compact) {
    return (
      <View style={[styles.compactContainer, style]}>
        <MaterialCommunityIcons
          name="flask-outline"
          size={14}
          color={Colors.accent.amber}
          style={styles.compactIcon}
        />
        <Text style={styles.compactText}>DEMO MODE (Simulated Hardware)</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        isDemoMode ? styles.containerDemo : styles.containerLive,
        style,
      ]}
    >
      <View style={styles.leftRow}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: isDemoMode ? '#FFF8E1' : '#E8F5E9' },
          ]}
        >
          <MaterialCommunityIcons
            name={isDemoMode ? 'flask-round-bottom' : 'access-point-network'}
            size={18}
            color={isDemoMode ? Colors.accent.amber : Colors.primary.natural}
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {isDemoMode ? 'DEMO MODE ACTIVE' : 'LIVE HARDWARE MODE'}
          </Text>
          <Text style={styles.subtitle}>
            {isDemoMode
              ? 'Telemetry & telemetry states are simulated'
              : 'Connected to EWS Arduino Mega + A7672S'}
          </Text>
        </View>
      </View>

      <Switch
        value={isDemoMode}
        onValueChange={handleToggle}
        trackColor={{ false: '#C8E6C9', true: '#FFE082' }}
        thumbColor={isDemoMode ? Colors.accent.amber : Colors.primary.natural}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.base,
    marginVertical: Spacing.xs,
    borderWidth: 1,
  },
  containerDemo: {
    backgroundColor: '#FFFDE7',
    borderColor: '#FFE082',
  },
  containerLive: {
    backgroundColor: '#F1F8E9',
    borderColor: '#C8E6C9',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...Typography.labelMedium,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 1,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingVertical: 3,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.xs,
    alignSelf: 'flex-start',
  },
  compactIcon: {
    marginRight: 4,
  },
  compactText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '600',
    color: '#F57F17',
  },
});
