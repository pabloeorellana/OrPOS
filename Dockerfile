# Imagen base
FROM nginx:stable-alpine

# Copiar el build del frontend al directorio de Nginx
COPY ./frontend/dist /usr/share/nginx/html

# Reemplazar la configuración por la tuya (en raíz)
RUN rm /etc/nginx/conf.d/default.conf
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto HTTP
EXPOSE 80
