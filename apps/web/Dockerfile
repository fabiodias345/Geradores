FROM node:22-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY tsconfig.json next.config.ts next-env.d.ts ./
COPY app ./app
COPY lib ./lib
COPY public ./public

EXPOSE 3000
CMD ["npm", "run", "dev"]
