# @coedit/server

Fro development copy [wrangler config](example.wrangler.[dev|prod].toml) to `wrangler.dev.toml`
For deployment copy [wrangler config](example.wrangler.[dev|prod].toml) to `wrangler.prod.toml`

### Generate JWT_SECRET

Required in [wrangler config](example.wrangler.[dev|prod].toml)

```bash
openssl rand -base64 32
```

### Expose localhost to the internet

```bash
cloudflared tunnel --url http://localhost:5000
```

### Test cron job in dev

`http://localhost:5000/__scheduled`
