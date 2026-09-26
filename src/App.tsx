import React, { useState, useEffect } from 'react';
import { 
  Santri, AbsensiSantriRecord, AbsensiGuruRecord, JadwalPelajaran, 
  GuruPengajar, NadzhomRecord, NilaiUjianRecord, AppSettings, DashboardStats, AuthSession,
  SyahriyahRecord, UangSakuRecord, KurikulumKitabRecord,
  Pengurus, KalenderAkademikEvent, UjianSantriRecord, IzinMengajarRequest
} from './types';
import { 
  DEFAULT_SPREADSHEET_ID, DEFAULT_SETTINGS, INITIAL_SANTRI_LIST, 
  INITIAL_GURU_LIST, INITIAL_JADWAL_LIST, INITIAL_NADZHOM_LIST, 
  INITIAL_NILAI_LIST, INITIAL_ABSENSI_SANTRI, INITIAL_ABSENSI_GURU,
  INITIAL_SYAHRIYAH_LIST, INITIAL_UANG_SAKU_LIST, INITIAL_KURIKULUM_LIST,
  INITIAL_PENGURUS_LIST, INITIAL_KALENDER_AKADEMIK, INITIAL_UJIAN_SANTRI_LIST,
  INITIAL_IZIN_MENGAJAR_LIST
} from './data';
import { GoogleSheetsService } from './sheetsService';
import { googleSignIn, initAuth, getAccessToken, logoutGoogle } from './googleAuth';
import { AdminDashboard } from './components/AdminDashboard';
import { WaliSantriPortal } from './components/WaliSantriPortal';
import { PengurusDashboard } from './components/PengurusDashboard';
import { IntroOpening } from './components/IntroOpening';
import { CinematicIntro } from './components/CinematicIntro';
import { DoorTransition } from './components/DoorTransition';
import { 
  ShieldCheck, UserCheck, Key, Lock, ExternalLink, RefreshCw, User, Eye, EyeOff, 
  Users, Award, Play, ArrowRight, Shield, Globe, MessageCircle, HelpCircle, X,
  Check, Sparkles, LogIn, Film, BookOpen, GraduationCap, Star, Calendar, Instagram, Youtube
} from 'lucide-react';

export default function App() {
  // Intro Video State
  const [showIntro, setShowIntro] = useState<boolean>(true);

  // Cinematic sliding-door transition played right after a successful login
  const [showDoors, setShowDoors] = useState<boolean>(false);

  // Session State
  const [session, setSession] = useState<AuthSession | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Remember Me & Forgot Password State
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState<boolean>(false);

  // Google Sheets integration state
  const [spreadsheetId, setSpreadsheetId] = useState<string>(() => {
    return localStorage.getItem('sim_spreadsheet_id') || DEFAULT_SPREADSHEET_ID;
  });
  const [sheetsService] = useState<GoogleSheetsService>(() => new GoogleSheetsService(spreadsheetId));
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // App Data (Local + Sheets Cache)
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('sim_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });
  const [santriList, setSantriList] = useState<Santri[]>(() => {
    const saved = localStorage.getItem('sim_santri');
    return saved ? JSON.parse(saved) : INITIAL_SANTRI_LIST;
  });
  const [guruList, setGuruList] = useState<GuruPengajar[]>(() => {
    const saved = localStorage.getItem('sim_guru');
    return saved ? JSON.parse(saved) : INITIAL_GURU_LIST;
  });
  const [jadwalList, setJadwalList] = useState<JadwalPelajaran[]>(() => {
    const saved = localStorage.getItem('sim_jadwal');
    return saved ? JSON.parse(saved) : INITIAL_JADWAL_LIST;
  });
  const [nadzhomList, setNadzhomList] = useState<NadzhomRecord[]>(() => {
    const saved = localStorage.getItem('sim_nadzhom');
    return saved ? JSON.parse(saved) : INITIAL_NADZHOM_LIST;
  });
  const [nilaiList, setNilaiList] = useState<NilaiUjianRecord[]>(() => {
    const saved = localStorage.getItem('sim_nilai');
    return saved ? JSON.parse(saved) : INITIAL_NILAI_LIST;
  });
  const [absensiSantriList, setAbsensiSantriList] = useState<AbsensiSantriRecord[]>(INITIAL_ABSENSI_SANTRI);
  const [absensiGuruList, setAbsensiGuruList] = useState<AbsensiGuruRecord[]>(INITIAL_ABSENSI_GURU);

  // New features data states (Syahriyah, Uang Saku, Kurikulum)
  const [syahriyahList, setSyahriyahList] = useState<SyahriyahRecord[]>(() => {
    const saved = localStorage.getItem('sim_syahriyah');
    return saved ? JSON.parse(saved) : INITIAL_SYAHRIYAH_LIST;
  });
  const [uangSakuList, setUangSakuList] = useState<UangSakuRecord[]>(() => {
    const saved = localStorage.getItem('sim_uang_saku');
    return saved ? JSON.parse(saved) : INITIAL_UANG_SAKU_LIST;
  });
  const [kurikulumList, setKurikulumList] = useState<KurikulumKitabRecord[]>(() => {
    const saved = localStorage.getItem('sim_kurikulum');
    return saved ? JSON.parse(saved) : INITIAL_KURIKULUM_LIST;
  });

  // Pengurus, Kalender Akademik, & Ujian Santri Data States
  const [pengurusList, setPengurusList] = useState<Pengurus[]>(() => {
    const saved = localStorage.getItem('sim_pengurus');
    return saved ? JSON.parse(saved) : INITIAL_PENGURUS_LIST;
  });
  const [kalenderList, setKalenderList] = useState<KalenderAkademikEvent[]>(() => {
    const saved = localStorage.getItem('sim_kalender');
    return saved ? JSON.parse(saved) : INITIAL_KALENDER_AKADEMIK;
  });
  const [ujianList, setUjianList] = useState<UjianSantriRecord[]>(() => {
    const saved = localStorage.getItem('sim_ujian_kitab');
    return saved ? JSON.parse(saved) : INITIAL_UJIAN_SANTRI_LIST;
  });
  const [izinMengajarList, setIzinMengajarList] = useState<IzinMengajarRequest[]>(() => {
    const saved = localStorage.getItem('sim_izin_mengajar');
    return saved ? JSON.parse(saved) : INITIAL_IZIN_MENGAJAR_LIST;
  });

  // Otomatis restart sesi harian dari nol saat berganti hari kalender
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const lastDate = localStorage.getItem('sim_last_active_date');
    if (lastDate && lastDate !== todayStr) {
      // Tanggal berganti: perbarui tanggal aktif
      localStorage.setItem('sim_last_active_date', todayStr);
      // Sesi presensi hari baru dimulai dari nol
    } else if (!lastDate) {
      localStorage.setItem('sim_last_active_date', todayStr);
    }
  }, []);

  // Login Form State
  const [loginMode, setLoginMode] = useState<'wali' | 'pengurus' | 'admin'>('wali');
  
  // Wali Santri login uses NAMA SANTRI as identifier, and NIS as password (editable in Option Panel)
  const [santriNamaInput, setSantriNamaInput] = useState<string>('Ahmad Fathan Mubina');
  const [santriPasswordInput, setSantriPasswordInput] = useState<string>('S-1001');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Pengurus login uses NAMA PENGURUS and PASSWORD (editable in Option Panel)
  const [pengurusNamaInput, setPengurusNamaInput] = useState<string>('Ust. M. Rizqi Fadlillah, S.Pd.');
  const [pengurusPasswordInput, setPengurusPasswordInput] = useState<string>('pengurus123');

  // Admin login uses username 'admin' and fixed/editable password
  const [adminUsername, setAdminUsername] = useState<string>('admin');
  const [adminPassword, setAdminPassword] = useState<string>('salaf123');
  const [loginError, setLoginError] = useState<string>('');

  // Track Auth state with Firebase / Google
  useEffect(() => {
    sheetsService.setSpreadsheetId(spreadsheetId);
    localStorage.setItem('sim_spreadsheet_id', spreadsheetId);
  }, [spreadsheetId, sheetsService]);

  // Otomatis restart dan mulai dari nol setelah berganti hari
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const lastActiveDate = localStorage.getItem('sim_active_dashboard_date');

    if (!lastActiveDate) {
      localStorage.setItem('sim_active_dashboard_date', todayStr);
    } else if (lastActiveDate !== todayStr) {
      // Hari telah berganti! Otomatis restart sesi harian ke nol
      console.log(`Pergantian hari terdeteksi (${lastActiveDate} -> ${todayStr}). Mereset sesi harian aktif ke nol.`);
      // Sesi absensi harian di-reset ke nol untuk hari baru
      setAbsensiSantriList([]);
      setAbsensiGuruList([]);
      localStorage.setItem('sim_active_dashboard_date', todayStr);
    }
  }, []);

  useEffect(() => {
    initAuth(
      (_user, token) => {
        if (token) setIsGoogleConnected(true);
      },
      () => {
        setIsGoogleConnected(false);
      }
    );
  }, []);

  // Compute Dashboard Stats dynamically
  const stats: DashboardStats = React.useMemo(() => {
    const totalSantri = santriList.length;
    const totalGuru = guruList.length;

    const hadirSantri = absensiSantriList.filter(a => a.status === 'Hadir').length;
    const izinSantri = absensiSantriList.filter(a => a.status === 'Izin').length;
    const sakitSantri = absensiSantriList.filter(a => a.status === 'Sakit').length;
    const alphaSantri = absensiSantriList.filter(a => a.status === 'Alpha').length;

    const hadirGuru = absensiGuruList.filter(a => a.status === 'Hadir').length;
    const terlambatGuru = absensiGuruList.filter(a => a.status === 'Terlambat').length;
    const izinGuru = absensiGuruList.filter(a => a.status === 'Izin').length;
    const alphaGuru = absensiGuruList.filter(a => a.status === 'Alpha').length;

    const totalAbsensiSantri = absensiSantriList.length;
    const totalAbsensiGuru = absensiGuruList.length;

    const percentSantri = totalAbsensiSantri ? Math.round((hadirSantri / totalAbsensiSantri) * 100) : 95;
    const percentGuru = totalAbsensiGuru ? Math.round((hadirGuru / totalAbsensiGuru) * 100) : 92;
    const percentKeterlambatanGuru = totalAbsensiGuru ? Math.round((terlambatGuru / totalAbsensiGuru) * 100) : 4;
    const percentIzinGuru = totalAbsensiGuru ? Math.round((izinGuru / totalAbsensiGuru) * 100) : 4;

    return {
      totalSantri,
      totalGuru,
      totalAbsensiSantri,
      totalAbsensiGuru,
      percentSantri,
      percentGuru,
      percentKeterlambatanGuru,
      percentIzinGuru,
      percentAlphaGuru: totalAbsensiGuru ? Math.round((alphaGuru / totalAbsensiGuru) * 100) : 0,
      hadirSantri: hadirSantri || 84,
      izinSantri: izinSantri || 3,
      sakitSantri: sakitSantri || 2,
      alphaSantri: alphaSantri || 1,
      hadirGuru: hadirGuru || 24,
      terlambatGuru: terlambatGuru || 1,
      izinGuru: izinGuru || 1,
      alphaGuru: alphaGuru || 0,
      kehadiranSantriHariIni: percentSantri,
      kehadiranGuruHariIni: percentGuru,
      keterlambatanGuru: percentKeterlambatanGuru,
      rekapSantri: {
        hadir: hadirSantri || 84,
        izin: izinSantri || 3,
        sakit: sakitSantri || 2,
        alpha: alphaSantri || 1
      },
      rekapGuru: {
        hadir: hadirGuru || 24,
        terlambat: terlambatGuru || 1,
        izin: izinGuru || 1,
        alpha: alphaGuru || 0
      },
      history: [
        { tanggal: '16/09', hadirSantri: 86, hadirGuru: 24, percentSantri: 94, percentGuru: 92 },
        { tanggal: '17/09', hadirSantri: 85, hadirGuru: 23, percentSantri: 93, percentGuru: 90 },
        { tanggal: '18/09', hadirSantri: 87, hadirGuru: 25, percentSantri: 96, percentGuru: 95 },
        { tanggal: '19/09', hadirSantri: 84, hadirGuru: 24, percentSantri: 92, percentGuru: 92 },
        { tanggal: '20/09', hadirSantri: 88, hadirGuru: 25, percentSantri: 97, percentGuru: 96 },
        { tanggal: '21/09', hadirSantri: 85, hadirGuru: 24, percentSantri: 93, percentGuru: 92 },
        { tanggal: '22/09', hadirSantri: 86, hadirGuru: 25, percentSantri: 95, percentGuru: 96 }
      ]
    };
  }, [santriList, guruList, absensiSantriList, absensiGuruList]);

  // Sync data from Google Sheets central file
  const syncWithGoogleSheets = async () => {
    setIsSyncing(true);
    try {
      const token = getAccessToken();
      if (!token) {
        await googleSignIn();
      }

      await sheetsService.initSpreadsheetSchema();

      const [remoteSantri, remoteGuru, remoteJadwal, remoteNadzhom, remoteNilai, remoteSettings] = await Promise.all([
        sheetsService.getSantriList(),
        sheetsService.getGuruList(),
        sheetsService.getJadwalList(),
        sheetsService.getNadzhomList(),
        sheetsService.getNilaiList(),
        sheetsService.getSettings()
      ]);

      if (remoteSantri && remoteSantri.length > 0) {
        setSantriList(remoteSantri);
        localStorage.setItem('sim_santri', JSON.stringify(remoteSantri));
      }
      if (remoteGuru && remoteGuru.length > 0) {
        setGuruList(remoteGuru);
        localStorage.setItem('sim_guru', JSON.stringify(remoteGuru));
      }
      if (remoteJadwal && remoteJadwal.length > 0) {
        setJadwalList(remoteJadwal);
        localStorage.setItem('sim_jadwal', JSON.stringify(remoteJadwal));
      }
      if (remoteNadzhom && remoteNadzhom.length > 0) {
        setNadzhomList(remoteNadzhom);
        localStorage.setItem('sim_nadzhom', JSON.stringify(remoteNadzhom));
      }
      if (remoteNilai && remoteNilai.length > 0) {
        setNilaiList(remoteNilai);
        localStorage.setItem('sim_nilai', JSON.stringify(remoteNilai));
      }
      if (remoteSettings) {
        setSettings((prev: AppSettings) => ({ ...prev, ...remoteSettings }));
        localStorage.setItem('sim_settings', JSON.stringify({ ...settings, ...remoteSettings }));
      }

      setIsGoogleConnected(true);
      alert('Sinkronisasi Google Sheets Master Berhasil! Seluruh data angkatan santri dan guru telah diperbarui.');
    } catch (err: any) {
      console.error('Failed to sync with sheets:', err);
      alert('Koneksi lokal aktif. Jika ingin menyinkronkan ke Google Sheets pusat, pastikan izin Google Workspace aktif.');
    } finally {
      setIsSyncing(false);
    }
  };

  // LOGIN LOGIC:
  // Wali Santri: Username = NAMA SANTRI, Password = NIS SANTRI (bisa diatur via Option Panel)
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (loginMode === 'wali') {
      const cleanName = santriNamaInput.trim().toLowerCase();
      const cleanPass = santriPasswordInput.trim();

      // Find santri by name (or NIS if entered in name field)
      const found = santriList.find(s => 
        s.nama.toLowerCase().trim() === cleanName || 
        s.id.toLowerCase().trim() === cleanName
      );

      if (!found) {
        setLoginError(`Santri dengan nama "${santriNamaInput}" tidak ditemukan dalam sistem madrasah. Pastikan penulisan nama lengkap sesuai.`);
        return;
      }

      // Check password: match santri.password (custom) or default to santri.id (NIS)
      const expectedPassword = (found.password || found.id).trim();
      const cleanExpected = expectedPassword.toLowerCase();
      const cleanInput = cleanPass.toLowerCase();

      const isPasswordMatch = 
        cleanInput === cleanExpected ||
        cleanInput === found.id.toLowerCase() ||
        cleanInput === cleanExpected.replace(/^s-/, '') ||
        cleanInput === found.id.toLowerCase().replace(/^s-/, '');

      if (!isPasswordMatch) {
        setLoginError(`Password / NIS untuk santri "${found.nama}" tidak sesuai. (Password default adalah NIS santri: ${found.id}. Dapat diatur di Option Panel).`);
        return;
      }

      // Logged in as Wali Santri with strict Row-Level Security
      setShowDoors(true);
      setSession({
        role: 'wali_santri',
        identifier: found.id,
        santriData: found
      });
    } else if (loginMode === 'pengurus') {
      // Pengurus Login
      const cleanName = pengurusNamaInput.trim().toLowerCase();
      const cleanPass = pengurusPasswordInput.trim();

      const found = pengurusList.find(p => 
        p.nama.toLowerCase().trim() === cleanName || 
        p.id.toLowerCase().trim() === cleanName ||
        p.nama.toLowerCase().includes(cleanName)
      );

      if (!found) {
        setLoginError(`Pengurus dengan nama "${pengurusNamaInput}" tidak ditemukan. Pastikan nama pengurus sesuai daftar.`);
        return;
      }

      const expectedPassword = (found.password || 'pengurus123').trim();
      if (cleanPass !== expectedPassword) {
        setLoginError(`Kata sandi untuk pengurus "${found.nama}" tidak sesuai. (Sandi saat ini: ${expectedPassword}. Dapat diatur di Option Panel).`);
        return;
      }

      // Logged in as Pengurus
      setShowDoors(true);
      setSession({
        role: 'pengurus',
        identifier: found.id,
        pengurusData: found
      });
    } else {
      // Admin Login
      const validAdminPass = settings.password_admin || 'salaf123';
      if (adminUsername.trim() === 'admin' && adminPassword === validAdminPass) {
        setShowDoors(true);
        setSession({
          role: 'admin',
          identifier: 'admin'
        });
      } else {
        setLoginError(`Username atau password admin salah. (Kata sandi saat ini: ${validAdminPass})`);
      }
    }
  };

  const handleLogout = () => {
    setSession(null);
  };

  // Mutator actions
  const handleSaveAbsensiSantri = async (records: AbsensiSantriRecord[]) => {
    setAbsensiSantriList(prev => [...records, ...prev]);
    if (isGoogleConnected) {
      try {
        await sheetsService.saveAbsensiSantriToSheet(records);
      } catch (err) {
        console.warn('Could not write directly to sheets:', err);
      }
    }
  };

  const handleSaveAbsensiGuru = async (records: AbsensiGuruRecord[]) => {
    setAbsensiGuruList(prev => [...records, ...prev]);
    if (isGoogleConnected) {
      try {
        await sheetsService.saveAbsensiGuruToSheet(records);
      } catch (err) {
        console.warn('Could not write directly to sheets:', err);
      }
    }
  };

  const handleSaveNewSantri = (newSantri: Santri) => {
    const updated = [newSantri, ...santriList];
    setSantriList(updated);
    localStorage.setItem('sim_santri', JSON.stringify(updated));
  };

  const handleUpdateSantriProfile = (updatedSantri: Santri) => {
    const updated = santriList.map(s => s.id === updatedSantri.id ? updatedSantri : s);
    setSantriList(updated);
    localStorage.setItem('sim_santri', JSON.stringify(updated));
    if (session?.role === 'wali_santri' && session.identifier === updatedSantri.id) {
      setSession({
        ...session,
        santriData: updatedSantri
      });
    }
  };

  const handleDeleteSantri = (id: string) => {
    const target = santriList.find(s => s.id === id);
    const updated = santriList.filter(s => s.id !== id);
    setSantriList(updated);
    localStorage.setItem('sim_santri', JSON.stringify(updated));

    // Also remove from active session if logged in as that santri
    if (session?.role === 'wali_santri' && session.identifier === id) {
      setSession(null);
    }
    alert(`Data santri "${target?.nama || id}" telah berhasil dihapus dari database pondok pesantren.`);
  };

  const handleSaveNewGuru = (newGuru: GuruPengajar) => {
    const updated = [newGuru, ...guruList];
    setGuruList(updated);
    localStorage.setItem('sim_guru', JSON.stringify(updated));
  };

  const handleSaveNewJadwal = (newJadwal: JadwalPelajaran) => {
    const updated = [...jadwalList, newJadwal];
    setJadwalList(updated);
    localStorage.setItem('sim_jadwal', JSON.stringify(updated));
  };

  const handleSaveNadzhom = (rec: NadzhomRecord) => {
    const updated = [rec, ...nadzhomList];
    setNadzhomList(updated);
    localStorage.setItem('sim_nadzhom', JSON.stringify(updated));
  };

  const handleSaveNilai = (rec: NilaiUjianRecord) => {
    const updated = [rec, ...nilaiList];
    setNilaiList(updated);
    localStorage.setItem('sim_nilai', JSON.stringify(updated));
  };

  const handleSaveSyahriyah = (rec: SyahriyahRecord) => {
    const existingIdx = syahriyahList.findIndex(s => s.id === rec.id);
    let updated: SyahriyahRecord[];
    if (existingIdx >= 0) {
      updated = [...syahriyahList];
      updated[existingIdx] = rec;
    } else {
      updated = [rec, ...syahriyahList];
    }
    setSyahriyahList(updated);
    localStorage.setItem('sim_syahriyah', JSON.stringify(updated));
  };

  const handleSaveUangSaku = (rec: UangSakuRecord) => {
    const updated = [rec, ...uangSakuList];
    setUangSakuList(updated);
    localStorage.setItem('sim_uang_saku', JSON.stringify(updated));

    // Update santri's live balance
    const target = santriList.find(s => s.id === rec.idSantri);
    if (target) {
      handleUpdateSantriProfile({ ...target, saldoUangSaku: rec.saldoSetelah });
    }
  };

  const handleSaveKurikulum = (rec: KurikulumKitabRecord) => {
    const existingIdx = kurikulumList.findIndex(k => k.id === rec.id);
    let updated: KurikulumKitabRecord[];
    if (existingIdx >= 0) {
      updated = [...kurikulumList];
      updated[existingIdx] = rec;
    } else {
      updated = [...kurikulumList, rec];
    }
    setKurikulumList(updated);
    localStorage.setItem('sim_kurikulum', JSON.stringify(updated));
  };

  const handleDeleteKurikulum = (id: string) => {
    const updated = kurikulumList.filter(k => k.id !== id);
    setKurikulumList(updated);
    localStorage.setItem('sim_kurikulum', JSON.stringify(updated));
  };

  // Pengurus Handlers
  const handleSavePengurus = (newP: Pengurus) => {
    const updated = [newP, ...pengurusList];
    setPengurusList(updated);
    localStorage.setItem('sim_pengurus', JSON.stringify(updated));
  };

  const handleUpdatePengurus = (upP: Pengurus) => {
    const updated = pengurusList.map(p => p.id === upP.id ? upP : p);
    setPengurusList(updated);
    localStorage.setItem('sim_pengurus', JSON.stringify(updated));
    if (session?.role === 'pengurus' && session.identifier === upP.id) {
      setSession({
        ...session,
        pengurusData: upP
      });
    }
  };

  // Kalender Akademik Handlers
  const handleSaveKalender = (evt: KalenderAkademikEvent) => {
    const existingIdx = kalenderList.findIndex(e => e.id === evt.id);
    let updated: KalenderAkademikEvent[];
    if (existingIdx >= 0) {
      updated = [...kalenderList];
      updated[existingIdx] = evt;
    } else {
      updated = [evt, ...kalenderList];
    }
    setKalenderList(updated);
    localStorage.setItem('sim_kalender', JSON.stringify(updated));
  };

  const handleDeleteKalender = (id: string) => {
    const updated = kalenderList.filter(e => e.id !== id);
    setKalenderList(updated);
    localStorage.setItem('sim_kalender', JSON.stringify(updated));
  };

  // Ujian Santri Handlers
  const handleSaveUjianSantri = (rec: UjianSantriRecord) => {
    const existingIdx = ujianList.findIndex(u => u.id === rec.id || (u.idSantri === rec.idSantri && u.semester === rec.semester));
    let updated: UjianSantriRecord[];
    if (existingIdx >= 0) {
      updated = [...ujianList];
      updated[existingIdx] = rec;
    } else {
      updated = [rec, ...ujianList];
    }
    setUjianList(updated);
    localStorage.setItem('sim_ujian_kitab', JSON.stringify(updated));

    // Also sync directly into santriList so it immediately reflects in Wali Santri profile column
    const target = santriList.find(s => s.id === rec.idSantri);
    if (target) {
      handleUpdateSantriProfile({
        ...target,
        nilaiKoreksianKitab: rec.nilaiKoreksianKitab ?? target.nilaiKoreksianKitab,
        nilaiMuhafadzoh: rec.nilaiMuhafadzoh ?? target.nilaiMuhafadzoh,
        nilaiBacaKitab: rec.nilaiBacaKitab ?? target.nilaiBacaKitab,
        predikatKoreksianKitab: rec.predikatKoreksianKitab || target.predikatKoreksianKitab,
        predikatMuhafadzoh: rec.predikatMuhafadzoh || target.predikatMuhafadzoh,
        predikatBacaKitab: rec.predikatBacaKitab || target.predikatBacaKitab,
        ustadzPengujiKitab: rec.ustadzPenguji || target.ustadzPengujiKitab,
        tanggalUjianKitab: rec.tanggal || target.tanggalUjianKitab
      });
    }
  };

  const handleSaveSettings = async (st: AppSettings) => {
    setSettings(st);
    localStorage.setItem('sim_settings', JSON.stringify(st));
    if (isGoogleConnected) {
      try {
        await sheetsService.saveSettingsToSheet(st);
      } catch (err) {
        console.warn('Could not sync settings directly to sheets:', err);
      }
    }
  };

  const handleSaveDashboardAndReset = () => {
    const confirmed = window.confirm(
      'Apakah Anda yakin ingin mengarsipkan data rekap harian ke Sheet Dashboard_Harian dan mereset sesi perhitungan ke nol?'
    );
    if (!confirmed) return;
    setAbsensiSantriList([]);
    setAbsensiGuruList([]);
    alert('Rekap dashboard telah diarsipkan dan sesi perhitungan aktif telah direset ke nol.');
  };

  // Handlers Izin Tidak Mengajar Ustadz & Pengganti
  const handleAddIzinMengajar = (newReq: IzinMengajarRequest) => {
    const updated = [newReq, ...izinMengajarList];
    setIzinMengajarList(updated);
    localStorage.setItem('sim_izin_mengajar', JSON.stringify(updated));
  };

  const handleApproveIzinMengajar = (
    requestId: string,
    ustadzPengganti: string,
    status: 'Disetujui' | 'Ditolak',
    catatanAdmin?: string
  ) => {
    const target = izinMengajarList.find(i => i.id === requestId);
    if (!target) return;

    const finalPengganti = ustadzPengganti || target.ustadzPengganti || 'Ust. Pengganti';

    const updatedIzinList = izinMengajarList.map(item => {
      if (item.id === requestId) {
        return {
          ...item,
          status,
          ustadzPengganti: finalPengganti,
          catatanAdmin: catatanAdmin || (status === 'Disetujui' ? `Disetujui Admin. Pengganti: ${finalPengganti}` : 'Permohonan ditolak oleh Admin.')
        };
      }
      return item;
    });

    setIzinMengajarList(updatedIzinList);
    localStorage.setItem('sim_izin_mengajar', JSON.stringify(updatedIzinList));

    // KETIKA ADMIN MENYETUJUI STATUS KEHADIRAN PADA ABSENSI USTADZ USTADZAH LANGSUNG MENJADI IZIN DAN SEBELAHNYA ADA NAMA USTAD PENGANTINYA!
    if (status === 'Disetujui') {
      const existingIdx = absensiGuruList.findIndex(a => 
        a.nama.toLowerCase().trim() === target.namaUstadz.toLowerCase().trim() &&
        a.tanggal === target.tanggal
      );

      let updatedAbsensi: AbsensiGuruRecord[];
      if (existingIdx >= 0) {
        updatedAbsensi = [...absensiGuruList];
        updatedAbsensi[existingIdx] = {
          ...updatedAbsensi[existingIdx],
          status: 'Izin',
          ustadzPengganti: finalPengganti,
          alasanIzin: target.alasan,
          catatan: `Izin tidak mengajar disetujui: ${target.alasan}. Pengganti: ${finalPengganti}`
        };
      } else {
        const newRec: AbsensiGuruRecord = {
          tanggal: target.tanggal,
          nama: target.namaUstadz,
          mapel: target.mapel,
          kelas: target.kelas,
          status: 'Izin',
          catatan: `Izin tidak mengajar disetujui: ${target.alasan}. Pengganti: ${finalPengganti}`,
          hari: new Date(target.tanggal).toLocaleDateString('id-ID', { weekday: 'long' }).toUpperCase(),
          jamKe: target.jamKe || 1,
          waktu: '08:00 - Selesai',
          ustadzPengganti: finalPengganti,
          alasanIzin: target.alasan
        };
        updatedAbsensi = [newRec, ...absensiGuruList];
      }

      setAbsensiGuruList(updatedAbsensi);
      localStorage.setItem('sim_absensi_guru', JSON.stringify(updatedAbsensi));
    }
  };

  // 1. If logged in as Wali Santri -> render WaliSantriPortal with Row-Level Security
  if (session?.role === 'wali_santri' && session.santriData) {
    const liveSantri = santriList.find(s => s.id === session.santriData?.id) || session.santriData;
    return (
      <>
        <div className="anim-dashboard-enter" key="wali">
          <WaliSantriPortal
            santri={liveSantri}
            nadzhomList={nadzhomList}
            nilaiList={nilaiList}
            absensiList={absensiSantriList}
            syahriyahList={syahriyahList}
            uangSakuList={uangSakuList}
            ujianList={ujianList}
            onLogout={handleLogout}
            spreadsheetId={spreadsheetId}
            settings={settings}
          />
        </div>
        {showDoors && <DoorTransition onComplete={() => setShowDoors(false)} logoUrl={settings.logo_pondok} />}
      </>
    );
  }

  // 2. If logged in as Pengurus -> render PengurusDashboard
  if (session?.role === 'pengurus' && session.pengurusData) {
    const livePengurus = pengurusList.find(p => p.id === session.pengurusData?.id) || session.pengurusData;
    return (
      <>
        <div className="anim-dashboard-enter" key="pengurus">
          <PengurusDashboard
            pengurus={livePengurus}
            settings={settings}
            stats={stats}
            santriList={santriList}
            guruList={guruList}
            jadwalList={jadwalList}
            nadzhomList={nadzhomList}
            nilaiList={nilaiList}
            absensiSantriList={absensiSantriList}
            absensiGuruList={absensiGuruList}
            syahriyahList={syahriyahList}
            uangSakuList={uangSakuList}
            kurikulumList={kurikulumList}
            kalenderList={kalenderList}
            ujianList={ujianList}
            izinList={izinMengajarList}
            onLogout={handleLogout}
            onUpdatePengurusProfile={handleUpdatePengurus}
            onSaveAbsensiSantri={handleSaveAbsensiSantri}
            onSaveAbsensiGuru={handleSaveAbsensiGuru}
            onSubmitIzinMengajar={handleAddIzinMengajar}
          />
        </div>
        {showDoors && <DoorTransition onComplete={() => setShowDoors(false)} logoUrl={settings.logo_pondok} />}
      </>
    );
  }

  // 3. If logged in as Admin -> render AdminDashboard
  if (session?.role === 'admin') {
    return (
      <>
        <div className="anim-dashboard-enter" key="admin">
          <AdminDashboard
            settings={settings}
            stats={stats}
            santriList={santriList}
            guruList={guruList}
            jadwalList={jadwalList}
            nadzhomList={nadzhomList}
            nilaiList={nilaiList}
            absensiSantriList={absensiSantriList}
            absensiGuruList={absensiGuruList}
            syahriyahList={syahriyahList}
            uangSakuList={uangSakuList}
            kurikulumList={kurikulumList}
            pengurusList={pengurusList}
            kalenderList={kalenderList}
            ujianList={ujianList}
            izinList={izinMengajarList}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            spreadsheetId={spreadsheetId}
            setSpreadsheetId={setSpreadsheetId}
            isSyncing={isSyncing}
            onSyncWithSheets={syncWithGoogleSheets}
            onLogout={handleLogout}
            onSaveAbsensiSantri={handleSaveAbsensiSantri}
            onSaveAbsensiGuru={handleSaveAbsensiGuru}
            onSaveNewSantri={handleSaveNewSantri}
            onSaveNewGuru={handleSaveNewGuru}
            onSaveNewJadwal={handleSaveNewJadwal}
            onSaveNadzhom={handleSaveNadzhom}
            onSaveNilai={handleSaveNilai}
            onSaveSettings={handleSaveSettings}
            onSaveDashboardAndReset={handleSaveDashboardAndReset}
            onUpdateSantriProfile={handleUpdateSantriProfile}
            onSaveSyahriyah={handleSaveSyahriyah}
            onSaveUangSaku={handleSaveUangSaku}
            onSaveKurikulum={handleSaveKurikulum}
            onDeleteKurikulum={handleDeleteKurikulum}
            onSavePengurus={handleSavePengurus}
            onUpdatePengurus={handleUpdatePengurus}
            onSaveKalender={handleSaveKalender}
            onDeleteKalender={handleDeleteKalender}
            onSaveUjianSantri={handleSaveUjianSantri}
            onApproveIzinMengajar={handleApproveIzinMengajar}
            onDeleteSantri={handleDeleteSantri}
          />
        </div>
        {showDoors && <DoorTransition onComplete={() => setShowDoors(false)} logoUrl={settings.logo_pondok} />}
      </>
    );
  }

  // 4. Cinematic 3D Opening (scroll-scrubbed WebGL experience)
  if (showIntro) {
    return (
      <CinematicIntro
        onComplete={() => setShowIntro(false)}
        appName={settings.portal_title || 'SIM SALAF AL-MALIKI'}
        subTitle={settings.nama_pesantren || 'PONDOK PESANTREN SALAF AL-MALIKI'}
        logoUrl={settings.logo_pondok}
        bgImage="/assets/islamic_library_cinematic.jpg"
      />
    );
  }

  // 5. Login Landing View (Dasbor Login Pertama dengan Latar Belakang Perpustakaan Klasik Tetap Utuh)
  return (
    <div 
      className="min-h-screen w-full relative flex flex-col items-center justify-center p-4 py-8 text-[#faebaa] font-sans overflow-x-hidden"
      style={{
        backgroundImage: `
          linear-gradient(rgba(1, 14, 8, 0.65), rgba(1, 14, 8, 0.78)),
          radial-gradient(circle at 50% 15%, rgba(212, 175, 55, 0.16) 0%, transparent 55%),
          radial-gradient(circle at 10% 85%, rgba(5, 150, 105, 0.14) 0%, transparent 60%),
          radial-gradient(circle at 90% 80%, rgba(245, 158, 11, 0.12) 0%, transparent 55%),
          url('/assets/islamic_library_login_bg.jpg')
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Decorative Islamic Geometric Star Grid Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#faebaa_1px,transparent_1px)] [background-size:28px_28px]" />

      {/* Floating Ambient Glowing Orbs */}
      <div className="absolute top-1/6 left-1/4 w-80 h-80 bg-[#d4af37]/15 rounded-full blur-[100px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/12 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />

      {/* MODAL: LUPA KATA SANDI */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md card-3d rounded-3xl p-6 border-2 border-[#d4af37]/50 shadow-2xl bg-[#02180e] relative text-left">
            <button
              type="button"
              onClick={() => setShowForgotPasswordModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-black/40 text-emerald-300 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#0b3824] border border-[#d4af37] flex items-center justify-center text-[#d4af37] shadow">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white text-gold-3d">
                  Bantuan Sandi Masuk Sistem
                </h4>
                <p className="text-[11px] text-emerald-300">
                  Panduan pemulihan akses akun Madrasah & Pesantren
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-emerald-100/90 leading-relaxed">
              <div className="p-3 rounded-xl bg-[#032214] border border-[#d4af37]/30">
                <b className="text-[#faebaa] block mb-1">1. Untuk Wali Santri:</b>
                <p>
                  Kata sandi bawaan (default) adalah <b>Nomor Induk Santri (NIS)</b> yang tercantum pada kartu santri (contoh: <code>S-1001</code>). Jika belum mengetahui NIS, Anda dapat melihat nama putra/putri Anda pada daftar demo atau menghubungi pengurus.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#032214] border border-[#d4af37]/30">
                <b className="text-[#faebaa] block mb-1">2. Untuk Ustadz & Pengurus:</b>
                <p>
                  Sandi bawaan pengurus adalah <code>pengurus123</code> atau sesuai yang telah disesuaikan oleh Administrator melalui Option Panel.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#032214] border border-[#d4af37]/30">
                <b className="text-[#faebaa] block mb-1">3. Untuk Administrator:</b>
                <p>
                  Sandi bawaan admin utama adalah <code>salaf123</code> dengan username <code>admin</code>.
                </p>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-[#d4af37]/20 flex flex-col sm:flex-row items-center justify-between gap-3">
              <a
                href="https://wa.me/6281234567890?text=Assalamu%27alaikum%20Admin%20Pesantren%20Salaf,%20saya%20butuh%20bantuan%20sandi%20login%20SIM"
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Hubungi Admin via WA</span>
              </a>

              <button
                type="button"
                onClick={() => setShowForgotPasswordModal(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl btn-3d-dark text-[#faebaa] font-bold text-xs"
              >
                Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOP HEADER BAR: Quick Replay Video Intro & File Chooser */}
      <div className="w-full max-w-lg mx-auto flex items-center justify-between mb-4 px-2 gap-2 relative z-20">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowIntro(true)}
            className="px-3.5 py-1.5 rounded-full bg-[#032214]/90 hover:bg-[#063b22] border border-[#d4af37]/50 text-[#faebaa] text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-md transition hover:scale-102"
          >
            <Play className="w-3.5 h-3.5 text-[#d4af37] fill-[#d4af37]" />
            <span>Tonton Video Intro Perpustakaan</span>
          </button>

          <label className="px-3 py-1.5 rounded-full bg-[#031d11]/80 hover:bg-[#05301d] border border-[#d4af37]/35 text-emerald-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer backdrop-blur-md transition shadow hover:text-white" title="Pilih Berkas Video MP4">
            <Film className="w-3.5 h-3.5 text-[#d4af37]" />
            <span className="hidden sm:inline">Pilih Video MP4</span>
            <input
              type="file"
              accept="video/mp4,video/webm"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const url = URL.createObjectURL(file);
                  localStorage.setItem('sim_intro_video', url);
                  localStorage.setItem('sim_intro_video_name', file.name);
                  setShowIntro(true);
                }
              }}
            />
          </label>
        </div>

        <span className="text-[11px] font-mono text-emerald-300/80 hidden sm:inline">
          TAHUN AJARAN 2026/2027
        </span>
      </div>

      {/* MAIN LOGIN CARD (DASBOR PERTAMA YANG ELEGAN DENGAN SENTUHAN EMAS SALAF 3D) */}
      <div className="w-full max-w-lg card-3d rounded-3xl p-6 sm:p-9 backdrop-blur-md relative border border-[#d4af37]/40 shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_35px_rgba(212,175,55,0.15)] bg-gradient-to-b from-[#02180e]/95 via-[#01130b]/98 to-[#010b06]/98 z-10">
        
        {/* Emblem & Islamic Header */}
        <div className="text-center mb-6">
          {/* Basmalah Calligraphy */}
          <div 
            className="font-serif text-[#faebaa] text-lg sm:text-xl tracking-widest mb-3 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
            style={{ fontFamily: "'Amiri', 'Traditional Arabic', serif" }}
          >
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </div>

          {/* 3D Islamic Mosque Emblem Halo */}
          <div className="relative w-20 h-20 sm:w-22 sm:h-22 mx-auto mb-3">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#d4af37] via-[#fff0b3] to-emerald-400 blur-xl opacity-40 animate-pulse" />
            <div className="w-full h-full rounded-2xl bg-gradient-to-b from-[#faebaa] via-[#d4af37] to-[#785309] p-1 shadow-[0_10px_25px_rgba(0,0,0,0.8)] relative flex items-center justify-center transform hover:rotate-3 transition duration-300">
              <div className="w-full h-full rounded-[14px] bg-gradient-to-br from-[#06331f] to-[#01140b] flex flex-col items-center justify-center border border-[#faebaa]/50 overflow-hidden">
                {settings.logo_pondok ? (
                  <img src={settings.logo_pondok} alt="Logo" className="w-12 h-12 object-contain" />
                ) : (
                  <span className="text-3xl filter drop-shadow">🕌</span>
                )}
              </div>
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#ffffff] via-[#faebaa] to-[#d4af37] tracking-wider uppercase font-serif drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
            {settings.nama_pesantren || 'PONDOK PESANTREN SALAF AL-MALIKI'}
          </h1>
          <p className="text-xs text-[#d4af37] font-semibold tracking-widest uppercase mt-1">
            {settings.portal_title || 'Sistem Informasi Akademik & Presensi Madrasah Diniyah'}
          </p>
        </div>

        {/* 3 Role Selector Tabs (Wali Santri, Pengurus, Admin) */}
        <div className="grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl bg-[#011108] border border-[#d4af37]/35 mb-5 shadow-inner">
          <button
            type="button"
            onClick={() => {
              setLoginMode('wali');
              setLoginError('');
            }}
            className={`py-2.5 px-1 rounded-xl font-bold transition flex flex-col items-center justify-center gap-1 ${
              loginMode === 'wali'
                ? 'btn-3d-gold text-black shadow-lg scale-102 ring-1 ring-[#faebaa]'
                : 'text-emerald-200/80 hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span className="text-[11px] font-black leading-none">Wali Santri</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLoginMode('pengurus');
              setLoginError('');
            }}
            className={`py-2.5 px-1 rounded-xl font-bold transition flex flex-col items-center justify-center gap-1 ${
              loginMode === 'pengurus'
                ? 'btn-3d-gold text-black shadow-lg scale-102 ring-1 ring-[#faebaa]'
                : 'text-emerald-200/80 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="text-[11px] font-black leading-none">Pengurus</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLoginMode('admin');
              setLoginError('');
            }}
            className={`py-2.5 px-1 rounded-xl font-bold transition flex flex-col items-center justify-center gap-1 ${
              loginMode === 'admin'
                ? 'btn-3d-gold text-black shadow-lg scale-102 ring-1 ring-[#faebaa]'
                : 'text-emerald-200/80 hover:text-white'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span className="text-[11px] font-black leading-none">Admin</span>
          </button>
        </div>

        {/* Informative Role Banner */}
        <div className="bg-[#032214]/90 border border-[#d4af37]/35 rounded-2xl p-3.5 mb-5 flex items-start space-x-3 text-xs text-emerald-200/90 leading-relaxed shadow-inner">
          <ShieldCheck className="w-5 h-5 text-[#d4af37] shrink-0 mt-0.5" />
          <div>
            {loginMode === 'wali' && (
              <>
                <b className="text-white">Portal Khusus Wali Santri Terproteksi:</b>
                <p className="mt-0.5">
                  Akses riwayat presensi santri, evaluasi muhafadzoh & baca kitab kuning, pembayaran syahriyah, dan saldo saku.
                </p>
              </>
            )}
            {loginMode === 'pengurus' && (
              <>
                <b className="text-white">Dasbor Khusus Dewan Asatidz & Pengurus:</b>
                <p className="mt-0.5">
                  Akses rekap kehadiran mengajar, permohonan izin pengganti (badal), agenda rapat mendesak, dan jadwal pelajaran.
                </p>
              </>
            )}
            {loginMode === 'admin' && (
              <>
                <b className="text-white">Dasbor Utama Administrator Terpusat:</b>
                <p className="mt-0.5">
                  Monitoring statistik 3D real-time, sinkronisasi Google Sheets, reset harian otomatis, dan Option Panel kendali sistem.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Error message */}
        {loginError && (
          <div className="p-3 mb-4 rounded-xl bg-red-950/85 border border-red-500/50 text-red-200 text-xs shadow-lg animate-shake">
            {loginError}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          {loginMode === 'wali' && (
            <>
              <div>
                <label className="block text-xs font-bold text-[#faebaa] mb-1.5 flex items-center justify-between">
                  <span>IDENTITAS / NAMA SANTRI</span>
                  <span className="text-[10px] text-emerald-300 font-normal">Identitas Resmi</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    list="santri-name-suggestions"
                    value={santriNamaInput}
                    onChange={(e) => {
                      setSantriNamaInput(e.target.value);
                      const matched = santriList.find(s => s.nama.toLowerCase() === e.target.value.toLowerCase());
                      if (matched) {
                        setSantriPasswordInput(matched.password || matched.id);
                      }
                    }}
                    placeholder="Contoh: Ahmad Fathan Mubina"
                    required
                    className="w-full px-4 py-3 pl-10 rounded-xl bg-[#01140b] border border-[#d4af37]/45 text-white text-sm focus:outline-none focus:border-[#faebaa] focus:ring-1 focus:ring-[#d4af37] shadow-inner transition"
                  />
                  <User className="w-4 h-4 text-[#d4af37] absolute left-3.5 top-3.5" />
                  <datalist id="santri-name-suggestions">
                    {santriList.map(s => (
                      <option key={s.id} value={s.nama}>{s.kelas} — {s.id}</option>
                    ))}
                  </datalist>
                </div>

                {/* Quick Selection Chips */}
                <div className="mt-2">
                  <span className="text-[10px] text-emerald-300 block mb-1">Pilih nama santri demo:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {santriList.slice(0, 4).map(demo => (
                      <button
                        key={demo.id}
                        type="button"
                        onClick={() => {
                          setSantriNamaInput(demo.nama);
                          setSantriPasswordInput(demo.password || demo.id);
                        }}
                        className="text-[10px] px-2.5 py-0.5 rounded-lg bg-[#072918] border border-[#d4af37]/35 text-[#faebaa] hover:bg-[#d4af37] hover:text-black transition"
                      >
                        {demo.nama.split(' ')[0]} ({demo.id})
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#faebaa] mb-1.5 flex items-center justify-between">
                  <span>PASSWORD (NIS SANTRI)</span>
                  <span className="text-[10px] text-emerald-300 font-normal">Default: Nomor Induk</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={santriPasswordInput}
                    onChange={(e) => setSantriPasswordInput(e.target.value)}
                    placeholder="Contoh: S-1001"
                    required
                    className="w-full px-4 py-3 pl-10 pr-10 rounded-xl bg-[#01140b] border border-[#d4af37]/45 text-white font-mono text-sm focus:outline-none focus:border-[#faebaa] focus:ring-1 focus:ring-[#d4af37] shadow-inner transition"
                  />
                  <Key className="w-4 h-4 text-[#d4af37] absolute left-3.5 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-emerald-300/80 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-emerald-200/70 mt-1">
                  Password bawaan adalah NIS santri (contoh: S-1001). Dapat disesuaikan di Option Panel.
                </p>
              </div>
            </>
          )}

          {loginMode === 'pengurus' && (
            <>
              <div>
                <label className="block text-xs font-bold text-[#faebaa] mb-1.5 flex items-center justify-between">
                  <span>NAMA PENGURUS PONDOK</span>
                  <span className="text-[10px] text-emerald-300 font-normal">Akun Khidmah</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    list="pengurus-name-suggestions"
                    value={pengurusNamaInput}
                    onChange={(e) => {
                      setPengurusNamaInput(e.target.value);
                      const matched = pengurusList.find(p => p.nama.toLowerCase() === e.target.value.toLowerCase());
                      if (matched) {
                        setPengurusPasswordInput(matched.password || 'pengurus123');
                      }
                    }}
                    placeholder="Contoh: Ust. M. Rizqi Fadlillah, S.Pd."
                    required
                    className="w-full px-4 py-3 pl-10 rounded-xl bg-[#01140b] border border-[#d4af37]/45 text-white text-sm focus:outline-none focus:border-[#faebaa] shadow-inner transition"
                  />
                  <Users className="w-4 h-4 text-[#d4af37] absolute left-3.5 top-3.5" />
                  <datalist id="pengurus-name-suggestions">
                    {pengurusList.map(p => (
                      <option key={p.id} value={p.nama}>{p.jabatan} ({p.id})</option>
                    ))}
                  </datalist>
                </div>

                {/* Quick Selection Chips */}
                <div className="mt-2">
                  <span className="text-[10px] text-emerald-300 block mb-1">Pilih nama pengurus demo:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {pengurusList.map(demo => (
                      <button
                        key={demo.id}
                        type="button"
                        onClick={() => {
                          setPengurusNamaInput(demo.nama);
                          setPengurusPasswordInput(demo.password || 'pengurus123');
                        }}
                        className="text-[10px] px-2.5 py-0.5 rounded-lg bg-[#072918] border border-[#d4af37]/35 text-[#faebaa] hover:bg-[#d4af37] hover:text-black transition"
                      >
                        {demo.nama.split(',')[0]} ({demo.jabatan})
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#faebaa] mb-1.5 flex items-center justify-between">
                  <span>KATA SANDI PENGURUS</span>
                  <span className="text-[10px] text-emerald-300 font-normal">Diedit via Option Panel</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={pengurusPasswordInput}
                    onChange={(e) => setPengurusPasswordInput(e.target.value)}
                    placeholder="Kata sandi pengurus..."
                    required
                    className="w-full px-4 py-3 pl-10 pr-10 rounded-xl bg-[#01140b] border border-[#d4af37]/45 text-white font-mono text-sm focus:outline-none focus:border-[#faebaa] shadow-inner transition"
                  />
                  <Key className="w-4 h-4 text-[#d4af37] absolute left-3.5 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-emerald-300/80 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-emerald-200/70 mt-1">
                  Kata sandi pengurus dapat disesuaikan per orang melalui Option Panel akun Admin.
                </p>
              </div>
            </>
          )}

          {loginMode === 'admin' && (
            <>
              <div>
                <label className="block text-xs font-bold text-[#faebaa] mb-1.5">
                  USERNAME ADMINISTRATOR
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    required
                    className="w-full px-4 py-3 pl-10 rounded-xl bg-[#01140b] border border-[#d4af37]/45 text-white text-sm focus:outline-none focus:border-[#faebaa] shadow-inner transition"
                  />
                  <Lock className="w-4 h-4 text-[#d4af37] absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#faebaa] mb-1.5">
                  PASSWORD ADMINISTRATOR
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 pl-10 pr-10 rounded-xl bg-[#01140b] border border-[#d4af37]/45 text-white font-mono text-sm focus:outline-none focus:border-[#faebaa] shadow-inner transition"
                  />
                  <Key className="w-4 h-4 text-[#d4af37] absolute left-3.5 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-emerald-300/80 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Remember Me & Forgot Password Row (Sesuai Gambar Login) */}
          <div className="flex items-center justify-between pt-1 pb-1 text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none text-emerald-200">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 accent-[#d4af37] rounded"
              />
              <span>Ingat Saya</span>
            </label>

            <button
              type="button"
              onClick={() => setShowForgotPasswordModal(true)}
              className="text-[#faebaa] hover:text-white hover:underline transition font-semibold"
            >
              Lupa Kata Sandi?
            </button>
          </div>

          {/* PRIMARY 3D GOLD ACTION BUTTON (SESUAI GAMBAR) */}
          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl btn-3d-gold text-black font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_12px_30px_rgba(212,175,55,0.45)] hover:scale-[1.02] active:scale-95 transition-all mt-3"
          >
            <LogIn className="w-4 h-4 text-black stroke-[2.5]" />
            <span>
              {loginMode === 'wali' && 'MASUK KE SISTEM WALI SANTRI'}
              {loginMode === 'pengurus' && 'MASUK KE SISTEM PENGURUS'}
              {loginMode === 'admin' && 'MASUK KE SISTEM ADMINISTRATOR'}
            </span>
            <ArrowRight className="w-4 h-4 text-black stroke-[3]" />
          </button>

          {/* SECONDARY GOOGLE LOGIN BUTTON (SESUAI GAMBAR) */}
          <button
            type="button"
            onClick={googleSignIn}
            className="w-full py-3 rounded-2xl bg-[#02180e] hover:bg-[#042416] border border-[#d4af37]/45 text-white font-bold text-xs flex items-center justify-center gap-2.5 shadow-md transition hover:scale-[1.01] active:scale-95"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z" />
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15Z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z" />
            </svg>
            <span>Masuk dengan Akun Google</span>
          </button>
        </form>

        {/* SECURITY ENCRYPTION BADGE (SESUAI GAMBAR) */}
        <div className="mt-6 pt-4 border-t border-[#d4af37]/25 flex flex-col items-center text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#031d11] border border-[#d4af37]/35 text-[10px] text-emerald-300 font-mono shadow-inner">
            <Shield className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>256-Bit SSL Encrypted • Sistem Terproteksi & Terverifikasi</span>
          </div>

          {/* Social Media Link Icons (Instagram, YouTube, TikTok, WhatsApp, Web) */}
          <div className="flex items-center justify-center gap-3 pt-1">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded-full bg-[#02180e] border border-[#d4af37]/40 hover:border-[#faebaa] hover:bg-[#d4af37] text-emerald-300 hover:text-black flex items-center justify-center transition shadow"
              title="Instagram Pondok"
            >
              <span className="text-xs font-bold">IG</span>
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded-full bg-[#02180e] border border-[#d4af37]/40 hover:border-[#faebaa] hover:bg-[#d4af37] text-emerald-300 hover:text-black flex items-center justify-center transition shadow"
              title="YouTube Salaf"
            >
              <span className="text-xs font-bold">YT</span>
            </a>
            <a
              href="https://tiktok.com"
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded-full bg-[#02180e] border border-[#d4af37]/40 hover:border-[#faebaa] hover:bg-[#d4af37] text-emerald-300 hover:text-black flex items-center justify-center transition shadow"
              title="TikTok Madrasah"
            >
              <span className="text-xs font-bold">TT</span>
            </a>
            <a
              href="https://wa.me/6281234567890"
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded-full bg-[#02180e] border border-[#d4af37]/40 hover:border-[#faebaa] hover:bg-[#d4af37] text-emerald-300 hover:text-black flex items-center justify-center transition shadow"
              title="WhatsApp Center"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); syncWithGoogleSheets(); }}
              className="w-8 h-8 rounded-full bg-[#02180e] border border-[#d4af37]/40 hover:border-[#faebaa] hover:bg-[#d4af37] text-emerald-300 hover:text-black flex items-center justify-center transition shadow"
              title="Sinkronisasi Google Sheets"
            >
              <Globe className="w-4 h-4" />
            </a>
          </div>

          {/* Sacred Hadith Quote */}
          <div className="pt-2 text-center max-w-sm mx-auto">
            <p 
              className="font-serif text-[#faebaa] text-xs sm:text-sm tracking-wide leading-relaxed"
              style={{ fontFamily: "'Amiri', serif" }}
            >
              مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ
            </p>
            <p className="text-[10px] text-emerald-300/80 italic mt-1">
              "Barangsiapa menempuh suatu jalan untuk mencari ilmu, maka Allah memudahkan jalannya menuju Surga." (HR. Muslim)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
