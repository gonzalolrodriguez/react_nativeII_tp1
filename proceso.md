# Registro del Proceso de Desarrollo con IA (proceso.md)

Este documento describe la metodología de trabajo, los prompts ejecutados, el análisis de las propuestas generadas por la IA y el detalle de las intervenciones manuales realizadas durante el desarrollo del proyecto **Better Habit Tracker**.

---

## 1. Metodología de Desarrollo

El desarrollo se llevó a cabo siguiendo una metodología **iterativa asistida por IA**, donde la inteligencia artificial actuó como un copiloto de desarrollo y el desarrollador como arquitecto y revisor de código.

### Ciclo de Iteración por Tarea
```
+------------------+     +--------------------+     +---------------------+     +--------------------+
|  1. Prompt       | --> |  2. Código         | --> |  3. Revisión &      | --> |  4. Refactor      |
|     Específico   |     |     Generado IA    |     |     Pruebas Linter  |     |     Manual & Git   |
+------------------+     +--------------------+     +---------------------+     +--------------------+
```

1. **Prompt Específico**: formulación de instrucciones acotadas por tarea (T00 a T13).
2. **Generación Asistida**: creación de código inicial apoyado en las skills (`expo-router`, `expo-data-fetching`, `expo-project-structure`).
3. **Inspección y Pruebas**: verificación de linter (`expo lint`), compilación de tipos (`tsc`) y comportamiento dinámico en la pantalla.
4. **Refactorización Manual**: corrección de bugs de borde, optimización de renderizado y commit atómico en Git.

---

## 2. Prompts Clave Utilizados en el Proyecto

### 1. Prompts de Planificación y Especificación
* **Spec Prompt**:
  > *"Actúa como un Lead Product Manager y Arquitecto Mobile. Diseña la especificación completa para una app de seguimiento de hábitos llamada 'Better' usando Expo SDK 54, React Native y TypeScript. La app debe incluir gestión de hábitos (crear, editar, eliminar), registro de consistencia diario, tablero principal (Dashboard), historial mensual con cálculo de logros y detalle analítico por hábito. Requiere persistencia local mediante AsyncStorage."*
* **Plan Prompt**:
  > *"Diseña la arquitectura de archivos usando Expo Router basada en la skill `expo-project-structure`. Separa la capa de servicios (`services/habitsService.ts`), componentes reutilizables (`components/`), hooks personalizados y pantallas (`app/`). Define interfaces TypeScript estrictas para hábitos (`Habit`), registros de actividad (`HabitLog`) y logros (`Achievement`)."*

### 2. Prompts de Desarrollo por Funcionalidad
* **Capa de Servicios**:
  > *"Crea `services/habitsService.ts` con persistencia `AsyncStorage` y latencia artificial de 500ms para simular peticiones de red..."*
* **Animaciones y UI Glassmorphic**:
  > *"Rediseña `components/habit-card.tsx` incorporando animaciones al presionar con `react-native-reanimated` (`useSharedValue`, `withSpring`), gradientes de `expo-linear-gradient` y retroalimentación háptica..."*
* **Formulario y Teclado**:
  > *"Rediseña `app/habit/manage.tsx` con controles táctiles animados, selectores de color en burbujas con gradientes, soporte responsivo para teclado y limpia importaciones no utilizadas..."*

---

## 3. Matriz de Correcciones Manuales sobre las Propuestas de la IA

A continuación se detallan las áreas donde la propuesta de la IA requirió intervención técnica manual:

| Área Técnica | Propuesta Inicial de la IA | Problema Detectado | Corrección Manual Aplicada |
|---|---|---|---|
| **Lógica de Rachas** | Iteración simple sobre días del mes actual. | Rompía la racha continua al cruzar entre meses o años. | Algoritmo decreciente en `habitsService.ts` iterando desde la fecha actual hacia atrás considerando cualquier mes. |
| **Ciclo de Vida de Pantallas** | Carga de datos únicamente en `useEffect([]).` | Al volver de editar/crear un hábito, la pantalla no actualizaba sus datos. | Implementación de `useFocusEffect` de `@react-navigation/native` envuelto en `useCallback`. |
| **Navegación + Animaciones** | Envolver componente Reanimated dentro de `<Link asChild>`. | El gesto de animación de resorte (*spring*) interfería con el disparo del evento de navegación. | Sustitución por `useRouter().push(...)` desencadenado explícitamente en el evento `onPress`. |
| **Rendimiento de Skeleton** | Animación de opacidad controlada con `setState` en un intervalo. | Exceso de re-renders provocando caídas de fps. | Migración a `Animated.loop` con `useNativeDriver: true` en el hilo nativo de UI. |
| **Comportamiento de Teclado** | Formulario simple sin contenedor de teclado. | El teclado virtual en Android cubría los botones principales de acción. | Integración de `KeyboardAvoidingView` con `behavior={Platform.OS === 'ios' ? 'padding' : 'height'}`. |
| **Adaptación de Safe Area** | Padding superior estático con constantes fijas. | Inconsistencia en dispositivos con notches de distintos tamaños. | Configuración de `SafeAreaView` desde `react-native-safe-area-context` con `edges={['top']}`. |

---

## 4. Evaluaciones y lecciones aprendidas

### Puntos Fuertes de la IA
* **Aceleración del Desarrollo**: generación instantánea de estructuras base de componentes y definiciones de tipos TypeScript.
* **Diseño Visual**: creación de estilos complejos con gradientes y temas oscuros con alta calidad estética.

### Áreas que Requirieron Supervisión Humana
* **Casos de Borde en Lógica de Negocio**: el cálculo de fechas, zonas horarias y rangos de rachas requiere validaciones matemáticas estrictas que la IA tiende a simplificar.
* **Gestión del Estado de Navegación**: la integración de animaciones basadas en gestos con la navegación de Expo Router necesita ajustes precisos de handlers para evitar conflictos.
* **Optimización de React Hooks**: las dependencias en `useCallback` y `useEffect` deben revisarse manualmente para garantizar el cumplimiento de las reglas de React Hooks.
