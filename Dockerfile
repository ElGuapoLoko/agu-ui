FROM node:20-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npx ng build --configuration production

FROM nginxinc/nginx-unprivileged:1.27-alpine

COPY docker/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/agu-tasks/browser /usr/share/nginx/html

USER nginx

ENV API_UPSTREAM=http://agu-api:8080

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
