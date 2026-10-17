const fs = require('node:fs');
fs.mkdirSync('dist', { recursive: true });
fs.cpSync('public', 'dist', { recursive: true });
require('esbuild').buildSync({ entryPoints: ['auth.js'], outfile: 'dist/auth.bundle.js', bundle: true, minify: true, target: 'es2022' });
