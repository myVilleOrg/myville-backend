FROM node:alpine
ADD package.json /app/
WORKDIR /app
RUN npm install
ADD . /app/
VOLUME /app/config
EXPOSE 3000
CMD node app.js
