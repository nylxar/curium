// scripts/write-build-info.js
// Run before building: `node scripts/write-build-info.js`
// Writes constants/build-info.json with the current git commit info.

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function safe(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

const commit = safe("git rev-parse HEAD");
const shortCommit = safe("git rev-parse --short HEAD");
const branch = safe("git branch --show-current");
const commitDate = safe('git log -1 --format="%ai"');
const commitMessage = safe('git log -1 --format="%s"');
const isDirty = safe("git status --porcelain").length > 0;
const buildDate = new Date().toISOString();

const info = {
  commit,
  shortCommit,
  branch,
  commitDate,
  commitMessage,
  isDirty,
  buildDate,
};

const outDir = path.join(__dirname, "..", "constants");
const outFile = path.join(outDir, "build-info.json");

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(info, null, 2));

console.log("Wrote build info to", outFile);
console.log(info);
