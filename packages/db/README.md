# @coedit/db

### Scripts

Copy `.env.local.example` to `.env.local` and set the environment variables.

Here the .env.local is only used for migration and will not be carried over if it is imported inside other packages they will have have their own .env file for connection.

```bash
# generate migration
bun run db:gen
# run migration
bun run db:push
# generate and run migration
bun run db:gen:push
```
