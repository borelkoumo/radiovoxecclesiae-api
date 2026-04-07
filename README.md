# rve-api — Radio Vox Ecclesiae Backend

REST API backend for the [RadioVox Ecclesiae](https://radiovoxecclesiae.kodekonnect.com/) mobile/web app.

**Stack:** Express v5 · TypeScript · Firebase Firestore · Render

---

## API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/health` | Health check |
| `GET` | `/api/v1/app-config` | Station config + full weekly schedule (single request) |

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
# Fill in FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
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

Run once to populate Firestore with the initial station data and weekly schedule:

```bash
npm run seed
```

The seed script is idempotent — safe to re-run.

---

## Testing

```bash
npm test               # Run all tests (43 tests)
npm run test:coverage  # Run with coverage report (target: 80%+)
npm run typecheck      # TypeScript type check
```

---

## Deployment on Render

1. Push this repo to GitHub
2. In [Render dashboard](https://render.com): New → Web Service → connect repo
3. Render will detect `render.yaml` automatically
4. Set the four env vars in Render dashboard (Settings → Environment):
   - `CORS_ORIGIN` — your Expo web domain
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY` — paste the full key including newlines

> **Cold start note**: Render free tier spins down after 15 min inactivity.
> First request after spin-down takes ~3-5s. Consider pinging `/api/v1/health`
> every 5 minutes with [UptimeRobot](https://uptimerobot.com) (free) to keep it warm.

---

## Architecture

```
Request
  └─► Express app (helmet, CORS, pino logger)
        └─► /api/v1/app-config
              └─► AppConfigController
                    └─► AppConfigService
                          └─► Promise.all([
                                StationRepository  → Firestore stations/rve-radio
                                ScheduleRepository → Firestore schedules/* (7 docs, getAll)
                              ])
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
├── middleware/       # CORS, logger, error handler, auth stub
├── routes/v1/       # health + app-config routes
├── controllers/     # thin HTTP handlers
├── services/        # business logic (parallel data aggregation)
├── repositories/    # Firestore access (station + schedule)
├── schemas/         # Zod validation schemas
├── types/           # TypeScript interfaces
├── utils/           # AppError, response envelope helpers
└── scripts/seed.ts  # one-time data migration
```
