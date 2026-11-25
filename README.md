# Sonora — music web app

A lightweight, responsive music app built with plain HTML, CSS and JavaScript. No Electron.

## Features
- Search tracks on SoundCloud (requires your own SoundCloud Client ID).
- Play tracks using the official SoundCloud embedded player.
- Create and manage playlists; add tracks from search results.
- Save liked tracks and edit a local profile.
- Responsive dark interface.

## Run locally
Because browser requests and embedded playback work best from an HTTP origin, serve this folder with any static server. For example:

```bash
python -m http.server 8000
```

Then open http://localhost:8000.

## Connect SoundCloud
1. Register/sign in at https://developers.soundcloud.com/ and create an application if API access is available for your account.
2. Copy the application's **Client ID**.
3. Open `config.js` and set `soundcloudClientId` to that value.
4. Reload the app.

```js
window.SONORA_CONFIG = {
  soundcloudClientId: "YOUR_SOUNDCLOUD_CLIENT_ID"
};
```

Do not put a Client Secret in frontend code. Anything in `config.js` is visible to visitors. If SoundCloud does not issue a Client ID to your application, use a small backend service to keep credentials private and proxy supported API requests. SoundCloud API availability and authentication requirements can change; check the current developer documentation.

## Notes
- Profile, playlists and liked tracks are stored in this browser's localStorage. They are not synced between devices.
- Audio is streamed from SoundCloud; this app does not download or re-host music.
- The repository starts as a static front-end, so no database or user authentication server is included yet.
