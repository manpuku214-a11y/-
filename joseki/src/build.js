// node joseki/src/build.js で index.html を作り直す
const fs = require('fs'), path = require('path');
const r = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
const indent = s => s.split('\n').map(l => l ? '  ' + l : l).join('\n');
const out = r('head.css.html') + r('body.html')
  .replace('/*ENGINE*/', () => indent(r('engine.js').trim()))
  .replace('/*DATA*/', () => indent(r('data.js').trim()));
fs.writeFileSync(path.join(__dirname, '..', 'index.html'), out);
console.log('built', out.length, 'bytes');
