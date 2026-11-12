export type QuotationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED'

export interface LoadQuotation {
  id: string
  loadId: string
  from: string
  to: string
  vehicleType: string
  truckOwner: string
  truckNumber: string
  amount: number
  etaDays: string
  notes?: string
  status: QuotationStatus
  tripStatus?: 'BOOKED' | 'DRIVER_ASSIGNED' | 'IN_TRANSIT' | 'COMPLETED'
  createdAt: string
}

const QUOTATIONS_STORAGE_KEY = 'transport_connect_quotations'

const initialDemoQuotations: LoadQuotation[] = [
  {
    id: 'QT-5001',
    loadId: 'LD1001',
    from: 'Hyderabad',
    to: 'Bangalore',
    vehicleType: '32 FT Container',
    truckOwner: 'Sri Balaji Transports',
    truckNumber: 'TS 09 AB 1234',
    amount: 27500,
    etaDays: '1 Day',
    notes: 'GPS enabled container, ready for immediate loading.',
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'QT-5002',
    loadId: 'LD1002',
    from: 'Vijayawada',
    to: 'Chennai',
    vehicleType: '14 FT Truck',
    truckOwner: 'Venkateswara Logistics',
    truckNumber: 'AP 16 CD 5678',
    amount: 17500,
    etaDays: '1 Day',
    notes: 'Experienced driver on Chennai highway route.',
    status: 'ACCEPTED',
    tripStatus: 'BOOKED',
    createdAt: new Date().toISOString(),
  },
]

export function getStoredQuotations(): LoadQuotation[] {
  try {
    const raw = localStorage.getItem(QUOTATIONS_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(QUOTATIONS_STORAGE_KEY, JSON.stringify(initialDemoQuotations))
      return initialDemoQuotations
    }
    return JSON.parse(raw)
  } catch (error) {
    console.error('Failed to load quotations:', error)
    return initialDemoQuotations
  }
}

export function submitLoadQuotation(
  quote: Omit<LoadQuotation, 'id' | 'status' | 'createdAt'>
): LoadQuotation[] {
  const newQuote: LoadQuotation = {
    ...quote,
    id: `QT-${Date.now().toString().slice(-5)}`,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  }
  const updated = [newQuote, ...getStoredQuotations()]
  localStorage.setItem(QUOTATIONS_STORAGE_KEY, JSON.stringify(updated))
  return updated
}

export function updateQuotationDecision(
  quotationId: string,
  status: QuotationStatus
): LoadQuotation[] {
  const updated = getStoredQuotations().map((q) =>
    q.id === quotationId
      ? {
          ...q,
          status,
          ...(status === 'ACCEPTED' ? { tripStatus: 'BOOKED' as const } : {}),
        }
      : q
  )
  localStorage.setItem(QUOTATIONS_STORAGE_KEY, JSON.stringify(updated))
  return updated
}