/**
 * Helper utilitas kompresi foto dan parsing nama file untuk Input Santri via Galeri / Folder
 */

export const compressImageFile = (
  file: File, 
  maxWidth = 600, 
  maxHeight = 750, 
  quality = 0.85
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        // Menggunakan JPEG terkompresi agar ukuran string Base64 ringan disimpan di database
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => {
        // Fallback ke data url mentah jika rendering canvas gagal
        resolve(e.target?.result as string);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Gagal membaca file gambar dari galeri atau folder'));
    reader.readAsDataURL(file);
  });
};

/**
 * Parsing otomatis nama file foto santri untuk mendeteksi NIS dan Nama Santri
 * Contoh:
 * - "S-1008 Muhammad Wildan.jpg" -> id: "S-1008", nama: "Muhammad Wildan"
 * - "1025_Ahmad_Fauzi.png" -> id: "S-1025", nama: "Ahmad Fauzi"
 * - "Fatkhur Rahman.jpeg" -> id: "", nama: "Fatkhur Rahman"
 */
export const parseFileNameForSantri = (fileName: string): { id: string; nama: string } => {
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '').trim();
  
  // Pola NIS di depan seperti "S-1008 ...", "S1008 ...", "1008 ..."
  const match = nameWithoutExt.match(/^([sS]?[-_]?\d{3,6})[\s_.-]+(.+)$/);
  if (match) {
    let rawId = match[1].replace(/[_.]/g, '-');
    if (!rawId.toUpperCase().startsWith('S-')) {
      rawId = 'S-' + rawId.replace(/^[sS]-?/, '');
    } else {
      rawId = rawId.toUpperCase();
    }
    const cleanName = match[2].replace(/[_-]+/g, ' ').trim();
    return { id: rawId, nama: cleanName };
  }

  // Jika nama file hanya nama santri
  const cleanName = nameWithoutExt.replace(/[_-]+/g, ' ').trim();
  return { id: '', nama: cleanName };
};
