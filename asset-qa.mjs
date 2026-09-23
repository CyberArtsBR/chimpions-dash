import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {TYPES} from './dist/engine.js';

const root=process.cwd(),assetRoot=path.join(root,'dist','assets');
const exists=p=>fs.existsSync(path.join(root,p));
function pngInfo(rel){
 const file=path.join(root,rel),b=fs.readFileSync(file);
 assert(b.length>=33,`${rel}: truncated PNG`);
 assert(b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),`${rel}: invalid PNG signature`);
 assert.equal(b.subarray(12,16).toString('ascii'),'IHDR',`${rel}: missing IHDR`);
 const width=b.readUInt32BE(16),height=b.readUInt32BE(20),bitDepth=b[24],colorType=b[25];
 assert(width>=16&&height>=12,`${rel}: suspiciously small ${width}x${height}`);
 assert(width<=4096&&height<=4096,`${rel}: excessive dimensions ${width}x${height}`);
 const alphaCapable=colorType===4||colorType===6||b.includes(Buffer.from('tRNS'));
 assert(alphaCapable,`${rel}: gameplay sprite/ground must support transparency`);
 return{width,height,bytes:b.length,bitDepth,colorType};
}
function requireFile(rel,minBytes=1){
 const file=path.join(root,rel);
 assert(fs.existsSync(file),`Missing required asset: ${rel}`);
 const size=fs.statSync(file).size;
 assert(size>=minBytes,`${rel}: suspicious file size ${size}`);
 return size;
}

const spriteIds=new Set(TYPES.map(t=>t.id==='log-pile'?'log':t.id));
for(const id of ['banana','golden'])spriteIds.add(id);
const spriteInfo={};
for(const id of [...spriteIds].sort()){
 const rel=`dist/assets/sprites-clean/${id}.png`;
 requireFile(rel,2048);
 spriteInfo[id]=pngInfo(rel);
}
for(const rel of ['dist/assets/ground-green.png','dist/assets/ufo-claw.png']){requireFile(rel,8192);pngInfo(rel)}
for(const rel of ['dist/assets/body-atlas.webp','dist/assets/jungle-v2.webp','dist/assets/pixel.ttf'])requireFile(rel,4096);
const musicBytes=requireFile('dist/assets/chimpions-army.mp3',250000);
assert(musicBytes<12*1024*1024,'Background music is too large for a lightweight browser game');

const APPROVED=[{"id":"12","name":"The Archon","image":"assets/chimp-12.webp"},{"id":"95","name":"The Heretic","image":"assets/chimp-95.webp"},{"id":"38","name":"The Commodore","image":"assets/chimp-38.webp"},{"id":"158","name":"The Pioneer","image":"assets/chimp-158.webp"},{"id":"166","name":"The Punk","image":"assets/chimp-166.webp"},{"id":"193","name":"The Street Fighter","image":"assets/chimp-193.webp"},{"id":"26","name":"The Bosun","image":"assets/chimp-26.webp"},{"id":"3","name":"The Adolescent","image":"assets/chimp-3.webp"},{"id":"9","name":"The Angsty","image":"assets/chimp-9.webp"},{"id":"11","name":"The Apologetic","image":"assets/chimp-11.webp"}];
const collection=JSON.parse(fs.readFileSync(path.join(root,'dist','collection.json'),'utf8'));
assert.equal(collection.length,10,'Collection should contain exactly 10 built-in Chimpions');
assert.deepEqual(collection.map(({id,name,image})=>({id,name,image})),APPROVED,'Collection must match the authoritative 10-character roster and order');
assert.equal(new Set(collection.map(x=>x.id)).size,10,'Chimpion IDs must be unique');
for(const c of collection){
 assert(typeof c.name==='string'&&c.name.length>0,`Bad collection name for ${c.id}`);
 assert(/^assets\/chimp-\d+\.webp$/.test(c.image),`Unexpected collection image path: ${c.image}`);
 assert(exists('dist/'+c.image),`Missing portrait: ${c.image}`);
}
const portraitFiles=fs.readdirSync(assetRoot).filter(x=>/^chimp-\d+\.webp$/.test(x)).sort();
const expectedPortraits=APPROVED.map(x=>path.basename(x.image)).sort();
assert.deepEqual(portraitFiles,expectedPortraits,'Only the 10 approved root portrait assets may ship');
const legacyHeads=path.join(assetRoot,'heads');
if(fs.existsSync(legacyHeads))assert.equal(fs.readdirSync(legacyHeads).filter(x=>/^chimp-\d+\.webp$/.test(x)).length,0,'Unused legacy head portraits must not ship');
function filesUnder(dir){const out=[];for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,ent.name);if(ent.isDirectory())out.push(...filesUnder(full));else out.push(full)}return out}
assert.equal(filesUnder(path.join(root,'dist')).filter(x=>x.toLowerCase().endsWith('.glb')).length,0,'Dash must remain a 2D build with no tracked GLB runtime assets');
const runtimeText=['dist/app.js','dist/render.js','dist/index.html'].map(rel=>fs.readFileSync(path.join(root,rel),'utf8')).join('\n');
assert(!/from\s+['\"]three['\"]|three\.module|THREE\./.test(runtimeText),'Dash must not add a Three.js/3D runtime dependency');

const render=fs.readFileSync(path.join(root,'dist','render.js'),'utf8');
for(const token of ['assets/ufo-claw.png','assets/ground-green.png','assets/sprites-clean/']){
 assert(render.includes(token),`Renderer lost required asset contract: ${token}`);
}
assert(render.includes("o.id==='log-pile'"),'Renderer must special-case the long-jump log pile instead of stretching one log');

console.log(`PASS ASSETS: ${spriteIds.size} gameplay sprites, transparent ground/UFO, exact 10-character portrait roster, no legacy head portraits/GLBs/Three.js runtime, music and renderer asset contracts verified`);
