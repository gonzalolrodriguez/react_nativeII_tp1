# Desglose de Tareas de Desarrollo (tasks.md)

este documento contiene el desglose detallado de las 14 tareas desarrolladas (T00 a T13), incluyendo el prompt utilizado, lo generado por la IA, las correcciones manuales aplicadas y los commits de git asociados.

---

### Tarea T00: setup inicial e instalación de dependencias
* **Prompt Utilizado**:
  > *"instala las dependencias necesarias para la app 'Better': `@react-native-async-storage/async-storage` para almacenamiento persistente y `expo-linear-gradient` para gradientes en la UI. Configura el `.gitignore`."*
* **Qué Generó la IA**:
  modificaciones en `package.json` y `package-lock.json` agregando ambas librerías, e inclusión de reglas estándar en `.gitignore`.
* **Qué se Corrigió a Mano y Cómo**:
  Se verificó la compatibilidad exacta de versiones con Expo SDK 54 (`~15.0.8` para `expo-linear-gradient` y `2.2.0` para `@react-native-async-storage/async-storage`). Se ejecutó `npm install` verificando la resolución limpia del árbol de dependencias.
* **Commits**: `7ec4e45`, `f0c322e`

---

### Tarea T01: capa de servicios mock con AsyncStorage
* **Prompt Utilizado**:
  > *"Crea el servicio `services/habitsService.ts` que administre la persistencia local de hábitos y sus registros diarios usando `AsyncStorage`. Agrega una latencia artificial de 500ms para simular peticiones de red y métodos para obtener, crear, editar, eliminar y marcar/desmarcar hábitos, además de calcular rachas (streaks)."*
* **Qué Generó la IA**:
  El archivo `services/habitsService.ts` con funciones `getHabits`, `saveHabit`, `toggleHabitCompletion`, etc.
* **Qué se Corrigió a Mano y Cómo**:
  * **Problema**: La función `calculateStreak` no consideraba adecuadamente días salteados o el cambio de mes.
  * **Solución**: Se implementó una lógica de iteración decreciente a partir de la fecha actual (`YYYY-MM-DD`), validando que si el hábito ya fue completado hoy la racha permanezca activa, y descontando días hacia atrás de forma continua.
* **Commit**: `2614710`

---

### Tarea T02: componentes base (skeleton loader y habit card)
* **Prompt Utilizado**:
  > *"Crea el componente `components/skeleton-loader.tsx` para mostrar marcadores de posición animados durante la carga, y la tarjeta base `components/habit-card.tsx` para listar cada hábito con su título, categoría, racha y botón de acción."*
* **Qué Generó la IA**:
  componente `SkeletonLoader` usando opacidad animada y `HabitCard` estático.
* **Qué se Corrigió a Mano y Cómo**:
  * **Problema**: `SkeletonLoader` provocaba múltiples re-renders por ciclo de animación usando `setState`.
  * **Solución**: Se refactorizó para emplear `Animated.loop` con `useNativeDriver: true`, delegando la animación al hilo nativo de UI.
* **Commit**: `cd0ec13`

---

### Tarea T03: layout de tabs y navegación principal
* **Prompt Utilizado**:
  > *"Configura el layout de navegación por pestañas en `app/(tabs)/_layout.tsx`. Reemplaza la pestaña de exploración por omisión con una pestaña de 'Historial' (`history.tsx`) y agrega íconos personalizados en `components/ui/icon-symbol.tsx`."*
* **Qué Generó la IA**:
  Configuración de `Tabs` con pestañas para Dashboard (`index.tsx`) e Historial (`history.tsx`).
* **Qué se Corrigió a Mano y Cómo**:
  * **Problema**: Los iconos de la barra de pestañas no coincidían entre iOS y Android.
  * **Solución**: Se actualizaron las firmas del mapa de íconos en `components/ui/icon-symbol.tsx` agregando mapeos explícitos para SFSymbols (`calendar` y `clock.arrow.circlepath`).
* **Commit**: `7ef90ac`

---

### Tarea T04: dashboard de hábitos con estados de carga
* **Prompt Utilizado**:
  > *"Implementa la pantalla principal `app/(tabs)/index.tsx`. Debe mostrar la fecha actual, un resumen del progreso diario, estado de carga tipo Skeleton durante el consumo del servicio y la lista interactiva de hábitos."*
* **Qué Generó la IA**:
  Pantalla de Dashboard llamando a `habitsService.getHabits()` e integrando `SkeletonLoader`.
* **Qué se Corrigió a Mano y Cómo**:
  * **Problema**: al regresar del formulario de creación/edición, los hábitos no se refrescaban automáticamente.
  * **Solución**: se reemplazó la invocación en `useEffect` por `useFocusEffect` de `@react-navigation/native` envuelto en `useCallback`.
* **Commit**: `3165856`

---

### Tarea T05: pantalla de historial mensual y sistema de logros
* **Prompt Utilizado**:
  > *"Implementa la pantalla `app/(tabs)/history.tsx` para visualizar el historial mensual de consistencia y una sección de logros alcanzados (ej: 'Primer Hábito', 'Racha de 7 días', 'Maestro de la Consistencia')."*
* **Qué Generó la IA**:
  pantalla de historial con selector de mes y lista de logros.
* **Qué se Corrigió a Mano y Cómo**:
  * **Problema**: el porcentaje de consistencia arrojaba `NaN%` cuando la lista de hábitos estaba vacía o en meses futuros sin registros.
  * **Solución**: se añadió una verificación condicional de división por cero (`totalDays > 0 ? (completedDays / totalDays) * 100 : 0`).
* **Commit**: `5a4c102`

---

### Tarea T06: pantalla de detalle del hábito
* **Prompt Utilizado**:
  > *"Crea la pantalla dinámica `app/habit/[id].tsx` que reciba el ID del hábito y despliegue estadísticas en profundidad, racha actual, récord histórico y cuadrícula de consistencia visual de los últimos 30 días."*
* **Qué Generó la IA**:
  la ruta `app/habit/[id].tsx` recuperando parámetros dinámicos con `useLocalSearchParams()`.
* **Qué se Corrigió a Mano y Cómo**:
  * **Problema**: error de compilación por importación incorrecta de `Dimensions` y advertencias de linter al configurar las opciones de `Stack.Screen`.
  * **Solución**: se corrigió el import desde `react-native` y se formatearon las opciones del encabezado nativo (`title`, `headerTintColor`, `headerBackTitle`).
* **Commits**: `6d117c2`, `4fb8ef3`

---

### Tarea T07: formulario de creación y edición (manage habit)
* **Prompt Utilizado**:
  > *"Crea la pantalla `app/habit/manage.tsx` para crear nuevos hábitos o editar existentes. Debe incluir validación de campos (título requerido), selector de color, selector de ícono y frecuencia (Diaria/Semanal)."*
* **Qué Generó la IA**:
  formulario completo con estado local para cada atributo del hábito.
* **Qué se Corrigió a Mano y Cómo**:
  * **Problema**: al presionar 'Guardar' en modo edición, la IA ejecutaba siempre la creación de un nuevo ID.
  * **Solución**: se agregó una verificación condicional: si se recibe `id` por parámetro se invoca `updateHabit(id, data)`, de lo contrario se ejecuta `createHabit(data)`.
* **Commit**: `071765e`

---

### Tarea T08: limpieza de advertencias de Linter y reglas de Hooks
* **Prompt Utilizado**:
  > *"Revisa todos los componentes (`history.tsx`, `index.tsx`, `[id].tsx`), corrige advertencias del linter y asegura el cumplimiento estricto de las reglas de Hooks de React."*
* **Qué Generó la IA**:
  eliminación de variables no utilizadas en las vistas principales.
* **Qué se Corrigió a Mano y Cómo**:
  * **Problema**: advertencias `react-hooks/exhaustive-deps` en varios callbacks.
  * **Solución**: se incluyeron todas las referencias necesarias (`id`, `loadData`, `navigation`) dentro del arreglo de dependencias de `useCallback` y `useEffect`.
* **Commits**: `6e00147`, `77dcf40`

---

### Tarea T09: rediseño visual de tarjeta con Reanimated Spring y Glassmorphism
* **Prompt Utilizado**:
  > *"Rediseña `components/habit-card.tsx` incorporando animaciones al presionar con `react-native-reanimated` (`useSharedValue`, `withSpring`, `useAnimatedStyle`), gradientes de `expo-linear-gradient` y retroalimentación háptica con `expo-haptics`."*
* **Qué Generó la IA**:
  Tarjeta envuelta en `Animated.View` y `LinearGradient`.
* **Qué se Corrigió a Mano y Cómo**:
  * **Problema**: La escala por resorte (*spring*) entraba en conflicto con la navegación del `Link` de Expo Router.
  * **Solución**: Se refactorizó a `useRouter().push(...)` desencadenado explícitamente desde un handler `onPress`, garantizando que la animación de resorte se complete sin interferir con la navegación.
* **Commit**: `78cc216`

---

### Tarea T10: Dashboard rediseñado con grilla responsiva y SafeAreaView
* **Prompt Utilizado**:
  > *"Rediseña `app/(tabs)/index.tsx` aplicando una estética de cristal oscuro (Dark Glassmorphism), grilla de métricas responsiva, encabezado personalizado y `SafeAreaView` global para evitar superposición con barras de estado."*
* **Qué Generó la IA**:
  Layout de Dashboard en tema oscuro con tarjetas superiores de estadísticas.
* **Qué se Corrigió a Mano y Cómo**:
  * **Problema**: en dispositivos Android con barra de estado transparente, el contenido superior se superponía.
  * **Solución**: se ajustó `SafeAreaView` especificando `edges={['top']}` con fondo coordinado `#0A0D14`.
* **Commit**: `802712d`

---

### Tarea T11: rediseño de historial y logros responsivos
* **Prompt Utilizado**:
  > *"Rediseña `app/(tabs)/history.tsx` con estética oscura, componentes de progreso envolventes, tarjetas de logros con insignias de gradiente y distribución responsiva."*
* **Qué Generó la IA**:
  Pantalla de historial renovada con diseño oscuro.
* **Qué se Corrigió a Mano y Cómo**:
  * **Problema**: Las tarjetas de logros se deformaban en pantallas estrechas.
  * **Solución**: Se configuró la grilla con `flexDirection: 'row'`, `flexWrap: 'wrap'` y anchos porcentuales del `48%` con margen dinámico.
* **Commit**: `47adb61`

---

### Tarea T12: Rediseño de la Pantalla de Detalle con Anillos de Progreso
* **Prompt Utilizado**:
  > *"Rediseña `app/habit/[id].tsx` integrando anillos visuales de progreso, tarjetas de estadísticas oscuras con gradientes y matriz de consistencia estilo GitHub de 30 días."*
* **Qué Generó la IA**:
  Vista de detalle analítico con estilos mejorados.
* **Qué se Corrigió a Mano y Cómo**:
  * **Problema**: Los 30 días de la matriz se desalineaban en la 5ta fila.
  * **Solución**: Se agruparon las celdas en semanas fijas de 7 columnas para garantizar una alineación uniforme independientemente de la densidad de píxeles.
* **Commit**: `e25427d`

---

### Tarea T13: rediseño del formulario de gestión y limpieza final
* **Prompt Utilizado**:
  > *"Rediseña `app/habit/manage.tsx` con controles táctiles animados mediante Reanimated, selectores de color en burbujas con gradientes, soporte responsivo para teclado y limpia importaciones no utilizadas."*
* **Qué Generó la IA**:
  Formulario `manage.tsx` rediseñado y propuesta de limpieza.
* **Qué se Corrigió a Mano y Cómo**:
  * **Problema**: el teclado virtual tapaba los botones principales en dispositivos Android.
  * **Solución**: se aplicó `KeyboardAvoidingView` con `behavior={Platform.OS === 'ios' ? 'padding' : 'height'}` y `keyboardShouldPersistTaps="handled"`.
  * **Linter**: se ejecutó `expo lint` eliminando todas las importaciones residuales.
* **Commits**: `b4665c1`, `90a2bea`

---

### Tarea T14: Toggle Minimalista Modo Claro/Oscuro y Rediseño Ultra-Moderno de Gestión
* **Prompt Utilizado**:
  > *"Aplica un toggle moderno y minimalista para intercambiar entre modo claro y modo oscuro. Haz que la sección de nuevo hábito y editar hábito tengan un aspecto moderno con animaciones, transiciones e inspiración en tendencias de UI (Framer Motion, Chakra UI)..."*
* **Qué Generó la IA**:
  `ThemeContext` para persistencia en `AsyncStorage`, componente `ThemeToggle` con físicas de resorte en `react-native-reanimated`, y formulario `manage.tsx` renovado con tarjeta interactiva en vivo, espectro de colores Chakra UI y selector de íconos.
* **Qué se Corrigió a Mano y Cómo**:
  * **Solución**: Se integró `ThemeContext` en el layout raíz `_layout.tsx` garantizando sincronización en todas las pantallas (`index.tsx`, `history.tsx`, `[id].tsx`, `habit-card.tsx`, `skeleton-loader.tsx`). Se añadió la vista previa interactiva en tiempo real en la cima del formulario de gestión.

