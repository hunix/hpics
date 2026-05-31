FROM node:20-alpine

# Baileys needs a few native deps for crypto
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm ci

COPY . .
RUN npm run build

# Prune dev deps after build
RUN npm prune --omit=dev

CMD ["node", "dist/index.js"]
