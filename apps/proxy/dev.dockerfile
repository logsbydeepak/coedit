FROM caddy:2.10.0-builder
RUN xcaddy build
RUN apk add --no-cache make

