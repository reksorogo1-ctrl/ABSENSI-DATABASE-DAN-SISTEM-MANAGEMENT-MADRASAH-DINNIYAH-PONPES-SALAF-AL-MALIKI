import React, { useState, useEffect, useMemo } from 'react';
import {
  Award,
  Trophy,
  TrendingUp,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  BookOpen,
  Layers,
  Medal,
  RotateCcw
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import {
  AppSettings,
  MuhafadzohSemesterRecord,
  Santri,
  UjianExamGlobalConfig
} from '../types';
import {
  loadMasterDataFromFirestore,
  saveMasterDataToFirestore,
  subscribeMasterDataFromFirestore
} from '../firebase';
import {
  KELAS_MADRASAH_LIST,
  evaluateMuhafadzohKategori,
  getTargetForKelas,
  resolveDefaultHafalanFromSantri
} from '../lib/ujianExamHelpers';
import { UjianTakziranModule, EligibleUjianTakziranItem } from './UjianTakziranModule';

interface TabUjianMuhafadzohProps {
  santriList: Santri[];
  config: UjianExamGlobalConfig;
  settings: AppSettings;
  onOpenInputModal: (santri: Santri) => void;
  onOpenOptionPanel: () => void;
  onUpdateSantriProfile?: (updated: Santri) => void;
}

export function resolveSantriGender(s: Santri): 'Putra' | 'Putri' {
  if (s.jenisKelamin === 'Putri' || s.jenisKelamin === 'Putra') {
    return s.jenisKelamin;
  }
  const kamarLower = (s.kamar || '').toLowerCase();
  const namaLower = (s.nama || '').toLowerCase();
  if (
    kamarLower.includes('putri') ||
    kamarLower.includes('fatimah') ||
    kamarLower.includes('aisyah') ||
    kamarLower.includes('khadijah') ||
    kamarLower.includes('maryam') ||
    namaLower.includes('fina') ||
    namaLower.includes('siti') ||
    namaLower.includes('putri') ||
    namaLower.includes('zahra') ||
    namaLower.includes('nurul') ||
    namaLower.includes('dewi') ||
    namaLower.includes('kamelia') ||
    namaLower.includes('nabila') ||
    namaLower.includes('salma')
  ) {
    return 'Putri';
  }
  return 'Putra';
}

export function resolveSantriNadzhom(s: Santri): string {
  if (s.kitabMuhafadzoh && s.kitabMuhafadzoh.trim()) {
    return s.kitabMuhafadzoh.trim().toUpperCase();
  }
  const k = (s.kelas || '').toUpperCase();
  if (k.includes('1 TSANAWIYAH') || k.includes('1 MTS')) return 'NADZHOM AQIDATUL AWAM';
  if (k.includes('2 TSANAWIYAH') || k.includes('2 MTS')) return 'NADZHOM MAQSUD';
  if (k.includes('3 TSANAWIYAH') || k.includes('3 MTS')) return 'NADZHOM IMRITHI';
  if (k.includes('1 ALIYAH') || k.includes('1 MA')) return 'NADZHOM ALFIYAH (JILID 1)';
  if (k.includes('2 ALIYAH') || k.includes('2 MA')) return 'NADZHOM ALFIYAH (JILID 2)';
  if (k.includes('3 ALIYAH') || k.includes('3 MA')) return 'NADZHOM ALFIYAH (KHATAM)';
  return 'NADZHOM IMRITHI';
}

export function resolveSantriKategori(s: Santri): 'JAYYID' | 'MUTAWASIT' | 'RODI' {
  if (s.kategoriMhf) return s.kategoriMhf;
  const score = Number(s.nilaiMuhafadzoh ?? 92);
  if (score >= 85) return 'JAYYID';
  if (score >= 70) return 'MUTAWASIT';
  return 'RODI';
}

export function resolveSantriTahunAjaran(s: Santri): string {
  return s.tahunAjaranAktif || s.tahunAjaran || '2026/2027';
}

export function resolveSantriAngkatan(s: Santri): string {
  if (s.angkatan) return s.angkatan;
  if (s.tahunMasuk) return `Angkatan ${s.tahunMasuk.split('/')[0]}`;
  const k = s.kelas || '';
  if (k.includes('1 TSANAWIYAH')) return 'Angkatan 2026';
  if (k.includes('2 TSANAWIYAH')) return 'Angkatan 2025';
  if (k.includes('3 TSANAWIYAH')) return 'Angkatan 2024';
  if (k.includes('1 ALIYAH')) return 'Angkatan 2023';
  if (k.includes('2 ALIYAH')) return 'Angkatan 2022';
  if (k.includes('3 ALIYAH')) return 'Angkatan 2021';
  return 'Angkatan 2025';
}

export const TabUjianMuhafadzoh: React.FC<TabUjianMuhafadzohProps> = ({
  santriList,
  config,
  settings,
  onOpenInputModal,
  onOpenOptionPanel,
  onUpdateSantriProfile
}) => {
  const [filterTahun, setFilterTahun] = useState<string>('SEMUA');
  const [filterKelas, setFilterKelas] = useState<string>('SEMUA');
  const [filterGender, setFilterGender] = useState<string>('SEMUA');
  const [semesterView, setSemesterView] = useState<'ALL' | 'GANJIL' | 'GENAP'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [muhafadzohRecords, setMuhafadzohRecords] = useState<MuhafadzohSemesterRecord[]>([]);

  // Muat & subscribe data hafalan Ganjil/Genap dari Firestore
  useEffect(() => {
    let active = true;
    loadMasterDataFromFirestore<MuhafadzohSemesterRecord[]>('ujian_muhafadzoh_records').then(
      (data) => {
        if (active && Array.isArray(data)) setMuhafadzohRecords(data);
      }
    );
    const unsub = subscribeMasterDataFromFirestore<MuhafadzohSemesterRecord[]>(
      'ujian_muhafadzoh_records',
      (data) => {
        if (active && Array.isArray(data)) setMuhafadzohRecords(data);
      }
    );
    return () => {
      active = false;
      unsub();
    };
  }, []);

  const recordMap = useMemo(() => {
    const map = new Map<string, MuhafadzohSemesterRecord>();
    muhafadzohRecords.forEach((r) => {
      map.set(`${r.idSantri}__${r.tahunAjaran}`, r);
    });
    return map;
  }, [muhafadzohRecords]);

  // Gabungkan santri dengan target Option Panel & catatan hafalan Ganjil/Genap
  const enrichedList = useMemo(() => {
    return santriList.map((s, idx) => {
      const gender = resolveSantriGender(s);
      const tahun = resolveSantriTahunAjaran(s);
      const angkatan = resolveSantriAngkatan(s);
      const targetCfg = getTargetForKelas(config, s.kelas);
      const rec = recordMap.get(`${s.id}__${tahun}`);
      const defaults = resolveDefaultHafalanFromSantri(
        s,
        targetCfg.targetGanjil,
        targetCfg.targetGenap
      );

      const hafalanGanjil = rec ? rec.hafalanGanjil : defaults.hafalanGanjil;
      const hafalanGenap = rec ? rec.hafalanGenap : defaults.hafalanGenap;

      const statusGanjil = evaluateMuhafadzohKategori(hafalanGanjil, targetCfg.targetGanjil);
      const statusGenap = evaluateMuhafadzohKategori(hafalanGenap, targetCfg.targetGenap);

      const isRodi =
        semesterView === 'GANJIL'
          ? statusGanjil === 'RODI'
          : semesterView === 'GENAP'
          ? statusGenap === 'RODI'
          : statusGanjil === 'RODI' || statusGenap === 'RODI';

      const kategoriAkhir: 'JAYYID' | 'MUTAWASIT' | 'RODI' = isRodi ? 'RODI' : 'JAYYID';

      const alasanKekurangan: string[] = [];
      if (statusGanjil === 'RODI' && semesterView !== 'GENAP') {
        alasanKekurangan.push(`Ganjil ${hafalanGanjil}/${targetCfg.targetGanjil} bait`);
      }
      if (statusGenap === 'RODI' && semesterView !== 'GANJIL') {
        alasanKekurangan.push(`Genap ${hafalanGenap}/${targetCfg.targetGenap} bait`);
      }

      return {
        ...s,
        uniqueKey: `${s.id}-${idx}`,
        gender,
        tahun,
        angkatan,
        targetCfg,
        hafalanGanjil,
        hafalanGenap,
        statusGanjil,
        statusGenap,
        kategoriAkhir,
        isRodi,
        alasanKekurangan: alasanKekurangan.join(' · '),
        statusHerGanjil: rec?.statusHerGanjil || 'Belum Her',
        statusHerGenap: rec?.statusHerGenap || 'Belum Her',
        score: Number(s.nilaiMuhafadzoh ?? 90)
      };
    });
  }, [santriList, config, recordMap, semesterView]);

  const tahunOptions = useMemo(() => {
    const set = new Set<string>(['2026/2027', '2025/2026', '2024/2025']);
    enrichedList.forEach((e) => set.add(e.tahun));
    return Array.from(set).sort().reverse();
  }, [enrichedList]);

  const filteredList = useMemo(() => {
    return enrichedList.filter((s) => {
      if (filterTahun !== 'SEMUA' && s.tahun !== filterTahun) return false;
      if (filterKelas !== 'SEMUA' && s.kelas !== filterKelas) return false;
      if (filterGender !== 'SEMUA' && s.gender !== filterGender) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!s.nama.toLowerCase().includes(q) && !s.id.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [enrichedList, filterTahun, filterKelas, filterGender, searchQuery]);

  // Kelompokkan Per Kelas untuk Tabel Penilaian Semester Ganjil & Genap
  const groupedSantriByClass = useMemo(() => {
    const map = new Map<string, typeof filteredList>();
    KELAS_MADRASAH_LIST.forEach((k) => map.set(k, []));
    filteredList.forEach((s) => {
      const k = s.kelas || '1 TSANAWIYAH';
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(s);
    });
    return Array.from(map.entries()).filter(([, arr]) => arr.length > 0);
  }, [filteredList]);

  // Kelompokkan Santri RODI Per Kelas untuk Tabel Her Muhafadzoh
  const herMuhafadzohByClass = useMemo(() => {
    const rodiList = filteredList.filter((s) => s.isRodi);
    const map = new Map<string, typeof rodiList>();
    KELAS_MADRASAH_LIST.forEach((k) => map.set(k, []));
    rodiList.forEach((s) => {
      const k = s.kelas || '1 TSANAWIYAH';
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(s);
    });
    return Array.from(map.entries()).filter(([, arr]) => arr.length > 0);
  }, [filteredList]);

  // Eligible Items untuk Surat Takziran Otomatis
  const eligibleTakziranItems = useMemo<EligibleUjianTakziranItem[]>(() => {
    return enrichedList
      .filter((s) => s.isRodi)
      .map((s) => ({
        santri: s,
        periodeTag: s.tahun,
        alasanTakziran: `Nilai Rodi — Hafalan belum mencapai target`,
        detailNilai: s.alasanKekurangan || `Hafalan ${s.hafalanGanjil}/${s.targetCfg.targetGanjil} bait`
      }));
  }, [enrichedList]);

  // Rekap Hasil Muhafadzoh (Tabel Sederhana & Informatif dari Option Panel + ringkasan kelas aktif)
  const rekapTableRows = useMemo(() => {
    if (config.muhafadzohRekapRows && config.muhafadzohRekapRows.length > 0) {
      return config.muhafadzohRekapRows.filter((row) =>
        filterKelas === 'SEMUA' ? true : row.kelas === filterKelas
      );
    }
    return [];
  }, [config.muhafadzohRekapRows, filterKelas]);

  // Chart data sederhana dari rekap / status kelas aktif
  const classSummaryChart = useMemo(() => {
    return KELAS_MADRASAH_LIST.map((kelas) => {
      const list = enrichedList.filter((s) => s.kelas === kelas);
      const tuntas = list.filter((s) => !s.isRodi).length;
      const rodi = list.filter((s) => s.isRodi).length;
      return {
        kelas: kelas.replace('TSANAWIYAH', 'TSN').replace('ALIYAH', 'ALY'),
        TuntasTarget: tuntas,
        RodiWajibHer: rodi
      };
    });
  }, [enrichedList]);

  // Peringkat Angkatan Sepanjang Masa (HANYA PER ANGKATAN, Editable di Option Panel)
  const sortedAngkatanRows = useMemo(() => {
    return [...(config.muhafadzohAngkatanRanking || [])].sort(
      (a, b) => b.persentaseCapaian - a.persentaseCapaian
    );
  }, [config.muhafadzohAngkatanRanking]);

  // Simpan perubahan hafalan Ganjil / Genap santri ke Firestore
  const handleUpdateHafalan = async (
    santri: (typeof enrichedList)[number],
    field: 'hafalanGanjil' | 'hafalanGenap' | 'statusHerGanjil' | 'statusHerGenap',
    value: number | string
  ) => {
    const recId = `${santri.id}__${santri.tahun}`;
    const nextGanjil =
      field === 'hafalanGanjil' ? Number(value) || 0 : santri.hafalanGanjil;
    const nextGenap =
      field === 'hafalanGenap' ? Number(value) || 0 : santri.hafalanGenap;

    const newRec: MuhafadzohSemesterRecord = {
      id: recId,
      idSantri: santri.id,
      namaSantri: santri.nama,
      kelas: santri.kelas,
      tahunAjaran: santri.tahun,
      hafalanGanjil: nextGanjil,
      hafalanGenap: nextGenap,
      statusHerGanjil:
        field === 'statusHerGanjil'
          ? (value as MuhafadzohSemesterRecord['statusHerGanjil'])
          : santri.statusHerGanjil,
      statusHerGenap:
        field === 'statusHerGenap'
          ? (value as MuhafadzohSemesterRecord['statusHerGenap'])
          : santri.statusHerGenap,
      updatedAt: new Date().toISOString()
    };

    const others = muhafadzohRecords.filter(
      (r) => !(r.idSantri === santri.id && r.tahunAjaran === santri.tahun)
    );
    const nextList = [newRec, ...others];
    setMuhafadzohRecords(nextList);
    await saveMasterDataToFirestore('ujian_muhafadzoh_records', nextList);

    // Sinkronkan juga ke profil santri agar terbaca di Wali Santri
    if (onUpdateSantriProfile) {
      const sGanjil = evaluateMuhafadzohKategori(nextGanjil, santri.targetCfg.targetGanjil);
      const sGenap = evaluateMuhafadzohKategori(nextGenap, santri.targetCfg.targetGenap);
      const finalKat: 'JAYYID' | 'RODI' =
        sGanjil === 'RODI' || sGenap === 'RODI' ? 'RODI' : 'JAYYID';
      const pctScore = Math.min(
        100,
        Math.round(
          ((nextGanjil / Math.max(1, santri.targetCfg.targetGanjil) +
            nextGenap / Math.max(1, santri.targetCfg.targetGenap)) /
            2) *
            100
        )
      );
      onUpdateSantriProfile({
        ...santri,
        kategoriMhf: finalKat,
        nilaiMuhafadzoh: pctScore,
        kitabMuhafadzoh: santri.targetCfg.namaNadzhomGenap,
        predikatMuhafadzoh:
          finalKat === 'RODI'
            ? `RODI — Wajib Her (Ganjil ${nextGanjil}/${santri.targetCfg.targetGanjil}, Genap ${nextGenap}/${santri.targetCfg.targetGenap})`
            : `JAYYID — Memenuhi Target (${nextGanjil + nextGenap} Bait)`
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER TAB STANDALONE: MUHAFADZOH */}
      <div className="card-3d rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-[#d4af37]/40 bg-gradient-to-r from-[#062417] via-[#041a10] to-[#072c1c]">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#f5e298] via-[#d4af37] to-[#7a5410] flex items-center justify-center text-black shadow">
            <Award className="w-5 h-5 stroke-[2.4]" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white text-gold-3d">
              TAB UJIAN MUHAFADZOH NADZHOM
            </h2>
            <p className="text-xs text-emerald-200/85 mt-0.5">
              Penilaian hafalan Semester Ganjil & Genap per kelas, Tabel Her Rodi, Surat Takziran otomatis, Rekap sederhana, dan Peringkat Angkatan.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono tabular-nums text-emerald-300 mr-2">
            {filteredList.length} Santri · {filteredList.filter((s) => s.isRodi).length} Wajib Her (Rodi)
          </span>
          <button
            type="button"
            onClick={onOpenOptionPanel}
            className="px-3.5 py-2 rounded-xl bg-[#0b3824] hover:bg-[#104d32] border border-[#d4af37]/50 text-[#f5e298] text-xs font-bold inline-flex items-center gap-1.5 transition whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Edit Target & Data (Option Panel)</span>
          </button>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="card-3d-glass p-4 rounded-2xl border border-[#d4af37]/30 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#f5e298]">
            <Filter className="w-4 h-4 text-[#d4af37]" />
            <span>Filter Penilaian Muhafadzoh Per Kelas & Semester</span>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-lg bg-[#03150c] border border-[#d4af37]/30">
            {(
              [
                ['ALL', 'Ganjil & Genap'],
                ['GANJIL', 'Semester Ganjil'],
                ['GENAP', 'Semester Genap']
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setSemesterView(val)}
                className={`px-3 py-1 rounded-md text-xs font-bold whitespace-nowrap cursor-pointer transition ${
                  semesterView === val
                    ? 'bg-[#d4af37] text-black'
                    : 'text-zinc-300 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-zinc-300 mb-1">Tahun Ajaran:</label>
            <select
              value={filterTahun}
              onChange={(e) => setFilterTahun(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-[#03150c] border border-[#d4af37]/40 text-white text-xs font-semibold"
            >
              <option value="SEMUA">Semua Tahun</option>
              {tahunOptions.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-300 mb-1">Kelas:</label>
            <select
              value={filterKelas}
              onChange={(e) => setFilterKelas(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-[#03150c] border border-[#d4af37]/40 text-white text-xs font-semibold"
            >
              <option value="SEMUA">Semua Kelas (Per Kelas)</option>
              {KELAS_MADRASAH_LIST.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-300 mb-1">Putra / Putri:</label>
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-[#03150c] border border-[#d4af37]/40 text-white text-xs font-semibold"
            >
              <option value="SEMUA">Semua Santri</option>
              <option value="Putra">Putra</option>
              <option value="Putri">Putri</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-300 mb-1">Cari Santri:</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nama / NIS..."
                className="w-full pl-8 pr-2.5 py-1.5 rounded-xl bg-[#03150c] border border-[#d4af37]/40 text-white text-xs placeholder:text-zinc-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: TABEL PENILAIAN MUHAFADZOH SEMESTER GANJIL & GENAP (PER KELAS) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#d4af37]" />
              <span>Tabel Penilaian Muhafadzoh Semester Ganjil & Genap (Per Kelas)</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Nama Nadzhom & Target Jumlah Hafalan diatur di Option Panel. Santri dengan jumlah hafalan di bawah target otomatis bernilai RODI.
            </p>
          </div>
        </div>

        {groupedSantriByClass.map(([kelasName, santris]) => {
          const targetCfg = getTargetForKelas(config, kelasName);
          return (
            <div
              key={`mhf-kelas-${kelasName}`}
              className="card-3d rounded-2xl border border-[#d4af37]/30 overflow-hidden bg-[#020e08]/95"
            >
              {/* Header Kelas + Info Nadzhom & Target */}
              <div className="p-4 bg-[#052216] border-b border-[#d4af37]/25 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2">
                <div>
                  <h4 className="text-sm font-black text-[#f5e298]">
                    Kelas {kelasName} ({santris.length} Santri)
                  </h4>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-emerald-200/90 mt-1">
                    {semesterView !== 'GENAP' && (
                      <span>
                        Ganjil: <strong className="text-white">{targetCfg.namaNadzhomGanjil}</strong> · Target{' '}
                        <strong className="text-[#f5e298] font-mono tabular-nums">
                          {targetCfg.targetGanjil} Bait
                        </strong>
                      </span>
                    )}
                    {semesterView !== 'GANJIL' && (
                      <span>
                        Genap: <strong className="text-white">{targetCfg.namaNadzhomGenap}</strong> · Target{' '}
                        <strong className="text-[#f5e298] font-mono tabular-nums">
                          {targetCfg.targetGenap} Bait
                        </strong>
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onOpenOptionPanel}
                  className="text-xs font-bold text-[#d4af37] hover:text-white inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Ubah Nadzhom & Target</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left min-w-[920px]">
                  <thead className="bg-[#03140c] text-[#d4af37] border-b border-[#d4af37]/20">
                    <tr>
                      <th className="p-3 w-12 text-center">No</th>
                      <th className="p-3">Santri & NIS</th>
                      {semesterView !== 'GENAP' && (
                        <>
                          <th className="p-3 text-center">Hafalan Ganjil (Bait)</th>
                          <th className="p-3 text-center">Hasil Ganjil</th>
                        </>
                      )}
                      {semesterView !== 'GANJIL' && (
                        <>
                          <th className="p-3 text-center">Hafalan Genap (Bait)</th>
                          <th className="p-3 text-center">Hasil Genap</th>
                        </>
                      )}
                      <th className="p-3 text-center">Status Akhir</th>
                      <th className="p-3 text-center">Aksi Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {santris.map((s, idx) => (
                      <tr key={s.uniqueKey} className="hover:bg-white/[0.03] transition">
                        <td className="p-3 text-center font-mono tabular-nums font-bold text-emerald-300">
                          {idx + 1}
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-white">{s.nama}</div>
                          <div className="text-[11px] text-zinc-400 font-mono tabular-nums">
                            NIS: {s.id} · {s.gender} · {s.tahun}
                          </div>
                        </td>

                        {semesterView !== 'GENAP' && (
                          <>
                            <td className="p-3 text-center">
                              <div className="inline-flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min={0}
                                  value={s.hafalanGanjil}
                                  onChange={(e) =>
                                    handleUpdateHafalan(s, 'hafalanGanjil', Number(e.target.value))
                                  }
                                  className="w-20 px-2 py-1 rounded-lg bg-[#03150c] border border-[#d4af37]/40 text-white font-mono tabular-nums text-center font-bold"
                                />
                                <span className="text-[11px] text-zinc-400 font-mono tabular-nums">
                                  / {s.targetCfg.targetGanjil}
                                </span>
                              </div>
                            </td>
                            <td className="p-3 text-center font-mono font-bold">
                              {s.statusGanjil === 'RODI' ? (
                                <span className="text-red-400">RODI (Kurang Target)</span>
                              ) : (
                                <span className="text-emerald-400">JAYYID (Tercapai)</span>
                              )}
                            </td>
                          </>
                        )}

                        {semesterView !== 'GANJIL' && (
                          <>
                            <td className="p-3 text-center">
                              <div className="inline-flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min={0}
                                  value={s.hafalanGenap}
                                  onChange={(e) =>
                                    handleUpdateHafalan(s, 'hafalanGenap', Number(e.target.value))
                                  }
                                  className="w-20 px-2 py-1 rounded-lg bg-[#03150c] border border-[#d4af37]/40 text-white font-mono tabular-nums text-center font-bold"
                                />
                                <span className="text-[11px] text-zinc-400 font-mono tabular-nums">
                                  / {s.targetCfg.targetGenap}
                                </span>
                              </div>
                            </td>
                            <td className="p-3 text-center font-mono font-bold">
                              {s.statusGenap === 'RODI' ? (
                                <span className="text-red-400">RODI (Kurang Target)</span>
                              ) : (
                                <span className="text-emerald-400">JAYYID (Tercapai)</span>
                              )}
                            </td>
                          </>
                        )}

                        <td className="p-3 text-center">
                          {s.kategoriAkhir === 'RODI' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-black text-red-400">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>RODI · Wajib Her</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>JAYYID</span>
                            </span>
                          )}
                        </td>

                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => onOpenInputModal(s)}
                            className="px-3 py-1.5 rounded-lg bg-[#0b3824] hover:bg-[#104d32] border border-[#d4af37]/40 text-[#f5e298] text-xs font-bold whitespace-nowrap cursor-pointer"
                          >
                            Edit Profil Nilai
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* SECTION 2: TABEL HER MUHAFADZOH (FORMAT PER KELAS — OTOMATIS DARI NILAI RODI) */}
      <div className="card-3d rounded-2xl p-5 border border-amber-500/40 bg-[#170e03]/90 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-amber-500/20 pb-3">
          <div>
            <h3 className="text-base font-black text-amber-200 flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>Tabel Her Muhafadzoh (Otomatis Per Kelas Bagi Nilai Rodi)</span>
            </h3>
            <p className="text-xs text-amber-200/75 mt-0.5">
              Santri yang jumlah hafalannya belum mencapai target mendapat nilai RODI, otomatis masuk tabel Her Muhafadzoh per kelas, dan otomatis menerima Surat Takziran.
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-amber-300 font-bold">
            Total Santri Her: {herMuhafadzohByClass.reduce((acc, [, arr]) => acc + arr.length, 0)} Santri
          </span>
        </div>

        {herMuhafadzohByClass.length === 0 ? (
          <div className="p-6 rounded-xl border border-emerald-500/20 bg-black/30 text-center text-xs text-emerald-300">
            Seluruh santri telah mencapai target hafalan nadzhom — belum ada peserta Her Muhafadzoh saat ini.
          </div>
        ) : (
          <div className="space-y-4">
            {herMuhafadzohByClass.map(([kelasName, rows]) => (
              <div
                key={`her-mhf-${kelasName}`}
                className="rounded-xl border border-amber-500/30 overflow-hidden bg-black/40"
              >
                <div className="px-4 py-2.5 bg-amber-950/60 border-b border-amber-500/25 flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-200">Her Muhafadzoh — Kelas {kelasName}</span>
                  <span className="text-[11px] font-mono tabular-nums text-amber-300">
                    {rows.length} Santri
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left min-w-[820px]">
                    <thead className="bg-[#1e1203] text-amber-200 border-b border-amber-500/20">
                      <tr>
                        <th className="p-3 w-12 text-center">No</th>
                        <th className="p-3">Santri & NIS</th>
                        <th className="p-3">Nadzhom</th>
                        <th className="p-3">Kekurangan Target</th>
                        <th className="p-3 text-center">Status Her Ganjil</th>
                        <th className="p-3 text-center">Status Her Genap</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {rows.map((s, idx) => (
                        <tr key={`her-row-${s.id}`} className="hover:bg-amber-950/20">
                          <td className="p-3 text-center font-mono tabular-nums font-bold text-amber-300">
                            {idx + 1}
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-white">{s.nama}</div>
                            <div className="text-[11px] text-zinc-400 font-mono">NIS: {s.id}</div>
                          </td>
                          <td className="p-3 text-zinc-200">
                            {s.targetCfg.namaNadzhomGenap}
                          </td>
                          <td className="p-3 font-mono tabular-nums text-red-300 font-semibold">
                            RODI ({s.alasanKekurangan})
                          </td>
                          <td className="p-3 text-center">
                            {s.statusGanjil === 'RODI' ? (
                              <select
                                value={s.statusHerGanjil}
                                onChange={(e) =>
                                  handleUpdateHafalan(s, 'statusHerGanjil', e.target.value)
                                }
                                className="px-2 py-1 rounded-lg bg-[#03150c] border border-amber-500/40 text-xs text-white font-semibold"
                              >
                                <option value="Belum Her">Belum Her</option>
                                <option value="Sedang Her">Sedang Her</option>
                                <option value="Lulus Her">Lulus Her</option>
                              </select>
                            ) : (
                              <span className="text-emerald-400 font-semibold">Tuntas</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {s.statusGenap === 'RODI' ? (
                              <select
                                value={s.statusHerGenap}
                                onChange={(e) =>
                                  handleUpdateHafalan(s, 'statusHerGenap', e.target.value)
                                }
                                className="px-2 py-1 rounded-lg bg-[#03150c] border border-amber-500/40 text-xs text-white font-semibold"
                              >
                                <option value="Belum Her">Belum Her</option>
                                <option value="Sedang Her">Sedang Her</option>
                                <option value="Lulus Her">Lulus Her</option>
                              </select>
                            ) : (
                              <span className="text-emerald-400 font-semibold">Tuntas</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: OTOMATIS SURAT TAKZIRAN HER MUHAFADZOH (PER KELAS + TABEL TERLAMBAT) */}
      <UjianTakziranModule
        kategori="muhafadzoh"
        title="Surat Takziran Her Muhafadzoh (Per Kelas)"
        subtitle="Santri bernilai RODI otomatis menerima Surat Takziran. Setelah dicetak status menjadi Sedang Dikerjakan; setelah dikumpulkan menjadi Selesai; melewati batas akhir otomatis naik ke tingkat Sedang."
        eligibleItems={eligibleTakziranItems}
        config={config}
        settings={settings}
        selectedKelasFilter={filterKelas}
        onOpenOptionPanel={onOpenOptionPanel}
        accentColor="gold"
      />

      {/* SECTION 4: REKAP HASIL MUHAFADZOH — FORMAT TABEL SIMPLE, SEDERHANA & EDITABLE DI OPTION PANEL */}
      <div className="card-3d rounded-2xl p-5 border border-[#d4af37]/30 bg-[#020e08]/95 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#d4af37]/20 pb-3">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#d4af37]" />
              <span>Rekap Hasil Muhafadzoh</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Ringkasan capaian target hafalan dalam format tabel sederhana dan informatif. Data baris dapat diedit melalui Option Panel.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenOptionPanel}
            className="px-3 py-1.5 rounded-lg bg-[#0b3824] hover:bg-[#104d32] border border-[#d4af37]/40 text-xs font-bold text-[#f5e298] inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Edit Rekap (Option Panel)</span>
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#d4af37]/25">
          <table className="w-full text-xs text-left min-w-[820px]">
            <thead className="bg-[#03140c] text-[#d4af37] border-b border-[#d4af37]/25">
              <tr>
                <th className="p-3 w-12 text-center">No</th>
                <th className="p-3">Tahun Ajaran</th>
                <th className="p-3">Kelas</th>
                <th className="p-3">Nama Nadzhom</th>
                <th className="p-3 text-right">Target Bait</th>
                <th className="p-3 text-right">Total (Pa / Pi)</th>
                <th className="p-3 text-right">Jayyid / Mtw / Rodi</th>
                <th className="p-3 text-right">Persentase Lulus</th>
                <th className="p-3">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rekapTableRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-zinc-400">
                    Belum ada baris rekap. Tambahkan atau edit baris melalui Option Panel.
                  </td>
                </tr>
              ) : (
                rekapTableRows.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-white/[0.03] transition">
                    <td className="p-3 text-center font-mono tabular-nums text-emerald-300 font-bold">
                      {idx + 1}
                    </td>
                    <td className="p-3 font-mono tabular-nums text-zinc-200 font-semibold">
                      {row.tahunAjaran}
                    </td>
                    <td className="p-3 font-bold text-white">{row.kelas}</td>
                    <td className="p-3 text-[#f5e298] font-semibold">{row.namaNadzhom}</td>
                    <td className="p-3 text-right font-mono tabular-nums text-zinc-200">
                      {row.targetBait} Bait
                    </td>
                    <td className="p-3 text-right font-mono tabular-nums text-white">
                      {row.totalSantri} ({row.putra}/{row.putri})
                    </td>
                    <td className="p-3 text-right font-mono tabular-nums">
                      <span className="text-emerald-400">{row.jayyid}</span>
                      {' / '}
                      <span className="text-amber-300">{row.mutawasit}</span>
                      {' / '}
                      <span className="text-red-400">{row.rodi}</span>
                    </td>
                    <td className="p-3 text-right font-mono tabular-nums font-black text-[#f5e298]">
                      {Number(row.persentaseLulus).toFixed(1)}%
                    </td>
                    <td className="p-3 text-zinc-300">{row.keterangan || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Grafik Komparasi Kelas Tuntas vs Rodi */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" />
              <span>Sebaran Tuntas Target vs Rodi Per Kelas (Data Aktif)</span>
            </span>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classSummaryChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d4af37" strokeOpacity={0.12} />
                <XAxis dataKey="kelas" stroke="#a7f3d0" fontSize={10} />
                <YAxis stroke="#a7f3d0" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#02130b',
                    border: '1px solid #d4af37',
                    borderRadius: '10px',
                    fontSize: '11px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey="TuntasTarget" fill="#10b981" radius={[4, 4, 0, 0]} name="Tuntas Target (Jayyid)" />
                <Bar dataKey="RodiWajibHer" fill="#ef4444" radius={[4, 4, 0, 0]} name="Belum Target (Rodi / Her)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SECTION 5: PERINGKAT ANGKATAN SEPANJANG MASA (HANYA PER ANGKATAN, EDITABLE & VISUAL INFORMATIF) */}
      <div className="card-3d rounded-2xl p-5 border border-[#d4af37]/40 bg-[#03140c]/95 space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#d4af37]/25 pb-3">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-[#d4af37]" />
            <div>
              <h3 className="text-base font-black text-white">
                Peringkat Angkatan Sepanjang Masa
              </h3>
              <p className="text-xs text-emerald-300/90">
                Komparasi prestasi kolektif antar angkatan santri. Seluruh data dapat disesuaikan di Option Panel.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenOptionPanel}
            className="px-3 py-1.5 rounded-lg bg-[#0b3824] hover:bg-[#104d32] border border-[#d4af37]/40 text-xs font-bold text-[#f5e298] inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Edit Peringkat Angkatan</span>
          </button>
        </div>

        {/* Ringkasan Top 3 Podium Angkatan (Bersih & Informatif) */}
        {sortedAngkatanRows.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sortedAngkatanRows.slice(0, 3).map((item, idx) => (
              <div
                key={`podium-${item.id}`}
                className={`p-4 rounded-xl border space-y-2.5 ${
                  idx === 0
                    ? 'bg-[#1c1604] border-[#d4af37]'
                    : idx === 1
                    ? 'bg-[#0f1722] border-slate-400/50'
                    : 'bg-[#1a0f08] border-amber-700/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#f5e298] inline-flex items-center gap-1">
                    <Medal className="w-3.5 h-3.5" />
                    <span>Peringkat #{idx + 1}</span>
                  </span>
                  <span className="text-xs font-mono tabular-nums text-zinc-300">
                    T.A. {item.tahunAjaran}
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-black text-white">{item.angkatan}</h4>
                  <p className="text-xs text-zinc-400">
                    {item.kelas} · {item.namaNadzhom}
                  </p>
                </div>

                <div className="w-full h-1.5 rounded-full bg-black/50 overflow-hidden">
                  <div
                    className="h-full bg-[#d4af37]"
                    style={{ width: `${Math.min(100, Math.max(5, item.persentaseCapaian))}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-mono tabular-nums pt-1">
                  <span className="text-emerald-300">
                    Rata-rata: {item.rataRataHafalan} Bait
                  </span>
                  <span className="text-base font-black text-[#f5e298]">
                    {Number(item.persentaseCapaian).toFixed(1)}%
                  </span>
                </div>

                <div className="text-[11px] text-zinc-300 border-t border-white/10 pt-2">
                  {item.gelarPrestasi}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tabel Lengkap Peringkat Angkatan */}
        <div className="overflow-x-auto rounded-xl border border-[#d4af37]/25">
          <table className="w-full text-xs text-left min-w-[820px]">
            <thead className="bg-[#020e08] text-[#d4af37] border-b border-[#d4af37]/25">
              <tr>
                <th className="p-3 w-16 text-center">Rank</th>
                <th className="p-3">Angkatan</th>
                <th className="p-3">Kelas & Tahun Ajaran</th>
                <th className="p-3">Nadzhom</th>
                <th className="p-3 text-right">Jumlah Santri</th>
                <th className="p-3 text-right">Rata-rata Hafalan</th>
                <th className="p-3 text-right">Capaian (%)</th>
                <th className="p-3">Gelar & Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-[#020c07]">
              {sortedAngkatanRows.map((item, idx) => (
                <tr key={item.id} className="hover:bg-white/[0.03] transition">
                  <td className="p-3 text-center font-mono tabular-nums font-black text-[#f5e298]">
                    #{idx + 1}
                  </td>
                  <td className="p-3 font-bold text-white">{item.angkatan}</td>
                  <td className="p-3 text-zinc-300">
                    {item.kelas} · <span className="font-mono tabular-nums">{item.tahunAjaran}</span>
                  </td>
                  <td className="p-3 text-[#f5e298]">{item.namaNadzhom}</td>
                  <td className="p-3 text-right font-mono tabular-nums text-white">
                    {item.totalSantri} Santri
                  </td>
                  <td className="p-3 text-right font-mono tabular-nums text-emerald-300">
                    {item.rataRataHafalan} Bait
                  </td>
                  <td className="p-3 text-right font-mono tabular-nums font-black text-[#f5e298]">
                    {Number(item.persentaseCapaian).toFixed(1)}%
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-emerald-300">{item.gelarPrestasi}</div>
                    {item.catatan && (
                      <div className="text-[11px] text-zinc-400">{item.catatan}</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
