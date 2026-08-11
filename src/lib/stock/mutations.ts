import type { SupabaseClient } from '@supabase/supabase-js';

export interface RegisterMovementInput {
  productId: string;
  warehouseId: string;
  type: 'entrada' | 'salida' | 'ajuste';
  qty: number; // siempre positivo; el signo se resuelve acá según el tipo (y ajusteSign si aplica)
  unitCost: number | null; // solo aplica a 'entrada' (dispara recálculo de costo promedio)
  ajusteSign?: 'sumar' | 'restar'; // solo aplica a 'ajuste' — un ajuste puede ir para cualquier lado
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
  const signedQty =
    input.type === 'salida'
      ? -Math.abs(input.qty)
      : input.type === 'ajuste'
        ? input.ajusteSign === 'restar'
          ? -Math.abs(input.qty)
          : Math.abs(input.qty)
        : Math.abs(input.qty);
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

export interface TransferStockInput {
  productId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  qty: number; // siempre positivo
  notes: string | null;
  createdBy: string | null;
}

/**
 * Transferencia entre depósitos — RPC dedicado `apply_stock_transfer` (no `apply_stock_movement`):
 * hace la salida del origen y la entrada al destino en una sola transacción atómica, arrastrando
 * el costo promedio del origen. Online-only, mismo criterio que el resto de los movimientos.
 */
export async function transferStock(sb: SupabaseClient, input: TransferStockInput): Promise<void> {
  const { error } = await sb.rpc('apply_stock_transfer', {
    p_product_id: input.productId,
    p_from: input.fromWarehouseId,
    p_to: input.toWarehouseId,
    p_qty: Math.abs(input.qty),
    p_serial: null,
    p_lot: null,
    p_notes: input.notes,
    p_created_by: input.createdBy,
  });
  if (error) throw error;
}

/** Traduce el error del RPC (viene tal cual del RAISE EXCEPTION de Postgres) a un mensaje claro. */
export function mapStockError(message: string): string {
  if (message.toLowerCase().includes('insuficiente')) return 'No hay stock suficiente para ese movimiento.';
  if (message.toLowerCase().includes('mismo depósito') || message.toLowerCase().includes('mismo deposito')) {
    return 'El origen y el destino no pueden ser el mismo depósito.';
  }
  return 'No se pudo registrar el movimiento. Reintentá en un momento.';
}
