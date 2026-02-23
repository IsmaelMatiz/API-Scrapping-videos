FROM node:24.11.1

WORKDIR /usr/src/app

#Install app dependencies
COPY package*.json ./
RUN npm install
RUN npx playwright install
RUN npx playwright install-deps

# Bundle app source
COPY  . .
EXPOSE 8080
CMD ["npm", "start"]
