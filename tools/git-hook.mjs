#!/usr/bin/env node
// lefthook から呼ぶ検査。
//
//   node tools/git-hook.mjs jactionlint [file...]   workflow の静的検査
//   node tools/git-hook.mjs betterleaks             履歴の秘密情報
//
// ツールが手元に無ければ、環境で止めずに通す。CI の .github/workflows/lint.yml が必ず見る。

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const [tool, ...argv] = process.argv.slice(2);
if (!tool) {
  console.error("usage: node tools/git-hook.mjs <jactionlint|betterleaks> [--staged] [args...]");
  process.exit(2);
}

// --staged は pre-commit 用。ステージした workflow だけを見る
const staged = argv.includes("--staged");
const args = argv.filter((a) => a !== "--staged");

const exe = process.platform === "win32" ? ".exe" : "";

/** ステージした workflow のパス。まだ worktree にあるものだけ。 */
function stagedWorkflows() {
  const diff = spawnSync(
    "git",
    ["diff", "--cached", "--name-only", "--diff-filter=ACMR"],
    { encoding: "utf8" },
  );
  if (diff.status !== 0) return [];
  return diff.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((file) => /^\.github\/workflows\/[^/]+\.ya?ml$/.test(file) && fs.existsSync(file));
}

/** mise が入れたツールを、版の新しい順に探す。mise の shim は版が未設定だと動かないので実体を見る。 */
function fromMise(dir, name) {
  const roots = [
    process.env.MISE_DATA_DIR && path.join(process.env.MISE_DATA_DIR, "installs"),
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "mise", "installs"),
    path.join(os.homedir(), ".local", "share", "mise", "installs"),
  ].filter(Boolean);

  for (const root of roots) {
    const base = path.join(root, dir);
    if (!fs.existsSync(base)) continue;
    const versions = fs
      .readdirSync(base)
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    for (const version of versions) {
      const candidate = path.join(base, version, `${name}${exe}`);
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  return null;
}

/** PATH にあるものが、実際に起動するかまで見る。 */
function fromPath(name) {
  const probe = spawnSync(name, ["--version"], { stdio: "ignore" });
  return probe.status === 0 ? name : null;
}

const TOOLS = {
  jactionlint: { name: "jactionlint", dir: "github-jdx-jactionlint" },
  // 引数なしだと使い方を出すだけで終わるので、履歴全体を既定にする
  betterleaks: { name: "betterleaks", dir: "betterleaks", args: ["git", "."] },
};

const spec = TOOLS[tool];
if (!spec) {
  console.error(`git-hook: 知らない検査です: ${tool}`);
  process.exit(2);
}

const targets = staged ? stagedWorkflows() : args.length > 0 ? args : (spec.args ?? []);
if (staged && targets.length === 0) process.exit(0);

const binary = fromPath(spec.name) ?? fromMise(spec.dir, spec.name);
if (!binary) {
  console.error(`git-hook: ${spec.name} が無いので、${tool} の検査を飛ばしました`);
  console.error(`git-hook: 入れるなら  mise use -g ${spec.name}`);
  process.exit(0);
}

const result = spawnSync(binary, targets, { stdio: "inherit" });

if (result.error) {
  console.error(`git-hook: ${spec.name} を起動できませんでした: ${result.error.message}`);
  process.exit(0);
}

// jactionlint の 3 は「workflow が無い」。止める理由にはしない
process.exit(result.status === 3 ? 0 : (result.status ?? 1));
