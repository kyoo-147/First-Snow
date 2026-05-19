# Coding Standards

## Naming
- folders: `lowercase-kebab-case`
- files: `kebab-case` unless framework conventions require otherwise
- types and interfaces: `PascalCase`
- functions and variables: `camelCase`
- SQL objects: `snake_case`
- env vars: `UPPER_SNAKE_CASE`

## File Organization
- Domain-first modules over screen-first sprawl
- Shared types in `packages/domain`
- Provider code in `packages/integrations`
- DB artifacts in `packages/database`
- Prompt logic in `packages/prompts`
- Cross-cutting runtime helpers in `packages/config` and `packages/observability`

## Operational Rules
- Validate inputs at route boundaries
- Normalize provider errors
- Enforce parent ownership explicitly
- Avoid leaking sensitive child data or secrets in logs
- Respect no raw media persistence unless a later ADR changes it
