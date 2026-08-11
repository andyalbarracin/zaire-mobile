import type { SupabaseClient } from '@supabase/supabase-js';

import { ORDER_STATUS_LABELS } from './map';
import type { OrderStatus } from './types';

export interface ChangeOrderStatusInput {
  orderId: string;
  oldStatus: OrderStatus;
  newStatus: OrderStatus;
  notes: string | null;
  userId: string | null;
  userName: string | null;
}

export interface ChangeOrderStatusResult {
  /** El estado cambió, pero el historial y/o la auditoría no se pudieron guardar. */
  partial: boolean;
}

/**
 * Cambia el estado de una orden. Online-only (decisión de producto): a diferencia de Field, una
 * orden no tiene un técnico dueño — puede estar siendo tocada por oficina u otro técnico a la vez,
 * así que encolar el cambio offline arriesga aplicar una transición con `oldStatus` desactualizado.
 *
 * Son 3 escrituras SIN transacción, mismo patrón (y mismo nivel de robustez) que ya usa la web
 * hoy — no hay RPC atómico en el backend para esto. Si el historial o la auditoría fallan después
 * de que el estado ya cambió, no se revierte (tampoco lo hace la web) — se avisa con `partial`
 * en vez de fallar en silencio.
 */
export async function changeOrderStatus(sb: SupabaseClient, input: ChangeOrderStatusInput): Promise<ChangeOrderStatusResult> {
  const { error: statusErr } = await sb.from('work_orders').update({ status: input.newStatus }).eq('id', input.orderId);
  if (statusErr) throw statusErr;

  const { error: histErr } = await sb.from('work_order_status_history').insert({
    work_order_id: input.orderId,
    old_status: input.oldStatus,
    new_status: input.newStatus,
    changed_by: input.userId,
    notes: input.notes,
  });

  const { error: auditErr } = await sb.from('audit_logs').insert({
    entity_type: 'work_order',
    entity_id: input.orderId,
    action: 'status_change',
    description: `Estado cambiado: ${ORDER_STATUS_LABELS[input.oldStatus]} → ${ORDER_STATUS_LABELS[input.newStatus]}`,
    user_id: input.userId,
    user_name: input.userName,
  });

  return { partial: Boolean(histErr || auditErr) };
}
