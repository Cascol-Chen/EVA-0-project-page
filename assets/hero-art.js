/* A schematic, procedurally lit weight landscape. One pair, two uses. */
const root=document.getElementById('hero-art');
if(root){
 const world=root.querySelector('.ha-world'),canvas=root.querySelector('.ha-canvas');
 const labels=Object.fromEntries([...root.querySelectorAll('[data-label]')].map(el=>[el.dataset.label,el]));
 const uses=[root.querySelector('[data-use="predict"]'),root.querySelector('[data-use="learn"]')];
 const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
 const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
 let renderer,scene,camera,THREE,model,anchor,plus,minus,plusStem,minusStem,trail,drift,halo,ground;
 let width=0,height=0,lastTime=0,controller,observer,contextLost=false;
 const vectors={},labelProjection={};
 const start={x:-1.7,z:.66},anchorPoint={x:-2.15,z:-.12};
 const waypoints=[[-1.7,.66],[-1.3,.93],[-.82,.67],[-.34,.35],[.3,.25],[.8,.13],[1.32,-.02]];
 const naiveWaypoints=[[-1.7,.66],[-1.35,.37],[-1.1,-.16],[-.62,-.23],[-.3,-.8],[.15,-1.11],[.55,-1.68]];
 const terrain=(x,z)=>.40*(.10*(x-.6)*(x-.6)+.20*(z+.06)*(z+.06)+.13*Math.sin(x*1.8+z*.5)-.34*Math.exp(-((x-1.25)**2/1.2+(z-.03)**2/.55))-.13);
 const heightAt=(x,z,offset=.07)=>terrain(x,z)+offset;
 function useState(t){uses[0].classList.toggle('active',t>=5);uses[1].classList.toggle('active',t>=6.5);root.dataset.phase=t<2?'observe':t<5?'probe':t<8?'reuse':'evolve';}
 function render(t){
  lastTime=t;useState(t);
  if(!renderer||contextLost)return;
  const probe=smooth((t-2)/1.3),evolution=smooth((t-8)/2),pairOpacity=t<2?.18:t>8?.48:1;
  vectors.surfacePath.getPointAt(evolution,vectors.modelPoint);model.position.copy(vectors.modelPoint);
  const px=start.x+.54*probe,pz=start.z-.5*probe,mx=start.x-.54*probe,mz=start.z+.5*probe;
  plus.position.set(px,heightAt(px,pz,.105),pz);minus.position.set(mx,heightAt(mx,mz,.105),mz);
  plus.scale.setScalar(.35+.65*probe);minus.scale.setScalar(.35+.65*probe);
  plus.material.opacity=pairOpacity;minus.material.opacity=pairOpacity;
  updateStem(plusStem,plus.position);updateStem(minusStem,minus.position);
  plusStem.material.opacity=.76*probe*pairOpacity;minusStem.material.opacity=.76*probe*pairOpacity;
  trail.geometry.setDrawRange(0,Math.ceil(evolution*240)*8*6);
  drift.geometry.setDrawRange(0,Math.max(0,Math.ceil(smooth((t-8.5)/1.5)*241)));
  drift.material.opacity=.32*smooth((t-8)/1.5);
  halo.position.copy(model.position);halo.position.y+=.014;halo.material.opacity=.10+.045*Math.sin(Math.min(t,10)*2);
  ground.material.opacity=.98;
  updateLabel(labels.anchor,anchor.position,-21,-29,1);
  updateLabel(labels.model,model.position,15,-19,1);
  updateLabel(labels.plus,plus.position,12,-23,probe*.96);
  updateLabel(labels.minus,minus.position,-20,17,probe*.96);
  updateLabel(labels.naive,vectors.driftEnd,8,-14,smooth((t-9.2)/.7)*.82);
  renderer.render(scene,camera);
 }
 function updateStem(line,end){const a=line.geometry.attributes.position;a.setXYZ(0,start.x,heightAt(start.x,start.z,.075),start.z);a.setXYZ(1,end.x,end.y,end.z);a.needsUpdate=true;}
 function updateLabel(el,position,dx,dy,opacity){
  const point=labelProjection[el.dataset.label];point.copy(position).project(camera);
  const x=(point.x*.5+.5)*width+dx,y=(-point.y*.5+.5)*height+dy;
  el.style.transform=`translate(${Math.round(x)}px,${Math.round(y)}px)`;el.style.opacity=String(opacity);
 }
 function resize(){if(!renderer)return;const box=world.getBoundingClientRect();width=box.width;height=box.height;const aspect=width/height,span=5.0;camera.left=-span*aspect/2;camera.right=span*aspect/2;camera.top=span/2;camera.bottom=-span/2;camera.updateProjectionMatrix();renderer.setSize(width,height,false);render(lastTime);}
 function lineFromPoints(points,color,opacity=1){const geometry=new THREE.BufferGeometry().setFromPoints(points);const line=new THREE.Line(geometry,new THREE.LineBasicMaterial({color,transparent:true,opacity,depthWrite:false,depthTest:false}));line.renderOrder=4;return line;}
 function setup(){
  renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setClearColor(0x0d1519,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
  scene=new THREE.Scene();camera=new THREE.OrthographicCamera(-4,4,2.5,-2.5,.1,100);camera.position.set(5.4,9.3,9.6);camera.lookAt(.0,.05,.0);
  scene.add(new THREE.HemisphereLight(0xb7d9c9,0x142326,1.3));
  const key=new THREE.DirectionalLight(0xe4ead9,2.2);key.position.set(-4,7,-3);scene.add(key);
  const rim=new THREE.DirectionalLight(0x9cb5a6,1.35);rim.position.set(3,3,-4);scene.add(rim);
  const fill=new THREE.DirectionalLight(0x799eb9,.35);fill.position.set(3,1,4);scene.add(fill);
  const geometry=new THREE.PlaneGeometry(7.3,4.8,160,106);geometry.rotateX(-Math.PI/2);
  const positions=geometry.attributes.position;for(let i=0;i<positions.count;i++)positions.setY(i,terrain(positions.getX(i),positions.getZ(i)));geometry.computeVertexNormals();
  const material=new THREE.MeshStandardMaterial({color:0x345249,roughness:.62,metalness:.12,transparent:true,side:THREE.FrontSide,depthWrite:false});
  material.onBeforeCompile=shader=>{
   shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vHeroPosition;').replace('#include <begin_vertex>','#include <begin_vertex>\nvHeroPosition=position;');
   shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vHeroPosition;').replace('#include <color_fragment>',`#include <color_fragment>
    float level=vHeroPosition.y*13.75;
    float lineDistance=abs(fract(level)-0.5);
    float contour=1.0-smoothstep(0.009,0.009+fwidth(level)*0.65,lineDistance);
    float edge=length(vec2(vHeroPosition.x/3.65,vHeroPosition.z/2.40));
    diffuseColor.a*=1.0-smoothstep(0.64,1.0,edge);
    diffuseColor.rgb*=mix(0.82,1.05,smoothstep(-0.2,1.2,vHeroPosition.y));
    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(0.20,0.34,0.29),contour*0.23);
   `);
  };
  ground=new THREE.Mesh(geometry,material);ground.renderOrder=0;scene.add(ground);
  const sphere=new THREE.SphereGeometry(.065,28,20);
  function marble(color,metalness=.15){return new THREE.Mesh(sphere,new THREE.MeshStandardMaterial({color,roughness:.26,metalness,emissive:color,emissiveIntensity:.11,transparent:true}));}
  model=marble(0xf0f1df);model.scale.setScalar(1.15);model.renderOrder=6;scene.add(model);
  plus=marble(0xf1937c);minus=marble(0x96bfe5);plus.renderOrder=6;minus.renderOrder=6;scene.add(plus,minus);
  anchor=new THREE.Mesh(new THREE.OctahedronGeometry(.085),new THREE.MeshStandardMaterial({color:0x70cbbb,emissive:0x51af9c,emissiveIntensity:.5,metalness:.45,roughness:.3}));anchor.position.set(anchorPoint.x,heightAt(anchorPoint.x,anchorPoint.z,.12),anchorPoint.z);scene.add(anchor);
  const ringPoints=Array.from({length:81},(_,i)=>{const a=i/80*Math.PI*2,x=anchorPoint.x+.19*Math.cos(a),z=anchorPoint.z+.19*Math.sin(a);return new THREE.Vector3(x,heightAt(x,z,.02),z)});scene.add(lineFromPoints(ringPoints,0x73bca5,.52));
  const softField=[];for(let i=0;i<130;i++){const a=i/129*Math.PI*2,x=-.55+2.05*Math.cos(a),z=.18+1.23*Math.sin(a);softField.push(new THREE.Vector3(x,heightAt(x,z,.018),z));}
  scene.add(lineFromPoints(softField,0x70baa3,.10));
  const points=waypoints.map(([x,z])=>new THREE.Vector3(x,heightAt(x,z,.045),z));vectors.path=new THREE.CatmullRomCurve3(points);vectors.modelPoint=new THREE.Vector3();
  class SurfacePath extends THREE.Curve{getPoint(t,target=new THREE.Vector3()){vectors.path.getPoint(t,target);target.y=heightAt(target.x,target.z,.105);return target;}}
  vectors.surfacePath=new SurfacePath();
  trail=new THREE.Mesh(new THREE.TubeGeometry(vectors.surfacePath,240,.011,8,false),new THREE.MeshBasicMaterial({color:0xe9efdf,transparent:true,opacity:.95,depthWrite:false,depthTest:false,toneMapped:false}));trail.renderOrder=4;scene.add(trail);
  const naiveCurve=new THREE.CatmullRomCurve3(naiveWaypoints.map(([x,z])=>new THREE.Vector3(x,heightAt(x,z,.04),z)));
  drift=lineFromPoints(naiveCurve.getPoints(240),0xa9b6aa,.32);drift.material.dispose();drift.material=new THREE.LineDashedMaterial({color:0xa9b6aa,transparent:true,opacity:.32,dashSize:.055,gapSize:.055,depthWrite:false,depthTest:false});drift.computeLineDistances();scene.add(drift);vectors.driftEnd=naiveCurve.getPoint(1);
  const stemPoints=[new THREE.Vector3(),new THREE.Vector3()];plusStem=lineFromPoints(stemPoints,0xf1937c,.4);minusStem=lineFromPoints(stemPoints,0x96bfe5,.4);scene.add(plusStem,minusStem);
  halo=new THREE.Mesh(new THREE.RingGeometry(.10,.16,48),new THREE.MeshBasicMaterial({color:0xeaf3e1,transparent:true,opacity:.12,side:THREE.DoubleSide,depthWrite:false}));halo.rotation.x=-Math.PI/2;scene.add(halo);
  Object.values(labels).forEach(el=>labelProjection[el.dataset.label]=new THREE.Vector3());
  resize();root.dataset.renderer='webgl';observer=new ResizeObserver(resize);observer.observe(world);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;root.dataset.renderer='fallback';Object.values(labels).forEach(el=>el.style.opacity='0');controller?.seek(13);});
  canvas.addEventListener('webglcontextrestored',()=>{contextLost=false;root.dataset.renderer='webgl';resize();});
 }
 function register(){
  if(!window.EVAMotion)return;
  controller=window.EVAMotion.register({id:'hero-art',root,duration:13,render,steps:[{time:0,label:'01 / Observe'},{time:2,label:'02 / Probe twice'},{time:5,label:'03 / Predict + learn'},{time:8,label:'04 / Evolve'}]});
  if(root.dataset.renderer==='fallback'){controller.seek(13);uses.forEach(el=>el.classList.add('active'));}
 }
 try{
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches){THREE=await import('./vendor/three.module.min.js');setup();}
 }catch(error){root.dataset.renderer='fallback';root.dataset.rendererReason=error.name||'WebGLUnavailable';renderer?.dispose();renderer=null;}
 register();
 window.addEventListener('pagehide',()=>{observer?.disconnect();renderer?.dispose();},{once:true});
}
