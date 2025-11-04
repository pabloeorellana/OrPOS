# ---- Etapa 1: Build ----
FROM node:20-alpine AS builder

# Establece el directorio de trabajo
WORKDIR /app

# Acepta la variable de entorno VITE_API_URL como un argumento de build.
# Coolify la pasará automáticamente desde tus Environment Variables.
ARG VITE_API_URL
# Establece la variable de entorno para el proceso de build.
ENV VITE_API_URL=$VITE_API_URL
# Forza el entorno a "development" SOLO para el npm install.
ENV NODE_ENV=development

# Copia los archivos de manifiesto de la subcarpeta 'frontend'
COPY frontend/package*.json ./

# Instala TODAS las dependencias (devDependencies incluidas)
RUN npm install

# Copia todo el código fuente del frontend a la carpeta actual
COPY frontend/ .

# Ejecuta el build. Vite construirá un output optimizado para producción por defecto.
RUN npm run build


# ---- Etapa 2: Servidor de Producción ----
FROM nginx:stable-alpine

# Copia tu configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Limpia cualquier archivo por defecto para evitar conflictos
RUN rm -rf /usr/share/nginx/html/*

# Copia el build resultante de la etapa anterior a la carpeta de Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
# Dejamos que la imagen de Nginx use su CMD por defecto.