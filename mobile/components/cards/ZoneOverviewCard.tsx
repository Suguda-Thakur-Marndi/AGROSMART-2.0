import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, StyleProp } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants';
import { StitchCard } from './StitchCard';

interface ZoneOverviewCardProps {
  zoneId: 'vegetable' | 'paddy';
  plotName: string;
  cropDescription: string;
  areaText: string;
  moisturePercent: number;
  moistureFloor: number;
  statusBadgeText: string;
  statusBadgeVariant?: 'warning' | 'success' | 'info';
  phValue: number;
  soilTempValue: number;
  canopyHumidity: number;
  onPressDetails?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const ZoneOverviewCard: React.FC<ZoneOverviewCardProps> = ({
  zoneId,
  plotName,
  cropDescription,
  areaText,
  moisturePercent,
  moistureFloor,
  statusBadgeText,
  statusBadgeVariant = 'warning',
  phValue,
  soilTempValue,
  canopyHumidity,
  onPressDetails,
  style,
}) => {
  const isPaddy = zoneId === 'paddy';
  const primaryZoneColor = isPaddy ? Colors.stitch.water : Colors.stitch.secondary;

  return (
    <StitchCard style={[styles.card, style]}>
      {/* Top Plot Header Strip */}
      <View style={styles.topHeader}>
        <View style={styles.topLeft}>
          <View
            style={[
              styles.iconBox,
              {
                backgroundColor: isPaddy
                  ? Colors.stitch.waterLight
                  : Colors.stitch.secondaryContainer,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={isPaddy ? 'waves' : 'sprout'}
              size={20}
              color={primaryZoneColor}
            />
          </View>
          <View style={styles.titleCol}>
            <Text style={styles.plotName}>{plotName}</Text>
            <Text style={styles.cropDesc}>
              {cropDescription} • {areaText}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.badge,
            statusBadgeVariant === 'warning'
              ? styles.badgeWarning
              : statusBadgeVariant === 'info'
              ? styles.badgeInfo
              : styles.badgeSuccess,
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              statusBadgeVariant === 'warning'
                ? styles.badgeTextWarning
                : statusBadgeVariant === 'info'
                ? styles.badgeTextInfo
                : styles.badgeTextSuccess,
            ]}
          >
            {statusBadgeText}
          </Text>
        </View>
      </View>

      {/* Moisture Progress Strip */}
      <View style={styles.moistureStrip}>
        <View style={styles.moistureHeader}>
          <View style={styles.moistureTitleGroup}>
            <MaterialCommunityIcons
              name="water-percent"
              size={18}
              color={primaryZoneColor}
            />
            <Text style={styles.moistureTitle}>
              Soil Moisture (Capacitive V1.2)
            </Text>
          </View>
          <Text style={styles.moistureVal}>{moisturePercent}%</Text>
        </View>

        {/* Progress Track */}
        <View style={styles.progressTrack}>
          {/* Threshold marker */}
          <View
            style={[
              styles.thresholdLine,
              { left: `${moistureFloor}%` },
            ]}
          />
          <View
            style={[
              styles.progressBar,
              {
                width: `${Math.min(moisturePercent, 100)}%`,
                backgroundColor: primaryZoneColor,
              },
            ]}
          />
        </View>

        <View style={styles.moistureLimitsRow}>
          <Text style={styles.limitText}>Floor: {moistureFloor}%</Text>
          <Text
            style={[
              styles.limitText,
              { color: isPaddy ? Colors.stitch.water : Colors.stitch.secondary, fontWeight: '700' },
            ]}
          >
            {isPaddy ? 'Flooded Layer Nominal' : 'Target: 55-65%'}
          </Text>
        </View>
      </View>

      {/* 3-Metric Mini Grid (pH, Soil Temp, Humidity) */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricItem}>
          <MaterialCommunityIcons
            name="flask-outline"
            size={16}
            color={Colors.stitch.tertiaryContainer}
          />
          <Text style={styles.metricItemLabel}>Soil pH</Text>
          <Text style={styles.metricItemValue}>{phValue.toFixed(1)}</Text>
          <Text style={styles.metricItemSub}>PE-03</Text>
        </View>

        <View style={styles.metricItem}>
          <MaterialCommunityIcons
            name="thermometer"
            size={16}
            color={Colors.stitch.primary}
          />
          <Text style={styles.metricItemLabel}>Soil Temp</Text>
          <Text style={styles.metricItemValue}>{soilTempValue.toFixed(1)}°C</Text>
          <Text style={styles.metricItemSub}>DS18B20</Text>
        </View>

        <View style={styles.metricItem}>
          <MaterialCommunityIcons
            name="cloud-outline"
            size={16}
            color={Colors.stitch.secondary}
          />
          <Text style={styles.metricItemLabel}>Canopy RH</Text>
          <Text style={styles.metricItemValue}>{canopyHumidity}%</Text>
          <Text style={styles.metricItemSub}>DHT11</Text>
        </View>
      </View>

      {/* Footer Navigation Button */}
      {onPressDetails && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onPressDetails}
          style={styles.detailsBtn}
        >
          <Text style={styles.detailsBtnText}>View Zone Diagnostics</Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={18}
            color={Colors.stitch.secondary}
          />
        </TouchableOpacity>
      )}
    </StitchCard>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: Spacing.spaceMd,
    marginBottom: Spacing.spaceMd,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.spaceSm,
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.spaceSm,
  },
  titleCol: {
    flex: 1,
  },
  plotName: {
    ...Typography.headlineSm,
    color: Colors.stitch.primary,
    fontWeight: '700',
  },
  cropDesc: {
    ...Typography.bodySm,
    color: Colors.stitch.outline,
    marginTop: 1,
  },
  badge: {
    paddingHorizontal: Spacing.spaceSm,
    paddingVertical: 3,
    borderRadius: BorderRadius.md,
  },
  badgeWarning: {
    backgroundColor: Colors.stitch.tertiaryFixed,
  },
  badgeInfo: {
    backgroundColor: Colors.stitch.secondaryContainer,
  },
  badgeSuccess: {
    backgroundColor: '#E8F5E9',
  },
  badgeText: {
    ...Typography.labelSm,
    fontWeight: '700',
  },
  badgeTextWarning: {
    color: Colors.stitch.onTertiaryFixed,
  },
  badgeTextInfo: {
    color: Colors.stitch.onSecondaryContainer,
  },
  badgeTextSuccess: {
    color: Colors.stitch.secondary,
  },
  moistureStrip: {
    backgroundColor: Colors.stitch.surfaceContainerLow,
    padding: Spacing.spaceSm + 2,
    borderRadius: BorderRadius.md,
    marginVertical: Spacing.spaceXs,
  },
  moistureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.spaceXs,
  },
  moistureTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  moistureTitle: {
    ...Typography.labelSm,
    color: Colors.stitch.primary,
    fontWeight: '600',
  },
  moistureVal: {
    ...Typography.metricLg,
    color: Colors.stitch.primary,
    fontWeight: '800',
  },
  progressTrack: {
    height: 10,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.stitch.surfaceContainerHighest,
    position: 'relative',
    overflow: 'hidden',
  },
  thresholdLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: Colors.stitch.error,
    zIndex: 2,
  },
  progressBar: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  moistureLimitsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  limitText: {
    ...Typography.labelSm,
    fontSize: 10,
    color: Colors.stitch.outline,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: Spacing.spaceSm,
    marginTop: Spacing.spaceSm,
  },
  metricItem: {
    flex: 1,
    backgroundColor: Colors.stitch.surfaceContainerLow,
    padding: Spacing.spaceSm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  metricItemLabel: {
    ...Typography.labelSm,
    fontSize: 9,
    color: Colors.stitch.outline,
    marginTop: 2,
  },
  metricItemValue: {
    ...Typography.headlineSm,
    color: Colors.stitch.primary,
    fontWeight: '700',
    marginTop: 1,
  },
  metricItemSub: {
    ...Typography.labelSm,
    fontSize: 9,
    color: Colors.stitch.secondary,
    fontWeight: '600',
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.spaceSm + 2,
    borderTopWidth: 1,
    borderTopColor: Colors.stitch.surfaceContainer,
    marginTop: Spacing.spaceSm,
    gap: 4,
  },
  detailsBtnText: {
    ...Typography.labelMd,
    color: Colors.stitch.secondary,
    fontWeight: '700',
  },
});
