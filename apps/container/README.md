# @coedit/container

### Generate certificate

This will generate a wildcard certificate for `*.mydomain.com` 1 depth only.
✅ abc.mydomain.com
❌ abc.def.mydomain.com

```bash
certbot certonly --manual -d '*.mydomain.com'
```

### Container

Run them from the root of the project.

Development container:

```bash
# build the image
make dev
# start the container
make dev-start
# stop or remove the container
make dev-stop
```

Production container:

```bash
# build the image
make prod
```
