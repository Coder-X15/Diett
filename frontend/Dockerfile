FROM node:24.14.0-alpine as dev

WORKDIR /app

COPY package*.json .

RUN npm install

COPY . .

ENV REACT_APP_API_URL=http://localhost:8080

RUN chown -R node:node /app

USER node

EXPOSE 3000

CMD ["npm", "start"]