import { Fragment, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { addPaymentSubmission, getPaymentSubmissions, type CustomerPaymentSubmission } from '../../../utils/paymentStorage'
import { getTripTrackingRecord, updateTripPlaceName, type TripTrackingRecord } from '../../../utils/trackingStorage'
import {
  addCustomerLoad,
  getCustomerLoads,
  getQuotations,
  updateQuotationStatus,
  type Quotation,
} from '../../../utils/loadStorage'
import LocationAutocompleteInput from '../../../components/common/LocationAutocompleteInput'
import {
  LayoutDashboard,
  Package,
  Truck,
  MapPin,
  CreditCard,
  Bell,
  User,
  Menu,
  X,
  Plus,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Search,
  LogOut,
  ShieldCheck,
} from 'lucide-react'

type RoutePoint = {
  id: string
  city: string
  address: string
}

type Load = {
  id: string
  from: string
  to: string
  vehicle: string
  material: string
  weight: string
  date: string
  amount: string
  status: string
  createdAt: string
  loadingPoints?: RoutePoint[]
  unloadingPoints?: RoutePoint[]
}

const menuItems = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Post a Load', icon: Plus },
  { label: 'Find Trucks', icon: Truck },
  { label: 'My Bookings', icon: Package },
  { label: 'Track Shipment', icon: MapPin },
  { label: 'Payments', icon: CreditCard },
  { label: 'Notifications', icon: Bell },
  { label: 'My Profile', icon: User },
]

const initialBookings: Load[] = [
  {
    id: 'TC1001',
    from: 'Hyderabad',
    to: 'Bengaluru',
    vehicle: '32 Feet Container',
    material: 'Electronics',
    weight: '5',
    date: '2026-11-10',
    amount: '18000',
    status: 'IN_TRANSIT',
    createdAt: '10 Nov 2026',
  },
  {
    id: 'TC1002',
    from: 'Vijayawada',
    to: 'Chennai',
    vehicle: '14 Feet Truck',
    material: 'Furniture',
    weight: '3',
    date: '2026-11-08',
    amount: '12500',
    status: 'COMPLETED',
    createdAt: '08 Nov 2026',
  },
]

function CustomerDashboard() {
  const [activePage, setActivePage] = useState('Overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loads, setLoads] = useState<Load[]>(() => {
    const savedLoads = getCustomerLoads()
    const savedIds = new Set(savedLoads.map((load) => load.id))
    return [
      ...savedLoads,
      ...initialBookings.filter((load) => !savedIds.has(load.id)),
    ]
  })
  const [quotations, setQuotations] = useState<Quotation[]>(() => getQuotations())

  const handleQuotationDecision = (quotationId: string, loadId: string, decision: 'ACCEPTED' | 'REJECTED') => {
    const currentQuotations = getQuotations()
    const selectedQuotation = currentQuotations.find((quotation) => quotation.id === quotationId)

    if (!selectedQuotation || selectedQuotation.status !== 'PENDING') {
      alert('This quotation has already been processed.')
      setQuotations(getQuotations())
      return
    }

    if (decision === 'ACCEPTED') {
      const alreadyAccepted = currentQuotations.some(
        (quotation) => quotation.loadId === loadId && quotation.status === 'ACCEPTED',
      )
      if (alreadyAccepted) {
        alert('A quotation has already been accepted for this load.')
        setQuotations(currentQuotations)
        return
      }

      currentQuotations
        .filter((quotation) => quotation.loadId === loadId && quotation.status === 'PENDING')
        .forEach((quotation) => {
          updateQuotationStatus(
            quotation.id,
            quotation.id === quotationId ? 'ACCEPTED' : 'REJECTED',
          )
        })

      const acceptedAmount = selectedQuotation.amount
      setLoads((previous) => previous.map((load) =>
        load.id === loadId
          ? { ...load, amount: acceptedAmount, status: 'BOOKED' }
          : load,
      ))
      alert('Quotation accepted! Booking confirmed in demo mode.')
    } else {
      updateQuotationStatus(quotationId, 'REJECTED')
      alert('Quotation rejected.')
    }

    setQuotations(getQuotations())
  }

  const addLoad = (newLoad: Load) => {
    addCustomerLoad(newLoad)
    setLoads((previous) => [newLoad, ...previous])
    setActivePage('My Bookings')
  }

  const renderContent = () => {
    if (activePage === 'Overview') {
      return (
        <>
          <div className="mb-7">
            <h2 className="text-2xl font-extrabold text-slate-900">
              Dashboard Overview
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Manage your transportation activities.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { title: 'Total Loads', value: String(loads.length), icon: Package, color: 'bg-blue-100 text-blue-700' },
              { title: 'Active Shipments', value: String(loads.filter((l) => l.status === 'IN_TRANSIT').length), icon: Truck, color: 'bg-orange-100 text-orange-700' },
              { title: 'Completed', value: String(loads.filter((l) => l.status === 'COMPLETED').length), icon: CheckCircle2, color: 'bg-green-100 text-green-700' },
              { title: 'Open Loads', value: String(loads.filter((l) => l.status === 'OPEN').length), icon: Clock, color: 'bg-purple-100 text-purple-700' },
            ].map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.title} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                  <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${stat.color}`}>
                    <Icon size={22} />
                  </div>
                  <p className="text-sm text-slate-500">{stat.title}</p>
                  <h3 className="mt-1 text-2xl font-extrabold text-slate-900">
                    {stat.value}
                  </h3>
                </div>
              )
            })}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl bg-blue-700 p-6 text-white lg:col-span-2">
              <p className="text-sm text-blue-100">Need to transport goods?</p>
              <h3 className="mt-2 text-2xl font-extrabold">
                Book your truck easily.
              </h3>
              <p className="mt-2 max-w-md text-sm text-blue-100">
                Post your load and receive competitive quotations from transporters.
              </p>
              <button
                onClick={() => setActivePage('Post a Load')}
                className="mt-6 flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-blue-700 hover:bg-blue-50"
              >
                Post a Load <ArrowUpRight size={18} />
              </button>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <h3 className="font-bold text-slate-900">Quick Actions</h3>
              <div className="mt-4 space-y-3">
                <button onClick={() => setActivePage('Find Trucks')} className="flex w-full items-center gap-3 rounded-xl bg-slate-50 p-3 text-left text-sm font-semibold hover:bg-blue-50">
                  <Truck size={19} className="text-blue-700" /> Find Trucks
                </button>
                <button onClick={() => setActivePage('My Bookings')} className="flex w-full items-center gap-3 rounded-xl bg-slate-50 p-3 text-left text-sm font-semibold hover:bg-blue-50">
                  <Package size={19} className="text-blue-700" /> My Bookings
                </button>
                <button onClick={() => setActivePage('Track Shipment')} className="flex w-full items-center gap-3 rounded-xl bg-slate-50 p-3 text-left text-sm font-semibold hover:bg-blue-50">
                  <MapPin size={19} className="text-blue-700" /> Track Shipment
                </button>
              </div>
            </div>
          </div>

          <BookingTable loads={loads} quotations={quotations} onQuotationDecision={handleQuotationDecision} />
        </>
      )
    }

    if (activePage === 'Post a Load') {
      return <PostLoad onSubmitLoad={addLoad} />
    }

    if (activePage === 'Find Trucks') {
      return <FindTrucks />
    }

    if (activePage === 'My Bookings') {
      return <BookingTable loads={loads} quotations={quotations} onQuotationDecision={handleQuotationDecision} />
    }

    if (activePage === 'Payments') {
      return <CustomerPayments loads={loads} quotations={quotations} />
    }

    if (activePage === 'Track Shipment') {
      return <CustomerTracking loads={loads} quotations={quotations} />
    }

    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center">
        <Package size={42} className="mx-auto text-blue-700" />
        <h2 className="mt-4 text-xl font-bold text-slate-900">{activePage}</h2>
        <p className="mt-2 text-sm text-slate-500">
          This section UI will be developed in the next stage.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-950 text-white transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-20 items-center justify-between border-b border-slate-800 px-6">
          <h1 className="text-xl font-extrabold">
            Transport<span className="text-blue-400">Connect</span>
          </h1>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X />
          </button>
        </div>

        <div className="px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Customer Menu
          </p>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.label}
                onClick={() => {
                  setActivePage(item.label)
                  setSidebarOpen(false)
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  activePage === item.label
                    ? 'bg-blue-700 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon size={19} /> {item.label}
              </button>
            )
          })}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <button
            onClick={() => setActivePage('Overview')}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-300 hover:bg-slate-800"
          >
            <LogOut size={19} /> Back to Overview
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"
            >
              <Menu />
            </button>
            <div>
              <h2 className="font-bold text-slate-900">Customer Portal</h2>
              <p className="text-xs text-slate-500">Welcome to TransportConnect</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setActivePage('Notifications')}
              className="relative rounded-xl p-2 hover:bg-slate-100"
            >
              <Bell size={21} />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
            </button>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold text-slate-900">Customer</p>
                <p className="text-xs text-slate-500">Demo User</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                C
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}

function BookingTable({
  loads,
  quotations,
  onQuotationDecision,
}: {
  loads: Load[]
  quotations: Quotation[]
  onQuotationDecision: (quotationId: string, loadId: string, decision: 'ACCEPTED' | 'REJECTED') => void
}) {
  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 p-5">
        <h3 className="font-bold text-slate-900">My Loads & Bookings</h3>
        <span className="text-xs font-semibold text-blue-700">Frontend Demo</span>
      </div>

      {loads.length === 0 ? (
        <div className="p-10 text-center">
          <Package size={36} className="mx-auto text-slate-300" />
          <p className="mt-3 font-semibold text-slate-700">No loads posted yet</p>
          <p className="mt-1 text-sm text-slate-500">Post your first load to see it here.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4">Load ID</th>
                <th className="px-5 py-4">Route</th>
                <th className="px-5 py-4">Goods</th>
                <th className="px-5 py-4">Vehicle</th>
                <th className="px-5 py-4">Pickup Date</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Budget</th>
              </tr>
            </thead>
            <tbody>
              {loads.map((load) => (
                <Fragment key={load.id}>
                  <tr className="border-t border-slate-100">
                    <td className="px-5 py-4 font-bold text-blue-700">{load.id}</td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800">{load.from}</div>
                      <div className="text-xs text-slate-400">to {load.to}</div>
                      <div className="mt-1 text-xs font-medium text-blue-700">
                        {(load.loadingPoints?.length || 1)} loading · {(load.unloadingPoints?.length || 1)} unloading
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold">{load.material}</div>
                      <div className="text-xs text-slate-400">{load.weight} tonnes</div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{load.vehicle}</td>
                    <td className="px-5 py-4 text-slate-600">{load.date}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        load.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-700'
                          : load.status === 'IN_TRANSIT'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-orange-100 text-orange-700'
                      }`}>
                        {load.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {load.amount ? `₹${Number(load.amount).toLocaleString('en-IN')}` : 'Not specified'}
                    </td>
                  </tr>
                  <tr key={`${load.id}-route-details`} className="border-t border-slate-100 bg-slate-50/70">
                    <td colSpan={7} className="px-5 py-5">
                      <div className="grid gap-5 md:grid-cols-2">
                        <div className="rounded-xl border border-blue-100 bg-white p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <h4 className="font-bold text-slate-900">Loading Points</h4>
                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                              {load.loadingPoints?.length || 1} stops
                            </span>
                          </div>
                          <div className="space-y-3">
                            {(load.loadingPoints?.length
                              ? load.loadingPoints
                              : [{ id: `${load.id}-pickup`, city: load.from, address: 'Address not available for this older booking' }]
                            ).map((point, index) => (
                              <div key={point.id} className="flex gap-3">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                                  {index + 1}
                                </span>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-slate-800">{point.city}</p>
                                  <p className="mt-0.5 whitespace-pre-wrap break-words text-xs text-slate-500">{point.address}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-xl border border-emerald-100 bg-white p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <h4 className="font-bold text-slate-900">Unloading Points</h4>
                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                              {load.unloadingPoints?.length || 1} stops
                            </span>
                          </div>
                          <div className="space-y-3">
                            {(load.unloadingPoints?.length
                              ? load.unloadingPoints
                              : [{ id: `${load.id}-drop`, city: load.to, address: 'Address not available for this older booking' }]
                            ).map((point, index) => (
                              <div key={point.id} className="flex gap-3">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                                  {index + 1}
                                </span>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-slate-800">{point.city}</p>
                                  <p className="mt-0.5 whitespace-pre-wrap break-words text-xs text-slate-500">{point.address}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {loads.length > 0 && (
        <div className="border-t border-slate-100 p-5">
          <div className="mb-4">
            <h4 className="font-bold text-slate-900">Received Quotations</h4>
            <p className="mt-1 text-xs text-slate-500">
              Transporter offers for your posted loads will appear here.
            </p>
          </div>

          <div className="space-y-4">
            {loads.map((load) => {
              const loadQuotations = quotations.filter(
                (quotation) => quotation.loadId === load.id,
              )

              return (
                <div key={load.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">{load.from} → {load.to}</p>
                      <p className="mt-1 text-xs text-slate-500">Load ID: {load.id}</p>
                    </div>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      {loadQuotations.length} {loadQuotations.length === 1 ? 'Offer' : 'Offers'}
                    </span>
                  </div>

                  {loadQuotations.length === 0 ? (
                    <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-500">
                      No quotations received yet. Please check again later.
                    </p>
                  ) : (
                    <div className="mt-3 space-y-3">
                      {loadQuotations.map((quotation) => (
                        <div
                          key={quotation.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 p-4"
                        >
                          <div>
                            <p className="font-semibold text-slate-800">{quotation.truckOwner}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              Submitted: {new Date(quotation.submittedAt).toLocaleString('en-IN')}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Quotation ID: {quotation.id}
                            </p>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="text-lg font-extrabold text-green-700">
                              ₹{Number(quotation.amount).toLocaleString('en-IN')}
                            </p>
                            <span className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                              quotation.status === 'ACCEPTED'
                                ? 'bg-green-100 text-green-700'
                                : quotation.status === 'REJECTED'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-amber-100 text-amber-700'
                            }`}>
                              {quotation.status}
                            </span>
                            {quotation.status === 'PENDING' && !loadQuotations.some((item) => item.status === 'ACCEPTED') && (
                              <div className="mt-3 flex flex-wrap gap-2 sm:justify-end">
                                <button
                                  type="button"
                                  onClick={() => onQuotationDecision(quotation.id, load.id, 'ACCEPTED')}
                                  className="rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700"
                                >
                                  Accept Quotation
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onQuotationDecision(quotation.id, load.id, 'REJECTED')}
                                  className="rounded-lg border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

type CustomerTrackingProps = {
  loads: Load[]
  quotations: Quotation[]
}

function CustomerTracking({ loads, quotations }: CustomerTrackingProps) {
  const [trackingRecords, setTrackingRecords] = useState<Record<string, TripTrackingRecord | null>>({})
  const [placeNames, setPlaceNames] = useState<Record<string, string>>({})
  const lastGeocodedAt = useRef<Record<string, number>>({})

  const acceptedBookings = quotations
    .filter((quotation) => quotation.status === 'ACCEPTED')
    .map((quotation) => ({
      quotation,
      load: loads.find((item) => item.id === quotation.loadId),
    }))
    .filter((item): item is { quotation: Quotation; load: Load } => Boolean(item.load))

  useEffect(() => {
    const refreshTracking = () => {
      const nextRecords: Record<string, TripTrackingRecord | null> = {}
      acceptedBookings.forEach(({ quotation }) => {
        nextRecords[quotation.id] = getTripTrackingRecord(quotation.id)
      })
      setTrackingRecords(nextRecords)
    }

    refreshTracking()
    const intervalId = window.setInterval(refreshTracking, 3000)
    return () => window.clearInterval(intervalId)
  }, [quotations, loads])

  useEffect(() => {
    acceptedBookings.forEach(({ quotation }) => {
      const location = trackingRecords[quotation.id]?.lastLocation
      if (!location) return

      if (location.placeName) {
        setPlaceNames((previous) => ({ ...previous, [quotation.id]: location.placeName! }))
        return
      }

      const lastRequested = lastGeocodedAt.current[quotation.id] || 0
      if (Date.now() - lastRequested < 15000) return
      lastGeocodedAt.current[quotation.id] = Date.now()

      const params = new URLSearchParams({
        format: 'jsonv2',
        lat: String(location.latitude),
        lon: String(location.longitude),
      })

      fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
        headers: { Accept: 'application/json' },
      })
        .then((response) => {
          if (!response.ok) throw new Error('Place lookup failed')
          return response.json()
        })
        .then((data: { display_name?: string; address?: Record<string, string> }) => {
          const address = data.address || {}
          const readablePlace = [
            address.suburb || address.neighbourhood || address.residential,
            address.city_district || address.city || address.town || address.village,
            address.state,
          ].filter(Boolean).join(', ')
          const finalPlaceName = readablePlace || data.display_name || 'Place name unavailable'
          setPlaceNames((previous) => ({
            ...previous,
            [quotation.id]: finalPlaceName,
          }))
          if (finalPlaceName !== 'Place name unavailable') {
            updateTripPlaceName(quotation.id, finalPlaceName)
          }
        })
        .catch(() => {
          setPlaceNames((previous) => ({
            ...previous,
            [quotation.id]: 'Unable to fetch place name. Use the map link below.',
          }))
        })
    })
  }, [trackingRecords, quotations, loads])

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900">Track Shipment</h2>
        <p className="mt-1 text-sm text-slate-500">
          View the latest driver location for your confirmed bookings. Updates refresh automatically.
        </p>
      </div>

      {acceptedBookings.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <Package size={40} className="mx-auto text-slate-300" />
          <h3 className="mt-3 font-bold text-slate-800">No confirmed bookings yet</h3>
          <p className="mt-1 text-sm text-slate-500">Accept a transporter quotation to track its shipment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {acceptedBookings.map(({ quotation, load }) => {
            const record = trackingRecords[quotation.id]
            const location = record?.lastLocation
            const mapUrl = location
              ? `https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=16/${location.latitude}/${location.longitude}`
              : ''

            return (
              <article key={quotation.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Booking / Trip</p>
                    <h3 className="mt-1 text-lg font-extrabold text-slate-900">{load.id}</h3>
                    <p className="mt-1 text-sm text-slate-600">{load.from} <span className="px-1 text-blue-600">→</span> {load.to}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${record?.isTracking ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                    {record?.isTracking ? 'GPS LIVE' : location ? 'LAST LOCATION' : 'WAITING FOR DRIVER'}
                  </span>
                </div>

                {location ? (
                  <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Driver's Current Place</p>
                    <p className="mt-2 flex items-start gap-2 text-base font-bold text-slate-900">
                      <MapPin size={19} className="mt-0.5 shrink-0 text-blue-700" />
                      {location.placeName || placeNames[quotation.id] || 'Finding place name...'}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600">
                      <span>GPS accuracy: {location.accuracy !== null ? `±${Math.round(location.accuracy)} m` : 'Not available'}</span>
                      <span>Last updated: {new Date(location.recordedAt).toLocaleString('en-IN')}</span>
                    </div>
                    <a
                      href={mapUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex items-center rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
                    >
                      Open Driver Location on Map
                    </a>
                  </div>
                ) : (
                  <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                    Driver location is not available yet. The driver must start GPS tracking from the Active Trip page.
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800">
        Demo limitation: tracking data is stored in this browser only. Customer and driver dashboards must be opened in the same browser on the same device. Cross-device live tracking will be connected through the backend later.
      </div>
    </section>
  )
}

function CustomerPayments({
  loads,
  quotations,
}: {
  loads: Load[]
  quotations: Quotation[]
}) {
  const [submissions, setSubmissions] = useState<CustomerPaymentSubmission[]>(getPaymentSubmissions)
  const [selectedLoadId, setSelectedLoadId] = useState('')
  const [transactionNumber, setTransactionNumber] = useState('')
  const [slipFile, setSlipFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const eligibleLoads = loads.filter((load) => load.status !== 'OPEN')
  const selectedLoad = eligibleLoads.find((load) => load.id === selectedLoadId)
  const existingSubmission = (loadId: string) =>
    submissions.find((submission) => submission.loadId === loadId && submission.status !== 'FAILED')

  const submitPaymentProof = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccessMessage('')

    if (!selectedLoad) {
      setError('Please select a confirmed booking.')
      return
    }
    if (!/^[A-Za-z0-9-]{6,40}$/.test(transactionNumber.trim())) {
      setError('Enter a valid transaction number / UTR (6–40 letters or numbers).')
      return
    }
    if (!slipFile) {
      setError('Please upload your payment slip.')
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(slipFile.type)) {
      setError('Upload a JPG, PNG, WEBP or PDF payment slip.')
      return
    }
    if (slipFile.size > 2 * 1024 * 1024) {
      setError('Payment slip must be 2 MB or smaller.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const acceptedQuotation = quotations.find(
        (quotation) => quotation.loadId === selectedLoad.id && quotation.status === 'ACCEPTED',
      )
      const result = addPaymentSubmission({
        id: `PAY-${Date.now()}`,
        loadId: selectedLoad.id,
        bookingId: acceptedQuotation?.id || selectedLoad.id,
        amount: selectedLoad.amount,
        transactionNumber: transactionNumber.trim().toUpperCase(),
        slipFileName: slipFile.name,
        slipMimeType: slipFile.type,
        slipDataUrl: String(reader.result || ''),
        status: 'PENDING',
        submittedAt: new Date().toISOString(),
      })

      if (!result.success) {
        setError(result.message)
        return
      }

      setSubmissions(getPaymentSubmissions())
      setTransactionNumber('')
      setSlipFile(null)
      setSelectedLoadId('')
      setSuccessMessage('Payment proof submitted. Status is Pending until the payment is verified.')
    }
    reader.onerror = () => setError('Could not read the selected file. Please try again.')
    reader.readAsDataURL(slipFile)
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900">Payments</h2>
        <p className="mt-1 text-sm text-slate-500">
          Submit your payment slip and transaction number for a confirmed booking.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h3 className="text-lg font-bold text-slate-900">Submit payment proof</h3>
        <form onSubmit={submitPaymentProof} className="mt-5 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Select booking</label>
            <select
              required
              value={selectedLoadId}
              onChange={(event) => setSelectedLoadId(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
            >
              <option value="">Choose a confirmed booking</option>
              {eligibleLoads.map((load) => (
                <option key={load.id} value={load.id}>
                  {load.id} · {load.from} to {load.to} · ₹{Number(load.amount || 0).toLocaleString('en-IN')}
                </option>
              ))}
            </select>
          </div>

          {selectedLoad && (
            <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-900">
              <p className="font-semibold">{selectedLoad.from} → {selectedLoad.to}</p>
              <p className="mt-1">Booking amount: ₹{Number(selectedLoad.amount || 0).toLocaleString('en-IN')}</p>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Transaction Number / UTR</label>
            <input
              required
              value={transactionNumber}
              onChange={(event) => setTransactionNumber(event.target.value.replace(/\s/g, '').slice(0, 40))}
              placeholder="Enter UPI / bank transaction reference"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Payment slip (JPG, PNG, WEBP or PDF; max 2 MB)</label>
            <input
              required
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(event) => setSlipFile(event.target.files?.[0] || null)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            {slipFile && <p className="mt-2 text-xs text-slate-500">Selected: {slipFile.name}</p>}
          </div>

          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {successMessage && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{successMessage}</p>}

          <button
            type="submit"
            disabled={!selectedLoad || Boolean(selectedLoad && existingSubmission(selectedLoad.id))}
            className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Submit payment proof
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-5">
          <h3 className="font-bold text-slate-900">Payment submission history</h3>
        </div>
        {submissions.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">No payment proofs submitted yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4">Booking</th>
                  <th className="px-5 py-4">Transaction No.</th>
                  <th className="px-5 py-4">Amount</th>
                  <th className="px-5 py-4">Slip</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.map((submission) => (
                  <tr key={submission.id}>
                    <td className="px-5 py-4 font-semibold">{submission.loadId}</td>
                    <td className="px-5 py-4 font-mono text-xs">{submission.transactionNumber}</td>
                    <td className="px-5 py-4">₹{Number(submission.amount || 0).toLocaleString('en-IN')}</td>
                    <td className="px-5 py-4">{submission.slipFileName}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        submission.status === 'SUCCESS' ? 'bg-green-100 text-green-700' :
                        submission.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>{submission.status}</span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      {new Date(submission.submittedAt).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Demo only: this saves the uploaded proof in this browser and sets the status to Pending. It does not verify the bank transaction or confirm that money was received. Real automatic status updates require server-side payment gateway / bank verification.
      </div>
    </section>
  )
}

function PostLoad({ onSubmitLoad }: { onSubmitLoad: (load: Load) => void }) {
  const [loadingPoints, setLoadingPoints] = useState<RoutePoint[]>([])
  const [unloadingPoints, setUnloadingPoints] = useState<RoutePoint[]>([])

  const [form, setForm] = useState({
    pickup: '',
    pickupAddress: '',
    drop: '',
    dropAddress: '',
    material: '',
    category: '',
    description: '',
    weight: '',
    length: '',
    width: '',
    height: '',
    vehicle: '',
    date: '',
    budget: '',
    pricing: 'NEGOTIABLE',
  })

  const update = (key: string, value: string) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }))
  }

  const addRoutePoint = (type: 'loading' | 'unloading') => {
    const newPoint: RoutePoint = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      city: '',
      address: '',
    }

    if (type === 'loading') {
      setLoadingPoints((previous) => [...previous, newPoint])
    } else {
      setUnloadingPoints((previous) => [...previous, newPoint])
    }
  }

  const updateRoutePoint = (
    type: 'loading' | 'unloading',
    id: string,
    field: 'city' | 'address',
    value: string,
  ) => {
    const updater = (previous: RoutePoint[]) =>
      previous.map((point) =>
        point.id === id ? { ...point, [field]: value } : point,
      )

    if (type === 'loading') {
      setLoadingPoints(updater)
    } else {
      setUnloadingPoints(updater)
    }
  }

  const removeRoutePoint = (type: 'loading' | 'unloading', id: string) => {
    if (type === 'loading') {
      setLoadingPoints((previous) => previous.filter((point) => point.id !== id))
    } else {
      setUnloadingPoints((previous) => previous.filter((point) => point.id !== id))
    }
  }

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const newLoad: Load = {
      id: `TC${Date.now().toString().slice(-8)}`,
      from: form.pickup,
      to: form.drop,
      vehicle: form.vehicle,
      material: form.material,
      weight: form.weight,
      date: form.date,
      amount: form.budget,
      status: 'OPEN',
      createdAt: new Date().toLocaleDateString('en-IN'),
      loadingPoints: [
        { id: 'loading-1', city: form.pickup, address: form.pickupAddress },
        ...loadingPoints,
      ],
      unloadingPoints: [
        { id: 'unloading-1', city: form.drop, address: form.dropAddress },
        ...unloadingPoints,
      ],
    }

    onSubmitLoad(newLoad)
    alert(`Load ${newLoad.id} posted successfully in demo mode!`)
  }

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100'

  const labelClass = 'mb-2 block text-sm font-semibold text-slate-700'

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900">Post a New Load</h2>
        <p className="mt-2 text-sm text-slate-500">
          Share your shipment details and receive quotations from transporters.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="space-y-7 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8"
      >
        <section>
          <h3 className="mb-5 text-lg font-bold text-slate-900">1. Route Details</h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Pickup City *</label>
              <LocationAutocompleteInput
                required
                value={form.pickup}
                onChange={(val) => update('pickup', val)}
                placeholder="Type city/state (e.g. Hyderabad, Haryana)"
              />
            </div>
            <div>
              <label className={labelClass}>Delivery City *</label>
              <LocationAutocompleteInput
                required
                value={form.drop}
                onChange={(val) => update('drop', val)}
                placeholder="Type city/state (e.g. Bengaluru, Chennai)"
              />
            </div>
            <div>
              <label className={labelClass}>Pickup Address *</label>
              <textarea required value={form.pickupAddress} onChange={(e) => update('pickupAddress', e.target.value)} placeholder="Enter complete pickup address" rows={3} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Delivery Address *</label>
              <textarea required value={form.dropAddress} onChange={(e) => update('dropAddress', e.target.value)} placeholder="Enter complete delivery address" rows={3} className={inputClass} />
            </div>
          </div>
        </section>

        <div className="border-t border-slate-100" />

        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">2. Additional Loading Points</h3>
              <p className="mt-1 text-xs text-slate-500">
                First loading point is the pickup location above. Add more stops if goods are collected from multiple places.
              </p>
            </div>
            <button
              type="button"
              onClick={() => addRoutePoint('loading')}
              className="flex items-center gap-2 rounded-xl border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
            >
              <Plus size={16} /> Add Loading Point
            </button>
          </div>

          {loadingPoints.length === 0 ? (
            <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
              No additional loading points. Your primary pickup location will be used.
            </p>
          ) : (
            <div className="space-y-4">
              {loadingPoints.map((point, index) => (
                <div key={point.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="font-semibold text-slate-800">Loading Point {index + 2}</p>
                    <button
                      type="button"
                      onClick={() => removeRoutePoint('loading', point.id)}
                      className="text-sm font-medium text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <LocationAutocompleteInput
                      required
                      value={point.city}
                      onChange={(val) => updateRoutePoint('loading', point.id, 'city', val)}
                      placeholder="City / Location"
                    />
                    <textarea
                      required
                      rows={2}
                      value={point.address}
                      onChange={(e) => updateRoutePoint('loading', point.id, 'address', e.target.value)}
                      placeholder="Complete loading address"
                      className={inputClass}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="border-t border-slate-100" />

        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">3. Additional Unloading Points</h3>
              <p className="mt-1 text-xs text-slate-500">
                First unloading point is the delivery location above. Add more destinations if goods are delivered to multiple places.
              </p>
            </div>
            <button
              type="button"
              onClick={() => addRoutePoint('unloading')}
              className="flex items-center gap-2 rounded-xl border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              <Plus size={16} /> Add Unloading Point
            </button>
          </div>

          {unloadingPoints.length === 0 ? (
            <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
              No additional unloading points. Your primary delivery location will be used.
            </p>
          ) : (
            <div className="space-y-4">
              {unloadingPoints.map((point, index) => (
                <div key={point.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="font-semibold text-slate-800">Unloading Point {index + 2}</p>
                    <button
                      type="button"
                      onClick={() => removeRoutePoint('unloading', point.id)}
                      className="text-sm font-medium text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <LocationAutocompleteInput
                      required
                      value={point.city}
                      onChange={(val) => updateRoutePoint('unloading', point.id, 'city', val)}
                      placeholder="City / Location"
                    />
                    <textarea
                      required
                      rows={2}
                      value={point.address}
                      onChange={(e) => updateRoutePoint('unloading', point.id, 'address', e.target.value)}
                      placeholder="Complete unloading address"
                      className={inputClass}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="border-t border-slate-100" />

        <section>
          <h3 className="mb-5 text-lg font-bold text-slate-900">4. Goods Details</h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Goods Category *</label>
              <select required value={form.category} onChange={(e) => update('category', e.target.value)} className={inputClass}>
                <option value="">Select category</option>
                <option>Agriculture Products</option>
                <option>Construction Materials</option>
                <option>Electronics</option>
                <option>Furniture</option>
                <option>Industrial Goods</option>
                <option>Food Products</option>
                <option>Textiles</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Material Name *</label>
              <input required value={form.material} onChange={(e) => update('material', e.target.value)} placeholder="e.g. Rice bags" className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Goods Description</label>
              <textarea value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Describe your goods and handling requirements" rows={3} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Weight (Tonnes) *</label>
              <input required type="number" min="0.1" step="0.1" value={form.weight} onChange={(e) => update('weight', e.target.value)} placeholder="e.g. 5" className={inputClass} />
            </div>
          </div>
        </section>

        <div className="border-t border-slate-100" />

        <section>
          <h3 className="mb-2 text-lg font-bold text-slate-900">5. Load Dimensions</h3>
          <p className="mb-5 text-xs text-slate-500">Optional. Enter dimensions in feet.</p>
          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <label className={labelClass}>Length (ft)</label>
              <input type="number" min="0" value={form.length} onChange={(e) => update('length', e.target.value)} placeholder="Length" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Width (ft)</label>
              <input type="number" min="0" value={form.width} onChange={(e) => update('width', e.target.value)} placeholder="Width" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Height (ft)</label>
              <input type="number" min="0" value={form.height} onChange={(e) => update('height', e.target.value)} placeholder="Height" className={inputClass} />
            </div>
          </div>
        </section>

        <div className="border-t border-slate-100" />

        <section>
          <h3 className="mb-5 text-lg font-bold text-slate-900">6. Vehicle & Pickup Schedule</h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Required Vehicle *</label>
              <select required value={form.vehicle} onChange={(e) => update('vehicle', e.target.value)} className={inputClass}>
                <option value="">Select vehicle</option>
                <option>Mini Truck</option>
                <option>Pickup Truck</option>
                <option>14 Feet Truck</option>
                <option>17 Feet Truck</option>
                <option>20 Feet Truck</option>
                <option>32 Feet Container</option>
                <option>Trailer</option>
                <option>Open Truck</option>
                <option>Refrigerated Truck</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Expected Pickup Date *</label>
              <input required type="date" min={new Date().toLocaleDateString('en-CA')} value={form.date} onChange={(e) => update('date', e.target.value)} className={inputClass} />
            </div>
          </div>
        </section>

        <div className="border-t border-slate-100" />

        <section>
          <h3 className="mb-5 text-lg font-bold text-slate-900">7. Budget & Pricing</h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Expected Budget (₹)</label>
              <input type="number" min="1" value={form.budget} onChange={(e) => update('budget', e.target.value)} placeholder="e.g. 25000" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Pricing Preference *</label>
              <select required value={form.pricing} onChange={(e) => update('pricing', e.target.value)} className={inputClass}>
                <option value="NEGOTIABLE">Negotiable</option>
                <option value="FIXED">Fixed Price</option>
              </select>
            </div>
          </div>
        </section>

        <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-800">
          <ShieldCheck size={18} className="mb-2" />
          Please verify all shipment details before posting your load.
        </div>

        <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 py-4 font-bold text-white transition hover:bg-blue-800">
          <Package size={19} />
          Post Load & Receive Quotations
        </button>
      </form>
    </div>
  )
}

function FindTrucks() {
  const [pickup, setPickup] = useState('')
  const [drop, setDrop] = useState('')
  const [vehicle, setVehicle] = useState('')

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-2xl font-extrabold text-slate-900">Find Available Trucks</h2>
      <p className="mt-2 text-sm text-slate-500">
        Search for trucks based on your route and vehicle requirement.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          alert('Truck search demo. Backend integration is pending.')
        }}
        className="mt-7 grid gap-4 md:grid-cols-4"
      >
        <LocationAutocompleteInput
          required
          value={pickup}
          onChange={setPickup}
          placeholder="Pickup city"
        />
        <LocationAutocompleteInput
          required
          value={drop}
          onChange={setDrop}
          placeholder="Delivery city"
        />
        <select required value={vehicle} onChange={(e) => setVehicle(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
          <option value="">Vehicle type</option>
          <option>Mini Truck</option>
          <option>14 Feet Truck</option>
          <option>20 Feet Truck</option>
          <option>32 Feet Container</option>
        </select>
        <button type="submit" className="flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 font-bold text-white hover:bg-blue-800">
          <Search size={18} /> Search
        </button>
      </form>

      <div className="mt-8 rounded-xl bg-slate-50 p-6 text-center">
        <Clock size={30} className="mx-auto text-slate-400" />
        <p className="mt-3 font-semibold text-slate-700">Truck listings will appear here</p>
        <p className="mt-1 text-sm text-slate-500">
          Connect the backend to search real available trucks.
        </p>
      </div>
    </div>
  )
}

export default CustomerDashboard