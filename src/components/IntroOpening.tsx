import React, { useEffect, useState, useRef } from 'react';
import { Sparkles, ArrowRight, Volume2, VolumeX, Film, Upload } from 'lucide-react';

interface IntroOpeningProps {
  onComplete: () => void;
  appName?: string;
  subTitle?: string;
  logoUrl?: string;
  videoSrc?: string;
}

export const IntroOpening: React.FC<IntroOpeningProps> = ({
  onComplete,
  appName = 'SIM SALAF AL-MALIKI',
  subTitle = 'PONDOK PESANTREN SALAF AL-MALIKI',
  logoUrl,
  videoSrc = 'Camera_moving_through_Islamic_li…_20260925184519.mp4'
}) => {
  const [stage, setStage] = useState<number>(0);
  const [fadingOut, setFadingOut] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [videoLoaded, setVideoLoaded] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<boolean>(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>(() => {
    return videoSrc || 
           localStorage.getItem('sim_intro_video') || 
           'Camera_moving_through_Islamic_li…_20260925184519.mp4';
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Sync video URL whenever videoSrc prop changes (e.g. from Option Panel)
  useEffect(() => {
    if (videoSrc) {
      setCurrentVideoUrl(videoSrc);
      if (videoRef.current) {
        videoRef.current.src = videoSrc;
        videoRef.current.load();
        videoRef.current.play().catch(console.warn);
      }
    }
  }, [videoSrc]);

  // Play ambient Islamic soundscape using Web Audio API when unmuted
  const playAmbientIslamicAudio = () => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Harmonic drone in D (Re / Bayati / Hijaz mood: D3, A3, D4, F4)
      const freqs = [146.83, 220.00, 293.66, 349.23];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        // Soft volume envelope
        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.04 / (idx + 1), ctx.currentTime + 1.5);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 7.0);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 7.5);
      });
    } catch {
      // Audio autoplay policy fallback
    }
  };

  useEffect(() => {
    // Attempt to play video
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        if (videoRef.current) {
          videoRef.current.muted = true;
          videoRef.current.play().catch(() => {
            setVideoError(true);
          });
        }
      });
    }

    // Sequence stages of the cinematic reveal
    const t1 = setTimeout(() => setStage(1), 400);
    const t2 = setTimeout(() => setStage(2), 1400);
    const t3 = setTimeout(() => setStage(3), 2600);
    const t4 = setTimeout(() => setStage(4), 3800);

    // Auto complete after 8.5 seconds if user doesn't skip
    const tEnd = setTimeout(() => {
      handleComplete();
    }, 8500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(tEnd);
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const handleComplete = () => {
    setFadingOut(true);
    setTimeout(onComplete, 600);
  };

  const handleCustomVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCurrentVideoUrl(url);
      setVideoLoaded(true);
      setVideoError(false);
      localStorage.setItem('sim_intro_video_name', file.name);
      if (videoRef.current) {
        videoRef.current.src = url;
        videoRef.current.play().catch(console.warn);
      }
    }
  };

  const handleToggleSound = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
    if (!nextMuted) {
      playAmbientIslamicAudio();
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#010905] text-white select-none transition-opacity duration-700 ease-out overflow-hidden ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* TOP LEFT: Active Video Filename Indicator */}
      <div className="absolute top-5 left-5 sm:top-6 sm:left-8 z-30 hidden sm:flex items-center gap-2">
        <div className="px-3.5 py-1.5 rounded-full bg-black/60 border border-[#d4af37]/40 backdrop-blur-md flex items-center gap-2 text-xs text-[#faebaa] shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <Film className="w-3.5 h-3.5 text-[#d4af37]" />
          <span className="font-mono text-[11px] truncate max-w-[280px]">
            {localStorage.getItem('sim_intro_video_name') || 'Camera_moving_through_Islamic_li…_20260925184519.mp4'}
          </span>
        </div>
      </div>

      {/* 1. CINEMATIC VIDEO BACKGROUND (CAMERA MOVING THROUGH ISLAMIC LIBRARY - JERNIH & BEBAS BAYANGAN HIJAU) */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-black">
        {/* High-res 8K Ancient Islamic Library Camera Gliding Visualizer (Active as fallback when video is loading) */}
        {(!videoLoaded || videoError) && (
          <img
            src="/assets/islamic_library_cinematic.jpg"
            alt="Islamic Library Grand Hall"
            className="absolute inset-0 w-full h-full object-cover animate-cameraGlide"
          />
        )}

        {/* Real MP4 Video Player - Jernih, Tajam, 100% Asli Tanpa Bayangan Hijau atau Filter Redup */}
        <video
          ref={videoRef}
          src={currentVideoUrl}
          autoPlay
          muted={isMuted}
          playsInline
          loop
          onLoadedData={() => {
            setVideoLoaded(true);
            setVideoError(false);
          }}
          onError={() => setVideoError(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 z-10 ${
            videoLoaded && !videoError ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <source src={currentVideoUrl} type="video/mp4" />
          <source src="Camera_moving_through_Islamic_li…_20260925184519.mp4" type="video/mp4" />
          <source src="Camera_moving_through_Islamic_library_20260925184519.mp4" type="video/mp4" />
          <source src="Camera_moving_through_Islamic_li…_20260925182907.mp4" type="video/mp4" />
          <source src="/assets/Camera_moving_through_Islamic_li…_20260925184519.mp4" type="video/mp4" />
          <source src="/assets/intro.mp4" type="video/mp4" />
        </video>
      </div>

      {/* 2. TOP ACTION BUTTONS: Sound Toggle, Custom Video, Skip */}
      <div className="absolute top-5 right-5 sm:top-6 sm:right-8 z-30 flex items-center gap-2.5">
        {/* Toggle Audio */}
        <button
          type="button"
          onClick={handleToggleSound}
          className="px-3 py-2 rounded-xl bg-black/60 hover:bg-black/80 border border-[#d4af37]/40 text-[#f7e59f] text-xs font-bold flex items-center gap-1.5 backdrop-blur-md transition shadow-lg"
          title={isMuted ? 'Nyalakan Suara (Harmoni Ney & Kitab Salaf)' : 'Bisukan Suara'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-emerald-400" /> : <Volume2 className="w-4 h-4 text-[#d4af37]" />}
          <span className="hidden sm:inline text-[11px] font-mono">{isMuted ? 'Muted' : 'Sound On'}</span>
        </button>

        {/* Custom Video Picker (Optional File Uploader for Intro) */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-2 rounded-xl bg-black/60 hover:bg-black/80 border border-[#d4af37]/40 text-[#f7e59f] text-xs font-bold flex items-center gap-1.5 backdrop-blur-md transition shadow-lg"
          title="Pilih Berkas Video Camera_moving_through_Islamic_li…_20260925184519.mp4"
        >
          <Film className="w-4 h-4 text-[#d4af37]" />
          <span className="hidden md:inline text-[11px]">Pilih Video</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm"
          className="hidden"
          onChange={handleCustomVideoUpload}
        />

        {/* Skip Button */}
        <button
          type="button"
          onClick={handleComplete}
          className="btn-3d-gold text-black text-xs font-black uppercase tracking-wider px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xl hover:scale-105 active:scale-95 transition"
        >
          <span>LEWATI</span>
          <ArrowRight className="w-4 h-4 text-black stroke-[3]" />
        </button>
      </div>

      {/* Pure Cinematic Video Experience - No Logos, No Overlay Texts */}
    </div>
  );
};
