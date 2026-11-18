import React, { ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { Colors, Spacing, Typography } from '../../constants';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionText?: string;
  onActionPress?: () => void;
  rightElement?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  actionText,
  onActionPress,
  rightElement,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {rightElement ? (
        rightElement
      ) : actionText && onActionPress ? (
        <TouchableOpacity activeOpacity={0.7} onPress={onActionPress}>
          <Text style={styles.actionText}>{actionText}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    marginTop: Spacing.base,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...Typography.headlineSmall,
    color: Colors.text.primary,
  },
  subtitle: {
    ...Typography.bodySmall,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  actionText: {
    ...Typography.labelMedium,
    color: Colors.primary.natural,
    fontWeight: '600',
  },
});
