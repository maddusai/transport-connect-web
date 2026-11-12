import { getCurrentUser, setAuthToken, setCurrentUser } from './services/apiClient'
import { useState } from 'react'
import type { ReactNode } from 'react'

import CustomerDashboard from './features/customer/pages/CustomerDashboard'
import TruckOwnerDashboard from './features/owner/pages/TruckOwnerDashboard'
import DriverDashboard from './features/driver/pages/DriverDashboard'
import TransporterDashboard from './features/transporter/pages/TransporterDashboard'
import AdminDashboard from './features/admin/pages/AdminDashboard'
import AuthModal from './components/common/AuthModal'
import LocationAutocompleteInput from './components/common/LocationAutocompleteInput'

import { ArrowLeft,
  Truck,
  Package,
  ArrowRight,
  ShieldCheck,
  Menu,
  Search,
  CheckCircle2,
  Users,
} from 'lucide-react'

type UserRole =
  | 'CUSTOMER'
  | 'TRUCK_OWNER'
  | 'DRIVER'
  | 'TRANSPORTER'
  | 'ADMIN'

type AuthMode = 'login' | 'register'

function App() {
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [dashboardRole, setDashboardRole] = useState<UserRole | null>(() => (getCurrentUser()?.role as UserRole) || null)

  // Hero Find Transport search inputs
  const [heroPickup, setHeroPickup] = useState('')
  const [heroDrop, setHeroDrop] = useState('')
  const [heroVehicle, setHeroVehicle] = useState('')

  // Open Login or Register separately
  const openAuth = (mode: AuthMode) => {
    setAuthMode(mode)
    setAuthOpen(true)
  }

  // Role-based login navigation
  const handleLogin = (role: UserRole) => {
    setDashboardRole(role)
    setAuthOpen(false)
  }

  // Customer Dashboard
  if (dashboardRole === 'CUSTOMER') {
    return (
      <div>
        <CustomerDashboard />
      </div>
    )
  }

  // Truck Owner Dashboard
  if (dashboardRole === 'TRUCK_OWNER') {
    return (
      <div>
        <TruckOwnerDashboard />
      </div>
    )
  }

  // Driver Dashboard
  if (dashboardRole === 'DRIVER') {
    return (
      <div>
        <DriverDashboard />
      </div>
    )
  }

  // Transporter Dashboard
  if (dashboardRole === 'TRANSPORTER') {
    return (
      <div>
        <TransporterDashboard />
      </div>
    )
  }

  // Admin Dashboard
  if (dashboardRole === 'ADMIN') {
    return (
      <div>
        <AdminDashboard />
      </div>
    )
  }

  // Landing Page
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-700 p-2.5 text-white">
              <Truck size={26} />
            </div>

            <div>
              <h1 className="text-xl font-extrabold">
                Transport<span className="text-blue-700">Connect</span>
              </h1>
              <p className="text-xs text-slate-500">
                India's Transport Marketplace
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-8 text-sm font-semibold md:flex">
            <a href="#" className="text-blue-700">Home</a>
            <a href="#services" className="hover:text-blue-700">Services</a>
            <a href="#how-it-works" className="hover:text-blue-700">
              How It Works
            </a>
            <a href="#about" className="hover:text-blue-700">About Us</a>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <button
              onClick={() => openAuth('login')}
              className="rounded-lg px-4 py-2 font-semibold text-blue-700 hover:bg-blue-50"
            >
              Login
            </button>

            <button
              onClick={() => openAuth('register')}
              className="rounded-lg bg-blue-700 px-5 py-2.5 font-semibold text-white hover:bg-blue-800"
            >
              Register
            </button>
          </div>

          <button
            className="md:hidden"
            aria-label="Open menu"
            onClick={() => openAuth('login')}
          >
            <Menu />
          </button>

        </div>
      </header>

      {/* HERO SECTION */}
      <section className="bg-blue-950">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28">

          <div className="text-white">

            <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-900 px-4 py-2 text-sm text-blue-200">
              <ShieldCheck size={16} />
              Trusted Logistics Marketplace
            </span>

            <h2 className="mt-7 text-4xl font-extrabold leading-tight md:text-6xl">
              Transport Made
              <span className="block text-blue-400">
                Simple & Smart.
              </span>
            </h2>

            <p className="mt-6 max-w-xl text-lg leading-8 text-blue-100">
              Find trucks, post loads, compare quotations and manage
              your transportation business through one powerful platform.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">

              <button
                onClick={() => openAuth('login')}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-4 font-bold text-white hover:bg-blue-500"
              >
                Post a Load
                <ArrowRight size={19} />
              </button>

              <button
                onClick={() => openAuth('login')}
                className="rounded-xl border border-white/30 px-7 py-4 font-bold text-white hover:bg-white/10"
              >
                Find a Truck
              </button>

            </div>

            <div className="mt-10 flex flex-wrap gap-6 text-sm text-blue-200">

              <span className="flex items-center gap-2">
                <CheckCircle2 size={17} />
                Verified Users
              </span>

              <span className="flex items-center gap-2">
                <CheckCircle2 size={17} />
                Transparent Pricing
              </span>

              <span className="flex items-center gap-2">
                <CheckCircle2 size={17} />
                Secure Bookings
              </span>

            </div>
          </div>

          {/* SEARCH FORM WITH LIVE AUTOCOMPLETE */}
          <div className="rounded-3xl bg-white p-7 shadow-2xl md:p-9">

            <h3 className="text-2xl font-extrabold">
              Find Transport
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Search available transportation opportunities.
            </p>

            <div className="mt-7 space-y-5">

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Pickup Location
                </label>
                <LocationAutocompleteInput
                  value={heroPickup}
                  onChange={setHeroPickup}
                  placeholder="Type pickup village, town or city..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Drop Location
                </label>
                <LocationAutocompleteInput
                  value={heroDrop}
                  onChange={setHeroDrop}
                  placeholder="Type destination village, town or city..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Vehicle Type
                </label>

                <select
                  value={heroVehicle}
                  onChange={(e) => setHeroVehicle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-600"
                >
                  <option value="">Select vehicle type</option>
                  <option>Mini Truck</option>
                  <option>Pickup Truck</option>
                  <option>Container Truck</option>
                  <option>Trailer</option>
                  <option>Heavy Truck</option>
                </select>
              </div>

              <button
                onClick={() => openAuth('login')}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 py-4 font-bold text-white hover:bg-blue-800"
              >
                <Search size={19} />
                Search Transport
              </button>

            </div>
          </div>

        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="mx-auto max-w-7xl px-6 py-20">

        <div className="text-center">
          <span className="font-bold uppercase tracking-widest text-blue-700">
            Our Services
          </span>

          <h2 className="mt-3 text-3xl font-extrabold md:text-4xl">
            One Platform. Multiple Solutions.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-slate-500">
            Whether you need to transport goods or find business,
            Transport Connect makes logistics easier.
          </p>
        </div>

        <div className="mt-12 grid gap-7 md:grid-cols-3">

          <ServiceCard
            icon={<Package size={28} />}
            title="For Customers"
            description="Post your goods requirements, receive quotations and choose the best transport partner."
            color="bg-blue-100 text-blue-700"
          />

          <ServiceCard
            icon={<Truck size={28} />}
            title="For Truck Owners"
            description="List your available vehicles, discover loads and grow your transportation business."
            color="bg-emerald-100 text-emerald-700"
          />

          <ServiceCard
            icon={<Users size={28} />}
            title="For Drivers"
            description="Manage assigned trips, update delivery status and share location during active trips."
            color="bg-orange-100 text-orange-700"
          />

        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="bg-white py-20">

        <div className="mx-auto max-w-7xl px-6">

          <div className="text-center">
            <span className="font-bold uppercase tracking-widest text-blue-700">
              Simple Process
            </span>

            <h2 className="mt-3 text-3xl font-extrabold md:text-4xl">
              How Transport Connect Works
            </h2>
          </div>

          <div className="mt-14 grid gap-10 md:grid-cols-3">

            <StepCard
              number="01"
              title="Post or Search"
              description="Customers post loads while truck owners list available vehicles."
            />

            <StepCard
              number="02"
              title="Compare & Book"
              description="Compare prices, negotiate with partners and confirm bookings."
            />

            <StepCard
              number="03"
              title="Track & Deliver"
              description="Follow trip progress and complete goods delivery."
            />

          </div>

        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="mx-auto max-w-7xl px-6 py-20">

        <div className="rounded-3xl bg-blue-950 px-8 py-12 text-center text-white md:px-16">

          <h2 className="text-3xl font-extrabold md:text-4xl">
            Ready to Simplify Your Logistics?
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-blue-200">
            Join a smarter transportation ecosystem connecting
            customers, truck owners and drivers across India.
          </p>

          <button
            onClick={() => openAuth('register')}
            className="mt-8 rounded-xl bg-white px-8 py-4 font-bold text-blue-900 hover:bg-blue-50"
          >
            Get Started Today
          </button>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white">

        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 md:flex-row">

          <div>
            <h3 className="font-extrabold">
              Transport<span className="text-blue-700">Connect</span>
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              India's Transport Marketplace
            </p>
          </div>

          <p className="text-sm text-slate-500">
            Ã‚Â© 2026 Transport Connect. All rights reserved.
          </p>

          <div className="flex gap-5 text-sm text-slate-500">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Support</a>
          </div>

        </div>
      </footer>

      {/* AUTHENTICATION MODAL */}
      <AuthModal
        isOpen={authOpen}
        initialMode={authMode}
        onClose={() => setAuthOpen(false)}
        onLogin={handleLogin}
      />

    </div>
  )
}

/* SERVICE CARD */
function ServiceCard({
  icon,
  title,
  description,
  color,
}: {
  icon: ReactNode
  title: string
  description: string
  color: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 transition hover:-translate-y-1 hover:shadow-xl">

      <div className={`inline-flex rounded-xl p-4 ${color}`}>
        {icon}
      </div>

      <h3 className="mt-6 text-xl font-bold">
        {title}
      </h3>

      <p className="mt-3 leading-7 text-slate-500">
        {description}
      </p>

    </div>
  )
}

/* HOW IT WORKS CARD */
function StepCard({
  number,
  title,
  description,
}: {
  number: string
  title: string
  description: string
}) {
  return (
    <div className="text-center">

      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-xl font-extrabold text-blue-700">
        {number}
      </div>

      <h3 className="mt-6 text-xl font-bold">
        {title}
      </h3>

      <p className="mx-auto mt-3 max-w-sm leading-7 text-slate-500">
        {description}
      </p>

    </div>
  )
}

export default App
