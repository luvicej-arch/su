const fs = require('node:fs');
const path = require('node:path');
const source = path.resolve(__dirname, '../classroom-hub');
const target = path.resolve(__dirname, '../pages-dist');
fs.mkdirSync(target, { recursive: true });
for (const file of ['index.html','styles.css','hub.js','apps.js','timer.html','timer.js','pdf-count.html','pdf-count.css','pdf-count.js','pdf-metrics.mjs']) {
  fs.copyFileSync(path.join(source, file), path.join(target, file));
}
fs.cpSync(path.join(source, 'vendor'), path.join(target, 'vendor'), { recursive: true });
fs.writeFileSync(path.join(target, '.nojekyll'), '');
