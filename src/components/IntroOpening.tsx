import React, { useEffect, useState, useRef } from 'react';
import { Volume2, VolumeX, ArrowRight, LogIn } from 'lucide-react';

interface IntroOpeningProps {
  onComplete: () => void;
  videoSrc?: string;
  appName?: string;
}

export const IntroOpening: React.FC<IntroOpeningProps> = ({
  onComplete,
  videoSrc = '/assets/intro_salaf_almaliki.mp4'
}) => {
  const fallbackSrc = '/assets/intro_salaf_almaliki.mp4';
  const cleanInitialSrc = (videoSrc && videoSrc.trim()) || fallbackSrc;
  const [fadingOut, setFadingOut] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [activeSrc, setActiveSrc] = useState<string>(cleanInitialSrc);

  const videoRef = useRef<HTMLVideoElement>(null);
  const prevXRef = useRef<number | null>(null);
  const targetTimeRef = useRef<number>(0);
  const isSeekingRef = useRef<boolean>(false);
  const hasCompletedRef = useRef<boolean>(false);

  // Sync active source whenever videoSrc prop changes
  useEffect(() => {
    const next = (videoSrc && videoSrc.trim()) || fallbackSrc;
    setActiveSrc(next);
    hasCompletedRef.current = false;
  }, [videoSrc]);

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const triggerComplete = () => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    setFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 400);
  };

  // Video Autoplay, Video Ended Auto-Advance & Error Handling
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.src = activeSrc;
    video.muted = isMuted;

    const attemptPlay = () => {
      video.play().catch(() => {
        // Mobile policy fallback: require initial muted autoplay
        video.muted = true;
        setIsMuted(true);
        video.play().catch(() => {});
      });
    };

    const handleLoadedMetadata = () => {
      targetTimeRef.current = 0;
      attemptPlay();
    };

    // Auto navigate to login when video finishes playing
    const handleEnded = () => {
      triggerComplete();
    };

    // Time update check for near-end completion
    const handleTimeUpdate = () => {
      if (video.duration && video.currentTime >= video.duration - 0.15) {
        triggerComplete();
      }
    };

    const handleError = () => {
      if (activeSrc !== '/assets/intro_salaf_almaliki.mp4') {
        setActiveSrc('/assets/intro_salaf_almaliki.mp4');
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('error', handleError);

    if (video.readyState >= 1) {
      handleLoadedMetadata();
    }

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('error', handleError);
    };
  }, [activeSrc]);

  // Mouse & Touch Scrubbing Functionality
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const SENSITIVITY = 0.85;

    const performSeek = () => {
      if (!video || !video.duration || Number.isNaN(video.duration)) return;
      if (isSeekingRef.current) return;

      const duration = video.duration;
      const target = Math.max(0, Math.min(duration, targetTimeRef.current));

      if (Math.abs(video.currentTime - target) > 0.005) {
        isSeekingRef.current = true;
        video.currentTime = target;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!video || !video.duration || Number.isNaN(video.duration)) return;

      if (prevXRef.current === null) {
        prevXRef.current = e.clientX;
        return;
      }

      const delta = e.clientX - prevXRef.current;
      prevXRef.current = e.clientX;

      const duration = video.duration;
      const timeOffset = (delta / window.innerWidth) * SENSITIVITY * duration;
      targetTimeRef.current = Math.max(0, Math.min(duration, (targetTimeRef.current || video.currentTime) + timeOffset));

      performSeek();
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!video || !video.duration || Number.isNaN(video.duration) || e.touches.length === 0) return;

      const touchX = e.touches[0].clientX;
      if (prevXRef.current === null) {
        prevXRef.current = touchX;
        return;
      }

      const delta = touchX - prevXRef.current;
      prevXRef.current = touchX;

      const duration = video.duration;
      const timeOffset = (delta / window.innerWidth) * SENSITIVITY * duration;
      targetTimeRef.current = Math.max(0, Math.min(duration, (targetTimeRef.current || video.currentTime) + timeOffset));

      performSeek();
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        prevXRef.current = e.touches[0].clientX;
      }
    };

    const handleEnd = () => {
      prevXRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleEnd);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleEnd);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, []);

  const handleSeeked = () => {
    isSeekingRef.current = false;
    const video = videoRef.current;
    if (!video || !video.duration || Number.isNaN(video.duration)) return;

    const duration = video.duration;
    const target = Math.max(0, Math.min(duration, targetTimeRef.current));

    if (Math.abs(video.currentTime - target) > 0.005) {
      isSeekingRef.current = true;
      video.currentTime = target;
    }
  };

  const toggleSound = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const video = videoRef.current;
    if (video) {
      const nextMuted = !video.muted;
      video.muted = nextMuted;
      setIsMuted(nextMuted);
      if (!nextMuted) {
        video.play().catch(() => {});
      }
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[99999] w-screen h-[100dvh] min-h-screen overflow-hidden select-none bg-[#03150d] transition-opacity duration-500 ease-in-out ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      data-testid="salaf-almaliki-intro-screen"
    >
      {/* Fullscreen Video Background scaled across Desktop & Mobile (HP) */}
      <video
        ref={videoRef}
        src={activeSrc}
        muted={isMuted}
        playsInline
        autoPlay
        preload="auto"
        onSeeked={handleSeeked}
        className="fixed inset-0 z-0 w-full h-full object-cover pointer-events-none"
        style={{
          objectPosition: 'center center'
        }}
      />

      {/* Subtle bottom gradient for button contrast */}
      <div className="fixed inset-0 z-10 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

      {/* TOP RIGHT FLOATING AUDIO TOGGLE (Minimalist & Discrete) */}
      <div
        className="fixed top-4 right-4 z-20 transition-all duration-700 ease-out"
        style={{
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? 'translateY(0)' : 'translateY(-10px)'
        }}
      >
        <button
          type="button"
          onClick={toggleSound}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border backdrop-blur-md transition-all cursor-pointer shadow-md active:scale-95 ${
            isMuted
              ? 'bg-black/50 border-amber-400/50 text-amber-200 hover:bg-black/70'
              : 'bg-emerald-950/70 border-emerald-400/80 text-emerald-200 hover:bg-emerald-900/80'
          }`}
          title={isMuted ? 'Aktifkan Suara' : 'Matikan Suara'}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-amber-300" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-300" />}
          <span className="text-[11px]">{isMuted ? 'Suara Mati' : 'Suara Aktif'}</span>
        </button>
      </div>

      {/* BOTTOM ACTION BUTTON: "MASUK" (Simple, Compact & Sleek) */}
      <div className="fixed bottom-6 sm:bottom-10 left-0 right-0 z-20 w-full px-4 flex justify-center items-center">
        <div 
          className="transition-all duration-700 ease-out flex justify-center"
          style={{
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? 'translateY(0)' : 'translateY(15px)'
          }}
        >
          <button
            type="button"
            onClick={triggerComplete}
            className="group inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 rounded-full font-bold text-sm sm:text-base tracking-wider uppercase text-black bg-gradient-to-r from-[#ffeaa7] via-[#d4af37] to-[#ffeaa7] border border-[#fff3b0] shadow-[0_4px_20px_rgba(212,175,55,0.6)] hover:shadow-[0_6px_25px_rgba(255,234,167,0.85)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            data-testid="btn-masuk-login"
          >
            <LogIn className="w-4 h-4 stroke-[2.5]" />
            <span className="font-extrabold tracking-widest">MASUK</span>
            <ArrowRight className="w-4 h-4 stroke-[3] group-hover:translate-x-1 transition-transform duration-200" />
          </button>
        </div>
      </div>
    </div>
  );
};
