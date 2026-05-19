# Database Migrations

Repeatable migrations belong here once the implementation moves from docs into executable database assets.

## Current Direction
- Database runs on the server.
- Local development connects to the server database through a secure tunnel/private network.
- Do not assume local PostgreSQL.
- Do not run destructive migrations against shared server data without an explicit backup and restore point.
