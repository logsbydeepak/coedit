FROM node:20

RUN apt-get update
RUN apt-get install -y curl unzip git make build-essential python3

RUN useradd --create-home --user-group coedit
USER coedit

RUN curl -sS https://webi.sh/bun | sh

WORKDIR /home/coedit/terminal-server
COPY ./terminal-server/package.json .
COPY ./terminal-server/tsconfig.json .
COPY ./terminal-server/src/ src/

SHELL ["/bin/bash", "-c", "-l"]
RUN bun install
RUN bun run build

