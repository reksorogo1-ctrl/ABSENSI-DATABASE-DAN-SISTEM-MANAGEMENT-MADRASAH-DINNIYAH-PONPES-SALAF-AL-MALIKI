import React, { useState } from 'react';
import { X, Award, BookOpen, CheckSquare, Save, User, Calendar, Sliders } from 'lucide-react';
import { Santri } from '../types';

interface ModalInputNilaiUjianProps {
  isOpen: boolean;
  onClose: () => void;
  santri: Santri;
  type?: 'muhafadzoh' | 'baca' | 'koreksian' | 'all';
  onSave: (updatedSantri: Santri) => void;
  onNotify?: (message: string) => void;
}

const NADZHOM_OPTIONS = [
  'NADZHOM IMRITHI',
  'NADZHOM ALFIYAH (JILID 1)',
  'NADZHOM ALFIYAH (JILID 2)',
  'NADZHOM ALFIYAH (KHATAM)',
  'NADZHOM AQIDATUL AWAM',
  'NADZHOM MAQSUD',
  'NADZHOM ROISYIYAH',
  'NADZHOM JAUHARATUT TAUHID',
  'NADZHOM HIDAYATUS SHIBYAN'
];

const KITAB_BACA_OPTIONS = [
  'Fathul Qorib (Bab Sholat & Thoharoh)',
  'Fathul Qorib (Bab Muamalah & Nikah)',
  'Fathul Mu\'in (Syarah Qurratil Ain)',
  'Safinatun Naja (Fiqih Dasar)',
  'Matan Al-Ghayah wat Taqrib (Abu Syuja\')',
  'Matan Al-Jurumiyah (Nahwu Dasar)'
];

const KITAB_KOREKSIAN_OPTIONS = [
  'Fathul Qorib Bab Sholat (Makna Gandul Pegon)',
  'Matan Al-Imrithi Pegon (Lengkap)',
  'Matan Al-Jurumiyah Pegon',
  'Alfiyah Ibnu Malik Makna Pegon',
  'Safinatun Naja Makna Gandul'
];

const TAHUN_AJARAN_OPTIONS = [
  '2026/2027',
  '2025/2026',
  '2024/2025',
  '2023/2024'
];

export const ModalInputNilaiUjian: React.FC<ModalInputNilaiUjianProps> = ({
  isOpen,
  onClose,
  santri,
  type = 'all',
  onSave,
  onNotify
}) => {
  if (!isOpen) return null;

  // Form states
  const [activeTabType, setActiveTabType] = useState<'muhafadzoh' | 'baca' | 'koreksian' | 'all'>(type);
  
  // Nilai Muhafadzoh
  const [nilaiMuhafadzoh, setNilaiMuhafadzoh] = useState<number>(Number(santri.nilaiMuhafadzoh ?? 92));
  const [kitabMuhafadzoh, setKitabMuhafadzoh] = useState<string>(santri.kitabMuhafadzoh || 'NADZHOM IMRITHI');
  const [predikatMuhafadzoh, setPredikatMuhafadzoh] = useState<string>(santri.predikatMuhafadzoh || 'Mumtaz (Hafal Mutqin)');
  const [kategoriMhf, setKategoriMhf] = useState<'JAYYID' | 'MUTAWASIT' | 'RODI'>(
    santri.kategoriMhf || (Number(santri.nilaiMuhafadzoh ?? 92) >= 85 ? 'JAYYID' : Number(santri.nilaiMuhafadzoh ?? 92) >= 70 ? 'MUTAWASIT' : 'RODI')
  );

  // Nilai Baca Kitab
  const [nilaiBacaKitab, setNilaiBacaKitab] = useState<number>(Number(santri.nilaiBacaKitab ?? 88));
  const [kitabBaca, setKitabBaca] = useState<string>(santri.kitabBaca || 'Fathul Qorib (Bab Sholat & Thoharoh)');
  const [predikatBacaKitab, setPredikatBacaKitab] = useState<string>(santri.predikatBacaKitab || 'Jayyid Jiddan (Fashih & Paham Tarkib)');

  // Nilai Koreksian Kitab
  const [nilaiKoreksianKitab, setNilaiKoreksianKitab] = useState<number>(Number(santri.nilaiKoreksianKitab ?? 90));
  const [kitabKoreksian, setKitabKoreksian] = useState<string>(santri.kitabKoreksian || 'Fathul Qorib Bab Sholat (Makna Gandul Pegon)');
  const [predikatKoreksianKitab, setPredikatKoreksianKitab] = useState<string>(santri.predikatKoreksianKitab || 'Mumtaz (Makna Gandul Sah & Lengkap)');

  // Metadata
  const [tahunAjaran, setTahunAjaran] = useState<string>(santri.tahunAjaranAktif || santri.tahunAjaran || '2026/2027');
  const [ustadzPenguji, setUstadzPenguji] = useState<string>(santri.ustadzPengujiKitab || 'Ust. Muhammad Ilyas Al-Hafidz');
  const [tanggalUjian, setTanggalUjian] = useState<string>(santri.tanggalUjianKitab || new Date().toISOString().split('T')[0]);
  const [catatanUjian, setCatatanUjian] = useState<string>(santri.catatanUjianKitab || 'Penguasaan materi baik, mutaba\'ah mutqin.');

  // Handle Score Change & Auto Kategori
  const handleScoreMuhafadzohChange = (val: number) => {
    setNilaiMuhafadzoh(val);
    if (val >= 85) {
      setKategoriMhf('JAYYID');
      setPredikatMuhafadzoh('Mumtaz (Hafal Mutqin)');
    } else if (val >= 70) {
      setKategoriMhf('MUTAWASIT');
      setPredikatMuhafadzoh('Jayyid (Lancar)');
    } else {
      setKategoriMhf('RODI');
      setPredikatMuhafadzoh('Rodi (Perlu Ditingkatkan / Remedi)');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedSantri: Santri = {
      ...santri,
      nilaiMuhafadzoh: Number(nilaiMuhafadzoh),
      kitabMuhafadzoh,
      predikatMuhafadzoh,
      kategoriMhf,

      nilaiBacaKitab: Number(nilaiBacaKitab),
      kitabBaca,
      predikatBacaKitab,

      nilaiKoreksianKitab: Number(nilaiKoreksianKitab),
      kitabKoreksian,
      predikatKoreksianKitab,

      tahunAjaran,
      tahunAjaranAktif: tahunAjaran,
      ustadzPengujiKitab: ustadzPenguji.trim(),
      tanggalUjianKitab: tanggalUjian,
      catatanUjianKitab: catatanUjian.trim()
    };

    onSave(updatedSantri);
    if (onNotify) {
      onNotify(`Nilai ujian santri ${santri.nama} (${santri.id}) berhasil diperbarui dan tersinkronisasi.`);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[10003] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl my-auto rounded-3xl bg-gradient-to-b from-[#062417] via-[#041a10] to-[#020d08] border-2 border-[#d4af37]/60 shadow-[0_20px_60px_rgba(0,0,0,0.9)] text-white overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="relative px-6 py-4 bg-gradient-to-r from-[#0b3320] via-[#062417] to-[#0b3320] border-b border-[#d4af37]/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f5e298] via-[#d4af37] to-[#7a5410] flex items-center justify-center text-black shadow-lg">
              <Award className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#f5e298] text-gold-3d tracking-wide">
                Input / Edit Nilai Ujian Santri
              </h3>
              <p className="text-xs text-emerald-300 font-mono">
                {santri.nama} • NIS: <span className="font-bold text-[#d4af37]">{santri.id}</span> ({santri.kelas})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-black/50 border border-white/20 text-zinc-400 hover:text-white flex items-center justify-center hover:bg-red-950 hover:border-red-500/50 transition cursor-pointer"
            title="Tutup Form"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* TAB SWITCHER DI DALAM MODAL */}
        <div className="flex border-b border-[#d4af37]/25 bg-[#03150c] p-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTabType('muhafadzoh')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTabType === 'muhafadzoh' || activeTabType === 'all'
                ? 'bg-[#d4af37] text-black shadow'
                : 'text-zinc-400 hover:text-white bg-black/40'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>1. Muhafadzoh</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTabType('baca')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTabType === 'baca'
                ? 'bg-blue-500 text-white shadow'
                : 'text-zinc-400 hover:text-white bg-black/40'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>2. Baca Kitab</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTabType('koreksian')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTabType === 'koreksian'
                ? 'bg-amber-600 text-white shadow'
                : 'text-zinc-400 hover:text-white bg-black/40'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>3. Koreksian Kitab</span>
          </button>
        </div>

        {/* FORM BODY */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[72vh] overflow-y-auto">

          {/* TAB 1: MUHAFADZOH FIELDS */}
          {(activeTabType === 'muhafadzoh' || activeTabType === 'all') && (
            <div className="p-4 rounded-2xl bg-[#03170e] border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5 uppercase">
                  <Award className="w-4 h-4 text-emerald-400" />
                  <span>Penilaian Ujian Muhafadzoh Nadzhom</span>
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black font-mono border ${
                  kategoriMhf === 'JAYYID'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                    : kategoriMhf === 'MUTAWASIT'
                    ? 'bg-amber-950 text-amber-300 border-amber-500/50'
                    : 'bg-red-950 text-red-300 border-red-500/50'
                }`}>
                  Kategori: {kategoriMhf}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">Kitab Nadzhom:</label>
                  <select
                    value={kitabMuhafadzoh}
                    onChange={(e) => setKitabMuhafadzoh(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#020e08] border border-[#d4af37]/40 text-white text-xs font-bold focus:outline-none focus:border-[#d4af37]"
                  >
                    {NADZHOM_OPTIONS.map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">Nilai Muhafadzoh (0 - 100):</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={nilaiMuhafadzoh}
                    onChange={(e) => handleScoreMuhafadzohChange(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-[#020e08] border border-emerald-500/40 text-emerald-300 font-mono font-black text-sm focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">Kategori Capaian:</label>
                  <select
                    value={kategoriMhf}
                    onChange={(e) => setKategoriMhf(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#020e08] border border-[#d4af37]/40 text-white text-xs font-bold"
                  >
                    <option value="JAYYID">JAYYID (Sangat Baik / Lulus Prima)</option>
                    <option value="MUTAWASIT">MUTAWASIT (Cukup / Menengah)</option>
                    <option value="RODI">RODI (Kurang / Perlu Bimbingan)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">Predikat Keterangan:</label>
                  <input
                    type="text"
                    value={predikatMuhafadzoh}
                    onChange={(e) => setPredikatMuhafadzoh(e.target.value)}
                    placeholder="Contoh: Mumtaz (Hafal Mutqin)"
                    className="w-full px-3 py-2 rounded-xl bg-[#020e08] border border-[#d4af37]/40 text-white text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BACA KITAB FIELDS */}
          {(activeTabType === 'baca' || activeTabType === 'all') && (
            <div className="p-4 rounded-2xl bg-[#031718] border border-blue-500/30 space-y-3">
              <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5 uppercase">
                <BookOpen className="w-4 h-4 text-blue-400" />
                <span>Penilaian Ujian Baca Kitab (Qira'atul Kutub)</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">Kitab yang Dibaca:</label>
                  <select
                    value={kitabBaca}
                    onChange={(e) => setKitabBaca(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#020e08] border border-blue-500/40 text-white text-xs font-bold"
                  >
                    {KITAB_BACA_OPTIONS.map(k => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">Nilai Baca Kitab (0 - 100):</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={nilaiBacaKitab}
                    onChange={(e) => setNilaiBacaKitab(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-[#020e08] border border-blue-500/40 text-blue-300 font-mono font-black text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">Predikat Baca Kitab:</label>
                <input
                  type="text"
                  value={predikatBacaKitab}
                  onChange={(e) => setPredikatBacaKitab(e.target.value)}
                  placeholder="Contoh: Jayyid Jiddan (Fashih & Paham Tarkib I'rob)"
                  className="w-full px-3 py-2 rounded-xl bg-[#020e08] border border-blue-500/40 text-white text-xs"
                />
              </div>
            </div>
          )}

          {/* TAB 3: KOREKSIAN KITAB FIELDS */}
          {(activeTabType === 'koreksian' || activeTabType === 'all') && (
            <div className="p-4 rounded-2xl bg-[#1a1405] border border-amber-500/30 space-y-3">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase">
                <CheckSquare className="w-4 h-4 text-amber-400" />
                <span>Pemeriksaan Koreksian Kitab (Makna Gandul Pegon)</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">Kitab yang Dikoreksi:</label>
                  <select
                    value={kitabKoreksian}
                    onChange={(e) => setKitabKoreksian(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#020e08] border border-amber-500/40 text-white text-xs font-bold"
                  >
                    {KITAB_KOREKSIAN_OPTIONS.map(k => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">Nilai Koreksian (0 - 100):</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={nilaiKoreksianKitab}
                    onChange={(e) => setNilaiKoreksianKitab(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-[#020e08] border border-amber-500/40 text-amber-300 font-mono font-black text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">Predikat Koreksian:</label>
                <input
                  type="text"
                  value={predikatKoreksianKitab}
                  onChange={(e) => setPredikatKoreksianKitab(e.target.value)}
                  placeholder="Contoh: Mumtaz (Makna Gandul Sah & Lengkap)"
                  className="w-full px-3 py-2 rounded-xl bg-[#020e08] border border-amber-500/40 text-white text-xs"
                />
              </div>
            </div>
          )}

          {/* INFORMASI UMUM: TAHUN AJARAN, USTADZ & TANGGAL */}
          <div className="p-4 rounded-2xl bg-[#020e08] border border-[#d4af37]/30 space-y-3">
            <span className="text-xs font-bold text-[#f5e298] uppercase tracking-wider block">
              Informasi Umum & Ustadz Penguji
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Tahun Ajaran:</span>
                </label>
                <select
                  value={tahunAjaran}
                  onChange={(e) => setTahunAjaran(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#03150c] border border-[#d4af37]/40 text-white text-xs font-bold"
                >
                  {TAHUN_AJARAN_OPTIONS.map(th => (
                    <option key={th} value={th}>{th}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Ustadz Penguji:</span>
                </label>
                <input
                  type="text"
                  value={ustadzPenguji}
                  onChange={(e) => setUstadzPenguji(e.target.value)}
                  placeholder="Nama ustadz..."
                  className="w-full px-3 py-2 rounded-xl bg-[#03150c] border border-[#d4af37]/40 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Tanggal Ujian:</span>
                </label>
                <input
                  type="date"
                  value={tanggalUjian}
                  onChange={(e) => setTanggalUjian(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#03150c] border border-[#d4af37]/40 text-white text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-300 mb-1">Catatan Evaluasi / Rekomendasi:</label>
              <textarea
                rows={2}
                value={catatanUjian}
                onChange={(e) => setCatatanUjian(e.target.value)}
                placeholder="Catatan penguji untuk santri..."
                className="w-full px-3 py-2 rounded-xl bg-[#03150c] border border-[#d4af37]/40 text-white text-xs"
              />
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="pt-3 border-t border-[#d4af37]/30 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-black/60 hover:bg-[#072417] border border-white/20 text-zinc-300 hover:text-white font-bold text-xs transition cursor-pointer text-center"
            >
              Batal
            </button>

            <button
              type="submit"
              className="w-full sm:w-auto btn-3d-gold px-7 py-2.5 rounded-xl text-black font-black text-xs flex items-center justify-center gap-2 shadow-[0_6px_25px_rgba(212,175,55,0.45)] hover:scale-105 active:scale-95 transition cursor-pointer"
            >
              <Save className="w-4 h-4 text-black stroke-[2.4]" />
              <span>SIMPAN NILAI UJIAN</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
