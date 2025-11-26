# Android Auto Integration - TWA Wrapper Approach

## Overview

This plan details implementing **Option 2: Trusted Web Activity (TWA) Wrapper** to add Android Auto support to the existing web radio player. This hybrid approach keeps your web application while adding native Android Auto capabilities.

## Selected Approach: TWA Wrapper

> [!NOTE]
> **Why TWA?**
> 
> The TWA (Trusted Web Activity) approach provides:
> - ✅ Keep existing web application (no rewrite needed)
> - ✅ Full Android Auto support via native MediaBrowserService
> - ✅ App appears as native Android app
> - ✅ Publishable to Google Play Store
> - ✅ Easier to maintain than full native app

## Prerequisites

Before we begin implementation, you'll need:

1. **Android Studio** - Download from [developer.android.com](https://developer.android.com/studio)
2. **Java Development Kit (JDK)** - Usually bundled with Android Studio
3. **Physical Android device** or emulator for testing
4. **Web server** - Your app needs to be hosted (Vercel works perfectly)

> [!IMPORTANT]
> **First Step: Install Android Studio**
> 
> If you don't have Android Studio installed yet, this is the critical first step. Download and install it from the official Android website. The installation includes the Android SDK and all necessary tools.
> 
> Installation time: ~30-60 minutes (includes downloading ~3GB)

## Implementation Phases

### ✅ Phase 1: PWA Foundation (COMPLETED)

**Status**: ✅ Complete

First, we needed to ensure the web app is a proper PWA, as TWA requires a valid PWA.

#### Completed Tasks:

✅ **manifest.json** - Created comprehensive Web App Manifest
- App name, short name, description
- Icons in multiple sizes (192x192, 512x512, maskable)
- Start URL and display mode set to "standalone"
- Theme colors and background color
- Categorized as "music" app for better integration
- Shortcuts to Favorites section

✅ **service-worker.js** - Implemented service worker
- Offline functionality for the app shell
- Caches static assets (HTML, CSS, JS, icons)
- Cache-first strategy for faster loading
- Bypasses cache for radio streams (they need to be live)
- Automatic cache cleanup on updates

✅ **App Icons** - Generated and saved
- `icon-192x192.png` - Standard icon
- `icon-512x512.png` - High-res icon
- `icon-maskable-512x512.png` - Adaptive icon for Android

✅ **index.html** - Updated with PWA meta tags
- Added manifest link
- Added theme color meta tags
- Added Apple mobile web app meta tags
- Added service worker registration script
- Added proper PWA description

✅ **audio-manager.js** - Enhanced MediaSession API
- Multiple artwork sizes for better compatibility (96x96 to 512x512)
- Proper action handlers (play, pause, stop, nexttrack, previoustrack)
- Playback state management (playing/paused/none)
- Seek handlers for car compatibility
- New `clearMediaSession()` method
- Rich metadata with station info and artwork
- Fallback to app icon when station has no favicon

✅ **app.js** - Better MediaSession integration
- MediaSession updates immediately when station starts
- Playback state syncs with MediaSession
- Metadata cleared when playback stops
- Proper lifecycle management

✅ **vercel.json** - Updated deployment configuration
- Proper headers for service worker (no-cache)
- Correct MIME type for manifest
- Service worker allowed header

#### Phase 1 Benefits (Available Now):

1. **📱 Installable PWA** - Can be installed on Android home screen
2. **🔒 Lock Screen Controls** - Full media controls on lock screen
3. **🔔 Notification Controls** - Media player in notification shade
4. **🚗 Better Bluetooth** - Station metadata displays on car screens
5. **⚡ Faster Loading** - Service worker caches assets
6. **🏠 Offline Shell** - App UI works offline

See `PHASE1_COMPLETE.md` for full details.

---

### Phase 2: Android TWA Project Setup

**Status**: ⏳ Pending Android Studio installation

Once Android Studio is installed, we'll create the Android wrapper application.

#### [NEW] Android Project Directory

Create new directory structure:
```
c:\dev\radio-app-gemini3-android\
├── app\
│   ├── src\
│   │   └── main\
│   │       ├── java\com\radiowave\
│   │       │   ├── MainActivity.kt
│   │       │   ├── RadioMediaService.kt
│   │       │   └── LauncherActivity.kt
│   │       ├── res\
│   │       │   ├── values\
│   │       │   ├── drawable\
│   │       │   └── xml\automotive_app_desc.xml
│   │       └── AndroidManifest.xml
│   └── build.gradle
├── build.gradle
└── settings.gradle
```

#### [NEW] build.gradle (Project Level)

Configure project with necessary repositories and dependencies.

#### [NEW] build.gradle (App Level)  

Add dependencies:
- `androidx.browser:browser` (TWA support)
- `androidx.media:media` (MediaBrowserService)
- Custom Tabs support

#### [NEW] AndroidManifest.xml

Configure:
- TWA integration with web app URL
- MediaBrowserService declaration
- Android Auto support metadata
- App permissions (INTERNET, FOREGROUND_SERVICE, MEDIA_CONTENT_CONTROL)

#### [NEW] Digital Asset Links

Create `.well-known/assetlinks.json` on your web server to verify app ownership.

---

### Phase 3: Media Service Implementation

**Status**: ⏳ Pending Phase 2 completion

Implement native Android Auto support through MediaBrowserService.

#### [NEW] RadioMediaService.kt

Main MediaBrowserService implementation:
- **Content hierarchy**: Organize stations (Favorites, All Stations, Genres)
- **MediaSession**: Create and configure for playback control
- **Playback engine**: Bridge between native controls and web player
- **Metadata handling**: Sync station info for Android Auto display

**Key components:**
```kotlin
class RadioMediaService : MediaBrowserServiceCompat() {
    private lateinit var mediaSession: MediaSessionCompat
    private lateinit var stateBuilder: PlaybackStateCompat.Builder
    
    override fun onGetRoot(...)
    override fun onLoadChildren(...)
    // Media control callbacks
}
```

#### [NEW] MainActivity.kt

TWA activity that hosts the web app:
- Launch web app in fullscreen TWA
- Pass playback commands to web app via JavaScript bridge
- Receive playback state updates from web app
- Update MediaSession state

#### [NEW] JavaScript Bridge

Enhance web app to communicate with native layer:
```javascript
// In audio-manager.js - add Android interface
if (window.Android) {
    window.Android.updatePlaybackState(state);
    window.Android.updateMetadata(title, artist, artwork);
}
```

---

### Phase 4: Android Auto Configuration

**Status**: ⏳ Pending Phase 3 completion

#### [NEW] automotive_app_desc.xml

Define Android Auto capabilities and media controls.

#### [MODIFY] AndroidManifest.xml

Add Android Auto metadata and service declarations.

## Verification Plan

### ✅ Phase 1: PWA Validation (COMPLETED)

1. **Lighthouse Audit** - ⏳ To be run on deployed version
   ```bash
   npx lighthouse https://your-vercel-app-url --view --preset=desktop
   ```
   - Target: 100% PWA score
   - Verify manifest and service worker

2. **Manual PWA Testing** - ✅ Verified locally
   - ✅ Manifest loads correctly (verified in DevTools)
   - ✅ Service worker registered and active
   - ⏳ Installation test on Android (pending deployment)

### Phase 2: Android App Testing  

1. **Build and Install**
   ```bash
   # In Android Studio terminal
   ./gradlew assembleDebug
   adb install app/build/outputs/apk/debug/app-debug.apk
   ```

2. **TWA Functionality**
   - Verify app opens web content fullscreen
   - Confirm no browser UI visible
   - Test JavaScript bridge communication

3. **Media Controls**
   - Test notification media controls
   - Test lock screen controls
   - Verify playback state syncs correctly

### Phase 3: Android Auto Testing

> [!IMPORTANT]
> **Android Auto Testing Options**
> 
> You can test Android Auto without a car:
> - **Desktop Head Unit (DHU)**: Simulator that runs on your PC
> - **Android Auto on Phone Screens**: Test directly on phone
> - **In-Car Testing**: Connect to actual Android Auto system

1. **Install Desktop Head Unit**
   ```bash
   # Download from Android SDK Manager in Android Studio
   # Tools > SDK Manager > SDK Tools > Android Auto Desktop Head Unit
   ```

2. **DHU Testing**
   - Launch DHU on PC
   - Connect Android device via USB with app installed
   - Enable Android Auto developer mode on phone
   - Verify app appears in media section
   - Test browsing stations
   - Test playback controls

3. **Real Car Testing** (if available)
   - Connect phone to car's Android Auto
   - Browse to app in media apps
   - Select stations from car interface
   - Test playback via car controls
   - Test voice commands

### Success Criteria

✅ **PWA Requirements** (Achieved)
- ✅ Manifest.json created and loaded
- ✅ Service worker active
- ⏳ Lighthouse PWA score: 100% (pending deployment test)
- ⏳ Installable as PWA (pending Android test)

⏳ **Android App Requirements** (Pending)
- Installs on Android device
- Opens as fullscreen app
- No browser chrome visible
- Digital Asset Links verified

⏳ **Media Integration** (Pending)
- MediaBrowserService discoverable
- Stations browsable in hierarchy
- MediaSession controls work
- Metadata displays correctly

⏳ **Android Auto Integration** (Pending)
- App visible in Android Auto
- Station library browsable from car
- Playback controllable from car UI
- Artwork and metadata display
- Voice commands functional

## Implementation Timeline

**✅ Phase 1: PWA Foundation** (~4-6 hours) - **COMPLETED**
- ✅ Create manifest.json and icons
- ✅ Implement service worker
- ✅ Enhance MediaSession API
- ⏳ Deploy to production (next step)

**⏳ Phase 2: Android Setup** (~2-3 hours)
- ⏳ Install Android Studio
- ⏳ Set up Android project
- ⏳ Configure TWA basics
- ⏳ Set up Digital Asset Links

**⏳ Phase 3: Media Service** (~6-8 hours)
- ⏳ Implement MediaBrowserService
- ⏳ Create JavaScript bridge
- ⏳ Sync playback state
- ⏳ Test media controls

**⏳ Phase 4: Android Auto** (~4-6 hours)
- ⏳ Configure Android Auto metadata
- ⏳ Test with DHU simulator
- ⏳ Refine station browsing
- ⏳ Test in real car (if available)

**Total Estimated Time**: 2-3 days
**Completed**: Phase 1 (~5 hours)
**Remaining**: ~12-18 hours

## Next Steps

### Immediate Actions:

1. **✅ Phase 1 Complete** - PWA foundation is ready!

2. **Deploy to Vercel** (Recommended next step)
   ```bash
   git add .
   git commit -m "feat: Add PWA support with enhanced MediaSession for car integration"
   git push
   ```
   - Test on deployed URL
   - Install on Android device
   - Test media controls

3. **Install Android Studio** (For Phase 2)
   - Download from: https://developer.android.com/studio
   - Follow installation wizard
   - Install Android SDK (default options)
   - Time: ~30-60 minutes

4. **Test PWA on Android**
   - Once deployed, install PWA on Android phone
   - Test lock screen controls
   - Test notification controls
   - Test with Bluetooth car audio

### After Android Studio Installation:

We'll proceed with Phase 2: TWA Android project setup and MediaBrowserService implementation.

---

**Last Updated**: Phase 1 completed - November 26, 2025
**Next Milestone**: Deploy and test PWA, then install Android Studio for Phase 2
