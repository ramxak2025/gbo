# Project Notes

## Server Info
- Production server path: `~/gbo` (on server `root@qvqipcruly`)
- NO `main` or `master` branch — work happens directly on feature branches
- Deploy: `cd ~/gbo && npm run build` then restart server
- DB migrations apply automatically via `initDB()` on server start
- DATABASE_URL is set via .env (not committed)

## Stack
- Frontend: React + Vite + Tailwind CSS v4
- Backend: Express + PostgreSQL (Neon/Supabase compatible)
- PWA with manual service worker, iOS safe area support via CSS custom properties (--sat, --sab, 100dvh)

## Roles
superadmin, trainer, club_owner, club_admin, organizer, parent, student
