FROM node:20-alpine AS builder

WORKDIR /app

# Копируем только package.json для кеширования зависимостей
COPY package*.json ./
RUN npm ci --no-audit --no-fund

# Копируем остальные файлы (node_modules уже установлены)
COPY . .

# Аргумент для API URL (будет передан из docker-compose)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Билдим приложение
RUN npm run build

# Production stage
FROM nginx:alpine

# Копируем собранное приложение
COPY --from=builder /app/dist /usr/share/nginx/html

# Копируем конфигурацию nginx
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
