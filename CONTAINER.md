# Container

### Development

```bash
# build the image
make dev
# start the container
make dev-start
# stop or remove the container
make dev-stop
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
