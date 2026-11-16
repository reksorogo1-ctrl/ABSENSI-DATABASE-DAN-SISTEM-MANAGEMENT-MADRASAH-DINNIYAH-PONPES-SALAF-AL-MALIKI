import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ShieldAlert, Printer, FileText, CheckCircle2, Clock, AlertTriangle,
  Settings, Save, RotateCcw, Eye, Edit3, X, Upload, History,
  Search, Calendar, Award, Download
} from 'lucide-react';
import {
  AppSettings, GuruPengajar, RekapBulananGuruItem,
  TemplateSuratPeringatanGuru, PeringatanGuruRecord,
  PeringatanGuruAuditLog, StatusPeringatanGuru
} from '../types';
import {
  saveMasterDataToFirestore,
  loadMasterDataFromFirestore,
  subscribeMasterDataFromFirestore,
  generateAtomicNomorSuratPeringatanGuru,
  formatNomorSuratFromCounter
} from '../firebase';
import { resolveLogos } from '../brand';
import { compressImageFile } from '../lib/imageCompression';

export const DEFAULT_TEMPLATE_SURAT_PERINGATAN_GURU: TemplateSuratPeringatanGuru = {
  batasMinimalKehadiranGuru: 75,
  bobotNilaiTelatPersen: 50,
  sertakanGuruTanpaSesi: false,
  namaLembaga: 'PONDOK PESANTREN SALAF AL-MALIKI',
  namaMadrasah: 'MADRASAH DINIYAH SALAFIYAH AL-MALIKI',
  subKopSurat: 'DEWAN PENGURUS & KOMISI DISIPLIN ASATIDZ',
  alamatLembaga:
    'Jl. Raya Pesantren Salaf Al-Maliki, Kompleks Madrasah Diniyah Putra/Putri • Telp/WA Administrasi Pondok',
  logoUrl: '',
  gunakanLogoUtama: true,
  formatNomorSurat: '{NO}/SP-GURU/MD-ALMALIKI/{ROMAWI}/{TAHUN}',
  lampiranSurat: '1 (Satu) Berkas Rekap Kehadiran Mengajar Bulanan',
  perihalSurat: 'Surat Peringatan Kedisiplinan & Kehadiran Ustadz/Guru',
  judulSurat: 'SURAT PERINGATAN KEDISIPLINAN KEHADIRAN DEWAN ASATIDZ',
  isiPembukaan:
    'Berdasarkan hasil evaluasi Rekapitulasi Absensi Mengajar Bulanan Madrasah Diniyah Pondok Pesantren Salaf Al-Maliki, bersama ini disampaikan catatan kehadiran dan kedisiplinan Ustadz / Ustadzah pengajar sebagai berikut:',
  isiTeguranDisiplin:
    'Mengingat persentase penilaian kehadiran dan kedisiplinan berada di bawah batas minimal standar madrasah (termasuk dampak keterlambatan dan ketidakhadiran tanpa izin), maka pihak Madrasah menerbitkan Surat Peringatan ini sebagai bahan muhasabah, pembinaan, dan perbaikan kedisiplinan mengajar pada bulan berikutnya.',
  isiTindakLanjut:
    'Ustadz / Ustadzah dimohon hadir tepat waktu sesuai jadwal yang telah ditetapkan serta berkoordinasi dengan Koordinator Akademik atau menunjuk Ustadz Pengganti resmi apabila berhalangan syar\'i.',
  isiPenutup:
    'Demikian Surat Peringatan ini disampaikan dengan penuh hormat dan khidmat agar menjadi perhatian demi kelancaran khidmah pendidikan Madrasah Diniyah Ponpes Salaf Al-Maliki.',
  kotaTanggalSurat: 'Al-Maliki',
  kalimatTandaTangan: 'Mengetahui dan Menetapkan,',
  jabatanPenandatangan1: 'Waka Kurikulum / Akademik',
  namaPenandatangan1: 'Ust. Koordinator Akademik Madrasah',
  jabatanPenandatangan2: 'Koordinator Kedisiplinan',
  namaPenandatangan2: 'Ust. Divisi Kedisiplinan Asatidz',
  jabatanPenandatangan3: 'Ketua Madrasah Diniyah',
  namaPenandatangan3: 'KH. / Ust. Kepala Madrasah Diniyah',
  ukuranKertas: 'A4',
  marginAtasMm: 15,
  marginBawahMm: 15,
  marginKiriMm: 18,
  marginKananMm: 18
};

function formatTanggalIndoSP(isoOrDateStr?: string, includeTime: boolean = false): string {
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
  return `${tgl} ${bln} ${thn}, ${hh}:${mm} WIB`;
}

/**
 * MODAL PRATINJAU & CETAK SURAT PERINGATAN GURU (A4 / F4)
 */
export const SuratPeringatanGuruPrintModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  template: TemplateSuratPeringatanGuru;
  record: PeringatanGuruRecord;
  settings: AppSettings;
  onSaveEditedRecord?: (updated: PeringatanGuruRecord) => Promise<void>;
}> = ({ isOpen, onClose, template, record, settings, onSaveEditedRecord }) => {
  const [isEditingLetter, setIsEditingLetter] = useState(false);
  const [customOverrides, setCustomOverrides] = useState<Partial<TemplateSuratPeringatanGuru>>(
    record.customIsiSurat || {}
  );
  const printAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCustomOverrides(record.customIsiSurat || {});
    setIsEditingLetter(false);
  }, [record]);

  if (!isOpen) return null;

  const mergedTemplate: TemplateSuratPeringatanGuru = {
    ...template,
    ...customOverrides
  };

  const brandLogos = resolveLogos(settings);
  const activeLogo =
    mergedTemplate.gunakanLogoUtama || !mergedTemplate.logoUrl
      ? brandLogos.madrasah
      : mergedTemplate.logoUrl;

  const tanggalSuratFormatted = formatTanggalIndoSP(
    record.tanggalTerbitSurat || new Date().toISOString(),
    false
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
        <title>Surat_Peringatan_${record.namaGuru.replace(/\s+/g, '_')}_${record.periodeBulan.replace(/\s+/g, '_')}</title>
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
          .box-peringatan {
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
          .ttd-space { height: 58px; }
          .ttd-name { font-weight: bold; text-decoration: underline; }
          p { margin: 6px 0; text-align: justify; }
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
      <div className="w-full max-w-4xl card-3d rounded-2xl p-4 mb-4 border-2 border-[#d4af37] bg-[#041f13] flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-[#d4af37]">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-white text-gold-3d">
              Pratinjau & Cetak Surat Peringatan Guru ({mergedTemplate.ukuranKertas})
            </h3>
            <p className="text-[11px] text-emerald-300 font-mono">
              No. Surat: <b className="text-[#f3e5ab]">{record.nomorSurat || '-'}</b> • Ustadz/ah: <b className="text-white">{record.namaGuru}</b>
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
            <span>Cetak Surat Peringatan</span>
          </button>

          <button
            type="button"
            onClick={handleTriggerBrowserPrint}
            className="px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 border border-emerald-400/60 text-white font-bold text-xs flex items-center gap-1.5 shadow transition"
          >
            <Download className="w-4 h-4 text-emerald-200" />
            <span>Simpan PDF</span>
          </button>

          {onSaveEditedRecord && (
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
              <span>{isEditingLetter ? 'Tutup Editor' : 'Edit Surat'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl bg-red-950/90 hover:bg-red-900 border border-red-500/50 text-red-200 font-bold text-xs flex items-center gap-1 transition"
          >
            <X className="w-4 h-4" />
            <span>Tutup</span>
          </button>
        </div>
      </div>

      {isEditingLetter && (
        <div className="w-full max-w-4xl card-3d rounded-2xl p-4 mb-4 border border-amber-400/60 bg-[#062417] space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-[#d4af37]/20 pb-2">
            <span className="font-extrabold text-[#f3e5ab] flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-amber-400" />
              Edit Cepat Isi Surat Peringatan ({record.namaGuru})
            </span>
            <span className="text-[11px] text-emerald-300">Nomor surat ({record.nomorSurat}) terkunci.</span>
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
              <label className="text-[11px] text-emerald-300 block mb-1">Nama Penandatangan 2:</label>
              <input
                type="text"
                value={mergedTemplate.namaPenandatangan2}
                onChange={(e) => setCustomOverrides({ ...customOverrides, namaPenandatangan2: e.target.value })}
                className="w-full bg-[#02120b] border border-[#d4af37]/40 rounded-lg px-2.5 py-1.5 text-white text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] text-emerald-300 block mb-1">Nama Ketua Madrasah:</label>
              <input
                type="text"
                value={mergedTemplate.namaPenandatangan3}
                onChange={(e) => setCustomOverrides({ ...customOverrides, namaPenandatangan3: e.target.value })}
                className="w-full bg-[#02120b] border border-[#d4af37]/40 rounded-lg px-2.5 py-1.5 text-white text-xs"
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-emerald-300 block mb-1">Isi Teguran Kedisiplinan:</label>
            <textarea
              rows={2}
              value={mergedTemplate.isiTeguranDisiplin}
              onChange={(e) => setCustomOverrides({ ...customOverrides, isiTeguranDisiplin: e.target.value })}
              className="w-full bg-[#02120b] border border-[#d4af37]/40 rounded-lg p-2 text-white text-xs"
            />
          </div>
          <div>
            <label className="text-[11px] text-emerald-300 block mb-1">Tindak Lanjut & Arahan:</label>
            <textarea
              rows={2}
              value={mergedTemplate.isiTindakLanjut}
              onChange={(e) => setCustomOverrides({ ...customOverrides, isiTindakLanjut: e.target.value })}
              className="w-full bg-[#02120b] border border-[#d4af37]/40 rounded-lg p-2 text-white text-xs"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSaveCustomLetter}
              className="btn-3d-gold px-4 py-1.5 rounded-xl text-black font-extrabold text-xs flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5 text-black" />
              <span>Simpan Perubahan Surat ke Firestore</span>
            </button>
          </div>
        </div>
      )}

      {/* A4 Paper Preview */}
      <div className="w-full max-w-[210mm] bg-white text-black shadow-2xl rounded-sm p-6 sm:p-[15mm] mb-10 font-serif">
        <div ref={printAreaRef} className="surat-container text-black bg-white">
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
              alt="Logo Madrasah"
              className="kop-logo"
              style={{ width: '74px', height: '74px', objectFit: 'contain' }}
            />
            <div className="kop-teks" style={{ flex: 1, textAlign: 'center', padding: '0 12px' }}>
              <div style={{ fontSize: '14pt', fontWeight: 'bold', textTransform: 'uppercase' }}>
                {mergedTemplate.namaLembaga}
              </div>
              <div style={{ fontSize: '13pt', fontWeight: 'bold', textTransform: 'uppercase', marginTop: '2px' }}>
                {mergedTemplate.namaMadrasah}
              </div>
              {mergedTemplate.subKopSurat && (
                <div style={{ fontSize: '10pt', fontWeight: 'bold', textTransform: 'uppercase', marginTop: '1px' }}>
                  {mergedTemplate.subKopSurat}
                </div>
              )}
              <div style={{ fontSize: '9.5pt', fontStyle: 'italic', marginTop: '3px' }}>
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

          <div style={{ textAlign: 'center', margin: '10px 0 14px 0' }}>
            <h2
              style={{
                fontSize: '12pt',
                fontWeight: 'bold',
                textDecoration: 'underline',
                textTransform: 'uppercase',
                margin: 0
              }}
            >
              {mergedTemplate.judulSurat}
            </h2>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', fontSize: '11pt' }}>
            <tbody>
              <tr>
                <td style={{ width: '110px', fontWeight: 'bold' }}>Nomor Surat</td>
                <td style={{ width: '12px' }}>:</td>
                <td style={{ fontWeight: 'bold' }}>{record.nomorSurat || '001/SP-GURU/MD-ALMALIKI/XI/2026'}</td>
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

          <div style={{ marginBottom: '10px', fontSize: '11pt' }}>
            <div>Kepada Yth.</div>
            <div style={{ fontWeight: 'bold', marginLeft: '12px' }}>{record.namaGuru}</div>
            <div style={{ fontWeight: 'bold', marginLeft: '12px' }}>
              Pengampu Mapel: {record.mapel || '-'} ({record.kelas || '-'})
            </div>
            <div>di Tempat</div>
          </div>

          <p style={{ margin: '6px 0', textAlign: 'justify', fontSize: '11pt' }}>
            Assalamu&apos;alaikum Wr. Wb.
          </p>
          <p style={{ margin: '6px 0', textAlign: 'justify', fontSize: '11pt' }}>
            {mergedTemplate.isiPembukaan}
          </p>

          <table
            className="data-table"
            style={{ width: '100%', borderCollapse: 'collapse', margin: '10px 0', fontSize: '10.5pt' }}
          >
            <tbody>
              <tr>
                <th style={{ border: '1px solid #000', padding: '4px 8px', backgroundColor: '#f0f0f0', width: '28%' }}>
                  Nama Ustadz / Guru
                </th>
                <td style={{ border: '1px solid #000', padding: '4px 8px', fontWeight: 'bold', width: '24%' }}>
                  {record.namaGuru}
                </td>
                <th style={{ border: '1px solid #000', padding: '4px 8px', backgroundColor: '#f0f0f0', width: '28%' }}>
                  Total Hadir (Termasuk Telat)
                </th>
                <td style={{ border: '1px solid #000', padding: '4px 8px', fontWeight: 'bold', width: '20%' }}>
                  {record.hadir} Kali ({record.hadirTepatWaktu} Tepat + {record.telat} Telat)
                </td>
              </tr>
              <tr>
                <th style={{ border: '1px solid #000', padding: '4px 8px', backgroundColor: '#f0f0f0' }}>
                  Mata Pelajaran / Kitab
                </th>
                <td style={{ border: '1px solid #000', padding: '4px 8px' }}>
                  {record.mapel}
                </td>
                <th style={{ border: '1px solid #000', padding: '4px 8px', backgroundColor: '#f0f0f0' }}>
                  Total Telat
                </th>
                <td style={{ border: '1px solid #000', padding: '4px 8px', fontWeight: 'bold' }}>
                  {record.telat} Kali
                </td>
              </tr>
              <tr>
                <th style={{ border: '1px solid #000', padding: '4px 8px', backgroundColor: '#f0f0f0' }}>
                  Kelas / Angkatan Diampu
                </th>
                <td style={{ border: '1px solid #000', padding: '4px 8px' }}>
                  {record.kelas}
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
                  Periode Evaluasi Bulanan
                </th>
                <td style={{ border: '1px solid #000', padding: '4px 8px', fontWeight: 'bold' }}>
                  {record.periodeBulan}
                </td>
                <th style={{ border: '1px solid #000', padding: '4px 8px', backgroundColor: '#f0f0f0' }}>
                  Total Alpha
                </th>
                <td style={{ border: '1px solid #000', padding: '4px 8px', fontWeight: 'bold' }}>
                  {record.alpha} Kali
                </td>
              </tr>
              <tr>
                <th style={{ border: '1px solid #000', padding: '4px 8px', backgroundColor: '#f0f0f0' }}>
                  Persentase Penilaian Kedisiplinan
                </th>
                <td style={{ border: '1px solid #000', padding: '4px 8px', fontWeight: 'bold', fontSize: '11.5pt' }}>
                  {record.persentaseKehadiran}% (dari {record.totalSesi} sesi)
                </td>
                <th style={{ border: '1px solid #000', padding: '4px 8px', backgroundColor: '#f0f0f0' }}>
                  Batas Minimal Madrasah
                </th>
                <td style={{ border: '1px solid #000', padding: '4px 8px', fontWeight: 'bold' }}>
                  {record.batasMinimalSaatItu || mergedTemplate.batasMinimalKehadiranGuru}%
                </td>
              </tr>
            </tbody>
          </table>

          <div
            className="box-peringatan"
            style={{
              border: '1.5px solid #000',
              padding: '8px 12px',
              margin: '10px 0',
              backgroundColor: '#fafafa',
              fontSize: '10.5pt'
            }}
          >
            <div>
              <strong>CATATAN EVALUASI KEDISIPLINAN: </strong>
              Nilai kehadiran dan kedisiplinan mencapai <strong>{record.persentaseKehadiran}%</strong> (di bawah batas minimal{' '}
              <strong>{record.batasMinimalSaatItu || mergedTemplate.batasMinimalKehadiranGuru}%</strong>). Kehadiran yang terlambat tetap tercatat sebagai hadir namun memengaruhi persentase penilaian kedisiplinan.
            </div>
          </div>

          <p style={{ margin: '6px 0', textAlign: 'justify', fontSize: '11pt' }}>
            {mergedTemplate.isiTeguranDisiplin}
          </p>
          <p style={{ margin: '6px 0', textAlign: 'justify', fontSize: '11pt' }}>
            {mergedTemplate.isiTindakLanjut}
          </p>
          <p style={{ margin: '8px 0 12px 0', textAlign: 'justify', fontSize: '11pt' }}>
            {mergedTemplate.isiPenutup}
          </p>

          <div className="ttd-section" style={{ marginTop: '16px', pageBreakInside: 'avoid' }}>
            <div style={{ textAlign: 'center', fontSize: '11pt', marginBottom: '8px' }}>
              {mergedTemplate.kalimatTandaTangan}
            </div>
            <div style={{ display: 'table', width: '100%', tableLayout: 'fixed', marginTop: '6px', fontSize: '10.5pt' }}>
              <div style={{ display: 'table-cell', width: '33.33%', textAlign: 'center', verticalAlign: 'top' }}>
                <div style={{ fontWeight: 'bold' }}>{mergedTemplate.jabatanPenandatangan1}</div>
                <div style={{ height: '58px' }} />
                <div style={{ fontWeight: 'bold', textDecoration: 'underline' }}>{mergedTemplate.namaPenandatangan1}</div>
              </div>
              <div style={{ display: 'table-cell', width: '33.33%', textAlign: 'center', verticalAlign: 'top' }}>
                <div style={{ fontWeight: 'bold' }}>{mergedTemplate.jabatanPenandatangan2}</div>
                <div style={{ height: '58px' }} />
                <div style={{ fontWeight: 'bold', textDecoration: 'underline' }}>{mergedTemplate.namaPenandatangan2}</div>
              </div>
              <div style={{ display: 'table-cell', width: '33.33%', textAlign: 'center', verticalAlign: 'top' }}>
                <div style={{ fontWeight: 'bold' }}>{mergedTemplate.jabatanPenandatangan3}</div>
                <div style={{ height: '58px' }} />
                <div style={{ fontWeight: 'bold', textDecoration: 'underline' }}>{mergedTemplate.namaPenandatangan3}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface TabPeringatanGuruSectionProps {
  settings: AppSettings;
  guruList: GuruPengajar[];
  rekapBulananGuru: RekapBulananGuruItem[];
  selectedBulanGuru: string;
  setSelectedBulanGuru: (bulan: string) => void;
  daftarBulan: string[];
  daftarTahun: string[];
  currentUserName?: string;
}

/**
 * SUB-FITUR PERINGATAN GURU DI DALAM TAB INDIKATOR KEHADIRAN
 */
export const TabPeringatanGuruSection: React.FC<TabPeringatanGuruSectionProps> = ({
  settings,
  guruList,
  rekapBulananGuru,
  selectedBulanGuru,
  setSelectedBulanGuru,
  daftarBulan,
  daftarTahun,
  currentUserName = 'Admin Madrasah'
}) => {
  const [templateGuru, setTemplateGuru] = useState<TemplateSuratPeringatanGuru>(
    DEFAULT_TEMPLATE_SURAT_PERINGATAN_GURU
  );
  const [peringatanRecords, setPeringatanRecords] = useState<PeringatanGuruRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<PeringatanGuruAuditLog[]>([]);
  const [filterKelas, setFilterKelas] = useState<string>('SEMUA');
  const [viewMode, setViewMode] = useState<'ALL' | 'BELOW_THRESHOLD'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [printingRecord, setPrintingRecord] = useState<PeringatanGuruRecord | null>(null);
  const [confirmingRecord, setConfirmingRecord] = useState<PeringatanGuruRecord | null>(null);
  const [catatanPembinaanInput, setCatatanPembinaanInput] = useState<string>(
    'Ustadz/ah telah menerima pembinaan dan berkomitmen meningkatkan ketepatan waktu & kehadiran.'
  );
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [isIssuingId, setIsIssuingId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    loadMasterDataFromFirestore<TemplateSuratPeringatanGuru>('peringatan_guru_template').then((data) => {
      if (mounted && data && typeof data === 'object') {
        setTemplateGuru({ ...DEFAULT_TEMPLATE_SURAT_PERINGATAN_GURU, ...data });
      }
    });
    loadMasterDataFromFirestore<PeringatanGuruRecord[]>('peringatan_guru_records').then((data) => {
      if (mounted && Array.isArray(data)) {
        setPeringatanRecords(data);
      }
    });
    loadMasterDataFromFirestore<PeringatanGuruAuditLog[]>('peringatan_guru_audit').then((data) => {
      if (mounted && Array.isArray(data)) {
        setAuditLogs(data);
      }
    });

    const unsubTpl = subscribeMasterDataFromFirestore<TemplateSuratPeringatanGuru>(
      'peringatan_guru_template',
      (data) => {
        if (mounted && data && typeof data === 'object') {
          setTemplateGuru({ ...DEFAULT_TEMPLATE_SURAT_PERINGATAN_GURU, ...data });
        }
      }
    );
    const unsubRec = subscribeMasterDataFromFirestore<PeringatanGuruRecord[]>(
      'peringatan_guru_records',
      (data) => {
        if (mounted && Array.isArray(data)) {
          setPeringatanRecords(data);
        }
      }
    );
    const unsubAudit = subscribeMasterDataFromFirestore<PeringatanGuruAuditLog[]>(
      'peringatan_guru_audit',
      (data) => {
        if (mounted && Array.isArray(data)) {
          setAuditLogs(data);
        }
      }
    );

    return () => {
      mounted = false;
      unsubTpl();
      unsubRec();
      unsubAudit();
    };
  }, []);

  const appendGuruAudit = async (
    aksi: PeringatanGuruAuditLog['aksi'],
    detail: string,
    extra?: Partial<PeringatanGuruAuditLog>
  ) => {
    const newLog: PeringatanGuruAuditLog = {
      id: `AUDG-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      aksi,
      aktor: currentUserName,
      detail,
      ...extra
    };
    const next = [newLog, ...auditLogs].slice(0, 300);
    setAuditLogs(next);
    await saveMasterDataToFirestore('peringatan_guru_audit', next);
  };

  const batasMinimalGuru = Number(templateGuru.batasMinimalKehadiranGuru ?? 75);

  // Bangun daftar evaluasi bulanan guru terintegrasi dengan rekapBulananGuru & status SP
  const evaluatedGuruList = useMemo(() => {
    return rekapBulananGuru
      .map((rekap) => {
        const slug = rekap.nama.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
        const recordKey = `${slug}_${selectedBulanGuru.replace(/\s+/g, '_')}`;
        const existingSaved = peringatanRecords.find(
          (p) =>
            p.id === recordKey ||
            (p.namaGuru.trim().toLowerCase() === rekap.nama.trim().toLowerCase() &&
              p.periodeBulan.toLowerCase() === selectedBulanGuru.toLowerCase())
        );

        const isBelowThreshold =
          (rekap.totalSesi > 0 || Boolean(templateGuru.sertakanGuruTanpaSesi)) &&
          rekap.persentase < batasMinimalGuru;

        const nowIso = new Date().toISOString();
        const record: PeringatanGuruRecord = {
          id: recordKey,
          namaGuru: rekap.nama,
          mapel: rekap.mapel,
          kelas: rekap.kelas,
          periodeBulan: selectedBulanGuru,
          hadir: rekap.hadir,
          hadirTepatWaktu: rekap.hadirTepatWaktu ?? Math.max(0, rekap.hadir - (rekap.telat ?? rekap.sakitTelat ?? 0)),
          telat: rekap.telat ?? rekap.sakitTelat ?? 0,
          izin: rekap.izin,
          alpha: rekap.alpha,
          totalSesi: rekap.totalSesi,
          persentaseKehadiran: rekap.persentase,
          batasMinimalSaatItu: existingSaved?.batasMinimalSaatItu || batasMinimalGuru,
          statusPeringatan: existingSaved?.statusPeringatan || 'Belum Diterbitkan',
          nomorSurat: existingSaved?.nomorSurat,
          urutanNomorSurat: existingSaved?.urutanNomorSurat,
          tanggalTerbitSurat: existingSaved?.tanggalTerbitSurat,
          tanggalPembinaanSelesai: existingSaved?.tanggalPembinaanSelesai,
          dikonfirmasiOleh: existingSaved?.dikonfirmasiOleh,
          catatanPembinaan: existingSaved?.catatanPembinaan,
          customIsiSurat: existingSaved?.customIsiSurat,
          riwayatStatus: existingSaved?.riwayatStatus || [],
          updatedAt: existingSaved?.updatedAt || nowIso
        };

        return {
          record,
          isBelowThreshold,
          shouldShowSPButton: isBelowThreshold || Boolean(existingSaved?.nomorSurat)
        };
      })
      .sort((a, b) => {
        if (a.isBelowThreshold !== b.isBelowThreshold) return a.isBelowThreshold ? -1 : 1;
        return a.record.persentaseKehadiran - b.record.persentaseKehadiran;
      });
  }, [rekapBulananGuru, peringatanRecords, selectedBulanGuru, batasMinimalGuru, templateGuru.sertakanGuruTanpaSesi]);

  const classOptions = useMemo(() => {
    return ['SEMUA', ...Array.from(new Set(guruList.map((g) => g.kelas)))];
  }, [guruList]);

  const filteredGuruRows = useMemo(() => {
    return evaluatedGuruList.filter(({ record, isBelowThreshold }) => {
      if (viewMode === 'BELOW_THRESHOLD' && !isBelowThreshold && !record.nomorSurat) return false;
      if (filterKelas !== 'SEMUA' && record.kelas !== filterKelas) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (
          !record.namaGuru.toLowerCase().includes(q) &&
          !record.mapel.toLowerCase().includes(q) &&
          !(record.nomorSurat || '').toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [evaluatedGuruList, viewMode, filterKelas, searchQuery]);

  const belowThresholdCount = evaluatedGuruList.filter((e) => e.isBelowThreshold).length;
  const issuedSPCount = evaluatedGuruList.filter(
    (e) => e.record.statusPeringatan === 'SP Diterbitkan' || e.record.statusPeringatan === 'Pembinaan Selesai'
  ).length;
  const totalTelatBulanIni = evaluatedGuruList.reduce((acc, e) => acc + e.record.telat, 0);

  const handleCetakSuratPeringatan = async (item: PeringatanGuruRecord) => {
    try {
      setIsIssuingId(item.id);
      if (item.nomorSurat && item.statusPeringatan !== 'Belum Diterbitkan') {
        setPrintingRecord(item);
        return;
      }

      const maxSeq = peringatanRecords.reduce((m, r) => Math.max(m, r.urutanNomorSurat || 0), 0);
      const { nomorSurat, urutan } = await generateAtomicNomorSuratPeringatanGuru(
        templateGuru.formatNomorSurat,
        item.periodeBulan,
        maxSeq
      );

      const nowIso = new Date().toISOString();
      const issued: PeringatanGuruRecord = {
        ...item,
        nomorSurat,
        urutanNomorSurat: urutan,
        tanggalTerbitSurat: nowIso,
        statusPeringatan: 'SP Diterbitkan',
        batasMinimalSaatItu: batasMinimalGuru,
        updatedAt: nowIso,
        riwayatStatus: [
          ...(item.riwayatStatus || []),
          {
            tanggal: nowIso,
            status: 'SP Diterbitkan',
            oleh: currentUserName,
            keterangan: `Surat Peringatan (SP) diterbitkan No. ${nomorSurat} karena persentase penilaian (${item.persentaseKehadiran}%) di bawah batas minimal ${batasMinimalGuru}%.`
          }
        ]
      };

      const nextList = [issued, ...peringatanRecords.filter((p) => p.id !== issued.id)];
      setPeringatanRecords(nextList);
      await saveMasterDataToFirestore('peringatan_guru_records', nextList);
      await appendGuruAudit(
        'TERBITKAN_SP',
        `Menerbitkan Surat Peringatan No. ${nomorSurat} untuk ${issued.namaGuru} (${issued.persentaseKehadiran}%).`,
        { namaGuru: issued.namaGuru, periodeBulan: issued.periodeBulan, nomorSurat }
      );
      setPrintingRecord(issued);
    } finally {
      setIsIssuingId(null);
    }
  };

  const handleSaveEditedSP = async (updated: PeringatanGuruRecord) => {
    const nowIso = new Date().toISOString();
    const withHistory: PeringatanGuruRecord = {
      ...updated,
      updatedAt: nowIso,
      riwayatStatus: [
        ...(updated.riwayatStatus || []),
        {
          tanggal: nowIso,
          status: updated.statusPeringatan,
          oleh: currentUserName,
          keterangan: `Isi Surat Peringatan (${updated.nomorSurat || '-'}) diperbarui.`
        }
      ]
    };
    const nextList = [withHistory, ...peringatanRecords.filter((p) => p.id !== withHistory.id)];
    setPeringatanRecords(nextList);
    await saveMasterDataToFirestore('peringatan_guru_records', nextList);
    setPrintingRecord(withHistory);
    await appendGuruAudit(
      'EDIT_SP',
      `Mengedit Surat Peringatan No. ${withHistory.nomorSurat || '-'} untuk ${withHistory.namaGuru}.`,
      { namaGuru: withHistory.namaGuru, periodeBulan: withHistory.periodeBulan, nomorSurat: withHistory.nomorSurat }
    );
  };

  const handleConfirmPembinaan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmingRecord) return;
    const nowIso = new Date().toISOString();
    const updated: PeringatanGuruRecord = {
      ...confirmingRecord,
      statusPeringatan: 'Pembinaan Selesai',
      tanggalPembinaanSelesai: nowIso,
      dikonfirmasiOleh: currentUserName,
      catatanPembinaan: catatanPembinaanInput.trim(),
      updatedAt: nowIso,
      riwayatStatus: [
        ...(confirmingRecord.riwayatStatus || []),
        {
          tanggal: nowIso,
          status: 'Pembinaan Selesai',
          oleh: currentUserName,
          keterangan: catatanPembinaanInput.trim() || 'Pembinaan kedisiplinan guru telah selesai.'
        }
      ]
    };
    const nextList = [updated, ...peringatanRecords.filter((p) => p.id !== updated.id)];
    setPeringatanRecords(nextList);
    await saveMasterDataToFirestore('peringatan_guru_records', nextList);
    await appendGuruAudit(
      'KONFIRMASI_PEMBINAAN',
      `Konfirmasi pembinaan selesai untuk ${updated.namaGuru} (${updated.nomorSurat || '-'}).`,
      { namaGuru: updated.namaGuru, periodeBulan: updated.periodeBulan, nomorSurat: updated.nomorSurat }
    );
    setConfirmingRecord(null);
  };

  const bulanParts = selectedBulanGuru.trim().split(/\s+/);
  const currentMonthName = bulanParts[0] || 'November';
  const currentYearName = bulanParts[1] || String(new Date().getFullYear());

  return (
    <div className="space-y-5">
      {/* Toolbar Periode & Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#03150d] p-4 rounded-2xl border border-[#d4af37]/30">
        <div>
          <h3 className="text-sm font-extrabold text-[#f3e5ab] uppercase">
            Peringatan Kedisiplinan & Kehadiran Ustadz / Guru Bulanan
          </h3>
          <p className="text-[11px] text-emerald-200/90 mt-0.5">
            Data diambil langsung dari <b>Rekapan Ustadz / Guru</b> selama sebulan. Guru yang <b>Telat</b> tetap dihitung sebagai <b>Hadir</b>, namun memengaruhi persentase penilaian ({templateGuru.bobotNilaiTelatPersen ?? 50}% bobot sesi telat). Jika persentase di bawah <b>{batasMinimalGuru}%</b>, tombol <b>Surat Peringatan</b> muncul otomatis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-[#052216] px-3 py-1.5 rounded-xl border border-[#d4af37]/40">
            <Calendar className="w-4 h-4 text-[#d4af37]" />
            <select
              value={currentMonthName}
              onChange={(e) => setSelectedBulanGuru(`${e.target.value} ${currentYearName}`)}
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
              onChange={(e) => setSelectedBulanGuru(`${currentMonthName} ${e.target.value}`)}
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
            className="px-3 py-1.5 rounded-xl bg-[#083321] hover:bg-[#0b462e] border border-[#d4af37]/40 text-[#f3e5ab] font-bold text-xs flex items-center gap-1.5"
          >
            <History className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Audit SP ({auditLogs.length})</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card-3d-deep rounded-2xl p-3.5 border border-[#d4af37]/30">
          <span className="text-[10px] text-emerald-300 font-bold uppercase block">Batas Minimal Guru</span>
          <div className="text-2xl font-black text-[#f3e5ab] font-mono mt-1">&ge; {batasMinimalGuru}%</div>
          <span className="text-[10px] text-slate-300 block mt-0.5">Diatur di Option Panel</span>
        </div>

        <div className="card-3d-deep rounded-2xl p-3.5 border border-red-500/40 bg-red-950/20">
          <span className="text-[10px] text-red-300 font-bold uppercase block">Guru Perlu Peringatan</span>
          <div className="text-2xl font-black text-red-400 font-mono mt-1">{belowThresholdCount} Ustadz</div>
          <span className="text-[10px] text-red-200/80 block mt-0.5">Persentase &lt; {batasMinimalGuru}%</span>
        </div>

        <div className="card-3d-deep rounded-2xl p-3.5 border border-orange-500/40 bg-orange-950/20">
          <span className="text-[10px] text-orange-300 font-bold uppercase block">Total Telat Bulan Ini</span>
          <div className="text-2xl font-black text-orange-300 font-mono mt-1">{totalTelatBulanIni} Kali</div>
          <span className="text-[10px] text-orange-200/80 block mt-0.5">Dihitung Hadir, Skor Terpotong</span>
        </div>

        <div className="card-3d-deep rounded-2xl p-3.5 border border-emerald-500/40 bg-emerald-950/20">
          <span className="text-[10px] text-emerald-300 font-bold uppercase block">Surat Peringatan Terbit</span>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">{issuedSPCount} Surat</div>
          <span className="text-[10px] text-emerald-200/80 block mt-0.5">Periode {selectedBulanGuru}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card-3d-deep rounded-2xl p-3.5 border border-[#d4af37]/25 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
              viewMode === 'ALL'
                ? 'bg-amber-400 text-black border-amber-200'
                : 'bg-[#03150d] text-[#f3e5ab] border-[#d4af37]/30'
            }`}
          >
            Semua Ustadz / Guru ({evaluatedGuruList.length})
          </button>
          <button
            type="button"
            onClick={() => setViewMode('BELOW_THRESHOLD')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
              viewMode === 'BELOW_THRESHOLD'
                ? 'bg-red-500 text-white border-red-300'
                : 'bg-[#03150d] text-red-300 border-red-500/40'
            }`}
          >
            Di Bawah Batas &lt; {batasMinimalGuru}% ({belowThresholdCount})
          </button>

          <select
            value={filterKelas}
            onChange={(e) => setFilterKelas(e.target.value)}
            className="bg-[#03150d] border border-[#d4af37]/40 rounded-xl px-2.5 py-1.5 text-xs text-white font-semibold"
          >
            {classOptions.map((k) => (
              <option key={k} value={k} className="bg-[#03150d]">
                {k === 'SEMUA' ? 'Semua Kelas' : k}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-[#d4af37] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari Ustadz / Mapel / No. SP..."
            className="w-full bg-[#03150d] border border-[#d4af37]/40 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#d4af37]"
          />
        </div>
      </div>

      {/* Tabel Peringatan & Kedisiplinan Guru */}
      <div className="card-3d rounded-2xl border border-[#d4af37]/35 overflow-hidden bg-[#020f09]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-xs">
            <thead className="bg-[#052618] text-[#d4af37] uppercase text-[11px] font-extrabold border-b border-[#d4af37]/30">
              <tr>
                <th className="p-3 w-12 text-center">NO</th>
                <th className="p-3">NAMA USTADZ / GURU</th>
                <th className="p-3">MATA PELAJARAN</th>
                <th className="p-3 w-28">KELAS</th>
                <th className="p-3 w-28">BULAN REKAP</th>
                <th className="p-3 w-28 text-center text-emerald-300 bg-emerald-950/30">HADIR (INCL. TELAT)</th>
                <th className="p-3 w-16 text-center text-amber-300 bg-amber-950/20">IZIN</th>
                <th className="p-3 w-20 text-center text-orange-300 bg-orange-950/20">TELAT</th>
                <th className="p-3 w-16 text-center text-red-300 bg-red-950/20">ALPHA</th>
                <th className="p-3 w-28 text-center text-[#f3e5ab]">PERSENTASE</th>
                <th className="p-3 w-36 text-center">STATUS PERINGATAN</th>
                <th className="p-3 w-48 text-center text-amber-300">SURAT PERINGATAN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d4af37]/15">
              {filteredGuruRows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-emerald-300">
                    Tidak ada data rekap ustadz/guru yang sesuai filter pada periode <b>{selectedBulanGuru}</b>.
                  </td>
                </tr>
              ) : (
                filteredGuruRows.map(({ record, isBelowThreshold, shouldShowSPButton }, idx) => (
                  <tr
                    key={`${record.id}-${idx}`}
                    className={`transition ${
                      isBelowThreshold ? 'bg-red-950/15 hover:bg-red-950/25' : 'hover:bg-[#d4af37]/5'
                    }`}
                  >
                    <td className="p-3 text-center font-mono text-emerald-300">{idx + 1}</td>
                    <td className="p-3 font-bold text-white">
                      {record.namaGuru}
                      {record.nomorSurat && (
                        <span className="block text-[10px] font-mono text-[#d4af37]">No: {record.nomorSurat}</span>
                      )}
                    </td>
                    <td className="p-3 text-emerald-200">{record.mapel}</td>
                    <td className="p-3 text-[#d4af37] font-semibold">{record.kelas}</td>
                    <td className="p-3 font-mono text-slate-200">{record.periodeBulan}</td>
                    <td className="p-3 text-center font-mono font-bold text-emerald-400 bg-emerald-950/10">
                      {record.hadir} kali
                      {record.telat > 0 && (
                        <span className="block text-[9px] text-emerald-300/80 font-normal">
                          ({record.hadirTepatWaktu} tepat + {record.telat} telat)
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center font-mono text-amber-300 bg-amber-950/10">{record.izin}</td>
                    <td className="p-3 text-center font-mono font-bold text-orange-300 bg-orange-950/10">
                      {record.telat}
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-red-400 bg-red-950/10">
                      {record.alpha}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`font-mono font-black text-sm ${
                          record.totalSesi === 0
                            ? 'text-slate-400'
                            : isBelowThreshold
                            ? 'text-red-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {record.persentaseKehadiran}%
                      </span>
                      <span className="block text-[9px] text-slate-400 font-mono">
                        ({record.totalSesi} sesi)
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {record.totalSesi === 0 && !templateGuru.sertakanGuruTanpaSesi ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-600 inline-block">
                          Belum Ada Sesi
                        </span>
                      ) : !isBelowThreshold && record.statusPeringatan === 'Belum Diterbitkan' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40 inline-block">
                          Memenuhi Standar
                        </span>
                      ) : (
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-block ${
                            record.statusPeringatan === 'Pembinaan Selesai'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                              : record.statusPeringatan === 'SP Diterbitkan'
                              ? 'bg-amber-950 text-amber-300 border-amber-500/50'
                              : 'bg-red-950 text-red-300 border-red-500/60 animate-pulse'
                          }`}
                        >
                          {record.statusPeringatan === 'Belum Diterbitkan'
                            ? 'Di Bawah Batas (Perlu SP)'
                            : record.statusPeringatan}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {shouldShowSPButton ? (
                        <div className="flex flex-wrap items-center justify-center gap-1.5">
                          <button
                            type="button"
                            disabled={isIssuingId === record.id}
                            onClick={() => handleCetakSuratPeringatan(record)}
                            className="btn-3d-gold px-3 py-1.5 rounded-lg text-black font-extrabold text-[11px] flex items-center gap-1 shadow"
                          >
                            <Printer className="w-3.5 h-3.5 text-black" />
                            <span>
                              {record.nomorSurat ? 'Cetak Ulang SP' : 'Cetak Surat Peringatan'}
                            </span>
                          </button>

                          {record.statusPeringatan === 'SP Diterbitkan' && (
                            <button
                              type="button"
                              onClick={() => {
                                setCatatanPembinaanInput(
                                  'Ustadz/ah telah menerima pembinaan dan berkomitmen memperbaiki kedisiplinan.'
                                );
                                setConfirmingRecord(record);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 border border-emerald-400/50 text-white font-bold text-[10px] flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Selesai Pembinaan</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-emerald-400/80 font-medium">
                          Tertib (&ge; {batasMinimalGuru}%)
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Konfirmasi Pembinaan */}
      {confirmingRecord && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card-3d rounded-3xl p-6 max-w-md w-full border-2 border-emerald-500/60 bg-[#041d12] space-y-4">
            <div className="flex items-center justify-between border-b border-[#d4af37]/25 pb-3">
              <h4 className="text-sm font-extrabold text-white text-gold-3d">
                Konfirmasi Pembinaan Kedisiplinan Guru
              </h4>
              <button
                type="button"
                onClick={() => setConfirmingRecord(null)}
                className="p-1 rounded-lg bg-red-950 text-red-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleConfirmPembinaan} className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#02100a] border border-[#d4af37]/30 space-y-1">
                <div>
                  Ustadz/ah: <b className="text-white">{confirmingRecord.namaGuru}</b>
                </div>
                <div>
                  Nomor SP: <b className="text-[#f3e5ab] font-mono">{confirmingRecord.nomorSurat}</b>
                </div>
              </div>
              <div>
                <label className="text-emerald-300 font-bold block mb-1">Catatan Pembinaan:</label>
                <textarea
                  rows={3}
                  value={catatanPembinaanInput}
                  onChange={(e) => setCatatanPembinaanInput(e.target.value)}
                  className="w-full bg-[#02100a] border border-[#d4af37]/40 rounded-xl p-2.5 text-white"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmingRecord(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Batal
                </button>
                <button type="submit" className="btn-3d-gold px-4 py-2 rounded-xl text-black font-extrabold">
                  Simpan Status Pembinaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Audit SP */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card-3d rounded-3xl p-6 max-w-2xl w-full border-2 border-[#d4af37] bg-[#041d12] max-h-[85vh] flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-[#d4af37]/25 pb-3 shrink-0">
              <h4 className="text-sm font-extrabold text-white text-gold-3d flex items-center gap-2">
                <History className="w-4 h-4 text-[#d4af37]" />
                Log Audit Surat Peringatan Guru ({auditLogs.length})
              </h4>
              <button
                type="button"
                onClick={() => setShowAuditModal(false)}
                className="p-1.5 rounded-lg bg-red-950 text-red-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto space-y-2 text-xs flex-1">
              {auditLogs.length === 0 ? (
                <div className="p-6 text-center text-slate-400">Belum ada catatan audit Surat Peringatan Guru.</div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="p-3 rounded-xl bg-[#02100a] border border-[#d4af37]/20 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-[#f3e5ab] font-bold font-mono">
                        {log.aksi}
                      </span>
                      <span className="text-slate-400 font-mono">{formatTanggalIndoSP(log.timestamp, true)}</span>
                    </div>
                    <p className="text-white">{log.detail}</p>
                    <span className="text-[10px] text-emerald-400 block">Oleh: {log.aktor}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Print Surat Peringatan Guru */}
      {printingRecord && (
        <SuratPeringatanGuruPrintModal
          isOpen={Boolean(printingRecord)}
          onClose={() => setPrintingRecord(null)}
          template={templateGuru}
          record={printingRecord}
          settings={settings}
          onSaveEditedRecord={handleSaveEditedSP}
        />
      )}
    </div>
  );
};

/**
 * OPTION PANEL SECTION — PENGATURAN PERINGATAN GURU & FORMAT SURAT PERINGATAN (SP)
 */
export const OptionPanelPeringatanGuruSection: React.FC<{
  settings: AppSettings;
  guruList: GuruPengajar[];
  rekapBulananGuru: RekapBulananGuruItem[];
  selectedBulanGuru: string;
}> = ({ settings, guruList, rekapBulananGuru, selectedBulanGuru }) => {
  const [formConfig, setFormConfig] = useState<TemplateSuratPeringatanGuru>(
    DEFAULT_TEMPLATE_SURAT_PERINGATAN_GURU
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveBanner, setSaveBanner] = useState<string | null>(null);
  const [showSamplePreview, setShowSamplePreview] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let mounted = true;
    loadMasterDataFromFirestore<TemplateSuratPeringatanGuru>('peringatan_guru_template').then((data) => {
      if (mounted && data && typeof data === 'object') {
        setFormConfig({ ...DEFAULT_TEMPLATE_SURAT_PERINGATAN_GURU, ...data });
      }
    });
    const unsub = subscribeMasterDataFromFirestore<TemplateSuratPeringatanGuru>(
      'peringatan_guru_template',
      (data) => {
        if (mounted && data && typeof data === 'object') {
          setFormConfig({ ...DEFAULT_TEMPLATE_SURAT_PERINGATAN_GURU, ...data });
        }
      }
    );
    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  const handleSaveGuruConfig = async (customMsg?: string) => {
    const validatedPct = Math.max(0, Math.min(100, Number(formConfig.batasMinimalKehadiranGuru) || 0));
    const validatedWeight = Math.max(0, Math.min(99, Number(formConfig.bobotNilaiTelatPersen) ?? 50));
    const payload: TemplateSuratPeringatanGuru = {
      ...formConfig,
      batasMinimalKehadiranGuru: validatedPct,
      bobotNilaiTelatPersen: validatedWeight,
      updatedAt: new Date().toISOString(),
      updatedBy: 'Admin'
    };

    setIsSaving(true);
    try {
      setFormConfig(payload);
      await saveMasterDataToFirestore('peringatan_guru_template', payload);
      const existingLogs =
        (await loadMasterDataFromFirestore<PeringatanGuruAuditLog[]>('peringatan_guru_audit')) || [];
      const newAudit: PeringatanGuruAuditLog = {
        id: `AUDG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        aksi: 'UBAH_TEMPLATE_SP',
        aktor: 'Admin',
        detail:
          customMsg ||
          `Menyimpan Pengaturan Peringatan Guru (Batas Minimal: ${validatedPct}%, Bobot Nilai Telat: ${validatedWeight}%).`
      };
      await saveMasterDataToFirestore('peringatan_guru_audit', [newAudit, ...existingLogs].slice(0, 300));
      setSaveBanner(
        customMsg ||
          `Alhamdulillah! Pengaturan Peringatan Guru (Batas ${validatedPct}%, Bobot Telat ${validatedWeight}%) & Template SP berhasil disimpan ke Firestore.`
      );
      setTimeout(() => setSaveBanner(null), 6000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefault = async () => {
    if (!window.confirm('Kembalikan pengaturan Peringatan Guru dan template SP ke default (75%)?')) return;
    const resetPayload: TemplateSuratPeringatanGuru = {
      ...DEFAULT_TEMPLATE_SURAT_PERINGATAN_GURU,
      updatedAt: new Date().toISOString(),
      updatedBy: 'Admin'
    };
    setFormConfig(resetPayload);
    await saveMasterDataToFirestore('peringatan_guru_template', resetPayload);
    setSaveBanner('Template Surat Peringatan Guru berhasil dikembalikan ke pengaturan default.');
    setTimeout(() => setSaveBanner(null), 5000);
  };

  const handleUploadLogoSP = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      console.warn('Gagal mengompres logo SP:', err);
    }
  };

  const previewDetectedGuruCount = useMemo(() => {
    const pct = Math.max(0, Math.min(100, Number(formConfig.batasMinimalKehadiranGuru) || 0));
    return rekapBulananGuru.filter(
      (g) => (g.totalSesi > 0 || formConfig.sertakanGuruTanpaSesi) && g.persentase < pct
    ).length;
  }, [rekapBulananGuru, formConfig.batasMinimalKehadiranGuru, formConfig.sertakanGuruTanpaSesi]);

  const sampleGuru = guruList[0] || {
    nama: 'Ust. Ahmad Hidayatullah',
    mapel: 'Nahwu / Jurumiyah',
    kelas: '1 TSANAWIYAH'
  };

  const sampleRecord: PeringatanGuruRecord = {
    id: 'SAMPLE-SP-GURU',
    namaGuru: sampleGuru.nama,
    mapel: sampleGuru.mapel,
    kelas: sampleGuru.kelas,
    periodeBulan: selectedBulanGuru,
    hadir: 12,
    hadirTepatWaktu: 8,
    telat: 4,
    izin: 2,
    alpha: 2,
    totalSesi: 16,
    persentaseKehadiran: 63,
    batasMinimalSaatItu: formConfig.batasMinimalKehadiranGuru,
    statusPeringatan: 'SP Diterbitkan',
    nomorSurat: formatNomorSuratFromCounter(1, formConfig.formatNomorSurat, selectedBulanGuru),
    tanggalTerbitSurat: new Date().toISOString(),
    riwayatStatus: [],
    updatedAt: new Date().toISOString()
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#d4af37]/25">
        <div>
          <h4 className="text-sm sm:text-base font-black text-[#f3e5ab] uppercase">
            Pengaturan Peringatan Ustadz / Guru & Template Surat Peringatan (SP)
          </h4>
          <p className="text-xs text-emerald-300">
            Atur batas minimal persentase kehadiran & kedisiplinan guru. Guru dengan nilai di bawah batas otomatis menampilkan tombol Cetak Surat Peringatan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSamplePreview(true)}
            className="px-3.5 py-2 rounded-xl bg-[#083321] border border-[#d4af37]/50 text-[#f3e5ab] font-bold text-xs flex items-center gap-1.5"
          >
            <Eye className="w-4 h-4 text-[#d4af37]" />
            <span>Pratinjau Surat SP</span>
          </button>
          <button
            type="button"
            onClick={handleResetDefault}
            className="px-3.5 py-2 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 font-bold text-xs flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Default</span>
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSaveGuruConfig()}
            className="btn-3d-gold px-4 py-2 rounded-xl text-black font-extrabold text-xs flex items-center gap-1.5"
          >
            <Save className="w-4 h-4 text-black" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan Guru'}</span>
          </button>
        </div>
      </div>

      {saveBanner && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/90 border border-emerald-400 text-emerald-200 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveBanner}</span>
        </div>
      )}

      {/* Kriteria Persentase & Bobot Telat */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
        <div className="card-3d-deep rounded-2xl p-4 border border-[#d4af37]/35 space-y-3">
          <div className="flex items-center justify-between border-b border-[#d4af37]/20 pb-2">
            <span className="font-extrabold text-[#f3e5ab] uppercase">
              1. Batas Minimal Kehadiran & Kedisiplinan Guru
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono">
              Default: 75%
            </span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={0}
              max={100}
              value={formConfig.batasMinimalKehadiranGuru}
              onChange={(e) =>
                setFormConfig({
                  ...formConfig,
                  batasMinimalKehadiranGuru: Math.max(0, Math.min(100, Number(e.target.value) || 0))
                })
              }
              className="w-24 bg-[#02100a] border-2 border-[#d4af37] rounded-xl px-3 py-2 text-lg font-black text-[#f3e5ab] font-mono text-center"
            />
            <span className="text-base font-extrabold text-white">%</span>
            <div className="flex-1 p-2.5 rounded-xl bg-black/40 border border-[#d4af37]/25 text-[11px] text-emerald-200">
              Ustadz/Guru dengan penilaian <b>&lt; {formConfig.batasMinimalKehadiranGuru}%</b> otomatis memunculkan tombol <b>Surat Peringatan</b> ({previewDetectedGuruCount} guru terdeteksi pada {selectedBulanGuru}).
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-300">
            <input
              type="checkbox"
              checked={Boolean(formConfig.sertakanGuruTanpaSesi)}
              onChange={(e) => setFormConfig({ ...formConfig, sertakanGuruTanpaSesi: e.target.checked })}
            />
            <span>Sertakan juga guru dengan 0 sesi absensi pada periode berjalan</span>
          </label>
        </div>

        <div className="card-3d-deep rounded-2xl p-4 border border-orange-500/40 space-y-3">
          <div className="flex items-center justify-between border-b border-orange-500/20 pb-2">
            <span className="font-extrabold text-orange-300 uppercase">
              2. Pengaruh Keterlambatan (Telat) Terhadap Persentase
            </span>
            <span className="px-2 py-0.5 rounded-full bg-orange-950 text-orange-300 border border-orange-500/40 text-[10px] font-mono">
              Default Bobot: 50%
            </span>
          </div>
          <p className="text-[11px] text-emerald-200/90 leading-relaxed">
            Ustadz/Guru yang berstatus <b>Telat</b> tetap dihitung <b>Hadir</b> pada jumlah mengajar, namun setiap sesi <b>Telat</b> hanya mendapat bobot nilai berikut dalam perhitungan persentase kedisiplinan:
          </p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={0}
              max={99}
              value={formConfig.bobotNilaiTelatPersen}
              onChange={(e) =>
                setFormConfig({
                  ...formConfig,
                  bobotNilaiTelatPersen: Math.max(0, Math.min(99, Number(e.target.value) || 0))
                })
              }
              className="w-24 bg-[#02100a] border-2 border-orange-400 rounded-xl px-3 py-2 text-lg font-black text-orange-300 font-mono text-center"
            />
            <span className="text-sm font-extrabold text-white">% Nilai Hadir</span>
            <span className="text-[11px] text-slate-300 flex-1">
              (Contoh: 50% berarti 1x Telat = 0.5 poin Hadir, memotong skor penilaian secara proporsional)
            </span>
          </div>
        </div>
      </div>

      {/* Editor Template Surat Peringatan */}
      <div className="card-3d-deep rounded-2xl p-5 border border-[#d4af37]/35 space-y-4 text-xs">
        <h5 className="text-sm font-extrabold text-[#f3e5ab] uppercase border-b border-[#d4af37]/20 pb-2">
          3. Editor Format & Isi Surat Peringatan Guru (Editable dari Logo hingga Tanda Tangan)
        </h5>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-2xl bg-[#02100a] border border-[#d4af37]/30 space-y-2.5">
            <span className="font-bold text-[#f3e5ab] block">Logo Surat Peringatan:</span>
            <div className="flex items-center gap-3">
              <img
                src={
                  formConfig.gunakanLogoUtama || !formConfig.logoUrl
                    ? resolveLogos(settings).madrasah
                    : formConfig.logoUrl
                }
                alt="Logo SP"
                className="w-14 h-14 rounded-xl object-contain bg-white p-1 border border-[#d4af37]"
              />
              <div className="space-y-1.5 flex-1">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUploadLogoSP}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#083321] border border-[#d4af37]/50 text-[#f3e5ab] font-bold text-[11px] flex items-center justify-center gap-1"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Logo</span>
                </button>
                <label className="flex items-center gap-1.5 text-[11px] text-emerald-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formConfig.gunakanLogoUtama}
                    onChange={(e) => setFormConfig({ ...formConfig, gunakanLogoUtama: e.target.checked })}
                  />
                  <span>Pakai Logo Utama</span>
                </label>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-emerald-300 font-bold block mb-1">Nama Lembaga / Pondok:</label>
              <input
                type="text"
                value={formConfig.namaLembaga}
                onChange={(e) => setFormConfig({ ...formConfig, namaLembaga: e.target.value })}
                className="w-full bg-[#02100a] border border-[#d4af37]/40 rounded-xl px-3 py-1.5 text-white font-bold"
              />
            </div>
            <div>
              <label className="text-emerald-300 font-bold block mb-1">Nama Madrasah:</label>
              <input
                type="text"
                value={formConfig.namaMadrasah}
                onChange={(e) => setFormConfig({ ...formConfig, namaMadrasah: e.target.value })}
                className="w-full bg-[#02100a] border border-[#d4af37]/40 rounded-xl px-3 py-1.5 text-white font-bold"
              />
            </div>
            <div>
              <label className="text-emerald-300 font-bold block mb-1">Sub-Kop Dewan / Komisi:</label>
              <input
                type="text"
                value={formConfig.subKopSurat}
                onChange={(e) => setFormConfig({ ...formConfig, subKopSurat: e.target.value })}
                className="w-full bg-[#02100a] border border-[#d4af37]/40 rounded-xl px-3 py-1.5 text-white"
              />
            </div>
            <div>
              <label className="text-emerald-300 font-bold block mb-1">Alamat Lembaga:</label>
              <input
                type="text"
                value={formConfig.alamatLembaga}
                onChange={(e) => setFormConfig({ ...formConfig, alamatLembaga: e.target.value })}
                className="w-full bg-[#02100a] border border-[#d4af37]/40 rounded-xl px-3 py-1.5 text-white"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-emerald-300 font-bold block mb-1">Format Nomor SP Otomatis:</label>
            <input
              type="text"
              value={formConfig.formatNomorSurat}
              onChange={(e) => setFormConfig({ ...formConfig, formatNomorSurat: e.target.value })}
              className="w-full bg-[#02100a] border border-[#d4af37]/40 rounded-xl px-3 py-1.5 text-[#f3e5ab] font-mono font-bold"
            />
          </div>
          <div>
            <label className="text-emerald-300 font-bold block mb-1">Judul Surat SP:</label>
            <input
              type="text"
              value={formConfig.judulSurat}
              onChange={(e) => setFormConfig({ ...formConfig, judulSurat: e.target.value })}
              className="w-full bg-[#02100a] border border-[#d4af37]/40 rounded-xl px-3 py-1.5 text-white font-bold"
            />
          </div>
          <div>
            <label className="text-emerald-300 font-bold block mb-1">Perihal Surat:</label>
            <input
              type="text"
              value={formConfig.perihalSurat}
              onChange={(e) => setFormConfig({ ...formConfig, perihalSurat: e.target.value })}
              className="w-full bg-[#02100a] border border-[#d4af37]/40 rounded-xl px-3 py-1.5 text-white"
            />
          </div>
          <div>
            <label className="text-emerald-300 font-bold block mb-1">Kota & Ukuran Kertas:</label>
            <div className="grid grid-cols-2 gap-1.5">
              <input
                type="text"
                value={formConfig.kotaTanggalSurat}
                onChange={(e) => setFormConfig({ ...formConfig, kotaTanggalSurat: e.target.value })}
                className="w-full bg-[#02100a] border border-[#d4af37]/40 rounded-xl px-2 py-1.5 text-white"
              />
              <select
                value={formConfig.ukuranKertas}
                onChange={(e) => setFormConfig({ ...formConfig, ukuranKertas: e.target.value as 'A4' | 'F4' })}
                className="w-full bg-[#02100a] border border-[#d4af37]/40 rounded-xl px-2 py-1.5 text-white font-bold"
              >
                <option value="A4">A4</option>
                <option value="F4">F4</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-emerald-300 font-bold block mb-1">Paragraf Pembukaan:</label>
            <textarea
              rows={2}
              value={formConfig.isiPembukaan}
              onChange={(e) => setFormConfig({ ...formConfig, isiPembukaan: e.target.value })}
              className="w-full bg-[#02100a] border border-[#d4af37]/40 rounded-xl p-2 text-white"
            />
          </div>
          <div>
            <label className="text-emerald-300 font-bold block mb-1">Isi Teguran Kedisiplinan:</label>
            <textarea
              rows={2}
              value={formConfig.isiTeguranDisiplin}
              onChange={(e) => setFormConfig({ ...formConfig, isiTeguranDisiplin: e.target.value })}
              className="w-full bg-[#02100a] border border-[#d4af37]/40 rounded-xl p-2 text-white"
            />
          </div>
          <div>
            <label className="text-emerald-300 font-bold block mb-1">Arahan Tindak Lanjut:</label>
            <textarea
              rows={2}
              value={formConfig.isiTindakLanjut}
              onChange={(e) => setFormConfig({ ...formConfig, isiTindakLanjut: e.target.value })}
              className="w-full bg-[#02100a] border border-[#d4af37]/40 rounded-xl p-2 text-white"
            />
          </div>
          <div>
            <label className="text-emerald-300 font-bold block mb-1">Paragraf Penutup:</label>
            <textarea
              rows={2}
              value={formConfig.isiPenutup}
              onChange={(e) => setFormConfig({ ...formConfig, isiPenutup: e.target.value })}
              className="w-full bg-[#02100a] border border-[#d4af37]/40 rounded-xl p-2 text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-[#02100a] border border-[#d4af37]/25 space-y-1.5">
            <span className="text-[11px] font-bold text-[#d4af37]">TTD 1 (Kiri):</span>
            <input
              type="text"
              value={formConfig.jabatanPenandatangan1}
              onChange={(e) => setFormConfig({ ...formConfig, jabatanPenandatangan1: e.target.value })}
              className="w-full bg-[#041d12] border border-[#d4af37]/30 rounded-lg px-2.5 py-1 text-white font-bold"
            />
            <input
              type="text"
              value={formConfig.namaPenandatangan1}
              onChange={(e) => setFormConfig({ ...formConfig, namaPenandatangan1: e.target.value })}
              className="w-full bg-[#041d12] border border-[#d4af37]/30 rounded-lg px-2.5 py-1 text-white"
            />
          </div>
          <div className="p-3 rounded-xl bg-[#02100a] border border-[#d4af37]/25 space-y-1.5">
            <span className="text-[11px] font-bold text-[#d4af37]">TTD 2 (Tengah):</span>
            <input
              type="text"
              value={formConfig.jabatanPenandatangan2}
              onChange={(e) => setFormConfig({ ...formConfig, jabatanPenandatangan2: e.target.value })}
              className="w-full bg-[#041d12] border border-[#d4af37]/30 rounded-lg px-2.5 py-1 text-white font-bold"
            />
            <input
              type="text"
              value={formConfig.namaPenandatangan2}
              onChange={(e) => setFormConfig({ ...formConfig, namaPenandatangan2: e.target.value })}
              className="w-full bg-[#041d12] border border-[#d4af37]/30 rounded-lg px-2.5 py-1 text-white"
            />
          </div>
          <div className="p-3 rounded-xl bg-[#02100a] border border-[#d4af37]/25 space-y-1.5">
            <span className="text-[11px] font-bold text-[#d4af37]">TTD 3 (Kanan):</span>
            <input
              type="text"
              value={formConfig.jabatanPenandatangan3}
              onChange={(e) => setFormConfig({ ...formConfig, jabatanPenandatangan3: e.target.value })}
              className="w-full bg-[#041d12] border border-[#d4af37]/30 rounded-lg px-2.5 py-1 text-white font-bold"
            />
            <input
              type="text"
              value={formConfig.namaPenandatangan3}
              onChange={(e) => setFormConfig({ ...formConfig, namaPenandatangan3: e.target.value })}
              className="w-full bg-[#041d12] border border-[#d4af37]/30 rounded-lg px-2.5 py-1 text-white"
            />
          </div>
        </div>
      </div>

      {showSamplePreview && (
        <SuratPeringatanGuruPrintModal
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
