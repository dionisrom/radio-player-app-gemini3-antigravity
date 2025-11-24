# 📻 Modern Web Radio Player

A beautiful, feature-rich web-based radio player built with modern web technologies. This application provides a premium listening experience with real-time audio visualization, extensive station search, and robust playback handling for various stream types.

![Radio Player Screenshot](https://via.placeholder.com/800x450?text=Radio+Player+Preview)

## ✨ Key Features

*   **🎨 Dynamic Theming System**: Choose from multiple handcrafted themes (Dark, Midnight, Ocean, Forest, Sunset, etc.) with real-time switching.
*   **🎵 Advanced Audio Visualizer**: Real-time frequency analysis visualization that reacts to the music.
*   **🌍 Global Station Search**: Powered by the [Radio Browser API](https://www.radio-browser.info/), giving access to over 30,000 stations worldwide.
*   **❤️ Favorites System**: Save your favorite stations for quick access. Import/Export functionality allows you to backup and share your list.
*   **🛡️ Robust CORS Handling**: Custom-built audio engine that gracefully handles Cross-Origin Resource Sharing (CORS) restrictions, ensuring streams play even when metadata is blocked.
*   **📱 Responsive Design**: Fully responsive interface that looks great on desktops, tablets, and mobile devices.
*   **🎧 Metadata Support**: Displays song titles and artist information (via Icecast metadata or Media Session API) when available.

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
