# presentation-2026

スライドは [suraido.js](https://github.com/L4Ph/suraido.js) で書きます。JSX をそのまま DOM に変換する仕組みで、React は使いません。スライドは `src/index.tsx` の `deck([...])` に並べた順に表示されます。

## セットアップ

```bash
npm install
npm run dev
```

`npm run dev` は Vite の開発サーバーを起動します。表示された URL をブラウザで開いてください。

ビルドと確認:

```bash
npm run build
npm run preview
npm run check      # 型検査（tsrs）
npm run pdf        # dist を deck.pdf に焼く（@suraido/cli は devDependency）
```

## SBX（Docker Sandboxes）で作業する場合

このリポジトリは `C:\Users\r02ta\projects` をマウントしている SBX サンドボックス `my-blog-content` で作業できます。

```bash
ssh my-blog-content.sbx
cd /c/Users/r02ta/projects/presentation-2026
```

ホスト側のフォルダはコンテナからは symlink を作れないため、`npm install` は `bin-links` を切って実行します。

```bash
npm_config_bin_links=false npm install
```

そのため `package.json` の scripts は `vite` ではなく `node node_modules/vite/bin/vite.js` を直接呼んでいます。`npm run dev` / `npm run build` はそのまま動きます。

## 構成

```
src/index.tsx   スライド本体と deck() の呼び出し
src/slides.css  このデッキ固有のスタイル
theme/          黒地のテーマ（minorun-dark。既定は olivia）
tools/          全スライドを測る検査スクリプト
.agents/skills/ スライド作りのスキル（APM で導入し、suraido.js 用に書き換え）
index.html      エントリ HTML
AGENTS.md       コーディングエージェント向けの suraido.js の説明
```

スライドが増えたら `src/slides/*.tsx` に分割し、`src/index.tsx` で import して `deck([...])` に加えます。テーマは `src/index.tsx` の `import "suraido.js/themes/olivia.css"` を差し替えます（`olivia` / `noel` / `nine009` / `botanical` / `dolch` / `laser`）。黒地にするなら `import "../theme/minorun-dark.css"` に替えます。

スキルは [minorun-marp-skill](https://github.com/minorun365/minorun-marp-skill)（Apache-2.0）を APM で入れ、suraido.js 向けに書き直したものです。`apm install` は書き換えたファイルを残します（`--force` を付けたときだけ上流版に戻ります）。`slide-story`（話の組み立て）、`slide-figures`（図と挿絵）、`slide-design`（白地 olivia のバランスと配色）、`slide-design-dark`（黒地にするときの差分）の4つです。

ルールの置き場は2つに分けています。`AGENTS.md` は機構（`class`、`deck()`、`<Step>`、はみ出しの測り方）、スキルは表現（1枚の情報量、強調、中扉、配色）。数値はテーマの `--suraido-*` と検査ツールの既定にだけ置きます。

検査は開発サーバーを立てた状態で動かします。`puppeteer-core`（devDependency）と Chrome が要ります。

```bash
npm run dev &
npm run measure                              # 切り取り・余白・文字サイズ・明度比・画像
```


## 注意

- `className` ではなく `class` を使います。
- `deck()` に渡すスライドはラップせず、そのまま配列に入れます（ラップすると URL と reveal が壊れます）。
- 1920x1080 のキャンバスからはみ出した内容は、画面上では気づけないまま切れます。

## Git hooks

フックの管理は [lefthook](https://lefthook.dev/)（`lefthook.yml`）。`npm install` の `prepare` で入るので、clone したら依存を入れるだけで有効になります。

```bash
npm install            # lefthook install まで走る
node node_modules/lefthook/bin/index.js install   # 手で入れ直すとき
```

| フック | 何をするか |
|---|---|
| `pre-commit` | ステージした `.github/workflows/*.yml` だけを jactionlint で検査 |
| `pre-push` | jactionlint（全体）・`npm run check`（型）・Betterleaks（履歴の秘密情報） |

検査の中身は `tools/git-hook.mjs`。jactionlint / Betterleaks が手元に無ければ、環境で止めずに通します（CI の `lint.yml` が必ず見ます）。

```bash
node tools/git-hook.mjs jactionlint          # 全体
node tools/git-hook.mjs jactionlint --staged # ステージした workflow だけ
node tools/git-hook.mjs betterleaks          # 履歴の秘密情報
```
