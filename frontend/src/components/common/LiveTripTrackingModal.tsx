import { useState, useEffect } from 'react'
import {
  X,
  MapPin,
  Navigation,
  Phone,
  Truck,
  Clock,
  Gauge,
  CheckCircle2,
  ShieldCheck,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react'
import { apiClient, getAuthToken } from '../../services/apiClient'

export type TrackingTripData = {
  tripId: string
  bookingId: string
  driverName: string
  driverPhone: string
  truckNumber: string
  truckType: string
  from: string
  to: string
  stops?: string[]
  currentStatus: 'STARTED' | 'IN_TRANSIT' | 'REACHED_STOP' | 'DELIVERED'
  totalDistanceKm: number
  coveredDistanceKm: number
  eta: string
  speedKmH: number
}

interface LiveTripTrackingModalProps {
  isOpen: boolean
  onClose: () => void
  trip?: TrackingTripData
}

const defaultDemoTrip: TrackingTripData = {
  tripId: 'TRP-84920',
  bookingId: 'BK-10492',
  driverName: 'Ramesh Kumar',
  driverPhone: '+91 98765 43210',
  truckNumber: 'TS 09 AB 1234',
  truckType: '32 FT Container',
  from: 'Hyderabad, Telangana',
  to: 'Bangalore, Karnataka',
  stops: ['Kurnool Bypass', 'Anantapur Hub'],
  currentStatus: 'IN_TRANSIT',
  totalDistanceKm: 575,
  coveredDistanceKm: 280,
  eta: '4 hrs 15 mins',
  speedKmH: 62,
}

export default function LiveTripTrackingModal({
  isOpen,
  onClose,
  trip = defaultDemoTrip,
}: LiveTripTrackingModalProps) {
  const [progress, setProgress] = useState(
    Math.round((trip.coveredDistanceKm / trip.totalDistanceKm) * 100)
  )
  const [speed, setSpeed] = useState(trip.speedKmH)
  const [isSimulating, setIsSimulating] = useState(false)

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (isSimulating) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsSimulating(false)
            return 100
          }
          const next = prev + 1
          setSpeed(Math.floor(58 + Math.random() * 12))
          return next
        })
      }, 700)
    }
    return () => clearInterval(interval)
  }, [isSimulating])

  if (!isOpen) return null

  const currentCoveredKm = Math.round((progress / 100) * trip.totalDistanceKm)
  const remainingKm = trip.totalDistanceKm - currentCoveredKm

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-sm sm:p-5">
      <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <Navigation className="animate-pulse" size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">Live GPS Vehicle Tracking</h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                  <span className="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-500" />
                  GPS ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Trip ID: <span className="font-semibold text-slate-700">{trip.tripId}</span> · Booking:{' '}
                <span className="font-semibold text-slate-700">{trip.bookingId}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                isSimulating
                  ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {isSimulating ? <Pause size={14} /> : <Play size={14} />}
              {isSimulating ? 'Pause Sim' : 'Simulate Live'}
            </button>
            <button
              onClick={() => {
                setProgress(20)
                setIsSimulating(false)
              }}
              className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-100"
              title="Reset progress"
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto lg:flex-row">
          <div className="relative flex flex-1 flex-col bg-slate-900 p-6 text-white min-h-[380px] lg:min-h-[500px]">
            <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px] opacity-40" />

            <div className="relative z-10 flex flex-1 flex-col justify-between">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-800/80 p-4 backdrop-blur-md border border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
                    <Truck size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Assigned Fleet</p>
                    <p className="font-bold text-slate-100">{trip.truckNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-xs text-slate-400">Current Speed</p>
                    <p className="text-lg font-extrabold text-emerald-400 flex items-center gap-1">
                      <Gauge size={16} /> {isSimulating ? speed : trip.speedKmH} km/h
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Estimated Arrival</p>
                    <p className="text-lg font-extrabold text-blue-400 flex items-center gap-1">
                      <Clock size={16} /> {trip.eta}
                    </p>
                  </div>
                </div>
              </div>

              <div className="my-auto py-8">
                <div className="relative mx-auto max-w-xl">
                  <div className="h-3 w-full rounded-full bg-slate-800 border border-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div
                    className="absolute -top-3.5 -translate-x-1/2 transition-all duration-500"
                    style={{ left: `${progress}%` }}
                  >
                    <div className="relative flex flex-col items-center">
                      <span className="mb-1 rounded-md bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-slate-950 shadow">
                        LIVE
                      </span>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 border-2 border-white text-white shadow-xl shadow-blue-500/50">
                        <Truck size={18} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-between text-xs">
                    <div className="text-left">
                      <span className="flex items-center gap-1 font-bold text-blue-400">
                        <MapPin size={14} /> Origin
                      </span>
                      <p className="mt-1 max-w-[120px] text-slate-300 font-medium">{trip.from}</p>
                    </div>

                    {trip.stops?.map((stop, index) => (
                      <div key={index} className="text-center">
                        <span className="flex items-center justify-center gap-1 text-slate-400 font-semibold">
                          Stop {index + 1}
                        </span>
                        <p className="mt-1 max-w-[100px] text-slate-300">{stop}</p>
                      </div>
                    ))}

                    <div className="text-right">
                      <span className="flex items-center justify-end gap-1 font-bold text-emerald-400">
                        <CheckCircle2 size={14} /> Destination
                      </span>
                      <p className="mt-1 max-w-[120px] text-slate-300 font-medium">{trip.to}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 rounded-2xl bg-slate-800/80 p-3 text-center border border-slate-700">
                <div>
                  <p className="text-[11px] text-slate-400">Distance Covered</p>
                  <p className="mt-0.5 font-bold text-slate-200">{currentCoveredKm} km</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400">Remaining</p>
                  <p className="mt-0.5 font-bold text-amber-400">{remainingKm} km</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400">Total Distance</p>
                  <p className="mt-0.5 font-bold text-slate-200">{trip.totalDistanceKm} km</p>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full border-t border-slate-200 bg-slate-50 p-6 lg:w-80 lg:border-l lg:border-t-0 flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Assigned Driver
                </h4>
                <div className="mt-3 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 font-bold text-blue-700 text-lg">
                    {trip.driverName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-slate-900">{trip.driverName}</p>
                    <p className="text-xs text-slate-500">Verified Driver</p>
                  </div>
                  <ShieldCheck className="text-emerald-500" size={18} />
                </div>
                <a
                  href={`tel:${trip.driverPhone}`}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700"
                >
                  <Phone size={16} /> Call Driver
                </a>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Vehicle Details
                </h4>
                <div className="mt-2 space-y-2 rounded-2xl border border-slate-200 bg-white p-4 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Vehicle No:</span>
                    <span className="font-bold text-slate-800">{trip.truckNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Vehicle Type:</span>
                    <span className="font-semibold text-slate-800">{trip.truckType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">GPS Device:</span>
                    <span className="text-emerald-600 font-semibold">Online (4G OBD)</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Milestone Progress
                </h4>
                <div className="mt-3 space-y-3 text-xs">
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                    <CheckCircle2 size={16} /> Trip Dispatched from {trip.from.split(',')[0]}
                  </div>
                  <div className="flex items-center gap-2 text-blue-700 font-semibold">
                    <span className="h-4 w-4 rounded-full border-2 border-blue-600 flex items-center justify-center">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                    </span>
                    In Transit towards destination
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="h-4 w-4 rounded-full border border-slate-300" />
                    Delivery Clearance Pending
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-200 pt-4 text-center">
              <p className="text-[11px] text-slate-400">
                Transport Connect Real-time Telematics Engine
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
