# rve-api — Radio Vox Ecclesiae Backend

REST API backend for the [RadioVox Ecclesiae](https://radiovoxecclesiae.kodekonnect.com/) mobile/web app.

**Stack:** Express v5 · TypeScript · Firebase Firestore · Render

---

## API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/health` | Health check |
| `GET` | `/api/v1/app-config` | Station config + full weekly schedule (single request) |
| `GET` | `/api/v1/prayers` | List approved prayers (cursor pagination) |
| `POST` | `/api/v1/prayers` | Submit a new prayer |
| `GET` | `/images/*` | Static image files served from `public/` |

### Response envelope

```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": "message", "code": "OPTIONAL_CODE" }
```

### `GET /api/v1/app-config`

Returns everything the app needs at startup in one request:

```json
{
  "success": true,
  "data": {
    "station": {
      "id": "rve-radio",
      "name": "Radio Vox Ecclesiae",
      "streamUrl": "https://...",
      "frequencies": [...],
      "contacts": { ... },
      "missions": [...]
    },
    "schedule": {
      "lundi":    { "dayIndex": 1, "items": [...] },
      "mardi":    { "dayIndex": 2, "items": [...] },
      "mercredi": { "dayIndex": 3, "items": [...] },
      "jeudi":    { "dayIndex": 4, "items": [...] },
      "vendredi": { "dayIndex": 5, "items": [...] },
      "samedi":   { "dayIndex": 6, "items": [...] },
      "dimanche": { "dayIndex": 0, "items": [...] }
    },
    "meta": { "version": 1, "updatedAt": "2026-04-07T10:00:00.000Z" }
  }
}
```

Each schedule item has the shape:

```json
{
  "time": "08:00",
  "endTime": "08:20",
  "code": "RVE6",
  "title": "RVE Infos matin",
  "theme": "Direct",
  "icon": "newspaper-outline",
  "artwork": null
}
```

`artwork` is a URL string when an image is configured, `null` otherwise.

### `GET /api/v1/prayers`

Query parameters:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | integer (1–100) | `20` | Number of prayers to return |
| `cursor` | string | — | Pagination cursor from previous response |

Response:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "abc123",
        "text": "Seigneur, nous te confions...",
        "author": "Marie-Claire",
        "isAnonymous": false,
        "createdAt": "2026-04-07T10:00:00.000Z",
        "status": "approved"
      }
    ],
    "nextCursor": "abc123"
  }
}
```

### `POST /api/v1/prayers`

Rate limited to 20 requests/minute per IP.

Request body:

```json
{
  "text": "Seigneur, bénis notre famille. Amen.",
  "author": "Jean-Pierre",
  "isAnonymous": false
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `text` | string | yes | 1–500 characters |
| `author` | string | no | max 100 characters |
| `isAnonymous` | boolean | no | defaults to `false` |

---

## Local setup

### 1. Clone and install

```bash
git clone <repo>
cd rve-api
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Fill in FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, FIREBASE_DATABASE_ID
```

### 3. Firebase credentials

In the [Firebase console](https://console.firebase.google.com):
1. Project settings → Service accounts → Generate new private key
2. Copy `project_id`, `client_email`, `private_key` into `.env`

### 4. Start the dev server

```bash
npm run dev
# Server starts on http://localhost:3000
# curl http://localhost:3000/api/v1/health
```

### 5. Seed Firestore

Populate Firestore with initial data. The script is idempotent — safe to re-run.

```bash
# Seed everything (station config + schedule + prayers)
npm run seed

# Seed a specific target only
npm run seed -- station    # station config only
npm run seed -- schedule   # weekly schedule only
npm run seed -- prayers    # sample prayers only
```

Schedule data lives in `data/schedule/*.json` (one file per day). Edit those files to update the program, then re-run `npm run seed -- schedule`.

---

## Testing

```bash
npm test               # Run all tests
npm run test:coverage  # Run with coverage report (target: 80%+)
npm run typecheck      # TypeScript type check
```

---

## Deployment on Render

1. Push this repo to GitHub
2. In [Render dashboard](https://render.com): New → Web Service → connect repo
3. Render will detect `render.yaml` automatically
4. Set the env vars in Render dashboard (Settings → Environment):
   - `CORS_ORIGIN` — your Expo web domain (comma-separated)
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY` — paste the full key including newlines
   - `FIREBASE_DATABASE_ID` — Firestore database ID (e.g. `radiovoxecclesiae-nosql`)
   - `API_BASE_URL` — public URL of this service (e.g. `https://radiovoxecclesiae-api.onrender.com`), used to build absolute URLs for static assets in seed data

> **Cold start note**: Render free tier spins down after 15 min inactivity.
> First request after spin-down takes ~3-5s. Consider pinging `/api/v1/health`
> every 5 minutes with [UptimeRobot](https://uptimerobot.com) (free) to keep it warm.

---

## Architecture

```
Request
  └─► Express app (helmet, CORS, rate-limit, pino logger)
        ├─► /images/*          → static files from public/
        ├─► /api/v1/app-config
        │     └─► AppConfigController
        │           └─► AppConfigService
        │                 └─► Promise.all([
        │                       StationRepository  → Firestore stations/rve-radio
        │                       ScheduleRepository → Firestore schedules/* (7 docs)
        │                     ])
        └─► /api/v1/prayers
              └─► PrayerController
                    └─► PrayerRepository → Firestore prayers/*
```

### Adding Firebase Auth (future)

1. In `src/middleware/auth.ts`, replace the stub body with `admin.auth().verifyIdToken(token)`
2. Routes already have `optionalAuth` middleware — swap for `requireAuth` on protected routes
3. No other files need to change

---

## Project structure

```
src/
├── config/          # env (Zod), Firebase Admin init
├── middleware/      # CORS, rate-limit, logger, error handler, auth stub
├── routes/v1/       # health, app-config, prayers routes
├── controllers/     # thin HTTP handlers
├── services/        # business logic (parallel data aggregation)
├── repositories/    # Firestore access (station, schedule, prayers)
├── schemas/         # Zod validation schemas
├── types/           # TypeScript interfaces
├── utils/           # AppError, response envelope helpers
└── scripts/seed.ts  # Firestore seed script

data/
├── station.json     # Station config (supports {{API_BASE_URL}} placeholder)
├── prayers.json     # Sample prayers for seeding
└── schedule/        # Weekly program (one file per day, edited manually)
    ├── lundi.json
    ├── mardi.json
    ├── mercredi.json
    ├── jeudi.json
    ├── vendredi.json
    ├── samedi.json
    └── dimanche.json

public/              # Static files served at /images/*
└── images/
    └── *.jpeg/png   # Place image assets here
```
