#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative, resolve, sep } from "node:path";

const SKIP = new Set([".git", "node_modules", "dist", "build", ".next", "coverage", "vendor"]);
const args = process.argv.slice(2);
const jsonMode = args.includes("--json");
const ROOT = resolve(args.find((a) => !a.startsWith("--")) ?? ".");
const findings = [];

const PATTERNS = [
  { kind: "github", re: /\bghp_[A-Za-z0-9]{20,}\b/g },
  { kind: "openai", re: /\bsk-(?:live|proj|svcacct)-[A-Za-z0-9_-]{10,}\b/g },
  { kind: "openai", re: /\bsk-[A-Za-z0-9]{20,}\b/g },
  { kind: "aws", re: /\bAKIA[0-9A-Z]{16}\b/g },
  { kind: "xai", re: /\bxai-[A-Za-z0-9]{20,}\b/g },
  { kind: "slack", re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g },
  { kind: "google", re: /\bAIza[0-9A-Za-z_-]{20,}\b/g },
  { kind: "private-key", re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
];

function walk(dir, acc = []) {
  let entries = [];
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const ent of entries) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) {
      if (SKIP.has(ent.name) || (ent.name.startsWith(".") && ent.name !== ".github")) continue;
      walk(p, acc);
    } else acc.push(p);
  }
  return acc;
}

function rel(p) { return relative(ROOT, p) || "."; }

if (!existsSync(ROOT)) { console.error("not a directory"); process.exit(2); }
for (const file of walk(ROOT)) {
  const posix = file.split(sep).join("/");
  if (/(?:^|\/)\.env$|(?:^|\/)\.env\.[^.]/.test(posix) && !posix.endsWith(".example")) {
    findings.push({ kind: "env-file", claim: rel(file), why: "env file looks committable", file: rel(file), line: null });
  }
  if ([".png", ".jpg", ".jpeg", ".webp", ".gif", ".woff", ".zip"].includes(extname(file).toLowerCase())) continue;
  let body = "";
  try { body = readFileSync(file, "utf8"); } catch { continue; }
  if (!body || body.length > 1_000_000) continue;
  for (const { kind, re } of PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(body))) {
      const line = body.slice(0, m.index).split("\n").length;
      findings.push({ kind, claim: m[0].slice(0, 8) + "…", why: "secret-shaped token — rotate if real, never echo the rest", file: rel(file), line });
    }
  }
}

if (jsonMode) {
  process.stdout.write(JSON.stringify({ count: findings.length, findings }, null, 2) + "\n");
} else {
  console.log("## No secrets");
  console.log(`- Status: ${findings.length ? "SECRETS" : "PASS"}`);
  console.log(`- Findings: ${findings.length}`);
  for (const f of findings) {
    const loc = f.file + (f.line ? `:${f.line}` : "");
    console.log(`- [${f.kind}] ${f.claim}  (${loc})`);
    console.log(`  ${f.why}`);
  }
}
process.exit(findings.length ? 1 : 0);
