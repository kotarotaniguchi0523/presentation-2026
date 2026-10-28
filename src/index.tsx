import { Center, Cols, deck, Pad, slide, Step } from "suraido.js";
import "suraido.js/deck.css";
import "suraido.js/themes/olivia.css";
import "./slides.css";
import { mermaid } from "./mermaid";

const FLOW = `flowchart LR
  A[LIFF で予約] --> B[Firebase で<br/>同時予約を止める]
  B --> C[Zoom に<br/>Ticket を発行]
  C --> D[Spreadsheet<br/>に記録]
  D --> E[LINE と Slack<br/>へ通知]`;

const SEQ = `sequenceDiagram
  participant L as LIFF
  participant F as Firebase
  participant Z as Zoom Events API
  participant S as Spreadsheet
  L->>F: 予約のロック
  F-->>L: 取得できた
  L->>Z: Ticket を作成
  Z-->>L: join URL
  L->>S: 記録して、通知`;

const Cover = slide({ path: "cover" }, () => (
  <Center class="cover">
    <p class="kicker">ポートフォリオ / 2026</p>
    <h1>
      予約アプリを1人で作って
      <br />
      1年運用しました
    </h1>
    <p class="lead">谷口昂太郎</p>
  </Center>
));

const PhoneAccordion = () => (
  <div class="phone">
    <div class="bar">
      <span>無料体験授業</span>
      <b>1 / 2</b>
    </div>
    <div class="body">
      <div class="acc open">
        <span>学年</span>
        <em>小学4年</em>
        <i>▼</i>
      </div>
      <div class="acc open lv1">
        <span>教科</span>
        <em>算数</em>
        <i>▼</i>
      </div>
      <div class="acc open lv2">
        <span>単元</span>
        <em>分数</em>
        <i>▼</i>
      </div>
      <div class="acc open lv3">
        <span>授業内容</span>
        <em>分数のたし算</em>
        <i>▼</i>
      </div>
    </div>
    <div class="foot">
      <span class="btn">次へ（日時を選ぶ）</span>
    </div>
  </div>
);

// 2ページ目：○△× のカレンダー。当日は ▼ か ×、開始10分前以降は ×。
const PhoneCalendar = () => (
  <div class="phone">
    <div class="bar">
      <span>日時を選ぶ</span>
      <b>2 / 2</b>
    </div>
    <div class="body">
      <div class="cal">
        <span class="day">月</span>
        <span class="day">火</span>
        <span class="day">水</span>
        <span class="day">木</span>
        <span class="day">金</span>
        <span class="day">土</span>
        <span class="day">日</span>
        <span>×</span>
        <span>×</span>
        <span>○</span>
        <span>△</span>
        <span>○</span>
        <span class="on">○</span>
        <span>△</span>
        <span>○</span>
        <span>△</span>
        <span>○</span>
        <span>×</span>
        <span>▼</span>
        <span>▼</span>
        <span>×</span>
      </div>
    </div>
    <div class="foot">
      <span class="btn">この内容で予約へ</span>
    </div>
  </div>
);

const Product = slide({ path: "product" }, ({ update }) => {
  let page = 0;
  return () => (
    <Pad>
      <h2>作ったもの</h2>
      <Cols ratio="1fr 500px">
        <div class="ui-side">
          <p>オンライン塾の予約アプリ。LINE の中で開く（LIFF）。</p>
          <button
            class="toggle"
            onClick={() => {
              page = page === 0 ? 1 : 0;
              update();
            }}
          >
            {page === 0 ? "2ページ目（日時）を見る" : "1ページ目（入力）を見る"}
          </button>
          <ul style={{ display: page === 0 ? "block" : "none" }}>
            <li>学年 → 教科 → 単元 → 授業内容</li>
            <li>開くと、その下の項目が出る</li>
            <li>戻るボタンが要らない</li>
          </ul>
          <ul style={{ display: page === 1 ? "block" : "none" }}>
            <li>○ 空き、△ 残りわずか、× 満席</li>
            <li>当日は、▼ か ×</li>
            <li>開始10分前以降は、すべて ×</li>
          </ul>
          <div class="kpi">
            <div>
              <b>30〜40</b>
              <span>予約 / 月（10人から）</span>
            </div>
            <div>
              <b>10分</b>
              <span>1件あたり（2日から）</span>
            </div>
            <div>
              <b>1年</b>
              <span>開発から運用まで</span>
            </div>
          </div>
        </div>
        <div class="frame">{page === 0 ? PhoneAccordion() : PhoneCalendar()}</div>
      </Cols>
    </Pad>
  );
});

const Steps = slide({ path: "steps" }, () => (
  <Pad>
    <h2>ユーザーはこの順で動く</h2>
    <ol>
      <li>公式LINE から、LIFF を開く</li>
      <li>LINE ログイン（初回だけ）</li>
      <li>学年を選ぶ</li>
      <li>教科を選ぶ</li>
      <li>単元と授業内容を選ぶ</li>
      <li>カレンダーで日時を選ぶ</li>
      <li>確認して、送信する</li>
      <li>LINE に日時と URL が届く</li>
    </ol>
  </Pad>
));

const Flow = slide({ path: "flow" }, () => (
  <Pad>
    <h2>予約が通るまで</h2>
    <div class="diagram" data-mermaid={FLOW}></div>
    <p class="note">同時予約だけ Firebase で止める。記録は Spreadsheet に残す。</p>
  </Pad>
));

const Sequence = slide({ path: "sequence" }, () => (
  <Pad>
    <h2>1件の予約で何が起きるか</h2>
    <div class="diagram" data-mermaid={SEQ} data-font="44"></div>
  </Pad>
));

const Constraints = slide({ path: "constraints" }, () => (
  <Pad>
    <h2>要件 → 制約 → 設計</h2>
    <Cols ratio="1fr 1fr 1fr">
      <div>
        <h3>要件</h3>
        <ul>
          <li>授業情報は Spreadsheet のまま</li>
          <li>とにかく早く</li>
          <li>LINE と Slack に通知</li>
        </ul>
      </div>
      <div>
        <h3>制約</h3>
        <ul>
          <li>同時実行を守れない</li>
          <li>Ticket は1件ずつ</li>
          <li>公開前は Ticket 不可</li>
        </ul>
      </div>
      <div>
        <h3>設計</h3>
        <ul>
          <li>Firebase で直列化</li>
          <li>PATCH は取得→追加→上書き</li>
          <li>公開を先に回す</li>
        </ul>
      </div>
    </Cols>
  </Pad>
));

const SheetBreak = slide({ path: "sheet-break" }, () => (
  <Pad>
    <h2>正のデータを人が触る</h2>
    <ul>
      <li>アプリと人が同じ Spreadsheet に書く</li>
      <li>列のセルが置き換わり、今日が出なくなる</li>
      <li>壊れたことに、あとから気づく</li>
    </ul>
  </Pad>
));

const Structure = slide({ path: "structure" }, () => (
  <Pad>
    <h2>複雑さを構造で解く</h2>
    <table>
      <thead>
        <tr>
          <th>課題</th>
          <th>手</th>
          <th>結果</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>状態が8つ</td>
          <td>XState で遷移を表に</td>
          <td>表に無い遷移が起きない</td>
        </tr>
        <tr>
          <td>密結合</td>
          <td>責務で分ける</td>
          <td>変更が1か所で済む</td>
        </tr>
        <tr>
          <td>外部 API</td>
          <td>境界の外に置く</td>
          <td>仕様変更に耐える</td>
        </tr>
      </tbody>
    </table>
  </Pad>
));

const OwnChange = slide({ path: "own-change" }, () => (
  <Pad>
    <h2>自分で提案して変えた</h2>
    <ul>
      <li>アコーディオン：6画面を1画面に（自分のアイデア）</li>
      <li>リアーキテクチャ：依存の向きを、自分で手を動かして分けた</li>
      <li>結果：変更が怖くなくなった</li>
    </ul>
  </Pad>
));

const Year = slide({ path: "year" }, () => (
  <Pad>
    <h2>1年運用して分かったこと</h2>
    <ul>
      <Step>
        <li>要件が設計を決める</li>
      </Step>
      <Step>
        <li>品質は後追いになる</li>
      </Step>
      <Step>
        <li>1人で抱えると、詰まる</li>
      </Step>
    </ul>
  </Pad>
));

const Next = slide({ path: "next" }, () => (
  <Pad>
    <h2>御社でやりたいこと</h2>
    <ul>
      <li>設計レビューを「受ける側」から「出す側」へ</li>
      <li>フロントの品質（テストと状態設計）を上げる</li>
      <li>1人で抱えず、チームで速くする</li>
    </ul>
  </Pad>
));

const Appendix = slide({ path: "appendix" }, () => (
  <Pad>
    <h2>付録：技術スタックと年表</h2>
    <table>
      <thead>
        <tr>
          <th>領域</th>
          <th>使ったもの</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>型</td>
          <td>TypeScript / Zod（Branded Type）/ @t3-oss/env-nextjs</td>
        </tr>
        <tr>
          <td>画面</td>
          <td>Next.js / React / Jotai / XState / Tailwind / Day.js</td>
        </tr>
        <tr>
          <td>基盤</td>
          <td>LIFF（LINE ログイン）/ Firebase / Vercel</td>
        </tr>
        <tr>
          <td>データ</td>
          <td>google-spreadsheet / google-auth-library（Service Account）</td>
        </tr>
        <tr>
          <td>外部</td>
          <td>Zoom Events API（Ticket / Session）</td>
        </tr>
        <tr>
          <td>品質</td>
          <td>Biome / Vitest / Knip / React Doctor</td>
        </tr>
      </tbody>
    </table>
    <p class="note">フォームは最初 React Hook Form。後に外して、React と Jotai に寄せた。</p>
  </Pad>
));

// The order here is the order they are shown in.
deck(
  [
    Cover,
    Product,
    Steps,
    Flow,
    Sequence,
    Constraints,
    SheetBreak,
    Structure,
    OwnChange,
    Year,
    Next,
    Appendix,
  ],
  { use: [mermaid] }
);
