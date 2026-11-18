import React, { ReactNode } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  StyleProp,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, Shadow } from '../../constants';

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'elevated' | 'outlined' | 'flat' | 'gradient';
  gradientColors?: readonly [string, string, ...string[]];
  onPress?: () => void;
  padding?: keyof typeof Spacing;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'elevated',
  gradientColors,
  onPress,
  padding = 'base',
}) => {
  const paddingValue = Spacing[padding] ?? Spacing.base;

  const cardStyle: StyleProp<ViewStyle> = [
    styles.base,
    { padding: paddingValue },
    variant === 'elevated' && styles.elevated,
    variant === 'outlined' && styles.outlined,
    variant === 'flat' && styles.flat,
  ];

  if (variant === 'gradient' && gradientColors) {
    const content = (
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.base, styles.gradient, { padding: paddingValue }, style]}
      >
        {children}
      </LinearGradient>
    );

    if (onPress) {
      return (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onPress}
          style={styles.touchableWrapper}
        >
          {content}
        </TouchableOpacity>
      );
    }
    return content;
  }

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={[cardStyle, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[cardStyle, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  touchableWrapper: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  base: {
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.neutral.card,
  },
  elevated: {
    backgroundColor: Colors.neutral.card,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    ...Shadow.md,
  },
  outlined: {
    backgroundColor: Colors.neutral.card,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
  },
  flat: {
    backgroundColor: Colors.neutral.background,
  },
  gradient: {
    borderWidth: 0,
    ...Shadow.lg,
  },
});
