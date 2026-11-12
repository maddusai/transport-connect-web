
export type DriverVerificationStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'

export type OwnerDriver = {
  id: string
  name: string
  phone: string
  licenseNumber: string
  driverImage?: string
  licenseImage?: string
  status: 'AVAILABLE' | 'ASSIGNED'
  verificationStatus?: DriverVerificationStatus
  verificationUpdatedAt?: string
  verificationReason?: string
}

export type TripDriverAssignment = {
  driverId: string
  name: string
  phone: string
  licenseNumber: string
  driverImage?: string
  licenseImage?: string
  assignedAt: string
  releasedAt?: string
}

const DRIVER_STORAGE_KEY = 'transport_connect_owner_drivers'

const TRIP_ASSIGNMENT_STORAGE_KEY =
  'transport_connect_trip_driver_assignments'

// Get all truck owner drivers
export const getOwnerDrivers = (): OwnerDriver[] => {
  try {
    const raw = localStorage.getItem(DRIVER_STORAGE_KEY)

    if (!raw) return []

    const drivers = JSON.parse(raw) as OwnerDriver[]

    return drivers.map((driver) => ({
      ...driver,
      verificationStatus:
        driver.verificationStatus ?? 'PENDING',
    }))
  } catch {
    return []
  }
}

// Add a new driver
export const addOwnerDriver = (driver: OwnerDriver): void => {
  const drivers = getOwnerDrivers()

  const newDriver: OwnerDriver = {
    ...driver,
    status: 'AVAILABLE',
    verificationStatus: 'PENDING',
    verificationUpdatedAt: undefined,
    verificationReason: undefined,
  }

  localStorage.setItem(
    DRIVER_STORAGE_KEY,
    JSON.stringify([newDriver, ...drivers]),
  )
}

// Update driver verification
export const updateDriverVerification = (
  driverId: string,
  verificationStatus: DriverVerificationStatus,
  reason?: string,
): void => {
  const drivers = getOwnerDrivers()

  const updatedDrivers = drivers.map((driver) =>
    driver.id === driverId
      ? {
          ...driver,
          verificationStatus,
          verificationUpdatedAt: new Date().toISOString(),
          verificationReason:
            verificationStatus === 'REJECTED'
              ? reason?.trim() || 'Licence verification rejected'
              : undefined,
        }
      : driver,
  )

  localStorage.setItem(
    DRIVER_STORAGE_KEY,
    JSON.stringify(updatedDrivers),
  )
}

// Get all trip-driver assignments
export const getTripDriverAssignments =
  (): Record<string, TripDriverAssignment> => {
    try {
      const raw = localStorage.getItem(TRIP_ASSIGNMENT_STORAGE_KEY)

      return raw
        ? (JSON.parse(raw) as Record<string, TripDriverAssignment>)
        : {}
    } catch {
      return {}
    }
  }

// Assign an approved and available driver to a trip
export const assignDriverToTrip = (
  tripId: string,
  driver: OwnerDriver,
): boolean => {
  const drivers = getOwnerDrivers()

  const currentDriver = drivers.find(
    (item) => item.id === driver.id,
  )

  if (!currentDriver) return false

  if (currentDriver.verificationStatus !== 'APPROVED') {
    return false
  }

  if (currentDriver.status !== 'AVAILABLE') {
    return false
  }

  const assignments = getTripDriverAssignments()

  // Prevent duplicate assignment to the same active trip
  if (
    assignments[tripId] &&
    !assignments[tripId].releasedAt
  ) {
    return false
  }

  // Prevent assigning a driver who is already on another active trip
  const alreadyAssigned = Object.values(assignments).some(
    (assignment) =>
      assignment.driverId === currentDriver.id &&
      !assignment.releasedAt,
  )

  if (alreadyAssigned) return false

  // Save assignment history
  assignments[tripId] = {
    driverId: currentDriver.id,
    name: currentDriver.name,
    phone: currentDriver.phone,
    licenseNumber: currentDriver.licenseNumber,
    driverImage: currentDriver.driverImage,
    licenseImage: currentDriver.licenseImage,
    assignedAt: new Date().toISOString(),
  }

  localStorage.setItem(
    TRIP_ASSIGNMENT_STORAGE_KEY,
    JSON.stringify(assignments),
  )

  // Update driver status
  const updatedDrivers = drivers.map((item) =>
    item.id === currentDriver.id
      ? { ...item, status: 'ASSIGNED' as const }
      : item,
  )

  localStorage.setItem(
    DRIVER_STORAGE_KEY,
    JSON.stringify(updatedDrivers),
  )

  return true
}

// Release driver after trip completion.
// Assignment history is preserved.
export const releaseDriverFromTrip = (
  tripId: string,
): boolean => {
  const assignments = getTripDriverAssignments()

  const assignment = assignments[tripId]

  if (!assignment || assignment.releasedAt) {
    return false
  }

  const drivers = getOwnerDrivers()

  const updatedDrivers = drivers.map((driver) =>
    driver.id === assignment.driverId
      ? {
          ...driver,
          status: 'AVAILABLE' as const,
        }
      : driver,
  )

  // Mark assignment as released without deleting history
  assignments[tripId] = {
    ...assignment,
    releasedAt: new Date().toISOString(),
  }

  localStorage.setItem(
    DRIVER_STORAGE_KEY,
    JSON.stringify(updatedDrivers),
  )

  localStorage.setItem(
    TRIP_ASSIGNMENT_STORAGE_KEY,
    JSON.stringify(assignments),
  )

  return true
}
