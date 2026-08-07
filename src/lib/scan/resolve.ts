/**
 * Resolución de un código escaneado → destino en la app. El escáner (FAB central) es una
 * capacidad COMPARTIDA entre módulos; acá se decide a dónde lleva cada payload, para no
 * acoplar el escáner a un módulo. Hoy resuelve el QR de un equipo (Assets); mañana se
 * agregan prefijos (producto/Stock, visita/Field) sin tocar la pantalla de cámara.
 *
 * Formatos aceptados para equipos:
 *  - `zaire:asset:<uuid>`         (esquema propio, a prueba de futuro)
 *  - `…/assets/equipos/<uuid>`    (deep-link de la etiqueta QR de la web)
 *  - `<uuid>`                     (UUID crudo)
 */

export type ScanTarget = { kind: 'asset'; id: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function resolveScan(raw: string): ScanTarget | null {
  const s = (raw ?? '').trim();
  if (!s) return null;

  const scheme = s.match(/^zaire:asset:(.+)$/i);
  if (scheme && UUID_RE.test(scheme[1].trim())) return { kind: 'asset', id: scheme[1].trim() };

  const marker = '/assets/equipos/';
  const idx = s.indexOf(marker);
  if (idx >= 0) {
    const rest = s.slice(idx + marker.length).split(/[/?#]/)[0];
    if (UUID_RE.test(rest)) return { kind: 'asset', id: rest };
  }

  if (UUID_RE.test(s)) return { kind: 'asset', id: s };

  return null;
}
