import { useState, useMemo } from 'react'
import { getCustomerLoads, saveMarketplaceLoads } from '../../../utils/loadStorage'
import LiveTripTrackingModal from '../../../components/common/LiveTripTrackingModal'
import type { TrackingTripData } from '../../../components/common/LiveTripTrackingModal'
import TripChatModal from '../../../components/common/TripChatModal'
import {
  LayoutDashboard,
  Package,
  Truck,
  Users,
  FileText,
  ClipboardList,
  Wallet,
  BarChart3,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  MapPin,
  ArrowUpRight,
  IndianRupee,
  Plus,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  Building2,
  TrendingUp,
  Trash2,
  Navigation,
  MessageSquare,
  Phone,
} from 'lucide-react'

type Page =
  | 'Overview'
  | 'Manage Loads'
  | 'Manage Trucks'
  | 'Drivers'
  | 'Quotations'
  | 'Bookings & Trips'
  | 'Payments'
  | 'Reports'
  | 'Company Profile'

type TransporterLoad = {
  id: string
  from: string
  to: string
  stops?: string[]
  material: string
  vehicle: string
  weight: string
  budget: string
  status: string
  createdAt?: string
  isTransporterLoad?: boolean
}

type TransporterTrip = {
  id: string
  bookingId: string
  route: string
  from: string
  to: string
  stops?: string[]
  driverName: string
  driverPhone: string
  truckNumber: string
  truckType: string
  totalDistanceKm: number
  coveredDistanceKm: number
  eta: string
  speedKmH: number
  status: 'In Transit' | 'Completed' | 'Pending'
}

const TRANSPORTER_STORAGE_KEY = 'transport_connect_transporter_loads'

const menuItems = [
  { name: 'Overview' as Page, icon: LayoutDashboard },
  { name: 'Manage Loads' as Page, icon: Package },
  { name: 'Manage Trucks' as Page, icon: Truck },
  { name: 'Drivers' as Page, icon: Users },
  { name: 'Quotations' as Page, icon: FileText },
  { name: 'Bookings & Trips' as Page, icon: ClipboardList },
  { name: 'Payments' as Page, icon: Wallet },
  { name: 'Reports' as Page, icon: BarChart3 },
  { name: 'Company Profile' as Page, icon: Building2 },
]

const initialDemoLoads: TransporterLoad[] = [
  { id: 'LD1001', from: 'Hyderabad', to: 'Bangalore', stops: ['Kurnool', 'Anantapur'], material: 'Electronics', vehicle: '32 FT Container', weight: '8 Ton', budget: '₹28,000', status: 'Open' },
  { id: 'LD1002', from: 'Vijayawada', to: 'Chennai', stops: ['Nellore'], material: 'Agricultural Goods', vehicle: '14 FT Truck', weight: '5 Ton', budget: '₹18,000', status: 'Assigned' },
  { id: 'LD1003', from: 'Warangal', to: 'Pune', stops: ['Hyderabad', 'Solapur'], material: 'Construction Materials', vehicle: '20 FT Truck', weight: '12 Ton', budget: '₹35,000', status: 'In Transit' },
  { id: 'LD1004', from: 'Visakhapatnam', to: 'Hyderabad', stops: ['Rajahmundry', 'Vijayawada'], material: 'Industrial Goods', vehicle: 'Container', weight: '10 Ton', budget: '₹24,000', status: 'Completed' },
]

const demoTripsList: TransporterTrip[] = [
  {
    id: 'TRP-84920',
    bookingId: 'BK-10492',
    route: 'Hyderabad → Bangalore',
    from: 'Hyderabad, Uppal',
    to: 'Bangalore, Electronic City',
    stops: ['Kurnool Bypass', 'Anantapur Hub'],
    driverName: 'Ramesh Kumar',
    driverPhone: '+91 98765 43210',
    truckNumber: 'TS 09 AB 1234',
    truckType: '32 FT Container',
    totalDistanceKm: 575,
    coveredDistanceKm: 280,
    eta: '4 hrs 15 mins',
    speedKmH: 62,
    status: 'In Transit',
  },
  {
    id: 'TRP-84921',
    bookingId: 'BK-10493',
    route: 'Vijayawada → Chennai',
    from: 'Vijayawada, Auto Nagar',
    to: 'Chennai, Ambattur',
    stops: ['Guntur', 'Nellore Bypass'],
    driverName: 'Suresh Reddy',
    driverPhone: '+91 98765 43211',
    truckNumber: 'AP 16 CD 5678',
    truckType: '14 FT Truck',
    totalDistanceKm: 450,
    coveredDistanceKm: 320,
    eta: '2 hrs 30 mins',
    speedKmH: 58,
    status: 'In Transit',
  },
  {
    id: 'TRP-84918',
    bookingId: 'BK-10489',
    route: 'Warangal → Hyderabad',
    from: 'Warangal MIDC',
    to: 'Hyderabad Cherlapally',
    stops: [],
    driverName: 'Mahesh Babu',
    driverPhone: '+91 98765 43212',
    truckNumber: 'TS 08 EF 9012',
    truckType: '20 FT Truck',
    totalDistanceKm: 150,
    coveredDistanceKm: 150,
    eta: 'Delivered',
    speedKmH: 0,
    status: 'Completed',
  },
]

const initialTrucks = [
  { number: 'TS 09 AB 1234', type: '32 FT Container', capacity: '15 Ton', driver: 'Ramesh Kumar', status: 'Available' },
  { number: 'AP 16 CD 5678', type: '14 FT Truck', capacity: '5 Ton', driver: 'Suresh Reddy', status: 'On Trip' },
  { number: 'TS 08 EF 9012', type: '20 FT Truck', capacity: '12 Ton', driver: 'Not Assigned', status: 'Maintenance' },
]

const initialDrivers = [
  { name: 'Ramesh Kumar', phone: '9876543210', licence: 'TS-2020-123456', status: 'Available' },
  { name: 'Suresh Reddy', phone: '9876543211', licence: 'AP-2021-234567', status: 'On Trip' },
  { name: 'Mahesh Babu', phone: '9876543212', licence: 'TS-2022-345678', status: 'Available' },
]

function getStoredTransporterLoads(): TransporterLoad[] {
  try {
    const raw = localStorage.getItem(TRANSPORTER_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (err) {
    console.error('Failed to parse transporter loads from storage:', err)
    return []
  }
}

function saveTransporterLoadsToStorage(loadsList: TransporterLoad[]) {
  try {
    localStorage.setItem(TRANSPORTER_STORAGE_KEY, JSON.stringify(loadsList))
  } catch (err) {
    console.error('Failed to save transporter loads:', err)
  }
}

export default function TransporterDashboard() {
  const [activePage, setActivePage] = useState<Page>('Overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [transporterCustomLoads, setTransporterCustomLoads] = useState<TransporterLoad[]>(getStoredTransporterLoads)
  const [showLoadForm, setShowLoadForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const [pickupCity, setPickupCity] = useState('')
  const [deliveryCity, setDeliveryCity] = useState('')
  const [intermediateStops, setIntermediateStops] = useState<string[]>([])
  const [newStopInput, setNewStopInput] = useState('')
  const [material, setMaterial] = useState('')
  const [weight, setWeight] = useState('')
  const [vehicle, setVehicle] = useState('32 FT Container')
  const [budget, setBudget] = useState('')

  const [trips] = useState<TransporterTrip[]>(demoTripsList)

  const [trackingModalOpen, setTrackingModalOpen] = useState(false)
  const [selectedTrackingTrip, setSelectedTrackingTrip] = useState<TrackingTripData | undefined>()

  const [chatModalOpen, setChatModalOpen] = useState(false)
  const [selectedChatTrip, setSelectedChatTrip] = useState<TransporterTrip | null>(null)

  const allLoads = useMemo(() => {
    const customerLoads: TransporterLoad[] = getCustomerLoads().map((load) => ({
      id: load.id,
      from: load.from,
      to: load.to,
      stops: (load as { stops?: string[] }).stops || [],
      material: load.material,
      vehicle: load.vehicle,
      weight: `${load.weight} Ton`,
      budget: load.amount ? `₹${Number(load.amount).toLocaleString('en-IN')}` : 'Not specified',
      status:
        load.status === 'IN_TRANSIT'
          ? 'In Transit'
          : load.status === 'COMPLETED'
            ? 'Completed'
            : 'Open',
    }))

    const combined = [...transporterCustomLoads, ...customerLoads, ...initialDemoLoads]
    const uniqueMap = new Map<string, TransporterLoad>()
    combined.forEach((item) => uniqueMap.set(item.id, item))
    const mergedList = Array.from(uniqueMap.values())

    saveMarketplaceLoads(mergedList)
    return mergedList
  }, [transporterCustomLoads])

  const [trucks] = useState(initialTrucks)

  const filteredLoads = allLoads.filter((load) => {
    const stopsText = (load.stops || []).join(' ')
    return `${load.id} ${load.from} ${load.to} ${stopsText} ${load.material} ${load.vehicle}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  })

  const handleAddStop = () => {
    const stopTrimmed = newStopInput.trim()
    if (!stopTrimmed) return
    setIntermediateStops((prev) => [...prev, stopTrimmed])
    setNewStopInput('')
  }

  const handleRemoveStop = (index: number) => {
    setIntermediateStops((prev) => prev.filter((_, i) => i !== index))
  }

  const handleCreateLoadSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!pickupCity.trim() || !deliveryCity.trim() || !material.trim() || !weight.trim()) {
      window.alert('Please fill all required fields.')
      return
    }

    const cleanBudgetNumber = budget.replace(/[^0-9]/g, '')
    const formattedBudget = cleanBudgetNumber
      ? `₹${Number(cleanBudgetNumber).toLocaleString('en-IN')}`
      : 'Negotiable'

    const newLoad: TransporterLoad = {
      id: `TR-${Date.now().toString().slice(-6)}`,
      from: pickupCity.trim(),
      to: deliveryCity.trim(),
      stops: intermediateStops,
      material: material.trim(),
      vehicle: vehicle.trim() || '32 FT Container',
      weight: `${weight.replace(/[^0-9.]/g, '')} Ton`,
      budget: formattedBudget,
      status: 'Open',
      createdAt: new Date().toISOString(),
      isTransporterLoad: true,
    }

    const updatedCustom = [newLoad, ...transporterCustomLoads]
    setTransporterCustomLoads(updatedCustom)
    saveTransporterLoadsToStorage(updatedCustom)

    setPickupCity('')
    setDeliveryCity('')
    setIntermediateStops([])
    setNewStopInput('')
    setMaterial('')
    setWeight('')
    setVehicle('32 FT Container')
    setBudget('')
    setShowLoadForm(false)
  }

  const openLiveTracking = (trip: TransporterTrip) => {
    setSelectedTrackingTrip({
      tripId: trip.id,
      bookingId: trip.bookingId,
      driverName: trip.driverName,
      driverPhone: trip.driverPhone,
      truckNumber: trip.truckNumber,
      truckType: trip.truckType,
      from: trip.from,
      to: trip.to,
      stops: trip.stops,
      currentStatus: trip.status === 'Completed' ? 'DELIVERED' : 'IN_TRANSIT',
      totalDistanceKm: trip.totalDistanceKm,
      coveredDistanceKm: trip.coveredDistanceKm,
      eta: trip.eta,
      speedKmH: trip.speedKmH,
    })
    setTrackingModalOpen(true)
  }

  const openTripChat = (trip: TransporterTrip) => {
    setSelectedChatTrip(trip)
    setChatModalOpen(true)
  }

  const stats = [
    { label: 'Total Loads', value: allLoads.length.toString(), change: '+14.2%', icon: Package, color: 'bg-blue-50 text-blue-600' },
    { label: 'Active Trips', value: '36', change: '+8.2%', icon: Truck, color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Available Trucks', value: '18', change: 'Fleet ready', icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Monthly Revenue', value: '₹8.45L', change: '+15.3%', icon: IndianRupee, color: 'bg-amber-50 text-amber-600' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-950 text-white transition-transform duration-300 lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
              <Truck size={23} />
            </div>
            <div>
              <h1 className="text-lg font-bold">Transport Connect</h1>
              <p className="text-xs text-slate-400">Transporter Portal</p>
            </div>
          </div>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X size={22} />
          </button>
        </div>

        <div className="border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-lg font-bold">
              ST
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Sai Transport Agency</p>
              <p className="text-xs text-slate-400">Verified Transporter</p>
            </div>
            <CheckCircle2 size={17} className="ml-auto shrink-0 text-emerald-400" />
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Workspace
          </p>
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = activePage === item.name
            return (
              <button
                key={item.name}
                onClick={() => {
                  setActivePage(item.name)
                  setSidebarOpen(false)
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                  active
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/30'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={19} />
                {item.name}
                {item.name === 'Quotations' && (
                  <span className="ml-auto rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-slate-950">5</span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <button
            onClick={() => setActivePage('Company Profile')}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-400 hover:bg-white/5 hover:text-white"
          >
            <Settings size={19} />
            Settings
          </button>
        </div>
      </aside>

      <main className="min-h-screen lg:ml-72">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <button className="rounded-lg p-2 hover:bg-slate-100 lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu size={23} />
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{activePage}</h2>
              <p className="hidden text-xs text-slate-500 sm:block">Manage your transport business operations</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50">
              <Bell size={19} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
            </button>
            <div className="hidden items-center gap-3 border-l border-slate-200 pl-4 sm:flex">
              <div className="text-right">
                <p className="text-sm font-semibold">Sai Transport Agency</p>
                <p className="text-xs text-slate-500">Transporter Account</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">ST</div>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8">
          {activePage === 'Overview' && (
            <div className="space-y-7">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Welcome back, Sai! 👋</h3>
                  <p className="mt-1 text-sm text-slate-500">Here is what is happening with your transport business today.</p>
                </div>
                <button
                  onClick={() => {
                    setActivePage('Manage Loads')
                    setShowLoadForm(true)
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
                >
                  <Plus size={18} /> Create New Load
                </button>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => {
                  const Icon = stat.icon
                  return (
                    <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.color}`}>
                          <Icon size={21} />
                        </div>
                        <MoreHorizontal size={20} className="text-slate-400" />
                      </div>
                      <p className="mt-5 text-sm text-slate-500">{stat.label}</p>
                      <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
                        <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                        <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                          <TrendingUp size={14} /> {stat.change}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="grid gap-6 xl:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 xl:col-span-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-slate-900">Business Performance</h3>
                      <p className="mt-1 text-xs text-slate-500">Monthly revenue overview</p>
                    </div>
                    <span className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">FY 2026</span>
                  </div>
                  <div className="mt-8 flex h-48 items-end justify-around gap-3 border-b border-slate-100 px-2">
                    {[42, 62, 48, 76, 58, 92].map((height, index) => (
                      <div key={index} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                        <div className="w-full max-w-12 rounded-t-lg bg-blue-500 transition-all hover:bg-blue-700" style={{ height: `${height}%` }} />
                        <span className="text-xs text-slate-400">{['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'][index]}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500">Total revenue</p>
                      <p className="mt-1 text-xl font-bold text-slate-900">₹42,85,000</p>
                    </div>
                    <span className="flex items-center gap-1 text-sm font-semibold text-emerald-600"><ArrowUpRight size={17} /> 15.3%</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <h3 className="font-bold text-slate-900">Trip Status</h3>
                  <p className="mt-1 text-xs text-slate-500">Current fleet operations</p>
                  <div className="relative mx-auto my-7 flex h-36 w-36 items-center justify-center rounded-full border-[14px] border-blue-500">
                    <div className="absolute inset-[-14px] rotate-45 rounded-full border-[14px] border-transparent border-r-amber-400 border-t-emerald-400" />
                    <div className="text-center">
                      <p className="text-3xl font-bold text-slate-900">36</p>
                      <p className="text-xs text-slate-500">Active trips</p>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-slate-600"><span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> In Transit</span><b>20</b></div>
                    <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-slate-600"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Completed</span><b>10</b></div>
                    <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-slate-600"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Pending</span><b>6</b></div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-100 p-5">
                  <div>
                    <h3 className="font-bold text-slate-900">Recent Loads</h3>
                    <p className="mt-1 text-xs text-slate-500">Latest transport posts</p>
                  </div>
                  <button onClick={() => setActivePage('Manage Loads')} className="text-sm font-semibold text-blue-600 hover:text-blue-800">View all</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr><th className="px-5 py-4">Load ID</th><th className="px-5 py-4">Route</th><th className="px-5 py-4">Material</th><th className="px-5 py-4">Budget</th><th className="px-5 py-4">Status</th></tr>
                    </thead>
                    <tbody>
                      {allLoads.slice(0, 5).map((load) => (
                        <tr key={load.id} className="border-t border-slate-100">
                          <td className="px-5 py-4 font-semibold text-blue-600">
                            {load.id}
                            {load.isTransporterLoad && <span className="ml-2 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-600">Yours</span>}
                          </td>
                          <td className="px-5 py-4">
                            <RouteDisplay from={load.from} to={load.to} stops={load.stops} />
                          </td>
                          <td className="px-5 py-4">{load.material}</td>
                          <td className="px-5 py-4 font-semibold">{load.budget}</td>
                          <td className="px-5 py-4"><StatusBadge status={load.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activePage === 'Manage Loads' && (
            <div className="space-y-6">
              <PageHeading
                title="Manage Loads"
                subtitle="Create, monitor and manage your multi-stop transportation loads."
                action={() => setShowLoadForm(!showLoadForm)}
                actionText={showLoadForm ? 'Close Form' : 'Create Load'}
              />

              {showLoadForm && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Create New Transporter Load</h3>
                      <p className="text-xs text-slate-500">Post a direct or multi-stop route load with custom vehicle specifications.</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Multi-stop Supported</span>
                  </div>

                  <form onSubmit={handleCreateLoadSubmit} className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-700">Pickup Origin *</span>
                        <input
                          required
                          value={pickupCity}
                          onChange={(e) => setPickupCity(e.target.value)}
                          placeholder="e.g. Hyderabad, Uppal"
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-700">Final Destination *</span>
                        <input
                          required
                          value={deliveryCity}
                          onChange={(e) => setDeliveryCity(e.target.value)}
                          placeholder="e.g. Bangalore, Electronic City"
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </label>
                    </div>

                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-700">Intermediate Stops (Optional)</span>
                        <span className="text-xs text-slate-500">{intermediateStops.length} stops added</span>
                      </div>

                      <div className="flex gap-2">
                        <input
                          value={newStopInput}
                          onChange={(e) => setNewStopInput(e.target.value)}
                          placeholder="Add via stop (e.g. Kurnool, Anantapur)"
                          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleAddStop()
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleAddStop}
                          className="flex items-center gap-1 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-900"
                        >
                          <Plus size={16} /> Add Stop
                        </button>
                      </div>

                      {intermediateStops.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {intermediateStops.map((stop, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm"
                            >
                              <Navigation size={12} className="text-blue-600" />
                              Stop {idx + 1}: {stop}
                              <button
                                type="button"
                                onClick={() => handleRemoveStop(idx)}
                                className="ml-1 text-slate-400 hover:text-red-600"
                              >
                                <X size={14} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-700">Material / Cargo Details *</span>
                        <input
                          required
                          value={material}
                          onChange={(e) => setMaterial(e.target.value)}
                          placeholder="e.g. Industrial Machinery / Cotton"
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-700">Cargo Weight (Ton) *</span>
                        <input
                          required
                          type="number"
                          step="0.1"
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                          placeholder="e.g. 10.5"
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </label>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-700">Vehicle Type Required *</span>
                        <select
                          value={vehicle}
                          onChange={(e) => setVehicle(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                          <option>32 FT Container</option>
                          <option>32 FT Multi-Axle</option>
                          <option>20 FT Container</option>
                          <option>14 FT Truck</option>
                          <option>Open Trailer (40 FT)</option>
                          <option>Tata Ace / Pickup</option>
                        </select>
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-700">Expected Budget (₹)</span>
                        <input
                          value={budget}
                          onChange={(e) => setBudget(e.target.value)}
                          placeholder="e.g. 35000"
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </label>
                    </div>

                    <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowLoadForm(false)}
                        className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700"
                      >
                        Publish Load
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search loads by ID, origin, via stops, destination or material..."
              />

              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-4">Load ID</th>
                      <th className="px-5 py-4">Route & Multi-Stops</th>
                      <th className="px-5 py-4">Material</th>
                      <th className="px-5 py-4">Vehicle</th>
                      <th className="px-5 py-4">Weight</th>
                      <th className="px-5 py-4">Budget</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLoads.map((load) => (
                      <tr key={load.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                        <td className="px-5 py-4 font-semibold text-blue-600">
                          {load.id}
                          {load.isTransporterLoad && (
                            <span className="ml-1.5 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                              Yours
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <RouteDisplay from={load.from} to={load.to} stops={load.stops} />
                        </td>
                        <td className="px-5 py-4 font-medium text-slate-700">{load.material}</td>
                        <td className="px-5 py-4 text-slate-600">{load.vehicle}</td>
                        <td className="px-5 py-4">{load.weight}</td>
                        <td className="px-5 py-4 font-semibold text-slate-900">{load.budget}</td>
                        <td className="px-5 py-4"><StatusBadge status={load.status} /></td>
                        <td className="px-5 py-4 text-right">
                          {load.isTransporterLoad ? (
                            <button
                              onClick={() => {
                                const next = transporterCustomLoads.filter((item) => item.id !== load.id)
                                setTransporterCustomLoads(next)
                                saveTransporterLoadsToStorage(next)
                              }}
                              className="text-slate-400 hover:text-red-600"
                              title="Delete this load"
                            >
                              <Trash2 size={16} />
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">Marketplace</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activePage === 'Bookings & Trips' && (
            <div className="space-y-6">
              <PageHeading title="Bookings & Active Trips" subtitle="Track live GPS locations and communicate directly with drivers." />
              
              <div className="grid gap-5 md:grid-cols-3">
                <SmallStat label="Total Bookings" value="128" icon={ClipboardList} />
                <SmallStat label="In Progress Trips" value="36" icon={Truck} />
                <SmallStat label="Delivered Trips" value="92" icon={CheckCircle2} />
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="border-b border-slate-100 px-6 py-4">
                  <h4 className="font-bold text-slate-900">Current Fleet Operations & Live Runs</h4>
                  <p className="text-xs text-slate-500">Click Live Track to see speed and ETA, or Chat to message the driver directly.</p>
                </div>

                <div className="divide-y divide-slate-100">
                  {trips.map((trip) => (
                    <div key={trip.id} className="flex flex-col justify-between gap-4 p-5 hover:bg-slate-50/60 sm:flex-row sm:items-center">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-blue-600">{trip.id}</span>
                          <span className="text-xs text-slate-400">· Booking: {trip.bookingId}</span>
                          <StatusBadge status={trip.status} />
                        </div>
                        <h4 className="text-base font-bold text-slate-900">{trip.route}</h4>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><Truck size={14} /> {trip.truckNumber} ({trip.truckType})</span>
                          <span>·</span>
                          <span className="font-medium text-slate-700">Driver: {trip.driverName}</span>
                          {trip.status === 'In Transit' && (
                            <>
                              <span>·</span>
                              <span className="font-semibold text-emerald-600 flex items-center gap-1">
                                <Clock size={13} /> ETA: {trip.eta}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => openLiveTracking(trip)}
                          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-700"
                        >
                          <Navigation size={14} className="animate-pulse" /> Live Track
                        </button>
                        <button
                          onClick={() => openTripChat(trip)}
                          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <MessageSquare size={14} className="text-blue-600" /> Chat
                        </button>
                        <a
                          href={`tel:${trip.driverPhone}`}
                          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 hover:text-emerald-600"
                          title="Call Driver"
                        >
                          <Phone size={15} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activePage === 'Manage Trucks' && (
            <div className="space-y-6">
              <PageHeading title="Manage Trucks" subtitle="Monitor your registered fleet and availability." action={() => alert('Add Truck feature is ready for your fleet models.')} actionText="Add Truck" />
              <div className="grid gap-5 md:grid-cols-3">
                {trucks.map((truck) => (
                  <div key={truck.number} className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex items-center justify-between">
                      <div className="rounded-xl bg-blue-50 p-3 text-blue-600"><Truck size={23} /></div>
                      <StatusBadge status={truck.status} />
                    </div>
                    <h3 className="mt-4 font-bold text-slate-900">{truck.number}</h3>
                    <p className="mt-1 text-sm text-slate-500">{truck.type}</p>
                    <div className="mt-5 space-y-3 border-t border-slate-100 pt-4 text-sm">
                      <div className="flex justify-between"><span className="text-slate-500">Capacity</span><b>{truck.capacity}</b></div>
                      <div className="flex justify-between"><span className="text-slate-500">Driver</span><b>{truck.driver}</b></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activePage === 'Drivers' && (
            <div className="space-y-6">
              <PageHeading title="Driver Management" subtitle="View and manage drivers associated with your fleet." />
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <table className="w-full min-w-[650px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr><th className="px-5 py-4">Driver</th><th className="px-5 py-4">Mobile</th><th className="px-5 py-4">Licence Number</th><th className="px-5 py-4">Availability</th></tr>
                  </thead>
                  <tbody>
                    {initialDrivers.map((driver) => (
                      <tr key={driver.phone} className="border-t border-slate-100">
                        <td className="px-5 py-4 font-semibold">{driver.name}</td>
                        <td className="px-5 py-4">{driver.phone}</td>
                        <td className="px-5 py-4">{driver.licence}</td>
                        <td className="px-5 py-4"><StatusBadge status={driver.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activePage === 'Quotations' && (
            <div className="space-y-6">
              <PageHeading title="Quotations" subtitle="Review quotations received for your loads." />
              <div className="grid gap-5 md:grid-cols-3">
                <SmallStat label="Total Quotations" value="42" icon={FileText} />
                <SmallStat label="Pending Review" value="12" icon={Clock} />
                <SmallStat label="Accepted" value="24" icon={CheckCircle2} />
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
                <FileText size={42} className="mx-auto text-blue-500" />
                <h3 className="mt-4 font-bold">Quotation Management</h3>
                <p className="mt-2 text-sm text-slate-500">Review quotes from truck owners for your posted transporter loads.</p>
              </div>
            </div>
          )}

          {activePage === 'Payments' && (
            <div className="space-y-6">
              <PageHeading title="Payments & Earnings" subtitle="Monitor revenue, settlements and payment history." />
              <div className="grid gap-5 md:grid-cols-3">
                <SmallStat label="Total Earnings" value="₹8,45,000" icon={IndianRupee} />
                <SmallStat label="Pending Payments" value="₹1,25,000" icon={Clock} />
                <SmallStat label="Settled Amount" value="₹7,20,000" icon={CheckCircle2} />
              </div>
            </div>
          )}

          {activePage === 'Reports' && (
            <div className="space-y-6">
              <PageHeading title="Reports & Analytics" subtitle="Review your business performance and operations." />
              <div className="grid gap-5 md:grid-cols-3">
                <SmallStat label="Loads Posted" value={allLoads.length.toString()} icon={Package} />
                <SmallStat label="Completed Trips" value="74" icon={CheckCircle2} />
                <SmallStat label="Average Trip Budget" value="₹24,500" icon={TrendingUp} />
              </div>
            </div>
          )}

          {activePage === 'Company Profile' && (
            <div className="space-y-6">
              <PageHeading title="Company Profile" subtitle="Manage your transporter business information." />
              <div className="max-w-3xl rounded-2xl border border-slate-200 bg-white p-6">
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><Building2 size={30} /></div>
                  <div><h3 className="text-lg font-bold">Sai Transport Agency</h3><p className="text-sm text-emerald-600">Demo verified account</p></div>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <ProfileField label="Company Name" value="Sai Transport Agency" />
                  <ProfileField label="Contact Person" value="Sai" />
                  <ProfileField label="Email Address" value="sai@example.com" />
                  <ProfileField label="Mobile Number" value="9876543210" />
                  <ProfileField label="GSTIN" value="36ABCDE1234F1Z5" />
                  <ProfileField label="Business Address" value="Hyderabad, Telangana" />
                </div>
              </div>
            </div>
          )}

          <footer className="mt-10 flex flex-col justify-between gap-2 border-t border-slate-200 pt-5 text-xs text-slate-400 sm:flex-row">
            <p>© 2026 Transport Connect. All rights reserved.</p>
            <p>Transporter Portal · Active Session</p>
          </footer>
        </div>
      </main>

      <LiveTripTrackingModal
        isOpen={trackingModalOpen}
        onClose={() => setTrackingModalOpen(false)}
        trip={selectedTrackingTrip}
      />

      {selectedChatTrip && (
        <TripChatModal
          isOpen={chatModalOpen}
          onClose={() => {
            setChatModalOpen(false)
            setSelectedChatTrip(null)
          }}
          tripId={selectedChatTrip.id}
          bookingId={selectedChatTrip.bookingId}
          route={selectedChatTrip.route}
          currentUserId="USER-TRANSPORTER-SAI"
          currentUserName="Sai Transport Agency"
          currentUserRole="Transporter"
          counterpartName={`${selectedChatTrip.driverName} (Driver)`}
          counterpartPhone={selectedChatTrip.driverPhone}
        />
      )}
    </div>
  )
}

function RouteDisplay({ from, to, stops }: { from: string; to: string; stops?: string[] }) {
  const hasStops = stops && stops.length > 0
  return (
    <div>
      <div className="flex items-center gap-1.5 font-medium text-slate-800">
        <MapPin size={14} className="shrink-0 text-blue-600" />
        <span>{from}</span>
        <span className="text-slate-400">→</span>
        <span>{to}</span>
      </div>
      {hasStops && (
        <div className="mt-1 flex flex-wrap items-center gap-1 text-[11px] text-slate-500">
          <span className="font-semibold text-slate-600">Via:</span>
          {stops.map((stop, i) => (
            <span key={i} className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-700">
              {stop}
              {i < stops.length - 1 ? ' ·' : ''}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Open: 'bg-blue-50 text-blue-700',
    Assigned: 'bg-violet-50 text-violet-700',
    'In Transit': 'bg-amber-50 text-amber-700',
    Completed: 'bg-emerald-50 text-emerald-700',
    Available: 'bg-emerald-50 text-emerald-700',
    'On Trip': 'bg-blue-50 text-blue-700',
    Maintenance: 'bg-red-50 text-red-700',
  }
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[status] || 'bg-slate-100 text-slate-600'}`}>{status}</span>
}

function PageHeading({ title, subtitle, action, actionText }: {
  title: string
  subtitle: string
  action?: () => void
  actionText?: string
}) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div><h3 className="text-xl font-bold text-slate-900">{title}</h3><p className="mt-1 text-sm text-slate-500">{subtitle}</p></div>
      {action && <button onClick={action} className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"><Plus size={17} />{actionText}</button>}
    </div>
  )
}

function SearchBar({ value, onChange, placeholder }: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return <div className="flex max-w-xl items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"><Search size={18} className="text-slate-400" /><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-transparent text-sm outline-none" /></div>
}

function SmallStat({ label, value, icon: Icon }: {
  label: string
  value: string
  icon: typeof Package
}) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Icon size={20} /></div><p className="mt-4 text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-slate-900">{value}</p></div>
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs text-slate-500">{label}</p><p className="mt-1 font-medium text-slate-800">{value}</p></div>
}