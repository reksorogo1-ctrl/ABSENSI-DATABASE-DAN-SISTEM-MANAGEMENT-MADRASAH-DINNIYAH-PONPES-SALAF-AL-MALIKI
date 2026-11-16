import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Printer,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Sliders,
  X,
  Calendar,
  Ban,
  ArrowUpRight,
  Layers
} from 'lucide-react';
import {
  AppSettings,
  KategoriUjianTakziran,
  Santri,
  UjianExamGlobalConfig,
  UjianTakziranRecord
} from '../types';
import {
  generateAtomicNomorSuratUjianTakziran,
  loadMasterDataFromFirestore,
  saveMasterDataToFirestore,
  subscribeMasterDataFromFirestore
} from '../firebase';
import {
  KELAS_MADRASAH_LIST,
  computeBatasAkhirTakziranDateString,
  formatTanggalIndoSingkat,
  normalizeTakziranRecordWithDeadline
} from '../lib/ujianExamHelpers';
import { resolveLogos } from '../brand';

export interface EligibleUjianTakziranItem {
  santri: Santri;
  periodeTag: string;
  alasanTakziran: string;
  detailNilai: string;
}

interface UjianTakziranModuleProps {
  kategori: KategoriUjianTakziran;
  title: string;
  subtitle: string;
  eligibleItems: EligibleUjianTakziranItem[];
  config: UjianExamGlobalConfig;
  settings: AppSettings;
  selectedKelasFilter: string;
  onOpenOptionPanel: () => void;
  currentActorName?: string;
  accentColor?: 'gold' | 'blue' | 'amber';
}

export const UjianTakziranModule: React.FC<UjianTakziranModuleProps> = ({
  kategori,
  title,
  subtitle,
  eligibleItems,
  config,
  settings,
  selectedKelasFilter,
  onOpenOptionPanel,
  currentActorName = 'Admin Madrasah',
  accentColor = 'gold'
}) => {
  const [takziranRecords, setTakziranRecords] = useState<UjianTakziranRecord[]>([]);
  const [customDeadlines, setCustomDeadlines] = useState<Record<string, string>>({});
  const [printPreviewRecord, setPrintPreviewRecord] = useState<UjianTakziranRecord | null>(null);
  const [isPrintingBusy, setIsPrintingBusy] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Muat & subscribe records takziran ujian dari Firestore
  useEffect(() => {
    let active = true;
    loadMasterDataFromFirestore<UjianTakziranRecord[]>('ujian_takziran_records').then((data) => {
      if (active && Array.isArray(data)) {
        setTakziranRecords(data);
      }
    });
    const unsub = subscribeMasterDataFromFirestore<UjianTakziranRecord[]>(
      'ujian_takziran_records',
      (data) => {
        if (active && Array.isArray(data)) {
          setTakziranRecords(data);
        }
      }
    );
    return () => {
      active = false;
      unsub();
    };
  }, []);

  // Evaluasi batas waktu secara real-time & simpan eskalasi jika ada yang baru melewati batas akhir
  const normalizedRecords = useMemo(() => {
    const now = new Date();
    return takziranRecords.map((rec) =>
      normalizeTakziranRecordWithDeadline(rec, config.takziranSettings, now)
    );
  }, [takziranRecords, config.takziranSettings]);

  useEffect(() => {
    if (takziranRecords.length === 0) return;
    let changed = false;
    const now = new Date();
    const checked = takziranRecords.map((rec) => {
      const next = normalizeTakziranRecordWithDeadline(rec, config.takziranSettings, now);
      if (
        next.statusTakziran !== rec.statusTakziran ||
        next.kartuBerlaku !== rec.kartuBerlaku ||
        next.tingkatTakziran !== rec.tingkatTakziran
      ) {
        changed = true;
      }
      return next;
    });
    if (changed) {
      setTakziranRecords(checked);
      saveMasterDataToFirestore('ujian_takziran_records', checked);
    }
  }, [takziranRecords, config.takziranSettings]);

  // Gabungkan santri eligible (Rodi / Naqish / < Rata-rata) dengan data tersimpan di Firestore
  const combinedRows = useMemo(() => {
    const defaultDeadline = computeBatasAkhirTakziranDateString(config.takziranSettings);
    const mapById = new Map<string, UjianTakziranRecord>();

    normalizedRecords
      .filter((r) => r.kategori === kategori)
      .forEach((r) => {
        mapById.set(r.id, r);
      });

    const rows: UjianTakziranRecord[] = eligibleItems.map(({ santri, periodeTag, alasanTakziran, detailNilai }) => {
      const recId = `${kategori}__${santri.id}__${periodeTag.replace(/\s+/g, '_')}`;
      const existing = mapById.get(recId);
      const overrideDeadline = customDeadlines[recId];

      if (existing) {
        const merged: UjianTakziranRecord = {
          ...existing,
          namaSantri: santri.nama,
          kelas: santri.kelas,
          namaWaliKelas: santri.namaWaliKelas || existing.namaWaliKelas,
          alasanTakziran,
          detailNilai,
          batasAkhirPengumpulan:
            overrideDeadline || existing.batasAkhirPengumpulan || defaultDeadline
        };
        return normalizeTakziranRecordWithDeadline(merged, config.takziranSettings);
      }

      const fresh: UjianTakziranRecord = {
        id: recId,
        kategori,
        idSantri: santri.id,
        namaSantri: santri.nama,
        nis: santri.id,
        kelas: santri.kelas,
        namaWaliKelas: santri.namaWaliKelas,
        periodeTag,
        alasanTakziran,
        detailNilai,
        statusTakziran: 'Belum Diterbitkan',
        tingkatTakziran: config.takziranSettings.tingkatAwal || 'Ringan',
        kartuBerlaku: true,
        batasAkhirPengumpulan: overrideDeadline || defaultDeadline,
        updatedAt: new Date().toISOString()
      };
      return normalizeTakziranRecordWithDeadline(fresh, config.takziranSettings);
    });

    return rows.filter((row) =>
      selectedKelasFilter === 'SEMUA' ? true : row.kelas === selectedKelasFilter
    );
  }, [
    eligibleItems,
    normalizedRecords,
    kategori,
    config.takziranSettings,
    customDeadlines,
    selectedKelasFilter
  ]);

  // Pisahkan antara Tabel Utama Takziran vs Tabel Tersendiri Santri Terlambat / Tidak Mengumpulkan
  const { activeRowsByClass, overdueRowsByClass, totalOverdue, totalSedangDikerjakan, totalSelesai } =
    useMemo(() => {
      const activeList = combinedRows.filter(
        (r) => r.kartuBerlaku && r.statusTakziran !== 'Tidak Mengumpulkan (Terlambat)'
      );
      const overdueList = combinedRows.filter(
        (r) => !r.kartuBerlaku || r.statusTakziran === 'Tidak Mengumpulkan (Terlambat)'
      );

      const groupByKelas = (list: UjianTakziranRecord[]) => {
        const groups = new Map<string, UjianTakziranRecord[]>();
        KELAS_MADRASAH_LIST.forEach((k) => groups.set(k, []));
        list.forEach((item) => {
          const k = item.kelas || 'LAINNYA';
          if (!groups.has(k)) groups.set(k, []);
          groups.get(k)!.push(item);
        });
        return Array.from(groups.entries()).filter(([, arr]) => arr.length > 0);
      };

      return {
        activeRowsByClass: groupByKelas(activeList),
        overdueRowsByClass: groupByKelas(overdueList),
        totalOverdue: overdueList.length,
        totalSedangDikerjakan: combinedRows.filter((r) => r.statusTakziran === 'Sedang Dikerjakan').length,
        totalSelesai: combinedRows.filter((r) => r.statusTakziran === 'Selesai').length
      };
    }, [combinedRows]);

  const upsertRecordToFirestore = async (updatedRecord: UjianTakziranRecord) => {
    const others = takziranRecords.filter((r) => r.id !== updatedRecord.id);
    const nextList = [updatedRecord, ...others];
    setTakziranRecords(nextList);
    await saveMasterDataToFirestore('ujian_takziran_records', nextList);
  };

  // Aksi: Cetak Surat Takziran -> Otomatis ubah status menjadi "Sedang Dikerjakan"
  const handlePrintSuratTakziran = async (row: UjianTakziranRecord) => {
    setIsPrintingBusy(true);
    try {
      let nomorSurat = row.nomorSurat;
      let urutan = row.urutanNomorSurat;

      if (!nomorSurat) {
        const maxExisting = takziranRecords.reduce(
          (max, item) => Math.max(max, item.urutanNomorSurat || 0),
          0
        );
        const generated = await generateAtomicNomorSuratUjianTakziran(
          config.takziranSettings.formatNomorSurat,
          undefined,
          maxExisting
        );
        nomorSurat = generated.nomorSurat;
        urutan = generated.urutan;
      }

      const batasAkhir =
        customDeadlines[row.id] ||
        row.batasAkhirPengumpulan ||
        computeBatasAkhirTakziranDateString(config.takziranSettings);

      const nowIso = new Date().toISOString();
      const isAlreadyOverdue =
        normalizeTakziranRecordWithDeadline(
          { ...row, batasAkhirPengumpulan: batasAkhir },
          config.takziranSettings
        ).statusTakziran === 'Tidak Mengumpulkan (Terlambat)';

      const updated: UjianTakziranRecord = {
        ...row,
        nomorSurat,
        urutanNomorSurat: urutan,
        tanggalDicetak: row.tanggalDicetak || nowIso,
        batasAkhirPengumpulan: batasAkhir,
        statusTakziran:
          row.statusTakziran === 'Selesai'
            ? 'Selesai'
            : isAlreadyOverdue
            ? 'Tidak Mengumpulkan (Terlambat)'
            : 'Sedang Dikerjakan',
        kartuBerlaku: row.statusTakziran === 'Selesai' ? true : !isAlreadyOverdue,
        tingkatTakziran:
          isAlreadyOverdue && row.statusTakziran !== 'Selesai'
            ? config.takziranSettings.tingkatJikaTerlambat || 'Sedang'
            : row.tingkatTakziran || config.takziranSettings.tingkatAwal || 'Ringan',
        updatedAt: nowIso
      };

      await upsertRecordToFirestore(updated);
      setPrintPreviewRecord(updated);
      setFeedbackMsg(
        `Surat Takziran ${updated.namaSantri} (${updated.nomorSurat}) dicetak — status otomatis diperbarui menjadi "${updated.statusTakziran}".`
      );
      setTimeout(() => setFeedbackMsg(null), 5000);
    } finally {
      setIsPrintingBusy(false);
    }
  };

  // Aksi: Konfirmasi Sudah Mengumpulkan -> Status otomatis menjadi "Selesai"
  const handleConfirmCollected = async (row: UjianTakziranRecord) => {
    const nowIso = new Date().toISOString();
    const updated: UjianTakziranRecord = {
      ...row,
      statusTakziran: 'Selesai',
      kartuBerlaku: true,
      tanggalDikumpulkan: nowIso,
      dikonfirmasiOleh: currentActorName,
      updatedAt: nowIso
    };
    await upsertRecordToFirestore(updated);
    setFeedbackMsg(
      `Pengumpulan takziran ${updated.namaSantri} telah dikonfirmasi — status berubah menjadi "Selesai".`
    );
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Ubah tanggal batas akhir per baris & simpan
  const handleDeadlineChange = async (row: UjianTakziranRecord, newDate: string) => {
    setCustomDeadlines((prev) => ({ ...prev, [row.id]: newDate }));
    const nextRaw: UjianTakziranRecord = {
      ...row,
      batasAkhirPengumpulan: newDate,
      kartuBerlaku: true,
      statusTakziran:
        row.statusTakziran === 'Tidak Mengumpulkan (Terlambat)'
          ? row.tanggalDicetak
            ? 'Sedang Dikerjakan'
            : 'Belum Diterbitkan'
          : row.statusTakziran,
      tingkatTakziran:
        row.statusTakziran === 'Tidak Mengumpulkan (Terlambat)'
          ? config.takziranSettings.tingkatAwal || 'Ringan'
          : row.tingkatTakziran,
      updatedAt: new Date().toISOString()
    };
    const evaluated = normalizeTakziranRecordWithDeadline(nextRaw, config.takziranSettings);
    await upsertRecordToFirestore(evaluated);
  };

  // Trigger print dokumen di jendela iframe bersih
  const triggerDocumentPrint = () => {
    if (!printAreaRef.current) {
      window.print();
      return;
    }
    const content = printAreaRef.current.innerHTML;
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }
    const pageSize = config.takziranSettings.ukuranKertas === 'F4' ? '215mm 330mm' : 'A4 portrait';
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="utf-8" />
        <title>Cetak Surat Takziran Ujian</title>
        <style>
          @page { size: ${pageSize}; margin: 14mm 16mm; }
          body { font-family: 'Times New Roman', serif; color: #111827; margin: 0; padding: 0; line-height: 1.45; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #1f2937; padding: 6px 8px; text-align: left; font-size: 12px; }
          .no-border td, .no-border th { border: none !important; padding: 3px 4px; }
        </style>
      </head>
      <body>${content}</body>
      </html>
    `);
    doc.close();
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) document.body.removeChild(iframe);
      }, 1500);
    }, 300);
  };

  const brandLogos = resolveLogos(settings);
  const borderAccent =
    accentColor === 'blue'
      ? 'border-blue-500/35'
      : accentColor === 'amber'
      ? 'border-amber-500/35'
      : 'border-[#d4af37]/35';

  const ketentuanTeks =
    kategori === 'muhafadzoh'
      ? config.takziranSettings.ketentuanTakziranMuhafadzoh
      : kategori === 'baca_kitab'
      ? config.takziranSettings.ketentuanTakziranBacaKitab
      : config.takziranSettings.ketentuanTakziranKoreksian;

  return (
    <div className="space-y-6">
      {/* PANEL HEADER TAKZIRAN */}
      <div className={`card-3d rounded-2xl p-5 border ${borderAccent} bg-[#03130b]/95 space-y-4`}>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 border-b border-white/10 pb-3.5">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#d4af37]" />
              <span>{title}</span>
            </h3>
            <p className="text-xs text-zinc-300 mt-0.5">{subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-3 text-xs font-mono tabular-nums text-zinc-300 mr-2">
              <span>Wajib Takziran: <strong className="text-white">{combinedRows.length}</strong></span>
              <span aria-hidden="true">·</span>
              <span>Sedang Dikerjakan: <strong className="text-amber-300">{totalSedangDikerjakan}</strong></span>
              <span aria-hidden="true">·</span>
              <span>Selesai: <strong className="text-emerald-300">{totalSelesai}</strong></span>
              <span aria-hidden="true">·</span>
              <span>Terlambat: <strong className="text-red-400">{totalOverdue}</strong></span>
            </div>

            <button
              type="button"
              onClick={onOpenOptionPanel}
              className="px-3.5 py-2 rounded-xl bg-[#0b3824] hover:bg-[#104d32] border border-[#d4af37]/50 text-[#f5e298] text-xs font-bold inline-flex items-center gap-1.5 transition whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Edit Aturan & Surat di Option Panel</span>
            </button>
          </div>
        </div>

        {feedbackMsg && (
          <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-xs text-emerald-200 flex items-center justify-between gap-2">
            <span className="font-semibold">{feedbackMsg}</span>
            <button
              type="button"
              onClick={() => setFeedbackMsg(null)}
              className="text-emerald-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* TABEL TAKZIRAN AKTIF (FORMAT PER KELAS) */}
        {activeRowsByClass.length === 0 && overdueRowsByClass.length === 0 ? (
          <div className="p-8 rounded-xl border border-emerald-500/20 bg-black/30 text-center space-y-1">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-white">
              Tidak ada santri yang terkena Takziran pada filter kelas saat ini
            </p>
            <p className="text-xs text-zinc-400">
              Seluruh santri telah mencapai standar target penilaian yang ditetapkan di Option Panel.
            </p>
          </div>
        ) : activeRowsByClass.length === 0 ? (
          <div className="p-5 rounded-xl border border-amber-500/30 bg-amber-950/20 text-xs text-amber-200">
            Seluruh santri wajib takziran saat ini telah melewati batas pengumpulan — silakan cek pada Tabel Santri Terlambat / Tidak Mengumpulkan di bawah.
          </div>
        ) : (
          <div className="space-y-4">
            {activeRowsByClass.map(([kelasName, rows]) => (
              <div
                key={`tkz-aktif-${kelasName}`}
                className="rounded-xl border border-[#d4af37]/30 overflow-hidden bg-[#020c07]/90"
              >
                <div className="px-4 py-2.5 bg-[#062417] border-b border-[#d4af37]/25 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#f5e298]">
                    <Layers className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Kelas {kelasName}</span>
                  </div>
                  <span className="text-[11px] font-mono tabular-nums text-emerald-300">
                    {rows.length} Santri
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left min-w-[920px]">
                    <thead className="bg-[#03140c] text-[#d4af37] border-b border-[#d4af37]/20">
                      <tr>
                        <th className="p-3 w-12 text-center">No</th>
                        <th className="p-3">Santri & NIS</th>
                        <th className="p-3">Alasan & Detail Nilai</th>
                        <th className="p-3">No. Surat</th>
                        <th className="p-3">Batas Akhir</th>
                        <th className="p-3 text-center">Tingkat</th>
                        <th className="p-3 text-center">Status Takziran</th>
                        <th className="p-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {rows.map((row, idx) => (
                        <tr key={row.id} className="hover:bg-white/[0.03] transition">
                          <td className="p-3 text-center font-mono tabular-nums text-zinc-300 font-bold">
                            {idx + 1}
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-white">{row.namaSantri}</div>
                            <div className="text-[11px] text-zinc-400 font-mono tabular-nums">
                              NIS: {row.nis} · {row.periodeTag}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-amber-300">{row.alasanTakziran}</div>
                            <div className="text-[11px] text-zinc-400">{row.detailNilai}</div>
                          </td>
                          <td className="p-3 font-mono text-[11px] text-emerald-300">
                            {row.nomorSurat || 'Otomatis saat cetak'}
                          </td>
                          <td className="p-3">
                            <input
                              type="date"
                              value={(row.batasAkhirPengumpulan || '').slice(0, 10)}
                              onChange={(e) => handleDeadlineChange(row, e.target.value)}
                              className="px-2 py-1 rounded-lg bg-[#03150c] border border-[#d4af37]/30 text-xs text-white font-mono tabular-nums"
                              title="Ubah tanggal batas akhir pengumpulan"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <span className="text-xs font-bold text-zinc-200">
                              {row.tingkatTakziran}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            {row.statusTakziran === 'Selesai' ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Selesai</span>
                              </span>
                            ) : row.statusTakziran === 'Sedang Dikerjakan' ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-300">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Sedang Dikerjakan</span>
                              </span>
                            ) : (
                              <span className="text-xs font-semibold text-zinc-400">
                                Belum Dicetak
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                disabled={isPrintingBusy}
                                onClick={() => handlePrintSuratTakziran(row)}
                                className="px-3 py-1.5 rounded-lg bg-[#d4af37] hover:bg-[#e5c14b] text-black text-xs font-bold inline-flex items-center gap-1.5 transition whitespace-nowrap shrink-0 cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>
                                  {row.nomorSurat ? 'Cetak Ulang' : 'Cetak Surat Takziran'}
                                </span>
                              </button>

                              {row.statusTakziran !== 'Selesai' && (
                                <button
                                  type="button"
                                  onClick={() => handleConfirmCollected(row)}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold inline-flex items-center gap-1.5 transition whitespace-nowrap shrink-0 cursor-pointer"
                                  title="Tandai santri sudah mengumpulkan dan menyelesaikan takziran"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Sudah Mengumpulkan</span>
                                </button>
                              )}
                            </div>
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

      {/* TABEL TERSENDIRI: SANTRI TERLAMBAT / TIDAK MENGUMPULKAN SURAT TAKZIRAN */}
      <div className="card-3d rounded-2xl p-5 border border-red-500/40 bg-[#170606]/95 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-red-500/25 pb-3">
          <div>
            <h3 className="text-base font-black text-red-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>Tabel Santri Terlambat / Tidak Mengumpulkan Surat Takziran</span>
            </h3>
            <p className="text-xs text-red-200/75 mt-0.5">
              Santri yang melewati batas akhir tanggal pengumpulan: kartu otomatis dinyatakan tidak berlaku, dianggap tidak mengerjakan, dan tingkatan takziran naik menjadi {config.takziranSettings.tingkatJikaTerlambat || 'Sedang'}.
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-red-300 font-bold">
            Total Terlambat: {totalOverdue} Santri
          </span>
        </div>

        {overdueRowsByClass.length === 0 ? (
          <div className="p-6 rounded-xl border border-white/10 bg-black/25 text-center text-xs text-zinc-400">
            Belum ada santri yang terlambat melewati batas akhir pengumpulan surat takziran.
          </div>
        ) : (
          <div className="space-y-4">
            {overdueRowsByClass.map(([kelasName, rows]) => (
              <div
                key={`tkz-late-${kelasName}`}
                className="rounded-xl border border-red-500/30 overflow-hidden bg-black/40"
              >
                <div className="px-4 py-2.5 bg-red-950/60 border-b border-red-500/25 flex items-center justify-between">
                  <span className="text-xs font-bold text-red-200">Kelas {kelasName}</span>
                  <span className="text-[11px] font-mono tabular-nums text-red-300">
                    {rows.length} Santri Terlambat
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left min-w-[900px]">
                    <thead className="bg-[#210909] text-red-200 border-b border-red-500/20">
                      <tr>
                        <th className="p-3 w-12 text-center">No</th>
                        <th className="p-3">Santri & NIS</th>
                        <th className="p-3">Keterangan Ujian</th>
                        <th className="p-3">Batas Pengumpulan</th>
                        <th className="p-3 text-center">Status Kartu</th>
                        <th className="p-3 text-center">Tingkat Takziran</th>
                        <th className="p-3 text-center">Tindak Lanjut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-red-500/10">
                      {rows.map((row, idx) => (
                        <tr key={`late-${row.id}`} className="hover:bg-red-950/25 transition">
                          <td className="p-3 text-center font-mono tabular-nums font-bold text-red-300">
                            {idx + 1}
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-white">{row.namaSantri}</div>
                            <div className="text-[11px] text-zinc-400 font-mono tabular-nums">
                              NIS: {row.nis} · Surat: {row.nomorSurat || '-'}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-amber-200">{row.alasanTakziran}</div>
                            <div className="text-[11px] text-zinc-400">{row.detailNilai}</div>
                          </td>
                          <td className="p-3 font-mono tabular-nums text-red-300 font-semibold">
                            {formatTanggalIndoSingkat(row.batasAkhirPengumpulan)}
                          </td>
                          <td className="p-3 text-center">
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-red-400">
                              <Ban className="w-3.5 h-3.5" />
                              <span>Kartu Tidak Berlaku</span>
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="inline-flex items-center gap-1 text-xs font-black text-amber-300">
                              <ArrowUpRight className="w-3.5 h-3.5" />
                              <span>Naik Tingkat: {row.tingkatTakziran}</span>
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => handlePrintSuratTakziran(row)}
                                className="px-3 py-1.5 rounded-lg bg-red-800 hover:bg-red-700 text-white text-xs font-bold inline-flex items-center gap-1.5 transition whitespace-nowrap shrink-0 cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Cetak Surat Tingkat {row.tingkatTakziran}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleConfirmCollected(row)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold inline-flex items-center gap-1.5 transition whitespace-nowrap shrink-0 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Konfirmasi Selesai</span>
                              </button>
                            </div>
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

      {/* MODAL PREVIEW & CETAK SURAT TAKZIRAN */}
      {printPreviewRecord && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-[#d4af37]/50 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden my-6">
            <div className="flex items-center justify-between px-5 py-3.5 bg-[#041d11] border-b border-[#d4af37]/30">
              <div className="flex items-center gap-2 text-sm font-bold text-[#f5e298]">
                <Printer className="w-4 h-4 text-[#d4af37]" />
                <span>Pratinjau & Cetak Surat Takziran Ujian ({printPreviewRecord.nomorSurat})</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={triggerDocumentPrint}
                  className="px-4 py-1.5 rounded-lg bg-[#d4af37] hover:bg-[#e7c44b] text-black text-xs font-black inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / Print Sekarang</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintPreviewRecord(null)}
                  className="p-1.5 rounded-lg bg-black/40 text-zinc-300 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-5 max-h-[80vh] overflow-y-auto bg-zinc-200">
              <div
                ref={printAreaRef}
                className="bg-white text-black p-8 shadow-md mx-auto max-w-[210mm]"
                style={{ fontFamily: "'Times New Roman', serif" }}
              >
                {/* KOP SURAT */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '3px double #111',
                    paddingBottom: '10px',
                    marginBottom: '14px'
                  }}
                >
                  <img
                    src={brandLogos.pondok}
                    alt="Logo Pondok"
                    style={{ width: '64px', height: '64px', objectFit: 'contain' }}
                  />
                  <div style={{ textAlign: 'center', flex: 1, padding: '0 12px' }}>
                    <div style={{ fontSize: '15px', fontWeight: 'bold' }}>
                      {config.takziranSettings.namaLembaga}
                    </div>
                    <div style={{ fontSize: '17px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                      {config.takziranSettings.namaMadrasah}
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
                      {config.takziranSettings.subKopSurat}
                    </div>
                    <div style={{ fontSize: '10px', color: '#333', marginTop: '2px' }}>
                      {config.takziranSettings.alamatLembaga}
                    </div>
                  </div>
                  <img
                    src={brandLogos.madrasah}
                    alt="Logo Madrasah"
                    style={{ width: '64px', height: '64px', objectFit: 'contain' }}
                  />
                </div>

                {/* JUDUL & STATUS KARTU */}
                <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', textDecoration: 'underline' }}>
                    {config.takziranSettings.judulSurat}
                  </div>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>
                    Nomor: <strong>{printPreviewRecord.nomorSurat}</strong>
                  </div>
                  {!printPreviewRecord.kartuBerlaku && (
                    <div
                      style={{
                        marginTop: '6px',
                        padding: '4px 10px',
                        border: '2px solid #b91c1c',
                        color: '#b91c1c',
                        fontWeight: 'bold',
                        fontSize: '12px',
                        display: 'inline-block'
                      }}
                    >
                      STATUS KARTU: TIDAK BERLAKU (MELEWATI BATAS PENGUMPULAN — NAIK TINGKAT{' '}
                      {printPreviewRecord.tingkatTakziran.toUpperCase()})
                    </div>
                  )}
                </div>

                {/* TABEL IDENTITAS & RINCIAN */}
                <table className="no-border" style={{ width: '100%', fontSize: '12.5px', marginBottom: '12px' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '170px' }}>Nama Santri</td>
                      <td style={{ width: '12px' }}>:</td>
                      <td><strong>{printPreviewRecord.namaSantri}</strong></td>
                    </tr>
                    <tr>
                      <td>NIS / ID Santri</td>
                      <td>:</td>
                      <td>{printPreviewRecord.nis}</td>
                    </tr>
                    <tr>
                      <td>Kelas</td>
                      <td>:</td>
                      <td>{printPreviewRecord.kelas}</td>
                    </tr>
                    <tr>
                      <td>Jenis Ujian / Periode</td>
                      <td>:</td>
                      <td>
                        {kategori === 'muhafadzoh'
                          ? 'Her Ujian Muhafadzoh'
                          : kategori === 'baca_kitab'
                          ? 'Ujian Baca Kitab'
                          : 'Her Koreksian Kitab'}{' '}
                        ({printPreviewRecord.periodeTag})
                      </td>
                    </tr>
                    <tr>
                      <td>Dasar Takziran</td>
                      <td>:</td>
                      <td><strong>{printPreviewRecord.alasanTakziran}</strong> — {printPreviewRecord.detailNilai}</td>
                    </tr>
                    <tr>
                      <td>Tingkat Takziran</td>
                      <td>:</td>
                      <td><strong>{printPreviewRecord.tingkatTakziran}</strong></td>
                    </tr>
                    <tr>
                      <td>Batas Akhir Pengumpulan</td>
                      <td>:</td>
                      <td>
                        <strong style={{ color: '#991b1b' }}>
                          {formatTanggalIndoSingkat(printPreviewRecord.batasAkhirPengumpulan)}
                        </strong>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* KETENTUAN TAKZIRAN */}
                <div
                  style={{
                    border: '1px solid #222',
                    padding: '10px 12px',
                    fontSize: '12px',
                    marginBottom: '12px',
                    backgroundColor: '#fafafa'
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Kewajiban & Ketentuan Takziran:</div>
                  <div>{ketentuanTeks}</div>
                </div>

                {/* PERINGATAN BATAS AKHIR */}
                <div
                  style={{
                    border: '1.5px dashed #991b1b',
                    padding: '8px 12px',
                    fontSize: '11.5px',
                    color: '#7f1d1d',
                    marginBottom: '18px'
                  }}
                >
                  {config.takziranSettings.isiPeringatanBatasAkhir}
                </div>

                {/* TANDA TANGAN */}
                <div style={{ textAlign: 'right', fontSize: '12px', marginBottom: '14px' }}>
                  {config.takziranSettings.kotaSurat},{' '}
                  {formatTanggalIndoSingkat(printPreviewRecord.tanggalDicetak || new Date().toISOString())}
                </div>

                <table className="no-border" style={{ width: '100%', textAlign: 'center', fontSize: '12px' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '33%', textAlign: 'center' }}>
                        <div>{config.takziranSettings.jabatanPenandatangan1}</div>
                        <div style={{ height: '54px' }} />
                        <div style={{ fontWeight: 'bold', textDecoration: 'underline' }}>
                          {printPreviewRecord.namaWaliKelas || config.takziranSettings.namaPenandatangan1}
                        </div>
                      </td>
                      <td style={{ width: '33%', textAlign: 'center' }}>
                        <div>{config.takziranSettings.jabatanPenandatangan2}</div>
                        <div style={{ height: '54px' }} />
                        <div style={{ fontWeight: 'bold', textDecoration: 'underline' }}>
                          {config.takziranSettings.namaPenandatangan2}
                        </div>
                      </td>
                      <td style={{ width: '33%', textAlign: 'center' }}>
                        <div>{config.takziranSettings.jabatanPenandatangan3}</div>
                        <div style={{ height: '54px' }} />
                        <div style={{ fontWeight: 'bold', textDecoration: 'underline' }}>
                          {config.takziranSettings.namaPenandatangan3}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
