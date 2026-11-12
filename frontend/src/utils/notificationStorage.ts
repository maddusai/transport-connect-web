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

const initialDemoNotifications: AppNotification[] = [
  {
    id: 'NOTIF-101',
    title: 'New Quotation Received',
    message: 'Sai Transport Agency submitted a quote of ₹27,500 for Load LD1001 (Hyderabad → Bangalore).',
    type: 'QUOTATION',
    timestamp: '10 mins ago',
    isRead: false,
    actionLabel: 'Review Quote',
  },
  {
    id: 'NOTIF-102',
    title: 'Trip Started — GPS Active',
    message: 'Driver Ramesh Kumar started trip TRP-84920 with vehicle TS 09 AB 1234.',
    type: 'TRIP',
    timestamp: '1 hour ago',
    isRead: false,
    actionLabel: 'Track Live',
  },
  {
    id: 'NOTIF-103',
    title: 'Driver Verification Approved',
    message: 'Self-registered driver Suresh Reddy (AP-2021-234567) has been approved by Admin.',
    type: 'SYSTEM',
    timestamp: '3 hours ago',
    isRead: true,
  },
  {
    id: 'NOTIF-104',
    title: 'Payment Proof Uploaded',
    message: 'Customer uploaded UTR proof for Booking BK-10492 (₹28,000). Awaiting verification.',
    type: 'PAYMENT',
    timestamp: 'Yesterday',
    isRead: true,
    actionLabel: 'Verify Slip',
  },
]

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