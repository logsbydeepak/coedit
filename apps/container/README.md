# @coedit/container

Run this inside [dev container](/dev.dockerfile)

> Caution: Do not forget to build [@replit/rust](/packages/ruspty/README.md) before running or building this package.

### Generate certificate

This will generate a wildcard certificate for `*.mydomain.com` 1 depth only.

✅ abc.mydomain.com
❌ abc.def.mydomain.com

```bash
certbot certonly --manual -d '*.mydomain.com'
```
