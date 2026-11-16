import { JadwalPelajaran, Pengurus, SilabusMemaknaiRecord } from '../types';
import { isTeacherNameMatch } from '../serverTime';

export interface EnrichedSilabusRecord {
  silabus: SilabusMemaknaiRecord;
  matchedSchedules: JadwalPelajaran[];
  scheduleSummary: string;
}

const normalizeText = (v?: string): string =>
  (v || '')
    .toLowerCase()
    .replace(/['"`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export function doesKitabMatchMapel(kitab?: string, mapel?: string): boolean {
  const k = normalizeText(kitab);
  const m = normalizeText(mapel);
  if (!k || !m) return false;
  if (k === m) return true;
  if (k.includes(m) || m.includes(k)) return true;

  // Cocokkan kata kunci utama (mengabaikan kata awalan umum seperti matan/kitab)
  const stripGeneric = (s: string) =>
    s.replace(/\b(matan|kitab|nadzhom|nadhom|al|as|ar|at|fi|ilmu)\b/g, ' ').replace(/\s+/g, ' ').trim();
  const kClean = stripGeneric(k);
  const mClean = stripGeneric(m);
  if (kClean.length >= 3 && mClean.length >= 3 && (kClean.includes(mClean) || mClean.includes(kClean))) {
    return true;
  }
  return false;
}

/**
 * Mencocokkan daftar silabus dari Dashboard Admin dengan jadwal pelajaran dan profil guru/pengurus yang sedang login.
 */
export function matchSilabusForTeacher(
  silabusList: SilabusMemaknaiRecord[],
  mySchedules: JadwalPelajaran[],
  pengurus: Pick<Pengurus, 'nama' | 'mapel' | 'kelasBimbingan'>,
  semesterFilter: 'SEMUA' | 'Semester 1' | 'Semester 2' = 'SEMUA'
): EnrichedSilabusRecord[] {
  const list = Array.isArray(silabusList) ? silabusList : [];
  const schedules = Array.isArray(mySchedules) ? mySchedules : [];

  const matched: EnrichedSilabusRecord[] = [];

  for (const s of list) {
    if (semesterFilter !== 'SEMUA' && s.semester && s.semester !== semesterFilter) {
      continue;
    }

    const sKelasNorm = normalizeText(s.kelas);

    // Cari jadwal milik guru ini yang sesuai kelas & mapel (atau jadwalId eksplisit)
    const relatedSchedules = schedules.filter((j) => {
      if (s.jadwalId && j.id && s.jadwalId === j.id) return true;
      const jKelasNorm = normalizeText(j.kelas);
      const classMatch = !sKelasNorm || !jKelasNorm || jKelasNorm === sKelasNorm;
      const subjectMatch = doesKitabMatchMapel(s.namaKitab, j.mapel);
      return classMatch && subjectMatch;
    });

    const isDirectTeacherMatch = isTeacherNameMatch(s.ustadzPengampu, pengurus.nama);
    const isMapelFallbackMatch =
      !s.ustadzPengampu &&
      Boolean(pengurus.mapel) &&
      doesKitabMatchMapel(s.namaKitab, pengurus.mapel);

    if (isDirectTeacherMatch || relatedSchedules.length > 0 || isMapelFallbackMatch) {
      // Jika cocok berdasarkan nama guru tapi mapel sedikit berbeda, coba tampilkan jadwal di kelas yang sama milik guru tsb
      const fallbackSameClassSchedules =
        relatedSchedules.length > 0
          ? relatedSchedules
          : schedules.filter((j) => normalizeText(j.kelas) === sKelasNorm);

      const finalSchedules = fallbackSameClassSchedules;

      let scheduleSummary = '';
      if (finalSchedules.length > 0) {
        scheduleSummary = finalSchedules
          .map((j) => `${j.hari} • Jam Ke-${j.jamKe || 1}${j.waktu ? ` (${j.waktu})` : ''}`)
          .join(' | ');
      } else if (s.hariJadwal || s.jamJadwal) {
        scheduleSummary = [s.hariJadwal, s.jamJadwal].filter(Boolean).join(' • ');
      }

      matched.push({
        silabus: s,
        matchedSchedules: finalSchedules,
        scheduleSummary
      });
    }
  }

  return matched;
}
