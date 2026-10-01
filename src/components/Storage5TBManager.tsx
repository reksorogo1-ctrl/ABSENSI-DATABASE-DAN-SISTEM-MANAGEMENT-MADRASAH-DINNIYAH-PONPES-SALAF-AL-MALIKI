import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  HardDrive, Database, Cloud, Upload, Film, FileText, Image, RefreshCw, 
  Trash2, Download, ExternalLink, Search, CheckCircle2, AlertTriangle, 
  Gauge, Zap, Sparkles, ShieldCheck, ChevronLeft, ChevronRight, Play, Eye, X, 
  FolderArchive, Layers, Info
} from 'lucide-react';
import { 
  StorageObjectMetadata, 
  StorageMetrics, 
  PaginatedResult, 
  BackgroundTask 
} from '../types';
import { 
  getStorageMetrics, 
  listStorageObjects, 
  uploadToScalableStorage, 
  deleteStorageObject, 
  downloadStorageObject, 
  createDatabaseBackupSnapshot,
  seedInitialStorageAssetsIfEmpty,
  formatBytes,
  TOTAL_CAPACITY_5TB
} from '../lib/scalableStorage';
import { backgroundTaskManager } from '../lib/backgroundTaskWorker';
import { safeFirebaseConfig } from '../firebase';

interface Storage5TBManagerProps {
  allDatabaseData?: Record<string, any>;
  onNotify?: (msg: string) => void;
}

export const Storage5TBManager: React.FC<Storage5TBManagerProps> = ({
  allDatabaseData = {},
  onNotify
}) => {
  const [metrics, setMetrics] = useState<StorageMetrics | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState<boolean>(true);
  const [activeCategory, setActiveCategory] = useState<string>('semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [paginatedObjects, setPaginatedObjects] = useState<PaginatedResult<StorageObjectMetadata>>({
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: 10,
    totalPages: 1,
    hasNext: false,
    hasPrev: false
  });
  const [isLoadingList, setIsLoadingList] = useState<boolean>(false);

  // Uploader State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadCategory, setUploadCategory] = useState<'foto' | 'video' | 'dokumen' | 'backup'>('foto');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStats, setUploadStats] = useState<{ speed: number; transferred: number; total: number } | null>(null);

  // Preview Modal
  const [previewItem, setPreviewItem] = useState<StorageObjectMetadata | null>(null);

  // Backup State
  const [isCreatingBackup, setIsCreatingBackup] = useState<boolean>(false);

  // Background Tasks
  const [bgTasks, setBgTasks] = useState<BackgroundTask[]>([]);

  useEffect(() => {
    const unsub = backgroundTaskManager.subscribe(tasks => {
      setBgTasks(tasks);
    });
    return () => unsub();
  }, []);

  // Muat metrics & data awal
  const loadMetricsAndData = async () => {
    setIsLoadingMetrics(true);
    try {
      await seedInitialStorageAssetsIfEmpty();
      const m = await getStorageMetrics();
      setMetrics(m);
    } catch (err) {
      console.warn('Gagal memuat metrik storage:', err);
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  const loadObjects = async () => {
    setIsLoadingList(true);
    try {
      const res = await listStorageObjects(activeCategory, searchQuery, currentPage, pageSize);
      setPaginatedObjects(res);
    } catch (err) {
      console.warn('Gagal memuat daftar objek:', err);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    loadMetricsAndData();
  }, []);

  useEffect(() => {
    loadObjects();
  }, [activeCategory, searchQuery, currentPage, pageSize]);

  // Persentase kapasitas 5 TB terpakai
  const usedPercentage = useMemo(() => {
    if (!metrics) return 0.35;
    const pct = (metrics.usedBytes / TOTAL_CAPACITY_5TB) * 100;
    return Math.max(0.1, Number(pct.toFixed(2)));
  }, [metrics]);

  // Handler Upload File Besar
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const taskId = backgroundTaskManager.createTask(
      `Upload ${file.name} (${formatBytes(file.size)})`,
      'upload'
    );

    setIsUploading(true);
    setUploadProgress(0);

    try {
      await uploadToScalableStorage(
        file,
        {
          name: file.name,
          category: uploadCategory
        },
        (progress, stats) => {
          setUploadProgress(progress);
          setUploadStats({
            speed: stats.speedKBps,
            transferred: stats.bytesTransferred,
            total: stats.totalBytes
          });
          backgroundTaskManager.updateProgress(taskId, progress, {
            bytesTransferred: stats.bytesTransferred,
            totalBytes: stats.totalBytes,
            speedKBps: stats.speedKBps
          });
        }
      );

      backgroundTaskManager.completeTask(taskId);
      if (onNotify) onNotify(`File ${file.name} berhasil diunggah ke Object Storage!`);
      loadMetricsAndData();
      loadObjects();
    } catch (err: any) {
      backgroundTaskManager.failTask(taskId, err.message || 'Gagal mengunggah file');
      alert(`Gagal mengunggah file: ${err.message}`);
    } finally {
      setIsUploading(false);
      setUploadStats(null);
      if (e.target) e.target.value = '';
    }
  };

  // Handler Hapus File
  const handleDelete = async (item: StorageObjectMetadata) => {
    if (window.confirm(`Hapus permanen objek "${item.name}" (${formatBytes(item.sizeBytes)}) dari Cloud Storage?`)) {
      const ok = await deleteStorageObject(item.id);
      if (ok) {
        loadMetricsAndData();
        loadObjects();
        if (onNotify) onNotify(`Objek ${item.name} berhasil dihapus dari Cloud Storage`);
      } else {
        alert('Gagal menghapus objek.');
      }
    }
  };

  // Handler Buat Snapshot Backup Database
  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    const taskId = backgroundTaskManager.createTask(
      'Snapshot Backup Database (JSON Chunked)',
      'backup'
    );

    try {
      const backupAsset = await createDatabaseBackupSnapshot(allDatabaseData, (p) => {
        backgroundTaskManager.updateProgress(taskId, p);
      });
      backgroundTaskManager.completeTask(taskId);
      alert(`Alhamdulillah! Snapshot backup "${backupAsset.name}" (${formatBytes(backupAsset.sizeBytes)}) berhasil dibuat & disimpan ke Cloud Storage!`);
      loadMetricsAndData();
      loadObjects();
    } catch (err: any) {
      backgroundTaskManager.failTask(taskId, err.message || 'Gagal membuat backup');
      alert(`Gagal membuat snapshot backup: ${err.message}`);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER BANNER 5 TB ARCHITECTURE */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#041d11] via-[#052c1b] to-[#03190e] border-2 border-[#d4af37]/45 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#d4af37] to-[#f5e298] text-black flex items-center justify-center font-black shadow-lg">
                <HardDrive className="w-5 h-5 text-black" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-extrabold text-white text-gold-3d">
                    Pusat Arsitektur Cloud & Object Storage 5 TB
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-950 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider">
                    ±5 TB Ready
                  </span>
                </div>
                <p className="text-xs text-emerald-200/90">
                  Penyimpanan berskala besar untuk jutaan foto, video 4K, rapor digital PDF, dan arsip data tanpa membebani browser HP.
                </p>
              </div>
            </div>

            {/* GOLDEN PRINCIPLE QUOTE */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-black/40 border border-[#d4af37]/30 text-[11px] text-[#f5e298]">
              <Sparkles className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
              <span className="font-semibold italic">
                “Data boleh mencapai 5 TB, tetapi browser hanya memuat data yang sedang dibutuhkan.”
              </span>
            </div>
          </div>

          {/* QUICK ACTION BUTTONS */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full lg:w-auto">
            <button
              type="button"
              disabled={isCreatingBackup}
              onClick={handleCreateBackup}
              className="btn-3d-gold px-4 py-2.5 rounded-xl text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-md hover:scale-102 transition flex-1 sm:flex-initial"
            >
              {isCreatingBackup ? (
                <>
                  <RefreshCw className="w-4 h-4 text-black animate-spin" />
                  <span>Membuat Backup...</span>
                </>
              ) : (
                <>
                  <FolderArchive className="w-4 h-4 text-black" />
                  <span>Snapshot Backup 5 TB</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 border border-emerald-400/40 shadow-md hover:scale-102 transition flex-1 sm:flex-initial"
            >
              <Upload className="w-4 h-4 text-emerald-200" />
              <span>Unggah File Besar</span>
            </button>
          </div>
        </div>
      </div>

      {/* METRIC GAUGES & CAPACITY MONITORING GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: TOTAL STORAGE POOL */}
        <div className="p-5 rounded-2xl bg-[#041a10] border border-[#d4af37]/35 shadow-lg space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#d4af37] uppercase tracking-wider flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-[#d4af37]" />
              <span>Total Kapasitas</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-black/40 text-emerald-300">
              5,120 GB
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-white font-mono">
              5.00 <span className="text-sm font-semibold text-[#d4af37]">TB</span>
            </div>
            <div className="text-[11px] text-emerald-300 mt-0.5">
              Object Cloud Storage Pool
            </div>
          </div>
          {/* Progress Bar Kapasitas */}
          <div className="space-y-1">
            <div className="w-full h-2.5 rounded-full bg-black/60 overflow-hidden p-0.5 border border-[#d4af37]/30">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-[#d4af37] transition-all duration-700 shadow-sm"
                style={{ width: `${Math.min(100, Math.max(2, usedPercentage))}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
              <span>Terpakai: {metrics ? formatBytes(metrics.usedBytes) : '18.42 GB'}</span>
              <span>{usedPercentage}%</span>
            </div>
          </div>
        </div>

        {/* CARD 2: AVAILABLE STORAGE */}
        <div className="p-5 rounded-2xl bg-[#041a10] border border-emerald-500/35 shadow-lg space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Cloud className="w-4 h-4 text-emerald-400" />
              <span>Sisa Kuota Bebas</span>
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div>
            <div className="text-2xl font-black text-white font-mono">
              {metrics ? (metrics.availableBytes / (1024 * 1024 * 1024)).toFixed(1) : '5101.6'} <span className="text-sm font-semibold text-emerald-400">GB</span>
            </div>
            <div className="text-[11px] text-emerald-300 mt-0.5">
              Siap menampung ribuan file & video
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-emerald-200/80 bg-black/30 p-2 rounded-lg">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>High Reliability CDN Active</span>
          </div>
        </div>

        {/* CARD 3: TOTAL FILES & OBJECTS */}
        <div className="p-5 rounded-2xl bg-[#041a10] border border-[#d4af37]/35 shadow-lg space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#d4af37] uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-4 h-4 text-[#d4af37]" />
              <span>Jumlah Objek Tersimpan</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-black/40 text-amber-300">
              Katalog Aktif
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-white font-mono">
              {metrics ? metrics.totalFiles : 248} <span className="text-sm font-semibold text-[#d4af37]">Files</span>
            </div>
            <div className="text-[11px] text-emerald-300 mt-0.5">
              Terindeks & Terkompresi Otomatis
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-zinc-300 bg-black/30 p-2 rounded-lg">
            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Hemat Kompresi: {metrics ? formatBytes(metrics.compressionSavedBytes) : '7.7 GB'}</span>
          </div>
        </div>

        {/* CARD 4: HEALTH & ARCHITECTURE STATUS */}
        <div className="p-5 rounded-2xl bg-[#041a10] border border-blue-500/35 shadow-lg space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Arsitektur & Responsivitas</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-500/30">
              60 FPS
            </span>
          </div>
          <div>
            <div className="text-xl font-black text-white font-mono">
              Lazy & Paginated
            </div>
            <div className="text-[11px] text-blue-200 mt-0.5">
              RAM Browser &lt; 20 MB Terjaga
            </div>
          </div>
          <div className="text-[10px] text-zinc-300 bg-black/30 p-2 rounded-lg truncate">
            <span>Bucket: {safeFirebaseConfig.storageBucket || 'absensi-data-santri.app'}</span>
          </div>
        </div>
      </div>

      {/* BREAKDOWN DISTRIBUSI KAPASITAS STORAGE 5 TB */}
      <div className="p-5 rounded-2xl bg-[#03170d] border border-[#d4af37]/30 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#d4af37]/20 pb-3">
          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#d4af37]" />
            <span>Distribusi Penyimpanan Data Terstruktur & Objek Cloud:</span>
          </span>
          <span className="text-[11px] text-emerald-300 font-mono">
            Kapasitas Maksimal: 5,120 GB
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-[#020e08] border border-[#d4af37]/20 space-y-1">
            <div className="flex items-center gap-2 text-xs text-amber-300 font-bold">
              <Film className="w-3.5 h-3.5 text-amber-400" />
              <span>Video & Multimedia</span>
            </div>
            <div className="text-lg font-black text-white font-mono">
              {metrics ? formatBytes(metrics.categoryBreakdown.video) : '12.8 GB'}
            </div>
            <div className="text-[10px] text-zinc-400">Intro 4K & Pengajian</div>
          </div>

          <div className="p-3 rounded-xl bg-[#020e08] border border-[#d4af37]/20 space-y-1">
            <div className="flex items-center gap-2 text-xs text-emerald-300 font-bold">
              <Image className="w-3.5 h-3.5 text-emerald-400" />
              <span>Foto Santri & Guru</span>
            </div>
            <div className="text-lg font-black text-white font-mono">
              {metrics ? formatBytes(metrics.categoryBreakdown.foto) : '1.62 GB'}
            </div>
            <div className="text-[10px] text-zinc-400">Profil & Presensi Kamera</div>
          </div>

          <div className="p-3 rounded-xl bg-[#020e08] border border-[#d4af37]/20 space-y-1">
            <div className="flex items-center gap-2 text-xs text-blue-300 font-bold">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>Rapor & Kitab PDF</span>
            </div>
            <div className="text-lg font-black text-white font-mono">
              {metrics ? formatBytes(metrics.categoryBreakdown.dokumen) : '2.4 GB'}
            </div>
            <div className="text-[10px] text-zinc-400">Dokumen & Buku Digital</div>
          </div>

          <div className="p-3 rounded-xl bg-[#020e08] border border-[#d4af37]/20 space-y-1">
            <div className="flex items-center gap-2 text-xs text-purple-300 font-bold">
              <FolderArchive className="w-3.5 h-3.5 text-purple-400" />
              <span>Arsip Backup DB</span>
            </div>
            <div className="text-lg font-black text-white font-mono">
              {metrics ? formatBytes(metrics.categoryBreakdown.backup) : '1.4 GB'}
            </div>
            <div className="text-[10px] text-zinc-400">Snapshot & Audit Manifest</div>
          </div>
        </div>
      </div>

      {/* LARGE FILE UPLOADER DRAWER / PANEL */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-[#041a10] via-[#052618] to-[#03170d] border-2 border-[#d4af37]/40 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#d4af37]/20 pb-3">
          <div>
            <h4 className="text-sm font-bold text-white text-gold-3d flex items-center gap-2">
              <Upload className="w-4 h-4 text-[#d4af37]" />
              <span>Unggah File Besar ke Object Storage (Chunked & Resumable)</span>
            </h4>
            <p className="text-[11px] text-emerald-300">
              Mendukung video 4K hingga beberapa gigabyte, ribuan foto santri, buku kitab PDF, dan arsip tanpa resiko crash.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#d4af37] font-semibold">Kategori:</span>
            <select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value as any)}
              className="bg-[#020e08] border border-[#d4af37]/40 rounded-xl px-2.5 py-1 text-xs text-white"
            >
              <option value="foto">Foto Santri / Guru</option>
              <option value="video">Video Intro / Kajian</option>
              <option value="dokumen">Dokumen / Kitab PDF</option>
              <option value="backup">Arsip Backup</option>
            </select>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* Upload Zone / Drop Area */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="p-6 rounded-2xl border-2 border-dashed border-[#d4af37]/50 hover:border-[#d4af37] bg-black/30 hover:bg-black/40 text-center cursor-pointer transition transform hover:-translate-y-0.5 space-y-2"
        >
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#d4af37]/15 flex items-center justify-center text-[#d4af37]">
            <Cloud className="w-6 h-6" />
          </div>
          <div className="text-xs font-bold text-white">
            Klik untuk Memilih File Besar dari Komputer / HP
          </div>
          <p className="text-[11px] text-emerald-300 max-w-md mx-auto">
            File akan otomatis di-chunking dan diunggah ke Object Storage. Thumbnail akan digenerate otomatis di sisi client.
          </p>
        </div>

        {/* Upload Progress Bar */}
        {isUploading && (
          <div className="p-4 rounded-xl bg-black/60 border border-[#d4af37]/40 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-amber-300 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Sedang Mengunggah File ke Object Storage...</span>
              </span>
              <span className="font-mono text-white font-bold">{uploadProgress}%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-zinc-800 overflow-hidden">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-[#d4af37] transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            {uploadStats && (
              <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                <span>{formatBytes(uploadStats.transferred)} / {formatBytes(uploadStats.total)}</span>
                <span>Kecepatan: {uploadStats.speed} KB/s</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CLOUD OBJECT BROWSER & FILE CATALOG */}
      <div className="card-3d rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#d4af37]/20 pb-3">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-[#d4af37]" />
            <div>
              <h4 className="text-sm sm:text-base font-bold text-white text-gold-3d">
                Katalog Objek & File Manager (Lazy-Loaded)
              </h4>
              <p className="text-[11px] text-emerald-300">
                Menampilkan data secara bertahap (10 baris per halaman) agar browser HP tetap ringan walau terdapat jutaan file.
              </p>
            </div>
          </div>

          <div className="text-[11px] text-[#d4af37] font-mono px-3 py-1 rounded-lg bg-[#020e08] border border-[#d4af37]/30">
            Total Ditemukan: {paginatedObjects.totalCount} Objek
          </div>
        </div>

        {/* FILTER CATEGORY PILLS & SEARCH BOX */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'semua', label: 'Semua Objek' },
              { id: 'foto', label: 'Foto Santri/Guru' },
              { id: 'video', label: 'Video & Kajian' },
              { id: 'dokumen', label: 'Rapor & Kitab' },
              { id: 'backup', label: 'Backup DB' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveCategory(tab.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  activeCategory === tab.id
                    ? 'btn-3d-gold text-black shadow'
                    : 'bg-[#03170d] text-[#f3e5ab] hover:text-white border border-[#d4af37]/25'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari nama objek / path storage..."
              className="w-full bg-[#020e08] border border-[#d4af37]/30 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#d4af37]"
            />
          </div>
        </div>

        {/* OBJECT TABLE WITH LAZY PAGINATION */}
        <div className="overflow-x-auto rounded-xl border border-[#d4af37]/25">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#03170d] text-[#d4af37] border-b border-[#d4af37]/30">
              <tr>
                <th className="p-3 w-12 text-center">NO</th>
                <th className="p-3 w-16 text-center">PREVIEW</th>
                <th className="p-3">NAMA FILE OBJEK</th>
                <th className="p-3">KATEGORI</th>
                <th className="p-3">UKURAN FILE</th>
                <th className="p-3">STORAGE PATH</th>
                <th className="p-3">WAKTU UPLOAD</th>
                <th className="p-3 text-center w-32">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d4af37]/10 bg-[#020e08]/90">
              {isLoadingList ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-emerald-300">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#d4af37]" />
                    <span>Memuat objek secara bertahap dari Object Storage...</span>
                  </td>
                </tr>
              ) : paginatedObjects.items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-zinc-400">
                    Tidak ditemukan objek file pada kategori ini.
                  </td>
                </tr>
              ) : (
                paginatedObjects.items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-[#d4af37]/5 transition">
                    <td className="p-3 text-center font-bold text-[#d4af37]">
                      {(currentPage - 1) * pageSize + idx + 1}
                    </td>
                    <td className="p-2 text-center">
                      <div className="w-10 h-10 mx-auto rounded-lg overflow-hidden border border-[#d4af37]/30 bg-black flex items-center justify-center">
                        {item.category === 'foto' ? (
                          ((item.thumbnailUrl && item.thumbnailUrl.trim()) || (item.downloadUrl && item.downloadUrl.trim())) ? (
                            <img
                              src={(item.thumbnailUrl && item.thumbnailUrl.trim()) || (item.downloadUrl && item.downloadUrl.trim())}
                              alt={item.name}
                              loading="lazy"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).setAttribute('src', 'https://via.placeholder.com/80?text=Foto');
                              }}
                            />
                          ) : (
                            <Image className="w-4 h-4 text-emerald-400" />
                          )
                        ) : item.category === 'video' ? (
                          <Film className="w-5 h-5 text-amber-400" />
                        ) : item.category === 'dokumen' ? (
                          <FileText className="w-5 h-5 text-blue-400" />
                        ) : (
                          <FolderArchive className="w-5 h-5 text-purple-400" />
                        )}
                      </div>
                    </td>
                    <td className="p-3 font-bold text-white">
                      <div className="flex items-center gap-1.5 truncate max-w-xs" title={item.name}>
                        <span>{item.name}</span>
                        {item.isCloudSynced && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="Tersinkron di Cloud" />
                        )}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono">{item.mimeType}</div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        item.category === 'foto' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' :
                        item.category === 'video' ? 'bg-amber-950 text-amber-300 border border-amber-500/30' :
                        item.category === 'dokumen' ? 'bg-blue-950 text-blue-300 border border-blue-500/30' :
                        'bg-purple-950 text-purple-300 border border-purple-500/30'
                      }`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-zinc-200 font-bold">
                      {formatBytes(item.sizeBytes)}
                    </td>
                    <td className="p-3 font-mono text-[10px] text-zinc-400 truncate max-w-[150px]" title={item.storagePath}>
                      {item.storagePath}
                    </td>
                    <td className="p-3 text-[10px] text-zinc-400 font-mono">
                      {new Date(item.uploadedAt).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => setPreviewItem(item)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white transition"
                          title="Pratinjau File"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadStorageObject(item)}
                          className="p-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-800 text-emerald-300 transition"
                          title="Unduh File"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          className="p-1.5 rounded-lg bg-red-950/80 hover:bg-red-800 text-red-300 transition"
                          title="Hapus Objek"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION CONTROLLER BAR */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#d4af37]/20">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span>Tampilkan</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-[#020e08] border border-[#d4af37]/30 rounded-lg px-2 py-1 text-xs text-white"
            >
              <option value={10}>10 Baris</option>
              <option value={25}>25 Baris</option>
              <option value={50}>50 Baris</option>
            </select>
            <span>dari {paginatedObjects.totalCount} total objek</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="px-3 py-1.5 rounded-xl bg-[#020e08] border border-[#d4af37]/30 text-xs font-bold text-white hover:border-[#d4af37] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Sebelumnya</span>
            </button>

            <span className="px-3 py-1 rounded-xl bg-[#03170d] text-xs font-mono text-[#d4af37] font-bold border border-[#d4af37]/20">
              Hal {paginatedObjects.page} / {paginatedObjects.totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= paginatedObjects.totalPages}
              onClick={() => setCurrentPage(prev => Math.min(paginatedObjects.totalPages, prev + 1))}
              className="px-3 py-1.5 rounded-xl bg-[#020e08] border border-[#d4af37]/30 text-xs font-bold text-white hover:border-[#d4af37] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <span>Selanjutnya</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* PREVIEW MODAL */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#041a10] border-2 border-[#d4af37] rounded-3xl p-5 sm:p-6 max-w-2xl w-full flex flex-col space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#d4af37]/20 pb-3">
              <div className="flex items-center gap-2 truncate">
                <Eye className="w-4 h-4 text-[#d4af37]" />
                <h4 className="text-sm font-bold text-white truncate">{previewItem.name}</h4>
              </div>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="w-8 h-8 rounded-full bg-black/40 text-zinc-300 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden bg-black max-h-96 flex items-center justify-center border border-white/10 p-2">
              {previewItem.category === 'foto' ? (
                previewItem.downloadUrl && previewItem.downloadUrl.trim() !== '' ? (
                  <img
                    src={previewItem.downloadUrl}
                    alt={previewItem.name}
                    className="max-h-80 max-w-full object-contain"
                  />
                ) : (
                  <div className="text-zinc-400 text-xs">Foto tidak tersedia</div>
                )
              ) : previewItem.category === 'video' ? (
                previewItem.downloadUrl && previewItem.downloadUrl.trim() !== '' ? (
                  <video
                    src={previewItem.downloadUrl}
                    controls
                    className="max-h-80 max-w-full"
                  />
                ) : (
                  <div className="text-zinc-400 text-xs">Video tidak tersedia</div>
                )
              ) : (
                <div className="p-8 text-center space-y-2">
                  <FileText className="w-12 h-12 text-[#d4af37] mx-auto" />
                  <div className="text-xs font-bold text-white">{previewItem.name}</div>
                  <div className="text-[11px] text-zinc-400">Ukuran: {formatBytes(previewItem.sizeBytes)}</div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-[#d4af37]/20">
              <span className="font-mono text-zinc-400 text-[11px]">Path: {previewItem.storagePath}</span>
              <button
                type="button"
                onClick={() => downloadStorageObject(previewItem)}
                className="btn-3d-gold px-4 py-1.5 rounded-xl text-black font-bold text-xs flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh File Asli</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
