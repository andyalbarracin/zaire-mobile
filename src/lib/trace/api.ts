import type { SupabaseClient } from '@supabase/supabase-js';

import type { StatusHistoryEntry, WorkOrder, WorkOrderItem } from './types';

// Espejo (curado) de la query de lista/detalle de la web: solo lo que Slice 1 (solo lectura) necesita.
const ORDER_SELECT = `
  id, order_number, order_type, status, date_in, date_due, currency, total, total_ars, branch_id, general_notes,
  client:clients(id, business_name)
`;

// Supabase puede devolver un join to-one como objeto o como array de 1; normalizamos.
function firstOrObj<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

function normalizeOrder(row: Record<string, unknown>): WorkOrder {
  return { ...(row as unknown as WorkOrder), client: firstOrObj(row.client as never) };
}

/**
 * Órdenes de la empresa. A diferencia de Field/Assets, `work_orders` no tiene técnico asignado
 * — es una lista general (Trace es el módulo de backoffice, acotado acá a consulta rápida).
 */
export async function getOrders(sb: SupabaseClient): Promise<WorkOrder[]> {
  const { data, error } = await sb
    .from('work_orders')
    .select(ORDER_SELECT)
    .is('deleted_at', null)
    .order('date_in', { ascending: false })
    .limit(200);
  if (error) throw error;
  return ((data ?? []) as Record<string, unknown>[]).map(normalizeOrder);
}

export interface OrderFull {
  order: WorkOrder;
  items: WorkOrderItem[];
  history: StatusHistoryEntry[];
}

export async function getOrderFull(sb: SupabaseClient, id: string): Promise<OrderFull | null> {
  const [{ data: order, error: orderErr }, { data: items, error: itemsErr }, { data: history, error: histErr }] = await Promise.all([
    sb.from('work_orders').select(ORDER_SELECT).eq('id', id).is('deleted_at', null).maybeSingle(),
    sb
      .from('work_order_items')
      .select('id, work_order_id, item_number, quantity, custom_description, status, total_price, product:products(id, name)')
      .eq('work_order_id', id)
      .order('item_number'),
    sb
      .from('work_order_status_history')
      .select('id, old_status, new_status, notes, created_at, changed_by:profiles(full_name)')
      .eq('work_order_id', id)
      .order('created_at', { ascending: true }),
  ]);
  if (orderErr) throw orderErr;
  if (itemsErr) throw itemsErr;
  if (histErr) throw histErr;
  if (!order) return null;
  return {
    order: normalizeOrder(order as Record<string, unknown>),
    items: ((items ?? []) as Record<string, unknown>[]).map((row) => ({
      ...(row as unknown as WorkOrderItem),
      product: firstOrObj(row.product as never),
    })),
    history: ((history ?? []) as Record<string, unknown>[]).map((row) => ({
      ...(row as unknown as StatusHistoryEntry),
      changed_by: firstOrObj(row.changed_by as never),
    })),
  };
}
