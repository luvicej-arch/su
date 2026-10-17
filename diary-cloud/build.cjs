const fs=require('node:fs');fs.mkdirSync('dist',{recursive:true});fs.cpSync('public','dist',{recursive:true});
require('esbuild').buildSync({entryPoints:['app.js'],outfile:'dist/app.bundle.js',bundle:true,minify:true,target:'es2022',define:{__DIARY_EMULATORS__:'false'}});
