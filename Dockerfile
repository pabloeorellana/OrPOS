# ---- Etapa 1: Build ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
WORKDIR /app/frontend
RUN npm run build

# ---- Etapa 2: Servidor de Producción ----
FROM nginx:stable-alpine

# Copiamos la configuración de Nginx.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# ELIMINAMOS la carpeta HTML por defecto de Nginx, para evitar conflictos.
RUN rm -rf /usr/share/nginx/html/*

# Copiamos el CONTENIDO de nuestro 'dist' a la carpeta HTML.
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]