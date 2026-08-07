import type { SupabaseClient } from '@supabase/supabase-js';
import { decode } from 'base64-arraybuffer';

// Bucket privado de documentos de equipos (mismo que la webapp — ver setup de Assets).
// La foto de una novedad se guarda como asset_document (doc_type 'foto'); no hay columna de
// foto en asset_events porque la hoja de vida es append-only.
const BUCKET = 'asset-docs';

/** Sube una foto (base64 de la cámara) al bucket privado y registra el asset_document. Online. */
export async function uploadAssetPhoto(
  sb: SupabaseClient,
  assetId: string,
  base64: string,
  name: string,
  createdBy: string | null,
): Promise<void> {
  const path = `${assetId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const { error: upErr } = await sb.storage.from(BUCKET).upload(path, decode(base64), {
    contentType: 'image/jpeg',
    upsert: false,
  });
  if (upErr) throw upErr;
  const { error } = await sb.from('asset_documents').insert({
    asset_id: assetId,
    doc_type: 'foto',
    name,
    file_path: path,
    created_by: createdBy,
  });
  if (error) throw error;
}
