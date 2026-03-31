import { supabase } from './supabase';

const BUCKET = 'receipts';

export async function uploadReceipt(entryId: string, file: File): Promise<string> {
  const isPdf = file.type === 'application/pdf';
  const ext = isPdf ? 'pdf' : 'jpg';
  const path = `${entryId}.${ext}`;

  let uploadFile: File = file;
  if (!isPdf) {
    // Compress images before uploading
    const dataUrl = await fileToDataUrl(file);
    const compressed = await compressImage(dataUrl);
    uploadFile = dataUrlToFile(compressed, path, 'image/jpeg');
  }

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, uploadFile, { upsert: true, contentType: isPdf ? 'application/pdf' : 'image/jpeg' });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteReceipt(entryId: string): Promise<void> {
  await Promise.allSettled([
    supabase.storage.from(BUCKET).remove([`${entryId}.jpg`]),
    supabase.storage.from(BUCKET).remove([`${entryId}.pdf`]),
  ]);
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function dataUrlToFile(dataUrl: string, filename: string, type: string): File {
  const arr = dataUrl.split(',');
  const bstr = atob(arr[1]);
  const u8arr = new Uint8Array(bstr.length);
  for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
  return new File([u8arr], filename, { type });
}

function compressImage(dataUrl: string, maxWidth = 1200): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(dataUrl); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
