FROM node:12-slim
RUN mkdir -p /app/node_modules && chown -R node:node /app
WORKDIR /app
COPY ./src/package.json ./
USER node
RUN npm install
COPY --chown=node:node ./src ./
CMD npm start
