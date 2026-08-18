FROM node:24-alpine@sha256:d32cdf619f63fe0471182d08996dd516c6275bb5fd31ae06e55a570bd9e1ad43

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
