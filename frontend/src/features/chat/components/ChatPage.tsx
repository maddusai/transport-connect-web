import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  CheckCheck,
  FileText,
  Image as ImageIcon,
  MessageCircle,
  MoreVertical,
  Paperclip,
  Phone,
  Search,
  Send,
  Smile,
  Truck,
  Video,
  X,
} from 'lucide-react'

type ChatMessage = {
  id: string
  text: string
  time: string
  sender: 'me' | 'them'
  read?: boolean
  attachmentName?: string
}

type ChatContact = {
  id: string
  name: string
  role: string
  avatar: string
  online: boolean
  lastSeen: string
  bookingId: string
  route: string
  unread: number
  messages: ChatMessage[]
}

const STORAGE_KEY = 'transport_connect_demo_chats'

const initialContacts: ChatContact[] = [
  {
    id: 'owner-1',
    name: 'Ravi Kumar',
    role: 'Truck Owner',
    avatar: 'RK',
    online: true,
    lastSeen: 'Online',
    bookingId: 'TC-BOOK-1024',
    route: 'Hyderabad → Vijayawada',
    unread: 2,
    messages: [
      { id: 'm1', text: 'Hello! I have received your load request.', time: '10:20 AM', sender: 'them' },
      { id: 'm2', text: 'The truck is available for tomorrow morning.', time: '10:21 AM', sender: 'them' },
      { id: 'm3', text: 'Thank you. What time can loading start?', time: '10:24 AM', sender: 'me', read: true },
      { id: 'm4', text: 'We can reach the pickup point by 8:00 AM.', time: '10:26 AM', sender: 'them' },
    ],
  },
  {
    id: 'driver-2',
    name: 'Suresh Reddy',
    role: 'Assigned Driver',
    avatar: 'SR',
    online: false,
    lastSeen: 'Last seen 9:42 AM',
    bookingId: 'TC-BOOK-1018',
    route: 'KPHB → Guntur',
    unread: 0,
    messages: [
      { id: 'm5', text: 'I have started towards the loading location.', time: 'Yesterday', sender: 'them' },
      { id: 'm6', text: 'Please share your expected arrival time.', time: 'Yesterday', sender: 'me', read: true },
    ],
  },
  {
    id: 'transporter-3',
    name: 'Lakshmi Logistics',
    role: 'Transporter',
    avatar: 'LL',
    online: true,
    lastSeen: 'Online',
    bookingId: 'TC-LOAD-0992',
    route: 'Chennai → Bengaluru',
    unread: 0,
    messages: [
      { id: 'm7', text: 'Quotation shared. Please review the price.', time: 'Yesterday', sender: 'them' },
    ],
  },
]

function readContacts(): ChatContact[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) as ChatContact[] : initialContacts
  } catch {
    return initialContacts
  }
}

function currentTime() {
  return new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ChatPage({ onBack }: { onBack?: () => void }) {
  const [contacts, setContacts] = useState<ChatContact[]>(readContacts)
  const [activeContactId, setActiveContactId] = useState<string>(initialContacts[0].id)
  const [search, setSearch] = useState('')
  const [messageText, setMessageText] = useState('')
  const [mobileChatOpen, setMobileChatOpen] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  const activeContact = contacts.find((contact) => contact.id === activeContactId) ?? contacts[0]

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts))
    } catch {
      // Demo chat remains usable for the current session if storage is unavailable.
    }
  }, [contacts])

  const filteredContacts = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return contacts
    return contacts.filter((contact) =>
      [contact.name, contact.role, contact.bookingId, contact.route]
        .some((value) => value.toLowerCase().includes(query)),
    )
  }, [contacts, search])

  const openConversation = (contactId: string) => {
    setActiveContactId(contactId)
    setMobileChatOpen(true)
    setContacts((current) =>
      current.map((contact) =>
        contact.id === contactId ? { ...contact, unread: 0 } : contact,
      ),
    )
  }

  const sendMessage = () => {
    const text = messageText.trim()
    if (!text || !activeContact) return

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      text,
      time: currentTime(),
      sender: 'me',
      read: false,
    }

    setContacts((current) =>
      current.map((contact) =>
        contact.id === activeContact.id
          ? { ...contact, messages: [...contact.messages, newMessage] }
          : contact,
      ),
    )
    setMessageText('')
  }

  const handleAttachment = () => {
    window.alert('File sharing will be connected to secure backend storage in the next phase.')
  }

  if (!activeContact) {
    return (
      <div className="flex min-h-[520px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <div>
          <MessageCircle className="mx-auto text-blue-600" size={42} />
          <h2 className="mt-4 text-xl font-bold text-slate-900">No conversations yet</h2>
          <p className="mt-2 text-sm text-slate-500">Your booking-related conversations will appear here.</p>
        </div>
      </div>
    )
  }

  return (
    <section className="w-full">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" aria-label="Go back">
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Messages</h2>
            <p className="mt-1 text-sm text-slate-500">Chat with customers, truck owners, transporters and drivers.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
          <span className="h-2 w-2 rounded-full bg-blue-600" />
          Demo chat
        </div>
      </div>

      <div className="grid h-[680px] min-h-[560px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[330px_minmax(0,1fr)]">
        <aside className={`${mobileChatOpen ? 'hidden lg:flex' : 'flex'} min-h-0 flex-col border-r border-slate-200`}>
          <div className="border-b border-slate-100 p-4">
            <div className="relative">
              <Search size={17} className="absolute left-3 top-3.5 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search people or booking..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="px-4 pb-2 pt-4 text-xs font-bold uppercase tracking-wide text-slate-400">
              Recent conversations
            </div>
            {filteredContacts.map((contact) => {
              const lastMessage = contact.messages[contact.messages.length - 1]
              const selected = contact.id === activeContactId
              return (
                <button
                  key={contact.id}
                  onClick={() => openConversation(contact.id)}
                  className={`flex w-full items-start gap-3 border-b border-slate-100 px-4 py-4 text-left transition hover:bg-slate-50 ${selected ? 'bg-blue-50/70' : 'bg-white'}`}
                >
                  <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                    {contact.avatar}
                    {contact.online && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-slate-900">{contact.name}</p>
                      <span className="shrink-0 text-[10px] text-slate-400">{lastMessage?.time}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-blue-600">{contact.role}</p>
                    <p className="mt-1 truncate text-xs text-slate-500">{lastMessage?.text ?? 'Start a conversation'}</p>
                    <p className="mt-1 truncate text-[10px] text-slate-400">{contact.bookingId}</p>
                  </div>
                  {contact.unread > 0 && (
                    <span className="mt-5 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
                      {contact.unread}
                    </span>
                  )}
                </button>
              )
            })}
            {filteredContacts.length === 0 && (
              <div className="px-5 py-12 text-center text-sm text-slate-500">No conversations match your search.</div>
            )}
          </div>
        </aside>

        <div className={`${mobileChatOpen ? 'flex' : 'hidden lg:flex'} min-h-0 min-w-0 flex-col`}>
          <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button onClick={() => setMobileChatOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden" aria-label="Back to conversations">
                <ArrowLeft size={18} />
              </button>
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                {activeContact.avatar}
                {activeContact.online && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />}
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-sm font-bold text-slate-900">{activeContact.name}</h3>
                <p className="text-xs text-slate-500">{activeContact.online ? 'Online' : activeContact.lastSeen}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => window.alert('Voice calling will be available after backend integration.')} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Voice call"><Phone size={18} /></button>
              <button onClick={() => window.alert('Video calling will be available after backend integration.')} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Video call"><Video size={18} /></button>
              <button onClick={() => setShowInfo((value) => !value)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Conversation information"><MoreVertical size={18} /></button>
            </div>
          </header>

          {showInfo && (
            <div className="border-b border-blue-100 bg-blue-50 px-5 py-3 text-xs text-blue-900">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold">Booking details</p>
                  <p className="mt-1">{activeContact.bookingId} · {activeContact.route}</p>
                </div>
                <button onClick={() => setShowInfo(false)} aria-label="Close booking details"><X size={16} /></button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5 text-xs text-slate-600 sm:px-6">
            <Truck size={15} className="text-blue-600" />
            <span className="font-semibold">{activeContact.bookingId}</span>
            <span className="text-slate-300">•</span>
            <span className="truncate">{activeContact.route}</span>
            <button onClick={() => setShowInfo((value) => !value)} className="ml-auto font-semibold text-blue-600 hover:underline">View details</button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/70 px-4 py-5 sm:px-6">
            <div className="mx-auto w-fit rounded-full bg-white px-3 py-1.5 text-[10px] font-medium text-slate-400 shadow-sm">
              Messages related to this booking
            </div>
            {activeContact.messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm sm:max-w-[72%] ${message.sender === 'me' ? 'rounded-br-md bg-blue-600 text-white' : 'rounded-bl-md border border-slate-100 bg-white text-slate-800'}`}>
                  {message.attachmentName && (
                    <div className="mb-2 flex items-center gap-2 rounded-lg bg-black/5 p-2 text-xs">
                      <FileText size={16} /> {message.attachmentName}
                    </div>
                  )}
                  <p className="whitespace-pre-wrap break-words text-sm">{message.text}</p>
                  <div className={`mt-1.5 flex items-center justify-end gap-1 text-[10px] ${message.sender === 'me' ? 'text-blue-100' : 'text-slate-400'}`}>
                    {message.time}
                    {message.sender === 'me' && <CheckCheck size={13} className={message.read ? 'text-cyan-200' : 'text-blue-200'} />}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault()
              sendMessage()
            }}
            className="border-t border-slate-200 bg-white p-3 sm:p-4"
          >
            <div className="flex items-end gap-2">
              <button type="button" onClick={handleAttachment} className="mb-1 rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Attach file"><Paperclip size={19} /></button>
              <button type="button" onClick={handleAttachment} className="mb-1 hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 sm:block" aria-label="Attach image"><ImageIcon size={19} /></button>
              <div className="flex min-w-0 flex-1 items-end rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-blue-500 focus-within:bg-white">
                <textarea
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      sendMessage()
                    }
                  }}
                  rows={1}
                  placeholder="Type your message..."
                  className="max-h-28 min-h-8 flex-1 resize-y bg-transparent py-1 text-sm outline-none"
                />
                <button type="button" onClick={() => setMessageText((value) => `${value} `)} className="mb-1 rounded-lg p-1 text-slate-400 hover:text-blue-600" aria-label="Add space"><Smile size={18} /></button>
              </div>
              <button
                type="submit"
                disabled={!messageText.trim()}
                className="mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                aria-label="Send message"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="mt-2 pl-11 text-[10px] text-slate-400">Enter to send · Shift + Enter for a new line</p>
          </form>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
        <strong>Frontend demo:</strong> Messages are saved in this browser only. Real-time delivery, secure attachments, read receipts, calls and cross-device chat will be connected through the backend later.
      </div>
    </section>
  )
}
