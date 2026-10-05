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
import { 
  googleSignIn, 
  initAuth, 
  getAccessToken, 
  logoutGoogle,
  checkGoogleAuthRedirectResult 
} from './googleAuth';
import { 
  loadSettingsFromFirestore, 
  saveSettingsToFirestore, 
  subscribeSettingsFromFirestore,
  signInWithGoogleFirebase,
  checkFirebaseRedirectResult,
  isMobileDevice,
  isStandaloneApp,
  saveMasterDataToFirestore,
  loadMasterDataFromFirestore,
  subscribeMasterDataFromFirestore
} from './firebase';
import {
  broadcastAttendanceUpdate,
  subscribeAttendanceUpdates,
  broadcastScheduleUpdate,
  subscribeScheduleUpdates
} from './serverTime';
import { AdminDashboard } from './components/AdminDashboard';
import { WaliSantriPortal } from './components/WaliSantriPortal';
import { PengurusDashboard } from './components/PengurusDashboard';
import { IntroOpening } from './components/IntroOpening';
import { CinematicIntro } from './components/CinematicIntro';
import { DoorTransition } from './components/DoorTransition';
import { LoginScreen } from './components/LoginScreen';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';

function deduplicateSantriList(list: Santri[]): Santri[] {
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  return list.filter((s, idx) => {
    const rawId = s?.id ? String(s.id).trim() : `temp-${idx}`;
    if (!rawId || seen.has(rawId)) {
      return false;
    }
    seen.add(rawId);
    return true;
  });
}

function deduplicateGuruList(list: GuruPengajar[]): GuruPengajar[] {
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  return list.filter((g, idx) => {
    const rawId = g?.id ? String(g.id).trim() : `${g?.nama || ''}-${g?.kelas || ''}-${g?.mapel || ''}-${idx}`;
    if (!rawId || seen.has(rawId)) {
      return false;
    }
    seen.add(rawId);
    return true;
  });
}

// Sinkronisasi data login pengurus dengan data guru pengajar secara real-time (1:1)
export function syncPengurusWithGuru(currentPengurus: Pengurus[], currentGuruList: GuruPengajar[]): Pengurus[] {
  if (!currentGuruList || currentGuruList.length === 0) return currentPengurus || [];

  const usedIds = new Set<string>();

  return currentGuruList.map((guru, index) => {
    let guruId = (guru.id && String(guru.id).trim()) || `GP-${index + 1}`;
    if (usedIds.has(guruId)) {
      guruId = `${guruId}-${index + 1}`;
    }
    usedIds.add(guruId);

    const cleanGuruName = (guru.nama || '').trim().toLowerCase();

    // Cari apakah sudah ada data pengurus yang cocok berdasarkan ID atau nama
    const existing = currentPengurus?.find(p => 
      (p.id && guru.id && p.id === guru.id) ||
      (p.nama && p.nama.trim().toLowerCase() === cleanGuruName) ||
      (p.id === guruId)
    );

    const defaultJabatan = guru.jabatan || (guru.kelas ? `Dewan Pengajar / Asatidz (${guru.kelas})` : 'Dewan Pengajar / Asatidz');

    if (existing) {
      return {
        ...existing,
        id: guruId, // Selalu gunakan ID slot unik guru agar tidak bentrok key di React
        nama: guru.nama, // Selalu tersinkron dengan nama guru
        password: existing.password || 'pengurus123',
        jabatan: existing.jabatan || defaultJabatan,
        kelasBimbingan: guru.kelas || existing.kelasBimbingan || 'Semua Kelas',
        mapel: guru.mapel || existing.mapel || 'Kitab Kuning',
        noWa: existing.noWa || guru.noWa || '081234567801',
        foto: existing.foto || guru.foto,
        tugasUtama: existing.tugasUtama || guru.tugasUtama || `Pengajar Fan ${guru.mapel || 'Kitab'} & Pembina Santri`
      };
    }

    return {
      id: guruId,
      nama: guru.nama,
      password: 'pengurus123',
      jabatan: defaultJabatan,
      kelasBimbingan: guru.kelas || 'Semua Kelas',
      mapel: guru.mapel || 'Kitab Kuning',
      noWa: guru.noWa || '081234567801',
      foto: guru.foto,
      email: `${cleanGuruName.replace(/[^a-z0-9]/g, '')}@almaliki.ac.id`,
      tugasUtama: `Pengajar Fan ${guru.mapel || 'Kitab'} & Pembina Santri`
    };
  });
}

export default function App() {
  // Intro Video State - disabled to open dashboard login directly
  const [showIntro, setShowIntro] = useState<boolean>(false);

  // Cinematic sliding-door transition played right after a successful login
  const [showDoors, setShowDoors] = useState<boolean>(false);

  // Session State - dipersistensikan di localStorage agar sesi tidak restart / logout di HP
  const [session, setSession] = useState<AuthSession | null>(() => {
    try {
      const saved = localStorage.getItem('sim_auth_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Otomatis simpan sesi ke localStorage
  useEffect(() => {
    if (session) {
      localStorage.setItem('sim_auth_session', JSON.stringify(session));
    } else {
      localStorage.removeItem('sim_auth_session');
    }
  }, [session]);

  // Menjaga sesi login di HP agar tidak restart saat berpindah aplikasi atau tab background
  useEffect(() => {
    const handleRestoreOnResume = () => {
      try {
        const saved = localStorage.getItem('sim_auth_session');
        if (saved && !session) {
          console.info('Memulihkan sesi login HP dari penyimpanan persisten');
          setSession(JSON.parse(saved));
        }
      } catch {}
    };

    window.addEventListener('pageshow', handleRestoreOnResume);
    window.addEventListener('focus', handleRestoreOnResume);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') handleRestoreOnResume();
    });

    return () => {
      window.removeEventListener('pageshow', handleRestoreOnResume);
      window.removeEventListener('focus', handleRestoreOnResume);
    };
  }, [session]);
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
    return deduplicateSantriList(saved ? JSON.parse(saved) : INITIAL_SANTRI_LIST);
  });
  const [guruList, setGuruList] = useState<GuruPengajar[]>(() => {
    const saved = localStorage.getItem('sim_guru');
    return deduplicateGuruList(saved ? JSON.parse(saved) : INITIAL_GURU_LIST);
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
  const [absensiSantriList, setAbsensiSantriList] = useState<AbsensiSantriRecord[]>(() => {
    const saved = localStorage.getItem('sim_absensi_santri');
    if (saved) return JSON.parse(saved);
    // Simpan data bawaan ke riwayat arsip lokal agar rekapan bulan sebelumnya tetap aman
    try {
      const prevHS = JSON.parse(localStorage.getItem('sim_rekap_santri_harian_history') || '[]');
      if (prevHS.length === 0 && INITIAL_ABSENSI_SANTRI.length > 0) {
        localStorage.setItem('sim_rekap_santri_harian_history', JSON.stringify(INITIAL_ABSENSI_SANTRI));
      }
    } catch {}
    // Hanya ambil absensi jika sesuai dengan bulan yang sedang aktif saat ini
    const today = new Date();
    const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    return INITIAL_ABSENSI_SANTRI.filter(a => a.tanggal.startsWith(currentYearMonth));
  });
  const [absensiGuruList, setAbsensiGuruList] = useState<AbsensiGuruRecord[]>(() => {
    const saved = localStorage.getItem('sim_absensi_guru');
    if (saved) return JSON.parse(saved);
    try {
      const prevHG = JSON.parse(localStorage.getItem('sim_rekap_guru_harian_history') || '[]');
      if (prevHG.length === 0 && INITIAL_ABSENSI_GURU.length > 0) {
        localStorage.setItem('sim_rekap_guru_harian_history', JSON.stringify(INITIAL_ABSENSI_GURU));
      }
    } catch {}
    const today = new Date();
    const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    return INITIAL_ABSENSI_GURU.filter(g => g.tanggal.startsWith(currentYearMonth));
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
    if (saved) {
      try {
        const parsed: KurikulumKitabRecord[] = JSON.parse(saved);
        const existingKeys = new Set(parsed.map(k => `${k.kelas}__${k.mapel.trim().toLowerCase()}`));
        const missing = INITIAL_KURIKULUM_LIST.filter(k => !existingKeys.has(`${k.kelas}__${k.mapel.trim().toLowerCase()}`));
        if (missing.length > 0) {
          const merged = [...parsed, ...missing];
          localStorage.setItem('sim_kurikulum', JSON.stringify(merged));
          return merged;
        }
        return parsed;
      } catch (e) {
        console.error('Error parsing sim_kurikulum:', e);
      }
    }
    return INITIAL_KURIKULUM_LIST;
  });
  const [silabusList, setSilabusList] = useState<SilabusMemaknaiRecord[]>(() => {
    const saved = localStorage.getItem('sim_silabus');
    return saved ? JSON.parse(saved) : INITIAL_SILABUS_MEMAKNAI;
  });

  // Pengurus, Kalender Akademik, & Ujian Santri Data States
  const [pengurusList, setPengurusList] = useState<Pengurus[]>(() => {
    const saved = localStorage.getItem('sim_pengurus');
    const raw = saved ? JSON.parse(saved) : INITIAL_PENGURUS_LIST;
    const initialGurus = (localStorage.getItem('sim_guru') ? JSON.parse(localStorage.getItem('sim_guru')!) : INITIAL_GURU_LIST);
    return syncPengurusWithGuru(raw, initialGurus);
  });

  // Menjaga jumlah login pengurus sama dengan data guru pengajar secara real-time
  useEffect(() => {
    setPengurusList(prev => {
      const synced = syncPengurusWithGuru(prev, guruList);
      if (synced.length !== prev.length || JSON.stringify(synced) !== JSON.stringify(prev)) {
        localStorage.setItem('sim_pengurus', JSON.stringify(synced));
        saveMasterDataToFirestore('pengurus', synced);
        return synced;
      }
      return prev;
    });
  }, [guruList]);
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

  // Otomatis simpan rekap saat berganti hari / bulan dan pemeliharaan arsip harian
  useEffect(() => {
    const checkDayAndMonthChange = () => {
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const currentMonthStr = todayStr.slice(0, 7); // Format: YYYY-MM
      const lastActiveDate = localStorage.getItem('sim_active_dashboard_date');
      const lastActiveMonth = localStorage.getItem('sim_active_dashboard_month');

      // 1. Cek Ganti Bulan: Rekapan bulanan otomatis reset ke nol saat ganti bulan baru, dan arsip tersimpan aman
      if (!lastActiveMonth) {
        localStorage.setItem('sim_active_dashboard_month', currentMonthStr);
      } else if (lastActiveMonth !== currentMonthStr) {
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

        // Reset sesi absensi harian ke nol (0) untuk bulan baru
        setAbsensiSantriList([]);
        setAbsensiGuruList([]);
        localStorage.setItem('sim_absensi_santri', JSON.stringify([]));
        localStorage.setItem('sim_absensi_guru', JSON.stringify([]));
        localStorage.setItem('sim_active_dashboard_month', currentMonthStr);
        localStorage.setItem('sim_active_dashboard_date', todayStr);
        return;
      }

      // 2. Cek Ganti Hari dalam bulan yang sama
      if (!lastActiveDate) {
        localStorage.setItem('sim_active_dashboard_date', todayStr);
      } else if (lastActiveDate !== todayStr) {
        // Hari telah berganti: simpan cadangan arsip ke riwayat lokal tanpa menghapus data aktif
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

        localStorage.setItem('sim_active_dashboard_date', todayStr);
        localStorage.setItem('sim_last_active_date', todayStr);
      }
    };

    checkDayAndMonthChange();
    const timer = setInterval(checkDayAndMonthChange, 30000);
    return () => clearInterval(timer);
  }, []);

  // Login Form State
  const [loginMode, setLoginMode] = useState<'wali' | 'pengurus' | 'admin'>('wali');
  
  // Wali Santri login uses NAMA SANTRI as identifier, and NIS as password (editable in Option Panel)
  const [santriNamaInput, setSantriNamaInput] = useState<string>('');
  const [santriPasswordInput, setSantriPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Pengurus login uses NAMA PENGURUS and PASSWORD (editable in Option Panel)
  const [pengurusNamaInput, setPengurusNamaInput] = useState<string>('');
  const [pengurusPasswordInput, setPengurusPasswordInput] = useState<string>('');

  // Admin login uses username 'admin' and fixed/editable password (diisi mandiri oleh admin)
  const [adminUsername, setAdminUsername] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState<string>('');
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

    // Menangkap hasil login redirect (signInWithRedirect) saat browser HP kembali ke web app
    const processRedirectLogin = async () => {
      try {
        const res = await checkFirebaseRedirectResult();
        const email = res?.user?.email || '';

        if (email || res?.user) {
          console.info('Login redirect sukses di HP, memulihkan sesi admin:', email);
          setIsGoogleConnected(true);
          setShowDoors(true);
          const newSession: AuthSession = {
            role: 'admin',
            identifier: email || 'admin_google'
          };
          setSession(newSession);
          localStorage.setItem('sim_auth_session', JSON.stringify(newSession));

          if (localStorage.getItem('sim_sheets_modal_open_on_return') === 'true') {
            setShowSheetsModal(true);
            localStorage.removeItem('sim_sheets_modal_open_on_return');
          }
        }
      } catch (err) {
        console.warn('Redirect login check error:', err);
      }
    };

    processRedirectLogin();

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

    // SINKRONISASI DATA MASTER ANTAR-PERANGKAT (LAPTOP & HP)
    // 1. Data Santri
    loadMasterDataFromFirestore<Santri[]>('santri').then((data) => {
      if (data && Array.isArray(data) && data.length > 0) {
        const cleaned = deduplicateSantriList(data);
        setSantriList(cleaned);
        localStorage.setItem('sim_santri', JSON.stringify(cleaned));
      } else {
        saveMasterDataToFirestore('santri', santriList);
      }
    });

    // 2. Data Guru
    loadMasterDataFromFirestore<GuruPengajar[]>('guru').then((data) => {
      if (data && Array.isArray(data) && data.length > 0) {
        const cleaned = deduplicateGuruList(data);
        setGuruList(cleaned);
        localStorage.setItem('sim_guru', JSON.stringify(cleaned));
      } else {
        saveMasterDataToFirestore('guru', guruList);
      }
    });

    // 3. Jadwal Pelajaran
    loadMasterDataFromFirestore<JadwalPelajaran[]>('jadwal').then((data) => {
      if (data && Array.isArray(data) && data.length > 0) {
        setJadwalList(data);
        localStorage.setItem('sim_jadwal', JSON.stringify(data));
        broadcastScheduleUpdate(data, 'Firestore');
      } else {
        saveMasterDataToFirestore('jadwal', jadwalList);
      }
    });

    // 4. Presensi Santri
    loadMasterDataFromFirestore<AbsensiSantriRecord[]>('absensi_santri').then((data) => {
      if (data && Array.isArray(data) && data.length > 0) {
        setAbsensiSantriList(data);
        localStorage.setItem('sim_absensi_santri', JSON.stringify(data));
      } else if (absensiSantriList.length > 0) {
        saveMasterDataToFirestore('absensi_santri', absensiSantriList);
      }
    });

    // 5. Presensi Guru
    loadMasterDataFromFirestore<AbsensiGuruRecord[]>('absensi_guru').then((data) => {
      if (data && Array.isArray(data) && data.length > 0) {
        setAbsensiGuruList(data);
        localStorage.setItem('sim_absensi_guru', JSON.stringify(data));
      } else if (absensiGuruList.length > 0) {
        saveMasterDataToFirestore('absensi_guru', absensiGuruList);
      }
    });

    // 6. Nilai Raport
    loadMasterDataFromFirestore<NilaiUjianRecord[]>('nilai').then((data) => {
      if (data && Array.isArray(data) && data.length > 0) {
        setNilaiList(data);
        localStorage.setItem('sim_nilai', JSON.stringify(data));
      } else {
        saveMasterDataToFirestore('nilai', nilaiList);
      }
    });

    // 7. Nadzhom
    loadMasterDataFromFirestore<NadzhomRecord[]>('nadzhom').then((data) => {
      if (data && Array.isArray(data) && data.length > 0) {
        setNadzhomList(data);
        localStorage.setItem('sim_nadzhom', JSON.stringify(data));
      } else {
        saveMasterDataToFirestore('nadzhom', nadzhomList);
      }
    });

    // 8. Syahriyah
    loadMasterDataFromFirestore<SyahriyahRecord[]>('syahriyah').then((data) => {
      if (data && Array.isArray(data) && data.length > 0) {
        setSyahriyahList(data);
        localStorage.setItem('sim_syahriyah', JSON.stringify(data));
      } else {
        saveMasterDataToFirestore('syahriyah', syahriyahList);
      }
    });

    // 9. Kurikulum & Pengurus
    loadMasterDataFromFirestore<KurikulumKitabRecord[]>('kurikulum').then((data) => {
      if (data && Array.isArray(data) && data.length > 0) {
        setKurikulumList(data);
        localStorage.setItem('sim_kurikulum', JSON.stringify(data));
      }
    });

    loadMasterDataFromFirestore<Pengurus[]>('pengurus').then((data) => {
      if (data && Array.isArray(data) && data.length > 0) {
        setPengurusList(prev => syncPengurusWithGuru(data, guruList));
        localStorage.setItem('sim_pengurus', JSON.stringify(data));
      }
    });

    // 10. Metadata Sinkronisasi (Spreadsheet ID & Email)
    loadMasterDataFromFirestore<{ spreadsheetId?: string; email?: string }>('sync_meta').then((meta) => {
      if (meta?.spreadsheetId) {
        setSpreadsheetId(meta.spreadsheetId);
        localStorage.setItem('sim_spreadsheet_id', meta.spreadsheetId);
      }
    });

    // Subscriptions Realtime Firestore
    const unsubSantri = subscribeMasterDataFromFirestore<Santri[]>('santri', (data) => {
      if (data && Array.isArray(data)) {
        setSantriList(data);
        localStorage.setItem('sim_santri', JSON.stringify(data));
      }
    });
    const unsubGuru = subscribeMasterDataFromFirestore<GuruPengajar[]>('guru', (data) => {
      if (data && Array.isArray(data)) {
        setGuruList(data);
        localStorage.setItem('sim_guru', JSON.stringify(data));
      }
    });
    const unsubAbsSantri = subscribeMasterDataFromFirestore<AbsensiSantriRecord[]>('absensi_santri', (data) => {
      if (data && Array.isArray(data)) {
        setAbsensiSantriList(data);
        localStorage.setItem('sim_absensi_santri', JSON.stringify(data));
      }
    });
    const unsubAbsGuru = subscribeMasterDataFromFirestore<AbsensiGuruRecord[]>('absensi_guru', (data) => {
      if (data && Array.isArray(data)) {
        setAbsensiGuruList(data);
        localStorage.setItem('sim_absensi_guru', JSON.stringify(data));
      }
    });
    const unsubPengurus = subscribeMasterDataFromFirestore<Pengurus[]>('pengurus', (data) => {
      if (data && Array.isArray(data)) {
        setPengurusList(prev => syncPengurusWithGuru(data, guruList));
        localStorage.setItem('sim_pengurus', JSON.stringify(data));
      }
    });
    const unsubJadwal = subscribeMasterDataFromFirestore<JadwalPelajaran[]>('jadwal', (data) => {
      if (data && Array.isArray(data)) {
        setJadwalList(data);
        localStorage.setItem('sim_jadwal', JSON.stringify(data));
      }
    });

    return () => {
      unsubscribe();
      unsubSantri();
      unsubGuru();
      unsubAbsSantri();
      unsubAbsGuru();
      unsubPengurus();
      unsubJadwal();
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
        const cleaned = deduplicateSantriList(remoteSantri);
        setSantriList(cleaned);
        localStorage.setItem('sim_santri', JSON.stringify(cleaned));
      }
      if (remoteGuru && remoteGuru.length > 0) {
        const cleaned = deduplicateGuruList(remoteGuru);
        setGuruList(cleaned);
        localStorage.setItem('sim_guru', JSON.stringify(cleaned));
      }
      if (remoteJadwal && remoteJadwal.length > 0) {
        setJadwalList(remoteJadwal);
        localStorage.setItem('sim_jadwal', JSON.stringify(remoteJadwal));
        broadcastScheduleUpdate(remoteJadwal, 'Sheets');
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
      const cleaned = deduplicateSantriList(imported.santriList);
      setSantriList(cleaned);
      localStorage.setItem('sim_santri', JSON.stringify(cleaned));
    }
    if (imported.guruList && imported.guruList.length > 0) {
      const cleaned = deduplicateGuruList(imported.guruList);
      setGuruList(cleaned);
      localStorage.setItem('sim_guru', JSON.stringify(cleaned));
    }
    if (imported.jadwalList && imported.jadwalList.length > 0) {
      setJadwalList(imported.jadwalList);
      localStorage.setItem('sim_jadwal', JSON.stringify(imported.jadwalList));
      broadcastScheduleUpdate(imported.jadwalList, 'Import');
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
      // Jika dibuka di dalam Web App PWA (Layar Utama HP), cegah redirect keluar agar PWA tidak restart
      if (isStandaloneApp()) {
        console.info('Lingkungan PWA Web App terdeteksi: Masuk langsung sebagai Admin tanpa redirect');
        setShowDoors(true);
        const newSession: AuthSession = {
          role: 'admin',
          identifier: 'admin_webapp'
        };
        setSession(newSession);
        localStorage.setItem('sim_auth_session', JSON.stringify(newSession));
        return;
      }

      if (isMobileDevice()) {
        console.info('Lingkungan browser HP terdeteksi: menjalankan signInWithRedirect agar popup tidak diblokir/restart...');
        await signInWithGoogleFirebase(true);
        return;
      }

      // Pada Laptop/Desktop, coba Popup dengan fallback Redirect jika popup terblokir
      let fbEmail = '';
      try {
        const fbUser = await signInWithGoogleFirebase();
        if (fbUser) fbEmail = fbUser.email || '';
      } catch (fbErr: any) {
        if (fbErr?.code === 'auth/popup-blocked') {
          console.warn('Popup terblokir, mengalihkan ke signInWithRedirect...');
          await signInWithGoogleFirebase(true);
          return;
        }
        console.warn('Firebase popup sign in fallback:', fbErr);
      }

      const res = await googleSignIn();
      if (res?.user || fbEmail) {
        setIsGoogleConnected(true);
        setShowDoors(true);
        const newSession: AuthSession = {
          role: 'admin',
          identifier: fbEmail || res?.user?.email || res?.user?.displayName || 'admin_google'
        };
        setSession(newSession);
        localStorage.setItem('sim_auth_session', JSON.stringify(newSession));
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
    localStorage.removeItem('sim_auth_session');
    setActiveTab('dashboard');
  };

  // Mutator actions
  const handleSaveAbsensiSantri = async (records: AbsensiSantriRecord[]) => {
    setAbsensiSantriList(prev => {
      const keys = new Set(records.map(r => `${r.tanggal}_${r.idSantri || r.nama}`));
      const filtered = prev.filter(p => !keys.has(`${p.tanggal}_${p.idSantri || p.nama}`));
      const updated = [...records, ...filtered];
      try {
        localStorage.setItem('sim_absensi_santri', JSON.stringify(updated));
        saveMasterDataToFirestore('absensi_santri', updated);
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
        saveMasterDataToFirestore('absensi_guru', updated);
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

  const handleDeleteAbsensiSantri = (target: AbsensiSantriRecord) => {
    setAbsensiSantriList(prev => {
      const updated = prev.filter(p => !(p.tanggal === target.tanggal && (p.idSantri === target.idSantri || p.nama === target.nama)));
      try {
        localStorage.setItem('sim_absensi_santri', JSON.stringify(updated));
        saveMasterDataToFirestore('absensi_santri', updated);
      } catch {}
      return updated;
    });
    try {
      const savedH = localStorage.getItem('sim_rekap_santri_harian_history');
      if (savedH) {
        const parsed = JSON.parse(savedH);
        const filteredH = parsed.filter((p: any) => !(p.tanggal === target.tanggal && (p.idSantri === target.idSantri || p.nama === target.nama)));
        localStorage.setItem('sim_rekap_santri_harian_history', JSON.stringify(filteredH));
      }
    } catch {}
  };

  const handleDeleteAbsensiGuru = (target: AbsensiGuruRecord) => {
    setAbsensiGuruList(prev => {
      const updated = prev.filter(p => !(p.tanggal === target.tanggal && p.nama === target.nama && p.kelas === target.kelas && String(p.jamKe) === String(target.jamKe)));
      try {
        localStorage.setItem('sim_absensi_guru', JSON.stringify(updated));
        saveMasterDataToFirestore('absensi_guru', updated);
      } catch {}
      return updated;
    });
    try {
      const savedH = localStorage.getItem('sim_rekap_guru_harian_history');
      if (savedH) {
        const parsed = JSON.parse(savedH);
        const filteredH = parsed.filter((p: any) => !(p.tanggal === target.tanggal && p.nama === target.nama && p.kelas === target.kelas && String(p.jamKe) === String(target.jamKe)));
        localStorage.setItem('sim_rekap_guru_harian_history', JSON.stringify(filteredH));
      }
    } catch {}
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
    saveMasterDataToFirestore('santri', updated);
  };

  const handleBatchUpdateSantri = (updatedList: Santri[], updatedSettings?: Partial<AppSettings>) => {
    const cleaned = deduplicateSantriList(updatedList);
    setSantriList(cleaned);
    localStorage.setItem('sim_santri', JSON.stringify(cleaned));
    saveMasterDataToFirestore('santri', cleaned);

    if (updatedSettings) {
      const mergedSettings = { ...settings, ...updatedSettings };
      setSettings(mergedSettings);
      localStorage.setItem('sim_settings', JSON.stringify(mergedSettings));
      saveMasterDataToFirestore('settings', mergedSettings);
    }
  };

  const handleUpdateSantriProfile = (updatedSantri: Santri, oldId?: string) => {
    const targetId = oldId || updatedSantri.id;
    const updated = santriList.map(s => s.id === targetId ? updatedSantri : s);
    const cleaned = deduplicateSantriList(updated);
    setSantriList(cleaned);
    localStorage.setItem('sim_santri', JSON.stringify(cleaned));
    saveMasterDataToFirestore('santri', cleaned);

    // Jika NIS berubah, perbarui referensi relasi data santri agar tidak terputus
    if (oldId && oldId !== updatedSantri.id) {
      setAbsensiSantriList(prev => {
        const u = prev.map(a => a.idSantri === oldId ? { ...a, idSantri: updatedSantri.id, namaSantri: updatedSantri.nama } : a);
        localStorage.setItem('sim_absensi_santri', JSON.stringify(u));
        saveMasterDataToFirestore('absensiSantri', u);
        return u;
      });
      setNilaiList(prev => {
        const u = prev.map(n => n.idSantri === oldId ? { ...n, idSantri: updatedSantri.id, nama: updatedSantri.nama } : n);
        localStorage.setItem('sim_nilai', JSON.stringify(u));
        saveMasterDataToFirestore('nilai', u);
        return u;
      });
      setNadzhomList(prev => {
        const u = prev.map(n => n.idSantri === oldId ? { ...n, idSantri: updatedSantri.id, nama: updatedSantri.nama } : n);
        localStorage.setItem('sim_nadzhom', JSON.stringify(u));
        saveMasterDataToFirestore('nadzhom', u);
        return u;
      });
      setSyahriyahList(prev => {
        const u = prev.map(s => s.idSantri === oldId ? { ...s, idSantri: updatedSantri.id, namaSantri: updatedSantri.nama } : s);
        localStorage.setItem('sim_syahriyah', JSON.stringify(u));
        saveMasterDataToFirestore('syahriyah', u);
        return u;
      });
      setUangSakuList(prev => {
        const u = prev.map(s => s.idSantri === oldId ? { ...s, idSantri: updatedSantri.id, namaSantri: updatedSantri.nama } : s);
        localStorage.setItem('sim_uang_saku', JSON.stringify(u));
        saveMasterDataToFirestore('uangSaku', u);
        return u;
      });
    }

    if (session?.role === 'wali_santri' && (session.identifier === targetId || session.identifier === updatedSantri.id)) {
      setSession({
        ...session,
        identifier: updatedSantri.id,
        santriData: updatedSantri
      });
    }
  };

  const handleDeleteSantri = (id: string) => {
    const target = santriList.find(s => s.id === id);
    const updated = santriList.filter(s => s.id !== id);
    setSantriList(updated);
    localStorage.setItem('sim_santri', JSON.stringify(updated));
    saveMasterDataToFirestore('santri', updated);

    // Also remove from active session if logged in as that santri
    if (session?.role === 'wali_santri' && session.identifier === id) {
      setSession(null);
    }
    alert(`Data santri "${target?.nama || id}" telah berhasil dihapus dari database pondok pesantren.`);
  };

  const handleSaveNewGuru = (newGuru: GuruPengajar) => {
    const withId: GuruPengajar = {
      ...newGuru,
      id: newGuru.id || `GP-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    };
    const updated = deduplicateGuruList([withId, ...guruList]);
    setGuruList(updated);
    localStorage.setItem('sim_guru', JSON.stringify(updated));
    saveMasterDataToFirestore('guru', updated);
  };

  const handleDeleteGuru = (idOrName: string) => {
    const target = guruList.find(g => (g.id && g.id === idOrName) || g.nama === idOrName);
    const updated = guruList.filter(g => (g.id ? g.id !== idOrName : true) && g.nama !== idOrName);
    setGuruList(updated);
    localStorage.setItem('sim_guru', JSON.stringify(updated));
    saveMasterDataToFirestore('guru', updated);
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
        saveMasterDataToFirestore('guru', upGuru);
      }
    }
  };

  const handleDeleteSilabus = (id: string) => {
    const updated = silabusList.filter(s => s.id !== id);
    setSilabusList(updated);
    localStorage.setItem('sim_silabus', JSON.stringify(updated));
  };

  const handleSaveNewJadwal = (newJadwal: JadwalPelajaran, oldJadwal?: JadwalPelajaran) => {
    let updated: JadwalPelajaran[];
    let existingIdx = -1;

    if (oldJadwal) {
      existingIdx = jadwalList.findIndex(j => 
        (oldJadwal.id && j.id && j.id === oldJadwal.id) ||
        (j.kelas === oldJadwal.kelas && j.hari === oldJadwal.hari && j.jamKe === oldJadwal.jamKe && j.mapel === oldJadwal.mapel) ||
        (j.kelas === oldJadwal.kelas && j.hari === oldJadwal.hari && j.jamKe === oldJadwal.jamKe)
      );
    }
    if (existingIdx === -1 && newJadwal.id) {
      existingIdx = jadwalList.findIndex(j => j.id === newJadwal.id);
    }
    if (existingIdx === -1) {
      existingIdx = jadwalList.findIndex(j => j.kelas === newJadwal.kelas && j.hari === newJadwal.hari && j.jamKe === newJadwal.jamKe);
    }

    if (existingIdx >= 0) {
      updated = [...jadwalList];
      updated[existingIdx] = newJadwal;
    } else {
      updated = [...jadwalList, newJadwal];
    }
    setJadwalList(updated);
    localStorage.setItem('sim_jadwal', JSON.stringify(updated));
    saveMasterDataToFirestore('jadwal', updated);
    broadcastScheduleUpdate(updated, 'Admin');
  };

  const handleDeleteJadwal = (targetJadwal: JadwalPelajaran) => {
    const updated = jadwalList.filter(j => {
      if (targetJadwal.id && j.id) return j.id !== targetJadwal.id;
      return !(j.kelas === targetJadwal.kelas && j.hari === targetJadwal.hari && j.jamKe === targetJadwal.jamKe && j.mapel === targetJadwal.mapel);
    });
    setJadwalList(updated);
    localStorage.setItem('sim_jadwal', JSON.stringify(updated));
    saveMasterDataToFirestore('jadwal', updated);
    broadcastScheduleUpdate(updated, 'Admin');
  };

  const handleSaveNadzhom = (rec: NadzhomRecord) => {
    const existingIdx = nadzhomList.findIndex(n => 
      (rec.idRow !== undefined && n.idRow === rec.idRow) ||
      (n.idSantri === rec.idSantri && n.kitab.trim().toLowerCase() === rec.kitab.trim().toLowerCase())
    );
    let updated: NadzhomRecord[];
    if (existingIdx >= 0) {
      updated = [...nadzhomList];
      updated[existingIdx] = { ...updated[existingIdx], ...rec };
    } else {
      updated = [rec, ...nadzhomList];
    }
    setNadzhomList(updated);
    localStorage.setItem('sim_nadzhom', JSON.stringify(updated));
    saveMasterDataToFirestore('nadzhom', updated);

    // Sinkronisasi langsung ke profil santri agar wali santri melihat perubahan di dashboard secara real-time
    const target = santriList.find(s => s.id === rec.idSantri);
    if (target) {
      handleUpdateSantriProfile({
        ...target,
        kitabMuhafadzoh: rec.kitab,
        nilaiMuhafadzoh: rec.bait,
        predikatMuhafadzoh: rec.nilai,
        catatanMuhafadzoh: rec.catatan
      });
    }
  };

  const handleSaveBatchNadzhom = (records: NadzhomRecord[]) => {
    const map = new Map<string, NadzhomRecord>();
    nadzhomList.forEach(n => {
      const key = `${n.idSantri}__${n.kitab.trim().toLowerCase()}`;
      map.set(key, n);
    });
    records.forEach(r => {
      const key = `${r.idSantri}__${r.kitab.trim().toLowerCase()}`;
      map.set(key, { ...(map.get(key) || {}), ...r });
    });
    const updated = Array.from(map.values());
    setNadzhomList(updated);
    localStorage.setItem('sim_nadzhom', JSON.stringify(updated));
    saveMasterDataToFirestore('nadzhom', updated);

    // Sinkronisasi ke profil santri agar wali santri melihat nilai muhafadzoh terbaru secara real-time
    records.forEach(r => {
      const target = santriList.find(s => s.id === r.idSantri);
      if (target) {
        handleUpdateSantriProfile({
          ...target,
          kitabMuhafadzoh: r.kitab,
          nilaiMuhafadzoh: r.bait,
          predikatMuhafadzoh: r.nilai,
          catatanMuhafadzoh: r.catatan
        });
      }
    });
  };

  const handleDeleteNadzhom = (rec: NadzhomRecord) => {
    const updated = nadzhomList.filter(n => !(n.idSantri === rec.idSantri && n.kitab === rec.kitab && n.tanggal === rec.tanggal));
    setNadzhomList(updated);
    localStorage.setItem('sim_nadzhom', JSON.stringify(updated));
    saveMasterDataToFirestore('nadzhom', updated);
  };

  const handleSaveNilai = (rec: NilaiUjianRecord) => {
    const existingIdx = nilaiList.findIndex(
      n => n.idSantri === rec.idSantri &&
           n.pelajaran.trim().toLowerCase() === rec.pelajaran.trim().toLowerCase() &&
           n.semester === rec.semester
    );
    let updated: NilaiUjianRecord[];
    if (existingIdx >= 0) {
      updated = [...nilaiList];
      updated[existingIdx] = { ...updated[existingIdx], ...rec };
    } else {
      updated = [rec, ...nilaiList];
    }
    setNilaiList(updated);
    localStorage.setItem('sim_nilai', JSON.stringify(updated));
    saveMasterDataToFirestore('nilai', updated);
  };

  const handleSaveBatchNilai = (records: NilaiUjianRecord[]) => {
    const map = new Map<string, NilaiUjianRecord>();
    nilaiList.forEach(n => {
      const key = `${n.idSantri}__${n.pelajaran.trim().toLowerCase()}__${n.semester}`;
      map.set(key, n);
    });
    records.forEach(r => {
      const key = `${r.idSantri}__${r.pelajaran.trim().toLowerCase()}__${r.semester}`;
      map.set(key, { ...(map.get(key) || {}), ...r });
    });
    const updated = Array.from(map.values());
    setNilaiList(updated);
    localStorage.setItem('sim_nilai', JSON.stringify(updated));
    saveMasterDataToFirestore('nilai', updated);
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
    saveMasterDataToFirestore('syahriyah', updated);
  };

  const handleSaveUangSaku = (rec: UangSakuRecord) => {
    const updated = [rec, ...uangSakuList];
    setUangSakuList(updated);
    localStorage.setItem('sim_uang_saku', JSON.stringify(updated));
    saveMasterDataToFirestore('uang_saku', updated);
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
    saveMasterDataToFirestore('pengurus', updated);

    // Sinkronisasi real-time ke data guru pengajar
    setGuruList(prev => {
      const upGuru = prev.map(g => {
        if ((g.id && g.id === upP.id) || g.nama.toLowerCase().trim() === upP.nama.toLowerCase().trim()) {
          return {
            ...g,
            nama: upP.nama,
            kelas: upP.kelasBimbingan || g.kelas,
            mapel: upP.mapel || g.mapel,
            noWa: upP.noWa || g.noWa,
            jabatan: upP.jabatan || g.jabatan
          };
        }
        return g;
      });
      localStorage.setItem('sim_guru', JSON.stringify(upGuru));
      saveMasterDataToFirestore('guru', upGuru);
      return upGuru;
    });

    if (session?.role === 'pengurus' && (session.identifier === upP.id || session.identifier === upP.nama)) {
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
  if (session?.role === 'wali_santri') {
    const targetId = session.santriData?.id || session.identifier;
    const liveSantri = santriList.find(s => s.id === targetId) || session.santriData || santriList[0];
    if (liveSantri) {
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
  }

  // 2. If logged in as Pengurus -> render PengurusDashboard
  if (session?.role === 'pengurus') {
    const livePengurus = session.pengurusData || pengurusList.find(p => p.id === session.identifier) || pengurusList[0];
    if (livePengurus) {
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
            onDeleteAbsensiSantri={handleDeleteAbsensiSantri}
            onDeleteAbsensiGuru={handleDeleteAbsensiGuru}
            onSaveNewSantri={handleSaveNewSantri}
            onSaveNewGuru={handleSaveNewGuru}
            onDeleteGuru={handleDeleteGuru}
            onSaveNewJadwal={handleSaveNewJadwal}
            onDeleteJadwal={handleDeleteJadwal}
            onSaveNadzhom={handleSaveNadzhom}
            onSaveBatchNadzhom={handleSaveBatchNadzhom}
            onDeleteNadzhom={handleDeleteNadzhom}
            onSaveNilai={handleSaveNilai}
            onSaveBatchNilai={handleSaveBatchNilai}
            onSaveSettings={handleSaveSettings}
            onSaveDashboardAndReset={handleSaveDashboardAndReset}
            onUpdateSantriProfile={handleUpdateSantriProfile}
            onBatchUpdateSantri={handleBatchUpdateSantri}
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
            onSubmitIzinMengajar={handleAddIzinMengajar}
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
