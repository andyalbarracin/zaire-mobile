import type { SupabaseClient } from '@supabase/supabase-js';

export interface RegisterMovementInput {
  productId: string;
  warehouseId: string;
  type: 'entrada' | 'salida';
  qty: number; // siempre positivo; el signo se resuelve acá según el tipo
  unitCost: number | null; // solo aplica a 'entrada' (dispara recálculo de costo promedio)
  notes: string | null;
  createdBy: string | null;
}

/**
 * Registra un movimiento de stock. SIEMPRE vía el RPC `apply_stock_movement` (valida stock
 * negativo y recalcula el costo promedio ponderado server-side, con lock de fila) — nunca un
 * insert directo a stock_movements/stock_levels. Por eso es **online-only**: no encaja en el
 * outbox actual (que solo sabe 'insert'/'set_status'), mismo criterio ya usado con las fotos.
 */
export async function registerMovement(sb: SupabaseClient, input: RegisterMovementInput): Promise<void> {
  const signedQty = input.type === 'salida' ? -Math.abs(input.qty) : Math.abs(input.qty);
  const { error } = await sb.rpc('apply_stock_movement', {
    p_product_id: input.productId,
    p_warehouse_id: input.warehouseId,
    p_type: input.type,
    p_qty: signedQty,
    p_unit_cost: input.type === 'entrada' ? input.unitCost : null,
    p_ref_type: null,
    p_ref_id: null,
    p_counterparty_warehouse_id: null,
    p_serial: null,
    p_lot: null,
    p_doc_number: null,
    p_notes: input.notes,
    p_created_by: input.createdBy,
  });
  if (error) throw error;
}

/** Traduce el error del RPC (viene tal cual del RAISE EXCEPTION de Postgres) a un mensaje claro. */
export function mapStockError(message: string): string {
  if (message.toLowerCase().includes('insuficiente')) return 'No hay stock suficiente para esa salida.';
  return 'No se pudo registrar el movimiento. Reintentá en un momento.';
}
