# ---- Etapa 1: Build ----
# Usamos una imagen de Node.js para instalar dependencias y construir la app
FROM node:18-alpine AS builder

# Establecemos el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos package.json y package-lock.json
COPY package*.json ./

# Instalamos las dependencias
RUN npm install

# Copiamos el resto de los archivos del frontend
COPY . .

# Creamos el build de producción.
# Vite usará automáticamente el archivo .env.production si existe.
RUN npm run build


# ---- Etapa 2: Servidor de Producción ----
# Usamos una imagen de Nginx súper ligera para servir los archivos estáticos
FROM nginx:alpine

# Copiamos los archivos construidos desde la etapa 'builder' a la carpeta
# donde Nginx sirve los archivos por defecto.
COPY --from=builder /app/dist /usr/share/nginx/html

# Le decimos a Nginx que, para cualquier ruta (ej: /dashboard, /pos),
# si no encuentra un archivo, devuelva el index.html principal.
# Esto es CRUCIAL para que React Router funcione.
COPY --from=builder /app/dist/index.html /usr/share/nginx/html/index.html
RUN sed -i '/index.html/a \        try_files $uri $uri/ /index.html;' /etc/nginx/conf.d/default.conf

# Exponemos el puerto 80, que es el que Nginx escucha por defecto
EXPOSE 80

# Comando para iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]