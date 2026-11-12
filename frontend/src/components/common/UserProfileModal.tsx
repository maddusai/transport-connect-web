import { X, LogOut, User, Phone, Mail, MapPin, Building2, FileText, ShieldCheck } from 'lucide-react'
import { getCurrentUser, setAuthToken, setCurrentUser } from '../../services/apiClient'

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  if (!isOpen) return null

  const raw = getCurrentUser()
  const u = raw?.user || raw || {}
  const displayName = u.name || u.fullName || (u.email ? u.email.split('@')[0] : 'Platform User')
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((p: string) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'TC'

  const handleLogout = () => {
    setCurrentUser(null)
    setAuthToken(null)
    window.location.reload()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between border-b border-slate-100 pb-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-xl font-extrabold text-blue-700">
              {initials}
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">{displayName}</h3>
              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-0.5 text-xs font-semibold text-blue-700">
                <ShieldCheck size={13} />
                {u.role || 'USER'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close profile"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-3.5">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-400">
              <User size={13} /> Full Name
            </p>
            <p className="mt-1 font-semibold text-slate-800">{displayName}</p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3.5">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-400">
              <Phone size={13} /> Mobile Number
            </p>
            <p className="mt-1 font-semibold text-slate-800">
              {u.phone || u.mobile ? `+91 ${u.phone || u.mobile}` : 'Not provided'}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3.5">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-400">
              <Mail size={13} /> Email Address
            </p>
            <p className="mt-1 break-all font-semibold text-slate-800">{u.email || 'Not provided'}</p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3.5">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-400">
              <MapPin size={13} /> City / Location
            </p>
            <p className="mt-1 font-semibold text-slate-800">{u.city || u.address || 'Not provided'}</p>
          </div>

          {(u.companyName || u.businessName) && (
            <div className="rounded-xl bg-slate-50 p-3.5">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-400">
                <Building2 size={13} /> Business Name
              </p>
              <p className="mt-1 font-semibold text-slate-800">{u.companyName || u.businessName}</p>
            </div>
          )}

          {(u.gstNumber || u.gstin) && (
            <div className="rounded-xl bg-slate-50 p-3.5">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-400">
                <FileText size={13} /> GSTIN
              </p>
              <p className="mt-1 font-semibold text-slate-800">{u.gstNumber || u.gstin}</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  )
}