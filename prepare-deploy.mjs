import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd(),src=path.join(root,'dist'),out=path.join(root,'site');
const fullSha=process.env.GITHUB_SHA||'local-dev',version=fullSha.slice(0,12);
fs.rmSync(out,{recursive:true,force:true});
fs.cpSync(src,out,{recursive:true});

function edit(rel,fn){
 const file=path.join(out,rel),before=fs.readFileSync(file,'utf8'),after=fn(before);
 if(after===before)throw new Error(`prepare-deploy: expected rewrite did not occur in ${rel}`);
 fs.writeFileSync(file,after);
}

edit('index.html',s=>s
 .replace('href="style.css"','href="style.css?v='+version+'"')
 .replace('src="app.js"','src="app.js?v='+version+'"'));

edit('app.js',s=>s
 .replace("from './engine.js'","from './engine.js?v="+version+"'")
 .replace("from './audio.js'","from './audio.js?v="+version+"'")
 .replace("from './render.js'","from './render.js?v="+version+"'")
 .replace("fetch('collection.json'","fetch('collection.json?v="+version+"'"));

edit('render.js',s=>{
 let x=s
  .replace("from './engine.js'","from './engine.js?v="+version+"'")
  .replace("from './sprites.js'","from './sprites.js?v="+version+"'");
 x=x.replace("const images=new Map();let onLoad=()=>{};","const BUILD_VERSION='"+version+"';\nconst images=new Map();let onLoad=()=>{};");
 x=x.replace("im.src=src;return im}","im.src=src.startsWith('data:')?src:src+(src.includes('?')?'&':'?')+'v='+BUILD_VERSION;return im}");
 return x
});

edit('audio.js',s=>s.replace(
 "this.musicSrc='assets/chimpions-army.mp3'",
 "this.musicSrc='assets/chimpions-army.mp3?v="+version+"'"
));

edit('style.css',s=>s.replace("url('assets/pixel.ttf')","url('assets/pixel.ttf?v="+version+"')"));

fs.writeFileSync(path.join(out,'build.json'),JSON.stringify({sha:fullSha,version,generatedAt:new Date().toISOString()},null,2)+'\n');
console.log(`Prepared cache-busted Pages build ${version} in site/`);
