import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, UserCheck, Calendar, BookOpen, Award, Sliders, LogOut, RefreshCw, 
  Clock, Database, Save, CheckCircle2, ChevronRight, BarChart3, TrendingUp, Filter,
  Lock, KeyRound, ShieldAlert, PlusCircle, Image, Palette, Eye, ArrowRight,
  Settings2, ToggleLeft, ToggleRight, Sparkles, Check, PieChart as PieChartIcon,
  Type, Megaphone, Copy, FileSpreadsheet, Newspaper, CheckCheck, RotateCcw,
  CreditCard, Wallet, AlertTriangle, Phone, MessageCircle, ArrowDownLeft, ArrowUpRight, Trash2, GraduationCap,
  Download, Printer, FileText, Send, QrCode, ShieldCheck, X, Film, Upload
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend, 
  BarChart, Bar, CartesianGrid, PieChart, Pie, Cell 
} from 'recharts';
import { Donut3D } from './Chart3D';
import { BrandLogos, LogoFrame } from './BrandLogos';
import { resolveLogos } from '../brand';
import { 
  Santri, AbsensiSantriRecord, AbsensiGuruRecord, JadwalPelajaran, 
  GuruPengajar, NadzhomRecord, NilaiUjianRecord, AppSettings, DashboardStats,
  SyahriyahRecord, UangSakuRecord, KurikulumKitabRecord,
  Pengurus, KalenderAkademikEvent, UjianSantriRecord, IzinMengajarRequest
} from '../types';

interface AdminDashboardProps {
  settings: AppSettings;
  stats: DashboardStats;
  santriList: Santri[];
  guruList: GuruPengajar[];
  jadwalList: JadwalPelajaran[];
  nadzhomList: NadzhomRecord[];
  nilaiList: NilaiUjianRecord[];
  absensiSantriList?: AbsensiSantriRecord[];
  absensiGuruList?: AbsensiGuruRecord[];
  syahriyahList?: SyahriyahRecord[];
  uangSakuList?: UangSakuRecord[];
  kurikulumList?: KurikulumKitabRecord[];
  pengurusList?: Pengurus[];
  kalenderList?: KalenderAkademikEvent[];
  ujianList?: UjianSantriRecord[];
  izinList?: IzinMengajarRequest[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  spreadsheetId: string;
  setSpreadsheetId: (id: string) => void;
  isSyncing: boolean;
  onSyncWithSheets: () => void;
  onLogout: () => void;
  // Mutations
  onSaveAbsensiSantri: (records: AbsensiSantriRecord[]) => void;
  onSaveAbsensiGuru: (records: AbsensiGuruRecord[]) => void;
  onSaveNewSantri: (newSantri: Santri) => void;
  onSaveNewGuru: (newGuru: GuruPengajar) => void;
  onSaveNewJadwal: (newJadwal: JadwalPelajaran) => void;
  onSaveNadzhom: (nadzhom: NadzhomRecord) => void;
  onSaveNilai: (nilai: NilaiUjianRecord) => void;
  onSaveSettings: (settings: AppSettings) => void;
  onSaveDashboardAndReset: () => void;
  onUpdateSantriProfile?: (updatedSantri: Santri) => void;
  onSaveSyahriyah?: (record: SyahriyahRecord) => void;
  onSaveUangSaku?: (record: UangSakuRecord) => void;
  onSaveKurikulum?: (record: KurikulumKitabRecord) => void;
  onDeleteKurikulum?: (id: string) => void;
  onSavePengurus?: (pengurus: Pengurus) => void;
  onUpdatePengurus?: (pengurus: Pengurus) => void;
  onSaveKalender?: (event: KalenderAkademikEvent) => void;
  onDeleteKalender?: (id: string) => void;
  onSaveUjianSantri?: (record: UjianSantriRecord) => void;
  onApproveIzinMengajar?: (id: string, ustadzPengganti: string, status: 'Disetujui' | 'Ditolak', catatan?: string) => void;
  onDeleteSantri?: (id: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
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
  pengurusList = [],
  kalenderList = [],
  ujianList = [],
  izinList = [],
  activeTab,
  setActiveTab,
  spreadsheetId,
  setSpreadsheetId,
  isSyncing,
  onSyncWithSheets,
  onLogout,
  onSaveAbsensiSantri,
  onSaveAbsensiGuru,
  onSaveNewSantri,
  onSaveNewGuru,
  onSaveNewJadwal,
  onSaveNadzhom,
  onSaveNilai,
  onSaveSettings,
  onSaveDashboardAndReset,
  onUpdateSantriProfile,
  onSaveSyahriyah,
  onSaveUangSaku,
  onSaveKurikulum,
  onDeleteKurikulum,
  onSavePengurus,
  onUpdatePengurus,
  onSaveKalender,
  onDeleteKalender,
  onSaveUjianSantri,
  onApproveIzinMengajar,
  onDeleteSantri
}) => {
  const classList = ['1 TSANAWIYAH', '2 TSANAWIYAH', '3 TSANAWIYAH', '1 ALIYAH', '2 ALIYAH', '3 ALIYAH'];

  // State filter untuk Absensi Guru
  const [guruSelectedClass, setGuruSelectedClass] = useState<string>('1 TSANAWIYAH');
  const isSelectedAliyah = guruSelectedClass.includes('ALIYAH');
  const availableDays = isSelectedAliyah
    ? ['MALAM SABTU', 'MALAM AHAD', 'MALAM SENIN', 'MALAM SELASA', 'MALAM RABU', 'MALAM KAMIS']
    : ['SABTU', 'AHAD', 'SENIN', 'SELASA', 'RABU', 'KAMIS'];

  const [guruSelectedDay, setGuruSelectedDay] = useState<string>('SABTU');

  // Bila berpindah ke Aliyah atau sebaliknya, sesuaikan hari default
  const handleSelectGuruClass = (cls: string) => {
    setGuruSelectedClass(cls);
    if (cls.includes('ALIYAH')) {
      if (!guruSelectedDay.startsWith('MALAM')) {
        setGuruSelectedDay('MALAM SABTU');
      }
    } else {
      if (guruSelectedDay.startsWith('MALAM')) {
        setGuruSelectedDay('SABTU');
      }
    }
  };

  // State Status Absensi Guru per item
  const [guruAbsensiState, setGuruAbsensiState] = useState<Record<string, { status: 'Hadir' | 'Terlambat' | 'Izin' | 'Alpha', catatan: string }>>({});

  // Rekapan Absensi Guru (Tersimpan lokal & sheets)
  const [rekapGuruLog, setRekapGuruLog] = useState<AbsensiGuruRecord[]>([
    { tanggal: '2026-09-22', nama: 'Ustazah Fina Nikmatul Kamelia', mapel: 'ALALA', kelas: '1 TSANAWIYAH', status: 'Hadir', catatan: 'Bab Niat Tholabul Ilmi', hari: 'SABTU', jamKe: 1, waktu: '08.30 - 09.45' },
    { tanggal: '2026-09-22', nama: 'Ustazah Maulida Rohmah', mapel: 'TAJWID', kelas: '1 TSANAWIYAH', status: 'Hadir', catatan: 'Makharijul Huruf', hari: 'AHAD', jamKe: 1, waktu: '08.30 - 09.45' },
    { tanggal: '2026-09-22', nama: 'Ustadz Yasir', mapel: 'AKHLAQ', kelas: '2 TSANAWIYAH', status: 'Hadir', catatan: 'Adab kepada ustadz', hari: 'SABTU', jamKe: 2, waktu: '10.15 - 11.30' },
    { tanggal: '2026-09-22', nama: 'Ustadz Adib Setiawan', mapel: 'FIQIH', kelas: '2 TSANAWIYAH', status: 'Terlambat', catatan: 'Terlambat 10 menit karena udzur', hari: 'SABTU', jamKe: 1, waktu: '08.30 - 09.45' },
    { tanggal: '2026-09-22', nama: 'Ustadz Ahmad Shobirin', mapel: 'NAHWU JURUMIYYAH', kelas: '2 TSANAWIYAH', status: 'Hadir', catatan: 'Bab Kalam', hari: 'SELASA', jamKe: 1, waktu: '08.30 - 09.45' }
  ]);

  // State Pilihan Bulan untuk Rekapitulasi Bulanan (Tanggal 1 - 30)
  const [selectedBulanSantri, setSelectedBulanSantri] = useState<string>('September 2026');
  const [selectedBulanGuru, setSelectedBulanGuru] = useState<string>('September 2026');

  // Filter untuk Jadwal tab
  const [jadwalActiveAngkatan, setJadwalActiveAngkatan] = useState<string>('SEMUA');

  // Filter untuk Data Guru & Santri tab (PER ANGKATAN)
  const [selectedAngkatanGuru, setSelectedAngkatanGuru] = useState<string>('1 TSANAWIYAH');
  const [selectedAngkatanSantri, setSelectedAngkatanSantri] = useState<string>('1 TSANAWIYAH');

  // Form states for absensi santri in memory
  const [santriAbsensiState, setSantriAbsensiState] = useState<Record<string, { status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpha', ket: string }>>({});

  const handleMarkAllSantriHadir = () => {
    const updated: Record<string, { status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpha', ket: string }> = {};
    santriList.forEach(s => {
      updated[s.id] = { status: 'Hadir', ket: 'Tepat waktu' };
    });
    setSantriAbsensiState(updated);
  };

  const handleSaveSantriAbsensiSubmit = () => {
    const records: AbsensiSantriRecord[] = santriList.map(s => {
      const entry = santriAbsensiState[s.id] || { status: 'Hadir', ket: '' };
      return {
        tanggal: new Date().toISOString().split('T')[0],
        idSantri: s.id,
        nama: s.nama,
        kelas: s.kelas,
        status: entry.status,
        keterangan: entry.ket
      };
    });
    onSaveAbsensiSantri(records);
    alert('Absensi seluruh santri berhasil disimpan dan direkap!');
  };

  // Kalkulasi Rekapan Bulanan Santri (Tanggal 1 sampai 30)
  const rekapBulananSantri = useMemo(() => {
    return santriList.map((santri, index) => {
      // Hitung dari rekaman absensi santri yang cocok
      const records = absensiSantriList.filter(a => a.idSantri === santri.id || a.nama === santri.nama);
      const actualHadir = records.filter(r => r.status === 'Hadir').length;
      const actualIzin = records.filter(r => r.status === 'Izin').length;
      const actualSakit = records.filter(r => r.status === 'Sakit').length;
      const actualAlpha = records.filter(r => r.status === 'Alpha').length;

      // Buat baseline kumulatif 30 hari yang konsisten dan realistis berbasis data santri
      const pseudoHash = (santri.id.charCodeAt(santri.id.length - 1) + index * 7) % 5;
      const baseHadir = Math.min(30, 26 + (pseudoHash % 4) + actualHadir);
      const baseIzin = (pseudoHash === 1 ? 1 : 0) + actualIzin;
      const baseSakit = (pseudoHash === 3 ? 1 : 0) + actualSakit;
      const baseAlpha = (pseudoHash === 4 ? 1 : 0) + actualAlpha;
      const totalDays = 30; // Rentang tgl 1 s/d 30
      const totalKehadiran = Math.min(30, baseHadir);
      const persentase = Math.min(100, Math.round((totalKehadiran / totalDays) * 100));

      return {
        id: santri.id,
        nama: santri.nama,
        kelas: santri.kelas,
        hadir: totalKehadiran,
        izin: baseIzin,
        sakit: baseSakit,
        alpha: baseAlpha,
        persentase,
        keterangan: persentase >= 95 ? 'Sangat Rajin' : persentase >= 85 ? 'Disiplin' : 'Perlu Pembinaan'
      };
    });
  }, [santriList, absensiSantriList]);

  // Kalkulasi Rekapan Bulanan Guru (Tanggal 1 sampai 30)
  const rekapBulananGuru = useMemo(() => {
    return guruList.map((guru, index) => {
      // Cari rekap guru dari log dan jadwal
      const logs = rekapGuruLog.filter(l => l.nama.toLowerCase() === guru.nama.toLowerCase());
      const actualHadir = logs.filter(l => l.status === 'Hadir').length;
      const actualTerlambat = logs.filter(l => l.status === 'Terlambat').length;
      const actualIzin = logs.filter(l => l.status === 'Izin').length;
      const actualAlpha = logs.filter(l => l.status === 'Alpha').length;

      // Basis kalkulasi mengajar tanggal 1 sampai 30 (rata-rata 24 s/d 28 sesi mengajar per bulan)
      const guruHash = (guru.nama.charCodeAt(2) + index * 5) % 6;
      const totalSesiBulan = 26; // Rata-rata sesi mengajar per bulan tgl 1-30
      const totalHadir = Math.min(totalSesiBulan, 23 + (guruHash % 3) + actualHadir);
      const totalIzin = (guruHash === 2 ? 1 : 0) + actualIzin;
      const totalSakitTelat = (guruHash === 4 ? 1 : 0) + actualTerlambat;
      const totalAlpha = actualAlpha;
      const persentase = Math.min(100, Math.round((totalHadir / totalSesiBulan) * 100));

      return {
        nama: guru.nama,
        mapel: guru.mapel,
        kelas: guru.kelas,
        totalSesi: totalSesiBulan,
        hadir: totalHadir,
        izin: totalIzin,
        sakitTelat: totalSakitTelat,
        alpha: totalAlpha,
        persentase,
        predikat: persentase >= 95 ? 'Sangat Teladan' : persentase >= 85 ? 'Tertib' : 'Evaluasi Disiplin'
      };
    });
  }, [guruList, rekapGuruLog]);

  // Helper Ekspor Data (Google Sheets / CSV, Microsoft Word, dan Print / PDF)
  const downloadCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadWord = (filename: string, title: string, headers: string[], rows: (string | number)[][]) => {
    const tableRows = rows.map(r => `<tr>${r.map(c => `<td style="border:1px solid #333;padding:6px;">${c}</td>`).join('')}</tr>`).join('');
    const tableHeaders = headers.map(h => `<th style="border:1px solid #333;background:#e2e8f0;padding:8px;">${h}</th>`).join('');
    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><title>${title}</title><meta charset='utf-8'></head>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="text-align:center; color: #0f172a;">${title}</h2>
        <p style="text-align:center;font-size:12px;color:#475569;">Pondok Pesantren Salaf Al-Maliki • Madrasah Diniyah Salafiyah</p>
        <hr style="border: 1px solid #cbd5e1; margin: 15px 0;" />
        <table style="width:100%;border-collapse:collapse;margin-top:10px;font-size:12px;">
          <thead><tr>${tableHeaders}</tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
      </body>
      </html>
    `;
    const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const printTable = () => {
    window.print();
  };

  // State untuk Persetujuan Izin Mengajar Ustadz
  const [penggantiSelected, setPenggantiSelected] = useState<{ [id: string]: string }>({});

  // State untuk Ujian Muhafadzoh
  const [muhafadzohAngkatan, setMuhafadzohAngkatan] = useState<string>('SEMUA');
  const [muhafadzohTab, setMuhafadzohTab] = useState<'semua' | 'jayyid' | 'mutawasit' | 'rodi'>('semua');

  // Filter & Pengelompokan Muhafadzoh Santri
  const filteredSantriMuhafadzoh = useMemo(() => {
    const list = muhafadzohAngkatan === 'SEMUA' 
      ? [...santriList] 
      : santriList.filter(s => s.kelas === muhafadzohAngkatan);

    const withPredikat = list.map(s => {
      const val = Number(s.nilaiMuhafadzoh ?? 88);
      let predikat = 'Jayyid (Baik Sekali)';
      let kategori: 'JAYYID' | 'MUTAWASIT' | 'RODI' = 'JAYYID';
      if (val >= 85) {
        predikat = 'Jayyid (Baik Sekali)';
        kategori = 'JAYYID';
      } else if (val >= 75) {
        predikat = 'Mutawasit (Sedang)';
        kategori = 'MUTAWASIT';
      } else {
        predikat = 'Rodi (Belum Baik)';
        kategori = 'RODI';
      }
      return { ...s, nilaiMhf: val, predikatMhf: predikat, kategoriMhf: kategori };
    });

    // Urutkan peringkat dari nilai tertinggi
    withPredikat.sort((a, b) => b.nilaiMhf - a.nilaiMhf);
    return withPredikat;
  }, [santriList, muhafadzohAngkatan]);

  const countJayyid = useMemo(() => {
    return santriList.filter(s => Number(s.nilaiMuhafadzoh ?? 88) >= 85).length;
  }, [santriList]);

  const countMutawasit = useMemo(() => {
    return santriList.filter(s => {
      const v = Number(s.nilaiMuhafadzoh ?? 88);
      return v >= 75 && v < 85;
    }).length;
  }, [santriList]);

  const countRodi = useMemo(() => {
    return santriList.filter(s => Number(s.nilaiMuhafadzoh ?? 88) < 75).length;
  }, [santriList]);

  // State untuk QR Code Presensi Terpadu
  const [qrAngkatan, setQrAngkatan] = useState<string>('SEMUA');
  const [simulasiScanMsg, setSimulasiScanMsg] = useState<string | null>(null);
  const [dashboardRekapTab, setDashboardRekapTab] = useState<'santri' | 'guru'>('santri');
  const [muhafadzohYear, setMuhafadzohYear] = useState<string>('2026/2027');

  // Simpan Absensi Guru per Hari & Kelas yang sedang dipilih (Dapat dipanggil dari Option Panel maupun tombol internal)
  const handleSaveGuruAbsensiSubmit = () => {
    const targetJadwal = jadwalList.filter(
      j => j.kelas === guruSelectedClass && j.hari.toUpperCase() === guruSelectedDay.toUpperCase()
    );

    if (!targetJadwal.length) {
      alert(`Tidak ada jadwal pelajaran untuk ${guruSelectedClass} pada ${guruSelectedDay}.`);
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const newRecords: AbsensiGuruRecord[] = targetJadwal.map((j) => {
      const key = `${j.kelas}_${j.hari}_${j.jamKe}`;
      const entry = guruAbsensiState[key] || { status: 'Hadir', catatan: 'Tepat waktu' };
      return {
        tanggal: todayStr,
        nama: j.nama,
        mapel: j.mapel,
        kelas: j.kelas,
        status: entry.status,
        catatan: entry.catatan,
        hari: j.hari,
        jamKe: j.jamKe,
        waktu: j.waktu
      };
    });

    onSaveAbsensiGuru(newRecords);
    setRekapGuruLog(prev => [...newRecords, ...prev]);
    alert(`Absensi Guru ${guruSelectedClass} untuk ${guruSelectedDay} (${newRecords.length} jam) berhasil disimpan!`);
  };

  const handleMarkAllGuruHadir = () => {
    const targetJadwal = jadwalList.filter(
      j => j.kelas === guruSelectedClass && j.hari.toUpperCase() === guruSelectedDay.toUpperCase()
    );
    const updated = { ...guruAbsensiState };
    targetJadwal.forEach(j => {
      const key = `${j.kelas}_${j.hari}_${j.jamKe}`;
      updated[key] = { status: 'Hadir', catatan: 'Tepat waktu mengajar' };
    });
    setGuruAbsensiState(updated);
  };

  // ==========================================
  // FITUR OPTION PANEL: PUSAT KONTROL & KEAMANAN
  // ==========================================
  const [optionPanelUnlocked, setOptionPanelUnlocked] = useState<boolean>(false);
  const [optionPasswordInput, setOptionPasswordInput] = useState<string>('');
  const [optionPasswordError, setOptionPasswordError] = useState<string>('');
  const [activeControlSection, setActiveControlSection] = useState<
    'input_santri' | 'input_guru' | 'input_jadwal' | 'simpan_absensi' | 'kontrol_tombol' | 
    'visual_branding' | 'keamanan' | 'profil_santri' | 'kelola_syahriyah' | 'kelola_uang_saku' | 'kelola_kurikulum' |
    'kelola_pengurus' | 'kelola_kalender' | 'kelola_ujian_kitab' | 'kelola_berita'
  >('simpan_absensi');

  // State Pengurus di Option Panel (Nama & Kata Sandi Login Pengurus)
  const [selectedPengurusId, setSelectedPengurusId] = useState<string>(
    pengurusList[0]?.id || 'PGR-01'
  );
  const currentSelectedPengurus = useMemo(() => {
    return pengurusList.find(p => p.id === selectedPengurusId) || pengurusList[0];
  }, [pengurusList, selectedPengurusId]);

  const [pengurusEditForm, setPengurusEditForm] = useState({
    id: currentSelectedPengurus?.id || 'PGR-01',
    nama: currentSelectedPengurus?.nama || '',
    password: currentSelectedPengurus?.password || 'pengurus123',
    jabatan: currentSelectedPengurus?.jabatan || 'Lurah Pondok',
    noWa: currentSelectedPengurus?.noWa || '6281234567891',
    kelasBimbingan: currentSelectedPengurus?.kelasBimbingan || 'Dewan Asatidz',
    mapel: currentSelectedPengurus?.mapel || 'Fathul Qorib',
    tugasUtama: currentSelectedPengurus?.tugasUtama || 'Pengawasan disiplin & pengajian diniyah salafiyah'
  });

  useEffect(() => {
    if (currentSelectedPengurus) {
      setPengurusEditForm({
        id: currentSelectedPengurus.id,
        nama: currentSelectedPengurus.nama,
        password: currentSelectedPengurus.password || 'pengurus123',
        jabatan: currentSelectedPengurus.jabatan,
        noWa: currentSelectedPengurus.noWa,
        kelasBimbingan: currentSelectedPengurus.kelasBimbingan || 'Dewan Asatidz',
        mapel: currentSelectedPengurus.mapel || 'Fathul Qorib',
        tugasUtama: currentSelectedPengurus.tugasUtama || 'Pengawasan disiplin & pengajian diniyah salafiyah'
      });
    }
  }, [currentSelectedPengurus]);

  // State Kalender Akademik Form
  const [kalenderForm, setKalenderForm] = useState({
    judul: '',
    tanggalMulai: new Date().toISOString().split('T')[0],
    tanggalSelesai: '',
    kategori: 'Rapat' as 'Rapat' | 'Kegiatan' | 'Ujian' | 'Libur' | 'Pengajian',
    deskripsi: '',
    lokasi: 'Aula Utama Pondok',
    waktu: '20.00 - 22.00 WIB',
    isUrgentNotif: true,
    sasaran: 'Seluruh Dewan Asatidz & Pengurus'
  });

  // State Ujian Santri Terintegrasi di Option Panel
  const [selectedUjianSantriId, setSelectedUjianSantriId] = useState<string>(
    santriList[0]?.id || 'S-1001'
  );
  const currentUjianSantri = useMemo(() => {
    return santriList.find(s => s.id === selectedUjianSantriId) || santriList[0];
  }, [santriList, selectedUjianSantriId]);

  const [ujianKitabForm, setUjianKitabForm] = useState({
    nilaiKoreksianKitab: currentUjianSantri?.nilaiKoreksianKitab ?? 90,
    predikatKoreksianKitab: currentUjianSantri?.predikatKoreksianKitab || 'Mumtaz (Makna Gandul Sah & Lengkap)',
    kitabKoreksian: 'Kitab Fathul Qorib Al-Mujib',
    catatanKoreksianKitab: currentUjianSantri?.catatanUjianKitab || 'Catatan pegon tertib, makna gandul sah dan lengkap.',
    nilaiMuhafadzoh: currentUjianSantri?.nilaiMuhafadzoh ?? 92,
    predikatMuhafadzoh: currentUjianSantri?.predikatMuhafadzoh || 'Mumtaz (Hafal Lancar 250 Bait)',
    kitabMuhafadzoh: 'Nadzhom Al-Imrithi',
    catatanMuhafadzoh: 'Hafalan sangat mutqin dan fashih.',
    nilaiBacaKitab: currentUjianSantri?.nilaiBacaKitab ?? 88,
    predikatBacaKitab: currentUjianSantri?.predikatBacaKitab || 'Jayyid Jiddan (Fashih & Paham Tarkib)',
    kitabBaca: 'Fathul Qorib Bab Sholat',
    catatanBacaKitab: 'Mampu menjelaskan tarkib i\'rob dengan baik.',
    ustadzPenguji: currentUjianSantri?.ustadzPengujiKitab || 'Ust. Muhammad Ilyas Al-Hafidz',
    tanggalUjian: currentUjianSantri?.tanggalUjianKitab || new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (currentUjianSantri) {
      setUjianKitabForm({
        nilaiKoreksianKitab: currentUjianSantri.nilaiKoreksianKitab ?? 90,
        predikatKoreksianKitab: currentUjianSantri.predikatKoreksianKitab || 'Mumtaz (Makna Gandul Sah & Lengkap)',
        kitabKoreksian: 'Kitab Fathul Qorib Al-Mujib',
        catatanKoreksianKitab: currentUjianSantri.catatanUjianKitab || 'Catatan pegon tertib, makna gandul sah dan lengkap.',
        nilaiMuhafadzoh: currentUjianSantri.nilaiMuhafadzoh ?? 92,
        predikatMuhafadzoh: currentUjianSantri.predikatMuhafadzoh || 'Mumtaz (Hafal Lancar 250 Bait)',
        kitabMuhafadzoh: 'Nadzhom Al-Imrithi',
        catatanMuhafadzoh: 'Hafalan sangat mutqin dan fashih.',
        nilaiBacaKitab: currentUjianSantri.nilaiBacaKitab ?? 88,
        predikatBacaKitab: currentUjianSantri.predikatBacaKitab || 'Jayyid Jiddan (Fashih & Paham Tarkib)',
        kitabBaca: 'Fathul Qorib Bab Sholat',
        catatanBacaKitab: 'Mampu menjelaskan tarkib i\'rob dengan baik.',
        ustadzPenguji: currentUjianSantri.ustadzPengujiKitab || 'Ust. Muhammad Ilyas Al-Hafidz',
        tanggalUjian: currentUjianSantri.tanggalUjianKitab || new Date().toISOString().split('T')[0]
      });
    }
  }, [currentUjianSantri]);

  // Form input manual santri di Option Panel
  const [inputSantriForm, setInputSantriForm] = useState({
    id: `S-${Math.floor(1000 + Math.random() * 8999)}`,
    nama: '',
    kelas: '1 TSANAWIYAH',
    kamar: '',
    alamat: '',
    foto: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80',
    namaOrangTua: '',
    namaWaliKelas: 'Ustazah Fina Nikmatul Kamelia',
    noWaWaliKelas: '0812-3456-7890',
    saldoUangSaku: 150000,
    password: ''
  });

  // State untuk Edit Profil Anak & Password Wali (NIS) di Option Panel
  const [selectedProfileSantriId, setSelectedProfileSantriId] = useState<string>(
    santriList[0]?.id || 'S-1001'
  );
  const currentSelectedSantri = useMemo(() => {
    return santriList.find(s => s.id === selectedProfileSantriId) || santriList[0];
  }, [santriList, selectedProfileSantriId]);

  const [santriProfileEditForm, setSantriProfileEditForm] = useState({
    password: currentSelectedSantri?.password || currentSelectedSantri?.id || 'S-1001',
    nama: currentSelectedSantri?.nama || '',
    namaOrangTua: currentSelectedSantri?.namaOrangTua || '',
    namaWaliKelas: currentSelectedSantri?.namaWaliKelas || 'Ustazah Fina Nikmatul Kamelia',
    noWaWaliKelas: currentSelectedSantri?.noWaWaliKelas || '0812-3456-7890',
    saldoUangSaku: currentSelectedSantri?.saldoUangSaku ?? 200000,
    kamar: currentSelectedSantri?.kamar || '',
    alamat: currentSelectedSantri?.alamat || ''
  });

  // Sinkronkan form saat santri target berubah
  useEffect(() => {
    if (currentSelectedSantri) {
      setSantriProfileEditForm({
        password: currentSelectedSantri.password || currentSelectedSantri.id,
        nama: currentSelectedSantri.nama,
        namaOrangTua: currentSelectedSantri.namaOrangTua || '',
        namaWaliKelas: currentSelectedSantri.namaWaliKelas || 'Ustazah Fina Nikmatul Kamelia',
        noWaWaliKelas: currentSelectedSantri.noWaWaliKelas || '0812-3456-7890',
        saldoUangSaku: currentSelectedSantri.saldoUangSaku ?? 200000,
        kamar: currentSelectedSantri.kamar || '',
        alamat: currentSelectedSantri.alamat || ''
      });
    }
  }, [currentSelectedSantri]);

  // Form input Syahriyah baru
  const [inputSyahriyahForm, setInputSyahriyahForm] = useState({
    idSantri: santriList[0]?.id || 'S-1001',
    bulan: 'September 2026',
    nominal: 350000,
    tanggalBayar: new Date().toISOString().split('T')[0],
    status: 'Lunas' as 'Lunas' | 'Menunggak' | 'Belum Bayar',
    keterangan: 'Pembayaran Syahriyah Bulanan'
  });

  // Form input Uang Saku baru
  const [inputUangSakuForm, setInputUangSakuForm] = useState({
    idSantri: santriList[0]?.id || 'S-1001',
    tanggal: new Date().toISOString().split('T')[0],
    tipe: 'Masuk' as 'Masuk' | 'Keluar',
    nominal: 50000,
    keterangan: 'Kiriman orang tua'
  });

  // Form Kurikulum per Angkatan & Kitab
  const [inputKurikulumForm, setInputKurikulumForm] = useState({
    kelas: '1 TSANAWIYAH',
    mapel: '',
    kitab: '',
    muallif: '',
    targetSemester: '',
    ustadzPengampu: 'Ustazah Fina Nikmatul Kamelia'
  });
  const [showAddKurikulumInline, setShowAddKurikulumInline] = useState<boolean>(false);

  // Form input manual guru di Option Panel
  const [inputGuruForm, setInputGuruForm] = useState({
    nama: '',
    mapel: '',
    kelas: '1 TSANAWIYAH'
  });

  // Form input manual jadwal di Option Panel
  const [inputJadwalForm, setInputJadwalForm] = useState({
    kelas: '1 TSANAWIYAH',
    hari: 'SABTU',
    jamKe: 1,
    waktu: '08.30 - 09.45',
    mapel: '',
    nama: ''
  });

  // Form Visual Branding, Kata Sandi, dan Kontrol Tombol
  const [visualForm, setVisualForm] = useState<AppSettings>({
    ...settings,
    background_url: settings.background_url || '',
    logo_pondok: settings.logo_pondok || '',
    logo_madrasah: settings.logo_madrasah || '',
    intro_video_url: settings.intro_video_url || localStorage.getItem('sim_intro_video') || 'Camera_moving_through_Islamic_li…_20260925184519.mp4',
    password_admin: settings.password_admin || 'salaf123',
    password_option_panel: settings.password_option_panel || 'admin123',

    // Pengaturan Teks Menyeluruh
    header_title: settings.header_title || settings.judul_aplikasi || 'SIM Pondok Pesantren Salaf Al-Maliki',
    header_subtitle: settings.header_subtitle || settings.login_subtitle || 'Sistem Informasi & Manajemen Santri Madrasah Diniyah Salafiyah',
    portal_title: settings.portal_title || 'Portal Wali Santri Diniyah',
    portal_subtitle: settings.portal_subtitle || 'Akses Informasi Akademik & Presensi Santri Terpadu',
    announcement_text: settings.announcement_text || 'Kajian Rutin Kitab Fathul Qorib & Nadzhom Imrithi setiap malam Jumat.',
    text_absensi_santri_title: settings.text_absensi_santri_title || 'Absensi Santri Diniyah',
    text_absensi_guru_title: settings.text_absensi_guru_title || 'Absensi Ustadz / Ustadzah Pengajar',
    text_jadwal_title: settings.text_jadwal_title || 'Jadwal Pelajaran Madrasah Diniyah',
    text_santri_title: settings.text_santri_title || 'Data Santri & Foto per Angkatan',
    text_guru_title: settings.text_guru_title || 'Data Guru Pengajar (Per Angkatan)',

    // Berita & Running Text Caption
    berita_image_url: settings.berita_image_url || 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=1200&auto=format&fit=crop&q=80',
    berita_title: settings.berita_title || 'Evaluasi Perkembangan Pembelajaran & Nadzhom Santri',
    berita_deskripsi: settings.berita_deskripsi || 'Musyawaroh kubro dan ujian semester santri madrasah diniyah salafiyah terjadwal pekan depan.',
    running_text_caption: settings.running_text_caption || '📢 MAKLUMAT PONDOK: Seluruh asatidz dan santri wajib menghadiri pembacaan Rotibul Haddad ba\'da Maghrib • Ujian Khitobah & Qiroatul Kutub dilaksanakan hari Ahad depan • Harap seluruh absensi divalidasi tepat waktu.',

    btn_hadir_semua_text: settings.btn_hadir_semua_text || '✓ Hadir Semua',
    btn_hadir_semua_color: settings.btn_hadir_semua_color || '#ffffff',
    btn_simpan_absensi_santri_text: settings.btn_simpan_absensi_santri_text || 'Simpan Absensi Santri',
    btn_simpan_absensi_santri_color: settings.btn_simpan_absensi_santri_color || '#000000',
    btn_simpan_guru_text: settings.btn_simpan_guru_text || 'SIMPAN ABSENSI GURU',
    btn_simpan_guru_color: settings.btn_simpan_guru_color || '#000000',
    btn_sync_sheets_text: settings.btn_sync_sheets_text || 'Sinkron Google Sheets',
    btn_sync_sheets_color: settings.btn_sync_sheets_color || '#d4af37',
    btn_reset_dashboard_text: settings.btn_reset_dashboard_text || 'Simpan Rekap & Reset Harian',
    btn_reset_dashboard_color: settings.btn_reset_dashboard_color || '#000000',
    show_quick_sync_button: settings.show_quick_sync_button !== false,
    show_export_csv_button: settings.show_export_csv_button !== false,
    show_reset_dashboard_button: settings.show_reset_dashboard_button !== false
  });

  // Sinkronkan visualForm ketika props settings diperbarui dari Google Sheets / localStorage
  useEffect(() => {
    setVisualForm({
      ...settings,
      background_url: settings.background_url || '',
      logo_pondok: settings.logo_pondok || '',
      logo_madrasah: settings.logo_madrasah || '',
      intro_video_url: settings.intro_video_url || localStorage.getItem('sim_intro_video') || 'Camera_moving_through_Islamic_li…_20260925184519.mp4',
      password_admin: settings.password_admin || 'salaf123',
      password_option_panel: settings.password_option_panel || 'admin123',

      header_title: settings.header_title || settings.judul_aplikasi || 'SIM Pondok Pesantren Salaf Al-Maliki',
      header_subtitle: settings.header_subtitle || settings.login_subtitle || 'Sistem Informasi & Manajemen Santri Madrasah Diniyah Salafiyah',
      portal_title: settings.portal_title || 'Portal Wali Santri Diniyah',
      portal_subtitle: settings.portal_subtitle || 'Akses Informasi Akademik & Presensi Santri Terpadu',
      announcement_text: settings.announcement_text || 'Kajian Rutin Kitab Fathul Qorib & Nadzhom Imrithi setiap malam Jumat.',
      text_absensi_santri_title: settings.text_absensi_santri_title || 'Absensi Santri Diniyah',
      text_absensi_guru_title: settings.text_absensi_guru_title || 'Absensi Ustadz / Ustadzah Pengajar',
      text_jadwal_title: settings.text_jadwal_title || 'Jadwal Pelajaran Madrasah Diniyah',
      text_santri_title: settings.text_santri_title || 'Data Santri & Foto per Angkatan',
      text_guru_title: settings.text_guru_title || 'Data Guru Pengajar (Per Angkatan)',

      berita_image_url: settings.berita_image_url || 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=1200&auto=format&fit=crop&q=80',
      berita_title: settings.berita_title || 'Evaluasi Perkembangan Pembelajaran & Nadzhom Santri',
      berita_deskripsi: settings.berita_deskripsi || 'Musyawaroh kubro dan ujian semester santri madrasah diniyah salafiyah terjadwal pekan depan.',
      running_text_caption: settings.running_text_caption || '📢 MAKLUMAT PONDOK: Seluruh asatidz dan santri wajib menghadiri pembacaan Rotibul Haddad ba\'da Maghrib • Ujian Khitobah & Qiroatul Kutub dilaksanakan hari Ahad depan • Harap seluruh absensi divalidasi tepat waktu.',

      btn_hadir_semua_text: settings.btn_hadir_semua_text || '✓ Hadir Semua',
      btn_hadir_semua_color: settings.btn_hadir_semua_color || '#ffffff',
      btn_simpan_absensi_santri_text: settings.btn_simpan_absensi_santri_text || 'Simpan Absensi Santri',
      btn_simpan_absensi_santri_color: settings.btn_simpan_absensi_santri_color || '#000000',
      btn_simpan_guru_text: settings.btn_simpan_guru_text || 'SIMPAN ABSENSI GURU',
      btn_simpan_guru_color: settings.btn_simpan_guru_color || '#000000',
      btn_sync_sheets_text: settings.btn_sync_sheets_text || 'Sinkron Google Sheets',
      btn_sync_sheets_color: settings.btn_sync_sheets_color || '#d4af37',
      btn_reset_dashboard_text: settings.btn_reset_dashboard_text || 'Simpan Rekap & Reset Harian',
      btn_reset_dashboard_color: settings.btn_reset_dashboard_color || '#000000',
      show_quick_sync_button: settings.show_quick_sync_button !== false,
      show_export_csv_button: settings.show_export_csv_button !== false,
      show_reset_dashboard_button: settings.show_reset_dashboard_button !== false
    });
  }, [settings]);

  // Verifikasi Password Option Panel
  const handleUnlockOptionPanel = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPass = settings.password_option_panel || 'admin123';
    if (optionPasswordInput === correctPass) {
      setOptionPanelUnlocked(true);
      setOptionPasswordError('');
    } else {
      setOptionPasswordError(`Password salah! Silakan coba lagi.`);
    }
  };

  // Submit tambah Santri dari Option Panel
  const handleAddSantriSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputSantriForm.nama.trim() || !inputSantriForm.id.trim()) {
      alert('NIS dan Nama Santri wajib diisi!');
      return;
    }
    onSaveNewSantri({
      id: inputSantriForm.id.trim(),
      nama: inputSantriForm.nama.trim(),
      kelas: inputSantriForm.kelas,
      kamar: inputSantriForm.kamar.trim(),
      alamat: inputSantriForm.alamat.trim(),
      foto: inputSantriForm.foto.trim()
    });
    alert(`Santri ${inputSantriForm.nama} (${inputSantriForm.kelas}) berhasil ditambahkan ke database!`);
    setInputSantriForm({
      id: `S-${Math.floor(1000 + Math.random() * 8999)}`,
      nama: '',
      kelas: inputSantriForm.kelas,
      kamar: '',
      alamat: '',
      foto: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80',
      namaOrangTua: '',
      namaWaliKelas: 'Ustazah Fina Nikmatul Kamelia',
      noWaWaliKelas: '0812-3456-7890',
      saldoUangSaku: 150000,
      password: ''
    });
  };

  // Submit tambah Guru dari Option Panel
  const handleAddGuruSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputGuruForm.nama.trim() || !inputGuruForm.mapel.trim()) {
      alert('Nama Ustadz dan Mata Pelajaran wajib diisi!');
      return;
    }
    onSaveNewGuru({
      nama: inputGuruForm.nama.trim(),
      mapel: inputGuruForm.mapel.trim(),
      kelas: inputGuruForm.kelas
    });
    alert(`Guru/Ustadz ${inputGuruForm.nama} (${inputGuruForm.mapel}) berhasil ditambahkan untuk angkatan ${inputGuruForm.kelas}!`);
    setInputGuruForm({
      nama: '',
      mapel: '',
      kelas: inputGuruForm.kelas
    });
  };

  // Submit tambah Jadwal dari Option Panel
  const handleAddJadwalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputJadwalForm.mapel.trim() || !inputJadwalForm.nama.trim()) {
      alert('Mata Pelajaran dan Nama Ustadz Pengajar wajib diisi!');
      return;
    }
    onSaveNewJadwal({
      kelas: inputJadwalForm.kelas,
      hari: inputJadwalForm.hari,
      jamKe: Number(inputJadwalForm.jamKe),
      waktu: inputJadwalForm.waktu,
      mapel: inputJadwalForm.mapel.trim(),
      nama: inputJadwalForm.nama.trim()
    });
    alert(`Jadwal ${inputJadwalForm.mapel} (${inputJadwalForm.hari} Jam ke-${inputJadwalForm.jamKe}) untuk ${inputJadwalForm.kelas} berhasil ditambahkan!`);
    setInputJadwalForm({
      kelas: inputJadwalForm.kelas,
      hari: inputJadwalForm.hari,
      jamKe: Number(inputJadwalForm.jamKe) + 1,
      waktu: '10.15 - 11.30',
      mapel: '',
      nama: ''
    });
  };

  // Submit Simpan Pengaturan Visual & Password
  const handleSaveVisualAndSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    if (visualForm.intro_video_url) {
      localStorage.setItem('sim_intro_video', visualForm.intro_video_url);
      localStorage.setItem('sim_intro_video_name', visualForm.intro_video_url);
    }
    onSaveSettings(visualForm);
    alert('Pusat Kontrol Visual, Video Intro Opening, Background, Logo, dan Kata Sandi berhasil diperbarui dan disimpan!');
  };

  // Data Tren untuk Recharts
  const trendData = [
    { tanggal: '16/09', hadirSantri: 91, hadirGuru: 88, santriAbsen: 36, guruAbsen: 17 },
    { tanggal: '17/09', hadirSantri: 94, hadirGuru: 92, santriAbsen: 38, guruAbsen: 18 },
    { tanggal: '18/09', hadirSantri: 89, hadirGuru: 85, santriAbsen: 35, guruAbsen: 16 },
    { tanggal: '19/09', hadirSantri: 96, hadirGuru: 95, santriAbsen: 39, guruAbsen: 19 },
    { tanggal: '20/09', hadirSantri: 92, hadirGuru: 90, santriAbsen: 37, guruAbsen: 18 },
    { tanggal: '21/09', hadirSantri: 95, hadirGuru: 92, santriAbsen: 38, guruAbsen: 19 },
    { tanggal: '22/09', hadirSantri: stats.percentSantri, hadirGuru: stats.percentGuru, santriAbsen: stats.hadirSantri, guruAbsen: stats.hadirGuru }
  ];

  return (
    <div 
      className="min-h-screen bg-[#03140c] bg-cover bg-center text-[#f3e5ab] flex flex-col md:flex-row transition-all duration-300"
      style={settings.background_url ? { backgroundImage: `linear-gradient(rgba(3, 20, 12, 0.94), rgba(3, 20, 12, 0.97)), url(${settings.background_url})` } : undefined}
    >
      {/* SIDEBAR */}
      <aside className="build-sidebar w-full md:w-72 bg-[#052216]/95 border-r border-[#d4af37]/30 p-5 flex flex-col justify-between shrink-0 shadow-2xl backdrop-blur-md">
        <div className="space-y-6">
          {/* Logo & Header */}
          <div className="flex flex-col gap-3 pb-4 border-b border-[#d4af37]/20">
            <BrandLogos settings={settings} size="sm" gap="gap-2.5" idPrefix="admin-header" />
            <div className="overflow-hidden">
              <h2 className="font-bold text-sm text-[#d4af37] truncate uppercase tracking-wider font-serif">
                {settings.nama_pondok}
              </h2>
              <p className="text-[10px] text-emerald-300 truncate">
                {settings.nama_madrasah}
              </p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard Utama', icon: Users },
              { id: 'kalender', label: 'Kalender Akademik', icon: Calendar, badge: 'Agenda' },
              { id: 'ujian-kitab', label: 'Ujian Muhafadzoh & Kitab', icon: Award },
              { id: 'absensi-santri', label: settings.text_absensi_santri_title || 'Absensi Santri', icon: UserCheck },
              { id: 'absensi-guru', label: settings.text_absensi_guru_title || 'Absensi Ustadz / Guru', icon: Clock },
              { id: 'jadwal', label: settings.text_jadwal_title || 'Jadwal Pelajaran', icon: Calendar },
              { id: 'guru', label: settings.text_guru_title || 'Data Guru Pengajar', icon: Award },
              { id: 'santri', label: settings.text_santri_title || 'Data Santri & Foto', icon: Users },
              { id: 'nadzhom', label: 'Setoran Nadzhom', icon: BookOpen },
              { id: 'nilai', label: 'Nilai Ujian', icon: Award },
              { id: 'pengaturan', label: 'Option Panel (Pusat Kontrol)', icon: Sliders, badge: 'Password' }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl font-semibold text-xs flex items-center justify-between transition ${
                    isActive 
                      ? 'bg-[#d4af37]/20 text-white border-l-4 border-[#d4af37] shadow-md' 
                      : 'text-[#f3e5ab]/80 hover:bg-[#d4af37]/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#d4af37]' : 'text-emerald-400'}`} />
                    <span className="truncate">{tab.label}</span>
                  </div>
                  {tab.badge && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#0b422a] border border-[#d4af37]/40 text-[#d4af37] font-mono">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sync & Logout */}
        <div className="pt-4 border-t border-[#d4af37]/20 space-y-3">
          {settings.show_quick_sync_button !== false && (
            <button
              onClick={onSyncWithSheets}
              disabled={isSyncing}
              style={{ color: settings.btn_sync_sheets_color || '#d4af37' }}
              className="w-full py-2.5 px-3 rounded-xl btn-3d-dark text-xs font-bold flex items-center justify-center space-x-2 border border-[#d4af37]/40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sinkronisasi Sheets...' : (settings.btn_sync_sheets_text || 'Sinkron Google Sheets')}</span>
            </button>
          )}

          <button
            onClick={onLogout}
            className="w-full py-2.5 px-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs font-bold flex items-center justify-center space-x-2 hover:bg-red-900 transition shadow"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Admin</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6">
        {/* Top Header - 3D Luxury Beveled Banner (Semua Teks Bisa Diatur via Option Panel) */}
        <header className="build-header header-3d-banner rounded-2xl p-5 backdrop-blur flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold font-serif text-[#d4af37] text-gold-3d tracking-wide">
              {settings.header_title || settings.judul_aplikasi || 'SIM Pondok Pesantren Salaf Al-Maliki'}
            </h1>
            <p className="text-xs text-emerald-200/90 mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
              <span>{settings.header_subtitle || settings.login_subtitle || 'Sistem Informasi & Manajemen Santri Madrasah Diniyah Salafiyah'}</span>
            </p>
          </div>

          <div className="flex items-center space-x-3 text-right">
            <button
              onClick={() => setActiveTab('pengaturan')}
              className="btn-3d-gold px-4 py-2 rounded-xl text-black font-extrabold text-xs flex items-center gap-2"
            >
              <Sliders className="w-3.5 h-3.5 text-black" />
              <span>Buka Option Panel</span>
            </button>
          </div>
        </header>

        {/* TAB 1: DASHBOARD UTAMA DENGAN RECHARTS & BERITA TERKINI */}
        {activeTab === 'dashboard' && (
          <div className="build-sequence space-y-6">
            {/* SLOT LAYAR BERITA TERKINI & CAPTION BERGERAK SENDIRI (MARQUEE) */}
            <div className="card-3d-glass rounded-3xl overflow-hidden border border-[#d4af37]/40 shadow-2xl relative">
              <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#f5e298]/80 to-transparent pointer-events-none z-10" />
              
              {/* Berita Terkini Layout: Layar Visual & Deskripsi */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
                <div className="md:col-span-5 relative h-48 sm:h-56 md:h-auto min-h-[190px] overflow-hidden group">
                  <img
                    src={settings.berita_image_url || 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=1200&auto=format&fit=crop&q=80'}
                    alt="Berita Terkini Pondok"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    onError={(e) => {
                      (e.target as HTMLElement).setAttribute('src', 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80');
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/80 via-black/40 to-transparent flex items-end p-4">
                    <span className="px-3 py-1 rounded-full bg-[#d4af37] text-black font-black text-[10px] tracking-wider uppercase shadow-lg border border-[#f5e298]">
                      Layar Berita Terkini
                    </span>
                  </div>
                </div>

                <div className="md:col-span-7 p-5 sm:p-6 flex flex-col justify-between space-y-3 bg-[#031c12]/80 backdrop-blur-md">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Newspaper className="w-3.5 h-3.5 text-[#d4af37]" />
                        <span>Kabar Madrasah & Diniyah</span>
                      </span>
                      <button
                        onClick={() => { setActiveTab('pengaturan'); setActiveControlSection('kustom_tulisan' as any); }}
                        className="text-[10px] text-[#d4af37] hover:underline flex items-center gap-1"
                      >
                        <Settings2 className="w-3 h-3" />
                        <span>Edit via Option Panel</span>
                      </button>
                    </div>
                    <h2 className="text-base sm:text-lg font-extrabold text-white text-gold-3d leading-snug">
                      {settings.berita_title || 'Evaluasi Perkembangan Pembelajaran & Nadzhom Santri'}
                    </h2>
                    <p className="text-xs text-emerald-200/90 mt-2 leading-relaxed">
                      {settings.berita_deskripsi || 'Musyawaroh kubro dan ujian semester santri madrasah diniyah salafiyah terjadwal pekan depan. Seluruh asatidz dan wali santri dimohon memantau perkembangan hafalan nadzhom dan kedisiplinan presensi.'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#d4af37]/20 flex items-center justify-between text-[11px] text-[#f3e5ab]">
                    <span className="font-semibold text-emerald-300">Pondok Pesantren Salaf Al-Maliki</span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30">
                      Terbit Hari Ini
                    </span>
                  </div>
                </div>
              </div>

              {/* PITA CAPTION BERGERAK SENDIRI SECARA OTOMATIS (RUNNING TEXT / MARQUEE) */}
              <div className="bg-[#02130b] border-t border-[#d4af37]/40 py-2.5 px-4 flex items-center gap-3 overflow-hidden shadow-inner">
                <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-950/90 border border-red-500/60 text-red-200 font-extrabold text-[10px] tracking-wider uppercase shadow">
                  <Megaphone className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
                  <span>Maklumat:</span>
                </div>
                <div className="overflow-hidden relative w-full flex items-center">
                  <div className="inline-block whitespace-nowrap animate-marquee font-medium text-xs text-[#f5e298] tracking-wide hover:[animation-play-state:paused] cursor-default">
                    {settings.running_text_caption || '📢 MAKLUMAT PONDOK: Seluruh asatidz dan santri wajib menghadiri pembacaan Rotibul Haddad ba\'da Maghrib • Ujian Khitobah & Qiroatul Kutub dilaksanakan hari Ahad depan • Harap seluruh absensi divalidasi tepat waktu melalui Option Panel.'}
                  </div>
                </div>
              </div>
            </div>

            {/* 4 Main Stat Cards - 3D Beveled Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card-3d p-5 rounded-2xl border-t-2 border-t-emerald-400">
                <span className="text-xs text-emerald-300 font-extrabold uppercase tracking-wider">KEHADIRAN SANTRI</span>
                <div className="text-3xl font-extrabold text-emerald-400 mt-1 font-mono">{stats.percentSantri}%</div>
                <p className="text-[10px] text-emerald-200/80 mt-1">Persentase Tingkat Kehadiran Harian</p>
              </div>

              <div className="card-3d p-5 rounded-2xl border-t-2 border-t-amber-400">
                <span className="text-xs text-emerald-300 font-extrabold uppercase tracking-wider">KEHADIRAN USTADZ/AH</span>
                <div className="text-3xl font-extrabold text-amber-300 mt-1 font-mono">{stats.percentGuru}%</div>
                <p className="text-[10px] text-emerald-200/80 mt-1">Kehadiran Pengajar di Madrasah</p>
              </div>

              <div className="card-3d p-5 rounded-2xl border-t-2 border-t-[#d4af37]">
                <span className="text-xs text-emerald-300 font-extrabold uppercase tracking-wider">TOTAL SANTRI</span>
                <div className="text-3xl font-extrabold text-[#d4af37] text-gold-3d mt-1 font-mono">{stats.totalSantri}</div>
                <p className="text-[10px] text-emerald-200/80 mt-1">Terdaftar Dalam Google Sheets</p>
              </div>

              <div className="card-3d p-5 rounded-2xl border-t-2 border-t-blue-400">
                <span className="text-xs text-emerald-300 font-extrabold uppercase tracking-wider">TOTAL GURU & USTADZ</span>
                <div className="text-3xl font-extrabold text-blue-300 mt-1 font-mono">{stats.totalGuru}</div>
                <p className="text-[10px] text-emerald-200/80 mt-1">Pengajar Tsanawiyah & Aliyah</p>
              </div>
            </div>

            {/* Sub Metrics Grid - 3D Micro Chips */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
              <div className="card-3d-deep p-3 rounded-xl text-center">
                <div className="text-[10px] font-bold text-emerald-300">HADIR SANTRI</div>
                <div className="text-lg font-bold text-emerald-400 mt-0.5 font-mono">{stats.hadirSantri}</div>
              </div>
              <div className="card-3d-deep p-3 rounded-xl text-center">
                <div className="text-[10px] font-bold text-emerald-300">IZIN SANTRI</div>
                <div className="text-lg font-bold text-amber-300 mt-0.5 font-mono">{stats.izinSantri}</div>
              </div>
              <div className="card-3d-deep p-3 rounded-xl text-center">
                <div className="text-[10px] font-bold text-emerald-300">SAKIT SANTRI</div>
                <div className="text-lg font-bold text-blue-300 mt-0.5 font-mono">{stats.sakitSantri}</div>
              </div>
              <div className="card-3d-deep p-3 rounded-xl text-center">
                <div className="text-[10px] font-bold text-emerald-300">ALPHA SANTRI</div>
                <div className="text-lg font-bold text-red-400 mt-0.5 font-mono">{stats.alphaSantri}</div>
              </div>
              <div className="card-3d-deep p-3 rounded-xl text-center">
                <div className="text-[10px] font-bold text-emerald-300">HADIR GURU</div>
                <div className="text-lg font-bold text-emerald-400 mt-0.5 font-mono">{stats.hadirGuru}</div>
              </div>
              <div className="card-3d-deep p-3 rounded-xl text-center">
                <div className="text-[10px] font-bold text-emerald-300">TERLAMBAT GURU</div>
                <div className="text-lg font-bold text-orange-300 mt-0.5 font-mono">{stats.terlambatGuru}</div>
              </div>
              <div className="card-3d-deep p-3 rounded-xl text-center">
                <div className="text-[10px] font-bold text-emerald-300">IZIN GURU</div>
                <div className="text-lg font-bold text-amber-300 mt-0.5 font-mono">{stats.izinGuru}</div>
              </div>
              <div className="card-3d-deep p-3 rounded-xl text-center">
                <div className="text-[10px] font-bold text-emerald-300">ALPHA GURU</div>
                <div className="text-lg font-bold text-red-400 mt-0.5 font-mono">{stats.alphaGuru}</div>
              </div>
            </div>

            {/* INTEGRASI KOMPONEN RECHARTS: GRAFIK TREN */}
            {/* Grafis Tren & Komparasi Recharts - 3D Luxury Glass Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* AreaChart Glass Card */}
              <div className="card-3d-glass p-6 sm:p-7 rounded-3xl lg:col-span-2 overflow-hidden relative group">
                {/* 3D Specular Light Rim & Ambient Glow Accents */}
                <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#f5e298]/70 to-transparent pointer-events-none" />
                <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#d4af37]/12 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-center justify-between mb-4 pb-3.5 border-b border-[#d4af37]/25 relative z-10">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-[#114b32] to-[#072418] border border-[#d4af37]/50 flex items-center justify-center text-[#d4af37] shadow-[0_4px_12px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,235,170,0.4)]">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-white text-gold-3d tracking-wide">
                        Grafik Tren Persentase Kehadiran Guru & Santri
                      </h3>
                      <p className="text-[11px] text-emerald-300 font-medium">
                        Visualisasi analitik performa kehadiran 7 hari terakhir (Komponen Recharts 3D)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-gradient-to-b from-[#0a3523] to-[#041a11] border border-[#d4af37]/45 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6),0_2px_8px_rgba(212,175,55,0.15)]">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                    <span className="text-[11px] font-mono font-bold text-[#f3e5ab] tracking-wider uppercase">
                      Live Dynamic
                    </span>
                  </div>
                </div>

                <div className="h-72 w-full relative z-10">
                  <div className="chart-3d-grid" />
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 12, right: 12, left: -20, bottom: 0 }}>
                      <defs>
                        {/* Glow Filter for High-End 3D Lines */}
                        <filter id="glowSantriLine" x="-20%" y="-20%" width="140%" height="140%">
                          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#34d399" floodOpacity="0.75" />
                        </filter>
                        <filter id="glowGuruLine" x="-20%" y="-20%" width="140%" height="140%">
                          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#38bdf8" floodOpacity="0.75" />
                        </filter>
                        <linearGradient id="colorSantri" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#22c55e" stopOpacity={0.7} />
                          <stop offset="60%" stopColor="#15803d" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="#052e16" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="colorGuru" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.7} />
                          <stop offset="60%" stopColor="#0284c7" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="#082f49" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(243,229,171,0.09)" vertical={false} />
                      <XAxis dataKey="tanggal" stroke="#f3e5ab" fontSize={11} tickLine={false} axisLine={{ stroke: 'rgba(212,175,55,0.25)' }} />
                      <YAxis stroke="#f3e5ab" fontSize={11} domain={[70, 100]} unit="%" tickLine={false} axisLine={{ stroke: 'rgba(212,175,55,0.25)' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(5, 30, 20, 0.94)', 
                          backdropFilter: 'blur(16px)', 
                          WebkitBackdropFilter: 'blur(16px)',
                          border: '1px solid rgba(212, 175, 55, 0.55)', 
                          borderRadius: '16px', 
                          color: '#ffffff', 
                          fontSize: '12px',
                          boxShadow: '0 16px 36px rgba(0, 0, 0, 0.85), 0 0 25px rgba(212, 175, 55, 0.25), inset 0 1px 1.5px rgba(255, 240, 180, 0.45)',
                          padding: '12px 16px'
                        }}
                        itemStyle={{ color: '#ffffff', fontWeight: 600, padding: '2px 0' }}
                        labelStyle={{ color: '#d4af37', fontWeight: 700, marginBottom: '6px', borderBottom: '1px solid rgba(212, 175, 55, 0.2)', paddingBottom: '4px' }}
                        formatter={(value: any, name: any) => [`${value}%`, name]}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: '12px', fontSize: '12px', fontWeight: 600 }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="hadirSantri" 
                        name="Kehadiran Santri (%)" 
                        stroke="#22c55e" 
                        strokeWidth={3}
                        filter="url(#glowSantriLine)"
                        fillOpacity={1} 
                        fill="url(#colorSantri)" 
                        activeDot={{ r: 6, stroke: '#d4af37', strokeWidth: 2, fill: '#22c55e' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="hadirGuru" 
                        name="Kehadiran Guru/Ustadz (%)" 
                        stroke="#38bdf8" 
                        strokeWidth={3}
                        filter="url(#glowGuruLine)"
                        fillOpacity={1} 
                        fill="url(#colorGuru)" 
                        activeDot={{ r: 6, stroke: '#d4af37', strokeWidth: 2, fill: '#38bdf8' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* BarChart Glass Card */}
              <div className="card-3d-glass p-6 sm:p-7 rounded-3xl space-y-4 flex flex-col justify-between overflow-hidden relative group">
                {/* 3D Specular Light Rim & Ambient Glow Accents */}
                <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#f5e298]/70 to-transparent pointer-events-none" />
                <div className="absolute -top-14 -left-14 w-40 h-40 bg-[#d4af37]/12 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-14 -right-14 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10">
                  <div className="flex items-center space-x-3 mb-2 pb-2.5 border-b border-[#d4af37]/25">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-[#114b32] to-[#072418] border border-[#d4af37]/50 flex items-center justify-center text-[#d4af37] shadow-[0_4px_12px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,235,170,0.4)]">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-white text-gold-3d tracking-wide">Distribusi Absensi Hari Ini</h3>
                      <p className="text-[11px] text-emerald-300 font-medium">Komparasi status Santri vs Ustadz</p>
                    </div>
                  </div>
                </div>

                <div className="h-56 w-full relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: 'Hadir', Santri: stats.hadirSantri || 38, Guru: stats.hadirGuru || 18 },
                        { name: 'Izin', Santri: stats.izinSantri || 1, Guru: stats.izinGuru || 1 },
                        { name: 'Telat/Skt', Santri: stats.sakitSantri || 1, Guru: stats.terlambatGuru || 1 },
                        { name: 'Alpha', Santri: stats.alphaSantri || 0, Guru: stats.alphaGuru || 0 }
                      ]}
                      margin={{ top: 8, right: 10, left: -25, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="barGradientSantri" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#34d399" />
                          <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                        <linearGradient id="barGradientGuru" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#fde047" />
                          <stop offset="100%" stopColor="#d4af37" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(243,229,171,0.07)" vertical={false} />
                      <XAxis dataKey="name" stroke="#f3e5ab" fontSize={10} tickLine={false} axisLine={{ stroke: 'rgba(212,175,55,0.2)' }} />
                      <YAxis stroke="#f3e5ab" fontSize={10} tickLine={false} axisLine={{ stroke: 'rgba(212,175,55,0.2)' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(5, 30, 20, 0.94)', 
                          backdropFilter: 'blur(16px)', 
                          WebkitBackdropFilter: 'blur(16px)',
                          border: '1px solid rgba(212, 175, 55, 0.55)', 
                          borderRadius: '16px', 
                          color: '#ffffff', 
                          fontSize: '11px',
                          boxShadow: '0 16px 36px rgba(0, 0, 0, 0.85), 0 0 20px rgba(212, 175, 55, 0.25), inset 0 1px 1.5px rgba(255, 240, 180, 0.45)',
                          padding: '10px 14px'
                        }}
                        itemStyle={{ color: '#ffffff', fontWeight: 600 }}
                        labelStyle={{ color: '#d4af37', fontWeight: 700, marginBottom: '4px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                      <Bar dataKey="Santri" fill="url(#barGradientSantri)" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Guru" fill="url(#barGradientGuru)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="card-3d-deep p-3.5 rounded-2xl text-[11px] flex justify-between items-center text-emerald-200 relative z-10 border border-[#d4af37]/35">
                  <span className="font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]" />
                    <span>Persentase Hadir Total:</span>
                  </span>
                  <span className="font-extrabold text-[#d4af37] text-gold-3d font-mono text-sm px-2.5 py-0.5 rounded-lg bg-[#041d13] border border-[#d4af37]/30 shadow-inner">
                    {Math.round(((stats.percentSantri || 0) + (stats.percentGuru || 0)) / 2)}%
                  </span>
                </div>
              </div>
            </div>

            {/* PIE CHART VISUALISASI PERSENTASE KEHADIRAN (SANTRI & USTADZ) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pie Chart 1: Santri */}
              <div className="card-3d-glass p-6 rounded-3xl space-y-3 relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#f5e298]/70 to-transparent pointer-events-none" />
                <div className="flex items-center space-x-3 pb-3 border-b border-[#d4af37]/20">
                  <div className="w-8 h-8 rounded-lg bg-[#0b3824] border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] shadow">
                    <PieChartIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white text-gold-3d">Komposisi Presensi Santri (%)</h3>
                    <p className="text-[11px] text-emerald-300">Persentase proporsi Hadir, Izin, Sakit, & Alpha</p>
                  </div>
                </div>

                <div className="w-full relative flex justify-center py-2">
                  <Donut3D
                    unitLabel="Santri"
                    data={[
                      { name: 'Hadir', value: stats.hadirSantri || 38, fill: '#10b981' },
                      { name: 'Izin', value: stats.izinSantri || 1, fill: '#f59e0b' },
                      { name: 'Sakit', value: stats.sakitSantri || 1, fill: '#3b82f6' },
                      { name: 'Alpha', value: stats.alphaSantri || 0, fill: '#ef4444' }
                    ]}
                  />
                </div>
              </div>

              {/* Pie Chart 2: Guru / Ustadz */}
              <div className="card-3d-glass p-6 rounded-3xl space-y-3 relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#f5e298]/70 to-transparent pointer-events-none" />
                <div className="flex items-center space-x-3 pb-3 border-b border-[#d4af37]/20">
                  <div className="w-8 h-8 rounded-lg bg-[#0b3824] border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] shadow">
                    <PieChartIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white text-gold-3d">Komposisi Presensi Ustadz / Guru (%)</h3>
                    <p className="text-[11px] text-emerald-300">Persentase proporsi Hadir, Terlambat, Izin, & Alpha</p>
                  </div>
                </div>

                <div className="w-full relative flex justify-center py-2">
                  <Donut3D
                    unitLabel="Pengajar"
                    data={[
                      { name: 'Hadir', value: stats.hadirGuru || 18, fill: '#10b981' },
                      { name: 'Terlambat', value: stats.terlambatGuru || 1, fill: '#f97316' },
                      { name: 'Izin', value: stats.izinGuru || 1, fill: '#f59e0b' },
                      { name: 'Alpha', value: stats.alphaGuru || 0, fill: '#ef4444' }
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 1. PANEL PERSETUJUAN PERIZINAN TIDAK MENGAJAR USTADZ (REAL-TIME)          */}
            {/* ========================================================================= */}
            <div className="card-3d rounded-3xl p-6 border-2 border-amber-500/50 bg-gradient-to-r from-[#170e04] via-[#241706] to-[#170e04] shadow-2xl space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-amber-500/30">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/60 flex items-center justify-center text-amber-300 shadow">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-white text-gold-3d flex items-center gap-2">
                      <span>Persetujuan Izin Tidak Mengajar Ustadz / Ustadzah</span>
                      {izinList.filter(i => i.status === 'Menunggu').length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black font-mono font-black text-[10px] animate-pulse">
                          {izinList.filter(i => i.status === 'Menunggu').length} Menunggu Persetujuan
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-amber-200/90 mt-0.5">
                      Ketika Admin menyetujui permohonan, status kehadiran pada Absensi Ustadz/Ustadzah langsung menjadi <b>IZIN</b> dan di sebelahnya tercantum nama <b>Ustadz Penggantinya</b> secara otomatis.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-amber-300 font-mono">
                    Total Pengajuan: {izinList.length}
                  </span>
                </div>
              </div>

              {/* Tabel Permohonan Izin yang Masuk */}
              <div className="overflow-x-auto rounded-2xl border border-amber-500/30 bg-[#070502]/80">
                <table className="w-full text-xs text-left min-w-[780px]">
                  <thead className="bg-[#1a1207] text-amber-300 border-b border-amber-500/30">
                    <tr>
                      <th className="p-3">Tanggal & Jam</th>
                      <th className="p-3">Nama Ustadz / Ustadzah</th>
                      <th className="p-3">Mapel & Kelas</th>
                      <th className="p-3">Alasan Tidak Mengajar</th>
                      <th className="p-3">Usulan / Tetapkan Ustadz Pengganti</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-center">Aksi Persetujuan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-500/20">
                    {izinList.length > 0 ? (
                      izinList.map(item => {
                        const currentPengganti = penggantiSelected[item.id] || item.ustadzPengganti || guruList[0]?.nama || 'Ust. M. Rizqi Fadlillah, S.Pd.';
                        return (
                          <tr key={item.id} className="hover:bg-amber-500/10 transition">
                            <td className="p-3 font-mono font-bold text-emerald-300 whitespace-nowrap">
                              {item.tanggal}
                              <span className="text-[10px] text-amber-200/70 block">Jam Ke-{item.jamKe || 1}</span>
                            </td>
                            <td className="p-3 font-extrabold text-white">
                              {item.namaUstadz}
                            </td>
                            <td className="p-3">
                              <span className="font-bold text-white block">{item.mapel}</span>
                              <span className="text-[10px] text-[#d4af37] font-mono">{item.kelas}</span>
                            </td>
                            <td className="p-3 text-slate-200 max-w-[200px] leading-relaxed">
                              {item.alasan}
                            </td>
                            <td className="p-3">
                              {item.status === 'Menunggu' ? (
                                <div className="space-y-1">
                                  <select
                                    value={currentPengganti}
                                    onChange={(e) => setPenggantiSelected({ ...penggantiSelected, [item.id]: e.target.value })}
                                    className="w-full bg-[#120b02] border border-amber-500/50 rounded-lg p-1.5 text-xs text-amber-200 font-bold"
                                  >
                                    {guruList.map((g, i) => (
                                      <option key={i} value={g.nama}>{g.nama} ({g.mapel})</option>
                                    ))}
                                  </select>
                                  <span className="text-[9px] text-amber-300/80 block">
                                    Usulan: {item.ustadzPengganti || '-'}
                                  </span>
                                </div>
                              ) : (
                                <div className="font-bold text-amber-300">
                                  {item.ustadzPengganti || '-'}
                                </div>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                                item.status === 'Disetujui' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50' :
                                item.status === 'Ditolak' ? 'bg-red-500/20 text-red-300 border border-red-500/50' :
                                'bg-amber-500/20 text-amber-300 border border-amber-500/50 animate-pulse'
                              }`}>
                                {item.status === 'Disetujui' && <Check className="w-3 h-3" />}
                                {item.status === 'Ditolak' && <X className="w-3 h-3" />}
                                {item.status === 'Menunggu' && <Clock className="w-3 h-3" />}
                                <span>{item.status}</span>
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              {item.status === 'Menunggu' ? (
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => {
                                      if (onApproveIzinMengajar) {
                                        onApproveIzinMengajar(item.id, currentPengganti, 'Disetujui', `Disetujui Admin. Digantikan oleh ${currentPengganti}`);
                                        alert(`Izin tidak mengajar ${item.namaUstadz} telah DISETUJUI! Status kehadiran langsung menjadi IZIN dan Ustadz Pengganti: ${currentPengganti} telah dicatat.`);
                                      }
                                    }}
                                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] rounded-lg shadow transition flex items-center gap-1"
                                    title="Setujui Izin & Catat Ustadz Pengganti"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>Setujui</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (onApproveIzinMengajar) {
                                        onApproveIzinMengajar(item.id, currentPengganti, 'Ditolak', 'Permohonan izin tidak disetujui Admin.');
                                        alert(`Permohonan izin ${item.namaUstadz} telah ditolak.`);
                                      }
                                    }}
                                    className="px-2.5 py-1 bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-300 font-bold text-[11px] rounded-lg transition"
                                  >
                                    Tolak
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400 font-mono">
                                  {item.catatanAdmin || 'Selesai diproses'}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-400">
                          Belum ada permohonan izin tidak mengajar dari ustadz/ustadzah.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 2. REKAPAN BULANAN TABEL KEHADIRAN SANTRI & GURU + CETAK PDF, WORD, SHEETS */}
            {/* ========================================================================= */}
            <div className="card-3d rounded-3xl p-6 border border-[#d4af37]/40 space-y-5 bg-[#03190f]">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-[#d4af37]/25">
                <div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-[#d4af37]" />
                    <h3 className="text-base sm:text-lg font-black text-white text-gold-3d">
                      Rekapan Bulanan Kehadiran Santri & Guru (Tanggal 1 s/d 30)
                    </h3>
                  </div>
                  <p className="text-xs text-emerald-200 mt-1">
                    Tabel akumulasi kehadiran santri dan ustadz pengajar satu bulan penuh dengan fitur ekspor multi-format resmi.
                  </p>
                </div>

                {/* Tab Switcher & Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex bg-[#042013] border border-[#d4af37]/40 rounded-xl p-1">
                    <button
                      onClick={() => setDashboardRekapTab('santri')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        dashboardRekapTab === 'santri' ? 'bg-[#d4af37] text-black shadow' : 'text-emerald-200 hover:text-white'
                      }`}
                    >
                      Rekapan Santri
                    </button>
                    <button
                      onClick={() => setDashboardRekapTab('guru')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        dashboardRekapTab === 'guru' ? 'bg-[#d4af37] text-black shadow' : 'text-emerald-200 hover:text-white'
                      }`}
                    >
                      Rekapan Ustadz/Guru
                    </button>
                  </div>

                  {/* Export Buttons: PDF, Word, Spreadsheet */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={printTable}
                      className="px-3 py-2 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 font-bold text-xs flex items-center gap-1 hover:bg-emerald-900 transition shadow"
                      title="Cetak Dokumen atau Simpan PDF"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak PDF</span>
                    </button>

                    <button
                      onClick={() => {
                        if (dashboardRekapTab === 'santri') {
                          const headers = ['NO', 'NIS', 'NAMA SANTRI', 'KELAS', 'HADIR (1-30)', 'IZIN', 'SAKIT', 'ALPHA', 'PERSENTASE (%)', 'KETERANGAN'];
                          const rows = rekapBulananSantri.map((s, idx) => [idx + 1, s.id, s.nama, s.kelas, s.hadir, s.izin, s.sakit, s.alpha, `${s.persentase}%`, s.keterangan]);
                          downloadCSV(`Rekap_Bulanan_Santri_${selectedBulanSantri.replace(' ', '_')}`, headers, rows);
                        } else {
                          const headers = ['NO', 'NAMA USTADZ', 'MAPEL', 'KELAS', 'TOTAL SESI', 'HADIR', 'IZIN', 'SAKIT/TELAT', 'ALPHA', 'PERSENTASE (%)', 'PREDIKAT'];
                          const rows = rekapBulananGuru.map((g, idx) => [idx + 1, g.nama, g.mapel, g.kelas, g.totalSesi, g.hadir, g.izin, g.sakitTelat, g.alpha, `${g.persentase}%`, g.predikat]);
                          downloadCSV(`Rekap_Bulanan_Guru_${selectedBulanGuru.replace(' ', '_')}`, headers, rows);
                        }
                      }}
                      className="px-3 py-2 rounded-xl bg-[#093d25] border border-[#d4af37]/50 text-[#f3e5ab] font-bold text-xs flex items-center gap-1 hover:bg-[#0c4e30] transition shadow"
                      title="Unduh format Google Spreadsheet / CSV"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Google Spreadsheet</span>
                    </button>

                    <button
                      onClick={() => {
                        if (dashboardRekapTab === 'santri') {
                          const headers = ['NO', 'NIS', 'NAMA SANTRI', 'KELAS', 'HADIR (TGL 1-30)', 'IZIN', 'SAKIT', 'ALPHA', 'PERSENTASE', 'KETERANGAN'];
                          const rows = rekapBulananSantri.map((s, idx) => [idx + 1, s.id, s.nama, s.kelas, `${s.hadir} kali`, `${s.izin} kali`, `${s.sakit} kali`, `${s.alpha} kali`, `${s.persentase}%`, s.keterangan]);
                          downloadWord(`Rekap_Bulanan_Santri_${selectedBulanSantri.replace(' ', '_')}`, `REKAPITULASI KEHADIRAN SANTRI BULANAN (${selectedBulanSantri.toUpperCase()})`, headers, rows);
                        } else {
                          const headers = ['NO', 'NAMA USTADZ', 'MAPEL', 'KELAS', 'TOTAL SESI', 'HADIR', 'IZIN', 'SAKIT/TELAT', 'ALPHA', 'PERSENTASE', 'PREDIKAT'];
                          const rows = rekapBulananGuru.map((g, idx) => [idx + 1, g.nama, g.mapel, g.kelas, `${g.totalSesi} sesi`, `${g.hadir} kali`, `${g.izin} kali`, `${g.sakitTelat} kali`, `${g.alpha} kali`, `${g.persentase}%`, g.predikat]);
                          downloadWord(`Rekap_Bulanan_Guru_${selectedBulanGuru.replace(' ', '_')}`, `REKAPITULASI KEHADIRAN USTADZ/GURU BULANAN (${selectedBulanGuru.toUpperCase()})`, headers, rows);
                        }
                      }}
                      className="px-3 py-2 rounded-xl bg-blue-950/80 border border-blue-500/50 text-blue-200 font-bold text-xs flex items-center gap-1 hover:bg-blue-900 transition shadow"
                      title="Unduh Dokumen Microsoft Word"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Word (.doc)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Tampilan Tabel Rekap Santri */}
              {dashboardRekapTab === 'santri' && (
                <div className="overflow-x-auto rounded-2xl border border-[#d4af37]/25">
                  <table className="w-full text-xs text-left min-w-[760px]">
                    <thead className="bg-[#042013] text-[#d4af37]">
                      <tr>
                        <th className="p-3 w-12 text-center">NO</th>
                        <th className="p-3 w-28">NIS</th>
                        <th className="p-3">NAMA SANTRI</th>
                        <th className="p-3 w-32">ANGKATAN / KELAS</th>
                        <th className="p-3 w-28 text-center text-emerald-300 bg-emerald-950/40">HADIR (1-30)</th>
                        <th className="p-3 w-20 text-center text-amber-300 bg-amber-950/30">IZIN</th>
                        <th className="p-3 w-20 text-center text-blue-300 bg-blue-950/30">SAKIT</th>
                        <th className="p-3 w-20 text-center text-red-300 bg-red-950/30">ALPHA</th>
                        <th className="p-3 w-28 text-center text-[#d4af37]">PERSENTASE</th>
                        <th className="p-3 w-28 text-center">EVALUASI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#d4af37]/10 bg-[#02130b]">
                      {rekapBulananSantri.map((s, idx) => (
                        <tr key={s.id} className="hover:bg-[#d4af37]/5 transition">
                          <td className="p-3 text-center text-emerald-300 font-mono">{idx + 1}</td>
                          <td className="p-3 font-mono text-[#d4af37] font-bold">{s.id}</td>
                          <td className="p-3 font-bold text-white">{s.nama}</td>
                          <td className="p-3 text-emerald-200">{s.kelas}</td>
                          <td className="p-3 text-center font-mono font-bold text-emerald-400 bg-emerald-950/20">{s.hadir} kali</td>
                          <td className="p-3 text-center font-mono text-amber-300 bg-amber-950/20">{s.izin} kali</td>
                          <td className="p-3 text-center font-mono text-blue-300 bg-blue-950/20">{s.sakit} kali</td>
                          <td className="p-3 text-center font-mono text-red-400 bg-red-950/20">{s.alpha} kali</td>
                          <td className="p-3 text-center font-mono font-extrabold text-[#d4af37] text-gold-3d">{s.persentase}%</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              s.persentase >= 95 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                              s.persentase >= 85 ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' :
                              'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            }`}>
                              {s.keterangan}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tampilan Tabel Rekap Guru */}
              {dashboardRekapTab === 'guru' && (
                <div className="overflow-x-auto rounded-2xl border border-[#d4af37]/25">
                  <table className="w-full text-xs text-left min-w-[780px]">
                    <thead className="bg-[#042013] text-[#d4af37]">
                      <tr>
                        <th className="p-3 w-12 text-center">NO</th>
                        <th className="p-3">NAMA USTADZ / USTADZAH</th>
                        <th className="p-3">MATA PELAJARAN</th>
                        <th className="p-3 w-32">ANGKATAN</th>
                        <th className="p-3 w-28 text-center text-emerald-300 bg-emerald-950/40">HADIR (1-30)</th>
                        <th className="p-3 w-20 text-center text-amber-300 bg-amber-950/30">IZIN</th>
                        <th className="p-3 w-24 text-center text-orange-300 bg-orange-950/30">SAKIT/TELAT</th>
                        <th className="p-3 w-20 text-center text-red-300 bg-red-950/30">ALPHA</th>
                        <th className="p-3 w-28 text-center text-[#d4af37]">PERSENTASE</th>
                        <th className="p-3 w-28 text-center">PREDIKAT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#d4af37]/10 bg-[#02130b]">
                      {rekapBulananGuru.map((g, idx) => (
                        <tr key={idx} className="hover:bg-[#d4af37]/5 transition">
                          <td className="p-3 text-center text-emerald-300 font-mono">{idx + 1}</td>
                          <td className="p-3 font-bold text-white">{g.nama}</td>
                          <td className="p-3 text-emerald-200">{g.mapel}</td>
                          <td className="p-3 text-[#d4af37] font-semibold">{g.kelas}</td>
                          <td className="p-3 text-center font-mono font-bold text-emerald-400 bg-emerald-950/20">{g.hadir} kali</td>
                          <td className="p-3 text-center font-mono text-amber-300 bg-amber-950/20">{g.izin} kali</td>
                          <td className="p-3 text-center font-mono text-orange-300 bg-orange-950/20">{g.sakitTelat} kali</td>
                          <td className="p-3 text-center font-mono text-red-400 bg-red-950/20">{g.alpha} kali</td>
                          <td className="p-3 text-center font-mono font-extrabold text-[#d4af37] text-gold-3d">{g.persentase}%</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              g.persentase >= 95 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                              g.persentase >= 85 ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' :
                              'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            }`}>
                              {g.predikat}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ========================================================================= */}
            {/* 3. FITUR KALENDER AKADEMIK (BISA DI-EDIT DI OPTION PANEL)                  */}
            {/* ========================================================================= */}
            <div className="card-3d rounded-3xl p-6 border border-[#d4af37]/30 space-y-4 bg-[#03150d]">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-[#d4af37]/20">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0b3824] border border-[#d4af37]/50 flex items-center justify-center text-[#d4af37] shadow">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white text-gold-3d">
                      Kalender Akademik & Agenda Madrasah Diniyah
                    </h3>
                    <p className="text-xs text-emerald-200">
                      Seluruh agenda rapat, musyawaroh, dan ujian semester terintegrasi ke Option Panel dan Dashboard Pengurus.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveTab('pengaturan');
                    setActiveControlSection('kelola_kalender');
                  }}
                  className="btn-3d-gold px-4 py-2 rounded-xl text-black font-extrabold text-xs flex items-center gap-1.5 shadow"
                >
                  <Sliders className="w-3.5 h-3.5 text-black" />
                  <span>Edit Kalender di Option Panel</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {kalenderList.slice(0, 3).map(evt => (
                  <div key={evt.id} className="card-3d-glass rounded-2xl p-4 border border-[#d4af37]/30 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="px-2 py-0.5 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#d4af37] text-[10px] font-bold uppercase">
                        {evt.kategori}
                      </span>
                      {evt.isUrgentNotif && (
                        <span className="text-[10px] text-red-400 font-bold animate-pulse">🔥 Mendesak</span>
                      )}
                    </div>
                    <h4 className="font-bold text-white text-xs sm:text-sm">{evt.judul}</h4>
                    <p className="text-xs text-slate-300 line-clamp-2">{evt.deskripsi}</p>
                    <div className="pt-2 border-t border-[#d4af37]/15 text-[11px] text-emerald-300 font-mono">
                      📅 {evt.tanggalMulai} {evt.waktu ? `• ${evt.waktu}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 4. FITUR TERKONEKSI LANGSUNG KE DASHBOARD WALI SANTRI & PENGURUS          */}
            {/* ========================================================================= */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="card-3d-glass rounded-3xl p-5 border border-emerald-500/40 space-y-3">
                <div className="flex items-center space-x-3 pb-2 border-b border-emerald-500/30">
                  <div className="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-white text-gold-3d">
                      Terkoneksi Langsung ke Dashboard Wali Santri
                    </h4>
                    <p className="text-[11px] text-emerald-300 font-mono">
                      Status Live Row-Level Security: AKTIF
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Data absensi santri, pembayaran syahriyah bulanan, mutasi uang saku, dan nilai ujian koreksian/muhafadzoh/baca kitab otomatis tersinkronisasi langsung saat diakses wali santri menggunakan NIS.
                </p>
                <div className="flex items-center justify-between pt-1 text-[11px] text-emerald-300 font-mono">
                  <span>{santriList.length} Akun Wali Santri Aktif</span>
                  <span className="text-[#d4af37] font-bold">Sinkronisasi Real Time ⚡</span>
                </div>
              </div>

              <div className="card-3d-glass rounded-3xl p-5 border border-blue-500/40 space-y-3">
                <div className="flex items-center space-x-3 pb-2 border-b border-blue-500/30">
                  <div className="w-9 h-9 rounded-xl bg-blue-950 border border-blue-500/50 flex items-center justify-center text-blue-400">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-white text-gold-3d">
                      Terkoneksi ke Dasbor Pengurus & Wali Kelas
                    </h4>
                    <p className="text-[11px] text-blue-300 font-mono">
                      Status Khidmah & Presensi Terpadu: AKTIF
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Pengurus yang bertindak sebagai Wali Kelas otomatis melihat rekap absensi anak didik dan jadwal pelajaran kelasnya, serta dapat mengajukan izin tidak mengajar dengan penugasan ustadz pengganti secara real time.
                </p>
                <div className="flex items-center justify-between pt-1 text-[11px] text-blue-300 font-mono">
                  <span>{pengurusList.length} Akun Pengurus Terhubung</span>
                  <span className="text-[#d4af37] font-bold">Sinkronisasi Real Time ⚡</span>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 5. UJIAN MUHAFADZOH (JAYYID, MUTAWASIT, RODI, PERINGKAT, CETAK PDF/DOC/CSV)*/}
            {/* ========================================================================= */}
            <div className="card-3d rounded-3xl p-6 border border-[#d4af37]/40 space-y-5 bg-[#031b11]">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-[#d4af37]/25">
                <div>
                  <div className="flex items-center space-x-2">
                    <Award className="w-5 h-5 text-[#d4af37]" />
                    <h3 className="text-base sm:text-lg font-black text-white text-gold-3d">
                      Ujian Muhafadzoh Nadzhom Santri (Per Angkatan & Peringkat)
                    </h3>
                  </div>
                  <p className="text-xs text-emerald-200 mt-1">
                    Evaluasi setoran hafalan matan (Al-Imrithi, Alfiyah, dll.) dipisahkan berdasarkan predikat Jayyid, Mutawasit, dan Rodi per angkatan dari 1 Tsanawiyah s/d 3 Aliyah.
                  </p>
                </div>

                {/* Tombol Ekspor PDF, Word, Spreadsheet untuk Muhafadzoh */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={printTable}
                    className="px-3 py-2 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 font-bold text-xs flex items-center gap-1 hover:bg-emerald-900 transition shadow"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak PDF</span>
                  </button>

                  <button
                    onClick={() => {
                      const headers = ['PERINGKAT', 'NIS', 'NAMA SANTRI', 'ANGKATAN / KELAS', 'KITAB NADZHOM', 'NILAI MUHAFADZOH', 'PREDIKAT EVALUASI', 'USTADZ PENGUJI'];
                      const rows = filteredSantriMuhafadzoh.map((s, idx) => [
                        idx + 1, s.id, s.nama, s.kelas, s.kitabMuhafadzoh || 'Nadzhom Al-Imrithi', s.nilaiMhf, s.predikatMhf, s.ustadzPengujiKitab || 'Ust. Ilyas'
                      ]);
                      downloadCSV(`Data_Ujian_Muhafadzoh_${muhafadzohAngkatan.replace(' ', '_')}`, headers, rows);
                    }}
                    className="px-3 py-2 rounded-xl bg-[#093d25] border border-[#d4af37]/50 text-[#f3e5ab] font-bold text-xs flex items-center gap-1 hover:bg-[#0c4e30] transition shadow"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Spreadsheet (.csv)</span>
                  </button>

                  <button
                    onClick={() => {
                      const headers = ['PERINGKAT', 'NIS', 'NAMA SANTRI', 'ANGKATAN / KELAS', 'KITAB NADZHOM', 'NILAI MUHAFADZOH', 'PREDIKAT EVALUASI', 'USTADZ PENGUJI'];
                      const rows = filteredSantriMuhafadzoh.map((s, idx) => [
                        idx + 1, s.id, s.nama, s.kelas, s.kitabMuhafadzoh || 'Nadzhom Al-Imrithi', s.nilaiMhf, s.predikatMhf, s.ustadzPengujiKitab || 'Ust. Ilyas'
                      ]);
                      downloadWord(
                        `Data_Ujian_Muhafadzoh_${muhafadzohAngkatan.replace(' ', '_')}`,
                        `DATA UJIAN MUHAFADZOH SANTRI (${muhafadzohAngkatan.toUpperCase()}) - TAHUN AJARAN ${muhafadzohYear}`,
                        headers,
                        rows
                      );
                    }}
                    className="px-3 py-2 rounded-xl bg-blue-950/80 border border-blue-500/50 text-blue-200 font-bold text-xs flex items-center gap-1 hover:bg-blue-900 transition shadow"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Word (.doc)</span>
                  </button>
                </div>
              </div>

              {/* 3 STAT KARTU: JAYYID, MUTAWASIT, RODI */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="card-3d-glass rounded-2xl p-4 border-2 border-emerald-500/60 bg-emerald-950/30 text-center space-y-1">
                  <span className="text-xs font-bold text-emerald-300 block uppercase tracking-wider">
                    JAYYID (BAIK SEKALI • NILAI &ge; 85)
                  </span>
                  <div className="text-3xl font-black text-emerald-400 font-mono">{countJayyid}</div>
                  <span className="text-[11px] text-emerald-200/80 block">Santri Lancar & Mutqin</span>
                </div>

                <div className="card-3d-glass rounded-2xl p-4 border-2 border-amber-500/60 bg-amber-950/30 text-center space-y-1">
                  <span className="text-xs font-bold text-amber-300 block uppercase tracking-wider">
                    MUTAWASIT (SEDANG • NILAI 75 - 84)
                  </span>
                  <div className="text-3xl font-black text-amber-400 font-mono">{countMutawasit}</div>
                  <span className="text-[11px] text-amber-200/80 block">Santri Cukup Lancar</span>
                </div>

                <div className="card-3d-glass rounded-2xl p-4 border-2 border-red-500/60 bg-red-950/30 text-center space-y-1">
                  <span className="text-xs font-bold text-red-300 block uppercase tracking-wider">
                    RODI (BELUM BAIK • NILAI &lt; 75)
                  </span>
                  <div className="text-3xl font-black text-red-400 font-mono">{countRodi}</div>
                  <span className="text-[11px] text-red-200/80 block">Santri Perlu Pembinaan Khusus</span>
                </div>
              </div>

              {/* FILTER ANGKATAN & PISAHKAN TABEL SANTRI JAYYID DAN RODI */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pt-2">
                {/* Filter Angkatan dari 1 Tsanawiyah s/d 3 Aliyah */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setMuhafadzohAngkatan('SEMUA')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      muhafadzohAngkatan === 'SEMUA' ? 'btn-3d-gold text-black shadow' : 'bg-[#03140c] text-slate-300 border border-[#d4af37]/30'
                    }`}
                  >
                    Semua Angkatan
                  </button>
                  {classList.map(kls => (
                    <button
                      key={kls}
                      onClick={() => setMuhafadzohAngkatan(kls)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        muhafadzohAngkatan === kls ? 'btn-3d-gold text-black shadow' : 'bg-[#03140c] text-slate-300 border border-[#d4af37]/30'
                      }`}
                    >
                      {kls}
                    </button>
                  ))}
                </div>

                {/* TAB PEMISAH: SEMUA, SANTRI JAYYID, SANTRI RODI, MUTAWASIT */}
                <div className="flex bg-[#042014] border border-[#d4af37]/40 rounded-xl p-1">
                  <button
                    onClick={() => setMuhafadzohTab('semua')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      muhafadzohTab === 'semua' ? 'bg-[#d4af37] text-black shadow' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Semua ({filteredSantriMuhafadzoh.length})
                  </button>
                  <button
                    onClick={() => setMuhafadzohTab('jayyid')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      muhafadzohTab === 'jayyid' ? 'bg-emerald-600 text-white shadow' : 'text-emerald-300 hover:text-white'
                    }`}
                  >
                    Tabel Jayyid ({filteredSantriMuhafadzoh.filter(s => s.kategoriMhf === 'JAYYID').length})
                  </button>
                  <button
                    onClick={() => setMuhafadzohTab('rodi')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      muhafadzohTab === 'rodi' ? 'bg-red-600 text-white shadow' : 'text-red-300 hover:text-white'
                    }`}
                  >
                    Tabel Rodi ({filteredSantriMuhafadzoh.filter(s => s.kategoriMhf === 'RODI').length})
                  </button>
                  <button
                    onClick={() => setMuhafadzohTab('mutawasit')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      muhafadzohTab === 'mutawasit' ? 'bg-amber-600 text-black shadow' : 'text-amber-300 hover:text-white'
                    }`}
                  >
                    Mutawasit ({filteredSantriMuhafadzoh.filter(s => s.kategoriMhf === 'MUTAWASIT').length})
                  </button>
                </div>
              </div>

              {/* TABEL DATA MUHAFADZOH DENGAN PERINGKAT ANGKATAN */}
              <div className="overflow-x-auto rounded-2xl border border-[#d4af37]/25">
                <table className="w-full text-xs text-left min-w-[850px]">
                  <thead className="bg-[#03170e] text-[#d4af37] border-b border-[#d4af37]/30">
                    <tr>
                      <th className="p-3 w-16 text-center">PERINGKAT</th>
                      <th className="p-3">SANTRI & NIS</th>
                      <th className="p-3 w-32">ANGKATAN / KELAS</th>
                      <th className="p-3">KITAB NADZHOM</th>
                      <th className="p-3 text-center w-28">NILAI MUHAFADZOH</th>
                      <th className="p-3">PREDIKAT EVALUASI</th>
                      <th className="p-3">USTADZ PENGUJI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d4af37]/10 bg-[#020e08]/80">
                    {filteredSantriMuhafadzoh
                      .filter(s => {
                        if (muhafadzohTab === 'jayyid') return s.kategoriMhf === 'JAYYID';
                        if (muhafadzohTab === 'rodi') return s.kategoriMhf === 'RODI';
                        if (muhafadzohTab === 'mutawasit') return s.kategoriMhf === 'MUTAWASIT';
                        return true;
                      })
                      .map((s, idx) => (
                        <tr key={s.id} className="hover:bg-[#d4af37]/5 transition">
                          <td className="p-3 text-center">
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-bold font-mono text-xs ${
                              idx === 0 ? 'bg-[#d4af37] text-black shadow-lg shadow-[#d4af37]/40 ring-2 ring-[#f5e298]' :
                              idx === 1 ? 'bg-slate-300 text-black shadow' :
                              idx === 2 ? 'bg-amber-700 text-white shadow' :
                              'bg-[#0b3824] text-emerald-300 border border-[#d4af37]/30'
                            }`}>
                              {idx + 1}
                            </span>
                          </td>
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
                          <td className="p-3 text-emerald-200 font-bold">{s.kelas}</td>
                          <td className="p-3 text-white font-serif">{s.kitabMuhafadzoh || 'Nadzhom Al-Imrithi'}</td>
                          <td className="p-3 text-center">
                            <span className={`inline-block px-3 py-1 rounded-xl font-mono font-black text-sm ${
                              s.kategoriMhf === 'JAYYID' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50' :
                              s.kategoriMhf === 'MUTAWASIT' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' :
                              'bg-red-500/20 text-red-300 border border-red-500/50'
                            }`}>
                              {s.nilaiMhf}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-block ${
                              s.kategoriMhf === 'JAYYID' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50' :
                              s.kategoriMhf === 'MUTAWASIT' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' :
                              'bg-red-500/20 text-red-300 border border-red-500/50'
                            }`}>
                              {s.predikatMhf}
                            </span>
                          </td>
                          <td className="p-3 text-slate-300 font-medium">
                            {s.ustadzPengujiKitab || 'Ust. Muhammad Ilyas'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 6. FITUR UJIAN BACA KITAB + CETAK PDF, WORD, SPREADSHEET                 */}
            {/* ========================================================================= */}
            <div className="card-3d rounded-3xl p-6 border border-[#d4af37]/40 space-y-5 bg-[#031810]">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-[#d4af37]/25">
                <div>
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-5 h-5 text-[#d4af37]" />
                    <h3 className="text-base sm:text-lg font-black text-white text-gold-3d">
                      Ujian Baca Kitab Kuning (Qira'atul Kutub & Fahmul Tarkib)
                    </h3>
                  </div>
                  <p className="text-xs text-emerald-200 mt-1">
                    Evaluasi kefasihan membaca matan kitab kuning, tarkib nahwu pegon, dan i'rob kalimat santri.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={printTable}
                    className="px-3 py-2 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 font-bold text-xs flex items-center gap-1 hover:bg-emerald-900 transition shadow"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak PDF</span>
                  </button>

                  <button
                    onClick={() => {
                      const headers = ['NO', 'NIS', 'NAMA SANTRI', 'KELAS', 'KITAB DIUJI', 'NILAI BACA KITAB', 'PREDIKAT', 'PENGUJI'];
                      const rows = santriList.map((s, idx) => [
                        idx + 1, s.id, s.nama, s.kelas, s.kitabBaca || 'Fathul Qorib', Number(s.nilaiBacaKitab ?? 88), s.predikatBacaKitab || 'Jayyid Jiddan', s.ustadzPengujiKitab || 'Ust. Ilyas'
                      ]);
                      downloadCSV('Data_Ujian_Baca_Kitab_Santri', headers, rows);
                    }}
                    className="px-3 py-2 rounded-xl bg-[#093d25] border border-[#d4af37]/50 text-[#f3e5ab] font-bold text-xs flex items-center gap-1 hover:bg-[#0c4e30] transition shadow"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Spreadsheet (.csv)</span>
                  </button>

                  <button
                    onClick={() => {
                      const headers = ['NO', 'NIS', 'NAMA SANTRI', 'KELAS', 'KITAB DIUJI', 'NILAI BACA KITAB', 'PREDIKAT', 'PENGUJI'];
                      const rows = santriList.map((s, idx) => [
                        idx + 1, s.id, s.nama, s.kelas, s.kitabBaca || 'Fathul Qorib', Number(s.nilaiBacaKitab ?? 88), s.predikatBacaKitab || 'Jayyid Jiddan', s.ustadzPengujiKitab || 'Ust. Ilyas'
                      ]);
                      downloadWord('Data_Ujian_Baca_Kitab_Santri', 'DATA REKAPITULASI UJIAN BACA KITAB KUNING SANTRI', headers, rows);
                    }}
                    className="px-3 py-2 rounded-xl bg-blue-950/80 border border-blue-500/50 text-blue-200 font-bold text-xs flex items-center gap-1 hover:bg-blue-900 transition shadow"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Word (.doc)</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-[#d4af37]/25">
                <table className="w-full text-xs text-left min-w-[800px]">
                  <thead className="bg-[#03170e] text-[#d4af37] border-b border-[#d4af37]/30">
                    <tr>
                      <th className="p-3 w-14 text-center">NO</th>
                      <th className="p-3">SANTRI & NIS</th>
                      <th className="p-3 w-32">ANGKATAN</th>
                      <th className="p-3">KITAB KUNING YANG DIUJI</th>
                      <th className="p-3 text-center w-28">NILAI BACA</th>
                      <th className="p-3">PREDIKAT & TARKIB</th>
                      <th className="p-3">USTADZ PENGUJI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d4af37]/10 bg-[#020e08]/80">
                    {santriList.slice(0, 10).map((s, idx) => (
                      <tr key={s.id} className="hover:bg-[#d4af37]/5 transition">
                        <td className="p-3 text-center text-emerald-300 font-mono">{idx + 1}</td>
                        <td className="p-3">
                          <span className="font-bold text-white block">{s.nama}</span>
                          <span className="text-[10px] text-[#d4af37] font-mono">NIS: {s.id}</span>
                        </td>
                        <td className="p-3 text-emerald-200 font-bold">{s.kelas}</td>
                        <td className="p-3 text-white font-serif">{s.kitabBaca || 'Fathul Qorib Bab Sholat'}</td>
                        <td className="p-3 text-center">
                          <span className="inline-block px-3 py-1 rounded-xl bg-blue-500/20 border border-blue-500/50 text-blue-300 font-mono font-black text-sm">
                            {s.nilaiBacaKitab ?? 88}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-900/60 border border-blue-500/40 text-blue-200 font-bold text-[10px]">
                            {s.predikatBacaKitab || 'Jayyid Jiddan (Fashih & Paham Tarkib)'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-300">{s.ustadzPengujiKitab || 'Ust. Muhammad Ilyas'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 7. LINK QR CODE PER ANGKATAN UNTUK MENCOCOKKAN ABSENSI & JADWAL           */}
            {/* ========================================================================= */}
            <div className="card-3d rounded-3xl p-6 border-2 border-[#d4af37]/60 bg-gradient-to-r from-[#031e13] via-[#062c1c] to-[#031e13] shadow-2xl space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-[#d4af37]/30">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#0b3824] border-2 border-[#d4af37] flex items-center justify-center text-[#d4af37] shadow">
                    <QrCode className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white text-gold-3d flex items-center gap-2">
                      <span>QR Code Presensi Cerdas Per Angkatan</span>
                      <span className="px-2 py-0.5 rounded-full bg-[#d4af37] text-black font-extrabold text-[10px]">
                        1 QR Code Untuk Semua
                      </span>
                    </h3>
                    <p className="text-xs text-emerald-200 mt-0.5">
                      Pindai QR Code untuk mencocokkan kehadiran santri dan ustadz secara instan sesuai jadwal pelajaran aktif hari ini.
                    </p>
                  </div>
                </div>

                {/* Filter Angkatan QR Code */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setQrAngkatan('SEMUA')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      qrAngkatan === 'SEMUA' ? 'btn-3d-gold text-black shadow' : 'bg-[#03140c] text-slate-300 border border-[#d4af37]/30'
                    }`}
                  >
                    1 QR Code Master (Semua)
                  </button>
                  {classList.map(c => (
                    <button
                      key={c}
                      onClick={() => setQrAngkatan(c)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        qrAngkatan === c ? 'btn-3d-gold text-black shadow' : 'bg-[#03140c] text-slate-300 border border-[#d4af37]/30'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tampilan Visual QR Code & Koneksi Jadwal */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* QR Code Graphic Box */}
                <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 rounded-3xl bg-[#020e08] border-2 border-[#d4af37]/60 shadow-2xl relative">
                  <div className="w-56 h-56 p-3 bg-white rounded-2xl shadow-xl flex items-center justify-center relative overflow-hidden">
                    {/* SVG Authentic Vector QR Code */}
                    <svg viewBox="0 0 200 200" className="w-full h-full">
                      {/* Background */}
                      <rect width="200" height="200" fill="#ffffff" />
                      {/* Top-Left Finder */}
                      <rect x="15" y="15" width="50" height="50" fill="#042014" rx="6" />
                      <rect x="23" y="23" width="34" height="34" fill="#ffffff" rx="4" />
                      <rect x="31" y="31" width="18" height="18" fill="#d4af37" rx="2" />
                      {/* Top-Right Finder */}
                      <rect x="135" y="15" width="50" height="50" fill="#042014" rx="6" />
                      <rect x="143" y="23" width="34" height="34" fill="#ffffff" rx="4" />
                      <rect x="151" y="31" width="18" height="18" fill="#d4af37" rx="2" />
                      {/* Bottom-Left Finder */}
                      <rect x="15" y="135" width="50" height="50" fill="#042014" rx="6" />
                      <rect x="23" y="143" width="34" height="34" fill="#ffffff" rx="4" />
                      <rect x="31" y="151" width="18" height="18" fill="#d4af37" rx="2" />
                      {/* Data Pattern Modules */}
                      <g fill="#042014">
                        <rect x="75" y="20" width="10" height="10" />
                        <rect x="95" y="20" width="10" height="10" />
                        <rect x="115" y="20" width="10" height="10" />
                        <rect x="75" y="40" width="10" height="10" />
                        <rect x="85" y="50" width="10" height="10" />
                        <rect x="105" y="40" width="10" height="10" />
                        <rect x="20" y="75" width="10" height="10" />
                        <rect x="40" y="85" width="10" height="10" />
                        <rect x="55" y="75" width="10" height="10" />
                        <rect x="75" y="75" width="12" height="12" fill="#d4af37" />
                        <rect x="95" y="75" width="10" height="10" />
                        <rect x="115" y="75" width="12" height="12" fill="#d4af37" />
                        <rect x="135" y="75" width="10" height="10" />
                        <rect x="155" y="85" width="10" height="10" />
                        <rect x="175" y="75" width="10" height="10" />
                        <rect x="75" y="95" width="10" height="10" />
                        <rect x="85" y="105" width="10" height="10" />
                        <rect x="105" y="95" width="10" height="10" />
                        <rect x="115" y="105" width="10" height="10" />
                        <rect x="135" y="95" width="10" height="10" />
                        <rect x="75" y="115" width="12" height="12" fill="#d4af37" />
                        <rect x="95" y="115" width="10" height="10" />
                        <rect x="115" y="115" width="10" height="10" />
                        <rect x="75" y="135" width="10" height="10" />
                        <rect x="95" y="145" width="10" height="10" />
                        <rect x="115" y="135" width="10" height="10" />
                        <rect x="135" y="145" width="10" height="10" />
                        <rect x="155" y="135" width="10" height="10" />
                        <rect x="175" y="145" width="10" height="10" />
                        <rect x="75" y="155" width="10" height="10" />
                        <rect x="95" y="165" width="10" height="10" />
                        <rect x="115" y="155" width="10" height="10" />
                        <rect x="135" y="165" width="10" height="10" />
                        <rect x="155" y="155" width="10" height="10" />
                      </g>
                      {/* Center Salaf Emblem */}
                      <circle cx="100" cy="100" r="16" fill="#052e16" stroke="#d4af37" strokeWidth="2.5" />
                      <text x="100" y="104" textAnchor="middle" fill="#d4af37" fontSize="9" fontWeight="bold">SIM</text>
                    </svg>
                  </div>

                  <span className="mt-3 text-xs font-extrabold text-[#d4af37] font-mono tracking-wider">
                    {qrAngkatan === 'SEMUA' ? '1 QR CODE UNTUK SEMUA ANGKATAN' : `QR CODE ${qrAngkatan}`}
                  </span>
                  <span className="text-[10px] text-emerald-300 font-mono">
                    ID: QR-PP-SALAF-{qrAngkatan.replace(' ', '-')}
                  </span>
                </div>

                {/* Detail Koneksi Jadwal & Tombol Scan */}
                <div className="lg:col-span-8 space-y-4">
                  <div className="bg-[#03140c] border border-[#d4af37]/30 rounded-2xl p-4 space-y-2">
                    <span className="text-xs font-bold text-[#d4af37] flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#d4af37]" />
                      <span>Koneksi Jadwal Pelajaran Hari Ini Terkait QR Code:</span>
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Ketika santri atau ustadz memindai QR Code di atas, sistem secara otomatis mencocokkan waktu saat ini dengan jam ke- dan mata pelajaran di angkatan <b>{qrAngkatan}</b>.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                      {jadwalList
                        .filter(j => qrAngkatan === 'SEMUA' || j.kelas === qrAngkatan)
                        .slice(0, 4)
                        .map((j, i) => (
                          <div key={i} className="p-2.5 rounded-xl bg-[#062417] border border-[#d4af37]/20 text-xs">
                            <span className="font-bold text-white block">{j.mapel}</span>
                            <span className="text-[11px] text-emerald-300 font-mono">{j.hari} • {j.waktu}</span>
                            <span className="text-[10px] text-[#d4af37] block mt-0.5">Pengampu: {j.nama}</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Tombol Interaktif & Hasil Simulasi Scan */}
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => {
                        const targetCount = qrAngkatan === 'SEMUA' 
                          ? santriList.length 
                          : santriList.filter(s => s.kelas === qrAngkatan).length;
                        setSimulasiScanMsg(`✅ Berhasil! QR Code ${qrAngkatan} berhasil dicocokkan dengan jadwal hari ini. ${targetCount} Santri & Ustadz Pengajar otomatis dicatat HADIR TEPAT WAKTU.`);
                        setTimeout(() => setSimulasiScanMsg(null), 8000);
                      }}
                      className="btn-3d-gold px-5 py-2.5 rounded-xl text-black font-extrabold text-xs flex items-center gap-2 shadow-lg"
                    >
                      <QrCode className="w-4 h-4 text-black" />
                      <span>Simulasi Scan QR Presensi Sekarang</span>
                    </button>

                    <button
                      onClick={printTable}
                      className="px-4 py-2.5 rounded-xl bg-emerald-950 border border-emerald-500/50 text-emerald-300 font-bold text-xs flex items-center gap-1.5 hover:bg-emerald-900 transition"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Cetak Lembar QR Code</span>
                    </button>

                    <button
                      onClick={() => {
                        alert(`QR Code ${qrAngkatan} siap diunduh dan dipasang pada pintu kelas madrasah atau aula pondok.`);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-blue-950 border border-blue-500/50 text-blue-200 font-bold text-xs flex items-center gap-1.5 hover:bg-blue-900 transition"
                    >
                      <Download className="w-4 h-4" />
                      <span>Unduh Berkas QR</span>
                    </button>
                  </div>

                  {simulasiScanMsg && (
                    <div className="p-3.5 rounded-2xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 text-xs font-bold shadow-lg animate-bounce">
                      {simulasiScanMsg}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: KALENDER AKADEMIK & AGENDA MADRASAH */}
        {activeTab === 'kalender' && (
          <div className="space-y-6">
            <div className="card-3d rounded-3xl p-6 backdrop-blur flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-[#d4af37]/30">
              <div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0b3824] border border-[#d4af37]/50 flex items-center justify-center text-[#d4af37] shadow">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white text-gold-3d">
                      Kalender Akademik & Agenda Madrasah Diniyah
                    </h2>
                    <p className="text-xs text-emerald-200/90">
                      Kelola jadwal rapat, ujian, pengajian akbar, dan agenda pondok. Event mendesak/rapat otomatis muncul di Dashboard Pengurus.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setActiveTab('pengaturan');
                  setActiveControlSection('kelola_kalender');
                }}
                className="btn-3d-gold px-4 py-2.5 rounded-xl text-black font-extrabold text-xs flex items-center gap-2 shadow"
              >
                <PlusCircle className="w-4 h-4 text-black" />
                <span>+ Buat Agenda / Rapat Baru</span>
              </button>
            </div>

            {/* Grid Kartu Agenda */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {kalenderList.map(evt => (
                <div
                  key={evt.id}
                  className={`card-3d-glass rounded-2xl p-5 border space-y-4 relative overflow-hidden ${
                    evt.isUrgentNotif
                      ? 'border-red-500/60 bg-red-950/20'
                      : 'border-[#d4af37]/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 border-b border-[#d4af37]/20 pb-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                      evt.kategori === 'Rapat' ? 'bg-red-500/20 text-red-300 border border-red-500/40' :
                      evt.kategori === 'Ujian' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                      'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}>
                      {evt.kategori}
                    </span>

                    {evt.isUrgentNotif && (
                      <span className="px-2 py-0.5 rounded bg-red-600 text-white font-mono text-[9px] font-extrabold uppercase animate-pulse">
                        🔥 Notif Pengurus Aktif
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-white text-base leading-snug">{evt.judul}</h3>
                    <p className="text-xs text-slate-300 mt-2 line-clamp-3 leading-relaxed">
                      {evt.deskripsi || 'Agenda resmi madrasah diniyah salafiyah.'}
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-[#d4af37]/15 text-xs text-emerald-200/90 font-medium">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>{evt.tanggalMulai} {evt.tanggalSelesai ? `s/d ${evt.tanggalSelesai}` : ''}</span>
                    </div>
                    {evt.waktu && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-[#d4af37]" />
                        <span>{evt.waktu}</span>
                      </div>
                    )}
                    {evt.lokasi && (
                      <div className="flex items-center gap-2">
                        <span className="text-[#d4af37]">📍</span>
                        <span className="truncate">{evt.lokasi}</span>
                      </div>
                    )}
                    {evt.sasaran && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span>👥</span>
                        <span className="truncate">{evt.sasaran}</span>
                      </div>
                    )}
                  </div>

                  {onDeleteKalender && (
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => {
                          if (window.confirm(`Hapus agenda "${evt.judul}"?`)) {
                            onDeleteKalender(evt.id);
                          }
                        }}
                        className="text-red-400 hover:text-red-300 text-xs font-bold flex items-center gap-1 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Hapus Agenda</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: UJIAN MUHAFADZOH, KOREKSIAN KITAB, & BACA KITAB */}
        {activeTab === 'ujian-kitab' && (
          <div className="space-y-6">
            <div className="card-3d rounded-3xl p-6 backdrop-blur flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-[#d4af37]/30">
              <div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0b3824] border border-[#d4af37]/50 flex items-center justify-center text-[#d4af37] shadow">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white text-gold-3d">
                      Rekap Ujian Muhafadzoh, Koreksian Kitab, & Baca Kitab
                    </h2>
                    <p className="text-xs text-emerald-200/90">
                      Terkoneksi langsung ke Dashboard Wali Santri di kolom bawah profil anak. Diatur dan dinilai melalui Option Panel.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setActiveTab('pengaturan');
                  setActiveControlSection('kelola_ujian_kitab');
                }}
                className="btn-3d-gold px-4 py-2.5 rounded-xl text-black font-extrabold text-xs flex items-center gap-2 shadow"
              >
                <Sliders className="w-4 h-4 text-black" />
                <span>Input / Edit Nilai di Option Panel</span>
              </button>
            </div>

            {/* Quick Cards Rata-Rata */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="card-3d-glass rounded-2xl p-5 border border-[#d4af37]/40 space-y-1">
                <span className="text-xs text-[#d4af37] font-bold block">1. Rata-rata Nilai Koreksian Kitab</span>
                <div className="text-2xl font-black text-white font-mono">
                  {(santriList.reduce((acc, s) => acc + Number(s.nilaiKoreksianKitab ?? 88), 0) / (santriList.length || 1)).toFixed(1)} / 100
                </div>
                <span className="text-[11px] text-emerald-300">Pemeriksaan Makna Gandul & Catatan Pegon</span>
              </div>

              <div className="card-3d-glass rounded-2xl p-5 border border-emerald-500/40 space-y-1">
                <span className="text-xs text-emerald-300 font-bold block">2. Rata-rata Nilai Muhafadzoh</span>
                <div className="text-2xl font-black text-emerald-300 font-mono">
                  {(santriList.reduce((acc, s) => acc + Number(s.nilaiMuhafadzoh ?? 90), 0) / (santriList.length || 1)).toFixed(1)} / 100
                </div>
                <span className="text-[11px] text-emerald-200/90">Hafalan Matan Nadzhom Diniyah</span>
              </div>

              <div className="card-3d-glass rounded-2xl p-5 border border-blue-500/40 space-y-1">
                <span className="text-xs text-blue-300 font-bold block">3. Rata-rata Nilai Baca Kitab</span>
                <div className="text-2xl font-black text-blue-300 font-mono">
                  {(santriList.reduce((acc, s) => acc + Number(s.nilaiBacaKitab ?? 86), 0) / (santriList.length || 1)).toFixed(1)} / 100
                </div>
                <span className="text-[11px] text-slate-300">Qira'atul Kutub & Fahmul Tarkib</span>
              </div>
            </div>

            {/* Tabel Santri dengan 3 Nilai Utama */}
            <div className="card-3d rounded-2xl p-5 border border-[#d4af37]/30 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h3 className="text-sm font-bold text-white text-gold-3d">
                  Daftar Nilai Santri Lengkap (Terkoneksi ke Wali Santri)
                </h3>
                <span className="text-xs text-[#d4af37] font-mono">
                  Total: {santriList.length} Santri Terdaftar
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-[#d4af37]/25">
                <table className="w-full text-xs text-left min-w-[900px]">
                  <thead className="bg-[#03140c] text-[#d4af37] border-b border-[#d4af37]/30">
                    <tr>
                      <th className="p-3">Santri & Angkatan</th>
                      <th className="p-3">Nilai Koreksian Kitab</th>
                      <th className="p-3">Nilai Muhafadzoh</th>
                      <th className="p-3">Nilai Baca Kitab</th>
                      <th className="p-3">Penguji & Tanggal</th>
                      <th className="p-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d4af37]/10 bg-[#020e08]/70">
                    {santriList.map(s => (
                      <tr key={s.id} className="hover:bg-[#d4af37]/5">
                        <td className="p-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-full overflow-hidden bg-[#0b3824] border border-[#d4af37]/40 shrink-0">
                              <img
                                src={s.foto || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=100&auto=format&fit=crop&q=80'}
                                alt={s.nama}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLElement).setAttribute('src', 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=100&auto=format&fit=crop&q=80');
                                }}
                              />
                            </div>
                            <div>
                              <span className="font-bold text-white block">{s.nama}</span>
                              <span className="text-[10px] text-[#d4af37] font-mono">NIS: {s.id} • {s.kelas}</span>
                            </div>
                          </div>
                        </td>

                        {/* Nilai Koreksian Kitab */}
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-[#d4af37]/20 border border-[#d4af37]/50 text-[#d4af37] font-mono font-black text-sm">
                              {s.nilaiKoreksianKitab ?? 90}
                            </span>
                            <div>
                              <span className="text-[10px] font-bold text-white block">
                                {s.predikatKoreksianKitab || 'Mumtaz'}
                              </span>
                              <span className="text-[9px] text-slate-400 block truncate max-w-[150px]">
                                Makna Gandul Sah & Lengkap
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Nilai Muhafadzoh */}
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-mono font-black text-sm">
                              {s.nilaiMuhafadzoh ?? 92}
                            </span>
                            <div>
                              <span className="text-[10px] font-bold text-white block">
                                {s.predikatMuhafadzoh || 'Mumtaz'}
                              </span>
                              <span className="text-[9px] text-slate-400 block truncate max-w-[150px]">
                                Hafalan Mutqin
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Nilai Baca Kitab */}
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-blue-500/20 border border-blue-500/50 text-blue-300 font-mono font-black text-sm">
                              {s.nilaiBacaKitab ?? 88}
                            </span>
                            <div>
                              <span className="text-[10px] font-bold text-white block">
                                {s.predikatBacaKitab || 'Jayyid Jiddan'}
                              </span>
                              <span className="text-[9px] text-slate-400 block truncate max-w-[150px]">
                                Tarkib & I'rob Fashih
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="p-3">
                          <span className="text-slate-300 block font-medium">{s.ustadzPengujiKitab || 'Ust. Ilyas'}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{s.tanggalUjianKitab || '2026-09-22'}</span>
                        </td>

                        <td className="p-3 text-center">
                          <button
                            onClick={() => {
                              setSelectedUjianSantriId(s.id);
                              setActiveTab('pengaturan');
                              setActiveControlSection('kelola_ujian_kitab');
                            }}
                            className="px-2.5 py-1 bg-[#d4af37]/20 hover:bg-[#d4af37] text-[#d4af37] hover:text-black font-bold rounded-lg transition"
                          >
                            Atur Nilai
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ABSENSI SANTRI */}
        {activeTab === 'absensi-santri' && (
          <div className="card-3d rounded-3xl p-5 sm:p-6 backdrop-blur space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pb-4 border-b border-[#d4af37]/20">
              <div>
                <h3 className="text-lg font-bold text-[#d4af37] text-gold-3d">
                  {settings.text_absensi_santri_title || 'Absensi Santri Diniyah'}
                </h3>
                <p className="text-xs text-emerald-200/80 mt-0.5">Tercatat per tanggal hari ini ke Sheet <b>Absensi_Santri</b>.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleMarkAllSantriHadir}
                  style={{ color: settings.btn_hadir_semua_color || '#ffffff' }}
                  className="btn-3d-emerald px-4 py-2 font-bold text-xs rounded-xl"
                >
                  {settings.btn_hadir_semua_text || '✓ Hadir Semua'}
                </button>
                <button
                  onClick={handleSaveSantriAbsensiSubmit}
                  style={{ color: settings.btn_simpan_absensi_santri_color || '#000000' }}
                  className="btn-3d-gold px-5 py-2 font-extrabold text-xs rounded-xl flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{settings.btn_simpan_absensi_santri_text || 'Simpan Absensi Santri'}</span>
                </button>
              </div>
            </div>

            {/* List by Angkatan */}
            <div className="space-y-6">
              {classList.map(kls => {
                const santriInClass = santriList.filter(s => s.kelas === kls);
                if (!santriInClass.length) return null;

                return (
                  <div key={kls} className="card-3d rounded-2xl p-4 space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-[#d4af37]/20">
                      <h4 className="font-extrabold text-[#d4af37] text-sm text-gold-3d">{kls}</h4>
                      <span className="text-xs text-emerald-300 font-mono px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 font-semibold">{santriInClass.length} Santri</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {santriInClass.map(santri => {
                        const cur = santriAbsensiState[santri.id] || { status: 'Hadir', ket: '' };
                        return (
                          <div key={santri.id} className="card-3d-deep rounded-xl p-3.5 space-y-3">
                            <div className="flex items-center space-x-3">
                              <img
                                src={santri.foto}
                                alt={santri.nama}
                                className="w-12 h-14 object-cover rounded-lg border border-[#d4af37]/40 shadow"
                                onError={(e) => { (e.target as HTMLElement).setAttribute('src', 'https://via.placeholder.com/70x90'); }}
                              />
                              <div className="overflow-hidden flex-1">
                                <h5 className="font-bold text-xs text-white truncate">{santri.nama}</h5>
                                <span className="text-[10px] text-[#d4af37] font-mono block">NIS: {santri.id}</span>
                                <span className="text-[10px] text-emerald-300/80 truncate block">{santri.kamar}</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <label className="text-[10px] text-[#d4af37] font-bold block mb-1">Status</label>
                                <select
                                  value={cur.status}
                                  onChange={(e) => setSantriAbsensiState({
                                    ...santriAbsensiState,
                                    [santri.id]: { ...cur, status: e.target.value as any }
                                  })}
                                  className="w-full bg-[#052216] border border-[#d4af37]/40 rounded-lg p-1.5 text-xs text-[#f3e5ab] font-bold shadow-inner"
                                >
                                  <option value="Hadir">Hadir</option>
                                  <option value="Izin">Izin</option>
                                  <option value="Sakit">Sakit</option>
                                  <option value="Alpha">Alpha</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-[10px] text-emerald-300 font-bold block mb-1">Keterangan</label>
                                <input
                                  type="text"
                                  value={cur.ket}
                                  placeholder="Keterangan..."
                                  onChange={(e) => setSantriAbsensiState({
                                    ...santriAbsensiState,
                                    [santri.id]: { ...cur, ket: e.target.value }
                                  })}
                                  className="w-full bg-[#052216] border border-[#d4af37]/40 rounded-lg p-1.5 text-xs text-white shadow-inner"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* FITUR REKAPAN KEHADIRAN SANTRI BULANAN (TANGGAL 1 S/D 30 SETIAP BULANNYA) */}
            <div className="card-3d rounded-2xl p-5 space-y-4 border border-[#d4af37]/30 mt-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-[#d4af37]/20">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-[#0b3824] border border-[#d4af37]/50 flex items-center justify-center text-[#d4af37] shadow">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-white text-gold-3d">
                      Rekapitulasi Kehadiran Santri Bulanan (Tanggal 1 s/d 30)
                    </h4>
                    <p className="text-[11px] text-emerald-300">
                      Kalkulasi otomatis total Hadir, Izin, Sakit, dan Alpha selama 30 hari dalam satu bulan kalender.
                    </p>
                  </div>
                </div>

                {/* Filter Bulan Rekapan Santri */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-emerald-300 font-medium">Bulan Rekap:</span>
                  <select
                    value={selectedBulanSantri}
                    onChange={(e) => setSelectedBulanSantri(e.target.value)}
                    className="bg-[#052216] border border-[#d4af37]/40 rounded-xl px-3 py-1.5 text-xs text-[#f3e5ab] font-bold shadow-inner focus:outline-none"
                  >
                    <option value="September 2026">September 2026</option>
                    <option value="Oktober 2026">Oktober 2026</option>
                    <option value="November 2026">November 2026</option>
                    <option value="Desember 2026">Desember 2026</option>
                  </select>
                </div>
              </div>

              {/* Tabel Ringkasan Rekap Bulanan Santri */}
              <div className="overflow-x-auto rounded-xl border border-[#d4af37]/20">
                <table className="w-full min-w-[760px] text-left text-xs">
                  <thead className="bg-[#052216] text-[#d4af37]">
                    <tr>
                      <th className="p-3 w-12 text-center">NO</th>
                      <th className="p-3 w-28">NIS</th>
                      <th className="p-3">NAMA SANTRI</th>
                      <th className="p-3 w-32">ANGKATAN / KELAS</th>
                      <th className="p-3 w-24 text-center text-emerald-300 font-bold bg-emerald-950/40">HADIR (TGL 1-30)</th>
                      <th className="p-3 w-20 text-center text-amber-300 font-bold bg-amber-950/30">IZIN</th>
                      <th className="p-3 w-20 text-center text-blue-300 font-bold bg-blue-950/30">SAKIT</th>
                      <th className="p-3 w-20 text-center text-red-300 font-bold bg-red-950/30">ALPHA</th>
                      <th className="p-3 w-28 text-center text-[#d4af37] font-bold">PERSENTASE</th>
                      <th className="p-3 w-28 text-center">EVALUASI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d4af37]/10">
                    {rekapBulananSantri.map((s, idx) => (
                      <tr key={s.id} className="hover:bg-[#d4af37]/5 transition">
                        <td className="p-3 text-center text-emerald-300 font-mono">{idx + 1}</td>
                        <td className="p-3 font-mono text-[#d4af37]">{s.id}</td>
                        <td className="p-3 font-bold text-white">{s.nama}</td>
                        <td className="p-3 text-emerald-200">{s.kelas}</td>
                        <td className="p-3 text-center font-mono font-bold text-emerald-400 bg-emerald-950/20">
                          {s.hadir} kali
                        </td>
                        <td className="p-3 text-center font-mono text-amber-300 bg-amber-950/20">
                          {s.izin} kali
                        </td>
                        <td className="p-3 text-center font-mono text-blue-300 bg-blue-950/20">
                          {s.sakit} kali
                        </td>
                        <td className="p-3 text-center font-mono text-red-400 bg-red-950/20">
                          {s.alpha} kali
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-mono font-bold text-sm text-[#f3e5ab]">
                            {s.persentase}%
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            s.persentase >= 95
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                              : s.persentase >= 85
                              ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                              : 'bg-red-950 text-red-300 border-red-500/40'
                          }`}>
                            {s.keterangan}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ABSENSI USTADZ / GURU (DENGAN TAMPILAN JADWAL, REKAPAN LENGKAP, DAN SIMPAN DI OPTION PANEL) */}
        {activeTab === 'absensi-guru' && (
          <div className="card-3d rounded-3xl p-5 sm:p-6 backdrop-blur space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#d4af37]/20">
              <div>
                <h3 className="text-lg font-bold text-[#d4af37] text-gold-3d">
                  {settings.text_absensi_guru_title || 'Absensi Ustadz / Ustadzah Pengajar'}
                </h3>
                <p className="text-xs text-emerald-200/80 mt-0.5">
                  Pilih Angkatan dan Hari Pelajaran untuk melihat dan mencatat kehadiran pengajar. Penyimpanan eksekusi terpusat di Option Panel.
                </p>
              </div>

              {/* Sesuai instruksi: Seluruh fitur selain absensi santri hanya menampilkan data & tombol simpan di Option Panel */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('pengaturan');
                    setActiveControlSection('simpan_absensi');
                  }}
                  className="btn-3d-gold px-4 py-2 rounded-xl text-black font-extrabold text-xs flex items-center gap-2"
                >
                  <Save className="w-3.5 h-3.5 text-black" />
                  <span>{settings.btn_simpan_guru_text || 'SIMPAN DI OPTION PANEL'}</span>
                </button>
              </div>
            </div>

            {/* 1. PILIH KELAS / ANGKATAN */}
            <div>
              <label className="text-[11px] font-bold text-[#d4af37] uppercase tracking-wider block mb-2">
                1. Pilih Angkatan / Kelas
              </label>
              <div className="flex flex-wrap gap-2">
                {classList.map(kls => (
                  <button
                    key={kls}
                    type="button"
                    onClick={() => handleSelectGuruClass(kls)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                      guruSelectedClass === kls
                        ? 'btn-3d-gold text-black shadow-lg scale-102'
                        : 'btn-3d-dark text-[#f3e5ab]'
                    }`}
                  >
                    {kls}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. TOMBOL FILTER HARI PELAJARAN (BERSIH TANPA EMOTICON KALENDER) */}
            <div>
              <label className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider block mb-2">
                2. Pilih Hari Pelajaran ({guruSelectedClass})
              </label>
              <div className="flex flex-wrap gap-2">
                {availableDays.map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setGuruSelectedDay(day)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition ${
                      guruSelectedDay.toUpperCase() === day.toUpperCase()
                        ? 'btn-3d-gold text-black shadow-lg scale-102 ring-2 ring-[#d4af37]/60'
                        : 'btn-3d-dark text-emerald-200'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Banner Mode Read-Only & Tombol Pintas ke Option Panel */}
            <div className="bg-[#042014] border border-[#d4af37]/30 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-[#0b3824] border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] shadow shrink-0">
                  <Lock className="w-4 h-4 text-[#d4af37]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white text-gold-3d">Mode Tampilan Resmi (Read-Only)</h4>
                  <p className="text-[11px] text-emerald-300">
                    Status kehadiran ustadz dan penginputan materi dikelola terpusat di Option Panel agar data tersimpan aman.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('pengaturan');
                  setActiveControlSection('simpan_absensi');
                }}
                className="btn-3d-gold px-4 py-2 rounded-xl text-black font-extrabold text-xs flex items-center gap-2 whitespace-nowrap"
              >
                <Sliders className="w-3.5 h-3.5 text-black" />
                <span>Input Status Kehadiran di Option Panel</span>
              </button>
            </div>

            {/* Current Schedule for the selected Class & Day (READ-ONLY DISPLAY) */}
            <div className="space-y-3">
              <div className="card-3d-deep p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                <div>
                  <span className="font-bold text-white text-sm">
                    Jadwal Mengajar: <span className="text-[#d4af37]">{guruSelectedClass}</span> — Hari <span className="text-[#d4af37]">{guruSelectedDay}</span>
                  </span>
                  <p className="text-[11px] text-emerald-300 mt-0.5">
                    Menampilkan data kehadiran resmi ustadz pengajar pada jam pelajaran aktif.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-lg bg-[#0a301f] text-[#d4af37] font-mono border border-[#d4af37]/40 shadow-inner">
                    {jadwalList.filter(j => j.kelas === guruSelectedClass && j.hari.toUpperCase() === guruSelectedDay.toUpperCase()).length} Jam Pelajaran
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-[#d4af37]/20">
                <table className="w-full min-w-[850px] text-left text-xs">
                  <thead className="bg-[#052216] text-[#d4af37]">
                    <tr>
                      <th className="p-3 w-16 text-center">JAM</th>
                      <th className="p-3 w-36">WAKTU</th>
                      <th className="p-3">MATA PELAJARAN</th>
                      <th className="p-3">NAMA USTADZ / USTADZAH</th>
                      <th className="p-3 w-40 text-center">STATUS KEHADIRAN</th>
                      <th className="p-3 min-w-[200px]">CATATAN / MATERI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d4af37]/10">
                    {jadwalList
                      .filter(j => j.kelas === guruSelectedClass && j.hari.toUpperCase() === guruSelectedDay.toUpperCase())
                      .map((item, idx) => {
                        const key = `${item.kelas}_${item.hari}_${item.jamKe}`;
                        const current = guruAbsensiState[key] || { status: 'Hadir', catatan: 'Bab Pelajaran Berjalan' };

                        return (
                          <tr key={idx} className="hover:bg-[#d4af37]/5 transition">
                            <td className="p-3 text-center">
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#052216] text-[#d4af37] font-bold border border-[#d4af37]/30">
                                {item.jamKe}
                              </span>
                            </td>
                            <td className="p-3 font-mono font-bold text-white">{item.waktu}</td>
                            <td className="p-3 font-extrabold text-white text-sm">{item.mapel}</td>
                            <td className="p-3 font-semibold text-[#d4af37]">{item.nama}</td>
                            <td className="p-3 text-center">
                              <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-bold border shadow ${
                                current.status === 'Hadir'
                                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                                  : current.status === 'Terlambat'
                                  ? 'bg-orange-950 text-orange-300 border-orange-500/50'
                                  : current.status === 'Izin'
                                  ? 'bg-amber-950 text-amber-300 border-amber-500/50'
                                  : 'bg-red-950 text-red-300 border-red-500/50'
                              }`}>
                                {current.status === 'Hadir' && '✓ Hadir'}
                                {current.status === 'Terlambat' && '⏱ Terlambat'}
                                {current.status === 'Izin' && '✉ Izin'}
                                {current.status === 'Alpha' && '✗ Alpha'}
                              </span>
                            </td>
                            <td className="p-3 text-emerald-200/90 font-medium italic">
                              {current.catatan || 'Kajian kitab sesuai silabus'}
                            </td>
                          </tr>
                        );
                      })}
                    {jadwalList.filter(j => j.kelas === guruSelectedClass && j.hari.toUpperCase() === guruSelectedDay.toUpperCase()).length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-emerald-300">
                          Tidak ada jadwal jam pelajaran yang tercatat untuk {guruSelectedClass} pada {guruSelectedDay}. Silakan pilih hari lain atau buat di Option Panel.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* FITUR REKAPAN KEHADIRAN USTADZ / GURU BULANAN (TANGGAL 1 S/D 30 SETIAP BULANNYA) */}
            <div className="card-3d rounded-2xl p-5 space-y-4 border border-[#d4af37]/30 mt-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-[#d4af37]/20">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-[#0b3824] border border-[#d4af37]/50 flex items-center justify-center text-[#d4af37] shadow">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-white text-gold-3d">
                      Rekapitulasi Kehadiran Ustadz / Guru Bulanan (Tanggal 1 s/d 30)
                    </h4>
                    <p className="text-[11px] text-emerald-300">
                      Rekapan akumulasi jumlah mengajar, izin, sakit/terlambat, dan alpha dari tanggal 1 sampai 30 setiap bulannya.
                    </p>
                  </div>
                </div>

                {/* Filter Bulan Rekapan Guru */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-emerald-300 font-medium">Bulan Rekap:</span>
                  <select
                    value={selectedBulanGuru}
                    onChange={(e) => setSelectedBulanGuru(e.target.value)}
                    className="bg-[#052216] border border-[#d4af37]/40 rounded-xl px-3 py-1.5 text-xs text-[#f3e5ab] font-bold shadow-inner focus:outline-none"
                  >
                    <option value="September 2026">September 2026</option>
                    <option value="Oktober 2026">Oktober 2026</option>
                    <option value="November 2026">November 2026</option>
                    <option value="Desember 2026">Desember 2026</option>
                  </select>
                </div>
              </div>

              {/* Tabel Ringkasan Rekapan Bulanan Ustadz / Guru */}
              <div className="overflow-x-auto rounded-xl border border-[#d4af37]/20">
                <table className="w-full min-w-[800px] text-left text-xs">
                  <thead className="bg-[#052216] text-[#d4af37]">
                    <tr>
                      <th className="p-3 w-12 text-center">NO</th>
                      <th className="p-3">NAMA USTADZ / USTADZAH</th>
                      <th className="p-3">MATA PELAJARAN / KITAB</th>
                      <th className="p-3 w-32">KELAS DIASUH</th>
                      <th className="p-3 w-28 text-center text-emerald-300 font-bold bg-emerald-950/40">MENGAJAR (TGL 1-30)</th>
                      <th className="p-3 w-20 text-center text-amber-300 font-bold bg-amber-950/30">IZIN</th>
                      <th className="p-3 w-24 text-center text-orange-300 font-bold bg-orange-950/30">SAKIT / TELAT</th>
                      <th className="p-3 w-20 text-center text-red-300 font-bold bg-red-950/30">ALPHA</th>
                      <th className="p-3 w-28 text-center text-[#d4af37] font-bold">KEHADIRAN</th>
                      <th className="p-3 w-28 text-center">PREDIKAT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d4af37]/10">
                    {rekapBulananGuru.map((g, idx) => (
                      <tr key={idx} className="hover:bg-[#d4af37]/5 transition">
                        <td className="p-3 text-center text-emerald-300 font-mono">{idx + 1}</td>
                        <td className="p-3 font-bold text-white">{g.nama}</td>
                        <td className="p-3 text-emerald-200">{g.mapel}</td>
                        <td className="p-3 text-[#d4af37] font-semibold">{g.kelas}</td>
                        <td className="p-3 text-center font-mono font-bold text-emerald-400 bg-emerald-950/20">
                          {g.hadir} kali
                        </td>
                        <td className="p-3 text-center font-mono text-amber-300 bg-amber-950/20">
                          {g.izin} kali
                        </td>
                        <td className="p-3 text-center font-mono text-orange-300 bg-orange-950/20">
                          {g.sakitTelat} kali
                        </td>
                        <td className="p-3 text-center font-mono text-red-400 bg-red-950/20">
                          {g.alpha} kali
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-mono font-bold text-sm text-[#f3e5ab]">
                            {g.persentase}%
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            g.persentase >= 95
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                              : g.persentase >= 85
                              ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                              : 'bg-red-950 text-red-300 border-red-500/40'
                          }`}>
                            {g.predikat}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* REKAPAN TABEL KEHADIRAN GURU DI BAWAHNYA */}
            <div className="pt-4 border-t border-[#d4af37]/20 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-[#d4af37] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Rekapan Log Kehadiran Ustadz / Ustadzah Terakhir</span>
                  </h4>
                  <p className="text-[11px] text-emerald-200/70 mt-0.5">
                    Riwayat presensi yang tersimpan dan disinkronkan ke Sheet <b>Absensi_Guru</b>
                  </p>
                </div>
                <span className="text-xs text-emerald-300 font-mono">
                  {rekapGuruLog.length} Rekor Presensi
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-[#d4af37]/20">
                <table className="w-full min-w-[850px] text-left text-xs">
                  <thead className="bg-[#052216] text-[#d4af37]">
                    <tr>
                      <th className="p-3 w-28">TANGGAL</th>
                      <th className="p-3">USTADZ / USTADZAH</th>
                      <th className="p-3">MATA PELAJARAN</th>
                      <th className="p-3">KELAS</th>
                      <th className="p-3">HARI & JAM</th>
                      <th className="p-3 w-28 text-center">STATUS</th>
                      <th className="p-3">CATATAN MATERI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d4af37]/10">
                    {rekapGuruLog.slice(0, 10).map((r, i) => (
                      <tr key={i} className="hover:bg-[#d4af37]/5 transition">
                        <td className="p-3 font-mono text-emerald-300">{r.tanggal}</td>
                        <td className="p-3 font-bold text-white">{r.nama}</td>
                        <td className="p-3 text-emerald-200">{r.mapel}</td>
                        <td className="p-3 text-[#d4af37] font-semibold">{r.kelas}</td>
                        <td className="p-3 text-[11px] text-emerald-300/80">{r.hari} (Jam {r.jamKe})</td>
                        <td className="p-3 text-center">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                            r.status === 'Hadir' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' :
                            r.status === 'Terlambat' ? 'bg-orange-950 text-orange-300 border border-orange-500/40' :
                            r.status === 'Izin' ? 'bg-amber-950 text-amber-300 border border-amber-500/40' :
                            'bg-red-950 text-red-300 border border-red-500/40'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="p-3 text-emerald-100">{r.catatan || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: JADWAL PELAJARAN (MEMANJANG) & KURIKULUM PER ANGKATAN */}
        {activeTab === 'jadwal' && (
          <div className="space-y-6">
            {/* 1. TABEL JADWAL PELAJARAN MADRASAH (DIBUAT MEMANJANG SAJA) */}
            <div className="card-3d rounded-3xl p-5 sm:p-6 backdrop-blur space-y-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-[#d4af37]/20">
                <div>
                  <h3 className="text-lg font-bold text-[#d4af37] text-gold-3d flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#d4af37]" />
                    <span>{settings.text_jadwal_title || 'Jadwal Pelajaran Madrasah Diniyah'}</span>
                  </h3>
                  <p className="text-xs text-emerald-200/80 mt-0.5">
                    Tabel alokasi jam mengajar diniyah format memanjang horizontal terstruktur per angkatan.
                  </p>
                </div>

                {/* Filter Angkatan Jadwal */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setJadwalActiveAngkatan('SEMUA')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      jadwalActiveAngkatan === 'SEMUA' ? 'btn-3d-gold text-black shadow' : 'btn-3d-dark text-white'
                    }`}
                  >
                    Semua Angkatan
                  </button>
                  {classList.map(kls => (
                    <button
                      key={kls}
                      onClick={() => setJadwalActiveAngkatan(kls)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        jadwalActiveAngkatan === kls ? 'btn-3d-gold text-black shadow' : 'btn-3d-dark text-white'
                      }`}
                    >
                      {kls}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tabel Memanjang Jadwal Pelajaran */}
              <div className="overflow-x-auto rounded-2xl border border-[#d4af37]/30 shadow-xl">
                <table className="w-full min-w-[950px] text-left text-xs">
                  <thead className="bg-[#052216] text-[#d4af37] uppercase tracking-wider font-semibold border-b border-[#d4af37]/30">
                    <tr>
                      <th className="p-3.5 w-12 text-center">NO</th>
                      <th className="p-3.5 w-36">HARI</th>
                      <th className="p-3.5 w-20 text-center">JAM KE</th>
                      <th className="p-3.5 w-32">WAKTU</th>
                      <th className="p-3.5 w-36">ANGKATAN / KELAS</th>
                      <th className="p-3.5 font-bold">MATA PELAJARAN / FAN</th>
                      <th className="p-3.5">USTADZ / USTADZAH PENGAJAR</th>
                      <th className="p-3.5 text-center w-28">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d4af37]/10 bg-[#020e08]/60">
                    {jadwalList
                      .filter(j => jadwalActiveAngkatan === 'SEMUA' || j.kelas === jadwalActiveAngkatan)
                      .map((item, idx) => (
                        <tr key={idx} className="hover:bg-[#d4af37]/5 transition">
                          <td className="p-3.5 font-mono text-center text-emerald-400/80 font-bold">{idx + 1}</td>
                          <td className="p-3.5 font-bold text-white whitespace-nowrap flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#d4af37]"></span>
                            <span>{item.hari}</span>
                          </td>
                          <td className="p-3.5 text-center">
                            <span className="inline-block w-7 h-7 rounded-lg bg-[#0b422a] border border-[#d4af37]/40 text-[#d4af37] font-bold leading-7">
                              {item.jamKe}
                            </span>
                          </td>
                          <td className="p-3.5 font-mono text-emerald-300 font-medium whitespace-nowrap">{item.waktu}</td>
                          <td className="p-3.5">
                            <span className="px-2.5 py-1 rounded-md bg-[#052216] border border-[#d4af37]/30 text-[#d4af37] font-bold text-[11px] whitespace-nowrap">
                              {item.kelas}
                            </span>
                          </td>
                          <td className="p-3.5 font-bold text-white text-sm">{item.mapel}</td>
                          <td className="p-3.5 text-emerald-200 font-medium">{item.nama}</td>
                          <td className="p-3.5 text-center">
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                              Aktif
                            </span>
                          </td>
                        </tr>
                      ))}
                    {jadwalList.filter(j => jadwalActiveAngkatan === 'SEMUA' || j.kelas === jadwalActiveAngkatan).length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-emerald-300">
                          Tidak ada jadwal yang terdaftar untuk filter ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. TABEL KURIKULUM PER ANGKATAN & KITAB YANG DIGUNAKAN (DIBAWAH TABEL JADWAL) */}
            <div className="card-3d rounded-3xl p-5 sm:p-6 backdrop-blur space-y-5 border-2 border-[#d4af37]/30">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-[#d4af37]/20">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#0b422a] border border-[#d4af37] flex items-center justify-center text-[#d4af37] shadow">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white text-gold-3d">
                      Kurikulum per Angkatan & Kitab yang Digunakan
                    </h3>
                    <p className="text-xs text-emerald-200/80 mt-0.5">
                      Rincian kurikulum kutubut turots, pengarang (mu'allif), target capaian semester, dan ustadz pengampu.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAddKurikulumInline(!showAddKurikulumInline)}
                    className="btn-3d-gold px-4 py-2 text-black font-extrabold text-xs rounded-xl flex items-center gap-2 shadow"
                  >
                    <PlusCircle className="w-4 h-4 text-black" />
                    <span>{showAddKurikulumInline ? 'Tutup Form Input' : '+ Masukkan Kurikulum & Kitab'}</span>
                  </button>
                </div>
              </div>

              {/* Form Input Kurikulum & Kitab Baru (Inline jika dibuka) */}
              {showAddKurikulumInline && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!inputKurikulumForm.mapel || !inputKurikulumForm.kitab) {
                      alert('Mata pelajaran dan nama kitab wajib diisi!');
                      return;
                    }
                    const newRec: KurikulumKitabRecord = {
                      id: `KUR-${Date.now()}`,
                      ...inputKurikulumForm
                    };
                    if (onSaveKurikulum) {
                      onSaveKurikulum(newRec);
                    }
                    setInputKurikulumForm({
                      kelas: inputKurikulumForm.kelas,
                      mapel: '',
                      kitab: '',
                      muallif: '',
                      targetSemester: '',
                      ustadzPengampu: 'Ustazah Fina Nikmatul Kamelia'
                    });
                    setShowAddKurikulumInline(false);
                    alert('Kurikulum dan Kitab baru berhasil ditambahkan!');
                  }}
                  className="p-5 rounded-2xl bg-gradient-to-br from-[#06291b] to-[#02130c] border border-[#d4af37]/40 shadow-xl space-y-4"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[#d4af37]/20">
                    <span className="text-xs font-bold text-[#d4af37] uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#d4af37]" /> Input Kurikulum Perangkatan & Kitab Baru
                    </span>
                    <span className="text-[11px] text-emerald-300">Tersimpan otomatis ke database</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-emerald-300 font-semibold mb-1">Angkatan / Kelas</label>
                      <select
                        value={inputKurikulumForm.kelas}
                        onChange={(e) => setInputKurikulumForm({ ...inputKurikulumForm, kelas: e.target.value })}
                        className="w-full bg-[#052216] border border-[#d4af37]/40 rounded-xl p-2.5 text-white"
                      >
                        {classList.map(kls => (
                          <option key={kls} value={kls}>{kls}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-emerald-300 font-semibold mb-1">Mata Pelajaran (Fan Ilmu)</label>
                      <input
                        type="text"
                        value={inputKurikulumForm.mapel}
                        onChange={(e) => setInputKurikulumForm({ ...inputKurikulumForm, mapel: e.target.value })}
                        placeholder="Contoh: Nahwu, Fiqih, Shorof..."
                        required
                        className="w-full bg-[#052216] border border-[#d4af37]/40 rounded-xl p-2.5 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-emerald-300 font-semibold mb-1">Kitab yang Digunakan</label>
                      <input
                        type="text"
                        value={inputKurikulumForm.kitab}
                        onChange={(e) => setInputKurikulumForm({ ...inputKurikulumForm, kitab: e.target.value })}
                        placeholder="Contoh: Al-Jurumiyyah, Fathul Qorib..."
                        required
                        className="w-full bg-[#052216] border border-[#d4af37]/40 rounded-xl p-2.5 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-emerald-300 font-semibold mb-1">Pengarang (Muallif)</label>
                      <input
                        type="text"
                        value={inputKurikulumForm.muallif}
                        onChange={(e) => setInputKurikulumForm({ ...inputKurikulumForm, muallif: e.target.value })}
                        placeholder="Contoh: Syaikh Ibnu Ajurrum..."
                        className="w-full bg-[#052216] border border-[#d4af37]/40 rounded-xl p-2.5 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-emerald-300 font-semibold mb-1">Target Capaian Semester</label>
                      <input
                        type="text"
                        value={inputKurikulumForm.targetSemester}
                        onChange={(e) => setInputKurikulumForm({ ...inputKurikulumForm, targetSemester: e.target.value })}
                        placeholder="Contoh: Bab Kalam s/d Bab Al-Af'al..."
                        className="w-full bg-[#052216] border border-[#d4af37]/40 rounded-xl p-2.5 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-emerald-300 font-semibold mb-1">Ustadz Pengampu</label>
                      <select
                        value={inputKurikulumForm.ustadzPengampu}
                        onChange={(e) => setInputKurikulumForm({ ...inputKurikulumForm, ustadzPengampu: e.target.value })}
                        className="w-full bg-[#052216] border border-[#d4af37]/40 rounded-xl p-2.5 text-white"
                      >
                        {guruList.map(g => (
                          <option key={g.id} value={g.nama}>{g.nama} ({g.mapel})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddKurikulumInline(false)}
                      className="px-4 py-2 rounded-xl btn-3d-dark text-emerald-300 text-xs font-bold"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 rounded-xl btn-3d-gold text-black text-xs font-extrabold flex items-center gap-1.5 shadow-lg"
                    >
                      <Save className="w-4 h-4 text-black" />
                      <span>Simpan Kurikulum & Kitab</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Tabel Memanjang Kurikulum & Kitab */}
              <div className="overflow-x-auto rounded-2xl border border-[#d4af37]/30 shadow-xl">
                <table className="w-full min-w-[1000px] text-left text-xs">
                  <thead className="bg-[#052216] text-[#d4af37] uppercase tracking-wider font-semibold border-b border-[#d4af37]/30">
                    <tr>
                      <th className="p-3.5 w-12 text-center">NO</th>
                      <th className="p-3.5 w-36">ANGKATAN / KELAS</th>
                      <th className="p-3.5 w-36">FAN ILMU</th>
                      <th className="p-3.5 font-bold">KITAB YANG DIGUNAKAN</th>
                      <th className="p-3.5">MUALLIF (PENGARANG)</th>
                      <th className="p-3.5">TARGET CAPAIAN SEMESTER</th>
                      <th className="p-3.5">USTADZ PENGAMPU</th>
                      <th className="p-3.5 text-center w-20">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d4af37]/10 bg-[#020e08]/60">
                    {kurikulumList
                      .filter(k => jadwalActiveAngkatan === 'SEMUA' || k.kelas === jadwalActiveAngkatan)
                      .map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-[#d4af37]/5 transition">
                          <td className="p-3.5 font-mono text-center text-emerald-400/80 font-bold">{idx + 1}</td>
                          <td className="p-3.5">
                            <span className="px-2.5 py-1 rounded-md bg-[#052216] border border-[#d4af37]/30 text-[#d4af37] font-bold text-[11px] whitespace-nowrap">
                              {item.kelas}
                            </span>
                          </td>
                          <td className="p-3.5 font-bold text-white">{item.mapel}</td>
                          <td className="p-3.5 font-extrabold text-[#d4af37] text-sm">{item.kitab}</td>
                          <td className="p-3.5 text-emerald-200/90 italic">{item.muallif || '-'}</td>
                          <td className="p-3.5 text-white font-medium">{item.targetSemester || '-'}</td>
                          <td className="p-3.5 text-emerald-300 font-semibold">{item.ustadzPengampu}</td>
                          <td className="p-3.5 text-center">
                            {onDeleteKurikulum && (
                              <button
                                onClick={() => {
                                  if (window.confirm(`Hapus kurikulum kitab "${item.kitab}"?`)) {
                                    onDeleteKurikulum(item.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-red-300 transition"
                                title="Hapus Kurikulum"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    {kurikulumList.filter(k => jadwalActiveAngkatan === 'SEMUA' || k.kelas === jadwalActiveAngkatan).length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-emerald-300">
                          Belum ada data kurikulum dan kitab untuk angkatan yang dipilih. Klik tombol "+ Masukkan Kurikulum & Kitab" di atas untuk menambahkan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: DATA GURU PENGAJAR PER ANGKATAN */}
        {activeTab === 'guru' && (
          <div className="card-3d rounded-3xl p-5 sm:p-6 backdrop-blur space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-[#d4af37]/20">
              <div>
                <h3 className="text-lg font-bold text-[#d4af37] text-gold-3d">
                  {settings.text_guru_title || 'Data Guru Pengajar & Wali Kelas per Angkatan'}
                </h3>
                <p className="text-xs text-emerald-200/80 mt-0.5">Tampilan data khusus per angkatan santri yang dipilih (Data Only).</p>
              </div>

              <button
                onClick={() => {
                  setActiveTab('pengaturan');
                  setActiveControlSection('input_guru');
                }}
                className="btn-3d-gold px-4 py-2 text-black font-extrabold text-xs rounded-xl flex items-center gap-2"
              >
                <PlusCircle className="w-3.5 h-3.5 text-black" />
                <span>Input Guru via Option Panel</span>
              </button>
            </div>

            {/* TAB ANGKATAN UNTUK DATA GURU */}
            <div className="flex flex-wrap gap-2">
              {classList.map(kls => (
                <button
                  key={kls}
                  onClick={() => setSelectedAngkatanGuru(kls)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    selectedAngkatanGuru === kls
                      ? 'btn-3d-gold text-black shadow-lg scale-102'
                      : 'btn-3d-dark text-[#f3e5ab]'
                  }`}
                >
                  {kls}
                </button>
              ))}
            </div>

            {/* Tabel Data Guru Pengajar Khusus Angkatan Terpilih */}
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3.5 rounded-xl card-3d-deep">
                <span className="text-xs font-bold text-white">
                  Daftar Pengajar & Mata Pelajaran: <span className="text-[#d4af37]">{selectedAngkatanGuru}</span>
                </span>
                <span className="text-xs text-emerald-300 font-mono font-semibold">
                  {guruList.filter(g => g.kelas === selectedAngkatanGuru).length} Ustadz Pengampu
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-[#d4af37]/30 shadow-inner">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#052216] text-[#d4af37]">
                    <tr>
                      <th className="p-3 w-12 text-center font-bold">NO</th>
                      <th className="p-3 font-bold">NAMA USTADZ / USTADZAH</th>
                      <th className="p-3 font-bold">MATA PELAJARAN DIAMPUS</th>
                      <th className="p-3 font-bold">ANGKATAN / KELAS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d4af37]/10 bg-[#052216]/60">
                    {guruList
                      .filter(g => g.kelas === selectedAngkatanGuru)
                      .map((g, i) => (
                        <tr key={i} className="hover:bg-[#d4af37]/10 transition">
                          <td className="p-3 text-center font-bold text-[#d4af37]">{i + 1}</td>
                          <td className="p-3 font-bold text-white text-sm">{g.nama}</td>
                          <td className="p-3 text-emerald-300 font-medium">{g.mapel}</td>
                          <td className="p-3 text-[#d4af37] font-semibold">{g.kelas}</td>
                        </tr>
                      ))}
                    {guruList.filter(g => g.kelas === selectedAngkatanGuru).length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-emerald-300">
                          Belum ada data guru pengajar yang tercatat untuk angkatan {selectedAngkatanGuru}.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: DATA SANTRI & FOTO PER ANGKATAN */}
        {activeTab === 'santri' && (
          <div className="card-3d rounded-3xl p-5 sm:p-6 backdrop-blur space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-[#d4af37]/20">
              <div>
                <h3 className="text-lg font-bold text-[#d4af37] text-gold-3d">
                  {settings.text_santri_title || 'Data Santri & Foto per Angkatan'}
                </h3>
                <p className="text-xs text-emerald-200/80 mt-0.5">
                  Menampilkan data dan foto santri khusus per angkatan kelas yang dipilih.
                </p>
              </div>

              <button
                onClick={() => {
                  setActiveTab('pengaturan');
                  setActiveControlSection('input_santri');
                }}
                className="btn-3d-gold px-4 py-2 text-black font-extrabold text-xs rounded-xl flex items-center gap-2"
              >
                <PlusCircle className="w-3.5 h-3.5 text-black" />
                <span>Input Santri via Option Panel</span>
              </button>
            </div>

            {/* TAB FILTER ANGKATAN SANTRI DENGAN STYLING 3D MEWAH */}
            <div className="flex flex-wrap gap-2.5">
              {classList.map(kls => {
                const count = santriList.filter(s => s.kelas === kls).length;
                const isSel = selectedAngkatanSantri === kls;
                return (
                  <button
                    key={kls}
                    type="button"
                    onClick={() => setSelectedAngkatanSantri(kls)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black tracking-wide transition-all transform active:scale-95 flex items-center space-x-2 border ${
                      isSel
                        ? 'btn-3d-gold text-black border-[#f5e298] shadow-[0_6px_20px_rgba(212,175,55,0.45),inset_0_2px_2px_rgba(255,255,255,0.6)] scale-105 ring-2 ring-[#f5e298]'
                        : 'btn-3d-dark text-[#f3e5ab] border-[#d4af37]/40 hover:border-[#d4af37] hover:scale-102'
                    }`}
                  >
                    <span className={isSel ? 'text-black font-extrabold' : 'text-[#f3e5ab]'}>{kls}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold shadow-inner ${
                      isSel ? 'bg-black/25 text-black' : 'bg-[#0b422a] text-emerald-300 border border-[#d4af37]/30'
                    }`}>
                      {count} Santri
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Tabel Data Santri Khusus Angkatan Terpilih */}
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-xl bg-[#052216] border border-[#d4af37]/20">
                <span className="text-xs font-bold text-white">
                  Daftar Santri: <span className="text-[#d4af37]">{selectedAngkatanSantri}</span>
                </span>
                <span className="text-xs text-emerald-300 font-mono">
                  {santriList.filter(s => s.kelas === selectedAngkatanSantri).length} Santri Terdaftar
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-[#d4af37]/20">
                <table className="w-full min-w-[950px] text-left text-xs">
                  <thead className="bg-[#052216] text-[#d4af37]">
                    <tr>
                      <th className="p-3 w-12 text-center">NO</th>
                      <th className="p-3 w-16 text-center">FOTO</th>
                      <th className="p-3 w-28">NIS / ID</th>
                      <th className="p-3">NAMA LENGKAP SANTRI</th>
                      <th className="p-3">KAMAR PONDOK</th>
                      <th className="p-3">ALAMAT ASAL</th>
                      <th className="p-3 w-32 text-center">STATUS SANTRI</th>
                      <th className="p-3 w-32 text-center">AKSI / HAPUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d4af37]/10">
                    {santriList
                      .filter(s => s.kelas === selectedAngkatanSantri)
                      .map((s, idx) => (
                        <tr key={s.id} className="hover:bg-[#d4af37]/5 transition">
                          <td className="p-3 text-center font-bold text-[#d4af37]">{idx + 1}</td>
                          <td className="p-2 text-center">
                            <div className="w-10 h-12 mx-auto rounded overflow-hidden border border-[#d4af37]/30 shadow">
                              <img
                                src={s.foto}
                                alt={s.nama}
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLElement).setAttribute('src', 'https://via.placeholder.com/70x90'); }}
                              />
                            </div>
                          </td>
                          <td className="p-3 font-mono font-bold text-[#d4af37]">{s.id}</td>
                          <td className="p-3 font-bold text-white text-sm">
                            <div className="flex items-center space-x-2">
                              <span>{s.nama}</span>
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Santri Aktif Mondok" />
                            </div>
                          </td>
                          <td className="p-3 text-emerald-300 font-medium">{s.kamar || '-'}</td>
                          <td className="p-3 text-emerald-200/80">{s.alamat || '-'}</td>
                          <td className="p-3 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 shadow">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              <span>Aktif Mondok</span>
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Konfirmasi Penghapusan Data Santri:\n\nApakah Anda yakin ingin menghapus data santri:\nNama: ${s.nama}\nNIS: ${s.id}\nKelas: ${s.kelas}\n\nData ini akan dihapus secara manual karena santri sudah tidak mondok (boyong/pindah).`)) {
                                  if (onDeleteSantri) {
                                    onDeleteSantri(s.id);
                                  }
                                }
                              }}
                              className="px-3 py-1.5 rounded-xl bg-red-950/80 hover:bg-red-800 border border-red-500/50 text-red-200 text-xs font-bold inline-flex items-center gap-1.5 transition shadow active:scale-95"
                              title="Hapus data santri yang sudah tidak mondok (boyong)"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                              <span>Hapus</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    {santriList.filter(s => s.kelas === selectedAngkatanSantri).length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-emerald-300">
                          Belum ada data santri yang tercatat untuk angkatan {selectedAngkatanSantri}.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: SETORAN NADZHOM */}
        {activeTab === 'nadzhom' && (
          <div className="card-3d rounded-3xl p-5 sm:p-6 backdrop-blur space-y-6">
            <div className="flex justify-between items-center pb-3 border-b border-[#d4af37]/20">
              <h3 className="text-lg font-bold text-[#d4af37] text-gold-3d">Setoran Nadzhom Seluruh Kelas</h3>
              <span className="text-xs text-emerald-300 font-semibold">(Mode Tampilan Data)</span>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-[#d4af37]/30 shadow-inner">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#052216] text-[#d4af37]">
                  <tr>
                    <th className="p-3 font-bold">NIS</th>
                    <th className="p-3 font-bold">NAMA SANTRI</th>
                    <th className="p-3 font-bold">KITAB NADZHOM</th>
                    <th className="p-3 text-center font-bold">JUMLAH BAIT</th>
                    <th className="p-3 font-bold">STATUS / NILAI</th>
                    <th className="p-3 font-bold">TANGGAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d4af37]/10 bg-[#052216]/60">
                  {nadzhomList.map((n, i) => (
                    <tr key={i} className="hover:bg-[#d4af37]/10 transition">
                      <td className="p-3 font-mono text-[#d4af37]">{n.idSantri}</td>
                      <td className="p-3 font-bold text-white text-sm">{n.nama}</td>
                      <td className="p-3 text-emerald-300 font-medium">{n.kitab}</td>
                      <td className="p-3 text-center font-bold font-mono text-emerald-400">{n.bait} bait</td>
                      <td className="p-3 font-semibold text-white">{n.nilai}</td>
                      <td className="p-3 text-emerald-200/80">{n.tanggal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 8: NILAI UJIAN */}
        {activeTab === 'nilai' && (
          <div className="card-3d rounded-3xl p-5 sm:p-6 backdrop-blur space-y-6">
            <div className="flex justify-between items-center pb-3 border-b border-[#d4af37]/20">
              <h3 className="text-lg font-bold text-[#d4af37] text-gold-3d">Nilai Ujian & Transkrip Akademik</h3>
              <span className="text-xs text-emerald-300 font-semibold">(Mode Tampilan Data)</span>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-[#d4af37]/30 shadow-inner">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#052216] text-[#d4af37]">
                  <tr>
                    <th className="p-3 font-bold">NIS</th>
                    <th className="p-3 font-bold">NAMA SANTRI</th>
                    <th className="p-3 font-bold">KELAS</th>
                    <th className="p-3 font-bold">MATA PELAJARAN</th>
                    <th className="p-3 text-center font-bold">NILAI ANGKA</th>
                    <th className="p-3 font-bold">SEMESTER</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d4af37]/10 bg-[#052216]/60">
                  {nilaiList.map((nl, i) => (
                    <tr key={i} className="hover:bg-[#d4af37]/10 transition">
                      <td className="p-3 font-mono text-[#d4af37]">{nl.idSantri}</td>
                      <td className="p-3 font-bold text-white text-sm">{nl.nama}</td>
                      <td className="p-3 text-emerald-300">{nl.kelas}</td>
                      <td className="p-3 font-semibold text-white">{nl.pelajaran}</td>
                      <td className="p-3 text-center font-mono font-bold text-emerald-400">{nl.nilai}</td>
                      <td className="p-3 text-emerald-200/80">{nl.semester}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 9: OPTION PANEL (PUSAT KONTROL SELURUH FITUR & VISUAL APLIKASI DENGAN PASSWORD KHUSUS) */}
        {activeTab === 'pengaturan' && (
          <div className="card-3d rounded-3xl p-5 sm:p-7 backdrop-blur-md space-y-6">
            {/* Header Option Panel */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#d4af37]/30">
              <div>
                <div className="flex items-center space-x-2">
                  <Sliders className="w-6 h-6 text-[#d4af37]" />
                  <h3 className="text-xl font-bold font-serif text-[#d4af37] text-gold-3d">
                    Option Panel (Pusat Kontrol Sistem)
                  </h3>
                </div>
                <p className="text-xs text-emerald-200/90 mt-1">
                  Pusat kendali seluruh fitur, input manual per angkatan, tombol simpan absensi guru, serta pengaturan visual dan keamanan.
                </p>
              </div>

              {optionPanelUnlocked && (
                <div className="flex items-center gap-2">
                  <span className="text-xs px-3 py-1.5 bg-emerald-950 border border-emerald-500/50 text-emerald-300 rounded-xl flex items-center gap-1.5 shadow">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Akses Terbuka</span>
                  </span>
                  <button
                    onClick={() => setOptionPanelUnlocked(false)}
                    className="text-xs px-3.5 py-1.5 bg-red-950/80 border border-red-500/50 text-red-200 rounded-xl hover:bg-red-900 transition shadow font-bold"
                  >
                    Kunci Kembali
                  </button>
                </div>
              )}
            </div>

            {/* JIKA BELUM MEMASUKKAN PASSWORD OPTION PANEL */}
            {!optionPanelUnlocked ? (
              <div className="max-w-md mx-auto my-8 card-3d rounded-3xl p-6 sm:p-8 text-center space-y-5">
                <div className="w-16 h-16 rounded-full bg-[#0b422a] border-2 border-[#d4af37] mx-auto flex items-center justify-center text-[#d4af37] shadow-xl">
                  <Lock className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white text-gold-3d">Area Terproteksi Sandi Khusus</h4>
                  <p className="text-xs text-emerald-200/80 mt-1">
                    Halaman ini dikunci dengan password proteksi agar hanya pemilik yang dapat mengakses pengaturan pusat.
                  </p>
                </div>

                {optionPasswordError && (
                  <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs font-semibold">
                    {optionPasswordError}
                  </div>
                )}

                <form onSubmit={handleUnlockOptionPanel} className="space-y-4">
                  <div className="text-left">
                    <label className="block text-[11px] font-bold text-[#d4af37] mb-1.5 uppercase tracking-wider">
                      Masukkan Password Option Panel
                    </label>
                    <input
                      type="password"
                      value={optionPasswordInput}
                      onChange={(e) => setOptionPasswordInput(e.target.value)}
                      placeholder="Password proteksi..."
                      required
                      className="w-full px-4 py-2.5 rounded-xl bg-[#03140c] border border-[#d4af37]/40 text-white text-sm focus:outline-none focus:border-[#d4af37] shadow-inner"
                    />
                    <p className="text-[10px] text-emerald-400/80 mt-1">
                      Password bawaan pertama kali: <span className="font-mono text-[#d4af37] font-bold">{settings.password_option_panel || 'admin123'}</span> (Dapat diganti di dalam).
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl btn-3d-gold text-black font-extrabold text-xs flex items-center justify-center gap-2"
                  >
                    <KeyRound className="w-4 h-4 text-black" />
                    <span>Buka Pusat Kontrol</span>
                  </button>
                </form>
              </div>
            ) : (
              /* KONTEN UTAMA OPTION PANEL KETIKA TERBUKA */
              <div className="space-y-6">
                {/* SUB MENU PUSAT KONTROL - 3D BEVELED TILES */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 bg-[#052216]/90 p-2.5 rounded-2xl border border-[#d4af37]/35 shadow-inner">
                  {[
                    { id: 'simpan_absensi', label: 'Absensi Ustadz', icon: Save },
                    { id: 'kelola_berita', label: 'Berita & Caption', icon: Newspaper },
                    { id: 'kelola_pengurus', label: 'Login Pengurus', icon: ShieldAlert },
                    { id: 'kelola_kalender', label: 'Kalender & Rapat', icon: Calendar },
                    { id: 'kelola_ujian_kitab', label: 'Nilai Ujian Kitab', icon: Award },
                    { id: 'profil_santri', label: 'Profil & Pass Wali', icon: UserCheck },
                    { id: 'kelola_syahriyah', label: 'Syahriyah & Notif', icon: CreditCard },
                    { id: 'kelola_uang_saku', label: 'Mutasi Uang Saku', icon: Wallet },
                    { id: 'kelola_kurikulum', label: 'Kurikulum & Kitab', icon: BookOpen },
                    { id: 'input_santri', label: 'Input Santri', icon: Users },
                    { id: 'input_guru', label: 'Input Guru', icon: Award },
                    { id: 'input_jadwal', label: 'Input Jadwal', icon: Calendar },
                    { id: 'kontrol_tombol', label: 'Tombol & Teks', icon: Settings2 },
                    { id: 'visual_branding', label: 'Logo & Visual', icon: Palette },
                    { id: 'keamanan', label: 'Kata Sandi Admin', icon: Lock }
                  ].map(sec => {
                    const SecIcon = sec.icon;
                    const isSecActive = activeControlSection === sec.id;
                    return (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() => setActiveControlSection(sec.id as any)}
                        className={`p-2.5 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition text-center ${
                          isSecActive
                            ? 'btn-3d-gold text-black shadow-lg scale-102 font-extrabold'
                            : 'btn-3d-dark text-[#f3e5ab] hover:text-white'
                        }`}
                      >
                        <SecIcon className="w-4 h-4 shrink-0" />
                        <span className="leading-tight text-[11px] line-clamp-2">{sec.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* SECTION 1: PENGINPUTAN STATUS KEHADIRAN GURU & RESET HARIAN TERPUSAT */}
                {activeControlSection === 'simpan_absensi' && (
                  <div className="bg-[#052216]/90 border border-[#d4af37]/30 rounded-2xl p-5 space-y-6">
                    {/* Header Bagian Penginputan Kehadiran Guru */}
                    <div className="flex items-center space-x-2 border-b border-[#d4af37]/20 pb-3">
                      <Save className="w-5 h-5 text-[#d4af37]" />
                      <div>
                        <h4 className="text-sm font-bold text-white text-gold-3d">
                          Pusat Penginputan & Penyimpanan Kehadiran Ustadz / Guru
                        </h4>
                        <p className="text-[11px] text-emerald-300">
                          Sesuai permintaan Anda, seluruh peninputan status kehadiran guru (Hadir, Terlambat, Izin, Alpha) dan catatan materi dikelola di Option Panel ini.
                        </p>
                      </div>
                    </div>

                    {/* Filter Kelas & Hari */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-[#03140c] p-4 rounded-xl border border-[#d4af37]/20 space-y-2">
                        <label className="text-xs font-bold text-[#d4af37] block">Pilih Angkatan Target</label>
                        <select
                          value={guruSelectedClass}
                          onChange={(e) => handleSelectGuruClass(e.target.value)}
                          className="w-full bg-[#052216] border border-[#d4af37]/40 rounded-xl p-2.5 text-xs text-white"
                        >
                          {classList.map(kls => (
                            <option key={kls} value={kls}>{kls}</option>
                          ))}
                        </select>
                      </div>

                      <div className="bg-[#03140c] p-4 rounded-xl border border-[#d4af37]/20 space-y-2">
                        <label className="text-xs font-bold text-emerald-300 block">Pilih Hari Pelajaran</label>
                        <select
                          value={guruSelectedDay}
                          onChange={(e) => setGuruSelectedDay(e.target.value)}
                          className="w-full bg-[#052216] border border-[#d4af37]/40 rounded-xl p-2.5 text-xs text-white"
                        >
                          {availableDays.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Tabel Input Status & Catatan Materi Pengajar */}
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <span className="text-xs font-bold text-[#d4af37]">
                          Daftar Jam Pelajaran: {guruSelectedClass} — Hari {guruSelectedDay}
                        </span>
                        <button
                          type="button"
                          onClick={handleMarkAllGuruHadir}
                          style={{ color: settings.btn_hadir_semua_color || '#ffffff' }}
                          className="btn-3d-emerald px-3 py-1.5 font-bold text-xs rounded-xl self-end"
                        >
                          ✓ Hadirkan Semua Pengajar
                        </button>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-[#d4af37]/20">
                        <table className="w-full min-w-[720px] text-left text-xs">
                          <thead className="bg-[#03180f] text-[#d4af37]">
                            <tr>
                              <th className="p-3 w-14 text-center">JAM</th>
                              <th className="p-3 w-32">WAKTU</th>
                              <th className="p-3">MATA PELAJARAN</th>
                              <th className="p-3">USTADZ / USTADZAH</th>
                              <th className="p-3 w-36">STATUS</th>
                              <th className="p-3 min-w-[180px]">CATATAN MATERI</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#d4af37]/10 bg-[#052216]">
                            {jadwalList
                              .filter(j => j.kelas === guruSelectedClass && j.hari.toUpperCase() === guruSelectedDay.toUpperCase())
                              .map((item, idx) => {
                                const key = `${item.kelas}_${item.hari}_${item.jamKe}`;
                                const current = guruAbsensiState[key] || { status: 'Hadir', catatan: '' };

                                return (
                                  <tr key={idx} className="hover:bg-[#d4af37]/5 transition">
                                    <td className="p-2.5 text-center">
                                      <span className="inline-block w-7 h-7 rounded-lg bg-[#0a301f] text-[#d4af37] font-bold border border-[#d4af37]/30 leading-7">
                                        {item.jamKe}
                                      </span>
                                    </td>
                                    <td className="p-2.5 font-mono text-white font-medium">{item.waktu}</td>
                                    <td className="p-2.5 font-bold text-white">{item.mapel}</td>
                                    <td className="p-2.5 text-[#d4af37] font-semibold">{item.nama}</td>
                                    <td className="p-2.5">
                                      <select
                                        value={current.status}
                                        onChange={(e) => setGuruAbsensiState({
                                          ...guruAbsensiState,
                                          [key]: { ...current, status: e.target.value as any }
                                        })}
                                        className="w-full bg-[#03140c] border border-[#d4af37]/40 rounded-lg p-1.5 text-xs font-bold text-[#f3e5ab] focus:outline-none"
                                      >
                                        <option value="Hadir">Hadir</option>
                                        <option value="Terlambat">Terlambat</option>
                                        <option value="Izin">Izin</option>
                                        <option value="Alpha">Alpha</option>
                                      </select>
                                    </td>
                                    <td className="p-2.5">
                                      <input
                                        type="text"
                                        value={current.catatan}
                                        placeholder="Catatan materi pokok..."
                                        onChange={(e) => setGuruAbsensiState({
                                          ...guruAbsensiState,
                                          [key]: { ...current, catatan: e.target.value }
                                        })}
                                        className="w-full bg-[#03140c] border border-[#d4af37]/30 rounded-lg p-1.5 text-xs text-white"
                                      />
                                    </td>
                                  </tr>
                                );
                              })}
                            {jadwalList.filter(j => j.kelas === guruSelectedClass && j.hari.toUpperCase() === guruSelectedDay.toUpperCase()).length === 0 && (
                              <tr>
                                <td colSpan={6} className="p-6 text-center text-emerald-300">
                                  Belum ada jadwal untuk {guruSelectedClass} pada {guruSelectedDay}. Tambahkan di menu 'Input Jadwal'.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={handleSaveGuruAbsensiSubmit}
                          style={{ color: settings.btn_simpan_guru_color || '#000000' }}
                          className="btn-3d-gold px-6 py-2.5 font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-lg"
                        >
                          <Save className="w-4 h-4" />
                          <span>{settings.btn_simpan_guru_text || 'SIMPAN ABSENSI GURU'}</span>
                        </button>
                      </div>
                    </div>

                    {/* SUB-BLOK: SIMPAN REKAP & RESET HARIAN (DIPINDAHKAN DARI DASHBOARD UTAMA) */}
                    <div className="card-3d-deep p-5 rounded-2xl border border-[#d4af37]/40 space-y-4 mt-6">
                      <div className="flex items-center space-x-3 pb-3 border-b border-[#d4af37]/20">
                        <div className="w-9 h-9 rounded-xl bg-[#0b3824] border border-[#d4af37]/50 flex items-center justify-center text-[#d4af37] shadow">
                          <RotateCcw className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-white text-gold-3d">
                            Pusat Arsip: Simpan Rekap & Reset Harian
                          </h4>
                          <p className="text-[11px] text-emerald-300">
                            Tombol ini telah dipindahkan dari Dashboard Utama ke Option Panel sesuai arahan sistem.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                        <div className="bg-[#052216] p-2.5 rounded-xl border border-[#d4af37]/20">
                          <span className="text-[10px] text-emerald-300 block">Santri Hadir Hari Ini</span>
                          <span className="text-base font-extrabold text-white">{stats.hadirSantri}</span>
                        </div>
                        <div className="bg-[#052216] p-2.5 rounded-xl border border-[#d4af37]/20">
                          <span className="text-[10px] text-amber-300 block">Santri Izin/Sakit</span>
                          <span className="text-base font-extrabold text-white">{(stats.izinSantri || 0) + (stats.sakitSantri || 0)}</span>
                        </div>
                        <div className="bg-[#052216] p-2.5 rounded-xl border border-[#d4af37]/20">
                          <span className="text-[10px] text-red-400 block">Santri Alpha</span>
                          <span className="text-base font-extrabold text-white">{stats.alphaSantri}</span>
                        </div>
                        <div className="bg-[#052216] p-2.5 rounded-xl border border-[#d4af37]/20">
                          <span className="text-[10px] text-[#d4af37] block">Pengajar Hadir</span>
                          <span className="text-base font-extrabold text-white">{stats.hadirGuru}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 pt-3 border-t border-[#d4af37]/20">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                          <span className="text-[11px] text-emerald-200/90 font-medium">
                            📁 <b>Unduh Data Harian Langsung:</b> Anda dapat mengunduh rekapitulasi data kehadiran harian ke format Google Spreadsheet (CSV), Microsoft Word (.doc), atau Cetak / PDF resmi sebelum mereset sesi.
                          </span>
                          
                          {/* TOMBOL UNDUH DATA HARIAN LANGSUNG KE GOOGLE SPREADSHEET, WORD, PDF */}
                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                const todayStr = new Date().toISOString().split('T')[0];
                                const headers = ['TANGGAL', 'KATEGORI', 'IDENTITAS/NAMA', 'KELAS/MAPEL', 'STATUS KEHADIRAN', 'KETERANGAN'];
                                const santriRows = (absensiSantriList.length > 0 ? absensiSantriList : santriList.slice(0, 15)).map(s => [
                                  todayStr, 'SANTRI', (s as any).nama, (s as any).kelas, (s as any).status || 'Hadir', (s as any).keterangan || 'Presensi Harian'
                                ]);
                                const guruRows = (absensiGuruList.length > 0 ? absensiGuruList : guruList.slice(0, 8)).map(g => [
                                  todayStr, 'USTADZ', g.nama, g.mapel || (g as any).kelas || '-', (g as any).status || 'Hadir', (g as any).catatan || 'Jadwal Mengajar'
                                ]);
                                downloadCSV(`Rekap_Harian_${todayStr}`, headers, [...santriRows, ...guruRows]);
                              }}
                              className="px-3.5 py-2 rounded-xl bg-[#093d25] border border-[#d4af37]/60 text-[#f3e5ab] font-bold text-xs flex items-center gap-1.5 hover:bg-[#0c4e30] transition shadow"
                              title="Unduh Data Harian format Google Spreadsheet / CSV"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Google Spreadsheet</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const todayStr = new Date().toISOString().split('T')[0];
                                const headers = ['NO', 'KATEGORI', 'NAMA LENGKAP', 'KELAS / MAPEL', 'STATUS', 'KETERANGAN'];
                                const santriRows = (absensiSantriList.length > 0 ? absensiSantriList : santriList.slice(0, 15)).map((s, i) => [
                                  i + 1, 'SANTRI', (s as any).nama, (s as any).kelas, (s as any).status || 'Hadir', (s as any).keterangan || 'Presensi Harian'
                                ]);
                                const guruRows = (absensiGuruList.length > 0 ? absensiGuruList : guruList.slice(0, 8)).map((g, i) => [
                                  santriRows.length + i + 1, 'USTADZ', g.nama, g.mapel || (g as any).kelas || '-', (g as any).status || 'Hadir', (g as any).catatan || 'Jadwal Mengajar'
                                ]);
                                downloadWord(
                                  `Rekap_Harian_${todayStr}`,
                                  `REKAPITULASI DATA PRESENSI HARIAN (${todayStr})`,
                                  headers,
                                  [...santriRows, ...guruRows]
                                );
                              }}
                              className="px-3.5 py-2 rounded-xl bg-blue-950/80 border border-blue-500/50 text-blue-200 font-bold text-xs flex items-center gap-1.5 hover:bg-blue-900 transition shadow"
                              title="Unduh Dokumen Microsoft Word"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Word (.doc)</span>
                            </button>

                            <button
                              type="button"
                              onClick={printTable}
                              className="px-3.5 py-2 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 font-bold text-xs flex items-center gap-1.5 hover:bg-emerald-900 transition shadow"
                              title="Cetak Dokumen atau Simpan PDF"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Cetak PDF</span>
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#d4af37]/15">
                          <span className="text-[11px] text-amber-200/80">
                            ⚡ Dashboard otomatis mulai dari nol saat berganti hari. Tombol di bawah dapat digunakan jika Anda ingin mereset sesi aktif secara manual sekarang:
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('Simpan rekap kehadiran hari ini dan reset formulir untuk hari baru?')) {
                                onSaveDashboardAndReset();
                              }
                            }}
                            style={{ color: settings.btn_reset_harian_color || '#ffffff' }}
                            className="btn-3d-emerald px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 whitespace-nowrap shadow-lg"
                          >
                            <RotateCcw className="w-4 h-4" />
                            <span>{settings.btn_reset_harian_text || 'Simpan Rekap & Reset Harian'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SECTION: KELOLA BERITA TERKINI & CAPTION (EDITABLE DI OPTION PANEL) */}
                {activeControlSection === 'kelola_berita' && (
                  <div className="bg-[#052216]/90 border border-[#d4af37]/30 rounded-2xl p-5 sm:p-6 space-y-6">
                    <div className="flex items-center space-x-2 border-b border-[#d4af37]/20 pb-3">
                      <Newspaper className="w-5 h-5 text-[#d4af37]" />
                      <div>
                        <h4 className="text-sm sm:text-base font-bold text-white text-gold-3d">
                          Pusat Kelola Berita Terkini & Caption Papan Informasi
                        </h4>
                        <p className="text-[11px] text-emerald-300">
                          Sesuai permintaan Anda, gambar berita, judul, caption deskripsi, dan maklumat teks berjalan di Dashboard Utama dapat diedit secara langsung melalui Option Panel ini.
                        </p>
                      </div>
                    </div>

                    {/* Preview Langsung Berita Saat Ini */}
                    <div className="card-3d-deep p-4 rounded-2xl border border-[#d4af37]/30 space-y-3">
                      <span className="text-xs font-bold text-[#d4af37] block uppercase tracking-wider">
                        Pratinjau Tampilan Berita Terkini (Live Preview):
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-12 rounded-xl overflow-hidden border border-[#d4af37]/30 bg-[#03150d]">
                        <div className="md:col-span-5 h-36 md:h-auto overflow-hidden">
                          <img
                            src={visualForm.berita_image_url || 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=1200&auto=format&fit=crop&q=80'}
                            alt="Preview Berita"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).setAttribute('src', 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80');
                            }}
                          />
                        </div>
                        <div className="md:col-span-7 p-4 space-y-2">
                          <span className="px-2 py-0.5 rounded-full bg-[#d4af37] text-black font-extrabold text-[9px] uppercase">
                            Layar Berita Terkini
                          </span>
                          <h5 className="font-extrabold text-white text-sm">
                            {visualForm.berita_title || 'Judul Berita'}
                          </h5>
                          <p className="text-xs text-emerald-200 line-clamp-3">
                            {visualForm.berita_deskripsi || 'Caption deskripsi berita...'}
                          </p>
                        </div>
                      </div>
                      <div className="bg-[#020e08] p-2.5 rounded-xl border border-[#d4af37]/20 text-xs text-[#f5e298] font-mono flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-red-950 text-red-300 rounded font-bold text-[10px]">MAKLUMAT:</span>
                        <span className="truncate">{visualForm.running_text_caption}</span>
                      </div>
                    </div>

                    {/* Formulir Edit Berita */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        onSaveSettings(visualForm);
                        alert('Berita Terkini, Caption, dan Teks Berjalan berhasil disimpan dan langsung tayang di Dashboard Utama!');
                      }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="text-xs font-bold text-[#d4af37] block mb-1">
                          URL Link Gambar Berita Terkini:
                        </label>
                        <input
                          type="url"
                          value={visualForm.berita_image_url}
                          onChange={(e) => setVisualForm({ ...visualForm, berita_image_url: e.target.value })}
                          className="w-full bg-[#02180e] border border-[#d4af37]/40 rounded-xl p-2.5 text-xs text-white"
                          placeholder="https://images.unsplash.com/..."
                          required
                        />
                        <p className="text-[10px] text-emerald-400/80 mt-1">
                          Masukkan URL gambar kegiatan pondok atau foto kegiatan madrasah diniyah.
                        </p>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-[#d4af37] block mb-1">
                          Judul Berita Terkini:
                        </label>
                        <input
                          type="text"
                          value={visualForm.berita_title}
                          onChange={(e) => setVisualForm({ ...visualForm, berita_title: e.target.value })}
                          className="w-full bg-[#02180e] border border-[#d4af37]/40 rounded-xl p-2.5 text-xs text-white font-bold"
                          placeholder="e.g. Evaluasi Perkembangan Pembelajaran & Nadzhom Santri"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-[#d4af37] block mb-1">
                          Caption / Keterangan Berita Terkini:
                        </label>
                        <textarea
                          rows={3}
                          value={visualForm.berita_deskripsi}
                          onChange={(e) => setVisualForm({ ...visualForm, berita_deskripsi: e.target.value })}
                          className="w-full bg-[#02180e] border border-[#d4af37]/40 rounded-xl p-2.5 text-xs text-white resize-none"
                          placeholder="Tuliskan keterangan detail maklumat atau berita pondok..."
                          required
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-[#d4af37] block mb-1">
                          Teks Berjalan Caption Maklumat (Running Text Marquee):
                        </label>
                        <textarea
                          rows={2}
                          value={visualForm.running_text_caption}
                          onChange={(e) => setVisualForm({ ...visualForm, running_text_caption: e.target.value })}
                          className="w-full bg-[#02180e] border border-[#d4af37]/40 rounded-xl p-2.5 text-xs text-white resize-none"
                          placeholder="Maklumat penting yang akan bergerak otomatis di bawah layar berita..."
                          required
                        />
                      </div>

                      <div className="pt-3 border-t border-[#d4af37]/20 flex justify-end">
                        <button
                          type="submit"
                          className="btn-3d-gold px-6 py-2.5 text-black font-black text-xs rounded-xl flex items-center gap-2 shadow"
                        >
                          <Save className="w-4 h-4 text-black" />
                          <span>Simpan & Tayangkan Berita Terkini</span>
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* SECTION: KELOLA NAMA & KATA SANDI LOGIN PENGURUS */}
                {activeControlSection === 'kelola_pengurus' && (
                  <div className="bg-[#052216]/90 border border-[#d4af37]/30 rounded-2xl p-5 space-y-6">
                    <div className="flex items-center space-x-2 border-b border-[#d4af37]/20 pb-3">
                      <ShieldAlert className="w-5 h-5 text-[#d4af37]" />
                      <div>
                        <h4 className="text-sm font-bold text-white text-gold-3d">
                          Kelola Akun, Nama, & Kata Sandi Login Pengurus Pondok
                        </h4>
                        <p className="text-[11px] text-emerald-300">
                          Sesuai permintaan Anda, sandi login pengurus menggunakan nama pengurus dan password yang dapat diatur/diedit secara mandiri melalui Option Panel ini.
                        </p>
                      </div>
                    </div>

                    {/* Pilih Pengurus yang akan diedit */}
                    <div className="bg-[#03140c] p-4 rounded-xl border border-[#d4af37]/20 space-y-3">
                      <label className="text-xs font-bold text-[#d4af37] block">
                        Pilih Pengurus yang Ingin Diedit Sandinya:
                      </label>
                      <select
                        value={selectedPengurusId}
                        onChange={(e) => setSelectedPengurusId(e.target.value)}
                        className="w-full bg-[#052216] border border-[#d4af37]/40 rounded-xl p-2.5 text-xs text-white"
                      >
                        {pengurusList.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.nama} — {p.jabatan} ({p.id})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Form Edit Pengurus & Password */}
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (onUpdatePengurus && currentSelectedPengurus) {
                          onUpdatePengurus({
                            ...currentSelectedPengurus,
                            nama: pengurusEditForm.nama,
                            password: pengurusEditForm.password,
                            jabatan: pengurusEditForm.jabatan,
                            noWa: pengurusEditForm.noWa,
                            kelasBimbingan: pengurusEditForm.kelasBimbingan,
                            mapel: pengurusEditForm.mapel,
                            tugasUtama: pengurusEditForm.tugasUtama
                          });
                          alert(`Data & Kata Sandi Login untuk Pengurus "${pengurusEditForm.nama}" berhasil diperbarui! Pengurus dapat langsung login dengan nama ini dan password baru.`);
                        }
                      }}
                      className="card-3d rounded-xl p-5 space-y-4 border border-[#d4af37]/30"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-white block mb-1">
                            Nama Pengurus (Digunakan Sebagai Identitas Login):
                          </label>
                          <input
                            type="text"
                            value={pengurusEditForm.nama}
                            onChange={(e) => setPengurusEditForm({ ...pengurusEditForm, nama: e.target.value })}
                            className="w-full bg-[#02180e] border border-[#d4af37]/40 rounded-xl p-2.5 text-xs text-white"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-[#d4af37] block mb-1">
                            Kata Sandi Login Pengurus (Dapat Diedit Bebas):
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={pengurusEditForm.password}
                              onChange={(e) => setPengurusEditForm({ ...pengurusEditForm, password: e.target.value })}
                              className="w-full bg-[#02180e] border border-[#d4af37]/50 rounded-xl p-2.5 text-xs text-[#d4af37] font-mono font-bold"
                              required
                              placeholder="Masukkan password pengurus..."
                            />
                            <span className="absolute right-3 top-2.5 text-[10px] text-emerald-400 font-mono">
                              Login Pass
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-emerald-200 block mb-1">
                            Jabatan / Tanggung Jawab:
                          </label>
                          <input
                            type="text"
                            value={pengurusEditForm.jabatan}
                            onChange={(e) => setPengurusEditForm({ ...pengurusEditForm, jabatan: e.target.value })}
                            className="w-full bg-[#02180e] border border-[#d4af37]/40 rounded-xl p-2.5 text-xs text-white"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-emerald-200 block mb-1">
                            Nomor WhatsApp Pengurus:
                          </label>
                          <input
                            type="text"
                            value={pengurusEditForm.noWa}
                            onChange={(e) => setPengurusEditForm({ ...pengurusEditForm, noWa: e.target.value })}
                            className="w-full bg-[#02180e] border border-[#d4af37]/40 rounded-xl p-2.5 text-xs text-white"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-emerald-200 block mb-1">
                            Kelas Bimbingan / Khidmat:
                          </label>
                          <input
                            type="text"
                            value={pengurusEditForm.kelasBimbingan}
                            onChange={(e) => setPengurusEditForm({ ...pengurusEditForm, kelasBimbingan: e.target.value })}
                            className="w-full bg-[#02180e] border border-[#d4af37]/40 rounded-xl p-2.5 text-xs text-white"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-emerald-200 block mb-1">
                            Mata Pelajaran yang Diampu:
                          </label>
                          <input
                            type="text"
                            value={pengurusEditForm.mapel}
                            onChange={(e) => setPengurusEditForm({ ...pengurusEditForm, mapel: e.target.value })}
                            className="w-full bg-[#02180e] border border-[#d4af37]/40 rounded-xl p-2.5 text-xs text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-emerald-200 block mb-1">
                          Deskripsi Tugas Utama Pengurus:
                        </label>
                        <textarea
                          rows={2}
                          value={pengurusEditForm.tugasUtama}
                          onChange={(e) => setPengurusEditForm({ ...pengurusEditForm, tugasUtama: e.target.value })}
                          className="w-full bg-[#02180e] border border-[#d4af37]/40 rounded-xl p-2.5 text-xs text-white resize-none"
                        />
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          className="btn-3d-gold px-6 py-2.5 text-black font-extrabold text-xs rounded-xl flex items-center gap-2 shadow"
                        >
                          <Save className="w-4 h-4 text-black" />
                          <span>Simpan Perubahan & Sandi Pengurus</span>
                        </button>
                      </div>
                    </form>

                    {/* Tabel Seluruh Akun Pengurus */}
                    <div className="space-y-2">
                      <span className="text-xs text-[#d4af37] font-bold block">
                        Daftar Akun Pengurus & Kredensial Login
                      </span>
                      <div className="overflow-x-auto rounded-xl border border-[#d4af37]/25">
                        <table className="w-full text-xs text-left min-w-[700px]">
                          <thead className="bg-[#03140c] text-[#d4af37] border-b border-[#d4af37]/30">
                            <tr>
                              <th className="p-3">Nama Pengurus (Username)</th>
                              <th className="p-3">Kata Sandi</th>
                              <th className="p-3">Jabatan</th>
                              <th className="p-3">No. WhatsApp</th>
                              <th className="p-3">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#d4af37]/10 bg-[#020e08]/70">
                            {pengurusList.map(p => (
                              <tr key={p.id} className="hover:bg-[#d4af37]/5">
                                <td className="p-3 font-bold text-white">{p.nama}</td>
                                <td className="p-3 font-mono font-bold text-[#d4af37]">{p.password || 'pengurus123'}</td>
                                <td className="p-3 text-emerald-300">{p.jabatan}</td>
                                <td className="p-3 text-slate-300 font-mono">{p.noWa}</td>
                                <td className="p-3">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedPengurusId(p.id)}
                                    className="px-2 py-1 bg-[#d4af37]/20 hover:bg-[#d4af37] text-[#d4af37] hover:text-black font-bold rounded-lg transition"
                                  >
                                    Edit Sandi
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* SECTION: KELOLA KALENDER AKADEMIK & NOTIFIKASI RAPAT */}
                {activeControlSection === 'kelola_kalender' && (
                  <div className="bg-[#052216]/90 border border-[#d4af37]/30 rounded-2xl p-5 space-y-6">
                    <div className="flex items-center space-x-2 border-b border-[#d4af37]/20 pb-3">
                      <Calendar className="w-5 h-5 text-[#d4af37]" />
                      <div>
                        <h4 className="text-sm font-bold text-white text-gold-3d">
                          Kalender Akademik & Notifikasi Agenda Madrasah
                        </h4>
                        <p className="text-[11px] text-emerald-300">
                          Sesuai permintaan Anda, ketika madrasah ada event/rapat, notifikasinya langsung muncul pada dashboard utama pengurus secara otomatis.
                        </p>
                      </div>
                    </div>

                    {/* Form Input Event / Rapat Baru */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!kalenderForm.judul.trim()) {
                          alert('Judul agenda wajib diisi!');
                          return;
                        }
                        const newEvent: KalenderAkademikEvent = {
                          id: `EVT-${Date.now().toString().slice(-4)}`,
                          judul: kalenderForm.judul.trim(),
                          tanggalMulai: kalenderForm.tanggalMulai,
                          tanggalSelesai: kalenderForm.tanggalSelesai || undefined,
                          kategori: kalenderForm.kategori,
                          deskripsi: kalenderForm.deskripsi,
                          lokasi: kalenderForm.lokasi,
                          waktu: kalenderForm.waktu,
                          isUrgentNotif: kalenderForm.isUrgentNotif,
                          sasaran: kalenderForm.sasaran
                        };
                        if (onSaveKalender) {
                          onSaveKalender(newEvent);
                        }
                        alert(`Agenda "${kalenderForm.judul}" berhasil disimpan! Notifikasi akan langsung tampil di Dashboard Pengurus.`);
                        setKalenderForm({
                          judul: '',
                          tanggalMulai: new Date().toISOString().split('T')[0],
                          tanggalSelesai: '',
                          kategori: 'Rapat',
                          deskripsi: '',
                          lokasi: 'Aula Utama Pondok',
                          waktu: '20.00 - 22.00 WIB',
                          isUrgentNotif: true,
                          sasaran: 'Seluruh Dewan Asatidz & Pengurus'
                        });
                      }}
                      className="card-3d rounded-xl p-5 space-y-4 border border-[#d4af37]/30"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <label className="text-xs font-bold text-[#d4af37] block mb-1">
                            Judul Agenda / Rapat:
                          </label>
                          <input
                            type="text"
                            value={kalenderForm.judul}
                            onChange={(e) => setKalenderForm({ ...kalenderForm, judul: e.target.value })}
                            className="w-full bg-[#02180e] border border-[#d4af37]/40 rounded-xl p-2.5 text-xs text-white"
                            placeholder="e.g. Rapat Pleno Evaluasi Semester Ganjil Dewan Asatidz"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-emerald-200 block mb-1">
                            Kategori Agenda:
                          </label>
                          <select
                            value={kalenderForm.kategori}
                            onChange={(e) => setKalenderForm({ ...kalenderForm, kategori: e.target.value as any })}
                            className="w-full bg-[#02180e] border border-[#d4af37]/40 rounded-xl p-2.5 text-xs text-white"
                          >
                            <option value="Rapat">Rapat Dewan Pengurus / Asatidz</option>
                            <option value="Ujian">Ujian Madrasah / Semester</option>
                            <option value="Pengajian">Pengajian Kitab Akbar</option>
                            <option value="Kegiatan">Kegiatan Santri / Pondok</option>
                            <option value="Libur">Libur Madrasah</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-emerald-200 block mb-1">
                            Tanggal Pelaksanaan:
                          </label>
                          <input
                            type="date"
                            value={kalenderForm.tanggalMulai}
                            onChange={(e) => setKalenderForm({ ...kalenderForm, tanggalMulai: e.target.value })}
                            className="w-full bg-[#02180e] border border-[#d4af37]/40 rounded-xl p-2.5 text-xs text-white"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-emerald-200 block mb-1">
                            Waktu / Jam:
                          </label>
                          <input
                            type="text"
                            value={kalenderForm.waktu}
                            onChange={(e) => setKalenderForm({ ...kalenderForm, waktu: e.target.value })}
                            className="w-full bg-[#02180e] border border-[#d4af37]/40 rounded-xl p-2.5 text-xs text-white"
                            placeholder="e.g. 20.00 - 22.00 WIB"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-emerald-200 block mb-1">
                            Lokasi Kegiatan:
                          </label>
                          <input
                            type="text"
                            value={kalenderForm.lokasi}
                            onChange={(e) => setKalenderForm({ ...kalenderForm, lokasi: e.target.value })}
                            className="w-full bg-[#02180e] border border-[#d4af37]/40 rounded-xl p-2.5 text-xs text-white"
                            placeholder="e.g. Gedung Aula Pondok"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-emerald-200 block mb-1">
                          Sasaran Peserta Agenda:
                        </label>
                        <input
                          type="text"
                          value={kalenderForm.sasaran}
                          onChange={(e) => setKalenderForm({ ...kalenderForm, sasaran: e.target.value })}
                          className="w-full bg-[#02180e] border border-[#d4af37]/40 rounded-xl p-2.5 text-xs text-white"
                          placeholder="e.g. Seluruh Dewan Asatidz & Pengurus Harian"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-emerald-200 block mb-1">
                          Keterangan / Deskripsi Acara:
                        </label>
                        <textarea
                          rows={2}
                          value={kalenderForm.deskripsi}
                          onChange={(e) => setKalenderForm({ ...kalenderForm, deskripsi: e.target.value })}
                          className="w-full bg-[#02180e] border border-[#d4af37]/40 rounded-xl p-2.5 text-xs text-white resize-none"
                          placeholder="Tuliskan agenda rapat atau rincian kegiatan..."
                        />
                      </div>

                      <div className="flex items-center gap-3 bg-[#02180e] p-3 rounded-xl border border-[#d4af37]/25">
                        <input
                          type="checkbox"
                          id="urgentToggle"
                          checked={kalenderForm.isUrgentNotif}
                          onChange={(e) => setKalenderForm({ ...kalenderForm, isUrgentNotif: e.target.checked })}
                          className="w-4 h-4 accent-[#d4af37]"
                        />
                        <label htmlFor="urgentToggle" className="text-xs text-white font-bold cursor-pointer">
                          🔥 Aktifkan Notifikasi Mendesak (Langsung Muncul Banner Merah di Dasbor Pengurus)
                        </label>
                      </div>

                      <div className="text-right pt-2 border-t border-[#d4af37]/20">
                        <button
                          type="submit"
                          className="btn-3d-gold px-6 py-2.5 text-black font-extrabold text-xs rounded-xl flex items-center gap-2 ml-auto shadow"
                        >
                          <PlusCircle className="w-4 h-4 text-black" />
                          <span>Simpan Agenda & Terbitkan Notifikasi</span>
                        </button>
                      </div>
                    </form>

                    {/* Tabel Daftar Agenda Kalender */}
                    <div className="space-y-2">
                      <span className="text-xs text-[#d4af37] font-bold block">
                        Daftar Agenda & Event Madrasah Terjadwal
                      </span>
                      <div className="overflow-x-auto rounded-xl border border-[#d4af37]/25">
                        <table className="w-full text-xs text-left min-w-[700px]">
                          <thead className="bg-[#03140c] text-[#d4af37] border-b border-[#d4af37]/30">
                            <tr>
                              <th className="p-3">Kategori</th>
                              <th className="p-3">Judul Agenda</th>
                              <th className="p-3">Tanggal & Waktu</th>
                              <th className="p-3">Lokasi</th>
                              <th className="p-3 text-center">Status Notif</th>
                              <th className="p-3 text-center">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#d4af37]/10 bg-[#020e08]/70">
                            {kalenderList.map(evt => (
                              <tr key={evt.id} className="hover:bg-[#d4af37]/5">
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    evt.kategori === 'Rapat' ? 'bg-red-950 text-red-300 border border-red-500/40' :
                                    evt.kategori === 'Ujian' ? 'bg-amber-950 text-amber-300 border border-amber-500/40' :
                                    'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                  }`}>
                                    {evt.kategori}
                                  </span>
                                </td>
                                <td className="p-3 font-bold text-white">{evt.judul}</td>
                                <td className="p-3 text-slate-300 font-mono">{evt.tanggalMulai} {evt.waktu ? `(${evt.waktu})` : ''}</td>
                                <td className="p-3 text-emerald-300">{evt.lokasi}</td>
                                <td className="p-3 text-center">
                                  {evt.isUrgentNotif ? (
                                    <span className="px-2 py-0.5 rounded bg-red-600/30 text-red-300 border border-red-500/40 text-[10px] font-bold">
                                      Muncul di Pengurus
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-[10px]">Normal</span>
                                  )}
                                </td>
                                <td className="p-3 text-center">
                                  {onDeleteKalender && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (window.confirm(`Hapus agenda "${evt.judul}"?`)) {
                                          onDeleteKalender(evt.id);
                                        }
                                      }}
                                      className="p-1 rounded bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-red-300"
                                      title="Hapus Agenda"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* SECTION: KELOLA UJIAN MUHAFADZOH, KOREKSIAN KITAB, & BACA KITAB (TERKONEKSI KE WALI) */}
                {activeControlSection === 'kelola_ujian_kitab' && (
                  <div className="bg-[#052216]/90 border border-[#d4af37]/30 rounded-2xl p-5 space-y-6">
                    <div className="flex items-center space-x-2 border-b border-[#d4af37]/20 pb-3">
                      <Award className="w-5 h-5 text-[#d4af37]" />
                      <div>
                        <h4 className="text-sm font-bold text-white text-gold-3d">
                          Atur Nilai Ujian Muhafadzoh, Koreksian Kitab, & Baca Kitab
                        </h4>
                        <p className="text-[11px] text-emerald-300">
                          Sesuai permintaan Anda, seluruh penilaian ini diatur melalui Option Panel ini dan terhubung langsung ke kolom bawah profil anak di Dashboard Wali Santri.
                        </p>
                      </div>
                    </div>

                    {/* Pilih Santri Target */}
                    <div className="bg-[#03140c] p-4 rounded-xl border border-[#d4af37]/20 space-y-2">
                      <label className="text-xs font-bold text-[#d4af37] block">
                        Pilih Santri Target Penilaian:
                      </label>
                      <select
                        value={selectedUjianSantriId}
                        onChange={(e) => setSelectedUjianSantriId(e.target.value)}
                        className="w-full bg-[#052216] border border-[#d4af37]/40 rounded-xl p-2.5 text-xs text-white"
                      >
                        {santriList.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.nama} ({s.id} — {s.kelas})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Form 3 Kolom Penilaian */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!currentUjianSantri) return;

                        // 1. Perbarui profil santri dengan nilai ujian terbaru
                        const updatedSantri: Santri = {
                          ...currentUjianSantri,
                          nilaiKoreksianKitab: Number(ujianKitabForm.nilaiKoreksianKitab),
                          predikatKoreksianKitab: ujianKitabForm.predikatKoreksianKitab,
                          nilaiMuhafadzoh: Number(ujianKitabForm.nilaiMuhafadzoh),
                          predikatMuhafadzoh: ujianKitabForm.predikatMuhafadzoh,
                          nilaiBacaKitab: Number(ujianKitabForm.nilaiBacaKitab),
                          predikatBacaKitab: ujianKitabForm.predikatBacaKitab,
                          ustadzPengujiKitab: ujianKitabForm.ustadzPenguji,
                          tanggalUjianKitab: ujianKitabForm.tanggalUjian,
                          catatanUjianKitab: ujianKitabForm.catatanKoreksianKitab
                        };

                        if (onUpdateSantriProfile) {
                          onUpdateSantriProfile(updatedSantri);
                        }

                        // 2. Simpan juga ke log ujian record
                        if (onSaveUjianSantri) {
                          const newRecord: UjianSantriRecord = {
                            id: `UJN-${Date.now().toString().slice(-4)}`,
                            idSantri: currentUjianSantri.id,
                            namaSantri: currentUjianSantri.nama,
                            kelas: currentUjianSantri.kelas,
                            semester: 'Semester Ganjil 2026/2027',
                            tanggal: ujianKitabForm.tanggalUjian,
                            nilaiKoreksianKitab: Number(ujianKitabForm.nilaiKoreksianKitab),
                            predikatKoreksianKitab: ujianKitabForm.predikatKoreksianKitab,
                            kitabKoreksian: ujianKitabForm.kitabKoreksian,
                            catatanKoreksianKitab: ujianKitabForm.catatanKoreksianKitab,
                            nilaiMuhafadzoh: Number(ujianKitabForm.nilaiMuhafadzoh),
                            predikatMuhafadzoh: ujianKitabForm.predikatMuhafadzoh,
                            kitabMuhafadzoh: ujianKitabForm.kitabMuhafadzoh,
                            catatanMuhafadzoh: ujianKitabForm.catatanMuhafadzoh,
                            nilaiBacaKitab: Number(ujianKitabForm.nilaiBacaKitab),
                            predikatBacaKitab: ujianKitabForm.predikatBacaKitab,
                            kitabBaca: ujianKitabForm.kitabBaca,
                            catatanBacaKitab: ujianKitabForm.catatanBacaKitab,
                            ustadzPenguji: ujianKitabForm.ustadzPenguji
                          };
                          onSaveUjianSantri(newRecord);
                        }

                        alert(`Nilai Ujian Santri ${currentUjianSantri.nama} berhasil diperbarui! Nilai Koreksian Kitab, Nilai Muhafadzoh, dan Nilai Baca Kitab langsung tampil di Dashboard Wali Santri.`);
                      }}
                      className="space-y-6"
                    >
                      {/* Meta Informasi Penguji & Tanggal */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#03140c] p-4 rounded-xl border border-[#d4af37]/20">
                        <div>
                          <label className="text-xs font-bold text-white block mb-1">
                            Ustadz Penguji / Pentashih:
                          </label>
                          <input
                            type="text"
                            value={ujianKitabForm.ustadzPenguji}
                            onChange={(e) => setUjianKitabForm({ ...ujianKitabForm, ustadzPenguji: e.target.value })}
                            className="w-full bg-[#02180e] border border-[#d4af37]/40 rounded-xl p-2.5 text-xs text-white"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-white block mb-1">
                            Tanggal Ujian:
                          </label>
                          <input
                            type="date"
                            value={ujianKitabForm.tanggalUjian}
                            onChange={(e) => setUjianKitabForm({ ...ujianKitabForm, tanggalUjian: e.target.value })}
                            className="w-full bg-[#02180e] border border-[#d4af37]/40 rounded-xl p-2.5 text-xs text-white"
                            required
                          />
                        </div>
                      </div>

                      {/* 3 KOLOM SEPERTI PERMINTAAN USER */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {/* 1. Nilai Koreksian Kitab */}
                        <div className="bg-[#031f13] border-2 border-[#d4af37]/40 rounded-2xl p-4 space-y-3 shadow-xl">
                          <div className="flex items-center gap-2 text-[#d4af37] font-bold text-xs border-b border-[#d4af37]/20 pb-2">
                            <BookOpen className="w-4 h-4" />
                            <span>1. Nilai Koreksian Kitab</span>
                          </div>
                          <div>
                            <label className="text-[11px] text-emerald-300 block mb-1">Nilai Angka (0-100):</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={ujianKitabForm.nilaiKoreksianKitab}
                              onChange={(e) => setUjianKitabForm({ ...ujianKitabForm, nilaiKoreksianKitab: Number(e.target.value) })}
                              className="w-full bg-[#02180e] border border-[#d4af37]/40 rounded-lg p-2 text-xs text-[#d4af37] font-bold font-mono"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-emerald-300 block mb-1">Predikat:</label>
                            <input
                              type="text"
                              value={ujianKitabForm.predikatKoreksianKitab}
                              onChange={(e) => setUjianKitabForm({ ...ujianKitabForm, predikatKoreksianKitab: e.target.value })}
                              className="w-full bg-[#02180e] border border-[#d4af37]/40 rounded-lg p-2 text-xs text-white"
                              placeholder="Mumtaz (Makna Lengkap & Sah)"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-emerald-300 block mb-1">Kitab Rujukan:</label>
                            <input
                              type="text"
                              value={ujianKitabForm.kitabKoreksian}
                              onChange={(e) => setUjianKitabForm({ ...ujianKitabForm, kitabKoreksian: e.target.value })}
                              className="w-full bg-[#02180e] border border-[#d4af37]/40 rounded-lg p-2 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-emerald-300 block mb-1">Catatan Korektor:</label>
                            <textarea
                              rows={2}
                              value={ujianKitabForm.catatanKoreksianKitab}
                              onChange={(e) => setUjianKitabForm({ ...ujianKitabForm, catatanKoreksianKitab: e.target.value })}
                              className="w-full bg-[#02180e] border border-[#d4af37]/40 rounded-lg p-2 text-xs text-white resize-none"
                            />
                          </div>
                        </div>

                        {/* 2. Nilai Muhafadzoh */}
                        <div className="bg-[#031f13] border-2 border-emerald-500/40 rounded-2xl p-4 space-y-3 shadow-xl">
                          <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs border-b border-emerald-500/20 pb-2">
                            <Award className="w-4 h-4" />
                            <span>2. Nilai Muhafadzoh</span>
                          </div>
                          <div>
                            <label className="text-[11px] text-emerald-300 block mb-1">Nilai Angka (0-100):</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={ujianKitabForm.nilaiMuhafadzoh}
                              onChange={(e) => setUjianKitabForm({ ...ujianKitabForm, nilaiMuhafadzoh: Number(e.target.value) })}
                              className="w-full bg-[#02180e] border border-emerald-500/40 rounded-lg p-2 text-xs text-emerald-300 font-bold font-mono"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-emerald-300 block mb-1">Predikat:</label>
                            <input
                              type="text"
                              value={ujianKitabForm.predikatMuhafadzoh}
                              onChange={(e) => setUjianKitabForm({ ...ujianKitabForm, predikatMuhafadzoh: e.target.value })}
                              className="w-full bg-[#02180e] border border-emerald-500/40 rounded-lg p-2 text-xs text-white"
                              placeholder="Mumtaz (Hafal Lancar 250 Bait)"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-emerald-300 block mb-1">Kitab Nadzhom:</label>
                            <input
                              type="text"
                              value={ujianKitabForm.kitabMuhafadzoh}
                              onChange={(e) => setUjianKitabForm({ ...ujianKitabForm, kitabMuhafadzoh: e.target.value })}
                              className="w-full bg-[#02180e] border border-emerald-500/40 rounded-lg p-2 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-emerald-300 block mb-1">Catatan Evaluasi:</label>
                            <textarea
                              rows={2}
                              value={ujianKitabForm.catatanMuhafadzoh}
                              onChange={(e) => setUjianKitabForm({ ...ujianKitabForm, catatanMuhafadzoh: e.target.value })}
                              className="w-full bg-[#02180e] border border-emerald-500/40 rounded-lg p-2 text-xs text-white resize-none"
                            />
                          </div>
                        </div>

                        {/* 3. Nilai Baca Kitab */}
                        <div className="bg-[#031f13] border-2 border-blue-500/40 rounded-2xl p-4 space-y-3 shadow-xl">
                          <div className="flex items-center gap-2 text-blue-300 font-bold text-xs border-b border-blue-500/20 pb-2">
                            <GraduationCap className="w-4 h-4" />
                            <span>3. Nilai Baca Kitab</span>
                          </div>
                          <div>
                            <label className="text-[11px] text-emerald-300 block mb-1">Nilai Angka (0-100):</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={ujianKitabForm.nilaiBacaKitab}
                              onChange={(e) => setUjianKitabForm({ ...ujianKitabForm, nilaiBacaKitab: Number(e.target.value) })}
                              className="w-full bg-[#02180e] border border-blue-500/40 rounded-lg p-2 text-xs text-blue-300 font-bold font-mono"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-emerald-300 block mb-1">Predikat:</label>
                            <input
                              type="text"
                              value={ujianKitabForm.predikatBacaKitab}
                              onChange={(e) => setUjianKitabForm({ ...ujianKitabForm, predikatBacaKitab: e.target.value })}
                              className="w-full bg-[#02180e] border border-blue-500/40 rounded-lg p-2 text-xs text-white"
                              placeholder="Jayyid Jiddan (Fashih & Paham Tarkib)"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-emerald-300 block mb-1">Kitab & Fashol Bacaan:</label>
                            <input
                              type="text"
                              value={ujianKitabForm.kitabBaca}
                              onChange={(e) => setUjianKitabForm({ ...ujianKitabForm, kitabBaca: e.target.value })}
                              className="w-full bg-[#02180e] border border-blue-500/40 rounded-lg p-2 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-emerald-300 block mb-1">Catatan Evaluasi:</label>
                            <textarea
                              rows={2}
                              value={ujianKitabForm.catatanBacaKitab}
                              onChange={(e) => setUjianKitabForm({ ...ujianKitabForm, catatanBacaKitab: e.target.value })}
                              className="w-full bg-[#02180e] border border-blue-500/40 rounded-lg p-2 text-xs text-white resize-none"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="text-right pt-2 border-t border-[#d4af37]/20">
                        <button
                          type="submit"
                          className="btn-3d-gold px-8 py-3 text-black font-black text-xs rounded-xl flex items-center gap-2 ml-auto shadow-2xl active:scale-95"
                        >
                          <CheckCircle2 className="w-4 h-4 text-black" />
                          <span>SIMPAN & SINKRONKAN KE DASHBOARD WALI SANTRI</span>
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* SECTION 2: INPUT MANUAL DATA SANTRI PER ANGKATAN */}
                {activeControlSection === 'input_santri' && (
                  <form onSubmit={handleAddSantriSubmit} className="card-3d rounded-2xl p-5 space-y-5">
                    <div className="flex items-center space-x-2 border-b border-[#d4af37]/20 pb-3">
                      <Users className="w-5 h-5 text-[#d4af37]" />
                      <div>
                        <h4 className="text-sm font-bold text-white text-gold-3d">Input Manual Data Santri Baru per Angkatan</h4>
                        <p className="text-[11px] text-emerald-300">Menambahkan santri langsung ke basis data lokal dan Google Sheets</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#d4af37] mb-1">Angkatan / Kelas</label>
                        <select
                          value={inputSantriForm.kelas}
                          onChange={(e) => setInputSantriForm({ ...inputSantriForm, kelas: e.target.value })}
                          className="w-full bg-[#0a301f] border border-[#d4af37]/40 rounded-xl p-2.5 text-xs text-white"
                        >
                          {classList.map(kls => (
                            <option key={kls} value={kls}>{kls}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#d4af37] mb-1">Nomor Induk Santri (NIS)</label>
                        <input
                          type="text"
                          value={inputSantriForm.id}
                          onChange={(e) => setInputSantriForm({ ...inputSantriForm, id: e.target.value })}
                          required
                          className="w-full bg-[#0a301f] border border-[#d4af37]/40 rounded-xl p-2.5 text-xs text-white font-mono"
                          placeholder="Contoh: S-1008"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#d4af37] mb-1">Nama Lengkap Santri</label>
                        <input
                          type="text"
                          value={inputSantriForm.nama}
                          onChange={(e) => setInputSantriForm({ ...inputSantriForm, nama: e.target.value })}
                          required
                          className="w-full bg-[#0a301f] border border-[#d4af37]/40 rounded-xl p-2.5 text-xs text-white"
                          placeholder="Contoh: Muhammad Ilham Rosyadi"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#d4af37] mb-1">Kamar Pondok</label>
                        <input
                          type="text"
                          value={inputSantriForm.kamar}
                          onChange={(e) => setInputSantriForm({ ...inputSantriForm, kamar: e.target.value })}
                          className="w-full bg-[#0a301f] border border-[#d4af37]/40 rounded-xl p-2.5 text-xs text-white"
                          placeholder="Contoh: Kamar Abu Bakar 05"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#d4af37] mb-1">Alamat Asal Santri</label>
                        <input
                          type="text"
                          value={inputSantriForm.alamat}
                          onChange={(e) => setInputSantriForm({ ...inputSantriForm, alamat: e.target.value })}
                          className="w-full bg-[#0a301f] border border-[#d4af37]/40 rounded-xl p-2.5 text-xs text-white"
                          placeholder="Contoh: Nganjuk, Jawa Timur"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#d4af37] mb-1">Link URL Foto Santri</label>
                        <input
                          type="text"
                          value={inputSantriForm.foto}
                          onChange={(e) => setInputSantriForm({ ...inputSantriForm, foto: e.target.value })}
                          className="w-full bg-[#0a301f] border border-[#d4af37]/40 rounded-xl p-2.5 text-xs text-white"
                          placeholder="URL foto santri (Unsplash/Imgur/Drive)..."
                        />
                      </div>
                    </div>

                    <div className="text-right pt-2 border-t border-[#d4af37]/20">
                      <button
                        type="submit"
                        className="btn-3d-gold px-6 py-2.5 text-black font-extrabold text-xs rounded-xl flex items-center gap-2 ml-auto shadow"
                      >
                        <PlusCircle className="w-4 h-4 text-black" />
                        <span>Simpan Data Santri Baru</span>
                      </button>
                    </div>

                    {/* DAFTAR & PENGHAPUSAN MANUAL SANTRI TIDAK MONDOK (BOYONG) */}
                    <div className="pt-6 border-t border-[#d4af37]/30 space-y-3">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                          <h5 className="text-xs sm:text-sm font-bold text-white text-gold-3d flex items-center gap-1.5">
                            <Trash2 className="w-4 h-4 text-red-400" />
                            <span>Kelola & Hapus Manual Santri yang Sudah Tidak Mondok (Boyong)</span>
                          </h5>
                          <p className="text-[11px] text-emerald-300">
                            Pilih tombol hapus pada kolom santri untuk mengeluarkan data dari database pusat.
                          </p>
                        </div>
                        <span className="text-[11px] text-[#d4af37] font-mono px-3 py-1 rounded-lg bg-[#03170d] border border-[#d4af37]/30">
                          Total: {santriList.length} Santri
                        </span>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-[#d4af37]/25 max-h-80 overflow-y-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-[#03170d] text-[#d4af37] sticky top-0 z-10 border-b border-[#d4af37]/30">
                            <tr>
                              <th className="p-2.5">NIS</th>
                              <th className="p-2.5">NAMA SANTRI</th>
                              <th className="p-2.5">ANGKATAN</th>
                              <th className="p-2.5">KAMAR</th>
                              <th className="p-2.5 text-center">STATUS</th>
                              <th className="p-2.5 text-center">TINDAKAN</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#d4af37]/10 bg-[#020e08]/80">
                            {santriList.map((s) => (
                              <tr key={s.id} className="hover:bg-[#d4af37]/5">
                                <td className="p-2.5 font-mono text-[#d4af37] font-bold">{s.id}</td>
                                <td className="p-2.5 font-bold text-white">{s.nama}</td>
                                <td className="p-2.5 text-emerald-300">{s.kelas}</td>
                                <td className="p-2.5 text-emerald-200/80">{s.kamar || '-'}</td>
                                <td className="p-2.5 text-center">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                                    Aktif
                                  </span>
                                </td>
                                <td className="p-2.5 text-center">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (window.confirm(`Konfirmasi Penghapusan Data Santri:\n\nApakah Anda yakin ingin menghapus data santri:\nNama: ${s.nama}\nNIS: ${s.id}\nKelas: ${s.kelas}\n\nData santri ini akan dihapus karena sudah tidak mondok (boyong).`)) {
                                        if (onDeleteSantri) {
                                          onDeleteSantri(s.id);
                                        }
                                      }
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-red-950/80 hover:bg-red-800 border border-red-500/40 text-red-200 text-xs font-bold inline-flex items-center gap-1 transition shadow"
                                    title="Hapus santri boyong"
                                  >
                                    <Trash2 className="w-3 h-3 text-red-400" />
                                    <span>Hapus</span>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </form>
                )}

                {/* SECTION 3: INPUT MANUAL DATA GURU PER ANGKATAN */}
                {activeControlSection === 'input_guru' && (
                  <form onSubmit={handleAddGuruSubmit} className="card-3d rounded-2xl p-5 space-y-5">
                    <div className="flex items-center space-x-2 border-b border-[#d4af37]/20 pb-3">
                      <Award className="w-5 h-5 text-[#d4af37]" />
                      <div>
                        <h4 className="text-sm font-bold text-white text-gold-3d">Input Manual Data Guru Pengajar per Angkatan</h4>
                        <p className="text-[11px] text-emerald-300">Menambahkan ustadz pengajar baru khusus untuk kelas yang ditentukan</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#d4af37] mb-1">Angkatan / Kelas</label>
                        <select
                          value={inputGuruForm.kelas}
                          onChange={(e) => setInputGuruForm({ ...inputGuruForm, kelas: e.target.value })}
                          className="w-full bg-[#0a301f] border border-[#d4af37]/40 rounded-xl p-2.5 text-xs text-white"
                        >
                          {classList.map(kls => (
                            <option key={kls} value={kls}>{kls}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#d4af37] mb-1">Nama Ustadz / Ustadzah</label>
                        <input
                          type="text"
                          value={inputGuruForm.nama}
                          onChange={(e) => setInputGuruForm({ ...inputGuruForm, nama: e.target.value })}
                          required
                          className="w-full bg-[#0a301f] border border-[#d4af37]/40 rounded-xl p-2.5 text-xs text-white"
                          placeholder="Contoh: Ustadz M. Zainul Muttaqin"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#d4af37] mb-1">Mata Pelajaran Diampu</label>
                        <input
                          type="text"
                          value={inputGuruForm.mapel}
                          onChange={(e) => setInputGuruForm({ ...inputGuruForm, mapel: e.target.value })}
                          required
                          className="w-full bg-[#0a301f] border border-[#d4af37]/40 rounded-xl p-2.5 text-xs text-white"
                          placeholder="Contoh: FAROIDH / ILMU TAFSIR"
                        />
                      </div>
                    </div>

                    <div className="text-right pt-2 border-t border-[#d4af37]/20">
                      <button
                        type="submit"
                        className="btn-3d-gold px-6 py-2.5 text-black font-extrabold text-xs rounded-xl flex items-center gap-2 ml-auto"
                      >
                        <PlusCircle className="w-4 h-4 text-black" />
                        <span>Tambahkan Guru Pengajar</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* SECTION 4: INPUT MANUAL JADWAL PELAJARAN */}
                {activeControlSection === 'input_jadwal' && (
                  <form onSubmit={handleAddJadwalSubmit} className="card-3d rounded-2xl p-5 space-y-5">
                    <div className="flex items-center space-x-2 border-b border-[#d4af37]/20 pb-3">
                      <Calendar className="w-5 h-5 text-[#d4af37]" />
                      <div>
                        <h4 className="text-sm font-bold text-white text-gold-3d">Input Manual Jadwal Pelajaran per Angkatan</h4>
                        <p className="text-[11px] text-emerald-300">Menyusun slot jadwal hari, jam, mata pelajaran, dan pengajar</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#d4af37] mb-1">Angkatan / Kelas</label>
                        <select
                          value={inputJadwalForm.kelas}
                          onChange={(e) => setInputJadwalForm({ ...inputJadwalForm, kelas: e.target.value })}
                          className="w-full bg-[#0a301f] border border-[#d4af37]/40 rounded-xl p-2.5 text-xs text-white"
                        >
                          {classList.map(kls => (
                            <option key={kls} value={kls}>{kls}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#d4af37] mb-1">Hari Pelajaran</label>
                        <select
                          value={inputJadwalForm.hari}
                          onChange={(e) => setInputJadwalForm({ ...inputJadwalForm, hari: e.target.value })}
                          className="w-full bg-[#0a301f] border border-[#d4af37]/40 rounded-xl p-2.5 text-xs text-white"
                        >
                          <option value="SABTU">SABTU</option>
                          <option value="AHAD">AHAD</option>
                          <option value="SENIN">SENIN</option>
                          <option value="SELASA">SELASA</option>
                          <option value="RABU">RABU</option>
                          <option value="KAMIS">KAMIS</option>
                          <option value="MALAM SABTU">MALAM SABTU (Aliyah)</option>
                          <option value="MALAM AHAD">MALAM AHAD (Aliyah)</option>
                          <option value="MALAM SENIN">MALAM SENIN (Aliyah)</option>
                          <option value="MALAM SELASA">MALAM SELASA (Aliyah)</option>
                          <option value="MALAM RABU">MALAM RABU (Aliyah)</option>
                          <option value="MALAM KAMIS">MALAM KAMIS (Aliyah)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#d4af37] mb-1">Jam Ke-</label>
                        <input
                          type="number"
                          min={1}
                          max={6}
                          value={inputJadwalForm.jamKe}
                          onChange={(e) => setInputJadwalForm({ ...inputJadwalForm, jamKe: parseInt(e.target.value) || 1 })}
                          className="w-full bg-[#0a301f] border border-[#d4af37]/40 rounded-xl p-2.5 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#d4af37] mb-1">Waktu Pelajaran</label>
                        <input
                          type="text"
                          value={inputJadwalForm.waktu}
                          onChange={(e) => setInputJadwalForm({ ...inputJadwalForm, waktu: e.target.value })}
                          className="w-full bg-[#0a301f] border border-[#d4af37]/40 rounded-xl p-2.5 text-xs text-white font-mono"
                          placeholder="08.30 - 09.45"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#d4af37] mb-1">Mata Pelajaran</label>
                        <input
                          type="text"
                          value={inputJadwalForm.mapel}
                          onChange={(e) => setInputJadwalForm({ ...inputJadwalForm, mapel: e.target.value })}
                          required
                          className="w-full bg-[#0a301f] border border-[#d4af37]/40 rounded-xl p-2.5 text-xs text-white"
                          placeholder="Contoh: FIQIH WATHONIYAH"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#d4af37] mb-1">Nama Ustadz Pengampu</label>
                        <input
                          type="text"
                          value={inputJadwalForm.nama}
                          onChange={(e) => setInputJadwalForm({ ...inputJadwalForm, nama: e.target.value })}
                          required
                          className="w-full bg-[#0a301f] border border-[#d4af37]/40 rounded-xl p-2.5 text-xs text-white"
                          placeholder="Contoh: Ustadz Ahmad Shobirin"
                        />
                      </div>
                    </div>

                    <div className="text-right pt-2 border-t border-[#d4af37]/20">
                      <button
                        type="submit"
                        className="btn-3d-gold px-6 py-2.5 text-black font-extrabold text-xs rounded-xl flex items-center gap-2 ml-auto"
                      >
                        <PlusCircle className="w-4 h-4 text-black" />
                        <span>Tambahkan Jadwal Pelajaran</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* SECTION: PUSAT KONTROL SELURUH TULISAN WEBSITE, BERITA, CAPTION BERGERAK & TOMBOL */}
                {activeControlSection === 'kontrol_tombol' && (
                  <form onSubmit={handleSaveVisualAndSecurity} className="card-3d rounded-2xl p-5 space-y-6">
                    <div className="flex items-center space-x-2 border-b border-[#d4af37]/20 pb-3">
                      <Settings2 className="w-5 h-5 text-[#d4af37]" />
                      <div>
                        <h4 className="text-sm font-bold text-white text-gold-3d">
                          Pusat Kontrol Seluruh Tulisan Website, Berita, Running Text & Tombol
                        </h4>
                        <p className="text-[11px] text-emerald-300">
                          Semua tulisan di website kini bisa diatur melalui Option Panel ini: judul header, portal wali, berita terkini, caption berjalan, dan teks tombol.
                        </p>
                      </div>
                    </div>

                    {/* 1. Pengaturan Seluruh Tulisan & Judul Utama Website */}
                    <div className="card-3d-deep p-4 rounded-xl space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-[#d4af37]/20">
                        <span className="text-xs font-bold text-[#d4af37]">
                          1. Pengaturan Teks Header & Judul Seluruh Fitur Website
                        </span>
                        <span className="text-[10px] text-emerald-300 font-mono">Global Content Manager</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[11px] font-bold text-white block mb-1">Judul Utama Header Website</label>
                          <input
                            type="text"
                            value={visualForm.header_title || ''}
                            onChange={(e) => setVisualForm({ ...visualForm, header_title: e.target.value })}
                            className="w-full bg-[#03140c] border border-[#d4af37]/40 rounded-xl p-2 text-xs text-white"
                            placeholder="Contoh: SISTEM INFORMASI & PRESENSI MADRASAH DINIYAH"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-white block mb-1">Subtitle / Tagline Header</label>
                          <input
                            type="text"
                            value={visualForm.header_subtitle || ''}
                            onChange={(e) => setVisualForm({ ...visualForm, header_subtitle: e.target.value })}
                            className="w-full bg-[#03140c] border border-[#d4af37]/40 rounded-xl p-2 text-xs text-white"
                            placeholder="Contoh: Pondok Pesantren Terpadu • Sinkronisasi Google Sheets Real-Time"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-emerald-300 block mb-1">Judul Portal Wali Santri</label>
                          <input
                            type="text"
                            value={visualForm.portal_title || ''}
                            onChange={(e) => setVisualForm({ ...visualForm, portal_title: e.target.value })}
                            className="w-full bg-[#03140c] border border-[#d4af37]/40 rounded-xl p-2 text-xs text-white"
                            placeholder="Contoh: Portal Informasi & Absensi Wali Santri"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-emerald-300 block mb-1">Subtitle Portal Wali Santri</label>
                          <input
                            type="text"
                            value={visualForm.portal_subtitle || ''}
                            onChange={(e) => setVisualForm({ ...visualForm, portal_subtitle: e.target.value })}
                            className="w-full bg-[#03140c] border border-[#d4af37]/40 rounded-xl p-2 text-xs text-white"
                            placeholder="Contoh: Pantau kehadiran santri & ustadz secara transparan dan akurat"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-[#f3e5ab] block mb-1">Judul Tab Absensi Santri</label>
                          <input
                            type="text"
                            value={visualForm.text_absensi_santri_title || ''}
                            onChange={(e) => setVisualForm({ ...visualForm, text_absensi_santri_title: e.target.value })}
                            className="w-full bg-[#03140c] border border-[#d4af37]/40 rounded-xl p-2 text-xs text-white"
                            placeholder="Contoh: Absensi Santri Diniyah"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-[#f3e5ab] block mb-1">Judul Tab Absensi Guru</label>
                          <input
                            type="text"
                            value={visualForm.text_absensi_guru_title || ''}
                            onChange={(e) => setVisualForm({ ...visualForm, text_absensi_guru_title: e.target.value })}
                            className="w-full bg-[#03140c] border border-[#d4af37]/40 rounded-xl p-2 text-xs text-white"
                            placeholder="Contoh: Absensi Ustadz / Ustadzah Pengajar"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-emerald-200 block mb-1">Judul Tab Jadwal Pelajaran</label>
                          <input
                            type="text"
                            value={visualForm.text_jadwal_title || ''}
                            onChange={(e) => setVisualForm({ ...visualForm, text_jadwal_title: e.target.value })}
                            className="w-full bg-[#03140c] border border-[#d4af37]/40 rounded-xl p-2 text-xs text-white"
                            placeholder="Contoh: Jadwal Pelajaran per Angkatan"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-emerald-200 block mb-1">Judul Tab Data Santri</label>
                          <input
                            type="text"
                            value={visualForm.text_santri_title || ''}
                            onChange={(e) => setVisualForm({ ...visualForm, text_santri_title: e.target.value })}
                            className="w-full bg-[#03140c] border border-[#d4af37]/40 rounded-xl p-2 text-xs text-white"
                            placeholder="Contoh: Data Santri & Foto per Angkatan"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 2. Slot Layar Berita Terkini & Caption Bergerak Sendiri */}
                    <div className="card-3d-deep p-4 rounded-xl space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-[#d4af37]/20">
                        <span className="text-xs font-bold text-[#d4af37]">
                          2. Slot Layar Berita Terkini & Caption Bergerak (Marquee Dashboard)
                        </span>
                        <span className="text-[10px] text-emerald-300 font-mono">Live Announcement Manager</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="text-[11px] font-bold text-amber-300 block mb-1">
                            📢 Caption Teks Bergerak Sendiri (Running Text Maklumat Pesantren)
                          </label>
                          <textarea
                            rows={2}
                            value={visualForm.running_text_caption || ''}
                            onChange={(e) => setVisualForm({ ...visualForm, running_text_caption: e.target.value })}
                            className="w-full bg-[#03140c] border border-[#d4af37]/40 rounded-xl p-2 text-xs text-white"
                            placeholder="Masukkan teks pengumuman yang akan bergerak otomatis di dashboard..."
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-white block mb-1">URL Gambar Berita Terkini</label>
                          <input
                            type="text"
                            value={visualForm.berita_image_url || ''}
                            onChange={(e) => setVisualForm({ ...visualForm, berita_image_url: e.target.value })}
                            className="w-full bg-[#03140c] border border-[#d4af37]/40 rounded-xl p-2 text-xs text-white"
                            placeholder="https://images.unsplash.com/..."
                          />
                          {visualForm.berita_image_url && (
                            <div className="mt-2 h-24 rounded-lg overflow-hidden border border-[#d4af37]/30">
                              <img src={visualForm.berita_image_url} alt="Preview Berita" className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="text-[11px] font-bold text-white block mb-1">Judul Berita Terkini</label>
                            <input
                              type="text"
                              value={visualForm.berita_title || ''}
                              onChange={(e) => setVisualForm({ ...visualForm, berita_title: e.target.value })}
                              className="w-full bg-[#03140c] border border-[#d4af37]/40 rounded-xl p-2 text-xs text-white"
                              placeholder="Contoh: Warta Terkini Madrasah Diniyah: Penilaian Ujian Bulanan Santri & Guru"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-white block mb-1">Deskripsi Ringkas Berita</label>
                            <textarea
                              rows={2}
                              value={visualForm.berita_deskripsi || ''}
                              onChange={(e) => setVisualForm({ ...visualForm, berita_deskripsi: e.target.value })}
                              className="w-full bg-[#03140c] border border-[#d4af37]/40 rounded-xl p-2 text-xs text-white"
                              placeholder="Isi rangkuman warta berita..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 3. Pengaturan Teks & Warna Tulisan Tombol Utama */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Tombol Hadir Semua */}
                      <div className="card-3d-deep p-4 rounded-xl space-y-3">
                        <span className="text-xs font-bold text-[#d4af37] block">
                          3. Tombol 'Hadir Semua' (Absensi Santri & Guru)
                        </span>
                        <div>
                          <label className="text-[10px] text-emerald-200 block mb-1">Teks Tulisan Tombol</label>
                          <input
                            type="text"
                            value={visualForm.btn_hadir_semua_text || ''}
                            onChange={(e) => setVisualForm({ ...visualForm, btn_hadir_semua_text: e.target.value })}
                            className="w-full bg-[#03140c] border border-[#d4af37]/40 rounded-xl p-2 text-xs text-white"
                            placeholder="Contoh: ✓ Hadir Semua"
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <label className="text-[10px] text-emerald-200 block mb-1">Warna Tulisan Tombol</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={visualForm.btn_hadir_semua_color || '#ffffff'}
                                onChange={(e) => setVisualForm({ ...visualForm, btn_hadir_semua_color: e.target.value })}
                                className="w-8 h-8 rounded border border-[#d4af37]/50 cursor-pointer bg-transparent"
                              />
                              <input
                                type="text"
                                value={visualForm.btn_hadir_semua_color || '#ffffff'}
                                onChange={(e) => setVisualForm({ ...visualForm, btn_hadir_semua_color: e.target.value })}
                                className="w-28 bg-[#03140c] border border-[#d4af37]/40 rounded-xl p-1.5 text-xs text-white font-mono"
                              />
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] text-emerald-300 block mb-1">Pratinjau:</span>
                            <span
                              style={{ color: visualForm.btn_hadir_semua_color || '#ffffff' }}
                              className="btn-3d-emerald px-3 py-1.5 rounded-lg text-xs font-bold inline-block"
                            >
                              {visualForm.btn_hadir_semua_text || '✓ Hadir Semua'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Tombol Simpan Absensi Santri */}
                      <div className="card-3d-deep p-4 rounded-xl space-y-3">
                        <span className="text-xs font-bold text-[#d4af37] block">
                          4. Tombol 'Simpan Absensi' (Absensi Santri)
                        </span>
                        <div>
                          <label className="text-[10px] text-emerald-200 block mb-1">Teks Tulisan Tombol</label>
                          <input
                            type="text"
                            value={visualForm.btn_simpan_absensi_santri_text || ''}
                            onChange={(e) => setVisualForm({ ...visualForm, btn_simpan_absensi_santri_text: e.target.value })}
                            className="w-full bg-[#03140c] border border-[#d4af37]/40 rounded-xl p-2 text-xs text-white"
                            placeholder="Contoh: Simpan Absensi Santri"
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <label className="text-[10px] text-emerald-200 block mb-1">Warna Tulisan Tombol</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={visualForm.btn_simpan_absensi_santri_color || '#000000'}
                                onChange={(e) => setVisualForm({ ...visualForm, btn_simpan_absensi_santri_color: e.target.value })}
                                className="w-8 h-8 rounded border border-[#d4af37]/50 cursor-pointer bg-transparent"
                              />
                              <input
                                type="text"
                                value={visualForm.btn_simpan_absensi_santri_color || '#000000'}
                                onChange={(e) => setVisualForm({ ...visualForm, btn_simpan_absensi_santri_color: e.target.value })}
                                className="w-28 bg-[#03140c] border border-[#d4af37]/40 rounded-xl p-1.5 text-xs text-white font-mono"
                              />
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] text-emerald-300 block mb-1">Pratinjau:</span>
                            <span
                              style={{ color: visualForm.btn_simpan_absensi_santri_color || '#000000' }}
                              className="btn-3d-gold px-3 py-1.5 rounded-lg text-xs font-extrabold inline-block"
                            >
                              {visualForm.btn_simpan_absensi_santri_text || 'Simpan Absensi'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Tombol Simpan Absensi Guru */}
                      <div className="card-3d-deep p-4 rounded-xl space-y-3">
                        <span className="text-xs font-bold text-[#d4af37] block">
                          5. Tombol 'Simpan Absensi Guru' (Option Panel & Tab Guru)
                        </span>
                        <div>
                          <label className="text-[10px] text-emerald-200 block mb-1">Teks Tulisan Tombol</label>
                          <input
                            type="text"
                            value={visualForm.btn_simpan_guru_text || ''}
                            onChange={(e) => setVisualForm({ ...visualForm, btn_simpan_guru_text: e.target.value })}
                            className="w-full bg-[#03140c] border border-[#d4af37]/40 rounded-xl p-2 text-xs text-white"
                            placeholder="Contoh: SIMPAN ABSENSI GURU"
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <label className="text-[10px] text-emerald-200 block mb-1">Warna Tulisan Tombol</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={visualForm.btn_simpan_guru_color || '#000000'}
                                onChange={(e) => setVisualForm({ ...visualForm, btn_simpan_guru_color: e.target.value })}
                                className="w-8 h-8 rounded border border-[#d4af37]/50 cursor-pointer bg-transparent"
                              />
                              <input
                                type="text"
                                value={visualForm.btn_simpan_guru_color || '#000000'}
                                onChange={(e) => setVisualForm({ ...visualForm, btn_simpan_guru_color: e.target.value })}
                                className="w-28 bg-[#03140c] border border-[#d4af37]/40 rounded-xl p-1.5 text-xs text-white font-mono"
                              />
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] text-emerald-300 block mb-1">Pratinjau:</span>
                            <span
                              style={{ color: visualForm.btn_simpan_guru_color || '#000000' }}
                              className="btn-3d-gold px-3 py-1.5 rounded-lg text-xs font-extrabold inline-block"
                            >
                              {visualForm.btn_simpan_guru_text || 'SIMPAN ABSENSI GURU'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Tombol Simpan Rekap & Reset Harian */}
                      <div className="card-3d-deep p-4 rounded-xl space-y-3">
                        <span className="text-xs font-bold text-[#d4af37] block">
                          6. Tombol 'Simpan Rekap & Reset Harian'
                        </span>
                        <div>
                          <label className="text-[10px] text-emerald-200 block mb-1">Teks Tulisan Tombol</label>
                          <input
                            type="text"
                            value={visualForm.btn_reset_harian_text || ''}
                            onChange={(e) => setVisualForm({ ...visualForm, btn_reset_harian_text: e.target.value })}
                            className="w-full bg-[#03140c] border border-[#d4af37]/40 rounded-xl p-2 text-xs text-white"
                            placeholder="Contoh: Simpan Rekap & Reset Harian"
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <label className="text-[10px] text-emerald-200 block mb-1">Warna Tulisan Tombol</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={visualForm.btn_reset_harian_color || '#ffffff'}
                                onChange={(e) => setVisualForm({ ...visualForm, btn_reset_harian_color: e.target.value })}
                                className="w-8 h-8 rounded border border-[#d4af37]/50 cursor-pointer bg-transparent"
                              />
                              <input
                                type="text"
                                value={visualForm.btn_reset_harian_color || '#ffffff'}
                                onChange={(e) => setVisualForm({ ...visualForm, btn_reset_harian_color: e.target.value })}
                                className="w-28 bg-[#03140c] border border-[#d4af37]/40 rounded-xl p-1.5 text-xs text-white font-mono"
                              />
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] text-emerald-300 block mb-1">Pratinjau:</span>
                            <span
                              style={{ color: visualForm.btn_reset_harian_color || '#ffffff' }}
                              className="btn-3d-emerald px-3 py-1.5 rounded-lg text-xs font-bold inline-block"
                            >
                              {visualForm.btn_reset_harian_text || 'Reset Harian'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Tombol Sinkron Sheets */}
                      <div className="card-3d-deep p-4 rounded-xl space-y-3 md:col-span-2">
                        <span className="text-xs font-bold text-[#d4af37] block">
                          7. Tombol 'Sinkron Google Sheets' (Sidebar & Panel)
                        </span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] text-emerald-200 block mb-1">Teks Tulisan Tombol</label>
                            <input
                              type="text"
                              value={visualForm.btn_sync_sheets_text || ''}
                              onChange={(e) => setVisualForm({ ...visualForm, btn_sync_sheets_text: e.target.value })}
                              className="w-full bg-[#03140c] border border-[#d4af37]/40 rounded-xl p-2 text-xs text-white"
                              placeholder="Contoh: Sinkron Google Sheets"
                            />
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <label className="text-[10px] text-emerald-200 block mb-1">Warna Tulisan Tombol</label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={visualForm.btn_sync_sheets_color || '#d4af37'}
                                  onChange={(e) => setVisualForm({ ...visualForm, btn_sync_sheets_color: e.target.value })}
                                  className="w-8 h-8 rounded border border-[#d4af37]/50 cursor-pointer bg-transparent"
                                />
                                <input
                                  type="text"
                                  value={visualForm.btn_sync_sheets_color || '#d4af37'}
                                  onChange={(e) => setVisualForm({ ...visualForm, btn_sync_sheets_color: e.target.value })}
                                  className="w-28 bg-[#03140c] border border-[#d4af37]/40 rounded-xl p-1.5 text-xs text-white font-mono"
                                />
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] text-emerald-300 block mb-1">Pratinjau:</span>
                              <span
                                style={{ color: visualForm.btn_sync_sheets_color || '#d4af37' }}
                                className="btn-3d-dark px-3 py-1.5 rounded-lg text-xs font-bold inline-block border border-[#d4af37]/40"
                              >
                                {visualForm.btn_sync_sheets_text || 'Sinkron Sheets'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 4. Pengaturan Visibilitas / Hapus / Tambahkan Tombol */}
                    <div className="card-3d-deep p-4 rounded-xl space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-[#d4af37]/20">
                        <span className="text-xs font-bold text-[#d4af37]">
                          8. Manajemen Visibilitas Tombol (Hapus / Tampilkan Tombol)
                        </span>
                        <span className="text-[10px] text-emerald-300">Saklar Kendali Cepat</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="bg-[#052216] p-3 rounded-xl border border-[#d4af37]/20 flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-white block">Tombol Sinkron Cepat</span>
                            <span className="text-[10px] text-emerald-300/80">Di sidebar menu</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setVisualForm({ ...visualForm, show_quick_sync_button: !visualForm.show_quick_sync_button })}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                              visualForm.show_quick_sync_button !== false
                                ? 'btn-3d-emerald text-white'
                                : 'bg-red-950 text-red-300 border border-red-500/40'
                            }`}
                          >
                            {visualForm.show_quick_sync_button !== false ? 'Aktif' : 'Tersembunyi'}
                          </button>
                        </div>

                        <div className="bg-[#052216] p-3 rounded-xl border border-[#d4af37]/20 flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-white block">Tombol Reset Dashboard</span>
                            <span className="text-[10px] text-emerald-300/80">Di tab Dashboard</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setVisualForm({ ...visualForm, show_reset_dashboard_button: !visualForm.show_reset_dashboard_button })}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                              visualForm.show_reset_dashboard_button !== false
                                ? 'btn-3d-emerald text-white'
                                : 'bg-red-950 text-red-300 border border-red-500/40'
                            }`}
                          >
                            {visualForm.show_reset_dashboard_button !== false ? 'Aktif' : 'Tersembunyi'}
                          </button>
                        </div>

                        <div className="bg-[#052216] p-3 rounded-xl border border-[#d4af37]/20 flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-white block">Tombol Ekspor CSV</span>
                            <span className="text-[10px] text-emerald-300/80">Di menu rekap data</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setVisualForm({ ...visualForm, show_export_csv_button: !visualForm.show_export_csv_button })}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                              visualForm.show_export_csv_button !== false
                                ? 'btn-3d-emerald text-white'
                                : 'bg-red-950 text-red-300 border border-red-500/40'
                            }`}
                          >
                            {visualForm.show_export_csv_button !== false ? 'Aktif' : 'Tersembunyi'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="text-right pt-2 border-t border-[#d4af37]/20">
                      <button
                        type="submit"
                        className="btn-3d-gold px-6 py-2.5 text-black font-extrabold text-xs rounded-xl flex items-center gap-2 ml-auto"
                      >
                        <Save className="w-4 h-4 text-black" />
                        <span>Simpan Pengaturan Seluruh Tulisan & Tombol</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* SECTION 5: PUSAT KONTROL VISUAL (BACKGROUND & LOGO PONDOK) */}
                {activeControlSection === 'visual_branding' && (
                  <form onSubmit={handleSaveVisualAndSecurity} className="card-3d rounded-2xl p-5 space-y-5">
                    <div className="flex items-center space-x-2 border-b border-[#d4af37]/20 pb-3">
                      <Palette className="w-5 h-5 text-[#d4af37]" />
                      <div>
                        <h4 className="text-sm font-bold text-white text-gold-3d">Pusat Kontrol Visual Aplikasi (Background & Logo)</h4>
                        <p className="text-[11px] text-emerald-300">Ubah tampilan background, logo pondok, dan identitas pesantren Anda.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <label className="block text-xs font-semibold text-[#d4af37]">
                          Link URL Background Aplikasi
                        </label>
                        <input
                          type="text"
                          value={visualForm.background_url || ''}
                          onChange={(e) => setVisualForm({ ...visualForm, background_url: e.target.value })}
                          className="w-full bg-[#0a301f] border border-[#d4af37]/40 rounded-xl p-2.5 text-xs text-white"
                          placeholder="https://images.unsplash.com/... atau URL gambar background"
                        />
                        <p className="text-[10px] text-emerald-300/80">
                          Background ini akan diterapkan pada latar belakang seluruh aplikasi dan halaman login. Kosongkan untuk latar salaf default.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <label className="block text-xs font-semibold text-[#d4af37]">
                          Link URL Logo Madrasah Diniyah (Bingkai Bulat)
                        </label>
                        <input
                          type="text"
                          data-testid="logo-madrasah-input"
                          value={visualForm.logo_madrasah || ''}
                          onChange={(e) => setVisualForm({ ...visualForm, logo_madrasah: e.target.value })}
                          className="w-full bg-[#0a301f] border border-[#d4af37]/40 rounded-xl p-2.5 text-xs text-white"
                          placeholder="https://... URL logo bulat madrasah (kosongkan = logo bawaan)"
                        />
                        <label className="block text-xs font-semibold text-[#d4af37] pt-1">
                          Link URL Logo Pondok Pesantren (Bingkai Persegi Panjang)
                        </label>
                        <input
                          type="text"
                          data-testid="logo-pondok-input"
                          value={visualForm.logo_pondok || ''}
                          onChange={(e) => setVisualForm({ ...visualForm, logo_pondok: e.target.value })}
                          className="w-full bg-[#0a301f] border border-[#d4af37]/40 rounded-xl p-2.5 text-xs text-white"
                          placeholder="https://... URL logo persegi pondok (kosongkan = logo bawaan)"
                        />
                        <p className="text-[10px] text-emerald-300/80">
                          Kedua logo tampil berbingkai emas pada halaman login, animasi pintu, serta header dashboard Admin, Pengurus, dan Wali Santri.
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#d4af37] mb-1">Nama Pondok Pesantren</label>
                        <input
                          type="text"
                          value={visualForm.nama_pondok}
                          onChange={(e) => setVisualForm({ ...visualForm, nama_pondok: e.target.value })}
                          className="w-full bg-[#0a301f] border border-[#d4af37]/40 rounded-xl p-2.5 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#d4af37] mb-1">Nama Madrasah Diniyah</label>
                        <input
                          type="text"
                          value={visualForm.nama_madrasah}
                          onChange={(e) => setVisualForm({ ...visualForm, nama_madrasah: e.target.value })}
                          className="w-full bg-[#0a301f] border border-[#d4af37]/40 rounded-xl p-2.5 text-xs text-white"
                        />
                      </div>
                    </div>

                    {/* Preview Kotak Logo & Background */}
                    <div className="p-4 bg-[#03140c] rounded-xl border border-[#d4af37]/20 flex items-center gap-4">
                      <div className="flex items-center gap-3 shrink-0" data-testid="logo-preview">
                        <LogoFrame src={resolveLogos(visualForm).madrasah} alt="Preview Logo Madrasah" shape="round" size="md" testId="preview-logo-madrasah" />
                        <LogoFrame src={resolveLogos(visualForm).pondok} alt="Preview Logo Pondok" shape="wide" size="md" testId="preview-logo-pondok" />
                      </div>
                      <div className="overflow-hidden">
                        <span className="text-xs font-bold text-white block">Preview Visual Logo & Header</span>
                        <span className="text-[11px] text-emerald-300 block truncate">{visualForm.nama_pondok}</span>
                        <span className="text-[10px] text-[#d4af37] block truncate">{visualForm.nama_madrasah}</span>
                      </div>
                    </div>

                    <div className="text-right pt-2 border-t border-[#d4af37]/20">
                      <button
                        type="submit"
                        className="btn-3d-gold px-6 py-2.5 text-black font-extrabold text-xs rounded-xl flex items-center gap-2 ml-auto"
                      >
                        <Save className="w-4 h-4 text-black" />
                        <span>Simpan Perubahan Visual & Logo</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* SECTION 6: GANTI KATA SANDI (ADMIN & OPTION PANEL) */}
                {activeControlSection === 'keamanan' && (
                  <form onSubmit={handleSaveVisualAndSecurity} className="card-3d rounded-2xl p-5 space-y-5">
                    <div className="flex items-center space-x-2 border-b border-[#d4af37]/20 pb-3">
                      <Lock className="w-5 h-5 text-[#d4af37]" />
                      <div>
                        <h4 className="text-sm font-bold text-white text-gold-3d">Manajemen Kata Sandi & Keamanan Sistem</h4>
                        <p className="text-[11px] text-emerald-300">
                          Ganti kata sandi login Admin dan password proteksi Option Panel agar hanya Anda yang memiliki hak akses.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="card-3d-deep p-4 rounded-xl space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#d4af37]">
                          <KeyRound className="w-4 h-4" />
                          <span>1. Kata Sandi Login Admin Utama</span>
                        </div>
                        <p className="text-[11px] text-emerald-200/80">
                          Kata sandi ini digunakan untuk masuk saat login mode "Admin Pengurus".
                        </p>
                        <input
                          type="text"
                          value={visualForm.password_admin || ''}
                          onChange={(e) => setVisualForm({ ...visualForm, password_admin: e.target.value })}
                          required
                          className="w-full bg-[#052216] border border-[#d4af37]/40 rounded-xl p-2.5 text-xs text-white font-mono shadow-inner"
                          placeholder="Password login admin..."
                        />
                      </div>

                      <div className="card-3d-deep p-4 rounded-xl space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#d4af37]">
                          <Lock className="w-4 h-4" />
                          <span>2. Kata Sandi Proteksi Option Panel</span>
                        </div>
                        <p className="text-[11px] text-emerald-200/80">
                          Kata sandi khusus untuk membuka menu Option Panel ini.
                        </p>
                        <input
                          type="text"
                          value={visualForm.password_option_panel || ''}
                          onChange={(e) => setVisualForm({ ...visualForm, password_option_panel: e.target.value })}
                          required
                          className="w-full bg-[#052216] border border-[#d4af37]/40 rounded-xl p-2.5 text-xs text-white font-mono shadow-inner"
                          placeholder="Password proteksi Option Panel..."
                        />
                      </div>
                    </div>

                    <div className="text-right pt-2 border-t border-[#d4af37]/20">
                      <button
                        type="submit"
                        className="btn-3d-gold px-6 py-2.5 text-black font-extrabold text-xs rounded-xl flex items-center gap-2 ml-auto"
                      >
                        <Save className="w-4 h-4 text-black" />
                        <span>Simpan Perubahan Kata Sandi</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* SECTION 7: PENGATURAN PROFIL ANAK & PASSWORD WALI (NIS) */}
                {activeControlSection === 'profil_santri' && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!currentSelectedSantri) return;
                      const updated: Santri = {
                        ...currentSelectedSantri,
                        nama: santriProfileEditForm.nama,
                        password: santriProfileEditForm.password,
                        namaOrangTua: santriProfileEditForm.namaOrangTua,
                        namaWaliKelas: santriProfileEditForm.namaWaliKelas,
                        noWaWaliKelas: santriProfileEditForm.noWaWaliKelas,
                        saldoUangSaku: Number(santriProfileEditForm.saldoUangSaku) || 0,
                        kamar: santriProfileEditForm.kamar,
                        alamat: santriProfileEditForm.alamat
                      };
                      if (onUpdateSantriProfile) {
                        onUpdateSantriProfile(updated);
                      }
                      alert(`Profil dan Password Wali Santri untuk "${updated.nama}" (${updated.id}) berhasil diperbarui!`);
                    }}
                    className="card-3d rounded-2xl p-5 space-y-5"
                  >
                    <div className="flex items-center space-x-2 border-b border-[#d4af37]/20 pb-3">
                      <UserCheck className="w-5 h-5 text-[#d4af37]" />
                      <div>
                        <h4 className="text-sm font-bold text-white text-gold-3d">
                          Kelola Profil Anak & Password Wali Santri (NIS)
                        </h4>
                        <p className="text-[11px] text-emerald-300">
                          Atur NIS sebagai password wali santri secara manual, nama orang tua, wali kelas & nomor WA, serta saldo uang saku terkini.
                        </p>
                      </div>
                    </div>

                    {/* Pilih Santri yang akan diatur */}
                    <div className="bg-[#03140c] p-4 rounded-xl border border-[#d4af37]/30 space-y-2">
                      <label className="text-xs font-bold text-[#d4af37] block">
                        Pilih Santri yang Ingin Diatur Profil & Password-nya:
                      </label>
                      <select
                        value={selectedProfileSantriId}
                        onChange={(e) => setSelectedProfileSantriId(e.target.value)}
                        className="w-full bg-[#0a301f] border border-[#d4af37]/50 rounded-xl p-3 text-sm text-white font-semibold"
                      >
                        {santriList.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.nama} — NIS: {s.id} ({s.kelas})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Form Input Detail Profil & Password */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Password Wali Santri (NIS) */}
                      <div className="card-3d-deep p-4 rounded-xl space-y-2 border border-[#d4af37]/40">
                        <label className="block text-xs font-bold text-[#d4af37] flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <KeyRound className="w-4 h-4 text-[#d4af37]" />
                            <span>PASSWORD LOGIN WALI SANTRI (NIS)</span>
                          </span>
                          <span className="text-[10px] text-emerald-400 font-mono">NIS: {currentSelectedSantri?.id}</span>
                        </label>
                        <p className="text-[10px] text-emerald-200/80">
                          Sesuai permintaan Anda, NIS dijadikan sebagai password wali santri dan dapat diatur / diubah secara manual di sini.
                        </p>
                        <input
                          type="text"
                          value={santriProfileEditForm.password}
                          onChange={(e) => setSantriProfileEditForm({ ...santriProfileEditForm, password: e.target.value })}
                          required
                          className="w-full bg-[#052216] border border-[#d4af37]/60 rounded-xl p-2.5 text-sm text-white font-mono shadow-inner font-bold"
                          placeholder="Masukkan password atau gunakan NIS (contoh: S-1001)"
                        />
                      </div>

                      {/* Nama Lengkap Santri */}
                      <div className="card-3d-deep p-4 rounded-xl space-y-2">
                        <label className="block text-xs font-bold text-[#d4af37]">Nama Lengkap Santri (Username Login)</label>
                        <p className="text-[10px] text-emerald-200/80">
                          Nama santri ini yang diketik wali santri di form login portal.
                        </p>
                        <input
                          type="text"
                          value={santriProfileEditForm.nama}
                          onChange={(e) => setSantriProfileEditForm({ ...santriProfileEditForm, nama: e.target.value })}
                          required
                          className="w-full bg-[#052216] border border-[#d4af37]/40 rounded-xl p-2.5 text-xs text-white"
                        />
                      </div>

                      {/* Nama Orang Tua / Wali */}
                      <div className="card-3d-deep p-4 rounded-xl space-y-2">
                        <label className="block text-xs font-bold text-[#d4af37]">Nama Orang Tua / Wali</label>
                        <p className="text-[10px] text-emerald-200/80">
                          Ditampilkan di kartu profil anak pada Dashboard Wali Santri.
                        </p>
                        <input
                          type="text"
                          value={santriProfileEditForm.namaOrangTua}
                          onChange={(e) => setSantriProfileEditForm({ ...santriProfileEditForm, namaOrangTua: e.target.value })}
                          placeholder="Contoh: Bpk. H. Muhammad Ridwan"
                          className="w-full bg-[#052216] border border-[#d4af37]/40 rounded-xl p-2.5 text-xs text-white"
                        />
                      </div>

                      {/* Saldo Terkini Uang Saku */}
                      <div className="card-3d-deep p-4 rounded-xl space-y-2 border border-emerald-500/30">
                        <label className="block text-xs font-bold text-emerald-300 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Wallet className="w-4 h-4 text-emerald-400" />
                            <span>Saldo Terkini Uang Saku (Rp)</span>
                          </span>
                        </label>
                        <p className="text-[10px] text-emerald-200/80">
                          Saldo uang saku yang tampil di profil portal anak wali santri.
                        </p>
                        <input
                          type="number"
                          value={santriProfileEditForm.saldoUangSaku}
                          onChange={(e) => setSantriProfileEditForm({ ...santriProfileEditForm, saldoUangSaku: Number(e.target.value) })}
                          required
                          className="w-full bg-[#052216] border border-emerald-500/50 rounded-xl p-2.5 text-sm text-emerald-300 font-bold font-mono"
                          placeholder="Contioh: 150000"
                        />
                      </div>

                      {/* Nama Wali Kelas */}
                      <div className="card-3d-deep p-4 rounded-xl space-y-2">
                        <label className="block text-xs font-bold text-[#d4af37]">Nama Wali Kelas</label>
                        <input
                          type="text"
                          value={santriProfileEditForm.namaWaliKelas}
                          onChange={(e) => setSantriProfileEditForm({ ...santriProfileEditForm, namaWaliKelas: e.target.value })}
                          placeholder="Contoh: Ustazah Fina Nikmatul Kamelia"
                          className="w-full bg-[#052216] border border-[#d4af37]/40 rounded-xl p-2.5 text-xs text-white"
                        />
                      </div>

                      {/* No WhatsApp Wali Kelas */}
                      <div className="card-3d-deep p-4 rounded-xl space-y-2">
                        <label className="block text-xs font-bold text-[#d4af37] flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-emerald-400" />
                          <span>No WhatsApp Wali Kelas (Langsung Chat dari Portal)</span>
                        </label>
                        <input
                          type="text"
                          value={santriProfileEditForm.noWaWaliKelas}
                          onChange={(e) => setSantriProfileEditForm({ ...santriProfileEditForm, noWaWaliKelas: e.target.value })}
                          placeholder="Contoh: 0812-3456-7890"
                          className="w-full bg-[#052216] border border-[#d4af37]/40 rounded-xl p-2.5 text-xs text-white font-mono"
                        />
                      </div>

                      {/* Kamar Pondok */}
                      <div className="card-3d-deep p-4 rounded-xl space-y-2">
                        <label className="block text-xs font-bold text-[#d4af37]">Kamar Pondok</label>
                        <input
                          type="text"
                          value={santriProfileEditForm.kamar}
                          onChange={(e) => setSantriProfileEditForm({ ...santriProfileEditForm, kamar: e.target.value })}
                          className="w-full bg-[#052216] border border-[#d4af37]/40 rounded-xl p-2.5 text-xs text-white"
                        />
                      </div>

                      {/* Alamat Asal */}
                      <div className="card-3d-deep p-4 rounded-xl space-y-2">
                        <label className="block text-xs font-bold text-[#d4af37]">Alamat Asal Santri</label>
                        <input
                          type="text"
                          value={santriProfileEditForm.alamat}
                          onChange={(e) => setSantriProfileEditForm({ ...santriProfileEditForm, alamat: e.target.value })}
                          className="w-full bg-[#052216] border border-[#d4af37]/40 rounded-xl p-2.5 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="text-right pt-3 border-t border-[#d4af37]/20 flex justify-end gap-3">
                      <button
                        type="submit"
                        className="btn-3d-gold px-7 py-3 text-black font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-xl"
                      >
                        <Save className="w-4 h-4 text-black" />
                        <span>Simpan Profil & Password Santri Ini</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* SECTION 8: MANAJEMEN SYAHRIYAH & NOTIFIKASI KETERLAMBATAN */}
                {activeControlSection === 'kelola_syahriyah' && (
                  <div className="card-3d rounded-2xl p-5 space-y-6">
                    <div className="flex items-center space-x-2 border-b border-[#d4af37]/20 pb-3">
                      <CreditCard className="w-5 h-5 text-[#d4af37]" />
                      <div>
                        <h4 className="text-sm font-bold text-white text-gold-3d">
                          Manajemen Syahriyah & Pengaturan Notifikasi Keterlambatan
                        </h4>
                        <p className="text-[11px] text-emerald-300">
                          Atur kalimat pesan peringatan keterlambatan serta catat status syahriyah santri (Lunas / Menunggak / Belum Bayar).
                        </p>
                      </div>
                    </div>

                    {/* Sub-fitur A: Pengaturan Teks Pesan Notifikasi Keterlambatan */}
                    <div className="card-3d-deep p-4 rounded-2xl border border-amber-500/40 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Pesan Notifikasi Keterlambatan Pembayaran Syahriyah (Bisa Diatur di Sini)</span>
                      </div>
                      <p className="text-[11px] text-emerald-200/80">
                        Pesan ini akan otomatis muncul sebagai banner merah/emas menyala di Dashboard Wali Santri jika santri memiliki status "Menunggak".
                      </p>
                      <textarea
                        rows={2}
                        value={visualForm.notif_keterlambatan_syahriyah || ''}
                        onChange={(e) => setVisualForm({ ...visualForm, notif_keterlambatan_syahriyah: e.target.value })}
                        className="w-full bg-[#03140c] border border-amber-500/50 rounded-xl p-3 text-xs text-white shadow-inner focus:outline-none focus:border-[#d4af37]"
                        placeholder="Masukkan pesan peringatan keterlambatan syahriyah..."
                      />
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-[10px] text-amber-300/80 italic">
                          Preview teks akan langsung tayang pada akun wali santri terkait.
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            onSaveSettings(visualForm);
                            alert('Teks notifikasi keterlambatan syahriyah berhasil disimpan!');
                          }}
                          className="btn-3d-gold px-4 py-2 text-black font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow"
                        >
                          <Save className="w-3.5 h-3.5 text-black" />
                          <span>Simpan Pesan Notifikasi</span>
                        </button>
                      </div>
                    </div>

                    {/* Sub-fitur B: Form Catat / Tambah Syahriyah Santri */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const newRec: SyahriyahRecord = {
                          id: `SYA-${Date.now()}`,
                          idSantri: inputSyahriyahForm.idSantri,
                          bulan: inputSyahriyahForm.bulan,
                          nominal: Number(inputSyahriyahForm.nominal),
                          tanggalBayar: inputSyahriyahForm.tanggalBayar,
                          status: inputSyahriyahForm.status,
                          keterangan: inputSyahriyahForm.keterangan
                        };
                        if (onSaveSyahriyah) {
                          onSaveSyahriyah(newRec);
                        }
                        alert(`Catatan Syahriyah bulan ${newRec.bulan} untuk santri ${newRec.idSantri} berhasil disimpan dengan status "${newRec.status}"!`);
                      }}
                      className="bg-[#052216] border border-[#d4af37]/30 rounded-2xl p-4 space-y-4"
                    >
                      <div className="flex items-center justify-between border-b border-[#d4af37]/20 pb-2">
                        <span className="text-xs font-bold text-[#d4af37] uppercase tracking-wide">
                          Catat / Perbarui Pembayaran Syahriyah Santri
                        </span>
                        <span className="text-[10px] text-emerald-300">Tersimpan ke basis data lokal & Sheets</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                        <div>
                          <label className="block text-emerald-300 font-semibold mb-1">Pilih Santri Target</label>
                          <select
                            value={inputSyahriyahForm.idSantri}
                            onChange={(e) => setInputSyahriyahForm({ ...inputSyahriyahForm, idSantri: e.target.value })}
                            className="w-full bg-[#020e08] border border-[#d4af37]/40 rounded-xl p-2.5 text-white"
                          >
                            {santriList.map(s => (
                              <option key={s.id} value={s.id}>{s.nama} ({s.id})</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-emerald-300 font-semibold mb-1">Bulan & Tahun Tagihan</label>
                          <input
                            type="text"
                            value={inputSyahriyahForm.bulan}
                            onChange={(e) => setInputSyahriyahForm({ ...inputSyahriyahForm, bulan: e.target.value })}
                            placeholder="Contoh: September 2026"
                            required
                            className="w-full bg-[#020e08] border border-[#d4af37]/40 rounded-xl p-2.5 text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-emerald-300 font-semibold mb-1">Nominal Syahriyah (Rp)</label>
                          <input
                            type="number"
                            value={inputSyahriyahForm.nominal}
                            onChange={(e) => setInputSyahriyahForm({ ...inputSyahriyahForm, nominal: Number(e.target.value) })}
                            required
                            className="w-full bg-[#020e08] border border-[#d4af37]/40 rounded-xl p-2.5 text-white font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-emerald-300 font-semibold mb-1">Status Pembayaran</label>
                          <select
                            value={inputSyahriyahForm.status}
                            onChange={(e) => setInputSyahriyahForm({ ...inputSyahriyahForm, status: e.target.value as any })}
                            className="w-full bg-[#020e08] border border-[#d4af37]/40 rounded-xl p-2.5 text-white font-bold"
                          >
                            <option value="Lunas">Lunas (Selesai)</option>
                            <option value="Menunggak">Menunggak (Memicu Notifikasi Keterlambatan)</option>
                            <option value="Belum Bayar">Belum Bayar</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-emerald-300 font-semibold mb-1">Tanggal Transaksi / Bayar</label>
                          <input
                            type="date"
                            value={inputSyahriyahForm.tanggalBayar}
                            onChange={(e) => setInputSyahriyahForm({ ...inputSyahriyahForm, tanggalBayar: e.target.value })}
                            className="w-full bg-[#020e08] border border-[#d4af37]/40 rounded-xl p-2.5 text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-emerald-300 font-semibold mb-1">Keterangan / Catatan</label>
                          <input
                            type="text"
                            value={inputSyahriyahForm.keterangan}
                            onChange={(e) => setInputSyahriyahForm({ ...inputSyahriyahForm, keterangan: e.target.value })}
                            placeholder="Contoh: Transfer Bank Syariah Indonesia"
                            className="w-full bg-[#020e08] border border-[#d4af37]/40 rounded-xl p-2.5 text-white"
                          />
                        </div>
                      </div>

                      <div className="text-right pt-2 border-t border-[#d4af37]/20">
                        <button
                          type="submit"
                          className="btn-3d-gold px-6 py-2.5 text-black font-extrabold text-xs rounded-xl flex items-center gap-2 ml-auto shadow"
                        >
                          <Save className="w-4 h-4 text-black" />
                          <span>Simpan Status Syahriyah</span>
                        </button>
                      </div>
                    </form>

                    {/* Sub-fitur C: Tabel Catatan Syahriyah Terkini */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs text-[#d4af37] font-bold">
                        <span>Daftar Riwayat Syahriyah Seluruh Santri</span>
                        <span className="text-emerald-300 font-normal">{syahriyahList.length} Catatan Pembayaran</span>
                      </div>
                      <div className="overflow-x-auto rounded-xl border border-[#d4af37]/20">
                        <table className="w-full text-left text-xs min-w-[700px]">
                          <thead className="bg-[#03140c] text-[#d4af37] border-b border-[#d4af37]/30">
                            <tr>
                              <th className="p-3">Santri Target</th>
                              <th className="p-3">Bulan</th>
                              <th className="p-3">Nominal</th>
                              <th className="p-3">Tanggal Bayar</th>
                              <th className="p-3 text-center">Status</th>
                              <th className="p-3">Keterangan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#d4af37]/10 bg-[#020e08]/70">
                            {syahriyahList.slice(0, 10).map((sy) => {
                              const sObj = santriList.find(s => s.id === sy.idSantri);
                              return (
                                <tr key={sy.id} className="hover:bg-[#d4af37]/5">
                                  <td className="p-3 font-bold text-white">
                                    {sObj?.nama || sy.idSantri} <span className="text-[10px] text-emerald-400 font-mono">({sy.idSantri})</span>
                                  </td>
                                  <td className="p-3 text-[#d4af37] font-semibold">{sy.bulan}</td>
                                  <td className="p-3 font-mono text-emerald-300 font-bold">Rp {sy.nominal.toLocaleString('id-ID')}</td>
                                  <td className="p-3 text-white/80">{sy.tanggalBayar || '-'}</td>
                                  <td className="p-3 text-center">
                                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold ${
                                      sy.status === 'Lunas'
                                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                        : sy.status === 'Menunggak'
                                        ? 'bg-red-950 text-red-300 border border-red-500/40 animate-pulse'
                                        : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                                    }`}>
                                      {sy.status}
                                    </span>
                                  </td>
                                  <td className="p-3 text-emerald-200">{sy.keterangan || '-'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* SECTION 9: MANAJEMEN MUTASI UANG SAKU */}
                {activeControlSection === 'kelola_uang_saku' && (
                  <div className="card-3d rounded-2xl p-5 space-y-6">
                    <div className="flex items-center space-x-2 border-b border-[#d4af37]/20 pb-3">
                      <Wallet className="w-5 h-5 text-[#d4af37]" />
                      <div>
                        <h4 className="text-sm font-bold text-white text-gold-3d">
                          Manajemen Pencatatan Mutasi Uang Saku Santri
                        </h4>
                        <p className="text-[11px] text-emerald-300">
                          Catat kiriman titipan uang masuk atau penarikan santri. Saldo terkini santri akan otomatis diperbarui dan tayang di profil anak pada dashboard wali santri.
                        </p>
                      </div>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const sTarget = santriList.find(s => s.id === inputUangSakuForm.idSantri);
                        const currentBalance = sTarget?.saldoUangSaku ?? 0;
                        const nom = Number(inputUangSakuForm.nominal);
                        const newBalance = inputUangSakuForm.tipe === 'Masuk'
                          ? currentBalance + nom
                          : Math.max(0, currentBalance - nom);

                        const newRec: UangSakuRecord = {
                          id: `US-${Date.now()}`,
                          idSantri: inputUangSakuForm.idSantri,
                          tanggal: inputUangSakuForm.tanggal,
                          tipe: inputUangSakuForm.tipe,
                          nominal: nom,
                          saldoSetelah: newBalance,
                          keterangan: inputUangSakuForm.keterangan
                        };

                        if (onSaveUangSaku) {
                          onSaveUangSaku(newRec);
                        }
                        alert(`Mutasi uang saku berhasil dicatat! Saldo terkini santri "${sTarget?.nama}" sekarang Rp ${newBalance.toLocaleString('id-ID')}.`);
                      }}
                      className="bg-[#052216] border border-[#d4af37]/30 rounded-2xl p-4 space-y-4"
                    >
                      <div className="flex items-center justify-between border-b border-[#d4af37]/20 pb-2">
                        <span className="text-xs font-bold text-[#d4af37] uppercase tracking-wide">
                          Input Transaksi Uang Saku Baru
                        </span>
                        <span className="text-[10px] text-emerald-300">Auto-update saldo santri</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                        <div>
                          <label className="block text-emerald-300 font-semibold mb-1">Pilih Santri</label>
                          <select
                            value={inputUangSakuForm.idSantri}
                            onChange={(e) => setInputUangSakuForm({ ...inputUangSakuForm, idSantri: e.target.value })}
                            className="w-full bg-[#020e08] border border-[#d4af37]/40 rounded-xl p-2.5 text-white"
                          >
                            {santriList.map(s => (
                              <option key={s.id} value={s.id}>
                                {s.nama} (Saldo: Rp {(s.saldoUangSaku ?? 0).toLocaleString('id-ID')})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-emerald-300 font-semibold mb-1">Jenis Transaksi</label>
                          <select
                            value={inputUangSakuForm.tipe}
                            onChange={(e) => setInputUangSakuForm({ ...inputUangSakuForm, tipe: e.target.value as any })}
                            className="w-full bg-[#020e08] border border-[#d4af37]/40 rounded-xl p-2.5 text-white font-bold"
                          >
                            <option value="Masuk">Uang Masuk (+) Kiriman Orang Tua / Titipan</option>
                            <option value="Keluar">Uang Keluar (-) Penarikan / Beli Kitab / Jajan</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-emerald-300 font-semibold mb-1">Nominal Mutasi (Rp)</label>
                          <input
                            type="number"
                            value={inputUangSakuForm.nominal}
                            onChange={(e) => setInputUangSakuForm({ ...inputUangSakuForm, nominal: Number(e.target.value) })}
                            required
                            className="w-full bg-[#020e08] border border-[#d4af37]/40 rounded-xl p-2.5 text-white font-mono font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-emerald-300 font-semibold mb-1">Tanggal Transaksi</label>
                          <input
                            type="date"
                            value={inputUangSakuForm.tanggal}
                            onChange={(e) => setInputUangSakuForm({ ...inputUangSakuForm, tanggal: e.target.value })}
                            className="w-full bg-[#020e08] border border-[#d4af37]/40 rounded-xl p-2.5 text-white"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-emerald-300 font-semibold mb-1">Keterangan / Keperluan</label>
                          <input
                            type="text"
                            value={inputUangSakuForm.keterangan}
                            onChange={(e) => setInputUangSakuForm({ ...inputUangSakuForm, keterangan: e.target.value })}
                            placeholder="Contoh: Titipan orang tua via transfer / Pembelian kitab fiqih..."
                            required
                            className="w-full bg-[#020e08] border border-[#d4af37]/40 rounded-xl p-2.5 text-white"
                          />
                        </div>
                      </div>

                      <div className="text-right pt-2 border-t border-[#d4af37]/20">
                        <button
                          type="submit"
                          className="btn-3d-gold px-6 py-2.5 text-black font-extrabold text-xs rounded-xl flex items-center gap-2 ml-auto shadow"
                        >
                          <Save className="w-4 h-4 text-black" />
                          <span>Simpan Mutasi & Perbarui Saldo</span>
                        </button>
                      </div>
                    </form>

                    {/* Riwayat Mutasi Uang Saku */}
                    <div className="space-y-2">
                      <span className="text-xs text-[#d4af37] font-bold block">Riwayat Transaksi Uang Saku Terkini</span>
                      <div className="overflow-x-auto rounded-xl border border-[#d4af37]/20">
                        <table className="w-full text-left text-xs min-w-[700px]">
                          <thead className="bg-[#03140c] text-[#d4af37] border-b border-[#d4af37]/30">
                            <tr>
                              <th className="p-3">Tanggal</th>
                              <th className="p-3">Santri</th>
                              <th className="p-3">Jenis</th>
                              <th className="p-3">Nominal</th>
                              <th className="p-3">Saldo Setelah</th>
                              <th className="p-3">Keperluan / Keterangan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#d4af37]/10 bg-[#020e08]/70">
                            {uangSakuList.slice(0, 10).map((us) => {
                              const sObj = santriList.find(s => s.id === us.idSantri);
                              return (
                                <tr key={us.id} className="hover:bg-[#d4af37]/5">
                                  <td className="p-3 font-mono text-emerald-300">{us.tanggal}</td>
                                  <td className="p-3 font-bold text-white">{sObj?.nama || us.idSantri}</td>
                                  <td className="p-3">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      us.tipe === 'Masuk' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-red-950 text-red-300 border border-red-500/40'
                                    }`}>
                                      {us.tipe === 'Masuk' ? '+ Masuk' : '- Keluar'}
                                    </span>
                                  </td>
                                  <td className="p-3 font-mono font-bold text-white">Rp {us.nominal.toLocaleString('id-ID')}</td>
                                  <td className="p-3 font-mono text-[#d4af37] font-bold">Rp {us.saldoSetelah.toLocaleString('id-ID')}</td>
                                  <td className="p-3 text-emerald-200">{us.keterangan}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* SECTION 10: MANAJEMEN KURIKULUM & KITAB PER ANGKATAN */}
                {activeControlSection === 'kelola_kurikulum' && (
                  <div className="card-3d rounded-2xl p-5 space-y-6">
                    <div className="flex items-center space-x-2 border-b border-[#d4af37]/20 pb-3">
                      <BookOpen className="w-5 h-5 text-[#d4af37]" />
                      <div>
                        <h4 className="text-sm font-bold text-white text-gold-3d">
                          Manajemen Kurikulum per Angkatan & Kitab Rujukan
                        </h4>
                        <p className="text-[11px] text-emerald-300">
                          Kelola silabus madrasah diniyah, kutubut turots per angkatan, pengarang (mu'allif), target capaian semester, dan ustadz pengampu.
                        </p>
                      </div>
                    </div>

                    {/* Form Input Kurikulum di Option Panel */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!inputKurikulumForm.mapel || !inputKurikulumForm.kitab) {
                          alert('Mata pelajaran dan nama kitab wajib diisi!');
                          return;
                        }
                        const newRec: KurikulumKitabRecord = {
                          id: `KUR-${Date.now()}`,
                          ...inputKurikulumForm
                        };
                        if (onSaveKurikulum) {
                          onSaveKurikulum(newRec);
                        }
                        setInputKurikulumForm({
                          kelas: inputKurikulumForm.kelas,
                          mapel: '',
                          kitab: '',
                          muallif: '',
                          targetSemester: '',
                          ustadzPengampu: 'Ustazah Fina Nikmatul Kamelia'
                        });
                        alert('Kurikulum dan Kitab baru berhasil ditambahkan!');
                      }}
                      className="bg-[#052216] border border-[#d4af37]/30 rounded-2xl p-4 space-y-4"
                    >
                      <div className="flex items-center justify-between border-b border-[#d4af37]/20 pb-2">
                        <span className="text-xs font-bold text-[#d4af37] uppercase tracking-wide">
                          Tambah Kurikulum & Kitab Baru
                        </span>
                        <span className="text-[10px] text-emerald-300">Tampil otomatis di bawah tabel jadwal</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                        <div>
                          <label className="block text-emerald-300 font-semibold mb-1">Angkatan / Kelas</label>
                          <select
                            value={inputKurikulumForm.kelas}
                            onChange={(e) => setInputKurikulumForm({ ...inputKurikulumForm, kelas: e.target.value })}
                            className="w-full bg-[#020e08] border border-[#d4af37]/40 rounded-xl p-2.5 text-white"
                          >
                            {classList.map(kls => (
                              <option key={kls} value={kls}>{kls}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-emerald-300 font-semibold mb-1">Mata Pelajaran (Fan Ilmu)</label>
                          <input
                            type="text"
                            value={inputKurikulumForm.mapel}
                            onChange={(e) => setInputKurikulumForm({ ...inputKurikulumForm, mapel: e.target.value })}
                            placeholder="Contoh: Nahwu, Fiqih, Hadits..."
                            required
                            className="w-full bg-[#020e08] border border-[#d4af37]/40 rounded-xl p-2.5 text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-emerald-300 font-semibold mb-1">Nama Kitab Rujukan</label>
                          <input
                            type="text"
                            value={inputKurikulumForm.kitab}
                            onChange={(e) => setInputKurikulumForm({ ...inputKurikulumForm, kitab: e.target.value })}
                            placeholder="Contoh: Matan Al-Ajurrumiyyah..."
                            required
                            className="w-full bg-[#020e08] border border-[#d4af37]/40 rounded-xl p-2.5 text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-emerald-300 font-semibold mb-1">Pengarang (Mu'allif)</label>
                          <input
                            type="text"
                            value={inputKurikulumForm.muallif}
                            onChange={(e) => setInputKurikulumForm({ ...inputKurikulumForm, muallif: e.target.value })}
                            placeholder="Contoh: Abu Abdillah Ibnu Ajurrum..."
                            className="w-full bg-[#020e08] border border-[#d4af37]/40 rounded-xl p-2.5 text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-emerald-300 font-semibold mb-1">Target Capaian Semester</label>
                          <input
                            type="text"
                            value={inputKurikulumForm.targetSemester}
                            onChange={(e) => setInputKurikulumForm({ ...inputKurikulumForm, targetSemester: e.target.value })}
                            placeholder="Contoh: Bab Kalam s/d Bab I'rob..."
                            className="w-full bg-[#020e08] border border-[#d4af37]/40 rounded-xl p-2.5 text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-emerald-300 font-semibold mb-1">Ustadz Pengampu</label>
                          <select
                            value={inputKurikulumForm.ustadzPengampu}
                            onChange={(e) => setInputKurikulumForm({ ...inputKurikulumForm, ustadzPengampu: e.target.value })}
                            className="w-full bg-[#020e08] border border-[#d4af37]/40 rounded-xl p-2.5 text-white"
                          >
                            {guruList.map(g => (
                              <option key={g.id} value={g.nama}>{g.nama} ({g.mapel})</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="text-right pt-2 border-t border-[#d4af37]/20">
                        <button
                          type="submit"
                          className="btn-3d-gold px-6 py-2.5 text-black font-extrabold text-xs rounded-xl flex items-center gap-2 ml-auto shadow"
                        >
                          <Save className="w-4 h-4 text-black" />
                          <span>Simpan Kurikulum Baru</span>
                        </button>
                      </div>
                    </form>

                    {/* Tabel Kurikulum yang sudah tersimpan */}
                    <div className="space-y-2">
                      <span className="text-xs text-[#d4af37] font-bold block">Daftar Kurikulum & Kitab per Angkatan yang Terdaftar</span>
                      <div className="overflow-x-auto rounded-xl border border-[#d4af37]/20">
                        <table className="w-full text-left text-xs min-w-[800px]">
                          <thead className="bg-[#03140c] text-[#d4af37] border-b border-[#d4af37]/30">
                            <tr>
                              <th className="p-3">Angkatan</th>
                              <th className="p-3">Fan Ilmu</th>
                              <th className="p-3">Kitab</th>
                              <th className="p-3">Pengarang (Mu'allif)</th>
                              <th className="p-3">Target Semester</th>
                              <th className="p-3">Ustadz</th>
                              <th className="p-3 text-center">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#d4af37]/10 bg-[#020e08]/70">
                            {kurikulumList.map((k) => (
                              <tr key={k.id} className="hover:bg-[#d4af37]/5">
                                <td className="p-3 font-semibold text-[#d4af37]">{k.kelas}</td>
                                <td className="p-3 text-white font-bold">{k.mapel}</td>
                                <td className="p-3 font-extrabold text-white text-sm">{k.kitab}</td>
                                <td className="p-3 text-emerald-200/90 italic">{k.muallif || '-'}</td>
                                <td className="p-3 text-white/90">{k.targetSemester || '-'}</td>
                                <td className="p-3 text-emerald-300 font-medium">{k.ustadzPengampu}</td>
                                <td className="p-3 text-center">
                                  {onDeleteKurikulum && (
                                    <button
                                      onClick={() => {
                                        if (window.confirm(`Hapus kurikulum "${k.kitab}"?`)) {
                                          onDeleteKurikulum(k.id);
                                        }
                                      }}
                                      className="p-1 rounded bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-red-300"
                                      title="Hapus"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* SINKRONISASI GOOGLE SHEETS SPREADSHEET ID */}
                <div className="card-3d rounded-2xl p-4 space-y-3">
                  <label className="block text-xs font-bold text-[#d4af37] text-gold-3d">
                    Google Sheets Master Spreadsheet ID
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={spreadsheetId}
                      onChange={(e) => setSpreadsheetId(e.target.value)}
                      className="flex-1 bg-[#0a301f] border border-[#d4af37]/40 rounded-xl p-2.5 text-xs text-white font-mono shadow-inner"
                      placeholder="ID Spreadsheet Google Sheets"
                    />
                    <button
                      onClick={onSyncWithSheets}
                      className="px-5 py-2.5 btn-3d-gold text-black font-extrabold text-xs rounded-xl"
                    >
                      Sinkronkan Sekarang
                    </button>
                  </div>
                  <p className="text-[11px] text-emerald-300/90">
                    Seluruh mutasi data yang diinputkan dari Option Panel disinkronkan ke master Google Spreadsheet ini.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};