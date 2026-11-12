import { useEffect, useMemo, useState } from 'react'
import { apiClient, getAuthToken } from '../../../services/apiClient'
import { getCustomerLoads, getMarketplaceLoads, getQuotations } from '../../../utils/loadStorage'
import { getOwnerDrivers, updateDriverVerification } from '../../../utils/driverStorage'
import { getPaymentSubmissions } from '../../../utils/paymentStorage'
import { getRegisteredUsers, updateRegisteredDriverVerification } from '../../../utils/authStorage'
import { getAllTripTrackingRecords, type TripTrackingRecord } from '../../../utils/trackingStorage'
import {
  LayoutDashboard,
  Users,
  Truck,
  Package,
  ClipboardList,
  Wallet,
  BarChart3,
  Settings,
  Bell,
  Menu,
  X,
  Search,
  CheckCircle2,
  Clock3,
  AlertCircle,
  TrendingUp,
  IndianRupee,
  UserCheck,
  MapPin,
  Navigation,
  Eye,
  ShieldCheck,
  LogOut,
} from 'lucide-react'

type AdminPage =
  | 'Overview'
  | 'Customers'
  | 'Truck Owners'
  | 'Drivers'
  | 'Transporters'
  | 'Loads'
  | 'Bookings'
  | 'Payments'
  | 'Tracking'
  | 'Reports'
  | 'Settings'

type AccountStatus = 'Active' | 'Pending' | 'Suspended' | 'Rejected'

type DriverVerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

type AdminUser = {
  id: string
  name: string
  phone: string
  role: 'Customer' | 'Truck Owner' | 'Driver' | 'Transporter'
  status: AccountStatus
  joined: string
  driverImage?: string
  licenseNumber?: string
  licenseImage?: string
  licenceNumber?: string
  verificationStatus?: DriverVerificationStatus
  verificationReason?: string
  source?: 'REGISTERED' | 'OWNER_MANAGED'
  email?: string
  businessName?: string
  address?: string
  gstin?: string
  pan?: string
}

type AdminLoad = {
  id: string
  customer: string
  route: string
  vehicle: string
  status: string
  budget: string
}

type AdminBooking = {
  id: string
  route: string
  customer: string
  owner: string
  amount: string
  status: string
}

const menuItems: { name: AdminPage; icon: typeof LayoutDashboard }[] = [
  { name: 'Overview', icon: LayoutDashboard },
  { name: 'Customers', icon: Users },
  { name: 'Truck Owners', icon: Truck },
  { name: 'Drivers', icon: UserCheck },
  { name: 'Transporters', icon: Truck },
  { name: 'Loads', icon: Package },
  { name: 'Bookings', icon: ClipboardList },
  { name: 'Payments', icon: Wallet },
  { name: 'Tracking', icon: Navigation },
  { name: 'Reports', icon: BarChart3 },
  { name: 'Settings', icon: Settings },
]

function formatCurrency(value: string | number): string {
  const amount = Number(String(value).replace(/[^0-9.]/g, ''))
  if (!Number.isFinite(amount)) return 'Ã¢â€šÂ¹0'
  return `Ã¢â€šÂ¹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

function formatStatus(value: string): string {
  const normalized = value.trim().toUpperCase()
  const labels: Record<string, string> = {
    OPEN: 'Open',
    BOOKED: 'Booked',
    DRIVER_ASSIGNED: 'Driver Assigned',
    STARTED: 'Started',
    IN_TRANSIT: 'In Transit',
    DELIVERED: 'Delivered',
    COMPLETED: 'Completed',
    PENDING: 'Pending',
    ACCEPTED: 'Accepted',
    REJECTED: 'Rejected',
    SUSPENDED: 'Suspended',
  }
  return labels[normalized] || value.replaceAll('_', ' ')
}

function getAdminLoads(): AdminLoad[] {
  const customerLoads = getCustomerLoads().map((load) => ({
    id: load.id,
    customer: 'Customer',
    route: `${load.from} Ã¢â€ â€™ ${load.to}`,
    vehicle: load.vehicle,
    status: formatStatus(String(load.status || 'Open')),
    budget: formatCurrency(load.amount),
  }))

  const marketplaceLoads = getMarketplaceLoads().map((load) => ({
    id: load.id,
    customer: 'Customer',
    route: `${load.from} Ã¢â€ â€™ ${load.to}`,
    vehicle: load.vehicle,
    status: formatStatus(String(load.status || 'Open')),
    budget: formatCurrency(load.budget),
  }))

  const uniqueLoads = new Map<string, AdminLoad>()
  ;[...customerLoads, ...marketplaceLoads].forEach((load) => {
    uniqueLoads.set(load.id, load)
  })
  return Array.from(uniqueLoads.values())
}

function getAdminBookings(): AdminBooking[] {
  return getQuotations()
    .filter((quotation) => quotation.status === 'ACCEPTED')
    .map((quotation) => ({
      id: quotation.id,
      route: `${quotation.from} Ã¢â€ â€™ ${quotation.to}`,
      customer: 'Customer',
      owner: quotation.truckOwner || 'Truck Owner',
      amount: formatCurrency(quotation.amount),
      status: formatStatus(String(quotation.tripStatus || 'BOOKED')),
    }))
}

function getAdminUsers(): AdminUser[] {
  const registeredUsers: AdminUser[] = getRegisteredUsers().map((user) => {
    const roleMap = {
      CUSTOMER: 'Customer',
      TRUCK_OWNER: 'Truck Owner',
      DRIVER: 'Driver',
      TRANSPORTER: 'Transporter',
    } as const

    const isDriver = user.role === 'DRIVER'
    const verificationStatus = isDriver ? user.verificationStatus || 'PENDING' : undefined

    let status: AccountStatus = 'Active'
    if (isDriver) {
      if (verificationStatus === 'APPROVED') status = 'Active'
      else if (verificationStatus === 'REJECTED') status = 'Rejected'
      else status = 'Pending'
    }

    return {
      id: user.id,
      name: user.fullName,
      phone: user.mobile,
      role: roleMap[user.role],
      status,
      joined: new Date(user.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      email: user.email,
      businessName: user.businessName,
      address: user.address,
      gstin: user.gstin,
      pan: user.pan,
      licenceNumber: user.licenceNumber,
      verificationStatus,
      verificationReason: user.verificationReason,
      source: 'REGISTERED',
    }
  })

  const ownerManagedDrivers: AdminUser[] = getOwnerDrivers().map((driver) => ({
    id: driver.id,
    name: driver.name,
    phone: driver.phone,
    role: 'Driver',
    status:
      driver.verificationStatus === 'APPROVED'
        ? 'Active'
        : driver.verificationStatus === 'REJECTED'
          ? 'Rejected'
          : 'Pending',
    joined: 'Added by truck owner',
    driverImage: driver.driverImage,
    licenseNumber: driver.licenseNumber,
    licenseImage: driver.licenseImage,
    verificationStatus: driver.verificationStatus || 'PENDING',
    verificationReason: driver.verificationReason,
    source: 'OWNER_MANAGED',
  }))

  const usersByMobile = new Map<string, AdminUser>()
  registeredUsers.forEach((user) => usersByMobile.set(user.phone, user))
  ownerManagedDrivers.forEach((driver) => {
    if (!usersByMobile.has(driver.phone)) usersByMobile.set(driver.phone, driver)
  })

  return Array.from(usersByMobile.values())
}

export default function AdminDashboard() {
  const [activePage, setActivePage] = useState<AdminPage>('Overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [users, setUsers] = useState<AdminUser[]>(getAdminUsers)
  const [loads, setLoads] = useState<AdminLoad[]>(getAdminLoads)
  const [bookings, setBookings] = useState<AdminBooking[]>(getAdminBookings)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [selectedDriverDocument, setSelectedDriverDocument] = useState<{ title: string; src: string } | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase()
    return users.filter((user) => {
      const matchesQuery =
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.id.toLowerCase().includes(query) ||
        user.phone.includes(query)
      const matchesRole = roleFilter === 'All' || user.role === roleFilter
      return matchesQuery && matchesRole
    })
  }, [users, search, roleFilter])

  const refreshAdminData = () => {
    setUsers(getAdminUsers())
    setLoads(getAdminLoads())
    setBookings(getAdminBookings())
  }

  const updateUserStatus = (userId: string, status: AccountStatus) => {
    setUsers((current) =>
      current.map((user) => (user.id === userId ? { ...user, status } : user)),
    )
    setSelectedUser(null)
  }

  const reviewDriver = (driverId: string, verificationStatus: DriverVerificationStatus) => {
    const reason = verificationStatus === 'REJECTED' ? rejectionReason.trim() : undefined

    if (verificationStatus === 'REJECTED' && !reason) {
      window.alert('Please enter a reason before rejecting this driver.')
      return
    }

    const targetDriver = users.find(
      (user) => user.id === driverId && user.role === 'Driver',
    )

    if (!targetDriver) {
      window.alert('Driver record was not found. Please refresh the Admin Dashboard.')
      return
    }

    const updated =
      targetDriver.source === 'REGISTERED'
        ? updateRegisteredDriverVerification(driverId, verificationStatus, reason)
        : updateDriverVerification(driverId, verificationStatus, reason)

    if (!updated) {
      window.alert('Could not update this driver. Please refresh the dashboard and try again.')
      return
    }

    // Refresh the list from the same storage that was updated.
    const refreshedUsers = getAdminUsers()
    setUsers(refreshedUsers)
    setSelectedUser(null)
    setRejectionReason('')
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-950 text-white transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-800 px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-600 p-2"><Truck size={25} /></div>
            <div>
              <h1 className="text-xl font-bold">Transport Connect</h1>
              <p className="text-xs text-slate-400">Admin Console</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden" aria-label="Close menu"><X /></button>
        </div>

        <div className="px-5 py-6">
          <div className="flex items-center gap-3 rounded-xl bg-slate-900 p-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-600 font-bold">AD</div>
            <div>
              <p className="font-semibold">Platform Admin</p>
              <p className="text-xs text-slate-400">Administrator</p>
            </div>
            <ShieldCheck size={18} className="ml-auto text-green-400" />
          </div>
        </div>

        <p className="px-6 pb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Management</p>
        <nav className="flex-1 space-y-1 overflow-y-auto px-4 pb-4">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = activePage === item.name
            return (
              <button
                key={item.name}
                onClick={() => { setActivePage(item.name); setSidebarOpen(false); setSearch('') }}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition ${
                  active ? 'bg-blue-600 font-semibold text-white' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Icon size={19} /> {item.name}
              </button>
            )
          })}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-400 hover:bg-slate-900 hover:text-white">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {sidebarOpen && <button aria-label="Close sidebar overlay" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-black/50 lg:hidden" />}

      <main className="min-h-screen lg:ml-72">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-5 md:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 hover:bg-slate-100 lg:hidden" aria-label="Open menu"><Menu /></button>
            <div>
              <h2 className="text-lg font-bold md:text-xl">{activePage}</h2>
              <p className="hidden text-xs text-slate-500 sm:block">Monitor and manage the Transport Connect platform</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={refreshAdminData}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              title="Reload data from shared browser storage"
            >
              Refresh data
            </button>
            <button className="relative rounded-xl border border-slate-200 p-2.5" aria-label="Notifications">
              <Bell size={19} /><span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
            </button>
            <div className="hidden items-center gap-2 sm:flex">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">AD</div>
              <div><p className="text-sm font-semibold">Admin</p><p className="text-xs text-slate-500">Platform control</p></div>
            </div>
          </div>
        </header>

        <div className="p-5 md:p-8">
          {activePage === 'Overview' && (
            <>
              <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
                <div><h3 className="text-2xl font-bold">Platform Overview</h3><p className="mt-2 text-sm text-slate-500">Live load, booking and registration snapshot from this browser's storage.</p></div>
                <span className="rounded-full bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">Live local data</span>
              </div>
              <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard title="Total Users" value={users.length.toString()} icon={<Users size={22} />} tone="blue" />
                <StatCard title="Active Loads" value={loads.filter((load) => load.status === 'Open' || load.status === 'Booked').length.toString()} icon={<Package size={22} />} tone="purple" />
                <StatCard title="Total Bookings" value={bookings.length.toString()} icon={<ClipboardList size={22} />} tone="orange" />
                <StatCard title="Gross Booking Value" value={formatCurrency(bookings.reduce((total, booking) => total + Number(booking.amount.replace(/[^0-9.]/g, '')), 0))} icon={<IndianRupee size={22} />} tone="green" />
              </div>

              <div className="mb-8 grid gap-5 xl:grid-cols-3">
                <div className="rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 p-6 text-white xl:col-span-2">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div><p className="text-sm text-blue-100">Marketplace health</p><h3 className="mt-2 text-3xl font-bold">Platform snapshot</h3><p className="mt-2 text-sm text-blue-100">Key operational indicators for the demo environment.</p></div>
                    <div className="rounded-2xl bg-white/15 p-4"><TrendingUp size={32} /></div>
                  </div>
                  <div className="mt-8 grid grid-cols-2 gap-4 border-t border-white/20 pt-5 sm:grid-cols-3">
                    <div><p className="text-xs text-blue-100">Active accounts</p><p className="mt-1 text-xl font-bold">{users.filter((user) => user.status === 'Active').length}</p></div>
                    <div><p className="text-xs text-blue-100">Pending verification</p><p className="mt-1 text-xl font-bold">{users.filter((user) => user.status === 'Pending').length}</p></div>
                    <div><p className="text-xs text-blue-100">Completed bookings</p><p className="mt-1 text-xl font-bold">{bookings.filter((booking) => booking.status === 'Completed').length}</p></div>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <div className="mb-4 flex items-center gap-3"><div className="rounded-xl bg-amber-50 p-3 text-amber-600"><AlertCircle size={22} /></div><div><h4 className="font-bold">Needs attention</h4><p className="text-xs text-slate-500">Demo review queue</p></div></div>
                  <p className="text-3xl font-bold">{users.filter((user) => user.status === 'Pending').length}</p>
                  <p className="mt-1 text-sm text-slate-500">Accounts awaiting review</p>
                  <button onClick={() => setActivePage('Truck Owners')} className="mt-5 w-full rounded-xl border border-slate-200 py-3 text-sm font-semibold hover:bg-slate-50">Review accounts</button>
                </div>
              </div>

              <div className="grid gap-5 xl:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <SectionHeader title="Recent bookings" action="View bookings" onAction={() => setActivePage('Bookings')} />
                  <div className="mt-4 space-y-3">{bookings.slice(0, 3).map((booking) => <div key={booking.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4"><div><p className="text-xs font-semibold text-blue-600">{booking.id}</p><p className="mt-1 font-semibold">{booking.route}</p><p className="mt-1 text-xs text-slate-500">{booking.customer}</p></div><div className="text-right"><p className="font-bold">{booking.amount}</p><StatusPill status={booking.status} /></div></div>)}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <SectionHeader title="Recent registrations" action="View users" onAction={() => setActivePage('Customers')} />
                  <div className="mt-4 space-y-3">{users.slice(0, 3).map((user) => <div key={user.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-4"><div><p className="font-semibold">{user.name}</p><p className="mt-1 text-xs text-slate-500">{user.role} Ã‚Â· {user.joined}</p></div><StatusPill status={user.status} /></div>)}</div>
                </div>
              </div>
            </>
          )}

          {(['Customers', 'Truck Owners', 'Drivers', 'Transporters'].includes(activePage)) && (
            <section>
              <div className="mb-6"><h3 className="text-xl font-bold">{activePage} Management</h3><p className="mt-1 text-sm text-slate-500">Accounts are loaded from registration storage. Driver records added by truck owners are also included.</p></div>
              <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:flex-row">
                <div className="relative flex-1"><Search className="absolute left-3 top-3.5 text-slate-400" size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, user ID or mobile" className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 outline-none focus:border-blue-500" /></div>
                <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-3"><option>All</option><option>Customer</option><option>Truck Owner</option><option>Driver</option><option>Transporter</option></select>
              </div>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-4">Account</th><th className="px-5 py-4">Role</th><th className="px-5 py-4">Mobile</th><th className="px-5 py-4">Joined</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Action</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">{filteredUsers.filter((user) => activePage === 'Customers' ? user.role === 'Customer' : activePage === 'Truck Owners' ? user.role === 'Truck Owner' : activePage === 'Drivers' ? user.role === 'Driver' : user.role === 'Transporter').map((user) => <tr key={user.id}><td className="px-5 py-4"><p className="font-semibold">{user.name}</p><p className="text-xs text-slate-400">{user.id}</p></td><td className="px-5 py-4">{user.role}</td><td className="px-5 py-4">{user.phone}</td><td className="px-5 py-4">{user.joined}</td><td className="px-5 py-4"><StatusPill status={user.status} /></td><td className="px-5 py-4"><button onClick={() => setSelectedUser(user)} className="flex items-center gap-1 font-semibold text-blue-600 hover:underline"><Eye size={16} /> Review</button></td></tr>)}</tbody>
                </table></div>
                {filteredUsers.filter((user) => activePage === 'Customers' ? user.role === 'Customer' : activePage === 'Truck Owners' ? user.role === 'Truck Owner' : activePage === 'Drivers' ? user.role === 'Driver' : user.role === 'Transporter').length === 0 && <EmptyState message="No matching accounts found." />}
              </div>
            </section>
          )}

          {activePage === 'Loads' && <DataTable title="Load Management" description="Review customer load posts and their current marketplace status." headers={['Load ID', 'Customer', 'Route', 'Vehicle', 'Budget', 'Status']} rows={loads.map((load) => [load.id, load.customer, load.route, load.vehicle, load.budget, load.status])} />}
          {activePage === 'Bookings' && <DataTable title="Booking Management" description="Monitor confirmed transport bookings and trip progress." headers={['Booking ID', 'Route', 'Customer', 'Truck Owner', 'Amount', 'Status']} rows={bookings.map((booking) => [booking.id, booking.route, booking.customer, booking.owner, booking.amount, booking.status])} />}
          {activePage === 'Payments' && <PaymentsPage />}
          {activePage === 'Tracking' && <TrackingPage />}
          {activePage === 'Reports' && <ReportsPage users={users} loads={loads} bookings={bookings} />}
          {activePage === 'Settings' && <SettingsPage />}
        </div>
      </main>

      {selectedUser && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 sm:p-4">
          <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-xl font-bold">Review account</h3>
              <button onClick={() => setSelectedUser(null)} className="rounded-lg p-2 hover:bg-slate-100" aria-label="Close"><X /></button>
            </div>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-6 py-5">
            <div className="space-y-3 rounded-xl bg-slate-50 p-4 text-sm"><InfoRow label="Name" value={selectedUser.name} /><InfoRow label="User ID" value={selectedUser.id} /><InfoRow label="Role" value={selectedUser.role} /><InfoRow label="Mobile" value={selectedUser.phone} /><InfoRow label="Current status" value={selectedUser.status} />
            {selectedUser.email && <InfoRow label="Email" value={selectedUser.email} />}
            {selectedUser.businessName && <InfoRow label="Business name" value={selectedUser.businessName} />}
            {selectedUser.address && <InfoRow label="Address" value={selectedUser.address} />}
            {selectedUser.gstin && <InfoRow label="GSTIN" value={selectedUser.gstin} />}
            {selectedUser.pan && <InfoRow label="PAN" value={selectedUser.pan} />}
            {selectedUser.licenceNumber && selectedUser.role !== "Driver" && <InfoRow label="Licence number" value={selectedUser.licenceNumber} />}
          </div>
            {selectedUser.role === 'Driver' && (
              <div className="mt-4 rounded-xl border border-slate-200 p-4">
                <h4 className="mb-3 font-semibold">Driver documents</h4>
                <InfoRow label="Driving Licence Number" value={selectedUser.licenseNumber || selectedUser.licenceNumber || 'Not available'} />
                <InfoRow
                  label="Verification status"
                  value={selectedUser.verificationStatus || 'PENDING'}
                />
                {selectedUser.verificationReason && (
                  <InfoRow label="Rejection reason" value={selectedUser.verificationReason} />
                )}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <p className="mb-2 text-xs font-medium text-slate-500">Driver photo</p>
                    {selectedUser.driverImage ? (
                      <button type="button" onClick={() => setSelectedDriverDocument({ title: 'Driver photo', src: selectedUser.driverImage! })} className="block text-left">
                        <img src={selectedUser.driverImage} alt="Driver photo" className="h-24 w-full rounded-lg border object-cover" />
                        <span className="mt-1 block text-xs font-semibold text-blue-600">Preview photo</span>
                      </button>
                    ) : <p className="text-xs text-slate-400">Not uploaded</p>}
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-medium text-slate-500">Driving licence</p>
                    {selectedUser.licenseImage ? (
                      <button type="button" onClick={() => setSelectedDriverDocument({ title: 'Driving licence', src: selectedUser.licenseImage! })} className="block text-left">
                        <img src={selectedUser.licenseImage} alt="Driving licence" className="h-24 w-full rounded-lg border object-cover" />
                        <span className="mt-1 block text-xs font-semibold text-blue-600">Preview licence</span>
                      </button>
                    ) : <p className="text-xs text-slate-400">Not uploaded</p>}
                  </div>
                </div>
              </div>
            )}
            <p className="mt-4 text-xs text-slate-500">
              Demo browser-storage review only. Production verification must use secure backend checks and authorised document review.
            </p>
            {selectedUser.role === 'Driver' ? (
              <div className="mt-5 space-y-3">
                {selectedUser.verificationStatus !== 'APPROVED' && (
                  <button
                    onClick={() => reviewDriver(selectedUser.id, 'APPROVED')}
                    className="w-full rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700"
                  >
                    Approve Driver
                  </button>
                )}
                {selectedUser.verificationStatus !== 'REJECTED' && (
                  <>
                    <textarea
                      value={rejectionReason}
                      onChange={(event) => setRejectionReason(event.target.value)}
                      placeholder="Enter reason if rejecting this driver"
                      rows={2}
                      className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-red-500"
                    />
                    <button
                      onClick={() => reviewDriver(selectedUser.id, 'REJECTED')}
                      className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700"
                    >
                      Reject Driver
                    </button>
                  </>
                )}
                {selectedUser.verificationStatus === 'APPROVED' && (
                  <p className="rounded-lg bg-green-50 p-3 text-sm font-medium text-green-700">This driver is approved.</p>
                )}
                {selectedUser.verificationStatus === 'REJECTED' && (
                  <p className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">This driver is rejected. The reason is shown above.</p>
                )}
              </div>
            ) : (
              <div className="mt-5 flex flex-wrap gap-2">
                <button onClick={() => updateUserStatus(selectedUser.id, 'Active')} className="flex-1 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white">Approve / Activate</button>
                <button onClick={() => updateUserStatus(selectedUser.id, 'Suspended')} className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white">Suspend</button>
              </div>
            )}
            </div>
          </div>
        </div>
      )}

      {selectedDriverDocument && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/80 p-4" onClick={() => setSelectedDriverDocument(null)}>
          <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="font-bold">{selectedDriverDocument.title} preview</h3>
                <p className="text-xs text-slate-500">Driver document Ã¢â‚¬â€ demo browser storage</p>
              </div>
              <button type="button" onClick={() => setSelectedDriverDocument(null)} className="rounded-lg p-2 hover:bg-slate-100" aria-label="Close document preview"><X /></button>
            </div>
            <div className="flex-1 overflow-auto bg-slate-100 p-4">
              <img src={selectedDriverDocument.src} alt={selectedDriverDocument.title} className="mx-auto max-h-[75vh] max-w-full rounded-lg object-contain" />
            </div>
            <div className="flex justify-end border-t border-slate-200 px-5 py-3">
              <a href={selectedDriverDocument.src} download={`${selectedDriverDocument.title.toLowerCase().replaceAll(' ', '-')}.jpg`} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Download image</a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ title, value, icon, tone }: { title: string; value: string; icon: React.ReactNode; tone: 'blue' | 'purple' | 'orange' | 'green' }) {
  const tones = { blue: 'bg-blue-50 text-blue-600', purple: 'bg-purple-50 text-purple-600', orange: 'bg-orange-50 text-orange-600', green: 'bg-green-50 text-green-600' }
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className={`inline-flex rounded-xl p-3 ${tones[tone]}`}>{icon}</div><p className="mt-5 text-sm text-slate-500">{title}</p><h3 className="mt-1 text-2xl font-bold">{value}</h3></div>
}

function SectionHeader({ title, action, onAction }: { title: string; action: string; onAction: () => void }) {
  return <div className="flex items-center justify-between gap-3"><h3 className="font-bold">{title}</h3><button onClick={onAction} className="text-sm font-semibold text-blue-600 hover:underline">{action}</button></div>
}

function StatusPill({ status }: { status: string }) {
  const tone = ['Active', 'Completed', 'Delivered'].includes(status) ? 'bg-green-100 text-green-700' : ['Pending', 'Driver Assigned', 'Booked'].includes(status) ? 'bg-amber-100 text-amber-700' : ['Suspended', 'Rejected'].includes(status) ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
  return <span className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{status}</span>
}

function DataTable({ title, description, headers, rows }: { title: string; description: string; headers: string[]; rows: string[][] }) {
  return <section><div className="mb-6"><h3 className="text-xl font-bold">{title}</h3><p className="mt-1 text-sm text-slate-500">{description}</p></div><div className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{headers.map((header) => <th key={header} className="px-5 py-4">{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{rows.map((row, index) => <tr key={`${row[0]}-${index}`}>{row.map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`} className="px-5 py-4">{cellIndex === row.length - 1 ? <StatusPill status={cell} /> : cell}</td>)}</tr>)}</tbody></table></div>{rows.length === 0 && <EmptyState message="No records available." />}</div></section>
}

function TrackingPage() {
  const [records, setRecords] = useState<TripTrackingRecord[]>(() => getAllTripTrackingRecords())
  const [lastRefresh, setLastRefresh] = useState(new Date())

  useEffect(() => {
    const refresh = () => {
      setRecords(getAllTripTrackingRecords())
      setLastRefresh(new Date())
    }
    refresh()
    const intervalId = window.setInterval(refresh, 3000)
    return () => window.clearInterval(intervalId)
  }, [])

  const activeRecords = records.filter((record) => record.isTracking)
  const recordsWithLocation = records.filter((record) => record.lastLocation)

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold">Live Trip Tracking</h3>
          <p className="mt-1 text-sm text-slate-500">Monitor driver GPS sessions and their latest reported locations.</p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">Auto-refresh: 3 seconds</span>
      </div>

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard title="Tracking Now" value={String(activeRecords.length)} icon={<Navigation size={22} />} tone="green" />
        <StatCard title="Trips With Location" value={String(recordsWithLocation.length)} icon={<MapPin size={22} />} tone="blue" />
        <StatCard title="Tracking Records" value={String(records.length)} icon={<Truck size={22} />} tone="purple" />
      </div>

      <div className="mb-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
        <span>Last refreshed: {lastRefresh.toLocaleTimeString()}</span>
        <button onClick={() => { setRecords(getAllTripTrackingRecords()); setLastRefresh(new Date()) }} className="font-semibold text-blue-600 hover:underline">Refresh now</button>
      </div>

      {records.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <Navigation className="mx-auto mb-3 text-slate-300" size={32} />
          <p className="font-semibold">No GPS tracking records yet</p>
          <p className="mt-1 text-sm text-slate-500">When a driver starts GPS tracking, the trip will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {records.map((record) => {
            const location = record.lastLocation
            const mapUrl = location
              ? `https://www.google.com/maps?q=${location.latitude},${location.longitude}`
              : undefined
            return (
              <article key={record.tripId} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Trip ID</p>
                    <h4 className="mt-1 font-bold text-slate-900">{record.tripId}</h4>
                  </div>
                  <StatusPill status={record.isTracking ? 'Tracking' : 'Stopped'} />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Current place</p>
                    <p className="mt-1 flex items-start gap-2 text-sm font-semibold text-slate-900">
                      <MapPin size={16} className="mt-0.5 shrink-0 text-blue-600" />
                      {location ? location.placeName || 'Finding place name...' : 'Not available'}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">GPS accuracy</p>
                    <p className="mt-1 text-sm font-semibold">{location?.accuracy == null ? 'Not available' : `Ã‚Â±${Math.round(location.accuracy)} metres`}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Last location update</p>
                    <p className="mt-1 text-sm font-semibold">{location ? new Date(location.recordedAt).toLocaleString() : 'Not available'}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Tracking started</p>
                    <p className="mt-1 text-sm font-semibold">{record.startedAt ? new Date(record.startedAt).toLocaleString() : 'Not available'}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">{record.stoppedAt ? `Stopped: ${new Date(record.stoppedAt).toLocaleString()}` : record.isTracking ? 'GPS session is active' : 'Tracking is not active'}</p>
                  {mapUrl && <a href={mapUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"><MapPin size={16} /> Open in Google Maps</a>}
                </div>
              </article>
            )
          })}
        </div>
      )}

      <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
        <p className="font-bold">Demo tracking limitation</p>
        <p className="mt-1">These records are read from this browser's localStorage. Admin can see driver updates only when both dashboards use the same browser profile and device. Cross-device live tracking needs the backend, authenticated APIs and WebSocket integration.</p>
      </div>
    </section>
  )
}

type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED'

function PaymentsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | PaymentStatus>('ALL')
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedPayment, setSelectedPayment] = useState<ReturnType<typeof getPaymentSubmissions>[number] | null>(null)

  const submissions = useMemo(() => getPaymentSubmissions(), [refreshKey])
  const filteredSubmissions = useMemo(() => {
    const query = search.trim().toLowerCase()
    return submissions.filter((payment) => {
      const matchesQuery =
        !query ||
        payment.bookingId.toLowerCase().includes(query) ||
        payment.loadId.toLowerCase().includes(query) ||
        payment.transactionNumber.toLowerCase().includes(query) ||
        payment.slipFileName.toLowerCase().includes(query)
      const matchesStatus = statusFilter === 'ALL' || payment.status === statusFilter
      return matchesQuery && matchesStatus
    })
  }, [submissions, search, statusFilter])

  const totalSubmitted = submissions.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0)
  const pendingCount = submissions.filter((payment) => payment.status === 'PENDING').length
  const successfulCount = submissions.filter((payment) => payment.status === 'SUCCESS').length
  const failedCount = submissions.filter((payment) => payment.status === 'FAILED').length

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold">Customer Payment Proofs</h3>
          <p className="mt-1 text-sm text-slate-500">
            Review submitted UTR numbers and payment slips. New submissions remain Pending until verified.
          </p>
        </div>
        <button
          onClick={() => setRefreshKey((value) => value + 1)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
        >
          Refresh submissions
        </button>
      </div>

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Proofs Submitted" value={String(submissions.length)} icon={<Wallet size={22} />} tone="blue" />
        <StatCard title="Amount Submitted" value={formatCurrency(totalSubmitted)} icon={<IndianRupee size={22} />} tone="purple" />
        <StatCard title="Pending Review" value={String(pendingCount)} icon={<Clock3 size={22} />} tone="orange" />
        <StatCard title="Verified / Failed" value={`${successfulCount} / ${failedCount}`} icon={<CheckCircle2 size={22} />} tone="green" />
      </div>

      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:flex-row">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-3.5 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search booking ID, load ID, UTR or file name"
            className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as 'ALL' | PaymentStatus)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3"
        >
          <option value="ALL">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="SUCCESS">Success</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4">Booking / Load ID</th>
                <th className="px-5 py-4">Amount</th>
                <th className="px-5 py-4">UTR / Transaction ID</th>
                <th className="px-5 py-4">Payment Slip</th>
                <th className="px-5 py-4">Submitted At</th>
                <th className="px-5 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSubmissions.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-5 py-4">
                    <div className="font-semibold text-blue-600">{payment.bookingId}</div>
                    <div className="mt-1 text-xs text-slate-500">Load: {payment.loadId}</div>
                  </td>
                  <td className="px-5 py-4 font-semibold">{formatCurrency(payment.amount)}</td>
                  <td className="px-5 py-4 font-mono text-xs">{payment.transactionNumber}</td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => setSelectedPayment(payment)}
                      disabled={!payment.slipDataUrl}
                      className="font-semibold text-blue-600 hover:underline disabled:cursor-not-allowed disabled:text-slate-400"
                    >
                      {payment.slipDataUrl ? 'Preview slip' : 'Slip unavailable'}
                    </button>
                    <div className="mt-1 max-w-[180px] truncate text-xs text-slate-500">{payment.slipFileName}</div>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-600">{new Date(payment.submittedAt).toLocaleString()}</td>
                  <td className="px-5 py-4">
                    <StatusPill status={payment.status === 'SUCCESS' ? 'Success' : payment.status === 'FAILED' ? 'Failed' : 'Pending'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredSubmissions.length === 0 && (
          <EmptyState message={submissions.length === 0 ? 'No customer payment proofs submitted yet.' : 'No payment proofs match your search or status filter.'} />
        )}
      </div>

      {selectedPayment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-3 sm:p-6" onClick={() => setSelectedPayment(null)}>
          <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-6">
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900">Payment slip preview</h3>
                <p className="truncate text-xs text-slate-500">{selectedPayment.slipFileName}</p>
              </div>
              <button type="button" onClick={() => setSelectedPayment(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close preview">
                <X size={20} />
              </button>
            </div>
            <div className="min-h-[240px] flex-1 overflow-auto bg-slate-100 p-3 sm:p-5">
              {!selectedPayment.slipDataUrl ? (
                <p className="py-16 text-center text-sm text-slate-600">This payment record does not contain a saved slip. Ask the customer to upload it again.</p>
              ) : selectedPayment.slipMimeType === 'application/pdf' ? (
                <iframe title="Payment slip PDF" src={selectedPayment.slipDataUrl} className="h-[70vh] w-full rounded-lg bg-white" />
              ) : selectedPayment.slipMimeType.startsWith('image/') ? (
                <img src={selectedPayment.slipDataUrl} alt="Uploaded payment slip" className="mx-auto max-h-[70vh] max-w-full rounded-lg object-contain" />
              ) : (
                <p className="py-16 text-center text-sm text-slate-600">Unsupported file type: {selectedPayment.slipMimeType || 'unknown'}</p>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 sm:px-6">
              <p className="text-xs text-slate-500">UTR: <span className="font-mono font-semibold text-slate-800">{selectedPayment.transactionNumber}</span></p>
              {selectedPayment.slipDataUrl && <a href={selectedPayment.slipDataUrl} download={selectedPayment.slipFileName} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Download slip</a>}
            </div>
          </div>
        </div>
      )}

      <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
        <p className="font-bold">Demo storage Ã¢â‚¬â€ verification is not automatic yet</p>
        <p className="mt-1">
          These submissions are read from this browser's localStorage, so they appear only when Customer and Admin dashboards use the same browser profile. An uploaded slip and UTR are not proof of cleared funds. Production verification requires a secure backend and payment-provider/bank confirmation; do not mark a payment successful from the uploaded image alone.
        </p>
      </div>
    </section>
  )
}

function ReportsPage({
  users,
  loads,
  bookings,
}: {
  users: AdminUser[]
  loads: AdminLoad[]
  bookings: AdminBooking[]
}) {
  const completedBookings = bookings.filter((booking) => booking.status === 'Completed')
  const inProgressBookings = bookings.filter((booking) =>
    ['Started', 'In Transit', 'Delivered', 'Driver Assigned', 'Booked'].includes(booking.status)
  )
  const totalBookingValue = bookings.reduce(
    (total, booking) => total + (Number(booking.amount.replace(/[^0-9.]/g, '')) || 0),
    0
  )
  const completedBookingValue = completedBookings.reduce(
    (total, booking) => total + (Number(booking.amount.replace(/[^0-9.]/g, '')) || 0),
    0
  )
  const roleCounts = [
    { label: 'Customers', count: users.filter((user) => user.role === 'Customer').length },
    { label: 'Truck Owners', count: users.filter((user) => user.role === 'Truck Owner').length },
    { label: 'Drivers', count: users.filter((user) => user.role === 'Driver').length },
    { label: 'Transporters', count: users.filter((user) => user.role === 'Transporter').length },
  ]
  const loadStatusCounts = [
    { label: 'Open', count: loads.filter((load) => load.status === 'Open').length },
    { label: 'Booked', count: loads.filter((load) => load.status === 'Booked').length },
    { label: 'Other statuses', count: loads.filter((load) => !['Open', 'Booked'].includes(load.status)).length },
  ]

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold">Reports & Analytics</h3>
          <p className="mt-1 text-sm text-slate-500">
            Live summary calculated from the users, loads and accepted bookings currently available in this browser.
          </p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
          Browser data snapshot
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard title="Accounts in Admin List" value={users.length.toString()} icon={<Users size={22} />} tone="blue" />
        <StatCard title="Loads Posted" value={loads.length.toString()} icon={<Package size={22} />} tone="purple" />
        <StatCard title="Accepted Bookings" value={bookings.length.toString()} icon={<ClipboardList size={22} />} tone="orange" />
        <StatCard title="Completed Bookings" value={completedBookings.length.toString()} icon={<CheckCircle2 size={22} />} tone="green" />
        <StatCard title="Total Booking Value" value={formatCurrency(totalBookingValue)} icon={<IndianRupee size={22} />} tone="blue" />
        <StatCard title="Completed Booking Value" value={formatCurrency(completedBookingValue)} icon={<TrendingUp size={22} />} tone="green" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h4 className="font-bold">Accounts by role</h4>
          <p className="mt-1 text-xs text-slate-500">Counts from the current Admin account list.</p>
          <div className="mt-5 space-y-4">
            {roleCounts.map((item) => {
              const percent = users.length ? (item.count / users.length) * 100 : 0
              return (
                <div key={item.label}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-slate-500">{item.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-blue-600" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h4 className="font-bold">Load status breakdown</h4>
          <p className="mt-1 text-xs text-slate-500">Current load statuses from shared browser storage.</p>
          <div className="mt-5 space-y-4">
            {loadStatusCounts.map((item) => {
              const percent = loads.length ? (item.count / loads.length) * 100 : 0
              return (
                <div key={item.label}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-slate-500">{item.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-indigo-600" style={{ width: `${percent}%` }} />
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
        <h4 className="font-bold">Booking progress</h4>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-slate-500">In progress / awaiting completion</p>
            <p className="mt-1 text-2xl font-bold">{inProgressBookings.length}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Completed</p>
            <p className="mt-1 text-2xl font-bold">{completedBookings.length}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Other / unclassified</p>
            <p className="mt-1 text-2xl font-bold">
              {Math.max(0, bookings.length - completedBookings.length - inProgressBookings.length)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
        <p className="font-bold">Reporting limitations</p>
        <p className="mt-1">
          These are live calculations from this browser's local data, not a central server report. Registration records are read from this browser's localStorage and are not shared across devices until a backend is connected. Revenue, payment settlement, date-wise trends and downloadable reports need backend transaction records.
        </p>
      </div>
    </section>
  )
}

function SettingsPage() {
  return <section><div className="mb-6"><h3 className="text-xl font-bold">Platform Settings</h3><p className="mt-1 text-sm text-slate-500">Configuration areas for the future backend-connected admin console.</p></div><div className="space-y-3">{[['Commission rules', 'Configure platform commission rates and applicable conditions.'], ['Verification policy', 'Define customer, truck owner, driver and vehicle verification requirements.'], ['Notifications', 'Manage email, SMS and push notification templates.'], ['Security and access', 'Manage admin roles, permissions, audit logs and session policies.'], ['Support and disputes', 'Configure support channels and dispute resolution workflows.']].map(([title, description]) => <div key={title} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5"><div><h4 className="font-semibold">{title}</h4><p className="mt-1 text-sm text-slate-500">{description}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">Backend pending</span></div>)}</div></section>
}


function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4"><span className="text-slate-500">{label}</span><span className="text-right font-semibold">{value}</span></div>
}

function EmptyState({ message }: { message: string }) {
  return <div className="p-10 text-center"><MapPin className="mx-auto mb-3 text-slate-300" size={30} /><p className="text-sm text-slate-500">{message}</p></div>
}
