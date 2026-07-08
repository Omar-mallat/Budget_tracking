# Deploying to DigitalOcean App Platform

This project is a monorepo (`backend/`, `Frontend/`, `mobile/`), so App Platform's
auto-detection won't find anything at the repo root — each component must be
added manually with its own source directory.

## 1. Database

Create a **Managed PostgreSQL** database in DigitalOcean (or use a Dev Database
for testing). Copy its connection string — you'll set it as `DATABASE_URL`
below.

## 2. Backend component (Web Service)

- **Source Directory:** `backend`
- **Build Command:** `npm install` (runs `postinstall` → `prisma generate` automatically)
- **Run Command:** `npm start` (runs `node index.js`)
- **HTTP Port:** App Platform sets `PORT` automatically; the app reads
  `process.env.PORT`, so no change needed.
- **Environment variables:**
  - `DATABASE_URL` — from step 1
  - `JWT_SECRET` — a long random string (do not reuse the local dev placeholder)

### Applying the schema

There are no Prisma migrations checked in yet (the schema was pushed directly
during development). Before the backend can serve traffic, run once against
the production database:

```bash
DATABASE_URL="<production-connection-string>" npx prisma db push
```

Run this from your machine (or as a DigitalOcean **Pre-Deploy Job** component
pointed at `backend` with command `npx prisma db push`). If you want proper
migration history going forward, switch to `prisma migrate dev` locally and
`prisma migrate deploy` in production instead.

## 3. Frontend component (Static Site)

- **Source Directory:** `Frontend`
- **Build Command:** `npm install && npm run build`
- **Output Directory:** `dist`
- **Environment variables:**
  - `VITE_API_URL` — the backend component's public URL (e.g.
    `https://budget-backend-xxxxx.ondigitalocean.app`), set **before** building
    since Vite bakes env vars in at build time.

The frontend falls back to `http://localhost:5000` when `VITE_API_URL` is
unset, so local `npm run dev` still works without extra setup.

## 4. Domain

Once both components are live, point your domain's DNS at the app (App
Platform provides a CNAME target) from the DigitalOcean Networking → Domains
page.

## Notes / follow-ups

- `backend`'s CORS is currently wide open (`cors()` with no options). Fine to
  ship, but worth restricting to the frontend's origin once the domain is final.
- `mobile/` (Expo) is not part of this web deployment — it ships through
  Expo/App Store/Play Store separately, and should point at the same backend
  URL via its own env config.
