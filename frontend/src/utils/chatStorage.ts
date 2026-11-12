export interface ChatMessage {
  id: string
  tripId: string
  senderId: string
  senderName: string
  senderRole: 'Customer' | 'Truck Owner' | 'Driver' | 'Transporter'
  text: string
  timestamp: string
}

export type ChatRole = 'Customer' | 'Truck Owner' | 'Driver' | 'Transporter'

const CHAT_STORAGE_KEY = 'transport_connect_trip_chats'

export function getTripMessages(tripId: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY)
    if (!raw) return []
    const allMessages: ChatMessage[] = JSON.parse(raw)
    return allMessages.filter((msg) => msg.tripId === tripId)
  } catch (error) {
    console.error('Failed to load chat messages:', error)
    return []
  }
}

export function sendTripMessage(
  tripId: string,
  senderId: string,
  senderName: string,
  senderRole: ChatRole,
  text: string
): ChatMessage {
  const newMessage: ChatMessage = {
    id: `MSG-${Date.now()}`,
    tripId,
    senderId,
    senderName,
    senderRole,
    text: text.trim(),
    timestamp: new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  }

  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY)
    const allMessages: ChatMessage[] = raw ? JSON.parse(raw) : []
    allMessages.push(newMessage)
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(allMessages))
  } catch (error) {
    console.error('Failed to save message:', error)
  }

  return newMessage
}