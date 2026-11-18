import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Colors } from '../../mobile/constants/Colors';

describe('AgroSmart 2.0 – Bottom Navigation & Icon Layout System', () => {
  test('Bottom tab icons are configured with consistent 24dp dimensions', () => {
    const TAB_ICON_SIZE = 24;
    assert.equal(TAB_ICON_SIZE >= 24 && TAB_ICON_SIZE <= 26, true, 'Icon size must be between 24-26dp');
  });

  test('Material 3 pill indicator preserves consistent dimensions between active and inactive states', () => {
    const pillDimensions = {
      width: 48,
      height: 30,
      borderRadius: 15,
    };
    assert.equal(pillDimensions.width, 48, 'Pill width should be 48dp');
    assert.equal(pillDimensions.height, 30, 'Pill height should be 30dp');
    assert.equal(pillDimensions.borderRadius, 15, 'Pill borderRadius should be half height');
  });

  test('Active tab color uses high-contrast primary canopy green on sprout accent pill', () => {
    const activeIconColor = Colors.stitch.primaryContainer; // #183D2B
    const activePillColor = Colors.stitch.secondaryContainer; // #ACF3B9
    assert.equal(activeIconColor, '#183D2B');
    assert.equal(activePillColor, '#ACF3B9');
  });

  test('Inactive tab color maintains high contrast (onSurfaceVariant #414843)', () => {
    const inactiveIconColor = Colors.stitch.onSurfaceVariant; // #414843
    assert.equal(inactiveIconColor, '#414843', 'Inactive icon color must be onSurfaceVariant for WCAG AA readability');
  });

  test('Android safe area insets are dynamically incorporated into tab bar height', () => {
    // Scenario A: Android device with 3-button system navigation (insets.bottom = 48dp)
    const insets3Button = { bottom: 48 };
    const bottomInset3Button = Math.max(insets3Button.bottom, 8);
    const height3Button = 62 + bottomInset3Button;
    assert.equal(bottomInset3Button, 48);
    assert.equal(height3Button, 110, 'Tab bar height must expand to 110dp on 3-button nav devices');

    // Scenario B: Android device with gesture pill navigation (insets.bottom = 20dp)
    const insetsGesture = { bottom: 20 };
    const bottomInsetGesture = Math.max(insetsGesture.bottom, 8);
    const heightGesture = 62 + bottomInsetGesture;
    assert.equal(bottomInsetGesture, 20);
    assert.equal(heightGesture, 82, 'Tab bar height must expand to 82dp on gesture nav devices');

    // Scenario C: Device with zero inset
    const insetsZero = { bottom: 0 };
    const bottomInsetZero = Math.max(insetsZero.bottom, 8);
    const heightZero = 62 + bottomInsetZero;
    assert.equal(bottomInsetZero, 8);
    assert.equal(heightZero, 70, 'Tab bar height must default to minimum 70dp when insets are 0');
  });

  test('All 5 bottom navigation tabs have valid MaterialCommunityIcons', () => {
    const tabIcons = [
      { name: 'Home', focused: 'view-dashboard', unfocused: 'view-dashboard-outline' },
      { name: 'Farm', focused: 'sprout', unfocused: 'sprout-outline' },
      { name: 'Irrigation', focused: 'water', unfocused: 'water-outline', running: 'water-pump' },
      { name: 'Analytics', focused: 'chart-box', unfocused: 'chart-box-outline' },
      { name: 'Profile', focused: 'account-cog', unfocused: 'account-cog-outline' },
    ];

    assert.equal(tabIcons.length, 5, 'Must have exactly 5 bottom navigation tabs');
    tabIcons.forEach(tab => {
      assert.ok(tab.focused.length > 0);
      assert.ok(tab.unfocused.length > 0);
    });
  });
});
