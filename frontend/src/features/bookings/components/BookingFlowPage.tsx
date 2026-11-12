import { useState, useMemo, useEffect } from 'react'
import {
  ClipboardList,
  Search,
  MapPin,
  Truck,
  UserCheck,
  Navigation,
  MessageSquare,
  CheckCircle2,
  ArrowRight,
  Star,
  FileCheck2,
  X,
} from 'lucide-react'
import type { TransportBooking, BookingTripStage } from '../../../utils/bookingStorage'
import { apiClient, getAuthToken } from '../../../services/apiClient'
import {
  getBookings,
  assignBookingDriver,
  advanceBookingStage,
  submitBookingReview,
} from '../../../utils/bookingStorage'
import LiveTripTrackingModal from '../../../components/common/LiveTripTrackingModal'
import type { TrackingTripData } from '../../../components/common/LiveTripTrackingModal'
import TripChatModal from '../../../components/common/TripChatModal'

const STAGE_ORDER: BookingTripStage[] = [
  'BOOKED',
  'DRIVER_ASSIGNED',
  'STARTED',
  'IN_TRANSIT',
  'DELIVERED',
  'COMPLETED',
]

const STAGE_LABELS: Record<BookingTripStage, string> = {
  BOOKED: 'Booked',
  DRIVER_ASSIGNED: 'Driver Assigned',
  STARTED: 'Trip Started',
  IN_TRANSIT: 'In Transit',
  DELIVERED: 'Delivered',
  COMPLETED: 'Completed',
}

export default function BookingFlowPage() {
  const [bookings, setBookings] = useState<TransportBooking[]>(() => (getAuthToken() ? [] : getBookings()))

  useEffect(() => {
    if (!getAuthToken()) return
    apiClient
      .getMyBookings()
      .then((list) => {
        if (Array.isArray(list)) {
          const mapStage = (s: string): BookingTripStage => {
            if (s === 'CONFIRMED') return 'DRIVER_ASSIGNED'
            if (s === 'IN_TRANSIT') return 'IN_TRANSIT'
            if (s === 'COMPLETED') return 'COMPLETED'
            return 'BOOKED'
          }
          setBookings(
            list.map((b: any) => ({
              id: String(b.id),
              loadId: b.loadId ? String(b.loadId) : b.bookingCode || `LD-${b.id}`,
              from: b.pickupCity,
              to: b.dropCity,
              material: 'Freight Cargo',
              vehicleType: b.vehicleType || 'Truck',
              truckNumber: b.vehicleRegistration || 'Assigned Fleet',
              truckOwner: b.transporterCompany || b.transporterName || 'Transporter',
              driverName: b.driverName || 'Not Assigned',
              driverPhone: b.driverPhone || b.transporterPhone || '+91 98765 43210',
              amount: Number(b.totalAmount || 0),
              stage: mapStage(b.status),
              createdAt: b.createdAt || new Date().toISOString(),
            })),
          )
        }
      })
      .catch(() => {})
  }, [])
  const [searchQuery, setSearchQuery] = useState('')
  const [stageFilter, setStageFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL')

  // Driver Assignment Modal
  const [assignBooking, setAssignBooking] = useState<TransportBooking | null>(null)
  const [driverName, setDriverName] = useState('')
  const [driverPhone, setDriverPhone] = useState('')
  const [truckNumber, setTruckNumber] = useState('')

  // POD & Completion Modal
  const [podModalBooking, setPodModalBooking] = useState<TransportBooking | null>(null)
  const [podRef, setPodRef] = useState('')

  // Review & Rating Modal
  const [reviewBooking, setReviewBooking] = useState<TransportBooking | null>(null)
  const [rating, setRating] = useState(5)
  const [reviewNote, setReviewNote] = useState('')

  // Live Tracking & Chat Modals
  const [trackingTrip, setTrackingTrip] = useState<TrackingTripData | undefined>()
  const [trackingOpen, setTrackingOpen] = useState(false)
  const [chatBooking, setChatBooking] = useState<TransportBooking | null>(null)

  const filteredBookings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return bookings.filter((bk) => {
      const matchesTab =
        stageFilter === 'ALL' ||
        (stageFilter === 'COMPLETED' ? bk.stage === 'COMPLETED' : bk.stage !== 'COMPLETED')
      const matchesQuery =
        !q ||
        bk.id.toLowerCase().includes(q) ||
        bk.loadId.toLowerCase().includes(q) ||
        bk.from.toLowerCase().includes(q) ||
        bk.to.toLowerCase().includes(q) ||
        bk.driverName.toLowerCase().includes(q) ||
        bk.truckNumber.toLowerCase().includes(q)
      return matchesTab && matchesQuery
    })
  }, [bookings, searchQuery, stageFilter])

  const getNextStage = (current: BookingTripStage): BookingTripStage | null => {
    const idx = STAGE_ORDER.indexOf(current)
    if (idx === -1 || idx >= STAGE_ORDER.length - 1) return null
    return STAGE_ORDER[idx + 1]
  }

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!assignBooking || !driverName.trim()) return
    setBookings(
      assignBookingDriver(
        assignBooking.id,
        driverName,
        driverPhone || '+91 98765 43210',
        truckNumber || assignBooking.truckNumber
      )
    )
    setAssignBooking(null)
  }

  const handleStageAdvance = (booking: TransportBooking) => {
    const next = getNextStage(booking.stage)
    if (!next) return

    if (next === 'DELIVERED' || next === 'COMPLETED') {
      setPodModalBooking(booking)
      setPodRef(booking.podReference || `POD-${Date.now().toString().slice(-5)}`)
      return
    }

    setBookings(advanceBookingStage(booking.id, next))
  }

  const handlePodConfirm = (e: React.FormEvent) => {
    e.preventDefault()
    if (!podModalBooking) return
    const targetStage: BookingTripStage =
      podModalBooking.stage === 'DELIVERED' ? 'COMPLETED' : 'DELIVERED'
    setBookings(advanceBookingStage(podModalBooking.id, targetStage, podRef))
    setPodModalBooking(null)
  }

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reviewBooking) return
    setBookings(submitBookingReview(reviewBooking.id, rating, reviewNote))
    setReviewBooking(null)
    setReviewNote('')
  }

  const handleOpenTracking = (bk: TransportBooking) => {
    setTrackingTrip({
      tripId: `TRP-${bk.id.replace('BK-', '')}`,
      bookingId: bk.id,
      driverName: bk.driverName,
      driverPhone: bk.driverPhone,
      truckNumber: bk.truckNumber,
      truckType: bk.vehicleType,
      from: bk.from,
      to: bk.to,
      stops: bk.stops,
      currentStatus: bk.stage === 'COMPLETED' || bk.stage === 'DELIVERED' ? 'DELIVERED' : 'IN_TRANSIT',
      totalDistanceKm: 520,
      coveredDistanceKm: bk.stage === 'COMPLETED' ? 520 : 260,
      eta: bk.stage === 'COMPLETED' ? 'Delivered' : '3 hrs 45 mins',
      speedKmH: bk.stage === 'COMPLETED' ? 0 : 61,
    })
    setTrackingOpen(true)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Bookings & Trip Execution Flow</h2>
          <p className="mt-1 text-xs text-slate-500">
            Assign drivers, advance trip milestones, upload POD references, and rate completed trips.
          </p>
        </div>

        <div className="flex rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
          {(['ALL', 'ACTIVE', 'COMPLETED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStageFilter(tab)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                stageFilter === tab
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'ALL' ? 'All Bookings' : tab === 'ACTIVE' ? 'Active Trips' : 'Completed'}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="relative max-w-xl">
          <Search size={17} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by booking ID, route, truck number or driver..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <ClipboardList size={38} className="mx-auto text-slate-300" />
            <h4 className="mt-3 font-bold text-slate-800">No bookings match your filter</h4>
          </div>
        ) : (
          filteredBookings.map((bk) => {
            const currentStepIdx = STAGE_ORDER.indexOf(bk.stage)
            const nextStage = getNextStage(bk.stage)

            return (
              <div
                key={bk.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                {/* Top Row */}
                <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-center">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                        {bk.id}
                      </span>
                      <span className="text-xs text-slate-400">Load: {bk.loadId}</span>
                      <StagePill stage={bk.stage} />
                      {bk.podReference && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                          <FileCheck2 size={12} className="text-emerald-600" /> {bk.podReference}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1 text-base font-bold text-slate-900">
                      <MapPin size={16} className="shrink-0 text-blue-600" />
                      <span>{bk.from}</span>
                      <span className="text-slate-400">→</span>
                      <span>{bk.to}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <Truck size={14} className="text-blue-600" /> {bk.truckNumber} ({bk.vehicleType})
                      </span>
                      <span>·</span>
                      <span>
                        Driver:{' '}
                        <b className={bk.driverName === 'Not Assigned' ? 'text-amber-600' : 'text-slate-800'}>
                          {bk.driverName}
                        </b>
                      </span>
                      <span>·</span>
                      <span className="font-bold text-slate-900">
                        ₹{bk.amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Action Controls */}
                  <div className="flex flex-wrap items-center gap-2">
                    {bk.stage === 'BOOKED' && (
                      <button
                        onClick={() => {
                          setAssignBooking(bk)
                          setDriverName('')
                          setDriverPhone('')
                          setTruckNumber(bk.truckNumber)
                        }}
                        className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                      >
                        <UserCheck size={14} /> Assign Driver
                      </button>
                    )}

                    {nextStage && bk.stage !== 'BOOKED' && (
                      <button
                        onClick={() => handleStageAdvance(bk)}
                        className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        Mark {STAGE_LABELS[nextStage]} <ArrowRight size={14} />
                      </button>
                    )}

                    {bk.stage === 'COMPLETED' && !bk.rating && (
                      <button
                        onClick={() => {
                          setReviewBooking(bk)
                          setRating(5)
                          setReviewNote('')
                        }}
                        className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-semibold text-white hover:bg-amber-600"
                      >
                        <Star size={14} /> Rate Trip
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenTracking(bk)}
                      className="flex items-center gap-1.5 rounded-xl bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                    >
                      <Navigation size={14} /> Live Track
                    </button>

                    <button
                      onClick={() => setChatBooking(bk)}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <MessageSquare size={14} className="text-blue-600" /> Chat
                    </button>
                  </div>
                </div>

                {/* Progress Stepper */}
                <div className="mt-4">
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                    {STAGE_ORDER.map((step, index) => {
                      const done = index <= currentStepIdx
                      return (
                        <div key={step} className="flex flex-col gap-1">
                          <div
                            className={`h-1.5 rounded-full transition-all ${
                              done ? 'bg-blue-600' : 'bg-slate-100'
                            }`}
                          />
                          <span
                            className={`text-[10px] font-semibold ${
                              done ? 'text-blue-700' : 'text-slate-400'
                            }`}
                          >
                            {STAGE_LABELS[step]}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Rating Display if completed & rated */}
                {bk.rating && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-amber-50/70 px-4 py-2.5 text-xs text-amber-900">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Star size={14} className="fill-amber-500 text-amber-500" />
                      <span>Trip Rated {bk.rating}/5</span>
                    </div>
                    {bk.reviewNote && <span className="italic text-slate-600">"{bk.reviewNote}"</span>}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Assign Driver Modal */}
      {assignBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900">Assign Driver & Vehicle</h3>
                <p className="text-xs text-slate-500">{assignBooking.id}</p>
              </div>
              <button onClick={() => setAssignBooking(null)} className="rounded-lg p-1.5 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-700">Driver Name *</span>
                <input
                  required
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-700">Driver Mobile *</span>
                <input
                  required
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-700">Truck Number *</span>
                <input
                  required
                  value={truckNumber}
                  onChange={(e) => setTruckNumber(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm uppercase outline-none focus:border-blue-500"
                />
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignBooking(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POD & Delivery Confirmation Modal */}
      {podModalBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900">Proof of Delivery (POD)</h3>
                <p className="text-xs text-slate-500">Confirm delivery receipt for {podModalBooking.id}</p>
              </div>
              <button onClick={() => setPodModalBooking(null)} className="rounded-lg p-1.5 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handlePodConfirm} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-700">
                  POD Slip / E-Way Bill Reference *
                </span>
                <input
                  required
                  value={podRef}
                  onChange={(e) => setPodRef(e.target.value)}
                  placeholder="e.g. POD-HYD-9021"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPodModalBooking(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  <CheckCircle2 size={14} /> Confirm Delivery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rating & Review Modal */}
      {reviewBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900">Rate Trip Experience</h3>
                <p className="text-xs text-slate-500">{reviewBooking.truckOwner} · {reviewBooking.driverName}</p>
              </div>
              <button onClick={() => setReviewBooking(null)} className="rounded-lg p-1.5 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <span className="mb-2 block text-xs font-semibold text-slate-700">Select Rating</span>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className="rounded-xl border border-slate-200 p-2.5 hover:bg-amber-50"
                    >
                      <Star
                        size={20}
                        className={star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-700">Feedback / Review</span>
                <textarea
                  rows={3}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Share feedback on delivery punctuality and driver behavior..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-500"
                />
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewBooking(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Live GPS Modal */}
      <LiveTripTrackingModal
        isOpen={trackingOpen}
        onClose={() => setTrackingOpen(false)}
        trip={trackingTrip}
      />

      {/* Trip Chat Modal */}
      {chatBooking && (
        <TripChatModal
          isOpen={Boolean(chatBooking)}
          onClose={() => setChatBooking(null)}
          tripId={`TRP-${chatBooking.id.replace('BK-', '')}`}
          bookingId={chatBooking.id}
          route={`${chatBooking.from} → ${chatBooking.to}`}
          currentUserId="USER-ACTIVE"
          currentUserName="Platform User"
          currentUserRole="Transporter"
          counterpartName={`${chatBooking.driverName} (Driver)`}
          counterpartPhone={chatBooking.driverPhone}
        />
      )}
    </div>
  )
}

function StagePill({ stage }: { stage: BookingTripStage }) {
  const styles: Record<BookingTripStage, string> = {
    BOOKED: 'bg-blue-50 text-blue-700',
    DRIVER_ASSIGNED: 'bg-indigo-50 text-indigo-700',
    STARTED: 'bg-violet-50 text-violet-700',
    IN_TRANSIT: 'bg-amber-50 text-amber-700',
    DELIVERED: 'bg-teal-50 text-teal-700',
    COMPLETED: 'bg-emerald-50 text-emerald-700',
  }
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${styles[stage]}`}>
      {STAGE_LABELS[stage]}
    </span>
  )
}
