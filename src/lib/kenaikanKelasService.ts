/**
 * SISTEM KENAIKAN KELAS OTOMATIS & MANAJEMEN TAHUN AJARAN SANTRI
 * SIM Pondok Pesantren Salaf Al-Maliki
 * 
 * Prinsip:
 * 1. DATA SANTRI TIDAK BOLEH DIINPUT ULANG / DUPLIKAT.
 * 2. Seluruh proses mempertahankan ID / NIS Santri yang sama agar absensi,
 *    nilai ujian kitab, hafalan nadzhom, syahriyah, dan uang saku tetap 100% terhubung.
 * 3. Menghasilkan riwayat lengkap: TAHUN AJARAN → KELAS → STATUS SANTRI.
 * 4. Mendukung penanganan manual untuk santri yang tidak naik:
 *    - Tetap di kelas
 *    - Naik kelas
 *    - Lulus
 *    - Mutasi / Keluar
 */

import { Santri, RiwayatKelasItem, StatusSantri } from '../types';

export type PromotionAction = 'naik' | 'tetap' | 'lulus' | 'mutasi';

export interface PromotionRule {
  nextClass: string;
  defaultAction: PromotionAction;
}

// Jenjang resmi kenaikan kelas Pondok Pesantren & Madrasah Diniyah Salafiyah Al-Maliki
export const CLASS_PROGRESSION_MAP: Record<string, PromotionRule> = {
  '1 TSANAWIYAH': { nextClass: '2 TSANAWIYAH', defaultAction: 'naik' },
  '2 TSANAWIYAH': { nextClass: '3 TSANAWIYAH', defaultAction: 'naik' },
  '3 TSANAWIYAH': { nextClass: '1 ALIYAH', defaultAction: 'naik' },
  '1 ALIYAH': { nextClass: '2 ALIYAH', defaultAction: 'naik' },
  '2 ALIYAH': { nextClass: '3 ALIYAH', defaultAction: 'naik' },
  '3 ALIYAH': { nextClass: '3 ALIYAH (Lulus/Alumni)', defaultAction: 'lulus' }
};

export const ALL_CLASSES = [
  '1 TSANAWIYAH',
  '2 TSANAWIYAH',
  '3 TSANAWIYAH',
  '1 ALIYAH',
  '2 ALIYAH',
  '3 ALIYAH'
];

export interface SantriPromotionDecision {
  santriId: string;
  nama: string;
  foto?: string;
  kelasAsal: string;
  kelasTujuan: string;
  action: PromotionAction;
  isManualOverride: boolean;
  catatan?: string;
}

export interface ClassBreakdownItem {
  kelasAsal: string;
  kelasTujuan: string;
  jumlahSantri: number;
  santriIds: string[];
}

export interface PromotionPreviewSummary {
  totalSantri: number;
  totalNaik: number;
  totalLulus: number;
  totalTetap: number;
  totalMutasi: number;
  totalManualOverride: number;
  breakdown: ClassBreakdownItem[];
}

/**
 * Prediksi tahun ajaran baru otomatis
 * Contoh: "2026/2027" -> "2027/2028"
 * Contoh: "1447/1448 H" -> "1448/1449 H"
 */
export function getNextAcademicYear(currentYear: string): string {
  if (!currentYear) {
    const cur = new Date().getFullYear();
    return `${cur}/${cur + 1}`;
  }

  // Pola Masehi: 2026/2027
  const masehiMatch = currentYear.match(/(\d{4})\/(\d{4})/);
  if (masehiMatch) {
    const y1 = parseInt(masehiMatch[1], 10) + 1;
    const y2 = parseInt(masehiMatch[2], 10) + 1;
    const suffix = currentYear.includes('H') ? ' H' : '';
    return `${y1}/${y2}${suffix}`;
  }

  // Pola Hijriyah: 1447/1448 H
  const hijriMatch = currentYear.match(/(\d{4})\/(\d{4})\s*H?/i);
  if (hijriMatch) {
    const h1 = parseInt(hijriMatch[1], 10) + 1;
    const h2 = parseInt(hijriMatch[2], 10) + 1;
    return `${h1}/${h2} H`;
  }

  const cur = new Date().getFullYear();
  return `${cur}/${cur + 1}`;
}

/**
 * Inisialisasi daftar keputusan kenaikan kelas untuk seluruh santri
 */
export function buildInitialDecisions(santriList: Santri[]): SantriPromotionDecision[] {
  const seen = new Set<string>();
  const uniqueSantri = (santriList || []).filter((s, idx) => {
    const rawId = s?.id ? String(s.id).trim() : `temp-${idx}`;
    if (!rawId || seen.has(rawId)) return false;
    seen.add(rawId);
    return true;
  });

  return uniqueSantri.map(s => {
    const rule = CLASS_PROGRESSION_MAP[s.kelas];
    const defaultAction: PromotionAction = rule ? rule.defaultAction : 'naik';
    const defaultNextClass = rule ? rule.nextClass : s.kelas;

    return {
      santriId: s.id,
      nama: s.nama,
      foto: s.fotoThumbnail || s.foto,
      kelasAsal: s.kelas,
      kelasTujuan: defaultNextClass,
      action: defaultAction,
      isManualOverride: false,
      catatan: ''
    };
  });
}

/**
 * Hitung statistik preview kenaikan kelas
 */
export function computePromotionPreview(
  decisions: SantriPromotionDecision[]
): PromotionPreviewSummary {
  let totalNaik = 0;
  let totalLulus = 0;
  let totalTetap = 0;
  let totalMutasi = 0;
  let totalManualOverride = 0;

  const breakdownMap: Record<string, { kelasAsal: string; kelasTujuan: string; santriIds: string[] }> = {};

  decisions.forEach(d => {
    if (d.action === 'naik') totalNaik++;
    else if (d.action === 'lulus') totalLulus++;
    else if (d.action === 'tetap') totalTetap++;
    else if (d.action === 'mutasi') totalMutasi++;

    if (d.isManualOverride) totalManualOverride++;

    const key = `${d.kelasAsal} -> ${d.kelasTujuan}`;
    if (!breakdownMap[key]) {
      breakdownMap[key] = {
        kelasAsal: d.kelasAsal,
        kelasTujuan: d.kelasTujuan,
        santriIds: []
      };
    }
    breakdownMap[key].santriIds.push(d.santriId);
  });

  const breakdown: ClassBreakdownItem[] = Object.values(breakdownMap).map(b => ({
    kelasAsal: b.kelasAsal,
    kelasTujuan: b.kelasTujuan,
    jumlahSantri: b.santriIds.length,
    santriIds: b.santriIds
  }));

  return {
    totalSantri: decisions.length,
    totalNaik,
    totalLulus,
    totalTetap,
    totalMutasi,
    totalManualOverride,
    breakdown
  };
}

/**
 * Eksekusi Kenaikan Kelas:
 * - Tidak membuat duplikat
 * - Mempertahankan ID santri
 * - Mencatat riwayat: Tahun Ajaran -> Kelas -> Status Santri
 * - Mengembalikan santriList yang diperbarui
 */
export function executePromotionProcess(
  santriList: Santri[],
  decisions: SantriPromotionDecision[],
  currentAcademicYear: string,
  newAcademicYear: string
): Santri[] {
  const decisionMap = new Map<string, SantriPromotionDecision>();
  decisions.forEach(d => decisionMap.set(d.santriId, d));

  const nowFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return santriList.map(santri => {
    const decision = decisionMap.get(santri.id);
    if (!decision) return santri;

    let targetClass = santri.kelas;
    let finalStatus: StatusSantri = 'Aktif';
    let statusRiwayatText: StatusSantri = 'Naik Kelas';
    let keteranganText = '';

    if (decision.action === 'naik') {
      targetClass = decision.kelasTujuan;
      finalStatus = 'Aktif';
      statusRiwayatText = 'Naik Kelas';
      keteranganText = `Naik dari ${santri.kelas} ke ${targetClass} pada Tahun Ajaran ${newAcademicYear}`;
    } else if (decision.action === 'tetap') {
      targetClass = santri.kelas;
      finalStatus = 'Tetap di Kelas';
      statusRiwayatText = 'Tetap di Kelas';
      keteranganText = `Tetap di kelas ${santri.kelas} (Tinggal Kelas) pada Tahun Ajaran ${newAcademicYear}`;
    } else if (decision.action === 'lulus') {
      targetClass = santri.kelas.includes('Alumni') ? santri.kelas : `${santri.kelas} (Alumni)`;
      finalStatus = 'Lulus';
      statusRiwayatText = 'Lulus';
      keteranganText = `Tamat / Lulus dari jenjang Madrasah Diniyah Salafiyah Al-Maliki`;
    } else if (decision.action === 'mutasi') {
      targetClass = santri.kelas;
      finalStatus = 'Mutasi / Keluar';
      statusRiwayatText = 'Mutasi / Keluar';
      keteranganText = decision.catatan ? `Mutasi / Keluar: ${decision.catatan}` : `Mutasi / Pindah Pesantren`;
    }

    // Riwayat baru yang ditambahkan
    const newHistoryEntry: RiwayatKelasItem = {
      tahunAjaran: currentAcademicYear,
      kelas: santri.kelas,
      status: statusRiwayatText,
      tanggalProses: nowFormatted,
      keterangan: keteranganText,
      catatanManual: decision.catatan || undefined
    };

    // Riwayat yang sudah ada
    const existingHistory: RiwayatKelasItem[] = Array.isArray(santri.riwayatKelas) 
      ? [...santri.riwayatKelas] 
      : [];

    // Jika santri belum punya riwayat sebelumnya, buatkan entri awal tahun masuk
    if (existingHistory.length === 0) {
      existingHistory.push({
        tahunAjaran: santri.tahunMasuk || '2025/2026',
        kelas: santri.kelas,
        status: 'Aktif',
        tanggalProses: 'Tahun Masuk Awal',
        keterangan: 'Pendaftaran & Masuk Pertama Kali'
      });
    }

    return {
      ...santri,
      // ID TETAP SAMA (tidak boleh diubah!)
      id: santri.id,
      kelas: targetClass,
      statusSantri: finalStatus,
      tahunAjaranAktif: newAcademicYear,
      riwayatKelas: [...existingHistory, newHistoryEntry]
    };
  });
}

/**
 * Menghasilkan riwayat default terstruktur untuk santri yang belum memiliki riwayat
 */
export function getOrCreateSantriHistory(santri: Santri, currentYear = '2026/2027'): RiwayatKelasItem[] {
  if (santri.riwayatKelas && santri.riwayatKelas.length > 0) {
    return santri.riwayatKelas;
  }

  // Buat riwayat dasar berdasarkan kelas saat ini
  const history: RiwayatKelasItem[] = [];
  const currentClass = santri.kelas;

  if (currentClass === '1 TSANAWIYAH') {
    history.push({
      tahunAjaran: currentYear,
      kelas: '1 TSANAWIYAH',
      status: 'Aktif',
      tanggalProses: 'Tahun Ajaran Aktif',
      keterangan: 'Santri Baru Angkatan Tsanawiyah'
    });
  } else if (currentClass === '2 TSANAWIYAH') {
    history.push({
      tahunAjaran: '2025/2026',
      kelas: '1 TSANAWIYAH',
      status: 'Naik Kelas',
      tanggalProses: '15 Juni 2025',
      keterangan: 'Naik ke kelas 2 Tsanawiyah'
    });
    history.push({
      tahunAjaran: currentYear,
      kelas: '2 TSANAWIYAH',
      status: 'Aktif',
      tanggalProses: 'Tahun Ajaran Aktif',
      keterangan: 'Sedang Aktif Belajar'
    });
  } else if (currentClass === '3 TSANAWIYAH') {
    history.push({
      tahunAjaran: '2024/2025',
      kelas: '1 TSANAWIYAH',
      status: 'Naik Kelas',
      tanggalProses: '15 Juni 2024',
      keterangan: 'Naik ke kelas 2 Tsanawiyah'
    });
    history.push({
      tahunAjaran: '2025/2026',
      kelas: '2 TSANAWIYAH',
      status: 'Naik Kelas',
      tanggalProses: '15 Juni 2025',
      keterangan: 'Naik ke kelas 3 Tsanawiyah'
    });
    history.push({
      tahunAjaran: currentYear,
      kelas: '3 TSANAWIYAH',
      status: 'Aktif',
      tanggalProses: 'Tahun Ajaran Aktif',
      keterangan: 'Persiapan Ujian Akhir Tsanawiyah'
    });
  } else if (currentClass === '1 ALIYAH') {
    history.push({
      tahunAjaran: '2025/2026',
      kelas: '3 TSANAWIYAH',
      status: 'Naik Kelas',
      tanggalProses: '15 Juni 2025',
      keterangan: 'Tamat Tsanawiyah & Melanjutkan ke 1 Aliyah'
    });
    history.push({
      tahunAjaran: currentYear,
      kelas: '1 ALIYAH',
      status: 'Aktif',
      tanggalProses: 'Tahun Ajaran Aktif',
      keterangan: 'Sedang Aktif Belajar Tingkat Aliyah'
    });
  } else if (currentClass === '2 ALIYAH') {
    history.push({
      tahunAjaran: '2025/2026',
      kelas: '1 ALIYAH',
      status: 'Naik Kelas',
      tanggalProses: '15 Juni 2025',
      keterangan: 'Naik ke kelas 2 Aliyah'
    });
    history.push({
      tahunAjaran: currentYear,
      kelas: '2 ALIYAH',
      status: 'Aktif',
      tanggalProses: 'Tahun Ajaran Aktif',
      keterangan: 'Sedang Aktif Belajar Tingkat Aliyah'
    });
  } else if (currentClass.includes('3 ALIYAH')) {
    history.push({
      tahunAjaran: '2025/2026',
      kelas: '2 ALIYAH',
      status: 'Naik Kelas',
      tanggalProses: '15 Juni 2025',
      keterangan: 'Naik ke kelas 3 Aliyah'
    });
    history.push({
      tahunAjaran: currentYear,
      kelas: '3 ALIYAH',
      status: santri.statusSantri === 'Lulus' ? 'Lulus' : 'Aktif',
      tanggalProses: 'Tahun Ajaran Aktif',
      keterangan: 'Tingkat Akhir Madrasah Aliyah'
    });
  } else {
    history.push({
      tahunAjaran: currentYear,
      kelas: currentClass,
      status: 'Aktif',
      tanggalProses: 'Tahun Ajaran Aktif',
      keterangan: 'Aktif di kelas saat ini'
    });
  }

  return history;
}
