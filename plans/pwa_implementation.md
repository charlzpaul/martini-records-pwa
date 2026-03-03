# PWA Implementation Plan

This plan outlines the steps to convert the Martini Records web app into a full Progressive Web App (PWA) that supports offline functionality and home screen installation.

## 1. Prerequisites
- `martini.svg` is available in the `public/` directory and will serve as the primary icon.

## 2. Dependencies
- Install `vite-plugin-pwa` as a dev dependency.

## 3. Configuration (`vite.config.ts`)
Update the Vite configuration to include the `VitePWA` plugin with the following settings:
- **`registerType`**: `autoUpdate` (ensures silent updates as requested).
- **`manifest`**:
    - `name`: Martini Records
    - `short_name`: Martini
    - `description`: Offline-first custom record generator
    - `theme_color`: #ffffff
    - `background_color`: #ffffff
    - `display`: standalone
    - `icons`:
        - Use `martini.svg` with `purpose: 'any maskable'`.
- **`workbox`**:
    - `globPatterns`: `['**/*.{js,css,html,ico,png,svg,jpg,jpeg}']` (cache all essential assets).

## 4. Service Worker Registration (`src/main.tsx`)
- Import `registerSW` from `virtual:pwa-register`.
- Call `registerSW()` to enable the service worker.

## 5. Verification
- Run `npm run build` to ensure the service worker and manifest are generated in the `dist/` folder.
- Use `npm run preview` to test offline behavior in the browser.

## 6. Offline Sync Robustness
- Confirm that `src/features/sync/hooks/useDataSync.ts` handles fetch failures gracefully when the network is unavailable (already confirmed to have try-catch blocks).
