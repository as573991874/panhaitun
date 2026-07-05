const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');

Menu.setApplicationMenu(null);

const root = path.join(__dirname);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg'
};
const dec = s => s.replace(/%([0-9A-Fa-f]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));

let server = null;
let resizing = false;

function startServer() {
  return new Promise((resolve) => {
    server = http.createServer((req, res) => {
      let p = dec(req.url.split('?')[0]);
      if (p === '/') p = '/game/index.html';
      const f = path.normalize(path.join(root, p));
      if (!f.startsWith(root)) { res.writeHead(403); res.end(); return; }
      fs.readFile(f, (e, d) => {
        if (e) { res.writeHead(404); res.end('404'); }
        else {
          res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' });
          res.end(d);
        }
      });
    });
    server.listen(0, '127.0.0.1', () => {
      resolve('http://127.0.0.1:' + server.address().port);
    });
  });
}

function createWindow(url) {
  const display = require('electron').screen.getPrimaryDisplay();
  const { width, height } = display.workAreaSize;
  const scale = Math.min(width / 1920, height / 1080);
  const winW = Math.floor(1920 * scale);
  const winH = Math.floor(1080 * scale);

  const win = new BrowserWindow({
    width: winW,
    height: winH,
    minWidth: 640,
    minHeight: 360,
    resizable: true,
    fullscreen: false,
    frame: true,
    icon: path.join(__dirname, 'assets', 'icon-256.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      devTools: false
    }
  });

  win.loadURL(url);

  win.on('will-resize', (e, newBounds) => {
    if (resizing) return;
    const ratio = 16 / 9;
    const w = newBounds.width;
    const h = newBounds.height;
    const wByH = h * ratio;
    const hByW = w / ratio;
    let targetW, targetH;
    if (Math.abs(w - wByH) < Math.abs(h - hByW)) {
      targetW = Math.round(wByH);
      targetH = h;
    } else {
      targetW = w;
      targetH = Math.round(hByW);
    }
    if (targetW !== w || targetH !== h) {
      resizing = true;
      e.preventDefault();
      setImmediate(() => {
        win.setSize(targetW, targetH);
        resizing = false;
      });
    }
  });
}

app.whenReady().then(async () => {
  const url = await startServer();
  createWindow(url);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow(url);
    }
  });
});

app.on('window-all-closed', () => {
  if (server) { server.close(); server = null; }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});