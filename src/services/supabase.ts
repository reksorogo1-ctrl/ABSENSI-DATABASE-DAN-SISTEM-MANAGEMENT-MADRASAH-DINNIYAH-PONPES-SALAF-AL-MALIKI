import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

// ============================================================================
// DAFTAR KUNCI KOLEKSI MASTER SUPABASE (DIDEKLARASIKAN PALING ATAS UNTUK MENCEGAH TDZ)
// ============================================================================
export const SUPABASE_COLLECTION_KEYS: string[] = [
  'santri',
  'guru',
  'pengurus',
  'jadwal',
  'kurikulum',
  'silabus',
  'kalender',
  'absensi_santri',
  'absensi_guru',
  'rekap_santri_history',
  'rekap_guru_history',
  'nilai',
  'nadzhom',
  'ujian_kitab',
  'ujian_config',
  'ujian_muhafadzoh_records',
  'ujian_baca_kitab_records',
  'ujian_koreksian_records',
  'ujian_takziran_records',
  'ujian_takziran_counter',
  'syahriyah',
  'uang_saku',
  'pelanggaran_santri',
  'pelanggaran_template',
  'pelanggaran_counter',
  'pelanggaran_audit',
  'peringatan_guru_records',
  'peringatan_guru_template',
  'peringatan_guru_counter',
  'peringatan_guru_audit',
  'izin_mengajar',
  'sync_meta',
];

// ============================================================================
// KONFIGURASI SUPABASE PERMANEN (FALLBACK AMAN TANPA ERROR ENV SAAT DEPLOY)
// Ganti placeholder di bawah dengan Project URL & Anon Key Supabase Anda,
// atau setel melalui environment variable VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY.
// ============================================================================
export const FALLBACK_SUPABASE_URL = '[TEMPEL_PROJECT_URL_SUPABASE]';
export const FALLBACK_SUPABASE_ANON_KEY = '[TEMPEL_ANON_KEY_SUPABASE]';

function normalizeSupabaseUrl(raw: string): string {
  const trimmed = (raw || '').trim();
  if (!trimmed || trimmed.includes('[TEMPEL_')) return trimmed;
  return trimmed.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
}

const envUrl =
  typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL
    ? String((import.meta as any).env.VITE_SUPABASE_URL).trim()
    : '';

const envAnonKey =
  typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY
    ? String((import.meta as any).env.VITE_SUPABASE_ANON_KEY).trim()
    : '';

export const supabaseUrl: string = normalizeSupabaseUrl(envUrl || FALLBACK_SUPABASE_URL);
export const supabaseAnonKey: string = envAnonKey || FALLBACK_SUPABASE_ANON_KEY;

export function isSupabaseConfigured(): boolean {
  const url = (supabaseUrl || '').trim();
  const key = (supabaseAnonKey || '').trim();
  return (
    /^https?:\/\/.+/.test(url) &&
    !url.includes('[TEMPEL_') &&
    key.length > 20 &&
    !key.includes('[TEMPEL_')
  );
}

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl.trim(), supabaseAnonKey.trim(), {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

// ============================================================================
// PEMETAAN TABEL SUPABASE MADRASAH DINIYAH (9 TABEL DOMAIN TERSTRUKTUR)
// ============================================================================
export type MadinSupabaseTable =
  | 'madin_santri'
  | 'madin_ustadzah'
  | 'madin_jadwal'
  | 'madin_absensi'
  | 'madin_akademik'
  | 'madin_keuangan'
  | 'madin_kedisiplinan'
  | 'madin_pesan'
  | 'madin_pengaturan';

export const ALL_MADIN_TABLES: MadinSupabaseTable[] = [
  'madin_santri',
  'madin_ustadzah',
  'madin_jadwal',
  'madin_absensi',
  'madin_akademik',
  'madin_keuangan',
  'madin_kedisiplinan',
  'madin_pesan',
  'madin_pengaturan',
];

const LEGACY_KEY_ALIASES: Record<string, string> = {
  absensiSantri: 'absensi_santri',
  absensiGuru: 'absensi_guru',
  uangSaku: 'uang_saku',
  izinMengajar: 'izin_mengajar',
  settings: 'main_config',
};

export function normalizeCollectionKey(rawKey: string): string {
  const trimmed = (rawKey || '').trim();
  return LEGACY_KEY_ALIASES[trimmed] || trimmed;
}

export function resolveSupabaseTable(collectionKey: string): MadinSupabaseTable {
  const key = normalizeCollectionKey(collectionKey);
  switch (key) {
    case 'santri':
      return 'madin_santri';

    case 'guru':
    case 'pengurus':
      return 'madin_ustadzah';

    case 'jadwal':
    case 'kurikulum':
    case 'silabus':
    case 'kalender':
      return 'madin_jadwal';

    case 'absensi_santri':
    case 'absensi_guru':
    case 'rekap_santri_history':
    case 'rekap_guru_history':
      return 'madin_absensi';

    case 'nilai':
    case 'nadzhom':
    case 'ujian_kitab':
    case 'ujian_config':
    case 'ujian_muhafadzoh_records':
    case 'ujian_baca_kitab_records':
    case 'ujian_koreksian_records':
    case 'ujian_takziran_records':
    case 'ujian_takziran_counter':
      return 'madin_akademik';

    case 'syahriyah':
    case 'uang_saku':
      return 'madin_keuangan';

    case 'pelanggaran_santri':
    case 'pelanggaran_template':
    case 'pelanggaran_counter':
    case 'pelanggaran_audit':
    case 'peringatan_guru_records':
    case 'peringatan_guru_template':
    case 'peringatan_guru_counter':
    case 'peringatan_guru_audit':
      return 'madin_kedisiplinan';

    case 'izin_mengajar':
    case 'pengumuman':
    case 'pesan':
      return 'madin_pesan';

    case 'main_config':
    case 'sync_meta':
    default:
      return 'madin_pengaturan';
  }
}

const COLLECTION_LABEL_MAP: Record<string, string> = {
  main_config: 'Pengaturan Utama Madrasah',
  santri: 'Data Santri & Akun Walisantri',
  guru: 'Data Ustadz / Ustadzah',
  pengurus: 'Akun & Data Pengurus',
  jadwal: 'Jadwal Pelajaran',
  kurikulum: 'Kurikulum Kitab',
  silabus: 'Silabus Memaknai Kitab',
  kalender: 'Kalender Akademik',
  absensi_santri: 'Absensi Santri Aktif',
  absensi_guru: 'Absensi Ustadz / Guru Aktif',
  rekap_santri_history: 'Arsip Rekap Absensi Santri',
  rekap_guru_history: 'Arsip Rekap Absensi Guru',
  nilai: 'Nilai Ujian / Raport',
  nadzhom: 'Setoran Nadzhom',
  ujian_kitab: 'Rekap Ujian Kitab',
  ujian_config: 'Pengaturan Ujian & Nadzhom',
  ujian_muhafadzoh_records: 'Data Ujian Muhafadzoh',
  ujian_baca_kitab_records: 'Data Ujian Baca Kitab',
  ujian_koreksian_records: 'Data Ujian Koreksian Kitab',
  ujian_takziran_records: 'Data Takziran Ujian',
  ujian_takziran_counter: 'Counter Nomor Takziran Ujian',
  syahriyah: 'Pembayaran Syahriyah',
  uang_saku: 'Catatan Uang Saku',
  pelanggaran_santri: 'Data Pelanggaran & Takziran Santri',
  pelanggaran_template: 'Template Surat Takziran Santri',
  pelanggaran_counter: 'Counter Nomor Surat Takziran',
  pelanggaran_audit: 'Log Audit Pelanggaran Santri',
  peringatan_guru_records: 'Data Surat Peringatan Guru',
  peringatan_guru_template: 'Template Surat Peringatan Guru',
  peringatan_guru_counter: 'Counter Nomor SP Guru',
  peringatan_guru_audit: 'Log Audit Peringatan Guru',
  izin_mengajar: 'Pesan & Pengajuan Izin Mengajar',
  sync_meta: 'Metadata Sinkronisasi',
};

const LOCAL_STORAGE_KEY_MAP: Record<string, string> = {
  main_config: 'sim_settings',
  santri: 'sim_santri',
  guru: 'sim_guru',
  pengurus: 'sim_pengurus',
  jadwal: 'sim_jadwal',
  kurikulum: 'sim_kurikulum',
  silabus: 'sim_silabus',
  kalender: 'sim_kalender',
  absensi_santri: 'sim_absensi_santri',
  absensi_guru: 'sim_absensi_guru',
  rekap_santri_history: 'sim_rekap_santri_harian_history',
  rekap_guru_history: 'sim_rekap_guru_harian_history',
  nilai: 'sim_nilai',
  nadzhom: 'sim_nadzhom',
  ujian_kitab: 'sim_ujian_kitab',
  syahriyah: 'sim_syahriyah',
  uang_saku: 'sim_uang_saku',
  izin_mengajar: 'sim_izin_mengajar',
};

function countPayloadItems(data: any): number {
  if (data === null || data === undefined) return 0;
  if (Array.isArray(data)) return data.length;
  if (typeof data === 'object') return Object.keys(data).length > 0 ? 1 : 0;
  return 1;
}

/**
 * Konversi rekursif payload agar 100% valid untuk kolom JSONB PostgreSQL/Supabase:
 * - Menangani Firestore Timestamp (.toDate() / { seconds, nanoseconds })
 * - Menangani Date, Set, Map, BigInt, NaN, Infinity, undefined, & circular reference
 */
function sanitizePayloadForJsonb(value: any, seen = new WeakSet<object>()): any {
  if (value === null || value === undefined) return null;
  const t = typeof value;
  if (t === 'string' || t === 'boolean') return value;
  if (t === 'number') return Number.isFinite(value) ? value : null;
  if (t === 'bigint') return value.toString();
  if (t === 'function' || t === 'symbol') return undefined;

  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value.toISOString();
  }

  // Firestore Timestamp atau objek serupa dengan toDate()
  if (typeof value?.toDate === 'function') {
    try {
      const d = value.toDate();
      return d instanceof Date && !isNaN(d.getTime()) ? d.toISOString() : null;
    } catch {
      return null;
    }
  }
  if (
    t === 'object' &&
    typeof value.seconds === 'number' &&
    typeof value.nanoseconds === 'number' &&
    Object.keys(value).length <= 3
  ) {
    return new Date(value.seconds * 1000).toISOString();
  }

  if (seen.has(value)) return null;
  seen.add(value);

  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizePayloadForJsonb(item, seen))
      .filter((item) => item !== undefined && item !== null);
  }

  if (value instanceof Set) {
    return Array.from(value)
      .map((item) => sanitizePayloadForJsonb(item, seen))
      .filter((item) => item !== undefined);
  }

  if (value instanceof Map) {
    const obj: Record<string, any> = {};
    value.forEach((v, k) => {
      const cleaned = sanitizePayloadForJsonb(v, seen);
      if (cleaned !== undefined) obj[String(k)] = cleaned;
    });
    return obj;
  }

  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(value)) {
    const cleaned = sanitizePayloadForJsonb(v, seen);
    if (cleaned !== undefined) {
      out[String(k)] = cleaned;
    }
  }
  return out;
}

/**
 * Membangun objek baris yang 100% cocok dengan skema 5 kolom SQL Supabase:
 * (id TEXT PRIMARY KEY, collection_key TEXT, payload JSONB, total_records INTEGER, updated_at TIMESTAMPTZ)
 * Tidak pernah mengirim field asing di luar skema tabel SQL.
 */
function buildSupabaseRecordRow(collectionKey: string, rawPayload: any) {
  const safeId = String(normalizeCollectionKey(collectionKey) || '').trim();
  const sanitized = sanitizePayloadForJsonb(rawPayload);
  const safePayload =
    sanitized === null || sanitized === undefined
      ? safeId === 'main_config'
        ? {}
        : []
      : sanitized;

  return {
    id: safeId,
    collection_key: safeId,
    payload: safePayload,
    total_records: Math.max(0, Math.floor(Number(countPayloadItems(safePayload)) || 0)),
    updated_at: new Date().toISOString(),
  };
}

function extractSupabaseErrorInfo(err: any): {
  errorCode: string;
  errorMessage: string;
  errorDetails: string;
  errorHint: string;
} {
  if (!err) {
    return {
      errorCode: 'UNKNOWN',
      errorMessage: 'Error tidak diketahui dari Supabase.',
      errorDetails: '',
      errorHint: '',
    };
  }
  const errorCode = err.code ? String(err.code) : err.status ? `HTTP_${err.status}` : '';
  const errorMessage = err.message
    ? String(err.message)
    : typeof err === 'string'
    ? err
    : JSON.stringify(err);
  const errorDetails = err.details ? String(err.details) : '';
  const errorHint = err.hint ? String(err.hint) : '';
  return { errorCode, errorMessage, errorDetails, errorHint };
}

// ============================================================================
// CRUD OPERASI UTAMA SUPABASE (UPSERT & SELECT)
// ============================================================================
export async function saveMasterDataToSupabase(collectionKey: string, data: any): Promise<boolean> {
  if (!supabase) return false;
  const key = normalizeCollectionKey(collectionKey);
  const table = resolveSupabaseTable(key);
  try {
    const row = buildSupabaseRecordRow(key, data);
    const { error } = await supabase.from(table).upsert(row, { onConflict: 'id' });
    if (error) {
      const info = extractSupabaseErrorInfo(error);
      console.warn(
        `[Supabase] Gagal simpan ${key} ke ${table}:`,
        info.errorCode,
        info.errorMessage,
        info.errorDetails,
        info.errorHint
      );
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`[Supabase] Exception saat simpan ${key}:`, err);
    return false;
  }
}

export async function loadMasterDataFromSupabase<T = any>(collectionKey: string): Promise<T | null> {
  if (!supabase) return null;
  const key = normalizeCollectionKey(collectionKey);
  const table = resolveSupabaseTable(key);
  try {
    const { data, error } = await supabase
      .from(table)
      .select('payload')
      .eq('id', key)
      .maybeSingle();

    if (error) {
      console.warn(`[Supabase] Gagal memuat ${key} dari ${table}:`, error.message);
      return null;
    }
    if (data && data.payload !== undefined && data.payload !== null) {
      if (Array.isArray(data.payload)) {
        return data.payload.filter((item: any) => item !== null && item !== undefined) as unknown as T;
      }
      return data.payload as T;
    }
  } catch (err) {
    console.warn(`[Supabase] Exception saat memuat ${key}:`, err);
  }
  return null;
}

export async function saveSettingsToSupabase(settings: any): Promise<boolean> {
  return saveMasterDataToSupabase('main_config', settings);
}

export async function loadSettingsFromSupabase(): Promise<any | null> {
  return loadMasterDataFromSupabase<any>('main_config');
}

// ============================================================================
// SUPABASE REALTIME MULTIPLEXER (supabase.channel().on('postgres_changes', ...))
// 100% Sinkron Otomatis di Laptop, PC, Android, iPhone (iOS), dan Preview AI Studio
// ============================================================================
type RealtimeListener = (data: any) => void;

const tableChannels = new Map<MadinSupabaseTable, RealtimeChannel>();
const keyListeners = new Map<string, Set<RealtimeListener>>();

function ensureTableChannel(table: MadinSupabaseTable) {
  if (!supabase || tableChannels.has(table)) return;

  const channel = supabase
    .channel(`madin-realtime-${table}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
      },
      async (change: any) => {
        const record = change?.new || change?.old;
        const rowId = normalizeCollectionKey(String(record?.id || record?.collection_key || ''));
        if (!rowId) return;

        const listeners = keyListeners.get(rowId);
        if (!listeners || listeners.size === 0) return;

        let nextPayload = change?.eventType === 'DELETE' ? null : change?.new?.payload;

        // Fallback aman jika payload besar tidak ikut di WAL broadcast realtime
        if (change?.eventType !== 'DELETE' && (nextPayload === undefined || nextPayload === null)) {
          nextPayload = await loadMasterDataFromSupabase(rowId);
        }

        const safePayload = Array.isArray(nextPayload)
          ? nextPayload.filter((item: any) => item !== null && item !== undefined)
          : nextPayload;

        listeners.forEach((cb) => {
          try {
            cb(safePayload);
          } catch (err) {
            console.warn(`[Supabase Realtime] Callback error (${rowId}):`, err);
          }
        });
      }
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR') {
        console.warn(`[Supabase Realtime] Channel ${table} mengalami gangguan koneksi.`);
      }
    });

  tableChannels.set(table, channel);
}

function cleanupUnusedChannel(table: MadinSupabaseTable) {
  if (!supabase) return;
  let stillUsed = false;
  keyListeners.forEach((set, key) => {
    if (set.size > 0 && resolveSupabaseTable(key) === table) {
      stillUsed = true;
    }
  });
  if (!stillUsed) {
    const ch = tableChannels.get(table);
    if (ch) {
      try {
        supabase.removeChannel(ch);
      } catch {}
      tableChannels.delete(table);
    }
  }
}

export function subscribeMasterDataFromSupabase<T = any>(
  collectionKey: string,
  callback: (data: T | null) => void
): () => void {
  if (!supabase) return () => {};
  const key = normalizeCollectionKey(collectionKey);
  const table = resolveSupabaseTable(key);

  if (!keyListeners.has(key)) {
    keyListeners.set(key, new Set());
  }
  const set = keyListeners.get(key)!;
  set.add(callback as RealtimeListener);

  ensureTableChannel(table);

  return () => {
    set.delete(callback as RealtimeListener);
    if (set.size === 0) {
      keyListeners.delete(key);
      cleanupUnusedChannel(table);
    }
  };
}

export function subscribeSettingsFromSupabase(callback: (settings: any | null) => void): () => void {
  return subscribeMasterDataFromSupabase('main_config', callback);
}

// ============================================================================
// PENOMORAN SURAT BERURUTAN VIA SUPABASE (PENGGANTI TRANSAKSI FIRESTORE)
// ============================================================================
export async function incrementSupabaseSequenceCounter(
  counterKey: string,
  localStorageKey: string,
  existingMaxUrutan: number = 0
): Promise<number> {
  let currentSeq = 0;
  try {
    const remote = await loadMasterDataFromSupabase<{ lastSeq?: number }>(counterKey);
    if (remote && typeof remote.lastSeq === 'number') {
      currentSeq = remote.lastSeq;
    }
  } catch {}

  try {
    const localSeq = parseInt(localStorage.getItem(localStorageKey) || '0', 10) || 0;
    currentSeq = Math.max(currentSeq, localSeq);
  } catch {}

  const nextSeq = Math.max(currentSeq, existingMaxUrutan) + 1;

  try {
    localStorage.setItem(localStorageKey, String(nextSeq));
  } catch {}

  await saveMasterDataToSupabase(counterKey, {
    lastSeq: nextSeq,
    updatedAt: new Date().toISOString(),
  });

  return nextSeq;
}

// ============================================================================
// EKSPOR & PULIHKAN BACKUP JSON VIA SUPABASE
// ============================================================================
export async function exportSupabaseBackup() {
  const collections: Record<string, any> = {};
  const summary: Record<string, number> = {};

  for (const key of SUPABASE_COLLECTION_KEYS) {
    try {
      const data = await loadMasterDataFromSupabase(key);
      if (data !== null && data !== undefined) {
        collections[key] = data;
        summary[key] = countPayloadItems(data);
      } else {
        collections[key] = [];
        summary[key] = 0;
      }
    } catch {
      collections[key] = [];
      summary[key] = 0;
    }
  }

  const settings = await loadSettingsFromSupabase();

  return {
    version: '2.0.0-supabase',
    exportedAt: new Date().toISOString(),
    projectId: supabaseUrl,
    databaseId: 'supabase-postgres',
    appName: 'SIM Pondok Pesantren Salaf Al-Maliki',
    settings: settings || null,
    collections,
    summary,
  };
}

export async function restoreSupabaseBackup(backup: any): Promise<{
  success: boolean;
  restoredKeys: string[];
  summary: Record<string, number>;
  message: string;
}> {
  if (!backup || typeof backup !== 'object') {
    throw new Error('Format file backup tidak valid. Harus berupa JSON.');
  }

  const targetCollections = backup.collections || (backup.santri ? backup : null);
  if (!targetCollections || typeof targetCollections !== 'object') {
    throw new Error('Data backup tidak memiliki struktur koleksi yang dapat dibaca.');
  }

  const restoredKeys: string[] = [];
  const summary: Record<string, number> = {};

  if (backup.settings) {
    await saveSettingsToSupabase(backup.settings);
    restoredKeys.push('main_config');
  }

  for (const key of SUPABASE_COLLECTION_KEYS) {
    if (key in targetCollections) {
      const itemData = targetCollections[key];
      if (itemData !== undefined && itemData !== null) {
        await saveMasterDataToSupabase(key, itemData);
        restoredKeys.push(key);
        summary[key] = countPayloadItems(itemData);
      }
    }
  }

  return {
    success: true,
    restoredKeys,
    summary,
    message: `Berhasil memulihkan ${restoredKeys.length} modul data ke database Supabase.`,
  };
}

// ============================================================================
// SUPABASE STORAGE (UPLOAD, PUBLIC URL & DELETE UNTUK FOTO, VIDEO, DOKUMEN, BACKUP)
// 100% Murni Supabase — Tanpa Firebase Storage / Google Drive
// ============================================================================
export const SUPABASE_STORAGE_BUCKET = 'madin-storage';

export async function uploadFileToSupabaseStorage(
  storagePath: string,
  file: File | Blob,
  contentType?: string
): Promise<{ publicUrl: string; path: string } | null> {
  if (!supabase || !isSupabaseConfigured()) return null;
  const cleanPath = storagePath.replace(/^\/+/, '');
  try {
    const { data, error } = await supabase.storage
      .from(SUPABASE_STORAGE_BUCKET)
      .upload(cleanPath, file, {
        contentType: contentType || file.type || 'application/octet-stream',
        upsert: true,
        cacheControl: '3600',
      });

    if (error) {
      console.warn(`[Supabase Storage] Gagal upload ${cleanPath}:`, error.message);
      return null;
    }

    const finalPath = data?.path || cleanPath;
    const { data: pubData } = supabase.storage
      .from(SUPABASE_STORAGE_BUCKET)
      .getPublicUrl(finalPath);

    return {
      path: finalPath,
      publicUrl: pubData?.publicUrl || '',
    };
  } catch (err) {
    console.warn(`[Supabase Storage] Exception saat upload ${cleanPath}:`, err);
    return null;
  }
}

export async function deleteFileFromSupabaseStorage(storagePath: string): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured() || !storagePath) return false;
  const cleanPath = storagePath.replace(/^\/+/, '');
  try {
    const { error } = await supabase.storage
      .from(SUPABASE_STORAGE_BUCKET)
      .remove([cleanPath]);
    if (error) {
      console.warn(`[Supabase Storage] Gagal hapus ${cleanPath}:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`[Supabase Storage] Exception saat hapus ${cleanPath}:`, err);
    return false;
  }
}
