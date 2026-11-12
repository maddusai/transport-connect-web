export type VehicleStatus = 'Available' | 'On Trip' | 'Maintenance'

export interface FleetVehicle {
  id: string
  registrationNumber: string
  vehicleType: string
  capacityTons: number
  assignedDriver: string
  driverPhone?: string
  rcExpiry: string
  insuranceExpiry: string
  status: VehicleStatus
  createdAt: string
}

const VEHICLES_STORAGE_KEY = 'transport_connect_fleet_vehicles'

const initialDemoVehicles: FleetVehicle[] = []

export function getFleetVehicles(): FleetVehicle[] {
  try {
    const raw = localStorage.getItem(VEHICLES_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(initialDemoVehicles))
      return initialDemoVehicles
    }
    return JSON.parse(raw)
  } catch (error) {
    console.error('Failed to load vehicles:', error)
    return initialDemoVehicles
  }
}

export function addFleetVehicle(
  vehicle: Omit<FleetVehicle, 'id' | 'createdAt'>
): FleetVehicle[] {
  const newVehicle: FleetVehicle = {
    ...vehicle,
    id: `VEH-${Date.now().toString().slice(-5)}`,
    createdAt: new Date().toISOString(),
  }
  const updated = [newVehicle, ...getFleetVehicles()]
  localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(updated))
  return updated
}

export function updateVehicleStatus(
  vehicleId: string,
  status: VehicleStatus
): FleetVehicle[] {
  const updated = getFleetVehicles().map((v) =>
    v.id === vehicleId ? { ...v, status } : v
  )
  localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(updated))
  return updated
}

export function assignDriverToVehicle(
  vehicleId: string,
  driverName: string,
  driverPhone?: string
): FleetVehicle[] {
  const updated = getFleetVehicles().map((v) =>
    v.id === vehicleId
      ? { ...v, assignedDriver: driverName || 'Not Assigned', driverPhone }
      : v
  )
  localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(updated))
  return updated
}

export function deleteFleetVehicle(vehicleId: string): FleetVehicle[] {
  const updated = getFleetVehicles().filter((v) => v.id !== vehicleId)
  localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(updated))
  return updated
}