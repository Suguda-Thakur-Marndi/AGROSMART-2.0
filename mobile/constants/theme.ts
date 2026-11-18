/**
 * AgroSmart 2.0 – Theme Configuration
 * Source of Truth: Google Stitch UI/UX (AgroSmart Organic IoT)
 */

import { Colors } from './Colors';
import { Spacing, BorderRadius, Shadow } from './Spacing';
import { Typography } from './Typography';

export const Theme = {
  colors: Colors.stitch,
  spacing: Spacing,
  radii: BorderRadius,
  shadows: Shadow,
  typography: Typography,

  // Mobile UX Ergonomic Constraints
  touchTargetMin: 48, // Minimum 48dp touch bounding box
  buttonHeight: 52,   // 52px primary action button height
  topBarHeight: 56,   // 56px Android top app bar
  bottomNavHeight: 68,// Fixed warm white bottom dock

  // Standard Surface Styles
  screenBackground: {
    flex: 1,
    backgroundColor: Colors.stitch.surfaceContainerLow,
  },

  cardSurface: {
    backgroundColor: Colors.stitch.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.stitch.border,
    padding: Spacing.spaceLg,
    ...Shadow.md,
  },
};
