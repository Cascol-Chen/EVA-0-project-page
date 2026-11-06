/* Shared, visibility-aware story clock. Motion remains subordinate to reading. */
(function(){
 'use strict';
 const scenes=new Map(),reduce=matchMedia('(prefers-reduced-motion: reduce)');
 let active=null,scheduled=false;
 function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;choose();});}
 function choose(){
  if(document.hidden||reduce.matches){if(active)active._suspend();return;}
  if(active&&active.visible&&!active.manualPaused&&!active.finished)return;
  if(active)active._suspend();
  const next=[...scenes.values()].filter(s=>s.visible&&!s.manualPaused&&!s.finished).sort((a,b)=>a.root.getBoundingClientRect().top-b.root.getBoundingClientRect().top)[0];
  if(next)next._resume();
 }
 function register({id,root,duration,render,steps=[]}){
  if(typeof root==='string')root=document.querySelector(root);
  if(!root||!window.gsap)throw Error('Motion scene is missing its root or GSAP runtime: '+id);
  if(scenes.has(id))return scenes.get(id);
  const clock={t:0};let timeline,observer;
  const s={id,root,duration,visible:false,manualPaused:false,finished:false,playing:false};
  const bar=root.querySelector('.motion-controls')||root.appendChild(Object.assign(document.createElement('div'),{className:'motion-controls'}));
  bar.setAttribute('role','group');bar.setAttribute('aria-label','Animation controls');
  const phase=document.createElement('span');phase.className='motion-phase';
  const track=document.createElement('span');track.className='motion-track';track.setAttribute('aria-hidden','true');track.innerHTML='<i></i>';
  const pause=document.createElement('button');pause.type='button';pause.className='motion-toggle';
  const replay=document.createElement('button');replay.type='button';replay.className='motion-replay';replay.innerHTML='<span aria-hidden="true">↺</span> Replay';replay.setAttribute('aria-label','Replay animation');
  bar.append(phase,track,pause,replay);
  function update(){
   render(clock.t);root.dataset.motionTime=clock.t.toFixed(2);
   const step=steps.filter(x=>x.time<=clock.t+0.001).at(-1);phase.textContent=step?step.label:'';
   track.firstElementChild.style.transform='scaleX('+Math.min(1,clock.t/duration)+')';
  }
  function controls(){pause.innerHTML=(s.playing?'<span aria-hidden="true">Ⅱ</span> Pause':'<span aria-hidden="true">▷</span> Play');pause.setAttribute('aria-label',s.playing?'Pause animation':'Play animation');pause.setAttribute('aria-pressed',String(s.playing));root.dataset.motionState=s.finished?'complete':s.playing?'playing':'paused';}
  timeline=gsap.timeline({paused:true,onUpdate:update,onComplete(){s.finished=true;s.playing=false;if(active===s)active=null;controls();schedule();}}).to(clock,{t:duration,duration,ease:'none'});
  s._suspend=()=>{timeline.pause();s.playing=false;if(active===s)active=null;controls();};
  s._resume=()=>{if(active&&active!==s)active._suspend();active=s;s.playing=true;timeline.play();controls();};
  s.play=()=>{s.manualPaused=false;if(s.finished){s.finished=false;clock.t=0;timeline.seek(0);update();}if(!document.hidden&&s.visible)s._resume();};
  s.pause=()=>{s.manualPaused=true;s._suspend();schedule();};
  s.replay=()=>{s.manualPaused=false;s.finished=false;timeline.pause(0);clock.t=0;update();if(s.visible&&!document.hidden)s._resume();else controls();};
  s.seek=(t)=>{s.manualPaused=true;s._suspend();const value=Math.max(0,Math.min(duration,t));timeline.time(value,true);clock.t=value;s.finished=value>=duration;update();controls();};
  Object.defineProperties(s,{time:{get:()=>clock.t},state:{get:()=>s.finished?'complete':s.playing?'playing':'paused'}});
  pause.addEventListener('click',()=>s.playing?s.pause():s.play());replay.addEventListener('click',s.replay);
  scenes.set(id,s);window.EVAScenes=Object.fromEntries(scenes);
  observer=new IntersectionObserver(entries=>{s.visible=entries[0].isIntersecting&&entries[0].intersectionRatio>0.12;if(!s.visible&&s.playing)s._suspend();schedule();},{threshold:[0,0.12,0.3]});observer.observe(root);
  if(reduce.matches){timeline.time(duration,true);clock.t=duration;s.finished=true;}update();controls();schedule();return s;
 }
 document.addEventListener('visibilitychange',schedule);
 reduce.addEventListener('change',()=>{if(reduce.matches){for(const s of scenes.values())s.seek(s.duration);}else schedule();});
 window.EVAMotion={register,scenes,reduced:()=>reduce.matches};
})();
