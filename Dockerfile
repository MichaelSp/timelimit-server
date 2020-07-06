FROM node:14-alpine

# Create app directories
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY . /usr/src/app/
RUN npm install --no-optional && npm run build && npm prune --production && rm -rf ./src

# Start the App
EXPOSE 8080
CMD [ "npm", "start" ]
