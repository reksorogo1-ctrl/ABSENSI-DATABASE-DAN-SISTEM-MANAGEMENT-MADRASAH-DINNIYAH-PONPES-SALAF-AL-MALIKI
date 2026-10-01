import React, { useState, useMemo } from 'react';
import { 
  GraduationCap, TrendingUp, CheckCircle2, AlertTriangle, ArrowRight, 
  Search, RefreshCw, X, ShieldAlert, Calendar, History, Sparkles, UserCheck, 
  HelpCircle, ChevronRight, Edit3, ArrowUpCircle
} from 'lucide-react';
import { Santri, AppSettings } from '../types';
import { 
  SantriPromotionDecision, 
  PromotionAction, 
  buildInitialDecisions, 
  computePromotionPreview, 
  getNextAcademicYear, 
  executePromotionProcess,
  CLASS_PROGRESSION_MAP,
  getOrCreateSantriHistory
} from '../lib/kenaikanKelasService';

interface KenaikanKelasModalProps {
  isOpen: boolean;
  onClose: () => void;
  santriList: Santri[];
  settings: AppSettings;
  onSavePromotion: (updatedSantriList: Santri[], updatedSettings: Partial<AppSettings>) => void;
  onNotify?: (msg: string) => void;
}

export const KenaikanKelasModal: React.FC<KenaikanKelasModalProps> = ({
  isOpen,
  onClose,
  santriList,
  settings,
  onSavePromotion,
  onNotify
}) => {
  const currentAcademicYear = settings.tahun_ajaran || '2026/2027';
  const [newAcademicYear, setNewAcademicYear] = useState<string>(() => 
    getNextAcademicYear(currentAcademicYear)
  );
  const [semesterBaru, setSemesterBaru] = useState<string>('Semester Ganjil');

  // State keputusan kenaikan per santri
  const [decisions, setDecisions] = useState<SantriPromotionDecision[]>(() => 
    buildInitialDecisions(santriList)
  );

  // Filter & Pencarian
  const [filterKelas, setFilterKelas] = useState<string>('SEMUA');
  const [filterAction, setFilterAction] = useState<string>('SEMUA');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected santri untuk melihat detail riwayat perjalanan kelas
  const [selectedSantriForHistory, setSelectedSantriForHistory] = useState<Santri | null>(null);

  // Modal konfirmasi akhir
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Sync ulang jika santriList berubah
  const handleResetAllToDefault = () => {
    if (window.confirm('Reset seluruh penanganan manual ke rekomendasi sistem otomatis?')) {
      setDecisions(buildInitialDecisions(santriList));
    }
  };

  // Ubah keputusan individual santri
  const handleUpdateDecisionAction = (santriId: string, action: PromotionAction) => {
    setDecisions(prev => prev.map(d => {
      if (d.santriId !== santriId) return d;

      let nextClass = d.kelasAsal;
      const rule = CLASS_PROGRESSION_MAP[d.kelasAsal];

      if (action === 'naik') {
        nextClass = rule ? rule.nextClass : d.kelasAsal;
      } else if (action === 'tetap') {
        nextClass = d.kelasAsal;
      } else if (action === 'lulus') {
        nextClass = `${d.kelasAsal} (Lulus/Alumni)`;
      } else if (action === 'mutasi') {
        nextClass = d.kelasAsal;
      }

      // Check if this differs from default rule
      const isDefault = rule ? (rule.defaultAction === action) : (action === 'naik');

      return {
        ...d,
        action,
        kelasTujuan: nextClass,
        isManualOverride: !isDefault
      };
    }));
  };

  // Ubah catatan manual santri
  const handleUpdateDecisionCatatan = (santriId: string, catatan: string) => {
    setDecisions(prev => prev.map(d => {
      if (d.santriId !== santriId) return d;
      return {
        ...d,
        catatan,
        isManualOverride: true
      };
    }));
  };

  // Preview Summary
  const previewSummary = useMemo(() => {
    return computePromotionPreview(decisions);
  }, [decisions]);

  // Filtered List
  const filteredDecisions = useMemo(() => {
    return decisions.filter(d => {
      if (filterKelas !== 'SEMUA' && d.kelasAsal !== filterKelas) return false;
      if (filterAction !== 'SEMUA' && d.action !== filterAction) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = d.nama.toLowerCase().includes(q);
        const matchId = d.santriId.toLowerCase().includes(q);
        if (!matchName && !matchId) return false;
      }
      return true;
    });
  }, [decisions, filterKelas, filterAction, searchQuery]);

  // Eksekusi Kenaikan Kelas
  const handleConfirmPromotion = async () => {
    setIsProcessing(true);
    try {
      const updatedList = executePromotionProcess(
        santriList,
        decisions,
        currentAcademicYear,
        newAcademicYear
      );

      const updatedSettings: Partial<AppSettings> = {
        tahun_ajaran: newAcademicYear,
        semester_aktif: semesterBaru
      };

      onSavePromotion(updatedList, updatedSettings);

      const notifMsg = `Berhasil! Seluruh data santri telah dinaikkan ke Tahun Ajaran Baru ${newAcademicYear}. Data absensi, nilai, dan riwayat tetap utuh terhubung.`;
      if (onNotify) onNotify(notifMsg);
      else alert(notifMsg);

      setShowConfirmDialog(false);
      onClose();
    } catch (err) {
      console.error('Gagal memproses kenaikan kelas:', err);
      alert('Terjadi kesalahan saat memproses kenaikan kelas. Silakan coba kembali.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col rounded-3xl bg-[#041c12] border-2 border-[#d4af37]/60 shadow-[0_20px_70px_rgba(0,0,0,0.9)] text-white overflow-hidden my-auto">
        
        {/* HEADER MODAL */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b border-[#d4af37]/30 bg-gradient-to-r from-[#02130b] via-[#052618] to-[#02130b] gap-4 shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#f5e298] via-[#d4af37] to-[#7a5410] flex items-center justify-center shadow-lg text-black shrink-0">
              <GraduationCap className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-[#f5e298] text-gold-3d tracking-wide">
                  SISTEM KENAIKAN KELAS OTOMATIS
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#f5e298]">
                  ID Santri Tetap Sama
                </span>
              </div>
              <p className="text-xs text-emerald-200/90 mt-0.5">
                Pondok Pesantren Salaf Al-Maliki • Tanpa input ulang data, seluruh riwayat tetap utuh & terhubung
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={handleResetAllToDefault}
              className="px-3 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition"
              title="Kembalikan semua pilihan manual ke aturan otomatis bawaan"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Otomatis</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-black/40 border border-[#d4af37]/30 text-zinc-400 hover:text-white flex items-center justify-center transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BODY CONTENT - SCROLLABLE */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">

          {/* BARIS TAHUN AJARAN AKTIF & BARU */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#03150d] border border-[#d4af37]/40 shadow-inner flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#093521] border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-zinc-400 block uppercase tracking-wider">Tahun Ajaran Saat Ini:</span>
                <span className="text-sm font-black text-white font-mono bg-black/40 px-2.5 py-0.5 rounded-md border border-white/10">
                  {currentAcademicYear}
                </span>
              </div>
            </div>

            <div className="hidden md:flex items-center text-[#d4af37]">
              <ArrowRight className="w-6 h-6 animate-pulse" />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="text-[11px] font-bold text-[#f5e298] block mb-1">
                  Target Tahun Ajaran Baru:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newAcademicYear}
                    onChange={(e) => setNewAcademicYear(e.target.value)}
                    placeholder="Contoh: 2027/2028 atau 1448/1449 H"
                    className="bg-[#020e08] border border-[#d4af37] rounded-xl px-3 py-1.5 text-xs text-white font-mono font-bold focus:ring-1 focus:ring-[#f5e298] w-40"
                  />
                  <select
                    value={semesterBaru}
                    onChange={(e) => setSemesterBaru(e.target.value)}
                    className="bg-[#020e08] border border-[#d4af37]/60 rounded-xl px-3 py-1.5 text-xs text-emerald-200 font-bold"
                  >
                    <option value="Semester Ganjil">Semester Ganjil</option>
                    <option value="Semester Genap">Semester Genap</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* 4 CARDS PREVIEW STATISTIK UTAMA */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Total Santri */}
            <div className="p-3.5 rounded-2xl bg-[#03150d] border border-[#d4af37]/30 shadow-md">
              <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Total Santri</span>
              <div className="text-xl font-black text-white font-mono mt-1">{previewSummary.totalSantri}</div>
              <span className="text-[10px] text-zinc-500">Terdaftar Aktif</span>
            </div>

            {/* Akan Naik Kelas */}
            <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 shadow-md">
              <span className="text-[10px] text-emerald-300 font-bold block uppercase tracking-wider">Akan Naik</span>
              <div className="text-xl font-black text-emerald-400 font-mono mt-1">{previewSummary.totalNaik}</div>
              <span className="text-[10px] text-emerald-300/80">Pindah Kelas Lanjut</span>
            </div>

            {/* Akan Lulus / Alumni */}
            <div className="p-3.5 rounded-2xl bg-amber-950/60 border border-amber-500/40 shadow-md">
              <span className="text-[10px] text-amber-300 font-bold block uppercase tracking-wider">Akan Lulus</span>
              <div className="text-xl font-black text-[#f5e298] font-mono mt-1">{previewSummary.totalLulus}</div>
              <span className="text-[10px] text-amber-300/80">Alumni Diniyah</span>
            </div>

            {/* Tetap di Kelas (Tinggal) */}
            <div className="p-3.5 rounded-2xl bg-orange-950/50 border border-orange-500/40 shadow-md">
              <span className="text-[10px] text-orange-300 font-bold block uppercase tracking-wider">Tetap di Kelas</span>
              <div className="text-xl font-black text-orange-400 font-mono mt-1">{previewSummary.totalTetap}</div>
              <span className="text-[10px] text-orange-300/80">Belum Naik</span>
            </div>

            {/* Mutasi / Keluar */}
            <div className="p-3.5 rounded-2xl bg-rose-950/50 border border-rose-500/40 shadow-md">
              <span className="text-[10px] text-rose-300 font-bold block uppercase tracking-wider">Mutasi / Keluar</span>
              <div className="text-xl font-black text-rose-400 font-mono mt-1">{previewSummary.totalMutasi}</div>
              <span className="text-[10px] text-rose-300/80">Pindah Pesantren</span>
            </div>

            {/* Override Manual Admin */}
            <div className="p-3.5 rounded-2xl bg-blue-950/50 border border-blue-500/40 shadow-md">
              <span className="text-[10px] text-blue-300 font-bold block uppercase tracking-wider">Manual Override</span>
              <div className="text-xl font-black text-blue-400 font-mono mt-1">{previewSummary.totalManualOverride}</div>
              <span className="text-[10px] text-blue-300/80">Ditentukan Admin</span>
            </div>
          </div>

          {/* VISUAL ALUR JENJANG KENAIKAN KELAS */}
          <div className="p-4 rounded-2xl bg-[#03150d] border border-[#d4af37]/25 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#d4af37]/20">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#d4af37]" />
                <span className="text-xs font-black text-[#f5e298] uppercase tracking-wider">
                  Rincian Alur Kenaikan Per Jenjang Angkatan:
                </span>
              </div>
              <span className="text-[11px] text-emerald-300">
                Pindah Otomatis Tanpa Merubah NIS / ID
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {previewSummary.breakdown.map((item, idx) => (
                <div 
                  key={idx}
                  className="p-3 rounded-xl bg-[#020e08] border border-[#d4af37]/20 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{item.kelasAsal}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                    <span className="font-bold text-[#f5e298]">{item.kelasTujuan}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#0b3824] text-emerald-300 font-mono font-bold border border-[#d4af37]/30 text-[11px] shrink-0">
                    {item.jumlahSantri} Santri
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* DAFTAR SANTRI & PENANGANAN MANUAL SEBELUM KONFIRMASI */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-[#f5e298] flex items-center gap-2">
                  <span>Daftar Santri & Pengaturan Manual Status Kenaikan</span>
                  {previewSummary.totalManualOverride > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/40">
                      {previewSummary.totalManualOverride} Santri Ditangani Khusus
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-emerald-200/80">
                  Admin dapat memilih apakah santri tertentu tetap di kelas, naik kelas, lulus, atau mutasi sebelum memproses.
                </p>
              </div>

              {/* SEARCH & FILTERS */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari santri / NIS..."
                    className="bg-[#020e08] border border-[#d4af37]/30 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white w-44 placeholder-zinc-500 focus:outline-none focus:border-[#d4af37]"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Filter Kelas */}
                <select
                  value={filterKelas}
                  onChange={(e) => setFilterKelas(e.target.value)}
                  className="bg-[#020e08] border border-[#d4af37]/30 rounded-xl px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="SEMUA">Semua Kelas</option>
                  {Object.keys(CLASS_PROGRESSION_MAP).map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>

                {/* Filter Action */}
                <select
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value)}
                  className="bg-[#020e08] border border-[#d4af37]/30 rounded-xl px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="SEMUA">Semua Aksi</option>
                  <option value="naik">Naik Kelas</option>
                  <option value="tetap">Tetap di Kelas</option>
                  <option value="lulus">Lulus</option>
                  <option value="mutasi">Mutasi/Keluar</option>
                </select>
              </div>
            </div>

            {/* TABEL SANTRI PROMOTION */}
            <div className="rounded-2xl border border-[#d4af37]/30 overflow-hidden bg-[#020e08]/90">
              <div className="overflow-x-auto max-h-80">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-[#052216] text-[#d4af37] z-10 border-b border-[#d4af37]/30">
                    <tr>
                      <th className="p-3 w-12 text-center">NO</th>
                      <th className="p-3 w-14 text-center">FOTO</th>
                      <th className="p-3 w-28">NIS / ID</th>
                      <th className="p-3">NAMA SANTRI</th>
                      <th className="p-3 w-32">KELAS ASAL</th>
                      <th className="p-3 w-44">KEPUTUSAN AKSI</th>
                      <th className="p-3 w-36">KELAS TUJUAN</th>
                      <th className="p-3">CATATAN MANUAL</th>
                      <th className="p-3 w-24 text-center">RIWAYAT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d4af37]/10">
                    {filteredDecisions.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-zinc-400">
                          Tidak ada santri yang sesuai dengan filter pencarian.
                        </td>
                      </tr>
                    ) : (
                      filteredDecisions.map((dec, idx) => {
                        const originalSantri = santriList.find(s => s.id === dec.santriId);
                        return (
                          <tr 
                            key={`${dec.santriId}-${idx}`}
                            className={`hover:bg-[#d4af37]/5 transition ${
                              dec.isManualOverride ? 'bg-blue-950/20' : ''
                            }`}
                          >
                            <td className="p-3 text-center font-bold text-[#d4af37]">
                              {idx + 1}
                            </td>
                            <td className="p-2 text-center">
                              <div className="w-8 h-10 mx-auto rounded overflow-hidden border border-[#d4af37]/40 bg-black">
                                <img
                                  src={dec.foto || 'https://via.placeholder.com/60x80?text=Foto'}
                                  alt={dec.nama}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLElement).setAttribute('src', 'https://via.placeholder.com/60x80?text=Foto');
                                  }}
                                />
                              </div>
                            </td>
                            <td className="p-3 font-mono font-bold text-[#d4af37]">
                              {dec.santriId}
                            </td>
                            <td className="p-3 font-bold text-white">
                              <div>{dec.nama}</div>
                              {dec.isManualOverride && (
                                <span className="text-[10px] text-blue-300 font-normal">
                                  (Penanganan Manual Admin)
                                </span>
                              )}
                            </td>
                            <td className="p-3 font-semibold text-emerald-300">
                              {dec.kelasAsal}
                            </td>
                            <td className="p-2.5">
                              <select
                                value={dec.action}
                                onChange={(e) => handleUpdateDecisionAction(dec.santriId, e.target.value as PromotionAction)}
                                className={`w-full py-1.5 px-2 rounded-lg text-xs font-bold border transition ${
                                  dec.action === 'naik'
                                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                                    : dec.action === 'tetap'
                                    ? 'bg-orange-950 text-orange-300 border-orange-500/50'
                                    : dec.action === 'lulus'
                                    ? 'bg-amber-950 text-[#f5e298] border-amber-500/50'
                                    : 'bg-rose-950 text-rose-300 border-rose-500/50'
                                }`}
                              >
                                <option value="naik">Naik Kelas</option>
                                <option value="tetap">Tetap di Kelas</option>
                                <option value="lulus">Lulus</option>
                                <option value="mutasi">Mutasi / Keluar</option>
                              </select>
                            </td>
                            <td className="p-3 font-mono font-bold text-[#f5e298]">
                              {dec.kelasTujuan}
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={dec.catatan || ''}
                                onChange={(e) => handleUpdateDecisionCatatan(dec.santriId, e.target.value)}
                                placeholder="Alasan jika ada..."
                                className="w-full bg-[#03150d] border border-[#d4af37]/30 rounded-lg px-2 py-1 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#d4af37]"
                              />
                            </td>
                            <td className="p-2 text-center">
                              {originalSantri && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedSantriForHistory(originalSantri)}
                                  className="p-1.5 rounded-lg bg-[#0b3824] hover:bg-[#d4af37] text-[#d4af37] hover:text-black border border-[#d4af37]/40 transition"
                                  title="Lihat riwayat perjalanan kelas santri ini"
                                >
                                  <History className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* PERINGATAN INTEGRITAS DATABASE */}
          <div className="p-4 rounded-2xl bg-[#092215]/80 border border-[#d4af37]/40 flex items-start gap-3.5">
            <ShieldAlert className="w-5 h-5 text-[#f5e298] shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-bold text-[#f5e298] block">
                Jaminan Integritas Database Santri:
              </span>
              <p className="text-emerald-200/90 leading-relaxed">
                Setiap santri mempertahankan <strong>ID / NIS yang persis sama</strong>. Sistem tidak menduplikasi akun santri. 
                Seluruh histori presensi harian, nilai ujian kitab, setoran nadzhom, riwayat tabungan uang saku, dan syahriyah 
                tetap terhubung 100% secara permanen.
              </p>
            </div>
          </div>

        </div>

        {/* FOOTER ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-5 border-t border-[#d4af37]/30 bg-[#02120a] gap-3 shrink-0">
          <div className="text-xs text-zinc-400">
            Tahun Ajaran Baru: <span className="font-mono text-[#f5e298] font-bold">{newAcademicYear}</span> ({semesterBaru})
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-white/20 bg-black/40 hover:bg-black/60 text-zinc-300 text-xs font-bold transition"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={() => setShowConfirmDialog(true)}
              className="btn-3d-gold px-6 py-2.5 rounded-xl text-black font-black text-xs shadow-xl flex items-center justify-center gap-2 hover:scale-102 transition"
            >
              <ArrowUpCircle className="w-4 h-4 text-black" />
              <span>PROSES KENAIKAN KELAS ({decisions.length} Santri)</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL KONFIRMASI AKHIR SEBELUM EKSEKUSI */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#041d13] border-2 border-[#d4af37] p-6 text-white shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-3 text-[#f5e298]">
              <div className="w-12 h-12 rounded-2xl bg-amber-950 border border-amber-500/50 flex items-center justify-center text-[#d4af37]">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-black text-gold-3d">
                  KONFIRMASI KENAIKAN KELAS
                </h3>
                <p className="text-xs text-emerald-200">
                  Tahun Ajaran: {currentAcademicYear} → {newAcademicYear}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs bg-[#020e08] p-4 rounded-xl border border-[#d4af37]/30 text-emerald-100">
              <p className="font-semibold text-white">
                Apakah Anda yakin ingin memproses kenaikan kelas untuk seluruh santri?
              </p>
              <ul className="list-disc pl-5 space-y-1 text-zinc-300">
                <li><strong className="text-emerald-300">{previewSummary.totalNaik} Santri</strong> otomatis naik ke kelas berikutnya.</li>
                <li><strong className="text-[#f5e298]">{previewSummary.totalLulus} Santri</strong> berstatus Lulus / Alumni.</li>
                <li><strong className="text-orange-300">{previewSummary.totalTetap} Santri</strong> tetap di kelas saat ini.</li>
                <li><strong className="text-rose-300">{previewSummary.totalMutasi} Santri</strong> berstatus Mutasi / Keluar.</li>
                <li>Tahun ajaran resmi otomatis diperbarui ke <strong>{newAcademicYear}</strong>.</li>
                <li>Riwayat kelas sebelumnya otomatis tersimpan di profil tiap santri.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmDialog(false)}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl bg-black/40 border border-white/20 text-xs font-bold text-zinc-300 hover:text-white"
              >
                Kembali Periksa
              </button>

              <button
                type="button"
                onClick={handleConfirmPromotion}
                disabled={isProcessing}
                className="btn-3d-gold px-5 py-2.5 rounded-xl text-black font-black text-xs flex items-center gap-2 shadow-xl"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-black" />
                    <span>Memproses Database...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-black" />
                    <span>Ya, Konfirmasi & Naikkan Kelas Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RIWAYAT PERJALANAN KELAS SANTRI INDIVIDUAL */}
      {selectedSantriForHistory && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-xl rounded-3xl bg-[#041d13] border-2 border-[#d4af37] p-6 text-white shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#d4af37]/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-14 rounded-xl overflow-hidden bg-black border border-[#d4af37] shrink-0">
                  <img
                    src={selectedSantriForHistory.fotoThumbnail || selectedSantriForHistory.foto || 'https://via.placeholder.com/60x80?text=Foto'}
                    alt={selectedSantriForHistory.nama}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-[#f5e298]">
                    {selectedSantriForHistory.nama}
                  </h4>
                  <span className="text-xs font-mono text-emerald-300 block">
                    NIS: {selectedSantriForHistory.id} • Kelas Saat Ini: {selectedSantriForHistory.kelas}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSantriForHistory(null)}
                className="w-8 h-8 rounded-lg bg-black/40 border border-white/20 text-zinc-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-[#f5e298] uppercase tracking-wider block">
                Riwayat Perjalanan Kelas Dari Tahun ke Tahun:
              </span>

              {/* TIMELINE RIWAYAT: TAHUN AJARAN → KELAS → STATUS SANTRI */}
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#d4af37]/40">
                {getOrCreateSantriHistory(selectedSantriForHistory, currentAcademicYear).map((item, idx) => (
                  <div key={idx} className="relative group">
                    {/* Bullet icon */}
                    <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-[#d4af37] border-2 border-black shadow" />
                    
                    <div className="p-3 rounded-xl bg-[#020e08] border border-[#d4af37]/25 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono font-bold text-xs text-[#f5e298]">
                          Tahun Ajaran: {item.tahunAjaran}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.status === 'Naik Kelas'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            : item.status === 'Lulus'
                            ? 'bg-amber-950 text-[#f5e298] border border-amber-500/40'
                            : item.status === 'Tetap di Kelas'
                            ? 'bg-orange-950 text-orange-300 border border-orange-500/40'
                            : 'bg-blue-950 text-blue-300 border border-blue-500/40'
                        }`}>
                          {item.status}
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-white">
                        Kelas: <span className="text-emerald-300">{item.kelas}</span>
                      </div>

                      {item.keterangan && (
                        <p className="text-[11px] text-zinc-400">
                          {item.keterangan}
                        </p>
                      )}

                      <div className="text-[10px] text-zinc-500 font-mono pt-1">
                        Diproses: {item.tanggalProses}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-right pt-2 border-t border-[#d4af37]/20">
              <button
                type="button"
                onClick={() => setSelectedSantriForHistory(null)}
                className="px-4 py-1.5 rounded-xl bg-[#0a301f] border border-[#d4af37]/40 text-xs font-bold text-white hover:bg-[#d4af37] hover:text-black transition"
              >
                Tutup Riwayat
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
