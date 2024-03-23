FROM ubuntu:20.04

RUN apt-get update
RUN apt-get install -y curl unzip git make build-essential python3

RUN useradd --create-home --user-group coedit
USER coedit

RUN curl -sS https://webi.sh/bun | sh
RUN curl -sS https://webi.sh/node | sh

USER root
COPY docker-entrypoint.sh /usr/local/bin
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
USER coedit

WORKDIR /home/coedit/.coedit
COPY ./terminal-server/src src/
COPY ./terminal-server/package.json ./
SHELL ["/bin/bash", "-c", "-l"]
RUN bun install

WORKDIR /home/coedit/app
RUN bun x create-next-app@latest . --use-bun --ts --tailwind --eslint  --app --src-dir --import-alias "@/*"
RUN bun x next telemetry disable

EXPOSE 3001
EXPOSE 3000

ENTRYPOINT [ "/usr/local/bin/docker-entrypoint.sh" ]
CMD [ "bun", "run", "--cwd", "../.coedit", "dev" ]
