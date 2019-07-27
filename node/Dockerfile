FROM node:12-slim
RUN mkdir /app
WORKDIR /app
COPY ./src/package.json ./
RUN npm install
COPY ./src ./
RUN ls -lah
EXPOSE 3000
CMD npm start
