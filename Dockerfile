FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build \
  && apk add --no-cache nginx \
  && mkdir -p /usr/share/nginx/html \
  && cp -r dist/* /usr/share/nginx/html/ \
  && cp nginx/nginx.conf /etc/nginx/http.d/default.conf \
  && rm -rf /app \
  && mkdir -p /run/nginx

WORKDIR /

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
