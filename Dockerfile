# Etapa 1: Build
FROM node:18-alpine AS build
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

# Etapa 2: Nginx
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

LABEL "traefik.enable"="true"
LABEL "traefik.http.routers.orpos.rule"="Host(`orpos.site`)"
LABEL "traefik.http.routers.orpos.entrypoints"="web"
LABEL "traefik.http.services.orpos.loadbalancer.server.port"="80"
