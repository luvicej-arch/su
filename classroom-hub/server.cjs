// 로컬 개발 전용. 외부 네트워크에 공개하지 않습니다.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const port = Number(process.env.PORT || 4173);
const { DatabaseSync } = require('node:sqlite');
fs.mkdirSync(path.join(root, 'data'), { recursive: true });
const db = new DatabaseSync(path.join(root, 'data', 'diary.sqlite'));
db.exec('CREATE TABLE IF NOT EXISTS entries (id TEXT PRIMARY KEY, date TEXT NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL, mood TEXT NOT NULL, updated TEXT NOT NULL)');
function json(res, status, value) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(value)); }
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.bcmap': 'application/octet-stream', '.pfb': 'application/octet-stream', '.ttf': 'font/ttf', '.wasm': 'application/wasm' };
http.createServer((req, res) => {
  let name;
  try { name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { res.writeHead(400).end(); return; }
  if (name === '/api/diary' || name.startsWith('/api/diary/')) {
    if (req.headers.host !== `127.0.0.1:${port}` && req.headers.host !== `localhost:${port}`) return json(res, 403, { error: '허용되지 않은 주소입니다.' });
    if (req.headers.origin && ![`http://127.0.0.1:${port}`, `http://localhost:${port}`].includes(req.headers.origin)) return json(res, 403, { error: '허용되지 않은 요청입니다.' });
    const id = name.startsWith('/api/diary/') ? name.slice(11) : null;
    if (req.method === 'GET' && !id) return json(res, 200, db.prepare('SELECT * FROM entries ORDER BY date DESC, updated DESC').all());
    if (req.method === 'DELETE' && id) { const result = db.prepare('DELETE FROM entries WHERE id = ?').run(id); return json(res, result.changes ? 200 : 404, { ok: !!result.changes }); }
    if ((req.method === 'POST' && !id) || (req.method === 'PUT' && id)) {
      if (!req.headers['content-type']?.startsWith('application/json')) return json(res, 415, { error: 'JSON 요청만 허용합니다.' });
      let body = ''; let size = 0;
      req.on('data', chunk => { size += chunk.length; if (size > 300000) req.destroy(); else body += chunk; });
      req.on('end', () => {
        try {
          const e = JSON.parse(body);
          if (typeof e.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(e.date) || !Number.isFinite(Date.parse(e.date)) || typeof e.title !== 'string' || !e.title.trim() || e.title.length > 120 || typeof e.body !== 'string' || !e.body.trim() || e.body.length > 50000 || !['😊','😌','😐','😔','😤'].includes(e.mood)) return json(res, 400, { error: '날짜, 제목, 내용과 기분을 확인해주세요.' });
          const entry = { id: id || require('node:crypto').randomUUID(), date: e.date, title: e.title.trim(), body: e.body, mood: e.mood, updated: new Date().toISOString() };
          if (id) { const r = db.prepare('UPDATE entries SET date=?, title=?, body=?, mood=?, updated=? WHERE id=?').run(entry.date, entry.title, entry.body, entry.mood, entry.updated, id); if (!r.changes) return json(res, 404, { error: '일기를 찾을 수 없습니다.' }); }
          else db.prepare('INSERT INTO entries VALUES (?,?,?,?,?,?)').run(entry.id, entry.date, entry.title, entry.body, entry.mood, entry.updated);
          json(res, 200, entry);
        } catch (error) { json(res, error instanceof SyntaxError ? 400 : 500, { error: '저장하지 못했습니다. 입력 또는 저장 폴더를 확인해주세요.' }); }
      });
      return;
    }
    return json(res, 405, { error: '지원하지 않는 요청입니다.' });
  }
  if (name === '/') name = '/index.html';
  const file = path.resolve(root, '.' + name);
  if (!file.startsWith(root + path.sep) || !types[path.extname(file)]) { res.writeHead(404).end('Not found'); return; }
  fs.readFile(file, (err, body) => {
    if (err) { res.writeHead(404).end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)], 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(body);
  });
}).listen(port, '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${port}`));
