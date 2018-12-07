FROM node:8.12-slim
RUN mkdir /app
WORKDIR /app
RUN ls -lah
RUN apt-get update 
RUN apt-get install -y build-essential
RUN apt-get install -y python
COPY ./src/package.json ./
RUN npm install
COPY ./src/config ./
COPY ./src/models ./
COPY ./src/mqtt ./
COPY ./src/public ./
COPY ./src/routes ./
COPY ./src/app.js ./
RUN ls -lah
EXPOSE 3000
CMD npm start
