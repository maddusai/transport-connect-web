import { useState, useMemo } from 'react'
import {
  Bell,
  CheckCheck,
  Trash2,
  Package,
  FileText,
  Truck,
  Wallet,
  ShieldCheck,
  Search,
  CircleDot,
} from 'lucide-react'
import type { AppNotification } from '../../../utils/notificationStorage'
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearAllNotifications,
} from '../../../utils/notificationStorage'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<AppNotification[]>(getNotifications)
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  )

  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return notifications.filter((item) => {
      const matchesFilter = filter === 'ALL' || !item.isRead
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.message.toLowerCase().includes(q)
      return matchesFilter && matchesSearch
    })
  }, [notifications, filter, searchQuery])

  const handleMarkRead = (id: string) => {
    setNotifications(markNotificationAsRead(id))
  }

  const handleMarkAllRead = () => {
    setNotifications(markAllNotificationsAsRead())
  }

  const handleClearAll = () => {
    if (window.confirm('Clear all notifications from browser storage?')) {
      setNotifications(clearAllNotifications())
    }
  }

  const getIconByType = (type: AppNotification['type']) => {
    switch (type) {
      case 'LOAD':
        return { icon: Package, style: 'bg-blue-50 text-blue-600' }
      case 'QUOTATION':
        return { icon: FileText, style: 'bg-amber-50 text-amber-600' }
      case 'TRIP':
        return { icon: Truck, style: 'bg-emerald-50 text-emerald-600' }
      case 'PAYMENT':
        return { icon: Wallet, style: 'bg-purple-50 text-purple-600' }
      default:
        return { icon: ShieldCheck, style: 'bg-slate-100 text-slate-700' }
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
            <Bell size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">Notifications</h2>
              {unreadCount > 0 && (
                <span className="rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-bold text-white">
                  {unreadCount} new
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Stay updated on loads, quotations, live trips and payment verifications.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <CheckCheck size={15} className="text-blue-600" /> Mark all read
          </button>
          <button
            onClick={handleClearAll}
            disabled={notifications.length === 0}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 size={15} /> Clear all
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={17} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notifications..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex rounded-xl bg-slate-100 p-1">
          <button
            onClick={() => setFilter('ALL')}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition ${
              filter === 'ALL'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('UNREAD')}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition ${
              filter === 'UNREAD'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {filteredList.length === 0 ? (
          <div className="p-12 text-center">
            <Bell size={36} className="mx-auto text-slate-300" />
            <h4 className="mt-3 font-bold text-slate-800">No notifications here</h4>
            <p className="mt-1 text-xs text-slate-500">
              {filter === 'UNREAD'
                ? 'You have read all your notifications.'
                : 'New alerts for trips, quotes and payments will appear here.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredList.map((item) => {
              const { icon: Icon, style } = getIconByType(item.type)
              return (
                <div
                  key={item.id}
                  onClick={() => !item.isRead && handleMarkRead(item.id)}
                  className={`flex cursor-pointer items-start gap-4 p-5 transition ${
                    item.isRead ? 'bg-white hover:bg-slate-50/70' : 'bg-blue-50/40 hover:bg-blue-50/70'
                  }`}
                >
                  <div className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${style}`}>
                    <Icon size={20} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className={`text-sm font-bold ${item.isRead ? 'text-slate-800' : 'text-slate-950'}`}>
                        {item.title}
                      </h4>
                      <span className="text-[11px] font-medium text-slate-400">
                        {item.timestamp}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">
                      {item.message}
                    </p>
                    {item.actionLabel && (
                      <span className="mt-2.5 inline-block text-xs font-semibold text-blue-600 hover:underline">
                        {item.actionLabel} →
                      </span>
                    )}
                  </div>

                  {!item.isRead && (
                    <span title="Unread" className="mt-1.5 shrink-0 text-blue-600">
                      <CircleDot size={14} />
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}