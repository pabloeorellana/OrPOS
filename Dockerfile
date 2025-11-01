FROM nginx:stable-alpine

# Copiar solo los archivos del build local
COPY ./dist /usr/share/nginx/html

# Configuración de Nginx personalizada (SPA y gzip)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

LABEL "traefik.enable"="true"
LABEL "traefik.http.routers.orpos.rule"="Host(`orpos.site`) || HostRegexp(`{subdomain:[a-z0-9-]+}.orpos.site`)"
LABEL "traefik.http.routers.orpos.entrypoints"="websecure"
LABEL "traefik.http.routers.orpos.tls"="true"
LABEL "traefik.http.routers.orpos.tls.certresolver"="letsencrypt"
LABEL "traefik.http.services.orpos.loadbalancer.server.port"="80"