#!/usr/bin/env python3
"""スライド原稿のうち、書き換えたスライドだけに「機械が書いた文」の型を当てる。

デッキ全体へ当てると、話し手が自分で書いた既存のスライドまで大量に引っかかり、検査が使われなくなる。
そこで git の HEAD 版と比べ、変わったスライドだけを見る。新しく書いた文に毎回当たるので、
「指摘された箇所は直したが、新しく書き足した文で同じ型が再発する」を止められる。

    python3 tools/check-ai-smell.py                    # src 配下の *.tsx を、HEAD から変わったスライドだけ
    python3 tools/check-ai-smell.py src/index.tsx      # ファイルを指定する
    python3 tools/check-ai-smell.py --all              # 全スライド（新しいデッキ用）

スライドは `const Name = slide(` で区切る。見出しは <h1>〜<h3>、箇条書きは <li> を読む。
NG が1件でもあれば終了コード1を返す。
"""
import re
import subprocess
import sys
from pathlib import Path

# (名前, 正規表現, 直し方, 見出しだけに当てるか)
PATTERNS = [
    ("キメ構文", r"のは、|のが、", "「〜のは◯◯です」。主語を先頭へ戻して普通の文にする", False),
    ("決め台詞", r"これが[^。]{0,20}です|それが[^。]{0,20}です", "「これが〜です」。抽象名詞で包み直さず、具体のまま終える", False),
    ("過大な効能", r"だけで[^。]{0,20}ます|やすくなります|やすくなる", "「これだけで〜できます」型。具体的な結果に置き換える", False),
    ("終助詞", r"ですよね|ますよね|でしょうね", "地の文に終助詞を置かない", False),
    ("見出しの読点タメ", r".{1,18}は、", "見出しを「〜は、〜」でためない。読点を外すか普通の一文にする", True),
    ("ダッシュ", r"—|──|―", "使わない。読点か文の分割にする", False),
    ("定番の誇張語", r"一気に|驚くほど|劇的に|目に見えて|一撃で|腑に落ち", "平明な語に言い換える", False),
]

SLIDE = re.compile(r"^const\s+(\w+)\s*=\s*slide\(", re.M)
TAG = re.compile(r"<[^>]*>")
VOID = {"br", "img", "input", "hr", "meta", "link", "source", "path", "rect", "circle", "line"}


def slides(src):
    marks = [(m.start(), m.group(1)) for m in SLIDE.finditer(src)]
    out = []
    for i, (pos, name) in enumerate(marks):
        end = marks[i + 1][0] if i + 1 < len(marks) else len(src)
        out.append((name, src[pos:end]))
    return out


def clean(text):
    text = re.sub(r"\{[^{}]*\}", "", text)
    text = text.replace("&nbsp;", " ").replace("&amp;", "&")
    return re.sub(r"\s+", " ", text).strip()


def visible(block):
    """JSX のタグを落として、画面に出る文字だけを (種類, 文字列) で返す。"""
    block = re.sub(r"<style[^>]*>.*?</style>", "", block, flags=re.S)
    block = re.sub(r"\{/\*.*?\*/\}", "", block, flags=re.S)
    out = []
    stack = []
    pos = 0
    for m in TAG.finditer(block):
        chunk = block[pos:m.start()]
        pos = m.end()
        tag = m.group(0)
        name = re.match(r"</?\s*([a-zA-Z][\w-]*)", tag)
        name = name.group(1).lower() if name else ""
        closing = tag.startswith("</")
        self_closing = tag.rstrip().endswith("/>") or name in VOID
        hidden = bool(stack) and stack[-1] in ("style", "script")
        if chunk.strip() and not hidden:
            text = clean(chunk)
            if text:
                kind = "h" if stack and stack[-1] in ("h1", "h2", "h3") else \
                       "li" if "li" in stack else "p" if "p" in stack else "other"
                out.append((kind, text))
        if closing:
            if name in stack:
                stack.reverse()
                stack.remove(name)
                stack.reverse()
        elif not self_closing and name:
            stack.append(name)
    return out


def bullet_monotony(lines):
    """箇条書きが3行以上続き、全部に読点が入っていたら型の反復とみなす。"""
    run = []
    for ln in lines:
        if ln.startswith("- "):
            run.append(ln)
        else:
            if len(run) >= 3 and all("、" in x for x in run):
                return run
            run = []
    if len(run) >= 3 and all("、" in x for x in run):
        return run
    return None


def head_version(path):
    repo = subprocess.run(["git", "rev-parse", "--show-toplevel"], capture_output=True,
                          text=True, cwd=path.resolve().parent).stdout.strip()
    if not repo:
        return None
    rel = path.resolve().relative_to(repo).as_posix()
    old = subprocess.run(["git", "show", f"HEAD:{rel}"], capture_output=True, text=True, cwd=repo)
    return old.stdout if old.returncode == 0 else None


def check(path, check_all):
    now = slides(path.read_text(encoding="utf-8-sig"))
    before = None
    if not check_all:
        old = head_version(path)
        if old is not None:
            before = {name: visible(block) for name, block in slides(old)}
        else:
            print(f"{path}: git の HEAD に無いファイルなので、全スライドを見る")

    ng = 0
    scanned = 0
    for name, block in now:
        lines = visible(block)
        if before is not None and before.get(name) == lines:
            continue
        scanned += 1
        body = [t for kind, t in lines if kind in ("p", "other")]
        bullets = ["- " + t for kind, t in lines if kind == "li"]

        for kind, text in lines:
            if kind == "li":
                text = "- " + text
            for label, pat, fix, heading_only in PATTERNS:
                if heading_only and kind != "h":
                    continue
                if re.search(pat, text):
                    print(f"NG {path.name} [{name}] [{label}] {text[:60]}\n      → {fix}")
                    ng += 1

        # 箇条書きの項目全体が太字の見出しになっている型
        for item in re.findall(r"<li[^>]*>\s*<strong>", block):
            print(f"NG {path.name} [{name}] [行頭の太字ラベル] 箇条書きが太字の見出しで始まる\n"
                  f"      → 箇条書きごと地の文へ戻す")
            ng += 1
            break

        flat = body + bullets
        # 短く言い切って、次の文を指示語で受ける「タメ」
        for j in range(len(flat) - 1):
            cur, nxt = flat[j].strip(), flat[j + 1].strip()
            if re.search(r"[うくすつぬむるい]。$", cur) and len(cur) <= 26 \
               and re.match(r"^(そういう|こういう|そんな|こんな|これ|それ|その)", nxt):
                print(f"NG {path.name} [{name}] [言い切りのタメ] {cur} → {nxt[:24]}\n"
                      f"      → 1文につなげる。短く切って次の文を指示語で受けない")
                ng += 1

        cond = [ln for ln in flat if re.search(r"(と|ば|たら|なら|ので|ため|して)、", ln)]
        if len(cond) >= 3:
            print(f"NG {path.name} [{name}] [型の反復] 「条件＋読点＋帰結」の文が{len(cond)}つ\n"
                  f"      → 言い切り・体言止め・問いかけを混ぜる: "
                  + " / ".join(x.strip()[:22] for x in cond[:3]))
            ng += 1

        run = bullet_monotony(bullets)
        if run:
            print(f"NG {path.name} [{name}] [型の反復] 箇条書き{len(run)}行が全部「〜、〜」で同じ拍\n"
                  f"      → 1行は読点なしにするなど、形を混ぜる")
            ng += 1
    return scanned, ng


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    check_all = "--all" in sys.argv
    paths = [Path(a) for a in args]
    if not paths:
        paths = sorted(Path("src").rglob("*.tsx"))
    if not paths:
        print(__doc__)
        return 2

    scanned = ng = 0
    for path in paths:
        s, n = check(path, check_all)
        scanned += s
        ng += n
    print(f"\n{scanned} スライド走査、NG {ng} 件" if ng else
          f"\nOK: {scanned} スライド走査、型は見つからなかった")
    return 1 if ng else 0


if __name__ == "__main__":
    sys.exit(main())
