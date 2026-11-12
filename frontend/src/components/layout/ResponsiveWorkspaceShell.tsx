import { useState } from 'react'
import {
  Truck,
  Package,
  ClipboardList,
  MessageSquare,
  Bell,
  Menu,
  X,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react'
import MarketplaceQuotationsPage from '../../features/marketplace/components/MarketplaceQuotationsPage'
import BookingFlowPage from '../../features/bookings/components/BookingFlowPage'
import VehicleManagementPage from '../../features/vehicles/components/VehicleManagementPage'
import NotificationsPage from '../../features/notifications/components/NotificationsPage'
import { getNotifications } from '../../utils/notificationStorage'

type WorkspaceTab =
  | 'MARKETPLACE'
  | 'BOOKINGS'
  | 'VEHICLES'
  | 'NOTIFICATIONS'

interface ResponsiveWorkspaceShellProps {
  roleLabel?: string
  userName?: string
  onBackToDashboard?: () => void
  chatComponent?: React.ReactNode
}

export default function ResponsiveWorkspaceShell({
  roleLabel = 'Fleet & Operations Hub',
  userName = 'Sai Transport Agency',
  onBackToDashboard,
  chatComponent,
}: ResponsiveWorkspaceShellProps) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab | 'CHAT'>('MARKETPLACE')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const unreadCount = getNotifications().filter((n) => !n.isRead).length

  const navItems: {
    id: WorkspaceTab | 'CHAT'
    label: string
    shortLabel: string
    icon: typeof Truck
    badge?: number
  }[] = [
    {
      id: 'MARKETPLACE',
      label: 'Marketplace & Quotes',
      shortLabel: 'Loads',
      icon: Package,
    },
    {
      id: 'BOOKINGS',
      label: 'Bookings & Live Trips',
      shortLabel: 'Trips',
      icon: ClipboardList,
    },
    {
      id: 'VEHICLES',
      label: 'Fleet & Vehicles',
      shortLabel: 'Fleet',
      icon: Truck,
    },
    {
      id: 'CHAT',
      label: 'Messages & Chat',
      shortLabel: 'Chat',
      icon: MessageSquare,
    },
    {
      id: 'NOTIFICATIONS',
      label: 'Notifications',
      shortLabel: 'Alerts',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 pb-20 text-slate-800 lg:flex-row lg:pb-0">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Desktop & Mobile Slide-Over Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-950 text-white transition-transform duration-300 lg:static lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5 lg:h-20 lg:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
              <Truck size={22} />
            </div>
            <div>
              <h1 className="text-base font-bold lg:text-lg">Transport Connect</h1>
              <p className="text-[11px] text-slate-400">{roleLabel}</p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <div className="border-b border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold">
              {userName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{userName}</p>
              <p className="text-[11px] text-slate-400">Verified Workspace</p>
            </div>
            <ShieldCheck size={16} className="shrink-0 text-emerald-400" />
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Operations Modules
          </p>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id)
                  setMobileMenuOpen(false)
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/40'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={18} />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge !== undefined && (
                  <span className="rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {onBackToDashboard && (
          <div className="border-t border-white/10 p-4">
            <button
              onClick={onBackToDashboard}
              className="flex w-full items-center justify-between rounded-xl bg-white/5 px-4 py-3 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white"
            >
              <span>Back to Role Dashboard</span>
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Sticky Responsive Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-6 lg:h-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-xl border border-slate-200 p-2 text-slate-700 hover:bg-slate-50 lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <div>
              <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                {navItems.find((n) => n.id === activeTab)?.label}
              </h2>
              <p className="hidden text-xs text-slate-500 sm:block">
                Transport Connect · Unified Operations Workspace
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setActiveTab('NOTIFICATIONS')}
              className="relative rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
              )}
            </button>
          </div>
        </header>

        {/* Active Module View */}
        <main className="flex-1 overflow-x-hidden">
          {activeTab === 'MARKETPLACE' && <MarketplaceQuotationsPage />}
          {activeTab === 'BOOKINGS' && <BookingFlowPage />}
          {activeTab === 'VEHICLES' && <VehicleManagementPage />}
          {activeTab === 'NOTIFICATIONS' && <NotificationsPage />}
          {activeTab === 'CHAT' &&
            (chatComponent || (
              <div className="mx-auto max-w-3xl p-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
                  <MessageSquare size={40} className="mx-auto text-blue-600" />
                  <h3 className="mt-3 font-bold text-slate-900">Trip & Role Conversations</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Pass your <code>&lt;ChatPage /&gt;</code> component into the{' '}
                    <code>chatComponent</code> prop to render full-screen chat here.
                  </p>
                </div>
              </div>
            ))}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-slate-200 bg-white/95 py-1.5 backdrop-blur lg:hidden">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center gap-1 py-1 text-[10px] font-semibold ${
                isActive ? 'text-blue-600' : 'text-slate-500'
              }`}
            >
              <Icon size={19} />
              <span>{item.shortLabel}</span>
              {item.badge !== undefined && (
                <span className="absolute right-4 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
