# ---- Etapa 1: Build ----
# CORRECCIÓN 1: Usamos una versión de Node compatible con tu Vite
FROM node:20-alpine AS builder

# Establecemos el directorio de trabajo
WORKDIR /app

# CORRECCIÓN 2: Simplificamos la copia.
# Copiamos solo el contenido de la carpeta 'frontend' al directorio de trabajo.
# Ahora, la raíz del build (/app) es efectivamente tu carpeta 'frontend'.
COPY frontend/ .

# Instalamos las dependencias. 'npm' encontrará el 'package.json' en /app.
RUN npm install

# Ejecutamos el build. Vite encontrará el 'index.html' en /app.
# El resultado se creará en /app/dist.
RUN npm run build


# ---- Etapa 2: Servidor de Producción (Sin cambios) ----
FROM nginx:alpine

# Copiamos nuestro archivo de configuración personalizado de Nginx.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiamos los archivos estáticos construidos desde la etapa 'builder'.
# Esta ruta ahora es correcta y simple.
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]