#!/usr/bin/env node
// 全スライドを1枚ずつ測る。目では見えない崩れだけを拾う。
//
//   npm run dev                       # 別のターミナルで
//   node tools/measure-deck.mjs       # 既定は http://localhost:5173
//   node tools/measure-deck.mjs --url http://localhost:5173 --json
//
// 見るもの（1920x1080 のキャンバス上の実寸）:
//   切り取り   .stage の外へ出た量。0 より大きければ画面に出ていない
//   下端・右端  中身の最後の位置から端までの空き。スライドの padding を下回ったら NG
//              （padding は --suraido-pad なので、テーマを変えれば下限も変わる）
//   文字サイズ  30px 未満の文字（インラインの code / small は除く）
//   明度比     本文 4.5:1 未満、48px 以上の見出し 3:1 未満
//   画像       naturalWidth が 0（読みこめていない）
//   間隔       図・画像・コード・表と、隣の本文のあいだ。既定 72px 未満で NG
//
// 仕組み: `o` の一覧表示は全スライドを 1920x1080 で描いてから縮小しているだけなので、
// 1回の読みこみで全枚を測れる。位置の名前は先にハッシュを歩いて集める。
import { openBrowser } from "./browser.mjs";

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const opt = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv.splice(i, 2)[1] : fallback;
};

const url = opt("url", "http://localhost:5173");
// 下端・右端は既定でスライドの padding を見る。数を渡したときだけ絶対値で判定する
const minBottom = opt("min-bottom", null);
const minRight = opt("min-right", null);
const minGap = Number(opt("min-gap", 72));
const minText = Number(opt("min-text", 30));
const asJson = flag("json");
const verbose = flag("verbose");

const { browser, page } = await openBrowser();
let report = [];
let names = [];
try {
  await page.goto(url, { waitUntil: "load", timeout: 30000 });
  await page.waitForSelector(".stage section", { timeout: 15000 });

  // 位置の名前（#path）を index 順に集める。名前の無いスライドは #<index> のまま
  const collected = await page.evaluate(async () => {
    const total = Number(document.querySelector(".pager").textContent.split("/")[1].trim());
    const out = [];
    for (let i = 0; i < total; i++) {
      location.hash = `#${i}`;
      // ページャが i+1 になるまで待つ。HMR の直後は 1フレームでは変わらないことがある
      const started = performance.now();
      while (performance.now() - started < 800) {
        if (document.querySelector(".pager")?.textContent.trim().startsWith(`${i + 1} /`)) break;
        await new Promise((r) => setTimeout(r, 16));
      }
      out.push(location.hash.replace(/^#/, "").replace(/\.0$/, ""));
    }
    return out;
  });
  names = collected;

  // 一覧表示にして、全スライドを同時に描かせる
  await page.keyboard.press("o");
  await page.waitForSelector(".overview .sheet");

  report = await page.evaluate(
    ({ minBottom, minRight, minGap, minText }) => {
      const W = 1920;
      const H = 1080;
      const px = (v) => Math.round(v);

      const color = (value) => {
        const m = value && value.match(/rgba?\(([^)]+)\)/);
        if (!m) return null;
        const [r, g, b, a = 1] = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
        return [r, g, b, a];
      };
      const blend = (fg, bg) => [0, 1, 2].map((i) => fg[i] * fg[3] + bg[i] * (1 - fg[3]));
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

      const shown = (el) => {
        for (let n = el; n; n = n.parentElement) {
          const cs = getComputedStyle(n);
          if (cs.display === "none" || cs.visibility === "hidden") return false;
          if (Number(cs.opacity) === 0) return false;
        }
        return true;
      };

      const hasText = (el) => {
        for (const n of el.childNodes) {
          if (n.nodeType === 3 && n.textContent.trim()) return true;
        }
        return [...el.querySelectorAll("p,li,h1,h2,h3,td,th,blockquote,figcaption")].some(
          (e) => e.textContent.trim() && shown(e)
        );
      };

      const background = (el, fallback) => {
        const stack = [];
        for (let n = el; n; n = n.parentElement) {
          const cs = getComputedStyle(n);
          if (cs.backgroundImage && cs.backgroundImage !== "none") return null;
          const c = color(cs.backgroundColor);
          if (c && c[3] > 0) {
            stack.push(c);
            if (c[3] === 1) break;
          }
        }
        if (!stack.length) return fallback;
        let base = fallback;
        for (let i = stack.length - 1; i >= 0; i--) base = blend(stack[i], base);
        return base;
      };

      const sheets = [...document.querySelectorAll(".overview .sheet")];
      const out = [];

      sheets.forEach((sheet, index) => {
        const root = sheet.firstElementChild;
        if (!root) return;
        const rr = root.getBoundingClientRect();
        const scale = rr.width / (root.offsetWidth || W);
        const at = (r) => ({
          left: (r.left - rr.left) / scale,
          top: (r.top - rr.top) / scale,
          right: (r.right - rr.left) / scale,
          bottom: (r.bottom - rr.top) / scale,
        });

        const issues = [];
        const rootStyle = getComputedStyle(root);
        const rootBg = color(rootStyle.backgroundColor) ?? [0, 0, 0, 1];
        const bg = [rootBg[0], rootBg[1], rootBg[2]];
        // 下端・右端の下限は、そのスライドの padding。中身は padding の内側に収まっていればよい
        const floorBottom = minBottom === null ? parseFloat(rootStyle.paddingBottom) : Number(minBottom);
        const floorRight = minRight === null ? parseFloat(rootStyle.paddingRight) : Number(minRight);

        // 文字を1つずつ、位置と大きさと色で見る
        let maxBottom = 0;
        let maxRight = 0;
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          const text = node.textContent.trim();
          if (!text) continue;
          const el = node.parentElement;
          if (!el || !shown(el)) continue;
          const range = document.createRange();
          range.selectNodeContents(node);
          const r = at(range.getBoundingClientRect());
          if (r.bottom <= 0 || r.top >= H || r.right <= 0 || r.left >= W) continue;
          maxBottom = Math.max(maxBottom, r.bottom);
          maxRight = Math.max(maxRight, r.right);

          const cs = getComputedStyle(el);
          const size = parseFloat(cs.fontSize);
          // インラインの code / small / sub / sup は、本文より小さくてよい
          const inlineSmall = el.closest("code, small, sub, sup, .pager");
          if (size < minText && !inlineSmall) {
            issues.push({
              kind: "font",
              at: [px(r.left), px(r.top)],
              detail: `${px(size)}px「${text.slice(0, 20)}」`,
            });
          }
          const fg = color(cs.color);
          const behind = background(el, bg);
          if (fg && behind) {
            const r2 = ratio(blend(fg, behind), behind);
            const floor = size >= 48 ? 3 : 4.5;
            if (r2 < floor) {
              issues.push({
                kind: "contrast",
                at: [px(r.left), px(r.top)],
                detail: `${r2.toFixed(2)}:1 「${text.slice(0, 20)}」`,
              });
            }
          }
        }

        // 画像・図・コード・表は、存在するだけで版面の端を決める
        const media = [...root.querySelectorAll("img,svg,video,canvas,pre,table,figure")].filter(shown);
        for (const el of media) {
          const r = at(el.getBoundingClientRect());
          if (r.bottom <= 0 || r.top >= H) continue;
          maxBottom = Math.max(maxBottom, r.bottom);
          maxRight = Math.max(maxRight, r.right);
          if (r.bottom > H + 1 || r.right > W + 1) {
            issues.push({
              kind: "clip",
              at: [px(r.left), px(r.top)],
              detail: `<${el.tagName.toLowerCase()}> が ${px(r.right - W)}px 右 / ${px(r.bottom - H)}px 下へ`,
            });
          }
          if (el.tagName === "IMG" && el.naturalWidth === 0) {
            issues.push({ kind: "image", at: [px(r.left), px(r.top)], detail: el.getAttribute("src") ?? "" });
          }
          // 隣の本文との縦の間隔。見出しは本文ではないので数えない
          const vertical = (a, b) =>
            Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0;
          const body = (el) => !/^H[1-3]$/.test(el.tagName);
          for (let n = el; n && n !== root; n = n.parentElement) {
            const next = n.nextElementSibling;
            const prev = n.previousElementSibling;
            const pair =
              next && shown(next) && hasText(next) && body(next)
                ? [n, next]
                : prev && shown(prev) && hasText(prev) && body(prev)
                  ? [prev, n]
                  : null;
            if (!pair) continue;
            const [a, b] = pair.map((e) => at(e.getBoundingClientRect()));
            if (!vertical(a, b)) continue;
            const gap = b.top - a.bottom;
            if (gap < minGap) {
              issues.push({
                kind: "gap",
                at: [px(a.left), px(a.bottom)],
                detail: `${px(gap)}px（<${el.tagName.toLowerCase()}> と本文）`,
              });
            }
            break;
          }
        }

        // 版面の外へ出た量。height:100% の section は、はみ出しを scrollHeight が持つ
        const clippedY = root.scrollHeight - root.clientHeight;
        const clippedX = root.scrollWidth - root.clientWidth;
        if (clippedY > 1 || clippedX > 1) {
          issues.push({ kind: "clip", at: [W, H], detail: `${px(clippedX)}px 右 / ${px(clippedY)}px 下` });
        }

        const bottom = H - maxBottom;
        const right = W - maxRight;
        if (bottom < floorBottom - 1) {
          issues.push({ kind: "bottom", at: [0, px(maxBottom)], detail: `下端の空き ${px(bottom)}px（padding ${px(floorBottom)}px）` });
        }
        if (right < floorRight - 1) {
          issues.push({ kind: "right", at: [px(maxRight), 0], detail: `右端の空き ${px(right)}px（padding ${px(floorRight)}px）` });
        }

        out.push({ index, bottom: px(bottom), right: px(right), clippedX: px(clippedX), clippedY: px(clippedY), issues });
      });

      return out;
    },
    { minBottom, minRight, minGap, minText }
  );
} finally {
  await browser.close();
}

const label = (s) => {
  const name = names[s.index] ?? String(s.index);
  return `#${name}${name === String(s.index) ? "" : ` (${s.index})`}`;
};

if (asJson) {
  console.log(JSON.stringify(report.map((s) => ({ ...s, name: names[s.index] })), null, 2));
} else {
  let total = 0;
  for (const slide of report) {
    if (!slide.issues.length) {
      if (verbose) console.log(`${label(slide)}  OK  下端 ${slide.bottom}px / 右端 ${slide.right}px`);
      continue;
    }
    total += slide.issues.length;
    console.log(`${label(slide)}`);
    for (const issue of slide.issues) {
      console.log(`  NG [${issue.kind}] ${issue.detail}  at ${issue.at[0]},${issue.at[1]}`);
    }
  }
  console.log(
    total
      ? `\n${report.length} スライド走査、NG ${total} 件`
      : `\nOK: ${report.length} スライド走査、崩れは見つからなかった`
  );
  const limits = [
    `下端 ${minBottom ?? "padding"}`,
    `右端 ${minRight ?? "padding"}`,
    `文字 ${minText}px`,
    `間隔 ${minGap}px`,
  ];
  console.log(`（下限: ${limits.join(" / ")}。余白の数字も見たいときは --verbose）`);
}

process.exit(asJson ? 0 : report.some((s) => s.issues.length) ? 1 : 0);
