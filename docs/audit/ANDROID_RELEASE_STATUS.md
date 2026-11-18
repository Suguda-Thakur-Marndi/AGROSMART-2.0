# AGROSMART 2.0 – ANDROID CLIENT RELEASE & DEVICE VERIFICATION (STAGE 2)

**Report Date:** November 18, 2026  
**Target Platform:** Android 11.0+ (API Level 30 - 35)  
**Client Framework:** Expo SDK 58, Expo Router 58, React Native 0.88.1, React 19.3.1  
**Build Engine:** Hermes Bytecode Engine  

---

## 1. Actual Android Device Testing Audit

### 1.1 Physical Device Verification Status
- **Test Execution on Real Device:** **ATTEMPTED / ENCOUNTERED ERROR**
- **Observed Behavior:** The user launched the application on an actual Android smartphone running Expo Go. The screen displayed a red Metro bundler crash:
  ```text
  URL: http://192.168.0.200:8082/node_modules/expo-router/entry.bundle?...
  InternalError: Metro has encountered an error: Cannot read properties of undefined (reading 'transformFile')
  ```
- **Root Cause:**
  1. The bundler initially spawned on port 8082 while port 8081 was occupied. During that run, Babel presets (`babel-preset-expo`) had not yet been installed, leaving the internal Metro worker transformer uninitialized.
  2. The server subsequently restarted on port 8081, but the physical phone retained the cached URL pointing to port 8082.
- **Verification via Hermes Export:**
  - We executed `npx expo export --platform android --no-minify` directly on the codebase.
  - The bundler transformed **1,923 modules in 22,423 ms**, creating the complete Hermes `.hbc` bytecode bundle (`entry-0ff6f8b7a7bf97dd02d9ea7fa714f644.hbc`, 4.8 MB) with zero errors.
- **Current Device Status:** **HARDWARE PENDING** (The user must connect to the fresh port 8081 server to observe live rendering).

---

## 2. Play Store Readiness Reality Check

> [!WARNING]
> **NOT READY FOR PLAY STORE RELEASE**
> An application cannot be declared "Play Store Ready" merely because `npx expo export` succeeds. The following mandatory release requirements remain unfulfilled:

| Production Requirement | Current Status | Required Action |
| :--- | :---: | :--- |
| **Hermes Bytecode Compilation** | **VERIFIED** | Completed (4.8 MB optimized `.hbc` bundle generated). |
| **Interactive UI on Physical Device** | **HARDWARE PENDING** | User must reload on port 8081 and verify all 5 tabs render without visual clipping. |
| **Hardware End-to-End Control** | **HARDWARE PENDING** | Must verify manual pump commands reach physical board and reflect back in UI. |
| **Android Keystore Signing** | **NOT STARTED** | Production `.jks` release keystore not yet configured via EAS Credentials. |
| **Production API Host Configuration** | **INCOMPLETE** | App currently points to local LAN IP (`192.168.0.200:8000`); requires HTTPS domain in production. |
| **Android App Bundle (.aab)** | **NOT STARTED** | Must run `eas build --platform android --profile production`. |
| **Google Play Privacy Policy & Data Safety**| **NOT STARTED** | Must prepare privacy declaration for background notifications and network access. |

---

## 3. Step-by-Step Instructions to Load App on Android Device

To clear the Metro red screen and load the live interface on your Android phone:

1. **Ensure No Lingering Node Processes:**
   ```powershell
   Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
   ```
2. **Start Metro with Cache Clear on Default Port (8081):**
   ```powershell
   cd "c:\Users\sugud\OneDrive\Documents\AGROSMART 2.0\mobile"
   npx expo start -c
   ```
3. **On Your Android Phone:**
   - Tap **Dismiss** on the red screen in Expo Go, or swipe away the app from recent apps.
   - Reopen Expo Go.
   - Under "Recently In Development", delete any entry pointing to port `8082`.
   - Scan the terminal QR code pointing to `exp://<Your-LAN-IP>:8081`.
4. **Expected Result:**
   - Metro terminal logs show: `Android Bundled ... (1923 modules)`.
   - The phone screen displays the AgroSmart 2.0 Dashboard with the soil moisture gauge and Google Stitch styling.
