# ---- Etapa 1: Build ----
FROM node:20-alpine AS builder
WORKDIR /app

# --- ¡LA SOLUCIÓN! ---
# Sobrescribimos el NODE_ENV solo para esta etapa de build.
# Le decimos a npm que instale TODO, incluyendo devDependencies.
ENV NODE_ENV=development

# Copia los package.json de la carpeta frontend
COPY frontend/package.json frontend/package-lock.json ./

# Instala TODAS las dependencias (gracias al NODE_ENV=development)
RUN npm install

# Copia el resto del código del frontend
COPY frontend/ .

# El build de Vite (npm run build) sigue creando un output de producción
# independientemente del NODE_ENV que usamos para instalar paquetes.
RUN npm run build


# ---- Etapa 2: Servidor de Producción ----
FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80