# ---- Etapa 1: Build ----
# Usamos una versión de Node.js compatible
FROM node:20-alpine AS builder

# Establece un directorio de trabajo general.
WORKDIR /app

# Acepta el argumento de build desde Docker Compose / Coolify
ARG VITE_API_URL

# Establece la variable de entorno DENTRO del contenedor de build.
ENV VITE_API_URL=$VITE_API_URL
# Le dice a NPM que instale TODAS las dependencias (incluyendo devDependencies).
ENV NODE_ENV=development

# Copia solo los archivos de manifiesto del frontend primero, para caché.
COPY frontend/package*.json ./

# Instala todas las dependencias.
RUN npm install

# Copia todo el código fuente del frontend.
COPY frontend/ .

# Ejecuta el build. Vite usará la variable VITE_API_URL que hemos establecido.
RUN npm run build


# ---- Etapa 2: Servidor de Producción ----
FROM nginx:stable-alpine

# Copia el archivo de configuración personalizado de Nginx.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Limpia el contenido por defecto de Nginx.
RUN rm -rf /usr/share/nginx/html/*

# Copia el build resultante de la etapa anterior.
COPY --from=builder /app/dist /usr/share/nginx/html

# Expone el puerto 80
EXPOSE 80

# Dejamos que la imagen de Nginx use su CMD por defecto, es más robusto.