import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const site=path.join(root,'site');
// Reuse only this explicit disposable build destination. Never traverse parent projects.
fs.mkdirSync(site,{recursive:true});
for(const name of ['index.html','404.html','.nojekyll'])fs.copyFileSync(path.join(root,name),path.join(site,name));
fs.cpSync(path.join(root,'assets'),path.join(site,'assets'),{recursive:true});
console.log('Packaged only index.html, 404.html, .nojekyll and assets/ into site/.');
