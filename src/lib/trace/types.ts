/**
 * Tipos (subset) de Zaire Trace, espejo de zaire-industrial/src/lib/types/database.ts +
 * lib/trace/constants.ts. Solo lo que la Slice 1 (lista + detalle, solo lectura) necesita.
 * No divergir de los nombres del backend — Trace usa tablas LEGACY sin prefijo (work_orders).
 */

export type OrderStatus =
  | 'ingresada'
  | 'en_revision'
  | 'cotizada'
  | 'aprobada'
  | 'en_reparacion'
  | 'lista_para_entregar'
  | 'remitido'
  | 'facturada'
  | 'cancelada';

export type OrderType = 'OT' | 'OTS';
export type ItemStatus = 'pendiente' | 'en_proceso' | 'completado' | 'entregado';
export type Currency = 'USD' | 'ARS';

export interface OrderClient {
  id: string;
  business_name: string | null;
}

export interface WorkOrder {
  id: string;
  order_number: string;
  order_type: OrderType;
  status: OrderStatus;
  date_in: string;
  date_due: string | null;
  currency: Currency;
  total: number;
  total_ars: number | null;
  branch_id: string | null;
  general_notes: string | null;
  client: OrderClient | null;
}

export interface WorkOrderItem {
  id: string;
  work_order_id: string;
  item_number: number;
  quantity: number;
  custom_description: string | null;
  status: ItemStatus;
  total_price: number;
  product?: { id: string; name: string } | null;
}

export interface StatusHistoryEntry {
  id: string;
  old_status: OrderStatus | null;
  new_status: OrderStatus;
  notes: string | null;
  created_at: string;
  changed_by?: { full_name: string | null } | null;
}
