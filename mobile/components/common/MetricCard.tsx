import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Card } from './Card';
import { Badge } from './Badge';
import { Colors, Spacing, Typography } from '../../constants';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  statusText?: string;
  statusVariant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  icon?: ReactNode;
  zone?: 'vegetable' | 'paddy' | 'ambient';
  isFault?: boolean;
  faultMessage?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  statusText,
  statusVariant = 'neutral',
  icon,
  zone,
  isFault = false,
  faultMessage,
  onPress,
  style,
}) => {
  return (
    <Card
      variant="elevated"
      padding="base"
      onPress={onPress}
      style={[styles.card, isFault && styles.cardFault, style]}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>
        {zone && (
          <Badge
            label={zone === 'vegetable' ? 'Vegetable' : zone === 'paddy' ? 'Paddy' : 'Ambient'}
            variant={zone === 'vegetable' ? 'zone_veg' : zone === 'paddy' ? 'zone_paddy' : 'neutral'}
            size="sm"
          />
        )}
      </View>

      <View style={styles.valueRow}>
        {isFault ? (
          <View style={styles.faultContainer}>
            <Text style={styles.faultText}>DISCONNECTED</Text>
            {faultMessage ? (
              <Text style={styles.faultDetail}>{faultMessage}</Text>
            ) : null}
          </View>
        ) : (
          <View style={styles.valueContainer}>
            <Text style={styles.value}>{value}</Text>
            {unit ? <Text style={styles.unit}>{unit}</Text> : null}
          </View>
        )}
      </View>

      {statusText && !isFault && (
        <View style={styles.footerRow}>
          <Badge label={statusText} variant={statusVariant} size="sm" showDot />
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    minHeight: 120,
    justifyContent: 'space-between',
  },
  cardFault: {
    borderColor: '#FFCDD2',
    backgroundColor: '#FFF8F8',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.xs,
  },
  iconContainer: {
    marginRight: Spacing.xs + 2,
  },
  title: {
    ...Typography.titleSmall,
    color: Colors.text.secondary,
  },
  valueRow: {
    marginVertical: Spacing.xs,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    ...Typography.headlineLarge,
    color: Colors.text.primary,
  },
  unit: {
    ...Typography.titleMedium,
    color: Colors.text.tertiary,
    marginLeft: Spacing.xs,
  },
  faultContainer: {
    paddingVertical: Spacing.xs,
  },
  faultText: {
    ...Typography.titleMedium,
    color: Colors.status.error,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  faultDetail: {
    ...Typography.caption,
    color: Colors.status.error,
    marginTop: 2,
  },
  footerRow: {
    marginTop: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
