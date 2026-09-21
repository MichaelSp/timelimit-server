FROM node:24-alpine@sha256:ebfe2f90462722a7a4de65e91990e97fe0d401c70e0e762c5b53302f905ec1c1

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
