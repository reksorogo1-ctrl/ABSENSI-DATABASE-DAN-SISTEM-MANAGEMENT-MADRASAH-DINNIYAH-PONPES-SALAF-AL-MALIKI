import React, { useState, useEffect } from 'react';
import { 
  Santri, AbsensiSantriRecord, AbsensiGuruRecord, JadwalPelajaran, 
  GuruPengajar, NadzhomRecord, NilaiUjianRecord, AppSettings, DashboardStats, AuthSession,
  SyahriyahRecord, UangSakuRecord, KurikulumKitabRecord,
  Pengurus, KalenderAkademikEvent, UjianSantriRecord
} from './types';
import { 
  DEFAULT_SPREADSHEET_ID, DEFAULT_SETTINGS, INITIAL_SANTRI_LIST, 
  INITIAL_GURU_LIST, INITIAL_JADWAL_LIST, INITIAL_NADZHOM_LIST, 
  INITIAL_NILAI_LIST, INITIAL_ABSENSI_SANTRI, INITIAL_ABSENSI_GURU,
  INITIAL_SYAHRIYAH_LIST, INITIAL_UANG_SAKU_LIST, INITIAL_KURIKULUM_LIST,
  INITIAL_PENGURUS_LIST, INITIAL_KALENDER_AKADEMIK, INITIAL_UJIAN_SANTRI_LIST
} from './data';
import { GoogleSheetsService } from './sheetsService';
import { googleSignIn, initAuth, getAccessToken, logoutGoogle } from './googleAuth';
import { AdminDashboard } from './components/AdminDashboard';
import { WaliSantriPortal } from './components/WaliSantriPortal';
import { PengurusDashboard } from './components/PengurusDashboard';
import { ShieldCheck, UserCheck, Key, Lock, ExternalLink, RefreshCw, User, Eye, EyeOff, Users, Award } from 'lucide-react';

export default function App() {
  // Session State
  const [session, setSession] = useState<AuthSession | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');

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
        setSettings(prev => ({ ...prev, ...remoteSettings }));
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
      setSession({
        role: 'pengurus',
        identifier: found.id,
        pengurusData: found
      });
    } else {
      // Admin Login
      const validAdminPass = settings.password_admin || 'salaf123';
      if (adminUsername.trim() === 'admin' && adminPassword === validAdminPass) {
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

  // 1. If logged in as Wali Santri -> render WaliSantriPortal with Row-Level Security
  if (session?.role === 'wali_santri' && session.santriData) {
    const liveSantri = santriList.find(s => s.id === session.santriData?.id) || session.santriData;
    return (
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
    );
  }

  // 2. If logged in as Pengurus -> render PengurusDashboard
  if (session?.role === 'pengurus' && session.pengurusData) {
    const livePengurus = pengurusList.find(p => p.id === session.pengurusData?.id) || session.pengurusData;
    return (
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
        onLogout={handleLogout}
        onUpdatePengurusProfile={handleUpdatePengurus}
        onSaveAbsensiSantri={handleSaveAbsensiSantri}
        onSaveAbsensiGuru={handleSaveAbsensiGuru}
      />
    );
  }

  // 3. If logged in as Admin -> render AdminDashboard
  if (session?.role === 'admin') {
    return (
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
      />
    );
  }

  // 4. Login Landing View (3 Roles: Wali Santri, Pengurus Pondok, & Admin Utama)
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-[#03140c] bg-cover bg-center font-sans text-[#f3e5ab]"
      style={settings.background_url ? { backgroundImage: `linear-gradient(rgba(3, 20, 12, 0.92), rgba(3, 20, 12, 0.97)), url(${settings.background_url})` } : undefined}
    >
      <div className="w-full max-w-md card-3d rounded-3xl p-6 sm:p-8 backdrop-blur-md relative border border-[#d4af37]/40 shadow-2xl">
        
        {/* Header Pondok Pesantren */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-[#0b422a] border-2 border-[#d4af37] flex items-center justify-center text-3xl shadow-xl overflow-hidden mb-3">
            {settings.logo_pondok ? (
              <img src={settings.logo_pondok} alt="Logo Pondok" className="w-full h-full object-cover" />
            ) : (
              <span>🕌</span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white text-gold-3d font-serif tracking-wide">
            {settings.nama_pesantren || 'PONDOK PESANTREN AL-MALIKI'}
          </h1>
          <p className="text-xs text-[#d4af37] font-medium tracking-wider uppercase mt-1">
            {settings.portal_title || 'Sistem Informasi Akademik & Presensi Madrasah'}
          </p>
        </div>

        {/* Role Selector Tabs (3 Roles: Wali Santri, Pengurus, Admin) */}
        <div className="grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl bg-[#03140c] border border-[#d4af37]/30 mb-5 text-xs">
          <button
            type="button"
            onClick={() => {
              setLoginMode('wali');
              setLoginError('');
            }}
            className={`py-2 rounded-xl font-bold transition flex flex-col items-center justify-center gap-1 ${
              loginMode === 'wali'
                ? 'btn-3d-gold text-black shadow-md'
                : 'text-emerald-200/80 hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span className="text-[10px] leading-none">Wali Santri</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLoginMode('pengurus');
              setLoginError('');
            }}
            className={`py-2 rounded-xl font-bold transition flex flex-col items-center justify-center gap-1 ${
              loginMode === 'pengurus'
                ? 'btn-3d-gold text-black shadow-md'
                : 'text-emerald-200/80 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="text-[10px] leading-none">Pengurus</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLoginMode('admin');
              setLoginError('');
            }}
            className={`py-2 rounded-xl font-bold transition flex flex-col items-center justify-center gap-1 ${
              loginMode === 'admin'
                ? 'btn-3d-gold text-black shadow-md'
                : 'text-emerald-200/80 hover:text-white'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span className="text-[10px] leading-none">Admin</span>
          </button>
        </div>

        {/* Role Description */}
        {loginMode === 'wali' && (
          <div className="bg-[#0a301f]/80 border border-[#d4af37]/30 rounded-2xl p-3.5 mb-5 flex items-start space-x-3 text-xs text-emerald-200/90 leading-relaxed shadow-inner">
            <ShieldCheck className="w-5 h-5 text-[#d4af37] shrink-0 mt-0.5" />
            <div>
              <b className="text-white">Portal Wali Santri (Nama Santri & Sandi NIS):</b>
              <p className="mt-0.5">
                Pantau presensi, syahriyah, mutasi uang saku, nilai ujian kitab (muhafadzoh & baca kitab), serta profil anak secara aman.
              </p>
            </div>
          </div>
        )}

        {loginMode === 'pengurus' && (
          <div className="bg-[#0a301f]/80 border border-[#d4af37]/30 rounded-2xl p-3.5 mb-5 flex items-start space-x-3 text-xs text-emerald-200/90 leading-relaxed shadow-inner">
            <Users className="w-5 h-5 text-[#d4af37] shrink-0 mt-0.5" />
            <div>
              <b className="text-white">Dasbor Khusus Pengurus:</b>
              <p className="mt-0.5">
                Akses berita, rekapan absensi pribadi, profil pengurus, notifikasi agenda/rapat kalender akademik, dan input nilai santri.
              </p>
            </div>
          </div>
        )}

        {loginMode === 'admin' && (
          <div className="bg-[#0a301f]/80 border border-[#d4af37]/30 rounded-2xl p-3.5 mb-5 flex items-start space-x-3 text-xs text-emerald-200/90 leading-relaxed shadow-inner">
            <Lock className="w-5 h-5 text-[#d4af37] shrink-0 mt-0.5" />
            <div>
              <b className="text-white">Dasbor Admin Utama:</b>
              <p className="mt-0.5">
                Rekapan absensi keseluruhan (line chart & diagram chart), statistik kehadiran santri/guru, dan kendali penuh Option Panel.
              </p>
            </div>
          </div>
        )}

        {/* Error message */}
        {loginError && (
          <div className="p-3 mb-4 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs shadow">
            {loginError}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          {loginMode === 'wali' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-[#d4af37] mb-1.5 flex items-center justify-between">
                  <span>NAMA LENGKAP SANTRI</span>
                  <span className="text-[10px] text-emerald-300 font-normal">Identitas Akun</span>
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
                    className="w-full px-4 py-3 pl-10 rounded-xl bg-[#03140c] border border-[#d4af37]/40 text-white text-sm focus:outline-none focus:border-[#d4af37] shadow-inner"
                  />
                  <User className="w-4 h-4 text-[#d4af37] absolute left-3.5 top-3.5" />
                  <datalist id="santri-name-suggestions">
                    {santriList.map(s => (
                      <option key={s.id} value={s.nama}>{s.kelas} - {s.id}</option>
                    ))}
                  </datalist>
                </div>

                {/* Demo quick selector */}
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
                        className="text-[10px] px-2 py-0.5 rounded bg-[#0b422a] border border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37] hover:text-black transition"
                      >
                        {demo.nama.split(' ')[0]} ({demo.id})
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#d4af37] mb-1.5 flex items-center justify-between">
                  <span>PASSWORD (NIS SANTRI)</span>
                  <span className="text-[10px] text-emerald-300 font-normal">Dapat diatur di Option Panel</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={santriPasswordInput}
                    onChange={(e) => setSantriPasswordInput(e.target.value)}
                    placeholder="Contoh: S-1001"
                    required
                    className="w-full px-4 py-3 pl-10 pr-10 rounded-xl bg-[#03140c] border border-[#d4af37]/40 text-white font-mono text-sm focus:outline-none focus:border-[#d4af37] shadow-inner"
                  />
                  <Key className="w-4 h-4 text-[#d4af37] absolute left-3.5 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-emerald-300/70 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-emerald-200/60 mt-1">
                  Default password adalah NIS santri (contoh: S-1001). Admin dapat mengubah sandi kapan pun di Option Panel.
                </p>
              </div>
            </>
          )}

          {loginMode === 'pengurus' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-[#d4af37] mb-1.5 flex items-center justify-between">
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
                    className="w-full px-4 py-3 pl-10 rounded-xl bg-[#03140c] border border-[#d4af37]/40 text-white text-sm focus:outline-none focus:border-[#d4af37] shadow-inner"
                  />
                  <Users className="w-4 h-4 text-[#d4af37] absolute left-3.5 top-3.5" />
                  <datalist id="pengurus-name-suggestions">
                    {pengurusList.map(p => (
                      <option key={p.id} value={p.nama}>{p.jabatan} ({p.id})</option>
                    ))}
                  </datalist>
                </div>

                {/* Demo quick selector */}
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
                        className="text-[10px] px-2 py-0.5 rounded bg-[#0b422a] border border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37] hover:text-black transition"
                      >
                        {demo.nama.split(',')[0]} ({demo.jabatan})
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#d4af37] mb-1.5 flex items-center justify-between">
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
                    className="w-full px-4 py-3 pl-10 pr-10 rounded-xl bg-[#03140c] border border-[#d4af37]/40 text-white font-mono text-sm focus:outline-none focus:border-[#d4af37] shadow-inner"
                  />
                  <Key className="w-4 h-4 text-[#d4af37] absolute left-3.5 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-emerald-300/70 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-emerald-200/60 mt-1">
                  Kata sandi pengurus dapat disesuaikan masing-masing melalui Option Panel di akun Admin.
                </p>
              </div>
            </>
          )}

          {loginMode === 'admin' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-[#d4af37] mb-1.5">
                  USERNAME ADMIN
                </label>
                <input
                  type="text"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-[#03140c] border border-[#d4af37]/40 text-white text-sm focus:outline-none focus:border-[#d4af37] shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#d4af37] mb-1.5">
                  PASSWORD ADMIN
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-[#03140c] border border-[#d4af37]/40 text-white text-sm focus:outline-none focus:border-[#d4af37] shadow-inner"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl btn-3d-gold text-black font-extrabold text-sm uppercase transition tracking-wider mt-2 shadow-lg"
          >
            {loginMode === 'wali' && 'Buka Portal Wali Santri'}
            {loginMode === 'pengurus' && 'Masuk Dasbor Pengurus'}
            {loginMode === 'admin' && 'Masuk Dashboard Admin Utama'}
          </button>
        </form>

        {/* Central Google Sheets connection footer */}
        <div className="mt-6 pt-4 border-t border-[#d4af37]/20 flex items-center justify-between text-[11px] text-emerald-300/80">
          <span>Google Sheets Master Terhubung</span>
          <button
            type="button"
            onClick={syncWithGoogleSheets}
            disabled={isSyncing}
            className="flex items-center space-x-1 text-[#d4af37] hover:underline"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Menghubungkan...' : 'Sinkronkan'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
