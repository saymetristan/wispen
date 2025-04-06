FROM node:18-alpine as builder

WORKDIR /app

# Copiar archivos de configuración
COPY package*.json tsconfig.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Generar cliente de Prisma y construir aplicación
RUN npm run db:generate
RUN npm run build

# Imagen de producción
FROM node:18-alpine

WORKDIR /app

# Copiar archivos generados y dependencias
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/.railway ./.railway

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=3000

# Exponer puerto
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["npm", "start"] 