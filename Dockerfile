FROM node:24-alpine@sha256:705813e7dd798f8a69a2b0d8fb958ecafe5fc3b2a52139ae03a0379246301c4a

# Create app directories
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json package-lock.json tsconfig.json eslint.config.mjs Readme.md /usr/src/app/
COPY src/ /usr/src/app/src/
COPY scripts/ /usr/src/app/scripts/
COPY other/ /usr/src/app/other/
RUN mkdir -p docs/schema && npm install --exclude=optional && npm run build && npm prune --omit=dev && rm -rf ./src

# Start the App
EXPOSE 8080
CMD [ "npm", "start" ]
