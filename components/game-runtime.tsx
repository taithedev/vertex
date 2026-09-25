"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export function GameRuntime({ config }: { config: Record<string, unknown> }) {
  const canvasRef = useRef<HTMLCanvasElement|null>(null);
  const [fps,setFps]=useState(60);
  const world=typeof config.world==="string"?config.world:"starter";

  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return;
    const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:"high-performance"});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));renderer.setSize(canvas.clientWidth,canvas.clientHeight,false);renderer.outputColorSpace=THREE.SRGBColorSpace;
    const scene=new THREE.Scene();scene.background=new THREE.Color(0x06050a);scene.fog=new THREE.Fog(0x06050a,18,70);
    const camera=new THREE.PerspectiveCamera(62,1,.1,150);camera.position.set(0,5,12);camera.lookAt(0,1,0);
    scene.add(new THREE.HemisphereLight(0xd8b4fe,0x0d0b16,2.4));
    const key=new THREE.DirectionalLight(0xffffff,2.2);key.position.set(6,12,8);scene.add(key);
    const ground=new THREE.Mesh(new THREE.PlaneGeometry(60,60),new THREE.MeshStandardMaterial({color:0x13101b,roughness:.8,metalness:.05}));ground.rotation.x=-Math.PI/2;scene.add(ground);
    const grid=new THREE.GridHelper(60,60,0x4c2c66,0x21162d);grid.position.y=.01;scene.add(grid);
    const material=new THREE.MeshStandardMaterial({color:0xa855f7,emissive:0x3b0764,emissiveIntensity:.3});
    for(let x=-3;x<=3;x+=2){const block=new THREE.Mesh(new THREE.BoxGeometry(1.5,1.5,1.5),material);block.position.set(x,.75,-4);scene.add(block)}
    const ring=new THREE.Mesh(new THREE.TorusGeometry(3,.035,12,80),new THREE.MeshBasicMaterial({color:0xc084fc,transparent:true,opacity:.7}));ring.rotation.x=Math.PI/2;ring.position.y=.04;scene.add(ring);
    let frame=0,last=performance.now(),raf=0;
    const resize=()=>{const w=canvas.clientWidth,h=canvas.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/Math.max(h,1);camera.updateProjectionMatrix()};
    const observer=new ResizeObserver(resize);observer.observe(canvas);
    const tick=(t:number)=>{const dt=Math.min((t-last)/1000,.05);last=t;frame++;ring.rotation.z+=dt*.3;scene.rotation.y=Math.sin(t/7000)*.05;renderer.render(scene,camera);if(frame%30===0)setFps(Math.round(1/Math.max(dt,.001)));raf=requestAnimationFrame(tick)};
    resize();raf=requestAnimationFrame(tick);
    return()=>{cancelAnimationFrame(raf);observer.disconnect();renderer.dispose();scene.clear()};
  },[]);

  return <div className="runtime-wrap">
    <canvas ref={canvasRef} className="runtime-canvas" aria-label="Vertex browser game runtime"/>
    <div className="runtime-hud">
      <div className="hud-card"><strong>Vertex Runtime</strong><div className="meta">{world} · Three.js WebGL scene</div></div>
      <div className="hud-card"><span>FPS {fps}</span><span style={{marginLeft:12}}>Network n/a</span></div>
    </div>
  </div>;
}
