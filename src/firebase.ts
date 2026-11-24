import {
  saveSettingsToSupabase,
  loadSettingsFromSupabase,
  subscribeSettingsFromSupabase,
  saveMasterDataToSupabase,
  loadMasterDataFromSupabase,
  subscribeMasterDataFromSupabase,
  exportSupabaseBackup,
  restoreSupabaseBackup,
  incrementSupabaseSequenceCounter,
} from './services/supabase';

// ============================================================================
// KOMPATIBILITAS 100% MURNI SUPABASE REALTIME
// Seluruh SDK, koneksi, listener, dan import Firebase Firestore/Auth/Storage
// telah dihapus sepenuhnya. Semua operasi berjalan murni melalui Supabase.
// ============================================================================

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth <= 768
  );
}

export function isStandaloneApp(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

export async function saveSettingsToFirestore(settings: any): Promise<void> {
  await saveSettingsToSupabase(settings);
}

export async function loadSettingsFromFirestore(): Promise<any> {
  return loadSettingsFromSupabase();
}

export function subscribeSettingsFromFirestore(callback: (settings: any) => void): () => void {
  return subscribeSettingsFromSupabase(callback);
}

export async function saveMasterDataToFirestore(collectionKey: string, data: any): Promise<void> {
  await saveMasterDataToSupabase(collectionKey, data);
}

export async function loadMasterDataFromFirestore<T = any>(collectionKey: string): Promise<T | null> {
  return loadMasterDataFromSupabase<T>(collectionKey);
}

export function subscribeMasterDataFromFirestore<T = any>(
  collectionKey: string,
  callback: (data: T | null) => void
): () => void {
  return subscribeMasterDataFromSupabase<T>(collectionKey, callback);
}

export interface FirestoreBackupPackage {
  version: string;
  exportedAt: string;
  projectId: string;
  databaseId: string;
  appName: string;
  settings: any;
  collections: Record<string, any>;
  summary: Record<string, number>;
}

export { SUPABASE_COLLECTION_KEYS as MASTER_COLLECTION_KEYS } from './services/supabase';

export async function exportFirestoreBackup(): Promise<FirestoreBackupPackage> {
  return exportSupabaseBackup();
}

export async function restoreFirestoreBackup(backup: any): Promise<{
  success: boolean;
  restoredKeys: string[];
  summary: Record<string, number>;
  message: string;
}> {
  return restoreSupabaseBackup(backup);
}

const ROMAN_MONTHS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const INDONESIAN_MONTHS = [
  'januari', 'februari', 'maret', 'april', 'mei', 'juni',
  'juli', 'agustus', 'september', 'oktober', 'november', 'desember',
];

export function formatNomorSuratFromCounter(
  urutan: number,
  formatPattern: string = '{NO}/TAKZIRAN/MD-ALMALIKI/{ROMAWI}/{TAHUN}',
  periodeBulan?: string
): string {
  const paddedNo = String(Math.max(1, urutan)).padStart(3, '0');
  const now = new Date();
  let monthIdx = now.getMonth();
  let yearNum = now.getFullYear();

  if (periodeBulan) {
    const parts = periodeBulan.trim().split(/\s+/);
    if (parts.length >= 2) {
      const mIdx = INDONESIAN_MONTHS.findIndex((m) =>
        parts[0].toLowerCase().startsWith(m.slice(0, 3))
      );
      if (mIdx !== -1) monthIdx = mIdx;
      const yParsed = parseInt(parts[1], 10);
      if (!isNaN(yParsed)) yearNum = yParsed;
    }
  }

  const romawi = ROMAN_MONTHS[monthIdx] || 'XI';
  const tahunStr = String(yearNum);

  if (!formatPattern || !formatPattern.trim()) {
    return `${paddedNo}/TAKZIRAN/MD-ALMALIKI/${romawi}/${tahunStr}`;
  }

  if (!formatPattern.includes('{NO}') && !formatPattern.includes('{NOMOR}')) {
    const replacedFirstNum = formatPattern.replace(/^\d+/, paddedNo);
    if (replacedFirstNum !== formatPattern) {
      return replacedFirstNum;
    }
    return `${paddedNo}/${formatPattern}`;
  }

  return formatPattern
    .replace(/\{NO\}|\{NOMOR\}/gi, paddedNo)
    .replace(/\{ROMAWI\}|\{BULAN_ROMAWI\}/gi, romawi)
    .replace(/\{TAHUN\}/gi, tahunStr);
}

export async function generateAtomicNomorSuratTakziran(
  formatPattern: string = '{NO}/TAKZIRAN/MD-ALMALIKI/{ROMAWI}/{TAHUN}',
  periodeBulan?: string,
  existingMaxUrutan: number = 0
): Promise<{ nomorSurat: string; urutan: number }> {
  const nextUrutan = await incrementSupabaseSequenceCounter(
    'pelanggaran_counter',
    'sim_pelanggaran_last_seq',
    existingMaxUrutan
  );
  const nomorSurat = formatNomorSuratFromCounter(nextUrutan, formatPattern, periodeBulan);
  return { nomorSurat, urutan: nextUrutan };
}

export async function generateAtomicNomorSuratPeringatanGuru(
  formatPattern: string = '{NO}/SP-GURU/MD-ALMALIKI/{ROMAWI}/{TAHUN}',
  periodeBulan?: string,
  existingMaxUrutan: number = 0
): Promise<{ nomorSurat: string; urutan: number }> {
  const nextUrutan = await incrementSupabaseSequenceCounter(
    'peringatan_guru_counter',
    'sim_peringatan_guru_last_seq',
    existingMaxUrutan
  );
  const nomorSurat = formatNomorSuratFromCounter(nextUrutan, formatPattern, periodeBulan);
  return { nomorSurat, urutan: nextUrutan };
}

export async function generateAtomicNomorSuratUjianTakziran(
  formatPattern: string = '{NO}/TKZ-UJIAN/MD-ALMALIKI/{ROMAWI}/{TAHUN}',
  periodeBulan?: string,
  existingMaxUrutan: number = 0
): Promise<{ nomorSurat: string; urutan: number }> {
  const nextUrutan = await incrementSupabaseSequenceCounter(
    'ujian_takziran_counter',
    'sim_ujian_takziran_last_seq',
    existingMaxUrutan
  );
  const nomorSurat = formatNomorSuratFromCounter(nextUrutan, formatPattern, periodeBulan);
  return { nomorSurat, urutan: nextUrutan };
}
