# Sonora

Sonora is a Windows desktop music community built with Tauri 2 + Vite + JavaScript (not Electron).

## Features in this MVP
- Liquid Glass dark interface, Manrope typography, personal wallpaper and accent.
- Supabase email/password accounts and profiles (nickname, unique username, avatar, banner, bio).
- Community music wave with user tracks, likes, reposts and comments.
- Audio uploads and SoundCloud search/streaming.
- Tauri Windows NSIS EXE and MSI packaging.

## Setup
1. Install Node.js 22 and Rust stable. On Windows install Microsoft C++ Build Tools and WebView2.
2. Run `npm install`.
3. Create a Supabase project and run `supabase/schema.sql` in its SQL Editor.
4. Copy project URL and anon/public key into `config.js`. Add SoundCloud Client ID.
5. Run `npm run tauri:dev` for desktop development or `npm run tauri:build` to build installers.

The Windows EXE installer appears in `src-tauri/target/release/bundle/nsis/`; MSI in `src-tauri/target/release/bundle/msi/`. GitHub Actions can build it after a manual workflow dispatch or push of a version tag (v*); download the Sonora-Windows artifact from the run.

## Backend setup
Supabase is required for real multi-user accounts and cross-device social features. Only the anon/public key belongs in the client. Never expose a Supabase service-role key or SoundCloud client secret. Configure email confirmation, quotas, moderation and storage limits before public release. The included media bucket is public for this MVP; do not use it for private files.
