import { supabase } from "./supabase";

const BUCKET = "Boards";

async function toBlob(input: { file?: File | Blob; uri?: string }) {
  if (input.file) return input.file;
  if (input.uri) {
    const res = await fetch(input.uri);
    return await res.blob();
  }
  throw new Error("No file or uri provided");
}

export async function uploadBoardImage(
  boardId: string,
  input: { file?: File | Blob; uri?: string },
  ext: string = "jpg"
) {
  console.log('[uploadBoardImage] Starting upload for board:', boardId);
  console.log('[uploadBoardImage] Input:', { hasFile: !!input.file, hasUri: !!input.uri, ext });
  
  const blob = await toBlob(input);
  console.log('[uploadBoardImage] Blob created:', { type: blob.type, size: blob.size });
  
  const normalizedExt = ext === 'jpeg' ? 'jpg' : ext;
  const path = `boards/${boardId}.${normalizedExt}`;
  const contentType = `image/${normalizedExt}`;
  
  console.log('[uploadBoardImage] Uploading to path:', path);
  console.log('[uploadBoardImage] Content type:', contentType);

  const { data: uploadData, error: upErr } = await supabase
    .storage
    .from(BUCKET)
    .upload(path, blob, { 
      upsert: true, 
      contentType: contentType,
      cacheControl: '3600'
    });

  if (upErr) {
    console.error('[uploadBoardImage] Upload error:', upErr);
    throw new Error(`Failed to upload image: ${upErr.message}`);
  }
  
  console.log('[uploadBoardImage] Upload successful:', uploadData);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const publicUrl = data.publicUrl;
  
  console.log('[uploadBoardImage] Public URL:', publicUrl);

  return { path, publicUrl };
}
