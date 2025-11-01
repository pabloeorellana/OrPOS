# ---- Etapa 1: Build ----
FROM node:20-alpine AS builder
WORKDIR /project
COPY . .
WORKDIR /project/frontend
RUN npm install
RUN npm run build

# ---- Etapa 2: Servidor de Producción ----
FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /project/frontend/dist /usr/share/nginx/html
EXPOSE 80