import React from 'react';
import {
  User, Users, Lock, Eye, EyeOff, ArrowRight, Play, Film, X, HelpCircle, MessageCircle,
  BookOpen, HeartHandshake, Star, ShieldCheck, Calendar, Instagram, Youtube, Music2, Globe
} from 'lucide-react';
import { Santri, Pengurus, AppSettings } from '../types';
import { resolveLogos } from '../brand';
import { LogoFrame } from './BrandLogos';
import { saveVideoFile } from '../lib/videoStorage';

type LoginMode = 'wali' | 'pengurus' | 'admin';

interface LoginScreenProps {
  settings: AppSettings;
  santriList: Santri[];
  pengurusList: Pengurus[];
  loginMode: LoginMode;
  setLoginMode: (m: LoginMode) => void;
  loginError: string;
  setLoginError: (s: string) => void;
  santriNamaInput: string; setSantriNamaInput: (s: string) => void;
  santriPasswordInput: string; setSantriPasswordInput: (s: string) => void;
  pengurusNamaInput: string; setPengurusNamaInput: (s: string) => void;
  pengurusPasswordInput: string; setPengurusPasswordInput: (s: string) => void;
  adminUsername: string; setAdminUsername: (s: string) => void;
  adminPassword: string; setAdminPassword: (s: string) => void;
  showPassword: boolean; setShowPassword: (b: boolean) => void;
  rememberMe: boolean; setRememberMe: (b: boolean) => void;
  showForgotPasswordModal: boolean; setShowForgotPasswordModal: (b: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  onGoogleSignIn: () => void;
  onSyncSheets: () => void;
  onReplayIntro: () => void;
}

const inputCls =
  'w-full pl-12 pr-12 py-3.5 rounded-2xl bg-[#03140c]/80 border border-[#d4af37]/45 text-white text-sm placeholder:text-emerald-200/40 focus:outline-none focus:border-[#faebaa] focus:ring-1 focus:ring-[#d4af37] shadow-inner transition uppercase tracking-wide';

export const LoginScreen: React.FC<LoginScreenProps> = (p) => {
  const {
    settings, santriList, pengurusList, loginMode, setLoginMode, loginError, setLoginError,
    santriNamaInput, setSantriNamaInput, santriPasswordInput, setSantriPasswordInput,
    pengurusNamaInput, setPengurusNamaInput, pengurusPasswordInput, setPengurusPasswordInput,
    adminUsername, setAdminUsername, adminPassword, setAdminPassword,
    showPassword, setShowPassword, rememberMe, setRememberMe,
    showForgotPasswordModal, setShowForgotPasswordModal, onSubmit, onGoogleSignIn, onSyncSheets, onReplayIntro,
  } = p;

  const logos = resolveLogos(settings);
  const pickMode = (m: LoginMode) => { setLoginMode(m); setLoginError(''); };

  const roleBtn = (m: LoginMode, label: string, Icon: React.ElementType) => (
    <button
      type="button"
      data-testid={`login-role-${m}`}
      onClick={() => pickMode(m)}
      className={`login-role-btn flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl border transition-all duration-300 uppercase text-[10px] sm:text-[11px] font-black tracking-wider ${
        loginMode === m
          ? 'btn-3d-gold text-black border-[#faebaa] scale-[1.03] shadow-[0_10px_25px_rgba(212,175,55,0.45)]'
          : 'bg-[#03140c]/80 border-[#d4af37]/40 text-emerald-100 hover:border-[#d4af37] hover:bg-[#052216]'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </button>
  );

  const eyeBtn = (
    <button type="button" data-testid="toggle-password-btn" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-300/80 hover:text-white">
      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );

  return (
    <div
      className="login-screen min-h-screen w-full relative text-[#faebaa] font-sans overflow-x-hidden uppercase"
      data-testid="login-screen"
      style={{
        backgroundImage: `linear-gradient(rgba(1,14,8,0.55), rgba(1,14,8,0.72)), url('/assets/islamic_library_login_bg.jpg')`,
        backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed',
      }}
    >
      <div className="absolute inset-0 opacity-[0.08] pointer-events-none bg-[radial-gradient(#faebaa_1px,transparent_1px)] [background-size:28px_28px]" />
      <div className="absolute -top-20 left-1/4 w-96 h-96 bg-[#d4af37]/15 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/15 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />

      {showForgotPasswordModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn normal-case" data-testid="forgot-password-modal">
          <div className="w-full max-w-md card-3d rounded-3xl p-6 border-2 border-[#d4af37]/50 shadow-2xl bg-[#02180e] relative text-left">
            <button type="button" data-testid="forgot-close-x" onClick={() => setShowForgotPasswordModal(false)} className="absolute top-4 right-4 p-2 rounded-xl bg-black/40 text-emerald-300 hover:text-white transition"><X className="w-4 h-4" /></button>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#0b3824] border border-[#d4af37] flex items-center justify-center text-[#d4af37] shadow"><HelpCircle className="w-5 h-5" /></div>
              <div>
                <h4 className="text-base font-bold text-white text-gold-3d uppercase">Bantuan Sandi Masuk Sistem</h4>
                <p className="text-[11px] text-emerald-300 uppercase">Panduan pemulihan akses akun Madrasah & Pesantren</p>
              </div>
            </div>
            <div className="space-y-3 text-xs text-emerald-100/90 leading-relaxed">
              <div className="p-3 rounded-xl bg-[#032214] border border-[#d4af37]/30"><b className="text-[#faebaa] block mb-1 uppercase">1. Wali Santri</b><p>Kata sandi bawaan adalah <b>Nomor Induk Santri (NIS)</b> (contoh: <code>S-1001</code>).</p></div>
              <div className="p-3 rounded-xl bg-[#032214] border border-[#d4af37]/30"><b className="text-[#faebaa] block mb-1 uppercase">2. Ustadz & Pengurus</b><p>Sandi bawaan <code>pengurus123</code> atau sesuai pengaturan Administrator di Option Panel.</p></div>
              <div className="p-3 rounded-xl bg-[#032214] border border-[#d4af37]/30"><b className="text-[#faebaa] block mb-1 uppercase">3. Administrator</b><p>Sandi bawaan <code>salaf123</code> dengan username <code>admin</code>.</p></div>
            </div>
            <div className="mt-5 pt-4 border-t border-[#d4af37]/20 flex flex-col sm:flex-row items-center justify-between gap-3">
              <a href="https://wa.me/6281234567890?text=Assalamu%27alaikum%20Admin%20Pesantren%20Salaf,%20saya%20butuh%20bantuan%20sandi%20login%20SIM" target="_blank" rel="noreferrer" className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow uppercase"><MessageCircle className="w-4 h-4" /><span>Hubungi Admin via WA</span></a>
              <button type="button" data-testid="forgot-close-btn" onClick={() => setShowForgotPasswordModal(false)} className="w-full sm:w-auto px-4 py-2.5 rounded-xl btn-3d-dark text-[#faebaa] font-bold text-xs uppercase">Tutup Panduan</button>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 max-w-[1400px] mx-auto min-h-screen grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8 lg:gap-12 px-5 sm:px-8 lg:px-12 py-8 lg:py-10">
        {/* ================= LEFT: BRAND SHOWCASE ================= */}
        <div className="flex flex-col justify-between gap-8 login-left">
          {/* top pills */}
          <div className="flex flex-wrap items-center gap-3 login-reveal" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-3 px-5 py-2.5 rounded-full border border-[#d4af37]/60 bg-[#031d12]/70 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
              <Star className="w-4 h-4 text-[#d4af37]" />
              <span className="text-[11px] sm:text-xs font-bold tracking-[0.18em] text-[#faebaa]">Sistem Informasi Akademik & Manajemen</span>
            </div>
            <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-[#d4af37]/60 bg-[#031d12]/70 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
              <Calendar className="w-4 h-4 text-[#d4af37]" />
              <span className="text-[11px] sm:text-xs font-bold tracking-[0.14em] text-[#faebaa]">TA 1447-1448 H / 2026-2027 M</span>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <button type="button" data-testid="replay-intro-btn" onClick={onReplayIntro} title="Tonton Intro" className="w-10 h-10 rounded-full border border-[#d4af37]/60 bg-[#031d12]/70 backdrop-blur-md text-[#d4af37] hover:bg-[#d4af37] hover:text-black transition flex items-center justify-center"><Play className="w-4 h-4 fill-current" /></button>
              <label title="Pilih Video Intro MP4" className="w-10 h-10 rounded-full border border-[#d4af37]/60 bg-[#031d12]/70 backdrop-blur-md text-[#d4af37] hover:bg-[#d4af37] hover:text-black transition flex items-center justify-center cursor-pointer">
                <Film className="w-4 h-4" />
                <input type="file" accept="video/mp4,video/webm" className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) { 
                    try {
                      await saveVideoFile(file, file.name);
                    } catch (err) {
                      console.warn('Could not save to IndexedDB:', err);
                    }
                    onReplayIntro(); 
                  }
                }} />
              </label>
            </div>
          </div>

          {/* center brand */}
          <div className="flex flex-col items-center text-center gap-6 lg:gap-7 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 login-reveal" style={{ animationDelay: '0.25s' }}>
              <LogoFrame src={logos.madrasah} alt="Logo Madrasah Diniyah Almaliki" shape="round" size="lg" testId="login-logo-madrasah" className="login-logo-slot" />
              <LogoFrame src={logos.pondok} alt="Logo Pondok Pesantren Almaliki" shape="wide" size="lg" testId="login-logo-pondok" className="login-logo-slot" />
            </div>

            <div className="login-reveal" style={{ animationDelay: '0.4s' }}>
              <div className="font-serif text-[#faebaa] text-3xl sm:text-5xl lg:text-6xl leading-[1.5] drop-shadow-[0_4px_18px_rgba(0,0,0,0.95)] text-gold-3d" style={{ fontFamily: "'Amiri', serif" }} dir="rtl">
                المدرسة الدينية الإسلامية المالكي
              </div>
              <h1 className="mt-3 text-xl sm:text-2xl lg:text-3xl font-black tracking-[0.12em] text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
                Madrasah Diniyah
              </h1>
              <p className="mt-1 text-sm sm:text-base lg:text-lg font-bold tracking-[0.1em] text-[#faebaa]">
                {settings.nama_pesantren || 'Pondok Pesantren Salaf Al-Maliki Pekalongan'}
              </p>
              <div className="mt-5 flex items-center justify-center gap-3">
                <span className="h-px w-24 sm:w-36 bg-gradient-to-r from-transparent to-[#d4af37]" />
                <span className="w-2.5 h-2.5 rotate-45 bg-[#d4af37] shadow-[0_0_12px_rgba(212,175,55,0.9)]" />
                <span className="h-px w-24 sm:w-36 bg-gradient-to-l from-transparent to-[#d4af37]" />
              </div>
            </div>
          </div>

          {/* bottom values */}
          <div className="login-reveal rounded-full border border-[#d4af37]/60 bg-[#031d12]/70 backdrop-blur-md px-6 sm:px-10 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-0 sm:divide-x divide-[#d4af37]/40 shadow-[0_15px_40px_rgba(0,0,0,0.65)]" style={{ animationDelay: '0.55s' }}>
            {[
              { Icon: BookOpen, t: 'Ilmu', s: 'Sebagai Landasan' },
              { Icon: HeartHandshake, t: 'Akhlak', s: 'Sebagai Tujuan' },
              { Icon: Star, t: 'Ukhuwah', s: 'Sebagai Kekuatan' },
            ].map(({ Icon, t, s }) => (
              <div key={t} className="flex items-center gap-3.5 sm:justify-center">
                <div className="w-11 h-11 rounded-full border-2 border-[#d4af37] flex items-center justify-center text-[#d4af37] shadow-[0_0_16px_rgba(212,175,55,0.35)] shrink-0"><Icon className="w-5 h-5" /></div>
                <div className="text-left leading-tight">
                  <div className="text-sm font-black tracking-widest text-white">{t}</div>
                  <div className="text-[10px] text-[#faebaa]/85 tracking-wider">{s}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ================= RIGHT: MIHRAB LOGIN PANEL ================= */}
        <div className="flex flex-col items-center justify-center gap-6">
          <div className="mihrab-frame w-full max-w-[520px] login-reveal" style={{ animationDelay: '0.35s' }} data-testid="login-card">
            <div className="mihrab-inner px-7 sm:px-10 pt-24 sm:pt-28 pb-8">
              <h2 className="text-center text-sm sm:text-base font-black tracking-[0.22em] text-[#faebaa] mb-4" data-testid="login-heading">Pilih Akses Login</h2>

              <div className="grid grid-cols-3 gap-2.5 mb-6">
                {roleBtn('wali', 'Wali Santri', User)}
                {roleBtn('pengurus', 'Pengurus', Users)}
                {roleBtn('admin', 'Admin', Lock)}
              </div>

              <p className="text-xs sm:text-sm font-bold tracking-[0.12em] text-white mb-3">Masuk ke Akun Anda</p>

              {loginError && (
                <div data-testid="login-error" className="p-3 mb-4 rounded-xl bg-red-950/85 border border-red-500/50 text-red-200 text-[11px] shadow-lg animate-shake normal-case">{loginError}</div>
              )}

              <form onSubmit={onSubmit} className="space-y-3.5" data-testid="login-form">
                {loginMode === 'wali' && (
                  <>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#d4af37] absolute left-4 top-1/2 -translate-y-1/2" />
                      <input data-testid="login-username-input" type="text" list="santri-name-suggestions" value={santriNamaInput} required placeholder="Nama Lengkap / NISN Santri" className={inputCls}
                        onChange={(e) => { setSantriNamaInput(e.target.value); const m = santriList.find(s => s.nama.toLowerCase() === e.target.value.toLowerCase()); if (m) setSantriPasswordInput(m.password || m.id); }} />
                      <datalist id="santri-name-suggestions">{santriList.map(s => <option key={s.id} value={s.nama}>{s.kelas} — {s.id}</option>)}</datalist>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {santriList.slice(0, 4).map(d => (
                        <button key={d.id} type="button" data-testid={`demo-chip-${d.id}`} onClick={() => { setSantriNamaInput(d.nama); setSantriPasswordInput(d.password || d.id); }} className="text-[9px] px-2.5 py-1 rounded-lg bg-[#072918]/80 border border-[#d4af37]/35 text-[#faebaa] hover:bg-[#d4af37] hover:text-black transition tracking-wider">{d.nama.split(' ')[0]} ({d.id})</button>
                      ))}
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#d4af37] absolute left-4 top-1/2 -translate-y-1/2" />
                      <input data-testid="login-password-input" type={showPassword ? 'text' : 'password'} value={santriPasswordInput} onChange={(e) => setSantriPasswordInput(e.target.value)} placeholder="Kata Sandi" required className={`${inputCls} font-mono`} />
                      {eyeBtn}
                    </div>
                  </>
                )}

                {loginMode === 'pengurus' && (
                  <>
                    <div className="relative">
                      <Users className="w-4 h-4 text-[#d4af37] absolute left-4 top-1/2 -translate-y-1/2" />
                      <input data-testid="login-username-input" type="text" list="pengurus-name-suggestions" value={pengurusNamaInput} required placeholder="Nama Pengurus / Ustadz" className={inputCls}
                        onChange={(e) => { setPengurusNamaInput(e.target.value); const m = pengurusList.find(x => x.nama.toLowerCase() === e.target.value.toLowerCase()); if (m) setPengurusPasswordInput(m.password || 'pengurus123'); }} />
                      <datalist id="pengurus-name-suggestions">{pengurusList.map(x => <option key={x.id} value={x.nama}>{x.jabatan} ({x.id})</option>)}</datalist>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {pengurusList.slice(0, 4).map(d => (
                        <button key={d.id} type="button" data-testid={`demo-chip-${d.id}`} onClick={() => { setPengurusNamaInput(d.nama); setPengurusPasswordInput(d.password || 'pengurus123'); }} className="text-[9px] px-2.5 py-1 rounded-lg bg-[#072918]/80 border border-[#d4af37]/35 text-[#faebaa] hover:bg-[#d4af37] hover:text-black transition tracking-wider">{d.nama.split(',')[0]}</button>
                      ))}
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#d4af37] absolute left-4 top-1/2 -translate-y-1/2" />
                      <input data-testid="login-password-input" type={showPassword ? 'text' : 'password'} value={pengurusPasswordInput} onChange={(e) => setPengurusPasswordInput(e.target.value)} placeholder="Kata Sandi" required className={`${inputCls} font-mono`} />
                      {eyeBtn}
                    </div>
                  </>
                )}

                {loginMode === 'admin' && (
                  <>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#d4af37] absolute left-4 top-1/2 -translate-y-1/2" />
                      <input data-testid="login-username-input" type="text" value={adminUsername} onChange={(e) => setAdminUsername(e.target.value)} placeholder="Username Administrator" required className={inputCls} />
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#d4af37] absolute left-4 top-1/2 -translate-y-1/2" />
                      <input data-testid="login-password-input" type={showPassword ? 'text' : 'password'} value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="Kata Sandi" required className={`${inputCls} font-mono`} />
                      {eyeBtn}
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between text-[11px] pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-white font-semibold tracking-wider">
                    <input data-testid="remember-me-checkbox" type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 accent-[#d4af37] rounded" />
                    <span>Ingat Saya</span>
                  </label>
                  <button type="button" data-testid="forgot-password-btn" onClick={() => setShowForgotPasswordModal(true)} className="text-[#faebaa] hover:text-white underline underline-offset-2 font-bold tracking-wider">Lupa Kata Sandi?</button>
                </div>

                <button type="submit" data-testid="login-submit-btn" className="login-gold-btn w-full py-4 rounded-xl text-black font-black text-sm sm:text-base tracking-[0.12em] flex items-center justify-center gap-3 hover:scale-[1.015] active:scale-95 transition-transform mt-2">
                  <span>Masuk ke Sistem</span>
                  <ArrowRight className="w-5 h-5 stroke-[3]" />
                </button>

                <button type="button" data-testid="google-login-btn" onClick={onGoogleSignIn} className="w-full py-3.5 rounded-xl bg-[#03140c]/80 hover:bg-[#052216] border border-[#d4af37]/55 text-white font-bold text-xs sm:text-sm tracking-[0.1em] flex items-center justify-center gap-3 shadow-md transition hover:scale-[1.01] active:scale-95">
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z" />
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15Z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z" />
                  </svg>
                  <span>Masuk dengan Google</span>
                </button>
              </form>

              <div className="mt-7 pt-4 relative text-center">
                <div className="absolute top-0 inset-x-6 flex items-center gap-2"><span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#d4af37]/70" /><span className="w-1.5 h-1.5 rotate-45 bg-[#d4af37]" /><span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#d4af37]/70" /></div>
                <div className="flex items-center justify-center gap-2.5 pt-2">
                  <ShieldCheck className="w-5 h-5 text-[#d4af37]" />
                  <div className="text-left leading-tight">
                    <div className="text-[11px] font-black tracking-[0.14em] text-white">Sistem Informasi Terpadu</div>
                    <div className="text-[9px] tracking-wider text-[#faebaa]/85">{settings.nama_pesantren || 'Pondok Pesantren Salaf Al-Maliki Pekalongan'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* social + quote */}
          <div className="w-full max-w-[520px] flex flex-col sm:flex-row items-center justify-between gap-4 login-reveal" style={{ animationDelay: '0.7s' }}>
            <div>
              <div className="text-[10px] font-bold tracking-[0.2em] text-[#faebaa]/85 mb-2">Media Sosial</div>
              <div className="flex items-center gap-2.5">
                {[
                  { href: 'https://instagram.com', Icon: Instagram, t: 'Instagram', id: 'social-instagram' },
                  { href: 'https://youtube.com', Icon: Youtube, t: 'YouTube', id: 'social-youtube' },
                  { href: 'https://tiktok.com', Icon: Music2, t: 'TikTok', id: 'social-tiktok' },
                  { href: 'https://wa.me/6281234567890', Icon: MessageCircle, t: 'WhatsApp', id: 'social-whatsapp' },
                ].map(({ href, Icon, t, id }) => (
                  <a key={t} href={href} target="_blank" rel="noreferrer" title={t} data-testid={id} className="w-10 h-10 rounded-full border-2 border-[#d4af37]/70 bg-[#031d12]/60 text-[#faebaa] hover:bg-[#d4af37] hover:text-black flex items-center justify-center transition shadow"><Icon className="w-4 h-4" /></a>
                ))}
                <button type="button" title="Sinkronisasi Google Sheets" data-testid="sync-sheets-btn" onClick={onSyncSheets} className="w-10 h-10 rounded-full border-2 border-[#d4af37]/70 bg-[#031d12]/60 text-[#faebaa] hover:bg-[#d4af37] hover:text-black flex items-center justify-center transition shadow"><Globe className="w-4 h-4" /></button>
              </div>
            </div>
            <p className="font-serif italic normal-case text-right text-sm sm:text-base text-[#faebaa] leading-snug drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]" style={{ fontFamily: "'Amiri', serif" }}>
              “Berilmu, Berakhlak,<br />Menuju Ridha Allah”
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
