import {PLAYER_X,BIOMES,playerBox,obstacleBoxes} from './engine.js';
import {SPRITES} from './sprites.js';

const images=new Map();let onLoad=()=>{};
export function asset(src){if(images.has(src))return images.get(src);const im=new Image();images.set(src,im);im.onload=()=>onLoad();im.onerror=()=>{im.failed=true;onLoad()};im.src=src;return im}
const ready=im=>im&&im.complete&&im.naturalWidth&&!im.failed;
const mix=(a,b,t)=>{const A=a.match(/\w\w/g).map(x=>parseInt(x,16)),B=b.match(/\w\w/g).map(x=>parseInt(x,16));return`rgb(${A.map((x,i)=>Math.round(x+(B[i]-x)*t)).join(',')})`};

const PLAYER_VISUAL_DROP=12;
const HAZARD_VISUAL_DROP=PLAYER_VISUAL_DROP;

export function createRenderer(canvas){
 const ctx=canvas.getContext('2d'),
  jungle=asset('assets/jungle-v2.webp'),
  bodies=asset('assets/body-atlas.webp'),
  ufo=asset('assets/ufo-claw.png'),
  restoredGround=asset('assets/ground-green.png');
 const spriteNames=['log','rock','mushroom','thorns','stump','stone','spike','puddle','spike-patch','ravine','branch','vine','temple-beam','canopy','banana','golden'];
 const hazardSprites=Object.fromEntries(spriteNames.map(name=>[name,asset(`assets/sprites-clean/${name}.png`)]));
 let current=null,sceneTime=0;

 const redraw=()=>current&&draw(...current);onLoad=redraw;

 function tile(im,index,x,y,w,h){
  if(!ready(im)||index<0)return false;
  const frames=im===bodies?SPRITES.body:SPRITES.obstacles,[cx,cy,cw,ch]=frames[index];
  ctx.drawImage(im,cx,cy,cw,ch,x,y,w,h);return true
 }

 function drawHead(im,x,y,size,rotation=0){
  if(!ready(im))return false;
  ctx.save();ctx.translate(x+size/2,y+size/2);ctx.rotate(rotation);
  ctx.shadowColor='#85eaf0';ctx.shadowBlur=5;ctx.fillStyle='#8ddce333';ctx.strokeStyle='#d8ffff';ctx.lineWidth=3;
  ctx.beginPath();ctx.arc(0,0,size*.49,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.shadowBlur=0;
  ctx.save();ctx.beginPath();ctx.arc(0,0,size*.445,0,Math.PI*2);ctx.clip();
  // Shift the portrait crop toward its face center and widen it for a gentler zoom.
  ctx.drawImage(im,im.width*.16,im.height*.035,im.width*.84,im.height*.76,-size*.485,-size*.465,size*.97,size*.95);
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
  for(let layer=0;layer<3;layer++){
   ctx.save();
   ctx.globalAlpha=.028+layer*.018;
   ctx.fillStyle=layer===0?'#c7efe0':'#0a231f';
   const off=(run.distance*(1.1+layer*1.7))%(280+layer*80);
   for(let x=-420;x<w+420;x+=280+layer*80){
    const xx=x-off,yy=h*(.28+layer*.15),ww=210+layer*65;
    ctx.fillRect(xx,yy,ww,8+layer*3);
    ctx.fillRect(xx+18,yy+6,ww*.72,7+layer*2);
   }
   ctx.restore()
  }
  ctx.save();ctx.globalAlpha=.045;ctx.strokeStyle='#d4f4d7';for(let i=0;i<5;i++){const x=(w*.12+i*w*.18+run.distance*.3)%(w+220)-110;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x-90,h*.58);ctx.stroke()}ctx.restore()
  if(run.stage%8===5){ctx.fillStyle='#dfe6ff';ctx.globalAlpha=.65;ctx.beginPath();ctx.arc(w*.8,h*.17,34,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1}
  if(run.event?.name==='MONSOON'||run.stage%8===6){ctx.strokeStyle='#c6e9ff';ctx.globalAlpha=.22;for(let i=0;i<40;i++){const x=(i*73+run.time*180)%(w+60)-30,y=(i*47+run.time*260)%(h*.8);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-8,y+20);ctx.stroke()}ctx.globalAlpha=1}
  if(run.event?.name==='BOULDER CHASE'){ctx.fillStyle='#26332d';ctx.globalAlpha=.72;ctx.beginPath();ctx.arc(38,h*.72,58,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1}
  if(run.event?.name==='STAMPEDE'){ctx.fillStyle='#172b22';ctx.globalAlpha=.48;for(let i=0;i<5;i++){const x=(w+180-i*110-run.time*70)%(w+350)-80,y=h*(.62+(i%2)*.04);ctx.beginPath();ctx.ellipse(x,y,31,16,0,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1}
  if(run.event?.name==='TEMPLE COLLAPSE'){ctx.fillStyle='#725f43';ctx.globalAlpha=.35;for(let i=0;i<6;i++){const x=w*.58+i*42,y=(run.time*35+i*31)%(h*.55);ctx.save();ctx.translate(x,y);ctx.rotate(run.time+i);ctx.fillRect(-9,-9,18,18);ctx.restore()}ctx.globalAlpha=1}
 }


 function ground(vw,h,run){
  const tile=restoredGround;
  if(ready(tile)){
   const displayH=42,displayW=tile.width/tile.height*displayH;
   const offset=(run.distance*100)%displayW;
   for(let x=-displayW;x<vw+displayW;x+=displayW)ctx.drawImage(tile,x-offset,PLAYER_VISUAL_DROP-20,displayW,displayH);
  }else{ctx.fillStyle='#326c2c';ctx.fillRect(0,PLAYER_VISUAL_DROP,vw,Math.max(60,h))}
 }

 function pxRect(x,y,w,h,col){ctx.fillStyle=col;ctx.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)))}

 function obstacle(o){
  const boxes=obstacleBoxes(o),overhead=['overhead','flex'].includes(o.family);
  const x=o.x+(o._mx||0),baseline=HAZARD_VISUAL_DROP-(o._my||0);
  const top=overhead?Math.max(...boxes.map(b=>b.y+b.h))-(o._my||0):o.h;
  const bottom=overhead?Math.min(...boxes.map(b=>b.y))-(o._my||0):0;
  const extra=overhead?12:0;
  const y=baseline-top-extra,height=top-bottom+extra;
  const im=hazardSprites[o.id==='log-pile'?'log':o.id];
  if(ready(im)){
   ctx.save();ctx.shadowColor='#061a14';ctx.shadowBlur=3;
   if(o.id==='log-pile'){
    const aspect=Math.max(.5,im.width/im.height),dh=Math.min(height,Math.max(18,height*.92)),dw=Math.min(o.w*.42,dh*aspect);
    const gap=(o.w-dw*3)/2,baseY=baseline-dh;
    ctx.drawImage(im,x,baseY+2,dw,dh);
    ctx.drawImage(im,x+dw+gap,baseY-1,dw,dh);
    ctx.drawImage(im,x+(dw+gap)*2,baseY+2,dw,dh);
   }else if(overhead)ctx.drawImage(im,0,0,im.width,Math.round(im.height*.58),x,y,o.w,height);

   else ctx.drawImage(im,x,y,o.w,height);
   ctx.restore();
  }else{
   // Failed or pending assets retain exactly the collider's visible footprint.
   ctx.fillStyle=overhead?'#9a7045':o.family==='wide'?'#399bbc':'#997344';
   for(const b of boxes)ctx.fillRect(b.x,HAZARD_VISUAL_DROP-b.y-b.h,b.w,b.h);
  }
 }

 function bananaBunch(x,y,golden=false){
  const im=hazardSprites[golden?'golden':'banana'];
  ctx.save();
  if(ready(im)){const h=30,w=Math.min(38,h*im.width/im.height);ctx.drawImage(im,x-w/2,y-h/2+PLAYER_VISUAL_DROP,w,h)}
  else{ctx.font='26px serif';ctx.textAlign='center';ctx.fillText('🍌',x,y+10+PLAYER_VISUAL_DROP)}
  ctx.restore()
 }

 function drawDashTrail(run){
  if(!(run.modeTime>0||run.dashing||run.dashTrail>0))return;
  const intensity=Math.max(run.modeTime>0?1:0,run.dashTrail||0);
  for(let i=0;i<16;i++){
   const dx=24+i*10+((sceneTime*180+i*23)%12),dy=((i%4)-1.5)*4,size=(12-i*.52)*(.78+.3*intensity),a=Math.max(.05,.38-i*.018)*intensity;
   ctx.globalAlpha=a;ctx.fillStyle=i%2?'#ddd6a9':'#c5be8f';ctx.beginPath();ctx.ellipse(PLAYER_X-dx,-6+dy,size,size*.55,0,0,Math.PI*2);ctx.fill();
   ctx.fillStyle='#9fa46e';ctx.fillRect(PLAYER_X-dx-3,-2+dy,6,2);
  }
  ctx.globalAlpha=.18*intensity;ctx.fillStyle='#f6e86a';for(let i=0;i<5;i++)ctx.fillRect(PLAYER_X-46-i*14,-54+i*3,10,34);
  ctx.globalAlpha=1
 }

 function character(state,run,selected,showHead=true){
  const im=asset(selected.image),sliding=run.y===0&&(run.slideTime>0||run.slideHeld||run.slideBlocked),runFrames=[0,1,2,3,2,1],frame=state==='over'?7:sliding?7:run.y>0?(run.vy>70?5:6):run.landing>0?7:state==='running'?runFrames[Math.floor(run.time*(12+run.speed/70))%runFrames.length]:4,bf=SPRITES.body[frame],necks=[[240,168],[596,160],[988,160],[1384,168],[210,645],[584,596],[944,650],[1380,724]],neck=necks[frame],bs=.22;
  const bob=!sliding&&run.y===0&&state==='running'?Math.sin(run.time*24)*1.8:0,rot=sliding?-.18:run.vy>0?-.04:run.vy<0?.035:(!sliding&&state==='running'?Math.sin(run.time*12)*.02:0);
  ctx.save();ctx.translate(PLAYER_X+(run.shake?Math.sin(run.time*110)*3:0),-run.y+bob+PLAYER_VISUAL_DROP);ctx.rotate(rot);
  if(run.shield||run.invulnerable>0){ctx.strokeStyle=run.shield?'#a5ffe4':'#fff2a2';ctx.lineWidth=3;ctx.globalAlpha=.65+.25*Math.sin(run.time*30);ctx.beginPath();ctx.ellipse(sliding?8:0,sliding?-25:-49,sliding?52:43,sliding?28:58,0,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1}
  let bx=-(neck[0]-bf[0])*bs,by=-bf[3]*bs;if(sliding){ctx.translate(8,3);ctx.rotate(-.12);bx-=7;by+=16}
  tile(bodies,frame,bx,by,bf[2]*bs,bf[3]*bs);
  const headY=by+(neck[1]-bf[1])*bs-(sliding?44:51);
  if(showHead&&!drawHead(im,-29,headY-1,58,sliding?.12:0)){ctx.fillStyle='#e4e984';ctx.font='36px monospace';ctx.textAlign='center';ctx.fillText('?',0,-58)}
  if(run.modeTime>0){ctx.globalAlpha=.18;ctx.fillStyle='#f8ed72';for(let i=1;i<5;i++)ctx.fillRect(-i*13,-55+i*3,8,35);ctx.globalAlpha=1}
  ctx.restore()
 }

 function arrival(run,selected){
  const t=Math.max(0,run.introTime||0),ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
  // Idle body frame 4 and the installed helmet share this exact neck anchor.
  const headY=PLAYER_VISUAL_DROP-282*.22+13*.22-52;
  const attach=1.16,release=1.50,headOffset=173;
  const restingCraftY=headY-headOffset;
  const craftY=restingCraftY-340*(1-ease(t/attach))-360*ease((t-release)/1.05);
  const attached=t>=attach;
  character('intro',run,selected,attached);
  const im=asset(selected.image);
  if(!attached)drawHead(im,PLAYER_X-29,craftY+headOffset,58);
  if(ready(ufo)){
   ctx.save();ctx.globalAlpha=Math.max(0,Math.min(1,(2.55-t)/.2));
   ctx.drawImage(ufo,PLAYER_X-75,craftY,150,225);ctx.restore();
  }
 }

 function draw(state,run,selected,particles=[]){
  current=[state,run,selected,particles];if(!ctx)return;sceneTime=run.time||0;
  const w=canvas.width,h=canvas.height;if(!w||!h)return;
  const active=['intro','running','countdown','paused','over'].includes(state),vw=Math.max(600,Math.min(1080,w/h*500)),scale=w/vw,groundY=h*.9;
  ctx.clearRect(0,0,w,h);ctx.imageSmoothingEnabled=false;sky(w,h,run);
  ctx.save();ctx.translate(0,groundY);ctx.scale(scale,scale);ground(vw,h/scale,run);
  if(active){
   for(const o of run.obstacles)obstacle(o);
   for(const b of run.bananas)bananaBunch(b.x,-b.y,b.golden)
   if(run.power){ctx.save();ctx.shadowColor='#a5ffe4';ctx.shadowBlur=14;ctx.font='30px serif';ctx.textAlign='center';ctx.fillText('🛡️',run.power.x,-run.power.y+12+PLAYER_VISUAL_DROP);ctx.restore()}
   drawDashTrail(run);
   if(state==='intro'||(state==='paused'&&run.introTime>0&&run.introTime<2.55))arrival(run,selected);else character(state,run,selected);
   for(const p of particles){ctx.globalAlpha=Math.min(1,p.life/.4);ctx.fillStyle=p.color||'#d0dca0';if(p.label){ctx.font='bold 18px monospace';ctx.fillText(p.label,p.x,-p.y)}else ctx.fillRect(p.x,-p.y,p.size||4,p.size||4)}
   ctx.globalAlpha=1;
   if(run.debug){ctx.strokeStyle='#ff4d7d';const p=playerBox(run);ctx.strokeRect(p.x,PLAYER_VISUAL_DROP-p.y-p.h,p.w,p.h);ctx.strokeStyle='#ffe45f';for(const o of run.obstacles)for(const b of obstacleBoxes(o))ctx.strokeRect(b.x,HAZARD_VISUAL_DROP-b.y-b.h,b.w,b.h)}
  }
  ctx.restore();
  if(run.event){ctx.fillStyle='#e8f6dc';ctx.globalAlpha=.65;ctx.font=`${Math.max(12,w/85)}px monospace`;ctx.textAlign='right';ctx.fillText(run.event.name,w-24,h*.19);ctx.globalAlpha=1}
 }

 function resize(){try{const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.max(1,Math.round(r.width*dpr));canvas.height=Math.max(1,Math.round(r.height*dpr));redraw()}catch{}}
 return{draw,resize}
}
