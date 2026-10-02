import React, { useState, useMemo } from 'react';
import { 
  BookOpen, Trophy, TrendingUp, Users, Calendar, Filter, 
  Search, CheckCircle2, Sliders, Sparkles 
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  Tooltip, Legend, CartesianGrid 
} from 'recharts';
import { Santri } from '../types';
import { resolveSantriGender, resolveSantriTahunAjaran, resolveSantriAngkatan } from './TabUjianMuhafadzoh';

interface TabUjianBacaKitabProps {
  santriList: Santri[];
  onOpenInputModal: (santri: Santri) => void;
}

export const TabUjianBacaKitab: React.FC<TabUjianBacaKitabProps> = ({
  santriList,
  onOpenInputModal
}) => {
  const [filterTahun, setFilterTahun] = useState<string>('SEMUA');
  const [filterAngkatan, setFilterAngkatan] = useState<string>('SEMUA');
  const [filterKelas, setFilterKelas] = useState<string>('SEMUA');
  const [filterKitab, setFilterKitab] = useState<string>('SEMUA');
  const [filterGender, setFilterGender] = useState<string>('SEMUA');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const enrichedList = useMemo(() => {
    return santriList.map((s, idx) => {
      const gender = resolveSantriGender(s);
      const tahun = resolveSantriTahunAjaran(s);
      const angkatan = resolveSantriAngkatan(s);
      const score = Number(s.nilaiBacaKitab ?? 88);
      const kitab = s.kitabBaca || 'Fathul Qorib (Bab Sholat & Thoharoh)';
      const predikat = s.predikatBacaKitab || (score >= 90 ? 'Mumtaz (Fashih & Paham Tarkib)' : score >= 80 ? 'Jayyid Jiddan (Lancar & Fashih)' : 'Jayyid (Cukup)');

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
      'Fathul Qorib (Bab Sholat & Thoharoh)',
      'Fathul Qorib (Bab Muamalah & Nikah)',
      'Fathul Mu\'in (Syarah Qurratil Ain)',
      'Safinatun Naja (Fiqih Dasar)',
      'Matan Al-Ghayah wat Taqrib (Abu Syuja\')'
    ]);
    enrichedList.forEach(e => set.add(e.kitab));
    return Array.from(set);
  }, [enrichedList]);

  const filteredList = useMemo(() => {
    return enrichedList.filter(s => {
      if (filterTahun !== 'SEMUA' && s.tahun !== filterTahun) return false;
      if (filterAngkatan !== 'SEMUA' && s.angkatan !== filterAngkatan) return false;
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
  }, [enrichedList, filterTahun, filterAngkatan, filterKelas, filterKitab, filterGender, searchQuery]);

  const avgScore = useMemo(() => {
    if (filteredList.length === 0) return 0;
    const sum = filteredList.reduce((acc, s) => acc + s.score, 0);
    return (sum / filteredList.length).toFixed(1);
  }, [filteredList]);

  // Chart data per kelas
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
      <div className="card-3d rounded-3xl p-6 backdrop-blur flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-blue-500/40 shadow-xl bg-gradient-to-r from-[#041624] via-[#02131d] to-[#052338]">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-300 via-blue-500 to-blue-800 flex items-center justify-center text-white shadow-lg">
            <BookOpen className="w-6 h-6 stroke-[2.4]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white text-gold-3d">
                TAB 2: UJIAN BACA KITAB (QIRA'ATUL KUTUB)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 border border-blue-500/50 text-blue-300">
                Terkoneksi Realtime
              </span>
            </div>
            <p className="text-xs text-blue-200/90 mt-0.5">
              Penilaian kefasihan membaca matan & syarah kitab kuning, penguasaan tarkib, i'rob, dan pemahaman makna.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-blue-300 bg-blue-950/80 px-3 py-1.5 rounded-xl border border-blue-500/30">
            Total {filteredList.length} Santri Terdaftar
          </span>
        </div>
      </div>

      {/* QUICK STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-3d-glass p-4 rounded-2xl border border-blue-500/30 space-y-1">
          <span className="text-xs text-blue-300 font-bold block">Rata-rata Nilai Baca Kitab</span>
          <div className="text-2xl font-black text-white font-mono">{avgScore} <span className="text-xs text-zinc-400 font-sans">/ 100</span></div>
          <span className="text-[11px] text-zinc-400">Berdasarkan {filteredList.length} santri aktif</span>
        </div>

        <div className="card-3d-glass p-4 rounded-2xl border border-[#d4af37]/30 space-y-1">
          <span className="text-xs text-[#d4af37] font-bold block">Tingkat Kefasihan (Mumtaz & Jayyid)</span>
          <div className="text-2xl font-black text-[#f5e298] font-mono">
            {filteredList.length > 0 ? Math.round((filteredList.filter(s => s.score >= 80).length / filteredList.length) * 100) : 100}%
          </div>
          <span className="text-[11px] text-zinc-400">Santri dengan nilai di atas 80</span>
        </div>

        <div className="card-3d-glass p-4 rounded-2xl border border-emerald-500/30 space-y-1">
          <span className="text-xs text-emerald-300 font-bold block">Sinkronisasi Wali & Pengurus</span>
          <div className="text-2xl font-black text-emerald-300 font-mono">100% Aktif</div>
          <span className="text-[11px] text-zinc-400">ID/NIS Santri sebagai kunci utama</span>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="card-3d-glass p-5 rounded-2xl border border-[#d4af37]/30 space-y-3">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#f5e298]">
            <Filter className="w-4 h-4 text-[#d4af37]" />
            <span>FILTER DATA BACA KITAB</span>
          </div>
          {(filterTahun !== 'SEMUA' || filterKelas !== 'SEMUA' || filterKitab !== 'SEMUA' || filterGender !== 'SEMUA' || searchQuery) && (
            <button
              onClick={() => {
                setFilterTahun('SEMUA');
                setFilterAngkatan('SEMUA');
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
              className="w-full px-2.5 py-1.5 rounded-xl bg-[#03150c] border border-blue-500/40 text-white text-xs font-semibold"
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
              className="w-full px-2.5 py-1.5 rounded-xl bg-[#03150c] border border-blue-500/40 text-white text-xs font-semibold"
            >
              <option value="SEMUA">Semua Kelas</option>
              {kelasOptions.map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-300 mb-1">Kitab yang Dibaca:</label>
            <select
              value={filterKitab}
              onChange={(e) => setFilterKitab(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-[#03150c] border border-blue-500/40 text-white text-xs font-semibold"
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
              className="w-full px-2.5 py-1.5 rounded-xl bg-[#03150c] border border-blue-500/40 text-white text-xs font-semibold"
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
                className="w-full pl-8 pr-2.5 py-1.5 rounded-xl bg-[#03150c] border border-blue-500/40 text-white text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* GRAFIK RATA-RATA NILAI BACA KITAB PER KELAS */}
      <div className="card-3d rounded-2xl p-5 border border-blue-500/30 space-y-3 bg-[#020e17]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5 uppercase">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <span>Perbandingan Rata-rata Nilai Baca Kitab per Jenjang Kelas</span>
          </span>
          <span className="text-[10px] text-zinc-400 font-mono">Skala Nilai 0 - 100</span>
        </div>
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={classStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3b82f6" strokeOpacity={0.15} />
              <XAxis dataKey="kelas" stroke="#93c5fd" fontSize={11} />
              <YAxis domain={[60, 100]} stroke="#93c5fd" fontSize={11} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#020e17', border: '1px solid #3b82f6', borderRadius: '12px', fontSize: '11px' }}
              />
              <Bar dataKey="RataRata" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Rata-rata Nilai" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TABEL SANTRI BACA KITAB */}
      <div className="card-3d rounded-2xl p-5 border border-[#d4af37]/30 space-y-4 bg-[#020e08]/90">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-black text-white text-gold-3d flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-400" />
            <span>Daftar Nilai Ujian Baca Kitab Seluruh Santri</span>
          </h4>
          <span className="text-xs font-mono text-blue-300">
            {filteredList.length} Santri
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-blue-500/20">
          <table className="w-full text-xs text-left min-w-[950px]">
            <thead className="bg-[#031520] text-blue-200 border-b border-blue-500/30">
              <tr>
                <th className="p-3 w-12 text-center">NO</th>
                <th className="p-3">SANTRI & NIS</th>
                <th className="p-3">GENDER</th>
                <th className="p-3">KELAS</th>
                <th className="p-3">KITAB YANG DIBACA</th>
                <th className="p-3 text-center">NILAI</th>
                <th className="p-3">PREDIKAT & TARKIB</th>
                <th className="p-3">PENGUJI & TGL</th>
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
                  <tr key={s.uniqueKey} className="hover:bg-blue-950/20 transition">
                    <td className="p-3 text-center font-mono font-bold text-blue-300">
                      {idx + 1}
                    </td>

                    <td className="p-3">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-[#072535] border border-blue-400/40 shrink-0">
                          <img
                            src={((s.fotoThumbnail && s.fotoThumbnail.trim()) || (s.foto && s.foto.trim())) || 'https://via.placeholder.com/70x90'}
                            alt={s.nama}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLElement).setAttribute('src', 'https://via.placeholder.com/70x90'); }}
                          />
                        </div>
                        <div>
                          <span className="font-bold text-white block">{s.nama}</span>
                          <span className="text-[10px] text-blue-300 font-mono">NIS: {s.id}</span>
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
                      <span className="px-2.5 py-1 rounded-xl bg-blue-500/20 border border-blue-500/50 text-blue-300 font-mono font-black text-sm">
                        {s.score}
                      </span>
                    </td>

                    <td className="p-3">
                      <span className="font-bold text-white block">{s.predikat}</span>
                      <span className="text-[10px] text-zinc-400 italic block">{s.catatanUjianKitab || 'Fashih & Paham Makna'}</span>
                    </td>

                    <td className="p-3">
                      <span className="text-zinc-200 block">{s.ustadzPengujiKitab || 'Ust. M. Ilyas'}</span>
                      <span className="text-[10px] text-zinc-400 font-mono">{s.tanggalUjianKitab || '2026-09-22'}</span>
                    </td>

                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => onOpenInputModal(s)}
                        className="px-3 py-1.5 rounded-xl bg-blue-900/60 hover:bg-blue-800 border border-blue-500/50 text-blue-200 hover:text-white text-xs font-bold inline-flex items-center gap-1.5 transition shadow active:scale-95 cursor-pointer"
                      >
                        <Sliders className="w-3.5 h-3.5 text-blue-300" />
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
