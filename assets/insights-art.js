/* EVA-0: precise vector scenes, driven by the shared GSAP playhead. */
(function(){
 'use strict';
 const NS='http://www.w3.org/2000/svg';
 const clamp=x=>Math.max(0,Math.min(1,x));
 const ramp=(t,a,b)=>{const k=clamp((t-a)/(b-a));return k*k*(3-2*k)};
 const alpha=(el,value)=>{if(el)el.style.opacity=Math.max(0,Math.min(1,value)).toFixed(3)};
 const text=(el,value)=>{if(el&&el.textContent!==value)el.textContent=value};
 function node(tag,attributes,parent){const n=document.createElementNS(NS,tag);Object.keys(attributes).forEach(k=>n.setAttribute(k,attributes[k]));parent.appendChild(n);return n}
 function reveal(path){if(!path)return()=>{};const length=path.getTotalLength();path.style.strokeDasharray=length+' '+length;return amount=>{path.style.strokeDashoffset=String(length*(1-clamp(amount)))};}
 function head(path,circle,amount,dy=0){const point=path.getPointAtLength(path.getTotalLength()*clamp(amount));circle.setAttribute('cx',point.x);circle.setAttribute('cy',point.y+dy)}
 function installProbe(){
  const root=document.getElementById('ins3-b');if(!root)return;
  const shared=root.querySelector('[data-shared-directions]'),sample=root.querySelector('[data-sample-directions]'),rays=[[],[]];
  [shared,sample].forEach((group,lane)=>{
   for(let i=0;i<8;i++){
    const g=node('g',{},group),angle=lane?(-78+i*21.3)*Math.PI/180:-29*Math.PI/180;
    const origin={x:lane?720:240,y:275};
    // The shared lane keeps the same direction; slight parallel offsets separate the eight sample traces.
    const offset=lane?0:(i-3.5)*3.2;
    const dx=Math.cos(angle)*(lane?65+(i%3)*7:71),dy=Math.sin(angle)*(lane?65+(i%3)*7:71);
    const ox=origin.x-Math.sin(angle)*offset,oy=origin.y+Math.cos(angle)*offset;
    const line=node('path',{d:`M${ox-dx} ${oy-dy}L${ox+dx} ${oy+dy}`,fill:'none',stroke:lane?'#78b8ae':'#7b949b','stroke-width':lane?'1.05':'.9','stroke-opacity':lane?'.53':'.4'},g);
    const minus=node('circle',{cx:ox-dx,cy:oy-dy,r:'3',fill:'#13242c',stroke:'#91b5d5','stroke-width':'1.2'},g);
    const plus=node('circle',{cx:ox+dx,cy:oy+dy,r:'3',fill:'#ee927b'},g);
    rays[lane].push({g,line,minus,plus});
   }
  });
  const field=root.querySelector('[data-fields]'),reuse=root.querySelector('[data-reuse]'),pairMinus=root.querySelector('[data-pair-minus]'),pairPlus=root.querySelector('[data-pair-plus]'),pairLink=root.querySelector('[data-pair-link]'),evidence=root.querySelector('[data-evidence]'),beat=root.querySelector('[data-beat]'),summary=root.querySelector('[data-summary]');
  EVAMotion.register({id:'insight-probing',root,duration:12,steps:[{time:0,label:'One pair'},{time:4,label:'Eight samples'},{time:8.5,label:'Measured alignment'}],render(t){
   const pair=ramp(t,.3,1.6),reuseProgress=ramp(t,1.7,3),sampling=ramp(t,3.6,4.6),result=ramp(t,8,9);
   alpha(pairMinus,.45+.55*pair);alpha(pairPlus,.45+.55*pair);alpha(pairLink,.15+.65*pair);
   alpha(reuse,.24+.76*reuseProgress);alpha(field,.24+.76*sampling);
   rays.forEach(lane=>lane.forEach((r,i)=>alpha(r.g,.07+.93*ramp(t,4+i*.39,4.5+i*.39))));
   alpha(evidence,.3+.7*result);
   text(beat,t<4?'One pair, two purposes':t<8.5?'Independent directions, the same budget':'Measured similarity to the BP gradient');
   text(summary,t<4?'Average the outputs. Use the loss difference to estimate an update.':t<8.5?'A shared direction repeats one view. Sample-wise probes explore different directions.':'Richer sampling improves the measured update direction, within two forwards per sample.');
  }});
 }
 function installObjective(){
  const root=document.getElementById('ins1-d');if(!root)return;
  const drawLoss=[reveal(root.querySelector('[data-loss-bp]')),reveal(root.querySelector('[data-loss-zo]'))];
  const drawAccuracy=[reveal(root.querySelector('[data-accuracy-bp]')),reveal(root.querySelector('[data-accuracy-zo]'))];
  const area=root.querySelector('[data-accuracy-area]'),labels=root.querySelector('[data-accuracy-labels]'),lossLabel=root.querySelector('[data-loss-label]'),remedy=root.querySelector('[data-remedy]'),inflation=root.querySelector('[data-inflation]'),beat=root.querySelector('[data-beat]'),summary=root.querySelector('[data-summary]');
  EVAMotion.register({id:'insight-objective',root,duration:11,steps:[{time:0,label:'Loss'},{time:3,label:'Accuracy'},{time:7,label:'Resist the shortcut'}],render(t){
   const loss=.08+.92*ramp(t,.2,2.8),accuracy=.06+.94*ramp(t,3,5.8),fix=ramp(t,6,7.5);
   drawLoss.forEach(fn=>fn(loss));drawAccuracy.forEach(fn=>fn(accuracy));
   alpha(lossLabel,.15+.85*ramp(t,2,3));alpha(labels,.2+.8*ramp(t,5,6));alpha(area,.08+.92*ramp(t,4,6));alpha(remedy,.34+.66*fix);
   inflation.setAttribute('transform',`translate(0 ${6*fix}) scale(1 ${1-.15*fix})`);
   text(beat,t<3?'The loss falls':t<7?'Accuracy tells another story':'Make the objective scale-resistant');
   text(summary,t<3?'A decreasing test-time loss can look like successful learning.':t<7?'Similar loss reduction can conceal very different accuracy gains.':'Norm matching and decentering resist confidence-based shortcuts.');
  }});
 }
 function installDrift(){
  const root=document.getElementById('ins2-b');if(!root)return;
  const free=root.querySelector('[data-drift-free]'),guided=root.querySelector('[data-drift-guided]'),drawFree=reveal(free),drawGuided=reveal(guided),freeHead=root.querySelector('[data-drift-free-head]'),guidedHead=root.querySelector('[data-drift-guided-head]');
  const ticks=[...root.querySelectorAll('.atlas-domain-ribbon i')],domain=root.querySelector('[data-domain]'),beat=root.querySelector('[data-beat]'),summary=root.querySelector('[data-summary]'),evidence=root.querySelector('[data-evidence]'),pullback=root.querySelector('[data-pullback]');
  const names=['Gaussian noise','Shot noise','Impulse noise','Defocus blur','Glass blur','Motion blur','Zoom blur','Snow','Frost','Fog','Brightness','Contrast','Elastic transform','Pixelation','JPEG compression'];
  EVAMotion.register({id:'insight-drift',root,duration:12,steps:[{time:0,label:'Domain shifts'},{time:4,label:'Anchor guidance'},{time:9,label:'Continual accuracy'}],render(t){
   const progress=.015+.985*ramp(t,.5,8.7),current=Math.min(14,Math.floor(progress*15)),result=ramp(t,8.4,9.5);
   drawFree(progress);drawGuided(progress);head(free,freeHead,progress,28);head(guided,guidedHead,progress);
   ticks.forEach((tick,i)=>tick.classList.toggle('on',i<=current));text(domain,names[current]);
   alpha(evidence,.35+.65*result);alpha(pullback,ramp(t,5,7));
   text(beat,t<4?'Experience keeps arriving':t<9?'A persistent reference, a gentle return':'Measured continual accuracy');
   text(summary,t<4?'Small random updates can accumulate across changing domains.':t<9?'The anchor biases exploration and supplies a weak pull-back.':'An anchor helps limit accumulated drift.');
  }});
 }
 function init(){if(!window.EVAMotion){console.warn('EVA-0 vector scenes: static illustrations retained because motion controls are unavailable.');return;}installProbe();installObjective();installDrift();}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
