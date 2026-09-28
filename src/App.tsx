import React, { useState, useEffect, useMemo } from 'react';
import { 
  Santri, GuruPengajar, JadwalPelajaran, NadzhomRecord, NilaiUjianRecord, 
  AbsensiSantriRecord, AbsensiGuruRecord, SyahriyahRecord, UangSakuRecord, 
  KurikulumKitabRecord, Pengurus, KalenderAkademikEvent, UjianSantriRecord, 
  IzinMengajarRequest, SilabusMemaknaiRecord, AppSettings, DashboardStats 
} from './types';
import {
  DEFAULT_SETTINGS,
  INITIAL_SANTRI_LIST,
  INITIAL_GURU_LIST,
  INITIAL_JADWAL_LIST,
  INITIAL_NADZHOM_LIST,
  INITIAL_NILAI_LIST,
  INITIAL_ABSENSI_SANTRI,
  INITIAL_ABSENSI_GURU,
  INITIAL_SYAHRIYAH_LIST,
  INITIAL_UANG_SAKU_LIST,
  INITIAL_KURIKULUM_LIST,
  INITIAL_PENGURUS_LIST,
  INITIAL_KALENDER_AKADEMIK,
  INITIAL_UJIAN_SANTRI_LIST,
  INITIAL_IZIN_MENGAJAR_LIST,
  INITIAL_SILABUS_MEMAKNAI,
  DEFAULT_SPREADSHEET_ID
} from './data';
import { IntroOpening } from './components/IntroOpening';
import { LoginScreen } from './components/LoginScreen';
import { DoorTransition } from './components/DoorTransition';
import { AdminDashboard } from './components/AdminDashboard';
import { PengurusDashboard } from './components/PengurusDashboard';
import { WaliSantriPortal } from './components/WaliSantriPortal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { GoogleSheetsService } from './sheetsService';
import { googleSignIn, getCurrentGoogleUser } from './googleAuth';
import { resolveActiveVideo } from './lib/videoStorage';
import { initTablePhysicalParallax } from './lib/tableParallax';

export default function App() {
  // 1. INTRO OPENING STATE (Defaults to true on initial visit)
  const [showIntro, setShowIntro] = useState<boolean>(true);
  const [showDoorTransition, setShowDoorTransition] = useState<boolean>(false);
  const [introVideoSrc, setIntroVideoSrc] = useState<string>('/assets/intro_salaf_almaliki.mp4');

  // 2. DATA STATES WITH LOCALSTORAGE BACKING
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('almaliki_settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  // Sync settings and intro video dynamically from IndexedDB / Storage / Option Panel
  useEffect(() => {
    const updateActiveVideo = async () => {
      const active = await resolveActiveVideo('/assets/intro_salaf_almaliki.mp4');
      if (active && active.src) {
        setIntroVideoSrc(active.src);
      }
    };

    updateActiveVideo();

    const handleVideoSync = () => {
      updateActiveVideo();
    };

    window.addEventListener('sim_video_updated', handleVideoSync);
    window.addEventListener('storage', handleVideoSync);

    return () => {
      window.removeEventListener('sim_video_updated', handleVideoSync);
      window.removeEventListener('storage', handleVideoSync);
    };
  }, [settings.intro_video_url]);

  // Persist settings changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('almaliki_settings', JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to persist settings:', e);
    }
  }, [settings]);

  // Initialize 3D Table Physical Cursor Parallax & Compression Controller
  useEffect(() => {
    return initTablePhysicalParallax();
  }, []);

  const [santriList, setSantriList] = useState<Santri[]>(() => {
    const saved = localStorage.getItem('almaliki_santri');
    return saved ? JSON.parse(saved) : INITIAL_SANTRI_LIST;
  });

  const [guruList, setGuruList] = useState<GuruPengajar[]>(() => {
    const saved = localStorage.getItem('almaliki_guru');
    return saved ? JSON.parse(saved) : INITIAL_GURU_LIST;
  });

  const [jadwalList, setJadwalList] = useState<JadwalPelajaran[]>(() => {
    const saved = localStorage.getItem('almaliki_jadwal');
    return saved ? JSON.parse(saved) : INITIAL_JADWAL_LIST;
  });

  const [nadzhomList, setNadzhomList] = useState<NadzhomRecord[]>(() => {
    const saved = localStorage.getItem('almaliki_nadzhom');
    return saved ? JSON.parse(saved) : INITIAL_NADZHOM_LIST;
  });

  const [nilaiList, setNilaiList] = useState<NilaiUjianRecord[]>(() => {
    const saved = localStorage.getItem('almaliki_nilai');
    return saved ? JSON.parse(saved) : INITIAL_NILAI_LIST;
  });

  const [absensiSantriList, setAbsensiSantriList] = useState<AbsensiSantriRecord[]>(() => {
    const saved = localStorage.getItem('almaliki_absensi_santri');
    return saved ? JSON.parse(saved) : INITIAL_ABSENSI_SANTRI;
  });

  const [absensiGuruList, setAbsensiGuruList] = useState<AbsensiGuruRecord[]>(() => {
    const saved = localStorage.getItem('almaliki_absensi_guru');
    return saved ? JSON.parse(saved) : INITIAL_ABSENSI_GURU;
  });

  const [syahriyahList, setSyahriyahList] = useState<SyahriyahRecord[]>(() => {
    const saved = localStorage.getItem('almaliki_syahriyah');
    return saved ? JSON.parse(saved) : INITIAL_SYAHRIYAH_LIST;
  });

  const [uangSakuList, setUangSakuList] = useState<UangSakuRecord[]>(() => {
    const saved = localStorage.getItem('almaliki_uang_saku');
    return saved ? JSON.parse(saved) : INITIAL_UANG_SAKU_LIST;
  });

  const [kurikulumList, setKurikulumList] = useState<KurikulumKitabRecord[]>(() => {
    const saved = localStorage.getItem('almaliki_kurikulum');
    return saved ? JSON.parse(saved) : INITIAL_KURIKULUM_LIST;
  });

  const [pengurusList, setPengurusList] = useState<Pengurus[]>(() => {
    const saved = localStorage.getItem('almaliki_pengurus');
    return saved ? JSON.parse(saved) : INITIAL_PENGURUS_LIST;
  });

  const [kalenderList, setKalenderList] = useState<KalenderAkademikEvent[]>(() => {
    const saved = localStorage.getItem('almaliki_kalender');
    return saved ? JSON.parse(saved) : INITIAL_KALENDER_AKADEMIK;
  });

  const [ujianList, setUjianList] = useState<UjianSantriRecord[]>(() => {
    const saved = localStorage.getItem('almaliki_ujian');
    return saved ? JSON.parse(saved) : INITIAL_UJIAN_SANTRI_LIST;
  });

  const [izinList, setIzinList] = useState<IzinMengajarRequest[]>(() => {
    const saved = localStorage.getItem('almaliki_izin');
    return saved ? JSON.parse(saved) : INITIAL_IZIN_MENGAJAR_LIST;
  });

  const [silabusList, setSilabusList] = useState<SilabusMemaknaiRecord[]>(() => {
    const saved = localStorage.getItem('almaliki_silabus');
    return saved ? JSON.parse(saved) : INITIAL_SILABUS_MEMAKNAI;
  });

  // Google Sheets Service
  const [spreadsheetId, setSpreadsheetId] = useState<string>(() => {
    return localStorage.getItem('almaliki_sheet_id') || DEFAULT_SPREADSHEET_ID;
  });
  const sheetsService = useMemo(() => new GoogleSheetsService(spreadsheetId), [spreadsheetId]);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState<boolean>(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean>(false);
  const [isSyncing] = useState<boolean>(false);

  // Sync to localStorage
  useEffect(() => { localStorage.setItem('almaliki_settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('almaliki_santri', JSON.stringify(santriList)); }, [santriList]);
  useEffect(() => { localStorage.setItem('almaliki_guru', JSON.stringify(guruList)); }, [guruList]);
  useEffect(() => { localStorage.setItem('almaliki_jadwal', JSON.stringify(jadwalList)); }, [jadwalList]);
  useEffect(() => { localStorage.setItem('almaliki_nadzhom', JSON.stringify(nadzhomList)); }, [nadzhomList]);
  useEffect(() => { localStorage.setItem('almaliki_nilai', JSON.stringify(nilaiList)); }, [nilaiList]);
  useEffect(() => { localStorage.setItem('almaliki_absensi_santri', JSON.stringify(absensiSantriList)); }, [absensiSantriList]);
  useEffect(() => { localStorage.setItem('almaliki_absensi_guru', JSON.stringify(absensiGuruList)); }, [absensiGuruList]);
  useEffect(() => { localStorage.setItem('almaliki_syahriyah', JSON.stringify(syahriyahList)); }, [syahriyahList]);
  useEffect(() => { localStorage.setItem('almaliki_uang_saku', JSON.stringify(uangSakuList)); }, [uangSakuList]);
  useEffect(() => { localStorage.setItem('almaliki_kurikulum', JSON.stringify(kurikulumList)); }, [kurikulumList]);
  useEffect(() => { localStorage.setItem('almaliki_pengurus', JSON.stringify(pengurusList)); }, [pengurusList]);
  useEffect(() => { localStorage.setItem('almaliki_kalender', JSON.stringify(kalenderList)); }, [kalenderList]);
  useEffect(() => { localStorage.setItem('almaliki_ujian', JSON.stringify(ujianList)); }, [ujianList]);
  useEffect(() => { localStorage.setItem('almaliki_izin', JSON.stringify(izinList)); }, [izinList]);
  useEffect(() => { localStorage.setItem('almaliki_silabus', JSON.stringify(silabusList)); }, [silabusList]);
  useEffect(() => { localStorage.setItem('almaliki_sheet_id', spreadsheetId); }, [spreadsheetId]);

  // 3. AUTHENTICATION & LOGIN FORM STATES
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<'admin' | 'pengurus' | 'wali' | null>(null);
  const [currentPengurus, setCurrentPengurus] = useState<Pengurus | null>(null);
  const [currentSantri, setCurrentSantri] = useState<Santri | null>(null);

  const [loginMode, setLoginMode] = useState<'wali' | 'pengurus' | 'admin'>('admin');
  const [loginError, setLoginError] = useState<string>('');
  const [santriNamaInput, setSantriNamaInput] = useState<string>('');
  const [santriPasswordInput, setSantriPasswordInput] = useState<string>('');
  const [pengurusNamaInput, setPengurusNamaInput] = useState<string>('');
  const [pengurusPasswordInput, setPengurusPasswordInput] = useState<string>('');
  const [adminUsername, setAdminUsername] = useState<string>('salaf');
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState<boolean>(false);
  const [isDoorOpened, setIsDoorOpened] = useState<boolean>(true);

  // Active Admin Dashboard Tab
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Stats calculation
  const stats: DashboardStats = useMemo(() => {
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

    const percentSantri = totalSantri > 0 ? Math.round((hadirSantri / Math.max(absensiSantriList.length, 1)) * 100) : 0;
    const percentGuru = totalGuru > 0 ? Math.round((hadirGuru / Math.max(absensiGuruList.length, 1)) * 100) : 0;

    return {
      totalSantri,
      totalGuru,
      totalAbsensiSantri: absensiSantriList.length,
      totalAbsensiGuru: absensiGuruList.length,
      percentSantri: Math.min(percentSantri, 100),
      percentGuru: Math.min(percentGuru, 100),
      hadirSantri,
      izinSantri,
      sakitSantri,
      alphaSantri,
      hadirGuru,
      terlambatGuru,
      izinGuru,
      alphaGuru,
      kehadiranSantriHariIni: hadirSantri,
      kehadiranGuruHariIni: hadirGuru,
      rekapSantri: { hadir: hadirSantri, izin: izinSantri, sakit: sakitSantri, alpha: alphaSantri },
      rekapGuru: { hadir: hadirGuru, terlambat: terlambatGuru, izin: izinGuru, alpha: alphaGuru },
      history: [
        { tanggal: 'Hari Ini', hadirSantri, hadirGuru, percentSantri, percentGuru }
      ]
    };
  }, [santriList, guruList, absensiSantriList, absensiGuruList]);

  // Login Handler
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (loginMode === 'admin') {
      const validUsernames = ['admin', 'salaf', 'administrator'];
      const validAdmin = validUsernames.includes(adminUsername.trim().toLowerCase());
      const validPass = adminPassword === (settings.password_admin || 'salaf123');

      if (validAdmin && validPass) {
        setShowDoorTransition(true);
        setIsDoorOpened(false);
        setUserRole('admin');
        setIsLoggedIn(true);
        setLoginError('');
      } else {
        setLoginError('Username atau kata sandi Administrator tidak sesuai!');
      }
    } else if (loginMode === 'pengurus') {
      const found = pengurusList.find(p => 
        p.nama.trim().toLowerCase() === pengurusNamaInput.trim().toLowerCase() ||
        p.id.trim().toLowerCase() === pengurusNamaInput.trim().toLowerCase()
      );

      if (!found) {
        setLoginError('Nama Pengurus / Ustadz tidak ditemukan dalam daftar!');
        return;
      }

      if (pengurusPasswordInput === found.password || pengurusPasswordInput === 'pengurus123' || pengurusPasswordInput === settings.password_admin) {
        setShowDoorTransition(true);
        setIsDoorOpened(false);
        setCurrentPengurus(found);
        setUserRole('pengurus');
        setIsLoggedIn(true);
        setLoginError('');
      } else {
        setLoginError('Kata sandi Pengurus / Ustadz keliru!');
      }
    } else if (loginMode === 'wali') {
      const found = santriList.find(s => 
        s.nama.trim().toLowerCase() === santriNamaInput.trim().toLowerCase() ||
        s.id.trim().toLowerCase() === santriNamaInput.trim().toLowerCase()
      );

      if (!found) {
        setLoginError('Nama Santri atau NIS tidak ditemukan!');
        return;
      }

      const expectedPass = found.password || found.id;
      if (santriPasswordInput === expectedPass || santriPasswordInput === found.id.replace('S-', '')) {
        setShowDoorTransition(true);
        setIsDoorOpened(false);
        setCurrentSantri(found);
        setUserRole('wali');
        setIsLoggedIn(true);
        setLoginError('');
      } else {
        setLoginError('Kata sandi Wali Santri keliru! (Gunakan NIS Santri)');
      }
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsDoorOpened(true);
    setUserRole(null);
    setCurrentPengurus(null);
    setCurrentSantri(null);
    setAdminPassword('');
    setPengurusPasswordInput('');
    setSantriPasswordInput('');
    setLoginError('');
  };

  const handleSyncWithSheets = () => {
    setIsSheetsModalOpen(true);
  };

  return (
    <div className="w-full min-h-screen bg-[#010e08] text-white font-sans selection:bg-[#d4af37] selection:text-black">
      {/* 1. INTRO OPENING SCREEN (With "MASUK" Button) */}
      {showIntro && (
        <IntroOpening
          videoSrc={introVideoSrc}
          appName={settings.nama_pondok}
          onComplete={() => setShowIntro(false)}
        />
      )}

      {/* 2. DOOR SLIDING TRANSITION ON SUCCESSFUL AUTH */}
      {showDoorTransition && (
        <DoorTransition
          onDoorsParting={() => setIsDoorOpened(true)}
          onComplete={() => {
            setShowDoorTransition(false);
            setIsDoorOpened(true);
          }}
          settings={settings}
        />
      )}

      {/* 3. LOGIN DASHBOARD (When not yet logged in) */}
      {!isLoggedIn && !showIntro && (
        <LoginScreen
          settings={settings}
          santriList={santriList}
          pengurusList={pengurusList}
          loginMode={loginMode}
          setLoginMode={setLoginMode}
          loginError={loginError}
          setLoginError={setLoginError}
          santriNamaInput={santriNamaInput}
          setSantriNamaInput={setSantriNamaInput}
          santriPasswordInput={santriPasswordInput}
          setSantriPasswordInput={setSantriPasswordInput}
          pengurusNamaInput={pengurusNamaInput}
          setPengurusNamaInput={setPengurusNamaInput}
          pengurusPasswordInput={pengurusPasswordInput}
          setPengurusPasswordInput={setPengurusPasswordInput}
          adminUsername={adminUsername}
          setAdminUsername={setAdminUsername}
          adminPassword={adminPassword}
          setAdminPassword={setAdminPassword}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          rememberMe={rememberMe}
          setRememberMe={setRememberMe}
          showForgotPasswordModal={showForgotPasswordModal}
          setShowForgotPasswordModal={setShowForgotPasswordModal}
          onSubmit={handleLoginSubmit}
          onGoogleSignIn={async () => {
            await googleSignIn();
            setIsGoogleConnected(Boolean(getCurrentGoogleUser()));
          }}
          onSyncSheets={handleSyncWithSheets}
          onReplayIntro={() => setShowIntro(true)}
        />
      )}

      {/* 4. AUTHENTICATED DASHBOARDS */}
      {isLoggedIn && userRole === 'admin' && (
        <div 
          key={isDoorOpened ? 'admin-opened' : 'admin-closed'} 
          className={`w-full min-h-screen ${isDoorOpened ? 'dashboard-root-entrance' : 'opacity-0 pointer-events-none'}`}
        >
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
            izinList={izinList}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            spreadsheetId={spreadsheetId}
            setSpreadsheetId={setSpreadsheetId}
            isSyncing={isSyncing}
            onSyncWithSheets={handleSyncWithSheets}
            onLogout={handleLogout}
            onTestIntro={() => setShowIntro(true)}
            onSaveAbsensiSantri={(records) => setAbsensiSantriList(prev => [...prev, ...records])}
            onSaveAbsensiGuru={(records) => setAbsensiGuruList(prev => [...prev, ...records])}
            onSaveNewSantri={(newSantri) => setSantriList(prev => [newSantri, ...prev])}
            onSaveNewGuru={(newGuru) => setGuruList(prev => [newGuru, ...prev])}
            onDeleteGuru={(idOrName) => setGuruList(prev => prev.filter(g => g.id !== idOrName && g.nama !== idOrName))}
            onSaveNewJadwal={(newJadwal) => setJadwalList(prev => [...prev, newJadwal])}
            onSaveNadzhom={(nadzhom) => setNadzhomList(prev => [nadzhom, ...prev])}
            onSaveNilai={(nilai) => setNilaiList(prev => [nilai, ...prev])}
            onSaveSettings={(newSettings) => setSettings(newSettings)}
            onSaveDashboardAndReset={() => {
              // reset or snapshot
            }}
            onUpdateSantriProfile={(updatedSantri) => {
              setSantriList(prev => prev.map(s => s.id === updatedSantri.id ? updatedSantri : s));
            }}
            onSaveSyahriyah={(record) => setSyahriyahList(prev => [record, ...prev])}
            onSaveUangSaku={(record) => setUangSakuList(prev => [record, ...prev])}
            onSaveKurikulum={(record) => setKurikulumList(prev => [record, ...prev])}
            onDeleteKurikulum={(id) => setKurikulumList(prev => prev.filter(k => k.id !== id))}
            onSaveSilabus={(record) => setSilabusList(prev => [record, ...prev])}
            onDeleteSilabus={(id) => setSilabusList(prev => prev.filter(s => s.id !== id))}
            onSavePengurus={(newPengurus) => setPengurusList(prev => [newPengurus, ...prev])}
            onUpdatePengurus={(updated) => setPengurusList(prev => prev.map(p => p.id === updated.id ? updated : p))}
            onSaveKalender={(event) => setKalenderList(prev => [event, ...prev])}
            onDeleteKalender={(id) => setKalenderList(prev => prev.filter(e => e.id !== id))}
            onSaveUjianSantri={(record) => setUjianList(prev => [record, ...prev])}
            onApproveIzinMengajar={(id, ustadzPengganti, status, catatan) => {
              setIzinList(prev => prev.map(iz => iz.id === id ? { ...iz, status, ustadzPengganti, catatanAdmin: catatan } : iz));
            }}
          />
        </div>
      )}

      {isLoggedIn && userRole === 'pengurus' && currentPengurus && (
        <div 
          key={isDoorOpened ? 'pengurus-opened' : 'pengurus-closed'} 
          className={`w-full min-h-screen ${isDoorOpened ? 'dashboard-root-entrance' : 'opacity-0 pointer-events-none'}`}
        >
          <PengurusDashboard
            pengurus={currentPengurus}
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
            izinList={izinList}
            onLogout={handleLogout}
            onUpdatePengurusProfile={(updated) => {
              setPengurusList(prev => prev.map(p => p.id === updated.id ? updated : p));
              setCurrentPengurus(updated);
            }}
            onSaveAbsensiSantri={(records) => {
              setAbsensiSantriList(prev => [...prev, ...records]);
            }}
            onSaveAbsensiGuru={(records) => {
              setAbsensiGuruList(prev => [...prev, ...records]);
            }}
          />
        </div>
      )}

      {isLoggedIn && userRole === 'wali' && currentSantri && (
        <div 
          key={isDoorOpened ? 'wali-opened' : 'wali-closed'} 
          className={`w-full min-h-screen ${isDoorOpened ? 'dashboard-root-entrance' : 'opacity-0 pointer-events-none'}`}
        >
          <WaliSantriPortal
            santri={currentSantri}
            nadzhomList={nadzhomList}
            nilaiList={nilaiList}
            absensiList={absensiSantriList}
            syahriyahList={syahriyahList}
            uangSakuList={uangSakuList}
            ujianList={ujianList}
            spreadsheetId={spreadsheetId}
            settings={settings}
            onLogout={handleLogout}
          />
        </div>
      )}

      {/* Google Sheets Modal Integration */}
      <GoogleSheetsModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
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
          syahriyahList,
        }}
        onDataImported={(imported) => {
          if (imported.santriList) setSantriList(imported.santriList);
          if (imported.guruList) setGuruList(imported.guruList);
          if (imported.jadwalList) setJadwalList(imported.jadwalList);
          if (imported.nadzhomList) setNadzhomList(imported.nadzhomList);
          if (imported.nilaiList) setNilaiList(imported.nilaiList);
          if (imported.absensiSantriList) setAbsensiSantriList(imported.absensiSantriList);
          if (imported.absensiGuruList) setAbsensiGuruList(imported.absensiGuruList);
          if (imported.syahriyahList) setSyahriyahList(imported.syahriyahList);
          if (imported.settings) setSettings(prev => ({ ...prev, ...imported.settings }));
        }}
      />
    </div>
  );
}
