# PRD — SIM Salaf Al-Maliki (Madrasah Management SPA)

## Problem / Goal
Existing Google-AI-Studio applet (Vite + React 19 + TypeScript, Firebase Google auth, Google Sheets integration, localStorage data store) for a Salaf pesantren/madrasah. It has 3 role-based dashboards: Admin, Pengurus, Wali Santri.

The user requested a **premium cinematic 3D visual upgrade** WITHOUT breaking any existing functionality (database/localStorage, login logic, dashboard functions, Google Sheets sync, data structures).

## Architecture
- Frontend only. Vite dev server on port 3000, made persistent through supervisor `frontend` program via `/app/frontend/package.json` proxy (`cd /app && exec yarn dev`).
- Data persisted in browser localStorage; seed data in `/app/src/data.ts`.
- Three.js added (`three`, `@types/three`) for the WebGL cinematic intro. `react-is` re-added (recharts peer dep).

## Implemented (2026-06)
- **CinematicIntro.tsx**: real scroll-scrubbed WebGL opening — library scene as 3D textured plane with camera dolly, volumetric golden light shafts, floating dust particles, vignette + film grain, cinematic sway. Always-visible premium glass/metallic **GET STARTED** button skips to login. WebGL fallback to static image.
- **DoorTransition.tsx**: luxurious 3D sliding-door reveal (two panels part with rotateY + center light burst) played on successful login for all 3 roles.
- **Dashboard reveal**: `.anim-dashboard-enter` CSS (fade + translateY + scale + blur→sharp) wraps each dashboard so it materializes as the doors open.
- Wired into `App.tsx` (intro view now uses CinematicIntro; `showDoors` triggered on each successful login; dashboards wrapped + door overlay). Existing login logic, handlers, dashboards untouched.

## Existing functionality (unchanged, must keep working)
- 3-role login, Admin/Pengurus/Wali dashboards, Option Panel control center, absensi santri/guru, nadzhom, nilai, syahriyah, uang saku, kurikulum, jadwal, kalender, izin mengajar, Google Sheets sync, daily auto-reset.

## Backlog / Next
- QR-code attendance, fingerprint simulation (deferred by user).
- Deploy to Vercel/Netlify (deferred).

## Iteration 2 (2026-06) — 3 enhancements (all tested 100%, 0 console errors)
- **Ambient intro audio** (`src/lib/ambientAudio.ts`): soft synthesized Web Audio harmony that fades in on the cinematic intro (starts on first user gesture per autoplay policy), gentle breathing swell, fades out on GET STARTED. Mute toggle button in intro (`data-testid='intro-mute-btn'`).
- **3D charts (Admin dashboard)** (`src/components/Chart3D.tsx` -> `Donut3D`): the two attendance pie charts replaced with perspective-tilted, extruded (box-shadow depth), light-sweep-animated 3D donuts with floating center % + legend. Area/trend chart got a `.chart-3d-grid` animated perspective floor grid.
- **Staggered dashboard build**: after the login doors open, sidebar slides in (`.build-sidebar`), header drops in (`.build-header`), then main sections rise one-by-one (`.build-sequence` nth-child delays). Admin wrapper switched to `.anim-dashboard-fade` so the internal build is visible; Pengurus/Wali keep `.anim-dashboard-enter`. Respects prefers-reduced-motion.
