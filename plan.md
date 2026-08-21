# Plan de Arquitectura y Desarrollo (plan.md)

## 1. Plan de Arquitectura y Stack Tecnológico

El proyecto se diseñó utilizando una arquitectura modular limpia orientada a componentes y servicios desacoplados, aprovechando las capacidades del enrutador basado en archivos **Expo Router v4** en **Expo SDK 54**.

### Stack Tecnológico
* **Framework Mobile**: React Native 0.81 / Expo SDK 54 (`expo@~54.0.35`).
* **Enrutamiento y Navegación**: Expo Router (`expo-router@~6.0.24`).
* **Persistencia Local**: `@react-native-async-storage/async-storage@2.2.0`.
* **Animaciones e Interacciones**: React Native Reanimated (`react-native-reanimated@~4.1.1`).
* **Estética y UI**: `expo-linear-gradient` para gradientes Glassmorphic y `@expo/vector-icons` para iconografía.
* **Feedback Físico**: `expo-haptics` para respuestas táctiles.
* **Lenguaje**: TypeScript (`typescript@~5.9.2`) con verificación estricta de tipos.

---

## 2. Setup de Skills Utilizadas

Para garantizar que el desarrollo siguiera las mejores prácticas recomendadas por la comunidad y el ecosistema de Expo, se configuraron 3 skills principales en la carpeta `.agents/skills/`:

### 1. Skill `expo-router`
* **Propósito**: Proporcionar las convenciones actualizadas de navegación basada en la estructura de archivos en Expo SDK 54.
* **Aplicación en el Proyecto**:
  * Configuración del layout raíz en [app/_layout.tsx](file:///c:/Users/lehen/Desktop/TP%20react%20native/better/app/_layout.tsx) con la pila nativa `Stack`.
  * Definición de pestañas principales en [app/(tabs)/_layout.tsx](file:///c:/Users/lehen/Desktop/TP%20react%20native/better/app/(tabs)/_layout.tsx) (`index.tsx` para Dashboard e `history.tsx` para Historial).
  * Rutas dinámicas con parámetros en [app/habit/[id].tsx](file:///c:/Users/lehen/Desktop/TP%20react%20native/better/app/habit/[id].tsx).
  * Presentación modal fluida para el formulario en [app/habit/manage.tsx](file:///c:/Users/lehen/Desktop/TP%20react%20native/better/app/habit/manage.tsx) (`presentation: 'modal'`).

### 2. Skill `expo-data-fetching`
* **Propósito**: Guiar los patrones de arquitectura asíncrona, carga de datos local, manejo de estados de espera y captura de errores.
* **Aplicación en el Proyecto**:
  * Creación del servicio desacoplado [habitsService.ts](file:///c:/Users/lehen/Desktop/TP%20react%20native/better/services/habitsService.ts) con almacenamiento en `AsyncStorage`.
  * Inyección de una latencia artificial de 500ms (`await new Promise(res => setTimeout(res, 500))`) para simular condiciones reales de red.
  * Implementación de componentes de carga visual `SkeletonLoader` durante las peticiones asíncronas.

### 3. Skill `expo-project-structure`
* **Propósito**: Definir la organización de carpetas y modularidad del código fuente.
* **Aplicación en el Proyecto**:
  * `app/`: Contiene exclusivamente la definición de vistas y rutas.
  * `components/`: Componentes UI reutilizables (`HabitCard`, `SkeletonLoader`, etc.).
  * `services/`: Capa de datos y lógica de negocio pura.
  * `constants/`: Tema visual, colores y tokens de diseño.
  * `hooks/`: Custom hooks de React para utilidades transversales.

---

## 3. Estructura de Rutas y Archivos

```
better/
├── .agents/skills/            # Skills de desarrollo instaladas
│   ├── expo-data-fetching/
│   ├── expo-project-structure/
│   └── expo-router/
├── app/                       # Expo Router - Pantallas y Layouts
│   ├── (tabs)/
│   │   ├── _layout.tsx        # Navegación por pestañas (Dashboard / Historial)
│   │   ├── history.tsx        # Vista de Historial y Logros (T05 / T11)
│   │   └── index.tsx          # Vista de Dashboard Principal (T04 / T10)
│   ├── habit/
│   │   ├── [id].tsx           # Vista de Detalle del Hábito (T06 / T12)
│   │   └── manage.tsx         # Formulario Crear/Editar Hábito (T07 / T13)
│   └── _layout.tsx            # Root Stack Navigator
├── components/                # Componentes UI Reutilizables
│   ├── habit-card.tsx         # Tarjeta de hábito con Reanimated & Glassmorphism
│   ├── skeleton-loader.tsx    # Componente de estado de carga animado
│   └── ui/                    # Componentes base e iconografía
├── services/                  # Capa de Negocio y Datos
│   └── habitsService.ts       # Servicio AsyncStorage con latencia simulada
├── spec.md                    # Especificación del Producto
├── plan.md                    # Plan de Arquitectura
├── tasks.md                   # Desglose de Tareas T00 - T13
├── proceso.md                 # Proceso de interacción con la IA
└── README.md                  # Manual de Instalación y Ejecución
```

---

## 4. Roadmap de Implementación (Tareas T00 - T13)

* **Fase 1: Setup y Capa de Datos (T00 - T01)**: Instalación de dependencias base y desarrollo del servicio `habitsService.ts` con `AsyncStorage`.
* **Fase 2: Componentes Base y Navegación (T02 - T03)**: Creación de `SkeletonLoader`, `HabitCard` inicial y configuración del layout de Tabs.
* **Fase 3: Pantallas Funcionales (T04 - T07)**: Dashboard (`index.tsx`), Historial y Logros (`history.tsx`), Detalle (`[id].tsx`) y Formulario (`manage.tsx`).
* **Fase 4: Refactorización y Linter (T08)**: Solución de advertencias de Hooks y optimizaciones de estado.
* **Fase 5: Rediseño UI/UX Premium Glassmorphism (T09 - T13)**: Integración de React Native Reanimated, animaciones con físicas de resorte (*spring*), soporte responsivo y limpieza final de código.

---

## 5. Estrategia de Verificación y Control de Calidad

1. **Verificación Estática (Linter & TypeScript)**:
   * Ejecución continuada de `expo lint` y validación del compilador de TypeScript (`npx tsc`) para descartar advertencias e importaciones sin uso.
2. **Pruebas de Rendimiento UI**:
   * Confirmación de animaciones ejecutadas a 60/120fps en el hilo nativo de UI utilizando `react-native-reanimated`.
3. **Pruebas de Resiliency y Safe Area**:
   * Verificación del comportamiento del formulario con el teclado activo (`KeyboardAvoidingView`) y comprobación de márgenes en dispositivos con notch utilizando `SafeAreaView`.
