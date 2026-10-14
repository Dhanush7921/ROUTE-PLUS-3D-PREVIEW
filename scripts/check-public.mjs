import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const forbiddenDirs=new Set(['backend','server','database','databases','node_modules','uploads','user-data']);
const forbiddenFile=/^(?:\.env(?:\..*)?|credentials.*|id_rsa|id_ed25519)$|\.(?:db|sqlite|sqlite3|sql|pem|key|p12|pfx)$/i;
const secretPatterns=[/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,/\bgh[pousr]_[A-Za-z0-9]{30,}\b/,/\bgithub_pat_[A-Za-z0-9_]{40,}\b/,/\bAIza[A-Za-z0-9_-]{30,}\b/,/\bsk-[A-Za-z0-9_-]{30,}\b/,/\bAKIA[0-9A-Z]{16}\b/];
const problems=[];let count=0;
function walk(dir){
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  const p=path.join(dir,entry.name),rel=path.relative(root,p);
  if(['.git','site'].includes(entry.name)&&entry.isDirectory())continue;
  if(entry.isSymbolicLink()){problems.push(`${rel}: symlinks are not allowed`);continue;}
  if(entry.isDirectory()){if(forbiddenDirs.has(entry.name.toLowerCase()))problems.push(`${rel}: prohibited directory`);else walk(p);continue;}
  count++;
  if(forbiddenFile.test(entry.name))problems.push(`${rel}: prohibited file`);
  if(!/\.(?:jpg|jpeg|png|webp|woff2)$/i.test(entry.name)){
   const text=fs.readFileSync(p,'utf8');
   if(secretPatterns.some(pattern=>pattern.test(text)))problems.push(`${rel}: possible credential`);
  }
 }
}
walk(root);
if(problems.length){console.error(problems.join('\n'));process.exit(1);}
console.log(`PASS: ${count} files checked for prohibited paths and common credential patterns. No findings.`);
