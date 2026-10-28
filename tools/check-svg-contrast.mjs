#!/usr/bin/env node
// 図形（吹き出し・しっぽ・箱・線・矢印）が、真下の面と同じ色で沈んでいないかを明度比で測る。
//
//   node tools/check-svg-contrast.mjs images/*.svg
//   node tools/check-svg-contrast.mjs images/*.svg --bg '#000000' --png /tmp/svg
//
// 黒地の図で、吹き出しを箱と同じ暗いグラデーションで塗ると消える。文字の検査にも
// 余白の検査にも引っかからないので、専用に測る。明度比 1.25 未満で NG。
// --png を付けると、目視用に背景色の上へ描いた PNG も書き出す。
// 図全体の 20% を超える大きな面（ゾーン・広がりの帯）は、意図して淡く敷く面なので対象外。
import fs from "node:fs";
import path from "node:path";
import { openBrowser } from "./browser.mjs";

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args.splice(i, 2)[1] : fallback;
};
const BG = opt("bg", "#000000");
const PNG = opt("png", null);
const MIN = 1.25;
const files = args;
if (!files.length) {
  console.error("使い方: node tools/check-svg-contrast.mjs <svg...> [--bg #000000] [--png <dir>]");
  process.exit(2);
}

const { browser, page } = await openBrowser({ width: 1400, height: 900, scale: 1.5 });
let ng = 0;
let scanned = 0;
try {
  for (const f of files) {
    const svg = fs.readFileSync(f, "utf8");
    await page.setContent(
      `<html><body style="margin:0;background:${BG}"><div id="w" style="width:1200px">${svg}</div></body></html>`
    );
    await page.evaluate(() => {
      const s = document.querySelector("svg");
      if (s) {
        s.style.width = "1200px";
        s.style.height = "auto";
      }
    });
    const res = await page.evaluate((BG) => {
      const hex = (c) => {
        const m = c && c.match(/rgba?\(([^)]+)\)/);
        if (!m) return null;
        const [r, g, b, a = 1] = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
        return a === 0 ? null : [r, g, b];
      };
      const parseHex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
      const lum = ([r, g, b]) => {
        const f = (v) => {
          v /= 255;
          return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      };
      const ratio = (a, b) => {
        const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
        return (x + 0.05) / (y + 0.05);
      };
      // グラデーションは stop の平均色で代表させる
      const paint = (el, prop) => {
        const v = getComputedStyle(el)[prop];
        if (!v || v === "none") return null;
        const u = v.match(/url\("?#([^")]+)"?\)/);
        if (u) {
          const g = document.getElementById(u[1]);
          if (!g) return null;
          const cs = [...g.querySelectorAll("stop")].map((s) => hex(getComputedStyle(s).stopColor)).filter(Boolean);
          if (!cs.length) return null;
          return [0, 1, 2].map((i) => cs.reduce((a, c) => a + c[i], 0) / cs.length);
        }
        return hex(v);
      };
      const svg = document.querySelector("svg");
      const shapes = [...svg.querySelectorAll("rect,polygon,path,ellipse,circle,line,polyline")].filter(
        (e) => !e.closest("defs,marker")
      );
      const rects = shapes
        .filter((e) => e.tagName === "rect")
        .map((e) => ({ e, b: e.getBBox(), c: paint(e, "fill") }))
        .filter((r) => r.c);
      const order = new Map(shapes.map((e, i) => [e, i]));
      const out = [];
      for (const e of shapes) {
        const isLine = ["line", "polyline"].includes(e.tagName) || paint(e, "fill") === null;
        const col = isLine ? paint(e, "stroke") : paint(e, "fill");
        if (!col) continue;
        const b = e.getBBox();
        const cx = b.x + b.width / 2;
        const cy = b.y + b.height / 2;
        const vb = svg.viewBox.baseVal;
        if (b.width * b.height > 0.2 * vb.width * vb.height) continue;
        const under = rects
          .filter(
            (r) =>
              r.e !== e &&
              order.get(r.e) < order.get(e) &&
              cx >= r.b.x &&
              cx <= r.b.x + r.b.width &&
              cy >= r.b.y &&
              cy <= r.b.y + r.b.height
          )
          .sort((p, q) => p.b.width * p.b.height - q.b.width * q.b.height)[0];
        const base = under ? under.c : parseHex(BG);
        out.push({
          tag: e.tagName,
          at: [b.x, b.y, b.width, b.height].map(Math.round),
          r: +ratio(col, base).toFixed(2),
          on: under ? "rect" : "背景",
        });
      }
      return out;
    }, BG);

    for (const r of res) {
      scanned++;
      if (r.r < MIN) {
        ng++;
        console.log(`NG ${path.basename(f)} <${r.tag}> at ${r.at} 明度比 ${r.r}（下の${r.on}とほぼ同じ色）`);
      }
    }
    if (PNG) {
      fs.mkdirSync(PNG, { recursive: true });
      await (await page.$("#w")).screenshot({ path: path.join(PNG, path.basename(f, ".svg") + ".png") });
    }
  }
} finally {
  await browser.close();
}
console.log(`${files.length} ファイル・図形 ${scanned} 個を走査（背景 ${BG}）、NG ${ng} 件`);
process.exit(ng ? 1 : 0);
