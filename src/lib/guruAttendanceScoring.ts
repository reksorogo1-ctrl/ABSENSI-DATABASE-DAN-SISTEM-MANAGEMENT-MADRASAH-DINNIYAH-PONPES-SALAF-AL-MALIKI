export interface GuruAttendanceScoreResult {
  hadirTepatWaktu: number;
  telat: number;
  totalHadir: number; // Guru yang telat tetap dihitung sebagai Hadir (hadirTepatWaktu + telat)
  izin: number;
  alpha: number;
  totalSesi: number;
  bobotNilaiTelatPersen: number; // Bobot kredit sesi telat (default 50%)
  persentasePenilaian: number; // 0-100, dipengaruhi oleh keterlambatan
}

/**
 * Menghitung rekap dan persentase penilaian kehadiran Ustadz / Guru:
 * - Guru yang Telat tetap dihitung sebagai Hadir (totalHadir = hadirTepatWaktu + telat).
 * - Keterlambatan (telat) tetap mengurangi skor/persentase penilaian disiplin sesuai bobot penalti.
 */
export function calculateGuruAttendanceScore(
  hadirTepatWaktu: number,
  telat: number,
  izin: number,
  alpha: number,
  bobotNilaiTelatPersen: number = 50
): GuruAttendanceScoreResult {
  const tepat = Math.max(0, Math.round(Number(hadirTepatWaktu) || 0));
  const late = Math.max(0, Math.round(Number(telat) || 0));
  const exc = Math.max(0, Math.round(Number(izin) || 0));
  const abs = Math.max(0, Math.round(Number(alpha) || 0));

  const totalHadir = tepat + late;
  const totalSesi = tepat + late + exc + abs;
  const rawWeight = Number(bobotNilaiTelatPersen);
  const clampedWeight = Math.max(0, Math.min(99, Number.isFinite(rawWeight) ? rawWeight : 50));

  const effectiveScore = tepat + late * (clampedWeight / 100);
  let persentasePenilaian =
    totalSesi > 0 ? Math.max(0, Math.min(100, Math.round((effectiveScore / totalSesi) * 100))) : 0;

  // Pastikan keterlambatan (telat > 0) selalu memengaruhi persentase penilaian (tidak membulat ke 100%)
  if (totalSesi > 0 && late > 0 && persentasePenilaian >= 100) {
    persentasePenilaian = 99;
  }

  return {
    hadirTepatWaktu: tepat,
    telat: late,
    totalHadir,
    izin: exc,
    alpha: abs,
    totalSesi,
    bobotNilaiTelatPersen: clampedWeight,
    persentasePenilaian
  };
}
