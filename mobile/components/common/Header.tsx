import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants';
import { StatusIndicator } from './StatusIndicator';
import { useAppStore } from '../../store/appStore';
import { useSensorStore } from '../../store/sensorStore';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  onNotificationPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'AgroSmart Farm',
  subtitle,
  showBack = false,
  onBack,
  onNotificationPress,
  style,
}) => {
  const { unreadCount, isDemoMode } = useAppStore();
  const { device } = useSensorStore();

  const isOnline = isDemoMode || device?.connectionStatus === 'connected';

  return (
    <View style={[styles.container, style]}>
      <View style={styles.leftRow}>
        {showBack && onBack ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onBack}
            style={styles.backButton}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={Colors.text.primary}
            />
          </TouchableOpacity>
        ) : null}

        <View style={styles.titleColumn}>
          <View style={styles.farmTitleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <View style={styles.statusIndicatorWrapper}>
              <StatusIndicator
                status={isOnline ? 'online' : 'offline'}
                size={8}
                pulse={isOnline}
              />
            </View>
          </View>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : (
            <Text style={styles.subtitle} numberOfLines={1}>
              {isDemoMode
                ? 'Simulation Mode'
                : isOnline
                ? 'A7672S Connected'
                : 'Offline'}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.rightRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onNotificationPress}
          style={styles.iconButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons
            name="bell-outline"
            size={24}
            color={Colors.text.primary}
          />
          {unreadCount > 0 && (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm + 2,
    backgroundColor: Colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: Spacing.sm,
    padding: Spacing.xs,
  },
  titleColumn: {
    flex: 1,
  },
  farmTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    ...Typography.headlineSmall,
    color: Colors.text.primary,
    fontWeight: '700',
  },
  statusIndicatorWrapper: {
    marginLeft: Spacing.xs + 2,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.text.tertiary,
    marginTop: 1,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeContainer: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: Colors.status.error,
    borderRadius: BorderRadius.full,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: Colors.neutral.white,
    fontSize: 9,
    fontWeight: '700',
  },
});
