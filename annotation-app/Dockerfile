### STAGE 1: Build ###
FROM node:14-alpine as builder
COPY package.json .
RUN npm i && mkdir /app && cp -R ./node_modules ./app
WORKDIR /app
COPY . .
#ARG BUILD_ENV=production
#RUN npm run build -- -c $BUILD_ENV
RUN npm run build

### STAGE 2: Setup ###
FROM nginx:1.13.5-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/docker-entrypoint.sh /
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 5000
ENTRYPOINT ["/docker-entrypoint.sh"]
