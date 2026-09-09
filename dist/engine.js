// Deterministic, fixed-timestep endless-runner simulation. World units are pixels.
export const STEP=1/120,PLAYER_X=150,BASE_SPEED=265,MAX_SPEED=540,GRAVITY=2200,JUMP_IMPULSE=600,LOW_HEIGHT=70,HOLD_TIME=.22,JUMP_BUFFER=.16,COYOTE_TIME=.10;
export const BIOMES=[['THE EMERALD WILDS','#73c897','#174e3d'],['CANOPY RUN','#5bb98d','#123e34'],['WATERFALL GORGE','#83cbd3','#24556a'],['LOST TEMPLE','#d6b978','#4c553c'],['MOONLIT JUNGLE','#797ac7','#161f4e'],['STORM FOREST','#708799','#172b37'],['VOLCANIC WILDS','#e98a58','#49262d'],['CHIMPION DREAMSCAPE','#d78bd0','#293066']];

// Collision boxes intentionally sit inside the visual art for fair silhouettes.
export const TYPES=[
 {id:'log',name:'fallen log',family:'short',action:'jump',w:52,h:25,boxes:[[7,0,38,20]],tile:0,minStage:1,difficulty:1,reaction:.72,recovery:.58},
 {id:'rock',name:'moss rock',family:'short',action:'jump',w:46,h:31,boxes:[[8,0,31,24]],tile:1,minStage:1,difficulty:1,reaction:.72,recovery:.58},
 {id:'mushroom',name:'mushrooms',family:'short',action:'jump',w:48,h:25,boxes:[[9,0,30,19]],tile:2,minStage:1,difficulty:1,reaction:.72,recovery:.58},
 {id:'thorns',name:'thorn bush',family:'short',action:'jump',w:50,h:33,boxes:[[9,1,32,24]],tile:3,minStage:2,difficulty:2,reaction:.78,recovery:.62},
 {id:'stump',name:'tree stump',family:'high',action:'high-jump',w:58,h:89,boxes:[[7,0,44,84]],tile:4,minStage:2,difficulty:2,reaction:.88,recovery:.82},
 {id:'stone',name:'ancient stone',family:'high',action:'high-jump',w:54,h:94,boxes:[[7,0,40,89]],tile:5,minStage:3,difficulty:3,reaction:.92,recovery:.86},
 {id:'spike',name:'spike plant',family:'high',action:'high-jump',w:55,h:84,boxes:[[8,0,39,76]],tile:6,minStage:3,difficulty:3,reaction:.92,recovery:.84},
 {id:'puddle',name:'wide puddle',family:'wide',action:'high-jump',w:132,h:15,boxes:[[3,0,126,12]],tile:-1,minStage:2,difficulty:2,reaction:1,recovery:.95},
 {id:'spike-patch',name:'wide spikes',family:'wide',action:'high-jump',w:148,h:27,boxes:[[5,0,138,22]],tile:-1,minStage:3,difficulty:3,reaction:1.05,recovery:1},
 {id:'ravine',name:'broken pathway',family:'wide',action:'high-jump',w:164,h:18,boxes:[[2,0,160,14]],tile:-1,minStage:4,difficulty:4,reaction:1.08,recovery:1.02},
 {id:'branch',name:'hanging branch',family:'overhead',action:'slide',w:115,h:78,boxes:[[5,52,105,22]],tile:-1,minStage:2,difficulty:2,reaction:.92,recovery:.62},
 {id:'vine',name:'hanging vines',family:'overhead',action:'slide',w:96,h:82,boxes:[[7,50,82,25]],tile:-1,minStage:3,difficulty:2,reaction:.94,recovery:.66},
 {id:'temple-beam',name:'temple beam',family:'overhead',action:'slide',w:134,h:86,boxes:[[4,51,126,27]],tile:-1,minStage:4,difficulty:3,reaction:1,recovery:.72},
 {id:'canopy',name:'fallen canopy',family:'flex',action:'jump-or-slide',w:98,h:74,boxes:[[5,49,88,20]],tile:-1,minStage:4,difficulty:3,reaction:.98,recovery:.72}
];
export function hashSeed(value){let h=2166136261;for(const c of String(value)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0||1}
export function dailySeed(date=new Date()){return hashSeed(date.toISOString().slice(0,10))}
export function randomValue(r){let t=r.seedState+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}
export function stageAt(t){return Math.floor((Math.max(0,t)+1e-7)/30)+1}
export function targetSpeed(stage){const s=Math.max(0,stage-1);return Math.min(MAX_SPEED,BASE_SPEED+s*24+Math.max(0,s-2)*6)}
export function speedAt(t){if(t<30)return BASE_SPEED;const s=stageAt(t),target=targetSpeed(s),previous=targetSpeed(s-1),phase=t%30;return previous+(target-previous)*(1-Math.exp(-phase/2.5))}
export function flowMultiplier(flow){return flow>=100?5:flow>=80?3:flow>=60?2:flow>=40?1.5:flow>=20?1.25:1}
export function createRun(options={}){const seed=(options.seed??hashSeed(`${Date.now()}-${Math.random()}`))>>>0;return{mode:options.mode||'normal',seed,seedState:seed,time:0,introTime:0,stage:1,stageChanged:0,distance:0,score:0,bonus:0,speed:BASE_SPEED,targetSpeed:BASE_SPEED,y:0,vy:0,jumpHeld:false,jumpAge:0,jumpBuffer:0,jumpBufferHeld:false,coyote:COYOTE_TIME,slideHeld:false,slideTime:0,slideMin:0,slideBlocked:false,playerState:'run',landing:0,obstacles:[],bananas:[],bananaCount:0,goldenBananas:0,spawnDistance:620,patternIndex:0,currentPattern:'intro',lastDifficulty:1,lastAction:'none',shield:false,invulnerable:0,shieldHit:0,shieldBreaks:0,power:null,nextPower:16,dead:false,passed:0,flow:0,maxFlow:0,combo:0,longestCombo:0,modeTime:0,perfectJumps:0,perfectSlides:0,nearMisses:0,notice:'TAP JUMP · HOLD HIGH · SLIDE LOW',noticeTime:4,event:null,nextEvent:78,splits:[],nextSplit:1,debug:false,shake:0,slowMo:0,dashing:false,dashTrail:0}}
export function playerBox(r){const sliding=r.y===0&&(r.slideTime>0||r.slideHeld||r.slideBlocked);return{x:PLAYER_X-16,y:r.y+5,w:32,h:sliding?31:78,sliding}}
const rectHit=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
export const obstacleBoxes=o=>(o.boxes||[[0,0,o.w,o.h]]).map(b=>({x:o.x+b[0],y:b[1],w:b[2],h:b[3]}));
export function collides(r,o){if(r.invulnerable>0||o.resolved==='hit')return false;const p=playerBox(r);return obstacleBoxes(o).some(b=>rectHit(p,b))}
function overheadBlocksStand(r){const stand={x:PLAYER_X-16,y:5,w:32,h:78};return r.obstacles.some(o=>['overhead','flex'].includes(o.family)&&o.resolved!=='hit'&&obstacleBoxes(o).some(b=>rectHit(stand,b)))}
export function jump(r,held=true){if(r.dead)return false;if(r.y===0||r.coyote>0){r.slideHeld=false;r.slideTime=0;r.slideBlocked=false;r.vy=JUMP_IMPULSE;r.jumpHeld=held;r.jumpAge=0;r.jumpBuffer=0;r.jumpBufferHeld=false;r.coyote=0;r.playerState='jump-ascend';return true}r.jumpBuffer=JUMP_BUFFER;r.jumpBufferHeld=held;return false}
export function releaseJump(r){if(r.jumpHeld&&r.jumpAge<HOLD_TIME&&r.vy>0&&r.y<LOW_HEIGHT)r.vy=Math.min(r.vy,Math.sqrt(Math.max(0,2*GRAVITY*(LOW_HEIGHT-r.y))));r.jumpHeld=false;r.jumpBufferHeld=false}
export function slide(r,held=true){if(r.dead)return false;r.slideHeld=held;if(held&&r.y===0){r.slideMin=Math.max(r.slideMin,.24);r.slideTime=Math.max(r.slideTime,.24);r.playerState='slide-enter';return true}return false}
export function releaseSlide(r){r.slideHeld=false}
function movePlayer(r,dt){r.landing=Math.max(0,r.landing-dt);r.jumpBuffer=Math.max(0,r.jumpBuffer-dt);r.slideMin=Math.max(0,r.slideMin-dt);r.slideTime=Math.max(0,r.slideTime-dt);if(r.y===0){if(!r.vy)r.coyote=COYOTE_TIME;r.slideBlocked=!r.slideHeld&&r.slideMin<=0&&overheadBlocksStand(r);if(r.slideHeld||r.slideMin>0||r.slideBlocked){r.slideTime=Math.max(r.slideTime,dt);r.playerState=r.slideHeld?'slide':'slide-exit'}else r.playerState=r.landing>0?'land':'run'}else r.coyote=Math.max(0,r.coyote-dt);if(!r.vy&&!r.y){if(r.jumpBuffer>0)jump(r,r.jumpBufferHeld);return false}const gravity=r.jumpHeld&&r.jumpAge<HOLD_TIME&&r.vy>0?0:(r.vy<0?GRAVITY*1.14:GRAVITY);r.jumpAge+=dt;r.y+=r.vy*dt-gravity*dt*dt/2;r.vy-=gravity*dt;r.playerState=r.vy>80?'jump-ascend':r.vy>-80?'jump-apex':'fall';if(r.y<=0){r.y=0;r.vy=0;r.jumpHeld=false;r.landing=.095;r.playerState='land';if(r.jumpBuffer>0)jump(r,r.jumpBufferHeld);return true}return false}
function cloneType(t,x){return{...t,x,passed:false,resolved:'unresolved',nearAwarded:false,perfectAwarded:false,minClearance:999}}
const reactionDistance=(speed,seconds)=>Math.max(280,speed*seconds);
function patternCatalog(stage){const early=stage<=2,late=stage>=5;return[
 {id:'easy-hop',difficulty:1,weight:5,items:[['short',0]],recovery:.75},
 {id:'high-wall',difficulty:2,weight:stage>1?3:0,items:[['high',0]],recovery:.95},
 {id:'wide-leap',difficulty:2,weight:stage>1?3.2:0,items:[['wide',0]],recovery:1.03},
 {id:'duck-under',difficulty:2,weight:stage>1?(late?5.0:3.2):0,items:[['overhead',0]],recovery:late?.72:.78},
 {id:'choice-line',difficulty:3,weight:stage>3?2.1:0,items:[['flex',0]],recovery:.82},
 {id:'quick-hop-high',difficulty:3,weight:stage>1?2.4:0,items:[['short',0],['high',early?1.12:.88]],recovery:.98},
 {id:'duck-then-hop',difficulty:3,weight:stage>2?2.6:0,items:[['overhead',0],['short',early?1.05:.84]],recovery:.92},
 {id:'slide-gauntlet',difficulty:3,weight:stage>3?2.2:0,items:[['overhead',0],['overhead',.90]],recovery:.86},
 {id:'hop-then-duck',difficulty:4,weight:stage>3?1.8:0,items:[['short',0],['overhead',.98]],recovery:.96},
 {id:'double-rhythm',difficulty:4,weight:stage>4?1.4:0,items:[['short',0],['short',.82]],recovery:.90},
 {id:'wide-into-slide',difficulty:4,weight:stage>4?1.7:0,items:[['wide',0],['overhead',.98]],recovery:.98},
 {id:'high-into-slide',difficulty:4,weight:stage>4?1.7:0,items:[['high',0],['overhead',.96]],recovery:.96},
 {id:'beam-pressure',difficulty:5,weight:stage>5?1.4:0,items:[['overhead',0],['short',.90],['overhead',.92]],recovery:.94},
 {id:'triple-rhythm',difficulty:5,weight:stage>6?1.0:0,items:[['short',0],['overhead',.92],['wide',1.02]],recovery:1.0}
 ].filter(p=>p.weight>0&&p.difficulty<=Math.min(5,stage+1))}
function chooseWeighted(list,r){let total=list.reduce((n,x)=>n+x.weight,0),roll=randomValue(r)*total;for(const x of list){roll-=x.weight;if(roll<=0)return x}return list.at(-1)}
function chooseFamily(r,family,difficulty){const list=TYPES.filter(t=>t.minStage<=r.stage&&t.difficulty<=difficulty+1&&t.family===family);return list[Math.floor(randomValue(r)*list.length)]||TYPES[0]}
function directPattern(r){let options=patternCatalog(r.stage);if(r.lastDifficulty>=4)options=options.filter(p=>p.difficulty<=3);const def=chooseWeighted(options,r),start=1080+reactionDistance(r.speed,def.difficulty>=4?1.02:.86),items=[];for(let i=0;i<def.items.length;i++){const[family,gap]=def.items[i],type=chooseFamily(r,family,def.difficulty),x=i?items.at(-1).x+items.at(-1).w+r.speed*gap:start;items.push(cloneType(type,x))}return{id:def.id,difficulty:def.difficulty,items,recovery:def.recovery}}
export function buildPattern(speed,index,random=Math.random,stage=1){const fake=createRun({seed:Math.floor(random()*0xffffffff)});fake.stage=stage;fake.speed=speed;fake.patternIndex=index;return directPattern(fake)}
export function validatePattern(items,speed){if(!items.length)return false;let previous=null;for(const o of items){if(o.x<PLAYER_X+reactionDistance(speed,.55))return false;if(previous){const seconds=(o.x-(previous.x+previous.w))/speed;if(seconds<Math.max(.58,previous.recovery||.58))return false}previous=o}return true}
function pushBanana(r,x,y,golden=false){r.bananas.push({x,y,golden,collected:false})}
function spawnBananaArc(r,startX,endX,apexY,baseY,count=5,goldenChance=.08){
 const span=endX-startX;
 for(let i=0;i<count;i++){
  const t=count===1?.5:i/(count-1),arch=1-Math.pow(t*2-1,2);
  pushBanana(r,startX+t*span,baseY+arch*(apexY-baseY),false)
 }
 if(randomValue(r)<goldenChance)pushBanana(r,startX+span*.5,apexY+18,true)
}
function spawnLowTrail(r,startX,endX,y=24,count=4){
 const span=endX-startX;
 for(let i=0;i<count;i++)pushBanana(r,startX+(i+.5)*span/count,y+(i%2?4:0),false);
 if(randomValue(r)<.05)pushBanana(r,startX+span*.5,y+10,true)
}
function sprinkleGapBananas(r,left,right){
 const gap=right-left;if(gap<125||randomValue(r)<.30)return;
 const mode=randomValue(r);
 if(mode<.34){
  const y=52+randomValue(r)*14,count=3+Math.floor(randomValue(r)*3),span=right-left;
  for(let i=0;i<count;i++)pushBanana(r,left+(i+.5)*span/count,y+(i%2?5:0),false)
 }else if(mode<.70){
  spawnBananaArc(r,left+10,right-10,100+randomValue(r)*14,58+randomValue(r)*8,4+Math.floor(randomValue(r)*2),.04)
 }else{
  spawnBananaArc(r,left+12,right-12,154+randomValue(r)*18,104+randomValue(r)*8,5+Math.floor(randomValue(r)*2),.06)
 }
}
function addBananas(r,o){
 if(o.action==='slide')spawnLowTrail(r,o.x+12,o.x+o.w-10,24+randomValue(r)*4,4);
 else if(o.action==='high-jump'||o.family==='wide'||o.family==='flex')spawnBananaArc(r,o.x-6,o.x+o.w+6,150+randomValue(r)*14,104+randomValue(r)*8,5,.08);
 else spawnBananaArc(r,o.x-2,o.x+o.w+8,100+randomValue(r)*10,70+randomValue(r)*6,4,.07)
}
function spawnPattern(r){
 const p=directPattern(r);r.currentPattern=p.id;r.lastDifficulty=p.difficulty;r.patternIndex++;
 for(let i=0;i<p.items.length;i++){
  const o=p.items[i];r.obstacles.push(o);addBananas(r,o);
  if(i>0){const prev=p.items[i-1];sprinkleGapBananas(r,prev.x+prev.w+18,o.x-18)}
 }
 const last=p.items.at(-1),latePressure=Math.min(.18,Math.max(0,r.stage-4)*.025),travelSpace=Math.max(.66,p.recovery-latePressure)+(p.difficulty>=4?.20:0);
 if(randomValue(r)>.42)sprinkleGapBananas(r,last.x+last.w+28,last.x+last.w+r.speed*Math.max(.48,p.recovery*.62));
 r.spawnDistance=last.x+last.w-p.items[0].x+r.speed*travelSpace+randomValue(r)*r.speed*(r.stage>=5?.20:.30);
 r.notice=p.id==='quick-hop-high'?'QUICK HOP · RESET · HIGH JUMP':p.id==='duck-under'?'SLIDE UNDER':p.id==='wide-leap'?'HOLD FOR THE WIDE JUMP':p.id==='slide-gauntlet'?'LOW CEILING · STAY DOWN':p.id==='wide-into-slide'?'LONG JUMP · THEN SLIDE':p.id==='high-into-slide'?'HIGH CLEARANCE · THEN DUCK':'';
 r.noticeTime=r.notice?2.1:0
}
function skill(r,amount,points,event){r.flow=Math.min(100,r.flow+amount);r.maxFlow=Math.max(r.maxFlow,r.flow);r.combo++;r.longestCombo=Math.max(r.longestCombo,r.combo);r.bonus+=Math.round(points*flowMultiplier(r.flow));r.notice=event;r.noticeTime=.8;if(r.flow>=100&&r.modeTime<=0){r.modeTime=8;r.notice='CHIMPION MODE!';r.noticeTime=1.6;return'chimpion-mode'}return event}
function checkResolution(r,o,events){if(o.resolved==='hit')return;const p=playerBox(r);if(o.x<PLAYER_X+28&&o.x+o.w>PLAYER_X-28)for(const b of obstacleBoxes(o)){const vertical=p.y>=b.y+b.h?p.y-(b.y+b.h):b.y-(p.y+p.h);o.minClearance=Math.min(o.minClearance,Math.max(0,vertical))}if(!o.passed&&o.x+o.w<PLAYER_X-18){o.passed=true;r.passed++;let event='pass';const didSlide=o.action==='slide'&&p.sliding,didJump=o.action!=='slide'&&r.y>0;if((didSlide||didJump)&&o.minClearance<24){if(didSlide){r.perfectSlides++;event=skill(r,13,80,'PERFECT SLIDE')}else{r.perfectJumps++;event=skill(r,12,80,'PERFECT JUMP')}}else if(o.minClearance<13){r.nearMisses++;event=skill(r,9,55,'CLOSE CALL')}else{r.flow=Math.min(100,r.flow+4);r.combo++;r.longestCombo=Math.max(r.longestCombo,r.combo)}events.push(event)}}
function startEvent(r){const names=['BOULDER CHASE','MONSOON','STAMPEDE','TEMPLE COLLAPSE'];r.event={name:names[(r.stage+r.seed)%names.length],time:12};r.nextEvent=r.time+75+randomValue(r)*35;r.notice=r.event.name;r.noticeTime=1.8}
export function step(r,dt){if(r.dead)return[];const events=[];r.time+=dt;const next=stageAt(r.time);if(next!==r.stage){r.stage=next;r.stageChanged=1.8;r.targetSpeed=targetSpeed(r.stage);r.notice=`STAGE ${String(r.stage).padStart(2,'0')} · ${BIOMES[(r.stage-1)%BIOMES.length][0]}`;r.noticeTime=1.8;r.spawnDistance=Math.max(r.spawnDistance,r.speed*1.2);events.push('stage')}r.stageChanged=Math.max(0,r.stageChanged-dt);r.targetSpeed=targetSpeed(r.stage);r.speed=r.time<30?BASE_SPEED:r.speed+(r.targetSpeed-r.speed)*Math.min(1,dt/2.5);r.modeTime=Math.max(0,r.modeTime-dt);r.flow=Math.max(0,r.flow-dt*(r.modeTime>0?1:2.5));r.invulnerable=Math.max(0,r.invulnerable-dt);r.shieldHit=Math.max(0,r.shieldHit-dt);r.shake=Math.max(0,r.shake-dt);r.slowMo=Math.max(0,r.slowMo-dt);if(r.time>=r.nextEvent&&!r.event&&r.stage>=3)startEvent(r);if(r.event){r.event.time-=dt;if(r.event.time<=0)r.event=null}const dx=r.speed*dt;r.distance+=dx/100;r.noticeTime=Math.max(0,r.noticeTime-dt);if(movePlayer(r,dt))events.push('land');r.dashing=r.y===0&&(r.slideHeld||r.slideMin>0);r.dashTrail=r.dashing?Math.min(1,(r.dashTrail||0)+dt*8):Math.max(0,(r.dashTrail||0)-dt*4);r.spawnDistance-=dx;if(r.spawnDistance<=0)spawnPattern(r);for(const o of r.obstacles){o.x-=dx;if(collides(r,o)){if(r.shield){r.shield=false;r.shieldBreaks++;r.invulnerable=.7;r.shieldHit=.34;r.shake=.22;r.slowMo=.12;r.flow=Math.max(0,r.flow-35);r.combo=0;o.resolved='hit';o.x=-o.w-50;events.push('shield-used')}else{r.dead=true;r.playerState='game-over';events.push('dead');break}}checkResolution(r,o,events)}r.obstacles=r.obstacles.filter(o=>o.x+o.w>-40);for(const b of r.bananas){b.x-=dx;if(!b.collected&&Math.abs(b.x-PLAYER_X)<27&&Math.abs(b.y-(r.y+(playerBox(r).sliding?18:48)))<31){b.collected=true;r.bananaCount++;const value=b.golden?500:25;r.goldenBananas+=b.golden?1:0;r.bonus+=Math.round(value*flowMultiplier(r.flow));r.flow=Math.min(100,r.flow+(b.golden?30:3));r.maxFlow=Math.max(r.maxFlow,r.flow);events.push(b.golden?'golden':'banana');if(r.flow>=100&&r.modeTime<=0){r.modeTime=8;r.notice='CHIMPION MODE!';r.noticeTime=1.6;events.push('chimpion-mode')}}}r.bananas=r.bananas.filter(b=>!b.collected&&b.x>-35);if(r.time>=r.nextPower&&!r.power){r.power={x:1080+reactionDistance(r.speed,.8),y:126};r.nextPower=r.time+23+randomValue(r)*7}if(r.power){r.power.x-=dx;if(Math.abs(r.power.x-PLAYER_X)<34&&Math.abs(r.y+42-r.power.y)<43){r.shield=true;r.power=null;events.push('power')}else if(r.power.x<-40)r.power=null}if(r.time>=r.nextSplit){r.splits.push({time:Math.floor(r.time),distance:r.distance});r.nextSplit++}r.score=Math.floor(r.distance*10)+r.bonus;return events}
