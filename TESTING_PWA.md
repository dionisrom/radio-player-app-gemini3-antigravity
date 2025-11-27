# Testing PWA Installability with Android Studio / Chrome Remote Debugging

The most common reason "Install App" doesn't appear during development is that the browser considers the connection **insecure**. PWA installation requires **HTTPS** or **localhost**.

When you access your computer's IP (e.g., `http://192.168.1.5:3000`) from your phone, Chrome treats it as insecure and disables PWA features.

To fix this, we use **Port Forwarding**.

## Method 1: Physical Android Device (Recommended)

1.  **Enable USB Debugging** on your Android phone (Settings > Developer Options).
2.  **Connect your phone** to your PC via USB.
3.  Open **Chrome** on your PC and go to: `chrome://inspect/#devices`
4.  Check the box **"Enable Port Forwarding"**.
5.  Click **"Configure..."** and add a rule:
    *   **Port**: `3000`
    *   **IP and Port**: `localhost:3000`
6.  Click **Done**.
7.  On your **Android phone**, open Chrome and go to `http://localhost:3000`.
    *   *Note: You must literally type "localhost", not your computer's IP.*
8.  Chrome now treats this as a **Secure Origin**.
9.  You should see the "Install RadioWave" banner or be able to select "Install App" from the Chrome menu.

## Method 2: Android Emulator (Android Studio)

1.  Open **Android Studio**.
2.  Go to **Device Manager** and start a virtual device (e.g., Pixel 4).
3.  Open a terminal on your PC and run:
    ```powershell
    adb reverse tcp:3000 tcp:3000
    ```
    *(This maps the emulator's port 3000 to your PC's port 3000)*
4.  Open **Chrome** inside the Android Emulator.
5.  Navigate to `http://localhost:3000`.
6.  Try to install the app from the menu.

## Debugging "Manifest" Errors

If it still doesn't work:
1.  On your PC, go to `chrome://inspect/#devices`.
2.  Find your connected device/emulator in the list.
3.  Click **"inspect"** under the `http://localhost:3000` tab.
4.  A DevTools window will open for your phone's screen.
5.  Go to the **Application** tab > **Manifest**.
6.  Look for any **Errors** or **Warnings** (e.g., "Manifest does not contain a suitable icon").

## Android Auto Note
To fully test Android Auto, simply "Installing" the PWA via Chrome is often enough for audio playback (via Bluetooth/MediaSession). However, for the app to appear strictly as a native app in the Android Auto launcher, you typically need to package it as a **Trusted Web Activity (TWA)** using a tool like **Bubblewrap** and install the resulting APK.
