# @coedit/container

> **Note:** build [@replit/rust](/packages/ruspty/README.md) before running this.

### Development

It is meant to be used inside [dev container](./dev.dockerfile) for development.

```bash
bun run dev
```

### Production

Deploy with [dockerfile](./dockerfile)

```bash
bun run build
```

Run this inside [dev container](./dev.dockerfile)

#### Generate certificate

Install [certbot](https://certbot.eff.org/instructions)

```bash
certbot certonly --manual -d '*.mydomain.com'
```

This will generate a wildcard certificate for `*.mydomain.com` 1 depth only.

✅ abc.mydomain.com

❌ abc.def.mydomain.com
