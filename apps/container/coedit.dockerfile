FROM ubuntu:20.04

RUN apt-get update
RUN apt-get install -y curl unzip git

RUN useradd --create-home --user-group coedit
USER coedit

RUN curl -sS https://webi.sh/bun | sh
RUN curl -sS https://webi.sh/node | sh

USER root
COPY docker-entrypoint.sh /usr/local/bin
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
USER coedit

WORKDIR /home/coedit/.coedit
COPY ./terminal-server/package.json ./
COPY ./terminal-server/build build/
SHELL ["/bin/bash", "-c", "-l"]
RUN bun install --ignore-scripts
COPY ./node-pty /home/coedit/.coedit/node_modules/node-pty/build/Release

WORKDIR /home/coedit/app
RUN bun x create-next-app@latest . --use-bun --ts --tailwind --eslint  --app --src-dir --import-alias "@/*"
RUN bun x next telemetry disable

EXPOSE 3001
EXPOSE 3000

ENTRYPOINT [ "/usr/local/bin/docker-entrypoint.sh" ]
CMD [ "bun", "run", "--cwd", "../.coedit", "start" ]

