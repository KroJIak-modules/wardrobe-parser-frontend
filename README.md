# wardrobe-parser-frontend

Internal web module for Wardrobe Parser Platform.

## Apps

- `admin` — admin panel frontend.
- `site` — public website frontend.
- `src/shared/*` — shared UI, API helpers and data contracts.

## Local development (without Docker)

1. Create local env file:

```bash
cp .env.local.example .env.local
```

2. Set API target in `.env.local` (backend URL, for example `http://localhost:10510`).

3. Run one of the app entrypoints:

```bash
npm install
npm run dev:admin
npm run dev:site
```

Both apps call relative `/api/*` when needed.
In dev mode, Vite proxies `/api` to `VITE_LOCAL_API_URL`.

## Docker runtime

In Docker, both frontend containers call `/api/*` relative to their own origin.
Nginx in each container proxies `/api` to the internal `backend:8000`.

`frontend/.env.local` is ignored by Docker build (`frontend/.dockerignore`) and should not affect docker-compose runtime.
