import type { FolderCardProps } from '@/components/FolderCard';
import type { StatusKey } from '@/theme/tokens';

import type { MovementType, ProductStockSummary, StockLevel } from './types';

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  entrada: 'Entrada',
  salida: 'Salida',
  ajuste: 'Ajuste',
  transferencia: 'Transferencia',
  consumo: 'Consumo',
};

/** Semáforo de existencia — espejo de stockLight() en zaire-industrial/lib/stock/constants.ts. */
export function stockLight(onHand: number, minQty: number): 'green' | 'yellow' | 'red' {
  if (onHand <= 0) return 'red';
  if (minQty > 0 && onHand <= minQty) return 'yellow';
  return 'green';
}

const LIGHT_RANK: Record<'green' | 'yellow' | 'red', number> = { green: 0, yellow: 1, red: 2 };
const LIGHT_TO_KEY: Record<'green' | 'yellow' | 'red', StatusKey> = { green: 'ensitio', yellow: 'atencion', red: 'critico' };
const LIGHT_LABEL: Record<'green' | 'yellow' | 'red', string> = { green: 'OK', yellow: 'Bajo mínimo', red: 'Sin stock' };

/** Agrupa stock_levels (una fila por producto×depósito) en un resumen por producto para la lista. */
export function groupByProduct(levels: StockLevel[]): ProductStockSummary[] {
  const map = new Map<string, ProductStockSummary>();
  for (const l of levels) {
    if (!l.product) continue;
    const light = stockLight(l.on_hand, l.min_qty);
    const existing = map.get(l.product_id);
    if (!existing) {
      map.set(l.product_id, { product_id: l.product_id, product: l.product, on_hand: l.on_hand, available: l.available, light, warehouseCount: 1 });
    } else {
      existing.on_hand += l.on_hand;
      existing.available += l.available;
      existing.warehouseCount += 1;
      if (LIGHT_RANK[light] > LIGHT_RANK[existing.light]) existing.light = light;
    }
  }
  return [...map.values()].sort((a, b) => a.product.name.localeCompare(b.product.name));
}

export function productToCard(p: ProductStockSummary): FolderCardProps {
  return {
    title: p.product.name,
    subtitle: [p.product.code, `${p.warehouseCount} ${p.warehouseCount === 1 ? 'depósito' : 'depósitos'}`].filter(Boolean).join(' · '),
    status: LIGHT_TO_KEY[p.light],
    statusLabel: LIGHT_LABEL[p.light],
    icon: 'box',
    time: `${p.on_hand} ${p.product.unit}`,
  };
}
