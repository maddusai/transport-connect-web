
import { useState } from 'react'
import {
  addQuotation,
  getCustomerLoads,
  getMarketplaceLoads,
  getQuotations,
  updateCustomerLoadStatus,
  updateQuotationTripStatus,
  type Quotation,
  type TripStatus,
} from '../../../utils/loadStorage'
import {
  addOwnerDriver,
  getOwnerDrivers,
  getTripDriverAssignments,
  assignDriverToTrip,
  type OwnerDriver,
} from '../../../utils/driverStorage'
import {
  LayoutDashboard,
  Truck,
  Package,
  FileText,
  MapPin,
  Users,
  Wallet,
  UserCircle,
  Bell,
  Search,
  Menu,
  X,
  Plus,
  ArrowUpRight,
  CalendarDays,
  CheckCircle,
  Navigation,
  Settings,
  LogOut,
  TrendingUp,
  Fuel,
  Phone,
} from 'lucide-react'

type Page =
  | 'Overview'
  | 'My Trucks'
  | 'Available Loads'
  | 'My Quotations'
  | 'My Trips'
  | 'Driver Management'
  | 'Earnings & Payments'
  | 'Profile & Documents'

type Load = {
  id: string
  from: string
  to: string
  material: string
  weight: string
  vehicle: string
  budget: string
  date: string
}

const menuItems = [
  { name: 'Overview', icon: LayoutDashboard },
  { name: 'My Trucks', icon: Truck },
  { name: 'Available Loads', icon: Package },
  { name: 'My Quotations', icon: FileText },
  { name: 'My Trips', icon: Navigation },
  { name: 'Driver Management', icon: Users },
  { name: 'Earnings & Payments', icon: Wallet },
  { name: 'Profile & Documents', icon: UserCircle },
] as const

const sampleLoads: Load[] = [
  {
    id: 'LD1001',
    from: 'Hyderabad, Telangana',
    to: 'Bangalore, Karnataka',
    material: 'Electronics',
    weight: '5 Ton',
    vehicle: 'Container',
    budget: 'Ã¢â€šÂ¹18,000',
    date: '15 Nov 2026',
  },
  {
    id: 'LD1002',
    from: 'Vijayawada, Andhra Pradesh',
    to: 'Chennai, Tamil Nadu',
    material: 'Agricultural Goods',
    weight: '8 Ton',
    vehicle: 'Open Truck',
    budget: 'Ã¢â€šÂ¹22,000',
    date: '17 Nov 2026',
  },
  {
    id: 'LD1003',
    from: 'Warangal, Telangana',
    to: 'Pune, Maharashtra',
    material: 'Construction Materials',
    weight: '10 Ton',
    vehicle: 'Heavy Truck',
    budget: 'Ã¢â€šÂ¹30,000',
    date: '19 Nov 2026',
  },
]

const initialTrucks = [
  {
    id: 'TRK001',
    number: 'AP 39 AB 1234',
    type: '14 Feet Open Truck',
    capacity: '5 Ton',
    status: 'Available',
  },
  {
    id: 'TRK002',
    number: 'TS 09 CD 5678',
    type: 'Container Truck',
    capacity: '10 Ton',
    status: 'On Trip',
  },
]

const tripStatusSteps: TripStatus[] = [
  'BOOKED',
  'DRIVER_ASSIGNED',
  'STARTED',
  'IN_TRANSIT',
  'DELIVERED',
  'COMPLETED',
]

const formatTripStatus = (status: TripStatus): string =>
  status.replaceAll('_', ' ')

export default function TruckOwnerDashboard() {
  const [activePage, setActivePage] = useState<Page>('Overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Read customer-posted loads directly, and also include marketplace loads.
  // This means Truck Owner does not need to open the Transporter dashboard first.
  const [loads] = useState<Load[]>(() => {
    const customerLoads = getCustomerLoads()
      .filter((load) => load.status?.toUpperCase() === 'OPEN')
      .map((load) => ({
        id: load.id,
        from: load.from,
        to: load.to,
        material: load.material,
        weight: `${load.weight} Ton`,
        vehicle: load.vehicle,
        budget: load.amount
          ? `Ã¢â€šÂ¹${Number(load.amount).toLocaleString('en-IN')}`
          : 'Not specified',
        date: load.date || 'Date not specified',
      }))

    const marketplaceLoads = getMarketplaceLoads()
      .filter((load) => load.status?.toLowerCase() === 'open')
      .map((load) => ({
        id: load.id,
        from: load.from,
        to: load.to,
        material: load.material,
        weight: load.weight,
        vehicle: load.vehicle,
        budget: load.budget,
        date: 'Date not specified',
      }))

    // Merge both sources and remove duplicate load IDs.
    const uniqueLoads = Array.from(
      new Map(
        [...marketplaceLoads, ...customerLoads].map((load) => [load.id, load]),
      ).values(),
    )

    // Show sample loads only when there are no real customer/marketplace loads.
    return uniqueLoads.length > 0 ? uniqueLoads : sampleLoads
  })

  const [trucks, setTrucks] = useState(initialTrucks)
  const [showTruckForm, setShowTruckForm] = useState(false)
  const [truckNumber, setTruckNumber] = useState('')
  const [truckType, setTruckType] = useState('Open Truck')
  const [capacity, setCapacity] = useState('')
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null)
  const [quoteAmount, setQuoteAmount] = useState('')
  const [quotations, setQuotations] = useState<Quotation[]>(() => getQuotations())
  const [drivers, setDrivers] = useState<OwnerDriver[]>(() => getOwnerDrivers())
  const [tripAssignments, setTripAssignments] = useState(() => getTripDriverAssignments())
  const [showDriverForm, setShowDriverForm] = useState(false)
  const [driverName, setDriverName] = useState('')
  const [driverPhone, setDriverPhone] = useState('')
  const [driverLicense, setDriverLicense] = useState('')
  const [driverImage, setDriverImage] = useState('')
  const [licenseImage, setLicenseImage] = useState('')

  const addDriver = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!driverName.trim() || !driverPhone.trim() || !driverLicense.trim() || !driverImage || !licenseImage) {
      alert('Please fill all driver details and upload both images.')
      return
    }
    if (!/^[6-9]\d{9}$/.test(driverPhone.trim())) {
      alert('Enter a valid 10-digit Indian mobile number.')
      return
    }
    const newDriver: OwnerDriver = {
      id: `DRV${Date.now()}`,
      name: driverName.trim(),
      phone: driverPhone.trim(),
      licenseNumber: driverLicense.trim().toUpperCase(),
      driverImage,
      licenseImage,
      status: 'AVAILABLE',
    }
    addOwnerDriver(newDriver)
    setDrivers(getOwnerDrivers())
    setDriverName('')
    setDriverPhone('')
    setDriverLicense('')
    setDriverImage('')
    setLicenseImage('')
    setShowDriverForm(false)
    alert('Driver added successfully! (Demo)')
  }

  
const handleAssignDriver = (tripId: string, driverId: string) => {
  if (!driverId) return

  const selectedTrip = quotations.find(
    (item) => item.id === tripId && item.status === 'ACCEPTED',
  )

  // Only a confirmed, not-yet-started trip can receive a driver.
  if (!selectedTrip || (selectedTrip.tripStatus ?? 'BOOKED') !== 'BOOKED') {
    alert('A driver can only be assigned to a confirmed, not-yet-started trip.')
    setQuotations(getQuotations())
    return
  }

  if (getTripDriverAssignments()[tripId]) {
    alert('A driver is already assigned to this trip.')
    setTripAssignments(getTripDriverAssignments())
    return
  }

  // Only available and admin-approved drivers can be selected.
  const driver = drivers.find(
    (item) =>
      item.id === driverId &&
      item.status === 'AVAILABLE' &&
      item.verificationStatus === 'APPROVED',
  )

  if (!driver) {
    alert('Only available and admin-approved drivers can be assigned.')
    return
  }

  // Verify assignment using the storage function's result.
  const assigned = assignDriverToTrip(tripId, driver)

  if (!assigned) {
    alert('Driver assignment failed. Please refresh and check driver verification status.')
    setTripAssignments(getTripDriverAssignments())
    setDrivers(getOwnerDrivers())
    return
  }

  setTripAssignments(getTripDriverAssignments())

  updateQuotationTripStatus(tripId, 'DRIVER_ASSIGNED')
  updateCustomerLoadStatus(selectedTrip.loadId, 'DRIVER_ASSIGNED')
  setQuotations(getQuotations())

  alert(`${driver.name} assigned successfully. Status changed to DRIVER ASSIGNED.`)
}


  const addTruck = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!truckNumber.trim() || !capacity.trim()) {
      alert('Please fill all truck details.')
      return
    }

    setTrucks([
      ...trucks,
      {
        id: `TRK00${trucks.length + 1}`,
        number: truckNumber.toUpperCase(),
        type: truckType,
        capacity: `${capacity} Ton`,
        status: 'Available',
      },
    ])

    setTruckNumber('')
    setCapacity('')
    setShowTruckForm(false)
    alert('Truck added successfully! (Demo)')
  }

  const submitQuote = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!quoteAmount || Number(quoteAmount) <= 0) {
      alert('Enter a valid quotation amount.')
      return
    }

    if (!selectedLoad) {
      alert('Please select a load before submitting a quotation.')
      return
    }

    const newQuotation: Quotation = {
      id: `QT${Date.now()}`,
      loadId: selectedLoad.id,
      from: selectedLoad.from,
      to: selectedLoad.to,
      truckOwner: 'Truck Owner',
      amount: quoteAmount,
      status: 'PENDING',
      submittedAt: new Date().toISOString(),
    }

    addQuotation(newQuotation)
    setQuotations((previous) => [newQuotation, ...previous])

    alert(`Quotation submitted successfully for ${selectedLoad.id}.`)

    setSelectedLoad(null)
    setQuoteAmount('')

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
            <div className="rounded-xl bg-blue-600 p-2">
              <Truck size={25} />
            </div>

            <div>
              <h1 className="text-xl font-bold">Transport Connect</h1>
              <p className="text-xs text-slate-400">Truck Owner Portal</p>
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
              TO
            </div>

            <div>
              <p className="font-semibold">Truck Owner</p>
              <p className="text-xs text-slate-400">Verified Account</p>
            </div>

            <CheckCircle size={17} className="ml-auto text-green-400" />
          </div>
        </div>

        <p className="px-6 pb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Main Menu
        </p>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = activePage === item.name

            return (
              <button
                key={item.name}
                onClick={() => {
                  // Refresh quotation statuses when navigating between dashboard pages.
                  setQuotations(getQuotations())
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
            <Settings size={18} /> Settings
          </button>

          <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-400 hover:bg-slate-900 hover:text-white">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          aria-label="Close sidebar overlay"
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
              <h2 className="text-lg font-bold md:text-xl">
                {activePage}
              </h2>
              <p className="hidden text-xs text-slate-500 sm:block">
                Manage your transport business
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative rounded-xl border border-slate-200 p-2.5 hover:bg-slate-50">
              <Bell size={19} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
            </button>

            <div className="hidden items-center gap-2 sm:flex">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                TO
              </div>
              <div>
                <p className="text-sm font-semibold">Truck Owner</p>
                <p className="text-xs text-slate-500">Business Account</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-5 md:p-8">
          {activePage === 'Overview' && (
            <Overview
              trucks={trucks}
              loads={loads}
              setActivePage={setActivePage}
            />
          )}

          {activePage === 'My Trucks' && (
            <div>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold">My Trucks</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Add and manage your registered vehicles.
                  </p>
                </div>

                <button
                  onClick={() => setShowTruckForm(!showTruckForm)}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <Plus size={18} /> Add New Truck
                </button>
              </div>

              {showTruckForm && (
                <form
                  onSubmit={addTruck}
                  className="mb-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-3"
                >
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Vehicle Number
                    </label>
                    <input
                      value={truckNumber}
                      onChange={(e) => setTruckNumber(e.target.value)}
                      placeholder="AP 39 AB 1234"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Vehicle Type
                    </label>
                    <select
                      value={truckType}
                      onChange={(e) => setTruckType(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500"
                    >
                      <option>Open Truck</option>
                      <option>Container Truck</option>
                      <option>Trailer</option>
                      <option>Mini Truck</option>
                      <option>Refrigerated Truck</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Capacity (Ton)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      placeholder="Enter capacity"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div className="flex gap-2 md:col-span-3">
                    <button className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white">
                      Save Truck
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowTruckForm(false)}
                      className="rounded-xl border px-5 py-3 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {trucks.map((truck) => (
                  <div
                    key={truck.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="mb-5 flex items-center justify-between">
                      <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                        <Truck size={25} />
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          truck.status === 'Available'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        {truck.status}
                      </span>
                    </div>

                    <h4 className="text-lg font-bold">{truck.number}</h4>
                    <p className="mt-1 text-sm text-slate-500">
                      {truck.type}
                    </p>

                    <div className="mt-5 flex justify-between border-t pt-4 text-sm">
                      <span className="text-slate-500">Capacity</span>
                      <span className="font-semibold">{truck.capacity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activePage === 'Available Loads' && (
            <div>
              <h3 className="mb-1 text-xl font-bold">Available Loads</h3>
              <p className="mb-6 text-sm text-slate-500">
                Find customer loads and submit your best quotation.
              </p>

              <LoadList
                loads={loads}
                onQuote={setSelectedLoad}
              />
            </div>
          )}

          {activePage === 'My Quotations' && (
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-bold">My Quotations</h3>
                <p className="mt-1 text-sm text-slate-500">
                  View the quotations you have submitted and their current status.
                </p>
              </div>

              {quotations.length === 0 ? (
                <EmptySection
                  icon={<FileText size={30} />}
                  title="No Quotations Yet"
                  description="Your submitted quotations will appear here."
                />
              ) : (
                <div className="space-y-4">
                  {quotations.map((quotation) => (
                    <div
                      key={quotation.id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <span className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                            {quotation.id}
                          </span>
                          <h4 className="mt-3 font-bold">
                            Load ID: {quotation.loadId}
                          </h4>
                          <p className="mt-1 text-sm text-slate-500">
                            {quotation.from} Ã¢â€ â€™ {quotation.to}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            quotation.status === 'ACCEPTED'
                              ? 'bg-green-100 text-green-700'
                              : quotation.status === 'REJECTED'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {quotation.status}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                        <div>
                          <p className="text-xs text-slate-500">Your Quotation</p>
                          <p className="mt-1 text-xl font-bold text-green-600">
                            Ã¢â€šÂ¹{Number(quotation.amount).toLocaleString('en-IN')}
                          </p>
                        </div>
                        <p className="text-xs text-slate-400">
                          Submitted: {new Date(quotation.submittedAt).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activePage === 'My Trips' && (
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-bold">My Trips</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Track confirmed bookings and update each trip as it progresses.
                </p>
              </div>

              {quotations.filter((quotation) => quotation.status === 'ACCEPTED').length === 0 ? (
                <EmptySection
                  icon={<Navigation size={30} />}
                  title="No Confirmed Trips Yet"
                  description="When a customer accepts one of your quotations, the confirmed trip will appear here."
                />
              ) : (
                <div className="space-y-4">
                  {quotations
                    .filter((quotation) => quotation.status === 'ACCEPTED')
                    .map((trip) => {
                      const currentStatus: TripStatus = trip.tripStatus ?? 'BOOKED'
                      const currentIndex = tripStatusSteps.indexOf(currentStatus)
                      const isCompleted = currentStatus === 'COMPLETED'
                      return (
                        <div
                          key={trip.id}
                          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <span className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                                {trip.loadId}
                              </span>
                              <h4 className="mt-3 text-lg font-bold text-slate-900">
                                {trip.from} Ã¢â€ â€™ {trip.to}
                              </h4>
                              <p className="mt-1 text-xs text-slate-500">
                                Quotation ID: {trip.id}
                              </p>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              isCompleted
                                ? 'bg-green-100 text-green-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {formatTripStatus(currentStatus)}
                            </span>
                          </div>

                          <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-3">
                            <div>
                              <p className="text-xs text-slate-500">Accepted Amount</p>
                              <p className="mt-1 text-lg font-bold text-green-700">
                                Ã¢â€šÂ¹{Number(trip.amount).toLocaleString('en-IN')}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Trip Status</p>
                              <p className="mt-1 font-semibold text-slate-800">
                                {formatTripStatus(currentStatus)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Quotation Submitted</p>
                              <p className="mt-1 font-semibold text-slate-800">
                                {new Date(trip.submittedAt).toLocaleDateString('en-IN')}
                              </p>
                            </div>
                          </div>

                          <div className="mt-5 border-t border-slate-100 pt-4">
                            <p className="mb-2 text-sm font-semibold text-slate-700">Driver Assignment</p>
                            {tripAssignments[trip.id] ? (
                              <div className="rounded-xl bg-green-50 p-3 text-sm text-green-800">
                                <div className="mb-2 flex items-center gap-3">
                                  {tripAssignments[trip.id].driverImage ? <img src={tripAssignments[trip.id].driverImage} alt="Driver" className="h-14 w-14 rounded-full object-cover" /> : null}
                                  <div><p className="font-semibold">{tripAssignments[trip.id].name}</p><p className="mt-1">Phone: {tripAssignments[trip.id].phone}</p></div>
                                </div>
                                <p className="mt-1 text-xs">Licence: {tripAssignments[trip.id].licenseNumber}</p>
                                {tripAssignments[trip.id].licenseImage ? <a href={tripAssignments[trip.id].licenseImage} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-semibold text-blue-700 underline">View licence image</a> : null}
                              </div>
                            ) : currentStatus === 'BOOKED' && drivers.some((driver) => driver.status === 'AVAILABLE') ? (
                              <select defaultValue="" onChange={(e) => handleAssignDriver(trip.id, e.target.value)} className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
                                <option value="" disabled>Select an available registered driver</option>
                                {drivers.filter((driver) => driver.status === 'AVAILABLE').map((driver) => <option key={driver.id} value={driver.id}>{driver.name} Ã¢â‚¬â€ {driver.phone}</option>)}
                              </select>
                            ) : (
                              <p className="text-sm text-slate-500">
                                {currentStatus === 'BOOKED'
                                  ? 'No available drivers. Add a driver in Driver Management before assigning.'
                                  : 'No driver assignment found. Contact admin to review this trip; owner-side status changes are locked.'}
                              </p>
                            )}
                          </div>

                          <div className="mt-5 border-t border-slate-100 pt-4">
                            <p className="mb-3 text-sm font-semibold text-slate-700">
                              Trip Progress
                            </p>
                            <div className="mb-4 flex flex-wrap gap-2">
                              {tripStatusSteps.map((step, index) => (
                                <span
                                  key={step}
                                  className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                                    index <= currentIndex
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-slate-100 text-slate-400'
                                  }`}
                                >
                                  {formatTripStatus(step)}
                                </span>
                              ))}
                            </div>

                            {currentStatus === 'COMPLETED' ? (
                              <p className="flex items-center gap-2 text-sm font-semibold text-green-700">
                                <CheckCircle size={18} />
                                Trip completed successfully
                              </p>
                            ) : !tripAssignments[trip.id] ? (
                              <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                                Assign a registered driver first. Trip progress is locked until driver assignment.
                              </p>
                            ) : (
                              <p className="rounded-xl bg-blue-50 p-3 text-sm text-blue-800">
                                Trip status is automatic. The assigned driver starts the trip; GPS movement updates transit;
                                verified Proof of Delivery updates delivery; confirmed payment completes the trip.
                              </p>
                            )}
                            <p className="mt-2 text-xs text-slate-400">
                              Truck owners can assign drivers here; they cannot manually change trip progress.
                            </p>
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          )}

          {activePage === 'Driver Management' && (
            <div>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold">Driver Management</h3>
                  <p className="mt-1 text-sm text-slate-500">Register and manage drivers who work with your trucks.</p>
                </div>
                <button onClick={() => setShowDriverForm((value) => !value)} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">
                  <Plus size={18} /> Add Driver
                </button>
              </div>

              {showDriverForm && (
                <form onSubmit={addDriver} className="mb-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium">Driver Name</label>
                    <input value={driverName} onChange={(e) => setDriverName(e.target.value)} placeholder="Enter full name" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500" required />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Mobile Number</label>
                    <input type="tel" maxLength={10} value={driverPhone} onChange={(e) => setDriverPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit mobile number" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500" required />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Driving Licence Number</label>
                    <input value={driverLicense} onChange={(e) => setDriverLicense(e.target.value)} placeholder="Enter licence number" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500" required />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Driver Photo</label>
                    <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; if (file.size > 1024 * 1024) { alert('Driver photo must be 1 MB or smaller.'); e.target.value = ''; return; } const reader = new FileReader(); reader.onload = () => setDriverImage(String(reader.result)); reader.readAsDataURL(file); }} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" required />
                    {driverImage && <img src={driverImage} alt="Driver photo preview" className="mt-2 h-20 w-20 rounded-full object-cover" />}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Driving Licence Image</label>
                    <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; if (file.size > 1024 * 1024) { alert('Licence image must be 1 MB or smaller.'); e.target.value = ''; return; } const reader = new FileReader(); reader.onload = () => setLicenseImage(String(reader.result)); reader.readAsDataURL(file); }} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" required />
                    {licenseImage && <img src={licenseImage} alt="Driving licence preview" className="mt-2 h-20 w-32 rounded-lg border object-cover" />}
                  </div>
                  <p className="text-xs text-slate-500 md:col-span-3">Image files only. Maximum 1 MB per image. Demo images are stored in this browser.</p>
                  <div className="flex gap-2 md:col-span-3">
                    <button className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white">Save Driver</button>
                    <button type="button" onClick={() => setShowDriverForm(false)} className="rounded-xl border px-5 py-3 text-sm">Cancel</button>
                  </div>
                </form>
              )}

              {drivers.length === 0 ? (
                <EmptySection icon={<Users size={30} />} title="No Drivers Added" description="Add your first driver. You can assign registered drivers to confirmed trips." />
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {drivers.map((driver) => (
                    <div key={driver.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="mb-4 flex items-center justify-between">
                        {driver.driverImage ? <img src={driver.driverImage} alt={`${driver.name} photo`} className="h-16 w-16 rounded-full object-cover" /> : <div className="rounded-xl bg-blue-50 p-3 text-blue-600"><UserCircle size={24} /></div>}
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">Available</span>
                      </div>
                      <h4 className="font-bold">{driver.name}</h4>
                      <p className="mt-2 flex items-center gap-2 text-sm text-slate-500"><Phone size={15} /> {driver.phone}</p>
                      <p className="mt-2 text-xs text-slate-500">Licence: {driver.licenseNumber}</p>
                      {driver.licenseImage && <a href={driver.licenseImage} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-semibold text-blue-700 underline">View driving licence image</a>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activePage === 'Earnings & Payments' && (
            <EmptySection
              icon={<Wallet size={30} />}
              title="Earnings & Payments"
              description="Track your earnings, payouts and transaction history here."
            />
          )}

          {activePage === 'Profile & Documents' && (
            <EmptySection
              icon={<UserCircle size={30} />}
              title="Profile & Documents"
              description="Manage your business profile, GST details and verification documents."
            />
          )}
        </div>
      </main>

      {selectedLoad && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4">
          <form
            onSubmit={submitQuote}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-bold">Submit Quotation</h3>
              <button
                type="button"
                onClick={() => setSelectedLoad(null)}
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X />
              </button>
            </div>

            <p className="mb-4 text-sm text-slate-500">
              Load ID:{' '}
              <strong className="text-slate-800">
                {selectedLoad.id}
              </strong>
            </p>

            <div className="mb-5 rounded-xl bg-slate-50 p-4 text-sm">
              <p className="font-semibold">
                {selectedLoad.from} Ã¢â€ â€™ {selectedLoad.to}
              </p>
              <p className="mt-2 text-slate-500">
                Customer budget: {selectedLoad.budget}
              </p>
            </div>

            <label className="mb-2 block text-sm font-medium">
              Your Quotation (Ã¢â€šÂ¹)
            </label>

            <input
              type="number"
              min="1"
              value={quoteAmount}
              onChange={(e) => setQuoteAmount(e.target.value)}
              placeholder="Enter your amount"
              className="mb-5 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
              required
            />

            <button className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700">
              Submit Quotation
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

function Overview({
  trucks,
  loads,
  setActivePage,
}: {
  trucks: typeof initialTrucks
  loads: Load[]
  setActivePage: (page: Page) => void
}) {
  const stats = [
    {
      label: 'Total Trucks',
      value: trucks.length,
      icon: Truck,
      color: 'bg-blue-50 text-blue-600',
      change: 'Registered vehicles',
    },
    {
      label: 'Available Loads',
      value: loads.length,
      icon: Package,
      color: 'bg-purple-50 text-purple-600',
      change: 'Loads to explore',
    },
    {
      label: 'Active Trips',
      value: 1,
      icon: Navigation,
      color: 'bg-orange-50 text-orange-600',
      change: 'Currently running',
    },
    {
      label: 'Total Earnings',
      value: 'Ã¢â€šÂ¹45,000',
      icon: Wallet,
      color: 'bg-green-50 text-green-600',
      change: 'Demo earnings',
    },
  ]

  return (
    <>
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold">
            Welcome back, Truck Owner! Ã°Å¸â€˜â€¹
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Here is what is happening with your transport business.
          </p>
        </div>

        <button
          onClick={() => setActivePage('Available Loads')}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Search size={18} /> Find Loads
        </button>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon

          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className={`rounded-xl p-3 ${stat.color}`}>
                  <Icon size={23} />
                </div>
                <ArrowUpRight className="text-slate-400" size={20} />
              </div>

              <p className="mt-5 text-sm text-slate-500">
                {stat.label}
              </p>
              <h4 className="mt-1 text-2xl font-bold">{stat.value}</h4>
              <p className="mt-2 text-xs text-slate-400">
                {stat.change}
              </p>
            </div>
          )
        })}
      </div>

      <div className="mb-8 grid gap-5 xl:grid-cols-3">
        <div className="rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 p-6 text-white xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-blue-100">
                Business Performance
              </p>
              <h3 className="mt-2 text-3xl font-bold">Ã¢â€šÂ¹45,000</h3>
              <p className="mt-2 text-sm text-blue-100">
                Total demo earnings
              </p>
            </div>

            <div className="rounded-2xl bg-white/15 p-4">
              <TrendingUp size={32} />
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 border-t border-white/20 pt-5">
            <div>
              <p className="text-xs text-blue-100">Completed Trips</p>
              <p className="mt-1 text-xl font-bold">12</p>
            </div>

            <div>
              <p className="text-xs text-blue-100">
                Pending Quotations
              </p>
              <p className="mt-1 text-xl font-bold">4</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl bg-green-50 p-3 text-green-600">
              <ShieldCheckIcon />
            </div>

            <div>
              <h4 className="font-bold">Account Status</h4>
              <p className="text-xs text-green-600">Demo verified</p>
            </div>
          </div>

          <p className="text-sm leading-6 text-slate-500">
            Keep your vehicle and business documents updated to build
            customer trust.
          </p>

          <button
            onClick={() => setActivePage('Profile & Documents')}
            className="mt-5 w-full rounded-xl border border-slate-200 py-3 text-sm font-semibold hover:bg-slate-50"
          >
            Manage Documents
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold">Recent Available Loads</h3>
            <p className="mt-1 text-xs text-slate-500">
              Explore new customer requirements
            </p>
          </div>

          <button
            onClick={() => setActivePage('Available Loads')}
            className="text-sm font-semibold text-blue-600 hover:underline"
          >
            View All
          </button>
        </div>

        <LoadList
          loads={loads.slice(0, 2)}
          onQuote={() => setActivePage('Available Loads')}
        />
      </div>
    </>
  )
}

function LoadList({
  loads,
  onQuote,
}: {
  loads: Load[]
  onQuote: (load: Load) => void
}) {
  if (loads.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
        <Package size={35} className="mx-auto text-slate-400" />
        <h4 className="mt-3 font-semibold">No available loads</h4>
        <p className="mt-1 text-sm text-slate-500">
          New customer loads will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {loads.map((load) => (
        <div
          key={load.id}
          className="rounded-xl border border-slate-200 p-4 transition hover:border-blue-300"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                {load.id}
              </span>

              <h4 className="mt-3 font-bold">{load.from}</h4>

              <div className="my-2 flex items-center gap-2 text-slate-400">
                <div className="ml-1 h-4 border-l-2 border-dashed border-slate-300" />
                <MapPin size={14} />
                <span className="text-sm text-slate-700">
                  {load.to}
                </span>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-xs text-slate-500">Customer Budget</p>
              <p className="mt-1 text-xl font-bold text-green-600">
                {load.budget}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Package size={14} /> {load.material}
            </span>
            <span className="flex items-center gap-1">
              <Fuel size={14} /> {load.weight}
            </span>
            <span className="flex items-center gap-1">
              <Truck size={14} /> {load.vehicle}
            </span>
            <span className="flex items-center gap-1">
              <CalendarDays size={14} /> {load.date}
            </span>
          </div>

          <button
            onClick={() => onQuote(load)}
            className="mt-4 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Submit Quotation
          </button>
        </div>
      ))}
    </div>
  )
}

function EmptySection({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-center">
      <div className="mb-5 rounded-2xl bg-blue-50 p-5 text-blue-600">
        {icon}
      </div>

      <h3 className="text-xl font-bold">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>

      <p className="mt-5 rounded-full bg-amber-50 px-4 py-2 text-xs font-medium text-amber-700">
        UI setup Ã¢â‚¬â€œ functionality will be connected in the next stages
      </p>
    </div>
  )
}

function ShieldCheckIcon() {
  return <CheckCircle size={24} />
}
