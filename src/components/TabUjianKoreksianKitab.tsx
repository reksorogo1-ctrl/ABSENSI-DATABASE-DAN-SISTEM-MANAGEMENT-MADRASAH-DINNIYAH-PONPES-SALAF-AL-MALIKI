import React, { useState, useMemo } from 'react';
import { 
  CheckSquare, Trophy, TrendingUp, Users, Calendar, Filter, 
  Search, CheckCircle2, Sliders, Sparkles, BookMarked 
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  Tooltip, Legend, CartesianGrid 
} from 'recharts';
import { Santri } from '../types';
import { resolveSantriGender, resolveSantriTahunAjaran, resolveSantriAngkatan } from './TabUjianMuhafadzoh';

interface TabUjianKoreksianKitabProps {
  santriList: Santri[];
  onOpenInputModal: (santri: Santri) => void;
}

export const TabUjianKoreksianKitab: React.FC<TabUjianKoreksianKitabProps> = ({
  santriList,
  onOpenInputModal
}) => {
  const [filterTahun, setFilterTahun] = useState<string>('SEMUA');
  const [filterKelas, setFilterKelas] = useState<string>('SEMUA');
  const [filterKitab, setFilterKitab] = useState<string>('SEMUA');
  const [filterGender, setFilterGender] = useState<string>('SEMUA');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const enrichedList = useMemo(() => {
    return santriList.map((s, idx) => {
      const gender = resolveSantriGender(s);
      const tahun = resolveSantriTahunAjaran(s);
      const angkatan = resolveSantriAngkatan(s);
      const score = Number(s.nilaiKoreksianKitab ?? 90);
      const kitab = s.kitabKoreksian || 'Fathul Qorib Bab Sholat (Makna Gandul Pegon)';
      const predikat = s.predikatKoreksianKitab || (score >= 90 ? 'Mumtaz (Makna Gandul Sah & Lengkap)' : score >= 80 ? 'Jayyid Jiddan (Tertib & Lengkap)' : 'Jayyid (Cukup)');

      return {
        ...s,
        uniqueKey: `${s.id}-${idx}`,
        gender,
        tahun,
        angkatan,
        score,
        kitab,
        predikat
      };
    });
  }, [santriList]);

  const tahunOptions = useMemo(() => {
    const set = new Set<string>(['2026/2027', '2025/2026', '2024/2025']);
    enrichedList.forEach(e => set.add(e.tahun));
    return Array.from(set).sort().reverse();
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

  const kitabOptions = useMemo(() => {
    const set = new Set<string>([
      'Fathul Qorib Bab Sholat (Makna Gandul Pegon)',
      'Matan Al-Imrithi Pegon (Lengkap)',
      'Matan Al-Jurumiyah Pegon',
      'Alfiyah Ibnu Malik Makna Pegon',
      'Safinatun Naja Makna Gandul'
    ]);
    enrichedList.forEach(e => set.add(e.kitab));
    return Array.from(set);
  }, [enrichedList]);

  const filteredList = useMemo(() => {
    return enrichedList.filter(s => {
      if (filterTahun !== 'SEMUA' && s.tahun !== filterTahun) return false;
      if (filterKelas !== 'SEMUA' && s.kelas !== filterKelas) return false;
      if (filterKitab !== 'SEMUA' && s.kitab !== filterKitab) return false;
      if (filterGender !== 'SEMUA' && s.gender !== filterGender) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = s.nama.toLowerCase().includes(q) || s.id.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [enrichedList, filterTahun, filterKelas, filterKitab, filterGender, searchQuery]);

  const avgScore = useMemo(() => {
    if (filteredList.length === 0) return 0;
    const sum = filteredList.reduce((acc, s) => acc + s.score, 0);
    return (sum / filteredList.length).toFixed(1);
  }, [filteredList]);

  const classStats = useMemo(() => {
    const map = new Map<string, { kelas: string; sum: number; count: number }>();
    enrichedList.forEach(s => {
      if (!map.has(s.kelas)) {
        map.set(s.kelas, { kelas: s.kelas, sum: 0, count: 0 });
      }
      const entry = map.get(s.kelas)!;
      entry.sum += s.score;
      entry.count += 1;
    });
    return Array.from(map.values()).map(m => ({
      kelas: m.kelas.replace('TSANAWIYAH', 'TSN').replace('ALIYAH', 'ALY'),
      RataRata: m.count > 0 ? Math.round(m.sum / m.count) : 0,
      JumlahSantri: m.count
    }));
  }, [enrichedList]);

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="card-3d rounded-3xl p-6 backdrop-blur flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-amber-500/40 shadow-xl bg-gradient-to-r from-[#211504] via-[#150d02] to-[#2e1c05]">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-500 to-amber-800 flex items-center justify-center text-black shadow-lg">
            <CheckSquare className="w-6 h-6 stroke-[2.4]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white text-gold-3d">
                TAB 3: PEMERIKSAAN KOREKSIAN KITAB
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 border border-amber-500/50 text-[#f5e298]">
                Makna Gandul Pegon
              </span>
            </div>
            <p className="text-xs text-amber-200/90 mt-0.5">
              Pemeriksaan ketertiban mutaba'ah catatan makna gandul bahasa Jawa Pegon, kelengkapan tarkib, dan tanda korektor madrasah.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-amber-300 bg-amber-950/80 px-3 py-1.5 rounded-xl border border-amber-500/30">
            Total {filteredList.length} Santri Terdaftar
          </span>
        </div>
      </div>

      {/* QUICK STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-3d-glass p-4 rounded-2xl border border-amber-500/30 space-y-1">
          <span className="text-xs text-amber-300 font-bold block">Rata-rata Nilai Koreksian Kitab</span>
          <div className="text-2xl font-black text-white font-mono">{avgScore} <span className="text-xs text-zinc-400 font-sans">/ 100</span></div>
          <span className="text-[11px] text-zinc-400">Pemeriksaan sah dan lengkap</span>
        </div>

        <div className="card-3d-glass p-4 rounded-2xl border border-[#d4af37]/30 space-y-1">
          <span className="text-xs text-[#d4af37] font-bold block">Tingkat Ketertiban Makna Gandul</span>
          <div className="text-2xl font-black text-[#f5e298] font-mono">
            {filteredList.length > 0 ? Math.round((filteredList.filter(s => s.score >= 85).length / filteredList.length) * 100) : 100}%
          </div>
          <span className="text-[11px] text-zinc-400">Predikat Mumtaz & Jayyid Jiddan</span>
        </div>

        <div className="card-3d-glass p-4 rounded-2xl border border-emerald-500/30 space-y-1">
          <span className="text-xs text-emerald-300 font-bold block">Keterhubungan Data</span>
          <div className="text-2xl font-black text-emerald-300 font-mono">Tersinkron Otomatis</div>
          <span className="text-[11px] text-zinc-400">Terbaca di Wali Santri & Pengurus</span>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="card-3d-glass p-5 rounded-2xl border border-[#d4af37]/30 space-y-3">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#f5e298]">
            <Filter className="w-4 h-4 text-[#d4af37]" />
            <span>FILTER DATA KOREKSIAN KITAB</span>
          </div>
          {(filterTahun !== 'SEMUA' || filterKelas !== 'SEMUA' || filterKitab !== 'SEMUA' || filterGender !== 'SEMUA' || searchQuery) && (
            <button
              onClick={() => {
                setFilterTahun('SEMUA');
                setFilterKelas('SEMUA');
                setFilterKitab('SEMUA');
                setFilterGender('SEMUA');
                setSearchQuery('');
              }}
              className="text-[11px] text-amber-300 hover:text-white underline cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-zinc-300 mb-1">Tahun Ajaran:</label>
            <select
              value={filterTahun}
              onChange={(e) => setFilterTahun(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-[#03150c] border border-amber-500/40 text-white text-xs font-semibold"
            >
              <option value="SEMUA">Semua Tahun</option>
              {tahunOptions.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-300 mb-1">Kelas:</label>
            <select
              value={filterKelas}
              onChange={(e) => setFilterKelas(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-[#03150c] border border-amber-500/40 text-white text-xs font-semibold"
            >
              <option value="SEMUA">Semua Kelas</option>
              {kelasOptions.map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-300 mb-1">Kitab yang Dikoreksi:</label>
            <select
              value={filterKitab}
              onChange={(e) => setFilterKitab(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-[#03150c] border border-amber-500/40 text-white text-xs font-semibold"
            >
              <option value="SEMUA">Semua Kitab</option>
              {kitabOptions.map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-300 mb-1">Putra / Putri:</label>
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-[#03150c] border border-amber-500/40 text-white text-xs font-semibold"
            >
              <option value="SEMUA">Semua</option>
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
                className="w-full pl-8 pr-2.5 py-1.5 rounded-xl bg-[#03150c] border border-amber-500/40 text-white text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* GRAFIK RATA-RATA NILAI KOREKSIAN KITAB PER KELAS */}
      <div className="card-3d rounded-2xl p-5 border border-amber-500/30 space-y-3 bg-[#170e02]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span>Perbandingan Rata-rata Nilai Koreksian Kitab per Jenjang Kelas</span>
          </span>
          <span className="text-[10px] text-zinc-400 font-mono">Skala Nilai 0 - 100</span>
        </div>
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={classStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f59e0b" strokeOpacity={0.15} />
              <XAxis dataKey="kelas" stroke="#fde68a" fontSize={11} />
              <YAxis domain={[60, 100]} stroke="#fde68a" fontSize={11} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#170e02', border: '1px solid #f59e0b', borderRadius: '12px', fontSize: '11px' }}
              />
              <Bar dataKey="RataRata" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Rata-rata Nilai" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TABEL SANTRI KOREKSIAN KITAB */}
      <div className="card-3d rounded-2xl p-5 border border-[#d4af37]/30 space-y-4 bg-[#020e08]/90">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-black text-white text-gold-3d flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-amber-400" />
            <span>Daftar Nilai Koreksian Kitab Seluruh Santri</span>
          </h4>
          <span className="text-xs font-mono text-amber-300">
            {filteredList.length} Santri
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-amber-500/20">
          <table className="w-full text-xs text-left min-w-[950px]">
            <thead className="bg-[#1e1303] text-amber-200 border-b border-amber-500/30">
              <tr>
                <th className="p-3 w-12 text-center">NO</th>
                <th className="p-3">SANTRI & NIS</th>
                <th className="p-3">GENDER</th>
                <th className="p-3">KELAS</th>
                <th className="p-3">KITAB YANG DIKOREKSI</th>
                <th className="p-3 text-center">NILAI</th>
                <th className="p-3">PREDIKAT & KEABSAHAN</th>
                <th className="p-3">PENGOREKSI & TGL</th>
                <th className="p-3 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-[#020e08]/70">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-zinc-400">
                    Tidak ditemukan santri yang cocok dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((s, idx) => (
                  <tr key={s.uniqueKey} className="hover:bg-amber-950/20 transition">
                    <td className="p-3 text-center font-mono font-bold text-amber-300">
                      {idx + 1}
                    </td>

                    <td className="p-3">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-[#241703] border border-amber-400/40 shrink-0">
                          <img
                            src={((s.fotoThumbnail && s.fotoThumbnail.trim()) || (s.foto && s.foto.trim())) || 'https://via.placeholder.com/70x90'}
                            alt={s.nama}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLElement).setAttribute('src', 'https://via.placeholder.com/70x90'); }}
                          />
                        </div>
                        <div>
                          <span className="font-bold text-white block">{s.nama}</span>
                          <span className="text-[10px] text-amber-300 font-mono">NIS: {s.id}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        s.gender === 'Putri' ? 'bg-purple-950 text-purple-300' : 'bg-blue-950 text-blue-300'
                      }`}>
                        {s.gender}
                      </span>
                    </td>

                    <td className="p-3 text-emerald-300 font-medium">
                      {s.kelas}
                    </td>

                    <td className="p-3 font-semibold text-[#f5e298]">
                      {s.kitab}
                    </td>

                    <td className="p-3 text-center">
                      <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 font-mono font-black text-sm">
                        {s.score}
                      </span>
                    </td>

                    <td className="p-3">
                      <span className="font-bold text-white block">{s.predikat}</span>
                      <span className="text-[10px] text-emerald-300 italic block">Makna Gandul Sah & Lengkap</span>
                    </td>

                    <td className="p-3">
                      <span className="text-zinc-200 block">{s.ustadzPengujiKitab || 'Ust. M. Ilyas'}</span>
                      <span className="text-[10px] text-zinc-400 font-mono">{s.tanggalUjianKitab || '2026-09-20'}</span>
                    </td>

                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => onOpenInputModal(s)}
                        className="px-3 py-1.5 rounded-xl bg-amber-900/60 hover:bg-amber-800 border border-amber-500/50 text-amber-200 hover:text-white text-xs font-bold inline-flex items-center gap-1.5 transition shadow active:scale-95 cursor-pointer"
                      >
                        <Sliders className="w-3.5 h-3.5 text-amber-300" />
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
