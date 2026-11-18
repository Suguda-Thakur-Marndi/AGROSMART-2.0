/**
 * AgroSmart 2.0 – Official Color Palette
 * Source of Truth: Google Stitch UI/UX (AgroSmart Organic IoT)
 */

export const Colors = {
  // Official Stitch Material / Organic Design Tokens
  stitch: {
    surface: '#FCF9EF',
    surfaceDim: '#DCDAD1',
    surfaceBright: '#FCF9EF',
    surfaceContainerLowest: '#FFFEF9', // Warm White Cards
    surfaceContainerLow: '#F6F4EA',    // Global Screen Backdrop
    surfaceContainer: '#F0EEE4',
    surfaceContainerHigh: '#EAE8DE',
    surfaceContainerHighest: '#E4E3D9',
    onSurface: '#1B1C16',
    onSurfaceVariant: '#414843',
    inverseSurface: '#30312A',
    inverseOnSurface: '#F3F1E7',
    outline: '#727973',
    outlineVariant: '#C1C8C1',
    surfaceTint: '#416652',
    border: '#E3E7DC',                  // Botanical Border

    primary: '#002717',
    onPrimary: '#FFFFFF',
    primaryContainer: '#183D2B',       // Primary Canopy Green
    onPrimaryContainer: '#81A890',
    inversePrimary: '#A7D0B7',

    secondary: '#286B3D',              // Foliage Green
    onSecondary: '#FFFFFF',
    secondaryContainer: '#ACF3B9',     // Sprout Green Accent
    onSecondaryContainer: '#2F7143',
    secondaryFixed: '#ACF3B9',
    secondaryFixedDim: '#91D69F',
    onSecondaryFixed: '#00210C',
    onSecondaryFixedVariant: '#075228',

    water: '#559FC1',                  // Canal Water Blue
    waterLight: '#E1F5FE',

    tertiary: '#331B02',               // Earth Loam Brown
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#4B3013',
    onTertiaryContainer: '#BF9872',
    tertiaryFixed: '#FFDCBE',
    tertiaryFixedDim: '#EABE96',
    onTertiaryFixed: '#2C1600',
    onTertiaryFixedVariant: '#5E4122',

    error: '#BA1A1A',                  // Soil Alert Red
    onError: '#FFFFFF',
    errorContainer: '#FFDAD6',
    onErrorContainer: '#93000A',

    warning: '#E5B94D',                // Sunlight Yellow
    warningAmber: '#D97706',
  },

  // Primary palette (mapped to Stitch Organic Canopy)
  primary: {
    forest: '#183D2B',    // Primary Canopy Green
    natural: '#286B3D',   // Secondary Foliage Green
    light: '#6D9B62',     // Fresh Growth Green
    pale: '#A8B99A',      // Sage Mist
    mint: '#E8EFE2',      // Pale Sprout
  },

  // Accent
  accent: {
    blue: '#559FC1',      // Canal Water Blue
    lightBlue: '#E1F5FE',
    yellow: '#E5B94D',    // Sunlight Yellow
    lightYellow: '#FFF9C4',
    amber: '#D97706',
  },

  // Neutrals (Stitch Warm Organic Substrates)
  neutral: {
    white: '#FFFFFF',
    warmWhite: '#FFFEF9', // Primary Card Surface
    background: '#F6F4EA',// Global Screen Cream Backdrop
    card: '#FFFEF9',
    border: '#E3E7DC',    // Botanical Border
    divider: '#E4E3D9',
  },

  // Text
  text: {
    primary: '#1B1C16',   // Deep Chlorophyll / Charcoal
    secondary: '#414843', // Secondary Stem Gray
    tertiary: '#727973',
    inverse: '#FFFFFF',
    disabled: '#C1C8C1',
  },

  // Status
  status: {
    success: '#286B3D',
    warning: '#D97706',
    error: '#BA1A1A',
    info: '#559FC1',
    offline: '#727973',
  },

  // Sensor-specific
  sensor: {
    moisture: '#559FC1',
    ph: '#4B3013',
    temperature: '#FF5722',
    humidity: '#286B3D',
    pump: '#183D2B',
  },

  // Zone colors
  zone: {
    vegetable: '#286B3D',
    paddy: '#559FC1',
  },

  // Gradients
  gradient: {
    primary: ['#183D2B', '#286B3D'] as const,
    card: ['#FFFEF9', '#F6F4EA'] as const,
    hero: ['#183D2B', '#2F543C', '#F0EEE4'] as const,
    vegetable: ['#183D2B', '#286B3D'] as const,
    paddy: ['#0E3E5B', '#559FC1'] as const,
    moisture: ['#286B3D', '#559FC1'] as const,
    temperature: ['#BF360C', '#FF5722'] as const,
    waterArea: ['rgba(40, 107, 61, 0.25)', 'rgba(40, 107, 61, 0.0)'] as const,
    paddyWaterArea: ['rgba(85, 159, 193, 0.35)', 'rgba(85, 159, 193, 0.0)'] as const,
  },
};

export type ColorKey = keyof typeof Colors;
