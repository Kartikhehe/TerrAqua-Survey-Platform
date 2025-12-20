# Debugging White Screen Issue

## Changes Made to Fix White Screen

1. **MainActivity.java** - Simplified to only set status bar color, removed `setFitsSystemWindows` which was blocking rendering
2. **App.jsx** - Made StatusBar initialization non-blocking with setTimeout and added detailed logging

## How to Check Logs in Android Studio

1. **Open Logcat in Android Studio:**
   - Bottom panel → Click "Logcat" tab
   - Or: View → Tool Windows → Logcat

2. **Filter for your app:**
   - In the filter dropdown, select your app package: `com.terraqua.gis`
   - Or search for: `SurveyZest`

3. **Look for these log messages:**
   - ✅ `Initializing StatusBar...`
   - ✅ `StatusBar overlay set to false`
   - ✅ `StatusBar style set to Dark`
   - ✅ `StatusBar background color set to black`
   - ❌ Any error messages with `StatusBar` or `Capacitor`

4. **Common errors to look for:**
   - `Plugin not found` - StatusBar plugin not registered
   - `WebView` errors - WebView initialization issues
   - `JavaScript` errors - Check for any JS errors in your code

## Alternative: Use ADB Logcat

If you prefer command line:

```bash
# Clear previous logs
adb logcat -c

# Start monitoring logs (filter for your app)
adb logcat | findstr "SurveyZest"

# Or filter for errors only
adb logcat *:E | findstr "terraqua"

# Or see all Capacitor logs
adb logcat | findstr "Capacitor"
```

## Quick Test Steps

1. **Rebuild the APK in Android Studio:**
   - Build → Clean Project
   - Build → Rebuild Project
   - Build → Build Bundle(s) / APK(s) → Build APK(s)

2. **Install and run:**
   - Run → Run 'app'
   - Or manually install the APK

3. **Watch the Logcat while the app starts**

## If Still White Screen

If you still see a white screen, try these steps:

### Step 1: Check if it's a StatusBar issue
Comment out the StatusBar code temporarily in `App.jsx`:

```jsx
useEffect(() => {
  // TEMPORARILY DISABLED FOR TESTING
  /*
  if (Capacitor.isNativePlatform()) {
    setTimeout(async () => {
      // ... StatusBar code
    }, 100);
  }
  */
}, []);
```

Rebuild and test. If the app works, the issue is with StatusBar.

### Step 2: Check AuthContext
The white screen might be from `loading` state stuck at `true`. Add console logs:

```jsx
console.log('Auth loading:', loading, 'isAuthenticated:', isAuthenticated);
```

### Step 3: Check for JavaScript errors
Open Chrome DevTools for Android:
1. Connect device via USB
2. Enable USB debugging on device
3. Open Chrome on PC
4. Go to: `chrome://inspect`
5. Find your app and click "inspect"
6. Check Console tab for errors

## Expected Behavior After Fix

- App should load normally (no white screen)
- Status bar should be visible with black background
- App content should start below the status bar
- No overlay issues

## Contact Points

If still having issues, check:
1. Logcat output (paste relevant errors)
2. Chrome DevTools console (paste JavaScript errors)
3. Build output (any Gradle errors?)
