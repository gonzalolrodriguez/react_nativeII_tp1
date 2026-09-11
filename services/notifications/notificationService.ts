import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Habit } from '@/types/habit';

export const CHANNEL_ID = 'habit-reminders';

// Determina si la app se está ejecutando dentro del cliente Expo Go
const isExpoGo = (): boolean => {
  try {
    if (typeof isRunningInExpoGo === 'function' && isRunningInExpoGo()) {
      return true;
    }
  } catch {}
  try {
    if (Constants?.executionEnvironment === ExecutionEnvironment.StoreClient) {
      return true;
    }
  } catch {}
  try {
    if ((Constants as any)?.appOwnership === 'expo') {
      return true;
    }
  } catch {}
  return false;
};

// Carga dinámica y segura del módulo nativo:
// A partir de SDK 53, expo-notifications en Android dentro de Expo Go lanza una excepción fatal
// (warnOfExpoGoPushUsage) indicando que debe usarse un Development Build (EAS Build / npx expo run:android).
// Verificando `isExpoGo()` antes del require evitamos que se dispare el error en Expo Go.
let NotificationsModule: typeof import('expo-notifications') | null = null;
let isChecked = false;

const getNotifications = (): typeof import('expo-notifications') | null => {
  if (isChecked) return NotificationsModule;
  isChecked = true;

  if (Platform.OS === 'web') return null;

  // En Android con Expo Go, omitir require para no disparar el crash fatal de SDK 53
  if (Platform.OS === 'android' && isExpoGo()) {
    console.info(
      '[notificationService] Expo Go en Android detectado: Notificaciones locales desactivadas en Expo Go (SDK 53+). Se activarán automáticamente en Development Build o APK/AAB de producción.'
    );
    return null;
  }

  try {
    const mod = require('expo-notifications');
    NotificationsModule = mod;
    return mod;
  } catch (error) {
    console.warn(
      '[notificationService] Módulo expo-notifications no disponible en este runtime.',
      error
    );
    return null;
  }
};

export const notificationService = {
  /**
   * Inicializa canales y manejador de notificaciones de forma segura
   */
  init: async (): Promise<boolean> => {
    const Notifications = getNotifications();
    if (!Notifications) return false;

    try {
      try {
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });
      } catch (handlerErr) {
        console.warn('No se pudo registrar setNotificationHandler:', handlerErr);
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
          name: 'Recordatorios de Hábitos',
          description: 'Avisos para mantener tu disciplina y cumplir tus hábitos a horario',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#6366F1',
          sound: 'default',
        });
      }

      return true;
    } catch (error) {
      console.warn('Error inicializando canal de notificaciones', error);
      return false;
    }
  },

  /**
   * Solicita permisos de notificación al usuario
   */
  requestPermissions: async (): Promise<boolean> => {
    const Notifications = getNotifications();
    if (!Notifications) return false;

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch (error) {
      console.warn('Error solicitando permisos de notificación', error);
      return false;
    }
  },

  /**
   * Registra listener para cuando el usuario toca una notificación en la barra de estado
   */
  addNotificationResponseListener: (callback: (habitId: string) => void): (() => void) => {
    const Notifications = getNotifications();
    if (!Notifications || typeof Notifications.addNotificationResponseReceivedListener !== 'function') {
      return () => {};
    }

    try {
      const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
        const habitId = response?.notification?.request?.content?.data?.habitId;
        if (habitId) {
          callback(String(habitId));
        }
      });
      return () => subscription.remove();
    } catch (error) {
      console.warn('Error suscribiendo listener de notificación', error);
      return () => {};
    }
  },

  /**
   * Cancela los recordatorios programados para un hábito específico
   */
  cancelHabitReminder: async (habitId: string): Promise<void> => {
    const Notifications = getNotifications();
    if (!Notifications) return;

    try {
      const scheduledList = await Notifications.getAllScheduledNotificationsAsync();
      const habitNotifications = scheduledList.filter(
        (n) => n.content?.data?.habitId === habitId
      );

      for (const item of habitNotifications) {
        await Notifications.cancelScheduledNotificationAsync(item.identifier);
      }
    } catch (error) {
      console.warn(`Error cancelando notificaciones para el hábito ${habitId}`, error);
    }
  },

  /**
   * Programa recordatorios locales recurrentes para un hábito según su horario y frecuencia
   */
  scheduleHabitReminder: async (habit: Habit): Promise<string[]> => {
    const Notifications = getNotifications();
    if (!Notifications) return [];

    if (!habit.reminderTime || !habit.reminderTime.includes(':')) {
      await notificationService.cancelHabitReminder(habit.id);
      return [];
    }

    try {
      await notificationService.cancelHabitReminder(habit.id);

      const hasPermission = await notificationService.requestPermissions();
      if (!hasPermission) {
        console.log('Permisos de notificación no otorgados');
        return [];
      }

      await notificationService.init();

      const [hourStr, minuteStr] = habit.reminderTime.split(':');
      const hour = parseInt(hourStr, 10);
      const minute = parseInt(minuteStr, 10);

      if (isNaN(hour) || isNaN(minute)) return [];

      const scheduledIds: string[] = [];
      const title = `⏰ ${habit.name}`;
      const timeRangeText = habit.reminderEndTime
        ? `${habit.reminderTime} - ${habit.reminderEndTime}`
        : habit.reminderTime;
      const body = `Momento de cumplir tu hábito (${timeRangeText}). ¡Mantené tu racha viva! 🔥`;

      // 1. Frecuencia diaria
      if (habit.frequency === 'daily') {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            data: { habitId: habit.id, type: 'habit_reminder' },
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour,
            minute,
            channelId: CHANNEL_ID,
          },
        });
        scheduledIds.push(id);
      }
      // 2. Días personalizados (customDays: 0 = Dom, 1 = Lun, ..., 6 = Sáb)
      else if (habit.frequency === 'custom' && habit.customDays && habit.customDays.length > 0) {
        for (const dayOfWeek of habit.customDays) {
          const expoWeekday = dayOfWeek + 1;
          const id = await Notifications.scheduleNotificationAsync({
            content: {
              title,
              body,
              data: { habitId: habit.id, type: 'habit_reminder' },
              sound: true,
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
              weekday: expoWeekday,
              hour,
              minute,
              channelId: CHANNEL_ID,
            },
          });
          scheduledIds.push(id);
        }
      }
      // 3. Semanal (día de creación)
      else if (habit.frequency === 'weekly') {
        const createdDayOfWeek = new Date(habit.createdAt).getDay();
        const expoWeekday = createdDayOfWeek + 1;
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            data: { habitId: habit.id, type: 'habit_reminder' },
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: expoWeekday,
            hour,
            minute,
            channelId: CHANNEL_ID,
          },
        });
        scheduledIds.push(id);
      }

      return scheduledIds;
    } catch (error) {
      console.warn(`Error programando recordatorio para el hábito ${habit.name}`, error);
      return [];
    }
  },

  /**
   * Sincroniza todos los recordatorios para la lista actual de hábitos
   */
  syncAllHabitReminders: async (habits: Habit[]): Promise<void> => {
    const Notifications = getNotifications();
    if (!Notifications) return;

    try {
      await Notifications.cancelAllScheduledNotificationsAsync();

      for (const habit of habits) {
        if (habit.reminderTime) {
          await notificationService.scheduleHabitReminder(habit);
        }
      }
    } catch (error) {
      console.warn('Error sincronizando todas las notificaciones', error);
    }
  },

  /**
   * Dispara una notificación de prueba inmediata
   */
  sendTestNotification: async (title: string, body: string): Promise<string | null> => {
    const Notifications = getNotifications();
    if (!Notifications) return null;

    try {
      const hasPermission = await notificationService.requestPermissions();
      if (!hasPermission) return null;

      await notificationService.init();

      return await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
        },
        trigger: {
          channelId: CHANNEL_ID,
        },
      });
    } catch (error) {
      console.warn('Error enviando notificación de prueba', error);
      return null;
    }
  },
};
