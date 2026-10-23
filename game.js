// Choose Wisely: a three-door dungeon game.
// Ported from the Python floor1() function: one random door is safe, the other two hold fire.
(()=>{
const $=s=>document.querySelector(s);
const stage=$('#stage'),bg=$('#bg'),fx=$('#fx'),bctx=bg.getContext('2d'),ctx=fx.getContext('2d');
const doorsEl=$('#doors'),sconcesEl=$('#sconces'),player=$('#player'),overlay=$('#overlay'),prompt=$('#prompt');
const flash=$('#flash'),fade=$('#fade');
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const R=Math.random, rr=(a,b)=>a+R()*(b-a);

/* ---------------- procedural textures ---------------- */
function noiseTile(n=160,amt=70){
  const c=document.createElement('canvas');c.width=c.height=n;const g=c.getContext('2d');
  const d=g.createImageData(n,n);
  for(let i=0;i<d.data.length;i+=4){const v=128+(R()-.5)*amt*2;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=46;}
  g.putImageData(d,0,0);return c;
}
function woodTexture(){
  const w=240,h=492,c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');
  const planks=4,pw=w/planks;
  for(let p=0;p<planks;p++){
    const x0=p*pw,l=17+R()*6,hue=22+R()*6;
    const grd=g.createLinearGradient(x0,0,x0+pw,0);
    grd.addColorStop(0,`hsl(${hue},38%,${l-4}%)`);grd.addColorStop(.5,`hsl(${hue},42%,${l+2}%)`);grd.addColorStop(1,`hsl(${hue},38%,${l-5}%)`);
    g.fillStyle=grd;g.fillRect(x0,0,pw,h);
    const knots=[];for(let k=0;k<1+(R()*2|0);k++)knots.push({x:x0+rr(10,pw-10),y:rr(30,h-30),r:rr(4,9)});
    for(let i=0;i<46;i++){
      let gx=x0+R()*pw,ph=R()*6,f=rr(.006,.02),amp=rr(.6,2.4);
      g.beginPath();
      for(let y=0;y<=h;y+=4){
        let x=gx+Math.sin(y*f+ph)*amp;
        for(const k of knots){const dy=y-k.y,dx=x-k.x,d=Math.hypot(dx,dy);if(d<k.r*4){x+=Math.sign(dx||1)*(k.r*4-d)*.35;}}
        y?g.lineTo(x,y):g.moveTo(x,y);
      }
      const dark=R()<.7;g.strokeStyle=dark?`rgba(10,5,2,${rr(.12,.35)})`:`rgba(255,200,140,${rr(.03,.08)})`;
      g.lineWidth=rr(.4,1.6);g.stroke();
    }
    for(const k of knots){const kg=g.createRadialGradient(k.x,k.y,0,k.x,k.y,k.r*1.6);
      kg.addColorStop(0,'rgba(15,7,3,.9)');kg.addColorStop(.5,'rgba(40,20,8,.6)');kg.addColorStop(1,'rgba(40,20,8,0)');
      g.fillStyle=kg;g.beginPath();g.ellipse(k.x,k.y,k.r*1.1,k.r*1.7,0,0,7);g.fill();}
    g.fillStyle='rgba(0,0,0,.85)';g.fillRect(x0,0,2.2,h);
    g.fillStyle='rgba(255,210,160,.07)';g.fillRect(x0+2.2,0,1,h);
  }
  // scratches and wear
  for(let i=0;i<60;i++){g.strokeStyle=`rgba(0,0,0,${rr(.1,.3)})`;g.lineWidth=rr(.3,1);g.beginPath();
    const x=R()*w,y=R()*h;g.moveTo(x,y);g.lineTo(x+rr(-8,8),y+rr(-14,14));g.stroke();}
  const wear=g.createLinearGradient(0,h*.8,0,h);wear.addColorStop(0,'rgba(0,0,0,0)');wear.addColorStop(1,'rgba(0,0,0,.5)');
  g.fillStyle=wear;g.fillRect(0,0,w,h);
  g.globalCompositeOperation='overlay';g.fillStyle=g.createPattern(noiseTile(120,90),'repeat');g.fillRect(0,0,w,h);
  return c.toDataURL('image/png');
}
const NOISE=noiseTile(160,80);
document.documentElement.style.setProperty('--noise',`url(${NOISE.toDataURL()})`);
document.documentElement.style.setProperty('--wood',`url(${woodTexture()})`);

/* ---------------- doors ---------------- */
const doors=[];
for(let n=1;n<=3;n++){
  const b=document.createElement('button');b.className='doorway';b.type='button';b.setAttribute('aria-label','Door '+n);
  b.innerHTML=`<span class="frame"><span class="key">${n}</span><span class="opening"><span class="inside"></span><span class="door"><span class="strap s1"></span><span class="strap s2"></span><span class="ring"></span></span></span></span><span class="threshold"></span>`;
  b.addEventListener('click',()=>choose(n));
  doorsEl.appendChild(b);
  doors.push({btn:b,door:b.querySelector('.door'),inside:b.querySelector('.inside'),opening:b.querySelector('.opening')});
}
function stairsSVG(){
  let s='<svg viewBox="0 0 100 205" preserveAspectRatio="none"><defs><radialGradient id="cl" cx="50%" cy="0%" r="90%"><stop offset="0" stop-color="#a9c9e0" stop-opacity=".55"/><stop offset=".6" stop-color="#2b3a46" stop-opacity=".25"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs><rect width="100" height="205" fill="#07090b"/>';
  let y=205,hgt=24,inset=0;
  for(let i=0;i<11;i++){
    const top=y-hgt, l=inset, r=100-inset, li=12+i*3.2;
    s+=`<polygon points="${l},${y} ${r},${y} ${r-2},${top+hgt*.35} ${l+2},${top+hgt*.35}" fill="hsl(205,8%,${Math.max(6,li-6)}%)"/>`;
    s+=`<polygon points="${l+2},${top+hgt*.35} ${r-2},${top+hgt*.35} ${r-4},${top} ${l+4},${top}" fill="hsl(205,10%,${li}%)"/>`;
    y=top;hgt*=.84;inset+=3.2;
  }
  s+=`<rect x="0" y="0" width="5" height="205" fill="#030405"/><rect x="95" y="0" width="5" height="205" fill="#030405"/><rect width="100" height="205" fill="url(#cl)"/></svg>`;
  return s;
}

/* ---------------- sizing & background ---------------- */
let W=0,H=0,DPR=1,U=1,horizonY=0;
let torches=[];
function resize(){
  DPR=Math.min(window.devicePixelRatio||1,2);W=stage.clientWidth;H=stage.clientHeight;U=Math.min(H/820,W/700)*1.05;
  for(const c of [bg,fx]){c.width=Math.round(W*DPR);c.height=Math.round(H*DPR);}
  stage.style.setProperty('--u',U+'px');
  horizonY=H*.64;
  drawBG();placeTorches();
}
function drawBG(){
  const g=bctx;g.setTransform(DPR,0,0,DPR,0,0);g.fillStyle='#0b0907';g.fillRect(0,0,W,H);
  // wall bricks
  const bh=Math.max(18,H*.046),mort=Math.max(1.5,bh*.08);
  let row=0;
  for(let y=horizonY;y>-bh;y-=bh,row++){
    let x=-(row%2?bh*1.3:0)-R()*bh;
    while(x<W){
      const bw=bh*rr(1.9,2.9),l=rr(13,22),hue=rr(22,34);
      const gr=g.createLinearGradient(0,y-bh,0,y);
      gr.addColorStop(0,`hsl(${hue},9%,${l+4}%)`);gr.addColorStop(.25,`hsl(${hue},8%,${l}%)`);gr.addColorStop(1,`hsl(${hue},8%,${l-5}%)`);
      g.fillStyle=gr;
      const r=bh*.12;g.beginPath();
      g.roundRect?g.roundRect(x+mort/2,y-bh+mort/2,bw-mort,bh-mort,r):g.rect(x+mort/2,y-bh+mort/2,bw-mort,bh-mort);g.fill();
      // chips & stains
      if(R()<.35){g.fillStyle=`rgba(0,0,0,${rr(.15,.35)})`;g.beginPath();g.ellipse(x+rr(.2,.8)*bw,y-bh*rr(.2,.8),bw*rr(.05,.18),bh*rr(.08,.2),0,0,7);g.fill();}
      if(R()<.12){const mg=g.createLinearGradient(0,y-bh,0,y);mg.addColorStop(0,'rgba(40,52,30,.0)');mg.addColorStop(1,'rgba(40,52,30,.35)');g.fillStyle=mg;g.fillRect(x,y-bh,bw,bh);}
      x+=bw;
    }
  }
  // floor flagstones in perspective
  const vp={x:W/2,y:H*.22},fh=H-horizonY;
  const rows=[];const nr=7;for(let i=0;i<=nr;i++)rows.push(horizonY+fh*Math.pow(i/nr,1.7));
  const tw=W/7.5;const cols=[];for(let x=W/2-tw*14;x<=W/2+tw*14;x+=tw)cols.push(x);
  const xAt=(x0,y)=>vp.x+(x0-vp.x)*(y-vp.y)/(horizonY-vp.y);
  for(let i=0;i<nr;i++){
    const y0=rows[i],y1=rows[i+1],off=i%2?tw/2:0;
    for(const c of cols){
      const a=c+off,b=c+off+tw,l=rr(10,16);
      g.fillStyle=`hsl(${rr(24,32)},7%,${l}%)`;g.beginPath();
      g.moveTo(xAt(a,y0),y0);g.lineTo(xAt(b,y0),y0);g.lineTo(xAt(b,y1),y1);g.lineTo(xAt(a,y1),y1);g.closePath();g.fill();
      g.strokeStyle='rgba(0,0,0,.75)';g.lineWidth=Math.max(1,(y0-horizonY)/fh*4+1);g.stroke();
    }
  }
  // noise grain
  g.save();g.globalCompositeOperation='overlay';g.fillStyle=g.createPattern(NOISE,'repeat');g.globalAlpha=1;
  g.fillRect(0,0,W,H);g.fillRect(0,0,W,H);g.restore();
  // lighting: ceiling gloom, floor falloff, junction shadow, vignette
  let gr=g.createLinearGradient(0,0,0,horizonY);gr.addColorStop(0,'rgba(0,0,0,.88)');gr.addColorStop(.55,'rgba(0,0,0,.45)');gr.addColorStop(1,'rgba(0,0,0,.15)');
  g.fillStyle=gr;g.fillRect(0,0,W,horizonY);
  gr=g.createLinearGradient(0,horizonY,0,H);gr.addColorStop(0,'rgba(0,0,0,.7)');gr.addColorStop(.12,'rgba(0,0,0,.25)');gr.addColorStop(1,'rgba(0,0,0,.6)');
  g.fillStyle=gr;g.fillRect(0,horizonY,W,H-horizonY);
  gr=g.createRadialGradient(W/2,H*.55,Math.min(W,H)*.25,W/2,H*.55,Math.max(W,H)*.8);
  gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.92)');g.fillStyle=gr;g.fillRect(0,0,W,H);
}
function placeTorches(){
  sconcesEl.innerHTML='';torches=[];
  const sr=stage.getBoundingClientRect();
  const rects=doors.map(d=>d.btn.getBoundingClientRect());
  const xs=[(rects[0].right+rects[1].left)/2,(rects[1].right+rects[2].left)/2];
  // outer torches when there is room
  const gap=rects[1].left-rects[0].right;
  if(rects[0].left-sr.left>gap*.9){xs.unshift(rects[0].left-gap/2);xs.push(rects[2].right+gap/2);}
  const top=rects[0].top+(rects[0].height*.28)-sr.top;
  for(const x of xs){
    const el=document.createElement('div');el.className='sconce';
    el.style.left=(x-sr.left)+'px';el.style.top=top+'px';
    el.innerHTML='<div class="plate"></div><div class="bracket"></div><div class="stick"></div><div class="head"></div>';
    sconcesEl.appendChild(el);
    torches.push({x:x-sr.left,y:top+U*4,ph:R()*10});
  }
}

/* ---------------- particles ---------------- */
function sprite(r,g,b,soft=.55){
  const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');
  const gr=x.createRadialGradient(32,32,0,32,32,32);
  gr.addColorStop(0,`rgba(${r},${g},${b},1)`);gr.addColorStop(soft,`rgba(${r},${g},${b},.35)`);gr.addColorStop(1,`rgba(${r},${g},${b},0)`);
  x.fillStyle=gr;x.fillRect(0,0,64,64);return c;
}
const SP={core:sprite(255,244,210,.4),hot:sprite(255,190,70),mid:sprite(255,110,25),deep:sprite(190,40,8),smoke:sprite(40,34,30,.5),ember:sprite(255,170,60,.25)};
const parts=[];const MAX=reduce?500:1800;
function add(p){if(parts.length<MAX)parts.push(p);}
function flame(x,y,s,o={}){
  add({k:0,x,y,vx:o.vx??rr(-.25,.25)*s*.05,vy:o.vy??-rr(.6,1.3)*s*.06,s:s*rr(.7,1.2),gr:o.gr??rr(.985,1.0),life:0,max:o.max??rr(26,48),a:o.a??rr(.5,.85)});
}
function smoke(x,y,s){add({k:1,x,y,vx:rr(-.2,.2),vy:-rr(.4,.9)*s*.04,s:s*rr(.8,1.4),gr:1.012,life:0,max:rr(60,110),a:rr(.12,.25)});}
function ember(x,y,s){add({k:2,x,y,vx:rr(-1,1)*s*.04,vy:-rr(1,3)*s*.04,s:rr(2,4)*U,gr:.995,life:0,max:rr(50,120),a:1});}

let blast=null,burning=false,coolGlow=null,t0=performance.now(),last=t0;
function frame(now){
  let dt=Math.min(3,(now-last)/16.67);last=now;const time=(now-t0)/1000;
  ctx.setTransform(DPR,0,0,DPR,0,0);ctx.clearRect(0,0,W,H);
  ctx.globalCompositeOperation='lighter';
  // torch light pools + flames
  for(const t of torches){
    const fl=.75+.25*Math.sin(time*9+t.ph)*Math.sin(time*13.7+t.ph*2)+rr(-.06,.06);
    const rad=H*.33;const gr=ctx.createRadialGradient(t.x,t.y,0,t.x,t.y,rad);
    gr.addColorStop(0,`rgba(255,150,60,${.26*fl})`);gr.addColorStop(.35,`rgba(200,90,30,${.1*fl})`);gr.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=gr;ctx.fillRect(t.x-rad,t.y-rad,rad*2,rad*2);
    if(R()<.9*dt)flame(t.x+rr(-3,3)*U,t.y,22*U);
    if(R()<.6*dt)flame(t.x+rr(-2,2)*U,t.y-2*U,14*U,{max:rr(14,24)});
    if(R()<.05*dt)ember(t.x,t.y-6*U,20*U);
    if(R()<.12*dt)smoke(t.x,t.y-14*U,18*U);
  }
  if(coolGlow){
    const r=coolGlow.el.getBoundingClientRect(),sr=stage.getBoundingClientRect();
    const cx=r.left-sr.left+r.width/2,cy=r.top-sr.top+r.height*.4,rad=r.height*1.3;
    const gr=ctx.createRadialGradient(cx,cy,0,cx,cy,rad);gr.addColorStop(0,'rgba(120,170,210,.22)');gr.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=gr;ctx.fillRect(cx-rad,cy-rad,rad*2,rad*2);
  }
  // fire blast from a doorway
  if(blast){
    const el=(now-blast.start)/1000;const sr=stage.getBoundingClientRect();const r=blast.el.getBoundingClientRect();
    const ox=r.left-sr.left,oy=r.top-sr.top,ow=r.width,oh=r.height;
    const e=Math.min(1,Math.max(0,(el-.25)/1.1)),ease=e*e*(3-2*e);
    const x0=ox*(1-ease),x1=(ox+ow)+(W-ox-ow)*ease,y0=oy*(1-ease)+(-H*.1)*ease,y1=oy+oh+(H-oy-oh)*ease;
    const cx=ox+ow/2,cy=oy+oh*.6;
    const glowR=oh*(1.3+ease*3);const gr=ctx.createRadialGradient(cx,cy,0,cx,cy,glowR);
    gr.addColorStop(0,`rgba(255,170,60,${.45})`);gr.addColorStop(.5,'rgba(220,70,10,.18)');gr.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=gr;ctx.fillRect(cx-glowR,cy-glowR,glowR*2,glowR*2);
    const n=(reduce?6:22)*dt*(el<.25?.4:1);
    const base=(ow*.28)*(1+ease*2.4);
    for(let i=0;i<n;i++){
      const x=rr(x0,x1),y=rr(Math.max(y0,y1-(y1-y0)*.9),y1);
      const dx=(x-cx)/W;
      flame(x,y,base*rr(.6,1.2),{vx:dx*rr(2,6)*U,vy:-rr(1.5,4)*U*(1+ease),gr:1.008+ease*.012,max:rr(28,55),a:rr(.5,.85)});
    }
    if(R()<.6*dt)ember(rr(x0,x1),rr(y0,y1),40*U);
    if(R()<.4*dt)smoke(rr(x0,x1),y0+(y1-y0)*.3,base);
    if(el>2.6){blast=null;burning=true;}
  }
  if(burning){
    const n=(reduce?3:10)*dt;
    for(let i=0;i<n;i++)flame(rr(-20,W+20),H+rr(0,30)*U,rr(60,140)*U,{vy:-rr(2,5)*U,gr:1.004,max:rr(40,80),a:rr(.35,.6)});
    if(R()<.5*dt)ember(rr(0,W),H,40*U);
  }
  // update & draw
  for(let i=parts.length-1;i>=0;i--){
    const p=parts[i];p.life+=dt;if(p.life>=p.max){parts.splice(i,1);continue;}
    const t=p.life/p.max;
    p.vx+=Math.sin(p.y*.02+time*3+i)*.03*U*dt;
    p.vy-=(p.k===2?.02:.035)*U*dt;
    p.x+=p.vx*dt;p.y+=p.vy*dt;p.s*=Math.pow(p.gr,dt);
    if(p.k===1){ctx.globalCompositeOperation='source-over';ctx.globalAlpha=p.a*Math.sin(t*Math.PI);ctx.drawImage(SP.smoke,p.x-p.s/2,p.y-p.s/2,p.s,p.s);ctx.globalCompositeOperation='lighter';continue;}
    if(p.k===2){ctx.globalAlpha=(1-t)*(R()<.1?.4:1);ctx.drawImage(SP.ember,p.x-p.s,p.y-p.s,p.s*2,p.s*2);continue;}
    const img=t<.18?SP.core:t<.42?SP.hot:t<.7?SP.mid:SP.deep;
    const s=p.s*(t<.2?.6+t*2:1-(t-.2)*.55);
    ctx.globalAlpha=p.a*Math.pow(1-t,1.1);
    ctx.drawImage(img,p.x-s/2,p.y-s*.6,s,s*1.2);
  }
  ctx.globalAlpha=1;
  requestAnimationFrame(frame);
}

/* ---------------- audio (synthesized, starts after first click) ---------------- */
let AC=null,master=null,muted=false,noiseBuf=null,torchGain=null;
function audioInit(){
  if(AC)return;
  try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){return;}
  master=AC.createGain();master.gain.value=muted?0:.7;master.connect(AC.destination);
  noiseBuf=AC.createBuffer(1,AC.sampleRate*2,AC.sampleRate);const d=noiseBuf.getChannelData(0);
  let b=0;for(let i=0;i<d.length;i++){const w=R()*2-1;b=(b+.02*w)/1.02;d[i]=w*.5+b*3;}
  // torch hiss bed
  const src=AC.createBufferSource();src.buffer=noiseBuf;src.loop=true;
  const bp=AC.createBiquadFilter();bp.type='bandpass';bp.frequency.value=900;bp.Q.value=.6;
  torchGain=AC.createGain();torchGain.gain.value=.025;src.connect(bp).connect(torchGain).connect(master);src.start();
  crackleLoop();
}
function noiseHit(dur,freq,type,vol,when=0){
  if(!AC)return;const t=AC.currentTime+when;
  const s=AC.createBufferSource();s.buffer=noiseBuf;
  const f=AC.createBiquadFilter();f.type=type;f.frequency.value=freq;
  const g=AC.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  s.connect(f).connect(g).connect(master);s.start(t,R()*1.5);s.stop(t+dur+.05);
}
function crackleLoop(){
  if(AC&&!muted){const n=R()<.3?3:1;for(let i=0;i<n;i++)noiseHit(rr(.01,.04),rr(2000,5000),'highpass',rr(.05,.18)*(burning?3:1),i*.02);}
  setTimeout(crackleLoop,rr(60,burning?120:340));
}
function footstep(){noiseHit(.12,260,'lowpass',.5);}
function creak(){
  if(!AC)return;const t=AC.currentTime;
  const o=AC.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(70,t);
  o.frequency.linearRampToValueAtTime(110,t+.5);o.frequency.linearRampToValueAtTime(85,t+1.1);
  const lfo=AC.createOscillator();lfo.frequency.value=17;const lg=AC.createGain();lg.gain.value=14;lfo.connect(lg).connect(o.frequency);
  const f=AC.createBiquadFilter();f.type='bandpass';f.frequency.value=950;f.Q.value=6;
  const g=AC.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.12,t+.15);g.gain.linearRampToValueAtTime(.08,t+.8);g.gain.exponentialRampToValueAtTime(.0001,t+1.3);
  o.connect(f).connect(g).connect(master);o.start(t);lfo.start(t);o.stop(t+1.4);lfo.stop(t+1.4);
}
function whoosh(){
  if(!AC)return;const t=AC.currentTime;
  const s=AC.createBufferSource();s.buffer=noiseBuf;s.loop=true;
  const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(150,t);f.frequency.exponentialRampToValueAtTime(3500,t+.5);f.frequency.exponentialRampToValueAtTime(700,t+3);
  const g=AC.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(1.1,t+.35);g.gain.linearRampToValueAtTime(.35,t+2.5);g.gain.exponentialRampToValueAtTime(.08,t+5);
  s.connect(f).connect(g).connect(master);s.start(t);s.stop(t+5.2);
  const o=AC.createOscillator();o.type='sine';o.frequency.setValueAtTime(70,t);o.frequency.exponentialRampToValueAtTime(32,t+1.5);
  const og=AC.createGain();og.gain.setValueAtTime(.6,t);og.gain.exponentialRampToValueAtTime(.0001,t+1.8);o.connect(og).connect(master);o.start(t);o.stop(t+1.9);
}
function chime(){
  if(!AC)return;const t=AC.currentTime;
  [[392,0],[587,.12],[784,.26]].forEach(([fq,d])=>{const o=AC.createOscillator();o.type='sine';o.frequency.value=fq;
    const g=AC.createGain();g.gain.setValueAtTime(0,t+d);g.gain.linearRampToValueAtTime(.12,t+d+.02);g.gain.exponentialRampToValueAtTime(.0001,t+d+2.2);
    o.connect(g).connect(master);o.start(t+d);o.stop(t+d+2.3);});
}
$('#sound').addEventListener('click',e=>{
  muted=!muted;e.currentTarget.textContent=muted?'Sound off':'Sound on';e.currentTarget.setAttribute('aria-pressed',String(!muted));
  if(master)master.gain.value=muted?0:.7;
});

/* ---------------- game logic (from floor1() in the Python version) ---------------- */
let floor=1,best=0,safe=1,state='intro';
try{best=+localStorage.getItem('choose-wisely-best')||0;}catch(e){}
const floorN=$('#floorN'),bestN=$('#bestN');
function hud(){floorN.textContent=floor;bestN.textContent=best;}
function setDisabled(v){doors.forEach(d=>d.btn.disabled=v);}

function showCard(html,top=false){overlay.classList.toggle('top',top);overlay.innerHTML=`<div class="card">${html}</div>`;overlay.classList.remove('gone');
  const b=overlay.querySelector('.btn');if(b)setTimeout(()=>b.focus({preventScroll:true}),50);}
function hideCard(){overlay.classList.add('gone');}

function intro(){
  state='intro';setDisabled(true);
  showCard(`<div class="eyebrow">Floor 1 · Find your way</div>
    <h1>Choose Wisely</h1><div class="rule"></div>
    <p>Three doors stand before you, and they are not the same. Behind one of them is an empty room with stairs leading up, and there you are safe. Behind the other two is fire. Open the wrong door and it will burn you.</p>
    <button class="btn" id="go" type="button">Enter the hall</button>
    <div class="hint">Turn your sound on for the full effect</div>`);
  $('#go').onclick=()=>{audioInit();startFloor();};
}
function startFloor(){
  safe=1+Math.floor(R()*3);         // safe_pit = random.choice([1, 2, 3])
  state='choose';hideCard();setDisabled(false);hud();
  prompt.firstChild.textContent=floor===1?'Which door?':`Floor ${floor} · Which door?`;
  prompt.classList.remove('hide');
}
function resetScene(){
  burning=false;blast=null;coolGlow=null;parts.length=0;
  flash.style.transition='none';flash.style.opacity=0;
  doors.forEach(d=>{d.door.classList.remove('open');d.inside.className='inside';d.inside.innerHTML='';});
  player.getAnimations().forEach(a=>a.cancel());player.style.opacity='';player.classList.remove('walking','burned');
}
function sleep(ms){return new Promise(r=>setTimeout(r,ms));}

async function choose(n){
  if(state!=='choose')return;
  state='busy';setDisabled(true);prompt.classList.add('hide');
  const d=doors[n-1];
  // walk to the chosen door
  const sr=stage.getBoundingClientRect(),dr=d.opening.getBoundingClientRect(),pr=player.getBoundingClientRect();
  const dx=(dr.left+dr.width/2)-(pr.left+pr.width/2);
  const dy=(dr.bottom+dr.height*.05)-pr.bottom;
  const sc=Math.min(1,(dr.height*.8)/pr.height);
  player.classList.add('walking');
  const steps=setInterval(footstep,440);footstep();
  const walk=player.animate([{transform:'translateX(-50%) scale(1)'},{transform:`translateX(calc(-50% + ${dx}px)) translateY(${dy}px) scale(${sc})`}],
    {duration:reduce?400:1700,easing:'cubic-bezier(.45,.05,.55,.95)',fill:'forwards'});
  await walk.finished;clearInterval(steps);player.classList.remove('walking');
  // the door swings open
  const isSafe=n===safe;              // if c == safe_pit
  d.inside.classList.add(isSafe?'safe':'fire');
  if(isSafe)d.inside.innerHTML=stairsSVG();
  d.inside.classList.add('on');
  creak();d.door.classList.add('open');
  await sleep(isSafe?900:350);
  if(isSafe)await win(d,n,dx,dy,sc);else await lose(d,n,dx,dy,sc);
}
async function win(d,n,dx,dy,sc){
  chime();coolGlow={el:d.opening};
  await player.animate([{transform:`translateX(calc(-50% + ${dx}px)) translateY(${dy}px) scale(${sc})`,opacity:1},
    {transform:`translateX(calc(-50% + ${dx}px)) translateY(${dy-d.opening.offsetHeight*.25}px) scale(${sc*.7})`,opacity:0}],
    {duration:1100,easing:'ease-in',fill:'forwards'}).finished;
  if(floor>best){best=floor;try{localStorage.setItem('choose-wisely-best',best);}catch(e){}}
  hud();state='result';
  showCard(`<div class="eyebrow">Floor ${floor} cleared · Door ${n} was empty</div>
    <h1 class="cold">You land on cold stone.</h1><div class="rule"></div>
    <p>Stairs up! The air is cool and the room is quiet. Somewhere above, three more doors are waiting.</p>
    <button class="btn" id="next" type="button">Climb to floor ${floor+1}</button>`);
  $('#next').onclick=async()=>{hideCard();fade.classList.add('on');await sleep(750);floor++;resetScene();hud();await sleep(150);fade.classList.remove('on');startFloor();};
}
async function lose(d,n,dx,dy,sc){
  whoosh();blast={el:d.opening,start:performance.now()};
  await sleep(250);
  if(!reduce){stage.classList.remove('shake');void stage.offsetWidth;stage.classList.add('shake');}
  flash.style.transition='opacity .9s ease-in';flash.style.opacity=.55;
  await sleep(900);
  flash.style.transition='opacity 1.6s ease-out';flash.style.opacity=.18;
  // knocked back from the door, staying in view as a silhouette in front of the flames
  player.classList.add('burned');
  const back=.45;
  player.animate([{transform:`translateX(calc(-50% + ${dx}px)) translateY(${dy}px) scale(${sc})`},
    {transform:`translateX(calc(-50% + ${dx*back}px)) translateY(${dy*back}px) scale(${sc+(1-sc)*(1-back)}) rotate(-4deg)`}],
    {duration:reduce?300:700,easing:'cubic-bezier(.2,.8,.3,1)',fill:'forwards'});
  // reveal where the safe room was
  const s=doors[safe-1];s.inside.classList.add('safe','on');s.inside.innerHTML=stairsSVG();s.door.classList.add('open');
  await sleep(700);
  state='result';
  const reached=floor;
  showCard(`<div class="eyebrow">Door ${n} held fire · The empty room was behind door ${safe}</div>
    <h1 class="burn">The fire burns you!</h1><div class="rule"></div>
    <p>${reached===1?'You fell on the first floor.':`You made it to floor ${reached}.`} Most floors cleared in one run: ${best}.</p>
    <button class="btn" id="again" type="button">Try again</button>`,true);
  $('#again').onclick=async()=>{hideCard();fade.classList.add('on');await sleep(750);floor=1;resetScene();hud();await sleep(150);fade.classList.remove('on');startFloor();};
}

addEventListener('keydown',e=>{
  if(state==='choose'&&['1','2','3'].includes(e.key))choose(+e.key);
});
let rt;addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(resize,120);});

resize();hud();intro();
requestAnimationFrame(t=>{last=t;frame(t);});
if(document.fonts)document.fonts.ready.then(()=>placeTorches());
})();
