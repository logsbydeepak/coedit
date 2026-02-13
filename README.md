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
# clear cache if having issues
bun pm cache rm
rm -rf .bun.lockb
```

> **Note:** Every package has `.env.example` file. Fill it before running.

### Scripts

- `bun run fix` - run prettier, eslint, and cspell
- `bun run unused` - find unused code
- `bun run tsc` - run typescript compiler

### MinIO

start minio server

```bash
make start minio

docker run -d \
  -p 9000:9000 \
  -p 9001:9001 \
  --name minio \
  -e MINIO_ROOT_USER=admin \
  -e MINIO_ROOT_PASSWORD=password \
  -v ./temp/minio:/data \
  minio/minio server /data --console-address ":9001"
```
