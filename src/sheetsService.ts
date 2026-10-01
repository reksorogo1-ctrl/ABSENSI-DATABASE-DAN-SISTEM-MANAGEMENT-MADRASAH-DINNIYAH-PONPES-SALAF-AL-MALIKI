import { getAccessToken } from './googleAuth';
import { 
  Santri, AbsensiSantriRecord, AbsensiGuruRecord, NadzhomRecord, 
  NilaiUjianRecord, AppSettings, GuruPengajar, JadwalPelajaran,
  SyahriyahRecord, UangSakuRecord 
} from './types';

export interface DriveSpreadsheetFile {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export interface SheetMetadata {
  id: string;
  title: string;
  url: string;
  sheets: string[];
}

export class GoogleSheetsService {
  private spreadsheetId: string;

  constructor(spreadsheetId: string) {
    this.spreadsheetId = spreadsheetId;
  }

  setSpreadsheetId(id: string) {
    this.spreadsheetId = id.trim();
  }

  getSpreadsheetId(): string {
    return this.spreadsheetId;
  }

  getSpreadsheetUrl(): string {
    if (!this.spreadsheetId) return '';
    return `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/edit`;
  }

  private async fetchAPI(range: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', body?: any) {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('AUTH_REQUIRED');
    }

    if (!this.spreadsheetId) {
      throw new Error('Spreadsheet ID belum disetel.');
    }

    const encodedRange = encodeURIComponent(range);
    let url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${encodedRange}`;
    
    if (method === 'POST') {
      url += ':append?valueInputOption=USER_ENTERED';
    } else if (method === 'PUT') {
      url += '?valueInputOption=USER_ENTERED';
    }

    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const res = await fetch(url, options);
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson?.error?.message || `Google Sheets API Error (${res.status})`);
    }
    return res.json();
  }

  // Get metadata of current spreadsheet (title, sheets)
  async getSpreadsheetMetadata(): Promise<SheetMetadata | null> {
    const token = await getAccessToken();
    if (!token || !this.spreadsheetId) return null;

    try {
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}?fields=spreadsheetId,properties.title,sheets.properties.title`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (!res.ok) return null;
      const data = await res.json();
      return {
        id: data.spreadsheetId,
        title: data.properties?.title || 'Google Spreadsheet',
        url: `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
        sheets: (data.sheets || []).map((s: any) => s.properties?.title).filter(Boolean)
      };
    } catch (e) {
      console.warn('Failed to get spreadsheet metadata:', e);
      return null;
    }
  }

  // List user's spreadsheets from Google Drive
  async listSpreadsheetsFromDrive(): Promise<DriveSpreadsheetFile[]> {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('AUTH_REQUIRED');
    }

    try {
      const q = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,modifiedTime,webViewLink)&orderBy=modifiedTime%20desc&pageSize=25`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || 'Gagal memuat berkas Google Sheets dari Drive');
      }

      const data = await res.json();
      return (data.files || []).map((f: any) => ({
        id: f.id,
        name: f.name,
        modifiedTime: f.modifiedTime,
        webViewLink: f.webViewLink || `https://docs.google.com/spreadsheets/d/${f.id}/edit`
      }));
    } catch (e: any) {
      console.warn('Error fetching Drive spreadsheets:', e);
      throw e;
    }
  }

  // Create a brand new Google Spreadsheet with all required tabs
  async createNewSpreadsheet(title: string = 'SIM Pontren Salaf - Database Master'): Promise<{ id: string; url: string; title: string }> {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('AUTH_REQUIRED');
    }

    const payload = {
      properties: {
        title
      },
      sheets: [
        { properties: { title: 'Santri' } },
        { properties: { title: 'Absensi_Santri' } },
        { properties: { title: 'Guru' } },
        { properties: { title: 'Absensi_Guru' } },
        { properties: { title: 'Jadwal' } },
        { properties: { title: 'Nadzhom' } },
        { properties: { title: 'Nilai_Ujian' } },
        { properties: { title: 'Syahriyah' } },
        { properties: { title: 'Uang_Saku' } },
        { properties: { title: 'Pengaturan' } }
      ]
    };

    const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'Gagal membuat Google Spreadsheet baru');
    }

    const data = await res.json();
    const newId = data.spreadsheetId;
    this.spreadsheetId = newId;

    return {
      id: newId,
      url: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${newId}/edit`,
      title: data.properties?.title || title
    };
  }

  // Read Sheet Range
  async getRangeValues(range: string): Promise<any[][]> {
    try {
      const data = await this.fetchAPI(range, 'GET');
      return data.values || [];
    } catch (e: any) {
      console.warn(`Could not read sheet range ${range}:`, e);
      return [];
    }
  }

  // Append Rows
  async appendRow(sheetName: string, rowValues: any[]) {
    return this.fetchAPI(`${sheetName}!A:Z`, 'POST', {
      range: `${sheetName}!A:Z`,
      majorDimension: 'ROWS',
      values: [rowValues]
    });
  }

  // Update Specific Range
  async updateRange(range: string, values: any[][]) {
    return this.fetchAPI(range, 'PUT', {
      range,
      majorDimension: 'ROWS',
      values
    });
  }

  // Clear a range
  async clearRange(range: string) {
    const token = await getAccessToken();
    if (!token || !this.spreadsheetId) return;

    const encodedRange = encodeURIComponent(range);
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${encodedRange}:clear`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  }

  // Overwrite a sheet with headers and data
  async overwriteSheet(sheetName: string, headers: string[], rows: any[][]) {
    await this.clearRange(`${sheetName}!A1:Z500`);
    const allValues = [headers, ...rows];
    await this.updateRange(`${sheetName}!A1:Z${allValues.length}`, allValues);
  }

  // Ensure sheet tabs exist, if not create them
  async ensureSheetsExist(requiredSheets: string[]) {
    const token = await getAccessToken();
    if (!token || !this.spreadsheetId) return;

    try {
      const meta = await this.getSpreadsheetMetadata();
      const existing = new Set(meta?.sheets || []);
      const toAdd = requiredSheets.filter(s => !existing.has(s));

      if (toAdd.length > 0) {
        const requests = toAdd.map(title => ({
          addSheet: {
            properties: { title }
          }
        }));

        await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}:batchUpdate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ requests })
        });
      }
    } catch (e) {
      console.warn('Could not ensure sheets exist:', e);
    }
  }

  // Specific sheet loader helpers
  async loadSantriFromSheet(): Promise<Santri[]> {
    const rows = await this.getRangeValues('Santri!A2:F200');
    if (!rows.length) return [];
    return rows.map((r) => ({
      id: String(r[0] || '').trim(),
      nama: String(r[1] || '').trim(),
      kelas: String(r[2] || '').trim(),
      kamar: String(r[3] || '').trim(),
      alamat: String(r[4] || '').trim(),
      foto: String(r[5] || '').trim() || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400'
    })).filter(s => s.id && s.nama);
  }

  async loadSettingsFromSheet(): Promise<Partial<AppSettings>> {
    const rows = await this.getRangeValues('Pengaturan!A2:B30');
    const settings: any = {};
    rows.forEach(r => {
      if (r[0]) {
        settings[String(r[0]).trim()] = r[1] ? String(r[1]).trim() : '';
      }
    });
    return settings;
  }

  async loadNadzhomFromSheet(): Promise<NadzhomRecord[]> {
    const rows = await this.getRangeValues('Nadzhom!A2:G300');
    return rows.map((r, i) => ({
      idRow: i + 2,
      idSantri: String(r[0] || '').trim(),
      nama: String(r[1] || '').trim(),
      kitab: String(r[2] || '').trim(),
      bait: Number(r[3] || 0),
      tanggal: String(r[4] || '').trim(),
      nilai: String(r[5] || '').trim(),
      kelas: String(r[6] || '').trim()
    })).filter(n => n.idSantri && n.nama);
  }

  async loadNilaiFromSheet(): Promise<NilaiUjianRecord[]> {
    const rows = await this.getRangeValues('Nilai_Ujian!A2:F300');
    return rows.map((r, i) => ({
      idRow: i + 2,
      idSantri: String(r[0] || '').trim(),
      nama: String(r[1] || '').trim(),
      kelas: String(r[2] || '').trim(),
      pelajaran: String(r[3] || '').trim(),
      nilai: Number(r[4] || 0),
      semester: String(r[5] || '').trim()
    })).filter(n => n.idSantri && n.nama && n.pelajaran);
  }

  async loadGuruFromSheet(): Promise<GuruPengajar[]> {
    const rows = await this.getRangeValues('Guru!A2:E100');
    if (!rows.length) return [];
    return rows.map((r, i) => ({
      id: String(r[0] || `G-${i + 1}`).trim(),
      nama: String(r[1] || '').trim(),
      mapel: String(r[2] || '').trim(),
      kelas: String(r[3] || '').trim()
    })).filter(g => g.nama);
  }

  async loadJadwalFromSheet(): Promise<JadwalPelajaran[]> {
    const rows = await this.getRangeValues('Jadwal!A2:G150');
    if (!rows.length) return [];
    return rows.map((r, i) => ({
      id: String(r[0] || `J-${i + 1}`).trim(),
      kelas: String(r[1] || '').trim(),
      hari: String(r[2] || '').trim(),
      jamKe: Number(r[3] || 1),
      waktu: String(r[4] || '').trim(),
      mapel: String(r[5] || '').trim(),
      nama: String(r[6] || '').trim()
    })).filter(j => j.mapel && j.nama);
  }

  async loadSyahriyahFromSheet(): Promise<SyahriyahRecord[]> {
    const rows = await this.getRangeValues('Syahriyah!A2:G300');
    if (!rows.length) return [];
    return rows.map((r, i) => ({
      id: String(r[0] || `SYA-${i + 1}`).trim(),
      idSantri: String(r[1] || '').trim(),
      namaSantri: String(r[2] || '').trim(),
      bulan: String(r[4] || 'September 2026').trim(),
      nominal: Number(r[5] || 0),
      status: (r[6] === 'Lunas' ? 'Lunas' : r[6] === 'Menunggak' ? 'Menunggak' : 'Belum Bayar') as 'Lunas' | 'Menunggak' | 'Belum Bayar',
      tanggalBayar: r[7] ? String(r[7]).trim() : new Date().toISOString().split('T')[0]
    })).filter(s => s.idSantri);
  }

  async loadAbsensiSantriFromSheet(): Promise<AbsensiSantriRecord[]> {
    const rows = await this.getRangeValues('Absensi_Santri!A2:G500');
    if (!rows.length) return [];
    return rows.map((r) => ({
      tanggal: String(r[0] || '').trim(),
      idSantri: String(r[1] || '').trim(),
      nama: String(r[2] || '').trim(),
      kelas: String(r[3] || '').trim(),
      status: (['Hadir', 'Izin', 'Sakit', 'Alpha'].includes(r[4]) ? r[4] : 'Hadir') as 'Hadir' | 'Izin' | 'Sakit' | 'Alpha',
      keterangan: String(r[5] || '').trim(),
      waktu: r[6] ? String(r[6]).trim() : undefined
    })).filter(a => a.nama && a.tanggal);
  }

  async loadAbsensiGuruFromSheet(): Promise<AbsensiGuruRecord[]> {
    const rows = await this.getRangeValues('Absensi_Guru!A2:I500');
    if (!rows.length) return [];
    return rows.map((r) => ({
      tanggal: String(r[0] || '').trim(),
      nama: String(r[1] || '').trim(),
      mapel: String(r[2] || '').trim(),
      kelas: String(r[3] || '').trim(),
      status: (['Hadir', 'Terlambat', 'Izin', 'Alpha'].includes(r[4]) ? r[4] : 'Hadir') as 'Hadir' | 'Terlambat' | 'Izin' | 'Alpha',
      catatan: String(r[5] || '').trim(),
      hari: String(r[6] || '').trim(),
      jamKe: Number(r[7] || 1),
      waktu: String(r[8] || '').trim()
    })).filter(a => a.nama && a.tanggal);
  }

  async initSpreadsheetSchema(): Promise<void> {
    const requiredSheets = [
      'Santri', 'Absensi_Santri', 'Guru', 'Absensi_Guru',
      'Jadwal', 'Nadzhom', 'Nilai_Ujian', 'Syahriyah', 'Uang_Saku', 'Pengaturan'
    ];
    await this.ensureSheetsExist(requiredSheets);
  }

  async getSantriList(): Promise<Santri[]> {
    return this.loadSantriFromSheet();
  }

  async getGuruList(): Promise<GuruPengajar[]> {
    return this.loadGuruFromSheet();
  }

  async getJadwalList(): Promise<JadwalPelajaran[]> {
    return this.loadJadwalFromSheet();
  }

  async getNadzhomList(): Promise<NadzhomRecord[]> {
    return this.loadNadzhomFromSheet();
  }

  async getNilaiList(): Promise<NilaiUjianRecord[]> {
    return this.loadNilaiFromSheet();
  }

  async getSettings(): Promise<Partial<AppSettings>> {
    return this.loadSettingsFromSheet();
  }

  async saveSettingsToSheet(settings: AppSettings) {
    const entries = Object.entries(settings).map(([k, v]) => [k, typeof v === 'boolean' ? (v ? 'TRUE' : 'FALSE') : String(v || '')]);
    if (entries.length > 0) {
      await this.overwriteSheet('Pengaturan', ['Kunci Pengaturan', 'Nilai'], entries);
    }
  }

  async saveAbsensiSantriToSheet(records: AbsensiSantriRecord[]) {
    for (const rec of records) {
      await this.appendRow('Absensi_Santri', [
        rec.tanggal,
        rec.idSantri,
        rec.nama,
        rec.kelas,
        rec.status,
        rec.keterangan || '-',
        rec.waktu || new Date().toLocaleTimeString('id-ID')
      ]);
    }
  }

  async saveAbsensiGuruToSheet(records: AbsensiGuruRecord[]) {
    for (const rec of records) {
      await this.appendRow('Absensi_Guru', [
        rec.tanggal,
        rec.nama,
        rec.mapel || '-',
        rec.kelas || '-',
        rec.status,
        rec.catatan || '-',
        rec.hari || '-',
        rec.jamKe || '-',
        rec.waktu || '-'
      ]);
    }
  }

  // Export entire dataset to Google Sheets with preformatted headers
  async exportFullDatabaseToSheets(data: {
    santriList: Santri[];
    guruList: GuruPengajar[];
    jadwalList: JadwalPelajaran[];
    nadzhomList: NadzhomRecord[];
    nilaiList: NilaiUjianRecord[];
    absensiSantriList: AbsensiSantriRecord[];
    absensiGuruList: AbsensiGuruRecord[];
    syahriyahList?: SyahriyahRecord[];
    settings: AppSettings;
  }): Promise<void> {
    await this.initSpreadsheetSchema();

    // 1. Santri
    const santriRows = data.santriList.map(s => [s.id, s.nama, s.kelas, s.kamar, s.alamat, s.foto || '']);
    await this.overwriteSheet('Santri', ['NIS / ID', 'Nama Santri', 'Kelas', 'Kamar / Asrama', 'Alamat Asal', 'Foto URL'], santriRows);

    // 2. Guru
    const guruRows = data.guruList.map(g => [g.id, g.nama, g.mapel, g.kelas]);
    await this.overwriteSheet('Guru', ['ID Guru', 'Nama Ustadz / Ustadzah', 'Mata Pelajaran / Kitab', 'Kelas Ampu'], guruRows);

    // 3. Jadwal
    const jadwalRows = data.jadwalList.map(j => [j.id, j.kelas, j.hari, j.jamKe, j.waktu, j.mapel, j.nama]);
    await this.overwriteSheet('Jadwal', ['ID Jadwal', 'Kelas', 'Hari', 'Jam Ke', 'Waktu', 'Mata Pelajaran', 'Ustadz Pengajar'], jadwalRows);

    // 4. Nadzhom
    const nadzhomRows = data.nadzhomList.map(n => [n.idSantri, n.nama, n.kitab, n.bait, n.tanggal, n.nilai, n.kelas]);
    await this.overwriteSheet('Nadzhom', ['NIS Santri', 'Nama Santri', 'Nama Kitab', 'Bait Tercapai', 'Tanggal Setoran', 'Predikat Nilai', 'Kelas'], nadzhomRows);

    // 5. Nilai Ujian
    const nilaiRows = data.nilaiList.map(v => [v.idSantri, v.nama, v.kelas, v.pelajaran, v.nilai, v.semester]);
    await this.overwriteSheet('Nilai_Ujian', ['NIS Santri', 'Nama Santri', 'Kelas', 'Mata Pelajaran', 'Nilai Angka (0-100)', 'Semester'], nilaiRows);

    // 6. Absensi Santri
    const absensiSantriRows = data.absensiSantriList.map(a => [a.tanggal, a.idSantri, a.nama, a.kelas, a.status, a.keterangan || '-', a.waktu || '']);
    await this.overwriteSheet('Absensi_Santri', ['Tanggal', 'NIS', 'Nama Santri', 'Kelas', 'Status (Hadir/Izin/Sakit/Alpha)', 'Keterangan', 'Waktu'], absensiSantriRows);

    // 7. Absensi Guru
    const absensiGuruRows = data.absensiGuruList.map(g => [g.tanggal, g.nama, g.mapel, g.kelas, g.status, g.catatan || '-', g.hari || '-', g.jamKe || '-', g.waktu || '-']);
    await this.overwriteSheet('Absensi_Guru', ['Tanggal', 'Nama Ustadz', 'Mata Pelajaran', 'Kelas', 'Status (Hadir/Terlambat/Izin/Alpha)', 'Catatan', 'Hari', 'Jam Ke', 'Waktu'], absensiGuruRows);

    // 8. Syahriyah
    if (data.syahriyahList && data.syahriyahList.length > 0) {
      const syahriyahRows = data.syahriyahList.map(s => [s.id, s.idSantri, s.namaSantri || (s as any).nama || '-', (s as any).kelas || '-', s.bulan, s.nominal, s.status, s.tanggalBayar || '-']);
      await this.overwriteSheet('Syahriyah', ['ID Tagihan', 'NIS Santri', 'Nama Santri', 'Kelas', 'Bulan', 'Nominal (Rp)', 'Status (Lunas/Belum Lunas)', 'Tanggal Bayar'], syahriyahRows);
    }

    // 9. Pengaturan
    const settingsEntries = Object.entries(data.settings).map(([k, v]) => [k, typeof v === 'boolean' ? (v ? 'TRUE' : 'FALSE') : String(v || '')]);
    await this.overwriteSheet('Pengaturan', ['Kunci Parameter', 'Nilai Konfigurasi'], settingsEntries);
  }
}
