const fs = require('node:fs');
const path = require('node:path');
const source = path.resolve(__dirname, '../classroom-hub');
const target = path.resolve(__dirname, '../pages-dist');
fs.mkdirSync(target, { recursive: true });
for (const file of ['index.html','styles.css','hub.js','apps.js','timer.html','timer.js','pdf-count.html','pdf-count.css','pdf-count.js','pdf-metrics.mjs']) {
  fs.copyFileSync(path.join(source, file), path.join(target, file));
}
fs.cpSync(path.join(source, 'vendor'), path.join(target, 'vendor'), { recursive: true });
// Version scripts/styles so existing browsers receive updated hub links after deploys.
const crypto = require('node:crypto');
for (const file of fs.readdirSync(target).filter(name => name.endsWith('.html'))) {
  const html = fs.readFileSync(path.join(target, file), 'utf8').replace(/\b(src|href)="([^"?]+\.(?:js|mjs|css))"/g, (match, attr, asset) => {
    const assetPath = path.resolve(target, asset);
    if (!assetPath.startsWith(target + path.sep) || !fs.existsSync(assetPath)) return match;
    const version = crypto.createHash('sha256').update(fs.readFileSync(assetPath)).digest('hex').slice(0, 12);
    return `${attr}="${asset}?v=${version}"`;
  });
  fs.writeFileSync(path.join(target, file), html);
}
fs.writeFileSync(path.join(target, '.nojekyll'), '');
