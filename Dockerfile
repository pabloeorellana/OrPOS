# ---- Imagen base: solo Nginx ----
FROM nginx:alpine

# Configuración de Nginx personalizada
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Archivos estáticos preconstruidos (ya generados localmente)
COPY frontend/dist /usr/share/nginx/html

# Puerto expuesto (informativo)
EXPOSE 80