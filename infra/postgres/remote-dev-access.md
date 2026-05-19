# Remote Development Access

## Decision
Local development uses the PostgreSQL database hosted on the server. Developers do not run a default local PostgreSQL instance.

## Required Access Pattern
Use one of these private access paths:
- SSH tunnel from the developer machine to the server.
- VPN/private network into the server network.
- A bastion host pattern if the deployment grows beyond one server.

Do not expose PostgreSQL publicly on the internet.

## Recommended SSH Tunnel Shape
```powershell
ssh -N -L 15432:127.0.0.1:5432 <server-user>@<server-host>
```

Then local app env can use:
```bash
DATABASE_URL=postgresql://agentkid_app:<password>@127.0.0.1:15432/agentkid
DATABASE_DIRECT_URL=postgresql://agentkid_app:<password>@127.0.0.1:15432/agentkid
DATABASE_SSL_MODE=disable
DATABASE_REMOTE_HOST=<server-host>
DATABASE_REMOTE_PORT=5432
DATABASE_SSH_TUNNEL=ssh -N -L 15432:127.0.0.1:5432 <server-user>@<server-host>
```

## Rules
- Use non-production seed/test records while the product is still under development.
- Never store raw audio/video in the database.
- Avoid writing real child data before backup/restore has been tested.
- Do not share database passwords in chat, docs, screenshots, or commits.
- Prefer separate credentials for development access if supported by the server setup.

## Operational Notes
- If the database runs only inside Docker network, bind the tunnel to a server-side local port or use `docker compose exec`/bastion forwarding as appropriate.
- Keep the default application connection path server-side. Browser code must never receive database credentials.

## Applying Migrations
After the tunnel is open and `DATABASE_DIRECT_URL` is set, run from the repo root:

```powershell
powershell -ExecutionPolicy Bypass -File ./scripts/data/apply-database-migrations.ps1 -RequireDirectUrl
```

This command first runs Drizzle's migration consistency check, then applies pending migrations. It intentionally fails fast when `DATABASE_DIRECT_URL` is missing.
