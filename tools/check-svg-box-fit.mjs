#!/usr/bin/env node
// SVG の <text> が、重なっている <rect> の内側に余白つきで収まっているかを、実際に描画して測る。
//
//   node tools/check-svg-box-fit.mjs images/*.svg
//   node tools/check-svg-box-fit.mjs images/*.svg --width 820   # スライド上で 820px 幅に置く場合
//
// 余白の下限は 14（viewBox の座標）。--width を渡すと、文字の実効サイズも見る。
// 1920x1080 のキャンバスでは本文が 32px なので、図の中の文字も 32px 以上にしたい。
//
// 仕組み: ヘッドレス Chrome で SVG を開き、getBBox() で文字の実寸を取る。フォントの字幅は
// ソースからは分からない（font-size × 文字数 × 0.6 の見積りは2割ほど外れる）ので、描く以外に無い。
import fs from "node:fs";
import path from "node:path";
import { openBrowser } from "./browser.mjs";

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args.splice(i, 2)[1] : fallback;
};
const displayWidth = Number(opt("width", 0));
const minFont = Number(opt("min-font", 30));
const MIN = 14;
const files = args;
if (!files.length) {
  console.error("使い方: node tools/check-svg-box-fit.mjs <svg...> [--width <表示幅px>] [--min-font 30]");
  process.exit(2);
}

const { browser, page } = await openBrowser({ width: 1400, height: 900 });
let ng = 0;
let scanned = 0;
try {
  for (const f of files) {
    const svg = fs.readFileSync(f, "utf8");
    await page.setContent(`<html><body style="margin:0;background:#000">${svg}</body></html>`);
    await page.evaluate(() => document.fonts.ready);
    const res = await page.evaluate(
      ({ MIN, displayWidth, minFont }) => {
        const svg = document.querySelector("svg");
        if (!svg) return { error: "svg が無い" };
        const vb = svg.viewBox.baseVal;
        const rects = [...svg.querySelectorAll("rect")]
          .filter((r) => r.getAttribute("x") !== null)
          .map((r) => ({
            x: +r.getAttribute("x"),
            y: +r.getAttribute("y"),
            w: +r.getAttribute("width"),
            h: +r.getAttribute("height"),
          }))
          // 背景いっぱいの rect は対象外（viewBox の原点が 0 でない図もある）
          .filter((r) => !(r.x === vb.x && r.y === vb.y && r.w === vb.width && r.h === vb.height));
        // 図を表示幅に置いたときの拡大率。1 なら viewBox の 1 単位がキャンバスの 1px
        const scale = displayWidth && vb.width ? displayWidth / vb.width : 1;
        const out = [];
        for (const t of svg.querySelectorAll("text")) {
          const b = t.getBBox();
          const cx = b.x + b.width / 2;
          const cy = b.y + b.height / 2;
          const box = rects.find((r) => cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h);
          const fs = parseFloat(getComputedStyle(t).fontSize) || 0;
          out.push({
            text: t.textContent.trim(),
            bbox: [b.x, b.y, b.width, b.height].map(Math.round),
            box: box ? [box.x, box.y, box.w, box.h] : null,
            margins: box
              ? {
                  left: Math.round(b.x - box.x),
                  right: Math.round(box.x + box.w - (b.x + b.width)),
                  top: Math.round(b.y - box.y),
                  bottom: Math.round(box.y + box.h - (b.y + b.height)),
                }
              : null,
            fontOnCanvas: Math.round(fs * scale),
            overflowVB:
              b.x < vb.x || b.y < vb.y || b.x + b.width > vb.x + vb.width || b.y + b.height > vb.y + vb.height,
            minFont,
          });
        }
        return { out };
      },
      { MIN, displayWidth, minFont }
    );

    if (res.error) {
      console.log(`NG ${path.basename(f)} ${res.error}`);
      ng++;
      continue;
    }
    for (const r of res.out) {
      scanned++;
      const bad = [];
      if (r.margins) for (const [k, v] of Object.entries(r.margins)) if (v < MIN) bad.push(`${k} ${v}px`);
      if (r.overflowVB) bad.push("viewBox の外");
      if (displayWidth && r.fontOnCanvas < r.minFont) bad.push(`文字 ${r.fontOnCanvas}px`);
      if (bad.length) {
        ng++;
        console.log(`NG ${path.basename(f)} 「${r.text}」 ${bad.join(" / ")}  bbox=${r.bbox}`);
      }
    }
  }
} finally {
  await browser.close();
}
console.log(`${files.length} ファイル・文字 ${scanned} 件を走査、NG ${ng} 件`);
process.exit(ng ? 1 : 0);
