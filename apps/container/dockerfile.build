FROM ubuntu:20.04

RUN apt-get update
RUN apt-get install -y curl unzip git make build-essential python3

RUN useradd --create-home --user-group coedit
USER coedit

RUN curl -sS https://webi.sh/bun | sh
RUN curl -sS https://webi.sh/node | sh

WORKDIR /home/coedit
RUN git clone https://github.com/microsoft/node-pty.git

WORKDIR /home/coedit/node-pty
SHELL ["/bin/bash", "-c", "-l"]
RUN bun install
