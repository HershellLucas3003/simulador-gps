FROM node:18-alpine

WORKDIR /app

# Copia arquivos de dependências
COPY package*.json ./

# Instala dependências
RUN npm install

# Copia o código da aplicação
COPY . .

# Expõe a porta do backend
EXPOSE 3000

# Comando para iniciar o servidor
CMD ["node", "server.js"]
