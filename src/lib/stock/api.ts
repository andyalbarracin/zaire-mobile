import type { SupabaseClient } from '@supabase/supabase-js';

import type { StockLevel, StockMovement, StockReservation, Warehouse } from './types';

// Espejo (curado) del LEVEL_SELECT/MOVEMENT_SELECT de la webapp.
const LEVEL_SELECT = `
  id, product_id, warehouse_id, on_hand, reserved, available, avg_cost, min_qty, updated_at,
  product:products(id, code, name, unit),
  warehouse:stock_warehouses(id, code, name, type)
`;

// stock_movements tiene DOS FKs a stock_warehouses (warehouse_id y counterparty_warehouse_id,
// para transferencias) — hay que desambiguar el embed con el nombre del constraint, si no
// PostgREST tira PGRST201 ("more than one relationship was found").
const MOVEMENT_SELECT = `
  id, doc_number, product_id, warehouse_id, type, qty, unit_cost, notes, created_at,
  warehouse:stock_warehouses!stock_movements_warehouse_id_fkey(id, code, name, type)
`;

const RESERVATION_SELECT = `
  id, product_id, warehouse_id, qty, ref_type, status, notes, created_at,
  warehouse:stock_warehouses(id, code, name, type)
`;

// Supabase puede devolver un join to-one como objeto o como array de 1; normalizamos.
function firstOrObj<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

function normalizeLevel(row: Record<string, unknown>): StockLevel {
  return {
    ...(row as unknown as StockLevel),
    product: firstOrObj(row.product as never),
    warehouse: firstOrObj(row.warehouse as never),
  };
}

function normalizeMovement(row: Record<string, unknown>): StockMovement {
  return {
    ...(row as unknown as StockMovement),
    warehouse: firstOrObj(row.warehouse as never),
  };
}

function normalizeReservation(row: Record<string, unknown>): StockReservation {
  return {
    ...(row as unknown as StockReservation),
    warehouse: firstOrObj(row.warehouse as never),
  };
}

export async function getStockLevels(sb: SupabaseClient): Promise<StockLevel[]> {
  const { data, error } = await sb.from('stock_levels').select(LEVEL_SELECT).order('updated_at', { ascending: false }).limit(500);
  if (error) throw error;
  return ((data ?? []) as Record<string, unknown>[]).map(normalizeLevel);
}

export interface ProductStock {
  product: StockProductRef;
  levels: StockLevel[];
  movements: StockMovement[];
  reservations: StockReservation[];
}
interface StockProductRef {
  id: string;
  code: string | null;
  name: string;
  unit: string;
}

/** El "Kardex": niveles del producto por depósito + sus últimos movimientos + reservas activas. */
export async function getProductStock(sb: SupabaseClient, productId: string): Promise<ProductStock | null> {
  const [
    { data: product, error: prodErr },
    { data: levels, error: lvlErr },
    { data: moves, error: movErr },
    { data: reservations, error: resErr },
  ] = await Promise.all([
    sb.from('products').select('id, code, name, unit').eq('id', productId).maybeSingle(),
    sb.from('stock_levels').select(LEVEL_SELECT).eq('product_id', productId),
    sb.from('stock_movements').select(MOVEMENT_SELECT).eq('product_id', productId).order('created_at', { ascending: false }).limit(100),
    sb.from('stock_reservations').select(RESERVATION_SELECT).eq('product_id', productId).eq('status', 'activa').order('created_at', { ascending: false }),
  ]);
  if (prodErr) throw prodErr;
  if (lvlErr) throw lvlErr;
  if (movErr) throw movErr;
  if (resErr) throw resErr;
  if (!product) return null;
  return {
    product: product as StockProductRef,
    levels: ((levels ?? []) as Record<string, unknown>[]).map(normalizeLevel),
    movements: ((moves ?? []) as Record<string, unknown>[]).map(normalizeMovement),
    reservations: ((reservations ?? []) as Record<string, unknown>[]).map(normalizeReservation),
  };
}

export async function getWarehouses(sb: SupabaseClient): Promise<Warehouse[]> {
  const { data, error } = await sb
    .from('stock_warehouses')
    .select('id, code, name, type')
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('name');
  if (error) throw error;
  return (data ?? []) as Warehouse[];
}
