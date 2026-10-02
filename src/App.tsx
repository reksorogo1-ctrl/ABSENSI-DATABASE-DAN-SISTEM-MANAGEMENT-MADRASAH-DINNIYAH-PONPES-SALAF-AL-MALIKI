import React, { useState, useEffect } from 'react';
import { 
  Santri, AbsensiSantriRecord, AbsensiGuruRecord, JadwalPelajaran, 
  GuruPengajar, NadzhomRecord, NilaiUjianRecord, AppSettings, DashboardStats, AuthSession,
  SyahriyahRecord, UangSakuRecord, KurikulumKitabRecord,
  Pengurus, KalenderAkademikEvent, UjianSantriRecord, IzinMengajarRequest,
  SilabusMemaknaiRecord
} from './types';
import { 
  DEFAULT_SPREADSHEET_ID, DEFAULT_SETTINGS, INITIAL_SANTRI_LIST, 
  INITIAL_GURU_LIST, INITIAL_JADWAL_LIST, INITIAL_NADZHOM_LIST, 
  INITIAL_NILAI_LIST, INITIAL_ABSENSI_SANTRI, INITIAL_ABSENSI_GURU,
  INITIAL_SYAHRIYAH_LIST, INITIAL_UANG_SAKU_LIST, INITIAL_KURIKULUM_LIST,
  INITIAL_PENGURUS_LIST, INITIAL_KALENDER_AKADEMIK, INITIAL_UJIAN_SANTRI_LIST,
  INITIAL_IZIN_MENGAJAR_LIST, INITIAL_SILABUS_MEMAKNAI
} from './data';
import { GoogleSheetsService } from './sheetsService';
import { googleSignIn, initAuth, getAccessToken, logoutGoogle } from './googleAuth';
import { 
  loadSettingsFromFirestore, 
  saveSettingsToFirestore, 
  subscribeSettingsFromFirestore,
  signInWithGoogleFirebase 
} from './firebase';
import { broadcastAttendanceUpdate, subscribeAttendanceUpdates } from './serverTime';
import { AdminDashboard } from './components/AdminDashboard';
import { WaliSantriPortal } from './components/WaliSantriPortal';
import { PengurusDashboard } from './components/PengurusDashboard';
import { IntroOpening } from './components/IntroOpening';
import { CinematicIntro } from './components/CinematicIntro';
import { DoorTransition } from './components/DoorTransition';
import { LoginScreen } from './components/LoginScreen';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';

export default function App() {
  // Intro Video State - disabled to open dashboard login directly
  const [showIntro, setShowIntro] = useState<boolean>(false);

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
  const [showSheetsModal, setShowSheetsModal] = useState<boolean>(false);

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
    const base = saved ? JSON.parse(saved) : INITIAL_JADWAL_LIST;
    return base.map((item: JadwalPelajaran, idx: number) => ({
      ...item,
      id: item.id || `JAD-${idx + 1}-${item.kelas.replace(/\s+/g, '')}-${item.hari}-${item.jamKe}`
    }));
  });
  const [nadzhomList, setNadzhomList] = useState<NadzhomRecord[]>(() => {
    const saved = localStorage.getItem('sim_nadzhom');
    return saved ? JSON.parse(saved) : INITIAL_NADZHOM_LIST;
  });
  const [nilaiList, setNilaiList] = useState<NilaiUjianRecord[]>(() => {
    const saved = localStorage.getItem('sim_nilai');
    return saved ? JSON.parse(saved) : INITIAL_NILAI_LIST;
  });
  const [absensiSantriList, setAbsensiSantriList] = useState<AbsensiSantriRecord[]>(() => {
    const saved = localStorage.getItem('sim_absensi_santri');
    return saved ? JSON.parse(saved) : INITIAL_ABSENSI_SANTRI;
  });
  const [absensiGuruList, setAbsensiGuruList] = useState<AbsensiGuruRecord[]>(() => {
    const saved = localStorage.getItem('sim_absensi_guru');
    return saved ? JSON.parse(saved) : INITIAL_ABSENSI_GURU;
  });

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
  const [silabusList, setSilabusList] = useState<SilabusMemaknaiRecord[]>(() => {
    const saved = localStorage.getItem('sim_silabus');
    return saved ? JSON.parse(saved) : INITIAL_SILABUS_MEMAKNAI;
  });

  // Pengurus, Kalender Akademik, & Ujian Santri Data States
  const [pengurusList, setPengurusList] = useState<Pengurus[]>(() => {
    const saved = localStorage.getItem('sim_pengurus');
    return saved ? JSON.parse(saved) : INITIAL_PENGURUS_LIST;
  });
  const [kalenderList, setKalenderList] = useState<KalenderAkademikEvent[]>(() => {
    const saved = localStorage.getItem('sim_kalender');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as KalenderAkademikEvent[];
        const filtered = parsed.filter(e => 
          e.id !== 'EVT-001' && 
          e.id !== 'EVT-002' && 
          !e.judul.toLowerCase().includes('rapat pleno dewan pengurus') &&
          !e.judul.toLowerCase().includes('pekan ujian muhafadzoh')
        );
        localStorage.setItem('sim_kalender', JSON.stringify(filtered));
        return filtered;
      } catch {
        return INITIAL_KALENDER_AKADEMIK;
      }
    }
    return INITIAL_KALENDER_AKADEMIK;
  });
  const [ujianList, setUjianList] = useState<UjianSantriRecord[]>(() => {
    const saved = localStorage.getItem('sim_ujian_kitab');
    return saved ? JSON.parse(saved) : INITIAL_UJIAN_SANTRI_LIST;
  });
  const [izinMengajarList, setIzinMengajarList] = useState<IzinMengajarRequest[]>(() => {
    const saved = localStorage.getItem('sim_izin_mengajar');
    return saved ? JSON.parse(saved) : INITIAL_IZIN_MENGAJAR_LIST;
  });

  // Otomatis simpan rekap saat berganti hari dan reset harian ke nol (System Otomatis)
  useEffect(() => {
    const checkDayChange = () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const lastActiveDate = localStorage.getItem('sim_active_dashboard_date');

      if (!lastActiveDate) {
        localStorage.setItem('sim_active_dashboard_date', todayStr);
      } else if (lastActiveDate !== todayStr) {
        // Hari telah berganti! Otomatis arsipkan data sebelumnya dan restart sesi harian aktif ke nol
        try {
          const currentGuru = JSON.parse(localStorage.getItem('sim_absensi_guru') || '[]');
          const currentSantri = JSON.parse(localStorage.getItem('sim_absensi_santri') || '[]');
          if (currentGuru.length > 0) {
            const prevHistory = JSON.parse(localStorage.getItem('sim_rekap_guru_harian_history') || '[]');
            localStorage.setItem('sim_rekap_guru_harian_history', JSON.stringify([...currentGuru, ...prevHistory]));
          }
          if (currentSantri.length > 0) {
            const prevHistoryS = JSON.parse(localStorage.getItem('sim_rekap_santri_harian_history') || '[]');
            localStorage.setItem('sim_rekap_santri_harian_history', JSON.stringify([...currentSantri, ...prevHistoryS]));
          }
        } catch {}

        // Sesi absensi harian di-reset ke nol untuk hari baru
        setAbsensiSantriList([]);
        setAbsensiGuruList([]);
        localStorage.setItem('sim_absensi_santri', JSON.stringify([]));
        localStorage.setItem('sim_absensi_guru', JSON.stringify([]));
        localStorage.setItem('sim_active_dashboard_date', todayStr);
        localStorage.setItem('sim_last_active_date', todayStr);
      }
    };

    checkDayChange();
    const timer = setInterval(checkDayChange, 10000);
    return () => clearInterval(timer);
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

  useEffect(() => {
    initAuth(
      (_user, token) => {
        if (token) setIsGoogleConnected(true);
      },
      () => {
        setIsGoogleConnected(false);
      }
    );

    // Sync settings with Firebase Firestore
    loadSettingsFromFirestore().then((remoteSettings) => {
      if (remoteSettings) {
        setSettings((prev) => ({ ...prev, ...remoteSettings }));
      }
    });

    const unsubscribe = subscribeSettingsFromFirestore((remoteSettings) => {
      if (remoteSettings) {
        setSettings((prev) => ({ ...prev, ...remoteSettings }));
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Compute Dashboard Stats dynamically
  const stats: DashboardStats = React.useMemo(() => {
    const totalSantri = santriList.length;
    // Kolom data ustadz: menghitung ketika ada nama yang sama dihitung satu orang!
    const uniqueGuruNames = new Set(guruList.map(g => g.nama.trim().toLowerCase()));
    const totalGuru = uniqueGuruNames.size;

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

    const percentSantri = totalAbsensiSantri ? Math.round((hadirSantri / totalAbsensiSantri) * 100) : 0;
    const percentGuru = totalAbsensiGuru ? Math.round((hadirGuru / totalAbsensiGuru) * 100) : 0;
    const percentKeterlambatanGuru = totalAbsensiGuru ? Math.round((terlambatGuru / totalAbsensiGuru) * 100) : 0;
    const percentIzinGuru = totalAbsensiGuru ? Math.round((izinGuru / totalAbsensiGuru) * 100) : 0;

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
      hadirSantri,
      izinSantri,
      sakitSantri,
      alphaSantri,
      hadirGuru,
      terlambatGuru,
      izinGuru,
      alphaGuru,
      kehadiranSantriHariIni: percentSantri,
      kehadiranGuruHariIni: percentGuru,
      keterlambatanGuru: percentKeterlambatanGuru,
      rekapSantri: {
        hadir: hadirSantri,
        izin: izinSantri,
        sakit: sakitSantri,
        alpha: alphaSantri
      },
      rekapGuru: {
        hadir: hadirGuru,
        terlambat: terlambatGuru,
        izin: izinGuru,
        alpha: alphaGuru
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

  const handleDataImported = (imported: {
    santriList?: Santri[];
    guruList?: GuruPengajar[];
    jadwalList?: JadwalPelajaran[];
    nadzhomList?: NadzhomRecord[];
    nilaiList?: NilaiUjianRecord[];
    absensiSantriList?: AbsensiSantriRecord[];
    absensiGuruList?: AbsensiGuruRecord[];
    syahriyahList?: SyahriyahRecord[];
    settings?: Partial<AppSettings>;
  }) => {
    if (imported.santriList && imported.santriList.length > 0) {
      setSantriList(imported.santriList);
      localStorage.setItem('sim_santri', JSON.stringify(imported.santriList));
    }
    if (imported.guruList && imported.guruList.length > 0) {
      setGuruList(imported.guruList);
      localStorage.setItem('sim_guru', JSON.stringify(imported.guruList));
    }
    if (imported.jadwalList && imported.jadwalList.length > 0) {
      setJadwalList(imported.jadwalList);
      localStorage.setItem('sim_jadwal', JSON.stringify(imported.jadwalList));
    }
    if (imported.nadzhomList && imported.nadzhomList.length > 0) {
      setNadzhomList(imported.nadzhomList);
      localStorage.setItem('sim_nadzhom', JSON.stringify(imported.nadzhomList));
    }
    if (imported.nilaiList && imported.nilaiList.length > 0) {
      setNilaiList(imported.nilaiList);
      localStorage.setItem('sim_nilai', JSON.stringify(imported.nilaiList));
    }
    if (imported.absensiSantriList && imported.absensiSantriList.length > 0) {
      setAbsensiSantriList(imported.absensiSantriList);
      localStorage.setItem('sim_absensi_santri', JSON.stringify(imported.absensiSantriList));
    }
    if (imported.absensiGuruList && imported.absensiGuruList.length > 0) {
      setAbsensiGuruList(imported.absensiGuruList);
      localStorage.setItem('sim_absensi_guru', JSON.stringify(imported.absensiGuruList));
    }
    if (imported.syahriyahList && imported.syahriyahList.length > 0) {
      setSyahriyahList(imported.syahriyahList);
      localStorage.setItem('sim_syahriyah', JSON.stringify(imported.syahriyahList));
    }
    if (imported.settings) {
      setSettings(prev => {
        const updated = { ...prev, ...imported.settings };
        localStorage.setItem('sim_settings', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const handleGoogleLoginFlow = async () => {
    try {
      let fbEmail = '';
      try {
        const fbUser = await signInWithGoogleFirebase();
        if (fbUser) fbEmail = fbUser.email || '';
      } catch (fbErr) {
        console.warn('Firebase popup sign in fallback:', fbErr);
      }

      const res = await googleSignIn();
      if (res?.user || fbEmail) {
        setIsGoogleConnected(true);
        setShowDoors(true);
        setSession({
          role: 'admin',
          identifier: fbEmail || res?.user?.email || res?.user?.displayName || 'admin_google'
        });
      }
    } catch (e: any) {
      console.error('Google sign in error:', e);
      alert(e?.message || 'Gagal login dengan akun Google.');
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
    setAbsensiSantriList(prev => {
      const keys = new Set(records.map(r => `${r.tanggal}_${r.idSantri || r.nama}`));
      const filtered = prev.filter(p => !keys.has(`${p.tanggal}_${p.idSantri || p.nama}`));
      const updated = [...records, ...filtered];
      try {
        localStorage.setItem('sim_absensi_santri', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Broadcast update secara real-time ke Dashboard Admin
    broadcastAttendanceUpdate('santri', records, session?.pengurusData?.nama || 'Pengurus');

    if (isGoogleConnected) {
      try {
        await sheetsService.saveAbsensiSantriToSheet(records);
      } catch (err) {
        console.warn('Could not write directly to sheets:', err);
      }
    }
  };

  const handleSaveAbsensiGuru = async (records: AbsensiGuruRecord[]) => {
    setAbsensiGuruList(prev => {
      const keys = new Set(records.map(r => `${r.tanggal}_${r.nama}_${r.kelas}_${r.jamKe}`));
      const filtered = prev.filter(p => !keys.has(`${p.tanggal}_${p.nama}_${p.kelas}_${p.jamKe}`));
      const updated = [...records, ...filtered];
      try {
        localStorage.setItem('sim_absensi_guru', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Broadcast update secara real-time ke Dashboard Admin
    broadcastAttendanceUpdate('guru', records, session?.pengurusData?.nama || 'Ustadz / Pengurus');

    if (isGoogleConnected) {
      try {
        await sheetsService.saveAbsensiGuruToSheet(records);
      } catch (err) {
        console.warn('Could not write directly to sheets:', err);
      }
    }
  };

  // Sinkronisasi data presensi real-time lintas tab & komponen
  useEffect(() => {
    const unsub = subscribeAttendanceUpdates((payload) => {
      if (payload.type === 'guru' && payload.records?.length) {
        setAbsensiGuruList(prev => {
          const keys = new Set(payload.records.map((r: any) => `${r.tanggal}_${r.nama}_${r.kelas}_${r.jamKe}`));
          const filtered = prev.filter(p => !keys.has(`${p.tanggal}_${p.nama}_${p.kelas}_${p.jamKe}`));
          return [...payload.records, ...filtered];
        });
      } else if (payload.type === 'santri' && payload.records?.length) {
        setAbsensiSantriList(prev => {
          const keys = new Set(payload.records.map((r: any) => `${r.tanggal}_${r.idSantri || r.nama}`));
          const filtered = prev.filter(p => !keys.has(`${p.tanggal}_${p.idSantri || p.nama}`));
          return [...payload.records, ...filtered];
        });
      }
    });
    return () => unsub();
  }, []);

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

  const handleDeleteGuru = (idOrName: string) => {
    const target = guruList.find(g => (g.id && g.id === idOrName) || g.nama === idOrName);
    const updated = guruList.filter(g => (g.id ? g.id !== idOrName : true) && g.nama !== idOrName);
    setGuruList(updated);
    localStorage.setItem('sim_guru', JSON.stringify(updated));
    alert(`Data ustadz / guru pengajar "${target?.nama || idOrName}" telah berhasil dihapus secara manual.`);
  };

  const handleSaveSilabus = (rec: SilabusMemaknaiRecord) => {
    const existingIdx = silabusList.findIndex(s => s.id === rec.id || (s.namaKitab.toLowerCase() === rec.namaKitab.toLowerCase() && s.kelas === rec.kelas && s.semester === rec.semester));
    let updated: SilabusMemaknaiRecord[];
    if (existingIdx >= 0) {
      updated = [...silabusList];
      updated[existingIdx] = rec;
    } else {
      updated = [rec, ...silabusList];
    }
    setSilabusList(updated);
    localStorage.setItem('sim_silabus', JSON.stringify(updated));

    // Update ustadz / guru mapping if needed
    if (rec.ustadzPengampu) {
      const guruIdx = guruList.findIndex(g => g.nama.toLowerCase().trim() === rec.ustadzPengampu.toLowerCase().trim() && g.kelas === rec.kelas);
      if (guruIdx >= 0) {
        const upGuru = [...guruList];
        upGuru[guruIdx] = { ...upGuru[guruIdx], kitab: rec.namaKitab };
        setGuruList(upGuru);
        localStorage.setItem('sim_guru', JSON.stringify(upGuru));
      }
    }
  };

  const handleDeleteSilabus = (id: string) => {
    const updated = silabusList.filter(s => s.id !== id);
    setSilabusList(updated);
    localStorage.setItem('sim_silabus', JSON.stringify(updated));
  };

  const handleSaveNewJadwal = (newJadwal: JadwalPelajaran) => {
    const targetId = newJadwal.id || `JAD-${Date.now()}`;
    const preparedJadwal = { ...newJadwal, id: targetId };
    setJadwalList(prev => {
      const existingIdx = prev.findIndex(j => (j.id && j.id === targetId) || (j.kelas === preparedJadwal.kelas && j.hari === preparedJadwal.hari && Number(j.jamKe) === Number(preparedJadwal.jamKe)));
      let updated: JadwalPelajaran[];
      if (existingIdx >= 0) {
        updated = [...prev];
        updated[existingIdx] = preparedJadwal;
      } else {
        updated = [...prev, preparedJadwal];
      }
      localStorage.setItem('sim_jadwal', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeleteJadwal = (idOrItem: string | JadwalPelajaran) => {
    setJadwalList(prev => {
      const updated = prev.filter(j => {
        if (typeof idOrItem === 'string') return j.id !== idOrItem;
        return j.id !== idOrItem.id && j !== idOrItem;
      });
      localStorage.setItem('sim_jadwal', JSON.stringify(updated));
      return updated;
    });
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

  // Real-time synchronization: Guru Pengajar & Login Pengurus
  const syncPengurusWithGuru = () => {
    const uniqueGurus: GuruPengajar[] = [];
    const seenNames = new Set<string>();
    guruList.forEach(g => {
      const norm = g.nama.trim().toLowerCase();
      if (!seenNames.has(norm)) {
        seenNames.add(norm);
        uniqueGurus.push(g);
      }
    });

    const existingMap = new Map<string, Pengurus>();
    pengurusList.forEach(p => {
      existingMap.set(p.nama.trim().toLowerCase(), p);
      if (p.id) existingMap.set(p.id.toLowerCase(), p);
    });

    const synced: Pengurus[] = uniqueGurus.map((g, idx) => {
      const norm = g.nama.trim().toLowerCase();
      const exist = existingMap.get(norm);
      if (exist) {
        return {
          ...exist,
          kelasBimbingan: exist.kelasBimbingan || g.kelas,
          mapel: exist.mapel || g.mapel,
          noWa: exist.noWa || g.noWa || '081234567800',
          foto: exist.foto || g.foto
        };
      } else {
        return {
          id: `PNG-${String(idx + 1).padStart(3, '0')}`,
          nama: g.nama.trim(),
          password: 'pengurus123',
          jabatan: `Ustadz Pengajar ${g.mapel}`,
          kelasBimbingan: g.kelas,
          mapel: g.mapel,
          noWa: g.noWa || '081234567800',
          foto: g.foto,
          email: `${g.nama.toLowerCase().replace(/[^a-z0-9]/g, '')}@almaliki.ac.id`,
          tugasUtama: `Pengampu Fan ${g.mapel} & Pembimbing Kelas ${g.kelas}`
        };
      }
    });

    setPengurusList(synced);
    localStorage.setItem('sim_pengurus', JSON.stringify(synced));
    return synced;
  };

  useEffect(() => {
    const uniqueNames = new Set(guruList.map(g => g.nama.trim().toLowerCase()));
    const existingNames = new Set(pengurusList.map(p => p.nama.trim().toLowerCase()));

    let needsSync = uniqueNames.size !== pengurusList.length;
    if (!needsSync) {
      for (const name of uniqueNames) {
        if (!existingNames.has(name)) {
          needsSync = true;
          break;
        }
      }
    }

    if (needsSync) {
      syncPengurusWithGuru();
    }
  }, [guruList]);

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
    // Persist to Firebase Firestore
    saveSettingsToFirestore(st).catch((err) => {
      console.warn('Could not save settings directly to Firestore:', err);
    });
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
      'Simpan rekapitulasi kehadiran hari ini dan reset formulir serta dashboard ke nol?'
    );
    if (!confirmed) return;
    try {
      if (absensiGuruList.length > 0) {
        const prevH = JSON.parse(localStorage.getItem('sim_rekap_guru_harian_history') || '[]');
        localStorage.setItem('sim_rekap_guru_harian_history', JSON.stringify([...absensiGuruList, ...prevH]));
      }
      if (absensiSantriList.length > 0) {
        const prevHS = JSON.parse(localStorage.getItem('sim_rekap_santri_harian_history') || '[]');
        localStorage.setItem('sim_rekap_santri_harian_history', JSON.stringify([...absensiSantriList, ...prevHS]));
      }
    } catch {}

    setAbsensiSantriList([]);
    setAbsensiGuruList([]);
    localStorage.setItem('sim_absensi_santri', JSON.stringify([]));
    localStorage.setItem('sim_absensi_guru', JSON.stringify([]));
    alert('Rekap dashboard telah disimpan ke riwayat rekapan dan seluruh sesi absensi harian berhasil direset ke nol (0).');
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
            silabusList={silabusList}
            kalenderList={kalenderList}
            ujianList={ujianList}
            izinList={izinMengajarList}
            onLogout={handleLogout}
            onUpdatePengurusProfile={handleUpdatePengurus}
            onSaveAbsensiSantri={handleSaveAbsensiSantri}
            onSaveAbsensiGuru={handleSaveAbsensiGuru}
            onSubmitIzinMengajar={handleAddIzinMengajar}
            onSaveSilabus={handleSaveSilabus}
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
            silabusList={silabusList}
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
            sheetsService={sheetsService}
            isGoogleConnected={isGoogleConnected}
            setIsGoogleConnected={setIsGoogleConnected}
            onOpenSheetsModal={() => setShowSheetsModal(true)}
            onDataImported={handleDataImported}
            onSaveAbsensiSantri={handleSaveAbsensiSantri}
            onSaveAbsensiGuru={handleSaveAbsensiGuru}
            onSaveNewSantri={handleSaveNewSantri}
            onSaveNewGuru={handleSaveNewGuru}
            onDeleteGuru={handleDeleteGuru}
            onSaveNewJadwal={handleSaveNewJadwal}
            onDeleteJadwal={handleDeleteJadwal}
            onSyncPengurusWithGuru={syncPengurusWithGuru}
            onSaveNadzhom={handleSaveNadzhom}
            onSaveNilai={handleSaveNilai}
            onSaveSettings={handleSaveSettings}
            onSaveDashboardAndReset={handleSaveDashboardAndReset}
            onUpdateSantriProfile={handleUpdateSantriProfile}
            onSaveSyahriyah={handleSaveSyahriyah}
            onSaveUangSaku={handleSaveUangSaku}
            onSaveKurikulum={handleSaveKurikulum}
            onDeleteKurikulum={handleDeleteKurikulum}
            onSaveSilabus={handleSaveSilabus}
            onDeleteSilabus={handleDeleteSilabus}
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
        {showSheetsModal && (
          <GoogleSheetsModal
            isOpen={showSheetsModal}
            onClose={() => setShowSheetsModal(false)}
            sheetsService={sheetsService}
            spreadsheetId={spreadsheetId}
            setSpreadsheetId={setSpreadsheetId}
            isGoogleConnected={isGoogleConnected}
            setIsGoogleConnected={setIsGoogleConnected}
            appData={{
              settings,
              santriList,
              guruList,
              jadwalList,
              nadzhomList,
              nilaiList,
              absensiSantriList,
              absensiGuruList,
              syahriyahList
            }}
            onDataImported={handleDataImported}
          />
        )}
        {showDoors && <DoorTransition onComplete={() => setShowDoors(false)} settings={settings} />}
      </>
    );
  }

  // 5. Login Landing View (rendered with IntroOpening overlaid for seamless cross-dissolve)
  return (
    <>
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
        onGoogleSignIn={handleGoogleLoginFlow}
        onSyncSheets={() => setShowSheetsModal(true)}
        onReplayIntro={() => setShowIntro(true)}
      />

      {showSheetsModal && (
        <GoogleSheetsModal
          isOpen={showSheetsModal}
          onClose={() => setShowSheetsModal(false)}
          sheetsService={sheetsService}
          spreadsheetId={spreadsheetId}
          setSpreadsheetId={setSpreadsheetId}
          isGoogleConnected={isGoogleConnected}
          setIsGoogleConnected={setIsGoogleConnected}
          appData={{
            settings,
            santriList,
            guruList,
            jadwalList,
            nadzhomList,
            nilaiList,
            absensiSantriList,
            absensiGuruList,
            syahriyahList
          }}
          onDataImported={handleDataImported}
        />
      )}
    </>
  );
}
