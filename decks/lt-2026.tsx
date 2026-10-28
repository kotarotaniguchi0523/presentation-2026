import { Center, Cols, deck, Pad, slide, Step } from "suraido.js";
import "suraido.js/deck.css";
import "suraido.js/themes/olivia.css";
import "./slides.css";

const Cover = slide({ path: "cover" }, () => (
  <Center class="cover">
    <p class="kicker">Easy Easy / 完全に理解した Talk / LT1</p>
    <h1>
      予約業務、2日かかってたのを
      <br />
      10分にした話
    </h1>
    <p class="lead">フロントエンド未経験の学生が1年かけて</p>
    <p class="meta">kotarotaniguchi</p>
  </Center>
));

const About = slide({ path: "about" }, () => (
  <Pad>
    <h2>学生、Python しか書いたことがない</h2>
    <ul>
      <li>大学では Python でデータ処理。サーバー側だけ</li>
      <li>TypeScript も、フロントエンドも未経験</li>
      <li>なのに、フルスタック TypeScript で予約アプリを作ることに</li>
      <li>立ち上げ期のオンライン塾に、学生インターンとして参画</li>
    </ul>
  </Pad>
));

const Q1 = slide({ path: "q1" }, () => (
  <Center class="crosshead">
    <h2>なんで作ったの？</h2>
  </Center>
));

const Before = slide({ path: "before" }, () => (
  <Pad>
    <h2>予約は LINE のやり取りだった</h2>
    <p>公式LINEに「体験授業を受けたい」と連絡が来るところから始まる。</p>
    <ul>
      <li>どの教科を受けたいかを、トークで聞く</li>
      <li>日程を出して何度か往復する</li>
      <li>確定するまでに、2日</li>
    </ul>
  </Pad>
));

const Half = slide({ path: "half" }, () => (
  <Center>
    <h2>半分が途中で消える</h2>
    <div class="big">
      <b>50%</b>
      <span>が、来なくなる</span>
    </div>
  </Center>
));

const Req = slide({ path: "req" }, () => (
  <Pad>
    <h2>Spreadsheet を、DB にする</h2>
    <p>売り上げがかかっているので、早く出したい。前提は3つ。</p>
    <ul>
      <li>授業の情報はいまの Spreadsheet のまま</li>
      <li>とにかく早く</li>
      <li>予約は公式LINE と Slack に通知</li>
    </ul>
  </Pad>
));

const Arch = slide({ path: "arch" }, () => (
  <Pad>
    <h2>登場人物は4人</h2>
    <div class="flow">
      <div class="node">
        <b>LIFF</b>
        <span>LINE の画面</span>
      </div>
      <div class="arrow">→</div>
      <div class="node">
        <b>Firebase</b>
        <span>同時予約を止める</span>
      </div>
      <div class="arrow">→</div>
      <div class="node">
        <b>Zoom</b>
        <span>配信と Ticket を発行</span>
      </div>
      <div class="arrow">→</div>
      <div class="node">
        <b>Spreadsheet</b>
        <span>記録と、正のデータ</span>
      </div>
    </div>
    <p class="note">予約結果は公式LINE と Slack に通知する。</p>
  </Pad>
));

const Scope = slide({ path: "scope" }, () => (
  <Pad>
    <h2>予約と配信は最初からセット</h2>
    <p>予約が決まったら、その時間の疑似ウェビナーを Zoom に出す。ここまでが1つ。</p>
    <ul>
      <li>予約 = Ticket</li>
      <li>その時間 = Session</li>
      <li>配信 = Simulive</li>
    </ul>
  </Pad>
));

const V1 = slide({ path: "v1" }, () => (
  <Pad>
    <h2>RHF、Jotai、Next.js、Vercel</h2>
    <p>品質は Biome の Lint と Typecheck だけだった。</p>
    <ul>
      <li>フォームは React Hook Form で組む</li>
      <li>状態は Jotai に持たせる</li>
      <li>ログインは LIFF の LINE ログイン</li>
    </ul>
  </Pad>
));

const Q2 = slide({ path: "q2" }, () => (
  <Center class="crosshead">
    <h2>配信はどうやって出す？</h2>
  </Center>
));

const World = slide({ path: "world" }, () => (
  <Pad>
    <h2>Hub、Event、Session、Ticket</h2>
    <p>Zoom Events の世界は独自の言葉でできている。</p>
    <ul>
      <li>いちばん上が Hub。Event は1日1本</li>
      <li>Session が「枠」</li>
      <li>Ticket が「1人の予約」</li>
    </ul>
  </Pad>
));

const Sheet = slide({ path: "sheet" }, () => (
  <Pad>
    <h2>Session ID も教科も、正は Spreadsheet</h2>
    <p>授業の情報は、もともとの Spreadsheet が持ち主。</p>
    <ul>
      <li>Session ID を Spreadsheet から引く</li>
      <li>教科と単元も、そこから</li>
      <li>ユーザーステータスもそこから</li>
    </ul>
  </Pad>
));

const Publish = slide({ path: "publish" }, () => (
  <Pad>
    <h2>公開しないと、Ticket は作れない</h2>
    <div class="flow">
      <div class="node">
        <b>Event</b>
      </div>
      <div class="arrow">→</div>
      <div class="node">
        <b>Session</b>
      </div>
      <div class="arrow">→</div>
      <div class="node">
        <b>Ticket Type</b>
      </div>
      <div class="arrow">→</div>
      <div class="node mark">
        <b>公開</b>
      </div>
      <div class="arrow">→</div>
      <div class="node">
        <b>Ticket</b>
      </div>
    </div>
    <ul>
      <li>公開前の Ticket は 26501 で落ちる</li>
      <li>Ticket Type の sessions に Session を渡して、初めて紐づく</li>
    </ul>
  </Pad>
));

const Patch = slide({ path: "patch" }, () => (
  <Pad>
    <h2>同じ Session に足すときは PATCH</h2>
    <p>「1件足す」API は無い。取って、足して、上書きする。</p>
    <ul>
      <li>素で上書きすると、既存の予約が消える</li>
      <li>だから毎回 GET してから足す</li>
      <li>1リクエストは30件まで</li>
    </ul>
  </Pad>
));

const PatchSteps = slide({ path: "patch-steps" }, () => (
  <Pad>
    <h2>取得して、足して、上書きする</h2>
    <p>500人なら17回。途中で失敗すると、半分だけ入る。</p>
    <ul>
      <Step>
        <li>GET で、いまの Ticket を全部取る</li>
      </Step>
      <Step>
        <li>末尾に新しい Ticket を足す</li>
      </Step>
      <Step>
        <li>PATCH で配列ごと上書きする</li>
      </Step>
    </ul>
  </Pad>
));

const Firebase = slide({ path: "firebase" }, () => (
  <Pad>
    <h2>同時予約を止めるためだけに、Firebase を通す</h2>
    <p>Zoom にはトランザクションが無い。2人が同時に押すと、二重に入る。</p>
    <ul>
      <li>初回の予約だけ Firebase で直列化</li>
      <li>通ったら Zoom に書く</li>
      <li>失敗したら Firebase 側も戻す</li>
    </ul>
  </Pad>
));

const Simulive = slide({ path: "simulive" }, () => (
  <Pad>
    <h2>録画を、ライブとして流す</h2>
    <p>Session に is_simulive と録画IDを渡すと、その時間に自動で始まる。</p>
    <ul>
      <li>再生中、ホストは喋れない</li>
      <li>画面は speaker view で固定</li>
      <li>1本に複数の録画は入れられない</li>
    </ul>
  </Pad>
));

const Q3 = slide({ path: "q3" }, () => (
  <Center class="crosshead">
    <h2>なんで半分、消えるの？</h2>
  </Center>
));

// A mock of the old form: one question per page, six pages.
const PhoneWizard = () => (
  <div class="phone">
    <div class="bar">
      <span>無料体験授業</span>
      <b>1 / 6</b>
    </div>
    <div class="body">
      <p class="q">学年を選んでください</p>
      <div class="opt">小学1〜3年</div>
      <div class="opt">小学4〜6年</div>
      <div class="opt">中学生</div>
    </div>
    <div class="foot">
      <span class="btn ghost">戻る</span>
      <span class="btn">次へ</span>
    </div>
  </div>
);

// The same flow after the change: everything on one page, opened as you go.
const PhoneAccordion = () => (
  <div class="phone">
    <div class="bar">
      <span>無料体験授業</span>
      <b>1 / 1</b>
    </div>
    <div class="body">
      <div class="acc open">
        <span>学年</span>
        <em>小学4年</em>
      </div>
      <div class="acc open">
        <span>教科</span>
        <em>算数</em>
      </div>
      <div class="acc open">
        <span>単元</span>
        <em>分数</em>
      </div>
      <div class="acc">
        <span>日時</span>
        <em>まだ選んでいない</em>
      </div>
    </div>
    <div class="foot">
      <span class="btn">この内容で予約へ</span>
    </div>
  </div>
);

const Wizard = slide({ path: "wizard" }, ({ update }) => {
  let after = false;
  return () => (
    <Pad>
      <h2>1ページずつが、重かった</h2>
      <Cols ratio="1fr 460px">
        <div class="ui-side">
          <p>6画面を LINE の中でめくる。1画面ごとに待ちが出て、戻るのが面倒になる。</p>
          <button
            class="toggle"
            onClick={() => {
              after = !after;
              update();
            }}
          >
            {after ? "前の UI を見る" : "次の UI を見る"}
          </button>
          <ul>
            <li>{after ? "1ページに、上から順に並べた" : "学年、教科、単元、授業内容、日時、確認"}</li>
            <li>{after ? "決めた項目だけ、開いたまま残る" : "次へを押すたびに、待つ"}</li>
            <li>{after ? "戻るボタンが、要らなくなった" : "途中で抜ける"}</li>
          </ul>
        </div>
        <div class="frame">{after ? PhoneAccordion() : PhoneWizard()}</div>
      </Cols>
    </Pad>
  );
});

const Slots = slide({ path: "slots" }, () => (
  <Pad>
    <h2>枠は埋まっているように見せた</h2>
    <p>人気なものには人が入りやすい。空きの見え方は後から変えた。</p>
    <ul>
      <li>マルバツ三角を、ランダムに置く</li>
      <li>埋まって見える枠を作る</li>
      <li>後から来た要望だった</li>
    </ul>
  </Pad>
));

const Rhf = slide({ path: "rhf" }, () => (
  <Pad>
    <h2>フォームを捨てたら、React と Jotai だけで足りた</h2>
    <p>RHF を外して、状態を自分で持つ形にした。</p>
    <ul>
      <li>画面の状態は Jotai に集める</li>
      <li>入力は素の React で扱う</li>
      <li>依存が減って直しやすくなった</li>
    </ul>
  </Pad>
));

const Q4 = slide({ path: "q4" }, () => (
  <Center class="crosshead">
    <h2>2回目のユーザーが来たら？</h2>
  </Center>
));

const States = slide({ path: "states" }, () => (
  <Pad>
    <h2>状態が8つになった</h2>
    <div class="chips">
      <div class="row">
        <span class="label">いつ</span>
        <span class="chip">予約の前</span>
        <span class="chip">予約のあと</span>
        <span class="chip">受講のあと</span>
      </div>
      <div class="row">
        <span class="label">何回目</span>
        <span class="chip">1回目</span>
        <span class="chip">2回目</span>
      </div>
      <div class="row">
        <span class="label">次に</span>
        <span class="chip">受ける</span>
        <span class="chip">受けない</span>
      </div>
    </div>
    <p class="note">組み合わせで8つ。もう、頭では追えない。</p>
  </Pad>
));

const Xstate = slide({ path: "xstate" }, () => (
  <Pad>
    <h2>分岐だけ XState。遷移を表で持つ</h2>
    <table>
      <thead>
        <tr>
          <th>いま</th>
          <th>きっかけ</th>
          <th>次</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>予約前</td>
          <td>予約する</td>
          <td>予約済み</td>
        </tr>
        <tr>
          <td>予約済み</td>
          <td>開始時刻</td>
          <td>受講中</td>
        </tr>
        <tr>
          <td>受講中</td>
          <td>終了</td>
          <td>受講後</td>
        </tr>
        <tr>
          <td>受講後</td>
          <td>2回目を申す</td>
          <td>2回目予約済み</td>
        </tr>
      </tbody>
    </table>
    <p class="note">表に無い遷移は起こらない。</p>
  </Pad>
));

const Quality = slide({ path: "quality" }, () => (
  <Pad>
    <h2>Vitest、Knip、React Doctor。後から足した</h2>
    <p>Biome の Lint と Typecheck だけでは、足りなかった。</p>
    <ul>
      <li>Vitest でロジックを Unit 中心に</li>
      <li>Knip で使っていないコードを落とす</li>
      <li>React Doctor で描画の無駄を見る</li>
    </ul>
  </Pad>
));

const Q5 = slide({ path: "q5" }, () => (
  <Center class="crosshead">
    <h2>で、本当に10分になったの？</h2>
  </Center>
));

const Result = slide({ path: "result" }, () => (
  <Center>
    <h2>2日 → 10分。消えたのは往復の待ち時間</h2>
    <div class="big">
      <b>2日</b>
      <span>→</span>
      <b>10分</b>
    </div>
  </Center>
));

const Rearch = slide({ path: "rearchitecture" }, () => (
  <Pad>
    <h2>1年かけて、責務を分けた</h2>
    <p>結局やっていたのはこれだった。</p>
    <ul>
      <li>副作用（DB・外部API・画面）は外へ</li>
      <li>入力に対する出力だけを中に残す</li>
      <li>XState も Firebase も、RHF を外したのも同じ</li>
    </ul>
  </Pad>
));

const Lessons = slide({ path: "lessons" }, () => (
  <Pad>
    <h2>効いたこと3つ</h2>
    <ul>
      <Step>
        <li>要件を設計の理由として残す</li>
      </Step>
      <Step>
        <li>増やす前に減らす</li>
      </Step>
      <Step>
        <li>分岐は表にする</li>
      </Step>
    </ul>
  </Pad>
));

const End = slide({ path: "end" }, () => (
  <Center class="cover">
    <h2>ありがとうございました</h2>
    <p class="lead">Easy Easy「完全に理解した Talk」</p>
    <p class="meta">easy2.connpass.com</p>
  </Center>
));

// The order here is the order they are shown in.
deck([
  Cover,
  About,
  Q1,
  Before,
  Half,
  Req,
  Arch,
  Scope,
  V1,
  Q2,
  World,
  Sheet,
  Publish,
  Patch,
  PatchSteps,
  Firebase,
  Simulive,
  Q3,
  Wizard,
  Slots,
  Rhf,
  Q4,
  States,
  Xstate,
  Quality,
  Q5,
  Result,
  Rearch,
  Lessons,
  End,
]);
