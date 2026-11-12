import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ShieldAlert, Printer, FileText, CheckCircle2, Clock, AlertTriangle,
  Settings, Save, RotateCcw, Eye, Edit3, Check, X, Upload, History,
  Search, Filter, Calendar, UserCheck, Award, Download
} from 'lucide-react';
import {
  Santri, AppSettings, TemplateSuratTakziran, PelanggaranSantriRecord,
  PelanggaranAuditLog, StatusTakziran, KategoriPelanggaran
} from '../types';
import {
  saveMasterDataToFirestore,
  loadMasterDataFromFirestore,
  subscribeMasterDataFromFirestore,
  generateAtomicNomorSuratTakziran,
  formatNomorSuratFromCounter
} from '../firebase';
import { resolveLogos } from '../brand';
import { compressImageFile } from '../lib/imageCompression';

export const DEFAULT_TEMPLATE_SURAT_TAKZIRAN: TemplateSuratTakziran = {
  batasMinimalKehadiran: 60,
  durasiPengumpulanHari: 3,
  jamBatasAkhir: '16:00',
  ketentuanKeterlambatan:
    'Apabila sampai batas waktu yang telah ditentukan santri belum menyerahkan bukti penyelesaian takziran kepada petugas yang berwenang, maka status pelanggaran otomatis ditingkatkan menjadi Pelanggaran Berat.',
  sertakanSantriTanpaSesi: false,

  labelPelanggaranRingan: 'Pelanggaran Ringan',
  keteranganPelanggaranRingan: 'Persentase kehadiran bulanan di bawah batas minimal madrasah.',
  ketentuanTakziranRingan:
    'Menyelesaikan kewajiban takziran pembinaan disiplin madrasah (menghafal/menulis materi kitab atau nadzhom sesuai arahan Wali Kelas & Keamanan) dan menyerahkan bukti pengumpulan sebelum batas waktu berakhir.',

  labelPelanggaranBerat: 'Pelanggaran Berat',
  keteranganPelanggaranBerat:
    'Santri tidak mengumpulkan bukti penyelesaian takziran sampai melewati batas waktu yang telah ditentukan dalam Surat Takziran.',
  ketentuanTakziranBerat:
    'Pemanggilan pembinaan khusus oleh Bagian Keamanan Pondok dan Kepala Madrasah Diniyah serta pemberitahuan resmi kepada Wali Santri sesuai tata tertib Pondok Pesantren Salaf Al-Maliki.',

  namaLembaga: 'PONDOK PESANTREN SALAF AL-MALIKI',
  namaMadrasah: 'MADRASAH DINIYAH SALAFIYAH AL-MALIKI',
  subKopSurat: 'KOMISI DISIPLIN, KEAMANAN & KETERTIBAN SANTRI',
  alamatLembaga:
    'Jl. Raya Pesantren Salaf Al-Maliki, Kompleks Madrasah Diniyah Putra/Putri • Telp/WA Administrasi Pondok',
  logoUrl: '',
  gunakanLogoUtama: true,
  formatNomorSurat: '{NO}/TAKZIRAN/MD-ALMALIKI/{ROMAWI}/{TAHUN}',
  lampiranSurat: '1 (Satu) Berkas Rekap Kehadiran',
  perihalSurat: 'Pemberitahuan Pelanggaran Kehadiran / Takziran',
  judulSurat: 'SURAT PEMBERITAHUAN PELANGGARAN KEHADIRAN & TAKZIRAN SANTRI',
  isiPembukaan:
    'Berdasarkan hasil evaluasi Rekap Absensi Bulanan Madrasah Diniyah Pondok Pesantren Salaf Al-Maliki, bersama ini kami sampaikan bahwa santri yang tersebut di bawah ini tercatat memiliki persentase kehadiran di bawah batas minimal yang telah ditetapkan oleh madrasah:',
  isiPemberitahuan:
    'Sehubungan dengan perolehan persentase kehadiran tersebut yang berada di bawah batas minimal kehadiran madrasah, maka santri yang bersangkutan dinyatakan melakukan pelanggaran disiplin kehadiran dengan klasifikasi sebagai berikut:',
  isiKetentuanTakziran:
    'Santri diwajibkan menyelesaikan kewajiban takziran sesuai ketentuan yang berlaku dan menyerahkan bukti pengumpulan kepada petugas yang berwenang paling lambat pada tanggal dan waktu yang tercantum dalam surat ini.',
  isiPeringatanBerat:
    'Jika sampai batas waktu yang ditentukan takziran belum dikumpulkan, status pelanggaran akan ditingkatkan menjadi Pelanggaran Berat dan ditindaklanjuti oleh pihak madrasah sesuai ketentuan yang berlaku.',
  isiPenutup:
    'Demikian surat pemberitahuan ini disampaikan agar menjadi perhatian dan dilaksanakan dengan penuh tanggung jawab.',
  kotaTanggalSurat: 'Al-Maliki',
  kalimatTandaTangan: 'Mengetahui dan Menetapkan,',
  jabatanPenandatangan1: 'Wali Kelas',
  namaPenandatangan1: 'Ust. Wali Kelas Madrasah',
  gunakanWaliKelasOtomatis: true,
  jabatanPenandatangan2: 'Keamanan',
  namaPenandatangan2: 'Ust. Divisi Kamtib & Keamanan',
  jabatanPenandatangan3: 'Ketua Madrasah',
  namaPenandatangan3: 'KH. / Ust. Kepala Madrasah Diniyah',
  ukuranKertas: 'A4',
  marginAtasMm: 15,
  marginBawahMm: 15,
  marginKiriMm: 18,
  marginKananMm: 18
};

export interface RekapBulananSantriItem {
  id: string;
  nama: string;
  kelas: string;
  hadir: number;
  izin: number;
  sakit: number;
  alpha: number;
  totalSesi: number;
  persentase: number;
  keterangan: string;
}

interface SharedPelanggaranProps {
  settings: AppSettings;
  santriList: Santri[];
  rekapBulananSantri: RekapBulananSantriItem[];
  selectedBulanSantri: string;
  setSelectedBulanSantri: (bulan: string) => void;
  daftarBulan: string[];
  daftarTahun: string[];
  currentUserRole?: 'admin' | 'pengurus';
  currentUserName?: string;
}

export function formatTanggalIndonesia(isoOrDateStr?: string, includeTime: boolean = true): string {
  if (!isoOrDateStr) return '-';
  const d = new Date(isoOrDateStr);
  if (isNaN(d.getTime())) return isoOrDateStr;
  const bulanIndo = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const tgl = d.getDate();
  const bln = bulanIndo[d.getMonth()];
  const thn = d.getFullYear();
  if (!includeTime) return `${tgl} ${bln} ${thn}`;
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${tgl} ${bln} ${thn}, Pukul ${hh}:${mm} WIB`;
}

export function computeBatasPengumpulanISO(
  issueDate: Date,
  durasiHari: number,
  jamBatasAkhir: string = '16:00'
): string {
  const deadline = new Date(issueDate.getTime());
  deadline.setDate(deadline.getDate() + Math.max(1, durasiHari));
  const [hhStr, mmStr] = (jamBatasAkhir || '16:00').split(':');
  const hh = parseInt(hhStr, 10);
  const mm = parseInt(mmStr, 10);
  if (!isNaN(hh) && !isNaN(mm)) {
    deadline.setHours(hh, mm, 59, 0);
  }
  return deadline.toISOString();
}

/**
 * Komponen Cetak Surat Takziran Resmi (A4 Print & Pratinjau Interaktif)
 */
export const SuratTakziranPrintModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  template: TemplateSuratTakziran;
  record: PelanggaranSantriRecord;
  settings: AppSettings;
  onSaveEditedRecord?: (updated: PelanggaranSantriRecord) => Promise<void>;
}> = ({ isOpen, onClose, template, record, settings, onSaveEditedRecord }) => {
  const [isEditingLetter, setIsEditingLetter] = useState(false);
  const [customOverrides, setCustomOverrides] = useState<Partial<TemplateSuratTakziran>>(
    record.customIsiSurat || {}
  );
  const printAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCustomOverrides(record.customIsiSurat || {});
    setIsEditingLetter(false);
  }, [record]);

  if (!isOpen) return null;

  const mergedTemplate: TemplateSuratTakziran = {
    ...template,
    ...customOverrides
  };

  const brandLogos = resolveLogos(settings);
  const activeLogo = mergedTemplate.gunakanLogoUtama || !mergedTemplate.logoUrl
    ? brandLogos.madrasah
    : mergedTemplate.logoUrl;

  const waliKelasName =
    mergedTemplate.gunakanWaliKelasOtomatis && record.namaWaliKelas
      ? record.namaWaliKelas
      : mergedTemplate.namaPenandatangan1;

  const tanggalSuratFormatted = formatTanggalIndonesia(
    record.tanggalTerbitSurat || new Date().toISOString(),
    false
  );
  const batasKumpulFormatted = record.batasPengumpulan
    ? formatTanggalIndonesia(record.batasPengumpulan, true)
    : formatTanggalIndonesia(
        computeBatasPengumpulanISO(
          new Date(),
          mergedTemplate.durasiPengumpulanHari,
          mergedTemplate.jamBatasAkhir
        ),
        true
      );

  const handleTriggerBrowserPrint = () => {
    if (!printAreaRef.current) {
      window.print();
      return;
    }
    const printContents = printAreaRef.current.innerHTML;
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

    const pageSize = mergedTemplate.ukuranKertas === 'F4' ? '215mm 330mm' : 'A4 portrait';
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8" />
        <title>Surat_Takziran_${record.namaSantri.replace(/\s+/g, '_')}_${record.periodeBulan.replace(/\s+/g, '_')}</title>
        <style>
          @page {
            size: ${pageSize};
            margin: ${mergedTemplate.marginAtasMm || 15}mm ${mergedTemplate.marginKananMm || 18}mm ${mergedTemplate.marginBawahMm || 15}mm ${mergedTemplate.marginKiriMm || 18}mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: 'Times New Roman', Times, serif;
            color: #000000;
            background: #ffffff;
            font-size: 11.5pt;
            line-height: 1.45;
          }
          .surat-container {
            width: 100%;
            max-width: 100%;
            margin: 0 auto;
            background: #ffffff;
            color: #000000;
          }
          .kop-surat {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 3.5px double #000000;
            padding-bottom: 10px;
            margin-bottom: 14px;
            page-break-inside: avoid;
          }
          .kop-logo {
            width: 74px;
            height: 74px;
            object-fit: contain;
            flex-shrink: 0;
          }
          .kop-teks {
            flex: 1;
            text-align: center;
            padding: 0 12px;
          }
          .kop-lembaga {
            font-size: 14pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0;
          }
          .kop-madrasah {
            font-size: 13pt;
            font-weight: bold;
            text-transform: uppercase;
            margin: 2px 0;
          }
          .kop-sub {
            font-size: 10pt;
            font-weight: bold;
            text-transform: uppercase;
            margin: 1px 0;
          }
          .kop-alamat {
            font-size: 9.5pt;
            font-style: italic;
            margin: 3px 0 0 0;
          }
          .judul-surat-box {
            text-align: center;
            margin: 10px 0 14px 0;
          }
          .judul-surat {
            font-size: 12pt;
            font-weight: bold;
            text-decoration: underline;
            text-transform: uppercase;
            margin: 0;
          }
          .meta-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
            font-size: 11pt;
          }
          .meta-table td {
            padding: 1.5px 4px;
            vertical-align: top;
          }
          .data-table {
            width: 100%;
            border-collapse: collapse;
            margin: 8px 0 12px 0;
            font-size: 10.5pt;
            page-break-inside: avoid;
          }
          .data-table th, .data-table td {
            border: 1px solid #000000;
            padding: 4px 8px;
          }
          .data-table th {
            background-color: #f0f0f0 !important;
            font-weight: bold;
            text-align: left;
          }
          .box-pelanggaran {
            border: 1.5px solid #000000;
            padding: 8px 12px;
            margin: 10px 0;
            background-color: #fafafa !important;
            page-break-inside: avoid;
          }
          .ttd-section {
            margin-top: 18px;
            page-break-inside: avoid;
          }
          .ttd-grid {
            display: table;
            width: 100%;
            table-layout: fixed;
            margin-top: 10px;
          }
          .ttd-col {
            display: table-cell;
            width: 33.33%;
            text-align: center;
            vertical-align: top;
            padding: 0 6px;
          }
          .ttd-space {
            height: 58px;
          }
          .ttd-name {
            font-weight: bold;
            text-decoration: underline;
          }
          p {
            margin: 6px 0;
            text-align: justify;
          }
        </style>
      </head>
      <body>
        ${printContents}
      </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2000);
    }, 300);
  };

  const handleSaveCustomLetter = async () => {
    if (onSaveEditedRecord) {
      await onSaveEditedRecord({
        ...record,
        customIsiSurat: customOverrides,
        updatedAt: new Date().toISOString()
      });
    }
    setIsEditingLetter(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-start overflow-y-auto p-3 sm:p-6">
      {/* Top Action Bar (Hidden on Print) */}
      <div className="w-full max-w-4xl card-3d rounded-2xl p-4 mb-4 border-2 border-[#d4af37] bg-[#041f13] flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#d4af37]/20 border border-[#d4af37]/50 flex items-center justify-center text-[#d4af37]">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-white text-gold-3d">
              Pratinjau & Cetak Surat Takziran Resmi (Ukuran {mergedTemplate.ukuranKertas})
            </h3>
            <p className="text-[11px] text-emerald-300 font-mono">
              No. Surat: <b className="text-[#f3e5ab]">{record.nomorSurat || '-'}</b> • Santri: <b className="text-white">{record.namaSantri}</b>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleTriggerBrowserPrint}
            className="btn-3d-gold px-4 py-2 rounded-xl text-black font-extrabold text-xs flex items-center gap-1.5 shadow-lg hover:brightness-105 transition"
          >
            <Printer className="w-4 h-4 text-black" />
            <span>Cetak Surat</span>
          </button>

          <button
            type="button"
            onClick={handleTriggerBrowserPrint}
            className="px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 border border-emerald-400/60 text-white font-bold text-xs flex items-center gap-1.5 shadow transition"
            title="Pilih 'Save as PDF' / 'Simpan sebagai PDF' pada dialog cetak browser"
          >
            <Download className="w-4 h-4 text-emerald-200" />
            <span>Simpan PDF</span>
          </button>

          <button
            type="button"
            onClick={() => setIsEditingLetter(!isEditingLetter)}
            className={`px-3.5 py-2 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition ${
              isEditingLetter
                ? 'bg-amber-500 text-black border-amber-300'
                : 'bg-[#083321] border-[#d4af37]/50 text-[#f3e5ab] hover:text-white'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditingLetter ? 'Tutup Editor Surat' : 'Edit Surat'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl bg-red-950/90 hover:bg-red-900 border border-red-500/50 text-red-200 font-bold text-xs flex items-center gap-1 transition"
          >
            <X className="w-4 h-4" />
            <span>Tutup Pratinjau</span>
          </button>
        </div>
      </div>

      {/* Quick Inline Editor for this specific letter */}
      {isEditingLetter && (
        <div className="w-full max-w-4xl card-3d rounded-2xl p-4 mb-4 border border-amber-400/60 bg-[#062417] space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-[#d4af37]/20 pb-2">
            <span className="font-extrabold text-[#f3e5ab] flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-amber-400" />
              Edit Cepat Isi Surat Takziran Ini ({record.namaSantri})
            </span>
            <span className="text-[11px] text-emerald-300">
              Nomor surat ({record.nomorSurat}) tetap terkunci dan tidak berubah.
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-emerald-300 block mb-1">Perihal Surat:</label>
              <input
                type="text"
                value={mergedTemplate.perihalSurat}
                onChange={(e) => setCustomOverrides({ ...customOverrides, perihalSurat: e.target.value })}
                className="w-full bg-[#02120b] border border-[#d4af37]/40 rounded-lg px-2.5 py-1.5 text-white text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] text-emerald-300 block mb-1">Nama Wali Kelas (TTD 1):</label>
              <input
                type="text"
                value={customOverrides.namaPenandatangan1 ?? waliKelasName}
                onChange={(e) =>
                  setCustomOverrides({
                    ...customOverrides,
                    gunakanWaliKelasOtomatis: false,
                    namaPenandatangan1: e.target.value
                  })
                }
                className="w-full bg-[#02120b] border border-[#d4af37]/40 rounded-lg px-2.5 py-1.5 text-white text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] text-emerald-300 block mb-1">Nama Keamanan (TTD 2):</label>
              <input
                type="text"
                value={mergedTemplate.namaPenandatangan2}
                onChange={(e) => setCustomOverrides({ ...customOverrides, namaPenandatangan2: e.target.value })}
                className="w-full bg-[#02120b] border border-[#d4af37]/40 rounded-lg px-2.5 py-1.5 text-white text-xs"
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-emerald-300 block mb-1">Isi Pembukaan:</label>
            <textarea
              rows={2}
              value={mergedTemplate.isiPembukaan}
              onChange={(e) => setCustomOverrides({ ...customOverrides, isiPembukaan: e.target.value })}
              className="w-full bg-[#02120b] border border-[#d4af37]/40 rounded-lg p-2 text-white text-xs"
            />
          </div>
          <div>
            <label className="text-[11px] text-emerald-300 block mb-1">Ketentuan Takziran:</label>
            <textarea
              rows={2}
              value={mergedTemplate.isiKetentuanTakziran}
              onChange={(e) => setCustomOverrides({ ...customOverrides, isiKetentuanTakziran: e.target.value })}
              className="w-full bg-[#02120b] border border-[#d4af37]/40 rounded-lg p-2 text-white text-xs"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleSaveCustomLetter}
              className="btn-3d-gold px-4 py-1.5 rounded-xl text-black font-extrabold text-xs flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5 text-black" />
              <span>Simpan Perubahan Surat Ini ke Firestore</span>
            </button>
          </div>
        </div>
      )}

      {/* A4 Formal Paper Preview */}
      <div className="w-full max-w-[210mm] bg-white text-black shadow-2xl rounded-sm p-6 sm:p-[15mm] mb-10 font-serif">
        <div ref={printAreaRef} className="surat-container text-black bg-white">
          {/* KOP SURAT */}
          <div
            className="kop-surat"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '3.5px double #000',
              paddingBottom: '10px',
              marginBottom: '14px'
            }}
          >
            <img
              src={activeLogo}
              alt="Logo Lembaga"
              className="kop-logo"
              style={{ width: '74px', height: '74px', objectFit: 'contain' }}
            />
            <div className="kop-teks" style={{ flex: 1, textAlign: 'center', padding: '0 12px' }}>
              <div className="kop-lembaga" style={{ fontSize: '14pt', fontWeight: 'bold', textTransform: 'uppercase' }}>
                {mergedTemplate.namaLembaga}
              </div>
              <div className="kop-madrasah" style={{ fontSize: '13pt', fontWeight: 'bold', textTransform: 'uppercase', marginTop: '2px' }}>
                {mergedTemplate.namaMadrasah}
              </div>
              {mergedTemplate.subKopSurat && (
                <div className="kop-sub" style={{ fontSize: '10pt', fontWeight: 'bold', textTransform: 'uppercase', marginTop: '1px' }}>
                  {mergedTemplate.subKopSurat}
                </div>
              )}
              <div className="kop-alamat" style={{ fontSize: '9.5pt', fontStyle: 'italic', marginTop: '3px' }}>
                {mergedTemplate.alamatLembaga}
              </div>
            </div>
            <img
              src={brandLogos.pondok || activeLogo}
              alt="Logo Pondok"
              className="kop-logo"
              style={{ width: '74px', height: '74px', objectFit: 'contain' }}
            />
          </div>

          {/* JUDUL SURAT */}
          <div className="judul-surat-box" style={{ textAlign: 'center', margin: '10px 0 14px 0' }}>
            <h2
              className="judul-surat"
              style={{ fontSize: '12pt', fontWeight: 'bold', textDecoration: 'underline', textTransform: 'uppercase', margin: 0 }}
            >
              {mergedTemplate.judulSurat}
            </h2>
          </div>

          {/* IDENTITAS SURAT */}
          <table className="meta-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', fontSize: '11pt' }}>
            <tbody>
              <tr>
                <td style={{ width: '110px', fontWeight: 'bold' }}>Nomor Surat</td>
                <td style={{ width: '12px' }}>:</td>
                <td style={{ fontWeight: 'bold' }}>{record.nomorSurat || '001/TAKZIRAN/MD-ALMALIKI/XI/2026'}</td>
                <td style={{ textAlign: 'right' }}>
                  {mergedTemplate.kotaTanggalSurat}, {tanggalSuratFormatted}
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold' }}>Lampiran</td>
                <td>:</td>
                <td colSpan={2}>{mergedTemplate.lampiranSurat || '-'}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold' }}>Perihal</td>
                <td>:</td>
                <td colSpan={2} style={{ fontWeight: 'bold' }}>
                  {mergedTemplate.perihalSurat}
                </td>
              </tr>
            </tbody>
          </table>

          {/* TUJUAN SURAT */}
          <div style={{ marginBottom: '10px', fontSize: '11pt' }}>
            <div>Kepada Yth.</div>
            <div style={{ fontWeight: 'bold', marginLeft: '12px' }}>
              Santri: {record.namaSantri} (NIS: {record.nis || record.idSantri})
            </div>
            <div style={{ fontWeight: 'bold', marginLeft: '12px' }}>
              Kelas / Angkatan: {record.kelas}
            </div>
            <div>di Tempat</div>
          </div>

          {/* ISI PEMBUKAAN */}
          <p style={{ margin: '6px 0', textAlign: 'justify', fontSize: '11pt' }}>
            Dengan hormat,
          </p>
          <p style={{ margin: '6px 0', textAlign: 'justify', fontSize: '11pt' }}>
            {mergedTemplate.isiPembukaan}
          </p>

          {/* TABEL DATA KEHADIRAN */}
          <table
            className="data-table"
            style={{ width: '100%', borderCollapse: 'collapse', margin: '10px 0', fontSize: '10.5pt' }}
          >
            <tbody>
              <tr>
                <th style={{ border: '1px solid #000', padding: '4px 8px', backgroundColor: '#f0f0f0', width: '28%' }}>
                  Nama Santri
                </th>
                <td style={{ border: '1px solid #000', padding: '4px 8px', fontWeight: 'bold', width: '22%' }}>
                  {record.namaSantri}
                </td>
                <th style={{ border: '1px solid #000', padding: '4px 8px', backgroundColor: '#f0f0f0', width: '28%' }}>
                  Total Hadir
                </th>
                <td style={{ border: '1px solid #000', padding: '4px 8px', fontWeight: 'bold', width: '22%' }}>
                  {record.hadir} Kali
                </td>
              </tr>
              <tr>
                <th style={{ border: '1px solid #000', padding: '4px 8px', backgroundColor: '#f0f0f0' }}>
                  NIS (Nomor Induk Santri)
                </th>
                <td style={{ border: '1px solid #000', padding: '4px 8px' }}>
                  {record.nis || record.idSantri}
                </td>
                <th style={{ border: '1px solid #000', padding: '4px 8px', backgroundColor: '#f0f0f0' }}>
                  Total Izin
                </th>
                <td style={{ border: '1px solid #000', padding: '4px 8px' }}>
                  {record.izin} Kali
                </td>
              </tr>
              <tr>
                <th style={{ border: '1px solid #000', padding: '4px 8px', backgroundColor: '#f0f0f0' }}>
                  Kelas / Tingkatan
                </th>
                <td style={{ border: '1px solid #000', padding: '4px 8px' }}>
                  {record.kelas}
                </td>
                <th style={{ border: '1px solid #000', padding: '4px 8px', backgroundColor: '#f0f0f0' }}>
                  Total Sakit
                </th>
                <td style={{ border: '1px solid #000', padding: '4px 8px' }}>
                  {record.sakit} Kali
                </td>
              </tr>
              <tr>
                <th style={{ border: '1px solid #000', padding: '4px 8px', backgroundColor: '#f0f0f0' }}>
                  Periode Evaluasi Rekap
                </th>
                <td style={{ border: '1px solid #000', padding: '4px 8px', fontWeight: 'bold' }}>
                  {record.periodeBulan}
                </td>
                <th style={{ border: '1px solid #000', padding: '4px 8px', backgroundColor: '#f0f0f0' }}>
                  Total Alpha (Tanpa Keterangan)
                </th>
                <td style={{ border: '1px solid #000', padding: '4px 8px', fontWeight: 'bold' }}>
                  {record.alpha} Kali
                </td>
              </tr>
              <tr>
                <th style={{ border: '1px solid #000', padding: '4px 8px', backgroundColor: '#f0f0f0' }}>
                  Persentase Kehadiran
                </th>
                <td style={{ border: '1px solid #000', padding: '4px 8px', fontWeight: 'bold', fontSize: '11.5pt' }}>
                  {record.persentaseKehadiran}%
                </td>
                <th style={{ border: '1px solid #000', padding: '4px 8px', backgroundColor: '#f0f0f0' }}>
                  Batas Minimal Kehadiran
                </th>
                <td style={{ border: '1px solid #000', padding: '4px 8px', fontWeight: 'bold' }}>
                  {record.batasMinimalSaatItu || mergedTemplate.batasMinimalKehadiran}%
                </td>
              </tr>
            </tbody>
          </table>

          {/* KLASIFIKASI JENIS PELANGGARAN & BATAS PENGUMPULAN */}
          <div
            className="box-pelanggaran"
            style={{
              border: '1.5px solid #000',
              padding: '8px 12px',
              margin: '10px 0',
              backgroundColor: '#fafafa',
              fontSize: '10.5pt'
            }}
          >
            <div>
              <strong>JENIS PELANGGARAN: </strong>
              <span style={{ textTransform: 'uppercase', fontWeight: 'bold', textDecoration: 'underline' }}>
                {record.jenisPelanggaran === 'Pelanggaran Berat'
                  ? mergedTemplate.labelPelanggaranBerat
                  : mergedTemplate.labelPelanggaranRingan}
              </span>
            </div>
            <div style={{ marginTop: '3px' }}>
              <strong>Keterangan & Ketentuan Kewajiban: </strong>
              {record.jenisPelanggaran === 'Pelanggaran Berat'
                ? mergedTemplate.ketentuanTakziranBerat
                : mergedTemplate.ketentuanTakziranRingan}
            </div>
            <div style={{ marginTop: '4px' }}>
              <strong>BATAS AKHIR PENGUMPULAN TAKZIRAN: </strong>
              <span style={{ fontWeight: 'bold', textDecoration: 'underline' }}>
                {batasKumpulFormatted} (Maksimal {mergedTemplate.durasiPengumpulanHari} Hari sejak diterbitkan)
              </span>
            </div>
          </div>

          {/* KETENTUAN TAKZIRAN & PERINGATAN PELANGGARAN BERAT */}
          <p style={{ margin: '6px 0', textAlign: 'justify', fontSize: '11pt' }}>
            {mergedTemplate.isiKetentuanTakziran}
          </p>
          <p style={{ margin: '6px 0', textAlign: 'justify', fontSize: '11pt', fontWeight: 'bold' }}>
            {mergedTemplate.isiPeringatanBerat}
          </p>

          {/* PENUTUP */}
          <p style={{ margin: '8px 0 12px 0', textAlign: 'justify', fontSize: '11pt' }}>
            {mergedTemplate.isiPenutup}
          </p>

          {/* TANDA TANGAN 3 KOLOM: WALI KELAS, KEAMANAN, KETUA MADRASAH */}
          <div className="ttd-section" style={{ marginTop: '16px', pageBreakInside: 'avoid' }}>
            <div style={{ textAlign: 'center', fontSize: '11pt', marginBottom: '8px' }}>
              {mergedTemplate.kalimatTandaTangan}
            </div>
            <div
              className="ttd-grid"
              style={{ display: 'table', width: '100%', tableLayout: 'fixed', marginTop: '6px', fontSize: '10.5pt' }}
            >
              <div className="ttd-col" style={{ display: 'table-cell', width: '33.33%', textAlign: 'center', verticalAlign: 'top' }}>
                <div style={{ fontWeight: 'bold' }}>{mergedTemplate.jabatanPenandatangan1}</div>
                <div className="ttd-space" style={{ height: '58px' }} />
                <div className="ttd-name" style={{ fontWeight: 'bold', textDecoration: 'underline' }}>
                  {waliKelasName}
                </div>
              </div>

              <div className="ttd-col" style={{ display: 'table-cell', width: '33.33%', textAlign: 'center', verticalAlign: 'top' }}>
                <div style={{ fontWeight: 'bold' }}>{mergedTemplate.jabatanPenandatangan2}</div>
                <div className="ttd-space" style={{ height: '58px' }} />
                <div className="ttd-name" style={{ fontWeight: 'bold', textDecoration: 'underline' }}>
                  {mergedTemplate.namaPenandatangan2}
                </div>
              </div>

              <div className="ttd-col" style={{ display: 'table-cell', width: '33.33%', textAlign: 'center', verticalAlign: 'top' }}>
                <div style={{ fontWeight: 'bold' }}>{mergedTemplate.jabatanPenandatangan3}</div>
                <div className="ttd-space" style={{ height: '58px' }} />
                <div className="ttd-name" style={{ fontWeight: 'bold', textDecoration: 'underline' }}>
                  {mergedTemplate.namaPenandatangan3}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * KOMPONEN UTAMA TAB PELANGGARAN SANTRI (DASHBOARD ADMIN)
 */
export const TabPelanggaranSantri: React.FC<SharedPelanggaranProps> = ({
  settings,
  santriList,
  rekapBulananSantri,
  selectedBulanSantri,
  setSelectedBulanSantri,
  daftarBulan,
  daftarTahun,
  currentUserName = 'Admin Madrasah'
}) => {
  const [templateConfig, setTemplateConfig] = useState<TemplateSuratTakziran>(DEFAULT_TEMPLATE_SURAT_TAKZIRAN);
  const [pelanggaranRecords, setPelanggaranRecords] = useState<PelanggaranSantriRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<PelanggaranAuditLog[]>([]);
  const [filterKelas, setFilterKelas] = useState<string>('SEMUA');
  const [filterStatus, setFilterStatus] = useState<string>('SEMUA');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showIncompleteData, setShowIncompleteData] = useState<boolean>(false);

  // Modal states
  const [printingRecord, setPrintingRecord] = useState<PelanggaranSantriRecord | null>(null);
  const [confirmingCollectionRecord, setConfirmingCollectionRecord] = useState<PelanggaranSantriRecord | null>(null);
  const [petugasKonfirmasiInput, setPetugasKonfirmasiInput] = useState<string>(currentUserName);
  const [catatanKonfirmasiInput, setCatatanKonfirmasiInput] = useState<string>(
    'Santri telah menyelesaikan dan mengumpulkan kewajiban takziran tepat waktu.'
  );
  const [historyModalRecord, setHistoryModalRecord] = useState<PelanggaranSantriRecord | null>(null);
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);
  const [isIssuingSuratId, setIsIssuingSuratId] = useState<string | null>(null);

  // Load & Subscribe from Firestore (Single Source of Truth)
  useEffect(() => {
    let mounted = true;
    loadMasterDataFromFirestore<TemplateSuratTakziran>('pelanggaran_template').then((data) => {
      if (mounted && data && typeof data === 'object') {
        setTemplateConfig({ ...DEFAULT_TEMPLATE_SURAT_TAKZIRAN, ...data });
      }
    });
    loadMasterDataFromFirestore<PelanggaranSantriRecord[]>('pelanggaran_santri').then((data) => {
      if (mounted && Array.isArray(data)) {
        setPelanggaranRecords(data);
      }
    });
    loadMasterDataFromFirestore<PelanggaranAuditLog[]>('pelanggaran_audit').then((data) => {
      if (mounted && Array.isArray(data)) {
        setAuditLogs(data);
      }
    });

    const unsubTemplate = subscribeMasterDataFromFirestore<TemplateSuratTakziran>('pelanggaran_template', (data) => {
      if (mounted && data && typeof data === 'object') {
        setTemplateConfig({ ...DEFAULT_TEMPLATE_SURAT_TAKZIRAN, ...data });
      }
    });
    const unsubRecords = subscribeMasterDataFromFirestore<PelanggaranSantriRecord[]>('pelanggaran_santri', (data) => {
      if (mounted && Array.isArray(data)) {
        setPelanggaranRecords(data);
      }
    });
    const unsubAudit = subscribeMasterDataFromFirestore<PelanggaranAuditLog[]>('pelanggaran_audit', (data) => {
      if (mounted && Array.isArray(data)) {
        setAuditLogs(data);
      }
    });

    return () => {
      mounted = false;
      unsubTemplate();
      unsubRecords();
      unsubAudit();
    };
  }, []);

  const appendAuditLog = async (
    aksi: PelanggaranAuditLog['aksi'],
    detail: string,
    extra?: Partial<PelanggaranAuditLog>
  ) => {
    const newEntry: PelanggaranAuditLog = {
      id: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      aksi,
      aktor: currentUserName,
      detail,
      ...extra
    };
    const nextLogs = [newEntry, ...auditLogs].slice(0, 300);
    setAuditLogs(nextLogs);
    await saveMasterDataToFirestore('pelanggaran_audit', nextLogs);
  };

  // Auto-check overdue deadlines and escalate to Pelanggaran Berat (Idempotent & No Duplicate)
  useEffect(() => {
    if (!pelanggaranRecords.length) return;
    const now = new Date();
    let hasChanges = false;
    const newlyEscalated: PelanggaranSantriRecord[] = [];

    const updatedList = pelanggaranRecords.map((rec) => {
      if (
        rec.batasPengumpulan &&
        rec.statusTakziran !== 'Sudah Dikumpulkan' &&
        rec.statusTakziran !== 'Pelanggaran Berat' &&
        rec.statusTakziran !== 'Belum Diterbitkan'
      ) {
        const deadlineDate = new Date(rec.batasPengumpulan);
        if (!isNaN(deadlineDate.getTime()) && now.getTime() > deadlineDate.getTime()) {
          hasChanges = true;
          const nowIso = now.toISOString();
          const escalated: PelanggaranSantriRecord = {
            ...rec,
            jenisPelanggaran: 'Pelanggaran Berat',
            keteranganPelanggaran: templateConfig.keteranganPelanggaranBerat,
            statusTakziran: 'Pelanggaran Berat',
            tanggalNaikPelanggaranBerat: nowIso,
            updatedAt: nowIso,
            riwayatStatus: [
              ...(rec.riwayatStatus || []),
              {
                tanggal: nowIso,
                status: 'Pelanggaran Berat',
                jenisPelanggaran: 'Pelanggaran Berat',
                oleh: 'Sistem Otomatis Madrasah',
                keterangan: `Batas waktu pengumpulan (${formatTanggalIndonesia(rec.batasPengumpulan, true)}) telah terlewati tanpa konfirmasi pengumpulan takziran. Status otomatis ditingkatkan menjadi Pelanggaran Berat.`
              }
            ]
          };
          newlyEscalated.push(escalated);
          return escalated;
        }
      }
      return rec;
    });

    if (hasChanges) {
      setPelanggaranRecords(updatedList);
      saveMasterDataToFirestore('pelanggaran_santri', updatedList);
      newlyEscalated.forEach((esc) => {
        appendAuditLog(
          'NAIK_PELANGGARAN_BERAT',
          `Status takziran ${esc.namaSantri} (${esc.periodeBulan}) otomatis ditingkatkan menjadi Pelanggaran Berat karena melewati batas waktu pengumpulan.`,
          {
            idSantri: esc.idSantri,
            namaSantri: esc.namaSantri,
            periodeBulan: esc.periodeBulan,
            nomorSurat: esc.nomorSurat
          }
        );
      });
    }
  }, [pelanggaranRecords, templateConfig.keteranganPelanggaranBerat]);

  const batasMinimal = Number(templateConfig.batasMinimalKehadiran ?? 60);

  // Deteksi Otomatis Pelanggaran Santri dari Rekap Bulanan Firestore
  const { detectedViolations, incompleteSantriList } = useMemo(() => {
    const violations: PelanggaranSantriRecord[] = [];
    const incomplete: RekapBulananSantriItem[] = [];

    rekapBulananSantri.forEach((rekap) => {
      const santriMeta = santriList.find(
        (s) => s.id === rekap.id || s.nama.trim().toLowerCase() === rekap.nama.trim().toLowerCase()
      );
      const recordKey = `${rekap.id}_${selectedBulanSantri.replace(/\s+/g, '_')}`;
      const existingSaved = pelanggaranRecords.find(
        (p) =>
          p.id === recordKey ||
          (p.idSantri === rekap.id && p.periodeBulan.toLowerCase() === selectedBulanSantri.toLowerCase())
      );

      // Jika belum ada sesi absensi sama sekali pada periode ini, tandai untuk pemeriksaan Admin (bukan otomatis dianggap Alpha)
      if (rekap.totalSesi === 0 && !templateConfig.sertakanSantriTanpaSesi && !existingSaved) {
        incomplete.push(rekap);
        return;
      }

      // Ketentuan B: Santri dengan persentase kehadiran DI BAWAH batas minimal (< 60%) otomatis masuk tabel.
      // Santri dengan persentase >= batas minimal TIDAK dimasukkan (kecuali sudah pernah diterbitkan surat di bulan ini dan sedang dipantau riwayatnya).
      const isBelowThreshold = rekap.persentase < batasMinimal;
      if (!isBelowThreshold && !existingSaved) {
        return;
      }
      // Jika tidak di bawah batas dan surat belum pernah diterbitkan, jangan masukkan
      if (!isBelowThreshold && existingSaved && existingSaved.statusTakziran === 'Belum Diterbitkan') {
        return;
      }

      const nowIso = new Date().toISOString();
      const isOverdue =
        existingSaved?.batasPengumpulan &&
        existingSaved.statusTakziran !== 'Sudah Dikumpulkan' &&
        new Date().getTime() > new Date(existingSaved.batasPengumpulan).getTime();

      const resolvedStatus: StatusTakziran = isOverdue
        ? 'Pelanggaran Berat'
        : existingSaved?.statusTakziran || 'Belum Diterbitkan';

      const resolvedJenis: KategoriPelanggaran =
        resolvedStatus === 'Pelanggaran Berat' || existingSaved?.jenisPelanggaran === 'Pelanggaran Berat'
          ? 'Pelanggaran Berat'
          : 'Pelanggaran Ringan';

      const mergedRecord: PelanggaranSantriRecord = {
        id: recordKey,
        idSantri: rekap.id,
        namaSantri: rekap.nama,
        nis: santriMeta?.id || rekap.id,
        kelas: rekap.kelas,
        namaWaliKelas: santriMeta?.namaWaliKelas || '',
        periodeBulan: selectedBulanSantri,
        hadir: rekap.hadir,
        izin: rekap.izin,
        sakit: rekap.sakit,
        alpha: rekap.alpha,
        totalSesi: rekap.totalSesi,
        persentaseKehadiran: rekap.persentase,
        batasMinimalSaatItu: existingSaved?.batasMinimalSaatItu || batasMinimal,
        jenisPelanggaran: resolvedJenis,
        keteranganPelanggaran:
          resolvedJenis === 'Pelanggaran Berat'
            ? templateConfig.keteranganPelanggaranBerat
            : templateConfig.keteranganPelanggaranRingan,
        statusTakziran: resolvedStatus,
        nomorSurat: existingSaved?.nomorSurat,
        urutanNomorSurat: existingSaved?.urutanNomorSurat,
        tanggalTerbitSurat: existingSaved?.tanggalTerbitSurat,
        batasPengumpulan: existingSaved?.batasPengumpulan,
        tanggalDikumpulkan: existingSaved?.tanggalDikumpulkan,
        dikonfirmasiOleh: existingSaved?.dikonfirmasiOleh,
        catatanKonfirmasi: existingSaved?.catatanKonfirmasi,
        tanggalNaikPelanggaranBerat: existingSaved?.tanggalNaikPelanggaranBerat,
        customIsiSurat: existingSaved?.customIsiSurat,
        riwayatStatus: existingSaved?.riwayatStatus || [
          {
            tanggal: nowIso,
            status: 'Belum Diterbitkan',
            jenisPelanggaran: 'Pelanggaran Ringan',
            oleh: 'Deteksi Otomatis Rekap Bulanan',
            keterangan: `Terdeteksi kehadiran ${rekap.persentase}% (di bawah batas minimal ${batasMinimal}%) pada periode ${selectedBulanSantri}.`
          }
        ],
        updatedAt: existingSaved?.updatedAt || nowIso
      };

      violations.push(mergedRecord);
    });

    return {
      detectedViolations: violations.sort((a, b) => a.persentaseKehadiran - b.persentaseKehadiran),
      incompleteSantriList: incomplete
    };
  }, [rekapBulananSantri, santriList, selectedBulanSantri, pelanggaranRecords, batasMinimal, templateConfig]);

  const classOptions = useMemo(() => {
    return ['SEMUA', ...Array.from(new Set(santriList.map((s) => s.kelas)))];
  }, [santriList]);

  const filteredViolations = useMemo(() => {
    return detectedViolations.filter((item) => {
      if (filterKelas !== 'SEMUA' && item.kelas !== filterKelas) return false;
      if (filterStatus !== 'SEMUA' && item.statusTakziran !== filterStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.namaSantri.toLowerCase().includes(q);
        const matchNis = item.nis.toLowerCase().includes(q);
        const matchNo = (item.nomorSurat || '').toLowerCase().includes(q);
        if (!matchName && !matchNis && !matchNo) return false;
      }
      return true;
    });
  }, [detectedViolations, filterKelas, filterStatus, searchQuery]);

  // Handler Terbitkan & Cetak Surat Takziran
  const handleCetakSuratTakziran = async (item: PelanggaranSantriRecord) => {
    try {
      setIsIssuingSuratId(item.id);

      // Jika surat sudah pernah diterbitkan, gunakan nomor surat & batas waktu yang sudah ada (tidak menggandakan nomor)
      if (item.nomorSurat && item.statusTakziran !== 'Belum Diterbitkan') {
        setPrintingRecord(item);
        return;
      }

      // Hitung urutan tertinggi yang ada sebagai pengaman tambahan transaksi atomik
      const maxExistingSeq = pelanggaranRecords.reduce(
        (max, r) => Math.max(max, r.urutanNomorSurat || 0),
        0
      );

      const { nomorSurat, urutan } = await generateAtomicNomorSuratTakziran(
        templateConfig.formatNomorSurat,
        item.periodeBulan,
        maxExistingSeq
      );

      const now = new Date();
      const nowIso = now.toISOString();
      const deadlineIso = computeBatasPengumpulanISO(
        now,
        templateConfig.durasiPengumpulanHari,
        templateConfig.jamBatasAkhir
      );

      const issuedRecord: PelanggaranSantriRecord = {
        ...item,
        nomorSurat,
        urutanNomorSurat: urutan,
        tanggalTerbitSurat: nowIso,
        batasPengumpulan: deadlineIso,
        statusTakziran: 'Menunggu Pengumpulan',
        batasMinimalSaatItu: batasMinimal,
        updatedAt: nowIso,
        riwayatStatus: [
          ...(item.riwayatStatus || []),
          {
            tanggal: nowIso,
            status: 'Surat Diterbitkan',
            jenisPelanggaran: item.jenisPelanggaran,
            oleh: currentUserName,
            keterangan: `Surat Takziran diterbitkan dengan Nomor: ${nomorSurat}. Batas pengumpulan: ${formatTanggalIndonesia(deadlineIso, true)}.`
          },
          {
            tanggal: nowIso,
            status: 'Menunggu Pengumpulan',
            jenisPelanggaran: item.jenisPelanggaran,
            oleh: 'Sistem Takziran',
            keterangan: `Menunggu santri menyerahkan bukti takziran maksimal ${templateConfig.durasiPengumpulanHari} hari.`
          }
        ]
      };

      const nextList = [
        issuedRecord,
        ...pelanggaranRecords.filter((p) => p.id !== issuedRecord.id)
      ];
      setPelanggaranRecords(nextList);
      await saveMasterDataToFirestore('pelanggaran_santri', nextList);

      await appendAuditLog(
        'TERBITKAN_SURAT',
        `Menerbitkan Surat Takziran No. ${nomorSurat} untuk santri ${issuedRecord.namaSantri} (${issuedRecord.kelas}) - Kehadiran ${issuedRecord.persentaseKehadiran}%.`,
        {
          idSantri: issuedRecord.idSantri,
          namaSantri: issuedRecord.namaSantri,
          periodeBulan: issuedRecord.periodeBulan,
          nomorSurat
        }
      );

      setPrintingRecord(issuedRecord);
    } finally {
      setIsIssuingSuratId(null);
    }
  };

  // Handler Konfirmasi Pengumpulan Takziran
  const handleConfirmPengumpulan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmingCollectionRecord) return;

    const nowIso = new Date().toISOString();
    const updatedRecord: PelanggaranSantriRecord = {
      ...confirmingCollectionRecord,
      statusTakziran: 'Sudah Dikumpulkan',
      tanggalDikumpulkan: nowIso,
      dikonfirmasiOleh: petugasKonfirmasiInput.trim() || currentUserName,
      catatanKonfirmasi: catatanKonfirmasiInput.trim(),
      updatedAt: nowIso,
      riwayatStatus: [
        ...(confirmingCollectionRecord.riwayatStatus || []),
        {
          tanggal: nowIso,
          status: 'Sudah Dikumpulkan',
          jenisPelanggaran: confirmingCollectionRecord.jenisPelanggaran,
          oleh: petugasKonfirmasiInput.trim() || currentUserName,
          keterangan: `Takziran telah dikumpulkan & dikonfirmasi oleh ${petugasKonfirmasiInput.trim() || currentUserName}. Catatan: ${catatanKonfirmasiInput.trim()}`
        }
      ]
    };

    const nextList = [
      updatedRecord,
      ...pelanggaranRecords.filter((p) => p.id !== updatedRecord.id)
    ];
    setPelanggaranRecords(nextList);
    await saveMasterDataToFirestore('pelanggaran_santri', nextList);

    await appendAuditLog(
      'KONFIRMASI_PENGUMPULAN',
      `Konfirmasi pengumpulan takziran santri ${updatedRecord.namaSantri} (No. Surat: ${updatedRecord.nomorSurat || '-'}) oleh petugas ${updatedRecord.dikonfirmasiOleh}.`,
      {
        idSantri: updatedRecord.idSantri,
        namaSantri: updatedRecord.namaSantri,
        periodeBulan: updatedRecord.periodeBulan,
        nomorSurat: updatedRecord.nomorSurat
      }
    );

    setConfirmingCollectionRecord(null);
  };

  // Simpan hasil edit surat spesifik
  const handleSaveEditedRecord = async (updated: PelanggaranSantriRecord) => {
    const nowIso = new Date().toISOString();
    const withHistory: PelanggaranSantriRecord = {
      ...updated,
      updatedAt: nowIso,
      riwayatStatus: [
        ...(updated.riwayatStatus || []),
        {
          tanggal: nowIso,
          status: updated.statusTakziran,
          jenisPelanggaran: updated.jenisPelanggaran,
          oleh: currentUserName,
          keterangan: `Isi surat takziran (${updated.nomorSurat || '-'}) disesuaikan melalui editor pratinjau.`
        }
      ]
    };
    const nextList = [withHistory, ...pelanggaranRecords.filter((p) => p.id !== withHistory.id)];
    setPelanggaranRecords(nextList);
    await saveMasterDataToFirestore('pelanggaran_santri', nextList);
    setPrintingRecord(withHistory);

    await appendAuditLog(
      'EDIT_SURAT',
      `Mengedit isi Surat Takziran No. ${withHistory.nomorSurat || '-'} untuk santri ${withHistory.namaSantri}.`,
      {
        idSantri: withHistory.idSantri,
        namaSantri: withHistory.namaSantri,
        periodeBulan: withHistory.periodeBulan,
        nomorSurat: withHistory.nomorSurat
      }
    );
  };

  const bulanParts = selectedBulanSantri.trim().split(/\s+/);
  const currentMonthName = bulanParts[0] || 'November';
  const currentYearName = bulanParts[1] || String(new Date().getFullYear());

  return (
    <div className="space-y-6">
      {/* HEADER MODUL PELANGGARAN SANTRI */}
      <div className="card-3d rounded-3xl p-5 sm:p-6 border-2 border-[#d4af37]/50 bg-gradient-to-br from-[#072919] via-[#041a10] to-[#020e08] shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#d4af37]/25">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 border-2 border-red-400/60 flex items-center justify-center text-red-300 shadow-lg shrink-0">
              <ShieldAlert className="w-6 h-6 text-[#d4af37]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-xl font-black text-white text-gold-3d uppercase tracking-wide">
                  TAB PELANGGARAN SANTRI & SURAT TAKZIRAN OTOMATIS
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-400/50 text-emerald-300 text-[10px] font-mono font-bold">
                  Firestore Real-Time Sync
                </span>
              </div>
              <p className="text-xs text-emerald-200/90 mt-1">
                Deteksi otomatis santri dengan persentase kehadiran bulanan di bawah <b className="text-[#f3e5ab]">{batasMinimal}%</b> pada Rekap Absensi Bulanan beserta penerbitan & pencetakan Surat Takziran resmi ukuran A4.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Pemilih Bulan & Tahun Terintegrasi dengan Rekap Absensi Bulanan */}
            <div className="flex items-center gap-1.5 bg-[#03150d] px-3 py-1.5 rounded-xl border border-[#d4af37]/40">
              <Calendar className="w-4 h-4 text-[#d4af37]" />
              <select
                value={currentMonthName}
                onChange={(e) => setSelectedBulanSantri(`${e.target.value} ${currentYearName}`)}
                className="bg-transparent text-xs font-bold text-[#f3e5ab] focus:outline-none cursor-pointer"
              >
                {daftarBulan.map((b) => (
                  <option key={b} value={b} className="bg-[#03150d] text-white">
                    {b}
                  </option>
                ))}
              </select>
              <select
                value={currentYearName}
                onChange={(e) => setSelectedBulanSantri(`${currentMonthName} ${e.target.value}`)}
                className="bg-transparent text-xs font-bold text-emerald-300 font-mono focus:outline-none cursor-pointer"
              >
                {daftarTahun.map((t) => (
                  <option key={t} value={t} className="bg-[#03150d] text-white">
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setShowAuditModal(true)}
              className="px-3.5 py-2 rounded-xl bg-[#083321] hover:bg-[#0b462e] border border-[#d4af37]/40 text-[#f3e5ab] font-bold text-xs flex items-center gap-1.5 transition shadow"
            >
              <History className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Log Audit ({auditLogs.length})</span>
            </button>
          </div>
        </div>

        {/* KARTU STATISTIK PELANGGARAN BULAN INI */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="card-3d-deep p-3.5 rounded-2xl border border-[#d4af37]/30">
            <span className="text-[10px] font-bold text-emerald-300 uppercase block">
              Batas Minimal Kehadiran
            </span>
            <div className="text-xl sm:text-2xl font-black text-[#f3e5ab] font-mono mt-1">
              &lt; {batasMinimal}%
            </div>
            <span className="text-[10px] text-slate-300 block mt-0.5">
              Dapat diatur di Option Panel
            </span>
          </div>

          <div className="card-3d-deep p-3.5 rounded-2xl border border-amber-500/40">
            <span className="text-[10px] font-bold text-amber-300 uppercase block">
              Total Terdeteksi ({selectedBulanSantri})
            </span>
            <div className="text-xl sm:text-2xl font-black text-white font-mono mt-1">
              {detectedViolations.length} <span className="text-xs font-normal text-amber-200">Santri</span>
            </div>
            <span className="text-[10px] text-amber-200/80 block mt-0.5">
              Kehadiran di bawah {batasMinimal}%
            </span>
          </div>

          <div className="card-3d-deep p-3.5 rounded-2xl border border-blue-500/40">
            <span className="text-[10px] font-bold text-blue-300 uppercase block">
              Menunggu Pengumpulan
            </span>
            <div className="text-xl sm:text-2xl font-black text-blue-200 font-mono mt-1">
              {
                detectedViolations.filter(
                  (v) => v.statusTakziran === 'Menunggu Pengumpulan' || v.statusTakziran === 'Surat Diterbitkan'
                ).length
              }{' '}
              <span className="text-xs font-normal">Santri</span>
            </div>
            <span className="text-[10px] text-blue-300/80 block mt-0.5">
              Durasi maks. {templateConfig.durasiPengumpulanHari} hari
            </span>
          </div>

          <div className="card-3d-deep p-3.5 rounded-2xl border border-red-500/50">
            <span className="text-[10px] font-bold text-red-300 uppercase block">
              Pelanggaran Berat
            </span>
            <div className="text-xl sm:text-2xl font-black text-red-400 font-mono mt-1">
              {detectedViolations.filter((v) => v.statusTakziran === 'Pelanggaran Berat').length}{' '}
              <span className="text-xs font-normal text-red-200">Santri</span>
            </div>
            <span className="text-[10px] text-red-300/80 block mt-0.5">
              Melewati batas pengumpulan
            </span>
          </div>

          <div className="card-3d-deep p-3.5 rounded-2xl border border-emerald-500/40 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-emerald-300 uppercase block">
              Sudah Dikumpulkan
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-1">
              {detectedViolations.filter((v) => v.statusTakziran === 'Sudah Dikumpulkan').length}{' '}
              <span className="text-xs font-normal text-emerald-200">Selesai</span>
            </div>
            <span className="text-[10px] text-emerald-300/80 block mt-0.5">
              Terkonfirmasi petugas
            </span>
          </div>
        </div>

        {/* FILTER & PENCARIAN */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-[#02120b] border border-[#d4af37]/30 rounded-xl px-3 py-1.5">
              <Filter className="w-3.5 h-3.5 text-[#d4af37]" />
              <span className="text-[11px] text-emerald-300">Kelas:</span>
              <select
                value={filterKelas}
                onChange={(e) => setFilterKelas(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
              >
                {classOptions.map((kls) => (
                  <option key={kls} value={kls} className="bg-[#03150d] text-white">
                    {kls}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-[#02120b] border border-[#d4af37]/30 rounded-xl px-3 py-1.5">
              <span className="text-[11px] text-emerald-300">Status Takziran:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent text-xs font-bold text-[#f3e5ab] focus:outline-none cursor-pointer"
              >
                <option value="SEMUA" className="bg-[#03150d] text-white">SEMUA STATUS</option>
                <option value="Belum Diterbitkan" className="bg-[#03150d] text-white">Belum Diterbitkan</option>
                <option value="Surat Diterbitkan" className="bg-[#03150d] text-white">Surat Diterbitkan</option>
                <option value="Menunggu Pengumpulan" className="bg-[#03150d] text-white">Menunggu Pengumpulan</option>
                <option value="Sudah Dikumpulkan" className="bg-[#03150d] text-white">Sudah Dikumpulkan</option>
                <option value="Terlambat" className="bg-[#03150d] text-white">Terlambat</option>
                <option value="Pelanggaran Berat" className="bg-[#03150d] text-white">Pelanggaran Berat</option>
              </select>
            </div>
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama santri, NIS, nomor surat..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#02120b] border border-[#d4af37]/30 text-xs text-white focus:outline-none focus:border-[#d4af37]"
            />
          </div>
        </div>
      </div>

      {/* TABEL UTAMA 14 KOLOM PELANGGARAN SANTRI */}
      <div className="card-3d rounded-3xl p-4 sm:p-5 border border-[#d4af37]/40 bg-[#03150d]/95 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#d4af37]/20">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-white text-gold-3d">
              Daftar Santri Terkena Pelanggaran Kehadiran (&lt; {batasMinimal}%) — Periode {selectedBulanSantri}
            </h3>
            <p className="text-[11px] text-emerald-300">
              Santri dengan kehadiran tepat {batasMinimal}% atau lebih tidak dimasukkan ke dalam daftar pelanggaran ini.
            </p>
          </div>
          <span className="text-xs font-mono text-[#f3e5ab] bg-[#052216] px-3 py-1 rounded-xl border border-[#d4af37]/30">
            Menampilkan <b>{filteredViolations.length}</b> santri
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[#d4af37]/30">
          <table className="w-full min-w-[1250px] text-left text-xs">
            <thead className="bg-[#052216] text-[#d4af37] uppercase border-b border-[#d4af37]/30">
              <tr>
                <th className="p-3 w-12 text-center">1. NO</th>
                <th className="p-3">2. NAMA SANTRI</th>
                <th className="p-3 w-28">3. NIS</th>
                <th className="p-3 w-32">4. KELAS</th>
                <th className="p-3 w-32">5. BULAN & TAHUN</th>
                <th className="p-3 w-16 text-center text-emerald-300">6. HADIR</th>
                <th className="p-3 w-16 text-center text-amber-300">7. IZIN</th>
                <th className="p-3 w-16 text-center text-blue-300">8. SAKIT</th>
                <th className="p-3 w-16 text-center text-red-300">9. ALPHA</th>
                <th className="p-3 w-28 text-center">10. PERSENTASE</th>
                <th className="p-3 w-40">11. JENIS PELANGGARAN</th>
                <th className="p-3 w-40 text-center">12. STATUS TAKZIRAN</th>
                <th className="p-3 w-44">13. BATAS PENGUMPULAN</th>
                <th className="p-3 w-64 text-center">14. AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d4af37]/15 bg-[#020e08]/90">
              {filteredViolations.map((item, idx) => {
                const isBerat =
                  item.jenisPelanggaran === 'Pelanggaran Berat' || item.statusTakziran === 'Pelanggaran Berat';
                return (
                  <tr
                    key={item.id}
                    className={`transition ${
                      isBerat ? 'bg-red-950/25 hover:bg-red-950/40' : 'hover:bg-[#d4af37]/5'
                    }`}
                  >
                    <td className="p-3 text-center font-mono text-[#d4af37] font-bold">{idx + 1}</td>
                    <td className="p-3 font-extrabold text-white">
                      <div>{item.namaSantri}</div>
                      {item.nomorSurat && (
                        <span className="text-[10px] font-mono text-amber-300 block mt-0.5">
                          No: {item.nomorSurat}
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono text-emerald-300 font-semibold">{item.nis}</td>
                    <td className="p-3 text-[#f3e5ab] font-semibold">{item.kelas}</td>
                    <td className="p-3 font-mono text-slate-200">{item.periodeBulan}</td>
                    <td className="p-3 text-center font-mono font-bold text-emerald-400">{item.hadir}</td>
                    <td className="p-3 text-center font-mono font-bold text-amber-300">{item.izin}</td>
                    <td className="p-3 text-center font-mono font-bold text-blue-300">{item.sakit}</td>
                    <td className="p-3 text-center font-mono font-bold text-red-400">{item.alpha}</td>
                    <td className="p-3 text-center">
                      <span className="px-2.5 py-1 rounded-lg bg-red-950/90 border border-red-500/60 text-red-200 font-mono font-black text-xs inline-block">
                        {item.persentaseKehadiran}%
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">
                        Min: {batasMinimal}%
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold inline-block border ${
                          isBerat
                            ? 'bg-red-900/90 text-white border-red-400 shadow'
                            : 'bg-amber-950/90 text-amber-200 border-amber-500/50'
                        }`}
                      >
                        {isBerat ? templateConfig.labelPelanggaranBerat : templateConfig.labelPelanggaranRingan}
                      </span>
                      <span className="text-[10px] text-slate-300 block mt-1 line-clamp-2">
                        {item.keteranganPelanggaran}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold inline-block border ${
                          item.statusTakziran === 'Sudah Dikumpulkan'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-500/60'
                            : item.statusTakziran === 'Pelanggaran Berat'
                            ? 'bg-red-950 text-red-300 border-red-500 animate-pulse'
                            : item.statusTakziran === 'Menunggu Pengumpulan' ||
                              item.statusTakziran === 'Surat Diterbitkan'
                            ? 'bg-blue-950 text-blue-200 border-blue-400/50'
                            : 'bg-stone-900 text-stone-300 border-stone-600'
                        }`}
                      >
                        {item.statusTakziran}
                      </span>
                      {item.dikonfirmasiOleh && (
                        <span className="text-[9px] text-emerald-300 block mt-1">
                          Oleh: {item.dikonfirmasiOleh}
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono text-[11px]">
                      {item.batasPengumpulan ? (
                        <div>
                          <span className="text-[#f3e5ab] font-bold block">
                            {formatTanggalIndonesia(item.batasPengumpulan, true)}
                          </span>
                          {item.statusTakziran === 'Sudah Dikumpulkan' && item.tanggalDikumpulkan ? (
                            <span className="text-[10px] text-emerald-400 block">
                              ✓ Dikumpulkan: {formatTanggalIndonesia(item.tanggalDikumpulkan, false)}
                            </span>
                          ) : isBerat ? (
                            <span className="text-[10px] text-red-400 font-bold block">
                              ⚠ Melewati Batas Waktu!
                            </span>
                          ) : (
                            <span className="text-[10px] text-blue-300 block">
                              Durasi: {templateConfig.durasiPengumpulanHari} Hari
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[10px]">
                          Dihitung otomatis ({templateConfig.durasiPengumpulanHari} hari) saat surat diterbitkan
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap items-center justify-center gap-1.5">
                        {/* TOMBOL CETAK SURAT TAKZIRAN */}
                        <button
                          type="button"
                          disabled={isIssuingSuratId === item.id}
                          onClick={() => handleCetakSuratTakziran(item)}
                          className="btn-3d-gold px-3 py-1.5 rounded-xl text-black font-extrabold text-[11px] flex items-center gap-1 shadow hover:brightness-105 transition"
                          title="Terbitkan nomor surat otomatis & buka halaman cetak A4"
                        >
                          <Printer className="w-3.5 h-3.5 text-black shrink-0" />
                          <span>
                            {isIssuingSuratId === item.id
                              ? 'Memproses...'
                              : 'CETAK SURAT TAKZIRAN'}
                          </span>
                        </button>

                        {/* TOMBOL KONFIRMASI PENGUMPULAN */}
                        {item.statusTakziran !== 'Sudah Dikumpulkan' && (
                          <button
                            type="button"
                            onClick={() => {
                              setPetugasKonfirmasiInput(currentUserName);
                              setConfirmingCollectionRecord(item);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-900/90 hover:bg-emerald-800 border border-emerald-400/50 text-emerald-100 font-bold text-[10px] flex items-center gap-1 transition shadow"
                            title="Konfirmasi bahwa santri telah mengumpulkan takziran"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                            <span>Konfirmasi Pengumpulan</span>
                          </button>
                        )}

                        {/* TOMBOL LIHAT RIWAYAT & DETAIL */}
                        <button
                          type="button"
                          onClick={() => setHistoryModalRecord(item)}
                          className="px-2.5 py-1.5 rounded-xl bg-[#062919] hover:bg-[#0a3d26] border border-[#d4af37]/40 text-[#f3e5ab] font-bold text-[10px] flex items-center gap-1 transition"
                          title="Lihat detail & riwayat status pelanggaran santri"
                        >
                          <FileText className="w-3 h-3 text-[#d4af37]" />
                          <span>Detail & Riwayat</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredViolations.length === 0 && (
                <tr>
                  <td colSpan={14} className="p-8 text-center text-emerald-300 space-y-2">
                    <div className="text-sm font-bold text-[#f3e5ab]">
                      Alhamdulillah, tidak ada santri dengan kehadiran di bawah {batasMinimal}% pada filter & periode {selectedBulanSantri}.
                    </div>
                    <div className="text-xs text-emerald-300/80">
                      Jika ada perubahan absensi atau revisi pada Rekap Absensi Bulanan, daftar pelanggaran ini akan otomatis diperbarui secara real-time.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* INFORMASI PEMERIKSAAN DATA BELUM LENGKAP (TANPA SESI ABSENSI) */}
        {incompleteSantriList.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-[#041d12] border border-[#d4af37]/30 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Terdapat <b>{incompleteSantriList.length} santri</b> yang belum memiliki catatan sesi absensi pada periode <b>{selectedBulanSantri}</b> (ditandai untuk pemeriksaan Admin, tidak otomatis dianggap Alpha).
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowIncompleteData(!showIncompleteData)}
                className="px-3 py-1 rounded-xl bg-[#083321] border border-[#d4af37]/40 text-[#f3e5ab] text-[11px] font-bold self-start sm:self-auto"
              >
                {showIncompleteData ? 'Sembunyikan Daftar Pemeriksaan' : 'Lihat Daftar Pemeriksaan'}
              </button>
            </div>
            {showIncompleteData && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 pt-2">
                {incompleteSantriList.map((s) => (
                  <div
                    key={s.id}
                    className="p-2.5 rounded-xl bg-black/40 border border-amber-500/25 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">{s.nama}</div>
                      <div className="text-[10px] text-emerald-300 font-mono">
                        NIS: {s.id} • {s.kelas}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/40 text-[10px] font-mono">
                      0 Sesi
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL PRATINJAU & CETAK SURAT TAKZIRAN A4 */}
      {printingRecord && (
        <SuratTakziranPrintModal
          isOpen={Boolean(printingRecord)}
          onClose={() => setPrintingRecord(null)}
          template={templateConfig}
          record={printingRecord}
          settings={settings}
          onSaveEditedRecord={handleSaveEditedRecord}
        />
      )}

      {/* MODAL KONFIRMASI PENGUMPULAN TAKZIRAN */}
      {confirmingCollectionRecord && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="card-3d rounded-3xl p-6 max-w-md w-full border-2 border-emerald-400 bg-[#041d12] space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-emerald-500/30 pb-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                <div>
                  <h4 className="text-sm font-extrabold text-white text-gold-3d">
                    Konfirmasi Pengumpulan Takziran
                  </h4>
                  <p className="text-[11px] text-emerald-300">
                    {confirmingCollectionRecord.namaSantri} ({confirmingCollectionRecord.kelas})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmingCollectionRecord(null)}
                className="p-1 rounded-lg bg-red-950 text-red-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmPengumpulan} className="space-y-3 text-xs">
              <div>
                <label className="text-emerald-300 font-bold block mb-1">
                  Nama Petugas Penerima / Pengonfirmasi:
                </label>
                <input
                  type="text"
                  required
                  value={petugasKonfirmasiInput}
                  onChange={(e) => setPetugasKonfirmasiInput(e.target.value)}
                  className="w-full bg-[#02100a] border border-[#d4af37]/40 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-emerald-300 font-bold block mb-1">
                  Catatan Penyelesaian Takziran:
                </label>
                <textarea
                  rows={3}
                  required
                  value={catatanKonfirmasiInput}
                  onChange={(e) => setCatatanKonfirmasiInput(e.target.value)}
                  className="w-full bg-[#02100a] border border-[#d4af37]/40 rounded-xl p-2.5 text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmingCollectionRecord(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-3d-gold px-4 py-2 rounded-xl text-black font-extrabold flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 text-black" />
                  <span>Simpan Konfirmasi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETAIL & RIWAYAT PELANGGARAN SANTRI */}
      {historyModalRecord && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="card-3d rounded-3xl p-6 max-w-xl w-full border-2 border-[#d4af37] bg-[#041d12] space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#d4af37]/30 pb-3">
              <div>
                <h4 className="text-base font-extrabold text-white text-gold-3d">
                  Detail Pelanggaran & Riwayat Status Takziran
                </h4>
                <p className="text-xs text-emerald-300">
                  {historyModalRecord.namaSantri} • NIS: {historyModalRecord.nis} • {historyModalRecord.kelas}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryModalRecord(null)}
                className="p-1.5 rounded-xl bg-red-950 text-red-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-black/40 border border-[#d4af37]/25">
                <span className="text-[10px] text-slate-400 block">No. Surat:</span>
                <b className="text-[#f3e5ab]">{historyModalRecord.nomorSurat || 'Belum Terbit'}</b>
              </div>
              <div className="p-2.5 rounded-xl bg-black/40 border border-[#d4af37]/25">
                <span className="text-[10px] text-slate-400 block">Kehadiran:</span>
                <b className="text-red-300">{historyModalRecord.persentaseKehadiran}%</b>
              </div>
              <div className="p-2.5 rounded-xl bg-black/40 border border-[#d4af37]/25">
                <span className="text-[10px] text-slate-400 block">H / I / S / A:</span>
                <b className="text-white">
                  {historyModalRecord.hadir}/{historyModalRecord.izin}/{historyModalRecord.sakit}/{historyModalRecord.alpha}
                </b>
              </div>
              <div className="p-2.5 rounded-xl bg-black/40 border border-[#d4af37]/25">
                <span className="text-[10px] text-slate-400 block">Status:</span>
                <b className="text-emerald-300">{historyModalRecord.statusTakziran}</b>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-[#f3e5ab] block">
                Kronologi & Riwayat Status:
              </span>
              <div className="space-y-2">
                {(historyModalRecord.riwayatStatus || []).map((r, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-[#02100a] border border-[#d4af37]/25 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[#f3e5ab]">{r.status}</span>
                      <span className="text-[10px] font-mono text-emerald-300">
                        {formatTanggalIndonesia(r.tanggal, true)}
                      </span>
                    </div>
                    <p className="text-slate-200 text-[11px]">{r.keterangan}</p>
                    <span className="text-[10px] text-slate-400 block">Petugas/Sistem: {r.oleh}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LOG AUDIT KEAMANAN */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="card-3d rounded-3xl p-6 max-w-2xl w-full border-2 border-[#d4af37] bg-[#041d12] space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#d4af37]/30 pb-3">
              <div>
                <h4 className="text-base font-extrabold text-white text-gold-3d">
                  Audit Log Sistem Pelanggaran & Surat Takziran
                </h4>
                <p className="text-xs text-emerald-300">
                  Pencatatan permanen di Firebase Firestore atas setiap perubahan pengaturan, penerbitan surat, dan konfirmasi.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAuditModal(false)}
                className="p-1.5 rounded-xl bg-red-950 text-red-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {auditLogs.length === 0 ? (
                <div className="p-6 text-center text-xs text-emerald-300">
                  Belum ada catatan log audit.
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-[#02100a] border border-[#d4af37]/25 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono text-[10px] font-bold">
                        {log.aksi}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-300">
                        {formatTanggalIndonesia(log.timestamp, true)}
                      </span>
                    </div>
                    <p className="text-white text-xs">{log.detail}</p>
                    <div className="text-[10px] text-slate-400 flex items-center gap-3">
                      <span>Oleh: {log.aktor}</span>
                      {log.nomorSurat && <span>No. Surat: {log.nomorSurat}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * KOMPONEN OPTION PANEL — SATU TAB PENGATURAN:
 * "PENGATURAN PELANGGARAN & SURAT TAKZIRAN"
 */
export const OptionPanelPelanggaranTakziran: React.FC<{
  settings: AppSettings;
  santriList: Santri[];
  rekapBulananSantri: RekapBulananSantriItem[];
  selectedBulanSantri: string;
}> = ({ settings, santriList, rekapBulananSantri, selectedBulanSantri }) => {
  const [formConfig, setFormConfig] = useState<TemplateSuratTakziran>(DEFAULT_TEMPLATE_SURAT_TAKZIRAN);
  const [isSaving, setIsSaving] = useState(false);
  const [saveBanner, setSaveBanner] = useState<string | null>(null);
  const [showSamplePreview, setShowSamplePreview] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let mounted = true;
    loadMasterDataFromFirestore<TemplateSuratTakziran>('pelanggaran_template').then((data) => {
      if (mounted && data && typeof data === 'object') {
        setFormConfig({ ...DEFAULT_TEMPLATE_SURAT_TAKZIRAN, ...data });
      }
    });
    const unsub = subscribeMasterDataFromFirestore<TemplateSuratTakziran>('pelanggaran_template', (data) => {
      if (mounted && data && typeof data === 'object') {
        setFormConfig({ ...DEFAULT_TEMPLATE_SURAT_TAKZIRAN, ...data });
      }
    });
    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  const handleSaveConfigToFirestore = async (customMsg?: string) => {
    const validatedPct = Math.max(0, Math.min(100, Number(formConfig.batasMinimalKehadiran) || 0));
    const validatedDays = Math.max(1, Number(formConfig.durasiPengumpulanHari) || 3);
    const payload: TemplateSuratTakziran = {
      ...formConfig,
      batasMinimalKehadiran: validatedPct,
      durasiPengumpulanHari: validatedDays,
      updatedAt: new Date().toISOString(),
      updatedBy: 'Admin'
    };

    setIsSaving(true);
    try {
      setFormConfig(payload);
      await saveMasterDataToFirestore('pelanggaran_template', payload);

      // Catat ke Audit Log
      const existingLogs = (await loadMasterDataFromFirestore<PelanggaranAuditLog[]>('pelanggaran_audit')) || [];
      const newAudit: PelanggaranAuditLog = {
        id: `AUD-${Date.now()}`,
        timestamp: new Date().toISOString(),
        aksi: 'UBAH_TEMPLATE',
        aktor: 'Admin',
        detail:
          customMsg ||
          `Menyimpan Pengaturan Pelanggaran & Template Surat Takziran (Batas Minimal: ${validatedPct}%, Durasi Pengumpulan: ${validatedDays} Hari).`
      };
      await saveMasterDataToFirestore('pelanggaran_audit', [newAudit, ...existingLogs].slice(0, 300));

      const msg =
        customMsg ||
        `Alhamdulillah! Pengaturan Pelanggaran (Batas Minimal ${validatedPct}%) & Template Surat Takziran berhasil disimpan permanen ke Firebase Firestore.`;
      setSaveBanner(msg);
      setTimeout(() => setSaveBanner(null), 6000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaultTemplate = async () => {
    if (!window.confirm('Kembalikan seluruh format Surat Takziran dan kriteria ke pengaturan awal (Default 60%)?')) {
      return;
    }
    const resetPayload: TemplateSuratTakziran = {
      ...DEFAULT_TEMPLATE_SURAT_TAKZIRAN,
      updatedAt: new Date().toISOString(),
      updatedBy: 'Admin'
    };
    setFormConfig(resetPayload);
    await saveMasterDataToFirestore('pelanggaran_template', resetPayload);
    setSaveBanner('Template Surat Takziran dan kriteria berhasil dikembalikan ke pengaturan default.');
    setTimeout(() => setSaveBanner(null), 5000);
  };

  const handleUploadLogoSurat = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressedDataUrl = await compressImageFile(file, 300, 0.85);
      setFormConfig((prev) => ({
        ...prev,
        logoUrl: compressedDataUrl,
        gunakanLogoUtama: false
      }));
    } catch (err) {
      console.warn('Gagal mengompres logo surat:', err);
    }
  };

  // Hitung simulasi langsung berapa santri yang masuk kriteria dengan persentase saat ini
  const previewDetectedCount = useMemo(() => {
    const pct = Math.max(0, Math.min(100, Number(formConfig.batasMinimalKehadiran) || 0));
    return rekapBulananSantri.filter(
      (r) => (r.totalSesi > 0 || formConfig.sertakanSantriTanpaSesi) && r.persentase < pct
    ).length;
  }, [rekapBulananSantri, formConfig.batasMinimalKehadiran, formConfig.sertakanSantriTanpaSesi]);

  const sampleSantri = santriList[0] || {
    id: '2026001',
    nama: 'Ahmad Fauzi Al-Maliki',
    kelas: '1 TSANAWIYAH',
    namaWaliKelas: 'Ust. M. Rizqi Fadlillah, S.Pd.'
  };

  const sampleRecord: PelanggaranSantriRecord = {
    id: 'SAMPLE-PREVIEW',
    idSantri: sampleSantri.id,
    namaSantri: sampleSantri.nama,
    nis: sampleSantri.id,
    kelas: sampleSantri.kelas,
    namaWaliKelas: sampleSantri.namaWaliKelas,
    periodeBulan: selectedBulanSantri,
    hadir: 10,
    izin: 2,
    sakit: 1,
    alpha: 7,
    totalSesi: 20,
    persentaseKehadiran: 50,
    batasMinimalSaatItu: formConfig.batasMinimalKehadiran,
    jenisPelanggaran: 'Pelanggaran Ringan',
    keteranganPelanggaran: formConfig.keteranganPelanggaranRingan,
    statusTakziran: 'Surat Diterbitkan',
    nomorSurat: formatNomorSuratFromCounter(1, formConfig.formatNomorSurat, selectedBulanSantri),
    tanggalTerbitSurat: new Date().toISOString(),
    batasPengumpulan: computeBatasPengumpulanISO(
      new Date(),
      formConfig.durasiPengumpulanHari,
      formConfig.jamBatasAkhir
    ),
    riwayatStatus: [],
    updatedAt: new Date().toISOString()
  };

  return (
    <div className="space-y-6">
      <div className="card-3d rounded-3xl p-5 sm:p-6 border-2 border-[#d4af37]/50 bg-[#03180f] space-y-6 shadow-2xl">
        {/* Header Option Panel Tab */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#d4af37]/30">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#d4af37]/20 border border-[#d4af37]/60 flex items-center justify-center text-[#d4af37] shadow">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white text-gold-3d uppercase">
                PENGATURAN PELANGGARAN & SURAT TAKZIRAN
              </h3>
              <p className="text-xs text-emerald-300">
                Pusat pengaturan batas minimal kehadiran bulanan, durasi pengumpulan takziran, kriteria pelanggaran berat, serta editor penuh Kop, Logo & Format Surat Takziran A4.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSamplePreview(true)}
              className="px-3.5 py-2 rounded-xl bg-[#083321] hover:bg-[#0c472f] border border-[#d4af37]/50 text-[#f3e5ab] font-bold text-xs flex items-center gap-1.5 shadow transition"
            >
              <Eye className="w-4 h-4 text-[#d4af37]" />
              <span>Pratinjau Surat</span>
            </button>

            <button
              type="button"
              onClick={handleResetDefaultTemplate}
              className="px-3.5 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-200 font-bold text-xs flex items-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Kembalikan ke Template Default</span>
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSaveConfigToFirestore()}
              className="btn-3d-gold px-5 py-2 rounded-xl text-black font-extrabold text-xs flex items-center gap-1.5 shadow-lg"
            >
              <Save className="w-4 h-4 text-black" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan & Template'}</span>
            </button>
          </div>
        </div>

        {saveBanner && (
          <div className="p-3.5 rounded-2xl bg-emerald-950/90 border border-emerald-400 text-emerald-200 text-xs font-bold flex items-center gap-2 shadow-lg">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{saveBanner}</span>
          </div>
        )}

        {/* BAGIAN 1 & 2: PENGATURAN PERSENTASE KEHADIRAN & BATAS WAKTU PENGUMPULAN */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* 1. Pengaturan Persentase Kehadiran */}
          <div className="card-3d-deep rounded-2xl p-5 border border-[#d4af37]/35 space-y-4">
            <div className="flex items-center justify-between border-b border-[#d4af37]/20 pb-2.5">
              <span className="text-xs sm:text-sm font-extrabold text-[#f3e5ab] uppercase">
                1. Pengaturan Persentase Kehadiran Minimal
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono">
                Default: 60%
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-emerald-300 font-bold block mb-1.5">
                  Batas Minimal Persentase Kehadiran Bulanan (0% – 100%):
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={formConfig.batasMinimalKehadiran}
                    onChange={(e) =>
                      setFormConfig({
                        ...formConfig,
                        batasMinimalKehadiran: Math.max(0, Math.min(100, Number(e.target.value) || 0))
                      })
                    }
                    className="w-28 bg-[#02100a] border-2 border-[#d4af37] rounded-xl px-3 py-2 text-lg font-black text-[#f3e5ab] font-mono text-center"
                  />
                  <span className="text-base font-extrabold text-white">%</span>
                  <div className="flex-1 p-2.5 rounded-xl bg-black/40 border border-[#d4af37]/25 text-[11px] text-emerald-200">
                    Santri dengan kehadiran <b>&lt; {formConfig.batasMinimalKehadiran}%</b> otomatis masuk ke <b>Tab Pelanggaran Santri</b> ({previewDetectedCount} santri terdeteksi pada {selectedBulanSantri}).
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1 text-[11px] text-slate-300">
                <input
                  type="checkbox"
                  checked={Boolean(formConfig.sertakanSantriTanpaSesi)}
                  onChange={(e) =>
                    setFormConfig({ ...formConfig, sertakanSantriTanpaSesi: e.target.checked })
                  }
                  className="rounded border-[#d4af37]"
                />
                <span>
                  Sertakan juga santri yang masih memiliki 0 sesi absensi (Default: Tidak disertakan, melainkan ditandai untuk pemeriksaan Admin).
                </span>
              </label>

              <button
                type="button"
                onClick={() =>
                  handleSaveConfigToFirestore(
                    `Mengubah batas minimal persentase kehadiran menjadi ${formConfig.batasMinimalKehadiran}%.`
                  )
                }
                className="btn-3d-gold px-4 py-2 rounded-xl text-black font-extrabold text-xs flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5 text-black" />
                <span>Simpan Pengaturan Persentase</span>
              </button>
            </div>
          </div>

          {/* 2. Pengaturan Batas Waktu Pengumpulan */}
          <div className="card-3d-deep rounded-2xl p-5 border border-[#d4af37]/35 space-y-4">
            <div className="flex items-center justify-between border-b border-[#d4af37]/20 pb-2.5">
              <span className="text-xs sm:text-sm font-extrabold text-[#f3e5ab] uppercase">
                2. Pengaturan Batas Waktu Pengumpulan Takziran
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-950 border border-amber-500/40 text-amber-300 text-[10px] font-mono">
                Otomatis Hitung Deadline
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-emerald-300 font-bold block mb-1">
                  Durasi Maksimal Pengumpulan (Satuan Hari):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={formConfig.durasiPengumpulanHari}
                    onChange={(e) =>
                      setFormConfig({
                        ...formConfig,
                        durasiPengumpulanHari: Math.max(1, Number(e.target.value) || 1)
                      })
                    }
                    className="w-24 bg-[#02100a] border border-[#d4af37]/50 rounded-xl px-3 py-2 text-base font-black text-white font-mono text-center"
                  />
                  <span className="font-bold text-[#f3e5ab]">Hari</span>
                </div>
              </div>

              <div>
                <label className="text-emerald-300 font-bold block mb-1">
                  Waktu / Jam Batas Akhir Pada Hari H:
                </label>
                <input
                  type="time"
                  value={formConfig.jamBatasAkhir}
                  onChange={(e) => setFormConfig({ ...formConfig, jamBatasAkhir: e.target.value })}
                  className="w-full bg-[#02100a] border border-[#d4af37]/50 rounded-xl px-3 py-2 text-sm font-bold text-[#f3e5ab] font-mono"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="text-emerald-300 font-bold block mb-1">
                Ketentuan Keterlambatan (Otomatis Naik ke Pelanggaran Berat):
              </label>
              <textarea
                rows={2}
                value={formConfig.ketentuanKeterlambatan}
                onChange={(e) => setFormConfig({ ...formConfig, ketentuanKeterlambatan: e.target.value })}
                className="w-full bg-[#02100a] border border-[#d4af37]/40 rounded-xl p-2.5 text-white text-xs"
              />
            </div>

            <button
              type="button"
              onClick={() =>
                handleSaveConfigToFirestore(
                  `Menyimpan pengaturan batas waktu pengumpulan takziran: ${formConfig.durasiPengumpulanHari} hari (Pukul ${formConfig.jamBatasAkhir} WIB).`
                )
              }
              className="btn-3d-gold px-4 py-2 rounded-xl text-black font-extrabold text-xs flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5 text-black" />
              <span>Simpan Pengaturan Batas Waktu</span>
            </button>
          </div>
        </div>

        {/* BAGIAN 3: PENGATURAN JENIS PELANGGARAN */}
        <div className="card-3d-deep rounded-2xl p-5 border border-[#d4af37]/35 space-y-4">
          <div className="border-b border-[#d4af37]/20 pb-2.5">
            <span className="text-xs sm:text-sm font-extrabold text-[#f3e5ab] uppercase">
              3. Pengaturan Klasifikasi Jenis Pelanggaran & Ketentuan Takziran
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Pelanggaran Ringan */}
            <div className="p-4 rounded-2xl bg-[#02100a] border border-amber-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-amber-300 uppercase">
                  Klasifikasi 1: Pelanggaran Awal (&lt; {formConfig.batasMinimalKehadiran}%)
                </span>
              </div>
              <div>
                <label className="text-emerald-300 block mb-1">Nama Jenis Pelanggaran:</label>
                <input
                  type="text"
                  value={formConfig.labelPelanggaranRingan}
                  onChange={(e) => setFormConfig({ ...formConfig, labelPelanggaranRingan: e.target.value })}
                  className="w-full bg-[#041d12] border border-[#d4af37]/40 rounded-xl px-3 py-1.5 text-white font-bold"
                />
              </div>
              <div>
                <label className="text-emerald-300 block mb-1">Keterangan Kriteria:</label>
                <input
                  type="text"
                  value={formConfig.keteranganPelanggaranRingan}
                  onChange={(e) =>
                    setFormConfig({ ...formConfig, keteranganPelanggaranRingan: e.target.value })
                  }
                  className="w-full bg-[#041d12] border border-[#d4af37]/40 rounded-xl px-3 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-emerald-300 block mb-1">Ketentuan Kewajiban Takziran:</label>
                <textarea
                  rows={2}
                  value={formConfig.ketentuanTakziranRingan}
                  onChange={(e) =>
                    setFormConfig({ ...formConfig, ketentuanTakziranRingan: e.target.value })
                  }
                  className="w-full bg-[#041d12] border border-[#d4af37]/40 rounded-xl p-2 text-white"
                />
              </div>
            </div>

            {/* Pelanggaran Berat */}
            <div className="p-4 rounded-2xl bg-[#02100a] border border-red-500/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-red-300 uppercase">
                  Klasifikasi 2: Melewati Batas Waktu Pengumpulan
                </span>
              </div>
              <div>
                <label className="text-emerald-300 block mb-1">Nama Jenis Pelanggaran Berat:</label>
                <input
                  type="text"
                  value={formConfig.labelPelanggaranBerat}
                  onChange={(e) => setFormConfig({ ...formConfig, labelPelanggaranBerat: e.target.value })}
                  className="w-full bg-[#041d12] border border-red-500/40 rounded-xl px-3 py-1.5 text-white font-bold"
                />
              </div>
              <div>
                <label className="text-emerald-300 block mb-1">Keterangan Kriteria Pelanggaran Berat:</label>
                <input
                  type="text"
                  value={formConfig.keteranganPelanggaranBerat}
                  onChange={(e) =>
                    setFormConfig({ ...formConfig, keteranganPelanggaranBerat: e.target.value })
                  }
                  className="w-full bg-[#041d12] border border-red-500/40 rounded-xl px-3 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-emerald-300 block mb-1">Ketentuan Tindak Lanjut Madrasah:</label>
                <textarea
                  rows={2}
                  value={formConfig.ketentuanTakziranBerat}
                  onChange={(e) =>
                    setFormConfig({ ...formConfig, ketentuanTakziranBerat: e.target.value })
                  }
                  className="w-full bg-[#041d12] border border-red-500/40 rounded-xl p-2 text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* BAGIAN 4: EDITOR TEMPLATE SURAT TAKZIRAN LENGKAP (DARI LOGO HINGGA TANDA TANGAN) */}
        <div className="card-3d-deep rounded-2xl p-5 border border-[#d4af37]/40 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#d4af37]/25 pb-3">
            <div>
              <h4 className="text-sm sm:text-base font-extrabold text-[#f3e5ab] uppercase">
                4. Editor Template Surat Takziran (Editable Penuh dari Logo, Kop, Nomor & Tanda Tangan)
              </h4>
              <p className="text-[11px] text-emerald-300">
                Seluruh perubahan disimpan permanen di Firestore sehingga format cetak sama persis di PC, Laptop, dan HP.
              </p>
            </div>
          </div>

          {/* KOP SURAT & LOGO */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-[#02100a] border border-[#d4af37]/30 space-y-3">
              <span className="font-extrabold text-[#f3e5ab] block">Logo Kop Surat Lembaga:</span>
              <div className="flex items-center gap-3">
                <img
                  src={
                    formConfig.gunakanLogoUtama || !formConfig.logoUrl
                      ? resolveLogos(settings).madrasah
                      : formConfig.logoUrl
                  }
                  alt="Preview Logo Surat"
                  className="w-16 h-16 rounded-xl object-contain bg-white p-1 border border-[#d4af37]"
                />
                <div className="space-y-1.5 flex-1">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleUploadLogoSurat}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#083321] border border-[#d4af37]/50 text-[#f3e5ab] font-bold text-[11px] flex items-center justify-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Logo Khusus</span>
                  </button>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-emerald-300">
                    <input
                      type="checkbox"
                      checked={formConfig.gunakanLogoUtama}
                      onChange={(e) =>
                        setFormConfig({ ...formConfig, gunakanLogoUtama: e.target.checked })
                      }
                    />
                    <span>Gunakan Logo Utama Pondok</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Atau URL Logo Gambar:</label>
                <input
                  type="text"
                  value={formConfig.logoUrl}
                  onChange={(e) =>
                    setFormConfig({
                      ...formConfig,
                      logoUrl: e.target.value,
                      gunakanLogoUtama: !e.target.value
                    })
                  }
                  placeholder="https://..."
                  className="w-full bg-[#041d12] border border-[#d4af37]/30 rounded-lg px-2.5 py-1.5 text-white text-[11px]"
                />
              </div>
            </div>

            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-emerald-300 font-bold block mb-1">1. Nama Lembaga / Pondok Pesantren:</label>
                <input
                  type="text"
                  value={formConfig.namaLembaga}
                  onChange={(e) => setFormConfig({ ...formConfig, namaLembaga: e.target.value })}
                  className="w-full bg-[#02100a] border border-[#d4af37]/40 rounded-xl px-3 py-2 text-white font-bold"
                />
              </div>
              <div>
                <label className="text-emerald-300 font-bold block mb-1">2. Nama Madrasah Diniyah:</label>
                <input
                  type="text"
                  value={formConfig.namaMadrasah}
                  onChange={(e) => setFormConfig({ ...formConfig, namaMadrasah: e.target.value })}
                  className="w-full bg-[#02100a] border border-[#d4af37]/40 rounded-xl px-3 py-2 text-white font-bold"
                />
              </div>
              <div>
                <label className="text-emerald-300 font-bold block mb-1">3. Sub-Kop Surat / Komisi:</label>
                <input
                  type="text"
                  value={formConfig.subKopSurat}
                  onChange={(e) => setFormConfig({ ...formConfig, subKopSurat: e.target.value })}
                  className="w-full bg-[#02100a] border border-[#d4af37]/40 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-emerald-300 font-bold block mb-1">4. Alamat Lengkap Lembaga (Kop):</label>
                <input
                  type="text"
                  value={formConfig.alamatLembaga}
                  onChange={(e) => setFormConfig({ ...formConfig, alamatLembaga: e.target.value })}
                  className="w-full bg-[#02100a] border border-[#d4af37]/40 rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>
          </div>

          {/* NOMOR SURAT, JUDUL, PERIHAL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="text-emerald-300 font-bold block mb-1">
                5. Format Nomor Surat Otomatis:
              </label>
              <input
                type="text"
                value={formConfig.formatNomorSurat}
                onChange={(e) => setFormConfig({ ...formConfig, formatNomorSurat: e.target.value })}
                className="w-full bg-[#02100a] border border-[#d4af37]/40 rounded-xl px-3 py-2 text-[#f3e5ab] font-mono font-bold"
              />
              <span className="text-[10px] text-emerald-400 block mt-0.5">
                Contoh terbit: {formatNomorSuratFromCounter(1, formConfig.formatNomorSurat, selectedBulanSantri)}
              </span>
            </div>

            <div>
              <label className="text-emerald-300 font-bold block mb-1">6. Judul Utama Surat:</label>
              <input
                type="text"
                value={formConfig.judulSurat}
                onChange={(e) => setFormConfig({ ...formConfig, judulSurat: e.target.value })}
                className="w-full bg-[#02100a] border border-[#d4af37]/40 rounded-xl px-3 py-2 text-white font-bold"
              />
            </div>

            <div>
              <label className="text-emerald-300 font-bold block mb-1">Perihal Surat:</label>
              <input
                type="text"
                value={formConfig.perihalSurat}
                onChange={(e) => setFormConfig({ ...formConfig, perihalSurat: e.target.value })}
                className="w-full bg-[#02100a] border border-[#d4af37]/40 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="text-emerald-300 font-bold block mb-1">Lampiran & Kota Surat:</label>
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="text"
                  value={formConfig.lampiranSurat}
                  onChange={(e) => setFormConfig({ ...formConfig, lampiranSurat: e.target.value })}
                  placeholder="Lampiran"
                  className="w-full bg-[#02100a] border border-[#d4af37]/40 rounded-xl px-2.5 py-2 text-white"
                />
                <input
                  type="text"
                  value={formConfig.kotaTanggalSurat}
                  onChange={(e) => setFormConfig({ ...formConfig, kotaTanggalSurat: e.target.value })}
                  placeholder="Kota"
                  className="w-full bg-[#02100a] border border-[#d4af37]/40 rounded-xl px-2.5 py-2 text-white"
                />
              </div>
            </div>
          </div>

          {/* ISI PEMBUKAAN, PEMBERITAHUAN, KETENTUAN, PENUTUP */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-emerald-300 font-bold block mb-1">7. Isi Pembukaan Surat:</label>
              <textarea
                rows={3}
                value={formConfig.isiPembukaan}
                onChange={(e) => setFormConfig({ ...formConfig, isiPembukaan: e.target.value })}
                className="w-full bg-[#02100a] border border-[#d4af37]/40 rounded-xl p-2.5 text-white"
              />
            </div>

            <div>
              <label className="text-emerald-300 font-bold block mb-1">
                8 & 10. Isi Ketentuan Takziran & Batas Pengumpulan:
              </label>
              <textarea
                rows={3}
                value={formConfig.isiKetentuanTakziran}
                onChange={(e) => setFormConfig({ ...formConfig, isiKetentuanTakziran: e.target.value })}
                className="w-full bg-[#02100a] border border-[#d4af37]/40 rounded-xl p-2.5 text-white"
              />
            </div>

            <div>
              <label className="text-emerald-300 font-bold block mb-1">
                9. Kalimat Peringatan Peningkatan Pelanggaran Berat:
              </label>
              <textarea
                rows={2}
                value={formConfig.isiPeringatanBerat}
                onChange={(e) => setFormConfig({ ...formConfig, isiPeringatanBerat: e.target.value })}
                className="w-full bg-[#02100a] border border-[#d4af37]/40 rounded-xl p-2.5 text-white"
              />
            </div>

            <div>
              <label className="text-emerald-300 font-bold block mb-1">11. Isi Penutup Surat:</label>
              <textarea
                rows={2}
                value={formConfig.isiPenutup}
                onChange={(e) => setFormConfig({ ...formConfig, isiPenutup: e.target.value })}
                className="w-full bg-[#02100a] border border-[#d4af37]/40 rounded-xl p-2.5 text-white"
              />
            </div>
          </div>

          {/* 3 KOLOM TANDA TANGAN: WALI KELAS, KEAMANAN, KETUA MADRASAH */}
          <div className="p-4 rounded-2xl bg-[#02100a] border border-[#d4af37]/30 space-y-3 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="font-extrabold text-[#f3e5ab] uppercase">
                12 & 13. Pengaturan 3 Kolom Tanda Tangan (Wali Kelas, Keamanan, Ketua Madrasah)
              </span>
              <input
                type="text"
                value={formConfig.kalimatTandaTangan}
                onChange={(e) => setFormConfig({ ...formConfig, kalimatTandaTangan: e.target.value })}
                placeholder="Kalimat pengantar tanda tangan..."
                className="bg-[#041d12] border border-[#d4af37]/40 rounded-lg px-3 py-1 text-white text-xs w-full sm:w-64"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Kolom 1: Wali Kelas */}
              <div className="p-3 rounded-xl bg-[#041d12] border border-[#d4af37]/25 space-y-2">
                <span className="text-[11px] font-bold text-[#d4af37] block">Kolom TTD 1 (Kiri):</span>
                <input
                  type="text"
                  value={formConfig.jabatanPenandatangan1}
                  onChange={(e) => setFormConfig({ ...formConfig, jabatanPenandatangan1: e.target.value })}
                  placeholder="Jabatan 1 (Wali Kelas)"
                  className="w-full bg-[#02100a] border border-[#d4af37]/30 rounded-lg px-2.5 py-1.5 text-white font-bold"
                />
                <input
                  type="text"
                  value={formConfig.namaPenandatangan1}
                  onChange={(e) => setFormConfig({ ...formConfig, namaPenandatangan1: e.target.value })}
                  placeholder="Nama Terang Wali Kelas Default"
                  className="w-full bg-[#02100a] border border-[#d4af37]/30 rounded-lg px-2.5 py-1.5 text-white"
                />
                <label className="flex items-center gap-1.5 text-[10px] text-emerald-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formConfig.gunakanWaliKelasOtomatis}
                    onChange={(e) =>
                      setFormConfig({ ...formConfig, gunakanWaliKelasOtomatis: e.target.checked })
                    }
                  />
                  <span>Otomatis isi nama Wali Kelas sesuai kelas santri</span>
                </label>
              </div>

              {/* Kolom 2: Keamanan */}
              <div className="p-3 rounded-xl bg-[#041d12] border border-[#d4af37]/25 space-y-2">
                <span className="text-[11px] font-bold text-[#d4af37] block">Kolom TTD 2 (Tengah):</span>
                <input
                  type="text"
                  value={formConfig.jabatanPenandatangan2}
                  onChange={(e) => setFormConfig({ ...formConfig, jabatanPenandatangan2: e.target.value })}
                  placeholder="Jabatan 2 (Keamanan)"
                  className="w-full bg-[#02100a] border border-[#d4af37]/30 rounded-lg px-2.5 py-1.5 text-white font-bold"
                />
                <input
                  type="text"
                  value={formConfig.namaPenandatangan2}
                  onChange={(e) => setFormConfig({ ...formConfig, namaPenandatangan2: e.target.value })}
                  placeholder="Nama Terang Bagian Keamanan"
                  className="w-full bg-[#02100a] border border-[#d4af37]/30 rounded-lg px-2.5 py-1.5 text-white"
                />
              </div>

              {/* Kolom 3: Ketua Madrasah */}
              <div className="p-3 rounded-xl bg-[#041d12] border border-[#d4af37]/25 space-y-2">
                <span className="text-[11px] font-bold text-[#d4af37] block">Kolom TTD 3 (Kanan):</span>
                <input
                  type="text"
                  value={formConfig.jabatanPenandatangan3}
                  onChange={(e) => setFormConfig({ ...formConfig, jabatanPenandatangan3: e.target.value })}
                  placeholder="Jabatan 3 (Ketua Madrasah)"
                  className="w-full bg-[#02100a] border border-[#d4af37]/30 rounded-lg px-2.5 py-1.5 text-white font-bold"
                />
                <input
                  type="text"
                  value={formConfig.namaPenandatangan3}
                  onChange={(e) => setFormConfig({ ...formConfig, namaPenandatangan3: e.target.value })}
                  placeholder="Nama Terang Ketua Madrasah"
                  className="w-full bg-[#02100a] border border-[#d4af37]/30 rounded-lg px-2.5 py-1.5 text-white"
                />
              </div>
            </div>
          </div>

          {/* 14. UKURAN KERTAS & MARGIN */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div>
              <label className="text-emerald-300 font-bold block mb-1">14. Ukuran Kertas:</label>
              <select
                value={formConfig.ukuranKertas}
                onChange={(e) =>
                  setFormConfig({ ...formConfig, ukuranKertas: e.target.value as 'A4' | 'F4' })
                }
                className="w-full bg-[#02100a] border border-[#d4af37]/40 rounded-xl px-3 py-2 text-white font-bold"
              >
                <option value="A4">Kertas A4 (210 x 297 mm)</option>
                <option value="F4">Kertas F4 / Folio</option>
              </select>
            </div>
            <div>
              <label className="text-emerald-300 font-bold block mb-1">Margin Atas (mm):</label>
              <input
                type="number"
                value={formConfig.marginAtasMm}
                onChange={(e) =>
                  setFormConfig({ ...formConfig, marginAtasMm: Number(e.target.value) || 15 })
                }
                className="w-full bg-[#02100a] border border-[#d4af37]/40 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-emerald-300 font-bold block mb-1">Margin Bawah (mm):</label>
              <input
                type="number"
                value={formConfig.marginBawahMm}
                onChange={(e) =>
                  setFormConfig({ ...formConfig, marginBawahMm: Number(e.target.value) || 15 })
                }
                className="w-full bg-[#02100a] border border-[#d4af37]/40 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-emerald-300 font-bold block mb-1">Margin Kiri (mm):</label>
              <input
                type="number"
                value={formConfig.marginKiriMm}
                onChange={(e) =>
                  setFormConfig({ ...formConfig, marginKiriMm: Number(e.target.value) || 18 })
                }
                className="w-full bg-[#02100a] border border-[#d4af37]/40 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-emerald-300 font-bold block mb-1">Margin Kanan (mm):</label>
              <input
                type="number"
                value={formConfig.marginKananMm}
                onChange={(e) =>
                  setFormConfig({ ...formConfig, marginKananMm: Number(e.target.value) || 18 })
                }
                className="w-full bg-[#02100a] border border-[#d4af37]/40 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-[#d4af37]/20">
            <button
              type="button"
              onClick={() => setShowSamplePreview(true)}
              className="px-4 py-2.5 rounded-xl bg-[#083321] border border-[#d4af37]/50 text-[#f3e5ab] font-bold text-xs flex items-center gap-1.5"
            >
              <Eye className="w-4 h-4 text-[#d4af37]" />
              <span>Pratinjau Surat A4</span>
            </button>
            <button
              type="button"
              onClick={handleResetDefaultTemplate}
              className="px-4 py-2.5 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 font-bold text-xs flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Kembalikan ke Template Default</span>
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSaveConfigToFirestore()}
              className="btn-3d-gold px-6 py-2.5 rounded-xl text-black font-extrabold text-xs flex items-center gap-2 shadow-xl"
            >
              <Save className="w-4 h-4 text-black" />
              <span>{isSaving ? 'Menyimpan ke Firestore...' : 'Simpan Template'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pratinjau Surat dari Option Panel */}
      {showSamplePreview && (
        <SuratTakziranPrintModal
          isOpen={showSamplePreview}
          onClose={() => setShowSamplePreview(false)}
          template={formConfig}
          record={sampleRecord}
          settings={settings}
        />
      )}
    </div>
  );
};
