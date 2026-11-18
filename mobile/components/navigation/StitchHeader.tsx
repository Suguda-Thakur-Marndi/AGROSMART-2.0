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
import { useAppStore } from '../../store/appStore';

interface StitchHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  showSystemStatus?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const StitchHeader: React.FC<StitchHeaderProps> = ({
  title = 'Home',
  subtitle,
  showBack = false,
  onBack,
  onNotificationPress,
  onProfilePress,
  showSystemStatus = false,
  style,
}) => {
  const { unreadCount } = useAppStore();

  return (
    <View style={[styles.container, style]}>
      {/* Android System Status Strip (Rendered only when explicitly requested) */}
      {showSystemStatus && (
        <View style={styles.systemStatusRow}>
          <Text style={styles.clockText}>09:41</Text>
          <View style={styles.systemIcons}>
            <MaterialCommunityIcons
              name="signal-cellular-3"
              size={13}
              color={Colors.stitch.onSurface}
            />
            <Text style={styles.netTechText}>4G</Text>
            <MaterialCommunityIcons
              name="wifi"
              size={13}
              color={Colors.stitch.onSurface}
            />
            <Text style={styles.batteryText}>88%</Text>
            <MaterialCommunityIcons
              name="battery-charging-80"
              size={15}
              color={Colors.stitch.onSurface}
            />
          </View>
        </View>
      )}

      {/* Main Top App Bar */}
      <View style={styles.appBarRow}>
        <View style={styles.leftGroup}>
          {showBack && onBack ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onBack}
              style={styles.backBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={24}
                color={Colors.stitch.primary}
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.logoBadge}>
              <MaterialCommunityIcons
                name="sprout"
                size={22}
                color={Colors.stitch.secondary}
              />
            </View>
          )}

          <View style={styles.titleColumn}>
            <Text style={styles.appSubtitle}>
              {subtitle ? subtitle.toUpperCase() : 'AGROSMART 2.0'}
            </Text>
            <Text style={styles.screenTitle} numberOfLines={1}>
              {title}
            </Text>
          </View>
        </View>

        <View style={styles.rightGroup}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onNotificationPress}
            style={styles.iconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons
              name="bell-outline"
              size={24}
              color={Colors.stitch.onSurfaceVariant}
            />
            {unreadCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onProfilePress}
            style={styles.profileBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons
              name="account"
              size={20}
              color={Colors.neutral.white}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(252, 249, 239, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: Colors.stitch.surfaceContainerHigh,
    paddingHorizontal: Spacing.margin,
    paddingTop: Spacing.spaceXs,
    paddingBottom: Spacing.spaceSm,
  },
  systemStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 20,
    marginBottom: Spacing.spaceXs,
  },
  clockText: {
    ...Typography.labelSm,
    color: Colors.stitch.onSurface,
    fontWeight: '700',
  },
  systemIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  netTechText: {
    ...Typography.labelSm,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.stitch.onSurface,
  },
  batteryText: {
    ...Typography.labelSm,
    fontSize: 9,
    color: Colors.stitch.onSurface,
    marginLeft: 2,
  },
  appBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 48,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.stitch.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.spaceSm,
  },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.stitch.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.spaceSm,
  },
  titleColumn: {
    flex: 1,
  },
  appSubtitle: {
    ...Typography.labelSm,
    fontSize: 9,
    letterSpacing: 0.8,
    color: Colors.stitch.secondary,
    fontWeight: '800',
    lineHeight: 12,
  },
  screenTitle: {
    ...Typography.headlineSm,
    color: Colors.stitch.primary,
    fontWeight: '700',
    lineHeight: 22,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.spaceXs,
  },
  iconBtn: {
    width: 44, // 44-48dp touch target
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: Colors.stitch.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notifText: {
    color: Colors.neutral.white,
    fontSize: 9,
    fontWeight: '700',
  },
  profileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.stitch.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
});
