FROM node:20-alpine AS builder

WORKDIR /app

ARG FRONTEND_APP=admin

COPY . .

# Для локального docker compose можно переиспользовать уже установленные workspace-зависимости.
# В чистом окружении (например, Dokploy/CI) node_modules в контексте не будет, и тогда выполняется npm ci.
RUN if [ -d node_modules ]; then \
      echo "Using workspace node_modules from build context"; \
    else \
      npm config set fetch-retries 5 \
      && npm config set fetch-retry-factor 2 \
      && npm config set fetch-retry-mintimeout 20000 \
      && npm config set fetch-retry-maxtimeout 120000 \
      && npm ci --prefer-offline --no-audit --no-fund; \
    fi

# Билдим нужный frontend-вариант
RUN case "$FRONTEND_APP" in \
    admin|site) npm run build:$FRONTEND_APP ;; \
    *) echo "Unsupported FRONTEND_APP: $FRONTEND_APP" >&2; exit 1 ;; \
    esac

# Production stage
FROM nginx:alpine

ARG FRONTEND_APP=admin

# Копируем собранное приложение
COPY --from=builder /app/dist /usr/share/nginx/html

# Копируем конфигурацию nginx под конкретный frontend-вариант
COPY nginx/admin.conf /etc/nginx/admin.conf
COPY nginx/site.conf /etc/nginx/site.conf
RUN case "$FRONTEND_APP" in \
    site) cp /etc/nginx/site.conf /etc/nginx/conf.d/default.conf ;; \
    admin) cp /etc/nginx/admin.conf /etc/nginx/conf.d/default.conf ;; \
    *) echo "Unsupported FRONTEND_APP: $FRONTEND_APP" >&2; exit 1 ;; \
    esac \
    && rm /etc/nginx/admin.conf /etc/nginx/site.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
