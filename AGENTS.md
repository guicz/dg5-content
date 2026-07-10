# DG5 Content Intelligence Project Instructions

## Context

Internal DG5 MVP for client knowledge, Brand Brain, editorial planning, assisted content production, creative review, and human approval.

## Scope

- React/Vite frontend.
- Firebase Authentication, Firestore, Storage, Cloud Functions, Pub/Sub scheduler, and security rules.
- OpenAI, Anthropic, and Gemini routing through backend-only secrets.
- Internal DG5 users only in the MVP.

## Non-scope

- Client portal.
- Automatic Meta publishing.
- Automatic artwork generation.
- Billing, self-service, and package sales.

## Success Criteria

- Core data persists in Firestore, never only in browser storage.
- Files use Cloud Storage with client-scoped paths.
- AI calls are authenticated, server-side, and logged in `aiLogs`.
- Internal scores are not exposed to operators.
- Text precedes artwork in the workflow.
- Operator approval precedes final admin approval.

## Commands

```powershell
pnpm dev
pnpm emulators
pnpm test
pnpm --filter dg5-content-intelligence-functions test
pnpm build
```

## Security and Production

- Never place provider keys in Vite environment variables.
- Keep provider keys in Firebase Secret Manager.
- Do not deploy or change production resources without explicit user approval.
- Keep `patricia@dg5.com.br` as bootstrap owner until a dedicated admin bootstrap process exists.

## Rollback and Observability

- Firebase deployments must preserve the previous release for rollback.
- All AI decisions must write `provider`, `model`, `reason`, `mode`, `durationMs`, and task metadata to `aiLogs`.
- Scheduled Meta checks must use deterministic notification IDs to avoid duplicates.

## Documentation Status

- README reflects the current local and production full-stack state.
- Production Hosting, Google Auth, Firestore, Storage, Functions, Secret Manager, and Scheduler are deployed.
- Real AI provider keys and transactional email delivery remain deployment tasks.
