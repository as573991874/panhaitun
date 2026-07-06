// 开发用零依赖静态服务器：node tools/server.js
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.jpg': 'image/jpeg' };
// 只解码 %XX，不把 + 转空格（URL 路径中 + 是字面量）
const dec = s => s.replace(/%([0-9A-Fa-f]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
http.createServer((req, res) => {
  // 调试：POST /shot 接收 base64 截图落盘
  if (req.method === 'POST' && req.url === '/shot') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      const b64 = body.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync(path.join(__dirname, 'shot.jpg'), Buffer.from(b64, 'base64'));
      res.writeHead(200); res.end('ok');
    });
    return;
  }
  let p = dec(req.url.split('?')[0]);
  if (p === '/') p = '/game/index.html';
  const f = path.normalize(path.join(root, p));
  if (!f.startsWith(root)) { res.writeHead(403); res.end(); return; }
  fs.readFile(f, (e, d) => {
    if (e) { res.writeHead(404); res.end('404'); }
    else { res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); res.end(d); }
  });
}).listen(8137, () => console.log('game dev server: http://localhost:8137'));
