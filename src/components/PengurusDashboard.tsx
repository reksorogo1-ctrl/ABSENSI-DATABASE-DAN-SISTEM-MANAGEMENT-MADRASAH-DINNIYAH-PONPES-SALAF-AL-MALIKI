import React, { useState, useMemo, useEffect } from 'react';
import { 
  Pengurus, KalenderAkademikEvent, AppSettings, Santri, GuruPengajar, JadwalPelajaran, 
  NadzhomRecord, NilaiUjianRecord, AbsensiSantriRecord, AbsensiGuruRecord, 
  SyahriyahRecord, UangSakuRecord, KurikulumKitabRecord, UjianSantriRecord, DashboardStats,
  IzinMengajarRequest
} from '../types';
import { 
  UserCheck, Calendar, BookOpen, Award, LogOut, Clock, 
  CheckCircle2, AlertTriangle, Phone, MessageCircle, 
  Users, Newspaper, ShieldAlert, Sparkles, Sliders, CheckCheck,
  Send, FileText, UserX, ChevronRight, Check, X, Shield, PlusCircle,
  BookmarkCheck, CheckSquare, RefreshCw, GraduationCap
} from 'lucide-react';

interface PengurusDashboardProps {
  pengurus: Pengurus;
  settings: AppSettings;
  stats: DashboardStats;
  santriList: Santri[];
  guruList: GuruPengajar[];
  jadwalList: JadwalPelajaran[];
  nadzhomList: NadzhomRecord[];
  nilaiList: NilaiUjianRecord[];
  absensiSantriList: AbsensiSantriRecord[];
  absensiGuruList: AbsensiGuruRecord[];
  syahriyahList: SyahriyahRecord[];
  uangSakuList: UangSakuRecord[];
  kurikulumList: KurikulumKitabRecord[];
  kalenderList: KalenderAkademikEvent[];
  ujianList?: UjianSantriRecord[];
  izinList?: IzinMengajarRequest[];
  onLogout: () => void;
  onUpdatePengurusProfile?: (updated: Pengurus) => void;
  onSaveAbsensiSantri?: (records: AbsensiSantriRecord[]) => void;
  onSaveAbsensiGuru?: (records: AbsensiGuruRecord[]) => void;
  onSubmitIzinMengajar?: (req: IzinMengajarRequest) => void;
}

export const PengurusDashboard: React.FC<PengurusDashboardProps> = ({
  pengurus,
  settings,
  stats,
  santriList,
  guruList,
  jadwalList,
  nadzhomList,
  nilaiList,
  absensiSantriList = [],
  absensiGuruList = [],
  syahriyahList = [],
  uangSakuList = [],
  kurikulumList = [],
  kalenderList = [],
  ujianList = [],
  izinList = [],
  onLogout,
  onUpdatePengurusProfile,
  onSaveAbsensiSantri,
  onSaveAbsensiGuru,
  onSubmitIzinMengajar
}) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showIzinModal, setShowIzinModal] = useState<boolean>(false);
  const [editedPengurus, setEditedPengurus] = useState<Pengurus>({ ...pengurus });

  // Staggered build only on first mount (not on every tab switch)
  const [building, setBuilding] = useState<boolean>(true);
  useEffect(() => {
    const t = window.setTimeout(() => setBuilding(false), 3200);
    return () => window.clearTimeout(t);
  }, []);

  // Deteksi apakah Pengurus bertindak sebagai Wali Kelas
  // Cari kecocokan di kelasBimbingan atau santri yang memiliki namaWaliKelas sesuai nama pengurus
  const waliKelasKelas = useMemo(() => {
    if (pengurus.kelasBimbingan && pengurus.kelasBimbingan !== 'Dewan Asatidz') {
      return pengurus.kelasBimbingan;
    }
    const matchedSantri = santriList.find(s => 
      s.namaWaliKelas && s.namaWaliKelas.toLowerCase().trim() === pengurus.nama.toLowerCase().trim()
    );
    if (matchedSantri) {
      return matchedSantri.kelas;
    }
    // Default fallback jika jabatan adalah Wali Kelas
    if (pengurus.jabatan.toLowerCase().includes('wali kelas')) {
      return '1 TSANAWIYAH';
    }
    return pengurus.kelasBimbingan || '1 TSANAWIYAH';
  }, [pengurus, santriList]);

  const isWaliKelas = Boolean(
    pengurus.jabatan.toLowerCase().includes('wali') ||
    pengurus.kelasBimbingan ||
    santriList.some(s => s.namaWaliKelas && s.namaWaliKelas.toLowerCase().trim() === pengurus.nama.toLowerCase().trim())
  );

  // Form Pengajuan Izin Tidak Mengajar
  const [izinForm, setIzinForm] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    mapel: pengurus.mapel || 'Nahwu & Shorof',
    kelas: waliKelasKelas || '1 TSANAWIYAH',
    jamKe: 1,
    alasan: '',
    ustadzPengganti: guruList[0]?.nama || 'Ust. M. Rizqi Fadlillah, S.Pd.'
  });

  // Filter personal attendance for this pengurus
  const personalAbsensi = useMemo(() => {
    return absensiGuruList.filter(a => 
      a.nama?.toLowerCase().trim() === pengurus.nama.toLowerCase().trim()
    );
  }, [absensiGuruList, pengurus]);

  const personalHadir = personalAbsensi.filter(a => a.status === 'Hadir').length || 22;
  const personalIzin = personalAbsensi.filter(a => a.status === 'Izin').length || 1;
  const personalTerlambat = personalAbsensi.filter(a => a.status === 'Terlambat').length || 0;
  const personalAlpha = personalAbsensi.filter(a => a.status === 'Alpha').length || 0;
  const personalTotal = personalHadir + personalIzin + personalTerlambat + personalAlpha;
  const personalPercent = personalTotal > 0 ? Math.round((personalHadir / personalTotal) * 100) : 98;

  // Filter pengajuan izin milik pengurus ini
  const myIzinList = useMemo(() => {
    return izinList.filter(i => 
      i.namaUstadz?.toLowerCase().trim() === pengurus.nama.toLowerCase().trim() ||
      i.idPengurus === pengurus.id
    );
  }, [izinList, pengurus]);

  // Status presensi mandiri hari ini
  const todayIso = new Date().toISOString().split('T')[0];
  const todayAttendance = useMemo(() => {
    return personalAbsensi.find(a => a.tanggal === todayIso);
  }, [personalAbsensi, todayIso]);

  // Filter urgent events / meetings for notifications
  const urgentEvents = useMemo(() => {
    return kalenderList.filter(k => k.isUrgentNotif || k.kategori === 'Rapat');
  }, [kalenderList]);

  // Santri anak didik untuk Wali Kelas
  const myStudents = useMemo(() => {
    return santriList.filter(s => s.kelas === waliKelasKelas);
  }, [santriList, waliKelasKelas]);

  // Jadwal pelajaran untuk kelas bimbingan
  const myClassSchedules = useMemo(() => {
    return jadwalList.filter(j => j.kelas === waliKelasKelas);
  }, [jadwalList, waliKelasKelas]);

  // State presensi santri anak didik lokal
  const [localSantriAbsensi, setLocalSantriAbsensi] = useState<{ [id: string]: 'Hadir' | 'Izin' | 'Sakit' | 'Alpha' }>({});

  // Today's date string
  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdatePengurusProfile) {
      onUpdatePengurusProfile(editedPengurus);
    }
    setShowEditModal(false);
    alert('Profil dan biodata pengurus berhasil diperbarui dan disinkronkan ke Database Pusat Admin!');
  };

  // Kirim Pengajuan Izin Mengajar
  const handleSubmitIzin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!izinForm.alasan.trim()) {
      alert('Mohon isi alasan tidak mengajar secara jelas!');
      return;
    }

    const newRequest: IzinMengajarRequest = {
      id: `IZN-${Date.now()}`,
      idPengurus: pengurus.id,
      namaUstadz: pengurus.nama,
      tanggal: izinForm.tanggal,
      mapel: izinForm.mapel,
      kelas: izinForm.kelas,
      jamKe: izinForm.jamKe,
      alasan: izinForm.alasan,
      ustadzPengganti: izinForm.ustadzPengganti,
      status: 'Menunggu',
      catatanAdmin: 'Menunggu verifikasi dan persetujuan oleh Admin Utama',
      createdAt: new Date().toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };

    if (onSubmitIzinMengajar) {
      onSubmitIzinMengajar(newRequest);
    }
    setShowIzinModal(false);
    setIzinForm({
      ...izinForm,
      alasan: ''
    });
    alert('Pengajuan izin tidak mengajar berhasil dikirim ke Dashboard Admin! Ketika Admin menyetujui, status kehadiran pada absensi ustadz/ustadzah langsung otomatis menjadi IZIN dan tercantum nama ustadz penggantinya.');
  };

  // Presensi Kehadiran Mandiri Ustadz / Pengurus Hari Ini
  const handleSelfAttendance = (status: 'Hadir' | 'Terlambat') => {
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const currentDay = new Date().toLocaleDateString('id-ID', { weekday: 'long' }).toUpperCase();
    const newRecord: AbsensiGuruRecord = {
      tanggal: todayIso,
      nama: pengurus.nama,
      mapel: pengurus.mapel || 'Pengawasan & Pembinaan Diniyah',
      kelas: waliKelasKelas || 'Umum Diniyah',
      status: status,
      catatan: status === 'Hadir' ? `Presensi Mandiri Tepat Waktu (${nowTime} WIB)` : `Presensi Mandiri Terlambat (${nowTime} WIB)`,
      hari: currentDay,
      jamKe: 1,
      waktu: nowTime
    };

    if (onSaveAbsensiGuru) {
      onSaveAbsensiGuru([newRecord]);
      alert(`Presensi mandiri berhasil dicatat: STATUS ${status.toUpperCase()} pada ${nowTime} WIB! Terkoneksi langsung ke Database Dashboard Admin secara real-time.`);
    }
  };

  // Simpan Presensi Santri Kelas Bimbingan (Wali Kelas)
  const handleSaveClassAttendance = () => {
    if (!myStudents.length) return;
    const records: AbsensiSantriRecord[] = myStudents.map(s => {
      const stat = localSantriAbsensi[s.id] || 'Hadir';
      return {
        tanggal: todayIso,
        idSantri: s.id,
        nama: s.nama,
        kelas: s.kelas,
        status: stat,
        keterangan: `Presensi Wali Kelas ${pengurus.nama}`
      };
    });

    if (onSaveAbsensiSantri) {
      onSaveAbsensiSantri(records);
      alert(`Presensi anak didik ${waliKelasKelas} (${records.length} santri) berhasil disimpan ke Database Pusat Admin!`);
    }
  };

  return (
    <div className="min-h-screen bg-[#020e08] text-slate-100 flex flex-col font-sans selection:bg-[#d4af37] selection:text-black">
      {/* Top Navbar */}
      <header className="build-header sticky top-0 z-50 bg-[#052216]/95 backdrop-blur border-b border-[#d4af37]/30 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#0b3824] border border-[#d4af37]/50 flex items-center justify-center text-[#d4af37] shadow">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-extrabold text-white text-gold-3d leading-tight">
                {settings.portal_title || settings.nama_pesantren || 'MADRASAH DINIYAH SALAFIYAH'}
              </h1>
              <p className="text-[10px] sm:text-xs text-emerald-300 font-mono flex items-center gap-1.5">
                <span>Portal Khusus Pengurus & Asatidz</span>
                <span>•</span>
                <span className="text-[#d4af37] font-bold">{pengurus.jabatan}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Pengurus Profile Chip */}
            <div 
              onClick={() => setShowEditModal(true)}
              className="hidden sm:flex items-center space-x-2 bg-[#03140c] border border-[#d4af37]/40 rounded-full px-3 py-1 cursor-pointer hover:border-[#d4af37] transition"
              title="Klik untuk edit profil & biodata"
            >
              <div className="w-7 h-7 rounded-full overflow-hidden bg-[#0b3824] border border-[#d4af37]/50 shrink-0">
                <img
                  src={pengurus.foto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                  alt={pengurus.nama}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-left">
                <span className="text-xs font-bold text-white block leading-none">{pengurus.nama}</span>
                <span className="text-[9px] text-[#d4af37] block leading-none mt-0.5">{pengurus.jabatan}</span>
              </div>
            </div>

            <button
              onClick={() => setShowIzinModal(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 font-bold text-xs flex items-center gap-1.5 shadow transition"
              title="Ajukan Izin Tidak Mengajar"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ajukan Izin</span>
            </button>

            <button
              onClick={onLogout}
              className="btn-3d-gold px-3 py-1.5 rounded-xl text-black font-extrabold text-xs flex items-center space-x-1.5 shadow"
              title="Keluar dari Portal Pengurus"
            >
              <LogOut className="w-3.5 h-3.5 text-black" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-[#d4af37]/15 overflow-x-auto">
          <nav className="flex space-x-2 py-2 text-xs">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'dashboard'
                  ? 'bg-[#d4af37] text-black shadow'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-950/40'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Dasbor Utama</span>
            </button>

            <button
              onClick={() => setActiveTab('izin-mengajar')}
              className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'izin-mengajar'
                  ? 'bg-[#d4af37] text-black shadow'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-950/40'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Izin Mengajar</span>
              {myIzinList.filter(i => i.status === 'Menunggu').length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-black font-mono text-[9px] font-bold">
                  {myIzinList.filter(i => i.status === 'Menunggu').length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('wali-kelas')}
              className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'wali-kelas'
                  ? 'bg-[#d4af37] text-black shadow'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-950/40'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Kelas Bimbingan (Wali Kelas)</span>
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-900 border border-emerald-500/40 text-[9px] text-emerald-300 font-bold">
                {waliKelasKelas}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('kalender')}
              className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'kalender'
                  ? 'bg-[#d4af37] text-black shadow'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-950/40'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Kalender & Agenda</span>
              {urgentEvents.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-red-600 text-white font-mono text-[9px] animate-pulse">
                  {urgentEvents.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('absensi-santri')}
              className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'absensi-santri'
                  ? 'bg-[#d4af37] text-black shadow'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-950/40'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Presensi Seluruh Santri</span>
            </button>

            <button
              onClick={() => setActiveTab('jadwal')}
              className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'jadwal'
                  ? 'bg-[#d4af37] text-black shadow'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-950/40'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Jadwal & Kitab</span>
            </button>

            <button
              onClick={() => setActiveTab('ujian-kitab')}
              className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'ujian-kitab'
                  ? 'bg-[#d4af37] text-black shadow'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-950/40'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Nilai Ujian & Muhafadzoh</span>
            </button>

            <button
              onClick={() => setActiveTab('profil-saya')}
              className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'profil-saya'
                  ? 'bg-[#d4af37] text-black shadow'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-950/40'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Biodata & Profil</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`${building ? 'build-sequence' : ''} flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6`}>
        {/* ===================== TAB 1: DASBOR UTAMA PENGURUS ===================== */}
        {activeTab === 'dashboard' && (
          <div className={`${building ? 'build-sequence' : ''} space-y-6`}>
            {/* 1. NOTIFIKASI KALENDER AKADEMIK & RAPAT MENDESAK */}
            {urgentEvents.length > 0 && (
              <div className="card-3d-glass rounded-2xl p-5 border-2 border-red-500/70 bg-gradient-to-r from-red-950/60 via-[#1c0808]/80 to-red-950/60 shadow-xl relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-red-500/30">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold shadow-lg animate-bounce">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-extrabold text-white text-gold-3d flex items-center gap-2">
                        <span>Pemberitahuan Agenda / Rapat Mendesak Pengurus</span>
                        <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-mono uppercase">
                          Wajib Hadir
                        </span>
                      </h2>
                      <p className="text-xs text-red-200">
                        Disinkronkan otomatis dari Kalender Akademik Diniyah Salafiyah.
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-red-300 font-mono">
                    {urgentEvents.length} Agenda Aktif
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  {urgentEvents.map(evt => (
                    <div key={evt.id} className="bg-black/40 border border-red-500/40 rounded-xl p-3.5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] font-bold uppercase">
                          {evt.kategori}
                        </span>
                        <span className="text-[11px] text-amber-300 font-mono font-bold">
                          {evt.tanggalMulai} {evt.waktu ? `• ${evt.waktu}` : ''}
                        </span>
                      </div>
                      <h3 className="text-xs sm:text-sm font-bold text-white">{evt.judul}</h3>
                      <p className="text-xs text-red-100/80 line-clamp-2">{evt.deskripsi}</p>
                      <div className="flex items-center gap-3 pt-1 text-[11px] text-emerald-300">
                        {evt.lokasi && <span>📍 {evt.lokasi}</span>}
                        {evt.sasaran && <span className="text-slate-300">👥 {evt.sasaran}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. PRESENSI MANDIRI HARI INI & PERIZINAN CEPAT */}
            <div className="card-3d rounded-3xl p-5 border border-[#d4af37]/40 bg-gradient-to-r from-[#031c12] via-[#05281b] to-[#031c12] shadow-xl">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#0b3824] border border-[#d4af37]/60 flex items-center justify-center text-[#d4af37] shadow">
                    <CheckSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-extrabold text-white text-gold-3d flex items-center gap-2">
                      <span>Presensi Kehadiran Mandiri Ustadz / Pengurus</span>
                      <span className="text-xs font-mono font-normal text-emerald-300">({todayStr})</span>
                    </h2>
                    <p className="text-xs text-emerald-200/90 mt-0.5">
                      Catat kehadiran Anda hari ini secara langsung. Data langsung terhubung ke Database Dashboard Admin secara real time.
                    </p>
                  </div>
                </div>

                {/* Status Kehadiran Hari Ini & Tombol Aksi */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {todayAttendance ? (
                    <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold shadow">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Status Anda Hari Ini: {todayAttendance.status} ({todayAttendance.waktu || 'Tepat Waktu'})</span>
                      {todayAttendance.ustadzPengganti && (
                        <span className="text-[10px] text-amber-300 ml-1">
                          • Pengganti: {todayAttendance.ustadzPengganti}
                        </span>
                      )}
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handleSelfAttendance('Hadir')}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-950 transition"
                      >
                        <Check className="w-4 h-4" />
                        <span>Presensi Hadir (Tepat Waktu)</span>
                      </button>
                      <button
                        onClick={() => handleSelfAttendance('Terlambat')}
                        className="px-3.5 py-2 rounded-xl bg-yellow-600/80 hover:bg-yellow-600 text-white font-bold text-xs flex items-center gap-1.5 shadow transition"
                      >
                        <Clock className="w-4 h-4" />
                        <span>Presensi Terlambat</span>
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => setShowIzinModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 font-bold text-xs flex items-center gap-1.5 shadow transition"
                  >
                    <Send className="w-4 h-4" />
                    <span>Ajukan Izin Tidak Mengajar</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 3. PROFIL PENGURUS YANG BERSANGKUTAN & REKAPAN ABSENSI PRIBADI */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* KARTU PROFIL PENGURUS */}
              <div className="card-3d rounded-3xl p-6 border border-[#d4af37]/40 relative overflow-hidden space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#d4af37]/20">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-[#d4af37]" />
                    <h2 className="text-xs font-bold text-[#d4af37] uppercase tracking-wider">
                      Profil Pengurus Yang Bersangkutan
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="text-[11px] text-[#d4af37] hover:underline flex items-center gap-1 font-bold"
                  >
                    <Sliders className="w-3 h-3" />
                    <span>Edit Profil</span>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[#0b3824] border-2 border-[#d4af37] shadow-xl shrink-0">
                    <img
                      src={pengurus.foto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
                      alt={pengurus.nama}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-extrabold text-white text-gold-3d leading-tight">
                      {pengurus.nama}
                    </h3>
                    <div className="inline-block px-2.5 py-0.5 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/50 text-[#d4af37] font-bold text-xs">
                      {pengurus.jabatan}
                    </div>
                    <p className="text-[11px] text-emerald-300 font-mono">
                      ID: {pengurus.id} • {pengurus.divisi || 'Divisi Kepengurusan'}
                    </p>
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Status Aktif Khidmah
                    </span>
                  </div>
                </div>

                <div className="bg-[#03140c] border border-[#d4af37]/25 rounded-2xl p-3.5 space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-[#d4af37]/15">
                    <span className="text-slate-400">Kontak WhatsApp</span>
                    <span className="text-white font-mono">{pengurus.noWa || pengurus.noHp || '-'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#d4af37]/15">
                    <span className="text-slate-400">Alamat Domisili</span>
                    <span className="text-white truncate max-w-[170px]">{pengurus.alamat || 'Pesantren Salafiyah'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#d4af37]/15">
                    <span className="text-slate-400">Kelas Bimbingan</span>
                    <span className="text-[#d4af37] font-bold">{waliKelasKelas}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#d4af37]/15">
                    <span className="text-slate-400">Masa Khidmah</span>
                    <span className="text-[#d4af37] font-bold">{pengurus.masaKhidmah || '2025 - 2027'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Kata Sandi Login</span>
                    <span className="text-emerald-300 font-mono">•••••••• (Dapat diedit via Option Panel Admin)</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-200 italic leading-relaxed">
                  "{pengurus.catatan || 'Menjaga marwah salafiyah, mendampingi santri dengan ikhlas dan kesabaran demi ridho Allah SWT.'}"
                </div>
              </div>

              {/* REKAPAN ABSENSI PRIBADI PENGURUS (KOLOM: HADIR, IZIN, TERLAMBAT, ALPHA) */}
              <div className="lg:col-span-2 card-3d rounded-3xl p-6 border border-[#d4af37]/40 space-y-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-[#d4af37]/20">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h2 className="text-sm font-bold text-white text-gold-3d">
                        Rekapan Kehadiran Pengurus Yang Bersangkutan
                      </h2>
                      <p className="text-[11px] text-emerald-300">
                        Catatan kehadiran, ketepatan mengajar, dan khidmah {pengurus.nama} (Terkoneksi Database Admin)
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#03140c] border border-[#d4af37]/40 text-[#d4af37] font-mono text-xs font-bold">
                    Tingkat Kehadiran: {personalPercent}%
                  </span>
                </div>

                {/* 4 Cards Stat Kehadiran Pribadi: HADIR, IZIN, TERLAMBAT, ALPHA */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="card-3d-glass rounded-2xl p-3.5 border border-emerald-500/40 text-center space-y-0.5">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Hadir</span>
                    <span className="text-2xl font-black text-emerald-300 font-mono">{personalHadir}</span>
                    <span className="text-[10px] text-emerald-200/70 block">Pertemuan</span>
                  </div>

                  <div className="card-3d-glass rounded-2xl p-3.5 border border-amber-500/40 text-center space-y-0.5">
                    <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">Izin</span>
                    <span className="text-2xl font-black text-amber-300 font-mono">{personalIzin}</span>
                    <span className="text-[10px] text-amber-200/70 block">Udzur Disetujui</span>
                  </div>

                  <div className="card-3d-glass rounded-2xl p-3.5 border border-yellow-500/40 text-center space-y-0.5">
                    <span className="text-[10px] text-yellow-400 font-bold uppercase tracking-wider block">Terlambat</span>
                    <span className="text-2xl font-black text-yellow-300 font-mono">{personalTerlambat}</span>
                    <span className="text-[10px] text-yellow-200/70 block">Toleransi Waktu</span>
                  </div>

                  <div className="card-3d-glass rounded-2xl p-3.5 border border-red-500/40 text-center space-y-0.5">
                    <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider block">Alpha</span>
                    <span className="text-2xl font-black text-red-400 font-mono">{personalAlpha}</span>
                    <span className="text-[10px] text-red-200/70 block">Tanpa Keterangan</span>
                  </div>
                </div>

                {/* Log Riwayat Kehadiran Pribadi Terakhir */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white">Log Presensi Terakhir Anda:</span>
                    <span className="text-[#d4af37] font-mono text-[11px]">{todayStr}</span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-[#d4af37]/25">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#03140c] text-[#d4af37] border-b border-[#d4af37]/30">
                        <tr>
                          <th className="p-2.5">Tanggal</th>
                          <th className="p-2.5">Agenda / Pelajaran</th>
                          <th className="p-2.5">Status</th>
                          <th className="p-2.5">Ustadz Pengganti</th>
                          <th className="p-2.5">Keterangan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#d4af37]/10 bg-[#020e08]/70">
                        {personalAbsensi.length > 0 ? (
                          personalAbsensi.slice(0, 5).map((rec, idx) => (
                            <tr key={idx} className="hover:bg-[#d4af37]/5">
                              <td className="p-2.5 font-mono text-emerald-300">{rec.tanggal}</td>
                              <td className="p-2.5 font-bold text-white">{rec.mapel || 'Khidmah Madrasah'}</td>
                              <td className="p-2.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  rec.status === 'Hadir' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                                  rec.status === 'Izin' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                                  rec.status === 'Terlambat' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40' :
                                  'bg-red-500/20 text-red-300 border border-red-500/40'
                                }`}>
                                  {rec.status}
                                </span>
                              </td>
                              <td className="p-2.5 text-amber-300 font-medium">
                                {rec.ustadzPengganti || '-'}
                              </td>
                              <td className="p-2.5 text-slate-300">{rec.catatan || 'Tepat Waktu'}</td>
                            </tr>
                          ))
                        ) : (
                          [
                            { tgl: '2026-09-25', tugas: 'Nahwu & Shorof', stat: 'Hadir', pengganti: '-', jam: 'Tepat Waktu' },
                            { tgl: '2026-09-24', tugas: 'Fathul Qorib', stat: 'Hadir', pengganti: '-', jam: 'Tepat Waktu' },
                            { tgl: '2026-09-23', tugas: 'Ujian Muhafadzoh', stat: 'Izin', pengganti: 'Ust. Muhammad Ilyas', jam: 'Udzur Syar\'i Disetujui' }
                          ].map((mock, i) => (
                            <tr key={i} className="hover:bg-[#d4af37]/5">
                              <td className="p-2.5 font-mono text-emerald-300">{mock.tgl}</td>
                              <td className="p-2.5 font-bold text-white">{mock.tugas}</td>
                              <td className="p-2.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  mock.stat === 'Hadir' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                                  'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                }`}>
                                  {mock.stat}
                                </span>
                              </td>
                              <td className="p-2.5 text-amber-300">{mock.pengganti}</td>
                              <td className="p-2.5 text-slate-300">{mock.jam}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. BERITA DAN PENGUMUMAN MADRASAH */}
            <div className="card-3d rounded-3xl p-6 border border-[#d4af37]/30 space-y-4">
              <div className="flex items-center space-x-3 pb-3 border-b border-[#d4af37]/20">
                <div className="w-8 h-8 rounded-lg bg-[#0b3824] border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
                  <Newspaper className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white text-gold-3d">
                    Warta & Berita Resmi Kepengurusan Pondok
                  </h3>
                  <p className="text-[11px] text-emerald-300">
                    Informasi terpusat untuk kelancaran ta'lim, pembinaan, dan disiplin santri diniyah.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card-3d-glass rounded-2xl p-4 border border-[#d4af37]/20 space-y-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase">
                    Kedisiplinan
                  </span>
                  <h4 className="font-bold text-white text-xs sm:text-sm">Pemeriksaan Makna Kitab & Nadzhom Santri</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Seluruh pengurus dan ustadz pembina kamar dimohon memeriksa kelengkapan makna gandul pegon santri setiap malam Kamis ba'da Isya'.
                  </p>
                  <span className="text-[10px] text-[#d4af37] font-mono block pt-1">Oleh: Dewan Asatidz</span>
                </div>

                <div className="card-3d-glass rounded-2xl p-4 border border-[#d4af37]/20 space-y-2">
                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-bold uppercase">
                    Akademik
                  </span>
                  <h4 className="font-bold text-white text-xs sm:text-sm">Jadwal Ujian Muhafadzoh Semester Ganjil</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Ujian setoran matan Imrithi, Alfiyah, dan Tuhfatul Athfal dimulai pekan depan. Mohon input nilai melalui tab Ujian Kitab.
                  </p>
                  <span className="text-[10px] text-[#d4af37] font-mono block pt-1">Oleh: Bagian Ta'lim</span>
                </div>

                <div className="card-3d-glass rounded-2xl p-4 border border-[#d4af37]/20 space-y-2">
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase">
                    Perizinan
                  </span>
                  <h4 className="font-bold text-white text-xs sm:text-sm">Prosedur Izin Tidak Mengajar</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Asatidz yang berhalangan hadir wajib mengirim form izin sebelum jam ta'lim dimulai agar Ustadz Pengganti dapat langsung diverifikasi Admin.
                  </p>
                  <span className="text-[10px] text-[#d4af37] font-mono block pt-1">Oleh: Kepala Madrasah</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 2: IZIN TIDAK MENGAJAR ===================== */}
        {activeTab === 'izin-mengajar' && (
          <div className="space-y-6">
            <div className="card-3d rounded-3xl p-6 border border-[#d4af37]/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-[#031a10] via-[#062417] to-[#031a10]">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-white text-gold-3d flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#d4af37]" />
                  <span>Pengajuan Izin Tidak Mengajar & Ustadz Pengganti</span>
                </h2>
                <p className="text-xs text-emerald-200 mt-1">
                  Permohonan izin akan terkirim langsung ke Dashboard Admin secara real time. Ketika disetujui Admin, status absensi Anda langsung berubah menjadi <b>Izin</b> dan tercantum nama <b>Ustadz Penggantinya</b>.
                </p>
              </div>

              <button
                onClick={() => setShowIzinModal(true)}
                className="btn-3d-gold px-4 py-2.5 rounded-xl text-black font-extrabold text-xs flex items-center gap-2 shadow"
              >
                <PlusCircle className="w-4 h-4 text-black" />
                <span>+ Buat Permohonan Izin Baru</span>
              </button>
            </div>

            {/* Riwayat Permohonan Izin Pengurus */}
            <div className="card-3d rounded-3xl p-6 border border-[#d4af37]/30 space-y-4">
              <h3 className="text-sm font-bold text-white text-gold-3d flex items-center justify-between">
                <span>Daftar Pengajuan Izin Saya</span>
                <span className="text-xs text-[#d4af37] font-mono">Total: {myIzinList.length} Pengajuan</span>
              </h3>

              <div className="overflow-x-auto rounded-2xl border border-[#d4af37]/25">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#03140c] text-[#d4af37] border-b border-[#d4af37]/30">
                    <tr>
                      <th className="p-3">Tanggal Izin</th>
                      <th className="p-3">Mata Pelajaran & Kelas</th>
                      <th className="p-3">Alasan Tidak Mengajar</th>
                      <th className="p-3">Usulan Pengganti</th>
                      <th className="p-3">Status Persetujuan</th>
                      <th className="p-3">Ustadz Pengganti Resmi</th>
                      <th className="p-3">Catatan Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d4af37]/10 bg-[#020e08]/70">
                    {myIzinList.length > 0 ? (
                      myIzinList.map((iz) => (
                        <tr key={iz.id} className="hover:bg-[#d4af37]/5">
                          <td className="p-3 font-mono text-emerald-300 font-bold whitespace-nowrap">
                            {iz.tanggal} <span className="text-[10px] text-slate-400 block">Jam Ke-{iz.jamKe || 1}</span>
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-white block">{iz.mapel}</span>
                            <span className="text-[10px] text-[#d4af37] font-mono">{iz.kelas}</span>
                          </td>
                          <td className="p-3 text-slate-200 max-w-[200px] leading-relaxed">
                            {iz.alasan}
                          </td>
                          <td className="p-3 text-slate-300">
                            {iz.ustadzPengganti || '-'}
                          </td>
                          <td className="p-3">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit ${
                              iz.status === 'Disetujui' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                              iz.status === 'Ditolak' ? 'bg-red-500/20 text-red-300 border border-red-500/40' :
                              'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                            }`}>
                              {iz.status === 'Disetujui' && <Check className="w-3 h-3" />}
                              {iz.status === 'Ditolak' && <X className="w-3 h-3" />}
                              {iz.status === 'Menunggu' && <Clock className="w-3 h-3" />}
                              <span>{iz.status}</span>
                            </span>
                          </td>
                          <td className="p-3 text-amber-300 font-bold">
                            {iz.status === 'Disetujui' ? (iz.ustadzPengganti || 'Telah Ditugaskan') : '-'}
                          </td>
                          <td className="p-3 text-slate-300 text-[11px]">
                            {iz.catatanAdmin || 'Menunggu verifikasi admin'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">
                          Belum ada riwayat pengajuan izin tidak mengajar. Klik tombol <b>+ Buat Permohonan Izin Baru</b> untuk mengajukan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 3: KELAS BIMBINGAN (WALI KELAS) ===================== */}
        {activeTab === 'wali-kelas' && (
          <div className="space-y-6">
            {/* Banner Info Wali Kelas */}
            <div className="card-3d rounded-3xl p-6 border border-[#d4af37]/40 bg-gradient-to-r from-[#052216] via-[#083321] to-[#052216] shadow-xl">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#0b3824] border-2 border-[#d4af37] flex items-center justify-center text-[#d4af37] shadow">
                    <GraduationCap className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-black text-white text-gold-3d">
                        Portal Khusus Wali Kelas: {waliKelasKelas}
                      </h2>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                        Wali Kelas Aktif
                      </span>
                    </div>
                    <p className="text-xs text-emerald-200 mt-0.5">
                      Data absensi dan jadwal pelajaran anak didik terkoneksi secara real time dengan Database Pusat di Dashboard Admin.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveClassAttendance}
                    className="btn-3d-gold px-4 py-2 rounded-xl text-black font-extrabold text-xs flex items-center gap-1.5 shadow"
                  >
                    <CheckCheck className="w-4 h-4 text-black" />
                    <span>Simpan Presensi Kelas ke Admin</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Statistik Kehadiran Anak Didik Hari Ini */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="card-3d-glass rounded-2xl p-4 border border-[#d4af37]/30 text-center">
                <span className="text-[11px] text-slate-300 font-bold block">Total Anak Didik</span>
                <span className="text-2xl font-black text-[#d4af37] font-mono mt-1 block">{myStudents.length}</span>
                <span className="text-[10px] text-emerald-300 font-mono">Santri Aktif</span>
              </div>
              <div className="card-3d-glass rounded-2xl p-4 border border-emerald-500/40 text-center">
                <span className="text-[11px] text-emerald-300 font-bold block">Hadir Hari Ini</span>
                <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">
                  {myStudents.filter(s => (localSantriAbsensi[s.id] || 'Hadir') === 'Hadir').length}
                </span>
                <span className="text-[10px] text-emerald-200/70 font-mono">Di Kelas</span>
              </div>
              <div className="card-3d-glass rounded-2xl p-4 border border-amber-500/40 text-center">
                <span className="text-[11px] text-amber-300 font-bold block">Izin / Sakit</span>
                <span className="text-2xl font-black text-amber-400 font-mono mt-1 block">
                  {myStudents.filter(s => ['Izin', 'Sakit'].includes(localSantriAbsensi[s.id])).length}
                </span>
                <span className="text-[10px] text-amber-200/70 font-mono">Udzur</span>
              </div>
              <div className="card-3d-glass rounded-2xl p-4 border border-red-500/40 text-center">
                <span className="text-[11px] text-red-300 font-bold block">Alpha</span>
                <span className="text-2xl font-black text-red-400 font-mono mt-1 block">
                  {myStudents.filter(s => localSantriAbsensi[s.id] === 'Alpha').length}
                </span>
                <span className="text-[10px] text-red-200/70 font-mono">Tanpa Kabar</span>
              </div>
            </div>

            {/* TABEL REKAPAN ABSENSI ANAK DIDIK */}
            <div className="card-3d rounded-3xl p-6 border border-[#d4af37]/30 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-[#d4af37]/20">
                <div>
                  <h3 className="text-sm font-bold text-white text-gold-3d">
                    Tabel Presensi Santri Anak Didik ({waliKelasKelas})
                  </h3>
                  <p className="text-xs text-emerald-300">
                    Ubah status presensi santri di bawah ini lalu klik tombol Simpan Presensi untuk memperbarui data pusat.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const updated: { [id: string]: 'Hadir' } = {};
                      myStudents.forEach(s => { updated[s.id] = 'Hadir'; });
                      setLocalSantriAbsensi(updated);
                    }}
                    className="px-3 py-1 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs font-bold"
                  >
                    Set Semua Hadir
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-[#d4af37]/25">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#03140c] text-[#d4af37] border-b border-[#d4af37]/30">
                    <tr>
                      <th className="p-3">Santri & NIS</th>
                      <th className="p-3">Kamar</th>
                      <th className="p-3">Wali Santri & Kontak</th>
                      <th className="p-3">Saldo Saku</th>
                      <th className="p-3">Status Hari Ini</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d4af37]/10 bg-[#020e08]/70">
                    {myStudents.map(s => {
                      const currentStatus = localSantriAbsensi[s.id] || 'Hadir';
                      return (
                        <tr key={s.id} className="hover:bg-[#d4af37]/5">
                          <td className="p-3">
                            <div className="flex items-center space-x-2.5">
                              <img
                                src={s.foto || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=80&auto=format&fit=crop&q=80'}
                                alt={s.nama}
                                className="w-8 h-8 rounded-full object-cover border border-[#d4af37]/40"
                              />
                              <div>
                                <span className="font-bold text-white block">{s.nama}</span>
                                <span className="text-[10px] text-[#d4af37] font-mono">NIS: {s.id}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-emerald-200">{s.kamar}</td>
                          <td className="p-3">
                            <span className="text-white block font-medium">{s.namaOrangTua || '-'}</span>
                            <span className="text-[10px] text-emerald-300 font-mono">{s.noWaWaliKelas || 'Kontak Diniyah'}</span>
                          </td>
                          <td className="p-3 font-mono text-[#d4af37] font-bold">
                            Rp {(s.saldoUangSaku || 0).toLocaleString('id-ID')}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              {(['Hadir', 'Izin', 'Sakit', 'Alpha'] as const).map(st => (
                                <button
                                  key={st}
                                  onClick={() => setLocalSantriAbsensi({ ...localSantriAbsensi, [s.id]: st })}
                                  className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                                    currentStatus === st
                                      ? st === 'Hadir' ? 'bg-emerald-500 text-white' :
                                        st === 'Izin' ? 'bg-amber-500 text-black' :
                                        st === 'Sakit' ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'
                                      : 'bg-[#03140c] text-slate-400 hover:text-white border border-[#d4af37]/20'
                                  }`}
                                >
                                  {st}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* JADWAL PELAJARAN KELAS BIMBINGAN */}
            <div className="card-3d rounded-3xl p-6 border border-[#d4af37]/30 space-y-4">
              <h3 className="text-sm font-bold text-white text-gold-3d flex items-center justify-between">
                <span>Jadwal Pelajaran Anak Didik ({waliKelasKelas})</span>
                <span className="text-xs text-emerald-300 font-mono">Terkoneksi Database Admin</span>
              </h3>

              <div className="overflow-x-auto rounded-2xl border border-[#d4af37]/25">
                <table className="w-full text-xs text-left min-w-[650px]">
                  <thead className="bg-[#03140c] text-[#d4af37] border-b border-[#d4af37]/30">
                    <tr>
                      <th className="p-3">Hari</th>
                      <th className="p-3">Waktu</th>
                      <th className="p-3">Jam Ke</th>
                      <th className="p-3">Kitab Kuning / Pelajaran</th>
                      <th className="p-3">Ustadz Pengampu</th>
                      <th className="p-3">Ruang / Aula</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d4af37]/10 bg-[#020e08]/70">
                    {myClassSchedules.length > 0 ? (
                      myClassSchedules.map((j, idx) => (
                        <tr key={idx} className="hover:bg-[#d4af37]/5">
                          <td className="p-3 font-bold text-[#d4af37]">{j.hari}</td>
                          <td className="p-3 font-mono text-emerald-300">{j.waktu}</td>
                          <td className="p-3 font-mono text-slate-300">{j.jamKe}</td>
                          <td className="p-3 font-bold text-white font-serif">{j.mapel}</td>
                          <td className="p-3 text-slate-200">{j.nama}</td>
                          <td className="p-3 text-slate-400">{j.keterangan || 'Gedung Madrasah'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-400">
                          Tidak ada jadwal tersimpan untuk kelas ini di database.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 4: KALENDER & AGENDA ===================== */}
        {activeTab === 'kalender' && (
          <div className="space-y-6">
            <div className="card-3d rounded-3xl p-6 border border-[#d4af37]/30 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-white text-gold-3d">
                  Kalender Akademik & Agenda Madrasah Diniyah
                </h2>
                <p className="text-xs text-emerald-200">
                  Agenda rapat, pengajian akbar, dan ujian semester yang disinkronkan langsung dari Admin.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {kalenderList.map(evt => (
                <div
                  key={evt.id}
                  className={`card-3d-glass rounded-2xl p-5 border space-y-3 ${
                    evt.isUrgentNotif ? 'border-red-500/60 bg-red-950/20' : 'border-[#d4af37]/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      evt.kategori === 'Rapat' ? 'bg-red-500/20 text-red-300 border border-red-500/40' :
                      evt.kategori === 'Ujian' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                      'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}>
                      {evt.kategori}
                    </span>
                    {evt.isUrgentNotif && (
                      <span className="text-[10px] font-extrabold text-red-400 animate-pulse">
                        🔥 Mendesak
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-white text-sm">{evt.judul}</h3>
                  <p className="text-xs text-slate-300">{evt.deskripsi}</p>

                  <div className="space-y-1 pt-2 border-t border-[#d4af37]/15 text-xs text-emerald-200 font-medium">
                    <div>📅 {evt.tanggalMulai} {evt.tanggalSelesai ? `s/d ${evt.tanggalSelesai}` : ''}</div>
                    {evt.waktu && <div>⏰ {evt.waktu}</div>}
                    {evt.lokasi && <div>📍 {evt.lokasi}</div>}
                    {evt.sasaran && <div className="text-[11px] text-slate-400">👥 {evt.sasaran}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================== TAB 5: PRESENSI SELURUH SANTRI ===================== */}
        {activeTab === 'absensi-santri' && (
          <div className="card-3d rounded-3xl p-6 border border-[#d4af37]/30 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-[#d4af37]/20">
              <div>
                <h3 className="text-base font-bold text-white text-gold-3d">Presensi Seluruh Santri Diniyah</h3>
                <p className="text-xs text-emerald-300">Data terkoneksi secara langsung ke Database Pusat di Dashboard Admin.</p>
              </div>
              <span className="text-xs text-[#d4af37] font-mono">Total: {santriList.length} Santri</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#d4af37]/20">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#03140c] text-[#d4af37] border-b border-[#d4af37]/30">
                  <tr>
                    <th className="p-3">Santri</th>
                    <th className="p-3">Kelas / Asrama</th>
                    <th className="p-3">Wali Santri</th>
                    <th className="p-3">Wali Kelas</th>
                    <th className="p-3">Saldo Saku</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d4af37]/10 bg-[#020e08]/70">
                  {santriList.map(s => (
                    <tr key={s.id} className="hover:bg-[#d4af37]/5">
                      <td className="p-3">
                        <div className="flex items-center space-x-2.5">
                          <img
                            src={s.foto || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=80&auto=format&fit=crop&q=80'}
                            alt={s.nama}
                            className="w-7 h-7 rounded-full object-cover border border-[#d4af37]/40"
                          />
                          <div>
                            <span className="font-bold text-white block">{s.nama}</span>
                            <span className="text-[10px] text-[#d4af37] font-mono">NIS: {s.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-emerald-200">{s.kelas} • {s.kamar}</td>
                      <td className="p-3 text-slate-300">{s.namaOrangTua || '-'}</td>
                      <td className="p-3 text-emerald-300">{s.namaWaliKelas || '-'}</td>
                      <td className="p-3 font-mono text-[#d4af37] font-bold">
                        Rp {(s.saldoUangSaku || 0).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===================== TAB 6: JADWAL & KITAB ===================== */}
        {activeTab === 'jadwal' && (
          <div className="space-y-6">
            <div className="card-3d rounded-3xl p-6 border border-[#d4af37]/30">
              <h2 className="text-base font-bold text-white text-gold-3d">Jadwal Pelajaran Diniyah Madrasah</h2>
              <p className="text-xs text-emerald-300">Tabel memanjang jadwal pengajian & kurikulum kitab per angkatan.</p>
            </div>

            <div className="card-3d rounded-2xl p-5 border border-[#d4af37]/30 overflow-x-auto">
              <table className="w-full text-xs text-left min-w-[700px]">
                <thead className="bg-[#03140c] text-[#d4af37] border-b border-[#d4af37]/30">
                  <tr>
                    <th className="p-3">Hari</th>
                    <th className="p-3">Waktu</th>
                    <th className="p-3">Kelas / Angkatan</th>
                    <th className="p-3">Kitab Kuning</th>
                    <th className="p-3">Ustadz Pengampu</th>
                    <th className="p-3">Ruang / Tempat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d4af37]/10 bg-[#020e08]/70">
                  {jadwalList.map(j => (
                    <tr key={j.id || `${j.hari}-${j.jamKe}-${j.kelas}`} className="hover:bg-[#d4af37]/5">
                      <td className="p-3 font-bold text-[#d4af37]">{j.hari}</td>
                      <td className="p-3 font-mono text-emerald-300">{j.waktu}</td>
                      <td className="p-3 text-white font-bold">{j.kelas}</td>
                      <td className="p-3 text-emerald-200 font-serif italic">{j.mapel}</td>
                      <td className="p-3 text-slate-300">{j.nama}</td>
                      <td className="p-3 text-slate-400">{j.keterangan || 'Aula Utama'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Kurikulum Kitab Per Angkatan */}
            <div className="card-3d rounded-2xl p-5 border border-[#d4af37]/30 space-y-3">
              <h3 className="text-sm font-bold text-white text-gold-3d">Kurikulum Kitab Per Angkatan Diniyah</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {kurikulumList.map(k => (
                  <div key={k.id} className="card-3d-glass rounded-xl p-4 border border-[#d4af37]/25 space-y-1.5">
                    <span className="px-2 py-0.5 rounded bg-[#d4af37]/20 text-[#d4af37] font-bold text-[10px]">
                      {k.kelas} • {k.mapel}
                    </span>
                    <h4 className="font-bold text-white text-sm">{k.kitab}</h4>
                    <p className="text-xs text-emerald-300 font-serif">Pengarang / Muallif: {k.muallif}</p>
                    <p className="text-[11px] text-slate-300">Target: {k.targetSemester} {k.ustadzPengampu ? `• Pengampu: ${k.ustadzPengampu}` : ''}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 7: UJIAN KITAB & MUHAFADZOH ===================== */}
        {activeTab === 'ujian-kitab' && (
          <div className="space-y-6">
            <div className="card-3d rounded-3xl p-6 border border-[#d4af37]/30">
              <h2 className="text-base font-bold text-white text-gold-3d">
                Nilai Koreksian Kitab, Muhafadzoh, & Baca Kitab
              </h2>
              <p className="text-xs text-emerald-300">
                Nilai ini terkoneksi langsung dengan dashboard wali santri di bawah profil anak.
              </p>
            </div>

            <div className="card-3d rounded-2xl p-5 border border-[#d4af37]/30 overflow-x-auto">
              <table className="w-full text-xs text-left min-w-[850px]">
                <thead className="bg-[#03140c] text-[#d4af37] border-b border-[#d4af37]/30">
                  <tr>
                    <th className="p-3">Santri & NIS</th>
                    <th className="p-3">Kelas</th>
                    <th className="p-3">Nilai Koreksian Kitab</th>
                    <th className="p-3">Nilai Muhafadzoh</th>
                    <th className="p-3">Nilai Baca Kitab</th>
                    <th className="p-3">Penguji</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d4af37]/10 bg-[#020e08]/70">
                  {santriList.map(s => (
                    <tr key={s.id} className="hover:bg-[#d4af37]/5">
                      <td className="p-3">
                        <span className="font-bold text-white block">{s.nama}</span>
                        <span className="text-[10px] text-[#d4af37] font-mono">NIS: {s.id}</span>
                      </td>
                      <td className="p-3 text-emerald-200">{s.kelas}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#d4af37] font-mono font-bold">
                          {s.nilaiKoreksianKitab ?? 90}
                        </span>
                        <span className="text-[10px] text-slate-300 ml-2">({s.predikatKoreksianKitab || 'Mumtaz'})</span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono font-bold">
                          {s.nilaiMuhafadzoh ?? 92}
                        </span>
                        <span className="text-[10px] text-slate-300 ml-2">({s.predikatMuhafadzoh || 'Mumtaz'})</span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-blue-500/20 border border-blue-500/40 text-blue-300 font-mono font-bold">
                          {s.nilaiBacaKitab ?? 88}
                        </span>
                        <span className="text-[10px] text-slate-300 ml-2">({s.predikatBacaKitab || 'Jayyid Jiddan'})</span>
                      </td>
                      <td className="p-3 text-slate-400">{s.ustadzPengujiKitab || 'Ust. Ilyas'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===================== TAB 8: PROFIL PENGURUS ===================== */}
        {activeTab === 'profil-saya' && (
          <div className="max-w-2xl mx-auto card-3d rounded-3xl p-6 border border-[#d4af37]/40 space-y-6">
            <div className="flex items-center space-x-3 pb-4 border-b border-[#d4af37]/20">
              <div className="w-12 h-12 rounded-2xl bg-[#0b3824] border border-[#d4af37]/50 flex items-center justify-center text-[#d4af37]">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white text-gold-3d">Biodata Lengkap Pengurus</h2>
                <p className="text-xs text-emerald-300">Data akun khidmah resmi di Pondok Pesantren Salafiyah.</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-[#0b3824] border-2 border-[#d4af37] shadow-xl shrink-0">
                <img
                  src={pengurus.foto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
                  alt={pengurus.nama}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{pengurus.nama}</h3>
                <span className="text-xs text-[#d4af37] font-bold block">{pengurus.jabatan}</span>
                <span className="text-xs text-emerald-300 font-mono block mt-1">ID Pengurus: {pengurus.id}</span>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="mt-2 text-xs text-black font-extrabold px-3 py-1 rounded-lg btn-3d-gold shadow"
                >
                  Edit Biodata & Foto
                </button>
              </div>
            </div>

            <div className="space-y-3 bg-[#03140c] rounded-2xl p-4 border border-[#d4af37]/20 text-xs">
              <div className="flex justify-between py-1.5 border-b border-[#d4af37]/15">
                <span className="text-slate-400">Divisi / Bidang</span>
                <span className="text-white font-bold">{pengurus.divisi || 'Kepengurusan Pondok'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#d4af37]/15">
                <span className="text-slate-400">Nomor WhatsApp</span>
                <span className="text-emerald-300 font-mono">{pengurus.noWa || pengurus.noHp || '-'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#d4af37]/15">
                <span className="text-slate-400">Kelas Bimbingan (Wali Kelas)</span>
                <span className="text-[#d4af37] font-bold">{waliKelasKelas}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#d4af37]/15">
                <span className="text-slate-400">Alamat Domisili</span>
                <span className="text-white">{pengurus.alamat || 'Komplek Asrama Pengurus'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#d4af37]/15">
                <span className="text-slate-400">Masa Khidmah</span>
                <span className="text-[#d4af37] font-bold">{pengurus.masaKhidmah || '2025 - 2027'}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Sandi Login Saat Ini</span>
                <span className="text-[#d4af37] font-mono font-bold">
                  {pengurus.password || 'pengurus123'} (Dapat diubah di Option Panel Admin)
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: FORM PENGAJUAN IZIN TIDAK MENGAJAR */}
      {showIzinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="card-3d rounded-3xl p-6 border-2 border-amber-500/60 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-amber-500/30">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-300">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-white text-gold-3d">
                    Form Izin Tidak Mengajar
                  </h3>
                  <p className="text-[10px] text-amber-200">
                    Akan terkirim langsung ke Dashboard Admin untuk persetujuan.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowIzinModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitIzin} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#d4af37] font-bold mb-1">Tanggal Izin</label>
                  <input
                    type="date"
                    value={izinForm.tanggal}
                    onChange={(e) => setIzinForm({ ...izinForm, tanggal: e.target.value })}
                    className="w-full bg-[#03140c] border border-[#d4af37]/40 rounded-xl p-2.5 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#d4af37] font-bold mb-1">Jam Mengajar Ke-</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={izinForm.jamKe}
                    onChange={(e) => setIzinForm({ ...izinForm, jamKe: parseInt(e.target.value) || 1 })}
                    className="w-full bg-[#03140c] border border-[#d4af37]/40 rounded-xl p-2.5 text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#d4af37] font-bold mb-1">Mata Pelajaran / Kitab</label>
                  <input
                    type="text"
                    value={izinForm.mapel}
                    onChange={(e) => setIzinForm({ ...izinForm, mapel: e.target.value })}
                    placeholder="Contoh: Nahwu & Shorof"
                    className="w-full bg-[#03140c] border border-[#d4af37]/40 rounded-xl p-2.5 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#d4af37] font-bold mb-1">Kelas / Angkatan</label>
                  <select
                    value={izinForm.kelas}
                    onChange={(e) => setIzinForm({ ...izinForm, kelas: e.target.value })}
                    className="w-full bg-[#03140c] border border-[#d4af37]/40 rounded-xl p-2.5 text-white"
                  >
                    {['1 TSANAWIYAH', '2 TSANAWIYAH', '3 TSANAWIYAH', '1 ALIYAH', '2 ALIYAH', '3 ALIYAH'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#d4af37] font-bold mb-1">Alasan Tidak Mengajar (Lengkap)</label>
                <textarea
                  value={izinForm.alasan}
                  onChange={(e) => setIzinForm({ ...izinForm, alasan: e.target.value })}
                  placeholder="Contoh: Udzur syar'i / Menghadiri haflah keluarga / Sakit flu berat..."
                  className="w-full bg-[#03140c] border border-[#d4af37]/40 rounded-xl p-2.5 text-white h-20"
                  required
                />
              </div>

              <div>
                <label className="block text-[#d4af37] font-bold mb-1">Usulan Ustadz Pengganti (Badaal)</label>
                <input
                  type="text"
                  list="ustadz-pengganti-options"
                  value={izinForm.ustadzPengganti}
                  onChange={(e) => setIzinForm({ ...izinForm, ustadzPengganti: e.target.value })}
                  placeholder="Nama ustadz yang bersedia menggantikan..."
                  className="w-full bg-[#03140c] border border-[#d4af37]/40 rounded-xl p-2.5 text-white"
                  required
                />
                <datalist id="ustadz-pengganti-options">
                  {guruList.map((g, idx) => (
                    <option key={idx} value={g.nama}>{g.mapel} ({g.kelas})</option>
                  ))}
                </datalist>
                <p className="text-[10px] text-emerald-300 mt-1">
                  Saat Admin menyetujui, kehadiran Anda di absensi langsung berstatus <b>Izin</b> dan ustadz pengganti ini akan tercantum di sebelahnya.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#d4af37]/20">
                <button
                  type="button"
                  onClick={() => setShowIzinModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl btn-3d-gold text-black font-extrabold flex items-center gap-1.5 shadow"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim Izin ke Admin</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT PROFIL & BIODATA PENGURUS */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="card-3d rounded-3xl p-6 border-2 border-[#d4af37]/50 max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#d4af37]/20">
              <h3 className="text-base font-bold text-white text-gold-3d flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#d4af37]" />
                <span>Edit Biodata Pengurus</span>
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#d4af37] font-bold mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  value={editedPengurus.nama}
                  onChange={(e) => setEditedPengurus({ ...editedPengurus, nama: e.target.value })}
                  className="w-full bg-[#03140c] border border-[#d4af37]/40 rounded-xl p-2.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[#d4af37] font-bold mb-1">Amanah / Jabatan</label>
                <input
                  type="text"
                  value={editedPengurus.jabatan}
                  onChange={(e) => setEditedPengurus({ ...editedPengurus, jabatan: e.target.value })}
                  className="w-full bg-[#03140c] border border-[#d4af37]/40 rounded-xl p-2.5 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#d4af37] font-bold mb-1">Nomor WhatsApp</label>
                  <input
                    type="text"
                    value={editedPengurus.noWa || editedPengurus.noHp || ''}
                    onChange={(e) => setEditedPengurus({ ...editedPengurus, noWa: e.target.value, noHp: e.target.value })}
                    className="w-full bg-[#03140c] border border-[#d4af37]/40 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[#d4af37] font-bold mb-1">Masa Khidmah</label>
                  <input
                    type="text"
                    value={editedPengurus.masaKhidmah || ''}
                    onChange={(e) => setEditedPengurus({ ...editedPengurus, masaKhidmah: e.target.value })}
                    className="w-full bg-[#03140c] border border-[#d4af37]/40 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#d4af37] font-bold mb-1">Kelas Bimbingan (Wali Kelas)</label>
                  <select
                    value={editedPengurus.kelasBimbingan || '1 TSANAWIYAH'}
                    onChange={(e) => setEditedPengurus({ ...editedPengurus, kelasBimbingan: e.target.value })}
                    className="w-full bg-[#03140c] border border-[#d4af37]/40 rounded-xl p-2.5 text-white"
                  >
                    {['1 TSANAWIYAH', '2 TSANAWIYAH', '3 TSANAWIYAH', '1 ALIYAH', '2 ALIYAH', '3 ALIYAH', 'Dewan Asatidz'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[#d4af37] font-bold mb-1">Mata Pelajaran Diampu</label>
                  <input
                    type="text"
                    value={editedPengurus.mapel || ''}
                    onChange={(e) => setEditedPengurus({ ...editedPengurus, mapel: e.target.value })}
                    className="w-full bg-[#03140c] border border-[#d4af37]/40 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#d4af37] font-bold mb-1">URL Foto Profil</label>
                <input
                  type="text"
                  value={editedPengurus.foto || ''}
                  onChange={(e) => setEditedPengurus({ ...editedPengurus, foto: e.target.value })}
                  className="w-full bg-[#03140c] border border-[#d4af37]/40 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-[#d4af37] font-bold mb-1">Catatan Amanah & Khidmah</label>
                <textarea
                  value={editedPengurus.catatan || ''}
                  onChange={(e) => setEditedPengurus({ ...editedPengurus, catatan: e.target.value })}
                  className="w-full bg-[#03140c] border border-[#d4af37]/40 rounded-xl p-2.5 text-white h-16"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#d4af37]/20">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl btn-3d-gold text-black font-extrabold shadow"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
