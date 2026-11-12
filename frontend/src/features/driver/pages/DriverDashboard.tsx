
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { getTripDriverAssignments } from '../../../utils/driverStorage'
import { saveDeliveryProof } from '../../../utils/deliveryProofStorage'
import {
  getTripTrackingRecord,
  saveTripLocation,
  startTripTracking,
  stopTripTracking,
  updateTripPlaceName,
} from '../../../utils/trackingStorage'
import {
  getQuotations,
  updateCustomerLoadStatus,
  updateQuotationTripStatus,
  type TripStatus,
} from '../../../utils/loadStorage'
import {
  LayoutDashboard,
  Navigation,
  MapPin,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  Wallet,
  UserCircle,
  Bell,
  Menu,
  X,

  CalendarDays,
  ArrowRight,
  ShieldCheck,
  LogOut,
  CircleDot,
} from 'lucide-react'

const reverseGeocode = async (latitude: number, longitude: number): Promise<string | null> => {
  try {
    const params = new URLSearchParams({
      format: 'jsonv2',
      lat: String(latitude),
      lon: String(longitude),
      zoom: '18',
      addressdetails: '1',
    })
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
      headers: { 'Accept': 'application/json' },
    })
    if (!response.ok) return null
    const data: { display_name?: string; address?: Record<string, string> } = await response.json()
    const address = data.address ?? {}
    const area = address.neighbourhood || address.suburb || address.residential || address.village || address.town
    const city = address.city || address.city_district || address.municipality || address.county
    const state = address.state
    const place = [area, city, state].filter(Boolean).filter((value, index, values) => values.indexOf(value) === index).join(', ')
    return place || data.display_name || null
  } catch {
    return null
  }
}

type Page =
  | 'Overview'
  | 'Assigned Trips'
  | 'Active Trip'
  | 'Trip History'
  | 'Earnings'
  | 'My Profile'

type Trip = {
  id: string
  from: string
  to: string
  customer: string
  vehicle: string
  date: string
  status: 'Assigned' | 'In Progress' | 'Completed'
  amount: string
  loadId?: string
  assignedDriverName?: string
}

const menuItems = [
  { name: 'Overview', icon: LayoutDashboard },
  { name: 'Assigned Trips', icon: Package },
  { name: 'Active Trip', icon: Navigation },
  { name: 'Trip History', icon: Clock },
  { name: 'Earnings', icon: Wallet },
  { name: 'My Profile', icon: UserCircle },
] as const

const initialTrips: Trip[] = [
  {
    id: 'TRIP1001',
    from: 'Hyderabad, Telangana',
    to: 'Bangalore, Karnataka',
    customer: 'ABC Electronics',
    vehicle: 'AP 39 AB 1234',
    date: '15 Nov 2026',
    status: 'Assigned',
    amount: '₹18,000',
  },
  {
    id: 'TRIP1002',
    from: 'Vijayawada, Andhra Pradesh',
    to: 'Chennai, Tamil Nadu',
    customer: 'Sri Lakshmi Traders',
    vehicle: 'TS 09 CD 5678',
    date: '17 Nov 2026',
    status: 'In Progress',
    amount: '₹22,000',
  },
  {
    id: 'TRIP1003',
    from: 'Warangal, Telangana',
    to: 'Pune, Maharashtra',
    customer: 'Build Materials Pvt Ltd',
    vehicle: 'AP 39 AB 1234',
    date: '10 Nov 2026',
    status: 'Completed',
    amount: '₹30,000',
  },
]

export default function DriverDashboard() {
  const getDashboardTrips = (): Trip[] => {
    const assignments = getTripDriverAssignments()
    const assignedQuotations = getQuotations().filter(
      (quotation) =>
        quotation.status === 'ACCEPTED' && Boolean(assignments[quotation.id]),
    )

    const connectedTrips: Trip[] = assignedQuotations.map((quotation) => {
      const assignment = assignments[quotation.id]
      const tripStatus: TripStatus = quotation.tripStatus ?? 'DRIVER_ASSIGNED'

      return {
        id: quotation.id,
        loadId: quotation.loadId,
        from: quotation.from,
        to: quotation.to,
        customer: 'Customer',
        vehicle: 'Vehicle details available with truck owner',
        date: new Date(quotation.submittedAt).toLocaleDateString('en-IN'),
        status:
          tripStatus === 'DELIVERED' || tripStatus === 'COMPLETED'
            ? 'Completed'
            : tripStatus === 'STARTED' || tripStatus === 'IN_TRANSIT'
              ? 'In Progress'
              : 'Assigned',
        amount: `₹${Number(quotation.amount).toLocaleString('en-IN')}`,
        assignedDriverName: assignment.name,
      }
    })

    // Keep sample trips only until a real assigned trip exists in local storage.
    return connectedTrips.length > 0 ? connectedTrips : initialTrips
  }

  const [activePage, setActivePage] = useState<Page>('Overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [trips, setTrips] = useState<Trip[]>(getDashboardTrips)
  const [gpsTracking, setGpsTracking] = useState(false)
  const [gpsMessage, setGpsMessage] = useState('')
  const [gpsCoordinates, setGpsCoordinates] = useState<{ latitude: number; longitude: number } | null>(null)
  const [gpsPlace, setGpsPlace] = useState('')
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null)
  const lastGeocodeAtRef = useRef(0)
  const watchIdRef = useRef<number | null>(null)

  const updateTripStatus = (
    tripId: string,
    status: Trip['status'],
  ) => {
    const trip = trips.find((item) => item.id === tripId)

    if (trip?.loadId) {
      const nextTripStatus: TripStatus =
        status === 'In Progress'
          ? 'STARTED'
          : status === 'Completed'
            ? 'DELIVERED'
            : 'DRIVER_ASSIGNED'

      updateQuotationTripStatus(tripId, nextTripStatus)
      updateCustomerLoadStatus(trip.loadId, nextTripStatus)
    }

    setTrips((previous) =>
      previous.map((item) =>
        item.id === tripId ? { ...item, status } : item,
      ),
    )
  }

  const activeTrip = trips.find((trip) => trip.status === 'In Progress')
  const assignedTrips = trips.filter((trip) => trip.status === 'Assigned')
  const completedTrips = trips.filter((trip) => trip.status === 'Completed')

  const refreshTrips = () => {
    setTrips(getDashboardTrips())
  }

  const startGpsTracking = () => {
    if (!activeTrip) return

    if (!('geolocation' in navigator)) {
      setGpsMessage('GPS is not supported by this browser.')
      return
    }

    if (!startTripTracking(activeTrip.id)) {
      setGpsMessage('Could not start GPS tracking. Please try again.')
      return
    }

    setGpsTracking(true)
    setGpsMessage('Requesting location permission...')

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        const saved = saveTripLocation(activeTrip.id, latitude, longitude, accuracy ?? null)

        if (!saved) {
          setGpsMessage('Location received, but could not be saved.')
          return
        }

        setGpsCoordinates({ latitude, longitude })
        setGpsAccuracy(accuracy ?? null)
        const accuracyMessage = accuracy <= 100
          ? 'Good location accuracy'
          : accuracy <= 500
            ? 'Approximate location; waiting for a better GPS fix'
            : 'Low location accuracy; laptop location may be estimated from Wi-Fi'
        setGpsMessage(`${accuracyMessage} (±${Math.round(accuracy)} m) · Updated ${new Date().toLocaleTimeString()}`)

        // Reverse-geocode at most once every 15 seconds to avoid excessive requests.
        if (Date.now() - lastGeocodeAtRef.current >= 15000) {
          lastGeocodeAtRef.current = Date.now()
          setGpsPlace('Finding your place...')
          void reverseGeocode(latitude, longitude).then((place) => {
            if (place) {
              setGpsPlace(place)
              updateTripPlaceName(activeTrip.id, place)
            } else {
              setGpsPlace('Place name unavailable. Please try again shortly.')
            }
          })
        }
      },
      (error) => {
        const message = error.code === error.PERMISSION_DENIED
          ? 'Location permission denied. Allow location access in browser settings.'
          : error.code === error.POSITION_UNAVAILABLE
            ? 'Current location is unavailable. Please try again outdoors.'
            : 'GPS request timed out. Please try again.'
        setGpsMessage(message)
        setGpsTracking(false)
        stopTripTracking(activeTrip.id)
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current)
          watchIdRef.current = null
        }
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 },
    )
  }

  const stopGpsTracking = () => {
    if (watchIdRef.current !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }

    if (activeTrip) stopTripTracking(activeTrip.id)
    setGpsTracking(false)
    setGpsMessage('GPS tracking stopped.')
  }

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-950 text-white transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-800 px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-600 p-2">
              <Truck size={25} />
            </div>
            <div>
              <h1 className="text-xl font-bold">Transport Connect</h1>
              <p className="text-xs text-slate-400">Driver Portal</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
            aria-label="Close menu"
          >
            <X />
          </button>
        </div>

        <div className="px-5 py-6">
          <div className="flex items-center gap-3 rounded-xl bg-slate-900 p-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 font-bold">
              DR
            </div>
            <div>
              <p className="font-semibold">Driver Account</p>
              <p className="text-xs text-slate-400">Verified Driver</p>
            </div>
            <ShieldCheck size={18} className="ml-auto text-green-400" />
          </div>
        </div>

        <p className="px-6 pb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Driver Menu
        </p>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = activePage === item.name

            return (
              <button
                key={item.name}
                onClick={() => {
                  refreshTrips()
                  setActivePage(item.name)
                  setSidebarOpen(false)
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition ${
                  active
                    ? 'bg-blue-600 font-semibold text-white'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Icon size={19} />
                {item.name}
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

      {sidebarOpen && (
        <button
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      <main className="min-h-screen lg:ml-72">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-5 md:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"
              aria-label="Open menu"
            >
              <Menu />
            </button>
            <div>
              <h2 className="text-lg font-bold md:text-xl">{activePage}</h2>
              <p className="hidden text-xs text-slate-500 sm:block">
                Driver workspace
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative rounded-xl border border-slate-200 p-2.5">
              <Bell size={19} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
            </button>
            <div className="hidden items-center gap-2 sm:flex">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                DR
              </div>
              <div>
                <p className="text-sm font-semibold">Driver</p>
                <p className="text-xs text-slate-500">Active Account</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-5 md:p-8">
          {activePage === 'Overview' && (
            <>
              <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-bold">
                    Welcome back, Driver! 👋
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Here is your trip and delivery summary.
                  </p>
                </div>
                <button
                  onClick={() => setActivePage('Assigned Trips')}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  View Assigned Trips <ArrowRight size={18} />
                </button>
              </div>

              <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  title="Assigned Trips"
                  value={assignedTrips.length}
                  icon={<Package size={23} />}
                  color="bg-blue-50 text-blue-600"
                />
                <StatCard
                  title="Active Trips"
                  value={activeTrip ? 1 : 0}
                  icon={<Navigation size={23} />}
                  color="bg-orange-50 text-orange-600"
                />
                <StatCard
                  title="Completed Trips"
                  value={completedTrips.length}
                  icon={<CheckCircle2 size={23} />}
                  color="bg-green-50 text-green-600"
                />
                <StatCard
                  title="Total Earnings"
                  value="₹70,000"
                  icon={<Wallet size={23} />}
                  color="bg-purple-50 text-purple-600"
                />
              </div>

              {activeTrip && (
                <div className="mb-8 rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 p-6 text-white">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-blue-100">Current Active Trip</p>
                      <h3 className="mt-2 text-2xl font-bold">{activeTrip.id}</h3>
                      <p className="mt-2 text-sm text-blue-100">
                        {activeTrip.from} → {activeTrip.to}
                      </p>
                    </div>
                    <button
                      onClick={() => setActivePage('Active Trip')}
                      className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-700 hover:bg-blue-50"
                    >
                      View Trip
                    </button>
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold">Recent Assigned Trips</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Your latest delivery assignments
                    </p>
                  </div>
                  <button
                    onClick={() => setActivePage('Assigned Trips')}
                    className="text-sm font-semibold text-blue-600"
                  >
                    View All
                  </button>
                </div>
                <TripList
                  trips={trips.filter((trip) => trip.status !== 'Completed').slice(0, 2)}
                  onSelect={() => setActivePage('Active Trip')}
                />
              </div>
            </>
          )}

          {activePage === 'Assigned Trips' && (
            <section>
              <h3 className="mb-1 text-xl font-bold">Assigned Trips</h3>
              <p className="mb-6 text-sm text-slate-500">
                View your pending delivery assignments.
              </p>
              <TripList
                trips={assignedTrips}
                onSelect={(trip) => {
                  updateTripStatus(trip.id, 'In Progress')
                  setActivePage('Active Trip')
                }}
                actionLabel="Start Trip"
              />
              {assignedTrips.length === 0 && (
                <EmptyState message="No assigned trips at the moment." />
              )}
            </section>
          )}

          {activePage === 'Active Trip' && (
            <section>
              <h3 className="mb-1 text-xl font-bold">Active Trip</h3>
              <p className="mb-6 text-sm text-slate-500">
                Manage your current delivery journey.
              </p>

              {activeTrip ? (
                <>
                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                        In Progress
                      </span>
                      <h3 className="mt-3 text-xl font-bold">{activeTrip.id}</h3>
                    </div>
                    <span className="font-bold text-green-600">{activeTrip.amount}</span>
                  </div>

                  <div className="my-7 rounded-xl bg-slate-50 p-5">
                    <div className="flex gap-3">
                      <CircleDot className="mt-1 text-green-600" size={20} />
                      <div>
                        <p className="text-xs text-slate-500">Pickup Location</p>
                        <p className="font-semibold">{activeTrip.from}</p>
                      </div>
                    </div>
                    <div className="ml-2 my-3 h-8 border-l-2 border-dashed border-slate-300" />
                    <div className="flex gap-3">
                      <MapPin className="mt-1 text-red-500" size={20} />
                      <div>
                        <p className="text-xs text-slate-500">Delivery Location</p>
                        <p className="font-semibold">{activeTrip.to}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <InfoItem label="Customer" value={activeTrip.customer} />
                    <InfoItem label="Vehicle Number" value={activeTrip.vehicle} />
                    <InfoItem label="Trip Date" value={activeTrip.date} />
                    <InfoItem label="Trip Amount" value={activeTrip.amount} />
                    {activeTrip.assignedDriverName && (
                      <InfoItem label="Assigned Driver" value={activeTrip.assignedDriverName} />
                    )}
                  </div>

                  <div className="mt-7 flex flex-wrap gap-3">
                    <button
                      onClick={gpsTracking ? stopGpsTracking : startGpsTracking}
                      className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold ${gpsTracking ? 'bg-red-600 text-white hover:bg-red-700' : 'border border-blue-600 text-blue-600 hover:bg-blue-50'}`}
                    >
                      <Navigation size={18} /> {gpsTracking ? 'Stop GPS Tracking' : 'Start GPS Tracking'}
                    </button>

                  </div>
                  <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-800">Live GPS Status</p>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${gpsTracking ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                        {gpsTracking ? 'TRACKING' : 'STOPPED'}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{gpsMessage || 'Start GPS tracking to share your current location for this trip.'}</p>
                    {gpsCoordinates && (
                      <div className="mt-3 rounded-lg bg-white p-3">
                        <p className="text-xs font-medium text-slate-500">{gpsAccuracy !== null && gpsAccuracy > 250 ? 'Approximate Current Place' : 'Current Place'}</p>
                        <p className="mt-1 flex items-start gap-2 text-sm font-semibold text-slate-800">
                          <MapPin size={17} className="mt-0.5 shrink-0 text-blue-600" />
                          {gpsPlace || 'Finding your place...'}
                        </p>
                        {gpsAccuracy !== null && (
                          <p className={`mt-2 text-xs font-medium ${gpsAccuracy <= 100 ? 'text-green-700' : gpsAccuracy <= 500 ? 'text-amber-700' : 'text-red-600'}`}>
                            GPS accuracy: ±{Math.round(gpsAccuracy)} metres {gpsAccuracy <= 100 ? '(Good)' : gpsAccuracy <= 500 ? '(Approximate)' : '(Low)'}
                          </p>
                        )}
                      </div>
                    )}
                    <p className="mt-2 text-xs text-slate-400">{getTripTrackingRecord(activeTrip.id)?.lastLocation ? `Last saved: ${new Date(getTripTrackingRecord(activeTrip.id)!.lastLocation!.recordedAt).toLocaleString()}` : 'No location saved yet.'}</p>
                  </div>
                </div>
                <DeliveryProofForm
                  trip={activeTrip}
                  onDelivered={() => updateTripStatus(activeTrip.id, 'Completed')}
                />
                </>
              ) : (
                <EmptyState message="You do not have an active trip right now." />
              )}
            </section>
          )}

          {activePage === 'Trip History' && (
            <section>
              <h3 className="mb-1 text-xl font-bold">Trip History</h3>
              <p className="mb-6 text-sm text-slate-500">
                Review your completed deliveries.
              </p>
              <TripList trips={completedTrips} />
              {completedTrips.length === 0 && (
                <EmptyState message="No completed trips yet." />
              )}
            </section>
          )}

          {activePage === 'Earnings' && (
            <section>
              <h3 className="mb-1 text-xl font-bold">Earnings & Payments</h3>
              <p className="mb-6 text-sm text-slate-500">
                Review your demo earnings summary.
              </p>
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <p className="text-sm text-slate-500">Total Earnings</p>
                <h3 className="mt-2 text-3xl font-bold">₹70,000</h3>
                <p className="mt-2 text-xs text-green-600">
                  Demo earnings from completed and ongoing trips
                </p>
              </div>
              <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
                <h4 className="mb-4 font-bold">Payment Summary</h4>
                <InfoItem label="Completed Trip Earnings" value="₹30,000" />
                <InfoItem label="Ongoing Trip Amount" value="₹22,000" />
                <InfoItem label="Other Demo Earnings" value="₹18,000" />
              </div>
            </section>
          )}

          {activePage === 'My Profile' && (
            <section>
              <h3 className="mb-1 text-xl font-bold">My Profile</h3>
              <p className="mb-6 text-sm text-slate-500">
                Driver details and document status.
              </p>
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-700">
                    DR
                  </div>
                  <div>
                    <h4 className="text-lg font-bold">Driver Name</h4>
                    <p className="text-sm text-slate-500">Driver Account</p>
                  </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <InfoItem label="Mobile Number" value="+91 XXXXX XXXXX" />
                  <InfoItem label="Driving Licence" value="Demo Licence Details" />
                  <InfoItem label="Assigned Vehicle" value="AP 39 AB 1234" />
                  <InfoItem label="Verification" value="Demo - Pending Backend" />
                </div>
                <div className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                  Upload and verification of original driver documents will be
                  connected in a future stage.
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}

function DeliveryProofForm({
  trip,
  onDelivered,
}: {
  trip: Trip
  onDelivered: () => void
}) {
  const [receiverName, setReceiverName] = useState('')
  const [receiverMobile, setReceiverMobile] = useState('')
  const [deliveryPhoto, setDeliveryPhoto] = useState('')
  const [otp, setOtp] = useState('')
  const [photoName, setPhotoName] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.')
      return
    }

    if (file.size > 3 * 1024 * 1024) {
      setError('Photo size must be 3 MB or less.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setDeliveryPhoto(String(reader.result ?? ''))
      setPhotoName(file.name)
      setError('')
    }
    reader.onerror = () => setError('Unable to read the selected photo.')
    reader.readAsDataURL(file)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!receiverName.trim()) {
      setError('Enter the receiver name.')
      return
    }

    if (!/^[6-9]\d{9}$/.test(receiverMobile)) {
      setError('Enter a valid 10-digit Indian mobile number.')
      return
    }

    if (!deliveryPhoto) {
      setError('Upload a delivery photo.')
      return
    }

    // Demo-only OTP. Real OTP generation and verification require a backend/SMS provider.
    if (otp !== '123456') {
      setError('Invalid demo OTP. Please enter 123456.')
      return
    }

    setSaving(true)
    try {
      saveDeliveryProof({
        tripId: trip.id,
        loadId: trip.loadId ?? trip.id,
        receiverName: receiverName.trim(),
        receiverMobile,
        deliveryPhoto,
        otpVerified: true,
        verifiedAt: new Date().toISOString(),
        submittedAt: new Date().toISOString(),
      })
      onDelivered()
      alert('Proof of Delivery saved. Trip marked as DELIVERED.')
    } catch {
      setError('Unable to save delivery proof. Please try again.')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
      <div className="mb-5">
        <h3 className="text-lg font-bold">Proof of Delivery (POD)</h3>
        <p className="mt-1 text-sm text-slate-500">
          Submit receiver details and delivery photo to complete this delivery.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium">Receiver Name</span>
          <input
            value={receiverName}
            onChange={(event) => setReceiverName(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            placeholder="Enter receiver name"
            required
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium">Receiver Mobile Number</span>
          <input
            value={receiverMobile}
            onChange={(event) => setReceiverMobile(event.target.value.replace(/\D/g, '').slice(0, 10))}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            placeholder="10-digit mobile number"
            inputMode="numeric"
            maxLength={10}
            required
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-2 block text-sm font-medium">Delivery Photo</span>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
            required
          />
          <span className="mt-1 block text-xs text-slate-500">
            Upload one image (maximum 3 MB). {photoName && `Selected: ${photoName}`}
          </span>
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-2 block text-sm font-medium">Delivery OTP</span>
          <input
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            placeholder="Enter 6-digit demo OTP"
            inputMode="numeric"
            maxLength={6}
            required
          />
          <span className="mt-1 block text-xs text-amber-700">
            Demo mode: use OTP 123456. No SMS is sent.
          </span>
        </label>
      </div>

      {deliveryPhoto && (
        <img
          src={deliveryPhoto}
          alt="Delivery proof preview"
          className="mt-4 max-h-56 rounded-xl border border-slate-200 object-contain"
        />
      )}

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="mt-5 flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <CheckCircle2 size={18} />
        {saving ? 'Saving...' : 'Verify OTP & Submit Delivery'}
      </button>
    </form>
  )
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string
  value: string | number
  icon: React.ReactNode
  color: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`inline-flex rounded-xl p-3 ${color}`}>
        {icon}
      </div>
      <p className="mt-5 text-sm text-slate-500">{title}</p>
      <h3 className="mt-1 text-2xl font-bold">{value}</h3>
    </div>
  )
}

function TripList({
  trips,
  onSelect,
  actionLabel,
}: {
  trips: Trip[]
  onSelect?: (trip: Trip) => void
  actionLabel?: string
}) {
  return (
    <div className="space-y-4">
      {trips.map((trip) => (
        <div key={trip.id} className="rounded-xl border border-slate-200 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-blue-600">{trip.id}</span>
              <h4 className="mt-2 font-bold">{trip.from}</h4>
              <p className="my-2 text-sm text-slate-500">↓ {trip.to}</p>
              <p className="text-xs text-slate-500">{trip.customer}</p>
              {trip.assignedDriverName && (
                <p className="mt-1 text-xs font-medium text-blue-700">
                  Assigned to: {trip.assignedDriverName}
                </p>
              )}
            </div>
            <div className="text-left sm:text-right">
              <p className="text-lg font-bold text-green-600">{trip.amount}</p>
              <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                trip.status === 'Completed'
                  ? 'bg-green-100 text-green-700'
                  : trip.status === 'In Progress'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-blue-100 text-blue-700'
              }`}>
                {trip.status}
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Truck size={14} /> {trip.vehicle}
            </span>
            <span className="flex items-center gap-1">
              <CalendarDays size={14} /> {trip.date}
            </span>
          </div>

          {onSelect && actionLabel && (
            <button
              onClick={() => onSelect(trip)}
              className="mt-4 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              {actionLabel}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-slate-100 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
      <Package className="mx-auto mb-3 text-slate-400" size={35} />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  )
}
