import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle, StyleProp } from 'react-native';
import { Colors } from '../../constants';

export type StatusType = 'online' | 'offline' | 'warning' | 'error' | 'irrigating';

interface StatusIndicatorProps {
  status: StatusType;
  size?: number;
  pulse?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  size = 10,
  pulse = false,
  style,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const colorMap: Record<StatusType, string> = {
    online: Colors.status.success,
    offline: Colors.status.offline,
    warning: Colors.status.warning,
    error: Colors.status.error,
    irrigating: Colors.accent.blue,
  };

  const activeColor = colorMap[status] ?? Colors.status.offline;

  useEffect(() => {
    if (pulse || status === 'irrigating' || status === 'online') {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.6,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      );
      animation.start();
      return () => animation.stop();
    }
  }, [pulse, status, pulseAnim]);

  return (
    <View style={[styles.container, { width: size * 2, height: size * 2 }, style]}>
      {(pulse || status === 'irrigating') && (
        <Animated.View
          style={[
            styles.pulseRing,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: activeColor,
              transform: [{ scale: pulseAnim }],
              opacity: pulseAnim.interpolate({
                inputRange: [1, 1.6],
                outputRange: [0.6, 0],
              }),
            },
          ]}
        />
      )}
      <View
        style={[
          styles.dot,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: activeColor,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
  },
  dot: {
    position: 'absolute',
  },
});
