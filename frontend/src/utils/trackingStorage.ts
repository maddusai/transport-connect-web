
export type TripLocation = {
  tripId: string
  latitude: number
  longitude: number
  accuracy: number | null
  placeName?: string
  recordedAt: string
}

export type TripTrackingRecord = {
  tripId: string
  isTracking: boolean
  startedAt?: string
  stoppedAt?: string
  lastLocation?: TripLocation
}

const TRACKING_STORAGE_KEY = 'transport_connect_trip_tracking'

const getAllRecords = (): Record<string, TripTrackingRecord> => {
  try {
    const stored = localStorage.getItem(TRACKING_STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

const saveAllRecords = (
  records: Record<string, TripTrackingRecord>,
): boolean => {
  try {
    localStorage.setItem(TRACKING_STORAGE_KEY, JSON.stringify(records))
    return true
  } catch {
    return false
  }
}

export const getTripTrackingRecord = (
  tripId: string,
): TripTrackingRecord | null => {
  return getAllRecords()[tripId] ?? null
}

export const getAllTripTrackingRecords = (): TripTrackingRecord[] => {
  return Object.values(getAllRecords())
}

export const startTripTracking = (tripId: string): boolean => {
  if (!tripId.trim()) return false

  const records = getAllRecords()
  const existing = records[tripId]

  records[tripId] = {
    ...existing,
    tripId,
    isTracking: true,
    startedAt: new Date().toISOString(),
    stoppedAt: undefined,
  }

  return saveAllRecords(records)
}

export const saveTripLocation = (
  tripId: string,
  latitude: number,
  longitude: number,
  accuracy: number | null,
): boolean => {
  if (
    !tripId.trim() ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return false
  }

  const records = getAllRecords()
  const existing = records[tripId]

  if (!existing?.isTracking) return false

  records[tripId] = {
    ...existing,
    lastLocation: {
      ...existing.lastLocation,
      tripId,
      latitude,
      longitude,
      accuracy,
      recordedAt: new Date().toISOString(),
    },
  }

  return saveAllRecords(records)
}

export const updateTripPlaceName = (
  tripId: string,
  placeName: string,
): boolean => {
  const records = getAllRecords()
  const existing = records[tripId]

  if (!existing?.lastLocation || !placeName.trim()) return false

  records[tripId] = {
    ...existing,
    lastLocation: {
      ...existing.lastLocation,
      placeName: placeName.trim(),
    },
  }

  return saveAllRecords(records)
}

export const stopTripTracking = (tripId: string): boolean => {
  const records = getAllRecords()
  const existing = records[tripId]

  if (!existing) return false

  records[tripId] = {
    ...existing,
    isTracking: false,
    stoppedAt: new Date().toISOString(),
  }

  return saveAllRecords(records)
}
