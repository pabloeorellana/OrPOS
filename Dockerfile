# ---- Etapa 1: Build ----
FROM node:18-alpine AS builder
WORKDIR /app

# Copia los package.json de la carpeta frontend
COPY frontend/package.json frontend/package-lock.json ./

# Instala las dependencias del frontend
RUN npm install

# Copia todo el código del proyecto
COPY . .

# Ejecuta el build DENTRO de la carpeta frontend
RUN cd frontend && npm run build


# ---- Etapa 2: Servidor de Producción ----
FROM nginx:alpine

# Copia el build resultante de la etapa anterior a la carpeta de Nginx
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Copia el archivo de configuración de Nginx para React Router
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]