---
name: no-secrets
description: Hunt API keys, tokens, and committable .env files in AI-written code. Never print secret values. Use before commit or push; after generating auth/config; or when the user says no secrets, scan for keys, rotate, or did we commit .env.
license: MIT
metadata:
  author: Jaysi88
  version: "1.0.0"
  repo: https://github.com/Jaysi88/no-secrets
---

# No secrets

Agents leak keys because the prompt had one, the docs had one, or they invented `sk-live-demo`. This skill stops that from landing in git.

## Rules

1. **Never print a secret value.** Name + truncated prefix (8 chars) + path.
2. Real findings → tell the user to **rotate**, then gitignore, then rewrite history if it was pushed.
3. `.env.example` with empty values is fine. `.env` is not.
4. `process.env.FOO` is fine. `FOO=sk-live-…` in source is not.

## Procedure

```bash
node skills/no-secrets/scripts/scan.mjs .
```

Treat every `SECRET` as blocking. Fix, re-scan, then commit.

## Do not

- Echo the rest of a `ghp_` / `sk-` / `AKIA` / `xai-` token “for confirmation”
- Commit `.env` “just this once”
