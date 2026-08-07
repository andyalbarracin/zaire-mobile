import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HeaderIconButton } from '@/components/ui/HeaderIconButton';
import { fonts } from '@/theme/tokens';
import { useThemeColors } from '@/theme/useThemeColors';

// Datos legales del titular de la marca Zaire. Fuente: /terminos de la webapp.
const EMPRESA = {
  nombre: 'Zaire',
  cuit: '20-32535869-7',
  direccion: '3320 Luis Pasteur, Castelar / Buenos Aires',
  email: 'hola@zairetech.com',
};

interface Sec {
  h: string;
  p?: string;
  list?: string[];
  p2?: string;
}

const TERMINOS: Sec[] = [
  { h: '1. Aceptación de los términos', p: 'Al acceder y utilizar Zaire («el Sistema»), usted acepta quedar vinculado por estos Términos y Condiciones de Uso. Si no está de acuerdo con alguna parte de estos términos, no podrá acceder al Sistema. El uso continuo del Sistema después de la publicación de cambios constituye aceptación de los nuevos términos.' },
  { h: '2. Descripción del servicio', p: 'Zaire es un sistema de gestión y trazabilidad de órdenes de trabajo y activos, desarrollado exclusivamente para uso interno de Zaire y sus usuarios autorizados. El Sistema permite registrar, numerar, seguir y auditar órdenes de trabajo (OT y OTS), visitas de campo y equipos, con trazabilidad completa y respaldo para procesos de auditoría de calidad.' },
  { h: '3. Acceso y cuentas de usuario', p: 'El acceso al Sistema está restringido a empleados y personas debidamente autorizadas por Zaire. Cada usuario es responsable de:', list: ['Mantener la confidencialidad de sus credenciales de acceso', 'Notificar inmediatamente al administrador ante cualquier uso no autorizado de su cuenta', 'Todas las actividades realizadas bajo su cuenta', 'No compartir sus credenciales con terceros'], p2: 'Zaire se reserva el derecho de desactivar cuentas de usuario que incumplan estos términos, sin previo aviso.' },
  { h: '4. Uso permitido', p: 'El Sistema puede utilizarse únicamente para:', list: ['Registrar y gestionar órdenes de trabajo y visitas relacionadas con las actividades de Zaire', 'Consultar el historial de órdenes, equipos y estados', 'Generar documentación oficial (remitos, órdenes de trabajo, reportes)', 'Administrar el catálogo de clientes, productos y activos de la empresa'] },
  { h: '5. Uso prohibido', p: 'Queda expresamente prohibido:', list: ['Acceder al Sistema con fines distintos a los laborales autorizados', 'Intentar acceder a áreas del Sistema para las que no se tienen permisos', 'Modificar, copiar o distribuir el código fuente del Sistema', 'Introducir virus, malware u otro código malicioso', 'Realizar ingeniería inversa sobre el Sistema', 'Exportar datos del Sistema para uso fuera de Zaire sin autorización expresa'] },
  { h: '6. Propiedad intelectual', p: 'El Sistema, incluyendo su código fuente, diseño, estructura de base de datos y documentación, es propiedad de Zaire. Todos los derechos reservados y protegidos por la normativa de propiedad intelectual vigente.' },
  { h: '7. Responsabilidad por datos', p: 'Los usuarios son responsables de la exactitud y veracidad de la información que ingresan al Sistema. Zaire no se responsabiliza por errores derivados de datos incorrectos ingresados por los usuarios. El Sistema proporciona trazabilidad pero no sustituye el juicio profesional del personal autorizado.' },
  { h: '8. Disponibilidad del servicio', p: 'Zaire realizará sus mejores esfuerzos para mantener el Sistema disponible de forma continua, pero no garantiza disponibilidad ininterrumpida. Se realizarán mantenimientos programados con previo aviso cuando sea posible.' },
  { h: '9. Modificaciones', p: 'Zaire se reserva el derecho de modificar estos Términos en cualquier momento. Los cambios serán notificados a los usuarios con al menos 7 días de anticipación mediante comunicación interna.' },
  { h: '10. Jurisdicción', p: 'Estos Términos se rigen por las leyes de la República Argentina. Cualquier disputa será sometida a la jurisdicción de los tribunales ordinarios de la Ciudad Autónoma de Buenos Aires.' },
];

const PRIVACIDAD: Sec[] = [
  { h: '1. Responsable del tratamiento', p: `${EMPRESA.nombre}\nCUIT: ${EMPRESA.cuit}\n${EMPRESA.direccion}\nEmail: ${EMPRESA.email}` },
  { h: '2. Datos que recopilamos', p: 'A través del Sistema recopilamos:', list: ['Datos de cuenta: nombre completo, dirección de email', 'Datos de uso: acciones realizadas en el Sistema, timestamps, IP de acceso', 'Datos operativos: información de órdenes de trabajo, visitas, equipos, clientes y productos ingresados al Sistema'] },
  { h: '3. Finalidad del tratamiento', p: 'Los datos se utilizan exclusivamente para:', list: ['Autenticar y autorizar el acceso al Sistema', 'Gestionar las operaciones de Zaire', 'Cumplir con los requerimientos de trazabilidad y auditoría interna', 'Auditoría interna y detección de accesos no autorizados'] },
  { h: '4. Almacenamiento y seguridad', p: 'Los datos se almacenan en servidores de Supabase (infraestructura AWS), con cifrado en tránsito (TLS/HTTPS) y en reposo. Se implementan políticas de Row-Level Security para garantizar que cada usuario accede únicamente a los datos autorizados.' },
  { h: '5. Retención de datos', p: 'Los datos de órdenes de trabajo y equipos se conservan indefinidamente como parte del registro histórico de la empresa y los requisitos de auditoría interna. Los datos de cuenta se eliminan a solicitud del empleado o al término de la relación laboral, previa evaluación del impacto en registros existentes.' },
  { h: '6. No compartimos datos con terceros', p: 'Zaire no vende, alquila ni comparte datos personales con terceros, excepto cuando sea requerido por ley o autoridad competente, o cuando sea necesario para el funcionamiento técnico del Sistema (proveedores de infraestructura bajo acuerdos de confidencialidad).' },
  { h: '7. Derechos del usuario', p: `En cumplimiento de la Ley 25.326 de Protección de Datos Personales (Argentina), los usuarios tienen derecho a acceder, rectificar y suprimir sus datos personales. Para ejercer estos derechos, contactar a: ${EMPRESA.email}`, p2: 'La Dirección Nacional de Protección de Datos Personales (Órgano de Control de la Ley N.° 25.326) tiene la atribución de atender las denuncias y reclamos que se interpongan con relación al incumplimiento de las normas sobre protección de datos personales.' },
  { h: '8. Cookies y sesiones', p: 'El Sistema utiliza cookies de sesión estrictamente necesarias para el funcionamiento de la autenticación. No se utilizan cookies de seguimiento, publicidad ni analítica de terceros.' },
];

export default function Legal() {
  const c = useThemeColors();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const [active, setActive] = useState<'terminos' | 'privacidad'>(tab === 'privacidad' ? 'privacidad' : 'terminos');
  const secs = active === 'terminos' ? TERMINOS : PRIVACIDAD;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 6, paddingBottom: 8 }}>
        <HeaderIconButton icon="chevronLeft" iconSize={24} onPress={() => router.back()} />
        <Text style={{ fontFamily: fonts.ralewayB, fontSize: 17, color: c.fg }}>Legal</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Toggle */}
        <View style={{ flexDirection: 'row', gap: 6, padding: 4, backgroundColor: c.surface2, borderRadius: 13, marginBottom: 20 }}>
          <Seg label="Términos" activeState={active === 'terminos'} onPress={() => setActive('terminos')} c={c} />
          <Seg label="Privacidad" activeState={active === 'privacidad'} onPress={() => setActive('privacidad')} c={c} />
        </View>

        <Text style={{ fontFamily: fonts.ralewayB, fontSize: 22, color: c.fg, letterSpacing: -0.3, marginBottom: 4 }}>
          {active === 'terminos' ? 'Términos y Condiciones de Uso' : 'Política de Privacidad'}
        </Text>
        <Text style={{ fontFamily: fonts.inter, fontSize: 12.5, color: c.fg3, marginBottom: 20 }}>Última actualización: 20 de mayo de 2026</Text>

        {secs.map((s) => (
          <View key={s.h} style={{ marginBottom: 20 }}>
            <Text style={{ fontFamily: fonts.interB, fontSize: 15.5, color: c.fg, marginBottom: 7 }}>{s.h}</Text>
            {s.p ? <Text style={{ fontFamily: fonts.inter, fontSize: 14, lineHeight: 21, color: c.fg2 }}>{s.p}</Text> : null}
            {s.list ? (
              <View style={{ marginTop: 8, gap: 5 }}>
                {s.list.map((li, i) => (
                  <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
                    <Text style={{ color: c.fg3, fontSize: 14, lineHeight: 21 }}>•</Text>
                    <Text style={{ flex: 1, fontFamily: fonts.inter, fontSize: 14, lineHeight: 21, color: c.fg2 }}>{li}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            {s.p2 ? <Text style={{ fontFamily: fonts.inter, fontSize: 14, lineHeight: 21, color: c.fg2, marginTop: 10 }}>{s.p2}</Text> : null}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function Seg({ label, activeState, onPress, c }: { label: string; activeState: boolean; onPress: () => void; c: ReturnType<typeof useThemeColors> }) {
  return (
    <Text
      onPress={onPress}
      style={{
        flex: 1,
        textAlign: 'center',
        paddingVertical: 10,
        borderRadius: 10,
        overflow: 'hidden',
        fontFamily: fonts.interSb,
        fontSize: 13.5,
        color: activeState ? c.fg : c.fg2,
        backgroundColor: activeState ? c.surface : 'transparent',
      }}
    >
      {label}
    </Text>
  );
}
