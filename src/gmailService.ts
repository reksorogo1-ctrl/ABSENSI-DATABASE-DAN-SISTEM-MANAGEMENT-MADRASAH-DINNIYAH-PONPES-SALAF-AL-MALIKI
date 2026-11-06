import { getAccessToken } from './googleAuth';

export interface GmailProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

export interface GmailMessageHeader {
  name: string;
  value: string;
}

export interface GmailMessageSummary {
  id: string;
  threadId: string;
}

export interface GmailMessageDetail {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  internalDate: string;
  dateStr: string;
  from: string;
  to: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  isUnread: boolean;
}

export interface GmailLabel {
  id: string;
  name: string;
  type: string;
  messagesTotal?: number;
  messagesUnread?: number;
}

export interface SendEmailPayload {
  to: string;
  subject: string;
  body: string;
  isHtml?: boolean;
  cc?: string;
  bcc?: string;
  fromName?: string;
}

export interface EmailTemplate {
  id: string;
  title: string;
  subject: string;
  body: string;
  category: 'syahriyah' | 'absensi' | 'ujian' | 'undangan' | 'pengumuman';
}

/**
 * Encode string to URL-safe base64 (RFC 4648)
 */
function toBase64Url(str: string): string {
  // Handle UTF-8 characters safely
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Decode URL-safe base64 string
 */
function fromBase64Url(str: string): string {
  if (!str) return '';
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch (e) {
    return atob(base64);
  }
}

/**
 * Extract text & html bodies from Gmail payload parts recursively
 */
function extractBodyFromPayload(payload: any): { text: string; html: string } {
  let text = '';
  let html = '';

  if (!payload) return { text, html };

  if (payload.body && payload.body.data) {
    const decoded = fromBase64Url(payload.body.data);
    if (payload.mimeType === 'text/html') {
      html += decoded;
    } else if (payload.mimeType === 'text/plain') {
      text += decoded;
    }
  }

  if (payload.parts && Array.isArray(payload.parts)) {
    for (const part of payload.parts) {
      const nested = extractBodyFromPayload(part);
      if (nested.text) text += (text ? '\n' : '') + nested.text;
      if (nested.html) html += (html ? '<br/>' : '') + nested.html;
    }
  }

  return { text, html };
}

/**
 * Format timestamp into Indonesian WIB datetime
 */
export function formatGmailDate(timestampMs: string | number): string {
  if (!timestampMs) return '';
  try {
    const d = new Date(typeof timestampMs === 'string' ? Number(timestampMs) : timestampMs);
    return d.toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) + ' WIB';
  } catch {
    return String(timestampMs);
  }
}

export class GmailService {
  /**
   * Helper to execute authenticated requests to Gmail API
   */
  private static async fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('Belum terhubung ke Akun Google / Gmail. Silakan klik "Hubungkan Akun Google" terlebih dahulu.');
    }

    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${token}`);
    if (!headers.has('Content-Type') && options.method && options.method !== 'GET') {
      headers.set('Content-Type', 'application/json');
    }

    const url = endpoint.startsWith('http') ? endpoint : `https://gmail.googleapis.com/gmail/v1/users/me/${endpoint}`;
    const res = await fetch(url, {
      ...options,
      headers
    });

    if (!res.ok) {
      let errMsg = `Error ${res.status}: ${res.statusText}`;
      try {
        const errJson = await res.json();
        if (errJson?.error?.message) {
          errMsg = errJson.error.message;
        }
      } catch {}
      throw new Error(errMsg);
    }

    // Some DELETE responses return 204 No Content
    if (res.status === 204) {
      return { success: true };
    }

    return await res.json();
  }

  /**
   * Mendapatkan profil akun Gmail (Email, Total Pesan, Threads)
   */
  public static async getProfile(): Promise<GmailProfile> {
    return await this.fetchWithAuth('profile');
  }

  /**
   * Mendapatkan daftar label folder Gmail (INBOX, SENT, TRASH, DRAFT, dll)
   */
  public static async listLabels(): Promise<GmailLabel[]> {
    const data = await this.fetchWithAuth('labels');
    return data.labels || [];
  }

  /**
   * Mengambil daftar pesan berdasarkan folder atau kata kunci pencarian
   */
  public static async listMessages(options: {
    q?: string;
    labelIds?: string[];
    maxResults?: number;
    pageToken?: string;
  } = {}): Promise<{ messages: GmailMessageSummary[]; nextPageToken?: string; resultSizeEstimate?: number }> {
    const params = new URLSearchParams();
    if (options.q) params.set('q', options.q);
    if (options.maxResults) params.set('maxResults', String(options.maxResults));
    if (options.pageToken) params.set('pageToken', options.pageToken);
    if (options.labelIds && options.labelIds.length > 0) {
      options.labelIds.forEach(lbl => params.append('labelIds', lbl));
    } else {
      params.set('labelIds', 'INBOX');
    }

    const data = await this.fetchWithAuth(`messages?${params.toString()}`);
    return {
      messages: data.messages || [],
      nextPageToken: data.nextPageToken,
      resultSizeEstimate: data.resultSizeEstimate
    };
  }

  /**
   * Mengambil detail lengkap pesan (Subject, Pengirim, Penerima, Tanggal, Isi Email)
   */
  public static async getMessage(id: string): Promise<GmailMessageDetail> {
    const data = await this.fetchWithAuth(`messages/${id}?format=full`);
    const headers: GmailMessageHeader[] = data.payload?.headers || [];

    const getHeader = (name: string): string => {
      const h = headers.find(item => item.name.toLowerCase() === name.toLowerCase());
      return h ? h.value : '';
    };

    const subject = getHeader('Subject') || '(Tanpa Subjek)';
    const from = getHeader('From') || '(Pengirim Tidak Dikenal)';
    const to = getHeader('To') || '';
    const dateStr = getHeader('Date') || '';
    const { text, html } = extractBodyFromPayload(data.payload);

    const isUnread = (data.labelIds || []).includes('UNREAD');

    return {
      id: data.id,
      threadId: data.threadId,
      labelIds: data.labelIds || [],
      snippet: data.snippet || '',
      internalDate: data.internalDate || '',
      dateStr: formatGmailDate(data.internalDate) || dateStr,
      from,
      to,
      subject,
      bodyText: text || data.snippet || '',
      bodyHtml: html || (text ? `<p style="white-space: pre-wrap;">${text}</p>` : ''),
      isUnread
    };
  }

  /**
   * Mengirim email via Gmail API
   */
  public static async sendEmail(payload: SendEmailPayload): Promise<{ id: string; threadId: string }> {
    if (!payload.to || !payload.to.trim()) {
      throw new Error('Alamat email tujuan (To) wajib diisi.');
    }
    if (!payload.subject || !payload.subject.trim()) {
      throw new Error('Subjek email wajib diisi.');
    }

    const fromHeader = payload.fromName ? `From: ${payload.fromName} <me>` : 'From: me';
    const contentType = payload.isHtml ? 'text/html; charset=UTF-8' : 'text/plain; charset=UTF-8';

    const emailLines = [
      fromHeader,
      `To: ${payload.to.trim()}`,
      payload.cc ? `Cc: ${payload.cc.trim()}` : null,
      payload.bcc ? `Bcc: ${payload.bcc.trim()}` : null,
      `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(payload.subject)))}?=`,
      'MIME-Version: 1.0',
      `Content-Type: ${contentType}`,
      '',
      payload.body
    ].filter(line => line !== null);

    const rawEmail = emailLines.join('\r\n');
    const encodedRaw = toBase64Url(rawEmail);

    return await this.fetchWithAuth('messages/send', {
      method: 'POST',
      body: JSON.stringify({ raw: encodedRaw })
    });
  }

  /**
   * Menyimpan draf email di Gmail
   */
  public static async createDraft(payload: SendEmailPayload): Promise<{ id: string }> {
    const fromHeader = payload.fromName ? `From: ${payload.fromName} <me>` : 'From: me';
    const contentType = payload.isHtml ? 'text/html; charset=UTF-8' : 'text/plain; charset=UTF-8';

    const emailLines = [
      fromHeader,
      `To: ${payload.to.trim()}`,
      `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(payload.subject)))}?=`,
      'MIME-Version: 1.0',
      `Content-Type: ${contentType}`,
      '',
      payload.body
    ];

    const rawEmail = emailLines.join('\r\n');
    const encodedRaw = toBase64Url(rawEmail);

    return await this.fetchWithAuth('drafts', {
      method: 'POST',
      body: JSON.stringify({ message: { raw: encodedRaw } })
    });
  }

  /**
   * Memindahkan email ke kotak Sampah (Trash)
   */
  public static async trashMessage(id: string): Promise<any> {
    return await this.fetchWithAuth(`messages/${id}/trash`, {
      method: 'POST'
    });
  }

  /**
   * Menghapus email secara permanen (Permanent Delete)
   */
  public static async deleteMessage(id: string): Promise<any> {
    return await this.fetchWithAuth(`messages/${id}`, {
      method: 'DELETE'
    });
  }

  /**
   * Tandai pesan sudah dibaca (Remove UNREAD label)
   */
  public static async markAsRead(id: string): Promise<any> {
    return await this.fetchWithAuth(`messages/${id}/modify`, {
      method: 'POST',
      body: JSON.stringify({ removeLabelIds: ['UNREAD'] })
    });
  }
}

/**
 * Kumpulan Templat Resmi Surat & Notifikasi Email Pesantren Salaf Al-Maliki
 */
export const PESANTREN_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'syahriyah-reminder',
    title: 'Pemberitahuan Iuran Syahriyah / SPP Bulanan',
    category: 'syahriyah',
    subject: 'Pemberitahuan Iuran Syahriyah Santri Pondok Pesantren Salaf Al-Maliki',
    body: `Assalamu'alaikum Warahmatullahi Wabarakatuh,

Yth. Bapak/Ibu Wali Santri dari: {NAMA_SANTRI} (Kelas: {KELAS_SANTRI})
Nomor Induk Santri (NIS): {NIS_SANTRI}

Semoga Bapak/Ibu sekeluarga senantiasa berada dalam lindungan dan rahmat Allah SWT.

Melalui surat elektronik resmi ini, kami dari Bagian Administrasi & Keuangan Pondok Pesantren Salaf Al-Maliki menyampaikan pemberitahuan mengenai kewajiban iuran Syahriyah bulan {BULAN} sebesar:
Rp {NOMINAL}

Rincian Rekening Resmi Pesantren:
• Bank Syariah Indonesia (BSI): 104-582-9901 (a.n. Pondok Pesantren Salaf Al-Maliki)
• Bank BRI: 0021-01-084729-50-8 (a.n. Yayasan Salaf Al-Maliki)

Setelah melakukan pembayaran, mohon dapat mengunggah bukti transfer atau mengirimkan konfirmasi melalui portal wali santri.

Atas perhatian, kerjasama, dan keistiqamahan Bapak/Ibu dalam mendukung tholabul 'ilmi ananda, kami haturkan jazakumullahu khairan katsiran.

Wassalamu'alaikum Warahmatullahi Wabarakatuh,

Hormat kami,
Bendahara & Pengurus
Pondok Pesantren Salaf Al-Maliki`
  },
  {
    id: 'absensi-report',
    title: 'Laporan Rekap Presensi & Kehadiran Mengaji',
    category: 'absensi',
    subject: 'Laporan Rekapitulasi Presensi & Kehadiran Santri - Pesantren Salaf Al-Maliki',
    body: `Assalamu'alaikum Warahmatullahi Wabarakatuh,

Yth. Bapak/Ibu Wali Santri dari: {NAMA_SANTRI} (Kelas: {KELAS_SANTRI})

Dengan hormat,
Kami sampaikan rekapitulasi kehadiran dan kedisiplinan mengaji ananda selama periode {PERIODE}:

• Total Pertemuan: {TOTAL_PERTEMUAN}
• Hadir Tepat Waktu: {HADIR} sesi
• Sakit / Izin Resmi: {IZIN} sesi
• Tanpa Keterangan / Ghaib: {ALPHA} sesi
• Catatan Wali Kelas: {CATATAN}

Alhamdulillah, ananda senantiasa mengikuti kegiatan madrasah diniyah dengan baik. Kami memohon doa dan dukungan Bapak/Ibu agar ananda senantiasa istiqamah dalam menuntut ilmu salaf.

Wassalamu'alaikum Warahmatullahi Wabarakatuh,

Wali Kelas & Pengurus Keamanan
Pondok Pesantren Salaf Al-Maliki`
  },
  {
    id: 'raport-ujian',
    title: 'Laporan Hasil Ujian & Setoran Nadzhom',
    category: 'ujian',
    subject: 'Laporan Hasil Ujian Madrasah Diniyah Santri - Pondok Pesantren Salaf Al-Maliki',
    body: `Assalamu'alaikum Warahmatullahi Wabarakatuh,

Yth. Bapak/Ibu Wali Santri dari: {NAMA_SANTRI} (Kelas: {KELAS_SANTRI})

Alhamdulillah wa syukurillah, rangkaian Imtihan / Ujian Madrasah Diniyah Salafiyah Semester ini telah selesai diselenggarakan dengan lancar.

Berikut ringkasan hasil evaluasi ananda:
• Ujian Muhafadzoh (Hafalan Nadzhom): {NILAI_NADZHOM} (Capaian: {CAPAIAN_BAIT} Bait)
• Ujian Baca Kitab Kuning (Fathul Qorib / Jurumiyyah): {NILAI_BACA_KITAB}
• Ujian Koreksian Makna Kitab Pegon: {NILAI_KOREKSIAN}
• Nilai Rata-rata Madrasah: {RATA_RATA}
• Status Kenaikan / Kelulusan: {STATUS_KELULUSAN}

Laporan lengkap Raport Santri dapat dilihat dan diunduh langsung melalui Portal Wali Santri.

Wassalamu'alaikum Warahmatullahi Wabarakatuh,

Dewan Asatidz & Bagian Kurikulum
Pondok Pesantren Salaf Al-Maliki`
  },
  {
    id: 'undangan-wali',
    title: 'Surat Undangan Pertemuan Wali Santri & Haflah',
    category: 'undangan',
    subject: 'Undangan Pertemuan Wali Santri & Pengasuh - Pondok Pesantren Salaf Al-Maliki',
    body: `Assalamu'alaikum Warahmatullahi Wabarakatuh,

Yth. Bapak/Ibu Wali Santri dari: {NAMA_SANTRI}

Mengharap dengan hormat kehadiran Bapak/Ibu Wali Santri Pondok Pesantren Salaf Al-Maliki pada agenda silaturahim akbar:

Hari / Tanggal : {HARI_TANGGAL}
Waktu          : 08:30 WIB s/d Selesai
Tempat         : Aula Utama Pondok Pesantren Salaf Al-Maliki
Acara          : Silaturahim Wali Santri Bersama Pengasuh & Laporan Perkembangan Pendidikan Santri

Mengingat pentingnya agenda tersebut, kami sangat mengharapkan kehadiran Bapak/Ibu tepat pada waktunya.

Demikian undangan ini kami sampaikan. Atas perhatian dan kehadirannya, kami ucapkan terima kasih.

Wassalamu'alaikum Warahmatullahi Wabarakatuh,

Sekretariat Pengurus
Pondok Pesantren Salaf Al-Maliki`
  },
  {
    id: 'pengumuman-libur',
    title: 'Pengumuman Libur & Jadwal Masuk Pondok',
    category: 'pengumuman',
    subject: 'Maklumat Libur & Jadwal Kedatangan Santri - Pondok Pesantren Salaf Al-Maliki',
    body: `Assalamu'alaikum Warahmatullahi Wabarakatuh,

Yth. Seluruh Asatidz, Ustadzah, dan Wali Santri Pondok Pesantren Salaf Al-Maliki,

Berdasarkan keputusan Pengasuh dan Dewan Pengurus, dengan ini kami sampaikan maklumat mengenai jadwal kegiatan santri:

1. Awal Libur Madrasah: {TANGGAL_LIBUR}
2. Batas Akhir Penjemputan: {BATAS_JEMPUT}
3. Wajib Kembali ke Pondok: {TANGGAL_KEMBALI} (Maksimal pukul 16:00 WIB)
4. Awal Kegiatan Belajar Mengajar (KBM): {TANGGAL_KBM}

Ketentuan Saat Kembali ke Pondok:
• Membawa kitab-kitab pelajaran yang telah dimaknai
• Berpakaian muslim/muslimah rapi dan sopan
• Melakukan registrasi kedatangan di posko pengurus santri

Semoga santri senantiasa menjaga akhlaqul karimah selama berada di rumah bersama keluarga.

Wassalamu'alaikum Warahmatullahi Wabarakatuh,

Pengasuh & Dewan Masyayikh
Pondok Pesantren Salaf Al-Maliki`
  }
];
