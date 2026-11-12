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

const initialDemoVehicles: FleetVehicle[] = [
  {
    id: 'VEH-101',
    registrationNumber: 'TS 09 AB 1234',
    vehicleType: '32 FT Container',
    capacityTons: 15,
    assignedDriver: 'Ramesh Kumar',
    driverPhone: '9876543210',
    rcExpiry: '2028-08-15',
    insuranceExpiry: '2027-03-20',
    status: 'Available',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'VEH-102',
    registrationNumber: 'AP 16 CD 5678',
    vehicleType: '14 FT Truck',
    capacityTons: 5,
    assignedDriver: 'Suresh Reddy',
    driverPhone: '9876543211',
    rcExpiry: '2027-11-10',
    insuranceExpiry: '2026-12-30',
    status: 'On Trip',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'VEH-103',
    registrationNumber: 'TS 08 EF 9012',
    vehicleType: '20 FT Container',
    capacityTons: 12,
    assignedDriver: 'Not Assigned',
    rcExpiry: '2029-01-25',
    insuranceExpiry: '2027-06-14',
    status: 'Maintenance',
    createdAt: new Date().toISOString(),
  },
]

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