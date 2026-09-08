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
 let current=null,sceneTime=0;

 const redraw=()=>current&&draw(...current);onLoad=redraw;

 function tile(im,index,x,y,w,h){
  if(!ready(im)||index<0)return false;
  const frames=im===bodies?SPRITES.body:SPRITES.obstacles,[cx,cy,cw,ch]=frames[index];
  ctx.drawImage(im,cx,cy,cw,ch,x,y,w,h);return true
 }

 function drawRecoveredObstacle(index,x,y,w,h,trimBottom=0){
  if(!ready(objects)||index<0)return false;
  const [cx,cy,cw,ch]=SPRITES.obstacles[index],safeH=Math.max(1,ch-trimBottom);
  ctx.drawImage(objects,cx,cy,cw,safeH,x,y,w,h);return true
 }

 function randFactory(seed=0x51f15e){let s=seed>>>0;return()=>{s=Math.imul(s^s>>>15,1|s);s^=s+Math.imul(s^s>>>7,61|s);return((s^s>>>14)>>>0)/4294967296}}

 function makeGroundTile(){
  const c=document.createElement('canvas');c.width=960;c.height=126;
  const g=c.getContext?.('2d');if(!g)return c;
  g.imageSmoothingEnabled=false;
  const rnd=randFactory(0x8F3A10),R=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)))};
  const SURFACE=56;

  // Completely rebuilt high-detail pixel jungle turf.
  R(0,SURFACE,960,70,'#082016');R(0,SURFACE+10,960,60,'#0b281b');R(0,SURFACE+28,960,42,'#071b14');

  const soil=['#103420','#1b4126','#244b2d','#2d5635','#123723'];
  for(let i=0;i<360;i++){const x=rnd()*960,y=SURFACE+8+rnd()*56;R(x,y,1+rnd()*7,1+rnd()*5,soil[Math.floor(rnd()*soil.length)])}

  // Hanging roots and moss.
  for(let i=0;i<320;i++){
   const x=Math.floor(rnd()*960),len=5+Math.floor(rnd()*36),w=rnd()>.82?2:1,col=rnd()>.6?'#2e7c36':rnd()>.3?'#245f2e':'#184626';
   R(x,SURFACE+2,w,len,col);if(rnd()>.78)R(x+(rnd()>.5?1:-1),SURFACE+len-1,1,3+Math.floor(rnd()*8),'#103820')
  }

  // Dense irregular turf crown with no flat neon strip.
  for(let x=0;x<960;x+=2){
   const h=8+Math.floor(rnd()*6),top=SURFACE-5-Math.floor(rnd()*3);
   R(x,top,2,h,'#296f2f');R(x,top+1,2,Math.max(4,h-3),'#429d35');
   if(rnd()>.35)R(x,top,2,2,'#6fd23e');if(rnd()>.66)R(x,top-1,1,2,'#a1eb53')
  }

  const blade=['#2d812f','#43a836','#5fbe3c','#79d643','#95e84c'];
  for(let i=0;i<980;i++){
   const x=Math.floor(rnd()*960),len=3+Math.floor(rnd()*12),lean=rnd()>.5?1:-1,col=blade[Math.floor(rnd()*blade.length)];
   R(x,SURFACE-len,1,len,col);if(len>6)R(x+lean,SURFACE-len+2,1,3,col)
  }

  function fern(cx,base,scale=1){
   const stem='#1e642a',mid='#2f9336',light='#56bb3d',hi='#86e24c';R(cx,base-28*scale,2,28*scale,stem);
   for(let i=0;i<7;i++){const y=base-(5+i*3.3)*scale,reach=(7+i*2.6)*scale;
    R(cx-reach,y,reach,2*scale,mid);R(cx+2,y+1*scale,reach,2*scale,mid);
    R(cx-reach-2*scale,y-2*scale,4*scale,2*scale,light);R(cx+reach-1*scale,y-1*scale,4*scale,2*scale,light);
    if(i>2){R(cx-reach*.55,y-3*scale,4*scale,1.5*scale,hi);R(cx+reach*.35,y-2*scale,4*scale,1.5*scale,hi)}
   }
  }
  function tuft(cx,base,scale=1){
   const cols=['#236e2d','#348d34','#49aa38','#69c440','#88df4a'];
   for(let i=-5;i<=5;i++){const len=(8+(5-Math.abs(i))*2+rnd()*7)*scale,x=cx+i*2.2*scale,col=cols[(i+10)%cols.length];R(x,base-len,1.7*scale,len,col);if(i%2===0)R(x+(i<0?-2:2)*scale,base-len+3*scale,3*scale,2*scale,col)}
  }
  for(let x=54;x<960;x+=110){
   if(Math.floor(x/110)%2===0){fern(x,SURFACE,.75+.15*(Math.floor(x/110)%3));tuft(x+42,SURFACE,.70)}
   else{tuft(x,SURFACE,.82);fern(x+38,SURFACE,.62)}
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
  ctx.fillStyle='#071c14';ctx.fillRect(0,0,vw,h);
  const tileW=960,tileH=126,offset=(run.distance*100)%tileW;
  for(let x=-tileW;x<vw+tileW;x+=tileW)ctx.drawImage(groundTile,x-offset,-56,tileW,tileH)
 }

 function pxRect(x,y,w,h,col){ctx.fillStyle=col;ctx.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)))}

 function fallbackObstacle(o,overhead,drop){
  ctx.save();ctx.translate(o.x,drop);const w=o.w,h=o.h,p=Math.max(2,Math.round(Math.min(w,h)/12));

  if(o.id==='stump'){
   pxRect(w*.13,-h*.92,w*.72,h*.84,'#3a2016');pxRect(w*.20,-h*.88,w*.58,h*.76,'#714323');pxRect(w*.28,-h*.84,w*.12,h*.66,'#8c572c');pxRect(w*.55,-h*.86,w*.10,h*.68,'#512c1b');
   ctx.fillStyle='#c18b52';ctx.beginPath();ctx.ellipse(w*.49,-h*.90,w*.34,h*.09,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#704522';ctx.lineWidth=p;ctx.beginPath();ctx.ellipse(w*.49,-h*.90,w*.20,h*.045,0,0,Math.PI*2);ctx.stroke();
   pxRect(w*.05,-h*.15,w*.30,h*.12,'#352016');pxRect(w*.66,-h*.14,w*.30,h*.11,'#352016');pxRect(w*.18,-h*.98,w*.24,p*2,'#64ad38');pxRect(w*.38,-h*.96,w*.29,p*2,'#3e8b31');pxRect(w*.55,-h*.99,w*.18,p*2,'#88d543');
  }else if(o.id==='stone'){
   ctx.fillStyle='#293932';ctx.beginPath();ctx.moveTo(w*.10,-h*.06);ctx.lineTo(w*.17,-h*.88);ctx.lineTo(w*.38,-h*.99);ctx.lineTo(w*.77,-h*.91);ctx.lineTo(w*.89,-h*.12);ctx.closePath();ctx.fill();
   ctx.fillStyle='#617067';ctx.beginPath();ctx.moveTo(w*.23,-h*.14);ctx.lineTo(w*.26,-h*.78);ctx.lineTo(w*.43,-h*.88);ctx.lineTo(w*.69,-h*.82);ctx.lineTo(w*.76,-h*.20);ctx.closePath();ctx.fill();
   pxRect(w*.27,-h*.94,w*.33,p*2,'#4d9638');pxRect(w*.52,-h*.89,w*.23,p*2,'#78c943');ctx.strokeStyle='#26362f';ctx.lineWidth=p;ctx.beginPath();ctx.moveTo(w*.53,-h*.73);ctx.lineTo(w*.40,-h*.57);ctx.lineTo(w*.56,-h*.42);ctx.lineTo(w*.44,-h*.24);ctx.stroke();
  }else if(o.id==='spike'||o.id==='spike-patch'){
   const count=o.id==='spike-patch'?10:6;
   for(let i=0;i<count;i++){const x=w*(.02+i/(count+1));ctx.fillStyle=i%2?'#2f8234':'#27662e';ctx.beginPath();ctx.moveTo(x,-h*.03);ctx.lineTo(x+w*.12,-h*(.55+(i%3)*.13));ctx.lineTo(x+w*.20,-h*.03);ctx.fill();ctx.fillStyle='#e8dfa0';ctx.beginPath();ctx.moveTo(x+w*.10,-h*.25);ctx.lineTo(x+w*.15,-h*(.77+(i%2)*.12));ctx.lineTo(x+w*.20,-h*.26);ctx.fill()}
   pxRect(0,-p,w,p,'#3d8d34');
  }else if(o.id==='puddle'){
   const wave=Math.sin(sceneTime*10+o.x*.03)*2;
   ctx.fillStyle='#061d1d';ctx.fillRect(0,-13,w,13);ctx.fillStyle='#0c3639';ctx.fillRect(3,-12,w-6,11);
   ctx.fillStyle='#155562';ctx.fillRect(9,-11,w-18,8);ctx.fillStyle='#2e8da4';ctx.fillRect(14+wave,-10,w*.25,2);ctx.fillRect(w*.52-wave,-8,w*.23,2);
   ctx.fillStyle='#83d3df';ctx.fillRect(20,-8,w*.15,1);ctx.fillRect(w*.39,-7,w*.12,1);ctx.fillRect(w*.72,-9,w*.12,1);
   for(let i=0;i<5;i++){const rx=14+i*(w*.18)+Math.sin(sceneTime*8+i)*2;ctx.strokeStyle='rgba(185,244,255,.52)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(rx,-7-(i%2),3+i%2,0,Math.PI*1.2);ctx.stroke()}
   ctx.fillStyle='#1d6745';ctx.fillRect(0,-3,7,3);ctx.fillRect(w-9,-3,9,3);
  }else if(o.id==='ravine'){
   ctx.fillStyle='#061713';ctx.fillRect(0,-14,w,14);for(let i=0;i<8;i++)pxRect(w*(i/8),-15-(i%3)*2,w*.10,4,'#2c4d2d');ctx.fillStyle='#0d251a';ctx.fillRect(8,-11,w-16,9);
  }else if(overhead||o.id==='branch'||o.id==='vine'||o.id==='temple-beam'||o.id==='canopy'){
   const yy=-h*.44;
   ctx.fillStyle='#3d2416';ctx.fillRect(0,yy,w,h*.24);ctx.fillStyle='#714326';ctx.fillRect(4,yy+3,w-8,h*.13);ctx.fillStyle='#9b6335';ctx.fillRect(8,yy+6,w-16,h*.055);
   ctx.fillStyle='#c58a50';ctx.beginPath();ctx.ellipse(8,yy+h*.12,10,h*.10,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#704320';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(8,yy+h*.12,5,h*.05,0,0,Math.PI*2);ctx.stroke();
   for(let i=0;i<6;i++){const vx=w*(.12+i*.14);pxRect(vx,yy-2,12,3,i%2?'#62b73a':'#438e31');pxRect(vx+4,yy-5,8,3,'#82d848')}
   for(let i=0;i<7;i++){const x=w*(.08+i*.13),len=h*(.24+(i%3)*.10);pxRect(x,yy+h*.18,2,len,'#1e6029');if(i%2===0)pxRect(x-3,yy+h*.18+len*.4,6,3,'#54ad39')}
  }else{
   pxRect(0,-h,w,h,'#7f9f54')
  }
  ctx.restore()
 }

 function obstacle(o){
  const overhead=['overhead','flex'].includes(o.family),drop=overhead?0:HAZARD_VISUAL_DROP;
  const recovered={
   log:{tile:0,trim:16},
   rock:{tile:1,trim:10},
   mushroom:{tile:2,trim:7},
   thorns:{tile:3,trim:10}
  }[o.id];
  if(recovered){
   const y=-o.h-9+drop,height=o.h+14;
   if(drawRecoveredObstacle(recovered.tile,o.x-8,y,o.w+16,height,recovered.trim))return
  }
  fallbackObstacle(o,overhead,drop)
 }

 function bananaBunch(x,y,golden=false){
  ctx.save();ctx.translate(x,y);if(golden){ctx.shadowColor='#fff59a';ctx.shadowBlur=13}
  const yellow=golden?'#ffe458':'#ffca2f',light=golden?'#fff5a4':'#fff084',shade='#e19a18',outline='#734214';
  const one=(tx,ty,rot,scale)=>{ctx.save();ctx.translate(tx,ty);ctx.rotate(rot);ctx.scale(scale,scale);
   ctx.fillStyle=outline;ctx.beginPath();ctx.moveTo(-11,-6);ctx.bezierCurveTo(-14,-1,-12,7,-5,10);ctx.bezierCurveTo(2,13,10,11,14,5);ctx.bezierCurveTo(8,7,2,6,-2,3);ctx.bezierCurveTo(-6,0,-7,-4,-6,-8);ctx.closePath();ctx.fill();
   ctx.fillStyle=yellow;ctx.beginPath();ctx.moveTo(-8,-5);ctx.bezierCurveTo(-10,0,-9,5,-4,7);ctx.bezierCurveTo(2,10,8,8,11,4);ctx.bezierCurveTo(6,6,1,5,-2,3);ctx.bezierCurveTo(-4,1,-5,-3,-4,-6);ctx.closePath();ctx.fill();
   ctx.strokeStyle=shade;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-6,1);ctx.bezierCurveTo(-3,6,3,7,8,4);ctx.stroke();ctx.strokeStyle=light;ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(-5,-3);ctx.bezierCurveTo(-5,0,-3,2,0,4);ctx.stroke();ctx.fillStyle=outline;ctx.fillRect(-10,-7,3,3);ctx.restore()};
  one(-10,4,-.32,.96);one(0,0,-.08,1.03);one(10,4,.15,.90);ctx.fillStyle='#6d4117';ctx.fillRect(-2,-12,5,6);ctx.fillStyle='#aa7b2b';ctx.fillRect(-1,-13,3,3);ctx.restore()
 }

 function drawDashTrail(run){
  if(!(run.modeTime>0||run.dashing||run.dashTrail>0))return;
  const intensity=Math.max(run.dashTrail||0,run.modeTime>0?1:0),count=10;
  for(let i=0;i<count;i++){
   const t=(sceneTime*22+i*1.7)%(count+3),dx=24+t*10,baseY=-6+((i%3)-1)*3,size=(10-i*.55)*(.75+.25*intensity),alpha=Math.max(.07,.30-i*.022);
   ctx.globalAlpha=alpha*intensity;ctx.fillStyle=i%2?'#d7d09c':'#beb783';ctx.beginPath();ctx.ellipse(PLAYER_X-dx,baseY-(i%2)*2,size,size*.52,0,0,Math.PI*2);ctx.fill();
   ctx.fillStyle='#9ca36b';ctx.fillRect(PLAYER_X-dx-2,baseY+size*.1,4,2)
  }
  ctx.globalAlpha=1
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
  current=[state,run,selected,particles];if(!ctx)return;sceneTime=run.time||0;
  const w=canvas.width,h=canvas.height;if(!w||!h)return;
  const active=['running','countdown','paused','over'].includes(state),vw=Math.max(600,Math.min(1080,w/h*500)),scale=w/vw,groundY=h*.9;
  ctx.clearRect(0,0,w,h);ctx.imageSmoothingEnabled=false;sky(w,h,run);
  ctx.save();ctx.translate(0,groundY);ctx.scale(scale,scale);ground(vw,h/scale,run);
  if(active){
   for(const o of run.obstacles)obstacle(o);
   for(const b of run.bananas)bananaBunch(b.x,-b.y,b.golden)
   if(run.power){ctx.save();ctx.shadowColor='#a5ffe4';ctx.shadowBlur=14;ctx.font='30px serif';ctx.textAlign='center';ctx.fillText('🛡️',run.power.x,-run.power.y+12);ctx.restore()}
   drawDashTrail(run);
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
