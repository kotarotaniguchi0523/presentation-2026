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
index.html      エントリ HTML
AGENTS.md       コーディングエージェント向けの suraido.js の説明
```

スライドが増えたら `src/slides/*.tsx` に分割し、`src/index.tsx` で import して `deck([...])` に加えます。テーマは `src/index.tsx` の `import "suraido.js/themes/olivia.css"` を差し替えます（`olivia` / `noel` / `nine009` / `botanical` / `dolch` / `laser`）。

## 注意

- `className` ではなく `class` を使います。
- `deck()` に渡すスライドはラップせず、そのまま配列に入れます（ラップすると URL と reveal が壊れます）。
- 1920x1080 のキャンバスからはみ出した内容は、画面上では気づけないまま切れます。
