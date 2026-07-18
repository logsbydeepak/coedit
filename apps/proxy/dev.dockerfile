FROM caddy:2.11.4-builder
RUN xcaddy build
RUN apk add --no-cache make
