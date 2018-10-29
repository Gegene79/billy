FROM node:8.12-slim
RUN mkdir /app
WORKDIR /app
RUN ls -lah
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD npm start