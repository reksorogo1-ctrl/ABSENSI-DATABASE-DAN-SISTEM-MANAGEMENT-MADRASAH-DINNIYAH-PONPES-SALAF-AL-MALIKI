import React, { useState, useRef } from 'react';
import { 
  X, Camera, Save, User, Hash, MapPin, Home, 
  Users, KeyRound, Phone, Award, Sparkles, CheckCircle2,
  AlertTriangle, Upload, Eye, Image as ImageIcon
} from 'lucide-react';
import { Santri, StatusSantri } from '../types';
import { compressImageFile } from '../lib/imageCompression';

interface EditSantriModalProps {
  isOpen: boolean;
  onClose: () => void;
  santri: Santri;
  allSantriList: Santri[];
  onSave: (updatedSantri: Santri, originalId: string) => void;
  onNotify?: (message: string) => void;
}

const CLASS_OPTIONS = [
  '1 TSANAWIYAH',
  '2 TSANAWIYAH',
  '3 TSANAWIYAH',
  '1 ALIYAH',
  '2 ALIYAH',
  '3 ALIYAH'
];

const STATUS_OPTIONS: StatusSantri[] = [
  'Aktif',
  'Naik Kelas',
  'Tetap di Kelas',
  'Lulus',
  'Mutasi / Keluar'
];

export const EditSantriModal: React.FC<EditSantriModalProps> = ({
  isOpen,
  onClose,
  santri,
  allSantriList,
  onSave,
  onNotify
}) => {
  if (!isOpen) return null;

  const originalId = santri.id;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form States
  const [id, setId] = useState<string>(santri.id || '');
  const [nama, setNama] = useState<string>(santri.nama || '');
  const [kelas, setKelas] = useState<string>(santri.kelas || '1 TSANAWIYAH');
  const [kamar, setKamar] = useState<string>(santri.kamar || '');
  const [alamat, setAlamat] = useState<string>(santri.alamat || '');
  const [foto, setFoto] = useState<string>(santri.foto || '');
  const [fotoThumbnail, setFotoThumbnail] = useState<string>(santri.fotoThumbnail || '');
  const [namaOrangTua, setNamaOrangTua] = useState<string>(santri.namaOrangTua || '');
  const [password, setPassword] = useState<string>(santri.password || santri.id || '');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [namaWaliKelas, setNamaWaliKelas] = useState<string>(santri.namaWaliKelas || '');
  const [noWaWaliKelas, setNoWaWaliKelas] = useState<string>(santri.noWaWaliKelas || '');
  const [statusSantri, setStatusSantri] = useState<StatusSantri>(santri.statusSantri || 'Aktif');
  const [saldoUangSaku, setSaldoUangSaku] = useState<number>(santri.saldoUangSaku ?? 0);

  // UI States
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);
  const [customUrl, setCustomUrl] = useState<string>('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Berkas yang dipilih harus berupa gambar/foto.');
      return;
    }

    try {
      setIsCompressing(true);
      setErrorMessage('');

      // Kompresi untuk foto utama (max 600x750)
      const compressedMain = await compressImageFile(file, 600, 750, 0.82);
      // Kompresi ringan untuk thumbnail (max 120x150)
      const compressedThumb = await compressImageFile(file, 120, 150, 0.75);

      setFoto(compressedMain);
      setFotoThumbnail(compressedThumb);
    } catch (err: any) {
      setErrorMessage('Gagal memproses foto: ' + (err.message || 'Format tidak didukung'));
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleApplyCustomUrl = () => {
    if (!customUrl.trim()) return;
    setFoto(customUrl.trim());
    setFotoThumbnail(customUrl.trim());
    setShowUrlInput(false);
    setCustomUrl('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedId = id.trim();
    const trimmedNama = nama.trim();

    if (!trimmedId) {
      setErrorMessage('NIS / ID Santri wajib diisi.');
      return;
    }

    if (!trimmedNama) {
      setErrorMessage('Nama lengkap santri wajib diisi.');
      return;
    }

    // Cek apakah NIS baru bentrok dengan santri lain yang bukan santri ini
    if (trimmedId.toLowerCase() !== originalId.toLowerCase()) {
      const exists = allSantriList.some(
        s => s.id.toLowerCase() === trimmedId.toLowerCase() && s.id.toLowerCase() !== originalId.toLowerCase()
      );
      if (exists) {
        setErrorMessage(`NIS "${trimmedId}" sudah digunakan oleh santri lain di database. Mohon gunakan NIS yang unik.`);
        return;
      }
    }

    const updatedSantri: Santri = {
      ...santri,
      id: trimmedId,
      nama: trimmedNama,
      kelas,
      kamar: kamar.trim(),
      alamat: alamat.trim(),
      foto: foto.trim() || 'https://via.placeholder.com/150x180?text=Foto+Santri',
      fotoThumbnail: fotoThumbnail.trim() || foto.trim() || undefined,
      password: password.trim() || trimmedId,
      namaOrangTua: namaOrangTua.trim(),
      namaWaliKelas: namaWaliKelas.trim(),
      noWaWaliKelas: noWaWaliKelas.trim(),
      statusSantri,
      saldoUangSaku: Number(saldoUangSaku) || 0
    };

    onSave(updatedSantri, originalId);
    if (onNotify) {
      onNotify(`Data santri "${trimmedNama}" (${trimmedId}) berhasil diperbarui dan tersimpan ke database.`);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[10002] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl my-auto rounded-3xl bg-gradient-to-b from-[#062417] via-[#041a10] to-[#020d08] border-2 border-[#d4af37]/60 shadow-[0_20px_60px_rgba(0,0,0,0.9)] text-white overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="relative px-6 py-4 bg-gradient-to-r from-[#0b3320] via-[#062417] to-[#0b3320] border-b border-[#d4af37]/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f5e298] via-[#d4af37] to-[#7a5410] flex items-center justify-center text-black shadow-lg">
              <User className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#f5e298] text-gold-3d tracking-wide">
                Edit & Pengaturan Data Santri
              </h3>
              <p className="text-xs text-emerald-300/90 font-mono">
                NIS Awal: <span className="font-bold text-[#d4af37]">{originalId}</span> • {santri.nama}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-black/50 border border-white/20 text-zinc-400 hover:text-white flex items-center justify-center hover:bg-red-950 hover:border-red-500/50 transition cursor-pointer"
            title="Tutup Form"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ERROR NOTIFICATION BANNER */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-950/80 border border-red-500/60 text-red-200 text-xs flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}

        {/* FORM CONTENT */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          
          {/* SECTION FOTO SANTRI */}
          <div className="p-4 rounded-2xl bg-[#03150d] border border-[#d4af37]/30 space-y-3">
            <span className="text-xs font-bold text-[#f5e298] uppercase tracking-wider block">
              Foto Santri
            </span>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative w-24 h-28 rounded-xl overflow-hidden border-2 border-[#d4af37] bg-black shadow-lg group shrink-0">
                <img
                  src={foto || 'https://via.placeholder.com/120x150?text=Foto+Santri'}
                  alt={nama || 'Foto Santri'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).setAttribute('src', 'https://via.placeholder.com/120x150?text=Foto+Santri');
                  }}
                />
                {isCompressing && (
                  <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-[10px] text-amber-300 font-bold p-1 text-center">
                    <Sparkles className="w-4 h-4 animate-spin mb-1 text-amber-400" />
                    <span>Memproses...</span>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2 text-center sm:text-left w-full">
                <p className="text-xs text-emerald-200/80">
                  Unggah foto dari perangkat atau gunakan tautan gambar online. Foto otomatis dikompresi agar hemat penyimpanan database.
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isCompressing}
                    className="btn-3d-gold px-3.5 py-1.5 rounded-xl text-black font-extrabold text-xs flex items-center gap-1.5 shadow hover:scale-102 transition cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Unggah / Ganti Foto</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="px-3 py-1.5 rounded-xl bg-[#082a1b] hover:bg-[#0c3824] border border-[#d4af37]/40 text-[#f3e5ab] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Gunakan Link URL</span>
                  </button>

                  {foto && (
                    <button
                      type="button"
                      onClick={() => {
                        setFoto('');
                        setFotoThumbnail('');
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 text-xs font-semibold transition cursor-pointer"
                    >
                      Hapus Foto
                    </button>
                  )}
                </div>

                {showUrlInput && (
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="url"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      placeholder="https://domain.com/foto-santri.jpg"
                      className="flex-1 px-3 py-1.5 rounded-xl bg-[#020e08] border border-[#d4af37]/50 text-white text-xs focus:outline-none focus:border-[#d4af37]"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCustomUrl}
                      className="px-3 py-1.5 rounded-xl bg-[#d4af37] text-black font-bold text-xs hover:bg-[#f5e298] transition cursor-pointer"
                    >
                      Terapkan
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* GRID IDENTITAS UTAMA: NIS & NAMA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#d4af37] mb-1.5 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5" />
                <span>NIS / ID SANTRI:</span>
              </label>
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                required
                placeholder="Contoh: SSAM-01"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#020e08] border border-[#d4af37]/40 text-white font-mono font-bold text-sm focus:outline-none focus:border-[#d4af37] shadow-inner"
              />
              <span className="text-[10px] text-zinc-400 mt-1 block">
                Mengubah NIS akan memperbarui identitas tanpa membuat duplikat.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#d4af37] mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>NAMA LENGKAP SANTRI:</span>
              </label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                required
                placeholder="Nama lengkap santri..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#020e08] border border-[#d4af37]/40 text-white font-bold text-sm focus:outline-none focus:border-[#d4af37] shadow-inner"
              />
            </div>
          </div>

          {/* GRID JENJANG, KAMAR & STATUS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#d4af37] mb-1.5 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                <span>JENJANG / KELAS:</span>
              </label>
              <select
                value={kelas}
                onChange={(e) => setKelas(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#020e08] border border-[#d4af37]/40 text-white text-xs font-bold focus:outline-none focus:border-[#d4af37]"
              >
                {CLASS_OPTIONS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#d4af37] mb-1.5 flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5" />
                <span>KAMAR PONDOK:</span>
              </label>
              <input
                type="text"
                value={kamar}
                onChange={(e) => setKamar(e.target.value)}
                placeholder="Contoh: Al-Ghazali 02"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#020e08] border border-[#d4af37]/40 text-white text-xs focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#d4af37] mb-1.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>STATUS SANTRI:</span>
              </label>
              <select
                value={statusSantri}
                onChange={(e) => setStatusSantri(e.target.value as StatusSantri)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#020e08] border border-[#d4af37]/40 text-white text-xs font-bold focus:outline-none focus:border-[#d4af37]"
              >
                {STATUS_OPTIONS.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ALAMAT ASAL */}
          <div>
            <label className="block text-xs font-bold text-[#d4af37] mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>ALAMAT ASAL LENGKAP:</span>
            </label>
            <textarea
              rows={2}
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              placeholder="Contoh: Dsn. Krajan, RT 03/RW 01, Paiton, Probolinggo, Jawa Timur"
              className="w-full px-3.5 py-2 rounded-xl bg-[#020e08] border border-[#d4af37]/40 text-white text-xs leading-relaxed focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          {/* GRID ORANG TUA & PASSWORD WALI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#d4af37] mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>NAMA ORANG TUA / WALI:</span>
              </label>
              <input
                type="text"
                value={namaOrangTua}
                onChange={(e) => setNamaOrangTua(e.target.value)}
                placeholder="Contoh: H. Ahmad Subagio"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#020e08] border border-[#d4af37]/40 text-white text-xs focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#d4af37] mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>PASSWORD LOGIN WALI SANTRI:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[10px] text-emerald-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3 h-3" />
                  <span>{showPassword ? 'Sembunyikan' : 'Lihat'}</span>
                </button>
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password wali santri..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#020e08] border border-[#d4af37]/40 text-white font-mono text-xs focus:outline-none focus:border-[#d4af37]"
              />
              <span className="text-[10px] text-zinc-400 mt-0.5 block">
                Digunakan untuk login di Portal Wali Santri.
              </span>
            </div>
          </div>

          {/* GRID WALI KELAS & NO WA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#d4af37] mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>NAMA WALI KELAS:</span>
              </label>
              <input
                type="text"
                value={namaWaliKelas}
                onChange={(e) => setNamaWaliKelas(e.target.value)}
                placeholder="Contoh: Ustazah Fina Nikmatul Kamelia"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#020e08] border border-[#d4af37]/40 text-white text-xs focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#d4af37] mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                <span>NO. WHATSAPP WALI KELAS:</span>
              </label>
              <input
                type="text"
                value={noWaWaliKelas}
                onChange={(e) => setNoWaWaliKelas(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#020e08] border border-[#d4af37]/40 text-white font-mono text-xs focus:outline-none focus:border-[#d4af37]"
              />
            </div>
          </div>

          {/* SALDO TABUNGAN UANG SAKU */}
          <div>
            <label className="block text-xs font-bold text-[#d4af37] mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>SALDO TABUNGAN UANG SAKU (RP):</span>
            </label>
            <input
              type="number"
              value={saldoUangSaku}
              onChange={(e) => setSaldoUangSaku(Number(e.target.value) || 0)}
              min={0}
              placeholder="0"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#020e08] border border-[#d4af37]/40 text-white font-mono font-bold text-xs focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          {/* ACTION BUTTONS */}
          <div className="pt-4 border-t border-[#d4af37]/30 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-black/60 hover:bg-[#072417] border border-white/20 text-zinc-300 hover:text-white font-bold text-xs transition cursor-pointer text-center"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isCompressing}
              className="w-full sm:w-auto btn-3d-gold px-7 py-3 rounded-xl text-black font-black text-xs flex items-center justify-center gap-2 shadow-[0_6px_25px_rgba(212,175,55,0.45)] hover:scale-105 active:scale-95 transition cursor-pointer"
            >
              <Save className="w-4 h-4 text-black stroke-[2.4]" />
              <span>SIMPAN PERUBAHAN</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
