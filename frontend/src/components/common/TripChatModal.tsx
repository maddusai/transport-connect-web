import { useState, useEffect, useRef } from 'react'
import {
  X,
  Send,
  MessageSquare,
  Truck,
  Phone,
  CheckCheck,
} from 'lucide-react'
import type { ChatMessage, ChatRole } from '../../utils/chatStorage'
import { apiClient, getAuthToken, getCurrentUser } from '../../services/apiClient'
import { getTripMessages, sendTripMessage } from '../../utils/chatStorage'

interface TripChatModalProps {
  isOpen: boolean
  onClose: () => void
  tripId: string
  bookingId: string
  route: string
  currentUserId: string
  currentUserName: string
  currentUserRole: ChatRole
  counterpartName?: string
  counterpartPhone?: string
}

export default function TripChatModal({
  isOpen,
  onClose,
  tripId,
  bookingId,
  route,
  currentUserId,
  currentUserName,
  currentUserRole,
  counterpartName = 'Driver / Fleet Contact',
  counterpartPhone = '+91 98765 43210',
}: TripChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      setMessages(getTripMessages(tripId))
    }
  }, [isOpen, tripId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!isOpen) return null

  const handleSend = (textToSend?: string) => {
    const msg = textToSend || inputText
    if (!msg.trim()) return

    const sent = sendTripMessage(
      tripId,
      currentUserId,
      currentUserName,
      currentUserRole,
      msg
    )

    setMessages((prev) => [...prev, sent])
    if (!textToSend) setInputText('')
  }

  const quickReplies = [
    'Where is the vehicle right now?',
    'Goods loaded and dispatched.',
    'Arrived at the pickup location.',
    'Expected to reach in 1 hour.',
  ]

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm sm:p-5">
      <div className="flex h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <MessageSquare size={21} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900">{counterpartName}</h3>
                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Online
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Trip: <span className="font-semibold text-slate-700">{bookingId}</span> · {route}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`tel:${counterpartPhone}`}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              <Phone size={14} className="text-emerald-600" /> Call
            </a>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-4 sm:p-6">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Truck size={28} />
              </div>
              <h4 className="mt-3 font-bold text-slate-800">Trip Communication Room</h4>
              <p className="mt-1 max-w-xs text-xs text-slate-500">
                Send messages directly to discuss pickup, route delays or delivery updates.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === currentUserId
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <span className="mb-1 text-[11px] font-semibold text-slate-400">
                    {msg.senderName} ({msg.senderRole})
                  </span>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                      isMe
                        ? 'rounded-tr-none bg-blue-600 text-white'
                        : 'rounded-tl-none border border-slate-200 bg-white text-slate-800'
                    }`}
                  >
                    <p className="leading-relaxed">{msg.text}</p>
                    <div
                      className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                        isMe ? 'text-blue-100' : 'text-slate-400'
                      }`}
                    >
                      <span>{msg.timestamp}</span>
                      {isMe && <CheckCheck size={13} />}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-slate-100 bg-white px-4 py-2">
          <div className="flex gap-2 overflow-x-auto py-1">
            {quickReplies.map((reply, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(reply)}
                className="whitespace-nowrap rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600 hover:bg-blue-50 hover:text-blue-600"
              >
                {reply}
              </button>
            ))}
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex items-center gap-2 border-t border-slate-200 bg-white p-3 sm:p-4"
        >
          <input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message here..."
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  )
}
