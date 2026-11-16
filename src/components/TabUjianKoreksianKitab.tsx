import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckSquare,
  Filter,
  Search,
  CheckCircle2,
  Sliders,
  BookMarked,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import {
  AppSettings,
  KoreksianKitabRecord,
  KoreksianStatus,
  KurikulumKitabRecord,
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
  buildDefaultKoreksianBatasMateriFromKurikulum
} from '../lib/ujianExamHelpers';
import {
  resolveSantriGender,
  resolveSantriTahunAjaran
} from './TabUjianMuhafadzoh';
import { UjianTakziranModule, EligibleUjianTakziranItem } from './UjianTakziranModule';

interface TabUjianKoreksianKitabProps {
  santriList: Santri[];
  kurikulumList: KurikulumKitabRecord[];
  config: UjianExamGlobalConfig;
  settings: AppSettings;
  onOpenInputModal: (santri: Santri) => void;
  onOpenOptionPanel: () => void;
  onUpdateSantriProfile?: (updated: Santri) => void;
}

export const TabUjianKoreksianKitab: React.FC<TabUjianKoreksianKitabProps> = ({
  santriList,
  kurikulumList,
  config,
  settings,
  onOpenInputModal,
  onOpenOptionPanel,
  onUpdateSantriProfile
}) => {
  const [filterTahun, setFilterTahun] = useState<string>('SEMUA');
  const [filterKelas, setFilterKelas] = useState<string>('SEMUA');
  const [filterGender, setFilterGender] = useState<string>('SEMUA');
  const [filterStatus, setFilterStatus] = useState<'SEMUA' | KoreksianStatus>('SEMUA');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [koreksianRecords, setKoreksianRecords] = useState<KoreksianKitabRecord[]>([]);

  // Muat & subscribe records Koreksian Kitab dari Firestore
  useEffect(() => {
    let active = true;
    loadMasterDataFromFirestore<KoreksianKitabRecord[]>('ujian_koreksian_records').then((data) => {
      if (active && Array.isArray(data)) setKoreksianRecords(data);
    });
    const unsub = subscribeMasterDataFromFirestore<KoreksianKitabRecord[]>(
      'ujian_koreksian_records',
      (data) => {
        if (active && Array.isArray(data)) setKoreksianRecords(data);
      }
    );
    return () => {
      active = false;
      unsub();
    };
  }, []);

  const recordMap = useMemo(() => {
    const map = new Map<string, KoreksianKitabRecord>();
    koreksianRecords.forEach((r) => map.set(`${r.idSantri}__${r.tahunAjaran}`, r));
    return map;
  }, [koreksianRecords]);

  // Gabungkan santri dengan status Tam / Naqish dan kitab dari Kurikulum kelas
  const enrichedList = useMemo(() => {
    return santriList.map((s, idx) => {
      const gender = resolveSantriGender(s);
      const tahun = resolveSantriTahunAjaran(s);
      const rec = recordMap.get(`${s.id}__${tahun}`);
      const kurikulumKelas = kurikulumList.filter((k) => k.kelas === s.kelas);
      const defaultKitab =
        kurikulumKelas.length > 0
          ? kurikulumKelas.map((k) => k.kitab).slice(0, 2).join(', ')
          : s.kitabKoreksian || 'Kitab Kurikulum Kelas';

      const defaultStatus: KoreksianStatus =
        rec?.statusKoreksian ||
        ((s.predikatKoreksianKitab || '').toLowerCase().includes('naqish') ||
        (s.predikatKoreksianKitab || '').toLowerCase().includes('kurang') ||
        Number(s.nilaiKoreksianKitab ?? 90) < 70
          ? 'Naqish'
          : 'Tam');

      return {
        ...s,
        uniqueKey: `${s.id}-${idx}`,
        gender,
        tahun,
        kitab: rec?.kitab || defaultKitab,
        statusKoreksian: defaultStatus,
        catatanKekurangan: rec?.catatanKekurangan || '',
        statusHer: rec?.statusHer || 'Belum Her'
      };
    });
  }, [santriList, kurikulumList, recordMap]);

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
      if (filterStatus !== 'SEMUA' && s.statusKoreksian !== filterStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!s.nama.toLowerCase().includes(q) && !s.id.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [enrichedList, filterTahun, filterKelas, filterGender, filterStatus, searchQuery]);

  // Data Batas Materi Koreksian Per Kelas (tersinkron dengan config & kurikulumList)
  const batasMateriByClass = useMemo(() => {
    const sourceRows =
      config.koreksianBatasMateri && config.koreksianBatasMateri.length > 0
        ? config.koreksianBatasMateri
        : buildDefaultKoreksianBatasMateriFromKurikulum(kurikulumList);

    const map = new Map<string, typeof sourceRows>();
    KELAS_MADRASAH_LIST.forEach((k) => map.set(k, []));
    sourceRows.forEach((row) => {
      if (filterKelas !== 'SEMUA' && row.kelas !== filterKelas) return;
      if (!map.has(row.kelas)) map.set(row.kelas, []);
      map.get(row.kelas)!.push(row);
    });
    return Array.from(map.entries()).filter(([, arr]) => arr.length > 0);
  }, [config.koreksianBatasMateri, kurikulumList, filterKelas]);

  // Kelompokkan Santri Per Kelas
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

  // Kelompokkan Santri Naqish (Her Koreksian) Per Kelas
  const herKoreksianByClass = useMemo(() => {
    const naqishList = filteredList.filter((s) => s.statusKoreksian === 'Naqish');
    const map = new Map<string, typeof naqishList>();
    KELAS_MADRASAH_LIST.forEach((k) => map.set(k, []));
    naqishList.forEach((s) => {
      const k = s.kelas || '1 TSANAWIYAH';
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(s);
    });
    return Array.from(map.entries()).filter(([, arr]) => arr.length > 0);
  }, [filteredList]);

  // Eligible Items untuk Surat Takziran Otomatis (Santri berstatus Naqish)
  const eligibleTakziranItems = useMemo<EligibleUjianTakziranItem[]>(() => {
    return enrichedList
      .filter((s) => s.statusKoreksian === 'Naqish')
      .map((s) => ({
        santri: s,
        periodeTag: s.tahun,
        alasanTakziran: 'Naqish (Makna Kurang) — Wajib Her Koreksian',
        detailNilai: s.catatanKekurangan
          ? `${s.kitab} (${s.catatanKekurangan})`
          : `${s.kitab} · Status Makna Kurang (Naqish)`
      }));
  }, [enrichedList]);

  const handleUpdateKoreksian = async (
    santri: (typeof enrichedList)[number],
    updates: Partial<KoreksianKitabRecord>
  ) => {
    const nextStatus = updates.statusKoreksian ?? santri.statusKoreksian;
    const nextCatatan = updates.catatanKekurangan ?? santri.catatanKekurangan;
    const nextHer = updates.statusHer ?? santri.statusHer;
    const nextKitab = updates.kitab ?? santri.kitab;

    const newRec: KoreksianKitabRecord = {
      id: `${santri.id}__${santri.tahun}`,
      idSantri: santri.id,
      namaSantri: santri.nama,
      kelas: santri.kelas,
      tahunAjaran: santri.tahun,
      kitab: nextKitab,
      statusKoreksian: nextStatus,
      nilaiAngka: nextStatus === 'Tam' ? 92 : 65,
      catatanKekurangan: nextCatatan,
      statusHer: nextHer,
      updatedAt: new Date().toISOString()
    };

    const others = koreksianRecords.filter(
      (r) => !(r.idSantri === santri.id && r.tahunAjaran === santri.tahun)
    );
    const nextList = [newRec, ...others];
    setKoreksianRecords(nextList);
    await saveMasterDataToFirestore('ujian_koreksian_records', nextList);

    if (onUpdateSantriProfile) {
      onUpdateSantriProfile({
        ...santri,
        nilaiKoreksianKitab: nextStatus === 'Tam' ? 92 : 65,
        kitabKoreksian: nextKitab,
        predikatKoreksianKitab:
          nextStatus === 'Tam'
            ? 'Tam (Makna Komplit & Sah)'
            : 'Naqish (Makna Kurang — Wajib Her Koreksian)'
      });
    }
  };

  const countTam = filteredList.filter((s) => s.statusKoreksian === 'Tam').length;
  const countNaqish = filteredList.filter((s) => s.statusKoreksian === 'Naqish').length;

  return (
    <div className="space-y-6">
      {/* HEADER STANDALONE: TAB KOREKSIAN KITAB */}
      <div className="card-3d rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-amber-500/40 bg-gradient-to-r from-[#211504] via-[#150d02] to-[#2e1c05]">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-300 via-amber-500 to-amber-800 flex items-center justify-center text-black shadow">
            <CheckSquare className="w-5 h-5 stroke-[2.4]" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">
              TAB KOREKSIAN KITAB (TAM / NAQISH & BATAS MATERI KURIKULUM)
            </h2>
            <p className="text-xs text-amber-200/85 mt-0.5">
              Pemeriksaan makna kitab per kelas (Tam / Naqish), tabel batas materi terkoneksi Kurikulum, Her Koreksian, dan Surat Takziran otomatis.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenOptionPanel}
          className="px-3.5 py-2 rounded-xl bg-amber-950/90 hover:bg-amber-900 border border-amber-400/50 text-amber-200 text-xs font-bold inline-flex items-center gap-1.5 transition whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5 text-amber-300" />
          <span>Edit Batas Materi & Aturan (Option Panel)</span>
        </button>
      </div>

      {/* RINGKASAN METRIK */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-3d-glass p-4 rounded-2xl border border-emerald-500/30 space-y-1">
          <span className="text-xs text-emerald-300 font-bold block">Status Tam (Makna Komplit)</span>
          <div className="text-2xl font-black text-emerald-300 font-mono tabular-nums">
            {countTam} <span className="text-xs text-zinc-400 font-sans">Santri</span>
          </div>
          <span className="text-[11px] text-zinc-400">Makna gandul lengkap & sah</span>
        </div>

        <div className="card-3d-glass p-4 rounded-2xl border border-red-500/35 space-y-1">
          <span className="text-xs text-red-300 font-bold block">Status Naqish (Makna Kurang)</span>
          <div className="text-2xl font-black text-red-400 font-mono tabular-nums">
            {countNaqish} <span className="text-xs text-zinc-400 font-sans">Santri</span>
          </div>
          <span className="text-[11px] text-zinc-400">Otomatis masuk Her Koreksian & Takziran</span>
        </div>

        <div className="card-3d-glass p-4 rounded-2xl border border-amber-500/30 space-y-1">
          <span className="text-xs text-amber-300 font-bold block">Integrasi Tabel Kurikulum</span>
          <div className="text-2xl font-black text-[#f5e298] font-mono tabular-nums">
            {kurikulumList.length} <span className="text-xs text-zinc-400 font-sans">Kitab / Mapel</span>
          </div>
          <span className="text-[11px] text-zinc-400">Terhubung langsung ke batas materi</span>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="card-3d-glass p-4 rounded-2xl border border-amber-500/25 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-200 border-b border-white/10 pb-2">
          <Filter className="w-4 h-4 text-amber-400" />
          <span>Filter Pemeriksaan Koreksian Kitab Per Kelas</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-zinc-300 mb-1">Tahun Ajaran:</label>
            <select
              value={filterTahun}
              onChange={(e) => setFilterTahun(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-[#03150c] border border-amber-500/40 text-white text-xs font-semibold"
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
              className="w-full px-2.5 py-1.5 rounded-xl bg-[#03150c] border border-amber-500/40 text-white text-xs font-semibold"
            >
              <option value="SEMUA">Semua Kelas (Per Kelas)</option>
              {KELAS_MADRASAH_LIST.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-300 mb-1">Status Makna:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'SEMUA' | KoreksianStatus)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-[#03150c] border border-amber-500/40 text-white text-xs font-semibold"
            >
              <option value="SEMUA">Semua (Tam & Naqish)</option>
              <option value="Tam">Tam (Makna Komplit)</option>
              <option value="Naqish">Naqish (Makna Kurang)</option>
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

      {/* SECTION 1: TABEL BATAS MATERI KOREKSIAN PER KELAS (TERKONEKSI KURIKULUM) */}
      <div className="card-3d rounded-2xl p-5 border border-amber-500/35 bg-[#120b02]/95 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-amber-500/20 pb-3">
          <div>
            <h3 className="text-base font-black text-amber-200 flex items-center gap-2">
              <BookMarked className="w-4 h-4 text-amber-400" />
              <span>Tabel Batas Materi Koreksian Per Kelas (Terhubung Kurikulum)</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Daftar pelajaran dan jenis kitab per kelas terhubung langsung dari Tabel Kurikulum dan dapat diedit melalui Option Panel.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenOptionPanel}
            className="px-3 py-1.5 rounded-lg bg-amber-900/60 hover:bg-amber-800 border border-amber-500/40 text-amber-100 text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Edit Batas Materi (Option Panel)</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {batasMateriByClass.map(([kelasName, rows]) => (
            <div
              key={`materi-${kelasName}`}
              className="rounded-xl border border-amber-500/25 overflow-hidden bg-black/40"
            >
              <div className="px-4 py-2 bg-[#1e1303] border-b border-amber-500/20 flex items-center justify-between">
                <span className="text-xs font-bold text-[#f5e298]">Kelas {kelasName}</span>
                <span className="text-[11px] font-mono tabular-nums text-amber-300">
                  {rows.length} Pelajaran / Kitab
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#140d02] text-amber-200 border-b border-amber-500/20">
                    <tr>
                      <th className="p-2.5 w-12 text-center">No</th>
                      <th className="p-2.5">Pelajaran</th>
                      <th className="p-2.5">Mulai Materi</th>
                      <th className="p-2.5">Batas Akhir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {rows.map((r, i) => (
                      <tr key={r.id} className="hover:bg-white/[0.02]">
                        <td className="p-2.5 text-center font-mono tabular-nums text-amber-300 font-bold">
                          {r.no || i + 1}
                        </td>
                        <td className="p-2.5 font-semibold text-white">{r.pelajaran}</td>
                        <td className="p-2.5 text-zinc-300">{r.mulaiMateri}</td>
                        <td className="p-2.5 text-emerald-300 font-medium">{r.batasAkhir}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: TABEL PENILAIAN KOREKSIAN KITAB PER KELAS (TAM vs NAQISH) */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-amber-400" />
            <span>Penilaian Koreksian Kitab Santri Per Kelas (Tam / Naqish)</span>
          </h3>
          <p className="text-xs text-zinc-400">
            Pilih status Tam (Makna Komplit) atau Naqish (Makna Kurang). Santri berstatus Naqish otomatis masuk Her Koreksian & Surat Takziran.
          </p>
        </div>

        {groupedSantriByClass.map(([kelasName, santris]) => (
          <div
            key={`kor-kelas-${kelasName}`}
            className="card-3d rounded-2xl border border-amber-500/30 overflow-hidden bg-[#0e0902]/95"
          >
            <div className="px-4 py-3 bg-[#1e1303] border-b border-amber-500/25 flex items-center justify-between">
              <h4 className="text-sm font-black text-[#f5e298]">
                Kelas {kelasName} ({santris.length} Santri)
              </h4>
              <span className="text-xs font-mono tabular-nums text-amber-300">
                Tam: {santris.filter((s) => s.statusKoreksian === 'Tam').length} · Naqish:{' '}
                {santris.filter((s) => s.statusKoreksian === 'Naqish').length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left min-w-[920px]">
                <thead className="bg-[#140d02] text-amber-200 border-b border-amber-500/20">
                  <tr>
                    <th className="p-3 w-12 text-center">No</th>
                    <th className="p-3">Santri & NIS</th>
                    <th className="p-3">Kitab Kurikulum</th>
                    <th className="p-3 text-center">Penilaian (Tam / Naqish)</th>
                    <th className="p-3">Catatan Kekurangan</th>
                    <th className="p-3 text-center">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {santris.map((s, idx) => (
                    <tr key={s.uniqueKey} className="hover:bg-amber-950/15 transition">
                      <td className="p-3 text-center font-mono tabular-nums font-bold text-amber-300">
                        {idx + 1}
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-white">{s.nama}</div>
                        <div className="text-[11px] text-zinc-400 font-mono tabular-nums">
                          NIS: {s.id} · {s.gender} · {s.tahun}
                        </div>
                      </td>
                      <td className="p-3 text-zinc-200 font-medium">{s.kitab}</td>
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-black/50 border border-white/10">
                          <button
                            type="button"
                            onClick={() => handleUpdateKoreksian(s, { statusKoreksian: 'Tam' })}
                            className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer whitespace-nowrap transition ${
                              s.statusKoreksian === 'Tam'
                                ? 'bg-emerald-600 text-white shadow'
                                : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            Tam (Komplit)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateKoreksian(s, { statusKoreksian: 'Naqish' })}
                            className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer whitespace-nowrap transition ${
                              s.statusKoreksian === 'Naqish'
                                ? 'bg-red-600 text-white shadow'
                                : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            Naqish (Kurang)
                          </button>
                        </div>
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={s.catatanKekurangan}
                          placeholder={
                            s.statusKoreksian === 'Naqish'
                              ? 'Tuliskan bab/halaman yang kurang...'
                              : 'Makna lengkap'
                          }
                          onChange={(e) =>
                            handleUpdateKoreksian(s, { catatanKekurangan: e.target.value })
                          }
                          className="w-full min-w-[200px] px-2.5 py-1 rounded-lg bg-[#03150c] border border-amber-500/30 text-white text-xs"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => onOpenInputModal(s)}
                          className="px-3 py-1.5 rounded-lg bg-amber-900/60 hover:bg-amber-800 border border-amber-500/40 text-amber-100 text-xs font-bold whitespace-nowrap cursor-pointer"
                        >
                          Edit Profil
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* SECTION 3: TABEL HER KOREKSIAN KITAB (PER KELAS — OTOMATIS DARI NAQISH) */}
      <div className="card-3d rounded-2xl p-5 border border-red-500/35 bg-[#170904]/95 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-red-500/20 pb-3">
          <div>
            <h3 className="text-base font-black text-amber-200 flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-red-400" />
              <span>Tabel Her Koreksian Kitab (Otomatis Per Kelas Bagi Status Naqish)</span>
            </h3>
            <p className="text-xs text-zinc-300 mt-0.5">
              Santri berstatus Naqish (Makna Kurang) wajib mengikuti Her Koreksian per kelas dan otomatis menerima Surat Takziran.
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-red-300 font-bold">
            Total Wajib Her: {herKoreksianByClass.reduce((acc, [, arr]) => acc + arr.length, 0)} Santri
          </span>
        </div>

        {herKoreksianByClass.length === 0 ? (
          <div className="p-6 rounded-xl border border-emerald-500/20 bg-black/30 text-center text-xs text-emerald-300">
            Seluruh santri berstatus Tam (Makna Komplit) — tidak ada peserta Her Koreksian saat ini.
          </div>
        ) : (
          <div className="space-y-4">
            {herKoreksianByClass.map(([kelasName, rows]) => (
              <div
                key={`her-kor-${kelasName}`}
                className="rounded-xl border border-red-500/30 overflow-hidden bg-black/40"
              >
                <div className="px-4 py-2.5 bg-red-950/50 border-b border-red-500/25 flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-200">
                    Her Koreksian — Kelas {kelasName}
                  </span>
                  <span className="text-[11px] font-mono tabular-nums text-red-300">
                    {rows.length} Santri Naqish
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left min-w-[780px]">
                    <thead className="bg-[#1b0803] text-amber-200 border-b border-red-500/20">
                      <tr>
                        <th className="p-3 w-12 text-center">No</th>
                        <th className="p-3">Santri & NIS</th>
                        <th className="p-3">Kitab</th>
                        <th className="p-3">Keterangan Kekurangan</th>
                        <th className="p-3 text-center">Status Her Koreksian</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {rows.map((s, idx) => (
                        <tr key={`her-kor-row-${s.id}`} className="hover:bg-red-950/20">
                          <td className="p-3 text-center font-mono tabular-nums font-bold text-red-300">
                            {idx + 1}
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-white">{s.nama}</div>
                            <div className="text-[11px] text-zinc-400 font-mono">NIS: {s.id}</div>
                          </td>
                          <td className="p-3 text-zinc-200">{s.kitab}</td>
                          <td className="p-3 text-red-300 font-semibold">
                            <span className="inline-flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>{s.catatanKekurangan || 'Naqish (Makna Kurang)'}</span>
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <select
                              value={s.statusHer}
                              onChange={(e) =>
                                handleUpdateKoreksian(s, {
                                  statusHer: e.target.value as KoreksianKitabRecord['statusHer']
                                })
                              }
                              className="px-2.5 py-1 rounded-lg bg-[#03150c] border border-amber-500/40 text-xs text-white font-semibold"
                            >
                              <option value="Belum Her">Belum Her</option>
                              <option value="Sedang Her">Sedang Her</option>
                              <option value="Lulus Her">Lulus Her (Tam)</option>
                            </select>
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

      {/* SECTION 4: SURAT TAKZIRAN OTOMATIS KOREKSIAN KITAB (PER KELAS + TABEL TERLAMBAT) */}
      <UjianTakziranModule
        kategori="koreksian"
        title="Surat Takziran Her Koreksian Kitab (Per Kelas)"
        subtitle="Santri berstatus Naqish (Makna Kurang) otomatis masuk daftar Takziran per kelas. Dicetak -> Sedang Dikerjakan; dikumpulkan -> Selesai; melewati batas akhir -> kartu tidak berlaku & naik tingkat Sedang."
        eligibleItems={eligibleTakziranItems}
        config={config}
        settings={settings}
        selectedKelasFilter={filterKelas}
        onOpenOptionPanel={onOpenOptionPanel}
        accentColor="amber"
      />
    </div>
  );
};
