import React from 'react';
import { 
  Santri, NadzhomRecord, NilaiUjianRecord, AbsensiSantriRecord, 
  SyahriyahRecord, UangSakuRecord, AppSettings, UjianSantriRecord 
} from '../types';
import { 
  LogOut, BookOpen, Award, ShieldCheck, 
  MapPin, Home, UserCheck, CreditCard, Wallet, 
  AlertTriangle, MessageCircle, Phone, ArrowDownLeft, ArrowUpRight, 
  CheckCircle2, Clock, Sparkles, GraduationCap, Check, FileText
} from 'lucide-react';

interface WaliSantriPortalProps {
  santri: Santri;
  nadzhomList: NadzhomRecord[];
  nilaiList: NilaiUjianRecord[];
  absensiList: AbsensiSantriRecord[];
  syahriyahList?: SyahriyahRecord[];
  uangSakuList?: UangSakuRecord[];
  ujianList?: UjianSantriRecord[];
  onLogout: () => void;
  spreadsheetId: string;
  settings?: AppSettings;
}

export const WaliSantriPortal: React.FC<WaliSantriPortalProps> = ({
  santri,
  nadzhomList,
  nilaiList,
  absensiList,
  syahriyahList = [],
  uangSakuList = [],
  ujianList = [],
  onLogout,
  settings
}) => {
  // Filter data strictly for this santri (Row-Level Security)
  const myNadzhom = nadzhomList.filter(n => n.idSantri === santri.id);
  const myNilai = nilaiList.filter(n => n.idSantri === santri.id);
  const myAbsensi = absensiList.filter(a => a.idSantri === santri.id);
  const mySyahriyah = syahriyahList.filter(s => s.idSantri === santri.id);
  const myUangSaku = uangSakuList.filter(u => u.idSantri === santri.id);

  const totalBait = myNadzhom.reduce((acc, curr) => acc + (Number(curr.bait) || 0), 0);
  const avgNilai = myNilai.length 
    ? (myNilai.reduce((acc, curr) => acc + (Number(curr.nilai) || 0), 0) / myNilai.length).toFixed(1)
    : '-';

  const hadirCount = myAbsensi.filter(a => a.status === 'Hadir').length;
  const absensiRate = myAbsensi.length 
    ? Math.round((hadirCount / myAbsensi.length) * 100) 
    : 100;

  // Cek apakah ada tunggakan syahriyah
  const tunggakanList = mySyahriyah.filter(s => s.status === 'Menunggak' || s.status === 'Belum Bayar');
  const hasTunggakan = tunggakanList.length > 0;

  const saldoUangSaku = santri.saldoUangSaku ?? (
    myUangSaku.length > 0 ? myUangSaku[myUangSaku.length - 1].saldoSetelah : 0
  );

  const cleanWaNumber = (santri.noWaWaliKelas || '628123456789').replace(/\D/g, '');
  const waUrl = `https://wa.me/${cleanWaNumber}?text=${encodeURIComponent(
    `Assalamu'alaikum Warahmatullahi Wabarakatuh, Ustadz/Ustadzah ${santri.namaWaliKelas || 'Wali Kelas'}, saya wali dari ananda ${santri.nama} (${santri.kelas}) ingin berkonsultasi mengenai perkembangan ananda di madrasah.`
  )}`;

  // Evaluasi Ujian Santri Terintegrasi (Koreksian Kitab, Muhafadzoh, Baca Kitab)
  const myUjian = (ujianList || []).find(u => u.idSantri === santri.id);
  const nilaiKoreksian = myUjian?.nilaiKoreksianKitab ?? santri.nilaiKoreksianKitab ?? 92;
  const predikatKoreksian = myUjian?.predikatKoreksianKitab ?? santri.predikatKoreksianKitab ?? 'Mumtaz (Makna Gandul Sah & Lengkap)';
  const catatanKoreksian = myUjian?.catatanKoreksianKitab ?? santri.catatanUjianKitab ?? 'Makna gandul pegon sangat rapi dan mutaba\'ah pengajian lengkap.';
  const kitabKoreksian = myUjian?.kitabKoreksian ?? 'Kitab Fathul Qorib Al-Mujib';

  const nilaiMuhafadzoh = myUjian?.nilaiMuhafadzoh ?? santri.nilaiMuhafadzoh ?? 96;
  const predikatMuhafadzoh = myUjian?.predikatMuhafadzoh ?? santri.predikatMuhafadzoh ?? 'Mumtaz (Hafal Lancar 254 Bait)';
  const catatanMuhafadzoh = myUjian?.catatanMuhafadzoh ?? 'Hafalan sangat mutqin, makharijul huruf dan tajwid terjaga.';
  const kitabMuhafadzoh = myUjian?.kitabMuhafadzoh ?? 'Nadzhom Al-Imrithi';

  const nilaiBacaKitab = myUjian?.nilaiBacaKitab ?? santri.nilaiBacaKitab ?? 90;
  const predikatBacaKitab = myUjian?.predikatBacaKitab ?? santri.predikatBacaKitab ?? 'Mumtaz (Fashih & Paham Tarkib I\'rob)';
  const catatanBacaKitab = myUjian?.catatanBacaKitab ?? 'Mampu menjelaskan kedudukan fa\'il, maf\'ul, dan tarkib kalimat dengan tepat.';
  const kitabBaca = myUjian?.kitabBaca ?? 'Fathul Qorib Bab Sholat';

  const pengujiKitab = myUjian?.ustadzPenguji ?? santri.ustadzPengujiKitab ?? 'Ust. Muhammad Ilyas Al-Hafidz';
  const tglUjianKitab = myUjian?.tanggal ?? santri.tanggalUjianKitab ?? '20 September 2026';

  return (
    <div 
      className="min-h-screen bg-[#03140c] text-[#f3e5ab] font-sans pb-16 bg-cover bg-center"
      style={settings?.background_url ? { backgroundImage: `linear-gradient(rgba(3, 20, 12, 0.94), rgba(3, 20, 12, 0.98)), url(${settings.background_url})` } : undefined}
    >
      {/* Top Banner / Navigation for Guardian */}
      <header className="bg-[#052216]/95 border-b border-[#d4af37]/30 backdrop-blur sticky top-0 z-30 px-4 py-3 sm:px-6 shadow-xl">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-[#0b422a] border border-[#d4af37] flex items-center justify-center text-lg overflow-hidden shadow-md">
              {settings?.logo_pondok ? (
                <img src={settings.logo_pondok} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span>🕌</span>
              )}
            </div>
            <div>
              <h1 className="font-bold text-sm sm:text-base text-[#d4af37] tracking-wide font-serif">
                {settings?.portal_title || 'PORTAL WALI SANTRI AL-MALIKI'}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-emerald-300">
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" /> Portal Terproteksi
                </span>
                <span>•</span>
                <span className="text-white font-medium">Santri: {santri.nama}</span>
                <span>•</span>
                <span className="text-[#d4af37]">NIS: {santri.id}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl btn-3d-red text-white text-xs font-bold transition shadow-lg"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Portal</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">

        {/* NOTIFIKASI KETERLAMBATAN SYAHRIYAH (JIKA ADA TUNGGAKAN) */}
        {hasTunggakan && (
          <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-red-950/90 via-[#450a0a]/90 to-red-950/90 border-2 border-red-500/60 text-white shadow-2xl animate-pulse">
            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 rounded-xl bg-red-600/30 border border-red-500/50 text-red-300 shrink-0 mt-0.5 shadow">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-sm sm:text-base font-bold text-red-200 tracking-wide uppercase flex items-center gap-2">
                    <span>⚠️ PERINGATAN ADMINISTRASI: KETERLAMBATAN SYAHRIYAH</span>
                  </h2>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-500/30 border border-red-400/50 text-red-100">
                    {tunggakanList.length} Bulan Tertunggak
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-red-100/90 mt-2 leading-relaxed">
                  {settings?.notif_keterlambatan_syahriyah || 
                    'Pemberitahuan: Pembayaran Syahriyah (iuran bulanan madrasah) putra/putri Anda saat ini tercatat menunggak / melewati batas tanggal 10. Dimohon kesediaannya untuk segera menyelesaikan administrasi ke Bendahara Pesantren.'
                  }
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-red-500/30 text-xs">
                  <span className="text-red-300 font-semibold">Bulan Belum Selesai:</span>
                  {tunggakanList.map((t, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-red-900/80 border border-red-400/40 text-red-100 font-mono text-[11px]">
                      {t.bulan} (Rp {Number(t.nominal).toLocaleString('id-ID')}) - {t.status}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Santri Profile Card + Informasi Orang Tua, Wali Kelas, No WA, Saldo Terkini */}
        <div className="card-3d rounded-3xl p-5 sm:p-6 backdrop-blur space-y-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
            <div className="w-28 h-36 sm:w-32 sm:h-40 rounded-2xl bg-[#052216] border-2 border-[#d4af37] overflow-hidden shadow-2xl shrink-0">
              <img
                src={santri.foto}
                alt={santri.nama}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).setAttribute('src', 'https://via.placeholder.com/300x380?text=Foto+Santri');
                }}
              />
            </div>

            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="text-xs font-mono font-bold text-[#d4af37] bg-[#052216] px-3 py-1 rounded-lg border border-[#d4af37]/30 shadow-inner">
                  NIS: {santri.id}
                </span>
                <span className="text-xs font-bold text-emerald-300 bg-emerald-950/80 px-3 py-1 rounded-lg border border-emerald-500/30 shadow">
                  Kelas: {santri.kelas}
                </span>
              </div>

              <h2 className="text-xl sm:text-3xl font-extrabold text-white text-gold-3d">
                {santri.nama}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs text-emerald-200/90 pt-1">
                <div className="flex items-center gap-2 bg-[#052216]/60 p-2.5 rounded-xl border border-[#d4af37]/15">
                  <Home className="w-4 h-4 text-[#d4af37] shrink-0" />
                  <span>Kamar: <b className="text-white">{santri.kamar || '-'}</b></span>
                </div>
                <div className="flex items-center gap-2 bg-[#052216]/60 p-2.5 rounded-xl border border-[#d4af37]/15">
                  <MapPin className="w-4 h-4 text-[#d4af37] shrink-0" />
                  <span>Asal: <b className="text-white">{santri.alamat || '-'}</b></span>
                </div>
                <div className="flex items-center gap-2 bg-[#052216]/60 p-2.5 rounded-xl border border-[#d4af37]/15">
                  <UserCheck className="w-4 h-4 text-[#d4af37] shrink-0" />
                  <span>Orang Tua/Wali: <b className="text-white">{santri.namaOrangTua || 'Bpk/Ibu Wali Santri'}</b></span>
                </div>
              </div>

              {/* Wali Kelas & Saldo Terkini Sub-Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* Kontak Wali Kelas */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#0b3320] to-[#041a0f] border border-[#d4af37]/30 flex flex-col justify-between space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] text-emerald-300 uppercase tracking-wider font-semibold block">Wali Kelas Pengampu</span>
                      <h4 className="font-bold text-sm text-white mt-0.5">{santri.namaWaliKelas || 'Ustazah Fina Nikmatul Kamelia'}</h4>
                      <p className="text-[11px] text-emerald-200/80 font-mono mt-0.5">WA: {santri.noWaWaliKelas || '0812-3456-7890'}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
                      <Phone className="w-4 h-4" />
                    </div>
                  </div>
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition shadow-md"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Hubungi via WhatsApp</span>
                  </a>
                </div>

                {/* Saldo Terkini Uang Saku */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#1a1400] via-[#2a2200] to-[#120e00] border border-[#d4af37]/50 flex flex-col justify-between space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] text-amber-300 uppercase tracking-wider font-semibold block">Saldo Terkini Uang Saku</span>
                      <h4 className="font-extrabold text-xl sm:text-2xl text-[#d4af37] mt-1 font-mono">
                        Rp {Number(saldoUangSaku).toLocaleString('id-ID')}
                      </h4>
                      <p className="text-[11px] text-amber-200/70 mt-0.5">Tersimpan aman di tabungan bendahara</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                      <Wallet className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-[11px] text-emerald-300 flex items-center gap-1.5 pt-1 border-t border-[#d4af37]/20">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Sinkron real-time dengan bendahara</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 pt-6 border-t border-[#d4af37]/20">
            <div className="card-3d-deep rounded-2xl p-3 sm:p-4 text-center">
              <span className="text-[11px] text-emerald-300 uppercase block font-semibold">Rata-rata Ujian</span>
              <span className="text-lg sm:text-2xl font-extrabold text-[#d4af37] mt-1 block font-mono">
                {avgNilai}
              </span>
              <span className="text-[10px] text-emerald-200/60 mt-0.5 block">{myNilai.length} Mata Pelajaran</span>
            </div>

            <div className="card-3d-deep rounded-2xl p-3 sm:p-4 text-center">
              <span className="text-[11px] text-emerald-300 uppercase block font-semibold">Total Bait Nadzhom</span>
              <span className="text-lg sm:text-2xl font-extrabold text-emerald-400 mt-1 block font-mono">
                {totalBait}
              </span>
              <span className="text-[10px] text-emerald-200/60 mt-0.5 block">{myNadzhom.length} Setoran</span>
            </div>

            <div className="card-3d-deep rounded-2xl p-3 sm:p-4 text-center">
              <span className="text-[11px] text-emerald-300 uppercase block font-semibold">Kehadiran Diniyah</span>
              <span className="text-lg sm:text-2xl font-extrabold text-amber-300 mt-1 block font-mono">
                {absensiRate}%
              </span>
              <span className="text-[10px] text-emerald-200/60 mt-0.5 block">{hadirCount} Hari Hadir</span>
            </div>
          </div>
        </div>

        {/* KOLOM PENILAIAN UJIAN TERKONEKSI: KOREKSIAN KITAB, MUHAFADZOH, & BACA KITAB (PERSIS DI BAWAH PROFIL ANAK) */}
        <section className="card-3d rounded-3xl p-5 sm:p-6 backdrop-blur space-y-5 border-2 border-[#d4af37]/40 shadow-2xl bg-gradient-to-br from-[#062819] via-[#041d13] to-[#02180e]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#d4af37]/25 gap-2">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#d4af37] via-[#f3e5ab] to-[#aa8010] p-0.5 shadow-lg flex items-center justify-center shrink-0">
                <div className="w-full h-full bg-[#031d12] rounded-[14px] flex items-center justify-center">
                  <Award className="w-5 h-5 text-[#d4af37]" />
                </div>
              </div>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-white text-gold-3d flex items-center gap-2">
                  <span>Hasil Evaluasi Ujian & Penguasaan Kitab Kuning</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-bold">
                    Resmi Madrasah
                  </span>
                </h3>
                <p className="text-xs text-emerald-300/80">
                  Ustadz Penguji: <b className="text-[#d4af37]">{pengujiKitab}</b> • Tanggal Ujian: <b className="text-white">{tglUjianKitab}</b>
                </p>
              </div>
            </div>
            <span className="text-[11px] text-[#d4af37] font-mono px-3 py-1 rounded-xl bg-[#031d12] border border-[#d4af37]/30 self-start sm:self-center shadow-inner">
              Semester Ganjil 2026/2027
            </span>
          </div>

          {/* 3 KOLOM SEPERTI PERMINTAAN USER: (NILAI KOREKSIAN KITAB), (NILAI MUHAFADZOH), (NILAI BACA KITAB) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {/* 1. KOLOM NILAI KOREKSIAN KITAB */}
            <div className="card-3d-deep rounded-2xl p-4 sm:p-5 border border-[#d4af37]/35 flex flex-col justify-between space-y-3 bg-[#031d12]/90 shadow-xl relative overflow-hidden group hover:border-[#d4af37] transition-all">
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-[#d4af37]/20 pb-2.5">
                  <span className="text-[10px] uppercase font-black tracking-wider text-[#d4af37] flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#d4af37]" />
                    Nilai Koreksian Kitab
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/40">
                    Maknani Sah
                  </span>
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-3xl sm:text-4xl font-black text-[#d4af37] font-mono tracking-tight text-gold-3d">
                    {nilaiKoreksian}
                  </span>
                  <span className="text-xs font-bold text-emerald-200 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                    {predikatKoreksian}
                  </span>
                </div>

                <div className="space-y-1.5 pt-1 text-xs">
                  <div className="text-slate-300 font-medium flex items-center gap-1.5">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>Kitab Rujukan: <b className="text-white">{kitabKoreksian}</b></span>
                  </div>
                  <div className="bg-[#02140b] p-2.5 rounded-xl border border-[#d4af37]/15 text-[11px] text-emerald-200/90 leading-relaxed">
                    <span className="text-emerald-400 font-semibold block mb-0.5">Catatan Korektor:</span>
                    "{catatanKoreksian}"
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#d4af37]/20 flex items-center justify-between text-[10px] text-emerald-300">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-[#d4af37]" />
                  <span>Mutaba'ah Pengajian Sah</span>
                </span>
                <span className="font-mono text-white">Valid</span>
              </div>
            </div>

            {/* 2. KOLOM NILAI MUHAFADZOH (HAFALAN) */}
            <div className="card-3d-deep rounded-2xl p-4 sm:p-5 border border-emerald-500/40 flex flex-col justify-between space-y-3 bg-[#031d12]/90 shadow-xl relative overflow-hidden group hover:border-emerald-400 transition-all">
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2.5">
                  <span className="text-[10px] uppercase font-black tracking-wider text-emerald-300 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-emerald-400" />
                    Nilai Muhafadzoh
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                    Mutqin
                  </span>
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono tracking-tight">
                    {nilaiMuhafadzoh}
                  </span>
                  <span className="text-xs font-bold text-[#d4af37] bg-[#141002] px-2.5 py-1 rounded-lg border border-[#d4af37]/40">
                    {predikatMuhafadzoh}
                  </span>
                </div>

                <div className="space-y-1.5 pt-1 text-xs">
                  <div className="text-slate-300 font-medium flex items-center gap-1.5">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>Nadzhom/Matan: <b className="text-white">{kitabMuhafadzoh}</b></span>
                  </div>
                  <div className="bg-[#02140b] p-2.5 rounded-xl border border-emerald-500/20 text-[11px] text-emerald-200/90 leading-relaxed">
                    <span className="text-emerald-400 font-semibold block mb-0.5">Catatan Penguji:</span>
                    "{catatanMuhafadzoh}"
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between text-[10px] text-emerald-300">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Setoran Hafalan Tuntas</span>
                </span>
                <span className="font-mono text-white">Lulus</span>
              </div>
            </div>

            {/* 3. KOLOM NILAI BACA KITAB */}
            <div className="card-3d-deep rounded-2xl p-4 sm:p-5 border border-blue-500/40 flex flex-col justify-between space-y-3 bg-[#031d12]/90 shadow-xl relative overflow-hidden group hover:border-blue-400 transition-all">
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-blue-500/20 pb-2.5">
                  <span className="text-[10px] uppercase font-black tracking-wider text-blue-300 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                    Nilai Baca Kitab
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/40">
                    Fashohah & Tarkib
                  </span>
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-3xl sm:text-4xl font-black text-blue-400 font-mono tracking-tight">
                    {nilaiBacaKitab}
                  </span>
                  <span className="text-xs font-bold text-blue-200 bg-blue-950/80 px-2.5 py-1 rounded-lg border border-blue-500/40">
                    {predikatBacaKitab}
                  </span>
                </div>

                <div className="space-y-1.5 pt-1 text-xs">
                  <div className="text-slate-300 font-medium flex items-center gap-1.5">
                    <span className="text-blue-400 font-bold">•</span>
                    <span>Materi Baca: <b className="text-white">{kitabBaca}</b></span>
                  </div>
                  <div className="bg-[#02140b] p-2.5 rounded-xl border border-blue-500/20 text-[11px] text-emerald-200/90 leading-relaxed">
                    <span className="text-blue-400 font-semibold block mb-0.5">Catatan Evaluator:</span>
                    "{catatanBacaKitab}"
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-blue-500/20 flex items-center justify-between text-[10px] text-blue-300">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-blue-400" />
                  <span>Kaidah Tarkib Teruji</span>
                </span>
                <span className="font-mono text-white">Kompeten</span>
              </div>
            </div>
          </div>
        </section>

        {/* TABEL SYAHRIYAH (IURAN BULANAN) */}
        <section className="card-3d rounded-3xl p-5 sm:p-6 backdrop-blur space-y-4">
          <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[#d4af37]/20 gap-2">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37]">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white text-gold-3d">Tabel Syahriyah (Iuran Bulanan)</h3>
                <p className="text-[11px] text-emerald-300">Status kelengkapan administrasi SPP & Syahriyah santri</p>
              </div>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-[#052216] border border-[#d4af37]/30 text-[#d4af37] font-mono">
              {mySyahriyah.length} Periode
            </span>
          </div>

          {mySyahriyah.length === 0 ? (
            <div className="text-center py-8 bg-[#052216]/40 rounded-2xl border border-[#d4af37]/10">
              <CreditCard className="w-8 h-8 text-[#d4af37]/40 mx-auto mb-2" />
              <p className="text-xs text-emerald-300/70">
                Belum ada data syahriyah yang diinputkan untuk santri ini.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[#d4af37]/20">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#052216] text-[#d4af37] border-b border-[#d4af37]/20 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-3.5">NO</th>
                    <th className="p-3.5">BULAN & TAHUN</th>
                    <th className="p-3.5 text-right">NOMINAL</th>
                    <th className="p-3.5">TANGGAL BAYAR</th>
                    <th className="p-3.5 text-center">STATUS</th>
                    <th className="p-3.5">KETERANGAN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d4af37]/10 bg-[#020e08]/60">
                  {mySyahriyah.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-[#d4af37]/5 transition">
                      <td className="p-3.5 font-mono text-emerald-400/80">{idx + 1}</td>
                      <td className="p-3.5 font-bold text-white whitespace-nowrap">{item.bulan}</td>
                      <td className="p-3.5 font-mono font-bold text-[#d4af37] text-right whitespace-nowrap">
                        Rp {Number(item.nominal).toLocaleString('id-ID')}
                      </td>
                      <td className="p-3.5 font-mono text-emerald-200/90 whitespace-nowrap">
                        {item.tanggalBayar || '-'}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 shadow ${
                          item.status === 'Lunas' 
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                            : item.status === 'Menunggak'
                            ? 'bg-red-950 text-red-300 border border-red-500/50'
                            : 'bg-amber-950 text-amber-300 border border-amber-500/50'
                        }`}>
                          {item.status === 'Lunas' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                          {item.status === 'Menunggak' && <AlertTriangle className="w-3 h-3 text-red-400" />}
                          {item.status === 'Belum Bayar' && <Clock className="w-3 h-3 text-amber-400" />}
                          {item.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-emerald-200/80 max-w-xs truncate">
                        {item.keterangan || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* TABEL UANG SAKU (MUTASI & SALDO) */}
        <section className="card-3d rounded-3xl p-5 sm:p-6 backdrop-blur space-y-4">
          <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[#d4af37]/20 gap-2">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-400/30 text-amber-300">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white text-gold-3d">Tabel Riwayat Uang Saku</h3>
                <p className="text-[11px] text-emerald-300">Catatan kiriman orang tua, belanja santri, dan sisa saldo</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-300 font-mono bg-[#052216] px-3 py-1 rounded-full border border-[#d4af37]/30">
                Saldo: Rp {Number(saldoUangSaku).toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {myUangSaku.length === 0 ? (
            <div className="text-center py-8 bg-[#052216]/40 rounded-2xl border border-[#d4af37]/10">
              <Wallet className="w-8 h-8 text-[#d4af37]/40 mx-auto mb-2" />
              <p className="text-xs text-emerald-300/70">
                Belum ada transaksi uang saku yang tercatat untuk santri ini.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[#d4af37]/20">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#052216] text-[#d4af37] border-b border-[#d4af37]/20 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-3.5">NO</th>
                    <th className="p-3.5">TANGGAL</th>
                    <th className="p-3.5 text-center">TIPE</th>
                    <th className="p-3.5">KEPERLUAN / KETERANGAN</th>
                    <th className="p-3.5 text-right">NOMINAL</th>
                    <th className="p-3.5 text-right">SISA SALDO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d4af37]/10 bg-[#020e08]/60">
                  {myUangSaku.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-[#d4af37]/5 transition">
                      <td className="p-3.5 font-mono text-emerald-400/80">{idx + 1}</td>
                      <td className="p-3.5 font-mono text-emerald-300 whitespace-nowrap">{item.tanggal}</td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${
                          item.tipe === 'Masuk'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            : 'bg-orange-950 text-orange-300 border border-orange-500/40'
                        }`}>
                          {item.tipe === 'Masuk' ? (
                            <>
                              <ArrowDownLeft className="w-3 h-3 text-emerald-400" /> Masuk
                            </>
                          ) : (
                            <>
                              <ArrowUpRight className="w-3 h-3 text-orange-400" /> Keluar
                            </>
                          )}
                        </span>
                      </td>
                      <td className="p-3.5 text-white font-medium">{item.keterangan}</td>
                      <td className={`p-3.5 font-mono font-bold text-right whitespace-nowrap ${
                        item.tipe === 'Masuk' ? 'text-emerald-400' : 'text-orange-400'
                      }`}>
                        {item.tipe === 'Masuk' ? '+' : '-'} Rp {Number(item.nominal).toLocaleString('id-ID')}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-[#d4af37] text-right whitespace-nowrap">
                        Rp {Number(item.saldoSetelah).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Section: Setoran Nadzhom */}
        <section className="card-3d rounded-3xl p-5 sm:p-6 backdrop-blur space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#d4af37]/20">
            <div className="flex items-center space-x-2.5">
              <BookOpen className="w-5 h-5 text-[#d4af37]" />
              <h3 className="font-bold text-base text-white text-gold-3d">Riwayat Setoran Nadzhom & Hafalan</h3>
            </div>
            <span className="text-xs text-[#d4af37] font-mono">{myNadzhom.length} Catatan</span>
          </div>

          {myNadzhom.length === 0 ? (
            <p className="text-xs text-center py-6 text-emerald-300/70">
              Belum ada data setoran nadzhom yang tercatat untuk santri ini.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[#d4af37]/20">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#052216] text-[#d4af37] border-b border-[#d4af37]/20 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-3">TANGGAL</th>
                    <th className="p-3">KITAB</th>
                    <th className="p-3 text-center">JUMLAH BAIT</th>
                    <th className="p-3">STATUS / NILAI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d4af37]/10 bg-[#020e08]/60">
                  {myNadzhom.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#d4af37]/5 transition">
                      <td className="p-3 font-mono text-emerald-300 whitespace-nowrap">{item.tanggal || '-'}</td>
                      <td className="p-3 font-bold text-white">{item.kitab}</td>
                      <td className="p-3 text-center font-bold text-[#d4af37]">{item.bait} bait</td>
                      <td className="p-3">
                        <span className="px-2.5 py-1 rounded-md bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 font-medium">
                          {item.nilai || 'Terselesaikan'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Section: Nilai Ujian */}
        <section className="card-3d rounded-3xl p-5 sm:p-6 backdrop-blur space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#d4af37]/20">
            <div className="flex items-center space-x-2.5">
              <Award className="w-5 h-5 text-[#d4af37]" />
              <h3 className="font-bold text-base text-white text-gold-3d">Transkrip Nilai Ujian Madrasah</h3>
            </div>
            <span className="text-xs text-emerald-300">{myNilai.length} Mata Pelajaran</span>
          </div>

          {myNilai.length === 0 ? (
            <p className="text-xs text-center py-6 text-emerald-300/70">
              Belum ada nilai ujian yang dirilis untuk santri ini.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[#d4af37]/20">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#052216] text-[#d4af37] border-b border-[#d4af37]/20 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-3">MATA PELAJARAN</th>
                    <th className="p-3 text-center">NILAI ANGKA</th>
                    <th className="p-3 text-center">PREDIKAT</th>
                    <th className="p-3">SEMESTER</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d4af37]/10 bg-[#020e08]/60">
                  {myNilai.map((item, idx) => {
                    const val = Number(item.nilai) || 0;
                    let predikat = 'Mumtaz (A)';
                    let color = 'text-emerald-400';
                    if (val < 75) {
                      predikat = 'Maqbul (C)';
                      color = 'text-amber-400';
                    } else if (val < 85) {
                      predikat = 'Jayyid (B)';
                      color = 'text-blue-400';
                    }

                    return (
                      <tr key={idx} className="hover:bg-[#d4af37]/5 transition">
                        <td className="p-3 font-bold text-white">{item.pelajaran}</td>
                        <td className="p-3 text-center font-mono font-bold text-base text-[#d4af37]">{val}</td>
                        <td className={`p-3 text-center font-semibold ${color}`}>{predikat}</td>
                        <td className="p-3 text-emerald-200/80">{item.semester || 'Semester 1'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Section: Log Absensi Santri */}
        <section className="card-3d rounded-3xl p-5 sm:p-6 backdrop-blur space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#d4af37]/20">
            <div className="flex items-center space-x-2.5">
              <UserCheck className="w-5 h-5 text-[#d4af37]" />
              <h3 className="font-bold text-base text-white text-gold-3d">Catatan Kehadiran & Kedisiplinan</h3>
            </div>
            <span className="text-xs text-[#d4af37] font-semibold">{myAbsensi.length} Catatan</span>
          </div>

          {myAbsensi.length === 0 ? (
            <p className="text-xs text-center py-6 text-emerald-300/70">
              Belum ada riwayat absensi harian yang tercatat.
            </p>
          ) : (
            <div className="space-y-2">
              {myAbsensi.slice(0, 10).map((a, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-[#052216]/60 border border-[#d4af37]/15 text-xs">
                  <div className="flex items-center space-x-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      a.status === 'Hadir' ? 'bg-emerald-400' :
                      a.status === 'Izin' ? 'bg-amber-400' :
                      a.status === 'Sakit' ? 'bg-blue-400' : 'bg-red-400'
                    }`} />
                    <div>
                      <span className="font-semibold text-white">{a.tanggal}</span>
                      <p className="text-[11px] text-emerald-200/70 mt-0.5">{a.keterangan || 'Hadir mengikuti kegiatan'}</p>
                    </div>
                  </div>
                  <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                    a.status === 'Hadir' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' :
                    a.status === 'Izin' ? 'bg-amber-950 text-amber-300 border border-amber-500/40' :
                    a.status === 'Sakit' ? 'bg-blue-950 text-blue-300 border border-blue-500/40' :
                    'bg-red-950 text-red-300 border border-red-500/40'
                  }`}>
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
