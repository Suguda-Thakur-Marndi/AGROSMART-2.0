import React, { ReactNode } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  StyleProp,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadow } from '../../constants';

interface StitchCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  onPress?: () => void;
  variant?: 'surface' | 'low' | 'high' | 'flat';
}

export const StitchCard: React.FC<StitchCardProps> = ({
  children,
  style,
  padding = Spacing.marginCompact,
  onPress,
  variant = 'surface',
}) => {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'low':
        return Colors.stitch.surfaceContainerLow;
      case 'high':
        return Colors.stitch.surfaceContainerHigh;
      case 'flat':
        return Colors.stitch.surfaceContainer;
      case 'surface':
      default:
        return Colors.stitch.surfaceContainerLowest; // #FFFEF9
    }
  };

  const containerStyle: StyleProp<ViewStyle> = [
    styles.card,
    {
      backgroundColor: getBackgroundColor(),
      padding,
    },
    variant === 'surface' && styles.cardElevation,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={containerStyle}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={containerStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl, // 24px
    borderWidth: 1,
    borderColor: Colors.stitch.border, // #E3E7DC
    overflow: 'hidden',
  },
  cardElevation: {
    ...Shadow.md,
  },
});
