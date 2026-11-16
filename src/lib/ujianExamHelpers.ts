import {
  BacaKitabClassConfig,
  KoreksianBatasMateriRow,
  KurikulumKitabRecord,
  MuhafadzohAngkatanRankingRow,
  MuhafadzohClassTargetConfig,
  MuhafadzohRekapRowConfig,
  Santri,
  UjianExamGlobalConfig,
  UjianTakziranRecord,
  UjianTakziranSettings
} from '../types';

export const KELAS_MADRASAH_LIST: string[] = [
  '1 TSANAWIYAH',
  '2 TSANAWIYAH',
  '3 TSANAWIYAH',
  '1 ALIYAH',
  '2 ALIYAH',
  '3 ALIYAH'
];

export const DEFAULT_MUHAFADZOH_TARGETS: MuhafadzohClassTargetConfig[] = [
  {
    kelas: '1 TSANAWIYAH',
    namaNadzhomGanjil: 'Nadzhom Aqidatul Awam (Bait 1-29)',
    targetGanjil: 29,
    namaNadzhomGenap: 'Nadzhom Aqidatul Awam (Khatam 57 Bait)',
    targetGenap: 57,
    catatan: 'Dasar Aqidah Ahlussunnah wal Jamaah'
  },
  {
    kelas: '2 TSANAWIYAH',
    namaNadzhomGanjil: 'Nadzhom Al-Maqsud (Bait 1-55)',
    targetGanjil: 55,
    namaNadzhomGenap: 'Nadzhom Al-Maqsud (Bait 56-113)',
    targetGenap: 113,
    catatan: 'Kaidah Ilmu Shorof Dasar'
  },
  {
    kelas: '3 TSANAWIYAH',
    namaNadzhomGanjil: 'Nadzhom Al-Imrithi (Bait 1-125)',
    targetGanjil: 125,
    namaNadzhomGenap: 'Nadzhom Al-Imrithi (Khatam 254 Bait)',
    targetGenap: 254,
    catatan: 'Nahwu Menengah & Wisuda Imrithi'
  },
  {
    kelas: '1 ALIYAH',
    namaNadzhomGanjil: 'Nadzhom Alfiyah Ibnu Malik (Bait 1-175)',
    targetGanjil: 175,
    namaNadzhomGenap: 'Nadzhom Alfiyah Ibnu Malik (Bait 176-350)',
    targetGenap: 350,
    catatan: 'Alfiyah Jilid 1 (Muqaddimah - Af\'al)'
  },
  {
    kelas: '2 ALIYAH',
    namaNadzhomGanjil: 'Nadzhom Alfiyah Ibnu Malik (Bait 351-525)',
    targetGanjil: 525,
    namaNadzhomGenap: 'Nadzhom Alfiyah Ibnu Malik (Bait 526-700)',
    targetGenap: 700,
    catatan: 'Alfiyah Jilid 2 (Ibtida - Tafdhil)'
  },
  {
    kelas: '3 ALIYAH',
    namaNadzhomGanjil: 'Nadzhom Alfiyah Ibnu Malik (Bait 701-850)',
    targetGanjil: 850,
    namaNadzhomGenap: 'Nadzhom Alfiyah Ibnu Malik (Khatam 1002 Bait)',
    targetGenap: 1002,
    catatan: 'Khataman Alfiyah & Baiquniyyah'
  }
];

export const DEFAULT_BACA_KITAB_PER_KELAS: BacaKitabClassConfig[] = [
  { kelas: '1 TSANAWIYAH', kitabStandar: 'Safinatun Naja & Mabadi Fiqh', nilaiRataRataMinimal: 75 },
  { kelas: '2 TSANAWIYAH', kitabStandar: 'Sullamut Taufiq & Matan Taqrib', nilaiRataRataMinimal: 75 },
  { kelas: '3 TSANAWIYAH', kitabStandar: 'Fathul Qorib Al-Mujib (Juz 1)', nilaiRataRataMinimal: 78 },
  { kelas: '1 ALIYAH', kitabStandar: 'Fathul Qorib Al-Mujib (Juz 2)', nilaiRataRataMinimal: 80 },
  { kelas: '2 ALIYAH', kitabStandar: 'Fathul Wahhab (Juz 1)', nilaiRataRataMinimal: 80 },
  { kelas: '3 ALIYAH', kitabStandar: 'Fathul Wahhab (Juz 2) & Mahalli', nilaiRataRataMinimal: 82 }
];

export const DEFAULT_UJIAN_TAKZIRAN_SETTINGS: UjianTakziranSettings = {
  durasiPengumpulanHari: 3,
  tanggalBatasDefault: '',
  tingkatAwal: 'Ringan',
  tingkatJikaTerlambat: 'Sedang',
  namaLembaga: 'PONDOK PESANTREN SALAF AL-MALIKI',
  namaMadrasah: 'MADRASAH DINIYAH SALAFIYAH AL-MALIKI',
  subKopSurat: 'PANITIA EVALUASI UJIAN & DISIPLIN AKADEMIK SANTRI',
  alamatLembaga: 'Kompleks Pondok Pesantren Salaf Al-Maliki • Pusat Administrasi Madrasah Diniyah',
  formatNomorSurat: '{NO}/TKZ-UJIAN/MD-ALMALIKI/{ROMAWI}/{TAHUN}',
  judulSurat: 'SURAT KARTU TAKZIRAN & HER UJIAN MADRASAH DINIYAH',
  ketentuanTakziranMuhafadzoh:
    'Santri wajib menyetorkan hafalan nadzhom yang belum mencapai target dalam ujian Her Muhafadzoh serta menyelesaikan takziran hafalan/kitabah sebelum batas waktu yang tercantum.',
  ketentuanTakziranBacaKitab:
    'Santri yang memperoleh nilai Baca Kitab di bawah standar rata-rata madrasah wajib mengikuti bimbingan qiroatul kutub & ujian ulang serta menyelesaikan takziran akademik.',
  ketentuanTakziranKoreksian:
    'Santri yang koreksian kitabnya berstatus Naqish (Makna Kurang) wajib melengkapi makna gandul Pegon sesuai batas materi kurikulum dan menyerahkan kembali kepada pentashih.',
  isiPeringatanBatasAkhir:
    'PERHATIAN: Kartu Surat Takziran ini dinyatakan TIDAK BERLAKU apabila melewati batas akhir tanggal pengumpulan. Santri yang tidak mengumpulkan sampai batas waktu dianggap tidak mengerjakan dan sanksi takziran OTOMATIS NAIK TINGKATAN menjadi SEDANG.',
  jabatanPenandatangan1: 'Wali Kelas',
  namaPenandatangan1: 'Ust. Wali Kelas Madrasah',
  jabatanPenandatangan2: 'Panitia Ujian / Pentashih',
  namaPenandatangan2: 'Ust. Muhammad Ilyas Al-Hafidz',
  jabatanPenandatangan3: 'Ketua Madrasah',
  namaPenandatangan3: 'KH. / Ust. Kepala Madrasah Diniyah',
  kotaSurat: 'Al-Maliki',
  ukuranKertas: 'A4'
};

export const DEFAULT_REKAP_MUHAFADZOH_ROWS: MuhafadzohRekapRowConfig[] = [
  {
    id: 'RKP-3TSN-2526',
    tahunAjaran: '2025/2026',
    kelas: '3 TSANAWIYAH',
    namaNadzhom: 'Nadzhom Al-Imrithi',
    targetBait: 254,
    totalSantri: 8,
    putra: 6,
    putri: 2,
    jayyid: 8,
    mutawasit: 0,
    rodi: 0,
    persentaseLulus: 100,
    keterangan: 'Seluruh santri khatam sesuai target',
    isManualOverride: false
  },
  {
    id: 'RKP-3TSN-2627',
    tahunAjaran: '2026/2027',
    kelas: '3 TSANAWIYAH',
    namaNadzhom: 'Nadzhom Al-Imrithi',
    targetBait: 254,
    totalSantri: 11,
    putra: 9,
    putri: 2,
    jayyid: 10,
    mutawasit: 0,
    rodi: 1,
    persentaseLulus: 90.9,
    keterangan: '1 santri mengikuti Her Muhafadzoh',
    isManualOverride: false
  }
];

export const DEFAULT_ANGKATAN_RANKING_ROWS: MuhafadzohAngkatanRankingRow[] = [
  {
    id: 'RNK-2024',
    angkatan: 'Angkatan 2024',
    kelas: '3 TSANAWIYAH',
    tahunAjaran: '2025/2026',
    namaNadzhom: 'Nadzhom Al-Imrithi',
    totalSantri: 8,
    putra: 6,
    putri: 2,
    jayyid: 8,
    mutawasit: 0,
    rodi: 0,
    rataRataHafalan: 254,
    persentaseCapaian: 100,
    gelarPrestasi: 'Angkatan Teladan Prima (100% Target)',
    catatan: 'Khataman 254 bait tepat waktu',
    isManualOverride: false
  },
  {
    id: 'RNK-2025',
    angkatan: 'Angkatan 2025',
    kelas: '3 TSANAWIYAH',
    tahunAjaran: '2026/2027',
    namaNadzhom: 'Nadzhom Al-Imrithi',
    totalSantri: 11,
    putra: 9,
    putri: 2,
    jayyid: 10,
    mutawasit: 0,
    rodi: 1,
    rataRataHafalan: 242,
    persentaseCapaian: 90.9,
    gelarPrestasi: 'Angkatan Mumtaz Berprestasi',
    catatan: 'Mayoritas tuntas sebelum pekan ujian',
    isManualOverride: false
  },
  {
    id: 'RNK-2023',
    angkatan: 'Angkatan 2023',
    kelas: '3 TSANAWIYAH',
    tahunAjaran: '2024/2025',
    namaNadzhom: 'Nadzhom Al-Imrithi',
    totalSantri: 9,
    putra: 7,
    putri: 2,
    jayyid: 8,
    mutawasit: 1,
    rodi: 0,
    rataRataHafalan: 238,
    persentaseCapaian: 97.8,
    gelarPrestasi: 'Angkatan Mumtaz',
    catatan: 'Konsisten setoran harian',
    isManualOverride: false
  }
];

export function buildDefaultKoreksianBatasMateriFromKurikulum(
  kurikulumList: KurikulumKitabRecord[]
): KoreksianBatasMateriRow[] {
  const rows: KoreksianBatasMateriRow[] = [];
  const grouped = new Map<string, KurikulumKitabRecord[]>();

  KELAS_MADRASAH_LIST.forEach((k) => grouped.set(k, []));
  kurikulumList.forEach((item) => {
    const k = item.kelas || '1 TSANAWIYAH';
    if (!grouped.has(k)) grouped.set(k, []);
    grouped.get(k)!.push(item);
  });

  grouped.forEach((items, kelas) => {
    items.forEach((item, idx) => {
      rows.push({
        id: `BM-${item.id}`,
        kelas,
        no: idx + 1,
        pelajaran: `${item.mapel} (${item.kitab})`,
        kitab: item.kitab,
        mulaiMateri: 'Halaman 1 / Muqaddimah',
        batasAkhir: item.targetSemester || 'Sesuai Target Semester',
        kurikulumId: item.id
      });
    });
  });

  return rows;
}

export function createDefaultUjianConfig(
  kurikulumList: KurikulumKitabRecord[] = []
): UjianExamGlobalConfig {
  return {
    muhafadzohTargets: DEFAULT_MUHAFADZOH_TARGETS,
    muhafadzohRekapRows: DEFAULT_REKAP_MUHAFADZOH_ROWS,
    muhafadzohAngkatanRanking: DEFAULT_ANGKATAN_RANKING_ROWS,
    bacaKitabRataRataGlobal: 75,
    bacaKitabPerKelas: DEFAULT_BACA_KITAB_PER_KELAS,
    koreksianBatasMateri: buildDefaultKoreksianBatasMateriFromKurikulum(kurikulumList),
    takziranSettings: DEFAULT_UJIAN_TAKZIRAN_SETTINGS,
    updatedAt: new Date().toISOString()
  };
}

export function mergeUjianConfigWithDefaults(
  loaded: Partial<UjianExamGlobalConfig> | null | undefined,
  kurikulumList: KurikulumKitabRecord[] = []
): UjianExamGlobalConfig {
  const def = createDefaultUjianConfig(kurikulumList);
  if (!loaded || typeof loaded !== 'object') return def;

  // Sinkronkan juga baris koreksian baru dari kurikulum jika belum pernah ditambahkan,
  // sambil mempertahankan editan Admin pada row yang sudah ada
  const existingMateri =
    Array.isArray(loaded.koreksianBatasMateri) && loaded.koreksianBatasMateri.length > 0
      ? loaded.koreksianBatasMateri
      : def.koreksianBatasMateri;

  const existingByKurikulumId = new Set(
    existingMateri.map((r) => r.kurikulumId).filter(Boolean)
  );
  const mergedMateri = [...existingMateri];
  if (Array.isArray(loaded.koreksianBatasMateri)) {
    def.koreksianBatasMateri.forEach((kRow) => {
      if (kRow.kurikulumId && !existingByKurikulumId.has(kRow.kurikulumId)) {
        // Tambahkan jika belum ada kurikulum item tersebut
        const sameClassCount = mergedMateri.filter((m) => m.kelas === kRow.kelas).length;
        mergedMateri.push({ ...kRow, no: sameClassCount + 1 });
      }
    });
  }

  return {
    muhafadzohTargets:
      Array.isArray(loaded.muhafadzohTargets) && loaded.muhafadzohTargets.length > 0
        ? loaded.muhafadzohTargets
        : def.muhafadzohTargets,
    muhafadzohRekapRows:
      Array.isArray(loaded.muhafadzohRekapRows)
        ? loaded.muhafadzohRekapRows
        : def.muhafadzohRekapRows,
    muhafadzohAngkatanRanking:
      Array.isArray(loaded.muhafadzohAngkatanRanking)
        ? loaded.muhafadzohAngkatanRanking
        : def.muhafadzohAngkatanRanking,
    bacaKitabRataRataGlobal:
      typeof loaded.bacaKitabRataRataGlobal === 'number'
        ? loaded.bacaKitabRataRataGlobal
        : def.bacaKitabRataRataGlobal,
    bacaKitabPerKelas:
      Array.isArray(loaded.bacaKitabPerKelas) && loaded.bacaKitabPerKelas.length > 0
        ? loaded.bacaKitabPerKelas
        : def.bacaKitabPerKelas,
    koreksianBatasMateri: mergedMateri,
    takziranSettings: {
      ...def.takziranSettings,
      ...(loaded.takziranSettings || {})
    },
    updatedAt: loaded.updatedAt || def.updatedAt,
    updatedBy: loaded.updatedBy
  };
}

export function getTargetForKelas(
  config: UjianExamGlobalConfig,
  kelas: string
): MuhafadzohClassTargetConfig {
  const found = config.muhafadzohTargets.find(
    (t) => t.kelas.trim().toUpperCase() === (kelas || '').trim().toUpperCase()
  );
  if (found) return found;
  return {
    kelas: kelas || '1 TSANAWIYAH',
    namaNadzhomGanjil: 'Nadzhom Al-Imrithi (Ganjil)',
    targetGanjil: 125,
    namaNadzhomGenap: 'Nadzhom Al-Imrithi (Genap)',
    targetGenap: 254
  };
}

export function getBacaKitabRuleForKelas(
  config: UjianExamGlobalConfig,
  kelas: string
): BacaKitabClassConfig {
  const found = config.bacaKitabPerKelas.find(
    (b) => b.kelas.trim().toUpperCase() === (kelas || '').trim().toUpperCase()
  );
  if (found) return found;
  return {
    kelas: kelas || '1 TSANAWIYAH',
    kitabStandar: 'Fathul Qorib Al-Mujib',
    nilaiRataRataMinimal: config.bacaKitabRataRataGlobal ?? 75
  };
}

export function evaluateMuhafadzohKategori(
  hafalan: number,
  target: number
): 'JAYYID' | 'MUTAWASIT' | 'RODI' {
  const safeTarget = Math.max(1, target);
  if (hafalan < safeTarget) {
    return 'RODI'; // Tidak mencapai target -> otomatis Rodi & masuk Her + Takziran
  }
  return 'JAYYID';
}

export function computeBatasAkhirTakziranDateString(
  settings: UjianTakziranSettings,
  baseDate: Date = new Date()
): string {
  if (settings.tanggalBatasDefault && /^\d{4}-\d{2}-\d{2}$/.test(settings.tanggalBatasDefault)) {
    return settings.tanggalBatasDefault;
  }
  const days = Math.max(1, Number(settings.durasiPengumpulanHari || 3));
  const target = new Date(baseDate.getTime());
  target.setDate(target.getDate() + days);
  const y = target.getFullYear();
  const m = String(target.getMonth() + 1).padStart(2, '0');
  const d = String(target.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Mengecek apakah tanggal batas akhir sudah terlewati (berakhir pada pukul 23:59:59 hari tgl batas).
 */
export function isTakziranDeadlinePassed(
  batasAkhirStr?: string,
  nowDate: Date = new Date()
): boolean {
  if (!batasAkhirStr) return false;
  let deadlineMs: number;
  if (/^\d{4}-\d{2}-\d{2}$/.test(batasAkhirStr)) {
    const [y, m, d] = batasAkhirStr.split('-').map(Number);
    const endOfDay = new Date(y, m - 1, d, 23, 59, 59, 999);
    deadlineMs = endOfDay.getTime();
  } else {
    deadlineMs = new Date(batasAkhirStr).getTime();
  }
  if (isNaN(deadlineMs)) return false;
  return nowDate.getTime() > deadlineMs;
}

/**
 * Terapkan logika otomatis batas waktu Surat Takziran:
 * - Jika belum Selesai DAN melewati batas akhir pengumpulan:
 *   -> Kartu TIDAK BERLAKU (kartuBerlaku: false)
 *   -> Santri dianggap tidak mengerjakan -> statusTakziran = 'Tidak Mengumpulkan (Terlambat)'
 *   -> Tingkatan naik menjadi 'Sedang' (atau sesuai setting tingkatJikaTerlambat)
 */
export function normalizeTakziranRecordWithDeadline(
  rec: UjianTakziranRecord,
  settings: UjianTakziranSettings,
  nowDate: Date = new Date()
): UjianTakziranRecord {
  if (rec.statusTakziran === 'Selesai') {
    return rec;
  }
  if (rec.batasAkhirPengumpulan && isTakziranDeadlinePassed(rec.batasAkhirPengumpulan, nowDate)) {
    return {
      ...rec,
      kartuBerlaku: false,
      statusTakziran: 'Tidak Mengumpulkan (Terlambat)',
      tingkatTakziran: settings.tingkatJikaTerlambat || 'Sedang',
      tanggalNaikTingkat: rec.tanggalNaikTingkat || nowDate.toISOString()
    };
  }
  return rec;
}

export function formatTanggalIndoSingkat(dateStr?: string): string {
  if (!dateStr) return '-';
  const d = /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
    ? (() => {
        const [y, m, day] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, day);
      })()
    : new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export function resolveDefaultHafalanFromSantri(
  santri: Santri,
  targetGanjil: number,
  targetGenap: number
): { hafalanGanjil: number; hafalanGenap: number } {
  const score = Number(santri.nilaiMuhafadzoh ?? 90);
  if (santri.kategoriMhf === 'RODI' || score < 70) {
    return {
      hafalanGanjil: Math.max(5, Math.round(targetGanjil * 0.65)),
      hafalanGenap: Math.max(5, Math.round(targetGenap * 0.6))
    };
  }
  return {
    hafalanGanjil: targetGanjil,
    hafalanGenap: targetGenap
  };
}
