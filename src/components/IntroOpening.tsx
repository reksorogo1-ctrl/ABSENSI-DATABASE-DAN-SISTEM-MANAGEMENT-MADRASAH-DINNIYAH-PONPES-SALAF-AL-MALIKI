import React, { useEffect, useState, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { resolveActiveVideo, type VideoInfo } from '../lib/videoStorage';

interface IntroOpeningProps {
  onComplete: () => void;
  appName?: string;
  subTitle?: string;
  logoUrl?: string;
  videoSrc?: string;
  optionPassword?: string;
  onVideoChange?: (newUrl: string, newName?: string) => void;
  onOpenOptionPanelVideo?: () => void;
}

export const IntroOpening: React.FC<IntroOpeningProps> = ({
  onComplete,
  videoSrc,
}) => {
  const [fadingOut, setFadingOut] = useState<boolean>(false);
  const [videoLoaded, setVideoLoaded] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<boolean>(false);
  const [activeVideo, setActiveVideo] = useState<VideoInfo>({
    src: videoSrc || '/assets/intro_salaf_almaliki.mp4',
    name: 'The Journey of Knowledge — Salaf Al-Maliki',
    isCustom: false,
    sourceType: 'default',
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const autoSkipTimerRef = useRef<number | null>(null);

  // Initialize and load active video
  useEffect(() => {
    let isMounted = true;
    async function loadVideo() {
      const defaultUrl = videoSrc || '/assets/intro_salaf_almaliki.mp4';
      const resolved = await resolveActiveVideo(defaultUrl);
      if (isMounted) {
        setActiveVideo(resolved);
      }
    }
    loadVideo();
    return () => {
      isMounted = false;
    };
  }, [videoSrc]);

  // Sync video element when activeVideo changes
  useEffect(() => {
    if (videoRef.current && activeVideo.src) {
      videoRef.current.src = activeVideo.src;
      videoRef.current.load();
      videoRef.current.play().catch(() => {
        if (videoRef.current) {
          videoRef.current.muted = true;
          videoRef.current.play().catch(() => setVideoError(true));
        }
      });
    }
  }, [activeVideo.src]);

  // Silky-smooth cross-fade transition into the login dashboard
  const handleComplete = () => {
    if (fadingOut) return;
    setFadingOut(true);
    // Smooth 1000ms cross-dissolve
    setTimeout(() => {
      onComplete();
    }, 1000);
  };

  // Fallback safety timer if video metadata or playback is delayed
  useEffect(() => {
    autoSkipTimerRef.current = window.setTimeout(() => {
      handleComplete();
    }, 12500);

    return () => {
      if (autoSkipTimerRef.current) {
        window.clearTimeout(autoSkipTimerRef.current);
      }
    };
  }, []);

  return (
    <div
      onClick={handleComplete}
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-end bg-[#010905] text-white select-none transition-all duration-1000 ease-in-out overflow-hidden cursor-pointer ${
        fadingOut ? 'opacity-0 scale-102 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      data-testid="intro-opening-screen"
    >
      {/* 1. CINEMATIC VIDEO BACKGROUND */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-black pointer-events-none">
        {/* High-res Islamic Library Background Fallback */}
        {(!videoLoaded || videoError) && (
          <img
            src="/assets/islamic_library_cinematic.jpg"
            alt="Islamic Library Grand Hall"
            className="absolute inset-0 w-full h-full object-cover animate-cameraGlide scale-105"
          />
        )}

        {/* Real MP4 Video Player (NO loop, smooth auto-transition on completion) */}
        <video
          ref={videoRef}
          src={activeVideo.src}
          autoPlay
          muted
          playsInline
          onLoadedMetadata={(e) => {
            const duration = e.currentTarget.duration;
            if (duration && isFinite(duration) && duration > 0) {
              if (autoSkipTimerRef.current) {
                window.clearTimeout(autoSkipTimerRef.current);
              }
              // Set timer to trigger slightly before actual end for seamless cross-dissolve
              autoSkipTimerRef.current = window.setTimeout(() => {
                handleComplete();
              }, Math.max(1000, (duration - 0.7) * 1000));
            }
          }}
          onLoadedData={() => {
            setVideoLoaded(true);
            setVideoError(false);
          }}
          onTimeUpdate={(e) => {
            const v = e.currentTarget;
            // Ketika video tersisa 0.8 detik, mulai transisi halus ke dashboard login
            if (v.duration && v.currentTime >= v.duration - 0.8 && !fadingOut) {
              handleComplete();
            }
          }}
          onError={() => {
            console.warn('Video load error on:', activeVideo.src);
            setVideoError(true);
          }}
          onEnded={handleComplete}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 z-10 ${
            videoLoaded && !videoError ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <source src={activeVideo.src} type="video/mp4" />
          <source src="/assets/intro_salaf_almaliki.mp4" type="video/mp4" />
        </video>

        {/* Soft Bottom Vignette for the Enter Button */}
        <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-t from-black/85 via-transparent to-transparent" />
      </div>

      {/* 2. BOTTOM ENTER BUTTON */}
      <div 
        className="relative z-30 flex flex-col items-center text-center px-6 mb-10 sm:mb-14"
        onClick={(e) => {
          e.stopPropagation();
          handleComplete();
        }}
      >
        <button
          type="button"
          onClick={handleComplete}
          className="group px-8 py-3.5 rounded-full bg-black/65 hover:bg-[#d4af37] border-2 border-[#d4af37]/70 hover:border-[#faebaa] text-[#faebaa] hover:text-black font-extrabold text-xs sm:text-sm tracking-widest uppercase transition-all duration-300 flex items-center gap-3 backdrop-blur-md shadow-[0_10px_35px_rgba(0,0,0,0.85)] hover:shadow-[0_0_25px_rgba(212,175,55,0.6)] active:scale-95 hover:scale-105"
          data-testid="enter-system-btn"
        >
          <span>MASUK KE SISTEM</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
