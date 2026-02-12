# Reverse proxy (same-origin)

Фронт и API под одним доменом. Nginx в одном контейнере с фронтом:
- раздаёт статику SPA;
- проксирует `/api/` и `/health` на backend.

См. `nginx.conf`.
