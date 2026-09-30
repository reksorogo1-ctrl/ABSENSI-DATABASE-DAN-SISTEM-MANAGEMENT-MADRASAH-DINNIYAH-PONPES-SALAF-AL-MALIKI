import React, { useState, useEffect, useRef } from 'react';
import { 
  FileSpreadsheet, CheckCircle2, AlertTriangle, RefreshCw, 
  ExternalLink, Plus, FolderOpen, ArrowDownToLine, ArrowUpFromLine, 
  X, Check, Sparkles, ShieldCheck, UserCheck, AlertCircle, Database,
  Copy, Upload, Download, Info, ShieldAlert, Key, Globe, FileUp
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { GoogleSheetsService, DriveSpreadsheetFile, SheetMetadata } from '../sheetsService';
import { 
  googleSignIn, logoutGoogle, getCurrentGoogleUser, 
  isUnauthorizedDomainError, setManualAccessToken 
} from '../googleAuth';
import { AppSettings, Santri, GuruPengajar, JadwalPelajaran, NadzhomRecord, NilaiUjianRecord, AbsensiSantriRecord, AbsensiGuruRecord, SyahriyahRecord } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheetsService: GoogleSheetsService;
  spreadsheetId: string;
  setSpreadsheetId: (id: string) => void;
  isGoogleConnected: boolean;
  setIsGoogleConnected: (connected: boolean) => void;
  // Data for export/import
  appData: {
    settings: AppSettings;
    santriList: Santri[];
    guruList: GuruPengajar[];
    jadwalList: JadwalPelajaran[];
    nadzhomList: NadzhomRecord[];
    nilaiList: NilaiUjianRecord[];
    absensiSantriList: AbsensiSantriRecord[];
    absensiGuruList: AbsensiGuruRecord[];
    syahriyahList?: SyahriyahRecord[];
  };
  onDataImported: (imported: {
    santriList?: Santri[];
    guruList?: GuruPengajar[];
    jadwalList?: JadwalPelajaran[];
    nadzhomList?: NadzhomRecord[];
    nilaiList?: NilaiUjianRecord[];
    absensiSantriList?: AbsensiSantriRecord[];
    absensiGuruList?: AbsensiGuruRecord[];
    syahriyahList?: SyahriyahRecord[];
    settings?: Partial<AppSettings>;
  }) => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  sheetsService,
  spreadsheetId,
  setSpreadsheetId,
  isGoogleConnected,
  setIsGoogleConnected,
  appData,
  onDataImported
}) => {
  const [currentUser, setCurrentUser] = useState(getCurrentGoogleUser());
  const [inputSpreadsheetId, setInputSpreadsheetId] = useState(spreadsheetId);
  const [metadata, setMetadata] = useState<SheetMetadata | null>(null);
  const [driveFiles, setDriveFiles] = useState<DriveSpreadsheetFile[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Error Domain Helper & Alternative tabs
  const [showDomainHelp, setShowDomainHelp] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [activeImportTab, setActiveImportTab] = useState<'oauth' | 'file' | 'public' | 'token'>('oauth');
  const [manualTokenInput, setManualTokenInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';

  // Destructive Confirmation Dialog State (Mandatory as per Workspace skill)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    action: 'export' | 'import' | 'createNew';
    title: string;
    description: string;
    targetSheetName?: string;
  }>({
    isOpen: false,
    action: 'export',
    title: '',
    description: ''
  });

  useEffect(() => {
    setCurrentUser(getCurrentGoogleUser());
  }, [isGoogleConnected]);

  // Load metadata when ID changes or modal opens
  useEffect(() => {
    if (isOpen && spreadsheetId && isGoogleConnected) {
      loadMetadata();
    }
  }, [isOpen, spreadsheetId, isGoogleConnected]);

  const loadMetadata = async () => {
    try {
      const meta = await sheetsService.getSpreadsheetMetadata();
      setMetadata(meta);
    } catch {
      setMetadata(null);
    }
  };

  const loadDriveFiles = async () => {
    setIsLoadingDrive(true);
    setStatusMessage(null);
    try {
      const files = await sheetsService.listSpreadsheetsFromDrive();
      setDriveFiles(files);
      if (files.length === 0) {
        setStatusMessage({ type: 'info', text: 'Tidak ada spreadsheet ditemukan di Google Drive Anda. Buat baru di bawah.' });
      }
    } catch (e: any) {
      console.error(e);
      setStatusMessage({ type: 'error', text: 'Gagal memuat daftar Google Drive. Pastikan izin Google Sheets & Drive telah disetujui.' });
    } finally {
      setIsLoadingDrive(false);
    }
  };

  const handleCopyDomain = () => {
    if (!currentDomain) return;
    navigator.clipboard.writeText(currentDomain);
    setCopiedDomain(true);
    setTimeout(() => setCopiedDomain(false), 3000);
  };

  const handleConnectGoogle = async () => {
    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setIsGoogleConnected(true);
        setCurrentUser(res.user);
        setStatusMessage({ type: 'success', text: `Berhasil terhubung dengan Google (${res.user.email || 'OAuth Token Terdaftar'})` });
        sheetsService.setSpreadsheetId(spreadsheetId);
        loadMetadata();
        loadDriveFiles();
      }
    } catch (err: any) {
      console.error('Login error:', err);
      if (isUnauthorizedDomainError(err)) {
        setShowDomainHelp(true);
        setStatusMessage({ 
          type: 'error', 
          text: `Firebase: Error (auth/unauthorized-domain). Domain "${currentDomain}" belum didaftarkan di Firebase Console. Ikuti panduan cepat di bawah atau gunakan Impor File Excel / Link Publik.` 
        });
      } else {
        setStatusMessage({ type: 'error', text: err?.message || 'Gagal login dengan Google' });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    await logoutGoogle();
    setIsGoogleConnected(false);
    setCurrentUser(null);
    setMetadata(null);
    setStatusMessage({ type: 'info', text: 'Telah keluar dari akun Google.' });
  };

  const handleApplyManualToken = () => {
    if (!manualTokenInput.trim()) {
      setStatusMessage({ type: 'error', text: 'Silakan masukkan Access Token Google terlebih dahulu.' });
      return;
    }
    const res = setManualAccessToken(manualTokenInput.trim());
    setIsGoogleConnected(true);
    setCurrentUser(res.user);
    setStatusMessage({ type: 'success', text: 'Access Token Google berhasil diterapkan!' });
    sheetsService.setSpreadsheetId(spreadsheetId);
    loadMetadata();
    loadDriveFiles();
  };

  // Helper to extract Spreadsheet ID from URL if user pastes a full link
  const cleanAndApplySpreadsheetId = (val: string) => {
    let clean = val.trim();
    if (clean.includes('/d/')) {
      const match = clean.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        clean = match[1];
      }
    }
    setInputSpreadsheetId(clean);
    setSpreadsheetId(clean);
    sheetsService.setSpreadsheetId(clean);
    loadMetadata();
    setStatusMessage({ type: 'success', text: `ID Spreadsheet berhasil diterapkan: ${clean}` });
  };

  // ==========================================
  // METODE ALTERNATIF 1: IMPOR BERKAS EXCEL / CSV (.xlsx / .csv)
  // ==========================================
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processSpreadsheetFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processSpreadsheetFile = async (file: File) => {
    setIsProcessing(true);
    setStatusMessage({ type: 'info', text: `Membaca dan memproses file: ${file.name}...` });
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      
      const importedResult: any = {};
      let totalImported = 0;

      // 1. Sheet Santri
      const santriSheetName = workbook.SheetNames.find(n => 
        n.toLowerCase().includes('santri') || n.toLowerCase().includes('siswa')
      ) || workbook.SheetNames[0];

      if (santriSheetName && workbook.Sheets[santriSheetName]) {
        const rows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[santriSheetName]);
        if (rows.length > 0) {
          const parsedSantri: Santri[] = rows.map((r, idx) => ({
            id: String(r['NIS'] || r['nis'] || r['ID'] || r['id'] || `SAN-${1000 + idx}`),
            nama: String(r['NAMA SANTRI'] || r['NAMA'] || r['Nama'] || r['nama'] || `Santri ${idx + 1}`),
            kelas: String(r['KELAS'] || r['Kelas'] || r['kelas'] || '1 TSANAWIYAH'),
            kamar: String(r['KAMAR'] || r['Kamar'] || r['kamar'] || 'Asrama Al-Ghazali'),
            alamat: String(r['ALAMAT'] || r['Alamat'] || r['alamat'] || '-'),
            foto: String(r['FOTO'] || r['foto'] || ''),
            namaOrangTua: String(r['ORANG TUA / WALI'] || r['Nama Orang Tua'] || r['namaOrangTua'] || '-'),
            noWaWaliKelas: String(r['NO WA WALI'] || r['noWaWaliKelas'] || ''),
            saldoUangSaku: Number(r['SALDO UANG SAKU'] || r['saldoUangSaku'] || 0)
          }));
          importedResult.santriList = parsedSantri;
          totalImported += parsedSantri.length;
        }
      }

      // 2. Sheet Guru / Ustadz
      const guruSheetName = workbook.SheetNames.find(n => 
        n.toLowerCase().includes('guru') || n.toLowerCase().includes('ustadz') || n.toLowerCase().includes('asatidz')
      );
      if (guruSheetName && workbook.Sheets[guruSheetName]) {
        const rows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[guruSheetName]);
        if (rows.length > 0) {
          const parsedGuru: GuruPengajar[] = rows.map((r, idx) => ({
            id: String(r['ID'] || r['id'] || `G-${idx + 1}`),
            nama: String(r['NAMA GURU / USTADZ'] || r['NAMA'] || r['Nama'] || r['nama'] || `Ustadz ${idx + 1}`),
            mapel: String(r['MAPEL'] || r['Mapel'] || r['mapel'] || 'Nahwu'),
            kelas: String(r['KELAS'] || r['Kelas'] || r['kelas'] || '1 TSANAWIYAH')
          }));
          importedResult.guruList = parsedGuru;
          totalImported += parsedGuru.length;
        }
      }

      // 3. Sheet Jadwal Pelajaran
      const jadwalSheetName = workbook.SheetNames.find(n => n.toLowerCase().includes('jadwal'));
      if (jadwalSheetName && workbook.Sheets[jadwalSheetName]) {
        const rows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[jadwalSheetName]);
        if (rows.length > 0) {
          const parsedJadwal: JadwalPelajaran[] = rows.map((r, idx) => ({
            id: String(r['ID'] || r['id'] || `J-${idx + 1}`),
            kelas: String(r['KELAS'] || r['kelas'] || '1 TSANAWIYAH'),
            hari: String(r['HARI'] || r['hari'] || 'Senin'),
            jamKe: Number(r['JAM KE'] || r['jamKe'] || 1),
            waktu: String(r['WAKTU'] || r['waktu'] || '07.30 - 08.45'),
            mapel: String(r['MAPEL'] || r['mapel'] || 'Fiqih'),
            nama: String(r['USTADZ'] || r['nama'] || 'Ustadz')
          }));
          importedResult.jadwalList = parsedJadwal;
          totalImported += parsedJadwal.length;
        }
      }

      // 4. Sheet Nilai Ujian
      const nilaiSheetName = workbook.SheetNames.find(n => n.toLowerCase().includes('nilai'));
      if (nilaiSheetName && workbook.Sheets[nilaiSheetName]) {
        const rows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[nilaiSheetName]);
        if (rows.length > 0) {
          const parsedNilai: NilaiUjianRecord[] = rows.map((r, idx) => ({
            idRow: idx + 1,
            idSantri: String(r['NIS'] || r['santriId'] || r['idSantri'] || ''),
            nama: String(r['NAMA SANTRI'] || r['santriNama'] || r['nama'] || ''),
            kelas: String(r['KELAS'] || r['kelas'] || '1 TSANAWIYAH'),
            pelajaran: String(r['MAPEL'] || r['pelajaran'] || r['mapel'] || 'Nahwu'),
            nilai: Number(r['NILAI'] || r['nilai'] || 80),
            semester: String(r['SEMESTER'] || r['semester'] || 'Semester Ganjil')
          }));
          importedResult.nilaiList = parsedNilai;
          totalImported += parsedNilai.length;
        }
      }

      if (totalImported > 0) {
        onDataImported(importedResult);
        setStatusMessage({
          type: 'success',
          text: `Berhasil mengimpor data dari "${file.name}"! Total ${totalImported} data berhasil dimasukkan ke sistem.`
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: `File "${file.name}" tidak memiliki baris data yang valid pada lembar kerja.`
        });
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: `Gagal membaca file spreadsheet: ${err.message}` });
    } finally {
      setIsProcessing(false);
    }
  };

  // Unduh Template Excel Lengkap
  const handleExportExcelDirect = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Santri
      const santriData = appData.santriList.map(s => ({
        'NIS': s.id,
        'NAMA SANTRI': s.nama,
        'KELAS': s.kelas,
        'KAMAR': s.kamar,
        'ALAMAT': s.alamat,
        'ORANG TUA / WALI': s.namaOrangTua || '-',
        'NO WA WALI': s.noWaWaliKelas || '',
        'SALDO UANG SAKU': s.saldoUangSaku || 0
      }));
      const wsSantri = XLSX.utils.json_to_sheet(santriData);
      XLSX.utils.book_append_sheet(wb, wsSantri, 'Santri');

      // Sheet 2: Guru
      const guruData = appData.guruList.map(g => ({
        'ID': g.id,
        'NAMA GURU / USTADZ': g.nama,
        'MAPEL': g.mapel,
        'KELAS': g.kelas
      }));
      const wsGuru = XLSX.utils.json_to_sheet(guruData);
      XLSX.utils.book_append_sheet(wb, wsGuru, 'Guru');

      // Sheet 3: Jadwal
      const jadwalData = appData.jadwalList.map(j => ({
        'ID': j.id,
        'KELAS': j.kelas,
        'HARI': j.hari,
        'JAM KE': j.jamKe,
        'WAKTU': j.waktu,
        'MAPEL': j.mapel,
        'USTADZ': j.nama
      }));
      const wsJadwal = XLSX.utils.json_to_sheet(jadwalData);
      XLSX.utils.book_append_sheet(wb, wsJadwal, 'Jadwal');

      XLSX.writeFile(wb, `Cadangan_Database_Pontren_${new Date().toISOString().split('T')[0]}.xlsx`);
      setStatusMessage({ type: 'success', text: 'File cadangan Excel (.xlsx) berhasil diunduh!' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Gagal mengekspor file: ${err.message}` });
    }
  };

  // ==========================================
  // METODE ALTERNATIF 2: IMPOR VIA LINK PUBLIK GOOGLE SHEETS
  // ==========================================
  const handleImportPublicSheet = async () => {
    let cleanId = inputSpreadsheetId.trim();
    if (cleanId.includes('/d/')) {
      const match = cleanId.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) cleanId = match[1];
    }

    if (!cleanId) {
      setStatusMessage({ type: 'error', text: 'Tempel URL atau ID Google Spreadsheet terlebih dahulu.' });
      return;
    }

    setIsProcessing(true);
    setStatusMessage({ type: 'info', text: 'Mengambil data dari Google Spreadsheet publik...' });

    try {
      const exportUrl = `https://docs.google.com/spreadsheets/d/${cleanId}/export?format=xlsx`;
      const res = await fetch(exportUrl);
      if (!res.ok) {
        throw new Error('Spreadsheet belum disetel publik. Pastikan opsi Berbagi (Share) di Google Sheets telah diubah ke: "Siapa saja yang memiliki link dapat melihat" (Anyone with link can view).');
      }
      const buffer = await res.arrayBuffer();
      const virtualFile = new File([buffer], 'public_sheet.xlsx');
      await processSpreadsheetFile(virtualFile);
    } catch (err: any) {
      setStatusMessage({ 
        type: 'error', 
        text: err.message || 'Gagal mengambil data dari Google Sheets. Pastikan link dapat diakses publik.' 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Request create new spreadsheet confirmation
  const requestCreateNewSpreadsheet = () => {
    setConfirmDialog({
      isOpen: true,
      action: 'createNew',
      title: 'Buat Spreadsheet Baru di Google Drive?',
      description: 'Sistem akan membuat file Google Spreadsheet baru di Google Drive akun Anda dengan judul "SIM Pontren Salaf - Master Database" dan mengonfigurasi seluruh lembar kerja (Santri, Guru, Absensi, Jadwal, Nilai, dll).'
    });
  };

  // Request Export Confirmation
  const requestExport = () => {
    if (!spreadsheetId) {
      setStatusMessage({ type: 'error', text: 'Pilih atau masukkan Spreadsheet ID terlebih dahulu.' });
      return;
    }
    setConfirmDialog({
      isOpen: true,
      action: 'export',
      title: 'Tulis / Ekspor Data ke Google Sheets?',
      description: `Tindakan ini akan MEMPERBARUI data pada Spreadsheet "${metadata?.title || spreadsheetId}". Seluruh tab (Santri, Guru, Absensi Santri, Absensi Guru, Jadwal, Nadzhom, Nilai Ujian, Syahriyah) akan disinkronkan dan ditimpa dengan data terbaru dari aplikasi.`
    });
  };

  // Request Import Confirmation
  const requestImport = () => {
    if (!spreadsheetId) {
      setStatusMessage({ type: 'error', text: 'Pilih atau masukkan Spreadsheet ID terlebih dahulu.' });
      return;
    }
    setConfirmDialog({
      isOpen: true,
      action: 'import',
      title: 'Tarik / Impor Data dari Google Sheets?',
      description: `Tindakan ini akan MEMBACA data dari Spreadsheet "${metadata?.title || spreadsheetId}" dan memperbarui data lokal aplikasi (Data Santri, Guru, Nilai, Nadzhom, Jadwal, dan Pengaturan).`
    });
  };

  // Execute the confirmed action
  const executeConfirmedAction = async () => {
    const action = confirmDialog.action;
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    setIsProcessing(true);
    setStatusMessage(null);

    try {
      if (action === 'createNew') {
        const newSheet = await sheetsService.createNewSpreadsheet('SIM Pontren Salaf - Database Master');
        setInputSpreadsheetId(newSheet.id);
        setSpreadsheetId(newSheet.id);
        sheetsService.setSpreadsheetId(newSheet.id);
        await loadMetadata();
        await loadDriveFiles();

        // Populate initial data to new sheet
        await sheetsService.exportFullDatabaseToSheets({
          santriList: appData.santriList,
          guruList: appData.guruList,
          jadwalList: appData.jadwalList,
          nadzhomList: appData.nadzhomList,
          nilaiList: appData.nilaiList,
          absensiSantriList: appData.absensiSantriList,
          absensiGuruList: appData.absensiGuruList,
          syahriyahList: appData.syahriyahList,
          settings: appData.settings
        });

        setStatusMessage({
          type: 'success',
          text: `Spreadsheet baru "${newSheet.title}" berhasil dibuat dan diisi data awal di Google Drive!`
        });
      } else if (action === 'export') {
        await sheetsService.exportFullDatabaseToSheets({
          santriList: appData.santriList,
          guruList: appData.guruList,
          jadwalList: appData.jadwalList,
          nadzhomList: appData.nadzhomList,
          nilaiList: appData.nilaiList,
          absensiSantriList: appData.absensiSantriList,
          absensiGuruList: appData.absensiGuruList,
          syahriyahList: appData.syahriyahList,
          settings: appData.settings
        });
        await loadMetadata();
        setStatusMessage({
          type: 'success',
          text: `Semua data (${appData.santriList.length} Santri, ${appData.guruList.length} Guru, Absensi, Nilai, Jadwal) berhasil disinkronkan ke Google Sheets!`
        });
      } else if (action === 'import') {
        const [
          remoteSantri,
          remoteGuru,
          remoteJadwal,
          remoteNadzhom,
          remoteNilai,
          remoteAbsensiSantri,
          remoteAbsensiGuru,
          remoteSyahriyah,
          remoteSettings
        ] = await Promise.all([
          sheetsService.loadSantriFromSheet(),
          sheetsService.loadGuruFromSheet(),
          sheetsService.loadJadwalFromSheet(),
          sheetsService.loadNadzhomFromSheet(),
          sheetsService.loadNilaiFromSheet(),
          sheetsService.loadAbsensiSantriFromSheet(),
          sheetsService.loadAbsensiGuruFromSheet(),
          sheetsService.loadSyahriyahFromSheet(),
          sheetsService.loadSettingsFromSheet()
        ]);

        onDataImported({
          santriList: remoteSantri.length ? remoteSantri : undefined,
          guruList: remoteGuru.length ? remoteGuru : undefined,
          jadwalList: remoteJadwal.length ? remoteJadwal : undefined,
          nadzhomList: remoteNadzhom.length ? remoteNadzhom : undefined,
          nilaiList: remoteNilai.length ? remoteNilai : undefined,
          absensiSantriList: remoteAbsensiSantri.length ? remoteAbsensiSantri : undefined,
          absensiGuruList: remoteAbsensiGuru.length ? remoteAbsensiGuru : undefined,
          syahriyahList: remoteSyahriyah.length ? remoteSyahriyah : undefined,
          settings: Object.keys(remoteSettings).length ? remoteSettings : undefined
        });

        setStatusMessage({
          type: 'success',
          text: `Berhasil menarik data dari Google Sheets! (${remoteSantri.length} Santri, ${remoteGuru.length} Guru termuat).`
        });
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: `Operasi gagal: ${err?.message || 'Periksa izin akses Google Sheets'}`
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-[#03170e] border border-[#d4af37]/40 rounded-2xl shadow-2xl shadow-emerald-950/90 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#d4af37]/20 bg-gradient-to-r from-[#02120a] via-[#052b1b] to-[#02120a]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#f3e5ab] flex items-center gap-2">
                Integrasi & Impor Data Spreadsheet
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
                  Multi-Format
                </span>
              </h2>
              <p className="text-xs text-[#d4af37]/80">
                Impor & ekspor data santri, guru, dan jadwal via Google Sheets, file Excel (.xlsx), atau file CSV
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs di Dalam Modal */}
        <div className="px-5 sm:px-6 pt-3 pb-0 bg-[#020e07] border-b border-[#d4af37]/20 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 min-w-max pb-3 text-xs font-bold">
            <button
              onClick={() => setActiveImportTab('oauth')}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
                activeImportTab === 'oauth'
                  ? 'btn-3d-gold text-black shadow'
                  : 'bg-[#03140c] text-emerald-200 hover:text-white border border-[#d4af37]/30'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Google Sheets Cloud (OAuth)</span>
            </button>

            <button
              onClick={() => setActiveImportTab('file')}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
                activeImportTab === 'file'
                  ? 'btn-3d-gold text-black shadow'
                  : 'bg-[#03140c] text-emerald-200 hover:text-white border border-[#d4af37]/30'
              }`}
            >
              <FileUp className="w-3.5 h-3.5 text-amber-300" />
              <span>Impor Berkas Excel / CSV (Tanpa Login)</span>
            </button>

            <button
              onClick={() => setActiveImportTab('public')}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
                activeImportTab === 'public'
                  ? 'btn-3d-gold text-black shadow'
                  : 'bg-[#03140c] text-emerald-200 hover:text-white border border-[#d4af37]/30'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-blue-300" />
              <span>Impor via Link Publik</span>
            </button>

            <button
              onClick={() => { setActiveImportTab('token'); setShowDomainHelp(true); }}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
                activeImportTab === 'token'
                  ? 'btn-3d-gold text-black shadow'
                  : 'bg-[#03140c] text-emerald-200 hover:text-white border border-[#d4af37]/30'
              }`}
            >
              <Key className="w-3.5 h-3.5 text-yellow-300" />
              <span>Bantuan Domain & Token</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Status Message Notification */}
          {statusMessage && (
            <div className={`p-3.5 rounded-xl border flex items-center gap-3 text-sm animate-fadeIn ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200' 
                : statusMessage.type === 'error'
                ? 'bg-red-950/70 border-red-500/50 text-red-200'
                : 'bg-blue-950/70 border-blue-500/50 text-blue-200'
            }`}>
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : statusMessage.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              ) : (
                <Sparkles className="w-5 h-5 text-blue-400 shrink-0" />
              )}
              <span className="flex-1 font-medium">{statusMessage.text}</span>
              <button 
                onClick={() => setStatusMessage(null)}
                className="text-stone-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>
          )}

          {/* KARTU PANDUAN PENYELESAIAN ERROR AUTH/UNAUTHORIZED-DOMAIN */}
          {(showDomainHelp || activeImportTab === 'token') && (
            <div className="rounded-2xl p-4 sm:p-5 border-2 border-amber-400/80 bg-gradient-to-r from-[#2c1704] via-[#1a0f02] to-[#2c1704] shadow-2xl space-y-3.5 animate-fadeIn">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400 text-black flex items-center justify-center font-black shrink-0 shadow-lg">
                    <ShieldAlert className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-[#fef08a] leading-tight">
                      Solusi: Firebase Error (auth/unauthorized-domain)
                    </h4>
                    <p className="text-xs text-amber-200/90 mt-0.5">
                      Firebase memblokir login Google jika domain web hosting belum didaftarkan di Authorized Domains Firebase Console.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDomainHelp(false)}
                  className="p-1.5 rounded-lg text-amber-300 hover:text-white hover:bg-black/40 transition"
                  title="Tutup panduan"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Box Domain Saat Ini dengan Tombol Salin */}
              <div className="bg-black/60 rounded-xl p-3 border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">
                    Domain Web App Anda yang Wajib Didaftarkan:
                  </span>
                  <span className="font-mono text-xs sm:text-sm font-black text-white select-all">
                    {currentDomain || 'ais-dev-...run.app'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyDomain}
                  className="px-3.5 py-2 rounded-xl btn-3d-yellow text-black text-xs font-black flex items-center gap-1.5 shadow shrink-0"
                >
                  {copiedDomain ? <Check className="w-3.5 h-3.5 text-black" /> : <Copy className="w-3.5 h-3.5 text-black" />}
                  <span>{copiedDomain ? '✓ Berhasil Disalin!' : 'Salin Domain Ini'}</span>
                </button>
              </div>

              {/* Langkah Cepat */}
              <div className="space-y-2 text-xs text-amber-100/90 bg-[#160b02] p-3.5 rounded-xl border border-amber-500/30">
                <p className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-300" />
                  <span>3 Langkah Cepat Mengaktifkan Domain (Hanya Sekali):</span>
                </p>
                <ol className="list-decimal list-inside space-y-1.5 pl-1">
                  <li>
                    Buka{' '}
                    <a
                      href={`https://console.firebase.google.com/project/${firebaseConfig.projectId || 'absensi-data-santri'}/authentication/settings`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-300 underline font-bold hover:text-blue-200 inline-flex items-center gap-1"
                    >
                      <span>Firebase Console - Authorized Domains</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                  <li>
                    Scroll ke bawah ke tabel <b>Authorized domains</b> (Domain yang diizinkan), lalu klik <b>Add domain</b> (Tambah domain).
                  </li>
                  <li>
                    Tempel (paste) domain yang sudah Anda salin di atas (<code className="bg-black/70 px-1.5 py-0.5 rounded text-amber-300 font-mono">{currentDomain}</code>), lalu klik <b>Save</b> (Simpan).
                  </li>
                  <li>
                    Kembali ke halaman ini dan klik tombol <b>"Sign in with Google"</b>. Login akan langsung berhasil!
                  </li>
                </ol>
              </div>

              {/* Opsi Token Manual Alternatif */}
              <div className="pt-2 border-t border-amber-500/20">
                <span className="text-[11px] font-bold text-amber-300 block mb-1.5">
                  Atau Masukkan Access Token Google Secara Manual:
                </span>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={manualTokenInput}
                    onChange={(e) => setManualTokenInput(e.target.value)}
                    placeholder="Tempel OAuth Access Token (ya29...)"
                    className="flex-1 px-3 py-2 rounded-lg bg-black/70 border border-amber-500/40 text-white text-xs font-mono focus:outline-none"
                  />
                  <button
                    onClick={handleApplyManualToken}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-lg shadow"
                  >
                    Terapkan
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: GOOGLE SHEETS CLOUD (OAUTH RESMI) */}
          {activeImportTab === 'oauth' && (
            <div className="space-y-5">
              {/* 1. Google Account Connection Card */}
              <div className="p-4 rounded-xl bg-[#02120a]/80 border border-[#d4af37]/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-3.5">
                  {currentUser?.photoURL ? (
                    <img 
                      src={currentUser.photoURL} 
                      alt="Avatar" 
                      className="w-12 h-12 rounded-full border-2 border-[#d4af37]/50" 
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-emerald-950 border border-emerald-600/40 flex items-center justify-center text-emerald-400">
                      <UserCheck className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">
                        {currentUser?.displayName || (isGoogleConnected ? 'Akun Google Terhubung' : 'Belum Terhubung')}
                      </span>
                      {isGoogleConnected ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          Aktif
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-stone-800 text-stone-400 border border-stone-700">
                          Offline
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-400">
                      {currentUser?.email || 'Sambungkan akun Google untuk sinkronisasi Google Sheets & Drive'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!isGoogleConnected && (
                    <button
                      type="button"
                      onClick={() => setShowDomainHelp(true)}
                      className="px-3 py-2 rounded-lg bg-amber-950/70 border border-amber-500/40 text-amber-300 text-xs font-bold hover:bg-amber-900 transition flex items-center gap-1.5"
                    >
                      <Info className="w-3.5 h-3.5" />
                      <span>Info Domain</span>
                    </button>
                  )}

                  {isGoogleConnected ? (
                    <button
                      onClick={handleDisconnectGoogle}
                      className="px-4 py-2 text-xs font-medium text-stone-300 hover:text-white bg-stone-900/80 hover:bg-stone-800 border border-stone-700 rounded-lg transition-colors"
                    >
                      Keluar dari Google
                    </button>
                  ) : (
                    <button
                      onClick={handleConnectGoogle}
                      disabled={isProcessing}
                      className="inline-flex items-center justify-center gap-3 px-5 py-2.5 bg-white text-gray-800 hover:bg-gray-50 text-sm font-semibold rounded-lg shadow-md transition-all border border-gray-200 cursor-pointer disabled:opacity-50"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>Sign in with Google</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 2. Active Spreadsheet Configuration */}
              <div className="p-5 rounded-xl bg-[#02120a]/80 border border-[#d4af37]/30 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#f3e5ab] flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#d4af37]" />
                    Spreadsheet Master Terhubung
                  </h3>
                  {metadata && (
                    <a
                      href={metadata.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-[#d4af37] hover:underline"
                    >
                      <span>Buka di Google Sheets</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                {/* Input Spreadsheet ID / URL */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={inputSpreadsheetId}
                      onChange={(e) => setInputSpreadsheetId(e.target.value)}
                      placeholder="Masukkan Spreadsheet ID atau tempel URL Google Sheets..."
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#010905] border border-[#d4af37]/30 text-white text-xs font-mono focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                  <button
                    onClick={() => cleanAndApplySpreadsheetId(inputSpreadsheetId)}
                    className="px-4 py-2.5 bg-gradient-to-r from-[#d4af37] to-[#b8972e] text-[#02120a] font-bold text-xs rounded-lg hover:brightness-110 transition-all flex items-center justify-center gap-1.5 shadow"
                  >
                    <Check className="w-4 h-4" />
                    <span>Terapkan ID</span>
                  </button>
                </div>

                {/* Metadata Preview */}
                {metadata ? (
                  <div className="p-3 bg-emerald-950/30 border border-emerald-500/20 rounded-lg text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-300 font-semibold">{metadata.title}</span>
                      <span className="text-[10px] text-emerald-400 font-mono">ID: {metadata.id.slice(0, 16)}...</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <span className="text-stone-400 text-[11px] mr-1">Lembar kerja aktif:</span>
                      {metadata.sheets.map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-emerald-900/40 text-emerald-300 border border-emerald-800/40 text-[10px] font-mono">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : spreadsheetId ? (
                  <div className="p-3 bg-stone-900/50 border border-stone-700/50 rounded-lg text-xs flex items-center justify-between text-stone-400">
                    <span>Spreadsheet ID aktif: <span className="font-mono text-stone-300">{spreadsheetId}</span></span>
                    {isGoogleConnected && (
                      <button 
                        onClick={loadMetadata} 
                        className="text-xs text-[#d4af37] hover:underline flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" /> Cek Status
                      </button>
                    )}
                  </div>
                ) : null}

                {/* Quick Actions: Create New & Pick From Drive */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={requestCreateNewSpreadsheet}
                    disabled={!isGoogleConnected || isProcessing}
                    className="px-3.5 py-2 bg-emerald-800/40 hover:bg-emerald-800/70 border border-emerald-500/40 text-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Buat Spreadsheet Baru di Google Drive Saya</span>
                  </button>

                  <button
                    onClick={loadDriveFiles}
                    disabled={!isGoogleConnected || isLoadingDrive}
                    className="px-3.5 py-2 bg-stone-800/80 hover:bg-stone-700/80 border border-stone-600 text-stone-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40"
                  >
                    <FolderOpen className="w-4 h-4 text-[#d4af37]" />
                    <span>{isLoadingDrive ? 'Memuat Drive...' : 'Pilih dari Google Drive Saya'}</span>
                  </button>
                </div>

                {/* Drive Files List (if loaded) */}
                {driveFiles.length > 0 && (
                  <div className="mt-3 p-3 bg-[#010905] border border-stone-800 rounded-lg max-h-48 overflow-y-auto space-y-1.5">
                    <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block mb-1">
                      Berkas Google Sheets di Akun Anda:
                    </span>
                    {driveFiles.map((file) => (
                      <div
                        key={file.id}
                        onClick={() => cleanAndApplySpreadsheetId(file.id)}
                        className={`p-2 rounded flex items-center justify-between text-xs cursor-pointer transition-colors ${
                          spreadsheetId === file.id 
                            ? 'bg-emerald-950/80 border border-emerald-500/50 text-white' 
                            : 'hover:bg-stone-900 text-stone-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="truncate font-medium">{file.name}</span>
                        </div>
                        <span className="text-[10px] text-stone-400 shrink-0 font-mono">
                          {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString('id-ID') : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Sync Actions (Export / Import) */}
              <div className="p-5 rounded-xl bg-gradient-to-br from-[#02120a] to-[#042416] border border-[#d4af37]/30 space-y-4">
                <h3 className="text-sm font-semibold text-[#f3e5ab] flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-emerald-400" />
                  Operasi Sinkronisasi Master
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Export Button */}
                  <div className="p-4 rounded-lg bg-black/40 border border-emerald-600/30 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs uppercase tracking-wide">
                        <ArrowUpFromLine className="w-4 h-4 text-emerald-400" />
                        Kirim ke Google Sheets (Export)
                      </div>
                      <p className="text-xs text-stone-400 mt-1">
                        Simpan dan timpa seluruh data aplikasi ({appData.santriList.length} Santri, {appData.guruList.length} Guru, Absensi, Nilai) ke spreadsheet yang terhubung.
                      </p>
                    </div>
                    <button
                      onClick={requestExport}
                      disabled={!isGoogleConnected || isProcessing}
                      className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-lg shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                    >
                      <ArrowUpFromLine className="w-4 h-4" />
                      <span>Kirim Data Lokal ke Google Sheets</span>
                    </button>
                  </div>

                  {/* Import Button */}
                  <div className="p-4 rounded-lg bg-black/40 border border-[#d4af37]/30 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center gap-2 text-[#d4af37] font-bold text-xs uppercase tracking-wide">
                        <ArrowDownToLine className="w-4 h-4 text-[#d4af37]" />
                        Tarik dari Google Sheets (Import)
                      </div>
                      <p className="text-xs text-stone-400 mt-1">
                        Perbarui data aplikasi dari spreadsheet Google Sheets master secara instan ke sistem.
                      </p>
                    </div>
                    <button
                      onClick={requestImport}
                      disabled={!isGoogleConnected || isProcessing}
                      className="w-full py-2.5 bg-gradient-to-r from-[#d4af37] to-[#b8972e] hover:brightness-110 text-[#02120a] font-bold text-xs rounded-lg shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                    >
                      <ArrowDownToLine className="w-4 h-4" />
                      <span>Tarik Data dari Google Sheets</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: IMPOR BERKAS EXCEL (.XLSX) ATAU CSV (BEBAS HAMBATAN DOMAIN) */}
          {activeImportTab === 'file' && (
            <div className="space-y-4">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-[#02180d] via-[#042817] to-[#02180d] border-2 border-dashed border-[#d4af37]/50 text-center space-y-4 shadow-xl">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center mx-auto shadow-inner">
                  <Upload className="w-7 h-7 text-emerald-300 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white text-gold-3d">
                    Impor Langsung dari File Excel (.xlsx / .csv)
                  </h3>
                  <p className="text-xs text-emerald-200/90 max-w-lg mx-auto mt-1">
                    Metode tercepat dan 100% bebas hambatan domain! Anda cukup mengunduh file spreadsheet dari Google Sheets (<b>File &gt; Download &gt; Microsoft Excel (.xlsx)</b>) lalu unggah di sini.
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="excel-file-upload-input"
                />

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <label
                    htmlFor="excel-file-upload-input"
                    className="btn-3d-gold px-5 py-2.5 rounded-xl text-black font-extrabold text-xs cursor-pointer shadow-lg flex items-center gap-2"
                  >
                    <FileUp className="w-4 h-4 text-black" />
                    <span>Pilih Berkas Excel (.xlsx / .csv)</span>
                  </label>

                  <button
                    onClick={handleExportExcelDirect}
                    className="px-4 py-2.5 rounded-xl bg-[#03140c] border border-[#d4af37]/50 text-xs font-bold text-[#f3e5ab] hover:bg-[#062c1b] transition shadow flex items-center gap-2"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Unduh Cadangan Excel Saat Ini</span>
                  </button>
                </div>

                <div className="text-[11px] text-stone-400 pt-2 border-t border-[#d4af37]/20 flex items-center justify-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Sistem otomatis membaca sheet: Santri, Guru, Jadwal, Nilai Ujian.</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: IMPOR VIA LINK PUBLIK GOOGLE SHEETS */}
          {activeImportTab === 'public' && (
            <div className="p-6 rounded-2xl bg-[#02140c] border border-[#d4af37]/35 space-y-4 shadow-xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/40 text-blue-300 flex items-center justify-center font-black shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white text-gold-3d">
                    Impor Data dari Link Google Sheets Publik
                  </h3>
                  <p className="text-xs text-stone-300">
                    Tidak memerlukan login akun Google. Pastikan setelan berbagi di Google Sheets adalah <b>"Anyone with the link can view"</b>.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-300 block">
                  URL Google Sheets atau Spreadsheet ID:
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={inputSpreadsheetId}
                    onChange={(e) => setInputSpreadsheetId(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/80 border border-[#d4af37]/40 text-white text-xs font-mono focus:outline-none focus:border-[#d4af37]"
                  />
                  <button
                    onClick={handleImportPublicSheet}
                    disabled={isProcessing}
                    className="btn-3d-yellow px-5 py-2.5 rounded-xl text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow"
                  >
                    <ArrowDownToLine className="w-4 h-4 text-black" />
                    <span>{isProcessing ? 'Mengimpor...' : 'Tarik Data Publik'}</span>
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs text-blue-200 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-blue-300" />
                  <span>Cara Mengatur Google Sheets agar Bisa Diimpor:</span>
                </p>
                <p>1. Buka spreadsheet Anda di Google Docs/Sheets.</p>
                <p>2. Klik tombol <b>Bagikan (Share)</b> di pojok kanan atas.</p>
                <p>3. Di bagian Akses Umum, pilih <b>"Siapa saja yang memiliki link"</b> sebagai Pelihat (Viewer).</p>
                <p>4. Salin link tersebut dan tempelkan di kotak di atas, lalu klik Tarik Data Publik.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-4 border-t border-[#d4af37]/20 bg-[#02120a] flex items-center justify-between flex-wrap gap-2">
          <div className="text-xs text-stone-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Koneksi aman terintegrasi dengan Google Workspace & Firebase</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold rounded-lg transition-colors ml-auto"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* MANDATORY USER CONFIRMATION DIALOG FOR DESTRUCTIVE/MUTATING OPERATIONS */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-[#041a10] border-2 border-[#d4af37] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-[#f3e5ab]">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{confirmDialog.title}</h3>
                <span className="text-xs text-stone-400">Konfirmasi Tindakan Google Sheets</span>
              </div>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed bg-[#010a05] p-3 rounded-lg border border-stone-800">
              {confirmDialog.description}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-xs font-semibold text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={executeConfirmedAction}
                className="px-5 py-2 text-xs font-bold text-[#02120a] bg-gradient-to-r from-[#d4af37] to-[#e6ca65] hover:brightness-110 rounded-lg shadow transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Ya, Lanjutkan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
