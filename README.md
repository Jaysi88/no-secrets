# No Secrets

**Your coding agent will paste a live key into `.env` and then `git add .`.**

An [Agent Skill](https://agentskills.io/specification) that hunts secret-shaped tokens and committable env files. It reports **names only**. Never the value.

```bash
npx skills add Jaysi88/no-secrets
```

Then say **no secrets**, **scan for keys**, or **did we commit .env**.

## Try it

```bash
git clone https://github.com/Jaysi88/no-secrets.git
cd no-secrets
node skills/no-secrets/scripts/scan.mjs examples/leaky
```

You should get exit `1` and findings like `ghp_…` (truncated) and `.env`.

## License

[MIT](./LICENSE) © Jay Si Thu Tun ([Jaysi88](https://github.com/Jaysi88))
