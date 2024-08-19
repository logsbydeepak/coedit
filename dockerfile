FROM ubuntu:22.04 as builder
RUN apt update
RUN apt install -y curl unzip git make build-essential bash

RUN curl -fsSL https://bun.sh/install | bash
RUN curl -sSf https://sh.rustup.rs | bash -s -- -y

WORKDIR /root/coedit
COPY . .

ENV PATH="/root/.bun/bin:$PATH"

RUN bun install
RUN bun run container:build

FROM ubuntu:22.04 as runner
RUN apt update
RUN apt -y install bash binutils git xz-utils unzip wget curl sudo

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
RUN chown -R $NEW_USER:$NEW_USER /home/coedit/.config

COPY --from=builder /root/coedit/apps/runner/dist/ /root/coedit/

RUN rm -rf /etc/sudoers.d/$NEW_USER
RUN deluser $NEW_USER sudo

USER $NEW_USER
WORKDIR /home/coedit/workspace/

USER root

