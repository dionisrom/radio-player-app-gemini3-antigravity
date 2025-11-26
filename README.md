# 📻 Modern Web Radio Player

A beautiful, feature-rich web-based radio player built with modern web technologies. This application provides a premium listening experience with real-time audio visualization, extensive station search, and robust playback handling for various stream types.

![Radio Player Screenshot](https://via.placeholder.com/800x450?text=Radio+Player+Preview)

## ✨ Key Features

*   **🎨 Dynamic Theming System**: Choose from multiple handcrafted themes (Dark, Midnight, Ocean, Forest, Sunset, etc.) with real-time switching.
*   **🎵 Advanced Audio Visualizer**: Real-time frequency analysis visualization that reacts to the music.
*   **🌍 Global Station Search**: Powered by the [Radio Browser API](https://www.radio-browser.info/), giving access to over 30,000 stations worldwide.
*   **❤️ Favorites System**: Save your favorite stations for quick access. Import/Export functionality allows you to backup and share your list.
*   **🛡️ Robust CORS Handling**: Custom-built audio engine that gracefully handles Cross-Origin Resource Sharing (CORS) restrictions, ensuring streams play even when metadata is blocked.
*   **📱 Progressive Web App (PWA)**: Install on your Android home screen like a native app. Works offline with cached assets for instant loading.
*   **🎧 Enhanced Media Controls**: Full MediaSession API integration enables lock screen controls, notification controls, and rich Bluetooth car audio integration.
*   **📱 Responsive Design**: Fully responsive interface that looks great on desktops, tablets, and mobile devices.
*   **🎧 Metadata Support**: Displays song titles and artist information (via Icecast metadata or Media Session API) when available.

## 🚗 Android Auto Integration Progress

**Status**: Phase 1 Complete ✅ | Working towards full Android Auto support

### ✅ Phase 1: PWA Foundation (Completed)

The radio player now features a robust PWA implementation that provides enhanced car integration even before Android Auto:

*   **🔒 Lock Screen Controls**: Play, pause, next, and previous controls on your phone's lock screen
*   **🔔 Rich Notifications**: Full media player in the notification shade with album art and station info
*   **🚗 Bluetooth Car Audio**: Station names and metadata display on your car's screen via Bluetooth
*   **🎛️ Steering Wheel Controls**: Use your car's steering wheel buttons to control playback
*   **⚡ Offline Support**: App shell cached for instant loading, works without internet connection (streams require connection)
*   **🏠 Installable**: Add to home screen for a native app-like experience

### 🎯 Roadmap to Full Android Auto Support

We're implementing a **Trusted Web Activity (TWA) Wrapper** approach to achieve native Android Auto integration while maintaining the web application:

**Phase 2: Android TWA Setup** (Next)
- Native Android wrapper app using Trusted Web Activities
- Digital Asset Links for app verification
- TWA integration with the existing PWA

**Phase 3: MediaBrowserService Implementation**
- Native Android MediaBrowserService for Android Auto compatibility
- JavaScript bridge between web app and native layer
- Station browsing hierarchy for in-car interface

**Phase 4: Android Auto Integration**
- Full Android Auto support with in-car display
- Voice command integration
- Desktop Head Unit (DHU) testing
- Real car testing and optimization

📖 **Full Documentation**: See `ANDROID_AUTO_PLAN.md` and `ANDROID_AUTO_TASKS.md` for detailed implementation plans and progress tracking.

## 🚀 Technical Highlights

### "Nuclear" CORS Fallback Strategy
One of the most challenging aspects of web radio is handling streams with strict CORS policies. This app implements a robust multi-stage fallback strategy:
1.  **Primary Attempt**: Tries to play with `IcecastMetadataPlayer` to fetch rich metadata and enable the visualizer.
2.  **CORS Detection**: Aggressively detects network/CORS errors (`TypeError`, `Failed to fetch`).
3.  **Clean Fallback**: If blocked, it performs a "nuclear" cleanup—destroying the tainted audio element and creating a fresh `new Audio()` instance.
4.  **Result**: Audio **always plays** (audibly), even if the visualizer and metadata must be disabled for that specific stream.

### Architecture
*   **Vanilla JavaScript**: No heavy frameworks, just pure, performant ES6+ JavaScript.
*   **Modular Design**: Code is organized into specialized modules (`AudioManager`, `RadioApi`, `ThemeManager`, `Visualizer`).
*   **Tailwind CSS**: Utility-first styling for a modern, clean UI.
*   **FontAwesome**: High-quality icons for controls and UI elements.

## 🛠️ Installation & Usage

Since this is a client-side web application, it requires no backend setup.

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/dionisrom/radio-player-app-gemini3-antigravity.git
    cd radio-player-app-gemini3-antigravity
    ```

2.  **Run locally**:
    You can open `index.html` directly in your browser, but for the best experience (and to avoid local file security restrictions), use a simple local server:

    *   **Using VS Code**: Install the "Live Server" extension and click "Go Live".
    *   **Using Python**:
        ```bash
        python -m http.server 8000
        ```
    *   **Using Node.js**:
        ```bash
        npx serve .
        ```

3.  **Open in Browser**: Navigate to `http://localhost:8000` (or whatever port your server uses).

## ☁️ Deployment

### Vercel
This project is configured for easy deployment on [Vercel](https://vercel.com). A `vercel.json` file is included to ensure clean URLs and proper routing.

1.  Push your code to a Git repository (GitHub, GitLab, Bitbucket).
2.  Import the project into Vercel.
3.  Vercel will automatically detect the static site configuration.
4.  Deploy!

The `vercel.json` configuration handles:
*   **Clean URLs**: Removes `.html` extensions from URLs.
*   **Trailing Slashes**: Removes trailing slashes for consistency.
*   **PWA Headers**: Proper caching for service worker and manifest files.

## 📱 PWA Installation

This app is a **Progressive Web App (PWA)** and can be installed on your device like a native app!

### Install on Android

1. Open the app in **Chrome** on your Android device
2. Tap the menu (⋮) in the top-right corner
3. Select **"Add to Home screen"** or **"Install app"**
4. Follow the prompts to add the icon to your home screen
5. Launch from your home screen for a fullscreen, app-like experience!

### Install on Desktop

1. Open the app in **Chrome** or **Edge**
2. Look for the install icon (⊕) in the address bar
3. Click **"Install"**
4. The app will open in its own window

### PWA Benefits

*   **🚀 Faster Loading**: Service worker caches assets for instant loading
*   **📴 Offline Support**: App UI works even without internet connection (streams require connection)
*   **🏠 Home Screen Icon**: Custom radio wave icon on your device
*   **📱 Fullscreen Mode**: No browser UI, just the app
*   **🔄 Auto Updates**: Always get the latest version

## 🎧 Media Controls

The app integrates with your device's native media controls for a seamless experience:

### Lock Screen & Notification Controls

*   **📱 Lock Screen**: Control playback without unlocking your phone
*   **🔔 Notifications**: Full media player in your notification shade
*   **⏯️ Controls**: Play, pause, next station, previous station
*   **🎨 Rich Display**: Shows station name, current song, and artwork

### Car Integration

*   **🚗 Bluetooth Audio**: Station metadata appears on your car's display
*   **🎛️ Steering Wheel**: Use steering wheel controls to play/pause and change stations
*   **📻 Car Display**: Album art and song info display on compatible car screens

### Keyboard Shortcuts (Desktop)

*   **Space**: Play / Pause
*   **→**: Next station
*   **←**: Previous station

> **🚀 Android Auto Support**: We're working on full Android Auto integration via a TWA (Trusted Web Activity) wrapper. See `ANDROID_AUTO_PLAN.md` for details.

## 🎮 Controls

*   **Search**: Use the search bar to find stations by name, tag, or country.
*   **Filters**: Quickly filter by genre (Classical, Jazz, Pop, Rock, etc.).
*   **Visualizer**: Click the wave icon to toggle visualizer modes.
*   **Themes**: Click the palette icon to customize the look and feel.
*   **Favorites**: Click the heart icon on any station to add it to your library.

## 🤝 Credits

*   **Radio Station Data**: [Radio Browser API](https://www.radio-browser.info/)
*   **Metadata Library**: [icecast-metadata-player](https://github.com/eshaz/icecast-metadata-player)

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
