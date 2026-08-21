# Better - Habit Tracker App 🚀

**Better** es una aplicación móvil moderna desarrollada con **React Native** y **Expo SDK 54** diseñada para acompañar a los usuarios en el desarrollo de hábitos constantes. Cuenta con seguimiento diario, cálculo de rachas (*streaks*), estadísticas mensuales, insignias de logros y una interfaz de alta calidad con estética **Dark Glassmorphism** animada mediante **React Native Reanimated**.

---

## 📱 Captura / Vista de la App Base en el Teléfono

```
+-----------------------------------------------------------+
|                   BETTER - APP BASE                       |
+-----------------------------------------------------------+
| [Tab: Dashboard]         [Tab: Historial]                 |
|                                                           |
|  * Tema Oscuro Premium (Glassmorphic UI)                  |
|  * Indicadores de Rachas (Streaks) & Anillos de Progreso  |
|  * Tarjetas Animadas con React Native Reanimated           |
|  * Transiciones Fluidas & Feedback Háptico               |
+-----------------------------------------------------------+
```

---

## ✨ Características Principales

* 📊 **Dashboard Diario**: Resumen dinámico del porcentaje de hábitos completados hoy con marcado rápido mediante un solo tap.
* ⚡ **Micro-interacciones y Animaciones Fluidas**: Respuestas con físicade resorte (*springs*) mediante React Native Reanimated y vibraciones táctiles con `expo-haptics`.
* 🏆 **Sistema de Logros y Gamificación**: Medallas e insignias desbloqueables automáticamente según las rachas de consistencia mantenidas.
* 📅 **Matriz de Consistencia de 30 Días**: Vista gráfica tipo contribución estilo GitHub para analizar el progreso de cada hábito individual.
* 📝 **Gestión Completa (CRUD)**: Creación y edición de hábitos especificando categoría, frecuencia, color distintivo e ícono.
* 🔒 **100% Offline-First**: Persistencia local segura mediante `@react-native-async-storage/async-storage` con latencia artificial de 500ms simulando consumo de red.

---

## 🛠️ Tecnologías Utilizadas

* **Framework Mobile**: React Native 0.81 / Expo SDK 54 (`~54.0.35`)
* **Navegación**: Expo Router v4 (`~6.0.24`)
* **Animaciones**: React Native Reanimated (`~4.1.1`)
* **Persistencia Local**: `@react-native-async-storage/async-storage` (`2.2.0`)
* **Gradientes y UI**: `expo-linear-gradient` (`~15.0.8`) y `@expo/vector-icons`
* **Feedback Físico**: `expo-haptics` (`~15.0.8`)
* **Lenguaje**: TypeScript (`~5.9.2`)

---

## 🚀 Instrucciones para Correr el Proyecto

### Prerrequisitos
* **Node.js**: Versión 18 o superior instalada.
* **Dispositivo Físico**: Aplicación **Expo Go** instalada en tu teléfono ([iOS en App Store](https://apps.apple.com/app/expo-go/id982107779) o [Android en Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)).
* **Opcional (Emuladores)**: Android Studio (para emulador de Android) o Xcode (para simulador de iOS en macOS).

### Paso 1: Clonar e Instalar Dependencias
```bash
# Entrar en la carpeta del proyecto
cd better

# Instalar todas las dependencias
npm install
```

### Paso 2: Iniciar el Servidor de Desarrollo Expo
```bash
npx expo start
```

### Paso 3: Abrir la Aplicación en tu Dispositivo

* **En Teléfono Físico**:
  1. Abre la aplicación **Expo Go** en tu dispositivo.
  2. Escanea el **código QR** que aparece en la terminal o navegador.
* **En Emulador Android**: Presiona la tecla `a` en la terminal donde corre Expo.
* **En Simulador iOS**: Presiona la tecla `i` en la terminal (requiere macOS con Xcode).
* **En Navegador Web**: Presiona la tecla `w` en la terminal.

---

## 📜 Scripts Disponibles

En el directorio del proyecto puedes ejecutar:

| Comando | Descripción |
|---|---|
| `npm start` | Inicia el servidor de desarrollo interactivo de Expo. |
| `npm run android` | Inicia la app intentando conectarse a un emulador de Android. |
| `npm run ios` | Inicia la app intentando conectarse al simulador de iOS. |
| `npm run web` | Inicia una versión de vista previa en el navegador web. |
| `npm run lint` | Ejecuta la verificación estática de ESLint en busca de errores. |

---

## 📚 Documentación del Proyecto

El repositorio cuenta con documentación exhaustiva organizada en los siguientes archivos:

* 📑 [spec.md](file:///c:/Users/lehen/Desktop/TP%20react%20native/better/spec.md): Especificación funcional, requerimientos y modelos de datos TypeScript.
* 📐 [plan.md](file:///c:/Users/lehen/Desktop/TP%20react%20native/better/plan.md): Plan de arquitectura, setup de skills y roadmap de desarrollo.
* 📋 [tasks.md](file:///c:/Users/lehen/Desktop/TP%20react%20native/better/tasks.md): Desglose detallado de las tareas T00 a T13 (prompts, IA y correcciones manuales).
* ⚙️ [proceso.md](file:///c:/Users/lehen/Desktop/TP%20react%20native/better/proceso.md): Proceso de interacción con la IA, matriz de correcciones manuales y lecciones aprendidas.
* 📄 [DOCUMENTACION.md](file:///c:/Users/lehen/Desktop/TP%20react%20native/better/DOCUMENTACION.md): Documento consolidado unificado.

---

## 📁 Estructura del Repositorio

```
better/
├── .agents/skills/          # Skills de desarrollo utilizadas
├── app/                     # Rutas y vistas de Expo Router
│   ├── (tabs)/              # Navegación por pestañas (Dashboard e Historial)
│   ├── habit/               # Rutas dinámicas ([id].tsx) y formulario (manage.tsx)
│   └── _layout.tsx          # Stack raíz de la aplicación
├── components/              # Componentes UI reutilizables
├── constants/               # Configuración de temas y colores
├── services/                # Capa de persistencia AsyncStorage
├── spec.md                  # Especificación funcional
├── plan.md                  # Plan de arquitectura
├── tasks.md                 # Tareas T00 - T13
├── proceso.md               # Proceso con la IA
└── README.md                # Instrucciones de ejecución
```
