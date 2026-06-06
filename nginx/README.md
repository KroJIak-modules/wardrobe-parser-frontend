# Reverse proxy (same-origin per app)

Каждый frontend-контейнер работает same-origin со своим API proxy. Nginx в контейнере:
- раздаёт статику SPA;
- проксирует `/api/` и `/health` на backend.

См. `nginx.conf`.
