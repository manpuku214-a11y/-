# ゲーム箱

ブラウザで遊べる小さなゲーム集．

| フォルダ | ゲーム |
|---|---|
| `lighthouse/` | 灯台守の夜：灯台の光で船を導くアクション |
| `rosenzu/` | ちいさな私鉄の路線図：線路を敷いて乗客を運ぶパズル |
| `joseki/` | 定跡なぞり：将棋の定跡19本と手筋51問 |

## オフライン版（GitHub Pages）

`docs/` は GitHub Pages 用のファイル一式で，一度開けばオフラインでも遊べる．
ゲームを直したら `node tools/build-pages.js` を実行して `docs/` を作り直す．
（将棋のデータを変えた時は，先に `node joseki/src/build.js` を実行する．）
