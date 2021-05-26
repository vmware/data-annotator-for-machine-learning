# Create image based on the official Node 6 image from the dockerhub
FROM node:12-alpine

COPY package.json .

RUN npm i && mkdir /app && cp -R ./node_modules ./app

WORKDIR /app

COPY . .

# Expose the port the app runs in
EXPOSE 3000

# Serve the app
CMD ["npm", "run", "serve"]
