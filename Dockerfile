# Imagen base
FROM nginx:stable-alpine

# Copiar el build generado por Vite (frontend/dist)
COPY ./frontend/dist /usr/share/nginx/html

# Reemplazar la configuración por una personalizada
RUN rm /etc/nginx/conf.d/default.conf
COPY ./frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto HTTP
EXPOSE 80
