FROM nginx:stable-alpine

# Copiar el build real desde frontend/dist
COPY ./frontend/dist /usr/share/nginx/html

# Reemplazar la configuración por defecto
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Etiquetas Traefik para HTTPS
LABEL traefik.enable="true"
LABEL traefik.http.routers.orpos.rule="Host(`orpos.site`) || HostRegexp(`{subdomain:[a-z0-9-]+}.orpos.site`)"
LABEL traefik.http.routers.orpos.entrypoints="websecure"
LABEL traefik.http.routers.orpos.tls="true"
LABEL traefik.http.routers.orpos.tls.certresolver="letsencrypt"
LABEL traefik.http.services.orpos.loadbalancer.server.port="80"

EXPOSE 80
