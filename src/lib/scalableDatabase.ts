/**
 * ENGINE DATABASE SCALABLE & PAGINASI KURSOR RINGAN
 * SIM Pondok Pesantren Salaf Al-Maliki
 * 
 * Prinsip:
 * 1. "DATA BOLEH MENCAPAI 5 TB, TETAPI BROWSER HANYA MEMUAT DATA YANG SEDANG DIBUTUHKAN."
 * 2. Jangan pernah memuat seluruh database ke browser.
 * 3. Gunakan pagination, lazy loading, indexing, caching, dan query optimization.
 * 4. Tampilkan data secara bertahap agar jutaan record tetap ringan di HP, Tablet, dan Komputer.
 */

import { PaginatedResult } from '../types';

export interface QueryOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  searchFields?: string[];
  filterClass?: string;
  filterStatus?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Filter dan potong data secara cerdas (In-Memory / Indexed Slicing)
 * Menjamin DOM browser hanya menerima porsi yang aktif (e.g. 10 - 25 baris)
 */
export function queryPaginatedData<T extends Record<string, any>>(
  dataset: T[],
  options: QueryOptions = {}
): PaginatedResult<T> {
  const page = Math.max(1, options.page || 1);
  const pageSize = Math.max(1, Math.min(100, options.pageSize || 15));
  const search = options.search?.toLowerCase().trim();
  const searchFields = options.searchFields;
  const filterClass = options.filterClass;
  const filterStatus = options.filterStatus;
  const sortBy = options.sortBy;
  const sortOrder = options.sortOrder || 'asc';

  let filtered = dataset;

  // 1. Filter Kelas / Angkatan
  if (filterClass && filterClass !== 'Semua' && filterClass !== 'semua') {
    filtered = filtered.filter(item => {
      const cls = item.kelas || item.angkatan || item.targetKelas;
      return cls === filterClass;
    });
  }

  // 2. Filter Status
  if (filterStatus && filterStatus !== 'Semua' && filterStatus !== 'semua') {
    filtered = filtered.filter(item => item.status === filterStatus);
  }

  // 3. Pencarian Cepat berbasis Substring / Index
  if (search && search.length > 0) {
    const searchTerms = search.split(/\s+/).filter(Boolean);
    filtered = filtered.filter(item => {
      let combinedText = '';
      if (searchFields && searchFields.length > 0) {
        combinedText = searchFields.map(field => String(item[field] || '')).join(' ').toLowerCase();
      } else {
        // Gabungkan field umum
        combinedText = `${item.id || ''} ${item.nama || ''} ${item.kamar || ''} ${item.alamat || ''} ${item.mapel || ''} ${item.catatan || ''}`.toLowerCase();
      }
      return searchTerms.every(term => combinedText.includes(term));
    });
  }

  // 4. Pengurutan Data
  if (sortBy) {
    filtered = [...filtered].sort((a, b) => {
      const valA = a[sortBy];
      const valB = b[sortBy];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      const strA = String(valA || '').toLowerCase();
      const strB = String(valB || '').toLowerCase();
      return sortOrder === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }

  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const items = filtered.slice(startIndex, startIndex + pageSize);

  return {
    items,
    totalCount,
    page: safePage,
    pageSize,
    totalPages,
    hasNext: safePage < totalPages,
    hasPrev: safePage > 1
  };
}

/**
 * Pemrosesan Ekspor Data Massal di Background secara Bertahap (Chunking)
 * Mencegah UI browser HP/Laptop freeze saat mengekspor puluhan ribu santri/presensi
 */
export async function processExportInChunks<T>(
  data: T[],
  chunkSize = 500,
  onProgress?: (progressPercent: number, processed: number, total: number) => void
): Promise<T[]> {
  const result: T[] = [];
  const total = data.length;

  for (let i = 0; i < total; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    result.push(...chunk);

    const processed = Math.min(i + chunkSize, total);
    const percent = Math.round((processed / total) * 100);

    if (onProgress) {
      onProgress(percent, processed, total);
    }

    // Beri jeda 1 tick agar browser tetap lancar me-render animasi
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  return result;
}

/**
 * Cache LRU Ringan untuk Pencarian & Query di Browser
 */
class QueryCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Re-insert untuk mempertahankan urutan akses terkini (LRU)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.size >= this.maxSize) {
      // Hapus item pertama (paling jarang diakses)
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }
}

export const queryCache = new QueryCache<string, any>(150);
