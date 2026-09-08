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

 function drawRecoveredObstacle(index,x,y,w,h,trimBottom=0){
  if(!ready(objects)||index<0)return false;
  const [cx,cy,cw,ch]=SPRITES.obstacles[index],safeH=Math.max(1,ch-trimBottom);
  ctx.drawImage(objects,cx,cy,cw,safeH,x,y,w,h);return true
 }

 function randFactory(seed=0x51f15e){let s=seed>>>0;return()=>{s=Math.imul(s^s>>>15,1|s);s^=s+Math.imul(s^s>>>7,61|s);return((s^s>>>14)>>>0)/4294967296}}

 function makeGroundTile(){
  const c=document.createElement('canvas');c.width=640;c.height=96;
  const g=c.getContext?.('2d');if(!g)return c;
  g.imageSmoothingEnabled=false;
  const rnd=randFactory(0xC11A0);
  const R=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)))};

  // Ground surface is y=34 inside this tile. Everything above it is foliage,
  // everything below it is lush hanging moss / dark jungle soil.
  R(0,34,640,62,'#0a2318');
  R(0,45,640,51,'#0d2b1c');
  R(0,70,640,26,'#091f16');

  // Organic soil texture: subtle mottled stones/roots, never bright bars.
  const soilCols=['#173a22','#204629','#285030','#11301f','#35563a'];
  for(let i=0;i<190;i++){
   const x=rnd()*640,y=42+rnd()*52,w=1+Math.floor(rnd()*6),h=1+Math.floor(rnd()*4);
   R(x,y,w,h,soilCols[Math.floor(rnd()*soilCols.length)]);
  }

  // Hanging moss under the turf, based on the user's reference screenshot.
  for(let x=0;x<640;x+=3){
   const n=rnd(),len=6+Math.floor(rnd()*28),w=n>.76?2:1;
   const col=n>.70?'#2c7c32':n>.38?'#22682d':'#194f28';
   R(x,36,w,len,col);
   if(rnd()>.78)R(x+1,40+len,1,3+Math.floor(rnd()*9),'#123e22');
  }

  // Irregular bright turf. Avoid a single neon horizontal line.
  for(let x=0;x<640;x+=2){
   const top=29-Math.floor(rnd()*5);
   const h=8+Math.floor(rnd()*4);
   R(x,top,2,h,'#327b31');
   R(x,top+1,2,Math.max(2,h-4),'#4da536');
   if(rnd()>.30)R(x,top,2,2,'#75d13f');
   if(rnd()>.65)R(x+1,top-1,1,2,'#a1ec4d');
  }

  // Small blades along the entire surface.
  for(let x=0;x<640;x+=4){
   const len=3+Math.floor(rnd()*8),lean=rnd()>.5?1:-1;
   const col=rnd()>.6?'#8fe346':rnd()>.3?'#64c63a':'#429d33';
   R(x,29-len,1,len,col);
   if(len>6)R(x+lean,29-len,1,3,col);
  }

  // Hand-built fern clumps: much closer to the lush reference art.
  const fern=(cx,base,scale=1)=>{
   const dark='#1e6b2b',mid='#329436',light='#5fc23a',hi='#82dc42';
   R(cx,base-22*scale,2,22*scale,dark);
   for(let i=0;i<6;i++){
    const y=base-(4+i*3.1)*scale,reach=(7+i*2.3)*scale;
    R(cx-reach,y,reach,2*scale,mid);
    R(cx+2,y+1*scale,reach,2*scale,mid);
    R(cx-reach-2*scale,y-2*scale,4*scale,2*scale,light);
    R(cx+reach-1*scale,y-1*scale,4*scale,2*scale,light);
    if(i>2){R(cx-reach*.65,y-3*scale,4*scale,2*scale,hi);R(cx+reach*.45,y-2*scale,4*scale,2*scale,hi)}
   }
  };
  const tuft=(cx,base,scale=1)=>{
   const cols=['#27782e','#3b9d33','#5cbd38','#7cda42'];
   for(let i=-4;i<=4;i++){
    const len=(6+(4-Math.abs(i))*2+rnd()*5)*scale;
    const x=cx+i*2*scale,col=cols[(i+8)%cols.length];
    R(x,base-len,2*scale,len,col);
    if(i%2===0)R(x+(i<0?-2:2)*scale,base-len+3*scale,3*scale,2*scale,col);
   }
  };

  fern(56,29,.78);tuft(110,29,.72);fern(184,29,.58);
  tuft(270,29,.76);fern(344,29,.86);tuft(418,29,.62);
  fern(500,29,.68);tuft(573,29,.86);

  // Tiny scattered moss highlights.
  for(let i=0;i<115;i++){
   const x=rnd()*640,y=24+rnd()*14;
   R(x,y,1+(rnd()>.7?1:0),1,rnd()>.5?'#72d43d':'#459f34');
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
  ctx.fillStyle='#092117';ctx.fillRect(0,0,vw,h);
  const tileW=640,tileH=96,offset=(run.distance*82)%tileW;
  for(let x=-tileW;x<vw+tileW;x+=tileW)ctx.drawImage(groundTile,x-offset,-34,tileW,tileH)
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
  ctx.save();ctx.translate(x,y);
  if(golden){ctx.shadowColor='#fff39a';ctx.shadowBlur=13}
  ctx.lineJoin='round';ctx.lineCap='round';

  const drawOne=(tx,ty,rot,scale)=>{
   ctx.save();ctx.translate(tx,ty);ctx.rotate(rot);ctx.scale(scale,scale);
   // Thick dark/orange outline.
   ctx.beginPath();
   ctx.moveTo(-9,-10);
   ctx.bezierCurveTo(-13,-2,-11,8,-3,11);
   ctx.bezierCurveTo(5,14,12,8,14,1);
   ctx.bezierCurveTo(9,6,4,6,0,3);
   ctx.bezierCurveTo(-4,0,-5,-5,-4,-9);
   ctx.closePath();
   ctx.fillStyle='#6d3510';ctx.fill();

   // Golden banana body.
   ctx.beginPath();
   ctx.moveTo(-7,-8);
   ctx.bezierCurveTo(-10,-1,-8,6,-2,8);
   ctx.bezierCurveTo(4,11,9,7,11,3);
   ctx.bezierCurveTo(7,6,3,5,0,3);
   ctx.bezierCurveTo(-3,1,-4,-4,-3,-7);
   ctx.closePath();
   ctx.fillStyle=golden?'#ffe34e':'#ffc72d';ctx.fill();

   // Warm lower shade and bright upper highlight.
   ctx.strokeStyle='#dd8b12';ctx.lineWidth=2;
   ctx.beginPath();ctx.moveTo(-6,2);ctx.bezierCurveTo(-3,8,4,9,9,5);ctx.stroke();
   ctx.strokeStyle=golden?'#fff8a6':'#ffe977';ctx.lineWidth=2;
   ctx.beginPath();ctx.moveTo(-5,-5);ctx.bezierCurveTo(-6,-1,-4,2,-1,4);ctx.stroke();

   // Tip.
   ctx.fillStyle='#5b2e11';ctx.fillRect(-9,-11,4,3);
   ctx.restore()
  };

  // Three overlapping curved bananas, matching the clean bunch in the reference.
  drawOne(-8,2,-.34,.92);
  drawOne(0,-1,-.12,1);
  drawOne(8,2,.13,.88);

  // Shared stem.
  ctx.fillStyle='#5b3514';ctx.fillRect(-2,-15,5,6);
  ctx.fillStyle='#8f5b18';ctx.fillRect(-1,-16,3,4);
  ctx.fillStyle='#d38e22';ctx.fillRect(0,-16,2,2);
  ctx.restore()
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
   for(const b of run.bananas)bananaBunch(b.x,-b.y,b.golden)
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
