import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { useVoice } from "./useVoice.js";

const PRESETS = {
  classic:  { box:"#c0392b", lid:"#922b21", rib:"#f1c40f", btn:"#c0881a", border:"#7b1a10", txt:"#FFD700" },
  ocean:    { box:"#2ab4e8", lid:"#f07090", rib:"#f5a623", btn:"#c0881a", border:"#0d7aa8", txt:"#ffffff" },
  forest:   { box:"#27ae60", lid:"#8e44ad", rib:"#f39c12", btn:"#b7950b", border:"#1a6b3a", txt:"#fffde0" },
  midnight: { box:"#2c3e50", lid:"#8e44ad", rib:"#f1c40f", btn:"#d4ac0d", border:"#1a252f", txt:"#FFD700" },
};

export default function App() {
  const mountRef = useRef(null);

  const [isOpen,         setIsOpen]         = useState(false);
  const [showPanel,      setShowPanel]      = useState(false);
  const [showVoiceHelp,  setShowVoiceHelp]  = useState(false);
  const [boxColor,       setBoxColor]       = useState("#c0392b");
  const [lidColor,       setLidColor]       = useState("#922b21");
  const [ribbonColor,    setRibbonColor]    = useState("#f1c40f");
  const [btnColor,       setBtnColor]       = useState("#c0881a");
  const [lidBorderColor, setLidBorderColor] = useState("#7b1a10");
  const [textColor,      setTextColor]      = useState("#FFD700");
  const [msgText,        setMsgText]        = useState("Eid Mubarak!");
  const [gravityOn,      setGravityOn]      = useState(false);
  const [verticesOn,     setVerticesOn]     = useState(false);
  const [splitOn,        setSplitOn]        = useState(false);

  const R = {
    boxColor:       useRef(boxColor),
    lidColor:       useRef(lidColor),
    ribbonColor:    useRef(ribbonColor),
    btnColor:       useRef(btnColor),
    lidBorderColor: useRef(lidBorderColor),
    textColor:      useRef(textColor),
    msgText:        useRef(msgText),
  };

  const rebuildColors  = useRef(null);
  const rebuildText    = useRef(null);
  const toggleBoxRef   = useRef(null);
  const openBoxRef     = useRef(null);
  const closeBoxRef    = useRef(null);
  const rotateCamRef   = useRef(null);   // (dir) => void
  const stopCamRef     = useRef(null);
  const resetCamRef    = useRef(null);
  const autoSpinRef    = useRef(null);
  const zoomInRef      = useRef(null);
  const zoomOutRef     = useRef(null);
  const fireConfRef    = useRef(null);   // re-fire confetti
  const toggleGravityRef  = useRef(null);
  const toggleVerticesRef = useRef(null);
  const toggleSplitRef    = useRef(null);

  useEffect(() => { R.boxColor.current       = boxColor;       rebuildColors.current?.(); }, [boxColor]);
  useEffect(() => { R.lidColor.current       = lidColor;       rebuildColors.current?.(); }, [lidColor]);
  useEffect(() => { R.ribbonColor.current    = ribbonColor;    rebuildColors.current?.(); }, [ribbonColor]);
  useEffect(() => { R.btnColor.current       = btnColor;       rebuildColors.current?.(); }, [btnColor]);
  useEffect(() => { R.lidBorderColor.current = lidBorderColor; rebuildColors.current?.(); }, [lidBorderColor]);
  useEffect(() => { R.textColor.current      = textColor;      rebuildText.current?.();   }, [textColor]);
  useEffect(() => { R.msgText.current        = msgText;        rebuildText.current?.();   }, [msgText]);

  const applyPreset = useCallback((name) => {
    const p = PRESETS[name.toLowerCase()];
    if (!p) return;
    setBoxColor(p.box); setLidColor(p.lid); setRibbonColor(p.rib);
    setBtnColor(p.btn); setLidBorderColor(p.border); setTextColor(p.txt);
  }, []);

  
  const voiceActions = {
    openBox:      () => openBoxRef.current?.(),
    closeBox:     () => closeBoxRef.current?.(),
    toggleBox:    () => toggleBoxRef.current?.(),
    rotateCam:    (dir) => rotateCamRef.current?.(dir),
    stopCam:      () => stopCamRef.current?.(),
    resetCam:     () => resetCamRef.current?.(),
    autoSpin:     () => autoSpinRef.current?.(),
    zoomIn:       () => zoomInRef.current?.(),
    zoomOut:      () => zoomOutRef.current?.(),
    setMsg:       (t) => setMsgText(t),
    setBox:       (h) => setBoxColor(h),
    setLid:       (h) => setLidColor(h),
    setRibbon:    (h) => setRibbonColor(h),
    setBtn:       (h) => setBtnColor(h),
    setTxtColor:  (h) => setTextColor(h),
    setBorder:    (h) => setLidBorderColor(h),
    applyPreset:  (n) => applyPreset(n),
    fireConfetti:   () => fireConfRef.current?.(),
    showHelp:       () => setShowVoiceHelp(v => !v),
    toggleGravity:  () => toggleGravityRef.current?.(),
    toggleVertices: () => toggleVerticesRef.current?.(),
    splitBox:       () => toggleSplitRef.current?.(true),
    unsplitBox:     () => toggleSplitRef.current?.(false),
  };

  const {
    listening, toggle: toggleVoice,
    lastTranscript: lastHeard, lastCommand, lastStatus, log: voiceLog, supported,
  } = useVoice(voiceActions);

  const voiceStatus  = listening ? "recording" : "idle";
  const apiKeyMissing   = false;
  const noSpeechSupport = !supported;
  const startRecording  = toggleVoice;
  const stopRecording   = () => {};

  //  THREE.JS SCENE

  useEffect(() => {
    const mount = mountRef.current;
    let W = mount.clientWidth, H = mount.clientHeight;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);


    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0xc8e8f5, 40, 110);

    const camera = new THREE.PerspectiveCamera(52, W / H, 0.1, 300);
    let sph = { theta: 0, phi: Math.PI / 3.8, radius: 14 };
    const tgt = new THREE.Vector3(0, 2, 0);
    let voiceRotDir = null;   // null | "left"|"right"|"up"|"down"
    let voiceSpinning = false;

    const applyCamera = () => {
      camera.position.set(
        tgt.x + sph.radius * Math.sin(sph.phi) * Math.sin(sph.theta),
        tgt.y + sph.radius * Math.cos(sph.phi),
        tgt.z + sph.radius * Math.sin(sph.phi) * Math.cos(sph.theta)
      );
      camera.lookAt(tgt);
    };
    applyCamera();

    // Orbit (mouse drag)
    let isDragging = false, prevMouse = {x:0,y:0};
    const onPD = e => { isDragging=true; prevMouse={x:e.clientX,y:e.clientY}; voiceRotDir=null; voiceSpinning=false; };
    const onPU = () => isDragging=false;
    const onPM = e => {
      if (!isDragging) return;
      sph.theta -= (e.clientX-prevMouse.x)*0.008;
      sph.phi = Math.max(0.15,Math.min(Math.PI*0.48,sph.phi+(e.clientY-prevMouse.y)*0.006));
      prevMouse={x:e.clientX,y:e.clientY};
      applyCamera();
    };
    const onWheel = e => {
      sph.radius = Math.max(5,Math.min(28,sph.radius+e.deltaY*0.02));
      applyCamera();
    };
    renderer.domElement.addEventListener("pointerdown",onPD);
    renderer.domElement.addEventListener("pointerup",  onPU);
    renderer.domElement.addEventListener("pointermove",onPM);
    renderer.domElement.addEventListener("wheel",onWheel,{passive:true});

    // Voice camera controls
    rotateCamRef.current  = (dir) => { voiceRotDir = dir; voiceSpinning = false; };
    stopCamRef.current    = () => { voiceRotDir = null; voiceSpinning = false; };
    autoSpinRef.current   = () => { voiceSpinning = true; voiceRotDir = null; };
    resetCamRef.current   = () => {
      voiceRotDir = null; voiceSpinning = false;
      sph = { theta:0, phi:Math.PI/3.8, radius:14 };
      applyCamera();
    };
    zoomInRef.current     = () => { sph.radius = Math.max(5, sph.radius-2);  applyCamera(); };
    zoomOutRef.current    = () => { sph.radius = Math.min(28, sph.radius+2); applyCamera(); };

    
    scene.add(new THREE.AmbientLight(0xfff3d0, 0.8));
    const sun = new THREE.DirectionalLight(0xfff8e0, 1.4);
    sun.position.set(12,28,8); sun.castShadow=true;
    sun.shadow.mapSize.set(2048,2048);
    sun.shadow.camera.left=-35; sun.shadow.camera.right=35;
    sun.shadow.camera.top=35;  sun.shadow.camera.bottom=-35;
    sun.shadow.camera.far=150; sun.shadow.bias=-0.0004;
    scene.add(sun);
    const fill=new THREE.DirectionalLight(0xd0e8ff,0.35);
    fill.position.set(-8,10,15); scene.add(fill);


    const mkPlane=(w,d,col,y,z)=>{
      const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshLambertMaterial({color:col}));
      m.rotation.x=-Math.PI/2; m.position.set(0,y,z); m.receiveShadow=true; scene.add(m);
    };
    mkPlane(120,80,0x3e7035,0,0); mkPlane(55,18,0x4e9044,0.01,3); mkPlane(5.5,28,0xa09070,0.02,7);
    [-2.9,2.9].forEach(x=>{
      const e=new THREE.Mesh(new THREE.PlaneGeometry(0.22,28),new THREE.MeshLambertMaterial({color:0x7a7058}));
      e.rotation.x=-Math.PI/2; e.position.set(x,0.03,7); scene.add(e);
    });

    const BG=new THREE.Group(); BG.position.set(0,0,-17); scene.add(BG);
    const bM=new THREE.MeshLambertMaterial({color:0xdfd0a0});
    const bD=new THREE.MeshLambertMaterial({color:0xb8a070});
    const wM=new THREE.MeshPhongMaterial({color:0x2a4a6a,shininess:60});
    const cM=new THREE.MeshLambertMaterial({color:0xcfbc8a});
    const ab=(w,h,d,x,y,z,mat,cast=true)=>{
      const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
      m.position.set(x,y,z); if(cast)m.castShadow=true; m.receiveShadow=true; BG.add(m);
    };
    ab(42,11,8,0,5.5,0,bM); ab(13,14,8.6,0,7.0,0,bM);
    ab(43,0.7,9,0,11.35,0,bD,false); ab(14,0.7,9.6,0,14.35,0,bD,false);
    for(let i=-5;i<=5;i+=2){
      const c=new THREE.Mesh(new THREE.CylinderGeometry(0.32,0.38,10,10),cM);
      c.position.set(i,5,4.4); c.castShadow=true; BG.add(c);
    }
    const mW=(n,sx,sy,z)=>{for(let i=0;i<n;i++){
      const w=new THREE.Mesh(new THREE.BoxGeometry(1.5,2.4,0.12),wM);
      w.position.set(sx+i*3.6,sy,z); BG.add(w);}};
    mW(4,-19.5,9,4.05); mW(4,-19.5,5.5,4.05); mW(4,6.0,9,4.05); mW(4,6.0,5.5,4.05); mW(3,-3.6,12.5,4.35);
    for(let s=0;s<5;s++) ab(9.5-s*1.2,0.38,1.1,0,s*0.38,4.4+s*0.55,bD,false);

    // Trees
    const aT=(x,z,sc=1)=>{
      const t=new THREE.Mesh(new THREE.CylinderGeometry(0.16*sc,0.22*sc,2.8*sc,7),
        new THREE.MeshLambertMaterial({color:0x5c3518}));
      t.position.set(x,1.4*sc,z); t.castShadow=true; scene.add(t);
      [1.55*sc,1.1*sc].forEach((r,i)=>{
        const l=new THREE.Mesh(new THREE.SphereGeometry(r,9,7),
          new THREE.MeshLambertMaterial({color:i===0?0x2a6228:0x3a8035}));
        l.position.set(x,(3.6+i*0.9)*sc,z); l.castShadow=true; scene.add(l);
      });
    };
    [-17,-13,13,17].forEach(x=>aT(x,-4.5));
    [-7,7].forEach(x=>aT(x,-7.5,0.85));
    [-22,22].forEach(x=>aT(x,0,1.1));


    const BS=2.6, BH=2.2, WALL=0.13;
    const gG=new THREE.Group(); gG.position.set(0,0,4); scene.add(gG);

    let matBox    = new THREE.MeshPhongMaterial({color:new THREE.Color(R.boxColor.current),    shininess:60});
    let matLid    = new THREE.MeshPhongMaterial({color:new THREE.Color(R.lidColor.current),    shininess:80});
    let matRibbon = new THREE.MeshPhongMaterial({color:new THREE.Color(R.ribbonColor.current), shininess:120});
    let matBtn    = new THREE.MeshPhongMaterial({color:new THREE.Color(R.btnColor.current),    shininess:180});
    let matBorder = new THREE.MeshPhongMaterial({color:new THREE.Color(R.lidBorderColor.current),shininess:60});
    const matInside=new THREE.MeshPhongMaterial({color:0x8a1a1a,shininess:20,side:THREE.BackSide});

    const mkFace=(w,h,d,x,y,z)=>{
      const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),matBox);
      m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; gG.add(m); return m;
    };
    mkFace(BS,WALL,BS,0,0,0);
    mkFace(BS,BH,WALL,0,BH/2,BS/2); mkFace(BS,BH,WALL,0,BH/2,-BS/2);
    mkFace(WALL,BH,BS,BS/2,BH/2,0); mkFace(WALL,BH,BS,-BS/2,BH/2,0);

    [[0,BH/2,-BS/2+WALL+0.01,0],[0,BH/2,0,Math.PI/2],[0,BH/2,0,-Math.PI/2]].forEach(([x,y,z,ry])=>{
      const m=new THREE.Mesh(new THREE.PlaneGeometry(BS-WALL*2,BH),matInside);
      m.rotation.y=ry; m.position.set(x,y,z); gG.add(m);
    });

    const ribFaces=[];
    const rX=new THREE.Mesh(new THREE.BoxGeometry(BS+0.04,BH+0.04,0.25),matRibbon);
    rX.position.set(0,BH/2,0); gG.add(rX); ribFaces.push(rX);
    const rZ=new THREE.Mesh(new THREE.BoxGeometry(0.25,BH+0.04,BS+0.04),matRibbon);
    rZ.position.set(0,BH/2,0); gG.add(rZ); ribFaces.push(rZ);

    const btnMesh=new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.22,0.18,24),matBtn);
    btnMesh.rotation.x=Math.PI/2; btnMesh.position.set(0,BH*0.42,BS/2+0.16); gG.add(btnMesh);
    const btnRing=new THREE.Mesh(new THREE.TorusGeometry(0.22,0.035,8,24),
      new THREE.MeshPhongMaterial({color:0xffd700,shininess:200}));
    btnRing.rotation.x=Math.PI/2; btnRing.position.set(0,BH*0.42,BS/2+0.25); gG.add(btnRing);

    const lidPivot=new THREE.Group(); lidPivot.position.set(0,BH,-BS/2); gG.add(lidPivot);
    const lidPanel=new THREE.Mesh(new THREE.BoxGeometry(BS+0.1,WALL+0.06,BS+0.1),matLid);
    lidPanel.position.set(0,0,BS/2); lidPanel.castShadow=true; lidPivot.add(lidPanel);

    const SH=0.2;
    const skirtFaces=[];
    [[BS+0.1,SH,WALL,0,-SH/2,BS+0.05],[BS+0.1,SH,WALL,0,-SH/2,0],
     [WALL,SH,BS+0.1,-BS/2-0.05,-SH/2,BS/2],[WALL,SH,BS+0.1,BS/2+0.05,-SH/2,BS/2]
    ].forEach(([w,h,d,x,y,z])=>{
      const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),matBorder);
      m.position.set(x,y,z); lidPivot.add(m); skirtFaces.push(m);
    });

    const lidRibs=[];
    const lr1=new THREE.Mesh(new THREE.BoxGeometry(BS+0.12,0.07,0.26),matRibbon);
    lr1.position.set(0,WALL/2+0.05,BS/2); lidPivot.add(lr1); lidRibs.push(lr1);
    const lr2=new THREE.Mesh(new THREE.BoxGeometry(0.26,0.07,BS+0.12),matRibbon);
    lr2.position.set(0,WALL/2+0.05,BS/2); lidPivot.add(lr2); lidRibs.push(lr2);

   
    rebuildColors.current = () => {
      matBox.color.set(R.boxColor.current);
      matLid.color.set(R.lidColor.current);
      matRibbon.color.set(R.ribbonColor.current);
      matBtn.color.set(R.btnColor.current);
      matBorder.color.set(R.lidBorderColor.current);
    };

    let textSprite=null;
    const buildText=()=>{
      if(textSprite){ textSprite.material.map?.dispose(); textSprite.material.dispose(); scene.remove(textSprite); textSprite=null; }
      const FSIZE=150,PAD=100,CH=250,FONT=`bold ${FSIZE}px Georgia,serif`;
      const tmp=document.createElement("canvas");
      tmp.getContext("2d").font=FONT;
      const CW=Math.max(Math.ceil(tmp.getContext("2d").measureText(R.msgText.current).width)+PAD*2,400);
      const c=document.createElement("canvas"); c.width=CW; c.height=CH;
      const ctx=c.getContext("2d"); ctx.clearRect(0,0,CW,CH);
      ctx.shadowColor="rgba(80,30,0,0.8)"; ctx.shadowBlur=20; ctx.shadowOffsetY=6;
      ctx.fillStyle=R.textColor.current;
      ctx.font=FONT; ctx.textAlign="center"; ctx.textBaseline="middle";
      ctx.fillText(R.msgText.current,CW/2,CH/2);
      const worldW=9.0,worldH=worldW*(CH/CW);
      const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,opacity:0,depthTest:false}));
      sp.scale.set(worldW*0.06,worldH*0.06,1);
      sp.position.set(0,BH*0.5,4.0);
      sp.userData.fw=worldW; sp.userData.fh=worldH;
      scene.add(sp); textSprite=sp;
    };
    buildText();
    rebuildText.current=()=>{
      buildText();
      if(boxOpenState){ textSprite.material.opacity=1; textSprite.scale.set(textSprite.userData.fw,textSprite.userData.fh,1); textSprite.position.y=BH+3.2; }
    };

    
    const CCOLS=[0xff4136,0xFFD700,0x2ecc40,0x0074d9,0xff69b4,0xffffff,0xff6f00,0x9b59b6];
    const particles=[];
    for(let i=0;i<280;i++){
      const p=new THREE.Mesh(
        new THREE.BoxGeometry(0.07+Math.random()*0.12,0.05+Math.random()*0.09,0.012),
        new THREE.MeshBasicMaterial({color:CCOLS[i%CCOLS.length]})
      );
      p.visible=false;
      p.userData={vx:(Math.random()-0.5)*0.34,vy:0.1+Math.random()*0.4,vz:(Math.random()-0.5)*0.28,
        gravity:-0.009,rotX:(Math.random()-0.5)*0.3,rotY:(Math.random()-0.5)*0.3,rotZ:(Math.random()-0.5)*0.3,
        life:-(Math.random()*60),maxLife:150+Math.random()*100};
      p.position.set((Math.random()-0.5)*BS,BH,4.0+(Math.random()-0.5)*BS);
      scene.add(p); particles.push(p);
    }

    const launchConfetti=()=>{
      particles.forEach((p,i)=>{
        p.visible=true;
        p.position.set((Math.random()-0.5)*(BS*0.7),BH+0.1,4.0+(Math.random()-0.5)*(BS*0.7));
        p.userData.life=-(i*0.42);
        p.userData.vy=0.12+Math.random()*0.42;
        p.userData.vx=(Math.random()-0.5)*0.34;
        p.userData.vz=(Math.random()-0.5)*0.28;
      });
    };
    fireConfRef.current=launchConfetti;

    // Box open/close
    let boxOpenState=false, openProg=0, textProg=0, confDone=false, animDir=0, time=0, animFrame;

    const easeOutBack    = t=>{const c=2.4;return 1+c*Math.pow(t-1,3)+(c-1)*Math.pow(t-1,2);};
    const easeOutElastic = t=>{if(t===0||t===1)return t;return Math.pow(2,-10*t)*Math.sin((t*10-0.75)*(2*Math.PI)/3)+1;};
    const easeOutCubic   = t=>1-Math.pow(1-t,3);

    const doOpen=()=>{
      if(boxOpenState||animDir===1)return;
      boxOpenState=true; animDir=1; textProg=0; confDone=false;
      setIsOpen(true);
      particles.forEach(p=>{p.visible=false; p.userData.life=-(Math.random()*60);});
    };
    const doClose=()=>{
      if(!boxOpenState||animDir===-1)return;
      boxOpenState=false; animDir=-1;
      setIsOpen(false);
      if(textSprite){textSprite.material.opacity=0; textSprite.scale.set(0.1,0.025,1); textSprite.position.y=BH*0.5;}
      particles.forEach(p=>p.visible=false);
    };
    const doToggle=()=>{ if(boxOpenState) doClose(); else doOpen(); };

    toggleBoxRef.current = doToggle;
    openBoxRef.current   = doOpen;
    closeBoxRef.current  = doClose;

  
    let gravityActive = false, gravVel = 0, onGround = false;
    toggleGravityRef.current = () => {
      gravityActive = !gravityActive;
      setGravityOn(gravityActive);
      if (gravityActive) {
        gG.position.y = 5; // drop from above — makes gravity visible
        gravVel = 0; onGround = false;
      } else {
        gG.position.y = 0; gravVel = 0; onGround = false; gG.scale.set(1,1,1);
      }
    };

    //  VERTICES — cyan cylinder tubes + bright corner dots
    let verticesActive = false;
    const vtxMeshes = []; // all vertex/edge meshes toggled together

    // 8 corners of the box body
    const CORNERS = [
      [-BS/2,0,-BS/2],[BS/2,0,-BS/2],[-BS/2,BH,-BS/2],[BS/2,BH,-BS/2],
      [-BS/2,0, BS/2],[BS/2,0, BS/2],[-BS/2,BH, BS/2],[BS/2,BH, BS/2],
    ];
    // 12 edges
    const EDGES = [
      [0,1],[2,3],[4,5],[6,7], // horizontals bottom/top
      [0,2],[1,3],[4,6],[5,7], // verticals
      [0,4],[1,5],[2,6],[3,7], // depth
    ];

    // Corner dots
    CORNERS.forEach(([x,y,z]) => {
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.10, 10, 10),
        new THREE.MeshBasicMaterial({ color: 0x00ffff })
      );
      dot.position.set(x, y, z);
      dot.visible = false;
      gG.add(dot); vtxMeshes.push(dot);
    });

   
    EDGES.forEach(([a,b]) => {
      const pA = new THREE.Vector3(...CORNERS[a]);
      const pB = new THREE.Vector3(...CORNERS[b]);
      const len = pA.distanceTo(pB);
      const mid = new THREE.Vector3().addVectors(pA,pB).multiplyScalar(0.5);
      const tube = new THREE.Mesh(
        new THREE.CylinderGeometry(0.028, 0.028, len, 6),
        new THREE.MeshBasicMaterial({ color: 0x00ffff })
      );
      tube.position.copy(mid);
      tube.quaternion.setFromUnitVectors(
        new THREE.Vector3(0,1,0),
        new THREE.Vector3().subVectors(pB,pA).normalize()
      );
      tube.visible = false;
      gG.add(tube); vtxMeshes.push(tube);
    });

    toggleVerticesRef.current = () => {
      verticesActive = !verticesActive;
      setVerticesOn(verticesActive);
      vtxMeshes.forEach(m => m.visible = verticesActive);
    };

  
    let splitActive = false, splitProg = 0, splitAnimDir = 0;
    const SPLIT_DIST = 3.0;

    // Collect the 5 outer walls + 2 ribbons (skip: lidPivot, buttons, inside planes, vertex meshes)
    const splitFaces = [];
    gG.children.forEach(child => {
      if (child === lidPivot)            return; // lid handled by open animation
      if (child === btnMesh)             return;
      if (child === btnRing)             return;
      if (child.geometry?.type === "PlaneGeometry") return; // inside panels
      splitFaces.push(child);
      child.userData.origPos = child.position.clone();
      // Explode direction: outward from center horizontally, bottom goes down
      const p = child.userData.origPos;
      const xzLen = Math.sqrt(p.x*p.x + p.z*p.z);
      child.userData.splitDir = xzLen < 0.3
        ? new THREE.Vector3(0, p.y < 0.5 ? -1 : 0.8, 0)
        : new THREE.Vector3(p.x, 0, p.z).normalize();
    });

    toggleSplitRef.current = (wantSplit) => {
      if (wantSplit === splitActive) return;
      splitActive = wantSplit;
      setSplitOn(wantSplit);
      splitAnimDir = wantSplit ? 1 : -1;
      if (wantSplit) {
        // Show text like open
        if (!boxOpenState) {
          boxOpenState = true; animDir = 1; textProg = 0; confDone = false;
          setIsOpen(true);
          particles.forEach(p => { p.visible=false; p.userData.life=-(Math.random()*60); });
        }
      } else {
        // Hide text like close
        boxOpenState = false; animDir = -1; setIsOpen(false);
        if (textSprite) { textSprite.material.opacity=0; textSprite.scale.set(0.1,0.025,1); textSprite.position.y=BH*0.5; }
        particles.forEach(p => p.visible=false);
      }
    };


    const raycaster=new THREE.Raycaster();
    const mouse=new THREE.Vector2();
    let mdPos={x:0,y:0};
    const onMD=e=>{mdPos={x:e.clientX,y:e.clientY};};
    const onClick=e=>{
      if(Math.abs(e.clientX-mdPos.x)>6||Math.abs(e.clientY-mdPos.y)>6)return;
      const rect=renderer.domElement.getBoundingClientRect();
      mouse.x=((e.clientX-rect.left)/rect.width)*2-1;
      mouse.y=-((e.clientY-rect.top)/rect.height)*2+1;
      raycaster.setFromCamera(mouse,camera);
      if(raycaster.intersectObjects([btnMesh,btnRing],true).length>0) doToggle();
    };
    const onHov=e=>{
      const rect=renderer.domElement.getBoundingClientRect();
      mouse.x=((e.clientX-rect.left)/rect.width)*2-1;
      mouse.y=-((e.clientY-rect.top)/rect.height)*2+1;
      raycaster.setFromCamera(mouse,camera);
      renderer.domElement.style.cursor=raycaster.intersectObjects([btnMesh,btnRing],true).length>0?"pointer":"default";
    };
    renderer.domElement.addEventListener("mousedown",onMD);
    renderer.domElement.addEventListener("click",onClick);
    renderer.domElement.addEventListener("mousemove",onHov);

    
    const animate=()=>{
      animFrame=requestAnimationFrame(animate);
      time+=0.016;

      // Voice camera rotation (continuous while direction is set)
      if(voiceRotDir==="left")  { sph.theta-=0.025; applyCamera(); }
      if(voiceRotDir==="right") { sph.theta+=0.025; applyCamera(); }
      if(voiceRotDir==="up")    { sph.phi=Math.max(0.15,sph.phi-0.018); applyCamera(); }
      if(voiceRotDir==="down")  { sph.phi=Math.min(Math.PI*0.48,sph.phi+0.018); applyCamera(); }
      if(voiceSpinning)         { sph.theta+=0.012; applyCamera(); }

      if (!gravityActive && !splitActive) {
        if (!boxOpenState && openProg < 0.05) {
          gG.position.y = Math.sin(time*1.2)*0.08;
          const sc=1+Math.sin(time*3.5)*0.04;
          btnMesh.scale.set(sc,1,sc); btnRing.scale.set(sc,1,sc);
        } else {
          gG.position.y = 0; btnMesh.scale.set(1,1,1); btnRing.scale.set(1,1,1);
        }
      }

      if (gravityActive) {
        if (!onGround) {
          gravVel -= 0.018;
          gG.position.y += gravVel;
          if (gG.position.y <= 0) {
            gG.position.y = 0;
            gravVel = Math.abs(gravVel) * 0.42; // bounce — keep 42% energy
            if (gravVel < 0.02) { gravVel = 0; onGround = true; gG.scale.set(1.12,0.82,1.12); }
          }
        } else {
          gG.position.y = 0;
        }
        // Recover squash smoothly
        gG.scale.x += (1 - gG.scale.x) * 0.12;
        gG.scale.y += (1 - gG.scale.y) * 0.12;
        gG.scale.z += (1 - gG.scale.z) * 0.12;
      }

      if (splitAnimDir !== 0) {
        splitProg = Math.max(0, Math.min(1, splitProg + splitAnimDir * 0.03));
        const ease = 1 - Math.pow(1 - splitProg, 3); // easeOutCubic
        splitFaces.forEach(mesh => {
          const d = mesh.userData.splitDir;
          const o = mesh.userData.origPos;
          if (!d || !o) return;
          mesh.position.set(o.x + d.x*ease*SPLIT_DIST, o.y + d.y*ease*SPLIT_DIST, o.z + d.z*ease*SPLIT_DIST);
        });
        if (splitProg >= 1 || splitProg <= 0) splitAnimDir = 0;
      }

  
      if(animDir===1&&openProg<1){
        openProg=Math.min(openProg+0.022,1);
        lidPivot.rotation.x=-easeOutBack(openProg)*Math.PI*0.88;
        if(openProg<0.1) gG.rotation.z=Math.sin(openProg*150)*0.025;
        else gG.rotation.z*=0.85;
        if(openProg>=1) animDir=0;
      } else if(animDir===-1&&openProg>0){
        openProg=Math.max(openProg-0.035,0);
        lidPivot.rotation.x=-easeOutBack(openProg)*Math.PI*0.88;
        if(openProg<=0){animDir=0;gG.rotation.z=0;}
      }

      // Confetti
      if(animDir===1&&openProg>0.35&&!confDone){ confDone=true; launchConfetti(); }

      // Text
      if(animDir===1&&openProg>0.5&&textSprite){
        textProg=Math.min(textProg+0.014,1);
        const ease=easeOutElastic(textProg);
        textSprite.material.opacity=Math.min(textProg*3.0,1);
        const fw=textSprite.userData.fw||9, fh=textSprite.userData.fh||2.2;
        textSprite.scale.set(fw*(0.08+ease*0.92),fh*(0.08+ease*0.92),1);
        const y0=BH+0.3,y1=BH+3.2;
        textSprite.position.y=y0+(y1-y0)*easeOutCubic(textProg)+(textProg>=1?Math.sin(time*2.0)*0.08:0);
      }

      // Confetti physics
      particles.forEach(p=>{
        if(!p.visible)return;
        p.userData.life++;
        if(p.userData.life<0)return;
        if(p.userData.life>p.userData.maxLife){p.visible=false;return;}
        p.userData.vy+=p.userData.gravity;
        p.position.x+=p.userData.vx; p.position.y+=p.userData.vy; p.position.z+=p.userData.vz;
        p.rotation.x+=p.userData.rotX; p.rotation.y+=p.userData.rotY; p.rotation.z+=p.userData.rotZ;
        p.userData.vx*=0.997; p.userData.vz*=0.997;
      });

      renderer.render(scene,camera);
    };
    animate();

    const onResize=()=>{W=mount.clientWidth;H=mount.clientHeight;camera.aspect=W/H;camera.updateProjectionMatrix();renderer.setSize(W,H);};
    window.addEventListener("resize",onResize);

    return()=>{
      cancelAnimationFrame(animFrame);
      window.removeEventListener("resize",onResize);
      ["mousedown","click","mousemove"].forEach(ev=>renderer.domElement.removeEventListener(ev,ev==="mousedown"?onMD:ev==="click"?onClick:onHov));
      renderer.domElement.removeEventListener("pointerdown",onPD);
      renderer.domElement.removeEventListener("pointerup",  onPU);
      renderer.domElement.removeEventListener("pointermove",onPM);
      renderer.domElement.removeEventListener("wheel",      onWheel);
      if(mount.contains(renderer.domElement))mount.removeChild(renderer.domElement);
      renderer.dispose();
      rebuildColors.current=null; rebuildText.current=null;
    };
  }, []);


  const lbl = t => <span style={{fontSize:"12px",color:"rgba(255,255,255,0.6)",display:"block",marginBottom:"4px"}}>{t}</span>;
  const ColorRow=({l,v,s})=>(
    <div style={{marginBottom:"10px"}}>
      {lbl(l)}
      <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
        <input type="color" value={v} onChange={e=>s(e.target.value)}
          style={{width:"42px",height:"36px",padding:"2px",border:"2px solid rgba(255,215,0,0.4)",borderRadius:"7px",cursor:"pointer",background:v}}/>
        <span style={{color:"#ccc",fontSize:"12px",fontFamily:"monospace"}}>{v}</span>
      </div>
    </div>
  );

  
  const statusColors = {
    idle:       { bg:"radial-gradient(circle,#1a3a1a,#0d1f0d)", border:"2px solid rgba(100,200,100,0.35)", icon:"🎤",  label:"CLICK TO SPEAK" },
    recording:  { bg:"radial-gradient(circle,#cc0000,#880000)", border:"3px solid #ff4444",               icon:"🔴", label:"RECORDING…" },
    processing: { bg:"radial-gradient(circle,#b8860b,#7b5900)", border:"3px solid #f1c40f",               icon:"💭", label:"THINKING…" },
    error:      { bg:"radial-gradient(circle,#8b0000,#400000)", border:"2px solid #ff4444",               icon:"⚠️", label:"ERROR" },
  };
  const sc = statusColors[voiceStatus] || statusColors.idle;
  const micBg = sc.bg;

  return (
    <div style={{width:"100vw",height:"100vh",position:"relative",overflow:"hidden",background:"#111"}}>
      <div ref={mountRef} style={{width:"100%",height:"100%"}}/>

      {/* Bottom hint */}
      <div style={{
        position:"absolute",bottom:"5%",left:"50%",transform:"translateX(-50%)",
        color:"rgba(255,255,255,0.8)",fontFamily:"Georgia,serif",
        fontSize:"clamp(12px,1.4vw,15px)",letterSpacing:"0.07em",
        textShadow:"0 2px 12px rgba(0,0,0,0.9)",
        animation:isOpen?"none":"floatHint 2.5s ease-in-out infinite",
        pointerEvents:"none",whiteSpace:"nowrap",
        background:"rgba(0,0,0,0.3)",padding:"6px 18px",borderRadius:"30px",
      }}>
        {isOpen
          ? "🌙 May this Eid bring joy, peace & blessings · Click button to close"
          : "🔴 Click the golden button to open · Or 🎤 click & speak"}
      </div>

      {/* ── MIC BUTTON (bottom-left) ───────────────────────── */}
      {true && (  // Gemini works in all modern browsers
        <div style={{position:"absolute",bottom:"5%",left:"24px",display:"flex",flexDirection:"column",alignItems:"center",gap:"8px"}}>
          <button
            onPointerDown={startRecording}
            onPointerUp={stopRecording}
            onPointerLeave={stopRecording}
            title="Hold to speak — release to send"
            style={{
              width:"56px",height:"56px",borderRadius:"50%",
              background:micBg,
              border: sc.border,
              cursor:"pointer",fontSize:"22px",
              boxShadow: voiceStatus==="recording"
                ? "0 0 0 10px rgba(255,50,50,0.25), 0 0 28px rgba(255,0,0,0.55)"
                : voiceStatus==="processing"
                  ? "0 0 0 10px rgba(241,196,15,0.2), 0 0 24px rgba(241,196,15,0.4)"
                  : "0 4px 16px rgba(0,0,0,0.5)",
              animation: voiceStatus==="recording"  ? "micPulse 1.0s ease-in-out infinite"
                       : voiceStatus==="processing" ? "micPulse 0.5s ease-in-out infinite"
                       : "none",
              transition:"all 0.25s",
            }}>
            {sc.icon}
          </button>
          <span style={{
            color: voiceStatus==="recording"  ? "#ff6666"
                 : voiceStatus==="processing" ? "#f1c40f"
                 : voiceStatus==="error"      ? "#ff8888"
                 : "rgba(150,255,150,0.7)",
            fontSize:"10px",fontFamily:"monospace",letterSpacing:"0.05em",
            textShadow:"0 1px 4px rgba(0,0,0,0.8)",
          }}>
            {sc.label}
          </span>
        </div>
      )}

      {/* ── VOICE FEEDBACK BUBBLE (bottom-center-left) ─────── */}
      {(listening || lastCommand) && (lastHeard || lastCommand) && (
        <div style={{
          position:"absolute",bottom:"14%",left:"50%",transform:"translateX(-50%)",
          background:"rgba(0,0,0,0.85)",backdropFilter:"blur(14px)",
          border:`1px solid ${lastStatus==="ok"?"rgba(100,255,120,0.55)":lastStatus==="miss"?"rgba(255,80,80,0.55)":"rgba(255,215,0,0.25)"}`,
          borderRadius:"14px",padding:"12px 22px",
          maxWidth:"440px",textAlign:"center",
          boxShadow:"0 6px 24px rgba(0,0,0,0.55)",
          transition:"border-color 0.3s",
        }}>
          {voiceStatus==="recording" && (
            <div style={{color:"#ff8888",fontSize:"11px",fontFamily:"monospace",marginBottom:"4px",letterSpacing:"0.05em"}}>
              🔴 Speak now — stop talking when done
            </div>
          )}
          {voiceStatus==="processing" && (
            <div style={{color:"#f1c40f",fontSize:"12px",fontFamily:"monospace",marginBottom:"4px"}}>
              ⏳ Sending to Gemini AI…
            </div>
          )}
          {lastHeard && lastHeard !== "🎤 listening…" && (
            <div style={{color:"rgba(255,255,255,0.6)",fontSize:"11px",marginBottom:"6px",fontStyle:"italic",letterSpacing:"0.03em"}}>
              🎤 "{lastHeard}"
            </div>
          )}
          {voiceStatus==="processing" && lastCommand && (
            <div style={{color:"#f1c40f",fontSize:"12px",fontFamily:"monospace",marginBottom:"4px"}}>
              💭 Gemini processing…
            </div>
          )}
          {lastCommand && lastStatus==="ok" && (
            <div style={{color:"#66ff88",fontSize:"13px",fontFamily:"monospace",fontWeight:"bold",letterSpacing:"0.04em"}}>
              ✅ {lastCommand}
            </div>
          )}
          {lastStatus==="miss" && (
            <div style={{color:"#ff8888",fontSize:"12px",fontFamily:"monospace"}}>
              ❌ Not understood — try again
            </div>
          )}
        </div>
      )}

      {/* ── COMMAND LOG (top-left, only when listening) ─────── */}
      {listening && voiceLog.length > 0 && (
        <div style={{
          position:"absolute",top:"16px",left:"16px",
          background:"rgba(0,0,0,0.65)",backdropFilter:"blur(10px)",
          border:"1px solid rgba(255,100,100,0.25)",
          borderRadius:"10px",padding:"10px 14px",minWidth:"180px",
          boxShadow:"0 4px 16px rgba(0,0,0,0.4)",
        }}>
          <div style={{color:"#ff8888",fontSize:"11px",fontFamily:"monospace",marginBottom:"6px",letterSpacing:"0.1em"}}>
            🎤 RECENT COMMANDS
          </div>
          {voiceLog.map((c,i)=>(
            <div key={i} style={{
              color:i===0?"#66ff88":"rgba(255,255,255,0.45)",
              fontSize:"11px",fontFamily:"monospace",
              padding:"2px 0",
              borderLeft: i===0?"2px solid #66ff88":"2px solid transparent",
              paddingLeft:"6px",
              transition:"all 0.3s",
            }}>
              {c}
            </div>
          ))}
        </div>
      )}


      {/* ── PHYSICS TOOLBAR (bottom-right) ───────────────────── */}
      <div style={{position:"absolute",bottom:"5%",right:"16px",display:"flex",flexDirection:"column",gap:"8px",alignItems:"flex-end",zIndex:10}}>
        {/* SPLIT */}
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <span style={{color:"rgba(255,255,255,0.5)",fontSize:"9px",fontFamily:"monospace",letterSpacing:"0.08em"}}>{splitOn?"SPLIT ✓":"SPLIT"}</span>
          <button onClick={()=>toggleSplitRef.current?.(!splitOn)} title="Split / Unsplit box faces"
            style={{width:"44px",height:"44px",borderRadius:"10px",cursor:"pointer",fontSize:"20px",
              background:splitOn?"linear-gradient(135deg,#7b1fa2,#4a0072)":"rgba(10,5,20,0.85)",
              border:splitOn?"2px solid #ce93d8":"2px solid rgba(180,100,255,0.35)",
              boxShadow:splitOn?"0 0 14px rgba(180,50,255,0.5)":"0 2px 8px rgba(0,0,0,0.5)",
              transition:"all 0.25s"}}>🧩</button>
        </div>
        {/* VERTICES */}
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <span style={{color:"rgba(255,255,255,0.5)",fontSize:"9px",fontFamily:"monospace",letterSpacing:"0.08em"}}>{verticesOn?"VERTICES ✓":"VERTICES"}</span>
          <button onClick={()=>toggleVerticesRef.current?.()} title="Show / hide vertices & edges"
            style={{width:"44px",height:"44px",borderRadius:"10px",cursor:"pointer",fontSize:"20px",
              background:verticesOn?"linear-gradient(135deg,#b8860b,#7a5500)":"rgba(10,8,0,0.85)",
              border:verticesOn?"2px solid #ffd700":"2px solid rgba(255,215,0,0.35)",
              boxShadow:verticesOn?"0 0 14px rgba(255,200,0,0.5)":"0 2px 8px rgba(0,0,0,0.5)",
              transition:"all 0.25s"}}>📐</button>
        </div>
        {/* GRAVITY */}
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <span style={{color:"rgba(255,255,255,0.5)",fontSize:"9px",fontFamily:"monospace",letterSpacing:"0.08em"}}>{gravityOn?"GRAVITY ✓":"GRAVITY"}</span>
          <button onClick={()=>toggleGravityRef.current?.()} title="Toggle gravity — box drops & bounces"
            style={{width:"44px",height:"44px",borderRadius:"10px",cursor:"pointer",fontSize:"20px",
              background:gravityOn?"linear-gradient(135deg,#1a237e,#0d1257)":"rgba(5,5,20,0.85)",
              border:gravityOn?"2px solid #5c6bc0":"2px solid rgba(100,120,255,0.35)",
              boxShadow:gravityOn?"0 0 14px rgba(80,100,255,0.5)":"0 2px 8px rgba(0,0,0,0.5)",
              transition:"all 0.25s"}}>🌍</button>
        </div>
      </div>

      {/* ── CUSTOMIZE BUTTON (top-right) ────────────────────── */}
      <button onClick={()=>setShowPanel(p=>!p)} style={{
        position:"absolute",top:"16px",right:"16px",
        background:"rgba(0,0,0,0.55)",color:"#FFD700",
        border:"2px solid rgba(255,215,0,0.45)",borderRadius:"10px",
        padding:"9px 18px",cursor:"pointer",fontFamily:"Georgia,serif",
        fontSize:"14px",letterSpacing:"0.08em",zIndex:10,
        backdropFilter:"blur(8px)",boxShadow:"0 2px 12px rgba(0,0,0,0.4)",
      }}>🎨 Customize</button>

      {/* ── CUSTOMIZE PANEL ─────────────────────────────────── */}
      {showPanel&&(
        <div style={{
          position:"absolute",top:"58px",right:"16px",width:"240px",
          background:"rgba(8,8,18,0.9)",backdropFilter:"blur(16px)",
          border:"1px solid rgba(255,215,0,0.2)",borderRadius:"14px",
          padding:"18px",zIndex:10,boxShadow:"0 8px 32px rgba(0,0,0,0.6)",
          maxHeight:"88vh",overflowY:"auto",
        }}>
          <div style={{color:"#FFD700",fontFamily:"Georgia,serif",fontSize:"15px",fontWeight:"bold",
            marginBottom:"14px",borderBottom:"1px solid rgba(255,215,0,0.2)",paddingBottom:"8px"}}>
            🎁 Customize Box
          </div>
          <div style={{marginBottom:"12px"}}>
            {lbl("Message Text")}
            <input type="text" value={msgText} maxLength={40}
              onChange={e=>setMsgText(e.target.value)}
              style={{width:"100%",padding:"7px 10px",borderRadius:"8px",
                border:"1px solid rgba(255,255,255,0.2)",background:"rgba(255,255,255,0.1)",
                color:"#fff",fontSize:"14px",outline:"none",boxSizing:"border-box"}}/>
          </div>
          <ColorRow l="Text Colour"       v={textColor}      s={setTextColor}/>
          <ColorRow l="Box Colour"        v={boxColor}       s={setBoxColor}/>
          <ColorRow l="Lid Colour"        v={lidColor}       s={setLidColor}/>
          <ColorRow l="Lid Border Colour" v={lidBorderColor} s={setLidBorderColor}/>
          <ColorRow l="Ribbon Colour"     v={ribbonColor}    s={setRibbonColor}/>
          <ColorRow l="Button Colour"     v={btnColor}       s={setBtnColor}/>
          <div style={{marginTop:"6px"}}>
            {lbl("Quick Presets")}
            <div style={{display:"flex",gap:"7px",flexWrap:"wrap"}}>
              {Object.entries(PRESETS).map(([name,p])=>(
                <button key={name} onClick={()=>applyPreset(name)}
                  style={{padding:"6px 11px",borderRadius:"7px",cursor:"pointer",
                    background:`linear-gradient(135deg,${p.box},${p.lid})`,
                    color:"#fff",fontSize:"11px",border:"none",fontWeight:"bold",
                    textShadow:"0 1px 4px rgba(0,0,0,0.7)",textTransform:"capitalize",
                  }}>{name}</button>
              ))}
            </div>
          </div>
          {/* Voice commands reference inside panel */}
          <div style={{marginTop:"14px",borderTop:"1px solid rgba(255,215,0,0.15)",paddingTop:"12px"}}>
            {lbl("🎤 Voice Commands")}
            <div style={{fontSize:"11px",color:"rgba(255,255,255,0.5)",lineHeight:"1.8",fontFamily:"monospace"}}>
              <span style={{color:"#f1c40f",fontSize:"10px"}}>✦ Powered by Groq ✦</span><br/>
              Say anything naturally:<br/>
              "open the box"<br/>
              "make the box dark blue"<br/>
              "lid should be gold"<br/>
              "rotate left / right"<br/>
              "zoom in / zoom out"<br/>
              "reset the view"<br/>
              "spin around"<br/>
              "stop"<br/>
              "apply ocean theme"<br/>
              "set text to Happy Eid"<br/>
              "throw confetti"<br/>
              "gravity" — drop &amp; bounce<br/>
              "vertices" — show edges<br/>
              "split" / "unsplit"<br/>
            </div>
          </div>
        </div>
      )}

      {/* No speech API support (very rare) */}
      {noSpeechSupport && (
        <div style={{
          position:"absolute",bottom:"14%",left:"50%",transform:"translateX(-50%)",
          background:"rgba(80,40,0,0.92)",color:"#fff",padding:"12px 22px",
          borderRadius:"12px",fontSize:"13px",fontFamily:"monospace",
          border:"1px solid rgba(255,200,0,0.5)",textAlign:"center",
        }}>
          ⚠️ Use Chrome or Edge for voice features
        </div>
      )}
      {/* API key missing warning */}
      {apiKeyMissing && (
        <div style={{
          position:"absolute",bottom:"14%",left:"50%",transform:"translateX(-50%)",
          background:"rgba(120,60,0,0.92)",color:"#fff",padding:"12px 22px",
          borderRadius:"12px",fontSize:"13px",fontFamily:"monospace",
          border:"1px solid rgba(255,200,0,0.5)",
          textAlign:"center",maxWidth:"380px",lineHeight:"1.6",
        }}>
          ⚠️ <strong>Gemini API key missing</strong><br/>
          Add <code style={{background:"rgba(255,255,255,0.15)",padding:"2px 6px",borderRadius:"4px"}}>VITE_GROQ_API_KEY=your_key</code><br/>
          to your <strong>.env</strong> file and restart the dev server.<br/>
          Get a free key at <strong>console.groq.com → API Keys</strong>
        </div>
      )}

      <style>{`
        @keyframes floatHint{0%,100%{opacity:.75;transform:translateX(-50%) translateY(0)}50%{opacity:1;transform:translateX(-50%) translateY(-5px)}}
        @keyframes micPulse{0%,100%{box-shadow:0 0 0 6px rgba(255,50,50,0.25),0 0 20px rgba(255,0,0,0.4)}50%{box-shadow:0 0 0 14px rgba(255,50,50,0.1),0 0 36px rgba(255,0,0,0.6)}}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:rgba(255,215,0,0.3);border-radius:2px}
      `}</style>
    </div>
  );
}
