# Android System UI Overlay Fix - FINAL SOLUTION

## Problem
The Android status bar and navigation buttons were overlaying the application content in the APK build.

## Root Cause
The issue had two parts:
1. **Overlay Configuration**: StatusBar plugin needed to be configured with `overlay: false`
2. **Module Resolution Error**: Importing StatusBar directly in React code caused Vite build errors

## Final Solution

### 1. Capacitor Configuration (`capacitor.config.json`)
Configure the StatusBar plugin declaratively (no code imports needed):

```json
{
  "appId": "com.terraqua.gis",
  "appName": "SurveyZest",
  "webDir": "dist",
  "bundledWebRuntime": false,
  "plugins": {
    "StatusBar": {
      "overlay": false,
      "backgroundColor": "#000000",
      "style": "DARK"
    }
  },
  "android": {
    "allowMixedContent": true
  }
}
```

**Key Setting**: `"overlay": false` - This tells Android to reserve space for the status bar instead of letting it overlay the app content.

### 2. MainActivity.java
Set the status bar color programmatically:

```java
package com.terraqua.gis;

import android.os.Bundle;
import android.graphics.Color;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Set status bar color to black
        getWindow().setStatusBarColor(Color.BLACK);
    }
}
```

### 3. AndroidManifest.xml
Added `windowSoftInputMode` for proper keyboard handling:

```xml
<activity
    android:name=".MainActivity"
    android:windowSoftInputMode="adjustResize"
    ...>
</activity>
```

### 4. index.html
Updated viewport meta tag:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

### 5. index.css
Removed safe-area-inset padding (not needed with overlay: false):

```css
body {
  font-size: 1rem;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  position: relative;
  height: 100vh;
  height: 100dvh; /* Use dynamic viewport height for better mobile support */
}
```

### 6. App.jsx
**NO StatusBar imports or initialization code needed!** The configuration in `capacitor.config.json` handles everything automatically.

## Why This Works

1. **Declarative Configuration**: Capacitor reads the `capacitor.config.json` and applies the StatusBar settings automatically when the app starts.

2. **No Module Resolution Issues**: By not importing `@capacitor/status-bar` in the React code, we avoid Vite build errors.

3. **Native-Level Configuration**: The `MainActivity.java` sets the status bar color at the native Android level, which is more reliable than JavaScript calls.

4. **Proper Layout**: With `overlay: false`, Android automatically:
   - Reserves space for the status bar at the top
   - Reserves space for the navigation bar at the bottom
   - Positions app content in the remaining space

## Build and Test

1. **Build the web assets:**
   ```bash
   npm run build
   ```

2. **Sync with Capacitor:**
   ```bash
   npx cap sync android
   ```

3. **Open in Android Studio:**
   ```bash
   npx cap open android
   ```

4. **Build APK:**
   - In Android Studio: Build → Build Bundle(s) / APK(s) → Build APK(s)
   - Or command line: `cd android && gradlew.bat assembleDebug`

## Expected Result

After installing the APK:
- ✅ App loads without white screen
- ✅ Status bar is visible with black background
- ✅ App content starts BELOW the status bar (not behind it)
- ✅ Navigation buttons are visible at the bottom
- ✅ App content ends ABOVE the navigation buttons (not behind them)
- ✅ No JavaScript errors in console

## Technical Notes

### Why Not Import StatusBar in React?

When you import Capacitor plugins directly in React code:
```jsx
import { StatusBar } from '@capacitor/status-bar'; // ❌ Causes build errors
```

Vite tries to bundle this as a web module, but `@capacitor/status-bar` is a native plugin that only works on mobile. This causes:
- Module resolution errors during build
- White screen on app launch
- JavaScript errors in the WebView

### The Correct Approach

Use the **declarative configuration** in `capacitor.config.json`:
- ✅ No imports needed
- ✅ No JavaScript code needed  
- ✅ Configuration applied automatically by Capacitor
- ✅ Works perfectly with Vite builds

### When You DO Need to Import Capacitor Plugins

If you need to call plugin methods dynamically (e.g., change status bar color based on user action), use dynamic imports:

```jsx
// Only import when actually needed on native platform
if (Capacitor.isNativePlatform()) {
  const { StatusBar } = await import('@capacitor/status-bar');
  await StatusBar.setBackgroundColor({ color: '#FF0000' });
}
```

But for basic configuration like preventing overlay, the `capacitor.config.json` approach is cleaner and more reliable.

## Troubleshooting

If you still see issues:

1. **Clean build:**
   ```bash
   cd android
   gradlew.bat clean
   cd ..
   npm run build
   npx cap sync android
   ```

2. **Check logcat for errors:**
   ```bash
   adb logcat | findstr "Capacitor"
   ```

3. **Verify configuration was copied:**
   Check that `android/app/src/main/assets/capacitor.config.json` contains your StatusBar configuration.

## Summary

The fix is simple:
1. Configure StatusBar in `capacitor.config.json` with `overlay: false`
2. Set status bar color in `MainActivity.java`
3. **Don't** import StatusBar in React code
4. Rebuild and sync

That's it! The Capacitor framework handles the rest automatically.
