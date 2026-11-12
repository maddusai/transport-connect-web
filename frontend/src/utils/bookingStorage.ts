export type BookingTripStage =
  | 'BOOKED'
  | 'DRIVER_ASSIGNED'
  | 'STARTED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'COMPLETED'

export interface TransportBooking {
  id: string
  loadId: string
  quotationId?: string
  from: string
  to: string
  stops?: string[]
  material: string
  vehicleType: string
  truckNumber: string
  truckOwner: string
  driverName: string
  driverPhone: string
  amount: number
  stage: BookingTripStage
  podReference?: string
  rating?: number
  reviewNote?: string
  createdAt: string
}

const BOOKINGS_STORAGE_KEY = 'transport_connect_bookings_v1'

const initialDemoBookings: TransportBooking[] = []

export function getBookings(): TransportBooking[] {
  try {
    const raw = localStorage.getItem(BOOKINGS_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(initialDemoBookings))
      return initialDemoBookings
    }
    return JSON.parse(raw)
  } catch (error) {
    console.error('Failed to load bookings:', error)
    return initialDemoBookings
  }
}

export function assignBookingDriver(
  bookingId: string,
  driverName: string,
  driverPhone: string,
  truckNumber: string
): TransportBooking[] {
  const updated = getBookings().map((bk) =>
    bk.id === bookingId
      ? {
          ...bk,
          driverName: driverName.trim(),
          driverPhone: driverPhone.trim(),
          truckNumber: truckNumber.trim().toUpperCase(),
          stage: 'DRIVER_ASSIGNED' as BookingTripStage,
        }
      : bk
  )
  localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(updated))
  return updated
}

export function advanceBookingStage(
  bookingId: string,
  nextStage: BookingTripStage,
  podReference?: string
): TransportBooking[] {
  const updated = getBookings().map((bk) =>
    bk.id === bookingId
      ? {
          ...bk,
          stage: nextStage,
          ...(podReference ? { podReference: podReference.trim() } : {}),
        }
      : bk
  )
  localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(updated))
  return updated
}

export function submitBookingReview(
  bookingId: string,
  rating: number,
  reviewNote: string
): TransportBooking[] {
  const updated = getBookings().map((bk) =>
    bk.id === bookingId
      ? {
          ...bk,
          rating,
          reviewNote: reviewNote.trim(),
        }
      : bk
  )
  localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(updated))
  return updated
}