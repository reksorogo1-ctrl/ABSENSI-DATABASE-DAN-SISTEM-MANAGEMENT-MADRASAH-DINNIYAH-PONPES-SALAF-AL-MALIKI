import React, { useState, useEffect, useMemo } from 'react';
import { 
  Mail, Send, Inbox, FileText, Trash2, RefreshCw, Search, Plus, 
  CheckCircle2, AlertTriangle, ExternalLink, Users, Check, X, 
  Clock, Sparkles, Filter, ShieldCheck, CornerDownRight, 
  ChevronRight, ArrowLeft, Eye, MessageSquare, BookOpen, 
  Award, CreditCard, ChevronDown, UserCheck
} from 'lucide-react';
import { 
  GmailService, 
  GmailProfile, 
  GmailMessageSummary, 
  GmailMessageDetail, 
  GmailLabel,
  SendEmailPayload,
  PESANTREN_EMAIL_TEMPLATES,
  EmailTemplate,
  formatGmailDate
} from '../gmailService';
import { getCurrentGoogleUser, googleSignIn, logoutGoogle, getAccessToken, User } from '../googleAuth';
import { 
  Santri, 
  GuruPengajar, 
  SyahriyahRecord, 
  AbsensiSantriRecord, 
  NilaiUjianRecord, 
  AppSettings 
} from '../types';

export interface TabGmailProps {
  settings: AppSettings;
  santriList: Santri[];
  guruList: GuruPengajar[];
  syahriyahList?: SyahriyahRecord[];
  absensiSantriList?: AbsensiSantriRecord[];
  nilaiList?: NilaiUjianRecord[];
  isGoogleConnected: boolean;
  setIsGoogleConnected: (connected: boolean) => void;
}

export const TabGmail: React.FC<TabGmailProps> = ({
  settings,
  santriList,
  guruList,
  syahriyahList = [],
  absensiSantriList = [],
  nilaiList = [],
  isGoogleConnected,
  setIsGoogleConnected
}) => {
  // Authentication & Profile state
  const [googleUser, setGoogleUser] = useState<User | null>(getCurrentGoogleUser());
  const [profile, setProfile] = useState<GmailProfile | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Email listing state
  const [activeFolder, setActiveFolder] = useState<string>('INBOX');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [messages, setMessages] = useState<GmailMessageDetail[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [selectedMessage, setSelectedMessage] = useState<GmailMessageDetail | null>(null);
  const [labels, setLabels] = useState<GmailLabel[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);

  // Compose Email State
  const [showComposeModal, setShowComposeModal] = useState<boolean>(false);
  const [composeTo, setComposeTo] = useState<string>('');
  const [composeCc, setComposeCc] = useState<string>('');
  const [composeBcc, setComposeBcc] = useState<string>('');
  const [composeSubject, setComposeSubject] = useState<string>('');
  const [composeBody, setComposeBody] = useState<string>('');
  const [composeIsHtml, setComposeIsHtml] = useState<boolean>(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedSantriId, setSelectedSantriId] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);

  // User Confirmation Modal (MANDATORY per Google Workspace Skill for destructive/mutating ops)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    confirmColor: string;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    confirmText: '',
    confirmColor: '',
    onConfirm: async () => {}
  });

  // Success / Notice Banner
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Show notice helper
  const showNotice = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(prev => (prev?.message === message ? null : prev));
    }, 6000);
  };

  // Check login & load profile on mount or when connected
  useEffect(() => {
    const checkInit = async () => {
      const user = getCurrentGoogleUser();
      setGoogleUser(user);
      const token = await getAccessToken();
      if (token && user) {
        setIsGoogleConnected(true);
        fetchGmailProfileAndInbox('INBOX');
      }
    };
    checkInit();
  }, []);

  // Fetch Profile & Messages
  const fetchGmailProfileAndInbox = async (folder: string = activeFolder, query: string = searchQuery) => {
    setIsLoadingMessages(true);
    setAuthError(null);
    try {
      // 1. Fetch Profile
      const prof = await GmailService.getProfile();
      setProfile(prof);
      setIsGoogleConnected(true);

      // 2. Fetch Labels
      try {
        const lbls = await GmailService.listLabels();
        setLabels(lbls);
      } catch (lblErr) {
        console.debug('Label fetch note:', lblErr);
      }

      // 3. List Messages
      const listRes = await GmailService.listMessages({
        labelIds: [folder],
        q: query || undefined,
        maxResults: 15
      });

      setNextPageToken(listRes.nextPageToken);

      if (listRes.messages && listRes.messages.length > 0) {
        // Fetch full message details in parallel (top 15)
        const detailed = await Promise.all(
          listRes.messages.map(async (m) => {
            try {
              return await GmailService.getMessage(m.id);
            } catch {
              return null;
            }
          })
        );
        const valid = detailed.filter((m): m is GmailMessageDetail => m !== null);
        setMessages(valid);
      } else {
        setMessages([]);
      }
    } catch (err: any) {
      console.warn('Gmail fetch note:', err);
      setAuthError(err?.message || 'Gagal memuat pesan Gmail.');
      if (err?.message?.includes('401') || err?.message?.includes('token') || err?.message?.includes('Belum terhubung')) {
        setIsGoogleConnected(false);
      }
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Google Sign-In Handler
  const handleGoogleSignIn = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setIsGoogleConnected(true);
        showNotice(`Berhasil terhubung dengan akun Gmail: ${result.user.email}`);
        await fetchGmailProfileAndInbox('INBOX');
      }
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setAuthError(err?.message || 'Gagal masuk dengan Google. Pastikan jendela popup diizinkan pada browser Anda.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Google Logout Handler
  const handleLogoutGoogle = async () => {
    const confirmed = window.confirm('Apakah Anda yakin ingin memutuskan sambungan akun Gmail dari aplikasi ini?');
    if (!confirmed) return;

    await logoutGoogle();
    setGoogleUser(null);
    setProfile(null);
    setMessages([]);
    setSelectedMessage(null);
    setIsGoogleConnected(false);
    showNotice('Akun Gmail telah berhasil diputuskan.', 'info');
  };

  // Switch folder tab
  const handleSwitchFolder = (folderId: string) => {
    setActiveFolder(folderId);
    setSelectedMessage(null);
    fetchGmailProfileAndInbox(folderId, searchQuery);
  };

  // Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSelectedMessage(null);
    fetchGmailProfileAndInbox(activeFolder, searchQuery);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    setSelectedMessage(null);
    fetchGmailProfileAndInbox(activeFolder, '');
  };

  // Apply Santri Template values
  const handleSelectTemplate = (templateId: string, santriIdParam?: string) => {
    setSelectedTemplateId(templateId);
    const tmpl = PESANTREN_EMAIL_TEMPLATES.find(t => t.id === templateId);
    if (!tmpl) return;

    const sId = santriIdParam !== undefined ? santriIdParam : selectedSantriId;
    const santri = santriList.find(s => s.id === sId) || santriList[0];

    let replacedSubject = tmpl.subject;
    let replacedBody = tmpl.body;

    if (santri) {
      if (!composeTo) {
        // Find email from santri data if available or placeholder
        const email = (santri as any).email || (santri as any).emailWali || `${santri.id.toLowerCase()}@wali.pesantren.id`;
        setComposeTo(email);
      }

      const syahriyah = syahriyahList.find(sy => sy.idSantri === santri.id);
      const nilai = nilaiList.find(n => n.idSantri === santri.id);
      const santriAbsensi = absensiSantriList.filter(a => a.idSantri === santri.id);
      const hadirCount = santriAbsensi.filter(a => a.status === 'Hadir').length;
      const izinCount = santriAbsensi.filter(a => a.status === 'Izin' || a.status === 'Sakit').length;
      const alphaCount = santriAbsensi.filter(a => a.status === 'Alpha').length;

      const placeholders: Record<string, string> = {
        '{NAMA_SANTRI}': santri.nama,
        '{KELAS_SANTRI}': santri.kelas,
        '{NIS_SANTRI}': santri.id,
        '{BULAN}': syahriyah?.bulan || 'Bulan Berjalan (Tahun Ajaran 1447-1448 H)',
        '{NOMINAL}': syahriyah ? syahriyah.nominal.toLocaleString('id-ID') : '350.000',
        '{PERIODE}': 'Semester Berjalan',
        '{TOTAL_PERTEMUAN}': String(santriAbsensi.length || 24),
        '{HADIR}': String(hadirCount || 22),
        '{IZIN}': String(izinCount || 2),
        '{ALPHA}': String(alphaCount || 0),
        '{CATATAN}': 'Alhamdulillah senantiasa disiplin dan rajin dalam muthala\'ah kitab.',
        '{NILAI_NADZHOM}': (santri as any).predikatMuhafadzoh || (nilai ? String(nilai.nilai) : 'Mumtaz (A)'),
        '{CAPAIAN_BAIT}': '250',
        '{NILAI_BACA_KITAB}': (santri as any).nilaiBacaKitab ? `${(santri as any).nilaiBacaKitab} (${(santri as any).predikatBacaKitab || 'Jayyid Jiddan'})` : '88 (Jayyid Jiddan)',
        '{NILAI_KOREKSIAN}': 'Sah & Muktamad (Tarkib Pegon Lengkap)',
        '{RATA_RATA}': '89.5',
        '{STATUS_KELULUSAN}': 'NAIK KELAS DENGAN PREDIKAT MEMUASKAN',
        '{HARI_TANGGAL}': 'Ahad, 15 Syawwal 1448 H / 2026 M',
        '{TANGGAL_LIBUR}': '20 Ramadhan 1448 H',
        '{BATAS_JEMPUT}': '22 Ramadhan 1448 H (Pukul 17:00 WIB)',
        '{TANGGAL_KEMBALI}': '10 Syawwal 1448 H',
        '{TANGGAL_KBM}': '12 Syawwal 1448 H'
      };

      for (const [key, val] of Object.entries(placeholders)) {
        replacedSubject = replacedSubject.split(key).join(val);
        replacedBody = replacedBody.split(key).join(val);
      }
    }

    setComposeSubject(replacedSubject);
    setComposeBody(replacedBody);
  };

  // Quick Open Compose for Specific Santri
  const handleOpenComposeForSantri = (santri: Santri, defaultCategory: 'syahriyah' | 'absensi' | 'ujian' = 'syahriyah') => {
    setSelectedSantriId(santri.id);
    const email = (santri as any).email || (santri as any).emailWali || `${santri.id.toLowerCase()}@wali.pesantren.id`;
    setComposeTo(email);
    setShowComposeModal(true);

    const matchTmpl = PESANTREN_EMAIL_TEMPLATES.find(t => t.category === defaultCategory) || PESANTREN_EMAIL_TEMPLATES[0];
    if (matchTmpl) {
      handleSelectTemplate(matchTmpl.id, santri.id);
    }
  };

  // Submit Send Email (With MANDATORY User Confirmation Dialog)
  const handleSendEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!composeTo.trim()) {
      alert('Alamat email tujuan (To) wajib diisi.');
      return;
    }
    if (!composeSubject.trim()) {
      alert('Subjek email wajib diisi.');
      return;
    }
    if (!composeBody.trim()) {
      alert('Isi pesan email tidak boleh kosong.');
      return;
    }

    // MANDATORY USER CONFIRMATION DIALOG (per Workspace Skill)
    setConfirmDialog({
      isOpen: true,
      title: '📧 Konfirmasi Pengiriman Email Resmi',
      description: `Apakah Anda yakin ingin mengirimkan email ini melalui Gmail resmi ${profile?.emailAddress || googleUser?.email || ''}?\n\n• Kepada: ${composeTo}\n• Subjek: "${composeSubject}"\n• Panjang Pesan: ${composeBody.length} karakter`,
      confirmText: 'Kirim Email Sekarang',
      confirmColor: 'bg-emerald-600 hover:bg-emerald-500 text-white',
      onConfirm: async () => {
        setIsSending(true);
        try {
          const payload: SendEmailPayload = {
            to: composeTo.trim(),
            cc: composeCc.trim() || undefined,
            bcc: composeBcc.trim() || undefined,
            subject: composeSubject.trim(),
            body: composeBody,
            isHtml: composeIsHtml,
            fromName: settings.nama_pesantren || 'Pondok Pesantren Salaf Al-Maliki'
          };

          await GmailService.sendEmail(payload);
          showNotice(`Email berhasil dikirim ke: ${composeTo}`);
          setShowComposeModal(false);
          // Reset form
          setComposeTo('');
          setComposeCc('');
          setComposeBcc('');
          setComposeSubject('');
          setComposeBody('');
          setSelectedTemplateId('');
          // Refresh sent / inbox
          fetchGmailProfileAndInbox(activeFolder);
        } catch (err: any) {
          console.error('Failed to send email:', err);
          alert(`Gagal mengirim email: ${err?.message || 'Periksa koneksi dan izin Google akun Anda.'}`);
        } finally {
          setIsSending(false);
        }
      }
    });
  };

  // Move Message to Trash (With MANDATORY User Confirmation Dialog)
  const handleTrashMessage = (msg: GmailMessageDetail) => {
    setConfirmDialog({
      isOpen: true,
      title: '🗑️ Pindahkan Email ke Kotak Sampah?',
      description: `Apakah Anda yakin ingin memindahkan email ini ke folder Sampah (Trash)?\n\n• Dari: ${msg.from}\n• Subjek: "${msg.subject}"\n• Tanggal: ${msg.dateStr}`,
      confirmText: 'Pindahkan ke Sampah',
      confirmColor: 'bg-amber-600 hover:bg-amber-500 text-white',
      onConfirm: async () => {
        try {
          await GmailService.trashMessage(msg.id);
          showNotice('Email berhasil dipindahkan ke kotak sampah.');
          if (selectedMessage?.id === msg.id) {
            setSelectedMessage(null);
          }
          fetchGmailProfileAndInbox(activeFolder);
        } catch (err: any) {
          alert(`Gagal memindahkan pesan: ${err?.message || 'Error'}`);
        }
      }
    });
  };

  // Permanently Delete Message (With MANDATORY User Confirmation Dialog)
  const handleDeletePermanently = (msg: GmailMessageDetail) => {
    setConfirmDialog({
      isOpen: true,
      title: '⚠️ Hapus Email Secara Permanen?',
      description: `Tindakan ini tidak dapat dibatalkan! Email akan dihapus selamanya dari akun Gmail Anda.\n\n• Subjek: "${msg.subject}"\n• ID: ${msg.id}`,
      confirmText: 'Hapus Permanen',
      confirmColor: 'bg-red-600 hover:bg-red-500 text-white',
      onConfirm: async () => {
        try {
          await GmailService.deleteMessage(msg.id);
          showNotice('Email telah dihapus secara permanen.', 'info');
          if (selectedMessage?.id === msg.id) {
            setSelectedMessage(null);
          }
          fetchGmailProfileAndInbox(activeFolder);
        } catch (err: any) {
          alert(`Gagal menghapus pesan: ${err?.message || 'Error'}`);
        }
      }
    });
  };

  // Mark As Read
  const handleMarkAsRead = async (msg: GmailMessageDetail) => {
    try {
      await GmailService.markAsRead(msg.id);
      msg.isUnread = false;
      setMessages([...messages]);
    } catch (e) {
      console.debug('Mark as read note:', e);
    }
  };

  // Open Message Detail
  const handleOpenMessage = (msg: GmailMessageDetail) => {
    setSelectedMessage(msg);
    if (msg.isUnread) {
      handleMarkAsRead(msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER BANNER MEWAH TEMA SALAF DENGAN STATUS GMAIL */}
      <div className="card-3d rounded-3xl p-6 border-2 border-[#d4af37]/40 bg-gradient-to-br from-[#031d12] via-[#052b1b] to-[#02140b] shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-[#0e442c] to-[#052517] border-2 border-[#d4af37] flex items-center justify-center text-[#fde047] shadow-xl shrink-0">
              <Mail className="w-6 h-6 text-[#fde047] drop-shadow" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black text-white text-gold-3d">
                  Pusat Komunikasi & Gmail Resmi Pesantren
                </h2>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#d4af37] text-black font-extrabold uppercase font-sans shadow-sm">
                  Google Workspace
                </span>
              </div>
              <p className="text-xs text-emerald-200/90 mt-1">
                Kirim surat resmi, laporan presensi santri, tagihan syahriyah, serta baca pesan masuk langsung melalui akun Gmail resmi.
              </p>
            </div>
          </div>

          {/* Action Buttons: Tulis Email & Connect Google */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start lg:justify-end">
            <button
              type="button"
              onClick={() => {
                setShowComposeModal(true);
                if (PESANTREN_EMAIL_TEMPLATES.length > 0 && !selectedTemplateId) {
                  handleSelectTemplate(PESANTREN_EMAIL_TEMPLATES[0].id);
                }
              }}
              className="btn-3d-yellow px-4 py-2.5 rounded-xl text-black font-black text-xs flex items-center gap-2 shadow-xl hover:scale-102 transition"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Tulis Email Baru</span>
            </button>

            {googleUser ? (
              <div className="flex items-center gap-2 bg-[#02130a] border border-[#d4af37]/40 px-3 py-1.5 rounded-xl shadow-inner">
                <div className="w-7 h-7 rounded-full overflow-hidden bg-emerald-950 border border-[#d4af37]/50 shrink-0">
                  <img
                    src={googleUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                    alt={googleUser.displayName || 'Google'}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-left">
                  <span className="text-[11px] font-bold text-[#fef08a] block truncate max-w-[140px]">
                    {profile?.emailAddress || googleUser.email}
                  </span>
                  <span className="text-[9px] text-emerald-400 font-mono block">
                    {profile ? `${profile.messagesTotal.toLocaleString()} Pesan` : 'Terhubung'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogoutGoogle}
                  className="ml-1 text-[10px] text-red-300 hover:text-red-200 underline"
                  title="Putuskan Akun"
                >
                  Keluar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isAuthenticating}
                className="gsi-material-button text-xs font-bold shadow-lg"
              >
                <div className="gsi-material-button-state"></div>
                <div className="gsi-material-button-content-wrapper">
                  <div className="gsi-material-button-icon">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                  </div>
                  <span className="gsi-material-button-contents">
                    {isAuthenticating ? 'Menghubungkan...' : 'Sign in with Google'}
                  </span>
                </div>
              </button>
            )}

            <button
              type="button"
              onClick={() => fetchGmailProfileAndInbox(activeFolder, searchQuery)}
              disabled={isLoadingMessages}
              className="p-2.5 rounded-xl bg-[#031d10] border border-[#d4af37]/40 text-[#fef08a] hover:bg-[#062c1b] transition shadow"
              title="Perbarui Pesan"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingMessages ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Notification Banner */}
        {notification && (
          <div className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between gap-3 shadow-md animate-fade-in ${
            notification.type === 'success' 
              ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-200' 
              : notification.type === 'error'
              ? 'bg-red-950/90 border-red-500/60 text-red-200'
              : 'bg-amber-950/90 border-amber-500/60 text-amber-200'
          }`}>
            <div className="flex items-center gap-2.5">
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-stone-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {authError && (
          <div className="p-3.5 rounded-2xl bg-amber-950/80 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{authError}</span>
            </div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="px-3 py-1 bg-amber-400 text-black font-extrabold rounded-lg text-xs"
            >
              Hubungkan Ulang
            </button>
          </div>
        )}
      </div>

      {/* 2. KONTEN UTAMA: SPLIT LAYOUT SIDEBAR FOLDER & LIST EMAIL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Kolom Kiri: Menu Folder & Filter Cepat */}
        <div className="lg:col-span-3 space-y-4">
          <div className="card-3d-glass rounded-3xl p-4 border border-[#d4af37]/35 space-y-3 shadow-xl">
            <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block px-1">
              Kotak Surat Gmail
            </span>

            <nav className="space-y-1">
              {[
                { id: 'INBOX', label: 'Kotak Masuk', icon: Inbox, badge: profile?.messagesTotal ? `${profile.messagesTotal}` : undefined },
                { id: 'SENT', label: 'Terkirim', icon: Send },
                { id: 'DRAFT', label: 'Draf', icon: FileText },
                { id: 'TRASH', label: 'Kotak Sampah', icon: Trash2 }
              ].map(folder => {
                const Icon = folder.icon;
                const isCurrent = activeFolder === folder.id;
                return (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => handleSwitchFolder(folder.id)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-between transition ${
                      isCurrent
                        ? 'btn-3d-yellow text-[#1a1202] shadow-md scale-102 font-black'
                        : 'text-slate-200 hover:bg-[#0e442c]/50 hover:text-white border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isCurrent ? 'text-black' : 'text-emerald-400'}`} />
                      <span>{folder.label}</span>
                    </div>
                    {folder.badge && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isCurrent ? 'bg-black text-[#fef08a]' : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        {folder.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Templat Cepat Surat */}
            <div className="pt-3 border-t border-[#d4af37]/20 space-y-2">
              <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider block px-1">
                Templat Cepat Pesantren
              </span>
              <div className="space-y-1.5">
                {PESANTREN_EMAIL_TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setShowComposeModal(true);
                      handleSelectTemplate(t.id);
                    }}
                    className="w-full text-left p-2 rounded-xl bg-black/40 hover:bg-emerald-950/60 border border-[#d4af37]/25 text-[11px] text-amber-200 hover:text-white transition flex items-center justify-between group"
                  >
                    <span className="truncate pr-1">{t.title}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-emerald-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Actions per Santri */}
            <div className="pt-3 border-t border-[#d4af37]/20 space-y-2">
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block px-1">
                Kirim Laporan Santri
              </span>
              <p className="text-[10px] text-slate-300 px-1 leading-snug">
                Pilih santri untuk mengirimkan surat resmi tagihan atau rekap nilai:
              </p>
              <div className="max-h-48 overflow-y-auto space-y-1 no-scrollbar pr-1">
                {santriList.slice(0, 8).map(s => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-1.5 rounded-lg bg-[#02180d] border border-emerald-500/20 text-[11px]"
                  >
                    <div className="truncate pr-2">
                      <span className="font-bold text-white block truncate">{s.nama}</span>
                      <span className="text-[9px] text-emerald-400 font-mono">{s.kelas}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenComposeForSantri(s, 'syahriyah')}
                      className="px-2 py-0.5 bg-amber-400/20 hover:bg-amber-400 text-amber-300 hover:text-black rounded text-[10px] font-bold border border-amber-400/40 transition shrink-0"
                    >
                      Kirim
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Pencarian, List Email & Detail Viewer */}
        <div className="lg:col-span-9 space-y-4">
          {/* Bar Pencarian Email */}
          <div className="card-3d-glass rounded-2xl p-3 border border-[#d4af37]/30 flex flex-col sm:flex-row items-center gap-2.5 shadow-md">
            <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 w-full">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari berdasarkan nama santri, wali, subjek, atau alamat email..."
                  className="w-full bg-[#010e07] border border-[#d4af37]/40 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-emerald-400/50 focus:outline-none focus:border-[#d4af37]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="btn-3d-yellow px-4 py-2 rounded-xl text-xs font-black text-black shrink-0"
              >
                Cari
              </button>
            </form>
          </div>

          {/* DETAIL VIEWER (Jika ada email yang dibuka) */}
          {selectedMessage ? (
            <div className="card-3d rounded-3xl p-6 border-2 border-[#d4af37]/40 bg-[#031c12] shadow-2xl space-y-5 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#d4af37]/20">
                <button
                  type="button"
                  onClick={() => setSelectedMessage(null)}
                  className="px-3 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 border border-[#d4af37]/40 text-xs font-bold text-emerald-300 flex items-center gap-1.5 transition self-start"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali ke Daftar</span>
                </button>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setComposeTo(selectedMessage.from);
                      setComposeSubject(`Re: ${selectedMessage.subject}`);
                      setComposeBody(`\n\n--- Pada ${selectedMessage.dateStr}, ${selectedMessage.from} menulis:\n> ${selectedMessage.bodyText.slice(0, 300)}...`);
                      setShowComposeModal(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 transition shadow"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Balas</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTrashMessage(selectedMessage)}
                    className="px-3 py-1.5 rounded-xl bg-amber-950 hover:bg-amber-900 border border-amber-500/50 text-amber-200 text-xs font-bold flex items-center gap-1.5 transition"
                    title="Pindahkan ke Sampah"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Sampah</span>
                  </button>
                </div>
              </div>

              {/* Header Email Detail */}
              <div className="space-y-2 bg-[#02130a] p-4 rounded-2xl border border-[#d4af37]/30">
                <h3 className="text-base sm:text-lg font-black text-white text-gold-3d leading-snug">
                  {selectedMessage.subject}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2 border-t border-[#d4af37]/15">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Dari:</span>
                    <span className="font-bold text-[#fef08a] block break-all">{selectedMessage.from}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Waktu:</span>
                    <span className="font-mono text-emerald-300 font-bold block">{selectedMessage.dateStr}</span>
                  </div>
                  {selectedMessage.to && (
                    <div className="sm:col-span-2">
                      <span className="text-slate-400 block text-[11px]">Kepada:</span>
                      <span className="text-slate-200 font-medium block break-all">{selectedMessage.to}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Isi Email (Body) */}
              <div className="bg-[#02130a] p-5 sm:p-6 rounded-2xl border border-[#d4af37]/25 text-xs text-slate-100 leading-relaxed overflow-x-auto min-h-[220px]">
                {selectedMessage.bodyHtml ? (
                  <div 
                    dangerouslySetInnerHTML={{ __html: selectedMessage.bodyHtml }} 
                    className="prose prose-invert max-w-none text-slate-200 font-sans"
                  />
                ) : (
                  <pre className="whitespace-pre-wrap font-sans text-xs text-slate-200">
                    {selectedMessage.bodyText || selectedMessage.snippet}
                  </pre>
                )}
              </div>
            </div>
          ) : (
            /* DAFTAR EMAIL LIST VIEW */
            <div className="card-3d-glass rounded-3xl p-5 border border-[#d4af37]/35 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#d4af37]/20">
                <div className="flex items-center gap-2">
                  <Inbox className="w-4 h-4 text-[#fde047]" />
                  <span className="text-sm font-extrabold text-white text-gold-3d">
                    {activeFolder === 'INBOX' ? 'Kotak Masuk' : activeFolder === 'SENT' ? 'Email Terkirim' : activeFolder === 'DRAFT' ? 'Draf' : 'Kotak Sampah'}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-bold">
                    {messages.length} Pesan
                  </span>
                </div>
                {searchQuery && (
                  <span className="text-xs text-amber-300 italic font-mono">
                    Filter: "{searchQuery}"
                  </span>
                )}
              </div>

              {isLoadingMessages ? (
                <div className="p-12 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-[#d4af37] animate-spin mx-auto" />
                  <p className="text-xs text-emerald-200 font-semibold">
                    Memuat pesan dari server Gmail...
                  </p>
                </div>
              ) : messages.length === 0 ? (
                <div className="p-10 text-center rounded-2xl bg-black/40 border border-emerald-500/20 space-y-3">
                  <Mail className="w-10 h-10 text-emerald-400/40 mx-auto" />
                  <h4 className="text-sm font-bold text-white">Tidak Ada Pesan</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    {searchQuery 
                      ? `Tidak ditemukan email yang sesuai dengan kata kunci "${searchQuery}".` 
                      : 'Kotak surat ini sedang kosong atau belum ada pesan baru.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowComposeModal(true);
                      if (PESANTREN_EMAIL_TEMPLATES.length > 0) {
                        handleSelectTemplate(PESANTREN_EMAIL_TEMPLATES[0].id);
                      }
                    }}
                    className="btn-3d-yellow px-4 py-2 text-xs font-bold mx-auto inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Mulai Tulis Email</span>
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-emerald-500/15 overflow-hidden rounded-2xl border border-emerald-500/25">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      onClick={() => handleOpenMessage(msg)}
                      className={`p-3.5 sm:p-4 hover:bg-emerald-950/70 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        msg.isUnread ? 'bg-[#08351f]/80 font-bold' : 'bg-[#02140a]/60'
                      }`}
                    >
                      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                        <div className="pt-0.5 sm:pt-0 shrink-0">
                          {msg.isUnread ? (
                            <span className="w-2.5 h-2.5 rounded-full bg-[#fde047] inline-block shadow-md ring-2 ring-amber-400" />
                          ) : (
                            <Mail className="w-4 h-4 text-emerald-400/50" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                            <span className="text-xs font-black text-[#fef08a] truncate max-w-[200px] sm:max-w-[260px]">
                              {msg.from.replace(/<.*>/, '').trim() || msg.from}
                            </span>
                            <span className="text-[10px] font-mono text-emerald-400/90 whitespace-nowrap">
                              {msg.dateStr}
                            </span>
                          </div>
                          <h4 className="text-xs font-extrabold text-white truncate mb-0.5">
                            {msg.subject}
                          </h4>
                          <p className="text-[11px] text-slate-300/80 truncate font-normal">
                            {msg.snippet}
                          </p>
                        </div>
                      </div>

                      {/* Action hover/quick buttons */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleOpenMessage(msg)}
                          className="px-2.5 py-1 rounded-lg bg-black/50 hover:bg-emerald-800 text-emerald-200 text-[10px] font-bold border border-emerald-500/40 transition"
                        >
                          Buka
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTrashMessage(msg)}
                          className="p-1 rounded-lg bg-black/50 hover:bg-red-900 text-red-300 text-[10px] border border-red-500/30 transition"
                          title="Hapus / Sampah"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. MODAL TULIS EMAIL BARU (COMPOSE MODAL) */}
      {showComposeModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#031d12] border-2 border-[#d4af37] rounded-3xl shadow-2xl overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-[#0b3d27] via-[#042013] to-[#0b3d27] border-b border-[#d4af37]/40 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-amber-400 text-black flex items-center justify-center font-bold shadow-md">
                  <Send className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white text-gold-3d">
                    Tulis & Kirim Surat Resmi via Gmail
                  </h3>
                  <p className="text-[11px] text-emerald-200">
                    Pengirim: <span className="font-mono text-[#fef08a]">{profile?.emailAddress || googleUser?.email || 'me'}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowComposeModal(false)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-black/40 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSendEmailSubmit} className="p-5 sm:p-6 space-y-4 text-xs">
              {/* Template & Penerima Cepat */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#02130b] p-3.5 rounded-2xl border border-[#d4af37]/30">
                <div>
                  <label className="text-[11px] font-bold text-amber-300 block mb-1">
                    Gunakan Templat Surat Resmi:
                  </label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => handleSelectTemplate(e.target.value)}
                    className="w-full bg-[#052516] border border-[#d4af37]/40 rounded-xl px-3 py-2 text-xs font-bold text-[#fef08a] focus:outline-none focus:border-[#d4af37]"
                  >
                    <option value="">-- Pilih Templat Resmi --</option>
                    {PESANTREN_EMAIL_TEMPLATES.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-emerald-300 block mb-1">
                    Isi Otomatis Data Santri:
                  </label>
                  <select
                    value={selectedSantriId}
                    onChange={(e) => {
                      setSelectedSantriId(e.target.value);
                      if (selectedTemplateId) {
                        handleSelectTemplate(selectedTemplateId, e.target.value);
                      }
                    }}
                    className="w-full bg-[#052516] border border-[#d4af37]/40 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#d4af37]"
                  >
                    <option value="">-- Pilih Santri --</option>
                    {santriList.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.nama} ({s.id} - {s.kelas})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Penerima (To) */}
              <div>
                <label className="text-xs font-bold text-white block mb-1">
                  Kepada (Email Penerima): <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  placeholder="contoh: wali.santri@gmail.com, ustadz@gmail.com"
                  className="w-full bg-[#02130a] border border-[#d4af37]/50 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              {/* Subjek */}
              <div>
                <label className="text-xs font-bold text-white block mb-1">
                  Subjek Email: <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="Subjek surat resmi pesantren..."
                  className="w-full bg-[#02130a] border border-[#d4af37]/50 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              {/* Isi Email */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-white">
                    Isi Pesan Surat: <span className="text-red-400">*</span>
                  </label>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    {composeBody.length} karakter
                  </span>
                </div>
                <textarea
                  rows={8}
                  required
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  placeholder="Tuliskan isi surat resmi atau pengumuman di sini..."
                  className="w-full bg-[#02130a] border border-[#d4af37]/50 rounded-xl p-3.5 text-xs text-white leading-relaxed focus:outline-none focus:border-[#d4af37] font-sans"
                />
              </div>

              {/* Footer Modal Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-[#d4af37]/30">
                <button
                  type="button"
                  onClick={() => setShowComposeModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-300 font-bold hover:bg-stone-800 transition"
                >
                  Batal
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isSending}
                    className="btn-3d-yellow px-6 py-2.5 rounded-xl text-black font-black flex items-center gap-2 shadow-xl hover:scale-102 transition"
                  >
                    <Send className={`w-4 h-4 stroke-[3] ${isSending ? 'animate-bounce' : ''}`} />
                    <span>{isSending ? 'Mengirim...' : 'Kirim Email'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. MANDATORY USER CONFIRMATION MODAL (Required by Google Workspace skill for destructive & mutating actions) */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-[#042014] border-2 border-[#d4af37] rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-amber-300">
              <ShieldCheck className="w-6 h-6 shrink-0 text-[#fde047]" />
              <h3 className="text-base font-extrabold text-white text-gold-3d">
                {confirmDialog.title}
              </h3>
            </div>

            <div className="p-4 rounded-2xl bg-black/60 border border-amber-500/30 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
              {confirmDialog.description}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-300 font-bold text-xs hover:bg-stone-800 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                  await confirmDialog.onConfirm();
                }}
                className={`px-5 py-2 rounded-xl text-xs font-black shadow-lg transition ${confirmDialog.confirmColor}`}
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
