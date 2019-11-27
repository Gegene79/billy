FROM node:12-slim
RUN mkdir -p /app/node_modules && chown -R node:node /app
WORKDIR /app
COPY --chown=node:node ./src/package.json ./
COPY --chown=node:node ./petitbilly.env ./.env
USER node
RUN npm install
COPY --chown=node:node ./src ./
CMD npm start
