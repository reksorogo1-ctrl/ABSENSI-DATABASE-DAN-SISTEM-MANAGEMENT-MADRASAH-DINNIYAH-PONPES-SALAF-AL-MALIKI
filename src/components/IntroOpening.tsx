import React, { useEffect, useState, useRef } from 'react';
import {
  Sparkles, ArrowRight, Volume2, VolumeX, Film, Upload, Settings2,
  Check, RotateCcw, Link as LinkIcon, Play, Pause, X, AlertCircle, Info,
  Lock, KeyRound, ShieldCheck, Save, CheckCircle2, ChevronRight
} from 'lucide-react';
import {
  resolveActiveVideo,
  saveVideoFile,
  saveVideoUrl,
  resetVideoToDefault,
  type VideoInfo
} from '../lib/videoStorage';

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
  appName = 'SIM SALAF AL-MALIKI',
  subTitle = 'PONDOK PESANTREN SALAF AL-MALIKI',
  logoUrl,
  videoSrc,
  optionPassword = 'admin123',
  onVideoChange,
  onOpenOptionPanelVideo,
}) => {
  const [fadingOut, setFadingOut] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [videoLoaded, setVideoLoaded] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<boolean>(false);
  const [activeVideo, setActiveVideo] = useState<VideoInfo>({
    src: videoSrc || '/assets/intro_salaf_almaliki.mp4',
    name: 'The Journey of Knowledge — Salaf Al-Maliki',
    isCustom: false,
    sourceType: 'default',
  });

  // Modal State for Video Editor / Switcher
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [configTab, setConfigTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const [urlInput, setUrlInput] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string>('');
  const [isVideoSaved, setIsVideoSaved] = useState<boolean>(true);
  const [autoSkipDuration, setAutoSkipDuration] = useState<number>(() => {
    const saved = localStorage.getItem('sim_intro_duration');
    return saved !== null ? Number(saved) : 10;
  });

  // State: Modal Area Akses Khusus Option Panel
  const [showSpecialAccessModal, setShowSpecialAccessModal] = useState<boolean>(false);
  const [accessPasswordInput, setAccessPasswordInput] = useState<string>('');
  const [accessPasswordError, setAccessPasswordError] = useState<string>('');
  const [accessSuccess, setAccessSuccess] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const autoSkipTimerRef = useRef<number | null>(null);

  // Initialize and load active video
  useEffect(() => {
    let isMounted = true;
    async function loadVideo() {
      const defaultUrl = videoSrc || '/assets/intro_salaf_almaliki.mp4';
      const resolved = await resolveActiveVideo(defaultUrl);
      if (isMounted) {
        setActiveVideo(resolved);
        if (resolved.sourceType === 'url') {
          setUrlInput(resolved.src);
        }
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

  // Ambient Islamic Soundscape
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
        gain.gain.exponentialRampToValueAtTime(0.04 / (idx + 1), ctx.currentTime + 1.2);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 8.5);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 9.0);
      });
    } catch {
      // Audio autoplay policy fallback
    }
  };

  // Auto skip handling
  useEffect(() => {
    if (autoSkipTimerRef.current) {
      window.clearTimeout(autoSkipTimerRef.current);
      autoSkipTimerRef.current = null;
    }

    if (autoSkipDuration > 0 && !showConfigModal && !showSpecialAccessModal) {
      autoSkipTimerRef.current = window.setTimeout(() => {
        handleComplete();
      }, autoSkipDuration * 1000);
    }

    return () => {
      if (autoSkipTimerRef.current) {
        window.clearTimeout(autoSkipTimerRef.current);
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [autoSkipDuration, showConfigModal, showSpecialAccessModal]);

  const handleComplete = () => {
    setFadingOut(true);
    setTimeout(onComplete, 600);
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

  // FITUR SIMPAN VIDEO (MENYIMPAN SECARA PERMANEN KE BASIS DATA & OPTION PANEL)
  const handleConfirmSaveVideo = (videoToSave?: VideoInfo) => {
    const target = videoToSave || activeVideo;
    try {
      // 1. Simpan metadata ke localStorage settings
      const savedSettingsStr = localStorage.getItem('sim_settings');
      let currentSettings = savedSettingsStr ? JSON.parse(savedSettingsStr) : {};
      currentSettings.intro_video_url = target.src;
      currentSettings.intro_video_name = target.name;
      currentSettings.intro_video_type = target.sourceType;
      localStorage.setItem('sim_settings', JSON.stringify(currentSettings));

      // 2. Tandai video aktif di storage
      if (target.sourceType === 'url') {
        saveVideoUrl(target.src, target.name);
      }

      setIsVideoSaved(true);
      setSuccessToast(`Video "${target.name}" berhasil disimpan sebagai intro resmi!`);
      setTimeout(() => setSuccessToast(''), 4500);

      // 3. Callback ke App
      if (onVideoChange) {
        onVideoChange(target.src, target.name);
      }
    } catch (err) {
      console.error('Save video failed:', err);
      setUploadError('Gagal menyimpan konfigurasi video.');
    }
  };

  // Video File Upload Handler (Stores in IndexedDB for permanent persistence)
  const handleFileUpload = async (file: File) => {
    setUploadError('');
    if (!file.type.startsWith('video/')) {
      setUploadError('Berkas harus berupa video (MP4 atau WebM).');
      return;
    }

    try {
      const blobUrl = await saveVideoFile(file, file.name);
      const newInfo: VideoInfo = {
        src: blobUrl,
        name: file.name,
        size: file.size,
        isCustom: true,
        sourceType: 'indexeddb',
        uploadedAt: new Date().toISOString()
      };

      setActiveVideo(newInfo);
      setVideoLoaded(true);
      setVideoError(false);
      setIsVideoSaved(false);

      // Simpan langsung secara otomatis
      handleConfirmSaveVideo(newInfo);
    } catch (err) {
      console.error('Upload video failed:', err);
      setUploadError('Gagal menyimpan video ke media lokal browser.');
    }
  };

  // Video URL Handler
  const handleApplyUrl = () => {
    setUploadError('');
    if (!urlInput.trim()) {
      setUploadError('Silakan masukkan link URL video yang valid.');
      return;
    }

    const cleanUrl = urlInput.trim();
    const urlName = cleanUrl.split('/').pop() || 'Video Online Salaf';
    saveVideoUrl(cleanUrl, urlName);

    const newInfo: VideoInfo = {
      src: cleanUrl,
      name: urlName,
      isCustom: true,
      sourceType: 'url',
      uploadedAt: new Date().toISOString()
    };

    setActiveVideo(newInfo);
    setVideoLoaded(true);
    setVideoError(false);
    setIsVideoSaved(false);

    handleConfirmSaveVideo(newInfo);
  };

  // Reset to Default Video
  const handleResetToDefault = async () => {
    await resetVideoToDefault();
    const defaultUrl = '/assets/intro_salaf_almaliki.mp4';
    const defInfo: VideoInfo = {
      src: defaultUrl,
      name: 'The Journey of Knowledge — Salaf Al-Maliki (Bawaan)',
      isCustom: false,
      sourceType: 'default',
    };
    setActiveVideo(defInfo);
    setUrlInput('');
    setIsVideoSaved(true);
    handleConfirmSaveVideo(defInfo);
  };

  // VERIFIKASI SANDI AREA AKSES KHUSUS OPTION PANEL
  const handleVerifyAccessPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = accessPasswordInput.trim();
    const correctPassword = (optionPassword || 'admin123').trim();

    if (cleanInput === correctPassword) {
      setAccessSuccess(true);
      setAccessPasswordError('');
      localStorage.setItem('sim_option_unlocked', 'true');
      localStorage.setItem('sim_target_control_section', 'video_intro');

      // Tampilkan animasi sukses sejenak lalu buka dashboard option panel
      setTimeout(() => {
        setShowSpecialAccessModal(false);
        setShowConfigModal(false);
        if (onOpenOptionPanelVideo) {
          onOpenOptionPanelVideo();
        } else {
          handleComplete();
        }
      }, 700);
    } else {
      setAccessPasswordError('Kata sandi salah! Pastikan Anda memasukkan sandi Option Panel yang benar.');
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#010905] text-white select-none transition-opacity duration-700 ease-out overflow-hidden ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      data-testid="intro-opening-screen"
    >
      {/* 1. CINEMATIC VIDEO BACKGROUND */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-[#020e07]">
        {/* High-res Islamic Library Background Fallback */}
        {(!videoLoaded || videoError) && (
          <img
            src="/assets/islamic_library_cinematic.jpg"
            alt="Islamic Library Grand Hall"
            className="absolute inset-0 w-full h-full object-cover animate-cameraGlide scale-105"
          />
        )}

        {/* Real MP4 Video Player */}
        <video
          ref={videoRef}
          src={activeVideo.src}
          autoPlay
          muted={isMuted}
          playsInline
          loop
          onLoadedData={() => {
            setVideoLoaded(true);
            setVideoError(false);
          }}
          onError={() => {
            console.warn('Video load error on:', activeVideo.src);
            setVideoError(true);
          }}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 z-10 ${
            videoLoaded && !videoError ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <source src={activeVideo.src} type="video/mp4" />
          <source src="/assets/intro_salaf_almaliki.mp4" type="video/mp4" />
        </video>

        {/* Subtle Luxury Gradient Overlay */}
        <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-t from-black/85 via-black/20 to-black/60" />
      </div>

      {/* TOP LEFT: Active Video Indicator Pill */}
      <div className="absolute top-5 left-5 sm:top-6 sm:left-8 z-30 flex items-center gap-2">
        <div className="px-3.5 py-1.5 rounded-full bg-black/65 border border-[#d4af37]/40 backdrop-blur-md flex items-center gap-2 text-xs text-[#faebaa] shadow-xl">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <Film className="w-3.5 h-3.5 text-[#d4af37]" />
          <span className="font-mono text-[11px] truncate max-w-[180px] sm:max-w-[320px]">
            {activeVideo.name}
          </span>
          {activeVideo.isCustom && (
            <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-500/40 uppercase font-bold">
              Kustom
            </span>
          )}
        </div>
      </div>

      {/* TOP RIGHT: Action Buttons */}
      <div className="absolute top-5 right-5 sm:top-6 sm:right-8 z-30 flex items-center gap-2 sm:gap-2.5">
        {/* Toggle Audio */}
        <button
          type="button"
          onClick={handleToggleSound}
          className="px-3 py-2 rounded-xl bg-black/60 hover:bg-black/80 border border-[#d4af37]/40 text-[#f7e59f] text-xs font-bold flex items-center gap-1.5 backdrop-blur-md transition shadow-lg active:scale-95"
          title={isMuted ? 'Nyalakan Suara (Harmoni Ney & Kitab Salaf)' : 'Bisukan Suara'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-emerald-400" /> : <Volume2 className="w-4 h-4 text-[#d4af37]" />}
          <span className="hidden sm:inline text-[11px] font-mono">{isMuted ? 'Muted' : 'Sound On'}</span>
        </button>

        {/* TOMBOL AREA AKSES KHUSUS OPTION PANEL */}
        <button
          type="button"
          onClick={() => {
            setAccessPasswordInput('');
            setAccessPasswordError('');
            setShowSpecialAccessModal(true);
          }}
          className="px-3 py-2 rounded-xl bg-[#092b1a]/90 hover:bg-[#0d4228] border border-[#d4af37] text-[#faebaa] text-xs font-black flex items-center gap-1.5 backdrop-blur-md transition shadow-[0_0_15px_rgba(212,175,55,0.35)] active:scale-95 group"
          title="Buka Area Akses Khusus Option Panel untuk Kelola Video"
          data-testid="open-special-access-btn"
        >
          <Lock className="w-3.5 h-3.5 text-[#d4af37] group-hover:scale-110 transition-transform" />
          <span className="text-[11px] font-extrabold hidden md:inline">Area Akses Khusus</span>
          <span className="text-[11px] font-extrabold md:hidden">Option Panel</span>
        </button>

        {/* EDIT / GONTA-GANTI & SIMPAN VIDEO BUTTON */}
        <button
          type="button"
          onClick={() => setShowConfigModal(true)}
          className="px-3 py-2 rounded-xl bg-black/60 hover:bg-[#07301c] border border-[#d4af37]/60 text-[#f7e59f] text-xs font-bold flex items-center gap-1.5 backdrop-blur-md transition shadow-lg hover:border-[#faebaa] active:scale-95"
          title="Gonta-Ganti & Simpan Video Intro Opening"
          data-testid="edit-intro-video-btn"
        >
          <Settings2 className="w-4 h-4 text-[#d4af37]" />
          <span className="hidden sm:inline text-[11px]">Ganti & Simpan Video</span>
        </button>

        {/* Skip Button */}
        <button
          type="button"
          onClick={handleComplete}
          className="btn-3d-gold text-black text-xs font-black uppercase tracking-wider px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xl hover:scale-105 active:scale-95 transition"
          data-testid="skip-intro-btn"
        >
          <span>LEWATI</span>
          <ArrowRight className="w-4 h-4 text-black stroke-[3]" />
        </button>
      </div>

      {/* TOAST NOTIFICATION */}
      {successToast && (
        <div className="absolute top-20 z-50 px-4 py-2.5 rounded-xl bg-emerald-900/90 border border-emerald-400 text-white text-xs font-bold flex items-center gap-2 shadow-2xl backdrop-blur-md animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{successToast}</span>
        </div>
      )}

      {/* CENTER CALLIGRAPHIC REVEAL */}
      <div className="relative z-20 flex flex-col items-center text-center px-6 pointer-events-none mt-auto mb-16 sm:mb-20 max-w-4xl">
        <div className="font-serif text-[#faebaa] text-3xl sm:text-5xl lg:text-6xl drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)] tracking-wide leading-tight" style={{ fontFamily: "'Amiri', serif" }} dir="rtl">
          المدرسة الدينية الإسلامية المالكي
        </div>
        <h1 className="mt-3 text-lg sm:text-2xl font-black tracking-[0.18em] text-white uppercase drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
          Madrasah Diniyah Pondok Pesantren Salaf Al-Maliki
        </h1>
        <p className="mt-1 text-xs sm:text-sm font-semibold tracking-widest text-[#faebaa]/90 uppercase">
          Pekalongan • The Journey of Knowledge
        </p>

        {/* Bottom Enter Portal Prompt */}
        <div className="mt-6 pointer-events-auto flex items-center gap-3">
          <button
            type="button"
            onClick={handleComplete}
            className="group px-6 py-2.5 rounded-full bg-black/60 hover:bg-[#d4af37] border border-[#d4af37]/60 hover:border-[#faebaa] text-[#faebaa] hover:text-black font-extrabold text-xs tracking-widest uppercase transition-all duration-300 flex items-center gap-2 backdrop-blur-md shadow-2xl"
          >
            <span>MASUK KE SISTEM</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* =========================================================================
          MODAL 1: EDIT, GONTA-GANTI & FITUR SIMPAN VIDEO
          ========================================================================= */}
      {showConfigModal && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-2xl card-3d rounded-3xl p-6 sm:p-7 border-2 border-[#d4af37]/60 shadow-[0_25px_60px_rgba(0,0,0,0.95)] bg-[#02180e] relative text-left max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#d4af37]/25 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#093d25] border border-[#d4af37] flex items-center justify-center text-[#d4af37] shadow">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white text-gold-3d uppercase tracking-wider">
                    Gonta-Ganti & Fitur Simpan Video Intro
                  </h3>
                  <p className="text-[11px] text-emerald-300">
                    Pilih video intro baru dan simpan secara permanen ke sistem.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="p-2 rounded-xl bg-black/50 hover:bg-red-950 text-emerald-200 hover:text-red-300 border border-[#d4af37]/30 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* BANNER PROMOSI: AREA AKSES KHUSUS OPTION PANEL */}
            <div className="bg-gradient-to-r from-[#072c1c] via-[#093d27] to-[#072c1c] border-2 border-[#d4af37]/60 rounded-2xl p-4 mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#03140c] border border-[#d4af37] flex items-center justify-center text-[#d4af37] shrink-0 shadow">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-black text-white block uppercase tracking-wider text-gold-3d">
                    Ingin Menambahkan via Dashboard Option Panel?
                  </span>
                  <p className="text-[11px] text-emerald-200/90">
                    Buka langsung <b>Area Akses Khusus</b> dengan kata sandi administrator untuk mengelola video di pusat kontrol.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAccessPasswordInput('');
                  setAccessPasswordError('');
                  setShowSpecialAccessModal(true);
                }}
                className="px-4 py-2 rounded-xl btn-3d-gold text-black font-black text-xs flex items-center gap-1.5 shrink-0 shadow-lg active:scale-95"
                data-testid="direct-to-special-access"
              >
                <KeyRound className="w-3.5 h-3.5 text-black" />
                <span>Buka Area Akses Khusus</span>
              </button>
            </div>

            {/* Error Message */}
            {uploadError && (
              <div className="p-3 mb-4 rounded-xl bg-red-950/90 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Current Active Video Card + TOMBOL SIMPAN VIDEO */}
            <div className="bg-[#03140c] p-4 rounded-2xl border border-[#d4af37]/40 mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-12 h-10 rounded-lg bg-black border border-[#d4af37]/40 flex items-center justify-center overflow-hidden shrink-0">
                  <Film className="w-5 h-5 text-[#d4af37]" />
                </div>
                <div className="overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-emerald-400 block font-bold uppercase tracking-wider">
                      Video Pilihan Aktif:
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold uppercase">
                      {activeVideo.sourceType.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-white truncate max-w-[260px] sm:max-w-[320px]">
                    {activeVideo.name}
                  </div>
                  <span className="text-[10px] text-[#d4af37] font-mono">
                    {activeVideo.size ? `${formatFileSize(activeVideo.size)} • ` : ''}
                    Status: Tersimpan & Aktif
                  </span>
                </div>
              </div>

              {/* FITUR SIMPAN VIDEO RESMI */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleConfirmSaveVideo()}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#faebaa] hover:from-[#e5bd3b] hover:to-[#fff1b8] text-black font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95"
                  title="Simpan video ini secara permanen sebagai intro resmi"
                  data-testid="save-video-confirm-btn"
                >
                  <Save className="w-3.5 h-3.5 text-black" />
                  <span>Simpan Video</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="px-3 py-2 rounded-xl bg-[#092b1a] hover:bg-[#0c3f26] border border-[#d4af37]/40 text-[#f7e59f] text-[11px] font-bold flex items-center gap-1 transition"
                  title="Pulihkan ke video bawaan resmi"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              </div>
            </div>

            {/* Switch Tabs: Upload Berkas / URL Online / Koleksi Bawaan */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button
                type="button"
                onClick={() => setConfigTab('upload')}
                className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
                  configTab === 'upload'
                    ? 'btn-3d-gold text-black shadow'
                    : 'bg-[#03140c] text-emerald-200 border border-[#d4af37]/30 hover:bg-[#052216]'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>1. Unggah File</span>
              </button>
              <button
                type="button"
                onClick={() => setConfigTab('url')}
                className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
                  configTab === 'url'
                    ? 'btn-3d-gold text-black shadow'
                    : 'bg-[#03140c] text-emerald-200 border border-[#d4af37]/30 hover:bg-[#052216]'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>2. Tautan / URL</span>
              </button>
              <button
                type="button"
                onClick={() => setConfigTab('presets')}
                className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
                  configTab === 'presets'
                    ? 'btn-3d-gold text-black shadow'
                    : 'bg-[#03140c] text-emerald-200 border border-[#d4af37]/30 hover:bg-[#052216]'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>3. Pilihan Bawaan</span>
              </button>
            </div>

            {/* TAB 1: UPLOAD FILE (INDEXEDDB PERMANENT STORAGE) */}
            {configTab === 'upload' && (
              <div className="space-y-4">
                <div
                  onClick={() => modalFileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#d4af37]/50 hover:border-[#faebaa] bg-[#03180f]/80 hover:bg-[#06291a] rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 shadow-inner group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#083b23] border border-[#d4af37] flex items-center justify-center text-[#d4af37] group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-white block">
                      Klik atau Tarik Berkas Video ke Sini
                    </span>
                    <span className="text-[11px] text-emerald-300 mt-1 block">
                      Format: .MP4 atau .WebM (Tersimpan permanen di IndexedDB browser)
                    </span>
                  </div>
                  <input
                    ref={modalFileInputRef}
                    type="file"
                    accept="video/mp4,video/webm"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />
                </div>
                <div className="flex items-center gap-2 text-[11px] text-emerald-300/80">
                  <Info className="w-4 h-4 shrink-0 text-[#d4af37]" />
                  <span>
                    Setelah memilih berkas, video akan langsung disimpan dan dijadikan video intro aplikasi.
                  </span>
                </div>
              </div>
            )}

            {/* TAB 2: LINK URL ONLINE */}
            {configTab === 'url' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#d4af37] block mb-1.5">
                    Masukkan URL Berkas Video MP4 / WebM:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://example.com/video_intro_salaf.mp4"
                      className="flex-1 px-4 py-2.5 rounded-xl bg-[#03140c] border border-[#d4af37]/45 text-white text-xs focus:outline-none focus:border-[#faebaa]"
                    />
                    <button
                      type="button"
                      onClick={handleApplyUrl}
                      className="btn-3d-gold px-4 py-2 text-black font-extrabold text-xs rounded-xl shadow flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5 text-black" />
                      <span>Simpan URL</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-emerald-300/80 mt-1.5">
                    Mendukung link Google Drive, Cloudinary, AWS S3, atau CDN hosting video Anda.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 3: PILIHAN BAWAAN / PRESETS */}
            {configTab === 'presets' && (
              <div className="space-y-3">
                <div
                  onClick={handleResetToDefault}
                  className="p-3.5 rounded-xl bg-[#03180f] hover:bg-[#07301c] border border-[#d4af37]/40 flex items-center justify-between cursor-pointer transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-black border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
                      <Film className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        The Journey of Knowledge — Salaf Al-Maliki (Bawaan)
                      </span>
                      <span className="text-[10px] text-emerald-300">
                        Kitab Klasik, Ulama Salaf, Kaligrafi Emas Madrasah Diniyah
                      </span>
                    </div>
                  </div>
                  <span className="px-3 py-1.5 rounded-lg btn-3d-gold text-black font-extrabold text-[11px] flex items-center gap-1">
                    <Save className="w-3 h-3 text-black" />
                    <span>Pilih & Simpan</span>
                  </span>
                </div>
              </div>
            )}

            {/* Pengaturan Durasi Putar Otomatis */}
            <div className="mt-5 pt-4 border-t border-[#d4af37]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-[#d4af37] block">
                  Durasi Tayang Intro Sebelum Masuk:
                </span>
                <span className="text-[10px] text-emerald-300">
                  Otomatis membuka halaman login setelah waktu ini habis
                </span>
              </div>
              <div className="flex items-center gap-2">
                {[
                  { label: '8 Detik', val: 8 },
                  { label: '10 Detik', val: 10 },
                  { label: '15 Detik', val: 15 },
                  { label: 'Loop Terus', val: 0 },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => {
                      setAutoSkipDuration(opt.val);
                      localStorage.setItem('sim_intro_duration', opt.val.toString());
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                      autoSkipDuration === opt.val
                        ? 'bg-[#d4af37] text-black font-black'
                        : 'bg-[#03140c] text-emerald-200 border border-[#d4af37]/30 hover:bg-[#052216]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-5 pt-4 border-t border-[#d4af37]/20 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setAccessPasswordInput('');
                  setAccessPasswordError('');
                  setShowSpecialAccessModal(true);
                }}
                className="text-[11px] text-[#faebaa] hover:text-white font-bold flex items-center gap-1.5 underline decoration-[#d4af37]/60"
              >
                <Lock className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Buka Area Akses Khusus Option Panel</span>
              </button>

              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="btn-3d-gold px-6 py-2.5 text-black font-black text-xs rounded-xl shadow uppercase tracking-wider"
              >
                Selesai & Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: AREA AKSES KHUSUS OPTION PANEL (VERIFIKASI KATA SANDI LANGSUNG)
          ========================================================================= */}
      {showSpecialAccessModal && (
        <div className="fixed inset-0 z-[100001] flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-fadeIn">
          <div className="w-full max-w-md card-3d rounded-3xl p-6 sm:p-8 border-2 border-[#d4af37] shadow-[0_25px_70px_rgba(0,0,0,0.98)] bg-[#02180e] relative text-center space-y-5">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowSpecialAccessModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-black/40 text-emerald-300 hover:text-white border border-[#d4af37]/30 transition"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon Lock Shield */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-b from-[#0e4e32] to-[#041d12] border-2 border-[#d4af37] mx-auto flex items-center justify-center text-[#d4af37] shadow-[0_0_25px_rgba(212,175,55,0.4)]">
              <Lock className="w-8 h-8" />
            </div>

            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#d4af37] text-black font-black text-[9px] uppercase tracking-widest inline-block mb-1.5 shadow">
                Area Akses Khusus Administrator
              </span>
              <h4 className="text-lg font-black text-white text-gold-3d uppercase tracking-wide">
                Buka Dashboard Option Panel
              </h4>
              <p className="text-xs text-emerald-200/90 mt-1.5 leading-relaxed">
                Halaman Option Panel dan Pusat Manajemen Video terproteksi sandi khusus administrator. Masukkan kata sandi untuk masuk langsung.
              </p>
            </div>

            {/* Error Message */}
            {accessPasswordError && (
              <div className="p-3 rounded-xl bg-red-950/90 border border-red-500/50 text-red-200 text-xs font-semibold animate-shake">
                {accessPasswordError}
              </div>
            )}

            {/* Success Message */}
            {accessSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-400 text-emerald-200 text-xs font-bold flex items-center justify-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Kata sandi terverifikasi! Membuka Dashboard Option Panel...</span>
              </div>
            )}

            <form onSubmit={handleVerifyAccessPassword} className="space-y-4 text-left">
              <div>
                <label className="block text-[11px] font-bold text-[#d4af37] mb-1.5 uppercase tracking-wider">
                  Masukkan Kata Sandi Option Panel
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#d4af37] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={accessPasswordInput}
                    onChange={(e) => setAccessPasswordInput(e.target.value)}
                    placeholder="Masukkan sandi khusus..."
                    required
                    autoFocus
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#03140c] border border-[#d4af37]/50 text-white text-sm focus:outline-none focus:border-[#faebaa] shadow-inner font-mono tracking-wider"
                    data-testid="option-panel-access-password-input"
                  />
                </div>
                <div className="flex items-center justify-between mt-1.5 text-[10px] text-emerald-400/80">
                  <span>Sandi bawaan: <b className="font-mono text-[#d4af37]">{optionPassword || 'admin123'}</b></span>
                  <span>Dapat diganti di Option Panel</span>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={accessSuccess}
                  className="w-full py-3 rounded-xl btn-3d-gold text-black font-black text-xs flex items-center justify-center gap-2 shadow-xl hover:scale-[1.02] active:scale-95 transition"
                  data-testid="submit-special-access-btn"
                >
                  <ShieldCheck className="w-4 h-4 text-black" />
                  <span>Buka Akses Khusus & Masuk ke Option Panel Video</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowSpecialAccessModal(false)}
                  className="w-full py-2.5 rounded-xl bg-[#03140c] hover:bg-[#052216] border border-[#d4af37]/30 text-emerald-200 text-xs font-bold transition"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
