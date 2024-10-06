FROM caddy:2.7.6-builder
RUN xcaddy build
RUN apk add --no-cache make

