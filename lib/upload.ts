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
  
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.error('[uploadBoardImage] Session check error:', sessionError);
  }
  
  const isAuthenticated = !!sessionData.session;
  console.log('[uploadBoardImage] Auth role:', isAuthenticated ? 'authenticated' : 'anon');
  console.log('[uploadBoardImage] User ID:', sessionData.session?.user?.id || 'none');
  
  if (!isAuthenticated) {
    console.error('[uploadBoardImage] User not authenticated!');
    throw new Error('Authentication required: Please log in to upload images');
  }
  
  const blob = await toBlob(input);
  console.log('[uploadBoardImage] Blob created:', { type: blob.type, size: blob.size });
  
  const normalizedExt = ext === 'jpeg' ? 'jpg' : ext;
  const filename = `${Date.now()}.${normalizedExt}`;
  const path = `boards/${boardId}/${filename}`;
  const contentType = normalizedExt === 'jpg' ? 'image/jpeg' : `image/${normalizedExt}`;
  
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
    console.error('[uploadBoardImage] Error details:', JSON.stringify(upErr, null, 2));
    
    let errorMessage = upErr.message || 'Unknown error';
    
    if (upErr.message?.includes('row-level security')) {
      errorMessage = 'Permission denied: RLS policy blocking upload. Check storage bucket policies.';
    } else if ('statusCode' in upErr && upErr.statusCode === '401') {
      errorMessage = 'Unauthorized: Please log in to upload images.';
    } else if ('statusCode' in upErr && upErr.statusCode === '403') {
      errorMessage = 'Forbidden: You do not have permission to upload images.';
    }
    
    throw new Error(errorMessage);
  }
  
  console.log('[uploadBoardImage] Upload successful:', uploadData);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const publicUrl = data.publicUrl;
  
  console.log('[uploadBoardImage] Public URL:', publicUrl);

  return { path, publicUrl };
}
