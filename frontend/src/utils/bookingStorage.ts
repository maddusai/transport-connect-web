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

const initialDemoBookings: TransportBooking[] = [
  {
    id: 'BK-10492',
    loadId: 'LD1001',
    quotationId: 'QT-5001',
    from: 'Hyderabad, Uppal',
    to: 'Bangalore, Electronic City',
    stops: ['Kurnool Bypass', 'Anantapur Hub'],
    material: 'Electronics',
    vehicleType: '32 FT Container',
    truckNumber: 'TS 09 AB 1234',
    truckOwner: 'Sai Transport Agency',
    driverName: 'Ramesh Kumar',
    driverPhone: '+91 98765 43210',
    amount: 27500,
    stage: 'IN_TRANSIT',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'BK-10493',
    loadId: 'LD1002',
    quotationId: 'QT-5002',
    from: 'Vijayawada, Auto Nagar',
    to: 'Chennai, Ambattur',
    stops: ['Nellore Bypass'],
    material: 'Agricultural Goods',
    vehicleType: '14 FT Truck',
    truckNumber: 'AP 16 CD 5678',
    truckOwner: 'Venkateswara Logistics',
    driverName: 'Not Assigned',
    driverPhone: '+91 98765 43211',
    amount: 17500,
    stage: 'BOOKED',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'BK-10489',
    loadId: 'LD1004',
    from: 'Visakhapatnam',
    to: 'Hyderabad',
    stops: ['Rajahmundry', 'Vijayawada'],
    material: 'Industrial Goods',
    vehicleType: 'Container',
    truckNumber: 'TS 08 EF 9012',
    truckOwner: 'Sai Transport Agency',
    driverName: 'Mahesh Babu',
    driverPhone: '+91 98765 43212',
    amount: 24000,
    stage: 'COMPLETED',
    podReference: 'POD-VIZ-8891',
    rating: 5,
    reviewNote: 'On-time delivery and safe handling of machinery.',
    createdAt: new Date().toISOString(),
  },
]

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