FROM ubuntu:22.04
RUN apt update
RUN apt -y install bash binutils git xz-utils wget curl sudo unzip build-essential

RUN curl -fsSL https://bun.sh/install | bash
RUN curl -sSf https://sh.rustup.rs | bash -s -- -y
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

RUN rm -rf /etc/sudoers.d/$NEW_USER
RUN deluser $NEW_USER sudo

USER $NEW_USER
WORKDIR /home/coedit/workspace/

