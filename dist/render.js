import {PLAYER_X,BIOMES,playerBox,obstacleBoxes} from './engine.js';
import {SPRITES} from './sprites.js';

const images=new Map();let onLoad=()=>{};
export function asset(src){if(images.has(src))return images.get(src);const im=new Image();images.set(src,im);im.onload=()=>onLoad();im.onerror=()=>{im.failed=true;onLoad()};im.src=src;return im}
const ready=im=>im&&im.complete&&im.naturalWidth&&!im.failed;
const mix=(a,b,t)=>{const A=a.match(/\w\w/g).map(x=>parseInt(x,16)),B=b.match(/\w\w/g).map(x=>parseInt(x,16));return`rgb(${A.map((x,i)=>Math.round(x+(B[i]-x)*t)).join(',')})`};

const PLAYER_VISUAL_DROP=6;
const HAZARD_VISUAL_DROP=6;

export function createRenderer(canvas){
 const ctx=canvas.getContext('2d'),
  jungle=asset('assets/jungle-v2.webp'),
  bodies=asset('assets/body-atlas.webp'),
  objects=asset('assets/obstacles-atlas-recovered.png?v=6');
 let current=null;

 const redraw=()=>current&&draw(...current);onLoad=redraw;

 function tile(im,index,x,y,w,h){
  if(!ready(im)||index<0)return false;
  const frames=im===bodies?SPRITES.body:SPRITES.obstacles,[cx,cy,cw,ch]=frames[index];
  ctx.drawImage(im,cx,cy,cw,ch,x,y,w,h);return true
 }

 function randFactory(seed=0x51f15e){let s=seed>>>0;return()=>{s=Math.imul(s^s>>>15,1|s);s^=s+Math.imul(s^s>>>7,61|s);return((s^s>>>14)>>>0)/4294967296}}
 function makeGroundTile(){
  const c=document.createElement('canvas');c.width=920;c.height=112;
  const g=c.getContext?.('2d');if(!g)return c;
  g.imageSmoothingEnabled=false;
  const rnd=randFactory(0xC11A0);
  const rect=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))};

  // Deep jungle soil: layered, irregular and dark enough to keep gameplay silhouettes readable.
  rect(0,18,920,94,'#0b2419');
  rect(0,23,920,89,'#12331f');
  rect(0,31,920,81,'#173a23');
  rect(0,49,920,63,'#12301e');
  rect(0,78,920,34,'#0b2318');

  // Buried stones, roots and mottled earth.
  for(let i=0;i<145;i++){
   const x=Math.floor(rnd()*920),y=34+Math.floor(rnd()*77),w=2+Math.floor(rnd()*9),h=2+Math.floor(rnd()*5);
   const cols=['#244a2a','#1d4026','#315631','#102b1d','#49603d'];
   rect(x,y,w,h,cols[Math.floor(rnd()*cols.length)]);
  }
  for(let i=0;i<38;i++){
   const x=Math.floor(rnd()*920),y=31+Math.floor(rnd()*55),len=10+Math.floor(rnd()*30);
   const col=rnd()>.55?'#315b2e':'#234827';
   rect(x,y,2,len,col);
   if(rnd()>.45)rect(x-4,y+Math.floor(len*.55),6,2,col);
   if(rnd()>.55)rect(x+1,y+Math.floor(len*.75),7,2,col);
  }

  // Dense hanging moss under the turf.
  for(let x=0;x<920;x+=5){
   const h=4+Math.floor(rnd()*14);
   rect(x,18,3,h,rnd()>.5?'#2d7e32':'#24672c');
   if(rnd()>.68)rect(x+2,20+h,2,3+Math.floor(rnd()*8),'#184c27');
  }

  // Luminous pixel-grass edge, matching the original high-detail foreground reference.
  rect(0,15,920,5,'#377f31');
  rect(0,12,920,4,'#55ad38');
  rect(0,9,920,4,'#7bd53f');
  rect(0,7,920,3,'#a2ed4a');
  rect(0,6,920,2,'#c0f35c');

  // Small grass blades across the whole top.
  for(let x=-4;x<924;x+=4){
   const h=3+Math.floor(rnd()*10),lean=rnd()>.5?2:-2;
   const col=['#4ba933','#65c33a','#82de42','#a0eb4b'][Math.floor(rnd()*4)];
   rect(x,7-h,2,h,col);
   if(h>7)rect(x+lean,7-h,2,3,col);
  }

  // Larger foreground foliage clumps.
  for(let i=0;i<37;i++){
   const cx=6+Math.floor(rnd()*908),base=8,scale=.7+rnd()*.75;
   const dark='#24732d',mid='#42a937',bright='#78d93f',hi='#9ded4b';
   for(let leaf=0;leaf<5;leaf++){
    const dir=leaf-2,lh=Math.round((8+Math.abs(dir)*2+rnd()*9)*scale),lx=cx+dir*3;
    rect(lx,base-lh,2,lh,dark);
    rect(lx+(dir<0?-3:2),base-lh+3,4,2,mid);
    if(leaf%2===0)rect(lx+(dir<0?-5:3),base-lh+6,5,2,bright);
    if(rnd()>.5)rect(lx,base-lh,2,3,hi);
   }
  }

  // Tiny vine curls and bright moss pixels for the "high resolution pixel art" finish.
  for(let i=0;i<90;i++){
   const x=Math.floor(rnd()*920),y=10+Math.floor(rnd()*22);
   rect(x,y,2,2,rnd()>.45?'#73d63c':'#3d9934');
   if(rnd()>.7)rect(x+2,y-2,2,4,'#8ee444');
  }
  return c
 }
 const groundTile=makeGroundTile();

 function drawHead(im,x,y,size,rotation=0){
  if(!ready(im))return false;
  ctx.save();ctx.translate(x+size/2,y+size/2);ctx.rotate(rotation);
  ctx.shadowColor='#85eaf0';ctx.shadowBlur=5;ctx.fillStyle='#8ddce333';ctx.strokeStyle='#d8ffff';ctx.lineWidth=3;
  ctx.beginPath();ctx.arc(0,0,size*.49,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.shadowBlur=0;
  ctx.save();ctx.beginPath();ctx.arc(0,0,size*.445,0,Math.PI*2);ctx.clip();
  // Keep the improved crop: more of the face and mouth inside the bubble.
  ctx.drawImage(im,im.width*.11,im.height*.08,im.width*.78,im.height*.68,-size*.485,-size*.465,size*.97,size*.95);
  ctx.fillStyle='#9eeeff18';ctx.fillRect(-size/2,-size/2,size,size);ctx.restore();
  ctx.strokeStyle='#73bfc9';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,size*.445,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle='#ffffffaa';ctx.fillRect(-size*.27,-size*.33,size*.13,size*.055);ctx.fillRect(-size*.34,-size*.24,size*.055,size*.12);
  // Narrow neck-sized collar.
  const collarY=size*.43;ctx.fillStyle='#263b43';ctx.fillRect(-size*.19,collarY,size*.38,size*.095);
  ctx.fillStyle='#9eb5bb';ctx.fillRect(-size*.16,collarY+1,size*.32,size*.035);
  ctx.fillStyle='#17262b';ctx.fillRect(-size*.13,collarY+size*.052,size*.035,size*.028);ctx.fillRect(size*.095,collarY+size*.052,size*.035,size*.028);
  ctx.fillStyle='#ffe676';ctx.fillRect(-size*.05,collarY+size*.038,size*.10,size*.042);
  ctx.restore();return true
 }

 function sky(w,h,run){
  const now=BIOMES[(run.stage-1)%BIOMES.length],prev=BIOMES[(run.stage-2+BIOMES.length)%BIOMES.length],blend=run.stage===1?1:Math.min(1,(run.time%30)/4),top=mix(prev[1],now[1],blend),bottom=mix(prev[2],now[2],blend),g=ctx.createLinearGradient(0,0,0,h);
  g.addColorStop(0,top);g.addColorStop(1,bottom);ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  if(ready(jungle)){const sh=h*1.08,sw=jungle.width/jungle.height*sh,off=(run.distance*4.2)%(sw*2);ctx.save();ctx.globalAlpha=.56;ctx.globalCompositeOperation='multiply';for(let i=-1;i<4;i++){ctx.save();ctx.translate(i*sw-off+(i%2?0:sw),-h*.02);if(i%2===0)ctx.scale(-1,1);ctx.drawImage(jungle,0,0,sw,sh);ctx.restore()}ctx.restore()}
  for(let layer=0;layer<3;layer++){ctx.save();ctx.globalAlpha=.11+layer*.05;ctx.fillStyle=layer===0?'#d9fff0':'#071d22';const off=(run.distance*(2+layer*3))%(180+layer*35);for(let x=-220;x<w+220;x+=180+layer*35){const xx=x-off;ctx.beginPath();ctx.arc(xx,h*(.25+layer*.17),28+layer*15,0,Math.PI*2);ctx.fill()}ctx.restore()}
  if(run.stage%8===5){ctx.fillStyle='#dfe6ff';ctx.globalAlpha=.65;ctx.beginPath();ctx.arc(w*.8,h*.17,34,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1}
  if(run.event?.name==='MONSOON'||run.stage%8===6){ctx.strokeStyle='#c6e9ff';ctx.globalAlpha=.22;for(let i=0;i<40;i++){const x=(i*73+run.time*180)%(w+60)-30,y=(i*47+run.time*260)%(h*.8);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-8,y+20);ctx.stroke()}ctx.globalAlpha=1}
  if(run.event?.name==='BOULDER CHASE'){ctx.fillStyle='#26332d';ctx.globalAlpha=.72;ctx.beginPath();ctx.arc(38,h*.72,58,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1}
  if(run.event?.name==='STAMPEDE'){ctx.fillStyle='#172b22';ctx.globalAlpha=.48;for(let i=0;i<5;i++){const x=(w+180-i*110-run.time*70)%(w+350)-80,y=h*(.62+(i%2)*.04);ctx.beginPath();ctx.ellipse(x,y,31,16,0,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1}
  if(run.event?.name==='TEMPLE COLLAPSE'){ctx.fillStyle='#725f43';ctx.globalAlpha=.35;for(let i=0;i<6;i++){const x=w*.58+i*42,y=(run.time*35+i*31)%(h*.55);ctx.save();ctx.translate(x,y);ctx.rotate(run.time+i);ctx.fillRect(-9,-9,18,18);ctx.restore()}ctx.globalAlpha=1}
 }

 function ground(vw,h,run){
  ctx.fillStyle='#0a2118';ctx.fillRect(0,0,vw,h);
  const tileW=920,offset=(run.distance*82)%tileW;
  for(let x=-tileW;x<vw+tileW;x+=tileW)ctx.drawImage(groundTile,x-offset,-18,tileW,112)
 }

 function pxRect(x,y,w,h,col){ctx.fillStyle=col;ctx.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)))}

 function fallbackObstacle(o,overhead,drop){
  ctx.save();ctx.translate(o.x,drop);const w=o.w,h=o.h,p=Math.max(2,Math.round(Math.min(w,h)/12));

  if(o.id==='stump'){
   pxRect(w*.13,-h*.92,w*.72,h*.84,'#3a2016');pxRect(w*.20,-h*.88,w*.58,h*.76,'#714323');
   pxRect(w*.28,-h*.84,w*.12,h*.66,'#8c572c');pxRect(w*.55,-h*.86,w*.10,h*.68,'#512c1b');
   ctx.fillStyle='#c18b52';ctx.beginPath();ctx.ellipse(w*.49,-h*.90,w*.34,h*.09,0,0,Math.PI*2);ctx.fill();
   ctx.strokeStyle='#704522';ctx.lineWidth=p;ctx.beginPath();ctx.ellipse(w*.49,-h*.90,w*.20,h*.045,0,0,Math.PI*2);ctx.stroke();
   pxRect(w*.05,-h*.15,w*.30,h*.12,'#352016');pxRect(w*.66,-h*.14,w*.30,h*.11,'#352016');
   pxRect(w*.18,-h*.98,w*.24,p*2,'#64ad38');pxRect(w*.38,-h*.96,w*.29,p*2,'#3e8b31');pxRect(w*.55,-h*.99,w*.18,p*2,'#88d543');
  }else if(o.id==='stone'){
   ctx.fillStyle='#293932';ctx.beginPath();ctx.moveTo(w*.10,-h*.06);ctx.lineTo(w*.17,-h*.88);ctx.lineTo(w*.38,-h*.99);ctx.lineTo(w*.77,-h*.91);ctx.lineTo(w*.89,-h*.12);ctx.closePath();ctx.fill();
   ctx.fillStyle='#617067';ctx.beginPath();ctx.moveTo(w*.23,-h*.14);ctx.lineTo(w*.26,-h*.78);ctx.lineTo(w*.43,-h*.88);ctx.lineTo(w*.69,-h*.82);ctx.lineTo(w*.76,-h*.20);ctx.closePath();ctx.fill();
   pxRect(w*.27,-h*.94,w*.33,p*2,'#4d9638');pxRect(w*.52,-h*.89,w*.23,p*2,'#78c943');
   ctx.strokeStyle='#26362f';ctx.lineWidth=p;ctx.beginPath();ctx.moveTo(w*.53,-h*.73);ctx.lineTo(w*.40,-h*.57);ctx.lineTo(w*.56,-h*.42);ctx.lineTo(w*.44,-h*.24);ctx.stroke();
  }else if(o.id==='spike'||o.id==='spike-patch'){
   const count=o.id==='spike-patch'?10:6;
   for(let i=0;i<count;i++){
    const x=w*(.02+i/(count+1));
    ctx.fillStyle=i%2?'#2f8234':'#27662e';ctx.beginPath();ctx.moveTo(x,-h*.03);ctx.lineTo(x+w*.12,-h*(.55+(i%3)*.13));ctx.lineTo(x+w*.20,-h*.03);ctx.fill();
    ctx.fillStyle='#e8dfa0';ctx.beginPath();ctx.moveTo(x+w*.10,-h*.25);ctx.lineTo(x+w*.15,-h*(.77+(i%2)*.12));ctx.lineTo(x+w*.20,-h*.26);ctx.fill();
   }
   pxRect(0,-p,w,p,'#3d8d34');
  }else if(o.id==='puddle'){
   pxRect(0,-8,w,8,'#071c1b');pxRect(w*.05,-10,w*.90,3,'#3f8b79');pxRect(w*.18,-7,w*.28,2,'#72b8a0');pxRect(w*.60,-6,w*.20,2,'#2e665c');
  }else if(o.id==='ravine'){
   pxRect(0,-11,w,11,'#061713');for(let i=0;i<7;i++)pxRect(w*(i/7),-14-(i%3)*3,w*.09,5,'#31502e');
  }else if(overhead||o.id==='branch'||o.id==='vine'||o.id==='temple-beam'||o.id==='canopy'){
   const yy=-h*.40;pxRect(0,yy,w,h*.20,'#352116');pxRect(w*.03,yy+2,w*.94,h*.10,'#6b4325');
   pxRect(w*.12,yy-3,w*.35,4,'#4e8e32');pxRect(w*.56,yy-2,w*.26,4,'#65b43a');
   for(let i=0;i<7;i++){const x=w*(.08+i*.14),len=h*(.22+(i%3)*.09);pxRect(x,yy+h*.17,p,len,'#1f652e');pxRect(x-3,yy+h*.22+(i%2)*8,p*3,p*2,'#52aa39')}
  }else{
   pxRect(0,-h,w,h,'#7f9f54')
  }
  ctx.restore()
 }

 function obstacle(o){
  const overhead=['overhead','flex'].includes(o.family),drop=overhead?0:HAZARD_VISUAL_DROP;
  // Original atlas art is recoverable for the complete top-row sprites.
  const original={log:0,rock:1,mushroom:2,thorns:3}[o.id];
  if(original!==undefined){
   const y=-o.h-9+drop,height=o.h+14;
   if(tile(objects,original,o.x-8,y,o.w+16,height))return
  }
  fallbackObstacle(o,overhead,drop)
 }

 function bananaBunch(x,y,golden=false){
  ctx.save();ctx.translate(x,y);if(golden){ctx.shadowColor='#fff59a';ctx.shadowBlur=12}
  const outline='#6d3a12',yellow=golden?'#ffe45b':'#ffc62f',light=golden?'#fff39a':'#ffe46a',dark='#d99517';
  const one=(ox,oy,flip=1)=>{
   ctx.save();ctx.translate(ox,oy);ctx.scale(flip,1);
   ctx.fillStyle=outline;ctx.beginPath();ctx.moveTo(-10,-8);ctx.lineTo(-5,-11);ctx.lineTo(2,-8);ctx.lineTo(8,-2);ctx.lineTo(8,4);ctx.lineTo(3,8);ctx.lineTo(-4,7);ctx.lineTo(-9,2);ctx.closePath();ctx.fill();
   ctx.fillStyle=yellow;ctx.beginPath();ctx.moveTo(-7,-7);ctx.lineTo(-3,-8);ctx.lineTo(2,-6);ctx.lineTo(5,-1);ctx.lineTo(5,3);ctx.lineTo(2,5);ctx.lineTo(-3,4);ctx.lineTo(-7,0);ctx.closePath();ctx.fill();
   pxRect(-4,-6,5,2,light);pxRect(2,2,3,2,dark);pxRect(-9,-10,3,4,outline);ctx.restore()
  };
  one(-5,2,1);one(2,-1,1);one(7,3,-1);pxRect(1,-11,3,5,outline);ctx.restore()
 }

 function character(state,run,selected){
  const im=asset(selected.image),sliding=run.y===0&&(run.slideTime>0||run.slideHeld||run.slideBlocked),frame=state==='over'?7:sliding?7:run.y>0?(run.vy>70?5:6):run.landing>0?7:state==='running'?Math.floor(run.time*(9+run.speed/85))%4:4,bf=SPRITES.body[frame],necks=[[240,168],[596,160],[988,160],[1384,168],[210,645],[584,596],[944,650],[1380,724]],neck=necks[frame],bs=.22;
  const bob=!sliding&&run.y===0&&state==='running'?Math.sin(run.time*24)*1.2:0,rot=sliding?-.18:run.vy>0?-.04:run.vy<0?.035:0;
  ctx.save();ctx.translate(PLAYER_X+(run.shake?Math.sin(run.time*110)*3:0),-run.y+bob+PLAYER_VISUAL_DROP);ctx.rotate(rot);
  if(run.shield||run.invulnerable>0){ctx.strokeStyle=run.shield?'#a5ffe4':'#fff2a2';ctx.lineWidth=3;ctx.globalAlpha=.65+.25*Math.sin(run.time*30);ctx.beginPath();ctx.ellipse(sliding?8:0,sliding?-25:-49,sliding?52:43,sliding?28:58,0,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1}
  let bx=-(neck[0]-bf[0])*bs,by=-bf[3]*bs;if(sliding){ctx.translate(8,3);ctx.rotate(-.12);bx-=7;by+=16}
  tile(bodies,frame,bx,by,bf[2]*bs,bf[3]*bs);
  const headY=by+(neck[1]-bf[1])*bs-(sliding?44:51);
  if(!drawHead(im,-29,headY-1,58,sliding?.12:0)){ctx.fillStyle='#e4e984';ctx.font='36px monospace';ctx.textAlign='center';ctx.fillText('?',0,-58)}
  if(run.modeTime>0){ctx.globalAlpha=.18;ctx.fillStyle='#f8ed72';for(let i=1;i<5;i++)ctx.fillRect(-i*13,-55+i*3,8,35);ctx.globalAlpha=1}
  ctx.restore()
 }

 function draw(state,run,selected,particles=[]){
  current=[state,run,selected,particles];if(!ctx)return;
  const w=canvas.width,h=canvas.height;if(!w||!h)return;
  const active=['running','countdown','paused','over'].includes(state),vw=Math.max(600,Math.min(1080,w/h*500)),scale=w/vw,groundY=h*.9;
  ctx.clearRect(0,0,w,h);ctx.imageSmoothingEnabled=false;sky(w,h,run);
  ctx.save();ctx.translate(0,groundY);ctx.scale(scale,scale);ground(vw,h/scale,run);
  if(active){
   for(const o of run.obstacles)obstacle(o);
   for(const b of run.bananas){ctx.save();if(b.golden){ctx.shadowColor='#fff59a';ctx.shadowBlur=15;ctx.globalAlpha=.98}bananaBunch(b.x,-b.y,b.golden);ctx.restore()}
   if(run.power){ctx.save();ctx.shadowColor='#a5ffe4';ctx.shadowBlur=14;ctx.font='30px serif';ctx.textAlign='center';ctx.fillText('🛡️',run.power.x,-run.power.y+12);ctx.restore()}
   character(state,run,selected);
   for(const p of particles){ctx.globalAlpha=Math.min(1,p.life/.4);ctx.fillStyle=p.color||'#d0dca0';if(p.label){ctx.font='bold 18px monospace';ctx.fillText(p.label,p.x,-p.y)}else ctx.fillRect(p.x,-p.y,p.size||4,p.size||4)}
   ctx.globalAlpha=1;
   if(run.debug){ctx.strokeStyle='#ff4d7d';const p=playerBox(run);ctx.strokeRect(p.x,p.y*-1-p.h,p.w,p.h);ctx.strokeStyle='#ffe45f';for(const o of run.obstacles)for(const b of obstacleBoxes(o))ctx.strokeRect(b.x,-b.y-b.h,b.w,b.h)}
  }
  ctx.restore();
  if(run.event){ctx.fillStyle='#e8f6dc';ctx.globalAlpha=.65;ctx.font=`${Math.max(12,w/85)}px monospace`;ctx.textAlign='right';ctx.fillText(run.event.name,w-24,h*.19);ctx.globalAlpha=1}
 }

 function resize(){try{const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.max(1,Math.round(r.width*dpr));canvas.height=Math.max(1,Math.round(r.height*dpr));redraw()}catch{}}
 return{draw,resize}
}
