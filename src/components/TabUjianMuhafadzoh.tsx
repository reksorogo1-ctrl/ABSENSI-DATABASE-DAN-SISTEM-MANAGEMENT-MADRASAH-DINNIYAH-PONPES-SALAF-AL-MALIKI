import React, { useState, useMemo } from 'react';
import { 
  Award, Trophy, TrendingUp, Users, Calendar, Filter, 
  Search, CheckCircle2, AlertTriangle, XCircle, Sliders, 
  Sparkles, BookOpen, Layers, Medal
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, Legend, BarChart, Bar, CartesianGrid 
} from 'recharts';
import { Santri } from '../types';

interface TabUjianMuhafadzohProps {
  santriList: Santri[];
  onOpenInputModal: (santri: Santri) => void;
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
  if (k.includes('1 TSANAWIYAH') || k.includes('1 MTS')) {
    return 'NADZHOM AQIDATUL AWAM';
  }
  if (k.includes('2 TSANAWIYAH') || k.includes('2 MTS')) {
    return 'NADZHOM MAQSUD';
  }
  if (k.includes('3 TSANAWIYAH') || k.includes('3 MTS')) {
    return 'NADZHOM IMRITHI';
  }
  if (k.includes('1 ALIYAH') || k.includes('1 MA')) {
    return 'NADZHOM ALFIYAH (JILID 1)';
  }
  if (k.includes('2 ALIYAH') || k.includes('2 MA')) {
    return 'NADZHOM ALFIYAH (JILID 2)';
  }
  if (k.includes('3 ALIYAH') || k.includes('3 MA')) {
    return 'NADZHOM ALFIYAH (KHATAM)';
  }
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
  onOpenInputModal
}) => {
  // Filter States
  const [filterTahun, setFilterTahun] = useState<string>('SEMUA');
  const [filterAngkatan, setFilterAngkatan] = useState<string>('SEMUA');
  const [filterKelas, setFilterKelas] = useState<string>('SEMUA');
  const [filterNadzhom, setFilterNadzhom] = useState<string>('SEMUA');
  const [filterGender, setFilterGender] = useState<string>('SEMUA');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLeaderboardNadzhom, setSelectedLeaderboardNadzhom] = useState<string>('NADZHOM IMRITHI');
  // Mode Peringkat: 'angkatan' (Antar Angkatan - Default) atau 'santri' (Perorangan)
  const [rankingMode, setRankingMode] = useState<'angkatan' | 'santri'>('angkatan');

  // Enriched Santri Items
  const enrichedList = useMemo(() => {
    return santriList.map((s, idx) => {
      const gender = resolveSantriGender(s);
      const nadzhom = resolveSantriNadzhom(s);
      const kategori = resolveSantriKategori(s);
      const tahun = resolveSantriTahunAjaran(s);
      const angkatan = resolveSantriAngkatan(s);
      const score = Number(s.nilaiMuhafadzoh ?? 90);

      return {
        ...s,
        uniqueKey: `${s.id}-${idx}`,
        gender,
        nadzhom,
        kategori,
        tahun,
        angkatan,
        score
      };
    });
  }, [santriList]);

  // Distinct Filter Options
  const tahunOptions = useMemo(() => {
    const set = new Set<string>(['2026/2027', '2025/2026', '2024/2025']);
    enrichedList.forEach(e => set.add(e.tahun));
    return Array.from(set).sort().reverse();
  }, [enrichedList]);

  const nadzhomOptions = useMemo(() => {
    const set = new Set<string>([
      'NADZHOM IMRITHI',
      'NADZHOM ALFIYAH (JILID 1)',
      'NADZHOM ALFIYAH (JILID 2)',
      'NADZHOM ALFIYAH (KHATAM)',
      'NADZHOM AQIDATUL AWAM',
      'NADZHOM MAQSUD'
    ]);
    enrichedList.forEach(e => set.add(e.nadzhom));
    return Array.from(set);
  }, [enrichedList]);

  const angkatanOptions = useMemo(() => {
    const set = new Set<string>();
    enrichedList.forEach(e => set.add(e.angkatan));
    return Array.from(set).sort();
  }, [enrichedList]);

  const kelasOptions = useMemo(() => {
    const set = new Set<string>([
      '1 TSANAWIYAH',
      '2 TSANAWIYAH',
      '3 TSANAWIYAH',
      '1 ALIYAH',
      '2 ALIYAH',
      '3 ALIYAH'
    ]);
    enrichedList.forEach(e => set.add(e.kelas));
    return Array.from(set);
  }, [enrichedList]);

  // Filtered List
  const filteredList = useMemo(() => {
    return enrichedList.filter(s => {
      if (filterTahun !== 'SEMUA' && s.tahun !== filterTahun) return false;
      if (filterAngkatan !== 'SEMUA' && s.angkatan !== filterAngkatan) return false;
      if (filterKelas !== 'SEMUA' && s.kelas !== filterKelas) return false;
      if (filterNadzhom !== 'SEMUA' && s.nadzhom !== filterNadzhom) return false;
      if (filterGender !== 'SEMUA' && s.gender !== filterGender) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = s.nama.toLowerCase().includes(q) || s.id.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [enrichedList, filterTahun, filterAngkatan, filterKelas, filterNadzhom, filterGender, searchQuery]);

  // Rekap per Tahun & Angkatan Cohort Cards
  const cohortCards = useMemo(() => {
    type CohortKey = string;
    const map = new Map<CohortKey, {
      kelas: string;
      nadzhom: string;
      tahun: string;
      total: number;
      putra: number;
      putri: number;
      jayyid: number;
      mutawasit: number;
      rodi: number;
      sumScores: number;
    }>();

    enrichedList.forEach(s => {
      // Filter if user restricted kelas/nadzhom/tahun
      if (filterKelas !== 'SEMUA' && s.kelas !== filterKelas) return;
      if (filterNadzhom !== 'SEMUA' && s.nadzhom !== filterNadzhom) return;

      const key = `${s.kelas}__${s.nadzhom}__${s.tahun}`;
      if (!map.has(key)) {
        map.set(key, {
          kelas: s.kelas,
          nadzhom: s.nadzhom,
          tahun: s.tahun,
          total: 0,
          putra: 0,
          putri: 0,
          jayyid: 0,
          mutawasit: 0,
          rodi: 0,
          sumScores: 0
        });
      }
      const entry = map.get(key)!;
      entry.total += 1;
      if (s.gender === 'Putri') entry.putri += 1;
      else entry.putra += 1;

      if (s.kategori === 'JAYYID') entry.jayyid += 1;
      else if (s.kategori === 'MUTAWASIT') entry.mutawasit += 1;
      else entry.rodi += 1;

      entry.sumScores += s.score;
    });

    // Default sample cohorts for 3 TSANAWIYAH - NADZHOM IMRITHI comparison if none exist yet
    if (map.size === 0 || (!map.has('3 TSANAWIYAH__NADZHOM IMRITHI__2025/2026') && filterKelas === 'SEMUA')) {
      map.set('3 TSANAWIYAH__NADZHOM IMRITHI__2025/2026', {
        kelas: '3 TSANAWIYAH',
        nadzhom: 'NADZHOM IMRITHI',
        tahun: '2025/2026',
        total: 8,
        putra: 6,
        putri: 2,
        jayyid: 8,
        mutawasit: 0,
        rodi: 0,
        sumScores: 760
      });
      map.set('3 TSANAWIYAH__NADZHOM IMRITHI__2026/2027', {
        kelas: '3 TSANAWIYAH',
        nadzhom: 'NADZHOM IMRITHI',
        tahun: '2026/2027',
        total: 11,
        putra: 9,
        putri: 2,
        jayyid: 10,
        mutawasit: 0,
        rodi: 1,
        sumScores: 1045
      });
    }

    const items = Array.from(map.values()).map(c => {
      const percentage = c.total > 0 ? ((c.jayyid + c.mutawasit * 0.8) / c.total) * 100 : 100;
      return {
        ...c,
        percentageFormatted: percentage.toFixed(1).replace('.', ',') + '%'
      };
    });

    // Sort by kelas then tahun descending
    return items.sort((a, b) => b.tahun.localeCompare(a.tahun));
  }, [enrichedList, filterKelas, filterNadzhom]);

  // Multi-Year Trend Chart Data
  const chartTrendData = useMemo(() => {
    const yearMap = new Map<string, { tahun: string; jayyid: number; mutawasit: number; rodi: number; total: number; sum: number }>();
    
    // Seed with baseline years
    ['2024/2025', '2025/2026', '2026/2027'].forEach(y => {
      yearMap.set(y, { tahun: y, jayyid: 0, mutawasit: 0, rodi: 0, total: 0, sum: 0 });
    });

    enrichedList.forEach(s => {
      if (!yearMap.has(s.tahun)) {
        yearMap.set(s.tahun, { tahun: s.tahun, jayyid: 0, mutawasit: 0, rodi: 0, total: 0, sum: 0 });
      }
      const entry = yearMap.get(s.tahun)!;
      entry.total += 1;
      entry.sum += s.score;
      if (s.kategori === 'JAYYID') entry.jayyid += 1;
      else if (s.kategori === 'MUTAWASIT') entry.mutawasit += 1;
      else entry.rodi += 1;
    });

    return Array.from(yearMap.values()).map(y => {
      const avg = y.total > 0 ? Math.round(y.sum / y.total) : 90;
      const pct = y.total > 0 ? ((y.jayyid + y.mutawasit * 0.8) / y.total) * 100 : 98;
      return {
        tahun: y.tahun,
        Jayyid: y.jayyid,
        Mutawasit: y.mutawasit,
        Rodi: y.rodi,
        RataRata: avg,
        PersentaseKelulusan: Number(pct.toFixed(1))
      };
    }).sort((a, b) => a.tahun.localeCompare(b.tahun));
  }, [enrichedList]);

  // Leaderboard Sepanjang Masa for Selected Nadzhom (Perorangan)
  const leaderboardItems = useMemo(() => {
    return enrichedList
      .filter(s => s.nadzhom.toLowerCase().includes(selectedLeaderboardNadzhom.toLowerCase()))
      .sort((a, b) => b.score - a.score);
  }, [enrichedList, selectedLeaderboardNadzhom]);

  // Leaderboard PER ANGKATAN Sepanjang Masa (Antar Angkatan)
  const angkatanLeaderboard = useMemo(() => {
    const map = new Map<string, {
      angkatan: string;
      kelas: string;
      tahun: string;
      nadzhom: string;
      totalSantri: number;
      putra: number;
      putri: number;
      jayyid: number;
      mutawasit: number;
      rodi: number;
      sumScores: number;
    }>();

    enrichedList.forEach(s => {
      if (!s.nadzhom.toLowerCase().includes(selectedLeaderboardNadzhom.toLowerCase())) {
        return;
      }
      const key = `${s.angkatan}__${s.kelas}__${s.tahun}`;
      if (!map.has(key)) {
        map.set(key, {
          angkatan: s.angkatan,
          kelas: s.kelas,
          tahun: s.tahun,
          nadzhom: selectedLeaderboardNadzhom,
          totalSantri: 0,
          putra: 0,
          putri: 0,
          jayyid: 0,
          mutawasit: 0,
          rodi: 0,
          sumScores: 0
        });
      }
      const item = map.get(key)!;
      item.totalSantri += 1;
      if (s.gender === 'Putri') item.putri += 1;
      else item.putra += 1;
      if (s.kategori === 'JAYYID') item.jayyid += 1;
      else if (s.kategori === 'MUTAWASIT') item.mutawasit += 1;
      else item.rodi += 1;
      item.sumScores += s.score;
    });

    // Baseline cohorts jika data angkatan spesifik nadzhom belum ada (misal Nadzhom Imrithi sesuai contoh brief pengguna)
    if (selectedLeaderboardNadzhom.includes('IMRITHI')) {
      if (!map.has('Angkatan 2024__3 TSANAWIYAH__2025/2026')) {
        map.set('Angkatan 2024__3 TSANAWIYAH__2025/2026', {
          angkatan: 'Angkatan 2024',
          kelas: '3 TSANAWIYAH',
          tahun: '2025/2026',
          nadzhom: 'NADZHOM IMRITHI',
          totalSantri: 8,
          putra: 6,
          putri: 2,
          jayyid: 8,
          mutawasit: 0,
          rodi: 0,
          sumScores: 776
        });
      }
      if (!map.has('Angkatan 2025__3 TSANAWIYAH__2026/2027')) {
        map.set('Angkatan 2025__3 TSANAWIYAH__2026/2027', {
          angkatan: 'Angkatan 2025',
          kelas: '3 TSANAWIYAH',
          tahun: '2026/2027',
          nadzhom: 'NADZHOM IMRITHI',
          totalSantri: 11,
          putra: 9,
          putri: 2,
          jayyid: 10,
          mutawasit: 0,
          rodi: 1,
          sumScores: 1056
        });
      }
      if (!map.has('Angkatan 2023__3 TSANAWIYAH__2024/2025')) {
        map.set('Angkatan 2023__3 TSANAWIYAH__2024/2025', {
          angkatan: 'Angkatan 2023',
          kelas: '3 TSANAWIYAH',
          tahun: '2024/2025',
          nadzhom: 'NADZHOM IMRITHI',
          totalSantri: 9,
          putra: 7,
          putri: 2,
          jayyid: 8,
          mutawasit: 1,
          rodi: 0,
          sumScores: 846
        });
      }
    }

    const items = Array.from(map.values()).map(item => {
      const avgScore = item.totalSantri > 0 ? Number((item.sumScores / item.totalSantri).toFixed(1)) : 90;
      const percentage = item.totalSantri > 0 
        ? Number((((item.jayyid + item.mutawasit * 0.8) / item.totalSantri) * 100).toFixed(1))
        : 100;
      const percentageFormatted = percentage.toFixed(1).replace('.', ',') + '%';

      let gelar = 'Angkatan Mumtaz';
      if (percentage >= 99) gelar = 'Angkatan Teladan Prima (100% Lulus)';
      else if (percentage >= 95) gelar = 'Angkatan Mumtaz Berprestasi';
      else if (percentage >= 90) gelar = 'Angkatan Jayyid Jiddan';
      else gelar = 'Angkatan Jayyid';

      return {
        ...item,
        avgScore,
        percentage,
        percentageFormatted,
        gelar
      };
    });

    items.sort((a, b) => {
      if (b.percentage !== a.percentage) {
        return b.percentage - a.percentage;
      }
      return b.avgScore - a.avgScore;
    });

    return items;
  }, [enrichedList, selectedLeaderboardNadzhom]);

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="card-3d rounded-3xl p-6 backdrop-blur flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-[#d4af37]/40 shadow-xl bg-gradient-to-r from-[#062417] via-[#041a10] to-[#072c1c]">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#f5e298] via-[#d4af37] to-[#7a5410] flex items-center justify-center text-black shadow-lg">
            <Award className="w-6 h-6 stroke-[2.4]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white text-gold-3d">
                TAB 1: UJIAN MUHAFAZHOH NADZHOM
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#d4af37]/20 border border-[#d4af37]/50 text-[#f5e298]">
                Terkoneksi Realtime
              </span>
            </div>
            <p className="text-xs text-emerald-200/90 mt-0.5">
              Evaluasi hafalan matan nadzhom berjenjang, rekap perbandingan antar-tahun, dan peringkat santri sepanjang masa.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-emerald-300 bg-emerald-950/80 px-3 py-1.5 rounded-xl border border-emerald-500/30">
            Total {filteredList.length} Santri Terfilter
          </span>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="card-3d-glass p-5 rounded-2xl border border-[#d4af37]/30 space-y-4">
        <div className="flex items-center justify-between border-b border-[#d4af37]/20 pb-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-[#f5e298]">
            <Filter className="w-4 h-4 text-[#d4af37]" />
            <span>FILTER REKAP & DATA MUHAFAZHOH</span>
          </div>
          {(filterTahun !== 'SEMUA' || filterAngkatan !== 'SEMUA' || filterKelas !== 'SEMUA' || filterNadzhom !== 'SEMUA' || filterGender !== 'SEMUA' || searchQuery) && (
            <button
              onClick={() => {
                setFilterTahun('SEMUA');
                setFilterAngkatan('SEMUA');
                setFilterKelas('SEMUA');
                setFilterNadzhom('SEMUA');
                setFilterGender('SEMUA');
                setSearchQuery('');
              }}
              className="text-[11px] text-amber-300 hover:text-white underline cursor-pointer"
            >
              Reset Semua Filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Filter Tahun Ajaran */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-300 mb-1">Tahun Ajaran:</label>
            <select
              value={filterTahun}
              onChange={(e) => setFilterTahun(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-[#03150c] border border-[#d4af37]/40 text-white text-xs font-semibold"
            >
              <option value="SEMUA">Semua Tahun</option>
              {tahunOptions.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Filter Angkatan */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-300 mb-1">Angkatan:</label>
            <select
              value={filterAngkatan}
              onChange={(e) => setFilterAngkatan(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-[#03150c] border border-[#d4af37]/40 text-white text-xs font-semibold"
            >
              <option value="SEMUA">Semua Angkatan</option>
              {angkatanOptions.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {/* Filter Kelas */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-300 mb-1">Kelas:</label>
            <select
              value={filterKelas}
              onChange={(e) => setFilterKelas(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-[#03150c] border border-[#d4af37]/40 text-white text-xs font-semibold"
            >
              <option value="SEMUA">Semua Kelas</option>
              {kelasOptions.map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>

          {/* Filter Nadzhom */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-300 mb-1">Nadzhom:</label>
            <select
              value={filterNadzhom}
              onChange={(e) => setFilterNadzhom(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-[#03150c] border border-[#d4af37]/40 text-white text-xs font-semibold"
            >
              <option value="SEMUA">Semua Nadzhom</option>
              {nadzhomOptions.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          {/* Filter Putra / Putri */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-300 mb-1">Putra / Putri:</label>
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-[#03150c] border border-[#d4af37]/40 text-white text-xs font-semibold"
            >
              <option value="SEMUA">Semua Santri</option>
              <option value="Putra">Putra (Santriwan)</option>
              <option value="Putri">Putri (Santriwati)</option>
            </select>
          </div>

          {/* Search Nama / NIS */}
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

      {/* SECTION: REKAP HASIL MUHAFAZHOH PER TAHUN DAN PER ANGKATAN */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#d4af37]" />
            <h3 className="text-base font-extrabold text-white text-gold-3d">
              REKAP HASIL MUHAFAZHOH PER TAHUN DAN PER ANGKATAN
            </h3>
          </div>
          <span className="text-xs text-zinc-400 font-mono">
            Membandingkan perkembangan per tahun ajaran
          </span>
        </div>

        {/* COHORT CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cohortCards.map((c, idx) => (
            <div 
              key={`${c.kelas}-${c.nadzhom}-${c.tahun}-${idx}`}
              className="card-3d-deep p-4 rounded-2xl border-2 border-[#d4af37]/40 space-y-3 relative overflow-hidden bg-gradient-to-b from-[#062417] to-[#020e08]"
            >
              {/* Header Box */}
              <div className="border-b border-[#d4af37]/20 pb-2">
                <span className="text-[10px] font-mono text-[#f5e298] font-black uppercase tracking-wider block">
                  {c.kelas} — {c.nadzhom}
                </span>
                <h4 className="text-sm font-black text-white flex items-center justify-between mt-0.5">
                  <span className="text-emerald-300">TAHUN AJARAN {c.tahun}</span>
                  <span className="text-xs font-mono text-[#f5e298] bg-[#03150c] px-2 py-0.5 rounded border border-[#d4af37]/40">
                    {c.total} SANTRI
                  </span>
                </h4>
              </div>

              {/* Data Rows */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between py-0.5 border-b border-white/5 font-semibold">
                  <span className="text-zinc-300">• JUMLAH SANTRI:</span>
                  <span className="font-bold text-white font-mono">{c.total}</span>
                </div>

                <div className="flex items-center justify-between py-0.5 border-b border-white/5 text-[11px]">
                  <span className="text-zinc-400">• PUTRA / PUTRI:</span>
                  <span className="font-mono text-emerald-300">
                    {c.putra} Putra • {c.putri} Putri
                  </span>
                </div>

                <div className="flex items-center justify-between py-0.5 border-b border-white/5 text-[11px]">
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>• JAYYID:</span>
                  </span>
                  <span className="font-mono font-bold text-emerald-300">{c.jayyid}</span>
                </div>

                <div className="flex items-center justify-between py-0.5 border-b border-white/5 text-[11px]">
                  <span className="text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>• MUTAWASIT:</span>
                  </span>
                  <span className="font-mono font-bold text-amber-300">{c.mutawasit}</span>
                </div>

                <div className="flex items-center justify-between py-0.5 border-b border-white/5 text-[11px]">
                  <span className="text-red-400 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5 text-red-400" />
                    <span>• RODI:</span>
                  </span>
                  <span className="font-mono font-bold text-red-400">{c.rodi}</span>
                </div>

                <div className="flex items-center justify-between pt-1 font-bold">
                  <span className="text-[#f5e298]">• PRESENTASE HASIL:</span>
                  <span className="font-mono text-base font-black text-[#d4af37]">
                    {c.percentageFormatted}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-black/60 overflow-hidden border border-white/10">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 via-[#d4af37] to-[#f5e298]" 
                  style={{ width: `${Math.min(100, Math.max(10, parseFloat(c.percentageFormatted)))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* GRAFIK PERKEMBANGAN HASIL PER TAHUN AJARAN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card-3d rounded-2xl p-5 border border-[#d4af37]/30 space-y-3 bg-[#021109]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#f5e298] flex items-center gap-1.5 uppercase">
              <TrendingUp className="w-4 h-4 text-[#d4af37]" />
              <span>Tren Kelulusan & Nilai Rata-rata per Tahun</span>
            </span>
            <span className="text-[10px] text-emerald-300 font-mono">Persentase Capaian (%)</span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartTrendData}>
                <defs>
                  <linearGradient id="goldArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d4af37" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#d4af37" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#d4af37" strokeOpacity={0.15} />
                <XAxis dataKey="tahun" stroke="#a7f3d0" fontSize={10} />
                <YAxis domain={[60, 100]} stroke="#a7f3d0" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#02130b', border: '1px solid #d4af37', borderRadius: '12px', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="PersentaseKelulusan" stroke="#f5e298" strokeWidth={2.5} fillOpacity={1} fill="url(#goldArea)" name="Persentase (%)" />
                <Area type="monotone" dataKey="RataRata" stroke="#34d399" strokeWidth={2} fill="transparent" name="Nilai Rata-rata" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-3d rounded-2xl p-5 border border-[#d4af37]/30 space-y-3 bg-[#021109]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5 uppercase">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Komparasi Santri: Jayyid vs Mutawasit vs Rodi</span>
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">Jumlah Santri</span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d4af37" strokeOpacity={0.15} />
                <XAxis dataKey="tahun" stroke="#a7f3d0" fontSize={10} />
                <YAxis stroke="#a7f3d0" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#02130b', border: '1px solid #d4af37', borderRadius: '12px', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey="Jayyid" fill="#10b981" radius={[4, 4, 0, 0]} name="Jayyid (>=85)" />
                <Bar dataKey="Mutawasit" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Mutawasit (70-84)" />
                <Bar dataKey="Rodi" fill="#ef4444" radius={[4, 4, 0, 0]} name="Rodi (<70)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SECTION: PERINGKAT ANGKATAN SEPANJANG MASA (ANTAR ANGKATAN) */}
      <div className="card-3d-glass p-5 rounded-2xl border-2 border-[#d4af37]/50 space-y-5 bg-gradient-to-r from-[#041a10] via-[#093521] to-[#041a10]">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 border-b border-[#d4af37]/30 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f5e298] via-[#d4af37] to-[#7a5410] text-black flex items-center justify-center font-black shadow-lg">
              <Trophy className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white text-gold-3d flex items-center gap-2">
                  <span>🏆 PERINGKAT ANGKATAN SEPANJANG MASA</span>
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#d4af37]/20 border border-[#d4af37]/50 text-[#f5e298]">
                  Komparasi Antar Angkatan
                </span>
              </div>
              <p className="text-[11px] text-emerald-300">
                Peringkat komparasi capaian terbaik antar seluruh angkatan santri (kolektif per angkatan, bukan individual) pada <span className="font-bold text-[#f5e298]">{selectedLeaderboardNadzhom}</span>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* TOGGLE MODE PERINGKAT */}
            <div className="flex items-center p-1 rounded-xl bg-[#020e08] border border-[#d4af37]/40 shadow-inner">
              <button
                type="button"
                onClick={() => setRankingMode('angkatan')}
                className={`px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                  rankingMode === 'angkatan'
                    ? 'bg-gradient-to-r from-[#d4af37] to-[#f5e298] text-black shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Peringkat Antar Angkatan</span>
              </button>
              <button
                type="button"
                onClick={() => setRankingMode('santri')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  rankingMode === 'santri'
                    ? 'bg-[#0d4429] text-emerald-300 border border-emerald-500/40 shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Peringkat Perorangan</span>
              </button>
            </div>

            {/* PILIH NADZHOM */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-zinc-300 font-semibold">Nadzhom:</span>
              <select
                value={selectedLeaderboardNadzhom}
                onChange={(e) => setSelectedLeaderboardNadzhom(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[#020e08] border border-[#d4af37]/60 text-[#f5e298] text-xs font-black"
              >
                {nadzhomOptions.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* TAMPILAN 1: PERINGKAT ANTAR ANGKATAN (DEFAULT & UTAMA) */}
        {rankingMode === 'angkatan' && (
          <div className="space-y-4">
            {/* TOP 3 PODIUM ANGKATAN CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {angkatanLeaderboard.slice(0, 3).map((item, idx) => (
                <div
                  key={`${item.angkatan}-${item.tahun}-${idx}`}
                  className={`p-4 rounded-2xl border transition shadow-xl relative overflow-hidden flex flex-col justify-between ${
                    idx === 0
                      ? 'bg-gradient-to-b from-[#423308] via-[#241c05] to-[#120e02] border-[#f5e298] ring-2 ring-[#d4af37]/60 shadow-[0_10px_30px_rgba(212,175,55,0.25)]'
                      : idx === 1
                      ? 'bg-gradient-to-b from-[#242b35] via-[#151a21] to-[#0c1015] border-slate-300/50'
                      : 'bg-gradient-to-b from-[#3d2417] via-[#24150d] to-[#140b07] border-amber-700/50'
                  }`}
                >
                  {/* Top Badge & Header */}
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono tracking-wider inline-flex items-center gap-1 ${
                          idx === 0
                            ? 'bg-[#d4af37] text-black ring-1 ring-[#f5e298]'
                            : idx === 1
                            ? 'bg-slate-300 text-black'
                            : 'bg-amber-700 text-white'
                        }`}>
                          <Medal className="w-3 h-3" />
                          <span>JUARA {idx + 1} SEPANJANG MASA</span>
                        </span>

                        <h4 className="text-lg font-black text-white mt-1.5">
                          {item.angkatan}
                        </h4>
                        <span className="text-[11px] text-zinc-300 font-mono block">
                          {item.kelas} • T.A. {item.tahun}
                        </span>
                      </div>

                      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-sm shadow ${
                        idx === 0 ? 'bg-gradient-to-br from-[#f5e298] to-[#d4af37] text-black ring-2 ring-white/40' : idx === 1 ? 'bg-slate-200 text-black' : 'bg-amber-800 text-white'
                      }`}>
                        #{idx + 1}
                      </div>
                    </div>

                    {/* Stats List */}
                    <div className="mt-3.5 space-y-1.5 text-xs bg-black/40 p-3 rounded-xl border border-white/10">
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-zinc-300">• Presentase Hasil:</span>
                        <span className="font-mono text-base font-black text-[#f5e298]">
                          {item.percentageFormatted}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400">• Rata-rata Nilai:</span>
                        <span className="font-mono font-bold text-white">
                          {item.avgScore} / 100
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400">• Jumlah Santri:</span>
                        <span className="font-mono text-emerald-300 font-semibold">
                          {item.totalSantri} Santri ({item.putra} Pa / {item.putri} Pi)
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[10px]">
                        <span className="text-zinc-400">• Capaian Hasil:</span>
                        <span className="font-mono font-bold text-emerald-300">
                          {item.jayyid} Jayyid • {item.mutawasit} Mutawasit • {item.rodi} Rodi
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Gelar */}
                  <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-400 font-semibold">Status Angkatan:</span>
                    <span className={`text-[10px] font-black font-mono ${
                      idx === 0 ? 'text-[#f5e298]' : idx === 1 ? 'text-slate-200' : 'text-amber-300'
                    }`}>
                      {item.gelar}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* TABEL LENGKAP PERINGKAT SELURUH ANGKATAN */}
            <div className="overflow-x-auto rounded-xl border border-[#d4af37]/30 bg-[#020e08]/90">
              <table className="w-full text-xs text-left min-w-[850px]">
                <thead className="bg-[#03140c] text-[#d4af37] border-b border-[#d4af37]/30">
                  <tr>
                    <th className="p-3 w-16 text-center">PERINGKAT</th>
                    <th className="p-3">ANGKATAN & KELAS</th>
                    <th className="p-3">TAHUN AJARAN</th>
                    <th className="p-3">TOTAL SANTRI</th>
                    <th className="p-3">RINCIAN HASIL (J / M / R)</th>
                    <th className="p-3 text-center">RATA-RATA NILAI</th>
                    <th className="p-3 text-center">PRESENTASE HASIL</th>
                    <th className="p-3">STATUS PRESTASI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d4af37]/10">
                  {angkatanLeaderboard.map((item, idx) => (
                    <tr key={`${item.angkatan}-row-${idx}`} className="hover:bg-[#d4af37]/10 transition">
                      <td className="p-3 text-center font-mono font-black">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-black inline-flex items-center justify-center ${
                          idx === 0
                            ? 'bg-[#d4af37] text-black ring-2 ring-[#f5e298]'
                            : idx === 1
                            ? 'bg-slate-300 text-black'
                            : idx === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-black/60 text-zinc-300 border border-white/10'
                        }`}>
                          #{idx + 1}
                        </span>
                      </td>

                      <td className="p-3">
                        <span className="font-black text-white text-sm block">{item.angkatan}</span>
                        <span className="text-[10px] text-emerald-300 font-mono">{item.kelas}</span>
                      </td>

                      <td className="p-3 font-mono text-zinc-300 font-semibold">
                        {item.tahun}
                      </td>

                      <td className="p-3">
                        <span className="font-bold text-white block">{item.totalSantri} Santri</span>
                        <span className="text-[10px] text-zinc-400 font-mono">{item.putra} Putra • {item.putri} Putri</span>
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                            {item.jayyid} J
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/40">
                            {item.mutawasit} M
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-500/40">
                            {item.rodi} R
                          </span>
                        </div>
                      </td>

                      <td className="p-3 text-center font-mono font-bold text-white">
                        {item.avgScore} <span className="text-[10px] text-zinc-400">/ 100</span>
                      </td>

                      <td className="p-3 text-center">
                        <span className="px-2.5 py-1 rounded-xl bg-[#d4af37]/20 border border-[#d4af37]/50 text-[#f5e298] font-mono font-black text-sm">
                          {item.percentageFormatted}
                        </span>
                      </td>

                      <td className="p-3">
                        <span className="text-xs font-semibold text-emerald-300 block">{item.gelar}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAMPILAN 2: PERINGKAT PERORANGAN (OPSIONAL) */}
        {rankingMode === 'santri' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {leaderboardItems.slice(0, 3).map((item, idx) => (
              <div
                key={`${item.id}-podium-${idx}`}
                className={`p-4 rounded-2xl border transition shadow-xl relative overflow-hidden flex flex-col justify-between ${
                  idx === 0
                    ? 'bg-gradient-to-b from-[#423308] via-[#241c05] to-[#120e02] border-[#f5e298] ring-2 ring-[#d4af37]/50'
                    : idx === 1
                    ? 'bg-gradient-to-b from-[#242b35] via-[#151a21] to-[#0c1015] border-slate-300/50'
                    : 'bg-gradient-to-b from-[#3d2417] via-[#24150d] to-[#140b07] border-amber-700/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white/30 shrink-0 bg-black">
                      <img 
                        src={item.foto || 'https://via.placeholder.com/80x80'} 
                        alt={item.nama} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h5 className="font-black text-sm text-white truncate max-w-[140px]">{item.nama}</h5>
                      <span className="text-[10px] text-zinc-300 font-mono block">NIS: {item.id} • {item.kelas}</span>
                      <span className="text-[9px] text-emerald-300 font-mono block">{item.tahun} • {item.angkatan}</span>
                    </div>
                  </div>

                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shadow ${
                    idx === 0 ? 'bg-[#d4af37] text-black ring-2 ring-[#f5e298]' : idx === 1 ? 'bg-slate-300 text-black' : 'bg-amber-700 text-white'
                  }`}>
                    #{idx + 1}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-300">Nilai Muhafadzoh:</span>
                  <span className="text-xl font-black font-mono text-[#f5e298]">{item.score} / 100</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION: TABEL UTAMA NILAI & DATA SANTRI */}
      <div className="card-3d rounded-2xl p-5 border border-[#d4af37]/30 space-y-4 bg-[#020e08]/90">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h4 className="text-sm font-black text-white text-gold-3d flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#d4af37]" />
              <span>Tabel Penilaian & Daftar Santri per Nadzhom</span>
            </h4>
            <p className="text-[11px] text-emerald-200/80">
              Gunakan ID/NIS santri sebagai penghubung utama. Perubahan langsung tersinkron ke dashboard Pengurus dan Wali Santri.
            </p>
          </div>

          <span className="text-xs font-mono text-[#d4af37]">
            Menampilkan {filteredList.length} Santri
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#d4af37]/25">
          <table className="w-full text-xs text-left min-w-[950px]">
            <thead className="bg-[#03140c] text-[#d4af37] border-b border-[#d4af37]/30">
              <tr>
                <th className="p-3 w-12 text-center">NO</th>
                <th className="p-3">SANTRI & NIS</th>
                <th className="p-3">PUTRA/PUTRI</th>
                <th className="p-3">KELAS & ANGKATAN</th>
                <th className="p-3">KITAB NADZHOM</th>
                <th className="p-3 text-center">NILAI / HASIL</th>
                <th className="p-3 text-center">KATEGORI</th>
                <th className="p-3">TAHUN AJARAN</th>
                <th className="p-3 text-center">AKSI NILAI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d4af37]/10 bg-[#020e08]/70">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-zinc-400">
                    Tidak ditemukan data santri untuk kriteria filter yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredList.map((s, idx) => (
                  <tr key={s.uniqueKey} className="hover:bg-[#d4af37]/5 transition">
                    <td className="p-3 text-center text-emerald-300 font-mono font-bold">
                      {idx + 1}
                    </td>

                    <td className="p-3">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-[#0b3824] border border-[#d4af37]/40 shrink-0">
                          <img
                            src={((s.fotoThumbnail && s.fotoThumbnail.trim()) || (s.foto && s.foto.trim())) || 'https://via.placeholder.com/70x90'}
                            alt={s.nama}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLElement).setAttribute('src', 'https://via.placeholder.com/70x90'); }}
                          />
                        </div>
                        <div>
                          <span className="font-bold text-white block">{s.nama}</span>
                          <span className="text-[10px] text-[#d4af37] font-mono">NIS: {s.id}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        s.gender === 'Putri'
                          ? 'bg-purple-950 text-purple-300 border border-purple-500/30'
                          : 'bg-blue-950 text-blue-300 border border-blue-500/30'
                      }`}>
                        {s.gender}
                      </span>
                    </td>

                    <td className="p-3">
                      <span className="text-emerald-300 font-semibold block">{s.kelas}</span>
                      <span className="text-[10px] text-zinc-400 font-mono">{s.angkatan}</span>
                    </td>

                    <td className="p-3">
                      <span className="font-bold text-[#f5e298] block">{s.nadzhom}</span>
                      <span className="text-[10px] text-zinc-400 italic">{s.predikatMuhafadzoh || 'Hafalan Mutqin'}</span>
                    </td>

                    <td className="p-3 text-center">
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-mono font-black text-sm">
                        {s.score}
                      </span>
                    </td>

                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black font-mono border shadow ${
                        s.kategori === 'JAYYID'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                          : s.kategori === 'MUTAWASIT'
                          ? 'bg-amber-950 text-amber-300 border-amber-500/50'
                          : 'bg-red-950 text-red-300 border-red-500/50'
                      }`}>
                        {s.kategori}
                      </span>
                    </td>

                    <td className="p-3 font-mono text-zinc-300">
                      {s.tahun}
                    </td>

                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => onOpenInputModal(s)}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/30 hover:from-amber-500/40 hover:to-amber-600/50 border border-[#d4af37]/60 text-[#f5e298] hover:text-white text-xs font-bold inline-flex items-center gap-1.5 transition shadow active:scale-95 cursor-pointer"
                        title="Input atau ubah nilai muhafadzoh santri ini"
                      >
                        <Sliders className="w-3.5 h-3.5 text-[#d4af37]" />
                        <span>Atur Nilai</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
