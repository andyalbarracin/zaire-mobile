/**
 * Tipos (subset) de Zaire Stock, espejo de zaire-industrial/src/lib/stock/types.ts.
 * Solo lo que la Slice 1 (lista + Kardex + Entrada/Salida) necesita. No divergir de los
 * nombres del backend.
 */

export type WarehouseType = 'deposito' | 'vehiculo';
export type MovementType = 'entrada' | 'salida' | 'ajuste' | 'transferencia' | 'consumo';

export interface StockProduct {
  id: string;
  code: string | null;
  name: string;
  unit: string;
}

export interface Warehouse {
  id: string;
  code: string | null;
  name: string;
  type: WarehouseType;
  field_vehicle_id: string | null;
}

export interface StockLevel {
  id: string;
  product_id: string;
  warehouse_id: string;
  on_hand: number;
  reserved: number;
  available: number;
  avg_cost: number;
  min_qty: number;
  updated_at: string;
  product?: StockProduct | null;
  warehouse?: Warehouse | null;
}

export interface StockMovement {
  id: string;
  doc_number: string | null;
  product_id: string;
  warehouse_id: string;
  type: MovementType;
  qty: number;
  unit_cost: number | null;
  notes: string | null;
  created_at: string;
  warehouse?: Warehouse | null;
}

/** Agrupado por producto (para la lista) — suma todos los depósitos del producto. */
export interface ProductStockSummary {
  product_id: string;
  product: StockProduct;
  on_hand: number;
  available: number;
  light: 'green' | 'yellow' | 'red';
  warehouseCount: number;
}

export type ReservationStatus = 'activa' | 'consumida' | 'liberada';
export type ReservationRefType = 'ot' | 'quote' | 'visita' | 'manual';

export interface StockReservation {
  id: string;
  product_id: string;
  warehouse_id: string;
  qty: number;
  ref_type: ReservationRefType;
  status: ReservationStatus;
  notes: string | null;
  created_at: string;
  warehouse?: Warehouse | null;
}
