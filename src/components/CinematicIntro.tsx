import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowRight, ChevronDown, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { createAmbient, type AmbientHandle } from '../lib/ambientAudio';

interface CinematicIntroProps {
  onComplete: () => void;
  appName?: string;
  subTitle?: string;
  logoUrl?: string;
  bgImage?: string;
}

// A REAL interactive, scroll-scrubbed 3D cinematic opening built on Three.js / WebGL.
// The user's scroll controls a cinematic timeline (camera dolly + light + dust).
// Scroll down -> scene progresses forward; scroll up -> reverses; stop -> holds position.
export const CinematicIntro: React.FC<CinematicIntroProps> = ({
  onComplete,
  bgImage = '/assets/islamic_library_cinematic.jpg',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const targetProgress = useRef<number>(0);
  const progressRef = useRef<number>(0);
  const mouse = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [webglFailed, setWebglFailed] = useState<boolean>(false);
  const [progressUI, setProgressUI] = useState<number>(0);
  const [leaving, setLeaving] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(false);
  const ambientRef = useRef<AmbientHandle | null>(null);

  const handleEnter = () => {
    ambientRef.current?.fadeOut(0.6);
    setLeaving(true);
    window.setTimeout(onComplete, 750);
  };

  const toggleMute = () => {
    setMuted((m) => {
      const next = !m;
      ambientRef.current?.ensureStarted();
      ambientRef.current?.setMuted(next);
      return next;
    });
  };

  // Soft ambient harmony that fades in as the intro begins (starts on first gesture
  // to satisfy browser autoplay policies) and fades out on the way to login.
  useEffect(() => {
    const amb = createAmbient(0.055);
    ambientRef.current = amb;
    amb.ensureStarted();
    const kick = () => amb.ensureStarted();
    const opts: AddEventListenerOptions = { once: true };
    window.addEventListener('pointerdown', kick, opts);
    window.addEventListener('wheel', kick, opts);
    window.addEventListener('touchstart', kick, opts);
    window.addEventListener('keydown', kick, opts);
    return () => {
      window.removeEventListener('pointerdown', kick);
      window.removeEventListener('wheel', kick);
      window.removeEventListener('touchstart', kick);
      window.removeEventListener('keydown', kick);
      amb.dispose();
    };
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (e) {
      setWebglFailed(true);
      return;
    }

    const isMobile = window.innerWidth < 768;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x02120a, 1);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x02120a, 0.045);

    const camera = new THREE.PerspectiveCamera(58, width / height, 0.1, 100);
    camera.position.set(0, 0.35, 6);

    // ---- Backdrop: the premium library image as a textured plane (depth push-in) ----
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';
    const bgGeo = new THREE.PlaneGeometry(24, 13.5, 1, 1);
    const bgMat = new THREE.MeshBasicMaterial({ color: 0x2a2a2a });
    const bgPlane = new THREE.Mesh(bgGeo, bgMat);
    bgPlane.position.set(0, 0, -8);
    scene.add(bgPlane);

    loader.load(
      bgImage,
      (tex) => {
        // @ts-ignore - colorSpace exists in three 0.169
        tex.colorSpace = THREE.SRGBColorSpace;
        bgMat.map = tex;
        bgMat.color.set(0xffffff);
        bgMat.needsUpdate = true;
      },
      undefined,
      () => { /* keep flat color if image fails */ }
    );

    // A darkening vignette plane just in front of the backdrop for depth-of-field haze
    const hazeCanvas = document.createElement('canvas');
    hazeCanvas.width = 512; hazeCanvas.height = 288;
    const hctx = hazeCanvas.getContext('2d')!;
    const hgrad = hctx.createRadialGradient(256, 144, 60, 256, 144, 300);
    hgrad.addColorStop(0, 'rgba(2,18,10,0)');
    hgrad.addColorStop(0.7, 'rgba(1,12,7,0.35)');
    hgrad.addColorStop(1, 'rgba(0,6,3,0.92)');
    hctx.fillStyle = hgrad;
    hctx.fillRect(0, 0, 512, 288);
    const hazeTex = new THREE.CanvasTexture(hazeCanvas);
    const hazeMat = new THREE.MeshBasicMaterial({ map: hazeTex, transparent: true, depthWrite: false });
    const hazePlane = new THREE.Mesh(new THREE.PlaneGeometry(26, 15), hazeMat);
    hazePlane.position.set(0, 0, -6.5);
    scene.add(hazePlane);

    // ---- Volumetric golden light shafts (additive) ----
    const shaftCanvas = document.createElement('canvas');
    shaftCanvas.width = 128; shaftCanvas.height = 512;
    const sctx = shaftCanvas.getContext('2d')!;
    const sgrad = sctx.createLinearGradient(0, 0, 0, 512);
    sgrad.addColorStop(0, 'rgba(255,225,150,0.55)');
    sgrad.addColorStop(0.5, 'rgba(230,190,110,0.18)');
    sgrad.addColorStop(1, 'rgba(230,190,110,0)');
    sctx.fillStyle = sgrad;
    sctx.fillRect(0, 0, 128, 512);
    const shaftTex = new THREE.CanvasTexture(shaftCanvas);
    const shaftMat = new THREE.MeshBasicMaterial({
      map: shaftTex, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    const shafts: THREE.Mesh[] = [];
    for (let i = 0; i < 4; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 9), shaftMat.clone());
      m.position.set(-4.5 + i * 3, 2.4, -5 + (i % 2) * 0.6);
      m.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.22;
      (m.material as THREE.MeshBasicMaterial).opacity = 0.28 + (i % 2) * 0.14;
      scene.add(m);
      shafts.push(m);
    }

    // ---- Floating dust / particle system (living atmosphere) ----
    const dustCanvas = document.createElement('canvas');
    dustCanvas.width = 64; dustCanvas.height = 64;
    const dctx = dustCanvas.getContext('2d')!;
    const dgrad = dctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    dgrad.addColorStop(0, 'rgba(255,240,200,1)');
    dgrad.addColorStop(0.4, 'rgba(245,215,140,0.6)');
    dgrad.addColorStop(1, 'rgba(245,215,140,0)');
    dctx.fillStyle = dgrad;
    dctx.beginPath(); dctx.arc(32, 32, 32, 0, Math.PI * 2); dctx.fill();
    const dustTex = new THREE.CanvasTexture(dustCanvas);

    const dustCount = isMobile ? 500 : 1300;
    const positions = new Float32Array(dustCount * 3);
    const speeds = new Float32Array(dustCount);
    for (let i = 0; i < dustCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 11;
      positions[i * 3 + 2] = -6 + Math.random() * 10;
      speeds[i] = 0.002 + Math.random() * 0.006;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const dustMat = new THREE.PointsMaterial({
      size: isMobile ? 0.08 : 0.06, map: dustTex, transparent: true, opacity: 0.85,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    });
    const dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);

    // ---- Interaction: scroll scrubbing (wheel + touch) ----
    const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetProgress.current = clamp01(targetProgress.current + e.deltaY * 0.00075);
    };
    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => { touchY = e.touches[0].clientY; };
    const onTouchMove = (e: TouchEvent) => {
      const dy = touchY - e.touches[0].clientY;
      touchY = e.touches[0].clientY;
      targetProgress.current = clamp01(targetProgress.current + dy * 0.0016);
    };
    const onMouseMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const onResize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    mount.addEventListener('wheel', onWheel, { passive: false });
    mount.addEventListener('touchstart', onTouchStart, { passive: true });
    mount.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('resize', onResize);

    // ---- Render loop ----
    const clock = new THREE.Clock();
    let raf = 0;
    let frame = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Smoothly approach the scroll target (scrubbed timeline)
      progressRef.current += (targetProgress.current - progressRef.current) * 0.06;
      const p = progressRef.current;

      // Camera dolly forward through the hall + cinematic sway ("living")
      const targetZ = 6 - p * 4.6;
      const targetY = 0.35 + p * 0.25 + Math.sin(t * 0.5) * 0.05;
      const targetX = mouse.current.x * 0.6 + Math.sin(t * 0.35) * 0.08;
      camera.position.z += (targetZ - camera.position.z) * 0.08;
      camera.position.y += (targetY - camera.position.y) * 0.06;
      camera.position.x += (targetX - camera.position.x) * 0.05;
      camera.lookAt(mouse.current.x * 0.25, 0.1 + mouse.current.y * -0.15, -8);

      bgPlane.scale.setScalar(1 + p * 0.08);

      // Dust drift + gentle rotation
      const pos = dustGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < dustCount; i++) {
        let y = pos.getY(i) + speeds[i];
        if (y > 5.6) y = -5.6;
        pos.setY(i, y);
        pos.setX(i, pos.getX(i) + Math.sin(t * 0.3 + i) * 0.0009);
      }
      pos.needsUpdate = true;
      dust.rotation.y = t * 0.01;

      // Light shafts breathe + intensify as we enter
      shafts.forEach((s, i) => {
        const mat = s.material as THREE.MeshBasicMaterial;
        mat.opacity = (0.22 + (i % 2) * 0.12) * (0.7 + Math.sin(t * 0.7 + i) * 0.3) + p * 0.18;
      });

      renderer.render(scene, camera);

      frame++;
      if (frame % 6 === 0) setProgressUI(Math.round(p * 100));
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      mount.removeEventListener('wheel', onWheel);
      mount.removeEventListener('touchstart', onTouchStart);
      mount.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      dustGeo.dispose();
      dustMat.dispose();
      bgGeo.dispose();
      bgMat.dispose();
      hazeMat.dispose();
      shafts.forEach((s) => (s.material as THREE.Material).dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, [bgImage]);

  return (
    <div
      className={`fixed inset-0 z-[99999] overflow-hidden bg-[#02120a] select-none transition-all duration-700 ease-out ${
        leaving ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* WebGL canvas mount */}
      {!webglFailed ? (
        <div ref={mountRef} className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing" />
      ) : (
        <img src={bgImage} alt="Islamic Library" className="absolute inset-0 w-full h-full object-cover animate-cameraGlide z-0" />
      )}

      {/* Cinematic vignette + film grain overlay */}
      <div className="absolute inset-0 z-[1] pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 35%, rgba(1,10,6,0.5) 75%, rgba(0,5,3,0.9) 100%)',
      }} />
      <div className="absolute inset-0 z-[1] pointer-events-none opacity-[0.06] mix-blend-overlay" style={{
        backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22120%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%222%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")',
      }} />

      {/* MUTE / UNMUTE ambient harmony */}
      <button
        type="button"
        onClick={toggleMute}
        data-testid="intro-mute-btn"
        aria-label={muted ? 'Nyalakan suara' : 'Bisukan suara'}
        className="absolute top-5 right-5 z-20 w-11 h-11 rounded-full flex items-center justify-center text-[#faebaa] backdrop-blur-md border border-[#d4af37]/45 bg-black/30 hover:bg-black/50 transition-colors shadow-[0_6px_20px_rgba(0,0,0,0.6)]"
      >
        {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>

      {/* BOTTOM: scroll hint icon only (hides after progress) */}
      <div
        className="absolute bottom-28 sm:bottom-32 inset-x-0 z-10 flex flex-col items-center transition-opacity duration-500 pointer-events-none"
        style={{ opacity: Math.max(0, 1 - progressUI / 18) }}
      >
        <ChevronDown className="w-6 h-6 text-[#d4af37] animate-bounce" />
      </div>

      {/* GET STARTED — premium glass/metallic button, always visible */}
      <div className="absolute bottom-10 sm:bottom-14 inset-x-0 z-20 flex flex-col items-center gap-4 px-6">
        <button
          type="button"
          onClick={handleEnter}
          data-testid="get-started-btn"
          className="group relative px-10 sm:px-14 py-4 sm:py-4.5 rounded-full font-black uppercase tracking-[0.22em] text-sm sm:text-base text-[#14100a] overflow-hidden transition-transform duration-300 hover:-translate-y-1 active:translate-y-0.5"
          style={{
            background: 'linear-gradient(180deg,#fff2be 0%,#e7c65a 42%,#c79a24 100%)',
            border: '1px solid rgba(255,244,205,0.9)',
            boxShadow: '0 18px 45px -10px rgba(0,0,0,0.85), 0 0 40px rgba(212,175,55,0.35), inset 0 2px 2px rgba(255,255,255,0.85), inset 0 -4px 6px rgba(120,85,10,0.6)',
          }}
        >
          <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.7) 0%, transparent 60%)' }} />
          <span className="relative flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            GET STARTED
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3] group-hover:translate-x-1 transition-transform" />
          </span>
        </button>

        {/* cinematic progress bar */}
        <div className="w-52 sm:w-72 h-1 rounded-full bg-white/10 overflow-hidden backdrop-blur-sm">
          <div className="h-full rounded-full bg-gradient-to-r from-[#d4af37] via-[#faebaa] to-emerald-400 transition-all duration-200" style={{ width: `${progressUI}%` }} />
        </div>
      </div>
    </div>
  );
};
