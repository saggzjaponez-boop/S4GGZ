FROM node:18-alpine

WORKDIR /usr/src/app

# install deps
COPY package.json package-lock.json* ./
RUN npm install --production --no-audit --no-fund

# copy app
COPY . .

# runtime env defaults
ENV PORT=3000
ENV DATA_DIR=/data

EXPOSE 3000

CMD ["node", "server.js"]
