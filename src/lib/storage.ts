import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase cote SERVEUR uniquement (cle secrete).
 * Sert a deposer les photos dans le bucket "photos".
 * Ne jamais importer ce fichier dans un composant client.
 */
function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase non configure : ajoutez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SECRET_KEY."
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export const BUCKET = "photos";

/** Depose une image et renvoie son adresse publique. */
export async function uploadPhoto(file: Buffer, filename: string, contentType: string) {
  const supabase = admin();

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, file, { contentType, upsert: true, cacheControl: "31536000" });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}

/** Supprime une photo a partir de son adresse publique. */
export async function deletePhoto(publicUrl: string) {
  const marker = `/${BUCKET}/`;
  const i = publicUrl.indexOf(marker);
  if (i === -1) return;
  const path = publicUrl.slice(i + marker.length);
  await admin().storage.from(BUCKET).remove([path]);
}
