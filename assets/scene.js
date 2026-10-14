/* ROUTE+ landscape renderer. Native WebGL 1: no runtime packages, APIs or remote files.
   Geometry is built once. A single shared material handles rock, leaves, water,
   glass and gold; the camera is driven by the page's continuous scroll progress. */
(() => {
  'use strict';
  const canvas = document.getElementById('nature-scene');
  const gl = canvas.getContext('webgl', {alpha:true, antialias:true, powerPreference:'low-power'});
  const status = document.getElementById('scene-status');
  const fallback = document.getElementById('scene-fallback');
  if (!gl) { canvas.hidden=true; fallback.hidden=false; status.textContent='3D unavailable on this device · planner still works'; return; }
  const vertex = `
    precision highp float;
    attribute vec3 aPosition; attribute vec3 aNormal; attribute vec3 aColor;
    attribute vec2 aUv; attribute float aKind;
    uniform mat4 uView; uniform mat4 uProjection; uniform float uTime;
    varying vec3 vNormal; varying vec3 vColor; varying vec3 vWorld;
    varying vec2 vUv; varying float vKind; varying float vDepth;
    void main(){
      vec3 p=aPosition;
      if(aKind>1.5&&aKind<2.5){p.x+=sin(p.y*3.4+uTime*2.3+p.z)*.035;p.z+=sin(p.y*2.1+uTime*3.0)*.025;}
      if(aKind>4.5&&aKind<5.5){p.x+=sin(uTime*.19+p.z)*.6;p.y+=sin(uTime*.34+p.x)*.07;}
      vNormal=aNormal;vColor=aColor;vWorld=p;vUv=aUv;vKind=aKind;
      vec4 eye=uView*vec4(p,1.0);vDepth=-eye.z;
      gl_Position=uProjection*eye;
    }`;
  const fragment = `
    precision highp float;
    uniform float uTime; uniform vec3 uEye; uniform float uRoute;
    varying vec3 vNormal;varying vec3 vColor;varying vec3 vWorld;varying vec2 vUv;varying float vKind;varying float vDepth;
    float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
    float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
    void main(){
      vec3 n=normalize(vNormal),light=normalize(vec3(-.6,1.0,.6));
      vec3 view=normalize(uEye-vWorld);float diffuse=max(0.0,dot(n,light));
      float spec=pow(max(0.0,dot(n,normalize(light+view))),42.0);
      float grain=noise(vWorld*3.0)*.13+noise(vWorld*15.0)*.045;
      vec3 color=vColor*(.60+diffuse*.43+grain);float alpha=1.0;
      if(vKind<.5){color*=.85+noise(vWorld*1.4)*.22;}
      if(vKind>1.5&&vKind<2.5){
        float stream=sin(vUv.x*70.0+sin(vUv.y*18.0-uTime*3.0))*sin(vUv.y*34.0-uTime*7.0);
        color=mix(vec3(.43,.72,.66),vec3(.98,1.0,.97),.65+stream*.23)+spec*.35;
        alpha=.86;
      }
      if(vKind>2.5&&vKind<3.5){color+=vec3(1.0,.83,.49)*(spec*.65+.13);}
      if(vKind>3.5&&vKind<4.5){
        float wave=sin(vWorld.x*3.0+uTime)*sin(vWorld.z*3.0-uTime*.6);
        color=mix(vec3(.30,.55,.44),vec3(.68,.85,.74),.5+wave*.06)+spec*.5;alpha=.9;
      }
      if(vKind>4.5&&vKind<5.5){float d=length((vUv-.5)*2.0);alpha=pow(max(0.0,1.0-d),2.0)*.23; color=vec3(.96,.98,.92);}
      if(vKind>5.5){if(vUv.x>uRoute)discard;float pulse=pow(max(0.0,sin(vUv.x*26.0-uTime*1.4)),12.0);color=vec3(.87,.70,.38)+pulse*.24;}
      float fog=smoothstep(23.0,69.0,vDepth)*.72;
      color=mix(color,vec3(.89,.94,.85),fog);
      gl_FragColor=vec4(color,alpha);
    }`;
  function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
  let program;
  try { program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Landscape program could not link'); }
  catch(error){canvas.hidden=true;fallback.hidden=false;status.textContent='3D unavailable · landscape fallback';console.error(error);return;}
  gl.useProgram(program);
  const opaque=[],transparent=[];
  const palettes={rock:[.55,.56,.43],stone:[.85,.80,.65],gold:[.85,.68,.37],moss:[.34,.49,.29],pine:[.18,.36,.23]};
  let seed=42;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const sub=(a,b)=>a.map((v,i)=>v-b[i]);
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const normalize=a=>{const l=Math.hypot(...a)||1;return a.map(x=>x/l);};
  function tri(a,b,c,color,kind=0,uv=[[0,0],[1,0],[1,1]],normals=null){
    const n=normalize(cross(sub(b,a),sub(c,a)));
    const target=[2,4,5].includes(kind)?transparent:opaque;
    [a,b,c].forEach((p,i)=>target.push(...p,...(normals?normals[i]:n),...color,...uv[i],kind));
  }
  function quad(a,b,c,d,color,kind=0){tri(a,b,c,color,kind,[[0,0],[1,0],[1,1]]);tri(a,c,d,color,kind,[[0,0],[1,1],[0,1]]);}
  function box(x,y,z,w,h,d,color,kind=0){
    const p=[[x-w/2,y,z-d/2],[x+w/2,y,z-d/2],[x+w/2,y+h,z-d/2],[x-w/2,y+h,z-d/2],[x-w/2,y,z+d/2],[x+w/2,y,z+d/2],[x+w/2,y+h,z+d/2],[x-w/2,y+h,z+d/2]];
    [[4,5,6,7],[1,0,3,2],[0,4,7,3],[5,1,2,6],[3,7,6,2],[0,1,5,4]].forEach(f=>quad(...f.map(i=>p[i]),color,kind));
  }
  function cylinder(x,y,z,r1,r2,h,color,segments=12,kind=0){
    for(let i=0;i<segments;i++){const a=i/segments*Math.PI*2,b=(i+1)/segments*Math.PI*2;
      const p=[x+Math.cos(a)*r1,y,z+Math.sin(a)*r1],q=[x+Math.cos(b)*r1,y,z+Math.sin(b)*r1];
      const r=[x+Math.cos(b)*r2,y+h,z+Math.sin(b)*r2],s=[x+Math.cos(a)*r2,y+h,z+Math.sin(a)*r2];
      const na=normalize([Math.cos(a),(r1-r2)/h,Math.sin(a)]),nb=normalize([Math.cos(b),(r1-r2)/h,Math.sin(b)]);
      tri(p,s,r,color,kind,[[0,0],[0,1],[1,1]],[na,na,nb]);tri(p,r,q,color,kind,[[0,0],[1,1],[1,0]],[na,nb,nb]);tri([x,y+h,z],r,s,color,kind);
    }
  }
  function mound(x,y,z,rx,rz,h,color,rings=15,segments=36){
    const point=(ring,i)=>{const u=ring/rings,t=i/segments*Math.PI*2;const wobble=1+.025*Math.sin(i*.7+ring*.3);return [x+Math.cos(t)*rx*u*wobble,y+h*Math.pow(Math.max(0,1-u*u),.7)+Math.sin(t*6+u*12)*.12*u,z+Math.sin(t)*rz*u*wobble];};
    for(let r=0;r<rings;r++)for(let i=0;i<segments;i++){const a=point(r,i),b=point(r+1,i),c=point(r+1,i+1),d=point(r,i+1);const normal=p=>normalize([(p[0]-x)/(rx*rx),(p[1]-y)/(h*h),(p[2]-z)/(rz*rz)]);
      tri(a,d,c,color,0,[[0,0],[0,1],[1,1]],[normal(a),normal(d),normal(c)]);tri(a,c,b,color,0,[[0,0],[1,1],[1,0]],[normal(a),normal(c),normal(b)]);}
  }
  function tree(x,y,z,size=1){
    cylinder(x,y,z,.06*size,.035*size,.6*size,[.35,.29,.18],5);
    const c=palettes.pine.map(v=>v*(.84+random()*.35));
    for(let j=0;j<4;j++)cylinder(x,y+(.28+j*.25)*size,z,(.44-j*.07)*size,.02*size,(.73-j*.06)*size,c.map(v=>v*(1+j*.035)),10,1);
  }
  // Porcelain foundation, sculpted stone and moss form an isolated travel world.
  cylinder(0,-1.45,0,10.5,10.8,.75,[.76,.79,.65],84);
  cylinder(0,-.75,0,10.8,10.6,.08,palettes.gold,84,3);
  cylinder(0,-.67,0,10.6,10.3,.45,[.67,.75,.56],84);
  mound(-3,-.3,-2,5.8,5.3,6.2,palettes.moss);
  mound(-3,2,-2.6,3.4,3.1,5.4,palettes.rock);
  mound(-3.7,6,-3,1.9,2.2,2.5,[.44,.55,.35]);
  mound(4,-.3,-3,4.3,4.8,4.8,palettes.moss);
  mound(5,2.1,-4,2.7,3.2,4.1,[.43,.53,.32]);
  mound(1,-.3,1.8,3.0,2.1,1.4,[.43,.54,.34]);
  for(let i=0;i<7;i++)mound(-22+i*7,-5,-23-random()*8,7.8,6,8+random()*5,[.66,.77,.59],15,32);
  for(let i=0;i<160;i++){
    const x=random()*18-9,z=random()*15-8;
    if(Math.hypot(x,z)>9.4||Math.abs(x+3)<1.6&&z>0||x>2&&x<7&&z>-.5&&z<5)continue;
    const h1=6.2*Math.pow(Math.max(0,1-((x+3)/5.8)**2-((z+2)/5.3)**2),.7);
    const h2=4.8*Math.pow(Math.max(0,1-((x-4)/4.3)**2-((z+3)/4.8)**2),.7);
    tree(x,Math.max(h1,h2)-.12,z,.5+random()*.65);
  }
  // Water crosses three rock shelves instead of a single flat blue rectangle.
  function waterfall(x,z,top,bottom,width,lean){
    const strips=8,steps=28;
    for(let j=0;j<strips;j++)for(let i=0;i<steps;i++){
      const make=(a,b)=>[x+(a/strips-.5)*width,top+(bottom-top)*b/steps,z+Math.pow(b/steps,1.7)*lean];
      const a=make(j,i),b=make(j+1,i),c=make(j+1,i+1),d=make(j,i+1);
      tri(a,b,c,[.71,.87,.79],2,[[j/strips,i/steps],[(j+1)/strips,i/steps],[(j+1)/strips,(i+1)/steps]]);
      tri(a,c,d,[.71,.87,.79],2,[[j/strips,i/steps],[(j+1)/strips,(i+1)/steps],[j/strips,(i+1)/steps]]);
    }
  }
  mound(-3,.2,2.3,2.6,1.7,1.3,palettes.rock);
  mound(-3,2.3,.8,2.1,1.5,1.1,palettes.rock);
  mound(-3,2.7,2.0,1.4,1.25,4.6,[.51,.54,.40],18,32);
  quad([-3.61,7.3,1.6],[-2.39,7.3,1.6],[-2.39,7.3,2.96],[-3.61,7.3,2.96],[.71,.87,.79],2);
  waterfall(-3,2.96,7.3,3.1,1.22,.65);
  waterfall(-3,3.62,3.15,1.3,1.8,.75);
  waterfall(-3,4.38,1.3,.1,2.2,.85);
  cylinder(-3,-.1,5.1,2.5,2.5,.12,[.5,.73,.61],64,4);
  // Indian-inspired Nagara shikhara, carved cornices, pillared mandapa, steps.
  function temple(x,y,z,s=1){
    const stone=palettes.stone;
    box(x,y,z,3.6*s,.23*s,3.4*s,stone);
    box(x,y+.23*s,z,3.2*s,.2*s,3.0*s,stone.map(v=>v*.96));
    for(let i=0;i<6;i++)box(x,y-i*.085*s,z+1.8*s+i*.18*s,1.9*s,.13*s,.3*s,stone);
    for(let a of [-1,1])for(let b of [-.9,0,.9]){
      cylinder(x+a*s,y+.43*s,z+b*s,.12*s,.10*s,1.25*s,stone,8);
      box(x+a*s,y+.45*s,z+b*s,.3*s,.12*s,.3*s,stone);
      box(x+a*s,y+1.5*s,z+b*s,.28*s,.13*s,.28*s,stone);
    }
    box(x,y+.45*s,z-.7*s,1.6*s,1.3*s,1.2*s,stone);
    box(x,y+1.68*s,z,2.8*s,.2*s,2.5*s,stone);
    box(x,y+1.88*s,z,2.95*s,.12*s,2.65*s,palettes.gold,3);
    // Curved stepped spire and vertical ribs give the temple its silhouette.
    const profile=[1.0,.99,.94,.87,.79,.70,.60,.49,.38,.27,.20];
    for(let i=0;i<profile.length-1;i++){
      const base=y+2*s+i*.24*s;
      cylinder(x,base,z-.45*s,profile[i]*s,profile[i+1]*s,.24*s,stone,16);
      cylinder(x,base,z-.45*s,profile[i]*s*1.04,profile[i]*s*1.04,.045*s,stone.map(v=>v*.93),16);
      for(let k=0;k<8;k++){const t=k*Math.PI/4;cylinder(x+Math.cos(t)*profile[i]*s,base,z-.45*s+Math.sin(t)*profile[i]*s,.055*s,.055*s,.23*s,stone,5);}
    }
    cylinder(x,y+4.45*s,z-.45*s,.39*s,.32*s,.18*s,palettes.gold,24,3);
    cylinder(x,y+4.63*s,z-.45*s,.22*s,0,.65*s,palettes.gold,16,3);
    box(x,y+4.9*s,z-.45*s,.035*s,.8*s,.035*s,palettes.gold,3);
    tri([x,y+5.66*s,z-.45*s],[x+.65*s,y+5.47*s,z-.45*s],[x,y+5.28*s,z-.45*s],[.82,.52,.23],3);
  }
  mound(4,-.25,2.0,3.1,3.0,1.1,[.43,.54,.34]);
  temple(4,.8,1.6,.93);
  // Road follows a winding curve across the foreground. Gold edge draws in on entry.
  const path=[];
  for(let i=0;i<=140;i++){const t=i/140;path.push([-8+16*t,.18+.15*Math.sin(t*Math.PI)**2,3.2+4.5*Math.sin(t*Math.PI)]);}
  function road(width,color,kind){for(let i=0;i<path.length-1;i++){
    const a=path[i],b=path[i+1],dir=normalize([-(b[2]-a[2]),0,b[0]-a[0]]);
    const shift=(p,n)=>[p[0]+dir[0]*n,p[1]+(kind===6?.025:0),p[2]+dir[2]*n];
    tri(shift(a,-width),shift(b,-width),shift(b,width),color,kind,[[i/140,0],[(i+1)/140,0],[(i+1)/140,1]]);
    tri(shift(a,-width),shift(b,width),shift(a,width),color,kind,[[i/140,0],[(i+1)/140,1],[i/140,1]]);
  }}
  road(.26,[.95,.92,.79],0);road(.055,palettes.gold,6);
  // Floating mist cards are soft translucent discs with no image downloads.
  for(let i=0;i<12;i++){const x=random()*16-8,y=.3+random()*2.1,z=random()*9-2,w=2+random()*3;
    quad([x-w,y,z],[x+w,y,z],[x+w,y+2,z],[x-w,y+2,z],[1,1,1],5);
  }
  const attrs=[['aPosition',3,0],['aNormal',3,3],['aColor',3,6],['aUv',2,9],['aKind',1,11]];
  function buffer(data){const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);return {buffer:b,count:data.length/12};}
  const batches=[buffer(opaque),buffer(transparent)];
  const uniforms=Object.fromEntries(['uView','uProjection','uTime','uEye','uRoute'].map(n=>[n,gl.getUniformLocation(program,n)]));
  attrs.forEach(a=>a.push(gl.getAttribLocation(program,a[0])));
  function perspective(aspect){const f=1/Math.tan(38*Math.PI/360),near=.1,far=160;return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0]);}
  function lookAt(eye,target){const z=normalize(sub(eye,target)),x=normalize(cross([0,1,0],z)),y=cross(z,x);const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);}
  let progress=0,targetProgress=0,pointer=[0,0],paused=false,visible=true,frame=0,last=0,time=0,focus=0;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const stage=document.querySelector('.scene-stage');
  function resize(){const dpr=Math.min(devicePixelRatio||1,innerWidth<650?1.25:1.65);canvas.width=Math.round(canvas.clientWidth*dpr);canvas.height=Math.round(canvas.clientHeight*dpr);gl.viewport(0,0,canvas.width,canvas.height);}
  function draw(now){
    frame=0;if(!visible||document.hidden)return;
    const moving=!paused&&!reduced.matches;
    const dt=Math.min((now-last)/1000,.05)||0;last=now;if(moving)time+=dt;
    progress+=(targetProgress-progress)*.045;
    const p=reduced.matches?0:progress;
    const narrow=innerWidth<700;
    const eye=[22-p*6+pointer[0]*.65,17-p*4+pointer[1]*.3,27-p*7];
    const target=[p*1.5+focus*1.4,2.6+p*.75,0];
    if(narrow){eye[0]*=1.2;eye[1]*=1.2;eye[2]*=1.2;}
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);
    gl.uniformMatrix4fv(uniforms.uView,false,lookAt(eye,target));gl.uniformMatrix4fv(uniforms.uProjection,false,perspective(canvas.width/canvas.height));gl.uniform3fv(uniforms.uEye,eye);gl.uniform1f(uniforms.uTime,time);gl.uniform1f(uniforms.uRoute,reduced.matches?1:Math.min(1,time*.25));
    batches.forEach((b,i)=>{gl.bindBuffer(gl.ARRAY_BUFFER,b.buffer);attrs.forEach(([,size,offset,loc])=>{gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,48,offset*4);});if(i){gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);}gl.drawArrays(gl.TRIANGLES,0,b.count);gl.depthMask(true);gl.disable(gl.BLEND);});
    document.documentElement.style.setProperty('--scene-progress',p.toFixed(4));
    stage.style.setProperty('--story-opacity',Math.max(0,Math.min(1,(p-.35)*2.5)).toFixed(3));
    canvas.dataset.rendered='true';
    // A detail view shares the actual WebGL scene, not a stored screenshot.
    const miniature=document.getElementById('temple-preview');
    if(miniature&&(!miniature.dataset.rendered||time%1<dt)){
      miniature.width=600;miniature.height=400;
      const ctx=miniature.getContext('2d');ctx.clearRect(0,0,600,400);
      ctx.drawImage(canvas,canvas.width*.25,canvas.height*.18,canvas.width*.65,canvas.height*.7,0,0,600,400);miniature.dataset.rendered='true';
    }
    if(moving||Math.abs(targetProgress-progress)>.001)frame=requestAnimationFrame(draw);
  }
  function schedule(){if(!frame&&visible)frame=requestAnimationFrame(draw);}
  function scroll(){const section=document.getElementById('immersive'),rect=section.getBoundingClientRect();targetProgress=Math.max(0,Math.min(1,-rect.top/Math.max(1,section.offsetHeight-innerHeight)));schedule();}
  addEventListener('scroll',scroll,{passive:true});addEventListener('resize',()=>{resize();scroll();});
  stage.addEventListener('pointermove',e=>{if(reduced.matches||paused||e.pointerType==='touch')return;pointer=[e.clientX/innerWidth-.5,e.clientY/innerHeight-.5];schedule();});
  document.getElementById('motion-toggle').addEventListener('click',e=>{paused=!paused;e.currentTarget.setAttribute('aria-pressed',String(paused));e.currentTarget.textContent=paused?'Resume motion ▷':'Pause motion Ⅱ';schedule();});
  reduced.addEventListener('change',()=>{pointer=[0,0];resize();schedule();});
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){last=performance.now();schedule();}else if(frame){cancelAnimationFrame(frame);frame=0;}},{rootMargin:'120px'}).observe(stage);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){last=performance.now();schedule();}});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();visible=false;fallback.hidden=false;status.textContent='3D paused by your device · planner available';});
  canvas.addEventListener('webglcontextrestored',()=>location.reload());
  window.addEventListener('routeplus:scene',e=>{focus=e.detail==='temple'?1:-1;schedule();});
  resize();scroll();schedule();
  window.__sceneInfo={renderer:'Native WebGL 1',vertices:batches.reduce((n,b)=>n+b.count,0),remoteDependencies:0};
})();
