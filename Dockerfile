FROM nginx:stable-alpine

# Copia el build local ya generado (frontend/dist)
COPY ./frontend/dist /usr/share/nginx/html

# Configuración personalizada para SPA (React/Vite)
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Etiquetas Traefik
LABEL traefik.enable="true"
LABEL traefik.http.routers.orpos.rule="Host(`orpos.site`) || HostRegexp(`{subdomain:[a-z0-9-]+}.orpos.site`)"
LABEL traefik.http.routers.orpos.entrypoints="websecure"
LABEL traefik.http.routers.orpos.tls="true"
LABEL traefik.http.routers.orpos.tls.certresolver="letsencrypt"
LABEL traefik.http.services.orpos.loadbalancer.server.port="80"

EXPOSE 80
