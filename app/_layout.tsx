import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { notificationService } from '@/services/notifications/notificationService';
import { habitsService } from '@/services/habitsService';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const { isDark, colors } = useTheme();
  const router = useRouter();

  useEffect(() => {
    let unsubscribeNotifications: (() => void) | null = null;

    try {
      // Inicializar canales y sincronizar recordatorios de hábitos al inicio
      notificationService.init().then(() => {
        habitsService.fetchHabits().then((habits) => {
          notificationService.syncAllHabitReminders(habits).catch(() => {});
        }).catch(() => {});
      }).catch(() => {});

      // Manejar cuando el usuario toca una notificación en la barra de estado
      unsubscribeNotifications = notificationService.addNotificationResponseListener((habitId) => {
        router.push({
          pathname: '/habit/[id]',
          params: { id: habitId },
        });
      });
    } catch (e) {
      console.warn('Error inicializando notificaciones en RootLayout:', e);
    }

    return () => {
      unsubscribeNotifications?.();
    };
  }, [router]);

  return (
    <>
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: colors.background },
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutNav />
    </ThemeProvider>
  );
}

