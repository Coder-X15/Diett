FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

# react-scripts should be defined in your package.json
COPY public ./public
COPY src ./src

# Use the service name for container-to-container communication
ENV REACT_APP_API_URL=http://127.0.0.1:8080

EXPOSE 3000

CMD ["npm", "start"]