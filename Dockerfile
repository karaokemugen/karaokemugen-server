FROM node:22-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        nginx libnginx-mod-http-fancyindex \
        git uuid-runtime \
        curl ca-certificates wget && \
    rm -rf /var/lib/apt/lists/*

# Arial font for hardsubs
RUN sed -i 's/Components: main/Components: main contrib/g' /etc/apt/sources.list.d/debian.sources && \
    apt-get update && \
    apt-get install -y --no-install-recommends \
        nginx libnginx-mod-http-fancyindex \
        git uuid-runtime \
        curl ca-certificates \
        ttf-mscorefonts-installer && \
    rm -rf /var/lib/apt/lists/*

# Precompiled binaries
RUN curl -fsSLo /tmp/app-linux.tar.gz https://mugen.karaokes.moe/downloads/dist_linux-x64-8.0.tar.gz && \
    tar xzf /tmp/app-linux.tar.gz -C /tmp && \
    mv /tmp/app-linux/bin/x64/ffmpeg /usr/bin/ffmpeg && \
    chmod +x /usr/bin/ffmpeg && \
    rm -rf /tmp/app-linux*

WORKDIR /srv/kmserver
ENV NODE_ENV=production
RUN npm install -g corepack
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn .yarn
COPY kmexplorer/package.json kmexplorer/package.json
COPY kmserver-core/package.json kmserver-core/package.json
RUN yarn install
COPY docker/entrypoint.sh /usr/local/bin/entrypoint
COPY docker/nginx.conf /etc/nginx/sites-available/default
COPY docker/config.docker.yml config.docker.yml
COPY config.sample.yml app/config.yml
COPY app app
COPY assets assets
COPY util util
COPY kmexplorer kmexplorer
COPY kmserver-core kmserver-core
RUN yarn build:all

ENTRYPOINT ["/usr/local/bin/entrypoint"]
CMD ["yarn", "workspace", "kmserver-core", "qstart"]
