# FORGE Auth + Polling Fix

Scope: isolated branch only. No production write.

## Root cause
Legacy `forgeRunner(payload)` sends the Supabase anonymous key in the Authorization header. Current Edge Functions require the authenticated owner's access token, so `forge-auth` succeeds through the modern session path while legacy `forge-runner` polling returns HTTP 403.

## Fix candidate
`forge-runtime-fix.js` replaces the runner client with a session-aware implementation and adaptive polling.

Polling policy:
- active mission: 30 seconds
- idle: 120 seconds
- hidden/background tab: paused
- manual actions: immediate refresh
- backend scheduler remains every minute

## Acceptance
1. Owner session valid.
2. `forge-auth` returns HTTP 200.
3. `forge-runner {action: status}` returns HTTP 200 with owner session.
4. No recurring 403 from the legacy anonymous polling path.
5. Idle polling interval is 120 seconds.
6. Background polling is paused.
7. `main` remains unchanged.
8. `production_write=false`.
