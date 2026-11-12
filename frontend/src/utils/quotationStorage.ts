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

const initialDemoQuotations: LoadQuotation[] = []

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