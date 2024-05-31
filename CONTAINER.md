# Container

### Development

```bash
# build the image
make dev
# start the container and attach the terminal, by default the working directory is /home/coedit/workspace
make dev-start
# stop or remove the container
make dev-stop

# change the directory to source code which is mounted to the container
cd /root/coedit

# because node_modules is not being mounted
bun install

# start container server
# from root of the project
bun run container:dev
 # or from container package
cd /root/coedit/apps/container
bun run dev
```

### Production

Deploy to ECS

It requires env of [@coedit/container](/apps/container)

```bash
# build the image
make prod
```

ECS config

- cluster name `coedit-builder`
- launch type `FARGATE`
- task definition name `coedit`

- PORT and security group

  - 80
  - 443

- Environment variables [@coedit/container](/apps/container)

- Volumes

  - Configure at deployment
  - mount `/home/coedit/workspace`

- execute command `./coedit-container-process`
