import { supabase } from "./supabase";

const BUCKET = "boards";

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
  ext: string = "png"
) {
  const blob = await toBlob(input);
  const path = `boards/${boardId}.${ext}`;

  const { error: upErr } = await supabase
    .storage
    .from(BUCKET)
    .upload(path, blob, { upsert: true, contentType: `image/${ext}` });

  if (upErr) throw upErr;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const publicUrl = data.publicUrl;

  return { path, publicUrl };
}
