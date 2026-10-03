import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, X, CheckCircle2, AlertTriangle, Info, 
  LogOut, LogIn, ExternalLink, RefreshCw, Plus, FolderOpen, 
  Upload, Download 
} from 'lucide-react';
import { GoogleSheetsService, DriveSpreadsheetFile } from '../sheetsService';
import { getCurrentGoogleUser, googleSignIn, logoutGoogle, getAccessToken, User } from '../googleAuth';
import { 
  Santri, GuruPengajar, JadwalPelajaran, NadzhomRecord, 
  NilaiUjianRecord, AbsensiSantriRecord, AbsensiGuruRecord, 
  SyahriyahRecord, AppSettings 
} from '../types';

export interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheetsService: GoogleSheetsService;
  spreadsheetId: string;
  setSpreadsheetId: (id: string) => void;
  isGoogleConnected: boolean;
  setIsGoogleConnected: (connected: boolean) => void;
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
  const [currentId, setCurrentId] = useState<string>(spreadsheetId || '');
  const [googleUser, setGoogleUser] = useState<User | null>(getCurrentGoogleUser());
  const [isLoadingDriveFiles, setIsLoadingDriveFiles] = useState<boolean>(false);
  const [driveFiles, setDriveFiles] = useState<DriveSpreadsheetFile[]>([]);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    setCurrentId(spreadsheetId);
  }, [spreadsheetId]);

  useEffect(() => {
    setGoogleUser(getCurrentGoogleUser());
  }, [isGoogleConnected]);

  if (!isOpen) return null;

  const handleInputChange = (val: string) => {
    const clean = val.trim();
    const match = clean.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    const resolved = (match && match[1]) ? match[1] : clean;
    setCurrentId(resolved);
    setSpreadsheetId(resolved);
    sheetsService.setSpreadsheetId(resolved);
    localStorage.setItem('sim_spreadsheet_id', resolved);
  };

  const handleConnectGoogle = async () => {
    setStatusMsg(null);
    try {
      const res = await googleSignIn();
      if (res?.user) {
        setIsGoogleConnected(true);
        setGoogleUser(res.user);
        setStatusMsg({
          type: 'success',
          text: `Akun terhubung: ${res.user.displayName || res.user.email}`
        });
      }
    } catch (e: any) {
      setStatusMsg({
        type: 'error',
        text: e?.message || 'Gagal menghubungkan akun Google'
      });
    }
  };

  const handleDisconnectGoogle = async () => {
    await logoutGoogle();
    setIsGoogleConnected(false);
    setGoogleUser(null);
    setStatusMsg({
      type: 'info',
      text: 'Koneksi akun Google telah diputus.'
    });
  };

  const handleLoadFromDrive = async () => {
    setIsLoadingDriveFiles(true);
    setStatusMsg(null);
    try {
      const token = await getAccessToken();
      if (!token) {
        await handleConnectGoogle();
      }
      const files = await sheetsService.listSpreadsheetsFromDrive();
      setDriveFiles(files);
      if (files.length === 0) {
        setStatusMsg({
          type: 'info',
          text: 'Tidak ada spreadsheet ditemukan di Google Drive akun ini.'
        });
      }
    } catch (e: any) {
      setStatusMsg({
        type: 'error',
        text: e?.message || 'Gagal memuat berkas dari Google Drive.'
      });
    } finally {
      setIsLoadingDriveFiles(false);
    }
  };

  const handleCreateNewSpreadsheet = async () => {
    setIsCreatingNew(true);
    setStatusMsg(null);
    try {
      const token = await getAccessToken();
      if (!token) {
        await handleConnectGoogle();
      }
      const title = `SIM Salaf Al-Maliki - Database (${new Date().toLocaleDateString('id-ID')})`;
      const created = await sheetsService.createNewSpreadsheet(title);
      setCurrentId(created.id);
      setSpreadsheetId(created.id);
      sheetsService.setSpreadsheetId(created.id);
      localStorage.setItem('sim_spreadsheet_id', created.id);
      setStatusMsg({
        type: 'success',
        text: `Spreadsheet baru berhasil dibuat: "${created.title}"!`
      });
    } catch (e: any) {
      setStatusMsg({
        type: 'error',
        text: e?.message || 'Gagal membuat Google Spreadsheet baru.'
      });
    } finally {
      setIsCreatingNew(false);
    }
  };

  const handleExportAll = async () => {
    if (!currentId) {
      setStatusMsg({
        type: 'error',
        text: 'Silakan isi Spreadsheet ID terlebih dahulu.'
      });
      return;
    }
    setIsExporting(true);
    setStatusMsg(null);
    try {
      sheetsService.setSpreadsheetId(currentId);
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
      setStatusMsg({
        type: 'success',
        text: `Berhasil mengekspor ${appData.santriList.length} santri, ${appData.guruList.length} guru, dan seluruh data ke Google Sheets!`
      });
    } catch (e: any) {
      setStatusMsg({
        type: 'error',
        text: e?.message || 'Gagal mengekspor data ke Google Sheets.'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportAll = async () => {
    if (!currentId) {
      setStatusMsg({
        type: 'error',
        text: 'Silakan isi Spreadsheet ID terlebih dahulu.'
      });
      return;
    }
    setIsImporting(true);
    setStatusMsg(null);
    try {
      sheetsService.setSpreadsheetId(currentId);
      const [santri, guru, jadwal, nadzhom, nilai, setts] = await Promise.all([
        sheetsService.loadSantriFromSheet().catch(() => []),
        sheetsService.loadGuruFromSheet().catch(() => []),
        sheetsService.loadJadwalFromSheet().catch(() => []),
        sheetsService.loadNadzhomFromSheet().catch(() => []),
        sheetsService.loadNilaiFromSheet().catch(() => []),
        sheetsService.loadSettingsFromSheet().catch(() => ({} as Partial<AppSettings>))
      ]);

      onDataImported({
        santriList: santri.length > 0 ? santri : undefined,
        guruList: guru.length > 0 ? guru : undefined,
        jadwalList: jadwal.length > 0 ? jadwal : undefined,
        nadzhomList: nadzhom.length > 0 ? nadzhom : undefined,
        nilaiList: nilai.length > 0 ? nilai : undefined,
        settings: Object.keys(setts).length > 0 ? setts : undefined
      });

      setStatusMsg({
        type: 'success',
        text: `Sinkronisasi berhasil! Berhasil menarik: ${santri.length} santri, ${guru.length} guru, ${jadwal.length} jadwal.`
      });
    } catch (e: any) {
      setStatusMsg({
        type: 'error',
        text: e?.message || 'Gagal mengimpor data dari Google Sheets.'
      });
    } finally {
      setIsImporting(false);
    }
  };

  const spreadsheetUrl = currentId ? `https://docs.google.com/spreadsheets/d/${currentId}/edit` : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#031d12] border-2 border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden text-emerald-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-500/30 bg-[#02150d]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-inner">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Sinkronisasi Google Sheets
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Cloud Live
                </span>
              </h2>
              <p className="text-xs text-emerald-400/80">
                Pondok Pesantren Salaf Al-Maliki • Integrasi Database Real-Time
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            data-testid="sheets-modal-close-btn"
            className="p-2 rounded-lg hover:bg-emerald-500/20 text-emerald-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Status Message */}
          {statusMsg && (
            <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${
              statusMsg.type === 'success' 
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200' 
                : statusMsg.type === 'error' 
                ? 'bg-red-950/60 border-red-500/50 text-red-200' 
                : 'bg-blue-950/60 border-blue-500/50 text-blue-200'
            }`}>
              {statusMsg.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
              {statusMsg.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
              {statusMsg.type === 'info' && <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />}
              <div className="text-xs leading-relaxed">{statusMsg.text}</div>
            </div>
          )}

          {/* Account Status Card */}
          <div className="p-4 rounded-xl bg-[#06281a] border border-emerald-500/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isGoogleConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <div>
                <div className="font-semibold text-white text-xs">
                  {isGoogleConnected ? 'Google Workspace Terhubung' : 'Belum Terhubung Akun Google'}
                </div>
                <div className="text-[11px] text-emerald-400/80">
                  {googleUser?.email || (isGoogleConnected ? 'admin.salaf@almaliki.ac.id' : 'Masuk untuk sinkronisasi otomatis ke Google Drive')}
                </div>
              </div>
            </div>
            {isGoogleConnected ? (
              <button
                onClick={handleDisconnectGoogle}
                className="px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-500/40 hover:bg-red-900/50 text-red-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Putuskan
              </button>
            ) : (
              <button
                onClick={handleConnectGoogle}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 shadow transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                Hubungkan Akun
              </button>
            )}
          </div>

          {/* Spreadsheet ID Input & Link */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-emerald-300">
              Spreadsheet ID atau Link Google Sheets:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                data-testid="spreadsheet-id-input"
                value={currentId}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Contoh: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                className="flex-1 bg-black/40 border border-emerald-500/40 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-emerald-600 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 font-mono"
              />
              {spreadsheetUrl && (
                <a
                  href={spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500/30 text-emerald-300 flex items-center gap-1.5 text-xs font-medium transition-colors"
                  title="Buka Spreadsheet di Tab Baru"
                >
                  <ExternalLink className="w-4 h-4" />
                  Buka
                </a>
              )}
            </div>
            <p className="text-[11px] text-emerald-500/80">
              Tips: Anda bisa langsung menempelkan URL lengkap Spreadsheet dari bilah peramban.
            </p>
          </div>

          {/* Quick Actions (Create New & Select from Drive) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              onClick={handleCreateNewSpreadsheet}
              disabled={isCreatingNew}
              className="p-3 rounded-xl bg-[#06281a] border border-emerald-500/30 hover:border-emerald-400/60 hover:bg-emerald-950/40 flex items-center gap-3 transition-colors text-left disabled:opacity-50"
            >
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                {isCreatingNew ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              </div>
              <div>
                <div className="font-semibold text-xs text-white">Buat Spreadsheet Baru</div>
                <div className="text-[10px] text-emerald-400/70">Format 10 sheet otomatis dibuat</div>
              </div>
            </button>

            <button
              onClick={handleLoadFromDrive}
              disabled={isLoadingDriveFiles}
              className="p-3 rounded-xl bg-[#06281a] border border-emerald-500/30 hover:border-emerald-400/60 hover:bg-emerald-950/40 flex items-center gap-3 transition-colors text-left disabled:opacity-50"
            >
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                {isLoadingDriveFiles ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FolderOpen className="w-4 h-4" />}
              </div>
              <div>
                <div className="font-semibold text-xs text-white">Pilih dari Google Drive</div>
                <div className="text-[10px] text-emerald-400/70">Telusuri spreadsheet akun Anda</div>
              </div>
            </button>
          </div>

          {/* Drive Files List */}
          {driveFiles.length > 0 && (
            <div className="p-3 rounded-xl bg-black/40 border border-emerald-500/30 space-y-2 max-h-40 overflow-y-auto">
              <div className="text-[11px] font-semibold text-emerald-300">
                Pilih Berkas Spreadsheet:
              </div>
              <div className="space-y-1">
                {driveFiles.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => {
                      setCurrentId(file.id);
                      setSpreadsheetId(file.id);
                      sheetsService.setSpreadsheetId(file.id);
                      localStorage.setItem('sim_spreadsheet_id', file.id);
                      setStatusMsg({
                        type: 'success',
                        text: `Memilih spreadsheet: "${file.name}"`
                      });
                    }}
                    className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      currentId === file.id
                        ? 'bg-emerald-600/30 border border-emerald-500/50 text-white'
                        : 'hover:bg-emerald-950/40 text-emerald-300'
                    }`}
                  >
                    <span className="truncate">{file.name}</span>
                    <span className="text-[10px] opacity-60 shrink-0 font-mono">
                      {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString('id-ID') : ''}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Two-Way Sync Operations */}
          <div className="p-4 rounded-xl bg-[#06281a] border border-emerald-500/30 space-y-3">
            <div className="text-xs font-semibold text-emerald-300">
              Operasi Sinkronisasi Dua Arah:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleExportAll}
                disabled={isExporting || !currentId}
                data-testid="export-sheets-btn"
                className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Mengekspor Data...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Ekspor ke Google Sheets</span>
                  </>
                )}
              </button>

              <button
                onClick={handleImportAll}
                disabled={isImporting || !currentId}
                data-testid="import-sheets-btn"
                className="px-4 py-3 rounded-xl bg-[#0d3824] hover:bg-[#124c31] border border-emerald-400/40 text-emerald-200 font-medium text-xs flex items-center justify-center gap-2 shadow transition-all disabled:opacity-50"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Mengimpor Data...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Tarik / Impor dari Sheets</span>
                  </>
                )}
              </button>
            </div>
            <div className="text-[11px] text-emerald-400/70 text-center">
              Mencakup tabel Santri, Guru, Jadwal, Nadzhom, Nilai Ujian, Absensi, dan Pengaturan.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-emerald-500/30 bg-[#02150d] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 text-xs font-semibold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoogleSheetsModal;
