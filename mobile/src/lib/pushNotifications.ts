/**
 * iBorcuha mobile — Push notifications (Expo)
 *
 * - Регистрация permission + получение Expo push token
 * - Отправка токена на бэк через /push/register-token
 * - Обработчики foreground / background / tap → навигация на нужный экран
 */
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import Constants from 'expo-constants'
import { api } from './apiClient'

// Foreground display policy
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export interface PushPayload {
  title?: string
  body?: string
  data?: {
    url?: string // iborcuha://... — deep link
    type?: string
    [k: string]: unknown
  }
}

/**
 * Регистрация push-уведомлений: permission + токен + отправка на бэк.
 * Идемпотентно: повторный вызов просто обновит токен в БД.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('Push только на реальных устройствах')
    return null
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FFFFFF',
    })
  }

  const { status: existing } = await Notifications.getPermissionsAsync()
  let finalStatus = existing
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }
  if (finalStatus !== 'granted') return null

  const projectId =
    (Constants.expoConfig as { extra?: { eas?: { projectId?: string } } } | undefined)?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId
  const tokenResponse = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)
  const token = tokenResponse.data

  try {
    await api.registerPushToken(token, Platform.OS === 'ios' ? 'ios' : 'android')
  } catch (err) {
    console.warn('push token register failed:', err)
  }

  return token
}

export async function unregisterPushToken(token: string | null): Promise<void> {
  if (!token) return
  try { await api.unregisterPushToken(token) } catch { /* ignore */ }
}

/**
 * Подписывается на notification-события и дергает навигатор при тапе.
 * Возвращает функцию отписки (для useEffect cleanup).
 */
export function subscribeToNotificationTaps(
  onTap: (payload: PushPayload) => void,
): () => void {
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const content = response.notification.request.content
    onTap({
      title: content.title ?? undefined,
      body: content.body ?? undefined,
      data: (content.data ?? {}) as PushPayload['data'],
    })
  })
  return () => sub.remove()
}
