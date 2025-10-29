# ---- Etapa 1: Build ----
FROM node:18-alpine AS builder

# Establecer el directorio de trabajo una vez
WORKDIR /app

# Copiar solo los package.json para aprovechar el caché
COPY frontend/package.json frontend/package-lock.json ./

# Instalar dependencias del frontend. NPM se ejecutará en /app donde está el package.json
RUN npm install

# Copiar el resto del código del frontend a una subcarpeta
COPY frontend/ ./frontend/

# Ejecutar el build. Vite sabrá qué hacer porque package.json está aquí.
# El output irá a /app/dist
RUN npm run build


# ---- Etapa 2: Servidor de Producción ----
FROM nginx:alpine

# Copiar el build resultante de /app/dist a la carpeta de Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar nuestro archivo de configuración personalizado de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]