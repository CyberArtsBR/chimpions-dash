import assert from 'node:assert/strict';
import {createRun,jump,releaseJump,slide,releaseSlide,step,STEP,buildPattern,validatePattern,stageAt,targetSpeed,BASE_SPEED,MAX_SPEED,PLAYER_X,TYPES,collides,playerBox,dailySeed,hashSeed} from './dist/engine.js';

function trajectory(hold){const r=createRun({seed:1});r.spawnDistance=1e9;jump(r);let max=0;for(let i=0;i<240;i++){if(i*STEP>=hold)releaseJump(r);step(r,STEP);max=Math.max(max,r.y)}return max}
const low=trajectory(.02),high=trajectory(.2);assert(low>=69&&low<72,{low});assert(high>198&&high<205,{high});

let jumpGuard=createRun({seed:91});jumpGuard.spawnDistance=1e9;assert(jump(jumpGuard));step(jumpGuard,STEP);const firstVy=jumpGuard.vy;assert(!jump(jumpGuard),'takeoff must consume coyote time');assert.equal(jumpGuard.vy,firstVy,'a second press cannot relaunch in midair');releaseJump(jumpGuard);
jumpGuard.y=6;jumpGuard.vy=-250;jump(jumpGuard);releaseJump(jumpGuard);while(jumpGuard.y>0)step(jumpGuard,STEP);assert(!jumpGuard.jumpHeld,'a released buffered tap must remain released after landing');

let r=createRun({seed:2});r.spawnDistance=1e9;for(let i=0;i<3600-1;i++)step(r,STEP);assert.equal(r.stage,1);assert.equal(r.speed,BASE_SPEED);step(r,STEP);assert.equal(r.stage,2);for(let i=0;i<600;i++)step(r,STEP);assert(r.speed>BASE_SPEED&&r.speed<targetSpeed(2));assert.equal(stageAt(60),3);assert(targetSpeed(999)<=MAX_SPEED);

const overhead={...TYPES.find(x=>x.id==='branch'),x:PLAYER_X,resolved:'unresolved',passed:false,minClearance:999};r=createRun({seed:3});r.spawnDistance=1e9;r.obstacles=[overhead];assert(collides(r,overhead));slide(r);step(r,STEP);assert(playerBox(r).sliding);assert(!collides(r,overhead));releaseSlide(r);for(let i=0;i<40;i++){overhead.x=PLAYER_X;step(r,STEP)}assert(r.slideBlocked,'must remain crouched under a branch');overhead.x=-200;step(r,STEP);assert(!r.slideBlocked);

r=createRun({seed:4});r.spawnDistance=1e9;r.shield=true;r.obstacles=[{...TYPES[0],x:PLAYER_X,resolved:'unresolved',passed:false,minClearance:999}];let events=step(r,STEP);assert(events.includes('shield-used'));assert(!r.dead&&!r.shield&&r.invulnerable>.6);const score=r.score;step(r,STEP);assert.equal(r.score,score,'resolved obstacle cannot score twice');

r=createRun({seed:5});r.spawnDistance=1e9;r.bananas=[{x:PLAYER_X,y:48,golden:true,collected:false}];events=step(r,STEP);assert(events.includes('golden'));assert.equal(r.goldenBananas,1);const bonus=r.bonus;step(r,STEP);assert.equal(r.bonus,bonus);
r=createRun({seed:6});r.spawnDistance=1e9;r.flow=99;r.bananas=[{x:PLAYER_X,y:48,golden:false,collected:false}];events=step(r,STEP);assert(events.includes('chimpion-mode'));assert(r.modeTime>7.9,'banana reaching full Flow must activate Chimpion Mode');

r=createRun({seed:7});r.spawnDistance=1e9;r.flow=99;r.obstacles=[{...TYPES[0],x:PLAYER_X-80,passed:false,resolved:'unresolved',minClearance:999}];events=step(r,STEP);assert(events.includes('chimpion-mode'),'clean passes reaching full Flow activate mode');

for(const stage of [1,2,3,5,10])for(const seed of [1,77,9001]){const p=buildPattern(targetSpeed(stage),1,()=>seed/10000,stage);assert(validatePattern(p.items,targetSpeed(stage)));for(const o of p.items)assert(o.minStage<=stage||o.id==='log')}
const stageOneIds=new Set();for(let i=1;i<=160;i++){const p=buildPattern(BASE_SPEED,i,()=>i/161,1);for(const o of p.items){stageOneIds.add(o.id);assert(!['puddle','branch','vine','rock'].includes(o.id),`Stage 1 must not spawn ${o.id}`);assert(['short','wide'].includes(o.family),`Stage 1 family ${o.family} is not onboarding-safe`)}}assert(stageOneIds.has('log-pile'),'Stage 1 should retain a long-jump obstacle');
const earlyPair=[...Array(80)].map((_,i)=>buildPattern(BASE_SPEED,i,()=>((i*37)%99)/100,2)).find(p=>p.id==='quick-hop-high');if(earlyPair)assert((earlyPair.items[1].x-earlyPair.items[0].x-earlyPair.items[0].w)/BASE_SPEED>=1.1);

function snapshot(seed){const x=createRun({seed});x.invulnerable=1e6;for(let i=0;i<120*100;i++)step(x,STEP);return{x:x.obstacles.map(o=>o.id),bananas:x.bananas.map(b=>[Math.round(b.x),b.golden]),pattern:x.currentPattern,score:x.score}}
assert.deepEqual(snapshot(12345),snapshot(12345));assert.notDeepEqual(snapshot(12345),snapshot(54321));assert.equal(dailySeed(new Date('2026-09-08T20:00:00Z')),dailySeed(new Date('2026-09-08T01:00:00Z')));assert.notEqual(hashSeed('2026-09-08'),hashSeed('2026-09-09'));

const distances=[];for(const fps of [30,60,90,120,144,240]){const x=createRun({seed:8});x.spawnDistance=1e9;let acc=0;for(let i=0;i<fps*20;i++){acc+=1/fps;while(acc>=STEP){step(x,STEP);acc-=STEP}}distances.push(x.distance)}assert(Math.max(...distances)-Math.min(...distances)<.03,distances);

function bot(seed,seconds=600){const x=createRun({seed});let releaseAt=0,sliding=false,target=null;for(let i=0;i<120*seconds;i++){const o=x.obstacles.filter(o=>!o.passed&&o.resolved!=='hit'&&o.x+o.w>PLAYER_X).sort((a,b)=>a.x-b.x)[0];if(o&&o!==target){const duck=o.action==='slide'||o.family==='flex',lead=duck?.50:o.family==='high'?.25:.10;if(o.x<PLAYER_X+x.speed*lead&&x.y===0){target=o;if(duck){slide(x);sliding=true}else{jump(x);releaseAt=x.time+(o.action==='high-jump'?.20:.025)}}}if(x.jumpHeld&&x.time>=releaseAt)releaseJump(x);if(sliding&&target&&target.x+target.w<PLAYER_X-10){releaseSlide(x);sliding=false;target=null}if(target&&target.passed)target=null;step(x,STEP);if(x.dead)throw Error(`seed ${seed} died at ${x.time.toFixed(2)} on ${o?.id}/${o?.action}`)}return x}
for(const seed of [1,77,9001,424242]){r=bot(seed);assert(r.stage>=20);assert(r.speed<=MAX_SPEED);assert(r.patternIndex>20)}
console.log('PASS ENGINE: variable jump, slide clearance/exit safety, exact 30s stages, easing/cap, wide+overhead patterns, shield invulnerability, single-award collectibles, deterministic daily seeds, equal 30–240 FPS motion, four 10-minute bot runs');
