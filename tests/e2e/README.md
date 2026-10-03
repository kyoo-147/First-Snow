# Snow browser E2E

The critical release flow uses a real Next.js server and PostgreSQL database. Apply migrations and seed lessons before running it:

```bash
npm run db:migrate
npm run db:seed
npm run test:e2e
```

Set `E2E_BASE_URL` to test an already-running deployment. Without it, Playwright starts the local dev server on port 3000. The suite intentionally creates a unique guardian account and child profile for each run.
