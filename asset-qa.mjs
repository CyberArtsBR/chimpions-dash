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

const collection=JSON.parse(fs.readFileSync(path.join(root,'dist','collection.json'),'utf8'));
assert.equal(collection.length,221,'Collection should contain 221 Chimpions');
assert.equal(new Set(collection.map(x=>x.id)).size,221,'Chimpion IDs must be unique');
for(const c of collection){
 assert(typeof c.name==='string'&&c.name.length>0,`Bad collection name for ${c.id}`);
 assert(/^assets\/chimp-\d+\.webp$/.test(c.image),`Unexpected collection image path: ${c.image}`);
 assert(exists('dist/'+c.image),`Missing portrait: ${c.image}`);
}

const render=fs.readFileSync(path.join(root,'dist','render.js'),'utf8');
for(const token of ['assets/ufo-claw.png','assets/ground-green.png','assets/sprites-clean/']){
 assert(render.includes(token),`Renderer lost required asset contract: ${token}`);
}
assert(render.includes("o.id==='log-pile'"),'Renderer must special-case the long-jump log pile instead of stretching one log');

console.log(`PASS ASSETS: ${spriteIds.size} gameplay sprites, transparent ground/UFO, 221 portraits, music and renderer asset contracts verified`);
