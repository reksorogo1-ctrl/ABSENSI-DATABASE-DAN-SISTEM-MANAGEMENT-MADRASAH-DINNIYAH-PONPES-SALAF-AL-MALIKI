import { 
  Santri, JadwalPelajaran, GuruPengajar, WaliKelas, NadzhomRecord, 
  NilaiUjianRecord, AppSettings, AbsensiSantriRecord, AbsensiGuruRecord,
  SyahriyahRecord, UangSakuRecord, KurikulumKitabRecord,
  Pengurus, KalenderAkademikEvent, UjianSantriRecord, IzinMengajarRequest,
  SilabusMemaknaiRecord
} from './types';

export const DEFAULT_SPREADSHEET_ID = '1lgVwiAb0XSctKHBxFzZOSK6xpxmbLoCsWCjoEjvNq-Q';

export const DEFAULT_SETTINGS: AppSettings = {
  nama_pondok: 'Pondok Pesantren Salaf Al-Maliki',
  nama_madrasah: 'Madrasah Diniyah Al-Maliki',
  judul_aplikasi: 'SIM Pondok Pesantren Salaf Al-Maliki',
  login_subtitle: 'Sistem Informasi & Manajemen Santri (Google Sheets Integrated)',
  logo_pondok: '/assets/logo_pondok_almaliki.jpg',
  logo_madrasah: '/assets/logo_madrasah_diniyah.jpg',
  background_url: '',
  password_admin: 'salaf123',
  password_option_panel: 'admin123',
  intro_video_url: '/assets/intro_salaf_almaliki.mp4',
  intro_video_name: 'The Journey of Knowledge — Salaf Al-Maliki (Bawaan)',
  intro_video_type: 'default',
  intro_duration_seconds: 10,
  intro_ambient_audio: true,

  // Pengaturan Teks Website Menyeluruh (Dapat Diatur Bebas di Option Panel)
  header_title: 'SIM Pondok Pesantren Salaf Al-Maliki',
  header_subtitle: 'Sistem Informasi & Manajemen Santri Madrasah Diniyah Salafiyah',
  portal_title: 'Portal Wali Santri Diniyah',
  portal_subtitle: 'Akses Informasi Akademik & Presensi Santri Terpadu',
  announcement_text: 'Kajian Rutin Kitab Fathul Qorib & Nadzhom Imrithi setiap malam Jumat di Aula Utama Pesantren.',
  text_absensi_santri_title: 'Absensi Santri Diniyah',
  text_absensi_guru_title: 'Absensi Ustadz / Ustadzah Pengajar',
  text_jadwal_title: 'Jadwal Pelajaran Madrasah Diniyah',
  text_santri_title: 'Data Santri & Foto per Angkatan',
  text_guru_title: 'Data Guru Pengajar (Per Angkatan)',

  // Slot Berita Terkini & Running Text Caption Bergerak Sendiri
  berita_image_url: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=1200&auto=format&fit=crop&q=80',
  berita_title: 'Evaluasi Perkembangan Pembelajaran & Nadzhom Santri',
  berita_deskripsi: 'Musyawaroh kubro dan ujian semester santri madrasah diniyah salafiyah terjadwal pekan depan.',
  running_text_caption: '📢 MAKLUMAT PONDOK: Seluruh asatidz dan santri wajib menghadiri pembacaan Rotibul Haddad ba\'da Maghrib • Ujian Khitobah & Qiroatul Kutub dilaksanakan hari Ahad depan • Harap seluruh absensi divalidasi tepat waktu.',

  // Notifikasi Keterlambatan Pembayaran Syahriyah (Diatur via Option Panel)
  notif_keterlambatan_syahriyah: 'Pemberitahuan: Pembayaran Syahriyah (iuran bulanan madrasah) putra/putri Anda saat ini tercatat menunggak / melewati tanggal 10. Dimohon kesediaannya untuk segera menyelesaikan administrasi ke Bendahara Pesantren.',

  // Default tombol & teks warna
  btn_hadir_semua_text: '✓ Hadir Semua',
  btn_hadir_semua_color: '#ffffff',
  btn_simpan_absensi_santri_text: 'Simpan Absensi Santri',
  btn_simpan_absensi_santri_color: '#000000',
  btn_simpan_guru_text: 'SIMPAN ABSENSI GURU',
  btn_simpan_guru_color: '#000000',
  btn_sync_sheets_text: 'Sinkron Google Sheets',
  btn_sync_sheets_color: '#d4af37',
  btn_reset_dashboard_text: 'Simpan Rekap & Reset Harian',
  btn_reset_dashboard_color: '#000000',
  show_quick_sync_button: true,
  show_export_csv_button: true,
  show_reset_dashboard_button: true,

  // Media Sosial & WhatsApp Resmi (Bisa diedit manual di Option Panel)
  link_instagram: 'https://instagram.com/pesantrensalafalmaliki',
  link_tiktok: 'https://tiktok.com/@pesantrensalafalmaliki',
  link_youtube: 'https://youtube.com/@salafalmaliki',
  link_wa: 'https://wa.me/6281234567890',

  // Geofencing & Google Maps Lokasi Terkunci Otomatis
  geofencing_enabled: true,
  geofencing_locked: true,
  geofencing_zone_name: 'Kompleks Pondok Pesantren & Madrasah Diniyah',
  geofencing_latitude: -7.428623,
  geofencing_longitude: 112.441234,
  geofencing_radius_meters: 100,
  geofencing_max_gps_accuracy: 50,
  toleransi_keterlambatan_menit: 15,
  pengganti_enabled: true
};

export const INITIAL_SANTRI_LIST: Santri[] = [
  // 1 TSANAWIYAH
  { 
    id: 'S-1001', 
    nama: 'ZIDNIL AQILA', 
    kelas: '1 TSANAWIYAH', 
    kamar: 'Kamar Abu Bakar 01', 
    alamat: 'Kediri, Jawa Timur', 
    foto: 'https://cdn.phototourl.com/member/2026-09-21-56d172a7-db00-4892-ac41-713327347876.jpg',
    password: '1001',
    namaOrangTua: 'H. Suwandi & Hj. Aminah',
    namaWaliKelas: 'Ustazah Fina Nikmatul Kamelia',
    noWaWaliKelas: '6281234567801',
    saldoUangSaku: 185000,
    nilaiKoreksianKitab: 92,
    predikatKoreksianKitab: 'Mumtaz (Makna Gandul Sah & Lengkap)',
    nilaiMuhafadzoh: 96,
    predikatMuhafadzoh: 'Mumtaz (Hafal Lancar 254 Bait Imrithi)',
    nilaiBacaKitab: 90,
    predikatBacaKitab: 'Mumtaz (Fashih & Paham Tarkib I\'rob)',
    ustadzPengujiKitab: 'Ust. Muhammad Ilyas Al-Hafidz',
    tanggalUjianKitab: '20 September 2026',
    catatanUjianKitab: 'Pemahaman nahwu shorof sangat matang, mutaba\'ah kitab lengkap.'
  },
  { 
    id: 'S-1002', 
    nama: 'ALIMUN HANIF', 
    kelas: '1 TSANAWIYAH', 
    kamar: '-', 
    alamat: 'KREMON JENGGOT PEKALONGAN', 
    foto: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
    password: '1002',
    namaOrangTua: 'BPK FARIHIN',
    namaWaliKelas: 'Ustazah Fina Nikmatul Kamelia',
    noWaWaliKelas: '6281234567801',
    saldoUangSaku: 75000,
    nilaiKoreksianKitab: 86,
    predikatKoreksianKitab: 'Jayyid Jiddan (Lengkap & Tertib)',
    nilaiMuhafadzoh: 88,
    predikatMuhafadzoh: 'Jayyid Jiddan (Lancar 200 Bait)',
    nilaiBacaKitab: 85,
    predikatBacaKitab: 'Jayyid Jiddan (Fashih)',
    ustadzPengujiKitab: 'Ust. Muhammad Ilyas Al-Hafidz',
    tanggalUjianKitab: '20 September 2026',
    catatanUjianKitab: 'Bacaan fasih dan penguasaan mufradat baik.'
  },
  { 
    id: 'S-1003', 
    nama: 'Ilyas Nur Hidayat', 
    kelas: '1 TSANAWIYAH', 
    kamar: 'Kamar Abu Bakar 01', 
    alamat: 'Nganjuk, Jawa Timur', 
    foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    password: '1003',
    namaOrangTua: 'Bpk. Nur Salim',
    namaWaliKelas: 'Ustazah Fina Nikmatul Kamelia',
    noWaWaliKelas: '6281234567801',
    saldoUangSaku: 230000,
    nilaiKoreksianKitab: 90,
    predikatKoreksianKitab: 'Mumtaz (Rapi & Lengkap)',
    nilaiMuhafadzoh: 92,
    predikatMuhafadzoh: 'Mumtaz (Lancar 250 Bait)',
    nilaiBacaKitab: 87,
    predikatBacaKitab: 'Jayyid Jiddan (Paham I\'rob)',
    ustadzPengujiKitab: 'Ust. H. Ahmad Fauzi Ridwan',
    tanggalUjianKitab: '20 September 2026',
    catatanUjianKitab: 'Hafalan sangat mutqin dan catatan pegon bersih.'
  },
  { 
    id: 'S-1004', 
    nama: 'Farhan Dwi Ramadhan', 
    kelas: '1 TSANAWIYAH', 
    kamar: 'Kamar Abu Bakar 03', 
    alamat: 'Blitar, Jawa Timur', 
    foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    password: '1004',
    namaOrangTua: 'Bpk. Dwi Susanto',
    namaWaliKelas: 'Ustazah Fina Nikmatul Kamelia',
    noWaWaliKelas: '6281234567801',
    saldoUangSaku: 110000
  },
  { 
    id: 'S-1005', 
    nama: 'M. Rizqi Maulana', 
    kelas: '1 TSANAWIYAH', 
    kamar: 'Kamar Abu Bakar 02', 
    alamat: 'Tulungagung, Jawa Timur', 
    foto: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&auto=format&fit=crop&q=80',
    password: '1005',
    namaOrangTua: 'H. Masykur',
    namaWaliKelas: 'Ustazah Fina Nikmatul Kamelia',
    noWaWaliKelas: '6281234567801',
    saldoUangSaku: 150000
  },
  { 
    id: 'S-1006', 
    nama: 'Habibullah Al-Habsyi', 
    kelas: '1 TSANAWIYAH', 
    kamar: 'Kamar Abu Bakar 03', 
    alamat: 'Malang, Jawa Timur', 
    foto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
    password: '1006',
    namaOrangTua: 'Habib Ali Al-Habsyi',
    namaWaliKelas: 'Ustazah Fina Nikmatul Kamelia',
    noWaWaliKelas: '6281234567801',
    saldoUangSaku: 320000
  },
  { 
    id: 'S-1007', 
    nama: 'Danial Al-Fatih', 
    kelas: '1 TSANAWIYAH', 
    kamar: 'Kamar Abu Bakar 04', 
    alamat: 'Pasuruan, Jawa Timur', 
    foto: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80',
    password: '1007',
    namaOrangTua: 'Bpk. Fathur Rozak',
    namaWaliKelas: 'Ustazah Fina Nikmatul Kamelia',
    noWaWaliKelas: '6281234567801',
    saldoUangSaku: 95000
  },

  // 2 TSANAWIYAH
  { 
    id: 'S-2001', 
    nama: 'Muhammad Bilal As-Shidiq', 
    kelas: '2 TSANAWIYAH', 
    kamar: 'Kamar Umar 01', 
    alamat: 'Surabaya, Jawa Timur', 
    foto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
    password: '2001',
    namaOrangTua: 'H. Asyari & Hj. Khadijah',
    namaWaliKelas: 'Ustadz Ahmad Shobirin',
    noWaWaliKelas: '6281234567802',
    saldoUangSaku: 215000
  },
  { 
    id: 'S-2002', 
    nama: 'Kholilur Rahman', 
    kelas: '2 TSANAWIYAH', 
    kamar: 'Kamar Umar 02', 
    alamat: 'Bangkalan, Madura', 
    foto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
    password: '2002',
    namaOrangTua: 'K.H. Abdul Kholiq',
    namaWaliKelas: 'Ustadz Ahmad Shobirin',
    noWaWaliKelas: '6281234567802',
    saldoUangSaku: 160000
  },
  { 
    id: 'S-2003', 
    nama: 'Zaidan Ahsanul Khuluq', 
    kelas: '2 TSANAWIYAH', 
    kamar: 'Kamar Umar 01', 
    alamat: 'Gresik, Jawa Timur', 
    foto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    password: '2003',
    namaOrangTua: 'Bpk. Ahsanul Hadi',
    namaWaliKelas: 'Ustadz Ahmad Shobirin',
    noWaWaliKelas: '6281234567802',
    saldoUangSaku: 80000
  },
  { 
    id: 'S-2004', 
    nama: 'Abdullah Azzam', 
    kelas: '2 TSANAWIYAH', 
    kamar: 'Kamar Umar 03', 
    alamat: 'Lamongan, Jawa Timur', 
    foto: 'https://images.unsplash.com/photo-1528892952291-009c663ce843?w=400&auto=format&fit=crop&q=80',
    password: '2004',
    namaOrangTua: 'Bpk. Zainal Abidin',
    namaWaliKelas: 'Ustadz Ahmad Shobirin',
    noWaWaliKelas: '6281234567802',
    saldoUangSaku: 145000
  },
  { 
    id: 'S-2005', 
    nama: 'Nuruddin Al-Bantani', 
    kelas: '2 TSANAWIYAH', 
    kamar: 'Kamar Umar 02', 
    alamat: 'Tuban, Jawa Timur', 
    foto: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&auto=format&fit=crop&q=80',
    password: '2005',
    namaOrangTua: 'Bpk. Syihabuddin',
    namaWaliKelas: 'Ustadz Ahmad Shobirin',
    noWaWaliKelas: '6281234567802',
    saldoUangSaku: 190000
  },
  { 
    id: 'S-2006', 
    nama: 'Rafi Ahmad Fauzan', 
    kelas: '2 TSANAWIYAH', 
    kamar: 'Kamar Umar 04', 
    alamat: 'Sidoarjo, Jawa Timur', 
    foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    password: '2006',
    namaOrangTua: 'Bpk. Fauzan Badri',
    namaWaliKelas: 'Ustadz Ahmad Shobirin',
    noWaWaliKelas: '6281234567802',
    saldoUangSaku: 125000
  },

  // 3 TSANAWIYAH
  { 
    id: 'S-3001', 
    nama: 'Luqman Hakim An-Nawawi', 
    kelas: '3 TSANAWIYAH', 
    kamar: 'Kamar Utsman 01', 
    alamat: 'Semarang, Jawa Tengah', 
    foto: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=400&auto=format&fit=crop&q=80',
    password: '3001',
    namaOrangTua: 'H. Nawawi Ishaq',
    namaWaliKelas: 'Ustadz Yasir',
    noWaWaliKelas: '6281234567803',
    saldoUangSaku: 270000
  },
  { 
    id: 'S-3002', 
    nama: 'Hamid Rusdi As-Salafi', 
    kelas: '3 TSANAWIYAH', 
    kamar: 'Kamar Utsman 02', 
    alamat: 'Demak, Jawa Tengah', 
    foto: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&auto=format&fit=crop&q=80',
    password: '3002',
    namaOrangTua: 'Bpk. Rusdi Salim',
    namaWaliKelas: 'Ustadz Yasir',
    noWaWaliKelas: '6281234567803',
    saldoUangSaku: 60000
  },
  { 
    id: 'S-3003', 
    nama: 'Thoriq Ziyad Al-Farabi', 
    kelas: '3 TSANAWIYAH', 
    kamar: 'Kamar Utsman 01', 
    alamat: 'Kudus, Jawa Tengah', 
    foto: 'https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?w=400&auto=format&fit=crop&q=80',
    password: '3003',
    namaOrangTua: 'Bpk. Ziyad Mustofa',
    namaWaliKelas: 'Ustadz Yasir',
    noWaWaliKelas: '6281234567803',
    saldoUangSaku: 135000
  },
  { 
    id: 'S-3004', 
    nama: 'Syakir Daulay', 
    kelas: '3 TSANAWIYAH', 
    kamar: 'Kamar Utsman 03', 
    alamat: 'Pati, Jawa Tengah', 
    foto: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&auto=format&fit=crop&q=80',
    password: '3004',
    namaOrangTua: 'Bpk. Hasan Daulay',
    namaWaliKelas: 'Ustadz Yasir',
    noWaWaliKelas: '6281234567803',
    saldoUangSaku: 90000
  },
  { 
    id: 'S-3005', 
    nama: 'Bahauddin Al-Attas', 
    kelas: '3 TSANAWIYAH', 
    kamar: 'Kamar Utsman 02', 
    alamat: 'Rembang, Jawa Tengah', 
    foto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
    password: '3005',
    namaOrangTua: 'Habib Sholeh Al-Attas',
    namaWaliKelas: 'Ustadz Yasir',
    noWaWaliKelas: '6281234567803',
    saldoUangSaku: 210000
  },

  // 1 ALIYAH
  { 
    id: 'S-4001', 
    nama: 'Mahfudz Al-Ghazali', 
    kelas: '1 ALIYAH', 
    kamar: 'Kamar Ali 01', 
    alamat: 'Yogyakarta', 
    foto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
    password: '4001',
    namaOrangTua: 'Drs. H. Ghazali',
    namaWaliKelas: 'Ustadz Mizan Khoirul',
    noWaWaliKelas: '6281234567804',
    saldoUangSaku: 310000
  },
  { 
    id: 'S-4002', 
    nama: 'Nashiruddin At-Thusi', 
    kelas: '1 ALIYAH', 
    kamar: 'Kamar Ali 02', 
    alamat: 'Solo, Jawa Tengah', 
    foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    password: '4002',
    namaOrangTua: 'Bpk. Ahmad Nashir',
    namaWaliKelas: 'Ustadz Mizan Khoirul',
    noWaWaliKelas: '6281234567804',
    saldoUangSaku: 175000
  },
  { 
    id: 'S-4003', 
    nama: 'Hasan Basri Al-Kindi', 
    kelas: '1 ALIYAH', 
    kamar: 'Kamar Ali 01', 
    alamat: 'Magelang, Jawa Tengah', 
    foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    password: '4003',
    namaOrangTua: 'Bpk. Basri Mahmud',
    namaWaliKelas: 'Ustadz Mizan Khoirul',
    noWaWaliKelas: '6281234567804',
    saldoUangSaku: 85000
  },
  { 
    id: 'S-4004', 
    nama: 'Zainuddin Mazhari', 
    kelas: '1 ALIYAH', 
    kamar: 'Kamar Ali 03', 
    alamat: 'Banyumas, Jawa Tengah', 
    foto: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&auto=format&fit=crop&q=80',
    password: '4004',
    namaOrangTua: 'K.H. Mazhar Shiddiq',
    namaWaliKelas: 'Ustadz Mizan Khoirul',
    noWaWaliKelas: '6281234567804',
    saldoUangSaku: 195000
  },

  // 2 ALIYAH
  { 
    id: 'S-5001', 
    nama: 'Fathurrahman As-Syafi\'i', 
    kelas: '2 ALIYAH', 
    kamar: 'Kamar As-Shofa 01', 
    alamat: 'Cirebon, Jawa Barat', 
    foto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
    password: '5001',
    namaOrangTua: 'K.H. Syafi\'i Baedhowi',
    namaWaliKelas: 'Ustadz Sulaiman',
    noWaWaliKelas: '6281234567805',
    saldoUangSaku: 280000
  },
  { 
    id: 'S-5002', 
    nama: 'Khoirul Anam Al-Makki', 
    kelas: '2 ALIYAH', 
    kamar: 'Kamar As-Shofa 02', 
    alamat: 'Tasikmalaya, Jawa Barat', 
    foto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
    password: '5002',
    namaOrangTua: 'H. Makki Makmun',
    namaWaliKelas: 'Ustadz Sulaiman',
    noWaWaliKelas: '6281234567805',
    saldoUangSaku: 130000
  },
  { 
    id: 'S-5003', 
    nama: 'M. Syafiq Al-Idrus', 
    kelas: '2 ALIYAH', 
    kamar: 'Kamar As-Shofa 01', 
    alamat: 'Garut, Jawa Barat', 
    foto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    password: '5003',
    namaOrangTua: 'Habib Syafiq Al-Idrus',
    namaWaliKelas: 'Ustadz Sulaiman',
    noWaWaliKelas: '6281234567805',
    saldoUangSaku: 220000
  },

  // 3 ALIYAH
  { 
    id: 'S-6001', 
    nama: 'Rahmat Hidayatullah', 
    kelas: '3 ALIYAH', 
    kamar: 'Kamar Al-Marwa 01', 
    alamat: 'Bandung, Jawa Barat', 
    foto: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=400&auto=format&fit=crop&q=80',
    password: '6001',
    namaOrangTua: 'Bpk. Hidayat Sulaeman',
    namaWaliKelas: 'Ustadz Munawar',
    noWaWaliKelas: '6281234567806',
    saldoUangSaku: 350000
  },
  { 
    id: 'S-6002', 
    nama: 'Izzuddin Al-Qassam', 
    kelas: '3 ALIYAH', 
    kamar: 'Kamar Al-Marwa 02', 
    alamat: 'Bogor, Jawa Barat', 
    foto: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&auto=format&fit=crop&q=80',
    password: '6002',
    namaOrangTua: 'Bpk. Qassam Abdullah',
    namaWaliKelas: 'Ustadz Munawar',
    noWaWaliKelas: '6281234567806',
    saldoUangSaku: 160000
  },
  { 
    id: 'S-6003', 
    nama: 'Sayyid Ali Zainal Abidin', 
    kelas: '3 ALIYAH', 
    kamar: 'Kamar Al-Marwa 01', 
    alamat: 'Jakarta Selatan', 
    foto: 'https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?w=400&auto=format&fit=crop&q=80',
    password: '6003',
    namaOrangTua: 'Habib Ali Zainal Abidin',
    namaWaliKelas: 'Ustadz Munawar',
    noWaWaliKelas: '6281234567806',
    saldoUangSaku: 450000
  }
];

export const INITIAL_WALI_KELAS: WaliKelas[] = [
  { kelas: '1 TSANAWIYAH', waliKelas: 'Ustazah Fina Nikmatul Kamelia' },
  { kelas: '2 TSANAWIYAH', waliKelas: 'Ustadz Ahmad Shobirin' },
  { kelas: '3 TSANAWIYAH', waliKelas: 'Ustadz Yasir' },
  { kelas: '1 ALIYAH', waliKelas: 'Ustadz Mizan Khoirul' },
  { kelas: '2 ALIYAH', waliKelas: 'Ustadz Sulaiman' },
  { kelas: '3 ALIYAH', waliKelas: 'Ustadz Munawar' }
];

export const INITIAL_GURU_LIST: GuruPengajar[] = [
  // 1 TSANAWIYAH
  { id: 'GP-1', kelas: '1 TSANAWIYAH', nama: 'Ustazah Fina Nikmatul Kamelia', mapel: 'Alala & Nahwu', kitab: 'Al-Jurumiyyah & Nadzhom Alala', noWa: '081234567801', foto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80' },
  { id: 'GP-2', kelas: '1 TSANAWIYAH', nama: 'Ustazah Maulida Rohmah', mapel: 'Tajwid & Al-Quran', kitab: 'Tuhfatul Athfal & Hidayatus Shibyan', noWa: '081234567802', foto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80' },
  { id: 'GP-3', kelas: '1 TSANAWIYAH', nama: 'Ustazah Kasyifatul Aini', mapel: 'Pegon & Bahasa Arab', kitab: 'Al-Miftah Lil Pegon & Durusullughah', noWa: '081234567803', foto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80' },
  { id: 'GP-4', kelas: '1 TSANAWIYAH', nama: 'Ustadzah Qothrunada', mapel: 'Fiqih Mabadi', kitab: 'Mabadi Al-Fiqhiyyah Juz 1 & 2', noWa: '081234567804', foto: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=400&auto=format&fit=crop&q=80' },
  { id: 'GP-5', kelas: '1 TSANAWIYAH', nama: 'Ustazah Solihah', mapel: 'Tauhid & Shorof', kitab: 'Aqidatul Awam & Al-Amtsilah', noWa: '081234567805', foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80' },

  // 2 TSANAWIYAH
  { id: 'GP-6', kelas: '2 TSANAWIYAH', nama: 'Ustadz Adib Setiawan', mapel: "Fiqih & I'lal", kitab: 'Safinatun Naja & Qowa\'idul I\'lal', noWa: '081234567813', foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80' },
  { id: 'GP-7', kelas: '2 TSANAWIYAH', nama: 'Ustadz Yasir', mapel: 'Akhlaq Lil Banin', kitab: 'Akhlaq Lil Banin Juz 2', noWa: '081234567814', foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80' },
  { id: 'GP-8', kelas: '2 TSANAWIYAH', nama: 'Ustazah Isna Mubarokah', mapel: 'Tajwid & Hadits Arbain', kitab: 'Al-Arba\'in An-Nawawiyyah', noWa: '081234567815', foto: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&auto=format&fit=crop&q=80' },
  { id: 'GP-9', kelas: '2 TSANAWIYAH', nama: 'Ustazah Dewi Faila Shofa', mapel: 'Tarikh Islam', kitab: 'Khulashoh Nuril Yaqin Juz 1 & 2', noWa: '081234567816', foto: 'https://images.unsplash.com/photo-1598550874175-4d0ef436c909?w=400&auto=format&fit=crop&q=80' },
  { id: 'GP-10', kelas: '2 TSANAWIYAH', nama: 'Ustadz Ahmad Shobirin', mapel: 'Nahwu Jurumiyyah & Tauhid', kitab: 'Mukhtashar Jiddan & Nadzhom Al-Maqsud', noWa: '081234567817', foto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80' },
  { id: 'GP-11', kelas: '2 TSANAWIYAH', nama: 'Ustadz Faza', mapel: 'Bahasa Arab', kitab: 'Durusullughah Al-Arabiyyah', noWa: '081234567818', foto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80' },
  { id: 'GP-12', kelas: '2 TSANAWIYAH', nama: 'Ustadz Ali Said', mapel: 'Shorof Amsilah', kitab: 'Al-Amtsilah At-Tashrifiyyah', noWa: '081234567819', foto: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80' },

  // 3 TSANAWIYAH
  { id: 'GP-13', kelas: '3 TSANAWIYAH', nama: 'Ustadz Yasir', mapel: 'Akhlaq Taisirul Kholaq', kitab: 'Taisirul Khalaq fi Ilmil Akhlaq', noWa: '081234567814', foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80' },
  { id: 'GP-14', kelas: '3 TSANAWIYAH', nama: 'Ustadz Ahmad Shobirin', mapel: 'Fiqih Fathul Qorib', kitab: 'Fathul Qorib Al-Mujib', noWa: '081234567817', foto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80' },
  { id: 'GP-15', kelas: '3 TSANAWIYAH', nama: 'Ustadz Bagus Danial', mapel: "Shorof & I'lal", kitab: 'Qawa\'idul I\'lal & Nadzhom Maqsud', noWa: '081234567820', foto: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&auto=format&fit=crop&q=80' },
  { id: 'GP-16', kelas: '3 TSANAWIYAH', nama: 'Ustadz Mizan Khoirul', mapel: 'Hadits Bulughul Marom', kitab: 'Bulughul Maram min Adillatil Ahkam', noWa: '081234567821', foto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80' },
  { id: 'GP-17', kelas: '3 TSANAWIYAH', nama: 'Ustadz Sulaiman', mapel: 'Nahwu Imrithi & Tajwid', kitab: 'Al-Imrithi & Mandzumah Jazariyyah', noWa: '081234567822', foto: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80' },
  { id: 'GP-18', kelas: '3 TSANAWIYAH', nama: 'Ustadz M. Khoirul Jadid', mapel: 'Bahasa Arab', kitab: 'Muhadatsah & Nahwu Lanjutan', noWa: '081234567823', foto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80' },
  { id: 'GP-19', kelas: '3 TSANAWIYAH', nama: 'Ustadz Wildan', mapel: 'Tarikh Khulasoh', kitab: 'Khulashoh Nuril Yaqin', noWa: '081234567824', foto: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=400&auto=format&fit=crop&q=80' },
  { id: 'GP-20', kelas: '3 TSANAWIYAH', nama: 'Ustadz Munawar', mapel: 'Tauhid Aqidatul Awam', kitab: 'Aqidatul Awam & Kifayatul Awam', noWa: '081234567806', foto: 'https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?w=400&auto=format&fit=crop&q=80' },

  // 1 ALIYAH
  { id: 'GP-21', kelas: '1 ALIYAH', nama: 'Ustadz Ahmad Shobirin', mapel: 'Nahwu & Shorof (Alfiyah)', kitab: 'Alfiyah Ibnu Malik (Juz 1)', noWa: '081234567817', foto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80' },
  { id: 'GP-22', kelas: '1 ALIYAH', nama: 'Ustadz Adib Setiawan', mapel: 'Ushul Fiqh', kitab: 'Al-Waraqat & Lubbul Ushul', noWa: '081234567813', foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80' },
  { id: 'GP-23', kelas: '1 ALIYAH', nama: 'Ustadz Mizan Khoirul', mapel: 'Mustholahul Hadits', kitab: 'Al-Manzhumah Al-Baiquniyyah', noWa: '081234567821', foto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80' },
  { id: 'GP-24', kelas: '1 ALIYAH', nama: 'Ustadz Yasir', mapel: 'Qawa\'id Fiqhiyyah', kitab: 'Al-Faraidul Bahiyyah', noWa: '081234567814', foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80' },
  { id: 'GP-25', kelas: '1 ALIYAH', nama: 'Ustadz Sulaiman', mapel: 'Fiqh Mazhab Syafi\'i', kitab: 'Fathul Qorib Lanjutan', noWa: '081234567822', foto: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80' },

  // 2 ALIYAH
  { id: 'GP-26', kelas: '2 ALIYAH', nama: 'Ustadz Ahmad Shobirin', mapel: 'Tafsir Al-Quran', kitab: 'Tafsir Al-Jalalain', noWa: '081234567817', foto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80' },
  { id: 'GP-27', kelas: '2 ALIYAH', nama: 'Ustadz Mizan Khoirul', mapel: 'Balaghah', kitab: 'Al-Jauharul Maknun', noWa: '081234567821', foto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80' },
  { id: 'GP-28', kelas: '2 ALIYAH', nama: 'Ustadz Yasir', mapel: 'Fiqih Fathul Wahhab', kitab: 'Fathul Wahhab bi Syarhi Manhajit Thullab', noWa: '081234567814', foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80' },
  { id: 'GP-29', kelas: '2 ALIYAH', nama: 'Ustadz Munawar', mapel: 'Mantiq (Logika)', kitab: 'As-Sullamul Munauraq', noWa: '081234567806', foto: 'https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?w=400&auto=format&fit=crop&q=80' },

  // 3 ALIYAH
  { id: 'GP-30', kelas: '3 ALIYAH', nama: 'Ustadz Yasir', mapel: 'Hadits Shahih Bukhari', kitab: 'Shahih Al-Bukhari (Khataman Musalsal)', noWa: '081234567814', foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80' },
  { id: 'GP-31', kelas: '3 ALIYAH', nama: 'Ustadz Sulaiman', mapel: 'Ushul Fiqh Lanjutan', kitab: 'Jam\'ul Jawami\'', noWa: '081234567822', foto: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80' },
  { id: 'GP-32', kelas: '3 ALIYAH', nama: 'Ustadz Mizan Khoirul', mapel: 'Alfiyah Khataman', kitab: 'Alfiyah Ibnu Malik (Bait 700 - 1002)', noWa: '081234567821', foto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80' }
];

export const INITIAL_NADZHOM_LIST: NadzhomRecord[] = [
  { idRow: 1, idSantri: 'S-1001', nama: 'Ahmad Fathan Mubina', kitab: 'Nadzhom Alala', bait: 37, tanggal: '2026-09-20', nilai: 'Mumtaz (A)', kelas: '1 TSANAWIYAH' },
  { idRow: 2, idSantri: 'S-1002', nama: 'Muhammad Zainul Arifin', kitab: 'Aqidatul Awam', bait: 57, tanggal: '2026-09-19', nilai: 'Jayyid Jiddan (B+)', kelas: '1 TSANAWIYAH' },
  { idRow: 3, idSantri: 'S-1003', nama: 'Ilyas Nur Hidayat', kitab: 'Nadzhom Alala', bait: 30, tanggal: '2026-09-18', nilai: 'Jayyid (B)', kelas: '1 TSANAWIYAH' },
  { idRow: 4, idSantri: 'S-2001', nama: 'Muhammad Bilal As-Shidiq', kitab: 'Nadzhom Jurumiyyah', bait: 60, tanggal: '2026-09-21', nilai: 'Mumtaz (A)', kelas: '2 TSANAWIYAH' },
  { idRow: 5, idSantri: 'S-2002', nama: 'Kholilur Rahman', kitab: 'Nadzhom Maqsud', bait: 85, tanggal: '2026-09-17', nilai: 'Jayyid Jiddan (B+)', kelas: '2 TSANAWIYAH' },
  { idRow: 6, idSantri: 'S-3001', nama: 'Luqman Hakim An-Nawawi', kitab: 'Nadzhom Imrithi', bait: 254, tanggal: '2026-09-15', nilai: 'Mumtaz (A+)', kelas: '3 TSANAWIYAH' },
  { idRow: 7, idSantri: 'S-3002', nama: 'Hamid Rusdi As-Salafi', kitab: 'Nadzhom Imrithi', bait: 200, tanggal: '2026-09-14', nilai: 'Jayyid Jiddan (B+)', kelas: '3 TSANAWIYAH' },
  { idRow: 8, idSantri: 'S-4001', nama: 'Mahfudz Al-Ghazali', kitab: 'Alfiyah Ibn Malik', bait: 300, tanggal: '2026-09-12', nilai: 'Mumtaz (A)', kelas: '1 ALIYAH' },
  { idRow: 9, idSantri: 'S-5001', nama: 'Fathurrahman As-Syafi\'i', kitab: 'Alfiyah Ibn Malik', bait: 650, tanggal: '2026-09-10', nilai: 'Mumtaz (A+)', kelas: '2 ALIYAH' },
  { idRow: 10, idSantri: 'S-6001', nama: 'Rahmat Hidayatullah', kitab: 'Alfiyah Ibn Malik (Khatam)', bait: 1002, tanggal: '2026-09-08', nilai: 'Mumtaz Syaraf (A++)', kelas: '3 ALIYAH' }
];

export const INITIAL_NILAI_LIST: NilaiUjianRecord[] = [
  { idRow: 1, idSantri: 'S-1001', nama: 'Ahmad Fathan Mubina', kelas: '1 TSANAWIYAH', pelajaran: 'Nahwu Jurumiyyah', nilai: 92, semester: 'Semester 1' },
  { idRow: 2, idSantri: 'S-1001', nama: 'Ahmad Fathan Mubina', kelas: '1 TSANAWIYAH', pelajaran: 'Shorof Amsilah', nilai: 88, semester: 'Semester 1' },
  { idRow: 3, idSantri: 'S-1001', nama: 'Ahmad Fathan Mubina', kelas: '1 TSANAWIYAH', pelajaran: 'Fiqih Mabadi', nilai: 94, semester: 'Semester 1' },
  { idRow: 4, idSantri: 'S-1002', nama: 'Muhammad Zainul Arifin', kelas: '1 TSANAWIYAH', pelajaran: 'Nahwu Jurumiyyah', nilai: 85, semester: 'Semester 1' },
  { idRow: 5, idSantri: 'S-1002', nama: 'Muhammad Zainul Arifin', kelas: '1 TSANAWIYAH', pelajaran: 'Shorof Amsilah', nilai: 82, semester: 'Semester 1' },
  { idRow: 6, idSantri: 'S-1002', nama: 'Muhammad Zainul Arifin', kelas: '1 TSANAWIYAH', pelajaran: 'Fiqih Mabadi', nilai: 89, semester: 'Semester 1' },
  
  { idRow: 7, idSantri: 'S-2001', nama: 'Muhammad Bilal As-Shidiq', kelas: '2 TSANAWIYAH', pelajaran: 'Nahwu', nilai: 95, semester: 'Semester 1' },
  { idRow: 8, idSantri: 'S-2001', nama: 'Muhammad Bilal As-Shidiq', kelas: '2 TSANAWIYAH', pelajaran: 'Fiqih', nilai: 90, semester: 'Semester 1' },
  { idRow: 9, idSantri: 'S-2001', nama: 'Muhammad Bilal As-Shidiq', kelas: '2 TSANAWIYAH', pelajaran: "I'lal", nilai: 93, semester: 'Semester 1' },
  
  { idRow: 10, idSantri: 'S-3001', nama: 'Luqman Hakim An-Nawawi', kelas: '3 TSANAWIYAH', pelajaran: 'Nahwu Imrithi', nilai: 96, semester: 'Semester 1' },
  { idRow: 11, idSantri: 'S-3001', nama: 'Luqman Hakim An-Nawawi', kelas: '3 TSANAWIYAH', pelajaran: 'Fiqih Fathul Qorib', nilai: 95, semester: 'Semester 1' },
  { idRow: 12, idSantri: 'S-3001', nama: 'Luqman Hakim An-Nawawi', kelas: '3 TSANAWIYAH', pelajaran: 'Hadits Bulughul Marom', nilai: 92, semester: 'Semester 1' }
];

export const INITIAL_ABSENSI_SANTRI: AbsensiSantriRecord[] = [
  { tanggal: '2026-09-22', idSantri: 'S-1001', nama: 'Ahmad Fathan Mubina', kelas: '1 TSANAWIYAH', status: 'Hadir', keterangan: 'Mengikuti roan dan diniyah' },
  { tanggal: '2026-09-22', idSantri: 'S-1002', nama: 'Muhammad Zainul Arifin', kelas: '1 TSANAWIYAH', status: 'Hadir', keterangan: 'Tepat waktu' },
  { tanggal: '2026-09-22', idSantri: 'S-1003', nama: 'Ilyas Nur Hidayat', kelas: '1 TSANAWIYAH', status: 'Izin', keterangan: 'Izin ke poskestren' },
  { tanggal: '2026-09-22', idSantri: 'S-2001', nama: 'Muhammad Bilal As-Shidiq', kelas: '2 TSANAWIYAH', status: 'Hadir', keterangan: 'Tepat waktu' },
  { tanggal: '2026-09-22', idSantri: 'S-3001', nama: 'Luqman Hakim An-Nawawi', kelas: '3 TSANAWIYAH', status: 'Hadir', keterangan: 'Muqoddimah kitab' }
];

export const INITIAL_ABSENSI_GURU: AbsensiGuruRecord[] = [
  { tanggal: '2026-09-22', nama: 'Ustazah Fina Nikmatul Kamelia', mapel: 'ALALA', kelas: '1 TSANAWIYAH', status: 'Hadir', catatan: 'Bab Niat Tholabul Ilmi', hari: 'SABTU', jamKe: 1, waktu: '08.30 - 09.45' },
  { tanggal: '2026-09-22', nama: 'Ustazah Maulida Rohmah', mapel: 'TAJWID', kelas: '1 TSANAWIYAH', status: 'Hadir', catatan: 'Makharijul Huruf', hari: 'AHAD', jamKe: 1, waktu: '08.30 - 09.45' },
  { tanggal: '2026-09-22', nama: 'Ustadz Yasir', mapel: 'AKHLAQ', kelas: '2 TSANAWIYAH', status: 'Hadir', catatan: 'Adab kepada guru', hari: 'SABTU', jamKe: 2, waktu: '10.15 - 11.30' }
];

export const INITIAL_JADWAL_LIST: JadwalPelajaran[] = [
  // 1 TSANAWIYAH
  { kelas: '1 TSANAWIYAH', hari: 'SABTU', jamKe: 1, waktu: '08.30 - 09.45', mapel: 'ALALA', nama: 'Ustazah Fina Nikmatul Kamelia' },
  { kelas: '1 TSANAWIYAH', hari: 'SABTU', jamKe: 2, waktu: '10.15 - 11.30', mapel: 'NAHWU', nama: 'Ustazah Fina Nikmatul Kamelia' },
  { kelas: '1 TSANAWIYAH', hari: 'AHAD', jamKe: 1, waktu: '08.30 - 09.45', mapel: 'TAJWID', nama: 'Ustazah Maulida Rohmah' },
  { kelas: '1 TSANAWIYAH', hari: 'AHAD', jamKe: 2, waktu: '10.15 - 11.30', mapel: 'PEGON', nama: 'Ustazah Kasyifatul Aini' },
  { kelas: '1 TSANAWIYAH', hari: 'SENIN', jamKe: 1, waktu: '08.30 - 09.45', mapel: 'FIQIH', nama: 'Ustadzah Qothrunada' },
  { kelas: '1 TSANAWIYAH', hari: 'SENIN', jamKe: 2, waktu: '10.15 - 11.30', mapel: 'FIQIH', nama: 'Ustadzah Qothrunada' },
  { kelas: '1 TSANAWIYAH', hari: 'SELASA', jamKe: 1, waktu: '08.30 - 09.45', mapel: 'B. ARAB', nama: 'Ustazah Kasyifatul Aini' },
  { kelas: '1 TSANAWIYAH', hari: 'SELASA', jamKe: 2, waktu: '10.15 - 11.30', mapel: 'TAUHID', nama: 'Ustazah Solihah' },
  { kelas: '1 TSANAWIYAH', hari: 'RABU', jamKe: 1, waktu: '08.30 - 09.45', mapel: 'NAHWU', nama: 'Ustazah Fina Nikmatul Kamelia' },
  { kelas: '1 TSANAWIYAH', hari: 'RABU', jamKe: 2, waktu: '10.15 - 11.30', mapel: 'AL-QURAN', nama: 'Ustazah Maulida Rohmah' },
  { kelas: '1 TSANAWIYAH', hari: 'KAMIS', jamKe: 1, waktu: '08.30 - 09.45', mapel: 'SHOROF', nama: 'Ustazah Solihah' },
  { kelas: '1 TSANAWIYAH', hari: 'KAMIS', jamKe: 2, waktu: '10.15 - 11.30', mapel: 'PEGON', nama: 'Ustazah Kasyifatul Aini' },

  // 2 TSANAWIYAH
  { kelas: '2 TSANAWIYAH', hari: 'SABTU', jamKe: 1, waktu: '08.30 - 09.45', mapel: 'FIQIH', nama: 'Ustadz Adib Setiawan' },
  { kelas: '2 TSANAWIYAH', hari: 'SABTU', jamKe: 2, waktu: '10.15 - 11.30', mapel: 'AKHLAQ', nama: 'Ustadz Yasir' },
  { kelas: '2 TSANAWIYAH', hari: 'AHAD', jamKe: 1, waktu: '08.30 - 09.45', mapel: "I'LAL", nama: 'Ustadz Adib Setiawan' },
  { kelas: '2 TSANAWIYAH', hari: 'AHAD', jamKe: 2, waktu: '10.15 - 11.30', mapel: 'FIQIH', nama: 'Ustadz Adib Setiawan' },
  { kelas: '2 TSANAWIYAH', hari: 'SENIN', jamKe: 1, waktu: '08.30 - 09.45', mapel: 'TAJWID', nama: 'Ustazah Isna Mubarokah' },
  { kelas: '2 TSANAWIYAH', hari: 'SENIN', jamKe: 2, waktu: '10.15 - 11.30', mapel: 'TARIKH', nama: 'Ustazah Dewi Faila Shofa' },
  { kelas: '2 TSANAWIYAH', hari: 'SELASA', jamKe: 1, waktu: '08.30 - 09.45', mapel: 'NAHWU', nama: 'Ahmad Shobirin' },
  { kelas: '2 TSANAWIYAH', hari: 'SELASA', jamKe: 2, waktu: '10.15 - 11.30', mapel: 'B. ARAB', nama: 'Ustadz Faza' },
  { kelas: '2 TSANAWIYAH', hari: 'RABU', jamKe: 1, waktu: '08.30 - 09.45', mapel: 'NAHWU', nama: 'Ahmad Shobirin' },
  { kelas: '2 TSANAWIYAH', hari: 'RABU', jamKe: 2, waktu: '10.15 - 11.30', mapel: 'TAUHID', nama: 'Ahmad Shobirin' },
  { kelas: '2 TSANAWIYAH', hari: 'KAMIS', jamKe: 1, waktu: '08.30 - 09.45', mapel: 'HADITS', nama: 'Ustazah Isna Mubarokah' },
  { kelas: '2 TSANAWIYAH', hari: 'KAMIS', jamKe: 2, waktu: '10.15 - 11.30', mapel: 'SHOROF', nama: 'Ustadz Ali Said' },

  // 3 TSANAWIYAH
  { kelas: '3 TSANAWIYAH', hari: 'SABTU', jamKe: 1, waktu: '08.30 - 09.45', mapel: 'AKHLAQ', nama: 'Ustadz Yasir' },
  { kelas: '3 TSANAWIYAH', hari: 'SABTU', jamKe: 2, waktu: '10.15 - 11.30', mapel: 'FIQIH', nama: 'Ustadz Ahmad Shobirin' },
  { kelas: '3 TSANAWIYAH', hari: 'AHAD', jamKe: 1, waktu: '08.30 - 09.45', mapel: 'SHOROF', nama: 'Ustadz Bagus Danial' },
  { kelas: '3 TSANAWIYAH', hari: 'AHAD', jamKe: 2, waktu: '10.15 - 11.30', mapel: "I'LAL", nama: 'Ustadz Bagus Danial' },
  { kelas: '3 TSANAWIYAH', hari: 'SENIN', jamKe: 1, waktu: '08.30 - 09.45', mapel: 'HADITS', nama: 'Ustadz Mizan Khoirul' },
  { kelas: '3 TSANAWIYAH', hari: 'SENIN', jamKe: 2, waktu: '10.15 - 11.30', mapel: 'NAHWU', nama: 'Ustadz Sulaiman' },
  { kelas: '3 TSANAWIYAH', hari: 'SELASA', jamKe: 1, waktu: '08.30 - 09.45', mapel: 'B. ARAB', nama: 'Ustadz M. Khoirul Jadid' },
  { kelas: '3 TSANAWIYAH', hari: 'SELASA', jamKe: 2, waktu: '10.15 - 11.30', mapel: 'FIQIH', nama: 'Ustadz Ahmad Shobirin' },
  { kelas: '3 TSANAWIYAH', hari: 'RABU', jamKe: 1, waktu: '08.30 - 09.45', mapel: 'TARIKH', nama: 'Ustadz Wildan' },
  { kelas: '3 TSANAWIYAH', hari: 'RABU', jamKe: 2, waktu: '10.15 - 11.30', mapel: 'HADITS', nama: 'Ustadz Mizan Khoirul' },
  { kelas: '3 TSANAWIYAH', hari: 'KAMIS', jamKe: 1, waktu: '08.30 - 09.45', mapel: 'TAJWID', nama: 'Ustadz Sulaiman' },
  { kelas: '3 TSANAWIYAH', hari: 'KAMIS', jamKe: 2, waktu: '10.15 - 11.30', mapel: 'TAUHID', nama: 'Ustadz Munawar' },

  // 1 ALIYAH
  { kelas: '1 ALIYAH', hari: 'MALAM SABTU', jamKe: 1, waktu: '19.30 - 21.00', mapel: 'MUSTHOLAHUL HADITS', nama: 'Ustadz Mizan Khoirul' },
  { kelas: '1 ALIYAH', hari: 'MALAM SABTU', jamKe: 2, waktu: '21.30 - 23.00', mapel: 'FIQH', nama: 'Ustadz Sulaiman' },
  { kelas: '1 ALIYAH', hari: 'MALAM AHAD', jamKe: 1, waktu: '19.30 - 21.00', mapel: 'NAHWU', nama: 'Ustadz Ahmad Shobirin' },
  { kelas: '1 ALIYAH', hari: 'MALAM AHAD', jamKe: 2, waktu: '21.30 - 23.00', mapel: 'HADITS', nama: 'Ustadz Mizan Khoirul' },
  { kelas: '1 ALIYAH', hari: 'MALAM SENIN', jamKe: 1, waktu: '19.30 - 21.00', mapel: 'TAUHID', nama: 'Ustadz Munawar' },
  { kelas: '1 ALIYAH', hari: 'MALAM SENIN', jamKe: 2, waktu: '21.30 - 23.00', mapel: 'QOIDAH FIQIH', nama: 'Ustadz Yasir' },
  { kelas: '1 ALIYAH', hari: 'MALAM SELASA', jamKe: 1, waktu: '19.30 - 21.00', mapel: 'NAHWU', nama: 'Ustadz Ahmad Shobirin' },
  { kelas: '1 ALIYAH', hari: 'MALAM SELASA', jamKe: 2, waktu: '21.30 - 23.00', mapel: 'USHUL FIQH', nama: 'Ustadz Adib Setiawan' },
  { kelas: '1 ALIYAH', hari: 'MALAM RABU', jamKe: 1, waktu: '19.30 - 21.00', mapel: "I'LAL", nama: 'Ustadz Bagus Danial' },
  { kelas: '1 ALIYAH', hari: 'MALAM RABU', jamKe: 2, waktu: '21.30 - 23.00', mapel: 'HADITS', nama: 'Ustadz Mizan Khoirul' },
  { kelas: '1 ALIYAH', hari: 'MALAM KAMIS', jamKe: 1, waktu: '19.30 - 21.00', mapel: 'TARIKH', nama: 'Ustadz Wildan' },
  { kelas: '1 ALIYAH', hari: 'MALAM KAMIS', jamKe: 2, waktu: '21.30 - 23.00', mapel: 'FIQH', nama: 'Ustadz Sulaiman' },

  // 2 ALIYAH
  { kelas: '2 ALIYAH', hari: 'MALAM SABTU', jamKe: 1, waktu: '19.30 - 21.00', mapel: 'TAFSIR JALALAIN', nama: 'Ustadz Ahmad Shobirin' },
  { kelas: '2 ALIYAH', hari: 'MALAM SABTU', jamKe: 2, waktu: '21.30 - 23.00', mapel: 'ALFIYAH IBN MALIK', nama: 'Ustadz Sulaiman' },
  { kelas: '2 ALIYAH', hari: 'MALAM AHAD', jamKe: 1, waktu: '19.30 - 21.00', mapel: 'BALAGHOH (JAUHAR MAKNUM)', nama: 'Ustadz Mizan Khoirul' },
  { kelas: '2 ALIYAH', hari: 'MALAM AHAD', jamKe: 2, waktu: '21.30 - 23.00', mapel: 'FATHUL WAHHAB', nama: 'Ustadz Yasir' },
  { kelas: '2 ALIYAH', hari: 'MALAM SENIN', jamKe: 1, waktu: '19.30 - 21.00', mapel: 'USHUL FIQH', nama: 'Ustadz Adib Setiawan' },
  { kelas: '2 ALIYAH', hari: 'MALAM SENIN', jamKe: 2, waktu: '21.30 - 23.00', mapel: 'MANTIQ', nama: 'Ustadz Munawar' },
  { kelas: '2 ALIYAH', hari: 'MALAM SELASA', jamKe: 1, waktu: '19.30 - 21.00', mapel: 'TAFSIR JALALAIN', nama: 'Ustadz Ahmad Shobirin' },
  { kelas: '2 ALIYAH', hari: 'MALAM SELASA', jamKe: 2, waktu: '21.30 - 23.00', mapel: 'FATHUL WAHHAB', nama: 'Ustadz Yasir' },
  { kelas: '2 ALIYAH', hari: 'MALAM RABU', jamKe: 1, waktu: '19.30 - 21.00', mapel: 'BALAGHOH', nama: 'Ustadz Mizan Khoirul' },
  { kelas: '2 ALIYAH', hari: 'MALAM RABU', jamKe: 2, waktu: '21.30 - 23.00', mapel: 'ALFIYAH IBN MALIK', nama: 'Ustadz Sulaiman' },
  { kelas: '2 ALIYAH', hari: 'MALAM KAMIS', jamKe: 1, waktu: '19.30 - 21.00', mapel: 'MANTIQ', nama: 'Ustadz Munawar' },
  { kelas: '2 ALIYAH', hari: 'MALAM KAMIS', jamKe: 2, waktu: '21.30 - 23.00', mapel: 'USHUL FIQH', nama: 'Ustadz Adib Setiawan' },

  // 3 ALIYAH
  { kelas: '3 ALIYAH', hari: 'MALAM SABTU', jamKe: 1, waktu: '19.30 - 21.00', mapel: 'SHOHIH BUKHARI', nama: 'Ustadz Yasir' },
  { kelas: '3 ALIYAH', hari: 'MALAM SABTU', jamKe: 2, waktu: '21.30 - 23.00', mapel: 'FATHUL WAHHAB', nama: 'Ustadz Ahmad Shobirin' },
  { kelas: '3 ALIYAH', hari: 'MALAM AHAD', jamKe: 1, waktu: '19.30 - 21.00', mapel: 'JAM\'UL JAWAMI\'', nama: 'Ustadz Sulaiman' },
  { kelas: '3 ALIYAH', hari: 'MALAM AHAD', jamKe: 2, waktu: '21.30 - 23.00', mapel: 'ALFIYAH (KHATAMAN)', nama: 'Ustadz Mizan Khoirul' },
  { kelas: '3 ALIYAH', hari: 'MALAM SENIN', jamKe: 1, waktu: '19.30 - 21.00', mapel: 'SHOHIH BUKHARI', nama: 'Ustadz Yasir' },
  { kelas: '3 ALIYAH', hari: 'MALAM SENIN', jamKe: 2, waktu: '21.30 - 23.00', mapel: 'JAM\'UL JAWAMI\'', nama: 'Ustadz Sulaiman' },
  { kelas: '3 ALIYAH', hari: 'MALAM SELASA', jamKe: 1, waktu: '19.30 - 21.00', mapel: 'FATHUL WAHHAB', nama: 'Ustadz Ahmad Shobirin' },
  { kelas: '3 ALIYAH', hari: 'MALAM SELASA', jamKe: 2, waktu: '21.30 - 23.00', mapel: 'ALFIYAH (KHATAMAN)', nama: 'Ustadz Mizan Khoirul' },
  { kelas: '3 ALIYAH', hari: 'MALAM RABU', jamKe: 1, waktu: '19.30 - 21.00', mapel: 'SHOHIH BUKHARI', nama: 'Ustadz Yasir' },
  { kelas: '3 ALIYAH', hari: 'MALAM RABU', jamKe: 2, waktu: '21.30 - 23.00', mapel: 'FATHUL WAHHAB', nama: 'Ustadz Ahmad Shobirin' },
  { kelas: '3 ALIYAH', hari: 'MALAM KAMIS', jamKe: 1, waktu: '19.30 - 21.00', mapel: 'JAM\'UL JAWAMI\'', nama: 'Ustadz Sulaiman' },
  { kelas: '3 ALIYAH', hari: 'MALAM KAMIS', jamKe: 2, waktu: '21.30 - 23.00', mapel: 'ALFIYAH (KHATAMAN)', nama: 'Ustadz Mizan Khoirul' }
];

export const INITIAL_SILABUS_MEMAKNAI: SilabusMemaknaiRecord[] = [
  // 1 TSANAWIYAH - SEMESTER 1
  { id: 'SLB-101', kelas: '1 TSANAWIYAH', tingkatan: 'Tsanawiyah', semester: 'Semester 1', namaKitab: 'Matan Al-Jurumiyyah', mulai: 'Fasal 1: Bab Kalam & Tanda I\'rab', batasAkhir: 'Khatam Bab Al-Af\'al (Marfu\'atul Asma\')', materiSaatIni: 'Bab Na\'at & Athaf (Hal. 38)', ustadzPengampu: 'Ustazah Fina Nikmatul Kamelia', targetMateri: 'Bab Kalam s/d Bab Al-Af\'al', status: 'Sesuai Target', keterangan: 'Ngaji bandongan pagi jam ke-2' },
  { id: 'SLB-102', kelas: '1 TSANAWIYAH', tingkatan: 'Tsanawiyah', semester: 'Semester 1', namaKitab: 'Nadzhom Alala', mulai: 'Bait 1: Syuruthu Ta\'allum', batasAkhir: 'Khatam Bait 37: Doa & Adab Guru', materiSaatIni: 'Bait 22: Hurmatul Ustadz', ustadzPengampu: 'Ustazah Fina Nikmatul Kamelia', targetMateri: '37 Bait Nadzhom + Syarah', status: 'Sesuai Target', keterangan: 'Target khatam sebelum mid semester' },
  { id: 'SLB-103', kelas: '1 TSANAWIYAH', tingkatan: 'Tsanawiyah', semester: 'Semester 1', namaKitab: 'Al-Amtsilah At-Tashrifiyyah', mulai: 'Bab 1: Tsulatsi Mujarrad (Fa\'ala Yaf\'ulu)', batasAkhir: 'Bab 6: Tsulatsi Mujarrad Bina\' Naqis & Lafif', materiSaatIni: 'Bab 4: Fa\'ila Yaf\'alu (Hal. 24)', ustadzPengampu: 'Ustazah Solihah', targetMateri: 'Tashrif Tsulatsi Mujarrad Bab 1 - 6', status: 'Sesuai Target', keterangan: 'Wajib hafal bina\' dan wazan' },
  { id: 'SLB-104', kelas: '1 TSANAWIYAH', tingkatan: 'Tsanawiyah', semester: 'Semester 1', namaKitab: 'Mabadi Al-Fiqhiyyah Juz 1 & 2', mulai: 'Bab Thoharoh & Wudhu', batasAkhir: 'Bab Shalat 5 Waktu & Syarat Sah', materiSaatIni: 'Bab Sujud Sahwi & Rukun Shalat (Hal. 18)', ustadzPengampu: 'Ustadzah Qothrunada', targetMateri: 'Kajian Thoharoh, Wudhu, Shalat 5 Waktu', status: 'Sesuai Target', keterangan: 'Praktek ibadah harian santri' },
  { id: 'SLB-105', kelas: '1 TSANAWIYAH', tingkatan: 'Tsanawiyah', semester: 'Semester 1', namaKitab: 'Aqidatul Awam', mulai: 'Bait 1: Bismillahi wal Hamdu', batasAkhir: 'Bait 57: Sifat Wajib & Mustahil Rasul', materiSaatIni: 'Bait 45: Silsilah Nasab Nabi Muhammad', ustadzPengampu: 'Ustazah Solihah', targetMateri: '57 Bait Sifat 20 & Aqoid 50', status: 'Sesuai Target', keterangan: 'Khataman sebelum Imtihan Ganjil' },
  // 1 TSANAWIYAH - SEMESTER 2
  { id: 'SLB-106', kelas: '1 TSANAWIYAH', tingkatan: 'Tsanawiyah', semester: 'Semester 2', namaKitab: 'Matan Al-Jurumiyyah (Juz 2)', mulai: 'Bab Manshubatul Asma\' (Maf\'ul Bih)', batasAkhir: 'Khatam Mahfudhatul Asma\' & Idhofah', materiSaatIni: 'Bab Zharaf Makan & Zaman (Hal. 52)', ustadzPengampu: 'Ustazah Fina Nikmatul Kamelia', targetMateri: 'Manshubat s/d Mahfudhat', status: 'Sedang Berjalan', keterangan: 'Lanjutan kajian i\'rob pegon' },
  { id: 'SLB-107', kelas: '1 TSANAWIYAH', tingkatan: 'Tsanawiyah', semester: 'Semester 2', namaKitab: 'Tuhfatul Athfal', mulai: 'Bab Ahkamun Nun Sakinah wat Tanwin', batasAkhir: 'Khatam Bab Ahkamul Maddi wal Aqsam', materiSaatIni: 'Bab Idgham Bighunnah (Hal. 14)', ustadzPengampu: 'Ustazah Maulida Rohmah', targetMateri: 'Hukum Mad & Ahkamul Huruf', status: 'Sedang Berjalan', keterangan: 'Praktek tajwid tilawah' },

  // 2 TSANAWIYAH - SEMESTER 1
  { id: 'SLB-201', kelas: '2 TSANAWIYAH', tingkatan: 'Tsanawiyah', semester: 'Semester 1', namaKitab: 'Mukhtashar Jiddan (Syarh Jurumiyyah)', mulai: 'Fasal 1: Khutbatul Kitab & Tarkib Kalam', batasAkhir: 'Bab Marfu\'atul Asma\' & Isim Fa\'il', materiSaatIni: 'Bab Mubtada\' & Khabar (Hal. 46)', ustadzPengampu: 'Ustadz Ahmad Shobirin', targetMateri: 'Kajian tarkib i\'rob & Marfu\'atul Asma\'', status: 'Sesuai Target', keterangan: 'Bandongan makna gandul Jawa pegon' },
  { id: 'SLB-202', kelas: '2 TSANAWIYAH', tingkatan: 'Tsanawiyah', semester: 'Semester 1', namaKitab: 'Safinatun Naja & Sullamut Taufiq', mulai: 'Fasal 1: Arkanul Islam wal Iman', batasAkhir: 'Fasal Syuruthul Qashri wal Jam\'i', materiSaatIni: 'Fasal Shalat Jama\'ah & Jam\' Qashar', ustadzPengampu: 'Ustadz Adib Setiawan', targetMateri: 'Fiqih Ibadah & Muamalat Pemula', status: 'Sesuai Target', keterangan: 'Target koreksian makna sah' },
  { id: 'SLB-203', kelas: '2 TSANAWIYAH', tingkatan: 'Tsanawiyah', semester: 'Semester 1', namaKitab: 'Qawa\'idul I\'lal (Mundzir Nadzir)', mulai: 'Kaidah I\'lal 1: Wawu / Ya\' Berharakat', batasAkhir: 'Kaidah I\'lal 19: Idgham Mitslain', materiSaatIni: 'Kaidah I\'lal ke-11: Ibdaal Taa\' (Hal. 30)', ustadzPengampu: 'Ustadz Adib Setiawan', targetMateri: 'Kaidah I\'lal 1 - 19 & Bina\' Mu\'tal', status: 'Sesuai Target', keterangan: 'Penyelesaian soal rumus shorof' },
  { id: 'SLB-204', kelas: '2 TSANAWIYAH', tingkatan: 'Tsanawiyah', semester: 'Semester 1', namaKitab: 'Akhlaq Lil Banin Juz 2', mulai: 'Bab Adabul Walad ma\'a Walidaih', batasAkhir: 'Bab Adabul Muasyarah wal Ukhuwwah', materiSaatIni: 'Bab Husnul Khuluq ma\'al Jiran (Hal. 35)', ustadzPengampu: 'Ustadz Yasir', targetMateri: 'Adab Pergaulan & Birrul Walidain', status: 'Sesuai Target', keterangan: 'Materi adab salafiyah' },
  // 2 TSANAWIYAH - SEMESTER 2
  { id: 'SLB-205', kelas: '2 TSANAWIYAH', tingkatan: 'Tsanawiyah', semester: 'Semester 2', namaKitab: 'Nadzhom Al-Maqsud', mulai: 'Bait 1: Hamdulilahil Ladzi Qod Shorofa', batasAkhir: 'Khatam Bait 113: Bina\' Tsulatsi Mazid', materiSaatIni: 'Bait 60: Fa\'alla & Tafa\'ala', ustadzPengampu: 'Ustadz Ahmad Shobirin', targetMateri: '113 Bait Shorof & Bina\' Tsulatsi Mazid', status: 'Sedang Berjalan', keterangan: 'Hafalan nadzhom berbobot' },
  { id: 'SLB-206', kelas: '2 TSANAWIYAH', tingkatan: 'Tsanawiyah', semester: 'Semester 2', namaKitab: 'Al-Arba\'in An-Nawawiyyah', mulai: 'Hadits 1: Innamal A\'malu bin Niyyat', batasAkhir: 'Hadits 42: Ittaqillaha Haitsuma Kunta', materiSaatIni: 'Hadits 26: Kulli Sulaamaa (Hal. 40)', ustadzPengampu: 'Ustazah Isna Mubarokah', targetMateri: 'Hadits 21 sampai Hadits 42', status: 'Sedang Berjalan', keterangan: 'Pemahaman matan hadits' },

  // 3 TSANAWIYAH - SEMESTER 1
  { id: 'SLB-301', kelas: '3 TSANAWIYAH', tingkatan: 'Tsanawiyah', semester: 'Semester 1', namaKitab: 'Nadzhom Al-Imrithi', mulai: 'Bait 1: Al-Hamdu Lillahi bi Kulli Hamdi', batasAkhir: 'Bait 150: Bab Tawabi\' & Na\'at', materiSaatIni: 'Bait 110: Bab Inna wa Akhwatuha', ustadzPengampu: 'Ustadz Sulaiman', targetMateri: '254 Bait Nadzhom Makna + Muradh', status: 'Sesuai Target', keterangan: 'Khataman sebelum Imtihan Kubro' },
  { id: 'SLB-302', kelas: '3 TSANAWIYAH', tingkatan: 'Tsanawiyah', semester: 'Semester 1', namaKitab: 'Fathul Qorib Al-Mujib (Juz 1)', mulai: 'Kitabuth Thoharoh & Anwa\'ul Miyah', batasAkhir: 'Khatam Kitabuz Zakah wash Shiyam', materiSaatIni: 'Fasal Shalat Jama\' & Qashar (Hal. 34)', ustadzPengampu: 'Ustadz Ahmad Shobirin', targetMateri: 'Kitab Thoharoh, Sholat, Shiyam & Zakat', status: 'Sesuai Target', keterangan: 'Ujian baca kitab gundul' },
  { id: 'SLB-303', kelas: '3 TSANAWIYAH', tingkatan: 'Tsanawiyah', semester: 'Semester 1', namaKitab: 'Bulughul Maram min Adillatil Ahkam', mulai: 'Kitabuth Thoharoh: Bab Bab Miyah', batasAkhir: 'Kitabush Sholah: Bab Shalatil Jama\'ah', materiSaatIni: 'Bab Sujudit Tilawah wash Sahwi', ustadzPengampu: 'Ustadz Mizan Khoirul', targetMateri: 'Hadits Hukum Thoharoh & Sholat', status: 'Sesuai Target', keterangan: 'Hafalan matan & sanad ringkas' },
  { id: 'SLB-304', kelas: '3 TSANAWIYAH', tingkatan: 'Tsanawiyah', semester: 'Semester 1', namaKitab: 'Taisirul Khalaq fi Ilmil Akhlaq', mulai: 'Bab At-Taqwa wal Ikhlas', batasAkhir: 'Bab Az-Zuhd wal Qana\'ah', materiSaatIni: 'Bab Al-Amanah wash Shidq', ustadzPengampu: 'Ustadz Yasir', targetMateri: 'Bab Tazkiyatun Nafs & Zuhud', status: 'Sesuai Target', keterangan: 'Khatam separuh juz' },
  // 3 TSANAWIYAH - SEMESTER 2
  { id: 'SLB-305', kelas: '3 TSANAWIYAH', tingkatan: 'Tsanawiyah', semester: 'Semester 2', namaKitab: 'Fathul Qorib (Juz 2 - Muamalah & Nikah)', mulai: 'Kitabul Buyu\' wal Mu\'amalat', batasAkhir: 'Khatam Kitabun Nikah wal Jinayat', materiSaatIni: 'Fasal Khiyar & Riba (Hal. 68)', ustadzPengampu: 'Ustadz Ahmad Shobirin', targetMateri: 'Kitabul Buyu\', Faraidh, Nikah, Jinayat', status: 'Sedang Berjalan', keterangan: 'Materi Bahtsul Masail dasar' },
  { id: 'SLB-306', kelas: '3 TSANAWIYAH', tingkatan: 'Tsanawiyah', semester: 'Semester 2', namaKitab: 'Mandzumah Jazariyyah', mulai: 'Bait 1: Yaqulu Raji Afwi Rabbi', batasAkhir: 'Khatam Bait 107: Ahkamul Waqfi wal Ibtida\'', materiSaatIni: 'Bait 54: Sifatul Huruf Al-Ashliyyah', ustadzPengampu: 'Ustadz Sulaiman', targetMateri: '107 Bait Tajwid Tajridul Huruf', status: 'Sedang Berjalan', keterangan: 'Sanad tajwid santri akhir' },

  // 1 ALIYAH - SEMESTER 1
  { id: 'SLB-401', kelas: '1 ALIYAH', tingkatan: 'Aliyah', semester: 'Semester 1', namaKitab: 'Alfiyah Ibnu Malik (Bait 1 - 350)', mulai: 'Bait 1: Qola Muhammadun Huwabnu Maliki', batasAkhir: 'Bait 350: Bab Al-I\'mal wal Isytighol', materiSaatIni: 'Bait 180: Bab Isim Maushul & Shilah', ustadzPengampu: 'Ustadz Ahmad Shobirin', targetMateri: 'Muqoddimah s/d I\'rab Af\'al', status: 'Sesuai Target', keterangan: 'Ngaji malam hari ba\'da Isya\'' },
  { id: 'SLB-402', kelas: '1 ALIYAH', tingkatan: 'Aliyah', semester: 'Semester 1', namaKitab: 'Al-Waraqat & Lubbul Ushul', mulai: 'Fasal 1: Ta\'riful Ushul wal Fiqh', batasAkhir: 'Fasal Dalilul Amr wan Nahyi', materiSaatIni: 'Fasal Al-Amru wal Khas (Hal. 22)', ustadzPengampu: 'Ustadz Adib Setiawan', targetMateri: 'Materi Ushul Fiqh: Am, Khas, Amr & Nahyi', status: 'Sesuai Target', keterangan: 'Kajian ushuliyah salafiyah' },
  { id: 'SLB-403', kelas: '1 ALIYAH', tingkatan: 'Aliyah', semester: 'Semester 1', namaKitab: 'Al-Manzhumah Al-Baiquniyyah', mulai: 'Bait 1: Abdau bil Hamdi Musholliyan', batasAkhir: 'Khatam Bait 34: Hadits Maudhu\'', materiSaatIni: 'Bait 18: Hadits Hasan & Dhaif', ustadzPengampu: 'Ustadz Mizan Khoirul', targetMateri: '34 Bait Istilah Ilmu Hadits', status: 'Sesuai Target', keterangan: 'Target hafalan mutqin' },
  { id: 'SLB-404', kelas: '1 ALIYAH', tingkatan: 'Aliyah', semester: 'Semester 1', namaKitab: 'Al-Faraidul Bahiyyah', mulai: 'Kaidah 1: Al-Umuuru bi Maqooshidihaa', batasAkhir: 'Kaidah 5: Al-Adatu Muhakkamatun', materiSaatIni: 'Kaidah 3: Al-Masyaqqatu Tajlibut Taisir', ustadzPengampu: 'Ustadz Yasir', targetMateri: 'Al-Qawa\'idul Khomsah Al-Kubra', status: 'Sesuai Target', keterangan: 'Kaidah ushul fiqih aplikatif' },
  // 1 ALIYAH - SEMESTER 2
  { id: 'SLB-405', kelas: '1 ALIYAH', tingkatan: 'Aliyah', semester: 'Semester 2', namaKitab: 'Alfiyah Ibnu Malik (Bait 351 - 700)', mulai: 'Bait 351: Bab At-Ta\'addi wal Luzum', batasAkhir: 'Bait 700: Bab At-Tamyiz wal Istitsna\'', materiSaatIni: 'Bait 480: Bab Munada & Idhafah', ustadzPengampu: 'Ustadz Ahmad Shobirin', targetMateri: 'Bab Al-I\'mal, Isim Fa\'il, Maf\'ul, Na\'at, Athaf', status: 'Sedang Berjalan', keterangan: 'Tarkib nahwu madya' },
  { id: 'SLB-406', kelas: '1 ALIYAH', tingkatan: 'Aliyah', semester: 'Semester 2', namaKitab: 'Ghayatul Wushul Syarh Lubbil Ushul', mulai: 'Mabahitsul Kitab was Sunnah', batasAkhir: 'Mabahitsul Ijma\' wal Qiyas', materiSaatIni: 'Fasal Al-Mujmal wal Mubayyan', ustadzPengampu: 'Ustadz Adib Setiawan', targetMateri: 'Kaidah Istinbath Syar\'iyyah', status: 'Sedang Berjalan', keterangan: 'Kajian ushul fiqih mendalam' },

  // 2 ALIYAH - SEMESTER 1
  { id: 'SLB-501', kelas: '2 ALIYAH', tingkatan: 'Aliyah', semester: 'Semester 1', namaKitab: 'Tafsir Al-Jalalain (Juz 1 - 3)', mulai: 'Surah Al-Fatihah & Awal Al-Baqarah', batasAkhir: 'Akhir Surah Ali Imran (Ayat 200)', materiSaatIni: 'Surah Al-Baqarah Ayat 183 - 187 (Ayat Puasa)', ustadzPengampu: 'Ustadz Ahmad Shobirin', targetMateri: 'Surah Al-Fatihah, Al-Baqarah s/d Ali Imran', status: 'Sesuai Target', keterangan: 'Ngaji tafsir malam hari' },
  { id: 'SLB-502', kelas: '2 ALIYAH', tingkatan: 'Aliyah', semester: 'Semester 1', namaKitab: 'Al-Jauharul Maknun', mulai: 'Bab Ilmil Ma\'ani: Al-Khabar wal Insya\'', batasAkhir: 'Bab Ilmil Badi\': Al-Muhassinat', materiSaatIni: 'Bab At-Tasybih wal Isti\'arah', ustadzPengampu: 'Ustadz Mizan Khoirul', targetMateri: 'Fan Balaghah: Ilmu Ma\'ani, Bayan, & Badi\'', status: 'Sesuai Target', keterangan: 'Membedah sastra Al-Quran' },
  { id: 'SLB-503', kelas: '2 ALIYAH', tingkatan: 'Aliyah', semester: 'Semester 1', namaKitab: 'Fathul Wahhab bi Syarhi Manhajit Thullab', mulai: 'Kitabul Buyu\' wal Qiradh', batasAkhir: 'Kitabul Waqfi wal Washiyyah', materiSaatIni: 'Fasal Rahn & Kafalah (Hal. 82)', ustadzPengampu: 'Ustadz Yasir', targetMateri: 'Bab Buyu\', Salam, Rahn & Muamalah', status: 'Sesuai Target', keterangan: 'Kajian Fiqih tingkat tinggi' },
  { id: 'SLB-504', kelas: '2 ALIYAH', tingkatan: 'Aliyah', semester: 'Semester 1', namaKitab: 'As-Sullamul Munauraq', mulai: 'Bait 1: Hamdan li Man Qod Akhrajan Nata-ij', batasAkhir: 'Bait 80: Bab Al-Qiyas wal Burhan', materiSaatIni: 'Bait 42: Bab Al-Kulliyyat Al-Khams', ustadzPengampu: 'Ustadz Munawar', targetMateri: 'Ilmu Mantiq: Tashawwur, Tashdiq, Qiyas', status: 'Sesuai Target', keterangan: 'Logika dialektika ushul' },
  // 2 ALIYAH - SEMESTER 2
  { id: 'SLB-505', kelas: '2 ALIYAH', tingkatan: 'Aliyah', semester: 'Semester 2', namaKitab: 'Tafsir Al-Jalalain (Juz 4 - 6)', mulai: 'Awal Surah An-Nisa\' (Ayat 1)', batasAkhir: 'Akhir Surah Al-Ma\'idah', materiSaatIni: 'Surah An-Nisa\' Ayat Faraidh & Mahram', ustadzPengampu: 'Ustadz Ahmad Shobirin', targetMateri: 'Surah An-Nisa\' & Al-Ma\'idah', status: 'Sedang Berjalan', keterangan: 'Kajian tafsir ayat ahkam' },
  { id: 'SLB-506', kelas: '2 ALIYAH', tingkatan: 'Aliyah', semester: 'Semester 2', namaKitab: 'Uqudul Juman fi Ilmil Ma\'ani wal Bayan', mulai: 'Muqaddimah Ilmu Balaghah As-Suyuthi', batasAkhir: 'Bab Fashl wal Washl wal Ijaz', materiSaatIni: 'Bab Al-Qashr wal Hasyr', ustadzPengampu: 'Ustadz Mizan Khoirul', targetMateri: 'Sastra Balaghah Lanjutan Imam As-Suyuthi', status: 'Sedang Berjalan', keterangan: 'Kajian sastra Arab tingkat tinggi' },

  // 3 ALIYAH - SEMESTER 1
  { id: 'SLB-601', kelas: '3 ALIYAH', tingkatan: 'Aliyah', semester: 'Semester 1', namaKitab: 'Shahih Al-Bukhari (Musalsal)', mulai: 'Kitab Bad\'il Wahyi (Hadits 1)', batasAkhir: 'Khatam Kitabul Iman (Hadits 58)', materiSaatIni: 'Kitabul Ilmi: Bab Man Yu\'idul Hadits Tsalatsan', ustadzPengampu: 'Ustadz Yasir', targetMateri: 'Kitab Bad\'il Wahyi s/d Kitabul Iman', status: 'Sesuai Target', keterangan: 'Khataman musalsal sanad pengasuh' },
  { id: 'SLB-602', kelas: '3 ALIYAH', tingkatan: 'Aliyah', semester: 'Semester 1', namaKitab: 'Jam\'ul Jawami\' Tajuddin As-Subki', mulai: 'Al-Kitabul Awwal: Fil Kitabi wal Bayan', batasAkhir: 'Al-Kitabut Tsani: Fis Sunnah wal Akhbar', materiSaatIni: 'Fasal Af\'alur Rasul Shallallahu \'Alaihi wa Sallam', ustadzPengampu: 'Ustadz Sulaiman', targetMateri: 'Kajian Ushul Fiqh Lanjutan & Istinbath Hukum', status: 'Sesuai Target', keterangan: 'Materi Bahtsul Masail santri senior' },
  { id: 'SLB-603', kelas: '3 ALIYAH', tingkatan: 'Aliyah', semester: 'Semester 1', namaKitab: 'Alfiyah Ibnu Malik (Khataman Bait 700 - 1002)', mulai: 'Bait 700: Bab At-Tashghir wal Iddikhor', batasAkhir: 'Khatam Bait 1002: Tammat bi Hamdillah', materiSaatIni: 'Bait 860: Bab Al-I\'lal bil Qalbi wal Hadzf', ustadzPengampu: 'Ustadz Mizan Khoirul', targetMateri: 'Bait 700 sampai Bait 1002 Khatam', status: 'Sesuai Target', keterangan: 'Persiapan Wisuda Alfiyah Akbar' },
  // 3 ALIYAH - SEMESTER 2
  { id: 'SLB-604', kelas: '3 ALIYAH', tingkatan: 'Aliyah', semester: 'Semester 2', namaKitab: 'Shahih Muslim & Sunan Abi Dawud', mulai: 'Muqaddimah Shahih Muslim (Ilmu Sanad)', batasAkhir: 'Kitabul Fitan wa Asyrathis Sa\'ah', materiSaatIni: 'Kitabul Birr wash Shilah wal Adab', ustadzPengampu: 'Ustadz Yasir', targetMateri: 'Kitabul Ilmi wal Fitan & Takhrij Hadits', status: 'Sedang Berjalan', keterangan: 'Kajian Sanad Kutubussittah' },
  { id: 'SLB-605', kelas: '3 ALIYAH', tingkatan: 'Aliyah', semester: 'Semester 2', namaKitab: 'Ihya Ulumiddin (Mukhtashar)', mulai: 'Rub\'ul Ibadat: Kitabul Ilmi wal I\'tiqad', batasAkhir: 'Rub\'ul Munjiyat: Bab Tawbah wash Shabr', materiSaatIni: 'Bab Adab Tilawatil Qur\'an wal Adzkar', ustadzPengampu: 'Ustadz Ahmad Shobirin', targetMateri: 'Rub\'ul Ibadat & Rub\'ul Muhlikat', status: 'Sedang Berjalan', keterangan: 'Tasawwuf Amali & Adab Khidmah' }
];

export const INITIAL_SYAHRIYAH_LIST: SyahriyahRecord[] = [
  // Ahmad Fathan Mubina (S-1001)
  { id: 'SY-101', idSantri: 'S-1001', namaSantri: 'Ahmad Fathan Mubina', bulan: 'Juli 2026', nominal: 350000, tanggalBayar: '2026-07-08', status: 'Lunas', keterangan: 'Via Transfer Bank BRI' },
  { id: 'SY-102', idSantri: 'S-1001', namaSantri: 'Ahmad Fathan Mubina', bulan: 'Agustus 2026', nominal: 350000, tanggalBayar: '2026-08-05', status: 'Lunas', keterangan: 'Tunai di Kantor Bendahara' },
  { id: 'SY-103', idSantri: 'S-1001', namaSantri: 'Ahmad Fathan Mubina', bulan: 'September 2026', nominal: 350000, tanggalBayar: '-', status: 'Menunggak', keterangan: 'Melewati tempo tgl 10 September' },

  // Muhammad Zainul Arifin (S-1002)
  { id: 'SY-201', idSantri: 'S-1002', namaSantri: 'Muhammad Zainul Arifin', bulan: 'Juli 2026', nominal: 350000, tanggalBayar: '2026-07-06', status: 'Lunas', keterangan: 'Via Bank Mandiri' },
  { id: 'SY-202', idSantri: 'S-1002', namaSantri: 'Muhammad Zainul Arifin', bulan: 'Agustus 2026', nominal: 350000, tanggalBayar: '2026-08-09', status: 'Lunas', keterangan: 'Via Transfer BCA' },
  { id: 'SY-203', idSantri: 'S-1002', namaSantri: 'Muhammad Zainul Arifin', bulan: 'September 2026', nominal: 350000, tanggalBayar: '2026-09-07', status: 'Lunas', keterangan: 'Via Bank BSI' },

  // Farhan Dwi Ramadhan (S-1004)
  { id: 'SY-301', idSantri: 'S-1004', namaSantri: 'Farhan Dwi Ramadhan', bulan: 'September 2026', nominal: 350000, tanggalBayar: '-', status: 'Belum Bayar', keterangan: 'Belum konfirmasi transfer' },

  // Muhammad Bilal (S-2001)
  { id: 'SY-401', idSantri: 'S-2001', namaSantri: 'Muhammad Bilal As-Shidiq', bulan: 'September 2026', nominal: 350000, tanggalBayar: '2026-09-02', status: 'Lunas', keterangan: 'Lunas Awal Bulan' }
];

export const INITIAL_UANG_SAKU_LIST: UangSakuRecord[] = [
  // Ahmad Fathan Mubina (S-1001)
  { id: 'US-101', idSantri: 'S-1001', namaSantri: 'Ahmad Fathan Mubina', tanggal: '2026-09-10', tipe: 'Masuk', nominal: 200000, keterangan: 'Kiriman Orang Tua via Bendahara', saldoSetelah: 200000 },
  { id: 'US-102', idSantri: 'S-1001', namaSantri: 'Ahmad Fathan Mubina', tanggal: '2026-09-14', tipe: 'Keluar', nominal: 15000, keterangan: 'Beli Buku Tulis & Pena Pegon', saldoSetelah: 185000 },

  // Muhammad Zainul Arifin (S-1002)
  { id: 'US-201', idSantri: 'S-1002', namaSantri: 'Muhammad Zainul Arifin', tanggal: '2026-09-08', tipe: 'Masuk', nominal: 150000, keterangan: 'Kiriman Orang Tua bulanan', saldoSetelah: 150000 },
  { id: 'US-202', idSantri: 'S-1002', namaSantri: 'Muhammad Zainul Arifin', tanggal: '2026-09-15', tipe: 'Keluar', nominal: 75000, keterangan: 'Beli Kitab Jurumiyah & Sorof', saldoSetelah: 75000 },

  // Ilyas Nur Hidayat (S-1003)
  { id: 'US-301', idSantri: 'S-1003', namaSantri: 'Ilyas Nur Hidayat', tanggal: '2026-09-01', tipe: 'Masuk', nominal: 250000, keterangan: 'Saldo Awal Bulan', saldoSetelah: 250000 },
  { id: 'US-302', idSantri: 'S-1003', namaSantri: 'Ilyas Nur Hidayat', tanggal: '2026-09-18', tipe: 'Keluar', nominal: 20000, keterangan: 'Keperluan Poskestren', saldoSetelah: 230000 }
];

export const INITIAL_KURIKULUM_LIST: KurikulumKitabRecord[] = [
  // 1 TSANAWIYAH
  { id: 'KUR-1', kelas: '1 TSANAWIYAH', mapel: 'Nahwu', kitab: 'Al-Jurumiyyah & Nadzhom Alala', muallif: 'Ibnu Ajurrum & Az-Zarnuji', targetSemester: 'Bab Kalam s/d Bab Al-Af\'al', ustadzPengampu: 'Ustazah Fina Nikmatul Kamelia' },
  { id: 'KUR-2', kelas: '1 TSANAWIYAH', mapel: 'Shorof', kitab: 'Al-Amtsilah At-Tashrifiyyah', muallif: 'KH. Muhammad Ma\'shum bin Ali', targetSemester: 'Tashrif Tsulatsi Mujarrad Bab 1 - 6', ustadzPengampu: 'Ustazah Solihah' },
  { id: 'KUR-3', kelas: '1 TSANAWIYAH', mapel: 'Fiqih', kitab: 'Mabadi Al-Fiqhiyyah Juz 1 & 2', muallif: 'Umar Abdul Jabbar', targetSemester: 'Thoharoh, Wudhu, Shalat Fardhu', ustadzPengampu: 'Ustadzah Qothrunada' },
  { id: 'KUR-4', kelas: '1 TSANAWIYAH', mapel: 'Tauhid', kitab: 'Aqidatul Awam', muallif: 'Syaikh Ahmad Al-Marzuqi', targetSemester: 'Sifat Wajib, Mustahil, Jaiz Bagi Allah & Rasul', ustadzPengampu: 'Ustazah Solihah' },
  { id: 'KUR-5', kelas: '1 TSANAWIYAH', mapel: 'Tajwid', kitab: 'Hidayatus Shibyan / Tuhfatul Athfal', muallif: 'Syaikh Sa\'id bin Sa\'d', targetSemester: 'Hukum Nun Mati, Tanwin, Mim Mati, & Idgham', ustadzPengampu: 'Ustazah Maulida Rohmah' },
  { id: 'KUR-6', kelas: '1 TSANAWIYAH', mapel: 'Pegon & Bahasa Arab', kitab: 'Al-Miftah Lil Pegon & Durusullughah', muallif: 'Tim Asatidz Pondok Salaf', targetSemester: 'Kaidah Tulis Pegon Jawa & Mufradat Harian', ustadzPengampu: 'Ustazah Kasyifatul Aini' },

  // 2 TSANAWIYAH
  { id: 'KUR-7', kelas: '2 TSANAWIYAH', mapel: 'Nahwu', kitab: 'Mukhtashar Jiddan & Nadzhom Al-Maqsud', muallif: 'Syaikh Zaini Dahlan & Ahmad bin Abdurrahim', targetSemester: 'Marfuatul Asma\' s/d Manshubatul Asma\'', ustadzPengampu: 'Ustadz Ahmad Shobirin' },
  { id: 'KUR-8', kelas: '2 TSANAWIYAH', mapel: 'Shorof & I\'lal', kitab: 'Qowa\'idul I\'lal & Nadzhom Maqsud', muallif: 'Mundzir Nadzir', targetSemester: 'Kaidah I\'lal 1 - 19 & Bina\' Mu\'tal', ustadzPengampu: 'Ustadz Adib Setiawan' },
  { id: 'KUR-9', kelas: '2 TSANAWIYAH', mapel: 'Fiqih', kitab: 'Safinatun Naja & Sullamut Taufiq', muallif: 'Syaikh Salim bin Sumair Al-Hadhrami', targetSemester: 'Kajian Fiqih Ibadah & Muamalah Dasar', ustadzPengampu: 'Ustadz Adib Setiawan' },
  { id: 'KUR-10', kelas: '2 TSANAWIYAH', mapel: 'Akhlaq', kitab: 'Akhlaq Lil Banin Juz 2', muallif: 'Umar bin Ahmad Baradja', targetSemester: 'Adab Bergaul, Menghormati Guru & Orang Tua', ustadzPengampu: 'Ustadz Yasir' },
  { id: 'KUR-11', kelas: '2 TSANAWIYAH', mapel: 'Hadits', kitab: 'Al-Arba\'in An-Nawawiyyah', muallif: 'Imam An-Nawawi', targetSemester: 'Hadits 1 s/d Hadits 25 (Hafalan & Pemahaman)', ustadzPengampu: 'Ustazah Isna Mubarokah' },
  { id: 'KUR-12', kelas: '2 TSANAWIYAH', mapel: 'Tarikh Islam', kitab: 'Khulashoh Nuril Yaqin Juz 1 & 2', muallif: 'Umar Abdul Jabbar', targetSemester: 'Sirah Nabawiyyah Periode Makkah & Madinah', ustadzPengampu: 'Ustazah Dewi Faila Shofa' },

  // 3 TSANAWIYAH
  { id: 'KUR-13', kelas: '3 TSANAWIYAH', mapel: 'Nahwu', kitab: 'Al-Imrithi (Nadzhom & Syarah)', muallif: 'Syarafuddin Yahya Al-Imrithi', targetSemester: 'Tarkib Kalimat & Hafalan 254 Bait Lengkap', ustadzPengampu: 'Ustadz Sulaiman' },
  { id: 'KUR-14', kelas: '3 TSANAWIYAH', mapel: 'Fiqih', kitab: 'Fathul Qorib Al-Mujib', muallif: 'Ibnu Qasim Al-Ghazi', targetSemester: 'Kitab Thoharoh, Sholat, Zakat, & Shiyam', ustadzPengampu: 'Ustadz Ahmad Shobirin' },
  { id: 'KUR-15', kelas: '3 TSANAWIYAH', mapel: 'Hadits', kitab: 'Bulughul Maram min Adillatil Ahkam', muallif: 'Al-Hafizh Ibnu Hajar Al-Asqalani', targetSemester: 'Kitab Thoharoh & Bab Shalatul Jama\'ah', ustadzPengampu: 'Ustadz Mizan Khoirul' },
  { id: 'KUR-16', kelas: '3 TSANAWIYAH', mapel: 'Akhlaq', kitab: 'Taisirul Khalaq fi Ilmil Akhlaq', muallif: 'Hafizh Hasan Al-Mas\'udi', targetSemester: 'Tazkiyatun Nafs & Perangai Terpuji', ustadzPengampu: 'Ustadz Yasir' },
  { id: 'KUR-17', kelas: '3 TSANAWIYAH', mapel: 'Tajwid Al-Quran', kitab: 'Jazariyyah (Manzhumatul Jazariyyah)', muallif: 'Imam Ibnul Jazari', targetSemester: 'Makharij, Shifatul Huruf, Ahkamul Mad', ustadzPengampu: 'Ustadz Sulaiman' },

  // 1 ALIYAH
  { id: 'KUR-18', kelas: '1 ALIYAH', mapel: 'Nahwu & Shorof', kitab: 'Alfiyah Ibnu Malik (Juz 1)', muallif: 'Ibnu Malik Al-Andalusi', targetSemester: 'Bait 1 s/d 350 (Muqoddimah s/d I\'rab Af\'al)', ustadzPengampu: 'Ustadz Ahmad Shobirin' },
  { id: 'KUR-19', kelas: '1 ALIYAH', mapel: 'Ushul Fiqh', kitab: 'Al-Waraqat & Lubbul Ushul', muallif: 'Imam Al-Haramain Al-Juwaini', targetSemester: 'Am, Khas, Mujmal, Mubayyan, Amr & Nahyi', ustadzPengampu: 'Ustadz Adib Setiawan' },
  { id: 'KUR-20', kelas: '1 ALIYAH', mapel: 'Mustholahul Hadits', kitab: 'Al-Baiquniyyah & Taisir Mustholah', muallif: 'Umar Al-Baiquni & Dr. Mahmud Thohan', targetSemester: 'Shahih, Hasan, Dha\'if, Maqlub, Mursal', ustadzPengampu: 'Ustadz Mizan Khoirul' },
  { id: 'KUR-21', kelas: '1 ALIYAH', mapel: 'Qawa\'id Fiqhiyyah', kitab: 'Al-Faraidul Bahiyyah', muallif: 'Syaikh Abu Bakar Al-Ahdal', targetSemester: 'Al-Qawa\'idul Khomsah Al-Kubra', ustadzPengampu: 'Ustadz Yasir' },

  // 2 ALIYAH
  { id: 'KUR-22', kelas: '2 ALIYAH', mapel: 'Tafsir Al-Quran', kitab: 'Tafsir Al-Jalalain', muallif: 'Jalaluddin Al-Mahalli & As-Suyuthi', targetSemester: 'Surah Al-Baqarah s/d An-Nisa', ustadzPengampu: 'Ustadz Ahmad Shobirin' },
  { id: 'KUR-23', kelas: '2 ALIYAH', mapel: 'Balaghah', kitab: 'Al-Jauharul Maknun', muallif: 'Abdurrahman Al-Akhdhari', targetSemester: 'Ilmu Ma\'ani, Bayan, & Badi\'', ustadzPengampu: 'Ustadz Mizan Khoirul' },
  { id: 'KUR-24', kelas: '2 ALIYAH', mapel: 'Fiqih Madzhab Syafi\'i', kitab: 'Fathul Wahhab bi Syarhi Manhajit Thullab', muallif: 'Syaikhul Islam Zakariya Al-Anshari', targetSemester: 'Bab Buyu\' & Muamalat Maliyyah', ustadzPengampu: 'Ustadz Yasir' },
  { id: 'KUR-25', kelas: '2 ALIYAH', mapel: 'Mantiq (Logika Islam)', kitab: 'As-Sullamul Munauraq', muallif: 'Abdurrahman Al-Akhdhari', targetSemester: 'Tashawwur, Tashdiq, Dilalah, & Qiyas', ustadzPengampu: 'Ustadz Munawar' },

  // 3 ALIYAH
  { id: 'KUR-26', kelas: '3 ALIYAH', mapel: 'Hadits Shahih', kitab: 'Shahih Al-Bukhari (Khataman Musalsal)', muallif: 'Imam Muhammad bin Ismail Al-Bukhari', targetSemester: 'Kitab Bad\'il Wahyi s/d Kitabul Iman', ustadzPengampu: 'Ustadz Yasir' },
  { id: 'KUR-27', kelas: '3 ALIYAH', mapel: 'Ushul Fiqh Lanjutan', kitab: 'Jam\'ul Jawami\'', muallif: 'Tajuddin As-Subki', targetSemester: 'Qiyas, Istihsan, Maslahah Mursalah, Ijtihad', ustadzPengampu: 'Ustadz Sulaiman' },
  { id: 'KUR-28', kelas: '3 ALIYAH', mapel: 'Alfiyah Khataman', kitab: 'Alfiyah Ibnu Malik (Bait 700 s/d 1002)', muallif: 'Ibnu Malik Al-Andalusi', targetSemester: 'Khataman Bait 1002 & Wisuda Alfiyah', ustadzPengampu: 'Ustadz Mizan Khoirul' }
];

export const INITIAL_PENGURUS_LIST: Pengurus[] = [
  {
    id: 'PNG-001',
    nama: 'Ust. H. Ahmad Fauzi Ridwan',
    password: 'pengurus123',
    jabatan: 'Ketua Pengurus / Lurah Pondok',
    kelasBimbingan: '1 TSANAWIYAH',
    mapel: 'Fathul Qorib & Fiqih',
    noWa: '081234567810',
    foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    email: 'lurahpondok@almaliki.ac.id',
    tugasUtama: 'Koordinator Harian & Kebijakan Ketertiban Santri'
  },
  {
    id: 'PNG-002',
    nama: 'Ust. Muhammad Ilyas Al-Hafidz',
    password: 'pengurus123',
    jabatan: 'Kasi Pendidikan & Muhafadzoh',
    kelasBimbingan: '2 TSANAWIYAH',
    mapel: 'Tahfidz & Nadzhom Imrithi',
    noWa: '081234567811',
    foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    email: 'pendidikan@almaliki.ac.id',
    tugasUtama: 'Penanggung Jawab Kurikulum, Ujian Muhafadzoh, & Ujian Baca Kitab'
  },
  {
    id: 'PNG-003',
    nama: 'Ustazah Fina Nikmatul Kamelia',
    password: 'pengurus123',
    jabatan: 'Wali Kelas & Bendahara Syahriyah',
    kelasBimbingan: '1 TSANAWIYAH',
    mapel: 'Nahwu & Matan Jurumiyyah',
    noWa: '081234567801',
    foto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    email: 'bendahara@almaliki.ac.id',
    tugasUtama: 'Pengelolaan Administrasi Kelas, Syahriyah & Uang Saku Santri'
  },
  {
    id: 'PNG-004',
    nama: 'Ust. Zainal Abidin S.Pd.I',
    password: 'pengurus123',
    jabatan: 'Kamtib / Koordinator Keamanan Pondok',
    kelasBimbingan: '3 TSANAWIYAH',
    mapel: 'Akhlaq Lil Banin & Ta\'lim Muta\'allim',
    noWa: '081234567812',
    foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    email: 'kamtib@almaliki.ac.id',
    tugasUtama: 'Penegakan Disiplin, Perizinan Santri & Monitoring Absensi Harian'
  }
];

export const INITIAL_KALENDER_AKADEMIK: KalenderAkademikEvent[] = [
  {
    id: 'EVT-003',
    judul: 'Kajian Rutin Selapanan & Doa Bersama Wali Santri',
    tanggalMulai: '2026-10-16',
    tanggalSelesai: '2026-10-16',
    waktu: '06.30 - 11.30 WIB',
    kategori: 'Pengajian',
    lokasi: 'Halaman Utama Pondok Pesantren',
    deskripsi: 'Pertemuan silaturahmi berkala antara pengasuh, asatidz, dan wali santri sekaligus pembagian laporan perkembangan santri.',
    isUrgentNotif: false,
    sasaran: 'Wali Santri, Asatidz, Pengurus'
  },
  {
    id: 'EVT-004',
    judul: 'Rapat Koordinasi Kamtib & Keamanan Asrama',
    tanggalMulai: '2026-09-30',
    tanggalSelesai: '2026-09-30',
    waktu: '21.00 - 22.30 WIB',
    kategori: 'Rapat',
    lokasi: 'Kantor Keamanan Santri',
    deskripsi: 'Penertiban jam belajar malam dan penyesuaian jadwal piket pos jaga pesantren.',
    isUrgentNotif: true,
    sasaran: 'Divisi Kamtib & Keamanan'
  }
];

export const INITIAL_UJIAN_SANTRI_LIST: UjianSantriRecord[] = [
  {
    id: 'UJN-001',
    idSantri: 'S-1001',
    namaSantri: 'Ahmad Fathan Mubina',
    kelas: '1 TSANAWIYAH',
    semester: 'Semester Ganjil 2026/2027',
    tanggal: '2026-09-20',
    nilaiKoreksianKitab: 92,
    predikatKoreksianKitab: 'Mumtaz (Sangat Lengkap & Sah)',
    kitabKoreksian: 'Kitab Fathul Qorib & Mabadi Fiqh',
    catatanKoreksianKitab: 'Makna gandul pegon sangat rapi dan mutaba\'ah pengajian lengkap.',
    nilaiMuhafadzoh: 96,
    predikatMuhafadzoh: 'Mumtaz (Lancar 254 Bait)',
    kitabMuhafadzoh: 'Nadzhom Al-Imrithi',
    catatanMuhafadzoh: 'Hafalan sangat mutqin, makharijul huruf dan tajwid terjaga.',
    nilaiBacaKitab: 90,
    predikatBacaKitab: 'Mumtaz (Fashih & Paham Tarkib)',
    kitabBaca: 'Fathul Qorib Bab Sholat',
    catatanBacaKitab: 'Mampu menjelaskan kedudukan fa\'il, maf\'ul, dan tarkib kalimat dengan tepat.',
    ustadzPenguji: 'Ust. Muhammad Ilyas Al-Hafidz'
  },
  {
    id: 'UJN-002',
    idSantri: 'S-1002',
    namaSantri: 'Muhammad Zainul Arifin',
    kelas: '1 TSANAWIYAH',
    semester: 'Semester Ganjil 2026/2027',
    tanggal: '2026-09-20',
    nilaiKoreksianKitab: 86,
    predikatKoreksianKitab: 'Jayyid Jiddan (Lengkap & Tertib)',
    kitabKoreksian: 'Kitab Fathul Qorib',
    catatanKoreksianKitab: 'Catatan makna kitab sudah disahkan dewan penguji.',
    nilaiMuhafadzoh: 88,
    predikatMuhafadzoh: 'Jayyid Jiddan (Lancar 200 Bait)',
    kitabMuhafadzoh: 'Nadzhom Al-Imrithi',
    catatanMuhafadzoh: 'Hafalan baik, tinggal melancarkan bab tawabi\'.',
    nilaiBacaKitab: 85,
    predikatBacaKitab: 'Jayyid Jiddan (Fashih)',
    kitabBaca: 'Fathul Qorib Bab Wudhu',
    catatanBacaKitab: 'Bacaan fasih dan memahami arti lafadz dasar.',
    ustadzPenguji: 'Ust. Muhammad Ilyas Al-Hafidz'
  },
  {
    id: 'UJN-003',
    idSantri: 'S-1003',
    namaSantri: 'Ilyas Nur Hidayat',
    kelas: '1 TSANAWIYAH',
    semester: 'Semester Ganjil 2026/2027',
    tanggal: '2026-09-20',
    nilaiKoreksianKitab: 90,
    predikatKoreksianKitab: 'Mumtaz (Rapi & Lengkap)',
    kitabKoreksian: 'Kitab Jurumiyyah & Mabadi Fiqh',
    catatanKoreksianKitab: 'Catatan pegon jelas dan bersih.',
    nilaiMuhafadzoh: 92,
    predikatMuhafadzoh: 'Mumtaz (Lancar 250 Bait)',
    kitabMuhafadzoh: 'Nadzhom Al-Imrithi',
    catatanMuhafadzoh: 'Mutqin dan hafal tanpa jeda.',
    nilaiBacaKitab: 87,
    predikatBacaKitab: 'Jayyid Jiddan',
    kitabBaca: 'Fathul Qorib Bab Thoharoh',
    catatanBacaKitab: 'Penguasaan i\'rob sangat baik.',
    ustadzPenguji: 'Ust. H. Ahmad Fauzi Ridwan'
  }
];

export const INITIAL_IZIN_MENGAJAR_LIST: IzinMengajarRequest[] = [
  {
    id: 'IZN-001',
    idPengurus: 'PNG-002',
    namaUstadz: 'Ustazah Fina Nikmatul Kamelia',
    tanggal: '2026-09-25',
    mapel: 'Nahwu & Shorof (Al-Imrithi)',
    kelas: '1 TSANAWIYAH',
    jamKe: 1,
    alasan: 'Udzur Syar\'i / Menghadiri Harlah & Bahtsul Masail',
    ustadzPengganti: 'Ust. M. Rizqi Fadlillah, S.Pd.',
    status: 'Disetujui',
    catatanAdmin: 'Disetujui oleh Kepala Madrasah, digantikan oleh Ust. M. Rizqi Fadlillah',
    createdAt: '2026-09-25 06:30'
  },
  {
    id: 'IZN-002',
    idPengurus: 'PNG-003',
    namaUstadz: 'Ust. Muhammad Ilyas Al-Hafidz',
    tanggal: '2026-09-26',
    mapel: 'Fathul Qorib',
    kelas: '2 TSANAWIYAH',
    jamKe: 2,
    alasan: 'Tugas Pesantren / Mewakili Pondok Silaturahmi Masyayikh',
    ustadzPengganti: 'Ust. H. Ahmad Fauzi Ridwan',
    status: 'Menunggu',
    catatanAdmin: 'Menunggu konfirmasi ketersediaan ustadz pengganti',
    createdAt: '2026-09-25 07:15'
  }
];

export const INITIAL_SILABUS_LIST: SilabusMemaknaiRecord[] = [
  // 1 TSANAWIYAH
  { id: 'SLB-101', namaKitab: 'Nadzhom Alala Tanalul Ilma', kelas: '1 TSANAWIYAH', tingkatan: 'Tsanawiyah', mulai: '2026-07-15', batasAkhir: '2026-10-30', ustadzPengampu: 'Ustazah Fina Nikmatul Kamelia', targetMateri: 'Bait 1 - 37 (Khatam & Sah Makna Gandul)', status: 'Berjalan', keterangan: 'Khataman & Ujian Hafalan' },
  { id: 'SLB-102', namaKitab: 'Matan Al-Ajurumiyyah (Nahwu)', kelas: '1 TSANAWIYAH', tingkatan: 'Tsanawiyah', mulai: '2026-07-20', batasAkhir: '2026-12-15', ustadzPengampu: 'Ustazah Fina Nikmatul Kamelia', targetMateri: 'Bab Kalam s/d Bab Mahfudhotil Asma', status: 'Berjalan', keterangan: 'Makna Pegon Jawa gandul' },
  { id: 'SLB-103', namaKitab: 'Mabadi Al-Fiqhiyyah Juz 1 & 2', kelas: '1 TSANAWIYAH', tingkatan: 'Tsanawiyah', mulai: '2026-07-18', batasAkhir: '2026-11-20', ustadzPengampu: 'Ustadzah Qothrunada', targetMateri: 'Thoharoh, Wudhu, Sholat Fardhu', status: 'Berjalan', keterangan: 'Praktik ubudiyyah santri' },
  { id: 'SLB-104', namaKitab: 'Tuhfatul Athfal (Tajwid)', kelas: '1 TSANAWIYAH', tingkatan: 'Tsanawiyah', mulai: '2026-07-25', batasAkhir: '2026-11-10', ustadzPengampu: 'Ustazah Maulida Rohmah', targetMateri: 'Hukum Nun Mati, Tanwin, Mad & Waqof', status: 'Berjalan', keterangan: 'Nadzhom tajwid dasar' },

  // 2 TSANAWIYAH
  { id: 'SLB-201', namaKitab: 'Matan Taqrib (Ghayah wat Taqrib)', kelas: '2 TSANAWIYAH', tingkatan: 'Tsanawiyah', mulai: '2026-07-15', batasAkhir: '2026-12-20', ustadzPengampu: 'Ustadz Adib Setiawan', targetMateri: 'Kitab Thoharoh s/d Kitab Shalat Jamaah', status: 'Berjalan', keterangan: 'Makna gandul tarkib fiqih' },
  { id: 'SLB-202', namaKitab: 'Akhlaq Lil Banin Juz 2', kelas: '2 TSANAWIYAH', tingkatan: 'Tsanawiyah', mulai: '2026-07-20', batasAkhir: '2026-11-30', ustadzPengampu: 'Ustadz Yasir', targetMateri: 'Adab Bergaul, Adab Guru, Orang Tua', status: 'Berjalan', keterangan: 'Pembiasaan akhlaq harian' },
  { id: 'SLB-203', namaKitab: 'Al-Amtsilah At-Tashrifiyyah', kelas: '2 TSANAWIYAH', tingkatan: 'Tsanawiyah', mulai: '2026-07-22', batasAkhir: '2026-12-10', ustadzPengampu: 'Ustadz Ali Said', targetMateri: 'Tashrif Ushul & Furu\' Tsulasi Mujarrad', status: 'Berjalan', keterangan: 'Hafalan pola wazan shorof' },
  { id: 'SLB-204', namaKitab: 'Qawa\'idul I\'lal', kelas: '2 TSANAWIYAH', tingkatan: 'Tsanawiyah', mulai: '2026-08-01', batasAkhir: '2026-12-15', ustadzPengampu: 'Ustadz Adib Setiawan', targetMateri: 'Kaidah I\'lal 1 - 19 Bina\' Mu\'tal', status: 'Berjalan', keterangan: 'Analisis perubahan huruf illat' },

  // 3 TSANAWIYAH
  { id: 'SLB-301', namaKitab: 'Nadzhom Al-Imrithi', kelas: '3 TSANAWIYAH', tingkatan: 'Tsanawiyah', mulai: '2026-07-15', batasAkhir: '2026-12-20', ustadzPengampu: 'Ustadz Sulaiman', targetMateri: 'Bait 1 - 254 (Lengkap Khatam)', status: 'Berjalan', keterangan: 'Syarat wajib kelulusan Tsanawiyah' },
  { id: 'SLB-302', namaKitab: 'Fathul Qorib Al-Mujib (Lanjutan)', kelas: '3 TSANAWIYAH', tingkatan: 'Tsanawiyah', mulai: '2026-07-18', batasAkhir: '2026-12-22', ustadzPengampu: 'Ustadz Ahmad Shobirin', targetMateri: 'Bab Shiyam, Zakat, Haji & Muamalat', status: 'Berjalan', keterangan: 'Koreksian kitab & uji baca' },
  { id: 'SLB-303', namaKitab: 'Bulughul Maram min Adillatil Ahkam', kelas: '3 TSANAWIYAH', tingkatan: 'Tsanawiyah', mulai: '2026-07-20', batasAkhir: '2026-12-15', ustadzPengampu: 'Ustadz Mizan Khoirul', targetMateri: 'Kitab Thoharoh s/d Kitab Shalat', status: 'Berjalan', keterangan: 'Takhrij & makna hadits ahkam' },

  // 1 ALIYAH
  { id: 'SLB-401', namaKitab: 'Al-Manzhumah Al-Baiquniyyah (Mustholah)', kelas: '1 ALIYAH', tingkatan: 'Aliyah', mulai: '2026-07-15', batasAkhir: '2026-11-20', ustadzPengampu: 'Ustadz Mizan Khoirul', targetMateri: '34 Bait Nadzhom Mustholahul Hadits', status: 'Berjalan', keterangan: 'Kaidah hadits shahih & dhaif' },
  { id: 'SLB-402', namaKitab: 'Alfiyah Ibnu Malik (Juz 1)', kelas: '1 ALIYAH', tingkatan: 'Aliyah', mulai: '2026-07-18', batasAkhir: '2026-12-25', ustadzPengampu: 'Ustadz Ahmad Shobirin', targetMateri: 'Muqoddimah s/d Bab Af\'alul Muqorobah', status: 'Berjalan', keterangan: 'Setoran bait & pemaknaan' },
  { id: 'SLB-403', namaKitab: 'Al-Waraqat fi Ushulil Fiqh', kelas: '1 ALIYAH', tingkatan: 'Aliyah', mulai: '2026-07-20', batasAkhir: '2026-11-30', ustadzPengampu: 'Ustadz Adib Setiawan', targetMateri: 'Aqsamul Kalam, Amr Nahi, Mujmal Mubayyan', status: 'Berjalan', keterangan: 'Dasar ushul fiqih Syafi\'iyyah' },

  // 2 ALIYAH
  { id: 'SLB-501', namaKitab: 'Tafsir Al-Jalalain', kelas: '2 ALIYAH', tingkatan: 'Aliyah', mulai: '2026-07-15', batasAkhir: '2026-12-25', ustadzPengampu: 'Ustadz Ahmad Shobirin', targetMateri: 'Juz 1 s/d Juz 3 (Surah Al-Baqarah)', status: 'Berjalan', keterangan: 'I\'rob & asbabun nuzul' },
  { id: 'SLB-502', namaKitab: 'Al-Jauharul Maknun (Balaghah)', kelas: '2 ALIYAH', tingkatan: 'Aliyah', mulai: '2026-07-18', batasAkhir: '2026-12-15', ustadzPengampu: 'Ustadz Mizan Khoirul', targetMateri: 'Fan Ilmu Ma\'ani, Bayan, & Badi\'', status: 'Berjalan', keterangan: 'Sastra & retorika arab salaf' },
  { id: 'SLB-503', namaKitab: 'Fathul Wahhab bi Syarhi Manhajit Thullab', kelas: '2 ALIYAH', tingkatan: 'Aliyah', mulai: '2026-07-20', batasAkhir: '2026-12-28', ustadzPengampu: 'Ustadz Yasir', targetMateri: 'Bab Buyu\', Salam, Rahn, Syirkah', status: 'Berjalan', keterangan: 'Fiqih muamalat turots tingkat tinggi' },

  // 3 ALIYAH
  { id: 'SLB-601', namaKitab: 'Shahih Al-Bukhari (Khataman Musalsal)', kelas: '3 ALIYAH', tingkatan: 'Aliyah', mulai: '2026-07-15', batasAkhir: '2026-12-28', ustadzPengampu: 'Ustadz Yasir', targetMateri: 'Kitab Bad\'il Wahyi s/d Kitabul Iman', status: 'Berjalan', keterangan: 'Sanad muttashil hadits shohih' },
  { id: 'SLB-602', namaKitab: 'Jam\'ul Jawami\' Tajuddin As-Subki', kelas: '3 ALIYAH', tingkatan: 'Aliyah', mulai: '2026-07-18', batasAkhir: '2026-12-25', ustadzPengampu: 'Ustadz Sulaiman', targetMateri: 'Kitabul Kitab, Sunnah, Ijma\', Qiyas', status: 'Berjalan', keterangan: 'Kaidah istinbath hukum ushuliyyah' },
  { id: 'SLB-603', namaKitab: 'Alfiyah Ibnu Malik (Khataman Bait 1002)', kelas: '3 ALIYAH', tingkatan: 'Aliyah', mulai: '2026-07-15', batasAkhir: '2026-12-30', ustadzPengampu: 'Ustadz Mizan Khoirul', targetMateri: 'Bait 501 s/d 1002 (Khataman & Ijazahan)', status: 'Berjalan', keterangan: 'Wisuda kelulusan Aliyah diniyah' }
];
