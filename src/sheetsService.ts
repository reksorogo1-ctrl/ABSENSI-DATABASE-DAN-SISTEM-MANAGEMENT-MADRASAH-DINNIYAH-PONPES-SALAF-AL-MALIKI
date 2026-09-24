import { getAccessToken } from './googleAuth';
import { Santri, AbsensiSantriRecord, AbsensiGuruRecord, NadzhomRecord, NilaiUjianRecord, AppSettings } from './types';

export class GoogleSheetsService {
  private spreadsheetId: string;

  constructor(spreadsheetId: string) {
    this.spreadsheetId = spreadsheetId;
  }

  setSpreadsheetId(id: string) {
    this.spreadsheetId = id;
  }

  getSpreadsheetId(): string {
    return this.spreadsheetId;
  }

  private async fetchAPI(range: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', body?: any) {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('AUTH_REQUIRED');
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

  // Specific sheet loader helpers
  async loadSantriFromSheet(): Promise<Santri[]> {
    const rows = await this.getRangeValues('Santri!A2:F100');
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
    const rows = await this.getRangeValues('Pengaturan!A2:B20');
    const settings: any = {};
    rows.forEach(r => {
      if (r[0]) {
        settings[String(r[0]).trim()] = r[1] ? String(r[1]).trim() : '';
      }
    });
    return settings;
  }

  async loadNadzhomFromSheet(): Promise<NadzhomRecord[]> {
    const rows = await this.getRangeValues('Nadzhom!A2:G200');
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
    const rows = await this.getRangeValues('Nilai_Ujian!A2:F200');
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

  async initSpreadsheetSchema(): Promise<void> {
    // Optional schema initialization if sheets exist
    return Promise.resolve();
  }

  async getSantriList(): Promise<Santri[]> {
    return this.loadSantriFromSheet();
  }

  async getGuruList(): Promise<any[]> {
    const rows = await this.getRangeValues('Guru!A2:E50');
    if (!rows.length) return [];
    return rows.map((r, i) => ({
      id: String(r[0] || `G-${i + 1}`).trim(),
      nama: String(r[1] || '').trim(),
      mapel: String(r[2] || '').trim(),
      kelas: String(r[3] || '').trim()
    })).filter(g => g.nama);
  }

  async getJadwalList(): Promise<any[]> {
    const rows = await this.getRangeValues('Jadwal!A2:G100');
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
      await this.updateRange('Pengaturan!A2:B' + (entries.length + 1), entries);
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
        rec.keterangan || '-'
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
}
