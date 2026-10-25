#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const SECRET_PATTERNS = [
  { name: "Google API Key", regex: /AIza[0-9A-Za-z_-]{35}/ },
  { name: "Anthropic API Key", regex: /sk-ant-[A-Za-z0-9_-]{20,}/ },
  { name: "Clerk Live Secret Key", regex: /sk_live_[0-9A-Za-z_-]{10,}/ },
  { name: "Clerk Test Secret Key", regex: /sk_test_[0-9A-Za-z_-]{10,}/ },
  { name: "Svix Webhook Secret", regex: /whsec_[0-9A-Za-z_-]{16,}/ },
  { name: "Private Key", regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
];

const IGNORE_DIRS = new Set([
  ".git",
  "node_modules",
  ".next/cache",
  ".clerk",
  "coverage",
]);

const IGNORE_FILES = new Set([
  "package-lock.json",
  "scripts/scan-secrets.mjs",
]);

let violations = 0;

function scanFile(filePath) {
  const relPath = path.relative(process.cwd(), filePath).replace(/\\/g, "/");
  if (IGNORE_FILES.has(relPath)) return;

  // Skip binary files except .js/.css in .next/static
  const ext = path.extname(filePath).toLowerCase();
  const allowedExts = new Set([
    ".js", ".mjs", ".cjs", ".ts", ".tsx", ".json", ".md", ".env", ".yaml", ".yml", ".sql", ".css"
  ]);
  if (!allowedExts.has(ext)) return;

  let content;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch {
    return;
  }

  for (const { name, regex } of SECRET_PATTERNS) {
    const match = regex.exec(content);
    if (match) {
      // Find line number
      const upToMatch = content.slice(0, match.index);
      const lineNumber = upToMatch.split("\n").length;
      const redacted = match[0].slice(0, 7) + "..." + match[0].slice(-4);
      console.error(`[SECRET SCAN FAILURE] ${name} found in ${relPath}:${lineNumber} (${redacted})`);
      violations++;
    }
  }
}

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(process.cwd(), fullPath).replace(/\\/g, "/");
    if (IGNORE_DIRS.has(relPath)) continue;

    if (entry.isDirectory()) {
      scanDir(fullPath);
    } else if (entry.isFile()) {
      scanFile(fullPath);
    }
  }
}

console.log("Scanning repository and static build output for sensitive secrets...");
scanDir(process.cwd());

if (violations > 0) {
  console.error(`\nFound ${violations} secret leak violation(s). Build aborted.`);
  process.exit(1);
} else {
  console.log("Secret scan passed: No secrets detected in source or client bundles.");
}
