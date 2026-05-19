# Deployment Guide

## Target Environments
- `local`
- `preview`
- `production`

## Runtime Topology
- `apps/web`: primary web application
- `apps/worker`: async jobs and retries
- PostgreSQL Docker on the server: private relational database and future `pgvector` memory retrieval
- Auth: implemented or integrated separately from PostgreSQL
- Google Cloud: STT, TTS, Gemini, embeddings
- Twilio and Zalo: alert channels
- Cloudflare R2: reserved for future private assets if needed

## Operational Constraints
- Do not log raw secrets or sensitive child data.
- Keep media storage policy aligned with privacy ADRs.
- Ensure at least one viable alert channel path exists before production use.
- Do not expose PostgreSQL publicly.
- Local development must connect to server PostgreSQL through SSH tunnel/VPN/private networking; do not run a separate local database by default.
- Automate backups and test restore before collecting pilot data.
