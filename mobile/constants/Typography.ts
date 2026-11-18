import type { TextStyle } from 'react-native';

export const FontFamily = {
  regular: 'PlusJakartaSans-Regular',
  medium: 'PlusJakartaSans-Medium',
  semiBold: 'PlusJakartaSans-SemiBold',
  bold: 'PlusJakartaSans-Bold',
  extraBold: 'PlusJakartaSans-ExtraBold',
};

export const Typography: Record<string, TextStyle> = {
  // Stitch Exact Scales
  displayLg: {
    fontSize: 44,
    fontWeight: '700',
    lineHeight: 52,
    letterSpacing: -0.03 * 44,
  },
  displayMd: {
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 44,
    letterSpacing: -0.025 * 36,
  },
  metricXl: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
    letterSpacing: -0.02 * 32,
  },
  metricXlMobile: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    letterSpacing: -0.02 * 28,
  },
  metricLg: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 30,
    letterSpacing: -0.01 * 24,
  },
  headlineLg: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    letterSpacing: -0.02 * 28,
  },
  headlineMd: {
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 28,
    letterSpacing: -0.01 * 22,
  },
  headlineSm: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodyLg: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodyMd: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: 0.14,
  },
  bodySm: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    letterSpacing: 0.24,
  },
  labelMd: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    letterSpacing: 0.48,
  },
  labelSm: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 14,
    letterSpacing: 0.6,
  },

  // Aliases for backwards compatibility
  displayLarge:   { fontSize: 40, fontWeight: '700', lineHeight: 48 },
  displayMedium:  { fontSize: 32, fontWeight: '700', lineHeight: 40 },
  displaySmall:   { fontSize: 28, fontWeight: '600', lineHeight: 36 },
  headlineLarge:  { fontSize: 24, fontWeight: '700', lineHeight: 32 },
  headlineMedium: { fontSize: 20, fontWeight: '600', lineHeight: 28 },
  headlineSmall:  { fontSize: 18, fontWeight: '600', lineHeight: 26 },
  titleLarge:     { fontSize: 16, fontWeight: '600', lineHeight: 24 },
  titleMedium:    { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  titleSmall:     { fontSize: 12, fontWeight: '600', lineHeight: 18 },
  bodyLarge:      { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  bodyMedium:     { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  bodySmall:      { fontSize: 12, fontWeight: '400', lineHeight: 16 },
  labelLarge:     { fontSize: 14, fontWeight: '500', lineHeight: 20 },
  labelMedium:    { fontSize: 12, fontWeight: '500', lineHeight: 16 },
  labelSmall:     { fontSize: 10, fontWeight: '500', lineHeight: 14 },
  caption:        { fontSize: 10, fontWeight: '400', lineHeight: 14 },
};
