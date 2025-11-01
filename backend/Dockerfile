FROM node:20-alpine
WORKDIR /app

# CORRECCIÓN: Le decimos que copie desde la subcarpeta 'backend' del contexto.
COPY backend/package*.json ./

RUN npm install

# CORRECCIÓN: Copiamos todo el contenido de la subcarpeta 'backend'.
COPY backend/ .

EXPOSE 3001
CMD ["node", "server.js"]