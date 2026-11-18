import React, { ReactNode } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
  View,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'danger'
  | 'warning'
  | 'ghost';

export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
}) => {
  const isDisabled = disabled || loading;

  const containerStyles: StyleProp<ViewStyle> = [
    styles.base,
    styles[variant],
    styles[`size_${size}`],
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
    style,
  ];

  const textStyles: StyleProp<TextStyle> = [
    styles.textBase,
    styles[`text_${variant}`],
    styles[`textSize_${size}`],
    isDisabled && styles.textDisabled,
    textStyle,
  ];

  const spinnerColor =
    variant === 'outline' || variant === 'ghost' || variant === 'secondary'
      ? Colors.primary.natural
      : Colors.neutral.white;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      disabled={isDisabled}
      style={containerStyles}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {icon && iconPosition === 'left' ? (
            <View style={styles.iconLeft}>{icon}</View>
          ) : null}
          <Text style={textStyles}>{title}</Text>
          {icon && iconPosition === 'right' ? (
            <View style={styles.iconRight}>{icon}</View>
          ) : null}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: Spacing.sm,
  },
  iconRight: {
    marginLeft: Spacing.sm,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  // Variants
  primary: {
    backgroundColor: Colors.primary.natural,
  },
  secondary: {
    backgroundColor: Colors.primary.mint,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary.natural,
  },
  danger: {
    backgroundColor: Colors.status.error,
  },
  warning: {
    backgroundColor: Colors.status.warning,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  // Sizes
  size_sm: {
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
  },
  size_md: {
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.base,
  },
  size_lg: {
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.xl,
  },
  // Text
  textBase: {
    ...Typography.labelLarge,
    fontWeight: '600',
    textAlign: 'center',
  },
  text_primary: {
    color: Colors.neutral.white,
  },
  text_secondary: {
    color: Colors.primary.forest,
  },
  text_outline: {
    color: Colors.primary.natural,
  },
  text_danger: {
    color: Colors.neutral.white,
  },
  text_warning: {
    color: Colors.neutral.white,
  },
  text_ghost: {
    color: Colors.primary.natural,
  },
  textSize_sm: {
    fontSize: 12,
  },
  textSize_md: {
    fontSize: 14,
  },
  textSize_lg: {
    fontSize: 16,
  },
  textDisabled: {
    color: Colors.text.disabled,
  },
});
