import type { SupabaseClient } from '@supabase/supabase-js';
import { decode } from 'base64-arraybuffer';

// Mismo bucket público que la webapp (getPublicUrl). Path: `${visitId}/${ts}-${rand}.jpg`.
const BUCKET = 'field-photos';

export interface VisitPhoto {
  id: string;
  url: string;
}

export async function getPhotos(sb: SupabaseClient, visitId: string): Promise<VisitPhoto[]> {
  const { data } = await sb
    .from('field_visit_photos')
    .select('id, storage_path')
    .eq('visit_id', visitId)
    .order('created_at', { ascending: false });
  return ((data ?? []) as { id: string; storage_path: string }[]).map((r) => ({
    id: r.id,
    url: sb.storage.from(BUCKET).getPublicUrl(r.storage_path).data.publicUrl,
  }));
}

/** Sube una foto (base64 de la cámara) a Storage + registra la fila. Online. */
export async function uploadPhoto(sb: SupabaseClient, visitId: string, base64: string): Promise<VisitPhoto> {
  const path = `${visitId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const { error: upErr } = await sb.storage.from(BUCKET).upload(path, decode(base64), { contentType: 'image/jpeg', upsert: false });
  if (upErr) throw upErr;
  const { data, error } = await sb.from('field_visit_photos').insert({ visit_id: visitId, storage_path: path }).select('id').single();
  if (error) throw error;
  return { id: (data as { id: string }).id, url: sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl };
}
