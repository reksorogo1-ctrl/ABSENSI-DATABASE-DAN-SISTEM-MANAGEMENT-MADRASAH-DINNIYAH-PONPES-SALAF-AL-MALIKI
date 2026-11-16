import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Pengurus, KalenderAkademikEvent, AppSettings, Santri, GuruPengajar, JadwalPelajaran, 
  NadzhomRecord, NilaiUjianRecord, AbsensiSantriRecord, AbsensiGuruRecord, 
  SyahriyahRecord, UangSakuRecord, KurikulumKitabRecord, UjianSantriRecord, DashboardStats,
  IzinMengajarRequest, SilabusMemaknaiRecord
} from '../types';
import { 
  UserCheck, Calendar, BookOpen, Award, LogOut, Clock, 
  CheckCircle2, AlertTriangle, Phone, MessageCircle, 
  Users, Newspaper, ShieldAlert, Sparkles, Sliders, CheckCheck,
  Send, FileText, UserX, ChevronRight, Check, X, Shield, PlusCircle, Plus,
  BookmarkCheck, CheckSquare, RefreshCw, GraduationCap, MapPin, Compass, Crosshair, Navigation, Menu,
  Search, Edit3, ChevronDown, ChevronUp, Bell
} from 'lucide-react';
import { BrandLogos } from './BrandLogos';
import { PWAInstallButton } from './PWAInstallButton';
import { GoogleMapsGeofence } from './GoogleMapsGeofence';
import { validateGeofence, DEFAULT_GEOFENCE_ZONE } from '../lib/geofencing';
import { calculateGuruAttendanceScore } from '../lib/guruAttendanceScoring';
import { 
  checkPresensiSchedule, getServerTime, setSimulatedServerTime, isSimulationActive,
  PresensiCheckResult, OFFICIAL_SCHEDULES, broadcastAttendanceUpdate,
  getPesantrenDayInfo, getMalamDaySubtitle, subscribeScheduleUpdates,
  subscribeIzinMengajarUpdates, subscribeNadzhomUpdates,
  isTeacherNameMatch, isScheduleOwnedByTeacher, isAliyahSchedule,
  doesScheduleMatchDay, getScheduleKey, isScheduleCheckedInToday,
  isScheduleWindowActiveNow
} from '../serverTime';
import { PenggantiUstadzRequest } from '../types';

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
  silabusList?: SilabusMemaknaiRecord[];
  kalenderList: KalenderAkademikEvent[];
  ujianList?: UjianSantriRecord[];
  izinList?: IzinMengajarRequest[];
  rekapGuruHistoryList?: AbsensiGuruRecord[];
  onLogout: () => void;
  onUpdatePengurusProfile?: (updated: Pengurus) => void;
  onSaveAbsensiSantri?: (records: AbsensiSantriRecord[]) => void;
  onSaveAbsensiGuru?: (records: AbsensiGuruRecord[]) => void;
  onSaveSilabus?: (rec: SilabusMemaknaiRecord) => void;
  onSubmitIzinMengajar?: (req: IzinMengajarRequest) => void;
  onDeleteKalenderEvent?: (id: string) => void;
  onSaveNadzhom?: (rec: NadzhomRecord) => void;
  onDeleteNadzhom?: (rec: NadzhomRecord) => void;
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
  silabusList = [],
  kalenderList = [],
  ujianList = [],
  izinList = [],
  rekapGuruHistoryList = [],
  onLogout,
  onUpdatePengurusProfile,
  onSaveAbsensiSantri,
  onSaveAbsensiGuru,
  onSaveSilabus,
  onSubmitIzinMengajar,
  onDeleteKalenderEvent,
  onSaveNadzhom,
  onDeleteNadzhom
}) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showIzinModal, setShowIzinModal] = useState<boolean>(false);
  const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false);
  const [showAllUrgentNotifs, setShowAllUrgentNotifs] = useState<boolean>(false);
  const [showAllSilabusNotifs, setShowAllSilabusNotifs] = useState<boolean>(false);
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

  // Filter untuk Jadwal & Silabus Pengurus - Terpisah per Tingkatan Tsanawiyah & Aliyah
  const [jadwalTsAngkatan, setJadwalTsAngkatan] = useState<string>('SEMUA');
  const [jadwalTsDay, setJadwalTsDay] = useState<string>('SEMUA');
  const [jadwalAlAngkatan, setJadwalAlAngkatan] = useState<string>('SEMUA');
  const [jadwalAlDay, setJadwalAlDay] = useState<string>('SEMUA');
  const [silabusAngkatanFilter, setSilabusAngkatanFilter] = useState<string>('SEMUA');
  const [silabusSemester, setSilabusSemester] = useState<'Semester 1' | 'Semester 2'>('Semester 1');
  const [showAddSilabusModal, setShowAddSilabusModal] = useState(false);
  const [editingSilabus, setEditingSilabus] = useState<SilabusMemaknaiRecord | null>(null);
  const [silabusForm, setSilabusForm] = useState<{
    id?: string;
    namaKitab: string;
    kelas: string;
    tingkatan: 'Tsanawiyah' | 'Aliyah';
    semester: 'Semester 1' | 'Semester 2';
    mulai: string;
    batasAkhir: string;
    materiSaatIni: string;
    status: 'Sesuai Target' | 'Belum Tercapai / Tertinggal' | 'Khatam / Tercapai' | 'Proses';
    keterangan: string;
    ustadzPengampu: string;
  }>({
    namaKitab: '',
    kelas: '1 TSANAWIYAH',
    tingkatan: 'Tsanawiyah',
    semester: 'Semester 1',
    mulai: 'Fasal 1: Bab Muqaddimah & Kalam',
    batasAkhir: 'Khatam Bab Akhir Kitab',
    materiSaatIni: 'Fasal 1: Bab Kalam',
    status: 'Sesuai Target',
    keterangan: 'Kajian Rutin Pengajian Kitab',
    ustadzPengampu: pengurus.nama || ''
  });

  // Filter personal attendance for this pengurus (real-time dari absensiGuruList & riwayat rekapan Firestore)
  const personalAbsensi = useMemo(() => {
    const list: AbsensiGuruRecord[] = [...(absensiGuruList || [])];
    const historySource: AbsensiGuruRecord[] = (rekapGuruHistoryList && rekapGuruHistoryList.length > 0)
      ? rekapGuruHistoryList
      : (() => {
          try {
            const historyStr = localStorage.getItem('sim_rekap_guru_harian_history');
            return historyStr ? JSON.parse(historyStr) : [];
          } catch {
            return [];
          }
        })();

    historySource.forEach((h: AbsensiGuruRecord) => {
      if (!list.some(l => l.tanggal === h.tanggal && l.nama === h.nama && l.kelas === h.kelas && l.jamKe === h.jamKe)) {
        list.push(h);
      }
    });

    const cleanName = (pengurus.nama || '').toLowerCase().trim();
    return list.filter(a => {
      const aName = (a.nama || '').toLowerCase().trim();
      const aPengganti = (a.ustadzPengganti || '').toLowerCase().trim();
      return aName === cleanName || aPengganti === cleanName || (cleanName && aName.includes(cleanName));
    }).sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''));
  }, [absensiGuruList, rekapGuruHistoryList, pengurus.nama]);

  const personalHadirTepat = personalAbsensi.filter(a => a.status === 'Hadir').length;
  const personalIzin = personalAbsensi.filter(a => a.status === 'Izin').length;
  const personalTerlambat = personalAbsensi.filter(a => a.status === 'Terlambat').length;
  const personalAlpha = personalAbsensi.filter(a => a.status === 'Alpha').length;
  const personalScore = calculateGuruAttendanceScore(personalHadirTepat, personalTerlambat, personalIzin, personalAlpha, 50);
  const personalHadir = personalScore.totalHadir;
  const personalTotal = personalScore.totalSesi;
  const personalPercent = personalTotal > 0 ? personalScore.persentasePenilaian : 100;

  const [liveIzinList, setLiveIzinList] = useState<IzinMengajarRequest[]>(() => {
    return izinList && izinList.length > 0 ? izinList : (JSON.parse(localStorage.getItem('sim_izin_mengajar') || '[]'));
  });

  useEffect(() => {
    if (izinList) {
      setLiveIzinList(izinList);
    }
  }, [izinList]);

  useEffect(() => {
    const unsub = subscribeIzinMengajarUpdates((items) => {
      if (Array.isArray(items)) {
        setLiveIzinList(items);
      }
    });
    return () => unsub();
  }, []);

  const [liveNadzhomList, setLiveNadzhomList] = useState<NadzhomRecord[]>(() => {
    return nadzhomList && nadzhomList.length > 0 ? nadzhomList : (JSON.parse(localStorage.getItem('sim_nadzhom') || '[]'));
  });

  useEffect(() => {
    if (nadzhomList) {
      setLiveNadzhomList(nadzhomList);
    }
  }, [nadzhomList]);

  useEffect(() => {
    const unsub = subscribeNadzhomUpdates((records) => {
      if (Array.isArray(records)) {
        setLiveNadzhomList(records);
      }
    });
    return () => unsub();
  }, []);

  // Filter pengajuan izin milik pengurus ini
  const myIzinList = useMemo(() => {
    return liveIzinList.filter(i => 
      i.namaUstadz?.toLowerCase().trim() === pengurus.nama.toLowerCase().trim() ||
      i.idPengurus === pengurus.id
    );
  }, [liveIzinList, pengurus]);

  // State untuk Fitur Setoran Nadzhom Santri oleh Pengurus (Menyimak & Input Manual)
  const [selectedNadzhomKelas, setSelectedNadzhomKelas] = useState<string>('SEMUA');
  const [searchNadzhomSantri, setSearchNadzhomSantri] = useState<string>('');
  const [showAddNadzhomModal, setShowAddNadzhomModal] = useState<boolean>(false);
  const [editingNadzhom, setEditingNadzhom] = useState<NadzhomRecord | null>(null);
  const [nadzhomForm, setNadzhomForm] = useState<{
    idSantri: string;
    nama: string;
    kelas: string;
    kitab: string;
    bait: number;
    tanggal: string;
    nilai: string;
    catatan: string;
  }>({
    idSantri: '',
    nama: '',
    kelas: '1 TSANAWIYAH',
    kitab: 'Al-Fiyah Ibnu Malik',
    bait: 0,
    tanggal: new Date().toISOString().split('T')[0],
    nilai: 'Mumtaz',
    catatan: ''
  });

  const handleOpenAddNadzhom = (targetSantri?: Santri) => {
    if (targetSantri) {
      const last = liveNadzhomList.find(n => n.idSantri === targetSantri.id);
      setNadzhomForm({
        idSantri: targetSantri.id,
        nama: targetSantri.nama,
        kelas: targetSantri.kelas,
        kitab: last?.kitab || 'Al-Fiyah Ibnu Malik',
        bait: last ? Number(last.bait) : 0,
        tanggal: activeSession.todayIso,
        nilai: 'Mumtaz',
        catatan: `Disimak oleh pengurus ${pengurus.nama}`
      });
    } else {
      setNadzhomForm({
        idSantri: '',
        nama: '',
        kelas: selectedNadzhomKelas !== 'SEMUA' ? selectedNadzhomKelas : '1 TSANAWIYAH',
        kitab: 'Al-Fiyah Ibnu Malik',
        bait: 0,
        tanggal: activeSession.todayIso,
        nilai: 'Mumtaz',
        catatan: `Disimak oleh pengurus ${pengurus.nama}`
      });
    }
    setEditingNadzhom(null);
    setShowAddNadzhomModal(true);
  };

  const handleEditNadzhom = (rec: NadzhomRecord) => {
    setEditingNadzhom(rec);
    setNadzhomForm({
      idSantri: rec.idSantri,
      nama: rec.nama,
      kelas: rec.kelas || '1 TSANAWIYAH',
      kitab: rec.kitab,
      bait: rec.bait,
      tanggal: rec.tanggal,
      nilai: rec.nilai,
      catatan: rec.catatan || ''
    });
    setShowAddNadzhomModal(true);
  };

  const handleSaveNadzhomEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nadzhomForm.idSantri || !nadzhomForm.nama) {
      alert('Pilih santri terlebih dahulu!');
      return;
    }
    if (!nadzhomForm.kitab.trim()) {
      alert('Tentukan kitab nadzhom!');
      return;
    }

    const rec: NadzhomRecord = {
      idRow: editingNadzhom?.idRow || Date.now(),
      idSantri: nadzhomForm.idSantri,
      nama: nadzhomForm.nama,
      kelas: nadzhomForm.kelas,
      kitab: nadzhomForm.kitab.trim(),
      bait: Number(nadzhomForm.bait) || 0,
      tanggal: nadzhomForm.tanggal || activeSession.todayIso,
      nilai: nadzhomForm.nilai || 'Mumtaz',
      catatan: nadzhomForm.catatan.trim() || `Disimak oleh pengurus ${pengurus.nama}`
    };

    if (onSaveNadzhom) {
      onSaveNadzhom(rec);
    }

    setShowAddNadzhomModal(false);
    setEditingNadzhom(null);
    alert(`Setoran nadzhom ${rec.nama} (${rec.kitab} - ${rec.bait} bait) berhasil disimpan dan disinkronkan secara real-time ke Dashboard Admin & Wali Santri!`);
  };

  // Status presensi mandiri hari ini (WIB Asia/Jakarta)
  const todayIso = getPesantrenDayInfo().todayIso;
  const todayAttendance = useMemo(() => {
    return personalAbsensi.find(a => a.tanggal === todayIso);
  }, [personalAbsensi, todayIso]);

  // List agenda yang dihapus / ditutup secara lokal
  const [dismissedEvents, setDismissedEvents] = useState<string[]>(() => {
    const saved = localStorage.getItem('sim_dismissed_kalender');
    return saved ? JSON.parse(saved) : ['EVT-001'];
  });

  const handleDismissEvent = (id: string) => {
    const updated = [...dismissedEvents, id];
    setDismissedEvents(updated);
    localStorage.setItem('sim_dismissed_kalender', JSON.stringify(updated));
    if (onDeleteKalenderEvent) {
      onDeleteKalenderEvent(id);
    }
  };

  // Filter urgent events / meetings for notifications
  const urgentEvents = useMemo(() => {
    return kalenderList.filter(k => 
      (k.isUrgentNotif || k.kategori === 'Rapat') &&
      !dismissedEvents.includes(k.id) &&
      k.id !== 'EVT-001' &&
      !k.judul.toLowerCase().includes('rapat pleno dewan pengurus')
    );
  }, [kalenderList, dismissedEvents]);

  // ==========================================
  // FITUR NOTIFIKASI REAL-TIME UPDATE SILABUS GURU
  // ==========================================
  const mySilabusList = useMemo(() => {
    const pengurusNameNorm = pengurus.nama?.toLowerCase().trim() || '';
    const mapelNorm = pengurus.mapel?.toLowerCase().trim() || '';
    return silabusList.filter(s => {
      const ustadzNorm = s.ustadzPengampu?.toLowerCase().trim() || '';
      const kitabNorm = s.namaKitab?.toLowerCase().trim() || '';
      return (
        (ustadzNorm && (ustadzNorm.includes(pengurusNameNorm) || pengurusNameNorm.includes(ustadzNorm))) ||
        (mapelNorm && (kitabNorm.includes(mapelNorm) || mapelNorm.includes(kitabNorm)))
      );
    });
  }, [silabusList, pengurus]);

  const [dismissedSilabusKeys, setDismissedSilabusKeys] = useState<string[]>(() => {
    const saved = localStorage.getItem(`sim_dismissed_silabus_${pengurus.id}`);
    return saved ? JSON.parse(saved) : [];
  });

  const unreadSilabusUpdates = useMemo(() => {
    return mySilabusList.filter(s => {
      const key = `${s.id}_${s.materiSaatIni || ''}_${s.status || ''}_${s.mulai || ''}_${s.batasAkhir || ''}`;
      return !dismissedSilabusKeys.includes(key);
    });
  }, [mySilabusList, dismissedSilabusKeys]);

  const handleDismissSilabusAlert = (s: SilabusMemaknaiRecord) => {
    const key = `${s.id}_${s.materiSaatIni || ''}_${s.status || ''}_${s.mulai || ''}_${s.batasAkhir || ''}`;
    const updated = [...dismissedSilabusKeys, key];
    setDismissedSilabusKeys(updated);
    localStorage.setItem(`sim_dismissed_silabus_${pengurus.id}`, JSON.stringify(updated));
  };

  const handleDismissAllSilabusAlerts = () => {
    const newKeys = mySilabusList.map(s => `${s.id}_${s.materiSaatIni || ''}_${s.status || ''}_${s.mulai || ''}_${s.batasAkhir || ''}`);
    const updated = Array.from(new Set([...dismissedSilabusKeys, ...newKeys]));
    setDismissedSilabusKeys(updated);
    localStorage.setItem(`sim_dismissed_silabus_${pengurus.id}`, JSON.stringify(updated));
  };

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

    const tDate = izinForm.tanggal || activeSession.todayIso;
    const hariName = new Date(tDate).toLocaleDateString('id-ID', { weekday: 'long' }).toUpperCase();

    const newRequest: IzinMengajarRequest = {
      id: `IZN-${Date.now()}`,
      idPengurus: pengurus.id,
      namaUstadz: pengurus.nama,
      tanggal: tDate,
      hari: hariName,
      mapel: izinForm.mapel,
      kelas: izinForm.kelas,
      jamKe: izinForm.jamKe,
      jamJadwal: Number(izinForm.jamKe) === 2 ? '09:45 WIB' : '08:00 WIB',
      jadwalId: `${izinForm.kelas}_${izinForm.mapel}_${izinForm.jamKe}`,
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
    alert('Pengajuan izin tidak mengajar berhasil dikirim langsung ke Dashboard Admin secara real time! Ketika disetujui Admin, status absensi Anda langsung berubah menjadi Izin.');
  };

  // State Jam Server Real-Time (update setiap 1 detik)
  const [serverClock, setServerClock] = useState<Date>(getServerTime());
  const [simulationActive, setSimulationActive] = useState<boolean>(isSimulationActive());
  const [showSimulasiBar, setShowSimulasiBar] = useState<boolean>(false);

  // Mode Tampilan Absensi: 'normal' | 'pengganti'
  const [absensiMode, setAbsensiMode] = useState<'normal' | 'pengganti'>('normal');

  // State Pelacakan Geolocation GPS Real-Time dengan stabilisasi pembacaan akurasi terbaik
  const [userCoords, setUserCoords] = useState<{ lat: number | null; lng: number | null; accuracy: number | null; updatedAt?: number }>({
    lat: null,
    lng: null,
    accuracy: null,
    updatedAt: 0
  });
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsErrorCode, setGpsErrorCode] = useState<'permission_denied' | 'position_unavailable' | 'timeout' | 'unsupported' | null>(null);

  const applyPositionSample = useCallback((pos: GeolocationPosition, forceUpdate = false) => {
    const { latitude, longitude, accuracy } = pos.coords;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    const acc = Number.isFinite(accuracy) && accuracy > 0 ? accuracy : 15;
    const now = Date.now();
    setUserCoords(prev => {
      const hasPrev = prev.lat !== null && prev.lng !== null && prev.accuracy !== null;
      const isPrevStale = !prev.updatedAt || (now - prev.updatedAt > 20000);
      // Pertahankan sampel akurasi baik yang masih segar agar lonjakan Wi-Fi/seluler tidak merusak lock GPS
      if (!forceUpdate && hasPrev && !isPrevStale && acc > (prev.accuracy as number) + 15) {
        return prev;
      }
      return {
        lat: latitude,
        lng: longitude,
        accuracy: acc,
        updatedAt: now
      };
    });
    setGpsLoading(false);
    setGpsError(null);
    setGpsErrorCode(null);
  }, []);

  const handleGeolocationError = useCallback((err: GeolocationPositionError) => {
    setGpsLoading(false);
    if (err.code === 1) {
      setGpsErrorCode('permission_denied');
      setGpsError('Izin akses lokasi GPS ditolak oleh browser/perangkat. Mohon izinkan akses lokasi lalu coba lagi.');
    } else if (err.code === 2) {
      setGpsErrorCode('position_unavailable');
      setGpsError('Sinyal lokasi GPS tidak tersedia. Pastikan layanan GPS perangkat aktif.');
    } else if (err.code === 3) {
      setGpsErrorCode('timeout');
      setGpsError('Pembacaan GPS melebihi batas waktu. Sistem akan mencoba membaca ulang koordinat...');
    } else {
      setGpsErrorCode('position_unavailable');
      setGpsError(err.message || 'Gagal membaca lokasi GPS perangkat.');
    }
  }, []);

  const acquireFreshGpsPosition = useCallback((timeoutMs = 8000): Promise<{ lat: number; lng: number; accuracy: number } | null> => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsErrorCode('unsupported');
      setGpsError('Browser tidak mendukung pendeteksian lokasi GPS.');
      return Promise.resolve(null);
    }
    setGpsLoading(true);
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          applyPositionSample(pos, true);
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: Number.isFinite(pos.coords.accuracy) && pos.coords.accuracy > 0 ? pos.coords.accuracy : 15
          });
        },
        (err) => {
          handleGeolocationError(err);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 }
      );
    });
  }, [applyPositionSample, handleGeolocationError]);

  // Ambil lokasi GPS perangkat secara berkala + watchPosition real-time
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsErrorCode('unsupported');
      setGpsError('Browser tidak mendukung pendeteksian lokasi GPS.');
      return;
    }

    acquireFreshGpsPosition(10000);

    const watchId = navigator.geolocation.watchPosition(
      (pos) => applyPositionSample(pos, false),
      (err) => handleGeolocationError(err),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [acquireFreshGpsPosition, applyPositionSample, handleGeolocationError]);

  // Hasil Validasi Geofencing Terhadap Pengaturan Admin Option Panel
  const geofenceCheck = useMemo(() => {
    return validateGeofence(userCoords.lat, userCoords.lng, userCoords.accuracy, {
      enabled: settings.geofencing_enabled,
      zoneName: settings.geofencing_zone_name,
      latitude: settings.geofencing_latitude,
      longitude: settings.geofencing_longitude,
      radiusMeters: settings.geofencing_radius_meters,
      maxGpsAccuracy: settings.geofencing_max_gps_accuracy
    });
  }, [userCoords, settings]);

  // Mekanisme pembacaan ulang otomatis jika sinyal GPS belum stabil / akurasi buruk / belum terdeteksi
  useEffect(() => {
    if (settings.geofencing_enabled === false) return;
    if (gpsErrorCode === 'permission_denied' || gpsErrorCode === 'unsupported') return;
    if (!geofenceCheck.needsGpsRetry && geofenceCheck.hasLocation) return;

    let cancelled = false;
    let attempts = 0;
    const retryInterval = window.setInterval(() => {
      if (cancelled || attempts >= 4) {
        window.clearInterval(retryInterval);
        return;
      }
      attempts += 1;
      acquireFreshGpsPosition(7000);
    }, 4500);

    return () => {
      cancelled = true;
      window.clearInterval(retryInterval);
    };
  }, [
    settings.geofencing_enabled,
    gpsErrorCode,
    geofenceCheck.needsGpsRetry,
    geofenceCheck.hasLocation,
    acquireFreshGpsPosition
  ]);

  // State Permohonan Pengganti Ustadz
  const [penggantiRequestList, setPenggantiRequestList] = useState<PenggantiUstadzRequest[]>(() => {
    try {
      const saved = localStorage.getItem('sim_pengganti_requests');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // State Modal Notifikasi / Dialog Validasi Presensi (Di Luar Radius, GPS Tidak Akurat, Di Luar Jam, Berhasil)
  const [validationAlertModal, setValidationAlertModal] = useState<{
    isOpen: boolean;
    type: 'outside_radius' | 'gps_inaccurate' | 'gps_unavailable' | 'outside_hours' | 'already_checked' | 'no_schedule' | 'no_pengganti' | 'success';
    title: string;
    message: string;
    submessage?: string;
    allowGpsRetry?: boolean;
    details?: {
      distance?: number;
      maxRadius?: number;
      accuracy?: number;
      maxAccuracy?: number;
      currentTime?: string;
      allowedSchedule?: string;
    };
  } | null>(null);

  // State untuk sembunyikan/tampilkan peta geofencing (Default tersembunyi sesuai permintaan user)
  const [showGeofenceMap, setShowGeofenceMap] = useState<boolean>(false);

  // Sinkronisasi realtime storage untuk pengganti
  useEffect(() => {
    const handleStorage = () => {
      try {
        const saved = localStorage.getItem('sim_pengganti_requests');
        if (saved) setPenggantiRequestList(JSON.parse(saved));
      } catch {}
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setServerClock(getServerTime());
      setSimulationActive(isSimulationActive());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // State jadwal real-time yang tersinkronisasi langsung dengan Admin Dashboard
  const [liveJadwalList, setLiveJadwalList] = useState<JadwalPelajaran[]>(() => {
    return jadwalList || [];
  });

  useEffect(() => {
    if (jadwalList) {
      setLiveJadwalList(jadwalList);
    }
  }, [jadwalList]);

  // Listener sinkronisasi jadwal real-time dari Admin Dashboard Tab Jadwal Pelajaran
  useEffect(() => {
    const unsub = subscribeScheduleUpdates((newSchedules) => {
      if (Array.isArray(newSchedules)) {
        setLiveJadwalList(newSchedules);
      }
    });
    return () => unsub();
  }, []);

  // Logika Evaluasi Jam Server Real-Time (tersinkron ke pengaturan Option Panel Admin):
  const activeSession: PresensiCheckResult = useMemo(() => {
    return checkPresensiSchedule(serverClock, {
      bypassActive: settings.bypass_jam_presensi_testing,
      settings
    });
  }, [serverClock, settings]);

  // Evaluasi Hari & Sesi Pesantren (WIB):
  // Siang (Tsanawiyah): Hari Kalender Masehi (SABTU, AHAD, SENIN, dst)
  // Malam (Aliyah): Sesi Ba'da Maghrib 19:00 - 23:00 WIB (MALAM SABTU = Jumat Malam, MALAM AHAD = Sabtu Malam, dst)
  const dayInfo = useMemo(() => {
    return getPesantrenDayInfo(serverClock);
  }, [serverClock]);

  const currentDayName = activeSession.currentDayName;

  // Helper pencocokan nama pengurus login dengan nama ustadz di jadwal pelajaran (Single Source of Truth)
  const isMatchMyTeacherName = useCallback((scheduleTeacherName: string | undefined): boolean => {
    return isTeacherNameMatch(scheduleTeacherName, pengurus.nama);
  }, [pengurus.nama]);

  // JADWAL PELAJARAN KHUSUS PENGURUS/USTADZ YANG SEDANG LOGIN (DATA PRIBADI - ID & NAMA TERINTEGRASI GURU_LIST)
  const myAllSchedules = useMemo(() => {
    return (liveJadwalList || []).filter(j => isScheduleOwnedByTeacher(j, pengurus, guruList));
  }, [liveJadwalList, pengurus, guruList]);

  // Kelas-kelas yang diampu oleh ustadz yang sedang login
  const myTeachingClasses = useMemo(() => {
    const clsSet = new Set<string>();
    myAllSchedules.forEach(j => {
      if (j.kelas) clsSet.add(j.kelas);
    });
    if (clsSet.size === 0 && pengurus.kelasBimbingan && pengurus.kelasBimbingan !== 'Dewan Asatidz') {
      clsSet.add(pengurus.kelasBimbingan);
    }
    return Array.from(clsSet);
  }, [myAllSchedules, pengurus.kelasBimbingan]);

  // 1. Ambil jadwal mengajar pribadi ustadz pada hari ini sesuai aturan pesantren WIB
  const myTodaySchedules = useMemo(() => {
    return myAllSchedules.filter(j => doesScheduleMatchDay(j, dayInfo));
  }, [myAllSchedules, dayInfo]);

  // State filter kelas untuk jadwal presensi hari ini (hanya dari kelas yang diampu)
  const [selectedPresensiKelas, setSelectedPresensiKelas] = useState<string>('SEMUA');

  // 2. Filter jadwal HARI INI berdasarkan kelas yang dipilih (tidak mencampur jadwal hari lain)
  const myTodaySchedulesByClass = useMemo(() => {
    if (selectedPresensiKelas === 'SEMUA' || !selectedPresensiKelas) {
      return myTodaySchedules;
    }
    return myTodaySchedules.filter(j => j.kelas === selectedPresensiKelas);
  }, [myTodaySchedules, selectedPresensiKelas]);

  // State jadwal yang dipilih oleh ustadz
  const [selectedJadwalId, setSelectedJadwalId] = useState<string>('');

  // Reset filter kelas / pilihan jadwal yang sudah kedaluwarsa saat jadwal Admin diperbarui atau ganti hari
  useEffect(() => {
    if (selectedPresensiKelas !== 'SEMUA' && !myTeachingClasses.includes(selectedPresensiKelas)) {
      setSelectedPresensiKelas('SEMUA');
    }
  }, [myTeachingClasses, selectedPresensiKelas]);

  useEffect(() => {
    if (selectedJadwalId && !myTodaySchedules.some(j => getScheduleKey(j) === selectedJadwalId)) {
      setSelectedJadwalId('');
    }
  }, [myTodaySchedules, selectedJadwalId]);

  // Jadwal mengajar ustadz hari ini pada sesi jam yang sedang aktif (prioritas: belum absen & kelas terpilih)
  const myCurrentSessionSchedule = useMemo(() => {
    if (!activeSession.isActive && !settings.bypass_jam_presensi_testing) return null;

    const matchingActive = myTodaySchedules.filter(j =>
      isScheduleWindowActiveNow(j, activeSession, settings.bypass_jam_presensi_testing)
    );
    if (matchingActive.length === 0) return null;

    const inSelectedClass = (selectedPresensiKelas && selectedPresensiKelas !== 'SEMUA')
      ? matchingActive.filter(j => j.kelas === selectedPresensiKelas)
      : matchingActive;

    const pool = inSelectedClass.length > 0 ? inSelectedClass : matchingActive;
    // Utamakan jadwal sesi aktif yang BELUM diabsen hari ini (penting jika ada beberapa jadwal dalam satu hari)
    const unchecked = pool.find(j => !isScheduleCheckedInToday(j, absensiGuruList, activeSession.todayIso, pengurus, guruList));
    return unchecked || pool[0] || null;
  }, [
    activeSession,
    settings.bypass_jam_presensi_testing,
    myTodaySchedules,
    selectedPresensiKelas,
    absensiGuruList,
    pengurus,
    guruList
  ]);

  // Jadwal mengajar ustadz hari ini pada sesi jam yang LAIN
  const myOtherSessionSchedule = useMemo(() => {
    const otherPool = myTodaySchedules.filter(j =>
      !isScheduleWindowActiveNow(j, activeSession, settings.bypass_jam_presensi_testing)
    );
    if (otherPool.length === 0) return null;

    const sameTingkat = otherPool.find(j => {
      const isAliyah = isAliyahSchedule(j);
      return activeSession.tingkat === 'ALIYAH' ? isAliyah : !isAliyah;
    });
    return sameTingkat || otherPool[0] || null;
  }, [activeSession, settings.bypass_jam_presensi_testing, myTodaySchedules]);

  // Evaluasi jadwal yang aktif hari ini untuk ditampilkan dan diverifikasi
  const myActiveSchedule = useMemo(() => {
    if (myTodaySchedules.length === 0) return null;

    // 1. Jika ada jadwal hari ini yang dipilih spesifik oleh tombol sesi
    if (selectedJadwalId) {
      const found = myTodaySchedulesByClass.find(j => getScheduleKey(j) === selectedJadwalId) ||
                    myTodaySchedules.find(j => getScheduleKey(j) === selectedJadwalId);
      if (found) return found;
    }

    // 2. Jika sesi aktif dan ustadz punya jadwal aktif saat ini (prioritaskan yang belum absen)
    if ((activeSession.isActive || settings.bypass_jam_presensi_testing) && myCurrentSessionSchedule) {
      if (!selectedPresensiKelas || selectedPresensiKelas === 'SEMUA' || myCurrentSessionSchedule.kelas === selectedPresensiKelas) {
        return myCurrentSessionSchedule;
      }
    }

    // 3. Jadwal hari ini sesuai kelas yang dipilih
    if (myTodaySchedulesByClass.length > 0) {
      const uncheckedInClass = myTodaySchedulesByClass.find(
        j => !isScheduleCheckedInToday(j, absensiGuruList, activeSession.todayIso, pengurus, guruList)
      );
      return uncheckedInClass || myTodaySchedulesByClass[0];
    }

    // 4. Jadwal hari ini (jika ada pada jam lain)
    if (myOtherSessionSchedule) {
      return myOtherSessionSchedule;
    }

    return myTodaySchedules[0] || null;
  }, [
    selectedJadwalId,
    activeSession,
    settings.bypass_jam_presensi_testing,
    myCurrentSessionSchedule,
    myOtherSessionSchedule,
    selectedPresensiKelas,
    myTodaySchedulesByClass,
    myTodaySchedules,
    absensiGuruList,
    pengurus,
    guruList
  ]);

  // Validasi Ketidaksesuaian Sesi Jam Mengajar Guru (Jam Ke-1 vs Jam Ke-2 / Jam Ke-3 / Jenjang Siang-Malam)
  const sessionMismatchInfo = useMemo(() => {
    if (!activeSession.isActive || settings.bypass_jam_presensi_testing) {
      return { isMismatch: false, title: '', message: '', targetJam: 0 };
    }

    if (myActiveSchedule) {
      if (isScheduleWindowActiveNow(myActiveSchedule, activeSession, false)) {
        return { isMismatch: false, title: '', message: '', targetJam: 0 };
      }

      const jamTarget = Number(myActiveSchedule.jamKe || 1);
      const schedIsAliyah = isAliyahSchedule(myActiveSchedule);
      const sessionIsAliyah = activeSession.tingkat === 'ALIYAH';

      if (schedIsAliyah !== sessionIsAliyah) {
        return {
          isMismatch: true,
          targetJam: jamTarget,
          title: schedIsAliyah ? '⛔ Jadwal Ini Khusus Sesi Malam (Aliyah)' : '⛔ Jadwal Ini Khusus Sesi Siang (Tsanawiyah)',
          message: `Jadwal pilihan Anda (${myActiveSchedule.mapel} - ${myActiveSchedule.kelas}) adalah jadwal jenjang ${schedIsAliyah ? 'Aliyah (Malam)' : 'Tsanawiyah (Siang)'}, sedangkan sesi presensi saat ini adalah ${activeSession.tingkat} (${activeSession.sesi}).`,
        };
      }

      return {
        isMismatch: true,
        targetJam: jamTarget,
        title: jamTarget > Number(activeSession.jamKe)
          ? `⛔ Belum Waktunya Presensi (Jadwal Jam Ke-${jamTarget})`
          : `⛔ Sesi Jam Ke-${jamTarget} Telah Selesai / Di Luar Rentang Waktu`,
        message: jamTarget > Number(activeSession.jamKe)
          ? `Jadwal pilihan Anda (${myActiveSchedule.mapel} - ${myActiveSchedule.kelas}) terjadwal pada Jam Ke-${jamTarget} (${myActiveSchedule.waktu || '-'}). Anda hanya dapat melakukan presensi saat sesi Jam Ke-${jamTarget} dimulai.`
          : `Jadwal pilihan Anda (${myActiveSchedule.mapel} - ${myActiveSchedule.kelas}) adalah Jam Ke-${jamTarget} (${myActiveSchedule.waktu || '-'}). Sesi Jam Ke-${jamTarget} telah berakhir dan Anda tidak dapat absen pada sesi Jam Ke-${activeSession.jamKe}.`
      };
    }

    return { isMismatch: false, title: '', message: '', targetJam: 0 };
  }, [activeSession, settings.bypass_jam_presensi_testing, myActiveSchedule]);

  // Cek apakah ustadz login ini sudah presensi hari ini pada sesi jadwal yang dipilih secara spesifik
  const isAlreadyCheckedIn = useMemo(() => {
    if (!myActiveSchedule) return false;
    return isScheduleCheckedInToday(myActiveSchedule, absensiGuruList, activeSession.todayIso, pengurus, guruList);
  }, [myActiveSchedule, absensiGuruList, activeSession.todayIso, pengurus, guruList]);

  // Form Pengajuan Pengganti Ustadz (Khusus jadwal yang diampu pengurus ini)
  const [selectedJadwalToReplaceId, setSelectedJadwalToReplaceId] = useState<string>('');
  const [selectedUstadzPenggantiName, setSelectedUstadzPenggantiName] = useState<string>(guruList[0]?.nama || '');
  const [alasanPenggantianInput, setAlasanPenggantianInput] = useState<string>('');
  const [showAjukanPenggantiModal, setShowAjukanPenggantiModal] = useState<boolean>(false);

  // Jadwal yang dipilih untuk digantikan (hanya dari jadwal milik pengurus ini)
  const targetJadwalForReplacement = useMemo(() => {
    if (selectedJadwalToReplaceId) {
      return myAllSchedules.find(j => (j.id || `${j.kelas}_${j.hari}_${j.jamKe}`) === selectedJadwalToReplaceId) ||
             (jadwalList || []).find(j => (j.id || `${j.kelas}_${j.hari}_${j.jamKe}`) === selectedJadwalToReplaceId);
    }
    return myActiveSchedule || myTodaySchedules[0] || myAllSchedules[0] || null;
  }, [selectedJadwalToReplaceId, myAllSchedules, jadwalList, myActiveSchedule, myTodaySchedules]);

  // Kirim Pengajuan Ustadz Pengganti
  const handleAjukanPenggantiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetJadwalForReplacement) {
      alert('Pilih jadwal yang akan digantikan!');
      return;
    }
    if (!selectedUstadzPenggantiName) {
      alert('Pilih nama ustadz pengganti!');
      return;
    }
    if (!alasanPenggantianInput.trim()) {
      alert('Mohon isi alasan penggantian secara jelas!');
      return;
    }

    const needsAdminApproval = settings.pengganti_require_admin_approval === true;
    const initialStatus: 'Menunggu' | 'Disetujui' = needsAdminApproval ? 'Menunggu' : 'Disetujui';

    const newReq: PenggantiUstadzRequest = {
      id: `PNT-${Date.now()}`,
      jadwalId: targetJadwalForReplacement.id || `${targetJadwalForReplacement.kelas}_${targetJadwalForReplacement.hari}_${targetJadwalForReplacement.jamKe}`,
      tanggal: activeSession.todayIso,
      hari: targetJadwalForReplacement.hari,
      jamKe: targetJadwalForReplacement.jamKe || activeSession.jamKe || 1,
      jamJadwal: targetJadwalForReplacement.waktu || activeSession.wibClockShort,
      kelas: targetJadwalForReplacement.kelas,
      mapel: targetJadwalForReplacement.mapel,
      ustadzTerjadwal: targetJadwalForReplacement.nama || targetJadwalForReplacement.ustadz || pengurus.nama,
      ustadzPengganti: selectedUstadzPenggantiName,
      alasan: alasanPenggantianInput.trim(),
      status: initialStatus,
      diajukanOleh: pengurus.nama,
      disetujuiOleh: needsAdminApproval ? undefined : 'Disetujui Otomatis (Pengurus)',
      catatanAdmin: needsAdminApproval ? 'Menunggu Persetujuan Admin' : 'Penggantian Langsung Disetujui Pengurus',
      createdAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };

    const updated = [newReq, ...penggantiRequestList];
    setPenggantiRequestList(updated);
    try {
      localStorage.setItem('sim_pengganti_requests', JSON.stringify(updated));
    } catch {}

    broadcastAttendanceUpdate('pengganti', [newReq], pengurus.nama);
    setShowAjukanPenggantiModal(false);
    setAlasanPenggantianInput('');

    if (needsAdminApproval) {
      alert(`Pengajuan Ustadz Pengganti Berhasil Diajukan!\n\nUstadz Terjadwal: ${newReq.ustadzTerjadwal}\nUstadz Pengganti: ${newReq.ustadzPengganti}\nStatus: MENUNGGU PERSETUJUAN ADMIN\n\nAdmin dapat menyetujui melalui Dashboard Admin.`);
    } else {
      alert(`Penggantian Ustadz Resmi Aktif!\n\nUstadz Terjadwal: ${newReq.ustadzTerjadwal}\nUstadz Pengganti: ${newReq.ustadzPengganti}\nStatus: DISETUJUI LANGSUNG\n\nUstadz pengganti sekarang dapat melakukan presensi.`);
    }
  };

  // Cek apakah ada jadwal pengganti yang aktif dan disetujui untuk pengurus login
  const approvedSubstituteForMe = useMemo(() => {
    return penggantiRequestList.find(r => 
      r.tanggal === activeSession.todayIso &&
      r.status === 'Disetujui' &&
      r.ustadzPengganti.toLowerCase().trim() === pengurus.nama.toLowerCase().trim()
    );
  }, [penggantiRequestList, activeSession.todayIso, pengurus.nama]);

  // Eksekusi Tombol HADIR NORMAL (Async untuk mengizinkan pembacaan ulang GPS otomatis bila sinyal lemah)
  const handleHadirNormal = async () => {
    // Validasi 0: Batasan Jam Presensi Waktu Server Asia/Jakarta (WIB)
    if (!activeSession.isActive && !settings.bypass_jam_presensi_testing) {
      setValidationAlertModal({
        isOpen: true,
        type: 'outside_hours',
        title: '⏰ Jam Presensi Ditutup / Di Luar Jadwal',
        message: `Waktu server Asia/Jakarta (WIB) saat ini adalah ${activeSession.wibTimeStr}. Presensi hanya dapat dilakukan pada rentang jam yang ditentukan oleh Administrator.`,
        submessage: activeSession.keterangan || 'Presensi otomatis ditolak di luar rentang jam operasional resmi madrasah.'
      });
      return;
    }

    // Validasi 1: Cek Jadwal Aktif Milik Pribadi hari ini
    if (!myActiveSchedule) {
      setValidationAlertModal({
        isOpen: true,
        type: 'no_schedule',
        title: 'ℹ️ Tidak Ada Jadwal Mengajar',
        message: `Tidak ditemukan jadwal mengajar untuk Anda (${pengurus.nama}) pada hari ${currentDayName}.`,
        submessage: 'Sistem hanya mengizinkan presensi untuk jadwal pelajaran dan jam yang Anda ampu sendiri.'
      });
      return;
    }

    // Validasi 1.5: Sesi Jam Mengajar Guru Wajib Cocok (Jam Ke-1 vs Jam Ke-2 / Rentang Waktu Jadwal)
    if (!settings.bypass_jam_presensi_testing && (sessionMismatchInfo.isMismatch || !isScheduleWindowActiveNow(myActiveSchedule, activeSession, false))) {
      const jamTarget = Number(myActiveSchedule.jamKe || 1);
      setValidationAlertModal({
        isOpen: true,
        type: 'outside_hours',
        title: sessionMismatchInfo.title || `⛔ Sesi Jadwal Jam Ke-${jamTarget} Tidak Aktif`,
        message: sessionMismatchInfo.message || `Jadwal Anda (${myActiveSchedule.mapel} - ${myActiveSchedule.kelas}) adalah Jam Ke-${jamTarget} (${myActiveSchedule.waktu || '-'}).`,
        submessage: `Waktu Server Asia/Jakarta (WIB): ${activeSession.wibTimeStr}. Sesi aktif: Jam Ke-${activeSession.jamKe} (${activeSession.sesi}). Sesuai aturan madrasah, presensi hanya berlaku pada jam jadwal yang sesuai.`
      });
      return;
    }

    // Validasi Integritas: Tidak bisa mengabsensikan pengurus / ustadz lain
    if (!isScheduleOwnedByTeacher(myActiveSchedule, pengurus, guruList)) {
      setValidationAlertModal({
        isOpen: true,
        type: 'no_schedule',
        title: '⛔ Akses Presensi Ditolak',
        message: `Anda tidak dapat melakukan presensi untuk ustadz lain (${myActiveSchedule.nama || myActiveSchedule.ustadz}).`,
        submessage: 'Sistem menjaga integritas data presensi, Anda hanya dapat absen untuk jam mengajar Anda sendiri.'
      });
      return;
    }

    // Validasi 2: Cek Belum Absen untuk sesi ini
    if (isAlreadyCheckedIn) {
      setValidationAlertModal({
        isOpen: true,
        type: 'already_checked',
        title: '✓ Presensi Sudah Tercatat',
        message: `Anda sudah berhasil melakukan presensi hadir untuk sesi jam ${myActiveSchedule.mapel} (${myActiveSchedule.kelas}) pada hari ini.`,
        submessage: 'Data kehadiran telah tersimpan aman di sistem.'
      });
      return;
    }

    // Validasi 3: Geofencing & Lokasi (dengan pembacaan ulang otomatis jika akurasi GPS buruk)
    const isGeofencingEnabled = settings.geofencing_enabled !== false;
    let activeGeoCheck = geofenceCheck;
    let effectiveCoords = userCoords;

    if (isGeofencingEnabled && !activeGeoCheck.isValid && activeGeoCheck.needsGpsRetry && typeof navigator !== 'undefined' && navigator.geolocation) {
      const fresh = await acquireFreshGpsPosition(7000);
      if (fresh) {
        effectiveCoords = { lat: fresh.lat, lng: fresh.lng, accuracy: fresh.accuracy };
        activeGeoCheck = validateGeofence(fresh.lat, fresh.lng, fresh.accuracy, {
          enabled: settings.geofencing_enabled,
          zoneName: settings.geofencing_zone_name,
          latitude: settings.geofencing_latitude,
          longitude: settings.geofencing_longitude,
          radiusMeters: settings.geofencing_radius_meters,
          maxGpsAccuracy: settings.geofencing_max_gps_accuracy
        });
      }
    }

    if (isGeofencingEnabled && !activeGeoCheck.isValid) {
      if (!activeGeoCheck.hasLocation || activeGeoCheck.statusText === 'GPS BELUM TERDETEKSI') {
        setValidationAlertModal({
          isOpen: true,
          type: 'gps_unavailable',
          title: '📡 Lokasi GPS Belum Terdeteksi',
          message: gpsError || activeGeoCheck.message,
          submessage: 'Pastikan layanan lokasi/GPS perangkat aktif, izin lokasi browser diizinkan, lalu tekan tombol "Baca Ulang Lokasi GPS".',
          allowGpsRetry: true
        });
        return;
      }

      if (activeGeoCheck.statusText === 'GPS KURANG AKURAT') {
        setValidationAlertModal({
          isOpen: true,
          type: 'gps_inaccurate',
          title: '📡 Sinyal GPS Kurang Akurat / Tidak Stabil',
          message: `Akurasi GPS perangkat saat ini ±${Math.round(activeGeoCheck.accuracyMeters)}m (batas maksimal yang diizinkan ±${activeGeoCheck.maxAccuracyMeters}m).`,
          submessage: 'Anda kemungkinan sudah berada di area madrasah, namun sinyal GPS belum cukup presisi. Silakan pindah sejenak ke area yang lebih terbuka dan tekan "Baca Ulang Lokasi GPS".',
          allowGpsRetry: true,
          details: {
            distance: activeGeoCheck.distanceMeters,
            maxRadius: activeGeoCheck.radiusMeters,
            accuracy: activeGeoCheck.accuracyMeters,
            maxAccuracy: activeGeoCheck.maxAccuracyMeters
          }
        });
        return;
      }

      setValidationAlertModal({
        isOpen: true,
        type: 'outside_radius',
        title: '⚠️ Anda Berada di Luar Radius Madrasah',
        message: `Jarak posisi Anda saat ini: ${activeGeoCheck.distanceMeters.toFixed(1)} meter dari titik pusat madrasah (${activeGeoCheck.zoneName || 'Zona Madrasah'}).`,
        submessage: `Batas radius absensi kehadiran yang diizinkan adalah ${activeGeoCheck.radiusMeters} meter (akurasi GPS ±${Math.round(activeGeoCheck.accuracyMeters)}m). Silakan berada di dalam area madrasah atau tekan baca ulang GPS jika koordinat belum akurat.`,
        allowGpsRetry: true,
        details: {
          distance: activeGeoCheck.distanceMeters,
          maxRadius: activeGeoCheck.radiusMeters,
          accuracy: activeGeoCheck.accuracyMeters,
          maxAccuracy: activeGeoCheck.maxAccuracyMeters
        }
      });
      return;
    }

    const nowTime = activeSession.wibClockShort;
    const finalStatus: 'Hadir' | 'Terlambat' = activeSession.isLate ? 'Terlambat' : 'Hadir';
    const schedKey = getScheduleKey(myActiveSchedule);

    const newRecord: AbsensiGuruRecord = {
      id: `ABS-G-${Date.now()}`,
      absensiId: `ABS-G-${Date.now()}`,
      jadwalId: schedKey,
      ustadzTerjadwalId: pengurus.id,
      ustadzTerjadwalNama: myActiveSchedule.nama || pengurus.nama,
      ustadzAktualId: pengurus.id,
      ustadzAktualNama: pengurus.nama,
      tipeAbsensi: 'Normal',
      tanggal: activeSession.todayIso,
      nama: pengurus.nama,
      mapel: myActiveSchedule.mapel,
      kelas: myActiveSchedule.kelas,
      status: finalStatus,
      catatan: finalStatus === 'Hadir'
        ? `Presensi Hadir Tepat Waktu (${nowTime} WIB - Hari: ${myActiveSchedule.hari || currentDayName} - Sesuai Jadwal ${myActiveSchedule.kelas} Jam ke-${myActiveSchedule.jamKe})`
        : `Presensi Terlambat (${nowTime} WIB - Hari: ${myActiveSchedule.hari || currentDayName} - Sesuai Jadwal ${myActiveSchedule.kelas} Jam ke-${myActiveSchedule.jamKe})`,
      hari: myActiveSchedule.hari || currentDayName,
      jamKe: myActiveSchedule.jamKe || activeSession.jamKe || 1,
      jamJadwal: myActiveSchedule.waktu || `${nowTime} WIB`,
      jamAbsen: `${nowTime} WIB`,
      waktu: `${nowTime} WIB`,
      latitude: effectiveCoords.lat ?? undefined,
      longitude: effectiveCoords.lng ?? undefined,
      akurasiGps: effectiveCoords.accuracy ?? undefined,
      jarak: activeGeoCheck.distanceMeters,
      zona: activeGeoCheck.zoneName,
      statusPersetujuan: 'Langsung',
      timestampServer: new Date().toISOString()
    };

    if (onSaveAbsensiGuru) {
      onSaveAbsensiGuru([newRecord]);
    }

    try {
      const savedG = JSON.parse(localStorage.getItem('sim_absensi_guru') || '[]');
      const filtered = savedG.filter((p: any) => {
        if (p.jadwalId && newRecord.jadwalId && p.tanggal === newRecord.tanggal && p.jadwalId === newRecord.jadwalId) {
          return false;
        }
        return !(p.tanggal === newRecord.tanggal && p.nama === newRecord.nama && p.kelas === newRecord.kelas && String(p.jamKe) === String(newRecord.jamKe) && (!p.mapel || !newRecord.mapel || p.mapel === newRecord.mapel));
      });
      const updated = [newRecord, ...filtered];
      localStorage.setItem('sim_absensi_guru', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
    } catch {}

    broadcastAttendanceUpdate('guru', [newRecord], pengurus.nama);

    setValidationAlertModal({
      isOpen: true,
      type: 'success',
      title: '✅ Presensi Hadir Berhasil Dicatat!',
      message: `Alhamdulillah, presensi Ustadz ${newRecord.nama} (${newRecord.mapel} - ${newRecord.kelas}) telah berhasil dicatat.`,
      submessage: `Hari: ${currentDayName} • Jam: ${nowTime} WIB • Status: ${finalStatus.toUpperCase()}. Data langsung tersinkronkan ke Dashboard Admin secara realtime!`
    });
  };

  // Eksekusi Tombol HADIR SEBAGAI PENGGANTI
  const handleHadirPengganti = async () => {
    // Validasi 1: Waktu Server Asia/Jakarta (WIB)
    if (!activeSession.isActive && !settings.bypass_jam_presensi_testing) {
      setValidationAlertModal({
        isOpen: true,
        type: 'outside_hours',
        title: '⏰ Di Luar Jam Absensi Pelajaran',
        message: `Waktu server Asia/Jakarta (WIB) saat ini adalah ${activeSession.wibTimeStr}. Presensi ustadz pengganti tidak dapat dilakukan di luar jam pelajaran aktif.`,
        submessage: activeSession.keterangan || 'Presensi hanya dibuka pada rentang jam pelajaran yang ditentukan oleh Admin di Option Panel.'
      });
      return;
    }

    // Validasi 2: Geofencing (konsisten menghormati settings.geofencing_enabled !== false)
    const isGeofencingEnabled = settings.geofencing_enabled !== false;
    let activeGeoCheck = geofenceCheck;
    let effectiveCoords = userCoords;

    if (isGeofencingEnabled && !activeGeoCheck.isValid && activeGeoCheck.needsGpsRetry && typeof navigator !== 'undefined' && navigator.geolocation) {
      const fresh = await acquireFreshGpsPosition(7000);
      if (fresh) {
        effectiveCoords = { lat: fresh.lat, lng: fresh.lng, accuracy: fresh.accuracy };
        activeGeoCheck = validateGeofence(fresh.lat, fresh.lng, fresh.accuracy, {
          enabled: settings.geofencing_enabled,
          zoneName: settings.geofencing_zone_name,
          latitude: settings.geofencing_latitude,
          longitude: settings.geofencing_longitude,
          radiusMeters: settings.geofencing_radius_meters,
          maxGpsAccuracy: settings.geofencing_max_gps_accuracy
        });
      }
    }

    if (isGeofencingEnabled && !activeGeoCheck.isValid) {
      if (!activeGeoCheck.hasLocation || activeGeoCheck.statusText === 'GPS BELUM TERDETEKSI') {
        setValidationAlertModal({
          isOpen: true,
          type: 'gps_unavailable',
          title: '📡 Lokasi GPS Belum Terdeteksi',
          message: gpsError || activeGeoCheck.message,
          submessage: 'Aktifkan GPS dan izinkan akses lokasi browser, lalu tekan "Baca Ulang Lokasi GPS".',
          allowGpsRetry: true
        });
        return;
      }

      if (activeGeoCheck.statusText === 'GPS KURANG AKURAT') {
        setValidationAlertModal({
          isOpen: true,
          type: 'gps_inaccurate',
          title: '📡 Sinyal GPS Kurang Akurat / Tidak Stabil',
          message: `Akurasi GPS saat ini ±${Math.round(activeGeoCheck.accuracyMeters)}m (batas maksimal ±${activeGeoCheck.maxAccuracyMeters}m).`,
          submessage: 'Silakan pindah ke area terbuka lalu tekan "Baca Ulang Lokasi GPS".',
          allowGpsRetry: true,
          details: {
            distance: activeGeoCheck.distanceMeters,
            maxRadius: activeGeoCheck.radiusMeters,
            accuracy: activeGeoCheck.accuracyMeters,
            maxAccuracy: activeGeoCheck.maxAccuracyMeters
          }
        });
        return;
      }

      setValidationAlertModal({
        isOpen: true,
        type: 'outside_radius',
        title: '⚠️ Anda Berada di Luar Radius Madrasah',
        message: `Jarak posisi Anda saat ini: ${activeGeoCheck.distanceMeters.toFixed(1)} meter dari titik pusat madrasah (${activeGeoCheck.zoneName || 'Zona Madrasah'}).`,
        submessage: `Ustadz pengganti tetap wajib berada secara fisik di lokasi madrasah (Maks: ${activeGeoCheck.radiusMeters}m).`,
        allowGpsRetry: true,
        details: {
          distance: activeGeoCheck.distanceMeters,
          maxRadius: activeGeoCheck.radiusMeters,
          accuracy: activeGeoCheck.accuracyMeters,
          maxAccuracy: activeGeoCheck.maxAccuracyMeters
        }
      });
      return;
    }

    // Validasi 3: Cek Persetujuan Pengganti Aktif
    const targetSub = approvedSubstituteForMe || penggantiRequestList.find(r => 
      r.tanggal === activeSession.todayIso && r.status === 'Disetujui' &&
      isTeacherNameMatch(r.ustadzPengganti, pengurus.nama)
    );

    if (!targetSub) {
      setValidationAlertModal({
        isOpen: true,
        type: 'no_pengganti',
        title: 'ℹ️ Belum Ada Penugasan Pengganti',
        message: `Belum ada penugasan ustadz pengganti yang disetujui resmi untuk ${pengurus.nama} pada sesi hari ini.`,
        submessage: 'Silakan gunakan tombol "Ajukan Pengganti Ustadz" terlebih dahulu untuk mendaftarkan jadwal penggantian.'
      });
      return;
    }

    const nowTime = activeSession.wibClockShort;
    const newRecord: AbsensiGuruRecord = {
      id: `ABS-SUB-${Date.now()}`,
      absensiId: `ABS-SUB-${Date.now()}`,
      jadwalId: targetSub.jadwalId,
      ustadzTerjadwalNama: targetSub.ustadzTerjadwal,
      ustadzAktualNama: targetSub.ustadzPengganti,
      ustadzPengganti: targetSub.ustadzPengganti,
      tipeAbsensi: 'Pengganti',
      tanggal: activeSession.todayIso,
      nama: targetSub.ustadzTerjadwal, // Nama pada jadwal utama tetap asli
      mapel: targetSub.mapel,
      kelas: targetSub.kelas,
      status: activeSession.status,
      alasanPenggantian: targetSub.alasan,
      catatan: `Hadir Sebagai Pengganti Resmi ${targetSub.ustadzTerjadwal} (Alasan: ${targetSub.alasan}) • Jarak: ${activeGeoCheck.distanceMeters.toFixed(1)}m`,
      hari: currentDayName,
      jamKe: targetSub.jamKe || activeSession.jamKe || 1,
      jamJadwal: targetSub.jamJadwal,
      jamAbsen: `${nowTime} WIB`,
      waktu: `${nowTime} WIB`,
      latitude: effectiveCoords.lat ?? undefined,
      longitude: effectiveCoords.lng ?? undefined,
      akurasiGps: effectiveCoords.accuracy ?? undefined,
      jarak: activeGeoCheck.distanceMeters,
      zona: activeGeoCheck.zoneName,
      statusPersetujuan: 'Disetujui',
      timestampServer: new Date().toISOString()
    };

    if (onSaveAbsensiGuru) {
      onSaveAbsensiGuru([newRecord]);
    }

    try {
      const savedG = JSON.parse(localStorage.getItem('sim_absensi_guru') || '[]');
      const filtered = savedG.filter((p: any) => !(p.tanggal === newRecord.tanggal && p.nama === newRecord.nama && p.kelas === newRecord.kelas && String(p.jamKe) === String(newRecord.jamKe) && (!p.mapel || !newRecord.mapel || p.mapel === newRecord.mapel)));
      const updated = [newRecord, ...filtered];
      localStorage.setItem('sim_absensi_guru', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
    } catch {}

    broadcastAttendanceUpdate('guru', [newRecord], pengurus.nama);

    setValidationAlertModal({
      isOpen: true,
      type: 'success',
      title: '✅ Presensi Pengganti Berhasil Dicatat!',
      message: `Presensi Ustadz Pengganti (${targetSub.ustadzPengganti}) menggantikan ${targetSub.ustadzTerjadwal} pada mapel ${targetSub.mapel} (${targetSub.kelas}) telah berhasil dicatat.`,
      submessage: `Jadwal asli tetap aman. Data realisasi kehadiran pengganti langsung tersimpan dan disinkronkan ke Dashboard Admin!`
    });
  };

  // State untuk Tab Presensi Seluruh Santri (Input Manual Pengurus)
  const [selectedClassSantriTab, setSelectedClassSantriTab] = useState<string>('SEMUA');
  const [globalSantriAbsensi, setGlobalSantriAbsensi] = useState<Record<string, { status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpha', ket: string }>>({});

  const handleSaveAllSantriAttendance = () => {
    const targetList = selectedClassSantriTab === 'SEMUA'
      ? santriList
      : santriList.filter(s => s.kelas === selectedClassSantriTab);

    if (!targetList.length) return;

    const records: AbsensiSantriRecord[] = targetList.map(s => {
      const entry = globalSantriAbsensi[s.id] || { status: 'Hadir', ket: 'Input Manual Pengurus' };
      return {
        tanggal: activeSession.todayIso,
        idSantri: s.id,
        nama: s.nama,
        kelas: s.kelas,
        status: entry.status,
        keterangan: entry.ket || `Presensi Manual oleh Pengurus ${pengurus.nama}`
      };
    });

    if (onSaveAbsensiSantri) {
      onSaveAbsensiSantri(records);
      alert(`Presensi manual ${records.length} santri (${selectedClassSantriTab}) berhasil disimpan! Data langsung terupdate ke Dashboard Admin di Fitur Absensi Santri secara real-time.`);
    }
  };

  const handleMarkAllHadirGlobal = () => {
    const targetList = selectedClassSantriTab === 'SEMUA'
      ? santriList
      : santriList.filter(s => s.kelas === selectedClassSantriTab);
    const updated = { ...globalSantriAbsensi };
    targetList.forEach(s => {
      updated[s.id] = { status: 'Hadir', ket: 'Hadir tepat waktu' };
    });
    setGlobalSantriAbsensi(updated);
  };

  // Simpan Presensi Santri Kelas Bimbingan (Wali Kelas)
  const handleSaveClassAttendance = () => {
    if (!myStudents.length) return;
    const records: AbsensiSantriRecord[] = myStudents.map(s => {
      const stat = localSantriAbsensi[s.id] || 'Hadir';
      return {
        tanggal: activeSession.todayIso,
        idSantri: s.id,
        nama: s.nama,
        kelas: s.kelas,
        status: stat,
        keterangan: `Presensi Wali Kelas ${pengurus.nama}`
      };
    });

    if (onSaveAbsensiSantri) {
      onSaveAbsensiSantri(records);
      alert(`Presensi anak didik ${waliKelasKelas} (${records.length} santri) berhasil disimpan ke Database Pusat Admin secara real-time!`);
    }
  };

  return (
    <div 
      className="min-h-screen bg-[#03140c] bg-cover bg-center text-[#f3e5ab] flex flex-col transition-all duration-300 w-full overflow-x-hidden font-sans selection:bg-[#d4af37] selection:text-black"
      style={settings.background_url ? { backgroundImage: `linear-gradient(rgba(3, 20, 12, 0.94), rgba(3, 20, 12, 0.97)), url(${settings.background_url})` } : undefined}
    >
      {/* MOBILE TOP BAR (Phone & Small Screens: iOS & Android) - Compact Sticky Header dengan Tombol Garis 3 */}
      <div className="md:hidden flex items-center justify-between px-3.5 py-2.5 min-h-[56px] bg-[#052216]/98 border-b border-[#d4af37]/30 backdrop-blur-md sticky top-0 z-50 w-full shadow-lg">
        <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
          <BrandLogos settings={settings} size="xs" idPrefix="pengurus-mob-header" />
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-xs text-[#d4af37] truncate uppercase font-serif leading-tight">
              {settings.portal_title || settings.nama_pesantren || 'SIM Pondok Pesantren'}
            </h2>
            <p className="text-[10px] text-emerald-300 truncate leading-tight mt-0.5">
              {pengurus.nama} • {
                activeTab === 'dashboard' ? 'Dasbor Utama' :
                activeTab === 'izin-mengajar' ? 'Izin Mengajar' :
                activeTab === 'wali-kelas' ? `Wali Kelas (${waliKelasKelas})` :
                activeTab === 'kalender' ? 'Kalender & Agenda' :
                activeTab === 'absensi-santri' ? 'Presensi Santri' :
                activeTab === 'jadwal' ? 'Jadwal & Kitab' :
                activeTab === 'nadzhom' ? 'Setoran Nadzhom' :
                activeTab === 'ujian-kitab' ? 'Nilai Ujian' :
                'Biodata & Profil'
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <PWAInstallButton />
          <button
            type="button"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="relative min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-[#03140c] border border-[#d4af37]/50 text-[#d4af37] hover:text-white active:scale-95 transition shadow"
            aria-label="Toggle Menu Navigasi"
            aria-expanded={showMobileMenu}
          >
            {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            {!showMobileMenu && (urgentEvents.length + unreadSilabusUpdates.length) > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-[#03140c]" />
            )}
          </button>
        </div>
      </div>

      {/* MOBILE MENU DRAWER OVERLAY (Tampil rapi tepat di bawah tombol garis 3 di posisi scroll manapun) */}
      {showMobileMenu && (
        <div
          className="md:hidden fixed inset-x-0 top-[56px] bottom-0 z-40 bg-black/75 backdrop-blur-sm flex flex-col"
          onClick={() => setShowMobileMenu(false)}
        >
          <div
            className="bg-[#041c12]/98 border-b border-[#d4af37]/35 backdrop-blur-xl p-4 space-y-3.5 shadow-2xl max-h-[82vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#d4af37]/20">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-[#0b3824] border border-[#d4af37]/50 shrink-0">
                  <img
                    src={pengurus.foto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                    alt={pengurus.nama}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white block truncate">{pengurus.nama}</span>
                  <span className="text-[10px] text-[#d4af37] block truncate">{pengurus.jabatan}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setShowEditModal(true); setShowMobileMenu(false); }}
                className="px-3 min-h-[36px] rounded-lg bg-[#03140c] border border-[#d4af37]/40 text-[11px] font-bold text-[#d4af37] shrink-0"
              >
                Edit Profil
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'dashboard', label: 'Dasbor Utama', icon: Sparkles },
                { id: 'izin-mengajar', label: 'Izin Mengajar', icon: FileText, badge: myIzinList.filter(i => i.status === 'Menunggu').length || undefined },
                { id: 'nadzhom', label: 'Setoran Nadzhom', icon: BookOpen, badge: liveNadzhomList.length || undefined },
                { id: 'wali-kelas', label: `Wali Kelas (${waliKelasKelas})`, icon: GraduationCap },
                { id: 'kalender', label: 'Kalender & Agenda', icon: Calendar, badge: urgentEvents.length || undefined },
                { id: 'absensi-santri', label: 'Presensi Santri', icon: UserCheck },
                { id: 'jadwal', label: 'Jadwal & Kitab', icon: BookOpen, badge: unreadSilabusUpdates.length ? 'Update' : undefined },
                { id: 'ujian-kitab', label: 'Nilai Ujian', icon: Award },
                { id: 'profil-saya', label: 'Biodata & Profil', icon: Users },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => { setActiveTab(tab.id); setShowMobileMenu(false); }}
                    className={`min-h-[44px] px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between gap-1.5 transition ${
                      isActive ? 'btn-3d-gold text-black shadow-md' : 'bg-[#03140c] border border-[#d4af37]/25 text-[#f3e5ab]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{tab.label}</span>
                    </div>
                    {tab.badge && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-600 text-white font-mono shrink-0">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#d4af37]/20">
              <button
                type="button"
                onClick={() => { setShowIzinModal(true); setShowMobileMenu(false); }}
                className="min-h-[42px] py-2 rounded-xl btn-3d-yellow text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Ajukan Izin</span>
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="min-h-[42px] py-2 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-red-900 transition shadow"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA - Optimasi Scroll & Tata Letak Ergonomis iOS/Android & Desktop */}
      <main className={`${building ? 'build-sequence' : ''} flex-1 px-3 py-3.5 sm:p-5 md:p-6 space-y-4 sm:space-y-6 w-full max-w-7xl mx-auto pb-8`}>
        {/* Top Header - Desktop View (Mobile menggunakan Sticky Top Bar + Menu Garis 3 agar langsung fokus ke konten) */}
        <header className="hidden md:flex build-header header-3d-banner rounded-2xl p-5 backdrop-blur flex-row justify-between items-center gap-4 w-full shadow-2xl">
          <div className="flex items-center gap-3.5">
            <BrandLogos settings={settings} size="sm" gap="gap-2" idPrefix="pengurus-main-header" />
            <div>
              <h1 className="text-xl md:text-2xl font-bold font-serif text-[#d4af37] text-gold-3d tracking-wide leading-tight">
                {settings.header_title || settings.portal_title || settings.nama_pesantren || 'SIM Pondok Pesantren Salaf Al-Maliki'}
              </h1>
              <p className="text-xs text-emerald-200/90 mt-1 flex items-center gap-2 flex-wrap">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block shrink-0" />
                <span className="font-medium">{settings.header_subtitle || 'Portal Khusus Pengurus & Asatidz Madrasah Diniyah'}</span>
                <span className="text-emerald-400/40">•</span>
                <span className="text-[#d4af37] font-bold font-mono">{pengurus.nama} ({pengurus.jabatan})</span>
              </p>
            </div>
          </div>

          {/* Action Buttons: PWA Install, Profil Pengurus, Ajukan Izin, Keluar */}
          <div className="flex flex-wrap items-center gap-2.5 text-right justify-end w-auto">
            <PWAInstallButton variant="button" />
            
            <button
              type="button"
              onClick={() => setShowEditModal(true)}
              className="px-3.5 py-2 rounded-xl bg-[#031c10] border border-[#d4af37]/60 text-xs font-bold text-[#f3e5ab] flex items-center gap-2 hover:bg-[#062c1b] transition shadow"
              title="Edit Biodata & Profil"
            >
              <div className="w-5 h-5 rounded-full overflow-hidden bg-[#0b3824] border border-[#d4af37]/50 shrink-0">
                <img
                  src={pengurus.foto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                  alt={pengurus.nama}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="truncate max-w-[130px]">{pengurus.nama}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowIzinModal(true)}
              className="btn-3d-yellow px-4 py-2 rounded-xl text-black font-extrabold text-xs flex items-center gap-2 shadow"
              title="Ajukan Izin Tidak Mengajar"
            >
              <Send className="w-3.5 h-3.5 text-black shrink-0" />
              <span>Ajukan Izin</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="px-4 py-2 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs font-bold flex items-center gap-2 hover:bg-red-900 transition shadow"
              title="Keluar dari Portal Pengurus"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span>Keluar</span>
            </button>
          </div>
        </header>

        {/* Tab Navigation Menu - Hanya tampil di Desktop/Tablet (Di HP cukup gunakan tombol garis 3 di atas) */}
        <div className="hidden md:block card-3d-glass rounded-2xl p-2 sm:p-2.5 border border-[#d4af37]/30 shadow-lg overflow-x-auto no-scrollbar scroll-smooth touch-pan-x">
          <nav className="flex items-center gap-1.5 sm:gap-2 min-w-max pb-0.5">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 ${
                activeTab === 'dashboard'
                  ? 'btn-3d-gold text-black font-extrabold shadow-lg'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-950/40 border border-transparent'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Dasbor Utama</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('izin-mengajar')}
              className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 ${
                activeTab === 'izin-mengajar'
                  ? 'btn-3d-gold text-black font-extrabold shadow-lg'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-950/40 border border-transparent'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Izin Mengajar</span>
              {myIzinList.filter(i => i.status === 'Menunggu').length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-black text-[#fef08a] font-mono text-[9px] font-bold border border-yellow-300/40">
                  {myIzinList.filter(i => i.status === 'Menunggu').length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('wali-kelas')}
              className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 ${
                activeTab === 'wali-kelas'
                  ? 'btn-3d-gold text-black font-extrabold shadow-lg'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-950/40 border border-transparent'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Wali Kelas</span>
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-900 border border-emerald-500/40 text-[9px] text-emerald-300 font-bold">
                {waliKelasKelas}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('kalender')}
              className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 ${
                activeTab === 'kalender'
                  ? 'btn-3d-gold text-black font-extrabold shadow-lg'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-950/40 border border-transparent'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Kalender & Agenda</span>
              {urgentEvents.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-600 text-white font-mono text-[9px] animate-pulse">
                  {urgentEvents.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('absensi-santri')}
              className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 ${
                activeTab === 'absensi-santri'
                  ? 'btn-3d-gold text-black font-extrabold shadow-lg'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-950/40 border border-transparent'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Presensi Santri</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('jadwal')}
              className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 ${
                activeTab === 'jadwal'
                  ? 'btn-3d-gold text-black font-extrabold shadow-lg'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-950/40 border border-transparent'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Jadwal & Kitab</span>
              {unreadSilabusUpdates.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-black text-[#fef08a] font-black text-[9px] animate-pulse border border-yellow-200 shadow-md">
                  ⚡ {unreadSilabusUpdates.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('nadzhom')}
              className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 ${
                activeTab === 'nadzhom'
                  ? 'btn-3d-gold text-black font-extrabold shadow-lg'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-950/40 border border-transparent'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Setoran Nadzhom</span>
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-900 border border-emerald-500/40 text-[9px] text-emerald-300 font-bold">
                {liveNadzhomList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ujian-kitab')}
              className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 ${
                activeTab === 'ujian-kitab'
                  ? 'btn-3d-gold text-black font-extrabold shadow-lg'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-950/40 border border-transparent'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Nilai Ujian</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('profil-saya')}
              className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 ${
                activeTab === 'profil-saya'
                  ? 'btn-3d-gold text-black font-extrabold shadow-lg'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-950/40 border border-transparent'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Biodata & Profil</span>
            </button>
          </nav>
        </div>

        {/* ===================== NOTIFIKASI REAL-TIME UPDATE MATERI SILABUS GURU (RINGKAS & JELAS) ===================== */}
        {unreadSilabusUpdates.length > 0 && (
          <div className="card-3d-glass rounded-xl sm:rounded-2xl p-3 sm:p-3.5 border border-amber-400/75 bg-gradient-to-r from-[#2a1b05] via-[#1a1204] to-[#2a1b05] shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-amber-500/25">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-6 h-6 rounded-lg bg-amber-400 text-black flex items-center justify-center shrink-0">
                  <BookOpen className="w-3.5 h-3.5" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-xs sm:text-sm font-extrabold text-white truncate">
                    Update Silabus Kitab ({unreadSilabusUpdates.length})
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('jadwal')}
                  className="px-2.5 py-1 rounded-lg bg-amber-400 text-black text-[11px] font-extrabold hover:bg-amber-300 transition"
                >
                  Buka
                </button>
                <button
                  type="button"
                  onClick={handleDismissAllSilabusAlerts}
                  className="px-2 py-1 rounded-lg bg-black/60 hover:bg-black/90 text-slate-300 hover:text-white text-[11px] font-bold border border-amber-500/30 transition"
                >
                  Tutup
                </button>
              </div>
            </div>

            <div className="space-y-1.5 mt-2">
              {(showAllSilabusNotifs ? unreadSilabusUpdates : unreadSilabusUpdates.slice(0, 2)).map((s, idx) => (
                <div key={s.id || idx} className="bg-black/50 border border-amber-500/30 rounded-lg px-2.5 py-2 flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-[#d4af37] font-serif truncate">{s.namaKitab}</span>
                      <span className="text-[10px] text-blue-300 font-semibold">• {s.kelas}</span>
                    </div>
                    <p className="text-[11px] text-teal-200 truncate mt-0.5">
                      Materi: <span className="text-white font-semibold">{s.materiSaatIni || '-'}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDismissSilabusAlert(s)}
                    className="text-[10px] text-amber-300 hover:text-white font-bold px-2 py-1 rounded bg-amber-500/10 border border-amber-500/30 shrink-0"
                  >
                    Dibaca ✓
                  </button>
                </div>
              ))}
              {unreadSilabusUpdates.length > 2 && (
                <button
                  type="button"
                  onClick={() => setShowAllSilabusNotifs(!showAllSilabusNotifs)}
                  className="w-full text-center text-[11px] text-amber-300 font-bold py-1 hover:text-white flex items-center justify-center gap-1"
                >
                  {showAllSilabusNotifs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  <span>{showAllSilabusNotifs ? 'Ringkas Notifikasi' : `Lihat ${unreadSilabusUpdates.length - 2} Update Lainnya`}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* ===================== TAB 1: DASBOR UTAMA PENGURUS ===================== */}
        {activeTab === 'dashboard' && (
          <div className={`${building ? 'build-sequence' : ''} space-y-4 sm:space-y-6`}>
            {/* 1. NOTIFIKASI KALENDER AKADEMIK & RAPAT MENDESAK (SIMPLE, RINGKAS & JELAS) */}
            {urgentEvents.length > 0 && (
              <div className="card-3d-glass rounded-xl sm:rounded-2xl p-3 sm:p-3.5 border border-red-500/70 bg-gradient-to-r from-red-950/60 via-[#1c0808]/80 to-red-950/60 shadow-lg relative overflow-hidden">
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-red-500/25">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0">
                      <Bell className="w-3.5 h-3.5" />
                    </span>
                    <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                      <h2 className="text-xs sm:text-sm font-extrabold text-white truncate">
                        Agenda Mendesak
                      </h2>
                      <span className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[9px] font-mono uppercase font-bold shrink-0">
                        {urgentEvents.length} Aktif
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('kalender')}
                    className="text-[11px] text-red-200 hover:text-white font-bold flex items-center gap-0.5 shrink-0 px-2 py-1 rounded-lg bg-black/40 border border-red-500/30"
                  >
                    <span>Kalender</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-1.5 mt-2">
                  {(showAllUrgentNotifs ? urgentEvents : urgentEvents.slice(0, 2)).map(evt => (
                    <div
                      key={evt.id}
                      className="bg-black/40 border border-red-500/35 rounded-lg px-2.5 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40 text-[9px] font-bold uppercase shrink-0">
                            {evt.kategori}
                          </span>
                          <h3 className="text-xs font-bold text-white truncate">{evt.judul}</h3>
                        </div>
                        {(evt.lokasi || evt.deskripsi) && (
                          <p className="text-[11px] text-red-100/80 truncate mt-0.5">
                            {evt.lokasi ? `📍 ${evt.lokasi}` : ''}{evt.lokasi && evt.deskripsi ? ' • ' : ''}{evt.deskripsi}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] sm:text-[11px] text-amber-300 font-mono font-bold shrink-0">
                        {evt.tanggalMulai}{evt.waktu ? ` • ${evt.waktu}` : ''}
                      </span>
                    </div>
                  ))}
                  {urgentEvents.length > 2 && (
                    <button
                      type="button"
                      onClick={() => setShowAllUrgentNotifs(!showAllUrgentNotifs)}
                      className="w-full text-center text-[11px] text-red-200 font-bold py-1 hover:text-white flex items-center justify-center gap-1"
                    >
                      {showAllUrgentNotifs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      <span>{showAllUrgentNotifs ? 'Tutup Sebagian' : `Lihat ${urgentEvents.length - 2} Agenda Lainnya`}</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 2. PRESENSI MANDIRI HARI INI DENGAN SISTEM GEOFENCING OTOMATIS & PENGGANTI RESMI */}
            <div className="card-3d rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 border border-[#d4af37]/40 bg-gradient-to-r from-[#031c12] via-[#05281b] to-[#031c12] shadow-2xl space-y-4 sm:space-y-5">
              {/* Header Info & Jam Server */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-[#d4af37]/25">
                <div className="flex items-start sm:items-center space-x-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-b from-[#0e442c] to-[#052517] border-t border-t-white/60 border-b-2 border-b-[#02130b] border-x border-[#d4af37]/50 flex items-center justify-center text-[#fef08a] shadow-lg shrink-0">
                    <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-[#fef08a] drop-shadow" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base sm:text-lg font-extrabold text-white text-gold-3d flex items-center gap-2">
                        <span>Presensi Mandiri Ustadz / Ustadzah</span>
                        <span className="text-xs font-mono font-normal text-emerald-300">({activeSession.todayIso})</span>
                      </h2>
                      {simulationActive && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/50 text-[10px] font-mono font-bold animate-pulse">
                          ⚡ Mode Uji Jam: {activeSession.wibClockShort} WIB
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-emerald-200/90 mt-0.5">
                      Validasi otomatis lokasi GPS & Jam Server (Asia/Jakarta). Tekan tombol <b>[ HADIR ]</b> di bawah untuk mencatat absensi.
                    </p>
                  </div>
                </div>

                {/* Jam Server Digital Real-Time & Tombol Toggle Uji Coba */}
                <div className="flex items-center gap-2.5 self-stretch md:self-auto justify-between md:justify-end">
                  <div className="px-4 py-2 rounded-2xl bg-black/80 border-t border-t-emerald-400/40 border-b border-b-black border-x border-[#d4af37]/40 shadow-inner flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                    <div>
                      <span className="text-[9px] text-[#d4af37] font-bold block uppercase tracking-wider leading-none">JAM SERVER (WIB)</span>
                      <span className="text-base font-black text-white font-mono tracking-wider leading-none mt-1 block">
                        {activeSession.wibTimeStr}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowSimulasiBar(!showSimulasiBar)}
                    className="btn-3d-yellow px-3 py-2 text-xs font-extrabold"
                    title="Buka panel simulasi jam server untuk pengujian"
                  >
                    <Sliders className="w-3.5 h-3.5 text-[#1a1202]" />
                    <span className="hidden sm:inline">Uji Jam</span>
                  </button>
                </div>
              </div>

              {/* TABS MODE: [ ABSENSI NORMAL ] vs [ ABSENSI PENGGANTI ] - Proporsional di HP & Desktop */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 bg-[#03140c] p-2.5 sm:p-3 rounded-2xl border border-[#d4af37]/35 shadow-inner">
                <div className="grid grid-cols-2 sm:inline-flex items-center gap-2 w-full lg:w-auto">
                  <button
                    type="button"
                    onClick={() => setAbsensiMode('normal')}
                    className={`min-h-[42px] px-3 sm:px-4 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
                      absensiMode === 'normal'
                        ? 'btn-3d-yellow text-[#1a1202] shadow-lg'
                        : 'bg-[#052216]/70 text-slate-300 hover:text-white hover:bg-emerald-950/40 border border-[#d4af37]/20'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>Absensi Normal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAbsensiMode('pengganti')}
                    className={`min-h-[42px] px-3 sm:px-4 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
                      absensiMode === 'pengganti'
                        ? 'btn-3d-yellow text-[#1a1202] shadow-lg'
                        : 'bg-[#052216]/70 text-amber-300/80 hover:text-amber-200 hover:bg-amber-950/40 border border-[#d4af37]/20'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Pengganti</span>
                    {penggantiRequestList.filter(r => r.status === 'Disetujui' && r.ustadzPengganti.toLowerCase().trim() === pengurus.nama.toLowerCase().trim()).length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-black text-amber-300 text-[9px] font-mono font-bold">
                        Aktif
                      </span>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:inline-flex items-center gap-2 w-full lg:w-auto">
                  <button
                    type="button"
                    onClick={() => setShowAjukanPenggantiModal(true)}
                    className="btn-3d-yellow min-h-[40px] px-3 py-2 text-xs font-bold flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <PlusCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Ajukan Pengganti</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowIzinModal(true)}
                    className="min-h-[40px] px-3 py-2 rounded-xl bg-[#0a2f1e] hover:bg-[#0f402a] border-t border-white/30 border-b border-black text-[#fef08a] font-bold text-xs flex items-center justify-center gap-1.5 transition shadow whitespace-nowrap"
                  >
                    <Send className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Izin Mengajar</span>
                  </button>
                </div>
              </div>

              {/* CARD UTAMA ABSENSI (FOKUS & BERSIH TANPA PETA MENYEMPITKAN LAYAR) */}
              <div className="bg-[#03140c] border border-[#d4af37]/40 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 space-y-4 sm:space-y-5 shadow-xl relative overflow-hidden">
                {absensiMode === 'normal' ? (
                  /* ================= MODE A: ABSENSI NORMAL ================= */
                  <div className="space-y-5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-[#d4af37]/20">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-sm font-extrabold text-[#fef08a] tracking-wide block">
                            Jadwal Mengajar Anda Hari {currentDayName}
                          </span>
                          <span className="text-[10px] text-emerald-400 font-mono">
                            Data Pribadi: {pengurus.nama} ({pengurus.jabatan})
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold flex items-center gap-1.5 shrink-0">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          Hari: {currentDayName} • {activeSession.todayIso}
                        </span>
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border shrink-0 ${
                          activeSession.isActive
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-red-500/20 text-red-300 border-red-500/40'
                        }`}>
                          {activeSession.isActive ? `Sesi ${activeSession.status}` : 'Di Luar Jam'}
                        </span>
                      </div>
                    </div>

                    {/* SELECTOR KELAS & JADWAL TERKONEKSI REAL-TIME DATA PRIBADI */}
                    <div className="bg-[#02140b] p-3.5 rounded-2xl border border-[#d4af37]/30 space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <label className="text-xs font-bold text-[#fef08a] flex items-center gap-1.5">
                          <GraduationCap className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Kelas yang Anda Ampu (Hari: {currentDayName}):</span>
                        </label>
                        <span className="text-[10px] text-emerald-400 font-mono">
                          {myTodaySchedules.length} Sesi Mengajar Terjadwal Anda
                        </span>
                      </div>

                      {myTeachingClasses.length > 0 ? (
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                            {myTeachingClasses.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedPresensiKelas('SEMUA');
                                  setSelectedJadwalId('');
                                }}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border whitespace-nowrap shrink-0 ${
                                  selectedPresensiKelas === 'SEMUA'
                                    ? 'btn-3d-yellow text-[#1a1202] shadow-md font-extrabold scale-102 ring-2 ring-amber-300'
                                    : 'bg-[#031d13] text-emerald-200 border-[#d4af37]/30 hover:border-[#d4af37]'
                                }`}
                              >
                                Semua Kelas Anda ({myTeachingClasses.length})
                              </button>
                            )}
                            {myTeachingClasses.map((kls) => {
                              const isSel = selectedPresensiKelas === kls || (myTeachingClasses.length === 1 && selectedPresensiKelas === 'SEMUA');
                              return (
                                <button
                                  key={kls}
                                  type="button"
                                  onClick={() => {
                                    setSelectedPresensiKelas(kls);
                                    const pool = myTodaySchedules.filter(j => j.kelas === kls);
                                    if (pool.length > 0) {
                                      const preferActive = pool.find(j => isScheduleWindowActiveNow(j, activeSession, settings.bypass_jam_presensi_testing) && !isScheduleCheckedInToday(j, absensiGuruList, activeSession.todayIso, pengurus, guruList))
                                        || pool.find(j => !isScheduleCheckedInToday(j, absensiGuruList, activeSession.todayIso, pengurus, guruList))
                                        || pool[0];
                                      setSelectedJadwalId(getScheduleKey(preferActive));
                                    } else {
                                      setSelectedJadwalId('');
                                    }
                                  }}
                                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition border whitespace-nowrap shrink-0 ${
                                    isSel
                                      ? 'btn-3d-yellow text-[#1a1202] shadow-md font-extrabold scale-102 ring-2 ring-amber-300'
                                      : 'bg-[#031d13] text-emerald-200 border-[#d4af37]/30 hover:border-[#d4af37]'
                                  }`}
                                >
                                  {kls}
                                </button>
                              );
                            })}
                          </div>

                          {/* Tombol Interaktif Jam Pelajaran / Sesi (Cocok Langsung dengan Div) */}
                          {myTodaySchedulesByClass.length > 0 && (
                            <div className="pt-2 border-t border-[#d4af37]/20 space-y-1.5">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                <label className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                  <span>Pilih Jam Pelajaran / Sesi:</span>
                                </label>
                                <span className="text-[10px] text-emerald-400 font-mono">
                                  Klik tombol sesi untuk mencocokkan jadwal
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {myTodaySchedulesByClass.map((j) => {
                                  const jId = getScheduleKey(j);
                                  const isScheduleActive = myActiveSchedule && getScheduleKey(myActiveSchedule) === jId;
                                  const isSessChecked = isScheduleCheckedInToday(j, absensiGuruList, activeSession.todayIso, pengurus, guruList);
                                  return (
                                    <button
                                      key={jId}
                                      type="button"
                                      onClick={() => {
                                        setSelectedJadwalId(jId);
                                        if (selectedPresensiKelas !== j.kelas && selectedPresensiKelas !== 'SEMUA') {
                                          setSelectedPresensiKelas(j.kelas);
                                        }
                                      }}
                                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border shadow-sm ${
                                        isScheduleActive
                                          ? 'btn-3d-yellow text-[#1a1202] shadow-md font-black scale-102 ring-2 ring-amber-300'
                                          : 'bg-[#02180e] text-emerald-200 hover:text-white border-[#d4af37]/40 hover:border-[#d4af37]'
                                      }`}
                                    >
                                      <span className={`w-2 h-2 rounded-full ${isScheduleActive ? 'bg-black animate-pulse' : isSessChecked ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                                      <span className="font-mono">Jam Ke-{j.jamKe} ({j.waktu})</span>
                                      <span className={isScheduleActive ? 'text-black font-black' : 'text-amber-300 font-bold'}>• {j.mapel}</span>
                                      <span className="text-[10px] opacity-80">({j.kelas})</span>
                                      {isSessChecked && (
                                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${isScheduleActive ? 'bg-emerald-900 text-emerald-200' : 'bg-emerald-500/20 text-emerald-300'}`}>
                                          ✓
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 italic">
                          Belum ada penetapan kelas mengajar khusus pada profil Anda.
                        </div>
                      )}
                    </div>

                    {myActiveSchedule ? (
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
                        <div className="bg-black/50 border border-[#d4af37]/25 rounded-xl sm:rounded-2xl p-3 sm:p-3.5 space-y-1">
                          <span className="text-[10px] sm:text-[11px] text-slate-400 block font-medium">Ustadz Pengampu</span>
                          <span className="text-xs sm:text-sm font-extrabold text-white block truncate">
                            {myActiveSchedule.nama || pengurus.nama}
                          </span>
                          <span className="text-[10px] text-emerald-400 font-mono block truncate">ID: {pengurus.id}</span>
                        </div>

                        <div className="bg-black/50 border border-[#d4af37]/25 rounded-xl sm:rounded-2xl p-3 sm:p-3.5 space-y-1">
                          <span className="text-[10px] sm:text-[11px] text-slate-400 block font-medium">Mata Pelajaran</span>
                          <span className="text-xs sm:text-sm font-black text-[#fde047] block truncate">
                            {myActiveSchedule.mapel}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate">Kitab Salafiyah</span>
                        </div>

                        <div className="bg-black/50 border border-[#d4af37]/25 rounded-xl sm:rounded-2xl p-3 sm:p-3.5 space-y-1">
                          <span className="text-[10px] sm:text-[11px] text-slate-400 block font-medium">Kelas / Tingkat</span>
                          <span className="text-xs sm:text-sm font-extrabold text-white block truncate">
                            {myActiveSchedule.kelas}
                          </span>
                          <span className="text-[10px] text-emerald-300 font-bold block truncate">
                            {(myActiveSchedule.kelas || '').includes('ALIYAH') ? 'Aliyah (Malam)' : 'Tsanawiyah (Siang)'}
                          </span>
                        </div>

                        <div className="bg-black/50 border border-[#d4af37]/25 rounded-xl sm:rounded-2xl p-3 sm:p-3.5 space-y-1">
                          <span className="text-[10px] sm:text-[11px] text-slate-400 block font-medium">Jam & Hari</span>
                          <span className="text-xs sm:text-sm font-black text-emerald-300 font-mono block truncate">
                            {myActiveSchedule.waktu || '08:00 - 09:00'}
                          </span>
                          <span className="text-[10px] text-amber-300 font-bold block truncate">
                            Jam {myActiveSchedule.jamKe || 1} • {myActiveSchedule.hari}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 sm:p-5 rounded-2xl bg-black/60 border border-amber-500/30 text-slate-300 text-xs space-y-2">
                        <div className="flex items-center gap-2 text-amber-300">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span className="font-extrabold text-sm text-[#fde047]">
                            Tidak Ada Jadwal Mengajar Hari Ini ({currentDayName}) untuk {pengurus.nama}
                          </span>
                        </div>
                        <p className="text-slate-300 text-[11px] leading-relaxed">
                          Sistem hanya menampilkan data jadwal mengajar milik akun pribadi Anda. Anda hanya dapat absen sesuai jadwal pelajaran dan kelas yang Anda ampu sendiri, serta tidak dapat mengabsensikan pengurus lain.
                        </p>
                        {myAllSchedules.length > 0 && (
                          <div className="pt-1.5 border-t border-amber-500/20">
                            <span className="text-[10px] text-emerald-400 font-semibold block mb-1">
                              Jadwal Pelajaran Anda di Hari Lain:
                            </span>
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                              {myAllSchedules.map((j, idx) => (
                                <span key={idx} className="px-2.5 py-1 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-200 text-[10px] whitespace-nowrap shrink-0">
                                  {j.hari} • {j.kelas} (Jam Ke-{j.jamKe}: {j.mapel})
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Status Ringkas Absensi & Tombol HADIR 3D */}
                    <div className="pt-2 flex flex-col items-center justify-center space-y-3">
                      {isAlreadyCheckedIn ? (
                        <div className="w-full max-w-lg p-3.5 sm:p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-center font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-lg">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                          <span>Anda sudah berhasil melakukan Presensi Hadir pada sesi ini ({myActiveSchedule?.mapel || 'Pelajaran'} - {myActiveSchedule?.kelas || 'Kelas'}).</span>
                        </div>
                      ) : !myActiveSchedule ? (
                        <div className="w-full max-w-sm text-center p-3 rounded-xl bg-black/40 border border-slate-700/50 text-slate-400 text-xs font-semibold">
                          Tombol Presensi Dinonaktifkan (Tidak Ada Jadwal Mengajar Anda Hari Ini)
                        </div>
                      ) : (!activeSession.isActive && !settings.bypass_jam_presensi_testing) ? (
                        <div className="w-full max-w-md text-center p-3.5 rounded-2xl bg-amber-950/50 border border-amber-500/50 text-amber-200 text-xs font-semibold space-y-1.5 shadow-xl">
                          <div className="flex items-center justify-center gap-2 font-black text-amber-300 uppercase tracking-wide">
                            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                            <span>Presensi Nonaktif (Di Luar Jam Resmi)</span>
                          </div>
                          <p className="text-[11px] text-amber-200/90 leading-tight">
                            Waktu server: <span className="font-mono font-bold text-amber-300">{activeSession.wibTimeStr}</span>.<br />
                            {activeSession.jadwalBerikutnya ? `Sesi berikutnya: ${activeSession.jadwalBerikutnya.label} (${activeSession.jadwalBerikutnya.jamMulai} - ${activeSession.jadwalBerikutnya.sisaWaktuText})` : 'Presensi otomatis aktif sesuai jam pelajaran resmi madrasah.'}
                          </p>
                        </div>
                      ) : (sessionMismatchInfo.isMismatch && !settings.bypass_jam_presensi_testing) ? (
                        <div className="w-full max-w-lg text-center p-4 rounded-2xl bg-amber-950/80 border-2 border-amber-500/70 text-amber-100 text-xs font-semibold space-y-2 shadow-2xl backdrop-blur-md">
                          <div className="flex items-center justify-center gap-2 font-black text-amber-300 text-sm uppercase tracking-wide">
                            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
                            <span>{sessionMismatchInfo.title}</span>
                          </div>
                          <p className="text-xs text-amber-200/90 leading-relaxed font-normal">
                            {sessionMismatchInfo.message}
                          </p>
                          <div className="pt-2 border-t border-amber-500/30 flex flex-wrap items-center justify-center gap-2 text-[10px]">
                            <span className="px-2 py-0.5 rounded-lg bg-black/60 text-amber-300 font-mono font-bold">
                              Waktu Server: {activeSession.wibTimeStr}
                            </span>
                            <span className="px-2 py-0.5 rounded-lg bg-black/60 text-emerald-300 font-bold">
                              Sesi Aktif: Jam Ke-{activeSession.jamKe} ({activeSession.sesi})
                            </span>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleHadirNormal}
                          className="btn-3d-hadir-yellow w-full max-w-xs sm:max-w-sm text-center flex items-center justify-center gap-2.5 py-3 px-5 rounded-2xl shadow-xl transition-all"
                        >
                          <Check className="w-5 h-5 stroke-[3.5] text-[#1a1202]" />
                          <span className="text-base font-black tracking-wider uppercase text-[#1a1202]">
                            [ HADIR ]
                          </span>
                        </button>
                      )}

                      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[11px] text-slate-400 pt-1">
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-[#d4af37]/20">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${
                            geofenceCheck.statusText === 'GEOFENCING NONAKTIF' || geofenceCheck.isValid
                              ? 'bg-emerald-400'
                              : (geofenceCheck.statusText === 'GPS KURANG AKURAT' || geofenceCheck.statusText === 'GPS BELUM TERDETEKSI')
                              ? 'bg-amber-400 animate-pulse'
                              : 'bg-red-400 animate-pulse'
                          }`} />
                          <span>
                            {
                              geofenceCheck.statusText === 'GEOFENCING NONAKTIF'
                                ? 'Geofencing Nonaktif'
                                : geofenceCheck.isValid
                                ? `Radius Madrasah (${geofenceCheck.distanceMeters.toFixed(0)}m)`
                                : geofenceCheck.statusText === 'GPS KURANG AKURAT'
                                ? `GPS Lemah (±${Math.round(geofenceCheck.accuracyMeters)}m)`
                                : geofenceCheck.statusText === 'GPS BELUM TERDETEKSI'
                                ? (gpsLoading ? 'Mendeteksi GPS...' : 'GPS Belum Aktif')
                                : `Luar Radius (${geofenceCheck.distanceMeters.toFixed(0)}m)`
                            }
                          </span>
                        </span>
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-[#d4af37]/20">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${activeSession.isActive ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                          <span>{activeSession.isActive ? `Sesi ${activeSession.status}` : 'Di Luar Jam'}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => acquireFreshGpsPosition(8000)}
                          className="min-h-[34px] px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 hover:underline font-bold flex items-center gap-1"
                        >
                          <RefreshCw className={`w-3 h-3 ${gpsLoading ? 'animate-spin' : ''}`} />
                          <span>{gpsLoading ? 'Membaca GPS...' : 'Refresh GPS'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowGeofenceMap(!showGeofenceMap)}
                          className="min-h-[34px] px-2.5 py-1 rounded-lg bg-black/40 border border-[#d4af37]/30 text-[#d4af37] hover:underline font-bold"
                        >
                          {showGeofenceMap ? 'Tutup Peta GPS' : 'Lihat Peta GPS'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ================= MODE B: ABSENSI PENGGANTI ================= */
                  <div className="space-y-5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-amber-500/25">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                          <Users className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-extrabold text-[#fef08a] uppercase tracking-wider">
                          Mekanisme Resmi: Presensi Ustadz Pengganti
                        </span>
                      </div>
                      <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-500/40 text-amber-300 font-bold">
                        Pengganti: {pengurus.nama}
                      </span>
                    </div>

                    {approvedSubstituteForMe ? (
                      <div className="bg-amber-950/30 border border-amber-500/35 rounded-2xl p-4 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                          <div className="bg-black/50 p-3 rounded-xl border border-amber-500/20">
                            <span className="text-slate-400 block text-[11px]">Ustadz Terjadwal Asli:</span>
                            <span className="text-white font-extrabold text-sm">{approvedSubstituteForMe.ustadzTerjadwal}</span>
                            <span className="text-[10px] text-amber-300 block mt-0.5">(Jadwal asli tetap aman)</span>
                          </div>

                          <div className="bg-black/50 p-3 rounded-xl border border-amber-500/20">
                            <span className="text-slate-400 block text-[11px]">Mata Pelajaran & Kelas:</span>
                            <span className="text-[#fde047] font-extrabold text-sm">{approvedSubstituteForMe.mapel} ({approvedSubstituteForMe.kelas})</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">Jam: {approvedSubstituteForMe.jamJadwal}</span>
                          </div>

                          <div className="bg-black/50 p-3 rounded-xl border border-amber-500/20">
                            <span className="text-slate-400 block text-[11px]">Status Izin Pengganti:</span>
                            <span className="text-emerald-400 font-bold text-xs flex items-center gap-1 mt-0.5">
                              ✓ DISETUJUI RESMI
                            </span>
                            <span className="text-[10px] text-slate-300 block truncate">Alasan: {approvedSubstituteForMe.alasan}</span>
                          </div>
                        </div>

                        <div className="pt-2 flex flex-col items-center justify-center space-y-3">
                          <button
                            type="button"
                            onClick={handleHadirPengganti}
                            className="btn-3d-hadir-yellow w-full max-w-md text-center flex items-center justify-center gap-3"
                          >
                            <Check className="w-6 h-6 stroke-[3.5] text-[#1a1202]" />
                            <span className="text-base sm:text-lg font-black tracking-wider uppercase">
                              [ HADIR ]
                            </span>
                          </button>

                          <p className="text-[11px] text-amber-200/90 text-center">
                            *Presensi Ustadz Pengganti: {approvedSubstituteForMe.ustadzTerjadwal} ({approvedSubstituteForMe.mapel})
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-5 rounded-2xl bg-black/60 border border-amber-500/30 text-xs space-y-3">
                        <div className="flex items-start space-x-3">
                          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-[#fde047] text-sm">
                              Belum ada penugasan pengganti aktif yang disetujui untuk Anda ({pengurus.nama}) pada hari ini.
                            </p>
                            <p className="text-slate-300 text-[11px] mt-1">
                              Jika Anda menggantikan Ustadz yang berhalangan hadir, silakan ajukan atau konfirmasi penugasan pengganti melalui tombol di bawah:
                            </p>
                          </div>
                        </div>

                        <div className="pt-2 flex flex-wrap items-center">
                          <button
                            type="button"
                            onClick={() => setShowAjukanPenggantiModal(true)}
                            className="btn-3d-yellow px-4 py-2.5 text-xs font-black shadow-lg flex items-center gap-2 max-w-full text-center"
                          >
                            <PlusCircle className="w-4 h-4 shrink-0" />
                            <span className="leading-normal">Ajukan & Daftarkan Pengganti Ustadz Sekarang</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* MODAL / PANEL OPSIONAL GEOFENCING MAP (TERSEMBUNYI SECARA DEFAULT SESUAI PERMINTAAN USER) */}
                {showGeofenceMap && (
                  <div className="pt-4 border-t border-[#d4af37]/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#fef08a] flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-[#fef08a]" />
                        <span>Peta Geofencing & Titik Koordinat GPS Madrasah</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowGeofenceMap(false)}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        ✕ Tutup Peta
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                      <div className="lg:col-span-8">
                        <GoogleMapsGeofence
                          centerLat={settings.geofencing_latitude ?? DEFAULT_GEOFENCE_ZONE.latitude}
                          centerLng={settings.geofencing_longitude ?? DEFAULT_GEOFENCE_ZONE.longitude}
                          radiusMeters={settings.geofencing_radius_meters ?? DEFAULT_GEOFENCE_ZONE.radiusMeters}
                          zoneName={settings.geofencing_zone_name || DEFAULT_GEOFENCE_ZONE.zoneName}
                          userLat={userCoords.lat}
                          userLng={userCoords.lng}
                          userAccuracy={userCoords.accuracy}
                          enabled={settings.geofencing_enabled !== false}
                          height="220px"
                          interactive={false}
                        />
                      </div>

                      <div className="lg:col-span-4 bg-black/70 border border-[#d4af37]/30 rounded-2xl p-3.5 text-xs space-y-2.5">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-700">
                          <span className="text-slate-400">Status Zona:</span>
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            geofenceCheck.isValid
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : (geofenceCheck.statusText === 'GPS KURANG AKURAT' || geofenceCheck.statusText === 'GPS BELUM TERDETEKSI')
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-red-500/20 text-red-300'
                          }`}>
                            {geofenceCheck.isValid ? `✓ ${geofenceCheck.statusText}` : `⚠ ${geofenceCheck.statusText}`}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-400">Jarak ke Madrasah:</span>
                          <span className="font-mono font-bold text-white">
                            {geofenceCheck.hasLocation ? `${geofenceCheck.distanceMeters.toFixed(1)}m` : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-400">Radius Maksimal:</span>
                          <span className="font-mono text-[#d4af37] font-bold">{geofenceCheck.radiusMeters}m</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-400">Akurasi GPS HP:</span>
                          <span className={`font-mono ${geofenceCheck.isAccuracyValid ? 'text-emerald-300' : 'text-amber-300'}`}>
                            {userCoords.accuracy ? `±${Math.round(userCoords.accuracy)}m (Maks ±${geofenceCheck.maxAccuracyMeters}m)` : '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* PANEL SIMULASI UJI COBA JAM SERVER (MEMUDAHKAN PENGUJIAN SESUAI PERMINTAAN USER) */}
              {showSimulasiBar && (
                <div className="p-4 rounded-2xl bg-black/80 border border-[#d4af37]/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#fef08a] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#fef08a]" />
                      <span>Panel Uji Coba Logika Jam Server (Pilih Jam untuk Menguji):</span>
                    </span>
                    <span className="text-[10px] text-emerald-300 font-mono">
                      Real-time test simulator
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSimulatedServerTime('08:00:00')}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 font-bold text-[11px] transition"
                    >
                      Pagi 08:00 (Tsanawiyah Tepat Waktu)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimulatedServerTime('08:15:00')}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-950 hover:bg-amber-900 border border-amber-500/50 text-amber-300 font-bold text-[11px] transition"
                    >
                      Pagi 08:15 (Tsanawiyah Terlambat)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimulatedServerTime('08:45:00')}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-[11px] transition"
                    >
                      Pagi 08:45 (Terkunci / Nonaktif)
                    </button>

                    <button
                      type="button"
                      onClick={() => setSimulatedServerTime('19:00:00')}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 font-bold text-[11px] transition"
                    >
                      Malam 19:00 (Aliyah S1 Tepat Waktu)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimulatedServerTime('19:15:00')}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-950 hover:bg-amber-900 border border-amber-500/50 text-amber-300 font-bold text-[11px] transition"
                    >
                      Malam 19:15 (Aliyah S1 Terlambat)
                    </button>

                    <button
                      type="button"
                      onClick={() => setSimulatedServerTime('21:00:00')}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 font-bold text-[11px] transition"
                    >
                      Malam 21:00 (Aliyah S2 Tepat Waktu)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimulatedServerTime('21:15:00')}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-950 hover:bg-amber-900 border border-amber-500/50 text-amber-300 font-bold text-[11px] transition"
                    >
                      Malam 21:15 (Aliyah S2 Terlambat)
                    </button>

                    <button
                      type="button"
                      onClick={() => setSimulatedServerTime('14:00:00')}
                      className="px-2.5 py-1.5 rounded-lg bg-red-950 hover:bg-red-900 border border-red-500/50 text-red-300 font-bold text-[11px] transition"
                    >
                      Siang 14:00 (Di Luar Jadwal - Nonaktif)
                    </button>

                    <button
                      type="button"
                      onClick={() => setSimulatedServerTime(null)}
                      className="px-3 py-1.5 rounded-lg bg-[#d4af37] text-black font-extrabold text-[11px] hover:bg-[#f5e298] transition shadow"
                    >
                      🔄 Reset ke Jam Asli Server
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 3. PROFIL PENGURUS YANG BERSANGKUTAN & REKAPAN ABSENSI PRIBADI */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* KARTU PROFIL PENGURUS */}
              <div className="card-3d rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-[#d4af37]/40 relative overflow-hidden space-y-4 sm:space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#d4af37]/20">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-[#d4af37]" />
                    <h2 className="text-xs font-bold text-[#d4af37] uppercase tracking-wider">
                      Profil Pengurus
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(true)}
                    className="text-[11px] text-[#d4af37] hover:underline flex items-center gap-1 font-bold py-1 px-2 rounded-lg bg-[#03140c] border border-[#d4af37]/30"
                  >
                    <Sliders className="w-3 h-3" />
                    <span>Edit Profil</span>
                  </button>
                </div>

                <div className="flex flex-row items-center gap-3.5 text-left">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-[#0b3824] border-2 border-[#d4af37] shadow-xl shrink-0">
                    <img
                      src={pengurus.foto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
                      alt={pengurus.nama}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-extrabold text-white text-gold-3d leading-tight truncate">
                      {pengurus.nama}
                    </h3>
                    <div className="inline-block px-2.5 py-0.5 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/50 text-[#d4af37] font-bold text-[11px] sm:text-xs">
                      {pengurus.jabatan}
                    </div>
                    <p className="text-[11px] text-emerald-300 font-mono truncate">
                      ID: {pengurus.id} • {pengurus.divisi || 'Divisi Kepengurusan'}
                    </p>
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Status Aktif Khidmah
                    </span>
                  </div>
                </div>

                <div className="bg-[#03140c] border border-[#d4af37]/25 rounded-2xl p-3.5 space-y-2 text-xs">
                  <div className="flex justify-between gap-2 py-1 border-b border-[#d4af37]/15">
                    <span className="text-slate-400 shrink-0">Kontak WhatsApp</span>
                    <span className="text-white font-mono text-right truncate">{pengurus.noWa || pengurus.noHp || '-'}</span>
                  </div>
                  <div className="flex justify-between gap-2 py-1 border-b border-[#d4af37]/15">
                    <span className="text-slate-400 shrink-0">Alamat Domisili</span>
                    <span className="text-white text-right truncate max-w-[170px]">{pengurus.alamat || 'Pesantren Salafiyah'}</span>
                  </div>
                  <div className="flex justify-between gap-2 py-1 border-b border-[#d4af37]/15">
                    <span className="text-slate-400 shrink-0">Kelas Bimbingan</span>
                    <span className="text-[#d4af37] font-bold text-right truncate">{waliKelasKelas}</span>
                  </div>
                  <div className="flex justify-between gap-2 py-1 border-b border-[#d4af37]/15">
                    <span className="text-slate-400 shrink-0">Masa Khidmah</span>
                    <span className="text-[#d4af37] font-bold text-right">{pengurus.masaKhidmah || '2025 - 2027'}</span>
                  </div>
                  <div className="flex justify-between gap-2 py-1">
                    <span className="text-slate-400 shrink-0">Kata Sandi Login</span>
                    <span className="text-emerald-300 font-mono text-right truncate">•••••••• (Admin Panel)</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-200 italic leading-relaxed">
                  "{pengurus.catatan || 'Menjaga marwah salafiyah, mendampingi santri dengan ikhlas dan kesabaran demi ridho Allah SWT.'}"
                </div>
              </div>

              {/* REKAPAN ABSENSI PRIBADI PENGURUS (KOLOM: HADIR, IZIN, TERLAMBAT, ALPHA) */}
              <div className="lg:col-span-2 card-3d rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-[#d4af37]/40 space-y-4 sm:space-y-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-[#d4af37]/20">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <h2 className="text-sm font-bold text-white text-gold-3d">
                        Rekapan Kehadiran Pribadi
                      </h2>
                      <p className="text-[11px] text-emerald-300">
                        Catatan kehadiran mengajar {pengurus.nama}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#03140c] border border-[#d4af37]/40 text-[#d4af37] font-mono text-xs font-bold">
                    Kehadiran: {personalPercent}%
                  </span>
                </div>

                {/* 4 Cards Stat Kehadiran Pribadi: HADIR, IZIN, TERLAMBAT, ALPHA */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="card-3d-glass rounded-2xl p-3.5 border border-emerald-500/40 text-center space-y-0.5">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Hadir</span>
                    <span className="text-2xl font-black text-emerald-300 font-mono">{personalHadir}</span>
                    <span className="text-[10px] text-emerald-200/70 block">
                      {personalTerlambat > 0 ? `${personalHadirTepat} Tepat + ${personalTerlambat} Telat` : 'Pertemuan'}
                    </span>
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

                  <div className="table-container-3d overflow-x-auto rounded-xl border border-[#d4af37]/30">
                    <table className="w-full text-xs text-left table-luxury-3d">
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
                          <tr>
                            <td colSpan={5} className="p-4 text-center text-stone-400 text-xs">
                              Belum ada riwayat presensi yang tercatat untuk Ustadz {pengurus.nama}. Tekan tombol <b>[ HADIR ]</b> di atas untuk mencatat presensi secara real-time.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. BERITA DAN PENGUMUMAN MADRASAH */}
            <div className="card-3d rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-[#d4af37]/30 space-y-4">
              <div className="flex items-center space-x-3 pb-3 border-b border-[#d4af37]/20">
                <div className="w-8 h-8 rounded-lg bg-[#0b3824] border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] shrink-0">
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
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
          <div className="space-y-4 sm:space-y-6">
            <div className="card-3d rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-[#d4af37]/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-[#031a10] via-[#062417] to-[#031a10]">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-white text-gold-3d flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#d4af37] shrink-0" />
                  <span>Pengajuan Izin Tidak Mengajar & Ustadz Pengganti</span>
                </h2>
                <p className="text-xs text-emerald-200 mt-1">
                  Permohonan izin akan terkirim langsung ke Dashboard Admin secara real time. Ketika disetujui Admin, status absensi Anda langsung berubah menjadi <b>Izin</b> dan tercantum nama <b>Ustadz Penggantinya</b>.
                </p>
              </div>

              <button
                onClick={() => setShowIzinModal(true)}
                className="btn-3d-gold w-full md:w-auto px-4 py-2.5 rounded-xl text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow shrink-0"
              >
                <PlusCircle className="w-4 h-4 text-black" />
                <span>+ Buat Permohonan Izin Baru</span>
              </button>
            </div>

            {/* Riwayat Permohonan Izin Pengurus */}
            <div className="card-3d rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-[#d4af37]/30 space-y-4">
              <h3 className="text-sm font-bold text-white text-gold-3d flex items-center justify-between">
                <span>Daftar Pengajuan Izin Saya</span>
                <span className="text-xs text-[#d4af37] font-mono">Total: {myIzinList.length} Pengajuan</span>
              </h3>

              <div className="table-container-3d overflow-x-auto rounded-2xl border border-[#d4af37]/30">
                <table className="w-full text-xs text-left table-luxury-3d">
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
          <div className="space-y-4 sm:space-y-6">
            {/* Banner Info Wali Kelas */}
            <div className="card-3d rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-[#d4af37]/40 bg-gradient-to-r from-[#052216] via-[#083321] to-[#052216] shadow-xl">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#0b3824] border-2 border-[#d4af37] flex items-center justify-center text-[#d4af37] shadow shrink-0">
                    <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base sm:text-lg font-black text-white text-gold-3d">
                        Portal Wali Kelas: {waliKelasKelas}
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

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <button
                    onClick={handleSaveClassAttendance}
                    className="btn-3d-gold w-full md:w-auto px-4 py-2.5 rounded-xl text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow"
                  >
                    <CheckCheck className="w-4 h-4 text-black shrink-0" />
                    <span>Simpan Presensi Kelas ke Admin</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Statistik Kehadiran Anak Didik Hari Ini */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
              <div className="card-3d-glass rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-[#d4af37]/30 text-center">
                <span className="text-[11px] text-slate-300 font-bold block">Total Anak Didik</span>
                <span className="text-2xl font-black text-[#d4af37] font-mono mt-1 block">{myStudents.length}</span>
                <span className="text-[10px] text-emerald-300 font-mono">Santri Aktif</span>
              </div>
              <div className="card-3d-glass rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-emerald-500/40 text-center">
                <span className="text-[11px] text-emerald-300 font-bold block">Hadir Hari Ini</span>
                <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">
                  {myStudents.filter(s => (localSantriAbsensi[s.id] || 'Hadir') === 'Hadir').length}
                </span>
                <span className="text-[10px] text-emerald-200/70 font-mono">Di Kelas</span>
              </div>
              <div className="card-3d-glass rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-amber-500/40 text-center">
                <span className="text-[11px] text-amber-300 font-bold block">Izin / Sakit</span>
                <span className="text-2xl font-black text-amber-400 font-mono mt-1 block">
                  {myStudents.filter(s => ['Izin', 'Sakit'].includes(localSantriAbsensi[s.id])).length}
                </span>
                <span className="text-[10px] text-amber-200/70 font-mono">Udzur</span>
              </div>
              <div className="card-3d-glass rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-red-500/40 text-center">
                <span className="text-[11px] text-red-300 font-bold block">Alpha</span>
                <span className="text-2xl font-black text-red-400 font-mono mt-1 block">
                  {myStudents.filter(s => localSantriAbsensi[s.id] === 'Alpha').length}
                </span>
                <span className="text-[10px] text-red-200/70 font-mono">Tanpa Kabar</span>
              </div>
            </div>

            {/* TABEL REKAPAN ABSENSI ANAK DIDIK */}
            <div className="card-3d rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-[#d4af37]/30 space-y-4">
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

              <div className="table-container-3d overflow-x-auto rounded-2xl border border-[#d4af37]/30">
                <table className="w-full text-xs text-left table-luxury-3d">
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
                    {myStudents.map((s, idx) => {
                      const currentStatus = localSantriAbsensi[s.id] || 'Hadir';
                      return (
                        <tr key={`mystudent-${s.id}-${idx}`} className="hover:bg-[#d4af37]/5">
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
                            <div className="flex flex-wrap items-center gap-1 min-w-[155px]">
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

              <div className="table-container-3d overflow-x-auto rounded-2xl border border-[#d4af37]/30">
                <table className="w-full text-xs text-left min-w-[650px] table-luxury-3d">
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
          <div className="space-y-4 sm:space-y-6">
            <div className="card-3d rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-[#d4af37]/30 flex justify-between items-center">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white text-gold-3d">
                  Kalender Akademik & Agenda Madrasah Diniyah
                </h2>
                <p className="text-xs text-emerald-200">
                  Agenda rapat, pengajian akbar, dan ujian semester yang disinkronkan langsung dari Admin.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
              {kalenderList.map(evt => (
                <div
                  key={evt.id}
                  className={`card-3d-glass rounded-2xl p-4 sm:p-5 border space-y-3 ${
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

        {/* ===================== TAB 5: PRESENSI MANUAL SELURUH SANTRI ===================== */}
        {activeTab === 'absensi-santri' && (
          <div className="card-3d rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-[#d4af37]/30 space-y-4 sm:space-y-5">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-3 border-b border-[#d4af37]/20">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white text-gold-3d">
                    Presensi Manual Seluruh Santri Diniyah
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                    Input Manual Pengurus
                  </span>
                </div>
                <p className="text-xs text-emerald-300 mt-0.5">
                  Input presensi santri oleh pengurus langsung terupdate secara real-time ke Dashboard Admin di Fitur Absensi Santri.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleMarkAllHadirGlobal}
                  className="px-3.5 py-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition shadow"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Tandai Hadir Semua</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveAllSantriAttendance}
                  className="btn-3d-gold px-4 py-2 rounded-xl text-black font-extrabold text-xs flex items-center gap-2 shadow max-w-full"
                >
                  <CheckCheck className="w-4 h-4 text-black shrink-0" />
                  <span className="leading-normal">Simpan Presensi Santri Manual ke Admin</span>
                </button>
              </div>
            </div>

            {/* Filter Angkatan / Kelas Santri */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-[#d4af37] font-bold uppercase tracking-wider">Pilih Angkatan:</span>
              <button
                type="button"
                onClick={() => setSelectedClassSantriTab('SEMUA')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  selectedClassSantriTab === 'SEMUA' ? 'btn-3d-gold text-black shadow' : 'bg-[#03140c] text-slate-300 border border-[#d4af37]/30'
                }`}
              >
                Semua Angkatan ({santriList.length})
              </button>
              {['1 TSANAWIYAH', '2 TSANAWIYAH', '3 TSANAWIYAH', '1 ALIYAH', '2 ALIYAH', '3 ALIYAH'].map(cls => (
                <button
                  key={cls}
                  type="button"
                  onClick={() => setSelectedClassSantriTab(cls)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    selectedClassSantriTab === cls ? 'btn-3d-gold text-black shadow' : 'bg-[#03140c] text-slate-300 border border-[#d4af37]/30'
                  }`}
                >
                  {cls} ({santriList.filter(s => s.kelas === cls).length})
                </button>
              ))}
            </div>

            {/* Tabel Input Presensi Santri Interaktif */}
            <div className="table-container-3d overflow-x-auto rounded-2xl border border-[#d4af37]/30">
              <table className="w-full text-xs text-left min-w-[750px] table-luxury-3d">
                <thead className="bg-[#03140c] text-[#d4af37] border-b border-[#d4af37]/30">
                  <tr>
                    <th className="p-3 w-12 text-center">NO</th>
                    <th className="p-3">SANTRI & NIS</th>
                    <th className="p-3 w-36">ANGKATAN / KELAS</th>
                    <th className="p-3 w-40 text-center">STATUS PRESENSI</th>
                    <th className="p-3">KETERANGAN / CATATAN PENGURUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d4af37]/10 bg-[#020e08]/70">
                  {santriList
                    .filter(s => selectedClassSantriTab === 'SEMUA' || s.kelas === selectedClassSantriTab)
                    .map((s, idx) => {
                      const cur = globalSantriAbsensi[s.id] || { status: 'Hadir', ket: '' };
                      return (
                        <tr key={`peng-santri-${s.id}-${idx}`} className="hover:bg-[#d4af37]/5 transition">
                          <td className="p-3 text-center text-emerald-300 font-mono">{idx + 1}</td>
                          <td className="p-3">
                            <div className="flex items-center space-x-2.5">
                              <img
                                src={s.foto || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=80&auto=format&fit=crop&q=80'}
                                alt={s.nama}
                                className="w-8 h-8 rounded-full object-cover border border-[#d4af37]/40 shrink-0"
                              />
                              <div>
                                <span className="font-bold text-white block">{s.nama}</span>
                                <span className="text-[10px] text-[#d4af37] font-mono">NIS: {s.id}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-emerald-200 font-semibold">{s.kelas}</td>
                          <td className="p-3 text-center">
                            <select
                              value={cur.status}
                              onChange={(e) => setGlobalSantriAbsensi({
                                ...globalSantriAbsensi,
                                [s.id]: { ...cur, status: e.target.value as any }
                              })}
                              className={`w-full font-bold text-xs rounded-xl p-1.5 border shadow-inner ${
                                cur.status === 'Hadir' ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50' :
                                cur.status === 'Izin' ? 'bg-amber-950 text-amber-300 border-amber-500/50' :
                                cur.status === 'Sakit' ? 'bg-blue-950 text-blue-300 border-blue-500/50' :
                                'bg-red-950 text-red-300 border-red-500/50'
                              }`}
                            >
                              <option value="Hadir">✓ Hadir</option>
                              <option value="Izin">✉ Izin</option>
                              <option value="Sakit">🏥 Sakit</option>
                              <option value="Alpha">✗ Alpha</option>
                            </select>
                          </td>
                          <td className="p-3">
                            <input
                              type="text"
                              value={cur.ket}
                              placeholder="Catatan udzur / kedisiplinan..."
                              onChange={(e) => setGlobalSantriAbsensi({
                                ...globalSantriAbsensi,
                                [s.id]: { ...cur, ket: e.target.value }
                              })}
                              className="w-full bg-[#052216] border border-[#d4af37]/40 rounded-xl p-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
                            />
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===================== TAB 6: JADWAL & SILABUS MEMAKNAI ===================== */}
        {activeTab === 'jadwal' && (
          <div className="space-y-8">
            {/* Header Jadwal & Silabus */}
            <div className="card-3d rounded-3xl p-6 border border-[#d4af37]/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white text-gold-3d flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#d4af37]" />
                  Jadwal Pelajaran & Silabus Memaknai Diniyah
                </h2>
                <p className="text-xs text-emerald-300">
                  Tabel jadwal terpisah per tingkatan (Tsanawiyah & Aliyah) serta silabus memaknai kitab kuning yang terhubung real-time.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-[#020e08] px-3 py-1.5 rounded-xl border border-[#d4af37]/30">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[11px] text-[#d4af37] font-semibold">Tersinkronisasi Realtime</span>
              </div>
            </div>

            {/* TABEL 1: TINGKATAN TSANAWIYAH */}
            <div className="card-3d rounded-3xl p-6 border-2 border-emerald-500/40 space-y-5 bg-gradient-to-b from-[#0b3824]/30 to-[#020e08]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-emerald-500/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-300 shadow-md">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white text-gold-3d flex items-center gap-2">
                      Tingkatan Tsanawiyah (Kelas 1 - 3 Tsanawiyah)
                    </h3>
                    <p className="text-xs text-emerald-300">
                      Jadwal Pengajian Sesi Pagi - Siang (Hari: Sabtu s/d Kamis)
                    </p>
                  </div>
                </div>

                <span className="text-xs text-emerald-300 bg-[#020e08] px-3 py-1 rounded-full border border-emerald-500/30 self-start md:self-auto font-mono">
                  Sesi Pagi / Siang
                </span>
              </div>

              {/* Filter Khusus Tabel Tsanawiyah */}
              <div className="p-4 rounded-2xl bg-[#03150d] border border-emerald-500/30 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-xs text-emerald-300 font-bold min-w-[130px]">Pilih Kelas / Angkatan:</span>
                  <div className="flex flex-wrap gap-2">
                    {['SEMUA', '1 TSANAWIYAH', '2 TSANAWIYAH', '3 TSANAWIYAH'].map(kls => {
                      const active = jadwalTsAngkatan === kls;
                      return (
                        <button
                          key={kls}
                          type="button"
                          onClick={() => setJadwalTsAngkatan(kls)}
                          className={`text-xs font-black transition-all shadow-md ${
                            active
                              ? 'btn-pill-gold-3d scale-102'
                              : 'btn-pill-dark-3d'
                          }`}
                        >
                          {kls === 'SEMUA' ? 'SEMUA TSANAWIYAH' : kls}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-emerald-500/20">
                  <span className="text-xs text-emerald-300 font-bold min-w-[130px]">Pilih Hari Pengajian:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {['SEMUA', 'SABTU', 'AHAD', 'SENIN', 'SELASA', 'RABU', 'KAMIS'].map(day => {
                      const active = jadwalTsDay === day;
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => setJadwalTsDay(day)}
                          className={`text-xs font-black transition-all shadow-md ${
                            active
                              ? 'btn-pill-gold-3d scale-102'
                              : 'btn-pill-dark-3d'
                          }`}
                        >
                          {day === 'SEMUA' ? 'SEMUA HARI' : day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="table-container-3d overflow-x-auto rounded-2xl border border-[#d4af37]/30 shadow-xl">
                <table className="w-full text-xs text-left min-w-[750px] table-luxury-3d">
                  <thead className="bg-[#03140c] text-[#d4af37] border-b border-[#d4af37]/30">
                    <tr>
                      <th className="p-3">Hari</th>
                      <th className="p-3">Jam Ke</th>
                      <th className="p-3">Waktu</th>
                      <th className="p-3">Kelas</th>
                      <th className="p-3">Mata Pelajaran / Kitab</th>
                      <th className="p-3">Ustadz / Guru Pengampu</th>
                      <th className="p-3">Ruangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-500/15 bg-[#020e08]/80">
                    {jadwalList
                      .filter(j => {
                        const isTs = j.kelas.toUpperCase().includes('TSANAWIYAH') || j.tingkatan === 'Tsanawiyah';
                        const matchClass = jadwalTsAngkatan === 'SEMUA' || j.kelas.toUpperCase().trim() === jadwalTsAngkatan.toUpperCase().trim();
                        const matchDay = jadwalTsDay === 'SEMUA' || j.hari.toUpperCase().trim() === jadwalTsDay.toUpperCase().trim();
                        return isTs && matchClass && matchDay;
                      })
                      .map((j, idx) => (
                        <tr key={j.id || `${j.hari}-${j.jamKe}-${j.kelas}-${idx}`} className="hover:bg-emerald-500/10 transition">
                          <td className="p-3 font-bold text-[#d4af37]">{j.hari}</td>
                          <td className="p-3 text-slate-300 font-mono">Ke-{j.jamKe || 1}</td>
                          <td className="p-3 font-mono text-emerald-300">{j.waktu}</td>
                          <td className="p-3 text-white font-bold">{j.kelas}</td>
                          <td className="p-3 text-emerald-200 font-serif italic font-semibold">{j.mapel}</td>
                          <td className="p-3 text-slate-300">{j.nama}</td>
                          <td className="p-3 text-slate-400">{j.keterangan || 'Gedung Tsanawiyah'}</td>
                        </tr>
                      ))}
                    {jadwalList.filter(j => {
                      const isTs = j.kelas.toUpperCase().includes('TSANAWIYAH') || j.tingkatan === 'Tsanawiyah';
                      const matchClass = jadwalTsAngkatan === 'SEMUA' || j.kelas.toUpperCase().trim() === jadwalTsAngkatan.toUpperCase().trim();
                      const matchDay = jadwalTsDay === 'SEMUA' || j.hari.toUpperCase().trim() === jadwalTsDay.toUpperCase().trim();
                      return isTs && matchClass && matchDay;
                    }).length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-400">
                          Tidak ada data jadwal Tsanawiyah untuk filter kelas & hari yang dipilih.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* TABEL 2: TINGKATAN ALIYAH */}
            <div className="card-3d rounded-3xl p-6 border-2 border-indigo-500/40 space-y-5 bg-gradient-to-b from-[#111638]/30 to-[#020e08]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-indigo-500/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-950/80 border border-indigo-500/50 flex items-center justify-center text-indigo-300 shadow-md">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white text-gold-3d flex items-center gap-2">
                      Tingkatan Aliyah (Kelas 1 - 3 Aliyah)
                    </h3>
                    <p className="text-xs text-indigo-300">
                      Jadwal Pengajian Sesi Malam (Hari: Malam Sabtu s/d Malam Kamis)
                    </p>
                  </div>
                </div>

                <span className="text-xs text-indigo-300 bg-[#020e08] px-3 py-1 rounded-full border border-indigo-500/30 self-start md:self-auto font-mono">
                  Sesi Malam (Ba&apos;da Maghrib / Isya)
                </span>
              </div>

              {/* Filter Khusus Tabel Aliyah */}
              <div className="p-4 rounded-2xl bg-[#060c1d] border border-indigo-500/30 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-xs text-indigo-300 font-bold min-w-[130px]">Pilih Kelas / Angkatan:</span>
                  <div className="flex flex-wrap gap-2">
                    {['SEMUA', '1 ALIYAH', '2 ALIYAH', '3 ALIYAH'].map(kls => {
                      const active = jadwalAlAngkatan === kls;
                      return (
                        <button
                          key={kls}
                          type="button"
                          onClick={() => setJadwalAlAngkatan(kls)}
                          className={`text-xs font-black transition-all shadow-md ${
                            active
                              ? 'btn-pill-gold-3d scale-102'
                              : 'btn-pill-dark-3d'
                          }`}
                        >
                          {kls === 'SEMUA' ? 'SEMUA ALIYAH' : kls}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-indigo-500/20">
                  <span className="text-xs text-indigo-300 font-bold min-w-[130px]">Pilih Hari Pengajian:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {['SEMUA', 'MALAM SABTU', 'MALAM AHAD', 'MALAM SENIN', 'MALAM SELASA', 'MALAM RABU', 'MALAM KAMIS'].map(malam => {
                      const active = jadwalAlDay === malam;
                      return (
                        <button
                          key={malam}
                          type="button"
                          onClick={() => setJadwalAlDay(malam)}
                          className={`text-xs font-black transition-all shadow-md ${
                            active
                              ? 'btn-pill-gold-3d scale-102'
                              : 'btn-pill-dark-3d'
                          }`}
                        >
                          {malam === 'SEMUA' ? 'SEMUA HARI' : malam}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="table-container-3d overflow-x-auto rounded-2xl border border-[#d4af37]/30 shadow-xl">
                <table className="w-full text-xs text-left min-w-[750px] table-luxury-3d">
                  <thead className="bg-[#03140c] text-[#d4af37] border-b border-[#d4af37]/30">
                    <tr>
                      <th className="p-3">Hari (Format Malam)</th>
                      <th className="p-3">Jam Ke</th>
                      <th className="p-3">Waktu</th>
                      <th className="p-3">Kelas</th>
                      <th className="p-3">Mata Pelajaran / Kitab</th>
                      <th className="p-3">Ustadz / Guru Pengampu</th>
                      <th className="p-3">Ruangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-indigo-500/15 bg-[#020e08]/80">
                    {jadwalList
                      .filter(j => {
                        const isAl = j.kelas.toUpperCase().includes('ALIYAH') || j.tingkatan === 'Aliyah';
                        const matchClass = jadwalAlAngkatan === 'SEMUA' || j.kelas.toUpperCase().trim() === jadwalAlAngkatan.toUpperCase().trim();
                        const matchDay = jadwalAlDay === 'SEMUA' || j.hari.toUpperCase().trim() === jadwalAlDay.toUpperCase().trim();
                        return isAl && matchClass && matchDay;
                      })
                      .map((j, idx) => (
                        <tr key={j.id || `${j.hari}-${j.jamKe}-${j.kelas}-${idx}`} className="hover:bg-indigo-500/10 transition">
                          <td className="p-3 font-bold text-indigo-300">{j.hari}</td>
                          <td className="p-3 text-slate-300 font-mono">Ke-{j.jamKe || 1}</td>
                          <td className="p-3 font-mono text-emerald-300">{j.waktu}</td>
                          <td className="p-3 text-white font-bold">{j.kelas}</td>
                          <td className="p-3 text-emerald-200 font-serif italic font-semibold">{j.mapel}</td>
                          <td className="p-3 text-slate-300">{j.nama}</td>
                          <td className="p-3 text-slate-400">{j.keterangan || 'Gedung Aliyah / Musholla'}</td>
                        </tr>
                      ))}
                    {jadwalList.filter(j => {
                      const isAl = j.kelas.toUpperCase().includes('ALIYAH') || j.tingkatan === 'Aliyah';
                      const matchClass = jadwalAlAngkatan === 'SEMUA' || j.kelas.toUpperCase().trim() === jadwalAlAngkatan.toUpperCase().trim();
                      const matchDay = jadwalAlDay === 'SEMUA' || j.hari.toUpperCase().trim() === jadwalAlDay.toUpperCase().trim();
                      return isAl && matchClass && matchDay;
                    }).length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-400">
                          Tidak ada data jadwal Aliyah untuk filter kelas & hari yang dipilih.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* TABEL 3: SILABUS MEMAKNAI (TERKONEKSI DENGAN PENGURUS & GURU) */}
            <div className="card-3d rounded-3xl p-6 border-2 border-[#d4af37]/50 space-y-5 bg-gradient-to-b from-[#0b3824]/40 to-[#020e08]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#d4af37]/30">
                <div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-[#d4af37]" />
                    <h3 className="text-base font-bold text-white text-gold-3d">
                      Tabel Silabus Memaknai Kitab Kuning
                    </h3>
                  </div>
                  <p className="text-xs text-emerald-300">
                    Silabus kurikulum ngaji weton & bandongan santri per angkatan (Terkoneksi real-time).
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Tombol Semester 1 & Semester 2 */}
                  <div className="flex items-center gap-2 p-1.5 bg-[#020e08] rounded-2xl border border-[#d4af37]/40">
                    <button
                      type="button"
                      onClick={() => setSilabusSemester('Semester 1')}
                      className={`text-xs font-black transition-all shadow-md ${
                        silabusSemester === 'Semester 1'
                          ? 'btn-pill-gold-3d scale-102'
                          : 'btn-pill-dark-3d'
                      }`}
                    >
                      SEMESTER 1 (GANJIL)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSilabusSemester('Semester 2')}
                      className={`text-xs font-black transition-all shadow-md ${
                        silabusSemester === 'Semester 2'
                          ? 'btn-pill-gold-3d scale-102'
                          : 'btn-pill-dark-3d'
                      }`}
                    >
                      SEMESTER 2 (GENAP)
                    </button>
                  </div>

                  {onSaveSilabus && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSilabus(null);
                        setSilabusForm({
                          namaKitab: '',
                          kelas: silabusAngkatanFilter !== 'SEMUA' ? silabusAngkatanFilter : '1 TSANAWIYAH',
                          tingkatan: silabusAngkatanFilter.includes('ALIYAH') ? 'Aliyah' : 'Tsanawiyah',
                          semester: silabusSemester,
                          mulai: 'Fasal 1: Bab Muqaddimah & Kalam',
                          batasAkhir: 'Khatam Bab Akhir Kitab',
                          materiSaatIni: 'Fasal 1: Bab Kalam',
                          status: 'Sesuai Target',
                          keterangan: 'Kajian Rutin Santri',
                          ustadzPengampu: pengurus.nama || ''
                        });
                        setShowAddSilabusModal(true);
                      }}
                      className="btn-pill-gold-3d text-xs font-black shadow-lg"
                    >
                      <Plus className="w-4 h-4" />
                      + Tambah Silabus
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Angkatan untuk Silabus */}
              <div className="p-4 rounded-2xl bg-[#03150d] border border-[#d4af37]/30 flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-xs text-[#d4af37] font-bold min-w-[130px]">Pilih Angkatan / Kelas:</span>
                <div className="flex flex-wrap gap-2">
                  {['SEMUA', '1 TSANAWIYAH', '2 TSANAWIYAH', '3 TSANAWIYAH', '1 ALIYAH', '2 ALIYAH', '3 ALIYAH'].map(kls => {
                    const active = silabusAngkatanFilter === kls;
                    return (
                      <button
                        key={kls}
                        type="button"
                        onClick={() => setSilabusAngkatanFilter(kls)}
                        className={`text-xs font-black transition-all shadow-md ${
                          active
                            ? 'btn-pill-gold-3d scale-102'
                            : 'btn-pill-dark-3d'
                        }`}
                      >
                        {kls === 'SEMUA' ? 'SEMUA ANGKATAN' : kls}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="table-container-3d overflow-x-auto rounded-2xl border border-[#d4af37]/30">
                <table className="w-full text-xs text-left min-w-[1050px] table-luxury-3d">
                  <thead className="bg-[#03140c] text-[#d4af37] border-b border-[#d4af37]/30">
                    <tr>
                      <th className="p-3">Nama Ustadz Pengampu</th>
                      <th className="p-3">Kitab Kuning</th>
                      <th className="p-3">Kelas / Angkatan</th>
                      <th className="p-3">Semester</th>
                      <th className="p-3">Mulai Memaknai (Materi Awal)</th>
                      <th className="p-3">Batas Akhir (Target Khatam)</th>
                      <th className="p-3">Materi Saat Ini</th>
                      <th className="p-3 text-center">Status Pencocokan</th>
                      <th className="p-3">Keterangan</th>
                      {onSaveSilabus && <th className="p-3 text-center">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d4af37]/10 bg-[#020e08]/70">
                    {silabusList
                      .filter(s => {
                        const matchClass = silabusAngkatanFilter === 'SEMUA' || s.kelas.toUpperCase().trim() === silabusAngkatanFilter.toUpperCase().trim();
                        const matchSem = !s.semester || s.semester === silabusSemester;
                        return matchClass && matchSem;
                      })
                      .map((s, idx) => {
                        const statusColor = 
                          s.status === 'Sesuai Target' ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50' :
                          s.status === 'Khatam / Tercapai' ? 'bg-amber-950/90 text-amber-300 border-amber-500/50' :
                          s.status === 'Belum Tercapai / Tertinggal' ? 'bg-red-950/90 text-red-300 border-red-500/50' :
                          'bg-blue-950/90 text-blue-300 border-blue-500/50';

                        return (
                          <tr key={s.id || idx} className="hover:bg-[#d4af37]/5">
                            <td className="p-3 font-bold text-white flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-[#d4af37]"></span>
                              {s.ustadzPengampu}
                            </td>
                            <td className="p-3 text-[#d4af37] font-serif font-bold text-sm">
                              {s.namaKitab}
                            </td>
                            <td className="p-3 text-emerald-200 font-semibold">{s.kelas}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold">
                                {s.semester || silabusSemester}
                              </span>
                            </td>
                            <td className="p-3 text-emerald-300">{s.mulai || '-'}</td>
                            <td className="p-3 text-amber-300">{s.batasAkhir || '-'}</td>
                            <td className="p-3 text-teal-200 font-bold">{s.materiSaatIni || 'Bab Awal'}</td>
                            <td className="p-3 text-center">
                              <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold whitespace-nowrap ${statusColor}`}>
                                {s.status || 'Sesuai Target'}
                              </span>
                            </td>
                            <td className="p-3 text-slate-300">{s.keterangan || '-'}</td>
                            {onSaveSilabus && (
                              <td className="p-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingSilabus(s);
                                    setSilabusForm({
                                      id: s.id,
                                      namaKitab: s.namaKitab || '',
                                      kelas: s.kelas || '1 TSANAWIYAH',
                                      tingkatan: (s.tingkatan as any) || 'Tsanawiyah',
                                      semester: (s.semester as any) || silabusSemester,
                                      mulai: s.mulai || '',
                                      batasAkhir: s.batasAkhir || '',
                                      materiSaatIni: s.materiSaatIni || '',
                                      status: (s.status as any) || 'Sesuai Target',
                                      keterangan: s.keterangan || '',
                                      ustadzPengampu: s.ustadzPengampu || pengurus.nama || ''
                                    });
                                    setShowAddSilabusModal(true);
                                  }}
                                  className="p-1.5 bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-black rounded-lg transition border border-amber-500/40"
                                  title="Edit Silabus"
                                >
                                  <Sliders className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {/* MODAL FORM TAMBAH / EDIT SILABUS PENGURUS */}
              {showAddSilabusModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                  <div className="card-3d w-full max-w-2xl bg-[#03140c] border-2 border-[#d4af37]/60 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between pb-3 border-b border-[#d4af37]/30">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-[#d4af37]" />
                        <h3 className="text-base font-bold text-white text-gold-3d">
                          {editingSilabus ? '✏️ Edit Silabus Memaknai' : '➕ Tambah Silabus Memaknai Baru'}
                        </h3>
                      </div>
                      <button
                        onClick={() => setShowAddSilabusModal(false)}
                        className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (onSaveSilabus) {
                          onSaveSilabus({
                            id: editingSilabus?.id || `SLB-${Date.now()}`,
                            namaKitab: silabusForm.namaKitab,
                            kelas: silabusForm.kelas,
                            tingkatan: silabusForm.tingkatan,
                            semester: silabusForm.semester,
                            mulai: silabusForm.mulai,
                            batasAkhir: silabusForm.batasAkhir,
                            materiSaatIni: silabusForm.materiSaatIni,
                            status: silabusForm.status,
                            keterangan: silabusForm.keterangan,
                            ustadzPengampu: silabusForm.ustadzPengampu
                          });
                        }
                        setShowAddSilabusModal(false);
                      }}
                      className="space-y-4 text-xs"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-300 font-bold mb-1">Nama Ustadz Pengampu</label>
                          <input
                            type="text"
                            required
                            value={silabusForm.ustadzPengampu}
                            onChange={(e) => setSilabusForm({ ...silabusForm, ustadzPengampu: e.target.value })}
                            className="w-full bg-[#020e08] border border-[#d4af37]/40 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
                            placeholder="Contoh: Ust. M. Rizqi Fadlillah"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 font-bold mb-1">Kitab Kuning</label>
                          <input
                            type="text"
                            required
                            value={silabusForm.namaKitab}
                            onChange={(e) => setSilabusForm({ ...silabusForm, namaKitab: e.target.value })}
                            className="w-full bg-[#020e08] border border-[#d4af37]/40 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
                            placeholder="Contoh: Matan Al-Jurumiyyah / Fathul Qorib"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 font-bold mb-1">Tingkatan / Jenjang</label>
                          <select
                            value={silabusForm.tingkatan}
                            onChange={(e) => {
                              const tingkatan = e.target.value as 'Tsanawiyah' | 'Aliyah';
                              setSilabusForm({
                                ...silabusForm,
                                tingkatan,
                                kelas: tingkatan === 'Tsanawiyah' ? '1 TSANAWIYAH' : '1 ALIYAH'
                              });
                            }}
                            className="w-full bg-[#020e08] border border-[#d4af37]/40 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#d4af37]"
                          >
                            <option value="Tsanawiyah">Tsanawiyah (Sore)</option>
                            <option value="Aliyah">Aliyah (Malam)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-300 font-bold mb-1">Kelas / Angkatan</label>
                          <select
                            value={silabusForm.kelas}
                            onChange={(e) => setSilabusForm({ ...silabusForm, kelas: e.target.value })}
                            className="w-full bg-[#020e08] border border-[#d4af37]/40 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#d4af37]"
                          >
                            {silabusForm.tingkatan === 'Tsanawiyah' ? (
                              <>
                                <option value="1 TSANAWIYAH">1 TSANAWIYAH</option>
                                <option value="2 TSANAWIYAH">2 TSANAWIYAH</option>
                                <option value="3 TSANAWIYAH">3 TSANAWIYAH</option>
                              </>
                            ) : (
                              <>
                                <option value="1 ALIYAH">1 ALIYAH</option>
                                <option value="2 ALIYAH">2 ALIYAH</option>
                                <option value="3 ALIYAH">3 ALIYAH</option>
                              </>
                            )}
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-300 font-bold mb-1">Semester</label>
                          <select
                            value={silabusForm.semester}
                            onChange={(e) => setSilabusForm({ ...silabusForm, semester: e.target.value as any })}
                            className="w-full bg-[#020e08] border border-[#d4af37]/40 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#d4af37]"
                          >
                            <option value="Semester 1">Semester 1 (Ganjil)</option>
                            <option value="Semester 2">Semester 2 (Genap)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-300 font-bold mb-1">Status Pencocokan Materi</label>
                          <select
                            value={silabusForm.status}
                            onChange={(e) => setSilabusForm({ ...silabusForm, status: e.target.value as any })}
                            className="w-full bg-[#020e08] border border-[#d4af37]/40 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#d4af37]"
                          >
                            <option value="Sesuai Target">✅ Sesuai Target (On Track)</option>
                            <option value="Belum Tercapai / Tertinggal">⚠️ Belum Tercapai / Tertinggal</option>
                            <option value="Khatam / Tercapai">🎉 Khatam / Tercapai Sempurna</option>
                            <option value="Proses">🔄 Dalam Proses Maknani</option>
                          </select>
                        </div>
                      </div>

                      {/* Baris Materi: Mulai Memaknai, Batas Akhir, Materi Saat Ini (BERISI MATERI BUKAN TANGGAL) */}
                      <div className="p-3.5 rounded-2xl bg-[#020e08] border border-amber-500/30 space-y-3">
                        <div className="flex items-center gap-2 text-amber-300 font-bold text-xs pb-1 border-b border-amber-500/20">
                          <span>📖 Detail Kurikulum & Progres Materi Maknani</span>
                          <span className="text-[10px] text-slate-400 font-normal">(Isikan Bab / Fasal / Halaman materi, bukan tanggal)</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-slate-300 font-semibold mb-1">
                              Mulai Memaknai (Materi Awal)
                            </label>
                            <input
                              type="text"
                              required
                              value={silabusForm.mulai}
                              onChange={(e) => setSilabusForm({ ...silabusForm, mulai: e.target.value })}
                              className="w-full bg-[#031c10] border border-emerald-500/40 rounded-xl px-3 py-2 text-emerald-200 placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-medium"
                              placeholder="Fasal 1: Bab Muqaddimah & Kalam"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-300 font-semibold mb-1">
                              Batas Akhir (Target Khatam)
                            </label>
                            <input
                              type="text"
                              required
                              value={silabusForm.batasAkhir}
                              onChange={(e) => setSilabusForm({ ...silabusForm, batasAkhir: e.target.value })}
                              className="w-full bg-[#1c1403] border border-amber-500/40 rounded-xl px-3 py-2 text-amber-200 placeholder-slate-500 focus:outline-none focus:border-amber-400 font-medium"
                              placeholder="Khatam Bab Idhofah / Bab Akhir"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-300 font-semibold mb-1">
                              Materi Saat Ini
                            </label>
                            <input
                              type="text"
                              required
                              value={silabusForm.materiSaatIni}
                              onChange={(e) => setSilabusForm({ ...silabusForm, materiSaatIni: e.target.value })}
                              className="w-full bg-[#031818] border border-teal-500/40 rounded-xl px-3 py-2 text-teal-200 placeholder-slate-500 focus:outline-none focus:border-teal-400 font-medium"
                              placeholder="Bab Al-I&apos;rab & Tashrif"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-bold mb-1">Keterangan / Catatan Tambahan</label>
                        <textarea
                          rows={2}
                          value={silabusForm.keterangan}
                          onChange={(e) => setSilabusForm({ ...silabusForm, keterangan: e.target.value })}
                          className="w-full bg-[#020e08] border border-[#d4af37]/40 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
                          placeholder="Catatan pengajian: Pengajian rutin bakda maghrib, target muhafadzoh 50 bait..."
                        />
                      </div>

                      <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-[#d4af37]/20 w-full">
                        <button
                          type="button"
                          onClick={() => setShowAddSilabusModal(false)}
                          className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition-all"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-amber-500 text-black font-extrabold hover:shadow-lg hover:shadow-[#d4af37]/30 transition-all"
                        >
                          💾 Simpan Silabus
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================== TAB: SETORAN NADZHOM & MUHAFADZOH SANTRI ===================== */}
        {activeTab === 'nadzhom' && (
          <div className="space-y-6">
            {/* Header & Status Card */}
            <div className="card-3d-glass rounded-3xl p-6 border border-[#d4af37]/40 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#f5e298]/80 to-transparent pointer-events-none" />

              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-[#d4af37]/20">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#093d25] border-2 border-[#d4af37] flex items-center justify-center text-[#d4af37] shadow-xl">
                    <BookOpen className="w-7 h-7 text-[#d4af37]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-serif text-[#d4af37] text-gold-3d flex items-center gap-2">
                      Setoran Nadzhom & Hafalan Santri
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/50 text-emerald-300 font-sans font-bold">
                        Simakan Pengurus
                      </span>
                    </h3>
                    <p className="text-xs text-emerald-200/90 mt-1">
                      Catat setoran nadzhom santri secara langsung. Setiap data setoran otomatis tersimpan dan tersinkronisasi secara real-time ke Dashboard Admin dan Portal Wali Santri.
                    </p>
                  </div>
                </div>

                {/* Actions & Badges */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Santri: <b className="text-white">{santriList.length}</b>
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-amber-950/80 border border-[#d4af37]/40 text-[#d4af37] text-xs font-semibold flex items-center gap-1.5 shadow-sm">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    Total Setoran: <b className="text-white">{liveNadzhomList.length}</b> Catatan
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenAddNadzhom()}
                    className="btn-3d-gold px-4 py-2 rounded-xl text-black font-extrabold text-xs flex items-center gap-1.5 shadow-lg transition-all"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>+ Input Setoran Santri</span>
                  </button>
                </div>
              </div>

              {/* Class Filter Bar & Search */}
              <div className="pt-4 space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-[#d4af37]" />
                    Filter Kelas Santri:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                    {['SEMUA', '1 TSANAWIYAH', '2 TSANAWIYAH', '3 TSANAWIYAH', '1 ALIYAH', '2 ALIYAH', '3 ALIYAH'].map((kelasName) => {
                      const countSantri = kelasName === 'SEMUA' 
                        ? santriList.length 
                        : santriList.filter(s => s.kelas === kelasName).length;
                      const isSelected = selectedNadzhomKelas === kelasName;
                      return (
                        <button
                          key={kelasName}
                          onClick={() => setSelectedNadzhomKelas(kelasName)}
                          className={`px-3 py-2 rounded-2xl text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 border ${
                            isSelected
                              ? 'bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#c59b27] text-black border-amber-300 shadow-lg scale-[1.02]'
                              : 'bg-[#041a0f]/90 text-emerald-200 hover:bg-[#08351e] border-[#d4af37]/30 hover:border-[#d4af37]'
                          }`}
                        >
                          <span className="text-xs uppercase tracking-tight">{kelasName}</span>
                          <span className={`text-[10px] ${isSelected ? 'text-black/80 font-bold' : 'text-emerald-400 font-medium'}`}>
                            {countSantri} santri
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchNadzhomSantri}
                      onChange={(e) => setSearchNadzhomSantri(e.target.value)}
                      placeholder="Cari nama santri atau NIS..."
                      className="w-full bg-[#03150d] border border-[#d4af37]/40 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                  <span className="text-xs text-slate-400 self-center">
                    Menampilkan <b>{
                      liveNadzhomList.filter(n => {
                        const matchKelas = selectedNadzhomKelas === 'SEMUA' || n.kelas === selectedNadzhomKelas;
                        const matchSearch = !searchNadzhomSantri || n.nama.toLowerCase().includes(searchNadzhomSantri.toLowerCase()) || (n.idSantri && n.idSantri.toLowerCase().includes(searchNadzhomSantri.toLowerCase()));
                        return matchKelas && matchSearch;
                      }).length
                    }</b> riwayat setoran
                  </span>
                </div>
              </div>
            </div>

            {/* Tabel Catatan Setoran Nadzhom */}
            <div className="card-3d rounded-3xl p-6 border border-[#d4af37]/30 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <h3 className="text-sm font-bold text-white text-gold-3d flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#d4af37]" />
                  <span>Daftar Setoran Nadzhom Santri Terkini</span>
                </h3>
                <span className="text-[11px] text-emerald-300 font-mono">
                  Sinkronisasi Real-Time Admin & Wali Santri
                </span>
              </div>

              <div className="table-container-3d overflow-x-auto rounded-2xl border border-[#d4af37]/30">
                <table className="w-full text-xs text-left min-w-[850px] table-luxury-3d">
                  <thead className="bg-[#03140c] text-[#d4af37] border-b border-[#d4af37]/30">
                    <tr>
                      <th className="p-3">Tanggal Setor</th>
                      <th className="p-3">Nama Santri & NIS</th>
                      <th className="p-3">Kelas</th>
                      <th className="p-3">Kitab Nadzhom</th>
                      <th className="p-3 text-center">Jumlah Bait</th>
                      <th className="p-3 text-center">Predikat / Nilai</th>
                      <th className="p-3">Keterangan / Evaluasi Menyimak</th>
                      <th className="p-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d4af37]/10 bg-[#020e08]/70">
                    {(() => {
                      const filtered = liveNadzhomList.filter(n => {
                        const matchKelas = selectedNadzhomKelas === 'SEMUA' || n.kelas === selectedNadzhomKelas;
                        const matchSearch = !searchNadzhomSantri || n.nama.toLowerCase().includes(searchNadzhomSantri.toLowerCase()) || (n.idSantri && n.idSantri.toLowerCase().includes(searchNadzhomSantri.toLowerCase()));
                        return matchKelas && matchSearch;
                      });

                      if (filtered.length === 0) {
                        return (
                          <tr>
                            <td colSpan={8} className="p-8 text-center text-slate-400">
                              <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                              <p className="font-semibold">Belum ada catatan setoran nadzhom untuk kriteria ini.</p>
                              <button
                                type="button"
                                onClick={() => handleOpenAddNadzhom()}
                                className="mt-3 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold hover:bg-amber-500/30 transition"
                              >
                                + Input Setoran Pertama
                              </button>
                            </td>
                          </tr>
                        );
                      }

                      return filtered.map((n, idx) => (
                        <tr key={`p-ndz-${n.idSantri}-${idx}`} className="hover:bg-[#d4af37]/5 transition">
                          <td className="p-3 font-mono text-emerald-300 font-bold whitespace-nowrap">
                            {n.tanggal || activeSession.todayIso}
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-white block">{n.nama}</span>
                            <span className="text-[10px] text-[#d4af37] font-mono">NIS: {n.idSantri}</span>
                          </td>
                          <td className="p-3 text-emerald-200">{n.kelas || '-'}</td>
                          <td className="p-3 font-semibold text-[#fef08a]">{n.kitab}</td>
                          <td className="p-3 text-center">
                            <span className="px-2.5 py-1 rounded-xl bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#fef08a] font-mono font-black text-xs">
                              {n.bait} Bait
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              n.nilai === 'Mumtaz' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                              n.nilai === 'Jayyid Jiddan' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' :
                              n.nilai === 'Jayyid' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                              'bg-slate-700/50 text-slate-300 border border-slate-600'
                            }`}>
                              {n.nilai || 'Mumtaz'}
                            </span>
                          </td>
                          <td className="p-3 text-slate-300 max-w-xs leading-relaxed text-[11px]">
                            {n.catatan || '-'}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleEditNadzhom(n)}
                              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold inline-flex items-center gap-1 transition"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick action: Simak Santri dari Kelas Terpilih */}
            <div className="card-3d rounded-3xl p-6 border border-[#d4af37]/30 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#d4af37]" />
                <span>Input Cepat Setoran per Santri ({selectedNadzhomKelas})</span>
              </h4>
              <p className="text-[11px] text-slate-300">
                Klik tombol <b>Simak Setoran</b> pada baris santri untuk otomatis mengisi data santri dan melanjutkan hafalan bait berikutnya.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-2">
                {(selectedNadzhomKelas === 'SEMUA' ? santriList : santriList.filter(s => s.kelas === selectedNadzhomKelas))
                  .slice(0, 16)
                  .map(s => {
                    const lastSetor = liveNadzhomList.find(n => n.idSantri === s.id);
                    return (
                      <div key={s.id} className="p-3 rounded-2xl bg-black/50 border border-[#d4af37]/25 flex items-center justify-between gap-2 hover:border-[#d4af37]/60 transition">
                        <div className="truncate">
                          <span className="font-bold text-white text-xs block truncate">{s.nama}</span>
                          <span className="text-[10px] text-emerald-400 font-mono block">
                            {lastSetor ? `${lastSetor.kitab} (${lastSetor.bait} bait)` : 'Belum ada setoran'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenAddNadzhom(s)}
                          className="px-2.5 py-1 rounded-xl btn-3d-gold text-black font-extrabold text-[10px] shrink-0"
                        >
                          + Simak
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Modal Form Input Setoran Nadzhom Santri */}
            {showAddNadzhomModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
                <div className="card-3d rounded-3xl p-6 border-2 border-amber-500/60 max-w-lg w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between pb-3 border-b border-amber-500/30">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-300">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-extrabold text-white text-gold-3d">
                          {editingNadzhom ? 'Edit Setoran Nadzhom Santri' : 'Input Setoran Nadzhom Santri'}
                        </h3>
                        <p className="text-[10px] text-amber-200">
                          Tersimpan dan tersinkronisasi langsung ke Dashboard Admin & Wali Santri.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddNadzhomModal(false)}
                      className="text-slate-400 hover:text-white transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveNadzhomEntry} className="space-y-3.5 text-xs">
                    {/* Pilih Santri */}
                    <div>
                      <label className="block text-[#d4af37] font-bold mb-1">
                        Pilih Santri yang Menyetor:
                      </label>
                      <select
                        value={nadzhomForm.idSantri}
                        onChange={(e) => {
                          const chosenId = e.target.value;
                          const found = santriList.find(s => s.id === chosenId);
                          if (found) {
                            const last = liveNadzhomList.find(n => n.idSantri === found.id);
                            setNadzhomForm({
                              ...nadzhomForm,
                              idSantri: found.id,
                              nama: found.nama,
                              kelas: found.kelas,
                              kitab: last?.kitab || nadzhomForm.kitab || 'Al-Fiyah Ibnu Malik',
                              bait: last ? Number(last.bait) : nadzhomForm.bait
                            });
                          }
                        }}
                        className="w-full bg-[#03140c] border border-[#d4af37]/40 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#d4af37]"
                        required
                      >
                        <option value="">-- Pilih Nama Santri --</option>
                        {santriList
                          .filter(s => selectedNadzhomKelas === 'SEMUA' || s.kelas === selectedNadzhomKelas)
                          .map(s => (
                            <option key={s.id} value={s.id}>
                              {s.nama} ({s.kelas} - NIS: {s.id})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[#d4af37] font-bold mb-1">Kelas Santri</label>
                        <select
                          value={nadzhomForm.kelas}
                          onChange={(e) => setNadzhomForm({ ...nadzhomForm, kelas: e.target.value })}
                          className="w-full bg-[#03140c] border border-[#d4af37]/40 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#d4af37]"
                        >
                          {['1 TSANAWIYAH', '2 TSANAWIYAH', '3 TSANAWIYAH', '1 ALIYAH', '2 ALIYAH', '3 ALIYAH'].map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[#d4af37] font-bold mb-1">Tanggal Setor</label>
                        <input
                          type="date"
                          value={nadzhomForm.tanggal}
                          onChange={(e) => setNadzhomForm({ ...nadzhomForm, tanggal: e.target.value })}
                          className="w-full bg-[#03140c] border border-[#d4af37]/40 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#d4af37]"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[#d4af37] font-bold mb-1">Kitab Nadzhom</label>
                        <input
                          type="text"
                          list="nadzhom-kitab-options"
                          value={nadzhomForm.kitab}
                          onChange={(e) => setNadzhomForm({ ...nadzhomForm, kitab: e.target.value })}
                          placeholder="Contoh: Al-Fiyah Ibnu Malik"
                          className="w-full bg-[#03140c] border border-[#d4af37]/40 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#d4af37]"
                          required
                        />
                        <datalist id="nadzhom-kitab-options">
                          {(settings.daftar_nadzhom && settings.daftar_nadzhom.length > 0 ? settings.daftar_nadzhom : [
                            'Al-Fiyah Ibnu Malik',
                            'Nadzhom Al-Imrithi',
                            'Matan Al-Jurumiyyah',
                            'Nadzhom Al-Maqsud',
                            'Hidayatus Sibyan',
                            'Tuhfatul Athfal',
                            'Mandzumah Jazariyyah',
                            'Aqidatul Awam',
                            'Jauharatut Tauhid'
                          ]).map((kit, idx) => (
                            <option key={idx} value={kit} />
                          ))}
                        </datalist>
                      </div>

                      <div>
                        <label className="block text-[#d4af37] font-bold mb-1">Jumlah Setoran (Bait)</label>
                        <input
                          type="number"
                          min="1"
                          max="2000"
                          value={nadzhomForm.bait}
                          onChange={(e) => setNadzhomForm({ ...nadzhomForm, bait: parseInt(e.target.value) || 0 })}
                          placeholder="Contoh: 50"
                          className="w-full bg-[#03140c] border border-[#d4af37]/40 rounded-xl p-2.5 text-white font-mono font-bold focus:outline-none focus:border-[#d4af37]"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[#d4af37] font-bold mb-1">Nilai / Predikat Hafalan</label>
                      <select
                        value={nadzhomForm.nilai}
                        onChange={(e) => setNadzhomForm({ ...nadzhomForm, nilai: e.target.value })}
                        className="w-full bg-[#03140c] border border-[#d4af37]/40 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#d4af37]"
                      >
                        <option value="Mumtaz">Mumtaz (Sangat Lancar / Sempurna)</option>
                        <option value="Jayyid Jiddan">Jayyid Jiddan (Lancar Baik Sekali)</option>
                        <option value="Jayyid">Jayyid (Lancar / Cukup)</option>
                        <option value="Makbul">Makbul (Kurang Lancar / Perlu Muraja&apos;ah)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[#d4af37] font-bold mb-1">Keterangan / Catatan Menyimak</label>
                      <textarea
                        rows={2}
                        value={nadzhomForm.catatan}
                        onChange={(e) => setNadzhomForm({ ...nadzhomForm, catatan: e.target.value })}
                        placeholder={`Contoh: Bait 1 - 50 lancar, makhraj huruf fashih. Disimak oleh pengurus ${pengurus.nama}`}
                        className="w-full bg-[#03140c] border border-[#d4af37]/40 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
                      />
                    </div>

                    <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-[#d4af37]/20 w-full">
                      <button
                        type="button"
                        onClick={() => setShowAddNadzhomModal(false)}
                        className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="btn-3d-gold px-5 py-2 rounded-xl text-black font-extrabold shadow-lg transition"
                      >
                        💾 Simpan Setoran Santri
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
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

            <div className="table-container-3d card-3d rounded-2xl p-5 border border-[#d4af37]/30 overflow-x-auto">
              <table className="w-full text-xs text-left min-w-[850px] table-luxury-3d">
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
                  {santriList.map((s, idx) => (
                    <tr key={`peng-santri-uj-${s.id}-${idx}`} className="hover:bg-[#d4af37]/5">
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
          <div className="max-w-2xl mx-auto card-3d rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-[#d4af37]/40 space-y-5 sm:space-y-6">
            <div className="flex items-center space-x-3 pb-4 border-b border-[#d4af37]/20">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#0b3824] border border-[#d4af37]/50 flex items-center justify-center text-[#d4af37] shrink-0">
                <Users className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white text-gold-3d">Biodata Lengkap Pengurus</h2>
                <p className="text-xs text-emerald-300">Data akun khidmah resmi di Pondok Pesantren Salafiyah.</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 sm:gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-[#0b3824] border-2 border-[#d4af37] shadow-xl shrink-0">
                <img
                  src={pengurus.foto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
                  alt={pengurus.nama}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-white truncate">{pengurus.nama}</h3>
                <span className="text-xs text-[#d4af37] font-bold block truncate">{pengurus.jabatan}</span>
                <span className="text-xs text-emerald-300 font-mono block mt-1">ID Pengurus: {pengurus.id}</span>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="mt-2 text-xs text-black font-extrabold px-3 py-1.5 rounded-lg btn-3d-gold shadow"
                >
                  Edit Biodata & Foto
                </button>
              </div>
            </div>

            <div className="space-y-3 bg-[#03140c] rounded-2xl p-4 border border-[#d4af37]/20 text-xs">
              <div className="flex justify-between gap-2 py-1.5 border-b border-[#d4af37]/15">
                <span className="text-slate-400 shrink-0">Divisi / Bidang</span>
                <span className="text-white font-bold text-right">{pengurus.divisi || 'Kepengurusan Pondok'}</span>
              </div>
              <div className="flex justify-between gap-2 py-1.5 border-b border-[#d4af37]/15">
                <span className="text-slate-400 shrink-0">Nomor WhatsApp</span>
                <span className="text-emerald-300 font-mono text-right">{pengurus.noWa || pengurus.noHp || '-'}</span>
              </div>
              <div className="flex justify-between gap-2 py-1.5 border-b border-[#d4af37]/15">
                <span className="text-slate-400 shrink-0">Kelas Bimbingan (Wali Kelas)</span>
                <span className="text-[#d4af37] font-bold text-right">{waliKelasKelas}</span>
              </div>
              <div className="flex justify-between gap-2 py-1.5 border-b border-[#d4af37]/15">
                <span className="text-slate-400 shrink-0">Alamat Domisili</span>
                <span className="text-white text-right">{pengurus.alamat || 'Komplek Asrama Pengurus'}</span>
              </div>
              <div className="flex justify-between gap-2 py-1.5 border-b border-[#d4af37]/15">
                <span className="text-slate-400 shrink-0">Masa Khidmah</span>
                <span className="text-[#d4af37] font-bold text-right">{pengurus.masaKhidmah || '2025 - 2027'}</span>
              </div>
              <div className="flex flex-wrap justify-between gap-2 py-1.5">
                <span className="text-slate-400 shrink-0">Sandi Login Saat Ini</span>
                <span className="text-[#d4af37] font-mono font-bold text-right">
                  {pengurus.password || 'pengurus123'}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

              <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-[#d4af37]/20 w-full">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

              <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-[#d4af37]/20 w-full">
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

      {/* MODAL AJUKAN PENGGANTI USTADZ */}
      {showAjukanPenggantiModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card-3d-glass rounded-3xl max-w-lg w-full p-6 border-2 border-amber-400 bg-[#041c12] text-white shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-amber-500/30">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-black flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white text-gold-3d">
                    Mekanisme Resmi: Ajukan Ustadz Pengganti
                  </h3>
                  <p className="text-[11px] text-amber-200">
                    Jadwal asli tetap terjaga & realisasi absensi tercatat resmi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAjukanPenggantiModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAjukanPenggantiSubmit} className="space-y-3.5 text-xs">
              {/* 1. Pilih Jadwal Yang Akan Digantikan */}
              <div>
                <label className="block text-[#d4af37] font-bold mb-1">
                  1. Pilih Jadwal Yang Akan Digantikan (Database Jadwal)
                </label>
                <select
                  value={selectedJadwalToReplaceId || (targetJadwalForReplacement?.id || '')}
                  onChange={(e) => setSelectedJadwalToReplaceId(e.target.value)}
                  className="w-full bg-[#03140c] border border-[#d4af37]/40 rounded-xl p-2.5 text-white"
                >
                  {(myAllSchedules.length > 0 ? myAllSchedules : jadwalList).map((j, idx) => (
                    <option key={j.id || idx} value={j.id || `${j.kelas}_${j.hari}_${j.jamKe}`}>
                      [{j.hari} - {j.waktu || `Jam ${j.jamKe}`}] {j.kelas} • {j.mapel} (Ustadz: {j.nama || j.ustadz})
                    </option>
                  ))}
                </select>
              </div>

              {/* Detail Jadwal Terpilih */}
              {targetJadwalForReplacement && (
                <div className="p-3 rounded-xl bg-black/60 border border-amber-500/30 space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ustadz Terjadwal Asli:</span>
                    <span className="text-white font-bold">{targetJadwalForReplacement.nama || targetJadwalForReplacement.ustadz}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mata Pelajaran & Kelas:</span>
                    <span className="text-amber-300 font-bold">{targetJadwalForReplacement.mapel} ({targetJadwalForReplacement.kelas})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Hari & Jam:</span>
                    <span className="text-emerald-300 font-mono">{targetJadwalForReplacement.hari}, {targetJadwalForReplacement.waktu || `Jam Ke-${targetJadwalForReplacement.jamKe}`}</span>
                  </div>
                </div>
              )}

              {/* 2. Pilih Ustadz Pengganti */}
              <div>
                <label className="block text-[#d4af37] font-bold mb-1">
                  2. Pilih Ustadz Pengganti Yang Ditugaskan
                </label>
                <select
                  value={selectedUstadzPenggantiName}
                  onChange={(e) => setSelectedUstadzPenggantiName(e.target.value)}
                  className="w-full bg-[#03140c] border border-[#d4af37]/40 rounded-xl p-2.5 text-white font-bold"
                  required
                >
                  {guruList.map((g, idx) => (
                    <option key={`${g.id}-${idx}`} value={g.nama}>
                      {g.nama} ({(g as any).jabatan || g.tugasUtama || 'Asatidz'})
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Alasan Penggantian */}
              <div>
                <label className="block text-[#d4af37] font-bold mb-1">
                  3. Alasan Berhalangan / Penggantian
                </label>
                <textarea
                  value={alasanPenggantianInput}
                  onChange={(e) => setAlasanPenggantianInput(e.target.value)}
                  placeholder="Misal: Ustadz Ahmad berhalangan karena ada udzur syar'i / sakit, digantikan oleh Ust. Ali."
                  className="w-full bg-[#03140c] border border-[#d4af37]/40 rounded-xl p-2.5 text-white h-20 placeholder-slate-500"
                  required
                />
              </div>

              <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-200">
                ℹ️ <b>Aturan Pengganti:</b> Ustadz pengganti tetap wajib berada di radius lokasi madrasah dengan GPS valid untuk dapat menekan tombol <b>[ HADIR SEBAGAI PENGGANTI ]</b>.
              </div>

              <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-[#d4af37]/20 w-full">
                <button
                  type="button"
                  onClick={() => setShowAjukanPenggantiModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-3d-yellow px-4 py-2 font-black shadow-lg"
                >
                  Ajukan & Konfirmasi Pengganti
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL NOTIFIKASI VALIDASI PRESENSI (DI LUAR RADIUS / DI LUAR JAM / SUKSES) ===================== */}
      {validationAlertModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="card-3d-glass max-w-lg w-full rounded-3xl p-6 sm:p-7 border-2 border-[#d4af37]/70 bg-gradient-to-b from-[#0c2419] via-[#05170f] to-[#020d08] shadow-2xl relative space-y-5 text-center">
            {/* Header Icon */}
            <div className="flex justify-center">
              {validationAlertModal.type === 'outside_radius' ? (
                <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border-2 border-amber-400/80 flex items-center justify-center text-[#fef08a] shadow-[0_0_25px_rgba(251,191,36,0.35)] animate-pulse">
                  <MapPin className="w-8 h-8 text-[#fef08a]" />
                </div>
              ) : (validationAlertModal.type === 'gps_inaccurate' || validationAlertModal.type === 'gps_unavailable') ? (
                <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border-2 border-amber-400/80 flex items-center justify-center text-[#fef08a] shadow-[0_0_25px_rgba(251,191,36,0.35)] animate-pulse">
                  <Compass className="w-8 h-8 text-[#fef08a]" />
                </div>
              ) : validationAlertModal.type === 'outside_hours' ? (
                <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border-2 border-amber-400/80 flex items-center justify-center text-[#fef08a] shadow-[0_0_25px_rgba(251,191,36,0.35)] animate-pulse">
                  <Clock className="w-8 h-8 text-[#fef08a]" />
                </div>
              ) : validationAlertModal.type === 'success' ? (
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border-2 border-emerald-400/80 flex items-center justify-center text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.35)] animate-bounce">
                  <CheckCircle2 className="w-8 h-8 text-emerald-300" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-3xl bg-blue-500/20 border-2 border-blue-400/80 flex items-center justify-center text-blue-300 shadow">
                  <AlertTriangle className="w-8 h-8 text-blue-300" />
                </div>
              )}
            </div>

            {/* Title & Message */}
            <div className="space-y-2">
              <h3 className="text-lg sm:text-xl font-black text-white text-gold-3d leading-snug">
                {validationAlertModal.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                {validationAlertModal.message}
              </p>
              {validationAlertModal.submessage && (
                <p className="text-[11px] sm:text-xs text-amber-200/90 font-medium pt-1">
                  {validationAlertModal.submessage}
                </p>
              )}
            </div>

            {/* Diagnostic Details Box */}
            {validationAlertModal.details && (
              <div className="p-3.5 rounded-2xl bg-black/70 border border-[#d4af37]/30 text-xs space-y-2 text-left">
                {validationAlertModal.details.distance !== undefined && (
                  <div className="flex justify-between items-center text-[11px] border-b border-slate-700/60 pb-1.5">
                    <span className="text-slate-400">Jarak Anda ke Titik Pusat:</span>
                    <span className="font-mono font-bold text-[#fef08a]">
                      {validationAlertModal.details.distance.toFixed(1)} meter
                    </span>
                  </div>
                )}
                {validationAlertModal.details.maxRadius !== undefined && (
                  <div className="flex justify-between items-center text-[11px] border-b border-slate-700/60 pb-1.5">
                    <span className="text-slate-400">Batas Maksimal Radius:</span>
                    <span className="font-mono font-bold text-emerald-300">
                      {validationAlertModal.details.maxRadius} meter
                    </span>
                  </div>
                )}
                {validationAlertModal.details.accuracy !== undefined && (
                  <div className="flex justify-between items-center text-[11px] border-b border-slate-700/60 pb-1.5">
                    <span className="text-slate-400">Akurasi GPS Perangkat:</span>
                    <span className="font-mono font-bold text-amber-300">
                      ±{Math.round(validationAlertModal.details.accuracy)} meter{validationAlertModal.details.maxAccuracy ? ` (Maks ±${validationAlertModal.details.maxAccuracy}m)` : ''}
                    </span>
                  </div>
                )}
                {validationAlertModal.details.currentTime && (
                  <div className="flex justify-between items-center text-[11px] border-b border-slate-700/60 pb-1.5">
                    <span className="text-slate-400">Jam Server Terkini:</span>
                    <span className="font-mono font-bold text-white">
                      {validationAlertModal.details.currentTime}
                    </span>
                  </div>
                )}
                {validationAlertModal.details.allowedSchedule && (
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">Jadwal Yang Terdaftar:</span>
                    <span className="font-bold text-amber-300">
                      {validationAlertModal.details.allowedSchedule}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Action Button */}
            <div className="pt-2 flex flex-wrap justify-center gap-2.5">
              {validationAlertModal.allowGpsRetry && (
                <button
                  type="button"
                  onClick={async () => {
                    await acquireFreshGpsPosition(8000);
                    setValidationAlertModal(null);
                  }}
                  className="btn-3d-yellow px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
                  <span>Baca Ulang Lokasi GPS</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setValidationAlertModal(null)}
                className="btn-3d-hadir-yellow w-full max-w-xs text-center font-black"
              >
                <span>[ SAYA MENGERTI / TUTUP ]</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
