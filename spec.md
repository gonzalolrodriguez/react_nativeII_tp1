# Especificación Funcional y Técnica (spec.md)

## 1. Visión General del Producto

**Better** es una aplicación móvil desarrollada con **React Native** y **Expo SDK 54**, diseñada para ayudar a los usuarios a construir hábitos saludables, mantener la disciplina diaria y visualizar su progreso a través de un sistema moderno, intuitivo y con gamificación.

La aplicación ofrece un seguimiento de consistencia diario, cálculo automatizado de rachas (*streaks*), métricas mensuales, insignias de logros y una interfaz responsiva con estética **Dark Glassmorphism** animada mediante **React Native Reanimated**.

---

## 2. Requerimientos Funcionales

### RF-01: Gestión de Hábitos (CRUD)
* **Creación**: El usuario puede registrar un nuevo hábito especificando nombre, descripción opcional, categoría (Salud, Productividad, Bienestar, Estudio, Fitness, Otro), frecuencia (Diaria, Semanal), color distintivo e ícono.
* **Edición**: El usuario puede modificar los detalles de cualquier hábito existente a través del formulario de gestión (`/habit/manage`).
* **Eliminación**: Posibilidad de eliminar hábitos desde la pantalla de detalle (`/habit/[id]`), borrando también su historial asociado.

### RF-02: Registro de Consistencia Diario
* **Marcado Rápido**: Desde el Dashboard principal (`/`), el usuario puede marcar o desmarcar un hábito completado para el día de hoy con un solo tap.
* **Feedback Háptico**: Cada marcación activa una vibración táctil imperceptible (`expo-haptics`) y una animación de resorte con `react-native-reanimated`.
* **Historial Diario**: Registro persistente en almacenamiento local (`AsyncStorage`) indexado por fecha en formato `YYYY-MM-DD`.

### RF-03: Dashboard Principal (Home)
* **Saludo Dinámico y Fecha**: Encabezado personalizado según la hora del día y la fecha actual formateada.
* **Resumen de Progreso**: Indicador de porcentaje global de hábitos completados hoy (ej: "3 de 5 hábitos completados - 60%").
* **Lista Adaptativa**: Tarjetas de hábitos renderizadas dinámicamente con animaciones al presionar y estados de carga tipo *Skeleton*.

### RF-04: Historial Mensual y Sistema de Logros (Gamificación)
* **Visualización Mensual**: Selector de mes para consultar el porcentaje global de consistencia histórica.
* **Logros Desbloqueables**: Sistema automático que calcula insignias basadas en el desempeño del usuario:
  * 🌟 **Primer Paso**: Completar el primer hábito.
  * 🔥 **En Racha (7 Días)**: Mantener una racha ininterrumpida de 7 días en al menos 1 hábito.
  * ⚡ **Invencible (30 Días)**: Alcanzar 30 días de consistencia consecutiva.
  * 🏆 **Maestro de la Rutina**: Crear y mantener más de 3 hábitos activos.

### RF-05: Detalle Analítico por Hábito
* **Ficha Técnica**: Accesible tocando cualquier tarjeta de hábito (`/habit/[id]`).
* **Métricas Clave**: Racha actual, racha máxima histórica y total de días completados.
* **Anillo Visual de Progreso**: Indicador gráfico con gradientes del porcentaje alcanzado en el mes.
* **Matriz de Consistencia de 30 Días**: Cuadrícula interactiva de 7 columnas que representa la actividad diaria de los últimos 30 días (estilo matriz de aportes GitHub).

---

## 3. Requerimientos No Funcionales

* **RNF-01 (Rendimiento Nivel Nativo)**: Las animaciones del botón de chequeo y la escala de tarjetas deben ejecutarse a 60/120 fps en el hilo nativo mediante React Native Reanimated.
* **RNF-02 (Persistencia Offline First)**: Todos los datos se almacenan localmente con `@react-native-async-storage/async-storage`. No requiere conexión a internet para funcionar.
* **RNF-03 (UI/UX Dark Glassmorphic)**: Paleta de colores oscura (`#0A0D14` fondo base, tarjetas con transparencia `#161B26` y bordes sutiles `#2A324B`), tipografía limpia y gradientes de `expo-linear-gradient`.
* **RNF-04 (Compatibilidad y Safe Area)**: Adaptación responsiva para distintas resoluciones de pantalla y prevención de solapamientos con el notch/barra de estado usando `react-native-safe-area-context`.

---

## 4. Modelos de Datos (TypeScript)

```typescript
// Entidad Principal: Hábito
export interface Habit {
  id: string;
  name: string;
  description?: string;
  category: 'Salud' | 'Productividad' | 'Bienestar' | 'Estudio' | 'Fitness' | 'Otro';
  frequency: 'Diaria' | 'Semanal';
  color: string;
  icon: string;
  createdAt: string;
}

// Entidad: Log de Consistencia
export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // Formato YYYY-MM-DD
  completed: boolean;
}

// Entidad: Logro / Badge
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}
```

---

## 5. Prompts Utilizados para Generar la Especificación y Correcciones

### Prompt de Especificación Enviado a la IA
> *"Actúa como un Lead Product Manager y Arquitecto Mobile. Diseña la especificación completa para una app de seguimiento de hábitos llamada 'Better' usando Expo SDK 54, React Native y TypeScript. La app debe incluir gestión de hábitos (crear, editar, eliminar), registro de consistencia diario, tablero principal (Dashboard), historial mensual con cálculo de logros y detalle analítico por hábito. Requiere persistencia local mediante AsyncStorage."*

### Correcciones Aplicadas sobre la Propuesta Inicial de la IA
1. **Modelado de Logs de Consistencia**: La IA propuso guardar las fechas como una lista simple de strings dentro del objeto `Habit`. Se corrigió para crear la entidad desacoplada `HabitLog` indexada por `habitId` y `date`, permitiendo consultas eficientes de historial mensual sin modificar el esquema del hábito.
2. **Cálculo de Rachas**: La IA sugería comparar solo días del mes actual. Se redefinió la especificación para evaluar rachas continuas inter-mensuales cruzando años y meses correctamente.
