# Usa una imagen oficial de Nginx, ligera y estable
FROM nginx:stable-alpine

# Elimina la configuración por defecto de Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia tu archivo de configuración personalizado
# Este archivo DEBE existir en la misma carpeta que este Dockerfile
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia el contenido de tu carpeta 'dist' pre-construida
# Docker buscará una carpeta 'frontend/dist' dentro del contexto de construcción (la raíz del repo)
COPY frontend/dist /usr/share/nginx/html

# Expone el puerto 80 que es el que Nginx escucha
EXPOSE 80

# Comando para iniciar Nginx en primer plano (requerido por Docker)
CMD ["nginx", "-g", "daemon off;"]