import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants';

export type ZoneFilter = 'all' | 'vegetable' | 'paddy';

interface ZoneFilterChipsProps {
  selected: ZoneFilter;
  onSelect: (filter: ZoneFilter) => void;
  style?: StyleProp<ViewStyle>;
}

export const ZoneFilterChips: React.FC<ZoneFilterChipsProps> = ({
  selected,
  onSelect,
  style,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.container, style]}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onSelect('all')}
        style={[
          styles.chip,
          selected === 'all' ? styles.chipActive : styles.chipInactive,
        ]}
      >
        <MaterialCommunityIcons
          name="layers"
          size={18}
          color={selected === 'all' ? Colors.neutral.white : Colors.stitch.outline}
        />
        <Text
          style={[
            styles.chipText,
            selected === 'all' ? styles.chipTextActive : styles.chipTextInactive,
          ]}
        >
          All Plots (2)
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onSelect('vegetable')}
        style={[
          styles.chip,
          selected === 'vegetable' ? styles.chipActive : styles.chipInactive,
        ]}
      >
        <View
          style={[
            styles.colorDot,
            { backgroundColor: Colors.stitch.secondary },
          ]}
        />
        <Text
          style={[
            styles.chipText,
            selected === 'vegetable' ? styles.chipTextActive : styles.chipTextInactive,
          ]}
        >
          Plot A: Vegetable
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onSelect('paddy')}
        style={[
          styles.chip,
          selected === 'paddy' ? styles.chipActive : styles.chipInactive,
        ]}
      >
        <View
          style={[
            styles.colorDot,
            { backgroundColor: Colors.stitch.water },
          ]}
        />
        <Text
          style={[
            styles.chipText,
            selected === 'paddy' ? styles.chipTextActive : styles.chipTextInactive,
          ]}
        >
          Plot B: Paddy
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.spaceSm,
    paddingVertical: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.spaceMd,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    gap: 6,
    borderWidth: 1,
    minHeight: 38,
  },
  chipActive: {
    backgroundColor: Colors.stitch.primaryContainer,
    borderColor: Colors.stitch.primaryContainer,
    elevation: 2,
  },
  chipInactive: {
    backgroundColor: Colors.stitch.surfaceContainerLowest,
    borderColor: Colors.stitch.border,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipText: {
    ...Typography.labelMd,
    fontWeight: '600',
  },
  chipTextActive: {
    color: Colors.neutral.white,
  },
  chipTextInactive: {
    color: Colors.stitch.onSurfaceVariant,
  },
});
