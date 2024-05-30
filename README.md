# coedit

![IDE](/IDE.png)

IDE on the web

Requirements:

- `docker` for container
- `rust` for building pty
- `bun` for running and managing the project
- `make` for managing the container makefile

Setup project in order

- [templates](/others/templates/README.md)
- [container server](/apps/container/README.md)
- [build container](/CONTAINER.md)
- [server](/apps/server/README.md)
- [frontend](/apps/frontend/README.md)

> **Note:** Every package has `.env.example` file. Fill it before running.

### Scripts

- `bun run fix` - run prettier, eslint, and cspell
- `bun run unused` - find unused code
- `bun run tsc` - run typescript compiler
