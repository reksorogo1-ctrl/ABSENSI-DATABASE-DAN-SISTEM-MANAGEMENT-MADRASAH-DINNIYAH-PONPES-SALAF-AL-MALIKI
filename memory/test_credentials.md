# Test Credentials — SIM Salaf Al-Maliki (localStorage app, no backend)

App runs as a Vite + React 19 SPA on port 3000 (served via supervisor `frontend` -> `/app/frontend` proxy -> `cd /app && yarn dev`).

## Login (managed in-app via data.ts / Option Panel)
- **Admin**: username `admin` / password `salaf123`
- **Pengurus**: name `Ust. H. Ahmad Fauzi Ridwan` / password `pengurus123`
  - other pengurus: `Ust. Muhammad Ilyas Al-Hafidz`, `Ustazah Fina Nikmatul Kamelia`, `Ust. Zainal Abidin S.Pd.I` (all password `pengurus123`)
- **Wali Santri**: name `ZIDNIL AQILA` / password `1001` (password default = NIS without the `S-` prefix; NIS is `S-1001`)
  - use the demo name chips on the Wali tab to auto-fill valid santri
- **Option Panel (control center) password**: `admin123`

## Notes
- No server-side auth; credentials are validated client-side against seeded data in `/app/src/data.ts`.
- Google login button uses Firebase popup (may not work in headless without OAuth config) — manual login is the primary path.
