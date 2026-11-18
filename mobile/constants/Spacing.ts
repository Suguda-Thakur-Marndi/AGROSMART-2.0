/**
 * AgroSmart 2.0 – Spacing, Radii & Botanical Shadow Tokens
 * Source of Truth: Google Stitch UI/UX (AgroSmart Organic IoT)
 */

export const Spacing = {
  // Stitch Exact Scale
  margin: 20,           // 1.25rem
  marginCompact: 16,    // 1rem
  gutter: 16,           // 1rem
  gutterSm: 12,         // 0.75rem
  spaceXs: 4,           // 0.25rem
  spaceSm: 8,           // 0.5rem
  spaceMd: 12,          // 0.75rem
  spaceLg: 20,          // 1.25rem
  spaceXl: 28,          // 1.75rem
  space2xl: 40,         // 2.5rem

  // Standard aliases for flexibility
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 28,
  '2xl': 40,
  '3xl': 48,
  '4xl': 64,
};

export const BorderRadius = {
  xs: 4,                // 0.25rem
  sm: 4,                // 0.25rem
  md: 12,               // 0.75rem
  lg: 16,               // 1.0rem
  xl: 24,               // 1.5rem (Parent container cards)
  '2xl': 32,            // 2.0rem (Hero cards & bottom sheets)
  full: 9999,           // Pill buttons & badges
};

export const Shadow = {
  // Botanical Ambient Diffusion with subtle Forest-Green tint (#183D2B)
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#183D2B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#183D2B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  lg: {
    shadowColor: '#183D2B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6,
  },
};
