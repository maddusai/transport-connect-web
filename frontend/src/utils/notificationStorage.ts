export interface AppNotification {
  id: string
  title: string
  message: string
  type: 'LOAD' | 'QUOTATION' | 'TRIP' | 'PAYMENT' | 'SYSTEM'
  timestamp: string
  isRead: boolean
  actionLabel?: string
}

const NOTIFICATIONS_STORAGE_KEY = 'transport_connect_notifications'

const initialDemoNotifications: AppNotification[] = []

export function getNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(initialDemoNotifications))
      return initialDemoNotifications
    }
    return JSON.parse(raw)
  } catch (error) {
    console.error('Failed to load notifications:', error)
    return initialDemoNotifications
  }
}

export function markNotificationAsRead(id: string): AppNotification[] {
  const list = getNotifications().map((item) =>
    item.id === id ? { ...item, isRead: true } : item
  )
  localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(list))
  return list
}

export function markAllNotificationsAsRead(): AppNotification[] {
  const list = getNotifications().map((item) => ({ ...item, isRead: true }))
  localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(list))
  return list
}

export function clearAllNotifications(): AppNotification[] {
  localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify([]))
  return []
}

export function addNotification(
  notif: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>
): AppNotification[] {
  const newNotif: AppNotification = {
    ...notif,
    id: `NOTIF-${Date.now()}`,
    timestamp: 'Just now',
    isRead: false,
  }
  const updated = [newNotif, ...getNotifications()]
  localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated))
  return updated
}