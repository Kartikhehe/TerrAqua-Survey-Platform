# Fix "No Android Facet" Error

## The Problem
Android Studio shows "no Android facet" error and won't build the project.

## Quick Fix

### Option 1: Re-sync Gradle (Recommended)

1. **Close Android Studio completely**

2. **Delete Android Studio cache files:**
   ```bash
   cd c:\Projects\TerrAqua-Survey-Platform\android
   Remove-Item -Path .idea -Recurse -Force
   Remove-Item -Path .gradle -Recurse -Force
   Remove-Item -Path build -Recurse -Force
   Remove-Item -Path app\.cxx -Recurse -Force -ErrorAction SilentlyContinue
   ```

3. **Reopen the project:**
   ```bash
   npx cap open android
   ```

4. **In Android Studio:**
   - Wait for Gradle sync to complete
   - File → Sync Project with Gradle Files
   - File → Invalidate Caches → Invalidate and Restart

### Option 2: Use Command Line Build

If Android Studio still has issues, build from command line:

```bash
cd c:\Projects\TerrAqua-Survey-Platform\android
.\gradlew clean
.\gradlew assembleDebug
```

The APK will be at: `app\build\outputs\apk\debug\app-debug.apk`

### Option 3: Recreate Android Project

If the above doesn't work:

```bash
cd c:\Projects\TerrAqua-Survey-Platform

# Remove android folder
Remove-Item -Path android -Recurse -Force

# Rebuild from scratch
npm run build
npx cap add android
npx cap sync android
```

**Note:** This will recreate the android folder, so you'll need to reapply the MainActivity.java and styles.xml changes.

## After Fixing

Once Android Studio recognizes the project:

1. **Build → Clean Project**
2. **Build → Rebuild Project**
3. **Build → Build APK(s)**

## Alternative: Build Without Android Studio

You can always build the APK using Gradle directly:

```bash
cd c:\Projects\TerrAqua-Survey-Platform\android
.\gradlew assembleDebug
```

This doesn't require Android Studio to recognize the project structure.

## What Caused This?

The error likely occurred because:
- We deleted the `build` folder while Android Studio was open
- Android Studio's cache got corrupted
- Gradle sync was interrupted

## Prevention

In the future:
- Close Android Studio before deleting build folders
- Use Android Studio's "Clean Project" instead of manually deleting folders
- Always let Gradle sync complete before making changes
