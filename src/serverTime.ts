/**
 * Layanan Jam Server & Logika Validasi Waktu Presensi Real-Time
 * Madrasah Diniyah Salafiyah Pondok Pesantren Salaf Al-Maliki
 *
 * Jadwal Presensi Resmi:
 * 1. TSANAWIYAH:
 *    - Rentang Waktu: 08.00 - 08.30 WIB
 *    - Batas Awal: 08.00 WIB
 *    - Status:
 *      * Tepat pada 08.00 -> 'Hadir'
 *      * Melewati 08.00 (08.01 - 08.30) -> Otomatis 'Terlambat'
 *    - Di luar 08.00 - 08.30: Tombol NONAKTIF (Santri/Ustadz tidak bisa presensi)
 *
 * 2. ALIYAH:
 *    - Sesi 1: 19.00 - 19.30 WIB (Batas Awal: 19.00 WIB)
 *      * Tepat 19.00 -> 'Hadir'
 *      * Melewati 19.00 (19.01 - 19.30) -> Otomatis 'Terlambat'
 *    - Sesi 2: 21.00 - 21.30 WIB (Batas Awal: 21.00 WIB)
 *      * Tepat 21.00 -> 'Hadir'
 *      * Melewati 21.00 (21.01 - 21.30) -> Otomatis 'Terlambat'
 *    - Di luar jadwal di atas: Tombol NONAKTIF
 */

export interface ScheduleWindow {
  tingkat: 'TSANAWIYAH' | 'ALIYAH';
  sesi: string;
  jamKe: number;
  mulai: string;      // e.g. "08:00"
  batasAwal: string;  // e.g. "08:30" (batas tepat waktu / setelah ini terlambat)
  selesai: string;    // e.g. "12:30" (batas akhir tombol aktif)
}

export const OFFICIAL_SCHEDULES: ScheduleWindow[] = [
  {
    tingkat: 'TSANAWIYAH',
    sesi: 'Jam Ke-1 (Pagi)',
    jamKe: 1,
    mulai: '08:00',
    batasAwal: '08:30',
    selesai: '12:30'
  },
  {
    tingkat: 'TSANAWIYAH',
    sesi: 'Jam Ke-2 (Siang)',
    jamKe: 2,
    mulai: '09:45',
    batasAwal: '10:15',
    selesai: '12:30'
  },
  {
    tingkat: 'ALIYAH',
    sesi: 'Jam Ke-1 (Malam)',
    jamKe: 1,
    mulai: '19:00',
    batasAwal: '19:30',
    selesai: '23:00'
  },
  {
    tingkat: 'ALIYAH',
    sesi: 'Jam Ke-2 (Malam)',
    jamKe: 2,
    mulai: '21:00',
    batasAwal: '21:30',
    selesai: '23:00'
  }
];

export interface PesantrenDayInfo {
  wibDate: Date;
  calendarDayName: string;       // AHAD, SENIN, SELASA, RABU, KAMIS, JUMAT, SABTU
  malamDayName: string;          // MALAM SABTU, MALAM AHAD, MALAM SENIN, MALAM SELASA, MALAM RABU, MALAM KAMIS, MALAM JUMAT
  isNightSession: boolean;       // true jika jam >= 18:00 WIB atau jam < 04:00 WIB
  activeScheduleDay: string;     // Jika malam: malamDayName; jika siang: calendarDayName
  malamDescription: string;      // e.g. "Jumat Malam (Pukul 19:00 - 23:00 WIB)"
  malamShortDescription: string; // e.g. "Jumat Malam"
  wibClockShort: string;         // HH:mm
  todayIso: string;              // YYYY-MM-DD
}

/**
 * Evaluasi Nama Hari Resmi & Hari Sesi Malam (Pesantren Salaf Al-Maliki)
 * 
 * ATURAN RESMI WAKTU PESANTREN (WIB):
 * - Malam Senin  = Minggu malam (18:00 - 23:59) / Senin dini hari (00:00 - 04:00)
 * - Malam Selasa = Senin malam (18:00 - 23:59) / Selasa dini hari (00:00 - 04:00)
 * - Malam Rabu   = Selasa malam (18:00 - 23:59) / Rabu dini hari (00:00 - 04:00)
 * - Malam Kamis  = Rabu malam (18:00 - 23:59) / Kamis dini hari (00:00 - 04:00)
 * - Malam Jumat  = Kamis malam (18:00 - 23:59) / Jumat dini hari (00:00 - 04:00)
 * - Malam Sabtu  = Jumat malam (18:00 - 23:59) / Sabtu dini hari (00:00 - 04:00)
 * - Malam Minggu/Ahad = Sabtu malam (18:00 - 23:59) / Ahad dini hari (00:00 - 04:00)
 * 
 * Contoh:
 * Kelas Aliyah - Malam Sabtu - 19:00 WIB -> Masuk Jumat pukul 19:00 WIB.
 * Jumat 19:00 - 23:59 dan Sabtu 00:00 - 04:00 dianggap MALAM SABTU.
 */
export function toWibDate(serverDate?: Date): Date {
  const dateObj = serverDate || getServerTime();
  return new Date(dateObj.getTime() + 7 * 3600 * 1000);
}

export function normalizePesantrenDayName(dayStr?: string): string {
  if (!dayStr) return '';
  let upper = String(dayStr).toUpperCase().replace(/['`’]/g, '').replace(/\s+/g, ' ').trim();
  if (upper === 'MINGGU') upper = 'AHAD';
  if (upper === 'MALAM MINGGU') upper = 'MALAM AHAD';
  if (upper === 'JUMAT') upper = 'JUMAT';
  if (upper === 'MALAM JUMAT') upper = 'MALAM JUMAT';
  return upper;
}

export function getPesantrenDayInfo(serverDate?: Date): PesantrenDayInfo {
  const dateObj = serverDate || getServerTime();
  // Gunakan epoch UTC + 7 jam dengan getter UTC agar 100% konsisten Asia/Jakarta di semua perangkat/zona waktu
  const wibDate = toWibDate(dateObj);

  const hours = wibDate.getUTCHours();
  const minutes = wibDate.getUTCMinutes();
  const dayIndex = wibDate.getUTCDay(); // 0 = AHAD, 1 = SENIN, 2 = SELASA, 3 = RABU, 4 = KAMIS, 5 = JUMAT, 6 = SABTU
  const daysOfWeek = ['AHAD', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
  const calendarDayName = daysOfWeek[dayIndex];

  const pad = (n: number) => String(n).padStart(2, '0');
  const wibClockShort = `${pad(hours)}:${pad(minutes)}`;
  const todayIso = `${wibDate.getUTCFullYear()}-${pad(wibDate.getUTCMonth() + 1)}-${pad(wibDate.getUTCDate())}`;

  // Sesi malam (ba'da Maghrib 18:00 - 23:59 WIB serta dini hari 00:00 - 04:00 WIB)
  const isNightSession = hours >= 18 || hours < 4;

  let targetMalamDayIndex: number;
  if (hours >= 18) {
    // Malam hari ini mengarah ke hari esok (Jumat malam -> Malam Sabtu)
    targetMalamDayIndex = (dayIndex + 1) % 7;
  } else if (hours < 4) {
    // Dini hari (Sabtu 00:00 - 04:00) masih kelanjutan Malam Sabtu
    targetMalamDayIndex = dayIndex;
  } else {
    // Siang hari (misal jam 10 pagi hari Jumat): jika melihat jadwal Aliyah malam nanti, hari malamnya adalah malam esok (MALAM SABTU)
    targetMalamDayIndex = (dayIndex + 1) % 7;
  }

  const malamDayName = `MALAM ${daysOfWeek[targetMalamDayIndex]}`;

  const malamShortDescriptions: Record<string, string> = {
    'MALAM SABTU': 'Jumat Malam',
    'MALAM AHAD': 'Sabtu Malam',
    'MALAM SENIN': 'Minggu Malam',
    'MALAM SELASA': 'Senin Malam',
    'MALAM RABU': 'Selasa Malam',
    'MALAM KAMIS': 'Rabu Malam',
    'MALAM JUMAT': 'Kamis Malam'
  };

  const malamDescriptions: Record<string, string> = {
    'MALAM SABTU': 'Jumat Malam (Pukul 19:00 - 23:00 WIB)',
    'MALAM AHAD': 'Sabtu Malam (Pukul 19:00 - 23:00 WIB)',
    'MALAM SENIN': 'Minggu/Ahad Malam (Pukul 19:00 - 23:00 WIB)',
    'MALAM SELASA': 'Senin Malam (Pukul 19:00 - 23:00 WIB)',
    'MALAM RABU': 'Selasa Malam (Pukul 19:00 - 23:00 WIB)',
    'MALAM KAMIS': 'Rabu Malam (Pukul 19:00 - 23:00 WIB)',
    'MALAM JUMAT': 'Kamis Malam (Pukul 19:00 - 23:00 WIB)'
  };

  return {
    wibDate,
    calendarDayName,
    malamDayName,
    isNightSession,
    activeScheduleDay: isNightSession ? malamDayName : calendarDayName,
    malamDescription: malamDescriptions[malamDayName] || malamDayName,
    malamShortDescription: malamShortDescriptions[malamDayName] || malamDayName,
    wibClockShort,
    todayIso
  };
}

export function getMalamDaySubtitle(dayStr: string): string {
  if (!dayStr) return '';
  const upper = dayStr.toUpperCase().trim();
  const map: Record<string, string> = {
    'MALAM SABTU': '(Jumat Malam)',
    'MALAM AHAD': '(Sabtu Malam)',
    'MALAM SENIN': '(Ahad/Minggu Malam)',
    'MALAM SELASA': '(Senin Malam)',
    'MALAM RABU': '(Selasa Malam)',
    'MALAM KAMIS': '(Rabu Malam)',
    'MALAM JUMAT': '(Kamis Malam)'
  };
  return map[upper] || '';
}

export interface PresensiCheckResult {
  serverTime: Date;
  wibTimeStr: string;        // HH:mm:ss WIB
  wibClockShort: string;     // HH:mm
  todayIso: string;          // YYYY-MM-DD
  currentDayName: string;    // SENIN, SELASA, MALAM SABTU, dsb
  calendarDayName: string;   // AHAD, SENIN, dsb
  malamDayName: string;      // MALAM SABTU, MALAM AHAD, dsb
  malamDescription: string;  // Penjelasan Jumat Malam, dsb
  isNightSession: boolean;   // true jika malam hari
  isActive: boolean;         // Apakah sedang dalam jendela jadwal presensi
  tingkat: 'TSANAWIYAH' | 'ALIYAH' | '-';
  sesi: string;
  jamKe: number;
  status: 'Hadir' | 'Terlambat';
  isLate: boolean;
  keterangan: string;
  jadwalAktif?: ScheduleWindow;
  jadwalBerikutnya?: {
    label: string;
    jamMulai: string;
    sisaWaktuText: string;
  };
  buttonDisabled: boolean;
  buttonLabel: string;
  buttonColorClass: string;
  isSimulated?: boolean;
}

// Offset waktu server (dalam ms) hasil sinkronisasi dengan server asli
let serverTimeOffsetMs = 0;
let isClockSynced = false;

// State simulasi jam untuk pengujian bebas di UI
let simulatedTimeDate: Date | null = null;

/**
 * Sinkronisasi jam server melalui HTTP HEAD request
 */
export async function syncServerClock(): Promise<number> {
  try {
    const startTime = performance.now();
    const res = await fetch(window.location.href, {
      method: 'HEAD',
      cache: 'no-store'
    });
    const roundTrip = (performance.now() - startTime) / 2;
    const dateHeader = res.headers.get('date');
    if (dateHeader) {
      const serverEpoch = new Date(dateHeader).getTime() + roundTrip;
      serverTimeOffsetMs = serverEpoch - Date.now();
      isClockSynced = true;
    }
  } catch (e) {
    // Fallback gracefully jika offline atau CORS
    console.debug('Menggunakan jam lokal (offline/fallback sync)', e);
  }
  return serverTimeOffsetMs;
}

// Inisialisasi sinkronisasi pertama kali
if (typeof window !== 'undefined') {
  syncServerClock();
}

/**
 * Mendapatkan objek Date jam server real-time (atau jam simulasi jika diatur)
 */
export function getServerTime(): Date {
  if (simulatedTimeDate) {
    return new Date(simulatedTimeDate.getTime());
  }
  return new Date(Date.now() + serverTimeOffsetMs);
}

/**
 * Set jam simulasi untuk tujuan pengujian real-time kapan saja
 */
export function setSimulatedServerTime(timeStr: string | null) {
  if (!timeStr) {
    simulatedTimeDate = null;
    notifyClockChange();
    return;
  }

  // Format timeStr: "HH:mm" atau "HH:mm:ss" dalam zona waktu WIB (Asia/Jakarta, UTC+7)
  const now = new Date(Date.now() + serverTimeOffsetMs);
  const wibNow = new Date(now.getTime() + 7 * 3600 * 1000);
  const parts = timeStr.split(':').map(Number);
  const hours = parts[0] || 0;
  const minutes = parts[1] || 0;
  const seconds = parts[2] || 0;

  const simWibMs = Date.UTC(
    wibNow.getUTCFullYear(),
    wibNow.getUTCMonth(),
    wibNow.getUTCDate(),
    hours,
    minutes,
    seconds,
    0
  );
  simulatedTimeDate = new Date(simWibMs - 7 * 3600 * 1000);
  notifyClockChange();
}

export function isSimulationActive(): boolean {
  return simulatedTimeDate !== null;
}

/**
 * Konversi string waktu "HH:mm" atau "HH:mm:ss" ke menit dari 00:00
 */
export function timeStringToMinutes(timeStr: string): number {
  const [h, m] = timeStr.replace('.', ':').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function timeStringToSeconds(timeStr: string, endOfMinuteIfShort = false): number {
  const cleaned = String(timeStr || '').replace('.', ':').replace(/[^0-9:]/g, '');
  const parts = cleaned.split(':').filter(Boolean).map(Number);
  const h = parts[0] || 0;
  const m = parts[1] || 0;
  const s = parts.length >= 3 ? (parts[2] || 0) : (endOfMinuteIfShort ? 59 : 0);
  return h * 3600 + m * 60 + s;
}

/**
 * Event notifier saat jam berubah atau data tersinkron
 */
const CLOCK_EVENT_NAME = 'sim_salaf_clock_tick';
function notifyClockChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CLOCK_EVENT_NAME, { detail: getServerTime() }));
  }
}

/**
 * Evaluasi Status Presensi Berdasarkan Jam Server Terkini
 *
 * Parameter options dapat digunakan untuk custom batas atau bypass pengujian
 */
export function checkPresensiSchedule(
  customDate?: Date,
  options?: {
    bypassActive?: boolean;
    customSchedules?: ScheduleWindow[];
    toleransiMenit?: number; // Toleransi keterlambatan tambahan jika diatur
    settings?: any; // AppSettings dinamis dari Option Panel
  }
): PresensiCheckResult {
  const serverTime = customDate || getServerTime();

  // Hitung waktu WIB (Asia/Jakarta, UTC+7) dengan getter UTC agar kebal timezone browser
  const wibDate = toWibDate(serverTime);

  const hours = wibDate.getUTCHours();
  const minutes = wibDate.getUTCMinutes();
  const seconds = wibDate.getUTCSeconds();

  const currentSeconds = hours * 3600 + minutes * 60 + seconds;

  const pad = (n: number) => String(n).padStart(2, '0');
  const wibTimeStr = `${pad(hours)}:${pad(minutes)}:${pad(seconds)} WIB`;
  const wibClockShort = `${pad(hours)}:${pad(minutes)}`;
  const todayIso = `${wibDate.getUTCFullYear()}-${pad(wibDate.getUTCMonth() + 1)}-${pad(wibDate.getUTCDate())}`;

  const dayInfo = getPesantrenDayInfo(serverTime);
  const { calendarDayName, malamDayName, malamDescription, isNightSession } = dayInfo;
  const currentDayName = isNightSession ? malamDayName : calendarDayName;

  // Mode Pengujian Bebas (Bypass)
  if (options?.bypassActive) {
    return {
      serverTime,
      wibTimeStr,
      wibClockShort,
      todayIso,
      currentDayName,
      calendarDayName,
      malamDayName,
      malamDescription,
      isNightSession,
      isActive: true,
      tingkat: isNightSession ? 'ALIYAH' : 'TSANAWIYAH',
      sesi: 'Uji Coba Bebas',
      jamKe: 1,
      status: 'Hadir',
      isLate: false,
      keterangan: 'Mode Uji Coba Bebas Aktif (Jam Dilewati)',
      buttonDisabled: false,
      buttonLabel: 'PRESENSI HADIR SEKARANG (UJI COBA)',
      buttonColorClass: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/60 ring-2 ring-emerald-400',
      isSimulated: isSimulationActive()
    };
  }

  // Ambil konfigurasi jam dari settings Option Panel atau default resmi
  const cfg = options?.settings || {};
  const ts1Mulai = cfg.jam_tsanawiyah_1_mulai || '08:00';
  const ts1Batas = cfg.jam_tsanawiyah_1_batas_hadir || '08:30';
  const ts2Mulai = cfg.jam_tsanawiyah_2_mulai || '09:45';
  const ts2Batas = cfg.jam_tsanawiyah_2_batas_hadir || '10:15';
  const tsSelesai = cfg.jam_tsanawiyah_selesai || cfg.jam_tsanawiyah_2_selesai || cfg.jam_tsanawiyah_1_selesai || '12:30';

  const al1Mulai = cfg.jam_aliyah_1_mulai || '19:00';
  const al1Batas = cfg.jam_aliyah_1_batas_hadir || '19:30';
  const al2Mulai = cfg.jam_aliyah_2_mulai || '21:00';
  const al2Batas = cfg.jam_aliyah_2_batas_hadir || '21:30';
  const alSelesai = cfg.jam_aliyah_selesai || cfg.jam_aliyah_2_selesai || cfg.jam_aliyah_1_selesai || '23:00';

  const ts1StartSec = timeStringToSeconds(ts1Mulai);
  const ts1BatasSec = timeStringToSeconds(ts1Batas, true);
  const ts2StartSec = timeStringToSeconds(ts2Mulai);
  const ts2BatasSec = timeStringToSeconds(ts2Batas, true);
  const tsEndSec = timeStringToSeconds(tsSelesai, true);

  const al1StartSec = timeStringToSeconds(al1Mulai);
  const al1BatasSec = timeStringToSeconds(al1Batas, true);
  const al2StartSec = timeStringToSeconds(al2Mulai);
  const al2BatasSec = timeStringToSeconds(al2Batas, true);
  const alEndSec = timeStringToSeconds(alSelesai, true);

  // 1. EVALUASI JADWAL TSANAWIYAH (RENTANG KESELURUHAN: 08.00 - 12.30)
  if (currentSeconds >= ts1StartSec && currentSeconds <= tsEndSec) {
    const isJam2 = currentSeconds >= ts2StartSec;
    const jamKe = isJam2 ? 2 : 1;
    const sesi = isJam2 ? 'Jam Ke-2 (Siang)' : 'Jam Ke-1 (Pagi)';
    const batasSec = isJam2 ? ts2BatasSec : ts1BatasSec;
    const batasStr = isJam2 ? ts2Batas : ts1Batas;

    // Lewat batas waktu -> dihitung TERLAMBAT, tapi TETAP BISA ABSEN sampai jam selesai (12.30)
    const isLate = currentSeconds > batasSec;
    const status: 'Hadir' | 'Terlambat' = isLate ? 'Terlambat' : 'Hadir';

    const keterangan = isLate
      ? `Terlambat (Presensi pukul ${wibClockShort} WIB, batas tepat waktu: ${batasStr} WIB)`
      : `Hadir Tepat Waktu (Presensi pukul ${wibClockShort} WIB, sebelum batas ${batasStr} WIB)`;

    const scheduleObj: ScheduleWindow = {
      tingkat: 'TSANAWIYAH',
      sesi,
      jamKe,
      mulai: isJam2 ? ts2Mulai : ts1Mulai,
      batasAwal: batasStr,
      selesai: tsSelesai
    };

    return {
      serverTime,
      wibTimeStr,
      wibClockShort,
      todayIso,
      currentDayName: calendarDayName,
      calendarDayName,
      malamDayName,
      malamDescription,
      isNightSession: false,
      isActive: true,
      tingkat: 'TSANAWIYAH',
      sesi,
      jamKe,
      status,
      isLate,
      keterangan,
      jadwalAktif: scheduleObj,
      buttonDisabled: false,
      buttonLabel: isLate
        ? `PRESENSI TERLAMBAT (TSANAWIYAH - ${wibClockShort} WIB)`
        : `PRESENSI HADIR TEPAT WAKTU (TSANAWIYAH)`,
      buttonColorClass: isLate
        ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/60 ring-2 ring-amber-400 animate-pulse'
        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/60 ring-2 ring-emerald-400',
      isSimulated: isSimulationActive()
    };
  }

  // 2. EVALUASI JADWAL ALIYAH (RENTANG KESELURUHAN: 19.00 - 23.00)
  if (currentSeconds >= al1StartSec && currentSeconds <= alEndSec) {
    const isJam2 = currentSeconds >= al2StartSec;
    const jamKe = isJam2 ? 2 : 1;
    const sesi = isJam2 ? 'Jam Ke-2 (Malam)' : 'Jam Ke-1 (Malam)';
    const batasSec = isJam2 ? al2BatasSec : al1BatasSec;
    const batasStr = isJam2 ? al2Batas : al1Batas;

    // Lewat batas waktu -> dihitung TERLAMBAT, tapi TETAP BISA ABSEN sampai jam selesai (23.00)
    const isLate = currentSeconds > batasSec;
    const status: 'Hadir' | 'Terlambat' = isLate ? 'Terlambat' : 'Hadir';

    const keterangan = isLate
      ? `Terlambat (Presensi pukul ${wibClockShort} WIB, batas tepat waktu: ${batasStr} WIB)`
      : `Hadir Tepat Waktu (Presensi pukul ${wibClockShort} WIB, sebelum batas ${batasStr} WIB)`;

    const scheduleObj: ScheduleWindow = {
      tingkat: 'ALIYAH',
      sesi,
      jamKe,
      mulai: isJam2 ? al2Mulai : al1Mulai,
      batasAwal: batasStr,
      selesai: alSelesai
    };

    return {
      serverTime,
      wibTimeStr,
      wibClockShort,
      todayIso,
      currentDayName: malamDayName,
      calendarDayName,
      malamDayName,
      malamDescription,
      isNightSession: true,
      isActive: true,
      tingkat: 'ALIYAH',
      sesi,
      jamKe,
      status,
      isLate,
      keterangan,
      jadwalAktif: scheduleObj,
      buttonDisabled: false,
      buttonLabel: isLate
        ? `PRESENSI TERLAMBAT (ALIYAH - ${wibClockShort} WIB)`
        : `PRESENSI HADIR TEPAT WAKTU (ALIYAH)`,
      buttonColorClass: isLate
        ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/60 ring-2 ring-amber-400 animate-pulse'
        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/60 ring-2 ring-emerald-400',
      isSimulated: isSimulationActive()
    };
  }

  // 3. DI LUAR JADWAL (DI LUAR 08.00-12.30 & DI LUAR 19.00-23.00):
  // Tombol hadir tidak berfungsi
  let jadwalBerikutnya: PresensiCheckResult['jadwalBerikutnya'] = undefined;
  if (currentSeconds < ts1StartSec) {
    const diffMin = Math.round((ts1StartSec - currentSeconds) / 60);
    jadwalBerikutnya = {
      label: 'TSANAWIYAH (Jam Ke-1 Pagi)',
      jamMulai: `${ts1Mulai} WIB`,
      sisaWaktuText: diffMin > 60 ? `${Math.floor(diffMin / 60)} jam ${diffMin % 60} menit lagi` : `${diffMin} menit lagi`
    };
  } else if (currentSeconds < al1StartSec) {
    const diffMin = Math.round((al1StartSec - currentSeconds) / 60);
    jadwalBerikutnya = {
      label: `ALIYAH (Jam Ke-1 ${malamDayName})`,
      jamMulai: `${al1Mulai} WIB`,
      sisaWaktuText: diffMin > 60 ? `${Math.floor(diffMin / 60)} jam ${diffMin % 60} menit lagi` : `${diffMin} menit lagi`
    };
  } else {
    jadwalBerikutnya = {
      label: 'TSANAWIYAH (Pagi Besok)',
      jamMulai: `${ts1Mulai} WIB`,
      sisaWaktuText: 'Besok Pagi'
    };
  }

  return {
    serverTime,
    wibTimeStr,
    wibClockShort,
    todayIso,
    currentDayName,
    calendarDayName,
    malamDayName,
    malamDescription,
    isNightSession,
    isActive: false,
    tingkat: '-',
    sesi: 'Di Luar Jadwal',
    jamKe: 0,
    status: 'Hadir',
    isLate: false,
    keterangan: `Di luar jam absensi resmi (Tsanawiyah: ${ts1Mulai} - ${tsSelesai} | Aliyah: ${al1Mulai} - ${alSelesai})`,
    jadwalBerikutnya,
    buttonDisabled: true,
    buttonLabel: 'PRESENSI NONAKTIF (DI LUAR JADWAL)',
    buttonColorClass: 'bg-slate-800 border border-slate-700 text-slate-400 cursor-not-allowed opacity-60',
    isSimulated: isSimulationActive()
  };
}

/**
 * SISTEM BROADCAST REAL-TIME LINTAS KOMPONEN & LINTAS TAB
 * Menghubungkan Pengurus Dashboard langsung ke Admin Dashboard secara instan
 */
export type RealtimeAttendancePayload = {
  type: 'guru' | 'santri' | 'pengganti';
  records: any[];
  sender: string;
  timestamp: string;
};

const ATTENDANCE_CHANNEL_NAME = 'sim_salaf_attendance_realtime';
let broadcastChannel: BroadcastChannel | null = null;

try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(ATTENDANCE_CHANNEL_NAME);
  }
} catch (e) {
  console.debug('BroadcastChannel tidak didukung, menggunakan CustomEvent fallback', e);
}

/**
 * Kirim pemberitahuan data presensi baru ke seluruh komponen & tab secara real-time
 */
export function broadcastAttendanceUpdate(type: 'guru' | 'santri' | 'pengganti', records: any[], sender = 'Pengurus') {
  const payload: RealtimeAttendancePayload = {
    type,
    records,
    sender,
    timestamp: new Date().toISOString()
  };

  // 1. Simpan ke localStorage agar awet
  try {
    const key = type === 'guru' ? 'sim_absensi_guru' : type === 'santri' ? 'sim_absensi_santri' : 'sim_pengganti_requests';
    const existingStr = localStorage.getItem(key);
    const existing = existingStr ? JSON.parse(existingStr) : [];
    localStorage.setItem(key, JSON.stringify([...records, ...existing]));
  } catch (e) {
    console.warn('Gagal menyimpan cache local storage:', e);
  }

  // 2. Broadcast via BroadcastChannel (lintas tab/window)
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(payload);
    } catch (e) {
      console.warn('BroadcastChannel error:', e);
    }
  }

  // 3. Dispatch CustomEvent di window saat ini (dalam tab)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sim_attendance_realtime_event', { detail: payload }));
  }
}

/**
 * Hook / Listener untuk menerima update presensi real-time di Admin Dashboard
 */
export function subscribeAttendanceUpdates(
  callback: (payload: RealtimeAttendancePayload) => void
): () => void {
  const handleCustomEvent = (e: Event) => {
    const custom = e as CustomEvent<RealtimeAttendancePayload>;
    if (custom.detail) {
      callback(custom.detail);
    }
  };

  const handleBroadcastMessage = (ev: MessageEvent) => {
    if (ev.data && ev.data.type) {
      callback(ev.data as RealtimeAttendancePayload);
    }
  };

  const handleStorageEvent = (ev: StorageEvent) => {
    if (ev.key === 'sim_absensi_guru' && ev.newValue) {
      try {
        const parsed = JSON.parse(ev.newValue);
        callback({
          type: 'guru',
          records: parsed,
          sender: 'Storage Sync',
          timestamp: new Date().toISOString()
        });
      } catch {}
    } else if (ev.key === 'sim_absensi_santri' && ev.newValue) {
      try {
        const parsed = JSON.parse(ev.newValue);
        callback({
          type: 'santri',
          records: parsed,
          sender: 'Storage Sync',
          timestamp: new Date().toISOString()
        });
      } catch {}
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('sim_attendance_realtime_event', handleCustomEvent);
    window.addEventListener('storage', handleStorageEvent);
    if (broadcastChannel) {
      broadcastChannel.addEventListener('message', handleBroadcastMessage);
    }
  }

  // Unsubscribe cleanup
  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('sim_attendance_realtime_event', handleCustomEvent);
      window.removeEventListener('storage', handleStorageEvent);
      if (broadcastChannel) {
        broadcastChannel.removeEventListener('message', handleBroadcastMessage);
      }
    }
  };
}

/**
 * Broadcast & Subscribe untuk sinkronisasi Jadwal Pelajaran Real-Time
 * Menghubungkan Tab Jadwal Pelajaran di Admin Dashboard dengan Presensi Mandiri Pengurus
 */
export function broadcastScheduleUpdate(schedules: any[], sender = 'Admin') {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('sim_jadwal', JSON.stringify(schedules));
    } catch {}
    window.dispatchEvent(new CustomEvent('sim_schedule_realtime_event', { detail: { schedules, sender } }));
    window.dispatchEvent(new Event('storage'));
  }
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'jadwal_sync', schedules, sender });
    } catch {}
  }
}

export function subscribeScheduleUpdates(callback: (schedules: any[]) => void): () => void {
  const handleCustomEvent = (e: Event) => {
    const custom = e as CustomEvent<{ schedules: any[] }>;
    if (custom.detail && custom.detail.schedules) {
      callback(custom.detail.schedules);
    }
  };

  const handleBroadcastMessage = (ev: MessageEvent) => {
    if (ev.data && ev.data.type === 'jadwal_sync' && ev.data.schedules) {
      callback(ev.data.schedules);
    }
  };

  const handleStorage = (ev: StorageEvent) => {
    if (ev.key === 'sim_jadwal' && ev.newValue) {
      try {
        const parsed = JSON.parse(ev.newValue);
        if (Array.isArray(parsed)) {
          callback(parsed);
        }
      } catch {}
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('sim_schedule_realtime_event', handleCustomEvent);
    window.addEventListener('storage', handleStorage);
    if (broadcastChannel) {
      broadcastChannel.addEventListener('message', handleBroadcastMessage);
    }
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('sim_schedule_realtime_event', handleCustomEvent);
      window.removeEventListener('storage', handleStorage);
      if (broadcastChannel) {
        broadcastChannel.removeEventListener('message', handleBroadcastMessage);
      }
    }
  };
}

/**
 * Broadcast & Subscribe untuk sinkronisasi Pengajuan Izin Guru Real-Time
 * Menghubungkan Pengajuan Izin di Pengurus Dashboard langsung ke Admin Dashboard
 */
export function broadcastIzinMengajarUpdate(items: any[] | any, sender = 'Pengurus') {
  const records = Array.isArray(items) ? items : [items];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('sim_izin_mengajar', JSON.stringify(records));
    } catch {}
    window.dispatchEvent(new CustomEvent('sim_izin_mengajar_realtime_event', { detail: { items: records, sender } }));
  }
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'izin_mengajar_sync', items: records, sender });
    } catch {}
  }
}

export function subscribeIzinMengajarUpdates(callback: (items: any[], sender: string) => void): () => void {
  const handleCustomEvent = (e: Event) => {
    const custom = e as CustomEvent<{ items: any[]; sender: string }>;
    if (custom.detail && custom.detail.items) {
      callback(custom.detail.items, custom.detail.sender || 'Broadcast');
    }
  };

  const handleBroadcastMessage = (ev: MessageEvent) => {
    if (ev.data && ev.data.type === 'izin_mengajar_sync' && ev.data.items) {
      callback(ev.data.items, ev.data.sender || 'BroadcastChannel');
    }
  };

  const handleStorage = (ev: StorageEvent) => {
    if (ev.key === 'sim_izin_mengajar' && ev.newValue) {
      try {
        const parsed = JSON.parse(ev.newValue);
        if (Array.isArray(parsed)) {
          callback(parsed, 'Storage Sync');
        }
      } catch {}
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('sim_izin_mengajar_realtime_event', handleCustomEvent);
    window.addEventListener('storage', handleStorage);
    if (broadcastChannel) {
      broadcastChannel.addEventListener('message', handleBroadcastMessage);
    }
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('sim_izin_mengajar_realtime_event', handleCustomEvent);
      window.removeEventListener('storage', handleStorage);
      if (broadcastChannel) {
        broadcastChannel.removeEventListener('message', handleBroadcastMessage);
      }
    }
  };
}

/**
 * Broadcast & Subscribe untuk sinkronisasi Setoran Nadzhom Real-Time
 * Menghubungkan input setoran nadzhom Pengurus langsung ke Tab Nadzhom Admin
 */
export function broadcastNadzhomUpdate(records: any[] | any, sender = 'Pengurus') {
  const list = Array.isArray(records) ? records : [records];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('sim_nadzhom', JSON.stringify(list));
    } catch {}
    window.dispatchEvent(new CustomEvent('sim_nadzhom_realtime_event', { detail: { records: list, sender } }));
  }
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'nadzhom_sync', records: list, sender });
    } catch {}
  }
}

export function subscribeNadzhomUpdates(callback: (records: any[], sender: string) => void): () => void {
  const handleCustomEvent = (e: Event) => {
    const custom = e as CustomEvent<{ records: any[]; sender: string }>;
    if (custom.detail && custom.detail.records) {
      callback(custom.detail.records, custom.detail.sender || 'Broadcast');
    }
  };

  const handleBroadcastMessage = (ev: MessageEvent) => {
    if (ev.data && ev.data.type === 'nadzhom_sync' && ev.data.records) {
      callback(ev.data.records, ev.data.sender || 'BroadcastChannel');
    }
  };

  const handleStorage = (ev: StorageEvent) => {
    if (ev.key === 'sim_nadzhom' && ev.newValue) {
      try {
        const parsed = JSON.parse(ev.newValue);
        if (Array.isArray(parsed)) {
          callback(parsed, 'Storage Sync');
        }
      } catch {}
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('sim_nadzhom_realtime_event', handleCustomEvent);
    window.addEventListener('storage', handleStorage);
    if (broadcastChannel) {
      broadcastChannel.addEventListener('message', handleBroadcastMessage);
    }
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('sim_nadzhom_realtime_event', handleCustomEvent);
      window.removeEventListener('storage', handleStorage);
      if (broadcastChannel) {
        broadcastChannel.removeEventListener('message', handleBroadcastMessage);
      }
    }
  };
}

/**
 * ============================================================================
 * HELPER SINKRONISASI JADWAL, IDENTITAS GURU, & MULTI-SESI HARIAN
 * Single Source of Truth untuk PengurusDashboard, AdminDashboard, dan App
 * ============================================================================
 */

const TITLE_REGEX = /\b(ustadzah|ustazah|ustadz|ustzh|ust|kh|hj|kyai|nyai|gus|ning|al-hafidz|al-hafidzah|al-hafiz|hafidz|hafizh|spdi|spd|mpd|sag|mag|lc|dr|prof|h)\b/gi;

export function normalizeTeacherName(name?: string): string {
  if (!name) return '';
  // Hapus tanda baca terlebih dahulu agar 'Ust.' / 'S.Pd.I.' / 'K.H.' bersih sebelum mencocokkan batas kata
  const noPunct = String(name)
    .toLowerCase()
    .replace(/[.,/\\()[\]{}"'`’]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return noPunct
    .replace(TITLE_REGEX, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isTeacherNameMatch(scheduleTeacherName?: string, accountTeacherName?: string): boolean {
  if (!scheduleTeacherName || !accountTeacherName) return false;
  const rawA = String(scheduleTeacherName).toLowerCase().trim();
  const rawB = String(accountTeacherName).toLowerCase().trim();
  if (!rawA || !rawB) return false;
  if (rawA === rawB) return true;

  const cleanA = normalizeTeacherName(rawA);
  const cleanB = normalizeTeacherName(rawB);
  if (!cleanA || !cleanB) return rawA === rawB;
  if (cleanA === cleanB) return true;

  const wordsA = cleanA.split(' ').filter(w => w.length >= 2);
  const wordsB = cleanB.split(' ').filter(w => w.length >= 2);
  if (wordsA.length === 0 || wordsB.length === 0) {
    return cleanA === cleanB;
  }

  // Cocok tepat bila salah satu nama hanya terdiri dari 1 kata (misal "Yasir" vs "Ustadz Yasir")
  if (wordsA.length === 1 && wordsB.length === 1) {
    return wordsA[0] === wordsB[0];
  }
  if (wordsA.length === 1 && wordsB.includes(wordsA[0])) {
    return true;
  }
  if (wordsB.length === 1 && wordsA.includes(wordsB[0])) {
    return true;
  }

  // Jika keduanya multi-kata: cocok jika semua kata pada nama yang lebih pendek ada pada nama yang lebih panjang
  // atau minimal 2 kata signifikan sama persis
  const shorter = wordsA.length <= wordsB.length ? wordsA : wordsB;
  const longer = wordsA.length <= wordsB.length ? wordsB : wordsA;
  const matchedWords = shorter.filter(w => longer.includes(w));

  if (matchedWords.length === shorter.length && shorter.length >= 2) {
    return true;
  }
  return matchedWords.length >= 2;
}

export function collectTeacherIdentity(
  pengurus: { id?: string; guruId?: string; nama?: string },
  guruList: Array<{ id?: string; nama?: string }> = []
): { ids: Set<string>; names: Set<string> } {
  const ids = new Set<string>();
  const names = new Set<string>();

  if (pengurus.id) ids.add(String(pengurus.id).trim());
  if (pengurus.guruId) ids.add(String(pengurus.guruId).trim());
  if (pengurus.nama) {
    names.add(pengurus.nama.toLowerCase().trim());
    const norm = normalizeTeacherName(pengurus.nama);
    if (norm) names.add(norm);
  }

  for (const g of guruList || []) {
    const gId = g.id ? String(g.id).trim() : '';
    const idMatches = Boolean(gId && ids.has(gId));
    const nameMatches = Boolean(g.nama && pengurus.nama && isTeacherNameMatch(g.nama, pengurus.nama));
    if (idMatches || nameMatches) {
      if (gId) ids.add(gId);
      if (g.nama) {
        names.add(g.nama.toLowerCase().trim());
        const norm = normalizeTeacherName(g.nama);
        if (norm) names.add(norm);
      }
    }
  }

  return { ids, names };
}

export function isScheduleOwnedByTeacher(
  jadwal: { ustadzId?: string; nama?: string; ustadz?: string },
  pengurus: { id?: string; guruId?: string; nama?: string },
  guruList: Array<{ id?: string; nama?: string }> = []
): boolean {
  const { ids, names } = collectTeacherIdentity(pengurus, guruList);
  if (jadwal.ustadzId && ids.has(String(jadwal.ustadzId).trim())) {
    return true;
  }

  const schedName = jadwal.nama || jadwal.ustadz || '';
  if (!schedName) return false;
  if (isTeacherNameMatch(schedName, pengurus.nama)) return true;

  for (const knownName of names) {
    if (isTeacherNameMatch(schedName, knownName)) return true;
  }
  return false;
}

export function isAliyahSchedule(jadwal: { kelas?: string; hari?: string; tingkatan?: string }): boolean {
  const kelasUpper = (jadwal.kelas || '').toUpperCase();
  const tingUpper = (jadwal.tingkatan || '').toUpperCase();
  const hariUpper = normalizePesantrenDayName(jadwal.hari);
  return kelasUpper.includes('ALIYAH') || tingUpper === 'ALIYAH' || hariUpper.startsWith('MALAM');
}

export function doesScheduleMatchDay(
  jadwal: { kelas?: string; hari?: string; tingkatan?: string },
  dayInfo: PesantrenDayInfo
): boolean {
  const jHari = normalizePesantrenDayName(jadwal.hari);
  if (!jHari) return false;

  const malamToday = normalizePesantrenDayName(dayInfo.malamDayName);
  const calToday = normalizePesantrenDayName(dayInfo.calendarDayName);

  if (jHari.startsWith('MALAM')) {
    return jHari === malamToday;
  }

  const isAliyah = isAliyahSchedule(jadwal);
  if (isAliyah) {
    // Jika admin mengisi hari Aliyah dengan nama hari kalender biasa (tanpa 'MALAM'), tetap cocokkan ke hari kalender
    return jHari === malamToday || jHari === calToday;
  }

  return jHari === calToday;
}

export function parseScheduleTimeWindowSeconds(waktuStr?: string): { startSec: number; endSec: number } | null {
  if (!waktuStr) return null;
  const matches = String(waktuStr).match(/(\d{1,2})[:.](\d{2})/g);
  if (!matches || matches.length < 2) return null;

  const toSec = (hhmm: string, isEnd: boolean) => {
    const [h, m] = hhmm.replace('.', ':').split(':').map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m) || h > 23 || m > 59) return null;
    return h * 3600 + m * 60 + (isEnd ? 59 : 0);
  };

  const startSec = toSec(matches[0], false);
  const endSec = toSec(matches[1], true);
  if (startSec === null || endSec === null) return null;
  return { startSec, endSec };
}

export function getScheduleKey(j: { id?: string; kelas?: string; hari?: string; jamKe?: number | string; mapel?: string }): string {
  return j.id || `${j.kelas || ''}_${normalizePesantrenDayName(j.hari)}_${j.jamKe || 1}_${(j.mapel || '').trim()}`;
}

export function isScheduleCheckedInToday(
  schedule: { id?: string; kelas?: string; hari?: string; jamKe?: number | string; mapel?: string },
  absensiGuruList: Array<{ tanggal?: string; nama?: string; jadwalId?: string; kelas?: string; mapel?: string; jamKe?: number | string; ustadzAktualNama?: string; ustadzTerjadwalNama?: string }>,
  todayIso: string,
  pengurus: { id?: string; guruId?: string; nama?: string },
  guruList: Array<{ id?: string; nama?: string }> = []
): boolean {
  const schedKey = getScheduleKey(schedule);
  const schedMapel = (schedule.mapel || '').toLowerCase().trim();
  const schedKelas = (schedule.kelas || '').toUpperCase().trim();
  const schedJamKe = Number(schedule.jamKe || 1);

  return (absensiGuruList || []).some(rec => {
    if (rec.tanggal !== todayIso) return false;
    const ownerMatches =
      isTeacherNameMatch(rec.nama, pengurus.nama) ||
      isTeacherNameMatch(rec.ustadzAktualNama, pengurus.nama) ||
      isTeacherNameMatch(rec.ustadzTerjadwalNama, pengurus.nama) ||
      guruList.some(g => isTeacherNameMatch(g.nama, pengurus.nama) && isTeacherNameMatch(rec.nama, g.nama));
    if (!ownerMatches) return false;

    if (rec.jadwalId && (rec.jadwalId === schedule.id || rec.jadwalId === schedKey)) {
      return true;
    }

    const recKelas = (rec.kelas || '').toUpperCase().trim();
    const recMapel = (rec.mapel || '').toLowerCase().trim();
    const recJamKe = Number(rec.jamKe || 1);

    if (recKelas !== schedKelas) return false;
    if (schedMapel && recMapel && recMapel === schedMapel && recJamKe === schedJamKe) return true;
    return recJamKe === schedJamKe && (!schedMapel || !recMapel);
  });
}

export function isScheduleWindowActiveNow(
  schedule: { kelas?: string; hari?: string; jamKe?: number | string; tingkatan?: string; waktu?: string },
  activeSession: PresensiCheckResult,
  bypassActive?: boolean
): boolean {
  if (bypassActive) return true;
  if (!activeSession.isActive) return false;

  const isAliyah = isAliyahSchedule(schedule);
  const correctTingkat = activeSession.tingkat === 'ALIYAH' ? isAliyah : !isAliyah;
  if (!correctTingkat) return false;

  const schedJam = Number(schedule.jamKe || 1);
  if (schedJam === Number(activeSession.jamKe)) {
    return true;
  }

  // Dukungan untuk Jam Ke-3+ atau waktu khusus yang masih berada di dalam rentang waktu aktif WIB
  if (schedJam >= 3) {
    const parsed = parseScheduleTimeWindowSeconds(schedule.waktu);
    if (parsed) {
      const wib = toWibDate(activeSession.serverTime);
      const secNow = wib.getUTCHours() * 3600 + wib.getUTCMinutes() * 60 + wib.getUTCSeconds();
      return secNow >= parsed.startSec && secNow <= parsed.endSec;
    }
    return Number(activeSession.jamKe) >= 2;
  }

  return false;
}

