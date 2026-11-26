// node tools/build-pages.js で docs/ に GitHub Pages 用のファイルを作る．
// 各ゲームの index.html（Artifact 用に <head> を省いた形）を完全な HTML で包み，
// オフラインで動くように Service Worker とアプリ設定（manifest）を付ける．
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const docs = path.join(root, 'docs');
fs.mkdirSync(docs, { recursive: true });

const GAMES = [
  { file: 'lighthouse', src: 'lighthouse/index.html', name: '灯台守の夜', desc: '灯台の光で船を導くアクション', color: '#060c18', menu: 'fixed' },
  { file: 'rosenzu', src: 'rosenzu/index.html', name: 'ちいさな私鉄の路線図', desc: '線路を敷いて乗客を運ぶパズル', color: '#e8eef0', menu: 'fixed' },
  { file: 'joseki', src: 'joseki/index.html', name: '定跡なぞり', desc: '将棋の定跡19本と手筋51問', color: '#eceee8', menu: 'static' },
];
const VERSION = Date.now().toString(36);

// Artifact の公開時に付く下地（余白のリセットなど）と同じもの
const BASE_CSS = `:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
body{margin:0;font:14px system-ui,-apple-system,"Hiragino Sans","Noto Sans JP",sans-serif}
img{max-width:100%}[hidden]{display:none!important}
.app-menu{font:700 12px system-ui,-apple-system,"Hiragino Sans",sans-serif;color:inherit;text-decoration:none;
 border:1px solid currentColor;border-radius:999px;padding:4px 12px;opacity:.7;background:transparent}
.app-menu.fixed{position:fixed;z-index:50;left:50%;transform:translateX(-50%);top:calc(env(safe-area-inset-top,0px) + 10px)}
.app-menu-bar{display:flex;justify-content:flex-end;padding-top:12px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}`;

function head(title, color) {
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="${color}">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="ゲーム箱">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icon-180.png">
<link rel="icon" href="icon-192.png">
<style>${BASE_CSS}</style>
`;
}
const register = `<script>if('serviceWorker' in navigator){addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));}</script>`;

for (const g of GAMES) {
  let src = fs.readFileSync(path.join(root, g.src), 'utf8');
  // <title> と <meta> は head へ，残りは body へ
  const title = (src.match(/<title>[\s\S]*?<\/title>/) || [''])[0];
  src = src.replace(title, '');
  const link = `<a class="app-menu ${g.menu}" href="./">メニュー</a>`;
  const menu = g.menu === 'static' ? `<div class="app-menu-bar">${link}</div>` : link;
  const html = head(g.name, g.color) + title + '\n</head>\n<body>\n' + menu + '\n' + src.trim() + '\n' + register + '\n</body>\n</html>\n';
  fs.writeFileSync(path.join(docs, g.file + '.html'), html);
}

// メニュー（ホーム画面から起動した時の最初の画面）
const menuHtml = head('ゲーム箱', '#141a24') + `<title>ゲーム箱</title>
<style>
:root{--bg:#141a24;--card:#1d2532;--ink:#eef2f7;--muted:#9aa7b8;--line:rgba(238,242,247,.14);--accent:#ffd27a;color-scheme:dark}
body{background:var(--bg);color:var(--ink);font-family:"Hiragino Sans","Noto Sans JP",system-ui,sans-serif}
main{max-width:560px;margin:0 auto;padding-block:32px 40px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));display:flex;flex-direction:column;gap:20px}
h1{margin:0;font-size:32px;letter-spacing:.04em}
p{margin:0;color:var(--muted);line-height:1.7}
.list{display:grid;gap:10px}
a.g{display:flex;flex-direction:column;gap:4px;text-decoration:none;color:inherit;background:var(--card);border:1px solid var(--line);border-radius:8px;padding:16px 18px}
a.g:active{border-color:var(--accent)}
a.g b{font-size:18px}
a.g span{font-size:13px;color:var(--muted)}
a.g:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.status{font-size:12px}
</style>
</head>
<body>
<main>
  <h1>ゲーム箱</h1>
  <p>遊びたいゲームを選んでください．一度ネットにつながった状態で開けば，次からは電波がなくても遊べます．</p>
  <div class="list">
${GAMES.map(g => `    <a class="g" href="${g.file}.html"><b>${g.name}</b><span>${g.desc}</span></a>`).join('\n')}
  </div>
  <p class="status" id="status">オフラインの準備を確認しています…</p>
</main>
<script>
const st=document.getElementById('status');
if(!('serviceWorker' in navigator)){st.textContent='このブラウザはオフライン保存に対応していません．';}
else{navigator.serviceWorker.register('sw.js').then(()=>navigator.serviceWorker.ready).then(()=>{st.textContent='オフラインでも遊べる状態です．';}).catch(()=>{st.textContent='オフラインの準備に失敗しました．ネットにつながった状態で開き直してください．';});}
</script>
</body>
</html>
`;
fs.writeFileSync(path.join(docs, 'index.html'), menuHtml);

const manifest = {
  name: 'ゲーム箱', short_name: 'ゲーム箱', start_url: './', scope: './', display: 'standalone',
  background_color: '#141a24', theme_color: '#141a24', lang: 'ja',
  icons: [
    { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
  ],
};
fs.writeFileSync(path.join(docs, 'manifest.webmanifest'), JSON.stringify(manifest, null, 2));

const files = ['./', 'index.html', ...GAMES.map(g => g.file + '.html'), 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png'];
const sw = `// オフライン用：最初に全ファイルを保存し，以後は保存したものを使う
const CACHE = 'game-box-${VERSION}';
const FILES = ${JSON.stringify(files)};
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // 自分のファイル：保存済みを優先（ネットにつながれば裏で更新）
  if (url.origin === location.origin) {
    e.respondWith(caches.open(CACHE).then(async c => {
      const hit = await c.match(req, { ignoreSearch: true });
      const net = fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => null);
      return hit || (await net) || c.match('index.html');
    }));
    return;
  }
  // 書体（Google Fonts）：一度読めたものを保存して使う
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(CACHE).then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      try { const r = await fetch(req); c.put(req, r.clone()); return r; } catch (err) { return new Response('', { status: 504 }); }
    }));
  }
});
`;
fs.writeFileSync(path.join(docs, 'sw.js'), sw);
fs.writeFileSync(path.join(docs, '.nojekyll'), '');
console.log('docs/ を作りました:', fs.readdirSync(docs).join(' '));
