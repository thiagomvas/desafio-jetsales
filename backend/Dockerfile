FROM node:20-alpine

WORKDIR /app

COPY . .
RUN npm install

COPY . .

RUN npx prisma generate

RUN npm run build

CMD ["node", "dist/src/server.js"]
