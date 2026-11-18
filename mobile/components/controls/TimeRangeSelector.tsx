import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants';

interface TimeRangeSelectorProps {
  options?: string[];
  selected: string;
  onSelect: (option: string) => void;
  style?: StyleProp<ViewStyle>;
}

export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  options = ['24 Hours', '7 Days', '30 Days'],
  selected,
  onSelect,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {options.map((opt) => {
        const isSelected = selected === opt;
        return (
          <TouchableOpacity
            key={opt}
            activeOpacity={0.75}
            onPress={() => onSelect(opt)}
            style={[
              styles.optionBtn,
              isSelected && styles.optionBtnSelected,
            ]}
          >
            <Text
              style={[
                styles.optionText,
                isSelected && styles.optionTextSelected,
              ]}
            >
              {opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.stitch.surfaceContainer,
    borderRadius: BorderRadius.full,
    padding: 3,
  },
  optionBtn: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: Spacing.spaceSm,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionBtnSelected: {
    backgroundColor: Colors.stitch.primaryContainer,
    elevation: 2,
    shadowColor: Colors.stitch.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  optionText: {
    ...Typography.labelSm,
    color: Colors.stitch.onSurfaceVariant,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: Colors.neutral.white,
    fontWeight: '700',
  },
});
