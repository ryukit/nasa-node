FROM node:lts-alpine

WORKDIR /app

COPY package*.json ./

COPY client/package*.json client/
RUN npm run install-client --omit=dev

COPY server/package*.json server/
RUN npm run install-server --omit=dev

COPY client/ client/
RUN npm run build_client

COPY server/ server/

USER node

CMD [ "npm", "run", "start_server" ]

EXPOSE 8000