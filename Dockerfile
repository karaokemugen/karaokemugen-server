FROM node:22-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        nginx libnginx-mod-http-fancyindex \
        git uuid-runtime \
        curl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

RUN curl -fsSLo /tmp/app-linux.tar.gz https://mugen.karaokes.moe/downloads/dist_linux-x64-8.0.tar.gz && \
    tar xzf /tmp/app-linux.tar.gz -C /tmp && \
    mv /tmp/app-linux/bin/x64/ffmpeg /usr/bin/ffmpeg && \
    chmod +x /usr/bin/ffmpeg && \
    rm -rf /tmp/app-linux*

WORKDIR /srv/kmserver
ENV NODE_ENV=production
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn .yarn
COPY kmexplorer kmexplorer
COPY kmserver-core kmserver-core
RUN npm install -g corepack && yarn install && yarn build:all
COPY docker/entrypoint.sh /usr/local/bin/entrypoint
COPY docker/nginx.conf /etc/nginx/sites-available/default
COPY docker/config.docker.yml config.docker.yml
COPY config.sample.yml app/config.yml
COPY app app
COPY assets assets
COPY util util

ENTRYPOINT ["/usr/local/bin/entrypoint"]
CMD ["yarn", "workspace", "kmserver-core", "qstart"]
