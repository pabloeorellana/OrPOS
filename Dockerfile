# ---- Etapa 1: Build ----
FROM node:20-alpine AS builder

WORKDIR /app

# Desde el contexto raíz, copia solo los archivos de manifiesto de la subcarpeta 'frontend'
COPY frontend/package*.json ./

# Instala las dependencias del frontend
RUN npm install

# Copia TODO el contenido de la carpeta 'frontend' local a la carpeta '/app' en el contenedor
COPY frontend/ .

# Vite necesita el 'index.html' en la raíz de su proyecto de build. Está aquí ahora.
ARG VITE_API_URL
ENV NODE_ENV=development # Asegura que se instalen las devDependencies
RUN npm run build


# ---- Etapa 2: Servidor de Producción ----
FROM nginx:stable-alpine

# Copia tu nginx.conf personalizado
# El contexto es la raíz, así que buscamos 'nginx.conf' ahí
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Limpia la carpeta por defecto de Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copia los archivos construidos desde la etapa anterior.
# El 'build' creó la carpeta '/app/dist', así que esta ruta es correcta.
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
# Deja que la imagen use su CMD por defecto.