# Music Player

A lightweight, elegant, and functional music player built with HTML5, CSS3, and Vanilla JavaScript.

## 🚀 Features
* **Play/Pause**: Seamlessly control playback with a single toggle button.
* **Skip Navigation**: Easily jump to the next or previous track in your playlist.
* **Dynamic UI**: Real-time updates for song titles, artists, cover art, and the "Next Up" preview.
* **Responsive Design**: Clean layout that works on both desktop and mobile screens.

## 🛠 Setup & Installation

1. **Clone/Download**: Ensure `index.html`, `style.css`, and `index.js` are in the same directory.
2. **Add Music**: Place your `.mp3` files in the project root folder.
3. **Configure Playlist**: Open `index.js` and update the `songs` array with your metadata:
   ```javascript
   const songs = [
       {
           title: "Song Name",
           artist: "Artist Name",
           src: "filename.mp3",
           cover: "image-url.jpg"
       }
   ];
