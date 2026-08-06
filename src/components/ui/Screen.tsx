import type { ReactNode } from 'react';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

/** Contenedor de pantalla: safe-area + fondo del tema. */
export function Screen({
  children,
  edges = ['top'],
}: {
  children: ReactNode;
  edges?: Edge[];
}) {
  return (
    <SafeAreaView edges={edges} className="flex-1 bg-bg">
      {children}
    </SafeAreaView>
  );
}
