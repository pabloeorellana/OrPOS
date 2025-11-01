# ---- Etapa 1: Build ----
# Usamos una versión de Node compatible con tu Vite
FROM node:20-alpine AS builder

# Establecemos el directorio de trabajo una sola vez
WORKDIR /app

# Copiamos solo los archivos de manifiesto desde la subcarpeta 'frontend'
# a la raíz del directorio de trabajo '/app'.
COPY frontend/package*.json ./

# Instalamos las dependencias. 'npm' encontrará el 'package.json' en /app.
RUN npm install

# Copiamos todo el código fuente del frontend al directorio de trabajo
# Ahora todo tu código de frontend vive en /app
COPY frontend/ .

# Ejecutamos el build. Vite encontrará todo lo que necesita en /app.
# El resultado del build se creará en /app/dist por defecto.
RUN npm run build


# ---- Etapa 2: Servidor de Producción ----
FROM nginx:stable-alpine

# Copiamos nuestro archivo de configuración personalizado.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Limpiamos el contenido por defecto de Nginx para evitar conflictos.
RUN rm -rf /usr/share/nginx/html/*

# Copiamos los archivos estáticos construidos desde la etapa 'builder'.
# La ruta /app/dist ahora es correcta y existe.
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
# Dejamos que la imagen Nginx use su CMD por defecto.