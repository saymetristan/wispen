# Usa una imagen base de Node.js
FROM node:20

# Instala ffmpeg
RUN apt-get update && apt-get install -y ffmpeg

# Establece el directorio de trabajo en el contenedor
WORKDIR /app

# Copia el archivo package.json y package-lock.json
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia el resto del código de la aplicación
COPY . .

# Expone el puerto en el que la aplicación se ejecutará
EXPOSE 3000

# Define el comando para ejecutar la aplicación
CMD ["npm", "start"]
