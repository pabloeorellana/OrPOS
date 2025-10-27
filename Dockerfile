# ---- Etapa 1: Build ----
# Usamos una imagen de Node.js completa para tener herramientas de build
FROM node:18-alpine AS builder

# Establecemos el directorio de trabajo general
WORKDIR /app

# Primero, copiamos SOLO los archivos de gestión de paquetes para aprovechar el caché de Docker.
# Especificamos que vienen de la carpeta 'frontend'.
COPY frontend/package.json frontend/package-lock.json ./frontend/

# Cambiamos al directorio del frontend para ejecutar los comandos de npm
WORKDIR /app/frontend

# Instalamos las dependencias
RUN npm install

# Regresamos al directorio raíz del app
WORKDIR /app

# Ahora copiamos TODO el código fuente
COPY . .

# Volvemos a la carpeta del frontend para ejecutar el build
WORKDIR /app/frontend

# Creamos el build de producción. Vite usará .env.production si existe.
RUN npm run build


# ---- Etapa 2: Servidor de Producción ----
# Usamos una imagen de Nginx súper ligera
FROM nginx:alpine

# Copiamos la configuración personalizada de Nginx al contenedor.
# Esta configuración es clave para que React Router funcione.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiamos los archivos estáticos construidos desde la etapa 'builder'
# La ruta de origen ahora debe incluir la carpeta 'frontend'.
COPY --from=builder /app/frontend/dist /usr/share/nginx/html


# Exponemos el puerto 80, que es el que Nginx escucha
EXPOSE 80

# Comando para iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]