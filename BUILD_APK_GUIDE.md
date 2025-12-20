# Quick Build Guide for Android APK

## Build the APK with the fixes

### Option 1: Using Android Studio (Recommended)
1. Open Android Studio
2. Click "Open an Existing Project"
3. Navigate to: `c:\Projects\TerrAqua-Survey-Platform\android`
4. Wait for Gradle sync to complete
5. Click **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
6. The APK will be located at: `android/app/build/outputs/apk/debug/app-debug.apk`

### Option 2: Using Command Line
```bash
cd android
./gradlew assembleDebug
```

Or on Windows:
```bash
cd android
gradlew.bat assembleDebug
```

The APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

## Install the APK on your device

### Using ADB (Android Debug Bridge)
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

Or to reinstall (if already installed):
```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

### Manual Installation
1. Copy the APK file to your Android device
2. Open the file on your device
3. Allow installation from unknown sources if prompted
4. Install the app

## Verify the Fix

After installing the new APK, check that:
- ✅ The status bar is visible with a black background
- ✅ Your app content starts BELOW the status bar (not behind it)
- ✅ The navigation buttons are visible at the bottom
- ✅ Your app content ends ABOVE the navigation buttons (not behind them)
- ✅ No overlay issues when scrolling or interacting with the app

## Troubleshooting

If you still see overlay issues:
1. Completely uninstall the old APK from your device
2. Restart your device
3. Install the new APK
4. Clear app cache and data if needed

## For Production Build

When ready for production:
```bash
npm run build
npx cap sync android
cd android
./gradlew assembleRelease
```

The production APK will be at: `android/app/build/outputs/apk/release/app-release.apk`
