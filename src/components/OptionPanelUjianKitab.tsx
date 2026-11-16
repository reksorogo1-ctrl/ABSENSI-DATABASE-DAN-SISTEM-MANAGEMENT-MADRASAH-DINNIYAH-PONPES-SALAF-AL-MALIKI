import React, { useState, useEffect } from 'react';
import {
  Award,
  BookOpen,
  CheckSquare,
  FileText,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  GraduationCap,
  CheckCircle2,
  Sliders
} from 'lucide-react';
import {
  AppSettings,
  KoreksianBatasMateriRow,
  KurikulumKitabRecord,
  MuhafadzohAngkatanRankingRow,
  MuhafadzohRekapRowConfig,
  Santri,
  UjianExamGlobalConfig,
  UjianSantriRecord
} from '../types';
import { saveMasterDataToFirestore } from '../firebase';
import {
  KELAS_MADRASAH_LIST,
  buildDefaultKoreksianBatasMateriFromKurikulum,
  createDefaultUjianConfig
} from '../lib/ujianExamHelpers';

interface OptionPanelUjianKitabProps {
  config: UjianExamGlobalConfig;
  onUpdateConfig: (next: UjianExamGlobalConfig) => void;
  kurikulumList: KurikulumKitabRecord[];
  santriList: Santri[];
  settings: AppSettings;
  onUpdateSantriProfile?: (updated: Santri) => void;
  onSaveUjianSantri?: (rec: UjianSantriRecord) => void;
}

type OptionUjianSubTab = 'muhafadzoh' | 'baca_kitab' | 'koreksian' | 'takziran' | 'wali_sync';

export const OptionPanelUjianKitab: React.FC<OptionPanelUjianKitabProps> = ({
  config,
  onUpdateConfig,
  kurikulumList,
  santriList,
  settings,
  onUpdateSantriProfile,
  onSaveUjianSantri
}) => {
  const [subTab, setSubTab] = useState<OptionUjianSubTab>('muhafadzoh');
  const [draft, setDraft] = useState<UjianExamGlobalConfig>(config);
  const [selectedKoreksianKelas, setSelectedKoreksianKelas] = useState<string>('1 TSANAWIYAH');
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // State untuk SubTab Input Nilai Individual -> Wali Santri Sync (mempertahankan fitur existing)
  const [selectedUjianSantriId, setSelectedUjianSantriId] = useState<string>(santriList[0]?.id || '');
  const currentUjianSantri =
    santriList.find((s) => s.id === selectedUjianSantriId) || santriList[0];

  const [ujianKitabForm, setUjianKitabForm] = useState({
    ustadzPenguji: currentUjianSantri?.ustadzPengujiKitab || 'Ust. Muhammad Ilyas Al-Hafidz',
    tanggalUjian: currentUjianSantri?.tanggalUjianKitab || new Date().toISOString().slice(0, 10),
    nilaiKoreksianKitab: Number(currentUjianSantri?.nilaiKoreksianKitab ?? 90),
    predikatKoreksianKitab:
      currentUjianSantri?.predikatKoreksianKitab || 'Mumtaz (Makna Gandul Sah & Lengkap)',
    kitabKoreksian: currentUjianSantri?.kitabKoreksian || 'Fathul Qorib Bab Sholat',
    catatanKoreksianKitab: currentUjianSantri?.catatanUjianKitab || '',
    nilaiMuhafadzoh: Number(currentUjianSantri?.nilaiMuhafadzoh ?? 92),
    predikatMuhafadzoh: currentUjianSantri?.predikatMuhafadzoh || 'Mumtaz (Hafal Lancar)',
    kitabMuhafadzoh: currentUjianSantri?.kitabMuhafadzoh || 'Nadzhom Al-Imrithi',
    catatanMuhafadzoh: currentUjianSantri?.catatanMuhafadzoh || '',
    nilaiBacaKitab: Number(currentUjianSantri?.nilaiBacaKitab ?? 88),
    predikatBacaKitab:
      currentUjianSantri?.predikatBacaKitab || 'Jayyid Jiddan (Fashih & Paham Tarkib)',
    kitabBaca: currentUjianSantri?.kitabBaca || 'Fathul Qorib Al-Mujib',
    catatanBacaKitab: currentUjianSantri?.catatanUjianKitab || ''
  });

  useEffect(() => {
    setDraft(config);
  }, [config]);

  useEffect(() => {
    if (!currentUjianSantri) return;
    setUjianKitabForm({
      ustadzPenguji: currentUjianSantri.ustadzPengujiKitab || 'Ust. Muhammad Ilyas Al-Hafidz',
      tanggalUjian: currentUjianSantri.tanggalUjianKitab || new Date().toISOString().slice(0, 10),
      nilaiKoreksianKitab: Number(currentUjianSantri.nilaiKoreksianKitab ?? 90),
      predikatKoreksianKitab:
        currentUjianSantri.predikatKoreksianKitab || 'Mumtaz (Makna Gandul Sah & Lengkap)',
      kitabKoreksian: currentUjianSantri.kitabKoreksian || 'Fathul Qorib Bab Sholat',
      catatanKoreksianKitab: currentUjianSantri.catatanUjianKitab || '',
      nilaiMuhafadzoh: Number(currentUjianSantri.nilaiMuhafadzoh ?? 92),
      predikatMuhafadzoh: currentUjianSantri.predikatMuhafadzoh || 'Mumtaz (Hafal Lancar)',
      kitabMuhafadzoh: currentUjianSantri.kitabMuhafadzoh || 'Nadzhom Al-Imrithi',
      catatanMuhafadzoh: currentUjianSantri.catatanMuhafadzoh || '',
      nilaiBacaKitab: Number(currentUjianSantri.nilaiBacaKitab ?? 88),
      predikatBacaKitab:
        currentUjianSantri.predikatBacaKitab || 'Jayyid Jiddan (Fashih & Paham Tarkib)',
      kitabBaca: currentUjianSantri.kitabBaca || 'Fathul Qorib Al-Mujib',
      catatanBacaKitab: currentUjianSantri.catatanUjianKitab || ''
    });
  }, [selectedUjianSantriId, currentUjianSantri?.id]);

  const handleSaveConfigToFirestore = async (nextConfig: UjianExamGlobalConfig, msg?: string) => {
    setIsSaving(true);
    try {
      const payload: UjianExamGlobalConfig = {
        ...nextConfig,
        updatedAt: new Date().toISOString(),
        updatedBy: 'Admin Madrasah'
      };
      setDraft(payload);
      onUpdateConfig(payload);
      await saveMasterDataToFirestore('ujian_config', payload);
      setSaveNotice(msg || 'Seluruh pengaturan Ujian berhasil disimpan & disinkronkan ke Firestore.');
      setTimeout(() => setSaveNotice(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  // Sinkronkan Koreksian Batas Materi langsung dari Tabel Kurikulum
  const handleSyncKoreksianFromKurikulum = () => {
    const synced = buildDefaultKoreksianBatasMateriFromKurikulum(kurikulumList);
    // Pertahankan mulaiMateri & batasAkhir yang sudah pernah diedit bila kurikulumId sama
    const existingMap = new Map<string, KoreksianBatasMateriRow>();
    draft.koreksianBatasMateri.forEach((r) => {
      if (r.kurikulumId) existingMap.set(r.kurikulumId, r);
    });
    const merged = synced.map((row) => {
      const prev = row.kurikulumId ? existingMap.get(row.kurikulumId) : undefined;
      return prev
        ? { ...row, mulaiMateri: prev.mulaiMateri, batasAkhir: prev.batasAkhir }
        : row;
    });
    setDraft({ ...draft, koreksianBatasMateri: merged });
    setSaveNotice('Daftar Pelajaran & Kitab berhasil disinkronkan dari Tabel Kurikulum. Klik Simpan Perubahan untuk menyimpan ke database.');
    setTimeout(() => setSaveNotice(null), 5000);
  };

  const addRekapRow = () => {
    const newRow: MuhafadzohRekapRowConfig = {
      id: `RKP-${Date.now()}`,
      tahunAjaran: settings.tahun_ajaran || '2026/2027',
      kelas: '1 TSANAWIYAH',
      namaNadzhom: 'Nadzhom Aqidatul Awam',
      targetBait: 57,
      totalSantri: 10,
      putra: 6,
      putri: 4,
      jayyid: 9,
      mutawasit: 1,
      rodi: 0,
      persentaseLulus: 98,
      keterangan: 'Target terpenuhi',
      isManualOverride: true
    };
    setDraft({
      ...draft,
      muhafadzohRekapRows: [...draft.muhafadzohRekapRows, newRow]
    });
  };

  const addAngkatanRow = () => {
    const newRow: MuhafadzohAngkatanRankingRow = {
      id: `RNK-${Date.now()}`,
      angkatan: 'Angkatan 2026',
      kelas: '1 TSANAWIYAH',
      tahunAjaran: settings.tahun_ajaran || '2026/2027',
      namaNadzhom: 'Nadzhom Aqidatul Awam',
      totalSantri: 12,
      putra: 7,
      putri: 5,
      jayyid: 11,
      mutawasit: 1,
      rodi: 0,
      rataRataHafalan: 55,
      persentaseCapaian: 96.5,
      gelarPrestasi: 'Angkatan Mumtaz',
      catatan: 'Setoran tepat waktu',
      isManualOverride: true
    };
    setDraft({
      ...draft,
      muhafadzohAngkatanRanking: [...draft.muhafadzohAngkatanRanking, newRow]
    });
  };

  const addKoreksianMateriRow = (kelasName: string) => {
    const classRows = draft.koreksianBatasMateri.filter((r) => r.kelas === kelasName);
    const newRow: KoreksianBatasMateriRow = {
      id: `BM-MANUAL-${Date.now()}`,
      kelas: kelasName,
      no: classRows.length + 1,
      pelajaran: 'Mata Pelajaran & Kitab Baru',
      kitab: 'Kitab Kurikulum',
      mulaiMateri: 'Halaman 1 / Bab Awal',
      batasAkhir: 'Akhir Bab Semester'
    };
    setDraft({
      ...draft,
      koreksianBatasMateri: [...draft.koreksianBatasMateri, newRow]
    });
  };

  const resetToFactoryDefaults = async () => {
    const def = createDefaultUjianConfig(kurikulumList);
    await handleSaveConfigToFirestore(def, 'Pengaturan ujian dikembalikan ke standar awal.');
  };

  return (
    <div className="bg-[#052216]/90 border border-[#d4af37]/30 rounded-2xl p-5 space-y-5">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-[#d4af37]/20 pb-3.5">
        <div className="flex items-center space-x-2.5">
          <Sliders className="w-5 h-5 text-[#d4af37]" />
          <div>
            <h4 className="text-sm font-bold text-white text-gold-3d">
              Option Panel Terpusat — Muhafadzoh, Baca Kitab, Koreksian & Takziran Ujian
            </h4>
            <p className="text-[11px] text-emerald-300">
              Seluruh target hafalan, nama nadzhom, rekap, peringkat angkatan, batas minimal baca kitab, batas materi koreksian, serta format surat takziran diatur langsung dari sini.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={resetToFactoryDefaults}
            className="px-3 py-1.5 rounded-xl bg-black/50 hover:bg-black/80 border border-white/15 text-xs font-semibold text-zinc-300 cursor-pointer whitespace-nowrap"
          >
            Reset Standar
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSaveConfigToFirestore(draft)}
            className="px-4 py-1.5 rounded-xl bg-[#d4af37] hover:bg-[#e5c14b] text-black text-xs font-black inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Semua ke Firestore'}</span>
          </button>
        </div>
      </div>

      {saveNotice && (
        <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-xs text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveNotice}</span>
        </div>
      )}

      {/* SUB-TAB NAVIGASI OPTION PANEL */}
      <div className="flex flex-wrap gap-1.5 p-1.5 rounded-xl bg-[#03140c] border border-[#d4af37]/25">
        <button
          type="button"
          onClick={() => setSubTab('muhafadzoh')}
          className={`px-3 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition ${
            subTab === 'muhafadzoh'
              ? 'bg-[#d4af37] text-black'
              : 'text-zinc-300 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>1. Muhafadzoh (Target, Rekap & Peringkat)</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('baca_kitab')}
          className={`px-3 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition ${
            subTab === 'baca_kitab'
              ? 'bg-blue-500 text-white'
              : 'text-zinc-300 hover:bg-white/5 hover:text-white'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>2. Baca Kitab (Nilai Rata-Rata KKM)</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('koreksian')}
          className={`px-3 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition ${
            subTab === 'koreksian'
              ? 'bg-amber-500 text-black'
              : 'text-zinc-300 hover:bg-white/5 hover:text-white'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>3. Koreksian Kitab & Batas Materi</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('takziran')}
          className={`px-3 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition ${
            subTab === 'takziran'
              ? 'bg-red-500 text-white'
              : 'text-zinc-300 hover:bg-white/5 hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>4. Aturan & Surat Takziran Ujian</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('wali_sync')}
          className={`px-3 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition ${
            subTab === 'wali_sync'
              ? 'bg-emerald-500 text-black'
              : 'text-zinc-300 hover:bg-white/5 hover:text-white'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>5. Input Nilai Santri (Wali Sync)</span>
        </button>
      </div>

      {/* ================================================================= */}
      {/* SUBTAB 1: MUHAFADZOH */}
      {/* ================================================================= */}
      {subTab === 'muhafadzoh' && (
        <div className="space-y-6">
          {/* 1A: Target & Nama Nadzhom Ganjil/Genap Per Kelas */}
          <div className="bg-[#03140c] border border-[#d4af37]/25 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-xs font-black text-[#f5e298] uppercase tracking-wide">
                  Target & Nama Nadzhom Per Kelas (Semester Ganjil & Genap)
                </h5>
                <p className="text-[11px] text-zinc-400">
                  Santri dengan jumlah hafalan di bawah target otomatis bernilai RODI, masuk Tabel Her Muhafadzoh, dan memperoleh Surat Takziran.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left min-w-[820px]">
                <thead className="bg-black/50 text-[#d4af37] border-b border-[#d4af37]/20">
                  <tr>
                    <th className="p-2.5">Kelas</th>
                    <th className="p-2.5">Nama Nadzhom (Ganjil)</th>
                    <th className="p-2.5 w-28">Target Ganjil</th>
                    <th className="p-2.5">Nama Nadzhom (Genap)</th>
                    <th className="p-2.5 w-28">Target Genap</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {draft.muhafadzohTargets.map((item, idx) => (
                    <tr key={item.kelas}>
                      <td className="p-2 font-bold text-emerald-300 whitespace-nowrap">{item.kelas}</td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.namaNadzhomGanjil}
                          onChange={(e) => {
                            const updated = [...draft.muhafadzohTargets];
                            updated[idx] = { ...item, namaNadzhomGanjil: e.target.value };
                            setDraft({ ...draft, muhafadzohTargets: updated });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#052216] border border-[#d4af37]/30 text-white text-xs"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min={1}
                          value={item.targetGanjil}
                          onChange={(e) => {
                            const updated = [...draft.muhafadzohTargets];
                            updated[idx] = { ...item, targetGanjil: Number(e.target.value) || 0 };
                            setDraft({ ...draft, muhafadzohTargets: updated });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#052216] border border-[#d4af37]/30 text-[#f5e298] font-mono tabular-nums font-bold text-xs"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.namaNadzhomGenap}
                          onChange={(e) => {
                            const updated = [...draft.muhafadzohTargets];
                            updated[idx] = { ...item, namaNadzhomGenap: e.target.value };
                            setDraft({ ...draft, muhafadzohTargets: updated });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#052216] border border-[#d4af37]/30 text-white text-xs"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min={1}
                          value={item.targetGenap}
                          onChange={(e) => {
                            const updated = [...draft.muhafadzohTargets];
                            updated[idx] = { ...item, targetGenap: Number(e.target.value) || 0 };
                            setDraft({ ...draft, muhafadzohTargets: updated });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#052216] border border-[#d4af37]/30 text-[#f5e298] font-mono tabular-nums font-bold text-xs"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 1B: Editable Tabel Rekap Hasil Muhafadzoh */}
          <div className="bg-[#03140c] border border-[#d4af37]/25 rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h5 className="text-xs font-black text-[#f5e298] uppercase tracking-wide">
                  Tabel Rekap Hasil Muhafadzoh (Editable)
                </h5>
                <p className="text-[11px] text-zinc-400">
                  Baris rekap historis & ringkasan tahunan yang ditampilkan pada tabel Rekap Hasil Muhafadzoh.
                </p>
              </div>
              <button
                type="button"
                onClick={addRekapRow}
                className="px-3 py-1.5 rounded-lg bg-[#0b3824] hover:bg-[#104d32] border border-[#d4af37]/40 text-xs font-bold text-[#f5e298] inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Baris Rekap</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left min-w-[960px]">
                <thead className="bg-black/50 text-[#d4af37] border-b border-[#d4af37]/20">
                  <tr>
                    <th className="p-2">Tahun</th>
                    <th className="p-2">Kelas</th>
                    <th className="p-2">Nadzhom</th>
                    <th className="p-2 w-20">Target</th>
                    <th className="p-2 w-16">Total</th>
                    <th className="p-2 w-16">Pa</th>
                    <th className="p-2 w-16">Pi</th>
                    <th className="p-2 w-16">Jayyid</th>
                    <th className="p-2 w-16">Mtw</th>
                    <th className="p-2 w-16">Rodi</th>
                    <th className="p-2 w-20">Lulus %</th>
                    <th className="p-2">Keterangan</th>
                    <th className="p-2 w-12 text-center">Hapus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {draft.muhafadzohRekapRows.map((row, idx) => (
                    <tr key={row.id}>
                      <td className="p-1.5">
                        <input
                          type="text"
                          value={row.tahunAjaran}
                          onChange={(e) => {
                            const next = [...draft.muhafadzohRekapRows];
                            next[idx] = { ...row, tahunAjaran: e.target.value };
                            setDraft({ ...draft, muhafadzohRekapRows: next });
                          }}
                          className="w-24 px-2 py-1 rounded bg-[#052216] border border-white/15 text-white font-mono text-xs"
                        />
                      </td>
                      <td className="p-1.5">
                        <select
                          value={row.kelas}
                          onChange={(e) => {
                            const next = [...draft.muhafadzohRekapRows];
                            next[idx] = { ...row, kelas: e.target.value };
                            setDraft({ ...draft, muhafadzohRekapRows: next });
                          }}
                          className="px-2 py-1 rounded bg-[#052216] border border-white/15 text-white text-xs"
                        >
                          {KELAS_MADRASAH_LIST.map((k) => (
                            <option key={k} value={k}>{k}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-1.5">
                        <input
                          type="text"
                          value={row.namaNadzhom}
                          onChange={(e) => {
                            const next = [...draft.muhafadzohRekapRows];
                            next[idx] = { ...row, namaNadzhom: e.target.value };
                            setDraft({ ...draft, muhafadzohRekapRows: next });
                          }}
                          className="w-40 px-2 py-1 rounded bg-[#052216] border border-white/15 text-white text-xs"
                        />
                      </td>
                      {(
                        [
                          ['targetBait', row.targetBait],
                          ['totalSantri', row.totalSantri],
                          ['putra', row.putra],
                          ['putri', row.putri],
                          ['jayyid', row.jayyid],
                          ['mutawasit', row.mutawasit],
                          ['rodi', row.rodi],
                          ['persentaseLulus', row.persentaseLulus]
                        ] as const
                      ).map(([field, val]) => (
                        <td key={field} className="p-1.5">
                          <input
                            type="number"
                            step={field === 'persentaseLulus' ? '0.1' : '1'}
                            value={val}
                            onChange={(e) => {
                              const next = [...draft.muhafadzohRekapRows];
                              next[idx] = { ...row, [field]: Number(e.target.value) || 0 };
                              setDraft({ ...draft, muhafadzohRekapRows: next });
                            }}
                            className="w-16 px-1.5 py-1 rounded bg-[#052216] border border-white/15 text-white font-mono tabular-nums text-xs"
                          />
                        </td>
                      ))}
                      <td className="p-1.5">
                        <input
                          type="text"
                          value={row.keterangan || ''}
                          onChange={(e) => {
                            const next = [...draft.muhafadzohRekapRows];
                            next[idx] = { ...row, keterangan: e.target.value };
                            setDraft({ ...draft, muhafadzohRekapRows: next });
                          }}
                          className="w-36 px-2 py-1 rounded bg-[#052216] border border-white/15 text-white text-xs"
                        />
                      </td>
                      <td className="p-1.5 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            setDraft({
                              ...draft,
                              muhafadzohRekapRows: draft.muhafadzohRekapRows.filter(
                                (r) => r.id !== row.id
                              )
                            })
                          }
                          className="p-1.5 rounded bg-red-950/70 hover:bg-red-800 text-red-300 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 1C: Editable Peringkat Angkatan Sepanjang Masa */}
          <div className="bg-[#03140c] border border-[#d4af37]/25 rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h5 className="text-xs font-black text-[#f5e298] uppercase tracking-wide">
                  Peringkat Angkatan Sepanjang Masa (Khusus Per Angkatan)
                </h5>
                <p className="text-[11px] text-zinc-400">
                  Hanya menampilkan peringkat kolektif per angkatan (tanpa peringkat perorangan). Seluruh kolom dapat diedit langsung di sini.
                </p>
              </div>
              <button
                type="button"
                onClick={addAngkatanRow}
                className="px-3 py-1.5 rounded-lg bg-[#0b3824] hover:bg-[#104d32] border border-[#d4af37]/40 text-xs font-bold text-[#f5e298] inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Angkatan</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left min-w-[960px]">
                <thead className="bg-black/50 text-[#d4af37] border-b border-[#d4af37]/20">
                  <tr>
                    <th className="p-2">Angkatan</th>
                    <th className="p-2">Kelas</th>
                    <th className="p-2">Tahun</th>
                    <th className="p-2">Nadzhom</th>
                    <th className="p-2 w-16">Santri</th>
                    <th className="p-2 w-20">Rata Bait</th>
                    <th className="p-2 w-20">Capaian %</th>
                    <th className="p-2">Gelar Prestasi</th>
                    <th className="p-2">Catatan</th>
                    <th className="p-2 w-12 text-center">Hapus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {draft.muhafadzohAngkatanRanking.map((row, idx) => (
                    <tr key={row.id}>
                      <td className="p-1.5">
                        <input
                          type="text"
                          value={row.angkatan}
                          onChange={(e) => {
                            const next = [...draft.muhafadzohAngkatanRanking];
                            next[idx] = { ...row, angkatan: e.target.value };
                            setDraft({ ...draft, muhafadzohAngkatanRanking: next });
                          }}
                          className="w-28 px-2 py-1 rounded bg-[#052216] border border-white/15 text-white text-xs font-bold"
                        />
                      </td>
                      <td className="p-1.5">
                        <select
                          value={row.kelas}
                          onChange={(e) => {
                            const next = [...draft.muhafadzohAngkatanRanking];
                            next[idx] = { ...row, kelas: e.target.value };
                            setDraft({ ...draft, muhafadzohAngkatanRanking: next });
                          }}
                          className="px-2 py-1 rounded bg-[#052216] border border-white/15 text-white text-xs"
                        >
                          {KELAS_MADRASAH_LIST.map((k) => (
                            <option key={k} value={k}>{k}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-1.5">
                        <input
                          type="text"
                          value={row.tahunAjaran}
                          onChange={(e) => {
                            const next = [...draft.muhafadzohAngkatanRanking];
                            next[idx] = { ...row, tahunAjaran: e.target.value };
                            setDraft({ ...draft, muhafadzohAngkatanRanking: next });
                          }}
                          className="w-24 px-2 py-1 rounded bg-[#052216] border border-white/15 text-white font-mono text-xs"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="text"
                          value={row.namaNadzhom}
                          onChange={(e) => {
                            const next = [...draft.muhafadzohAngkatanRanking];
                            next[idx] = { ...row, namaNadzhom: e.target.value };
                            setDraft({ ...draft, muhafadzohAngkatanRanking: next });
                          }}
                          className="w-36 px-2 py-1 rounded bg-[#052216] border border-white/15 text-white text-xs"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="number"
                          value={row.totalSantri}
                          onChange={(e) => {
                            const next = [...draft.muhafadzohAngkatanRanking];
                            next[idx] = { ...row, totalSantri: Number(e.target.value) || 0 };
                            setDraft({ ...draft, muhafadzohAngkatanRanking: next });
                          }}
                          className="w-16 px-1.5 py-1 rounded bg-[#052216] border border-white/15 text-white font-mono tabular-nums text-xs"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="number"
                          value={row.rataRataHafalan}
                          onChange={(e) => {
                            const next = [...draft.muhafadzohAngkatanRanking];
                            next[idx] = { ...row, rataRataHafalan: Number(e.target.value) || 0 };
                            setDraft({ ...draft, muhafadzohAngkatanRanking: next });
                          }}
                          className="w-20 px-1.5 py-1 rounded bg-[#052216] border border-white/15 text-emerald-300 font-mono tabular-nums text-xs"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="number"
                          step="0.1"
                          value={row.persentaseCapaian}
                          onChange={(e) => {
                            const next = [...draft.muhafadzohAngkatanRanking];
                            next[idx] = { ...row, persentaseCapaian: Number(e.target.value) || 0 };
                            setDraft({ ...draft, muhafadzohAngkatanRanking: next });
                          }}
                          className="w-20 px-1.5 py-1 rounded bg-[#052216] border border-white/15 text-[#f5e298] font-mono tabular-nums font-bold text-xs"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="text"
                          value={row.gelarPrestasi}
                          onChange={(e) => {
                            const next = [...draft.muhafadzohAngkatanRanking];
                            next[idx] = { ...row, gelarPrestasi: e.target.value };
                            setDraft({ ...draft, muhafadzohAngkatanRanking: next });
                          }}
                          className="w-40 px-2 py-1 rounded bg-[#052216] border border-white/15 text-white text-xs"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="text"
                          value={row.catatan || ''}
                          onChange={(e) => {
                            const next = [...draft.muhafadzohAngkatanRanking];
                            next[idx] = { ...row, catatan: e.target.value };
                            setDraft({ ...draft, muhafadzohAngkatanRanking: next });
                          }}
                          className="w-36 px-2 py-1 rounded bg-[#052216] border border-white/15 text-white text-xs"
                        />
                      </td>
                      <td className="p-1.5 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            setDraft({
                              ...draft,
                              muhafadzohAngkatanRanking: draft.muhafadzohAngkatanRanking.filter(
                                (r) => r.id !== row.id
                              )
                            })
                          }
                          className="p-1.5 rounded bg-red-950/70 hover:bg-red-800 text-red-300 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* ================================================================= */}
      {/* SUBTAB 2: BACA KITAB */}
      {/* ================================================================= */}
      {subTab === 'baca_kitab' && (
        <div className="space-y-5">
          <div className="bg-[#03140c] border border-blue-500/30 rounded-xl p-4 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h5 className="text-xs font-black text-blue-300 uppercase tracking-wide">
                  Standar Nilai Rata-Rata (KKM) Ujian Baca Kitab
                </h5>
                <p className="text-[11px] text-zinc-400">
                  Santri yang memperoleh nilai Baca Kitab di bawah standar rata-rata kelas otomatis masuk daftar Surat Takziran Baca Kitab.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-zinc-300 font-semibold">Standar Global:</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={draft.bacaKitabRataRataGlobal}
                  onChange={(e) =>
                    setDraft({ ...draft, bacaKitabRataRataGlobal: Number(e.target.value) || 0 })
                  }
                  className="w-20 px-2.5 py-1.5 rounded-lg bg-[#052216] border border-blue-500/40 text-blue-200 font-mono tabular-nums font-bold text-xs"
                />
                <button
                  type="button"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      bacaKitabPerKelas: draft.bacaKitabPerKelas.map((item) => ({
                        ...item,
                        nilaiRataRataMinimal: draft.bacaKitabRataRataGlobal
                      }))
                    })
                  }
                  className="px-3 py-1.5 rounded-lg bg-blue-900/60 hover:bg-blue-800 border border-blue-500/40 text-xs font-bold text-blue-100 cursor-pointer"
                >
                  Terapkan ke Semua Kelas
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left min-w-[650px]">
                <thead className="bg-black/50 text-blue-300 border-b border-blue-500/20">
                  <tr>
                    <th className="p-2.5">Kelas</th>
                    <th className="p-2.5">Kitab Bacaan Standar</th>
                    <th className="p-2.5 w-44">Nilai Rata-Rata Minimal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {draft.bacaKitabPerKelas.map((row, idx) => (
                    <tr key={row.kelas}>
                      <td className="p-2 font-bold text-emerald-300">{row.kelas}</td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.kitabStandar}
                          onChange={(e) => {
                            const next = [...draft.bacaKitabPerKelas];
                            next[idx] = { ...row, kitabStandar: e.target.value };
                            setDraft({ ...draft, bacaKitabPerKelas: next });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#052216] border border-blue-500/30 text-white text-xs"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={row.nilaiRataRataMinimal}
                          onChange={(e) => {
                            const next = [...draft.bacaKitabPerKelas];
                            next[idx] = { ...row, nilaiRataRataMinimal: Number(e.target.value) || 0 };
                            setDraft({ ...draft, bacaKitabPerKelas: next });
                          }}
                          className="w-28 px-2.5 py-1.5 rounded-lg bg-[#052216] border border-blue-500/30 text-blue-200 font-mono tabular-nums font-bold text-xs"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SUBTAB 3: KOREKSIAN KITAB & BATAS MATERI (KONEK KURIKULUM) */}
      {/* ================================================================= */}
      {subTab === 'koreksian' && (
        <div className="bg-[#03140c] border border-amber-500/30 rounded-xl p-4 space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <h5 className="text-xs font-black text-amber-300 uppercase tracking-wide">
                Tabel Batas Materi Koreksian Per Kelas (Terkoneksi Tabel Kurikulum)
              </h5>
              <p className="text-[11px] text-zinc-400">
                Pelajaran & jenis kitab diambil otomatis dari Tabel Kurikulum. Atur Mulai Materi & Batas Akhir per kelas di sini.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSyncKoreksianFromKurikulum}
                className="px-3 py-1.5 rounded-lg bg-amber-900/60 hover:bg-amber-800 border border-amber-500/40 text-amber-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sinkron dari Tabel Kurikulum ({kurikulumList.length})</span>
              </button>

              <button
                type="button"
                onClick={() => addKoreksianMateriRow(selectedKoreksianKelas)}
                className="px-3 py-1.5 rounded-lg bg-[#0b3824] hover:bg-[#104d32] border border-[#d4af37]/40 text-[#f5e298] text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Baris ({selectedKoreksianKelas})</span>
              </button>
            </div>
          </div>

          {/* Filter Pilih Kelas */}
          <div className="flex flex-wrap gap-1.5">
            {KELAS_MADRASAH_LIST.map((kelasName) => (
              <button
                key={kelasName}
                type="button"
                onClick={() => setSelectedKoreksianKelas(kelasName)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${
                  selectedKoreksianKelas === kelasName
                    ? 'bg-amber-500 text-black'
                    : 'bg-black/40 text-zinc-300 border border-white/10 hover:text-white'
                }`}
              >
                {kelasName}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left min-w-[760px]">
              <thead className="bg-black/50 text-amber-300 border-b border-amber-500/20">
                <tr>
                  <th className="p-2.5 w-16 text-center">No</th>
                  <th className="p-2.5">Pelajaran & Kitab (Kurikulum)</th>
                  <th className="p-2.5">Mulai Materi</th>
                  <th className="p-2.5">Batas Akhir</th>
                  <th className="p-2.5 w-14 text-center">Hapus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {draft.koreksianBatasMateri
                  .filter((r) => r.kelas === selectedKoreksianKelas)
                  .map((row, idx) => (
                    <tr key={row.id}>
                      <td className="p-2 text-center font-mono tabular-nums font-bold text-amber-300">
                        <input
                          type="number"
                          min={1}
                          value={row.no}
                          onChange={(e) => {
                            const next = draft.koreksianBatasMateri.map((m) =>
                              m.id === row.id ? { ...m, no: Number(e.target.value) || idx + 1 } : m
                            );
                            setDraft({ ...draft, koreksianBatasMateri: next });
                          }}
                          className="w-12 px-1.5 py-1 text-center rounded bg-[#052216] border border-white/15 text-amber-300 font-mono text-xs"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.pelajaran}
                          onChange={(e) => {
                            const next = draft.koreksianBatasMateri.map((m) =>
                              m.id === row.id ? { ...m, pelajaran: e.target.value } : m
                            );
                            setDraft({ ...draft, koreksianBatasMateri: next });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#052216] border border-amber-500/30 text-white text-xs font-semibold"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.mulaiMateri}
                          onChange={(e) => {
                            const next = draft.koreksianBatasMateri.map((m) =>
                              m.id === row.id ? { ...m, mulaiMateri: e.target.value } : m
                            );
                            setDraft({ ...draft, koreksianBatasMateri: next });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#052216] border border-amber-500/30 text-white text-xs"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.batasAkhir}
                          onChange={(e) => {
                            const next = draft.koreksianBatasMateri.map((m) =>
                              m.id === row.id ? { ...m, batasAkhir: e.target.value } : m
                            );
                            setDraft({ ...draft, koreksianBatasMateri: next });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#052216] border border-amber-500/30 text-emerald-200 text-xs"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            setDraft({
                              ...draft,
                              koreksianBatasMateri: draft.koreksianBatasMateri.filter(
                                (m) => m.id !== row.id
                              )
                            })
                          }
                          className="p-1.5 rounded bg-red-950/70 hover:bg-red-800 text-red-300 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SUBTAB 4: PENGATURAN SURAT & ATURAN TAKZIRAN UJIAN */}
      {/* ================================================================= */}
      {subTab === 'takziran' && (
        <div className="bg-[#03140c] border border-red-500/30 rounded-xl p-4 space-y-4">
          <h5 className="text-xs font-black text-red-300 uppercase tracking-wide">
            Aturan Batas Pengumpulan, Eskalasi Tingkatan, & Template Surat Takziran Ujian
          </h5>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] text-zinc-300 mb-1 font-semibold">
                Durasi Batas Pengumpulan (Hari):
              </label>
              <input
                type="number"
                min={1}
                value={draft.takziranSettings.durasiPengumpulanHari}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    takziranSettings: {
                      ...draft.takziranSettings,
                      durasiPengumpulanHari: Number(e.target.value) || 3
                    }
                  })
                }
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#052216] border border-white/20 text-white font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] text-zinc-300 mb-1 font-semibold">
                Atau Tanggal Batas Default (Opsional):
              </label>
              <input
                type="date"
                value={draft.takziranSettings.tanggalBatasDefault || ''}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    takziranSettings: {
                      ...draft.takziranSettings,
                      tanggalBatasDefault: e.target.value
                    }
                  })
                }
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#052216] border border-white/20 text-white font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] text-zinc-300 mb-1 font-semibold">
                Tingkatan Awal Surat:
              </label>
              <select
                value={draft.takziranSettings.tingkatAwal}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    takziranSettings: {
                      ...draft.takziranSettings,
                      tingkatAwal: e.target.value as 'Ringan' | 'Sedang' | 'Berat'
                    }
                  })
                }
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#052216] border border-white/20 text-white text-xs"
              >
                <option value="Ringan">Ringan</option>
                <option value="Sedang">Sedang</option>
                <option value="Berat">Berat</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-zinc-300 mb-1 font-semibold">
                Naik Tingkatan Jika Melewati Batas:
              </label>
              <select
                value={draft.takziranSettings.tingkatJikaTerlambat}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    takziranSettings: {
                      ...draft.takziranSettings,
                      tingkatJikaTerlambat: e.target.value as 'Sedang' | 'Berat'
                    }
                  })
                }
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#052216] border border-red-500/40 text-red-200 text-xs font-bold"
              >
                <option value="Sedang">Sedang</option>
                <option value="Berat">Berat</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-zinc-300 mb-1 font-semibold">Nama Lembaga (Kop Baris 1):</label>
              <input
                type="text"
                value={draft.takziranSettings.namaLembaga}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    takziranSettings: { ...draft.takziranSettings, namaLembaga: e.target.value }
                  })
                }
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#052216] border border-white/20 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] text-zinc-300 mb-1 font-semibold">Nama Madrasah (Kop Baris 2):</label>
              <input
                type="text"
                value={draft.takziranSettings.namaMadrasah}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    takziranSettings: { ...draft.takziranSettings, namaMadrasah: e.target.value }
                  })
                }
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#052216] border border-white/20 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] text-zinc-300 mb-1 font-semibold">Format Nomor Surat:</label>
              <input
                type="text"
                value={draft.takziranSettings.formatNomorSurat}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    takziranSettings: { ...draft.takziranSettings, formatNomorSurat: e.target.value }
                  })
                }
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#052216] border border-white/20 text-white font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] text-zinc-300 mb-1 font-semibold">Judul Surat Takziran:</label>
              <input
                type="text"
                value={draft.takziranSettings.judulSurat}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    takziranSettings: { ...draft.takziranSettings, judulSurat: e.target.value }
                  })
                }
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#052216] border border-white/20 text-white text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-zinc-300 mb-1 font-semibold">Ketentuan Her Muhafadzoh:</label>
              <textarea
                rows={3}
                value={draft.takziranSettings.ketentuanTakziranMuhafadzoh}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    takziranSettings: {
                      ...draft.takziranSettings,
                      ketentuanTakziranMuhafadzoh: e.target.value
                    }
                  })
                }
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#052216] border border-white/20 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] text-zinc-300 mb-1 font-semibold">Ketentuan Takziran Baca Kitab:</label>
              <textarea
                rows={3}
                value={draft.takziranSettings.ketentuanTakziranBacaKitab}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    takziranSettings: {
                      ...draft.takziranSettings,
                      ketentuanTakziranBacaKitab: e.target.value
                    }
                  })
                }
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#052216] border border-white/20 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] text-zinc-300 mb-1 font-semibold">Ketentuan Her Koreksian Kitab:</label>
              <textarea
                rows={3}
                value={draft.takziranSettings.ketentuanTakziranKoreksian}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    takziranSettings: {
                      ...draft.takziranSettings,
                      ketentuanTakziranKoreksian: e.target.value
                    }
                  })
                }
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#052216] border border-white/20 text-white text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-red-300 mb-1 font-semibold">
              Teks Peringatan Kartu Tidak Berlaku & Naik Tingkatan (pada Surat Cetak):
            </label>
            <textarea
              rows={2}
              value={draft.takziranSettings.isiPeringatanBatasAkhir}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  takziranSettings: {
                    ...draft.takziranSettings,
                    isiPeringatanBatasAkhir: e.target.value
                  }
                })
              }
              className="w-full px-2.5 py-1.5 rounded-lg bg-[#052216] border border-red-500/30 text-red-100 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-zinc-300 mb-1">Penandatangan 1 ({draft.takziranSettings.jabatanPenandatangan1}):</label>
              <input
                type="text"
                value={draft.takziranSettings.namaPenandatangan1}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    takziranSettings: { ...draft.takziranSettings, namaPenandatangan1: e.target.value }
                  })
                }
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#052216] border border-white/20 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] text-zinc-300 mb-1">Penandatangan 2 ({draft.takziranSettings.jabatanPenandatangan2}):</label>
              <input
                type="text"
                value={draft.takziranSettings.namaPenandatangan2}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    takziranSettings: { ...draft.takziranSettings, namaPenandatangan2: e.target.value }
                  })
                }
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#052216] border border-white/20 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] text-zinc-300 mb-1">Penandatangan 3 ({draft.takziranSettings.jabatanPenandatangan3}):</label>
              <input
                type="text"
                value={draft.takziranSettings.namaPenandatangan3}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    takziranSettings: { ...draft.takziranSettings, namaPenandatangan3: e.target.value }
                  })
                }
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#052216] border border-white/20 text-white text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SUBTAB 5: INPUT NILAI INDIVIDUAL (SINKRON WALI SANTRI) */}
      {/* ================================================================= */}
      {subTab === 'wali_sync' && (
        <div className="space-y-4">
          <div className="bg-[#03140c] p-4 rounded-xl border border-[#d4af37]/20 space-y-2">
            <label className="text-xs font-bold text-[#d4af37] block">
              Pilih Santri Target Penilaian:
            </label>
            <select
              value={selectedUjianSantriId}
              onChange={(e) => setSelectedUjianSantriId(e.target.value)}
              className="w-full bg-[#052216] border border-[#d4af37]/40 rounded-xl p-2.5 text-xs text-white"
            >
              {santriList.map((s, idx) => (
                <option key={`${s.id}-${idx}`} value={s.id}>
                  {s.nama} ({s.id} — {s.kelas})
                </option>
              ))}
            </select>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!currentUjianSantri) return;
              const updatedSantri: Santri = {
                ...currentUjianSantri,
                nilaiKoreksianKitab: Number(ujianKitabForm.nilaiKoreksianKitab),
                predikatKoreksianKitab: ujianKitabForm.predikatKoreksianKitab,
                kitabKoreksian: ujianKitabForm.kitabKoreksian,
                nilaiMuhafadzoh: Number(ujianKitabForm.nilaiMuhafadzoh),
                predikatMuhafadzoh: ujianKitabForm.predikatMuhafadzoh,
                kitabMuhafadzoh: ujianKitabForm.kitabMuhafadzoh,
                nilaiBacaKitab: Number(ujianKitabForm.nilaiBacaKitab),
                predikatBacaKitab: ujianKitabForm.predikatBacaKitab,
                kitabBaca: ujianKitabForm.kitabBaca,
                ustadzPengujiKitab: ujianKitabForm.ustadzPenguji,
                tanggalUjianKitab: ujianKitabForm.tanggalUjian,
                catatanUjianKitab: ujianKitabForm.catatanKoreksianKitab
              };

              if (onUpdateSantriProfile) {
                onUpdateSantriProfile(updatedSantri);
              }
              if (onSaveUjianSantri) {
                onSaveUjianSantri({
                  id: `UJN-${Date.now().toString().slice(-4)}`,
                  idSantri: currentUjianSantri.id,
                  namaSantri: currentUjianSantri.nama,
                  kelas: currentUjianSantri.kelas,
                  semester: settings.semester_aktif || 'Semester Ganjil 2026/2027',
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
                });
              }

              setSaveNotice(
                `Nilai Ujian ${currentUjianSantri.nama} berhasil diperbarui & tersinkron ke Dashboard Wali Santri.`
              );
              setTimeout(() => setSaveNotice(null), 5000);
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#03140c] p-4 rounded-xl border border-[#d4af37]/20">
              <div>
                <label className="text-xs font-bold text-white block mb-1">Ustadz Penguji:</label>
                <input
                  type="text"
                  value={ujianKitabForm.ustadzPenguji}
                  onChange={(e) => setUjianKitabForm({ ...ujianKitabForm, ustadzPenguji: e.target.value })}
                  className="w-full bg-[#02180e] border border-[#d4af37]/40 rounded-xl p-2 text-xs text-white"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-white block mb-1">Tanggal Ujian:</label>
                <input
                  type="date"
                  value={ujianKitabForm.tanggalUjian}
                  onChange={(e) => setUjianKitabForm({ ...ujianKitabForm, tanggalUjian: e.target.value })}
                  className="w-full bg-[#02180e] border border-[#d4af37]/40 rounded-xl p-2 text-xs text-white"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#031f13] border border-[#d4af37]/40 rounded-xl p-4 space-y-2.5">
                <div className="text-[#d4af37] font-bold text-xs">1. Nilai Koreksian Kitab</div>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={ujianKitabForm.nilaiKoreksianKitab}
                  onChange={(e) =>
                    setUjianKitabForm({ ...ujianKitabForm, nilaiKoreksianKitab: Number(e.target.value) })
                  }
                  className="w-full bg-[#02180e] border border-[#d4af37]/40 rounded-lg p-2 text-xs text-[#d4af37] font-mono font-bold"
                />
                <input
                  type="text"
                  value={ujianKitabForm.predikatKoreksianKitab}
                  onChange={(e) =>
                    setUjianKitabForm({ ...ujianKitabForm, predikatKoreksianKitab: e.target.value })
                  }
                  className="w-full bg-[#02180e] border border-[#d4af37]/40 rounded-lg p-2 text-xs text-white"
                />
                <input
                  type="text"
                  value={ujianKitabForm.kitabKoreksian}
                  onChange={(e) =>
                    setUjianKitabForm({ ...ujianKitabForm, kitabKoreksian: e.target.value })
                  }
                  className="w-full bg-[#02180e] border border-[#d4af37]/40 rounded-lg p-2 text-xs text-white"
                />
              </div>

              <div className="bg-[#031f13] border border-emerald-500/40 rounded-xl p-4 space-y-2.5">
                <div className="text-emerald-300 font-bold text-xs">2. Nilai Muhafadzoh</div>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={ujianKitabForm.nilaiMuhafadzoh}
                  onChange={(e) =>
                    setUjianKitabForm({ ...ujianKitabForm, nilaiMuhafadzoh: Number(e.target.value) })
                  }
                  className="w-full bg-[#02180e] border border-emerald-500/40 rounded-lg p-2 text-xs text-emerald-300 font-mono font-bold"
                />
                <input
                  type="text"
                  value={ujianKitabForm.predikatMuhafadzoh}
                  onChange={(e) =>
                    setUjianKitabForm({ ...ujianKitabForm, predikatMuhafadzoh: e.target.value })
                  }
                  className="w-full bg-[#02180e] border border-emerald-500/40 rounded-lg p-2 text-xs text-white"
                />
                <input
                  type="text"
                  value={ujianKitabForm.kitabMuhafadzoh}
                  onChange={(e) =>
                    setUjianKitabForm({ ...ujianKitabForm, kitabMuhafadzoh: e.target.value })
                  }
                  className="w-full bg-[#02180e] border border-emerald-500/40 rounded-lg p-2 text-xs text-white"
                />
              </div>

              <div className="bg-[#031f13] border border-blue-500/40 rounded-xl p-4 space-y-2.5">
                <div className="text-blue-300 font-bold text-xs">3. Nilai Baca Kitab</div>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={ujianKitabForm.nilaiBacaKitab}
                  onChange={(e) =>
                    setUjianKitabForm({ ...ujianKitabForm, nilaiBacaKitab: Number(e.target.value) })
                  }
                  className="w-full bg-[#02180e] border border-blue-500/40 rounded-lg p-2 text-xs text-blue-300 font-mono font-bold"
                />
                <input
                  type="text"
                  value={ujianKitabForm.predikatBacaKitab}
                  onChange={(e) =>
                    setUjianKitabForm({ ...ujianKitabForm, predikatBacaKitab: e.target.value })
                  }
                  className="w-full bg-[#02180e] border border-blue-500/40 rounded-lg p-2 text-xs text-white"
                />
                <input
                  type="text"
                  value={ujianKitabForm.kitabBaca}
                  onChange={(e) =>
                    setUjianKitabForm({ ...ujianKitabForm, kitabBaca: e.target.value })
                  }
                  className="w-full bg-[#02180e] border border-blue-500/40 rounded-lg p-2 text-xs text-white"
                />
              </div>
            </div>

            <div className="text-right">
              <button type="submit" className="btn-3d-gold text-black inline-flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-black" />
                <span>Simpan Nilai Santri ke Wali Santri</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
