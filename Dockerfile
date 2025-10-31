# Etapa 1: Build
FROM node:18-alpine AS build
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

# Etapa 2: Servidor Nginx
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Configuración de Nginx opcional (gzip, SPA, etc.)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Labels para Traefik (Coolify detecta automáticamente)
LABEL "traefik.enable"="true"
LABEL "traefik.http.routers.orpos.rule"="Host(`orpos.site`) || HostRegexp(`{subdomain:[a-z0-9-]+}.orpos.site`)"
LABEL "traefik.http.routers.orpos.entrypoints"="websecure"
LABEL "traefik.http.routers.orpos.tls"="true"
LABEL "traefik.http.routers.orpos.tls.certresolver"="letsencrypt"
LABEL "traefik.http.services.orpos.loadbalancer.server.port"="80"
