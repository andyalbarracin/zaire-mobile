import type { SupabaseClient } from '@supabase/supabase-js';

import { enqueue } from '@/lib/sync/outbox';

import type { AssetStatus, AssetType, EventType } from './types';

export interface NewAssetInput {
  name: string;
  tag: string | null;
  type: AssetType | null;
  brand: string | null;
  model: string | null;
  serial: string | null;
  status: AssetStatus;
  criticidad: number;
  notes: string | null;
}

/** Alta manual de un equipo (cuando no hay QR). Devuelve el id creado. Online. */
export async function createAsset(
  sb: SupabaseClient,
  createdBy: string | null,
  input: NewAssetInput,
): Promise<string> {
  const { data, error } = await sb
    .from('assets')
    .insert({ ...input, created_by: createdBy })
    .select('id')
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export interface NewEventInput {
  type: EventType;
  event_date: string; // YYYY-MM-DD
  description: string | null;
  cost: number | null;
  currency: string;
  downtime_hours: number | null;
}

/**
 * Registra un evento en la hoja de vida del equipo (una "novedad"). Online → INSERT directo;
 * offline → se encola en `sync_outbox` (op `insert`) y sube al reconectar.
 *
 * La hoja de vida es **append-only**: una corrección es un evento nuevo, nunca una edición
 * (mismo principio que "no reabrir visita" — ver decisión de producto).
 */
export async function registerEvent(
  sb: SupabaseClient,
  isOnline: boolean,
  assetId: string,
  createdBy: string | null,
  input: NewEventInput,
): Promise<void> {
  const row = {
    asset_id: assetId,
    type: input.type,
    event_date: input.event_date,
    description: input.description,
    cost: input.cost,
    currency: input.currency,
    downtime_hours: input.downtime_hours,
    ref_type: 'manual',
    created_by: createdBy,
  };

  if (isOnline) {
    const { error } = await sb.from('asset_events').insert(row);
    if (error) throw error;
  } else {
    await enqueue('asset_events', 'insert', { row });
  }
}
