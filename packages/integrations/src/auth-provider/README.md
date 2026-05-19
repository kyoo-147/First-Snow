# Auth Provider Integrations

Auth provider client factories and integration-boundary helpers belong here.

Supabase is not the active implementation target. If an external auth provider is selected later, keep provider-specific code behind this boundary and preserve the auth identity -> parent profile -> child-owned records chain.
