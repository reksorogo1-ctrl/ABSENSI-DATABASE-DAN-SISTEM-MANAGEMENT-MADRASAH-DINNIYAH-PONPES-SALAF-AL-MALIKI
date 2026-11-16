import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  TrendingUp,
  Filter,
  Search,
  CheckCircle2,
  Sliders,
  AlertTriangle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import {
  AppSettings,
  BacaKitabRecord,
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
  getBacaKitabRuleForKelas
} from '../lib/ujianExamHelpers';
import {
  resolveSantriGender,
  resolveSantriTahunAjaran,
  resolveSantriAngkatan
} from './TabUjianMuhafadzoh';
import { UjianTakziranModule, EligibleUjianTakziranItem } from './UjianTakziranModule';

interface TabUjianBacaKitabProps {
  santriList: Santri[];
  config: UjianExamGlobalConfig;
  settings: AppSettings;
  onOpenInputModal: (santri: Santri) => void;
  onOpenOptionPanel: () => void;
  onUpdateSantriProfile?: (updated: Santri) => void;
}

export const TabUjianBacaKitab: React.FC<TabUjianBacaKitabProps> = ({
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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [bacaRecords, setBacaRecords] = useState<BacaKitabRecord[]>([]);

  // Muat & subscribe catatan Baca Kitab dari Firestore
  useEffect(() => {
    let active = true;
    loadMasterDataFromFirestore<BacaKitabRecord[]>('ujian_baca_kitab_records').then((data) => {
      if (active && Array.isArray(data)) setBacaRecords(data);
    });
    const unsub = subscribeMasterDataFromFirestore<BacaKitabRecord[]>(
      'ujian_baca_kitab_records',
      (data) => {
        if (active && Array.isArray(data)) setBacaRecords(data);
      }
    );
    return () => {
      active = false;
      unsub();
    };
  }, []);

  const recordMap = useMemo(() => {
    const map = new Map<string, BacaKitabRecord>();
    bacaRecords.forEach((r) => map.set(`${r.idSantri}__${r.tahunAjaran}`, r));
    return map;
  }, [bacaRecords]);

  const enrichedList = useMemo(() => {
    return santriList.map((s, idx) => {
      const gender = resolveSantriGender(s);
      const tahun = resolveSantriTahunAjaran(s);
      const angkatan = resolveSantriAngkatan(s);
      const classRule = getBacaKitabRuleForKelas(config, s.kelas);
      const rec = recordMap.get(`${s.id}__${tahun}`);
      const score = rec ? rec.nilai : Number(s.nilaiBacaKitab ?? 88);
      const kitab = rec?.kitab || s.kitabBaca || classRule.kitabStandar;
      const batasRataRata = classRule.nilaiRataRataMinimal;
      const diBawahRataRata = score < batasRataRata;
      const predikat =
        rec?.predikat ||
        s.predikatBacaKitab ||
        (score >= 90
          ? 'Mumtaz (Fashih & Paham Tarkib)'
          : score >= batasRataRata
          ? 'Jayyid (Memenuhi Standar)'
          : 'Di Bawah Rata-Rata (Wajib Takziran)');

      return {
        ...s,
        uniqueKey: `${s.id}-${idx}`,
        gender,
        tahun,
        angkatan,
        score,
        kitab,
        batasRataRata,
        diBawahRataRata,
        predikat
      };
    });
  }, [santriList, config, recordMap]);

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

  // Kelompokkan per kelas
  const groupedByClass = useMemo(() => {
    const map = new Map<string, typeof filteredList>();
    KELAS_MADRASAH_LIST.forEach((k) => map.set(k, []));
    filteredList.forEach((s) => {
      const k = s.kelas || '1 TSANAWIYAH';
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(s);
    });
    return Array.from(map.entries()).filter(([, arr]) => arr.length > 0);
  }, [filteredList]);

  const avgScore = useMemo(() => {
    if (filteredList.length === 0) return '0.0';
    const sum = filteredList.reduce((acc, s) => acc + s.score, 0);
    return (sum / filteredList.length).toFixed(1);
  }, [filteredList]);

  const classStats = useMemo(() => {
    return KELAS_MADRASAH_LIST.map((kelas) => {
      const list = enrichedList.filter((s) => s.kelas === kelas);
      const sum = list.reduce((acc, s) => acc + s.score, 0);
      const rule = getBacaKitabRuleForKelas(config, kelas);
      return {
        kelas: kelas.replace('TSANAWIYAH', 'TSN').replace('ALIYAH', 'ALY'),
        RataRata: list.length > 0 ? Math.round(sum / list.length) : 0,
        StandarMin: rule.nilaiRataRataMinimal
      };
    });
  }, [enrichedList, config]);

  // Santri yang nilainya di bawah rata-rata Option Panel -> Otomatis Surat Takziran
  const eligibleTakziranItems = useMemo<EligibleUjianTakziranItem[]>(() => {
    return enrichedList
      .filter((s) => s.diBawahRataRata)
      .map((s) => ({
        santri: s,
        periodeTag: s.tahun,
        alasanTakziran: `Nilai Baca Kitab di bawah standar rata-rata (${s.score} < ${s.batasRataRata})`,
        detailNilai: `${s.kitab} · Nilai ${s.score} / Standar Min ${s.batasRataRata}`
      }));
  }, [enrichedList]);

  const handleUpdateScore = async (
    santri: (typeof enrichedList)[number],
    newScoreRaw: number,
    newKitab?: string
  ) => {
    const nilai = Math.max(0, Math.min(100, Number(newScoreRaw) || 0));
    const kitab = newKitab !== undefined ? newKitab : santri.kitab;
    const diBawah = nilai < santri.batasRataRata;
    const predikat =
      nilai >= 90
        ? 'Mumtaz (Fashih & Paham Tarkib)'
        : !diBawah
        ? 'Jayyid (Memenuhi Standar)'
        : 'Di Bawah Rata-Rata (Wajib Takziran)';

    const rec: BacaKitabRecord = {
      id: `${santri.id}__${santri.tahun}`,
      idSantri: santri.id,
      namaSantri: santri.nama,
      kelas: santri.kelas,
      tahunAjaran: santri.tahun,
      kitab,
      nilai,
      predikat,
      updatedAt: new Date().toISOString()
    };

    const others = bacaRecords.filter(
      (r) => !(r.idSantri === santri.id && r.tahunAjaran === santri.tahun)
    );
    const nextList = [rec, ...others];
    setBacaRecords(nextList);
    await saveMasterDataToFirestore('ujian_baca_kitab_records', nextList);

    if (onUpdateSantriProfile) {
      onUpdateSantriProfile({
        ...santri,
        nilaiBacaKitab: nilai,
        kitabBaca: kitab,
        predikatBacaKitab: predikat
      });
    }
  };

  const countBelowAvg = filteredList.filter((s) => s.diBawahRataRata).length;

  return (
    <div className="space-y-6">
      {/* HEADER STANDALONE: TAB BACA KITAB */}
      <div className="card-3d rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-blue-500/40 bg-gradient-to-r from-[#041624] via-[#02131d] to-[#052338]">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-300 via-blue-500 to-blue-800 flex items-center justify-center text-white shadow">
            <BookOpen className="w-5 h-5 stroke-[2.4]" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">
              TAB UJIAN BACA KITAB (QIRA'ATUL KUTUB)
            </h2>
            <p className="text-xs text-blue-200/85 mt-0.5">
              Daftar nilai baca kitab per kelas. Santri dengan nilai di bawah standar rata-rata Option Panel otomatis menerima Surat Takziran.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenOptionPanel}
          className="px-3.5 py-2 rounded-xl bg-blue-950/90 hover:bg-blue-900 border border-blue-400/50 text-blue-200 text-xs font-bold inline-flex items-center gap-1.5 transition whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5 text-blue-300" />
          <span>Atur Nilai Rata-Rata & Kitab (Option Panel)</span>
        </button>
      </div>

      {/* RINGKASAN METRIK */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-3d-glass p-4 rounded-2xl border border-blue-500/30 space-y-1">
          <span className="text-xs text-blue-300 font-bold block">Rata-Rata Aktual Baca Kitab</span>
          <div className="text-2xl font-black text-white font-mono tabular-nums">
            {avgScore} <span className="text-xs text-zinc-400 font-sans">/ 100</span>
          </div>
          <span className="text-[11px] text-zinc-400">
            Dari {filteredList.length} santri terfilter
          </span>
        </div>

        <div className="card-3d-glass p-4 rounded-2xl border border-[#d4af37]/30 space-y-1">
          <span className="text-xs text-[#d4af37] font-bold block">Standar Minimal (Option Panel)</span>
          <div className="text-2xl font-black text-[#f5e298] font-mono tabular-nums">
            {config.bacaKitabRataRataGlobal} <span className="text-xs text-zinc-400 font-sans">(Global / Per Kelas)</span>
          </div>
          <span className="text-[11px] text-zinc-400">
            Dapat diubah per jenjang di Option Panel
          </span>
        </div>

        <div className="card-3d-glass p-4 rounded-2xl border border-red-500/30 space-y-1">
          <span className="text-xs text-red-300 font-bold block">Di Bawah Rata-Rata (Wajib Takziran)</span>
          <div className="text-2xl font-black text-red-400 font-mono tabular-nums">
            {countBelowAvg} <span className="text-xs text-zinc-400 font-sans">Santri</span>
          </div>
          <span className="text-[11px] text-zinc-400">
            Otomatis masuk daftar Surat Takziran Baca Kitab
          </span>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="card-3d-glass p-4 rounded-2xl border border-blue-500/25 space-y-3">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-200">
            <Filter className="w-4 h-4 text-blue-400" />
            <span>Filter Daftar Nilai Baca Kitab Per Kelas</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-zinc-300 mb-1">Tahun Ajaran:</label>
            <select
              value={filterTahun}
              onChange={(e) => setFilterTahun(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-[#03150c] border border-blue-500/40 text-white text-xs font-semibold"
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
              className="w-full px-2.5 py-1.5 rounded-xl bg-[#03150c] border border-blue-500/40 text-white text-xs font-semibold"
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

      {/* GRAFIK PERBANDINGAN PER KELAS VS STANDAR RATA-RATA */}
      <div className="card-3d rounded-2xl p-5 border border-blue-500/30 space-y-3 bg-[#020e17]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5 uppercase">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <span>Rata-Rata Nilai Baca Kitab Per Kelas vs Standar Kelulusan</span>
          </span>
          <span className="text-[11px] font-mono tabular-nums text-zinc-400">
            Garis Batas Global: {config.bacaKitabRataRataGlobal}
          </span>
        </div>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={classStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3b82f6" strokeOpacity={0.15} />
              <XAxis dataKey="kelas" stroke="#93c5fd" fontSize={11} />
              <YAxis domain={[0, 100]} stroke="#93c5fd" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#020e17',
                  border: '1px solid #3b82f6',
                  borderRadius: '10px',
                  fontSize: '11px'
                }}
              />
              <ReferenceLine y={config.bacaKitabRataRataGlobal} stroke="#f59e0b" strokeDasharray="4 4" />
              <Bar dataKey="RataRata" fill="#3b82f6" radius={[5, 5, 0, 0]} name="Rata-rata Kelas" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TABEL DAFTAR NILAI BACA KITAB PER KELAS */}
      <div className="space-y-4">
        {groupedByClass.map(([kelasName, santris]) => {
          const rule = getBacaKitabRuleForKelas(config, kelasName);
          return (
            <div
              key={`bk-kelas-${kelasName}`}
              className="card-3d rounded-2xl border border-blue-500/30 overflow-hidden bg-[#020e17]/95"
            >
              <div className="p-4 bg-[#041d2e] border-b border-blue-500/25 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h4 className="text-sm font-black text-white">
                    Daftar Nilai Baca Kitab — Kelas {kelasName} ({santris.length} Santri)
                  </h4>
                  <p className="text-xs text-blue-200/80 mt-0.5">
                    Kitab Standar: <strong className="text-white">{rule.kitabStandar}</strong> · Standar Nilai Rata-Rata Minimal:{' '}
                    <strong className="text-[#f5e298] font-mono tabular-nums">{rule.nilaiRataRataMinimal}</strong>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onOpenOptionPanel}
                  className="text-xs font-bold text-blue-300 hover:text-white inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Edit Standar Rata-Rata</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left min-w-[880px]">
                  <thead className="bg-[#031520] text-blue-200 border-b border-blue-500/25">
                    <tr>
                      <th className="p-3 w-12 text-center">No</th>
                      <th className="p-3">Santri & NIS</th>
                      <th className="p-3">Kitab yang Dibaca</th>
                      <th className="p-3 text-center">Nilai Baca Kitab</th>
                      <th className="p-3 text-center">Standar Kelas</th>
                      <th className="p-3">Status & Predikat</th>
                      <th className="p-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {santris.map((s, idx) => (
                      <tr key={s.uniqueKey} className="hover:bg-blue-950/20 transition">
                        <td className="p-3 text-center font-mono tabular-nums font-bold text-blue-300">
                          {idx + 1}
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-white">{s.nama}</div>
                          <div className="text-[11px] text-zinc-400 font-mono tabular-nums">
                            NIS: {s.id} · {s.gender} · {s.tahun}
                          </div>
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={s.kitab}
                            onChange={(e) => handleUpdateScore(s, s.score, e.target.value)}
                            className="w-full min-w-[200px] px-2.5 py-1 rounded-lg bg-[#03150c] border border-blue-500/30 text-[#f5e298] text-xs font-semibold"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={s.score}
                            onChange={(e) => handleUpdateScore(s, Number(e.target.value))}
                            className={`w-20 px-2 py-1 rounded-lg bg-[#03150c] border text-center font-mono tabular-nums font-black text-sm ${
                              s.diBawahRataRata
                                ? 'border-red-500/60 text-red-400'
                                : 'border-blue-500/50 text-blue-200'
                            }`}
                          />
                        </td>
                        <td className="p-3 text-center font-mono tabular-nums text-zinc-300">
                          {s.batasRataRata}
                        </td>
                        <td className="p-3">
                          {s.diBawahRataRata ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-red-400">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Di Bawah Rata-Rata · Wajib Takziran</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{s.predikat}</span>
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => onOpenInputModal(s)}
                            className="px-3 py-1.5 rounded-lg bg-blue-900/60 hover:bg-blue-800 border border-blue-500/40 text-blue-100 text-xs font-bold whitespace-nowrap cursor-pointer"
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

      {/* MODUL TAKZIRAN OTOMATIS BAGI SANTRI NILAI < RATA-RATA */}
      <UjianTakziranModule
        kategori="baca_kitab"
        title="Surat Takziran Ujian Baca Kitab (Per Kelas)"
        subtitle="Santri dengan nilai Baca Kitab di bawah standar rata-rata Option Panel otomatis memperoleh Surat Takziran. Dicetak -> Sedang Dikerjakan; dikumpulkan -> Selesai; melewati batas akhir -> naik ke tingkat Sedang."
        eligibleItems={eligibleTakziranItems}
        config={config}
        settings={settings}
        selectedKelasFilter={filterKelas}
        onOpenOptionPanel={onOpenOptionPanel}
        accentColor="blue"
      />
    </div>
  );
};
