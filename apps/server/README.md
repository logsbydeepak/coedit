# @coedit/server

Run the db migrations in [@coedit/db](/packages/db/README.md) first.

### Development

Copy [wrangler config](example.wrangler.[dev|prod].toml) to `wrangler.dev.toml`

If CONTAINER_MODE is set to aws then the project route will call `aws` resources or if it is set to `mock` then it will just return localhost container data and will expect running [@coedit/container](/packages/container/README.md) inside dev container.

```bash
bun run dev
```

Test cron job in dev `http://localhost:5000/__scheduled`

### Production

Deploy to cloudflare worker

Copy [wrangler config](example.wrangler.[dev|prod].toml) to `wrangler.prod.toml`

```bash
bun run deploy
```

#### Generate JWT_SECRET env

```bash
bun run gen:jwt-secret
```

#### Expose localhost to the internet useful for testing in dev

```bash
cloudflared tunnel --url http://localhost:5000
```
