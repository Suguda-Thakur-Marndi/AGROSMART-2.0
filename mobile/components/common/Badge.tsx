import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants';

export type BadgeVariant =
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'offline'
  | 'neutral'
  | 'pump'
  | 'zone_veg'
  | 'zone_paddy';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  showDot?: boolean;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  showDot = false,
  size = 'md',
  style,
}) => {
  const badgeConfig = {
    success: { bg: '#E8F5E9', text: '#2E7D32', dot: '#2E7D32' },
    warning: { bg: '#FFF3E0', text: '#E65100', dot: '#E65100' },
    error: { bg: '#FFEBEE', text: '#D32F2F', dot: '#D32F2F' },
    info: { bg: '#E3F2FD', text: '#1565C0', dot: '#1565C0' },
    offline: { bg: '#EEEEEE', text: '#757575', dot: '#9E9E9E' },
    neutral: { bg: '#F5F5F5', text: '#616161', dot: '#9E9E9E' },
    pump: { bg: '#FFF8E1', text: '#F57F17', dot: '#F9A825' },
    zone_veg: { bg: '#E8F5E9', text: '#1B5E20', dot: '#2E7D32' },
    zone_paddy: { bg: '#E1F5FE', text: '#0D47A1', dot: '#0288D1' },
  }[variant];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: badgeConfig.bg },
        size === 'sm' ? styles.size_sm : styles.size_md,
        style,
      ]}
    >
      {showDot && (
        <View style={[styles.dot, { backgroundColor: badgeConfig.dot }]} />
      )}
      <Text
        style={[
          styles.text,
          { color: badgeConfig.text },
          size === 'sm' && styles.text_sm,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  size_sm: {
    paddingVertical: 2,
    paddingHorizontal: Spacing.sm,
  },
  size_md: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: Spacing.xs + 2,
  },
  text: {
    ...Typography.labelSmall,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  text_sm: {
    fontSize: 10,
    lineHeight: 12,
  },
});
