import { mount, register } from "pele/core";
import flowchart from "pele/diagrams/flowchart";
import sequence from "pele/diagrams/sequence";
import type { Plugin } from "suraido.js";

// 使う図の種類だけを登録する。全部入りの `pele` を読み込むと、バンドルが 700KB を超える。
register(flowchart, sequence);

/**
 * Mermaid の図を、スライドの中の DOM に描く。
 *
 * スライドはこう書く（source は data-mermaid に置く）:
 *
 *   <div class="diagram" data-mermaid={flow}></div>
 *
 * Pele は要素の中身を SVG に置き換えるので、source は属性に残す。
 * 描いた印（data-drawn）を付けて、同じスライドに戻ってきたときの二重描画を防ぐ。
 */
export const mermaid: Plugin = (deck) => {
  // 描いた図は Mounted を返し、コンテナの幅を見張る。スライドを離れたら destroy() で止める。
  const live: ReturnType<typeof mount>[] = [];

  const clear = () => {
    for (const diagram of live.splice(0)) diagram.destroy();
  };

  const draw = () => {
    for (const host of document.querySelectorAll<HTMLElement>(".stage .diagram[data-mermaid]")) {
      if (host.dataset.drawn === "1") continue;
      const source = host.dataset.mermaid ?? "";
      if (!source.trim()) continue;
      host.dataset.drawn = "1";
      try {
        live.push(mount(host, source, { fontSize: Number(host.dataset.font ?? 36), padding: 8, zoom: false }));
      } catch (error) {
        host.textContent = `図を描けませんでした: ${String(error)}`;
      }
    }
  };

  const soon = () => requestAnimationFrame(draw);

  // スライドが替わるたびに、前の図の見張りを止めてから、まだ描いていない図を描く
  const stop = deck.on("move", () => {
    clear();
    soon();
  });
  soon();

  return () => {
    stop();
    clear();
  };
};
