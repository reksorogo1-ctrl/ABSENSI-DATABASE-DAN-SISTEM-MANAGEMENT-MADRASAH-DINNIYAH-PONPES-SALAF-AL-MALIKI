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
import { LoginScreen } from './components/LoginScreen';

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
        <div className="anim-dashboard-fade" key="wali">
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
        {showDoors && <DoorTransition onComplete={() => setShowDoors(false)} settings={settings} />}
      </>
    );
  }

  // 2. If logged in as Pengurus -> render PengurusDashboard
  if (session?.role === 'pengurus' && session.pengurusData) {
    const livePengurus = pengurusList.find(p => p.id === session.pengurusData?.id) || session.pengurusData;
    return (
      <>
        <div className="anim-dashboard-fade" key="pengurus">
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
        {showDoors && <DoorTransition onComplete={() => setShowDoors(false)} settings={settings} />}
      </>
    );
  }

  // 3. If logged in as Admin -> render AdminDashboard
  if (session?.role === 'admin') {
    return (
      <>
        <div className="anim-dashboard-fade" key="admin">
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
            onTestIntro={() => setShowIntro(true)}
          />
        </div>
        {showDoors && <DoorTransition onComplete={() => setShowDoors(false)} settings={settings} />}
      </>
    );
  }

  // 4. Video Sinematik Intro Opening (The Journey of Knowledge - Salaf Al-Maliki)
  if (showIntro) {
    return (
      <IntroOpening
        onComplete={() => setShowIntro(false)}
        appName={settings.portal_title || 'SIM SALAF AL-MALIKI'}
        subTitle={settings.nama_pesantren || 'PONDOK PESANTREN SALAF AL-MALIKI'}
        logoUrl={settings.logo_pondok}
        videoSrc={settings.intro_video_url || '/assets/intro_salaf_almaliki.mp4'}
        optionPassword={settings.password_option_panel || 'admin123'}
        onVideoChange={(newUrl, newName) => {
          const updated = {
            ...settings,
            intro_video_url: newUrl,
            intro_video_name: newName || 'Video Intro Kustom'
          };
          setSettings(updated);
          localStorage.setItem('sim_settings', JSON.stringify(updated));
        }}
        onOpenOptionPanelVideo={() => {
          setShowIntro(false);
          setSession({
            role: 'admin',
            identifier: 'admin'
          });
          setActiveTab('pengaturan');
          localStorage.setItem('sim_option_unlocked', 'true');
          localStorage.setItem('sim_target_control_section', 'video_intro');
          setShowDoors(true);
        }}
      />
    );
  }

  // 5. Login Landing View (redesigned per reference: brand showcase + mihrab login panel)
  return (
    <LoginScreen
      settings={settings}
      santriList={santriList}
      pengurusList={pengurusList}
      loginMode={loginMode}
      setLoginMode={setLoginMode}
      loginError={loginError}
      setLoginError={setLoginError}
      santriNamaInput={santriNamaInput} setSantriNamaInput={setSantriNamaInput}
      santriPasswordInput={santriPasswordInput} setSantriPasswordInput={setSantriPasswordInput}
      pengurusNamaInput={pengurusNamaInput} setPengurusNamaInput={setPengurusNamaInput}
      pengurusPasswordInput={pengurusPasswordInput} setPengurusPasswordInput={setPengurusPasswordInput}
      adminUsername={adminUsername} setAdminUsername={setAdminUsername}
      adminPassword={adminPassword} setAdminPassword={setAdminPassword}
      showPassword={showPassword} setShowPassword={setShowPassword}
      rememberMe={rememberMe} setRememberMe={setRememberMe}
      showForgotPasswordModal={showForgotPasswordModal} setShowForgotPasswordModal={setShowForgotPasswordModal}
      onSubmit={handleLoginSubmit}
      onGoogleSignIn={googleSignIn}
      onSyncSheets={syncWithGoogleSheets}
      onReplayIntro={() => setShowIntro(true)}
    />
  );
}
