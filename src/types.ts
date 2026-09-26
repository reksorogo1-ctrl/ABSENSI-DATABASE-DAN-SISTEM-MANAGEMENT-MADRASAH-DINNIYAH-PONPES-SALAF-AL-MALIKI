export interface Santri {
  id: string; // NIS / ID Santri
  nama: string;
  kelas: string;
  kamar: string;
  alamat: string;
  foto: string;
  password?: string; // Password login wali santri (default: NIS / id)
  namaOrangTua?: string; // Nama Orang Tua / Wali
  namaWaliKelas?: string; // Nama Wali Kelas
  noWaWaliKelas?: string; // No WA Wali Kelas (contoh: 628123456789)
  saldoUangSaku?: number; // Saldo terkini tabungan uang saku santri

  // Kolom Nilai Ujian Terkoneksi ke Wali Santri
  nilaiKoreksianKitab?: number | string; // Nilai koreksian kitab (contoh: 90)
  predikatKoreksianKitab?: string; // contoh: Mumtaz (Makna Gandul Sah & Lengkap)
  nilaiMuhafadzoh?: number | string; // Nilai ujian muhafadzoh nadzhom (contoh: 95)
  predikatMuhafadzoh?: string; // contoh: Mumtaz (Lancar 250 Bait Nadzhom)
  nilaiBacaKitab?: number | string; // Nilai ujian baca kitab (contoh: 88)
  predikatBacaKitab?: string; // contoh: Jayyid Jiddan (Fashih & Paham Tarkib)
  catatanUjianKitab?: string; // Catatan evaluasi ustadz penguji
  ustadzPengujiKitab?: string; // Nama ustadz penguji
  tanggalUjianKitab?: string; // Tanggal pelaksanaan ujian
  kitabMuhafadzoh?: string;
  kitabBaca?: string;
}

export interface Pengurus {
  id: string; // e.g. "PNG-001"
  nama: string; // Nama pengurus (digunakan untuk login)
  password: string; // Password login pengurus (dapat diedit via Option Panel)
  jabatan: string; // contoh: "Ketua Pengurus / Lurah Pondok", "Kamtib & Keamanan", "Kasi Pendidikan Madrasah", "Bendahara Pondok"
  kelasBimbingan?: string; // contoh: "1 TSANAWIYAH"
  mapel?: string; // contoh: "Nahwu & Shorof"
  noWa: string;
  noHp?: string;
  foto?: string;
  email?: string;
  divisi?: string;
  alamat?: string;
  masaKhidmah?: string;
  catatan?: string;
  tugasUtama?: string;
}

export interface KalenderAkademikEvent {
  id: string;
  judul: string;
  tanggalMulai: string; // YYYY-MM-DD
  tanggalSelesai?: string;
  waktu?: string; // contoh: "19.30 WIB - Selesai"
  kategori: 'Rapat' | 'Ujian' | 'Libur' | 'Pengajian' | 'Kegiatan' | 'Peringatan';
  lokasi: string;
  deskripsi: string;
  isUrgentNotif?: boolean; // Memicu notifikasi penting langsung di Dashboard Utama Pengurus
  sasaran?: string; // contoh: "Seluruh Pengurus & Asatidz", "Santri Tsanawiyah"
}

export interface UjianSantriRecord {
  id: string;
  idSantri: string;
  namaSantri?: string;
  kelas: string;
  semester: string; // contoh: "Semester Ganjil 2026/2027"
  tanggal: string;

  // 1. Nilai Koreksian Kitab
  nilaiKoreksianKitab: number;
  predikatKoreksianKitab: string;
  kitabKoreksian?: string;
  catatanKoreksianKitab?: string;

  // 2. Nilai Muhafadzoh
  nilaiMuhafadzoh: number;
  predikatMuhafadzoh: string;
  kitabMuhafadzoh?: string;
  catatanMuhafadzoh?: string;

  // 3. Nilai Baca Kitab
  nilaiBacaKitab: number;
  predikatBacaKitab: string;
  kitabBaca?: string;
  catatanBacaKitab?: string;

  ustadzPenguji: string;
}

export interface SyahriyahRecord {
  id: string;
  idSantri: string;
  namaSantri?: string;
  bulan: string; // e.g. "Juli 2026", "Agustus 2026", "September 2026"
  nominal: number;
  tanggalBayar: string;
  status: 'Lunas' | 'Menunggak' | 'Belum Bayar';
  keterangan?: string;
}

export interface UangSakuRecord {
  id: string;
  idSantri: string;
  namaSantri?: string;
  tanggal: string;
  tipe: 'Masuk' | 'Keluar';
  nominal: number;
  keterangan: string;
  saldoSetelah: number;
}

export interface KurikulumKitabRecord {
  id: string;
  kelas: string; // Angkatan / Kelas
  mapel: string; // Fan Ilmu
  kitab: string; // Kitab yang digunakan
  muallif: string; // Pengarang / Muallif
  targetSemester: string; // Target materi semester
  ustadzPengampu?: string;
}

export interface AbsensiSantriRecord {
  tanggal: string;
  idSantri: string;
  nama: string;
  kelas: string;
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpha';
  keterangan: string;
}

export interface AbsensiGuruRecord {
  tanggal: string;
  nama: string;
  mapel: string;
  kelas: string;
  status: 'Hadir' | 'Terlambat' | 'Izin' | 'Alpha';
  catatan: string;
  hari: string;
  jamKe: number | string;
  waktu: string;
  ustadzPengganti?: string;
  alasanIzin?: string;
}

export interface IzinMengajarRequest {
  id: string;
  idPengurus?: string;
  namaUstadz: string;
  tanggal: string; // YYYY-MM-DD
  mapel: string;
  kelas: string;
  jamKe?: number | string;
  alasan: string;
  ustadzPengganti?: string;
  status: 'Menunggu' | 'Disetujui' | 'Ditolak';
  catatanAdmin?: string;
  createdAt: string;
}

export interface JadwalPelajaran {
  id?: string;
  kelas: string;
  hari: string;
  jamKe: number;
  waktu: string;
  mapel: string;
  nama: string;
  status?: string;
  keterangan?: string;
}

export interface GuruPengajar {
  id?: string;
  kelas: string;
  nama: string;
  mapel: string;
}

export interface WaliKelas {
  kelas: string;
  waliKelas: string;
}

export interface NadzhomRecord {
  idRow?: number;
  idSantri: string;
  nama: string;
  kitab: string;
  bait: number;
  tanggal: string;
  nilai: string;
  kelas?: string;
}

export interface NilaiUjianRecord {
  idRow?: number;
  idSantri: string;
  nama: string;
  kelas: string;
  pelajaran: string;
  nilai: number;
  semester: string;
}

export interface AppSettings {
  nama_pondok: string;
  nama_madrasah: string;
  nama_pesantren?: string;
  judul_aplikasi: string;
  login_subtitle: string;
  logo_pondok: string;
  logo_madrasah: string;
  background_url?: string;
  password_admin?: string;
  password_option_panel?: string;
  intro_video_url?: string; // URL video intro opening yang dapat diedit di Option Panel
  intro_video_name?: string; // Nama judul berkas video intro
  intro_video_type?: 'file' | 'url' | 'default' | 'indexeddb'; // Tipe sumber video intro
  intro_duration_seconds?: number; // Durasi putar otomatis intro (detik, 0 = loop tak terbatas)
  intro_ambient_audio?: boolean; // Aktifkan audio ambient islami syahdu

  // Pengaturan Teks Website Menyeluruh (Bisa diatur semua di Option Panel)
  header_title?: string;
  header_subtitle?: string;
  portal_title?: string;
  portal_subtitle?: string;
  announcement_text?: string;
  text_absensi_santri_title?: string;
  text_absensi_guru_title?: string;
  text_jadwal_title?: string;
  text_santri_title?: string;
  text_guru_title?: string;

  // Slot Berita Terkini & Running Text Caption Bergerak Sendiri
  berita_image_url?: string;
  berita_title?: string;
  berita_deskripsi?: string;
  running_text_caption?: string;

  // Notifikasi Keterlambatan Pembayaran Syahriyah (Diatur via Option Panel)
  notif_keterlambatan_syahriyah?: string;

  // Kustomisasi teks tombol & warna tombol terpusat di Option Panel
  btn_hadir_semua_text?: string;
  btn_hadir_semua_color?: string; // hex atau class color
  btn_simpan_absensi_santri_text?: string;
  btn_simpan_absensi_santri_color?: string;
  btn_simpan_guru_text?: string;
  btn_simpan_guru_color?: string;
  btn_sync_sheets_text?: string;
  btn_sync_sheets_color?: string;
  btn_reset_dashboard_text?: string;
  btn_reset_dashboard_color?: string;
  btn_reset_harian_text?: string;
  btn_reset_harian_color?: string;

  // Pengaturan visibilitas / hapus / aktifkan tombol
  show_quick_sync_button?: boolean;
  show_export_csv_button?: boolean;
  show_reset_dashboard_button?: boolean;
}

export interface DashboardStats {
  totalSantri: number;
  totalGuru: number;
  totalAbsensiSantri?: number;
  totalAbsensiGuru?: number;
  percentSantri?: number;
  percentGuru?: number;
  percentKeterlambatanGuru?: number;
  percentIzinGuru?: number;
  percentAlphaGuru?: number;
  hadirSantri?: number;
  izinSantri?: number;
  sakitSantri?: number;
  alphaSantri?: number;
  hadirGuru?: number;
  terlambatGuru?: number;
  izinGuru?: number;
  alphaGuru?: number;
  kehadiranSantriHariIni?: number;
  kehadiranGuruHariIni?: number;
  keterlambatanGuru?: number;
  rekapSantri?: {
    hadir: number;
    izin: number;
    sakit: number;
    alpha: number;
  };
  rekapGuru?: {
    hadir: number;
    terlambat: number;
    izin: number;
    alpha: number;
  };
  history: Array<{
    tanggal: string;
    percentSantri?: number;
    percentGuru?: number;
    hadirSantri: number;
    hadirGuru: number;
  }>;
}

export type UserRole = 'admin' | 'pengurus' | 'wali_santri' | null;

export interface AuthSession {
  role: UserRole;
  identifier: string; // 'admin', nama pengurus, or santri ID/nama
  santriData?: Santri;
  pengurusData?: Pengurus;
}
