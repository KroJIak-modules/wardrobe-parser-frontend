# wardrobe-parser-frontend

Internal frontend module for Wardrobe Parser Platform.

## Local development (without Docker)

1. Create local env file:

```bash
cp .env.local.example .env.local
```

2. Set API target in `.env.local` (backend URL, for example `http://localhost:10510`).

3. Run dev server:

```bash
npm install
npm run dev
```

Frontend always calls relative `/api/*`.
In dev mode, Vite proxies `/api` to `VITE_LOCAL_API_URL`.

## Docker runtime

In Docker, frontend also calls `/api/*`.
Nginx in the container proxies `/api` to the internal `backend:8000`.

`frontend/.env.local` is ignored by Docker build (`frontend/.dockerignore`) and should not affect docker-compose runtime.
