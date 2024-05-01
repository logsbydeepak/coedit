FROM node:20 as builder
RUN apt-get update
RUN apt-get install -y curl unzip git make build-essential python3

RUN useradd --create-home --user-group coedit
USER coedit

RUN curl -sS https://webi.sh/bun | sh

WORKDIR /home/coedit/workspace
COPY --chown=coedit:coedit . .

SHELL ["/bin/bash", "-c", "-l"]
RUN bun install
RUN bun run --cwd apps/container build

FROM node:20 as runner
RUN apt update
RUN apt -y install bash binutils git xz-utils wget curl sudo

ENV NEW_USER=coedit
RUN adduser $NEW_USER
RUN usermod -aG sudo $NEW_USER
RUN echo "coedit ALL=(ALL:ALL) NOPASSWD: ALL" | sudo tee /etc/sudoers.d/$NEW_USER
USER $NEW_USER

RUN wget --output-document=/dev/stdout https://nixos.org/nix/install | sh -s -- --no-daemon
RUN . ~/.nix-profile/etc/profile.d/nix.sh

ENV PATH="/home/${NEW_USER}/.nix-profile/bin:$PATH"

RUN wget --quiet --output-document=/dev/stdout https://get.jetpack.io/devbox   | bash -s -- -f
RUN chown -R "${NEW_USER}:${NEW_USER}" /usr/local/bin/devbox

USER root
RUN curl -sS https://starship.rs/install.sh | sh -s -- --yes
RUN echo "eval '$(starship init bash)'" >> /home/coedit/.bashrc
COPY starship.toml /home/coedit/.config/

COPY --from=builder /home/coedit/workspace/apps/container/dist/ /root/coedit/

USER $NEW_USER
WORKDIR /home/coedit/workspace/

USER root
