# coedit

IDE on the web 🌐

![IDE](/IDE.png)

Requirements:

- `bun` for running and managing the project
- `docker` for container
- `rust` for building pty
- `make` for managing the container makefile

### Installation

```bash
bun run install
```

> **Note:** Every package has `.env.example` file. Fill it before running.

### Scripts

- `bun run fix` - run prettier, eslint, and cspell
- `bun run unused` - find unused code
- `bun run tsc` - run typescript compiler
