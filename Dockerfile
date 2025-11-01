# ---- Etapa 1: Build ----
# Usamos una versión de Node.js compatible
FROM node:20-alpine AS builder

# Establecemos un directorio de trabajo general
WORKDIR /project

# Copiamos todo el monorepo (frontend y backend) al contenedor
COPY . .

# ¡LA CLAVE! Nos movemos al directorio específico del frontend
WORKDIR /project/frontend

# Ahora, ejecutamos los comandos desde la perspectiva del frontend
# NPM encontrará el package.json en el directorio actual
RUN npm install

# Vite encontrará el index.html en el directorio actual
RUN npm run build


# ---- Etapa 2: Servidor de Producción ----
FROM nginx:stable-alpine

# Copia tu configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiamos el build desde la ubicación correcta en la etapa anterior.
# La carpeta 'dist' ahora está en '/project/frontend/dist'.
COPY --from=builder /project/frontend/dist /usr/share/nginx/html


EXPOSE 80
# Dejamos que Nginx use su CMD por defecto.