# Imagen base
FROM nginx:stable-alpine

# Copiar el build local (ya generado con npm run build)
COPY ./frontend/dist /usr/share/nginx/html

# Reemplazar configuración por la personalizada (SPA React/Vite)
RUN rm /etc/nginx/conf.d/default.conf
COPY ./frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto HTTP (para Traefik)
EXPOSE 80
