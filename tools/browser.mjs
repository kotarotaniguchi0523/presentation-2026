// tools/ の計測スクリプトが共通で使うブラウザの用意。
// puppeteer-core と Chrome の場所は環境ごとに違うので、ここで1回だけ探す。
//
//   npm install --no-save puppeteer-core     # このリポジトリに入れる場合
//   CHROME_PATH=/path/to/chrome node tools/measure-deck.mjs
//
// 見つからなければ、何を入れればよいかを書いて終わる。
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export function loadPuppeteer() {
  const tries = [path.join(process.cwd(), "package.json")];
  try {
    tries.push(path.join(execSync("npm root -g", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim(), "package.json"));
  } catch {
    // npm が無い環境では、カレントだけで探す
  }
  for (const from of tries) {
    try {
      return createRequire(from)("puppeteer-core");
    } catch {
      // 次へ
    }
  }
  console.error(
    "puppeteer-core が見つかりません。このリポジトリで `npm install --no-save puppeteer-core` を実行してください。"
  );
  process.exit(2);
}

function firstExisting(paths) {
  return paths.find((p) => p && fs.existsSync(p));
}

function chromeUnder(root, sub) {
  // 例: ~/.cache/suraido/chrome/linux-154.0.8037.92/chrome-linux64/chrome
  if (!fs.existsSync(root)) return [];
  return fs
    .readdirSync(root)
    .sort()
    .reverse()
    .map((v) => path.join(root, v, sub));
}

export function findChrome() {
  const home = os.homedir();
  const candidates = [process.env.CHROME_PATH];
  if (process.platform === "win32") {
    candidates.push(
      "C:/Program Files/Google/Chrome/Application/chrome.exe",
      "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
      path.join(process.env.LOCALAPPDATA ?? "", "Google/Chrome/Application/chrome.exe"),
      "C:/Program Files/Microsoft/Edge/Application/msedge.exe"
    );
  } else if (process.platform === "darwin") {
    candidates.push(
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Chromium.app/Contents/MacOS/Chromium"
    );
  } else {
    candidates.push(
      "/usr/bin/google-chrome",
      "/usr/bin/google-chrome-stable",
      "/usr/bin/chromium",
      "/usr/bin/chromium-browser",
      ...chromeUnder(path.join(home, ".cache/suraido/chrome"), "chrome-linux64/chrome"),
      ...chromeUnder(path.join(home, ".cache/puppeteer/chrome"), "chrome-linux64/chrome")
    );
  }
  const found = firstExisting(candidates);
  if (!found) {
    console.error(
      "Chrome が見つかりません。CHROME_PATH で実行ファイルを指定してください。"
    );
    process.exit(2);
  }
  return found;
}

export async function openBrowser({ width = 1920, height = 1080, scale = 1 } = {}) {
  const puppeteer = loadPuppeteer();
  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: true,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage", "--font-render-hinting=none"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: scale });
  return { browser, page };
}
