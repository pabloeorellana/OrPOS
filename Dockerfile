# ---- Etapa 1: Build ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# ---- Etapa 2: Servidor de Producción ----
FROM nginx:alpine

# Copiamos nuestro archivo de configuración personalizado.
# Es lo único que necesitamos sobreescribir.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiamos los archivos estáticos construidos.
COPY --from=builder /app/dist /usr/share/nginx/html

# NO definimos un CMD. Dejaremos que la imagen de Nginx use su CMD por defecto,
# que es más robusto y compatible con sus propios scripts de inicio.
# CMD ["nginx", "-g", "daemon off;"] <--- ESTA LÍNEA SE ELIMINA.

# EXPOSE 80 sigue siendo una buena práctica, pero es más declarativo que funcional
EXPOSE 80