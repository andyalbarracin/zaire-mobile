import type { SupabaseClient } from '@supabase/supabase-js';

import { computeAssetHealth } from './health';
import type { Asset, AssetComponent, AssetDocument, AssetEvent } from './types';

// Espejo (curado) del ASSET_SELECT de la webapp: solo lo que necesita lista + detalle.
const ASSET_SELECT = `
  id, tag, name, type, brand, model, serial, client_id, site_id, status, criticidad,
  installed_at, warranty_until, expected_life_years, latitude, longitude, address, notes,
  created_at, updated_at,
  client:clients(id, business_name)
`;

const YEAR_MS = 365 * 86_400_000;

// Supabase puede devolver un join to-one como objeto o array de 1; normalizamos.
function firstOrObj<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

/** Fallas de los últimos 12 meses por equipo (para el health score). */
async function failuresByAsset(sb: SupabaseClient): Promise<Record<string, number>> {
  const since = new Date(Date.now() - YEAR_MS).toISOString().slice(0, 10);
  const { data } = await sb.from('asset_events').select('asset_id').eq('type', 'falla').gte('event_date', since);
  const acc: Record<string, number> = {};
  for (const r of (data ?? []) as { asset_id: string }[]) acc[r.asset_id] = (acc[r.asset_id] ?? 0) + 1;
  return acc;
}

export async function getAssets(sb: SupabaseClient): Promise<Asset[]> {
  const [{ data, error }, fails] = await Promise.all([
    sb.from('assets').select(ASSET_SELECT).is('deleted_at', null).order('name'),
    failuresByAsset(sb),
  ]);
  if (error) throw error;
  return ((data ?? []) as Record<string, unknown>[]).map((row) => {
    const a = { ...(row as unknown as Asset), client: firstOrObj(row.client as never) };
    return {
      ...a,
      health: computeAssetHealth({
        status: a.status,
        installedAt: a.installed_at,
        expectedLifeYears: a.expected_life_years,
        recentFailures: fails[a.id] ?? 0,
      }),
    };
  });
}

export interface AssetFull {
  asset: Asset;
  events: AssetEvent[];
  documents: AssetDocument[];
  components: AssetComponent[];
}

export async function getAssetFull(sb: SupabaseClient, id: string): Promise<AssetFull | null> {
  const { data: row, error } = await sb
    .from('assets')
    .select(ASSET_SELECT)
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) throw error;
  if (!row) return null;

  const [{ data: events }, { data: documents }, { data: components }] = await Promise.all([
    sb.from('asset_events').select('*').eq('asset_id', id).order('event_date', { ascending: false }).order('created_at', { ascending: false }),
    sb.from('asset_documents').select('*').eq('asset_id', id).is('deleted_at', null).order('expires_at', { ascending: true }),
    sb.from('asset_components').select('*, product:products(id, code, name, unit)').eq('asset_id', id).order('created_at'),
  ]);

  const evs = (events ?? []) as AssetEvent[];
  const asset = { ...((row as unknown) as Asset), client: firstOrObj((row as Record<string, unknown>).client as never) };
  const health = computeAssetHealth({
    status: asset.status,
    installedAt: asset.installed_at,
    expectedLifeYears: asset.expected_life_years,
    recentFailures: evs.filter((e) => e.type === 'falla' && Date.now() - new Date(e.event_date).getTime() <= YEAR_MS).length,
  });

  return {
    asset: { ...asset, health },
    events: evs,
    documents: (documents ?? []) as AssetDocument[],
    components: ((components ?? []) as Record<string, unknown>[]).map((c) => ({
      ...((c as unknown) as AssetComponent),
      product: firstOrObj(c.product as never),
    })),
  };
}
