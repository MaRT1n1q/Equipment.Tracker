# ── Стадия 1: сборка ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Сначала зависимости (кешируются отдельно)
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Исходники
COPY . .

# WEB_ONLY=1 исключает electron плагин из vite
# VITE_API_BASE_URL задаётся при сборке через --build-arg
ARG VITE_API_BASE_URL=https://api.koltakin.pro
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN WEB_ONLY=1 npx tsc --noEmit && WEB_ONLY=1 npx vite build

# ── Стадия 2: продакшн образ ──────────────────────────────────────────────────
FROM nginx:1.28-alpine

# Копируем собранный SPA
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx конфиг для SPA (fallback → index.html) + reverse proxy на backend
COPY nginx.conf /etc/nginx/templates/default.conf.template

# envsubst подставит $BACKEND_UPSTREAM при старте контейнера.
# По умолчанию проксируем на backend:9090 (имя сервиса в docker-compose).
ENV BACKEND_UPSTREAM=http://backend:9090

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost/index.html || exit 1
