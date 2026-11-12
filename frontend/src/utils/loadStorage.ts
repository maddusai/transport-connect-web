
import { releaseDriverFromTrip } from './driverStorage'

export type SharedLoad = {
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
}

const STORAGE_KEY = 'transport_connect_customer_loads'

export const getCustomerLoads = (): SharedLoad[] => {
  try {
    const storedLoads = localStorage.getItem(STORAGE_KEY)
    return storedLoads ? JSON.parse(storedLoads) : []
  } catch {
    return []
  }
}

export const addCustomerLoad = (load: SharedLoad): void => {
  const existingLoads = getCustomerLoads()

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([load, ...existingLoads]),
  )
}

export const updateCustomerLoadStatus = (
  loadId: string,
  status: string,
): void => {
  const updatedLoads = getCustomerLoads().map((load) =>
    load.id === loadId ? { ...load, status } : load,
  )

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updatedLoads),
  )
}

export type MarketplaceLoad = {
  id: string
  from: string
  to: string
  material: string
  vehicle: string
  weight: string
  budget: string
  status: string
}

const MARKETPLACE_KEY = 'transport_connect_marketplace_loads'

export const getMarketplaceLoads = (): MarketplaceLoad[] => {
  try {
    const storedLoads = localStorage.getItem(MARKETPLACE_KEY)
    return storedLoads ? JSON.parse(storedLoads) : []
  } catch {
    return []
  }
}

export const saveMarketplaceLoads = (
  loads: MarketplaceLoad[],
): void => {
  localStorage.setItem(
    MARKETPLACE_KEY,
    JSON.stringify(loads),
  )
}

export type TripStatus =
  | 'BOOKED'
  | 'DRIVER_ASSIGNED'
  | 'STARTED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'COMPLETED'

export type Quotation = {
  id: string
  loadId: string
  from: string
  to: string
  truckOwner: string
  amount: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  submittedAt: string
  tripStatus?: TripStatus
}

const QUOTATION_KEY = 'transport_connect_quotations'

export const getQuotations = (): Quotation[] => {
  try {
    const storedQuotations = localStorage.getItem(QUOTATION_KEY)
    return storedQuotations ? JSON.parse(storedQuotations) : []
  } catch {
    return []
  }
}

export const addQuotation = (quotation: Quotation): void => {
  const existingQuotations = getQuotations()

  localStorage.setItem(
    QUOTATION_KEY,
    JSON.stringify([quotation, ...existingQuotations]),
  )
}

export const updateQuotationStatus = (
  quotationId: string,
  status: Quotation['status'],
): void => {
  const updatedQuotations = getQuotations().map((quotation) =>
    quotation.id === quotationId
      ? { ...quotation, status }
      : quotation,
  )

  localStorage.setItem(
    QUOTATION_KEY,
    JSON.stringify(updatedQuotations),
  )
}

export const updateQuotationTripStatus = (
  quotationId: string,
  tripStatus: TripStatus,
): void => {
  const updatedQuotations = getQuotations().map((quotation) =>
    quotation.id === quotationId
      ? { ...quotation, tripStatus }
      : quotation,
  )

  localStorage.setItem(
    QUOTATION_KEY,
    JSON.stringify(updatedQuotations),
  )

  // Release the driver when the trip is completed.
  if (tripStatus === 'COMPLETED') {
    releaseDriverFromTrip(quotationId)
  }
}
