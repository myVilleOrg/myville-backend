FROM node:alpine
VOLUME /app
WORKDIR /app
RUN npm install
EXPOSE 3000
CMD node app.js
