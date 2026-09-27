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
  batasAwal: string;  // e.g. "08:00"
  selesai: string;    // e.g. "08:30"
}

export const OFFICIAL_SCHEDULES: ScheduleWindow[] = [
  {
    tingkat: 'TSANAWIYAH',
    sesi: 'Pagi',
    jamKe: 1,
    mulai: '08:00',
    batasAwal: '08:00',
    selesai: '08:30'
  },
  {
    tingkat: 'ALIYAH',
    sesi: 'Sesi 1 (Malam)',
    jamKe: 1,
    mulai: '19:00',
    batasAwal: '19:00',
    selesai: '19:30'
  },
  {
    tingkat: 'ALIYAH',
    sesi: 'Sesi 2 (Malam)',
    jamKe: 2,
    mulai: '21:00',
    batasAwal: '21:00',
    selesai: '21:30'
  }
];

export interface PresensiCheckResult {
  serverTime: Date;
  wibTimeStr: string;        // HH:mm:ss WIB
  wibClockShort: string;     // HH:mm
  todayIso: string;          // YYYY-MM-DD
  currentDayName: string;    // SENIN, SELASA, dsb
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

  // Format timeStr: "HH:mm" atau "HH:mm:ss"
  const now = new Date(Date.now() + serverTimeOffsetMs);
  const parts = timeStr.split(':').map(Number);
  const hours = parts[0] || 0;
  const minutes = parts[1] || 0;
  const seconds = parts[2] || 0;

  const sim = new Date(now);
  sim.setHours(hours, minutes, seconds, 0);
  simulatedTimeDate = sim;
  notifyClockChange();
}

export function isSimulationActive(): boolean {
  return simulatedTimeDate !== null;
}

/**
 * Konversi string waktu "HH:mm" atau "HH:mm:ss" ke menit dari 00:00
 */
export function timeStringToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function timeStringToSeconds(timeStr: string): number {
  const parts = timeStr.split(':').map(Number);
  const h = parts[0] || 0;
  const m = parts[1] || 0;
  const s = parts[2] || 0;
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
  }
): PresensiCheckResult {
  const serverTime = customDate || getServerTime();

  // Waktu WIB (UTC+7)
  const hours = serverTime.getHours();
  const minutes = serverTime.getMinutes();
  const seconds = serverTime.getSeconds();

  const currentSeconds = hours * 3600 + minutes * 60 + seconds;
  const currentMinutes = hours * 60 + minutes;

  const pad = (n: number) => String(n).padStart(2, '0');
  const wibTimeStr = `${pad(hours)}:${pad(minutes)}:${pad(seconds)} WIB`;
  const wibClockShort = `${pad(hours)}:${pad(minutes)}`;
  const todayIso = serverTime.toISOString().split('T')[0];

  const daysOfWeek = ['AHAD', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
  const currentDayName = daysOfWeek[serverTime.getDay()];

  // Mode Pengujian Bebas (Bypass)
  if (options?.bypassActive) {
    return {
      serverTime,
      wibTimeStr,
      wibClockShort,
      todayIso,
      currentDayName,
      isActive: true,
      tingkat: 'TSANAWIYAH',
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

  const schedules = options?.customSchedules || OFFICIAL_SCHEDULES;

  // Cari jadwal yang sedang aktif di jam ini
  for (const sch of schedules) {
    const startSec = timeStringToSeconds(sch.mulai);
    const endSec = timeStringToSeconds(sch.selesai);
    const batasSec = timeStringToSeconds(sch.batasAwal);

    // Cek apakah waktu saat ini berada di dalam jendela presensi (mulai s/d selesai)
    if (currentSeconds >= startSec && currentSeconds <= endSec) {
      // Sesuai Permintaan:
      // "Jika waktu presensi melewati batas awal, ubah status otomatis ke 'Terlambat'"
      // Batas awal Tsanawiyah: 08.00 (lewat 08.00 -> Terlambat)
      // Batas awal Aliyah: 19.00 & 21.00 (lewat 19.00/21.00 -> Terlambat)
      // Catatan: Jika tepat pada menit awal (misal 08:00:00 s.d 08:00:59 atau dengan toleransi 0 detik),
      // jika currentSeconds > batasSec -> Terlambat, jika == batasSec -> Hadir
      const isLate = currentSeconds > batasSec;
      const status: 'Hadir' | 'Terlambat' = isLate ? 'Terlambat' : 'Hadir';

      const sisaDetik = endSec - currentSeconds;
      const sisaMenit = Math.floor(sisaDetik / 60);

      const keterangan = isLate
        ? `Terlambat (Presensi dilakukan pukul ${wibClockShort} WIB, melewati batas awal ${sch.batasAwal} WIB)`
        : `Hadir Tepat Waktu (Presensi pukul ${wibClockShort} WIB, tepat pada batas awal ${sch.batasAwal} WIB)`;

      const buttonLabel = isLate
        ? `PRESENSI TERLAMBAT (${sch.tingkat} - ${wibClockShort} WIB)`
        : `PRESENSI HADIR TEPAT WAKTU (${sch.tingkat})`;

      const buttonColorClass = isLate
        ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/60 ring-2 ring-amber-400 animate-pulse'
        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/60 ring-2 ring-emerald-400';

      return {
        serverTime,
        wibTimeStr,
        wibClockShort,
        todayIso,
        currentDayName,
        isActive: true,
        tingkat: sch.tingkat,
        sesi: sch.sesi,
        jamKe: sch.jamKe,
        status,
        isLate,
        keterangan,
        jadwalAktif: sch,
        buttonDisabled: false,
        buttonLabel,
        buttonColorClass,
        isSimulated: isSimulationActive()
      };
    }
  }

  // DI LUAR JADWAL TERSEBUT:
  // "Di luar jadwal tersebut, nonaktifkan fungsi tombol agar santri/ustadz tidak bisa melakukan presensi."
  let jadwalBerikutnya: PresensiCheckResult['jadwalBerikutnya'] = undefined;
  for (const sch of schedules) {
    const startSec = timeStringToSeconds(sch.mulai);
    if (currentSeconds < startSec) {
      const diffMin = Math.round((startSec - currentSeconds) / 60);
      jadwalBerikutnya = {
        label: `${sch.tingkat} (${sch.sesi})`,
        jamMulai: `${sch.mulai} WIB`,
        sisaWaktuText: diffMin > 60 ? `${Math.floor(diffMin / 60)} jam ${diffMin % 60} menit lagi` : `${diffMin} menit lagi`
      };
      break;
    }
  }

  // Jika semua jadwal hari ini telah lewat
  if (!jadwalBerikutnya) {
    jadwalBerikutnya = {
      label: 'TSANAWIYAH (Pagi Besok)',
      jamMulai: '08:00 WIB',
      sisaWaktuText: 'Besok Pagi'
    };
  }

  return {
    serverTime,
    wibTimeStr,
    wibClockShort,
    todayIso,
    currentDayName,
    isActive: false,
    tingkat: '-',
    sesi: 'Di Luar Jadwal',
    jamKe: 0,
    status: 'Hadir',
    isLate: false,
    keterangan: 'Di luar jadwal presensi resmi (Tsanawiyah: 08.00-08.30 | Aliyah: 19.00-19.30 & 21.00-21.30)',
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
  type: 'guru' | 'santri';
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
export function broadcastAttendanceUpdate(type: 'guru' | 'santri', records: any[], sender = 'Pengurus') {
  const payload: RealtimeAttendancePayload = {
    type,
    records,
    sender,
    timestamp: new Date().toISOString()
  };

  // 1. Simpan ke localStorage agar awet
  try {
    const key = type === 'guru' ? 'sim_absensi_guru' : 'sim_absensi_santri';
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
