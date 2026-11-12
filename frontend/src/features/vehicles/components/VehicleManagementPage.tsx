import { useState, useMemo, useEffect } from 'react'
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  Wrench,
  Navigation,
  Trash2,
  UserCheck,
  Calendar,
  X,
  ShieldCheck,
} from 'lucide-react'
import type { FleetVehicle, VehicleStatus } from '../../../utils/vehicleStorage'
import { apiClient, getAuthToken, getCurrentUser } from '../../../services/apiClient'
import {
  getFleetVehicles,
  addFleetVehicle,
  updateVehicleStatus,
  assignDriverToVehicle,
  deleteFleetVehicle,
} from '../../../utils/vehicleStorage'

export default function VehicleManagementPage() {
  const [vehicles, setVehicles] = useState<FleetVehicle[]>(getFleetVehicles)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | VehicleStatus>('ALL')
  const [showAddModal, setShowAddModal] = useState(false)

  // Add Vehicle Form State
  const [regNumber, setRegNumber] = useState('')
  const [vehicleType, setVehicleType] = useState('32 FT Container')
  const [capacityTons, setCapacityTons] = useState('')
  const [assignedDriver, setAssignedDriver] = useState('')
  const [driverPhone, setDriverPhone] = useState('')
  const [rcExpiry, setRcExpiry] = useState('')
  const [insuranceExpiry, setInsuranceExpiry] = useState('')
  const [status, setStatus] = useState<VehicleStatus>('Available')

  // Driver Assignment Modal State
  const [assignModalVehicle, setAssignModalVehicle] = useState<FleetVehicle | null>(null)
  const [newDriverName, setNewDriverName] = useState('')
  const [newDriverPhone, setNewDriverPhone] = useState('')

  const filteredVehicles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return vehicles.filter((v) => {
      const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter
      const matchesQuery =
        !q ||
        v.registrationNumber.toLowerCase().includes(q) ||
        v.vehicleType.toLowerCase().includes(q) ||
        v.assignedDriver.toLowerCase().includes(q)
      return matchesStatus && matchesQuery
    })
  }, [vehicles, searchQuery, statusFilter])

  const counts = useMemo(() => {
    return {
      total: vehicles.length,
      available: vehicles.filter((v) => v.status === 'Available').length,
      onTrip: vehicles.filter((v) => v.status === 'On Trip').length,
      maintenance: vehicles.filter((v) => v.status === 'Maintenance').length,
    }
  }, [vehicles])

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault()
    if (!regNumber.trim() || !capacityTons) return

    const updated = addFleetVehicle({
      registrationNumber: regNumber.trim().toUpperCase(),
      vehicleType,
      capacityTons: Number(capacityTons),
      assignedDriver: assignedDriver.trim() || 'Not Assigned',
      driverPhone: driverPhone.trim() || undefined,
      rcExpiry: rcExpiry || '2028-12-31',
      insuranceExpiry: insuranceExpiry || '2027-06-30',
      status,
    })

    setVehicles(updated)
    setRegNumber('')
    setVehicleType('32 FT Container')
    setCapacityTons('')
    setAssignedDriver('')
    setDriverPhone('')
    setRcExpiry('')
    setInsuranceExpiry('')
    setStatus('Available')
    setShowAddModal(false)
  }

  const handleStatusChange = (id: string, nextStatus: VehicleStatus) => {
    setVehicles(updateVehicleStatus(id, nextStatus))
  }

  const handleAssignDriverSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!assignModalVehicle) return
    setVehicles(
      assignDriverToVehicle(
        assignModalVehicle.id,
        newDriverName.trim(),
        newDriverPhone.trim()
      )
    )
    setAssignModalVehicle(null)
    setNewDriverName('')
    setNewDriverPhone('')
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to remove this vehicle from your fleet?')) {
      setVehicles(deleteFleetVehicle(id))
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Vehicle & Fleet Management</h2>
          <p className="mt-1 text-xs text-slate-500">
            Register trucks, monitor availability, track document expiries and assign drivers.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700"
        >
          <Plus size={18} /> Add New Vehicle
        </button>
      </div>

      {/* Fleet Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="Total Fleet" value={counts.total} icon={Truck} color="bg-blue-50 text-blue-600" />
        <SummaryCard title="Available" value={counts.available} icon={CheckCircle2} color="bg-emerald-50 text-emerald-600" />
        <SummaryCard title="On Active Trip" value={counts.onTrip} icon={Navigation} color="bg-amber-50 text-amber-600" />
        <SummaryCard title="In Maintenance" value={counts.maintenance} icon={Wrench} color="bg-red-50 text-red-600" />
      </div>

      {/* Search & Status Filter */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search size={17} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by vehicle number, truck type or driver..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'ALL' | VehicleStatus)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-500"
        >
          <option value="ALL">All Statuses</option>
          <option value="Available">Available</option>
          <option value="On Trip">On Trip</option>
          <option value="Maintenance">Maintenance</option>
        </select>
      </div>

      {/* Vehicle Cards Grid */}
      {filteredVehicles.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Truck size={40} className="mx-auto text-slate-300" />
          <h4 className="mt-3 font-bold text-slate-800">No vehicles found</h4>
          <p className="mt-1 text-xs text-slate-500">
            Add a vehicle to start managing your fleet operations.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredVehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Truck size={22} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{vehicle.registrationNumber}</h3>
                      <p className="text-xs text-slate-500">{vehicle.vehicleType}</p>
                    </div>
                  </div>
                  <StatusPill status={vehicle.status} />
                </div>

                <div className="mt-5 space-y-2.5 border-t border-slate-100 pt-4 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payload Capacity</span>
                    <span className="font-bold text-slate-800">{vehicle.capacityTons} Tons</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Assigned Driver</span>
                    <span className="font-semibold text-slate-800">{vehicle.assignedDriver}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1 text-slate-500">
                      <ShieldCheck size={13} className="text-emerald-600" /> Insurance Valid Till
                    </span>
                    <span className="font-medium text-slate-700">{vehicle.insuranceExpiry}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1 text-slate-500">
                      <Calendar size={13} className="text-blue-600" /> RC Fitness Till
                    </span>
                    <span className="font-medium text-slate-700">{vehicle.rcExpiry}</span>
                  </div>
                </div>
              </div>

              {/* Card Actions */}
              <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                <select
                  value={vehicle.status}
                  onChange={(e) => handleStatusChange(vehicle.id, e.target.value as VehicleStatus)}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500"
                >
                  <option value="Available">Available</option>
                  <option value="On Trip">On Trip</option>
                  <option value="Maintenance">Maintenance</option>
                </select>

                <button
                  onClick={() => {
                    setAssignModalVehicle(vehicle)
                    setNewDriverName(vehicle.assignedDriver === 'Not Assigned' ? '' : vehicle.assignedDriver)
                    setNewDriverPhone(vehicle.driverPhone || '')
                  }}
                  className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                  title="Assign Driver"
                >
                  <UserCheck size={14} /> Driver
                </button>

                <button
                  onClick={() => handleDelete(vehicle.id)}
                  className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  title="Delete Vehicle"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Vehicle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Register New Fleet Vehicle</h3>
              <button onClick={() => setShowAddModal(false)} className="rounded-lg p-1.5 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddVehicle} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-700">Registration Number *</span>
                  <input
                    required
                    value={regNumber}
                    onChange={(e) => setRegNumber(e.target.value)}
                    placeholder="e.g. TS 09 UB 4567"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm uppercase outline-none focus:border-blue-500"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-700">Vehicle Body Type *</span>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-500"
                  >
                    <option>32 FT Container</option>
                    <option>32 FT Multi-Axle</option>
                    <option>20 FT Container</option>
                    <option>14 FT Truck</option>
                    <option>Open Trailer (40 FT)</option>
                    <option>Tata Ace / Pickup</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-700">Capacity (Tons) *</span>
                  <input
                    required
                    type="number"
                    step="0.5"
                    value={capacityTons}
                    onChange={(e) => setCapacityTons(e.target.value)}
                    placeholder="e.g. 15"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-700">Initial Status</span>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as VehicleStatus)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="Available">Available</option>
                    <option value="On Trip">On Trip</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-700">Assigned Driver Name</span>
                  <input
                    value={assignedDriver}
                    onChange={(e) => setAssignedDriver(e.target.value)}
                    placeholder="Optional"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-700">Driver Mobile</span>
                  <input
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    placeholder="Optional"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-700">RC Expiry Date</span>
                  <input
                    type="date"
                    value={rcExpiry}
                    onChange={(e) => setRcExpiry(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-700">Insurance Expiry Date</span>
                  <input
                    type="date"
                    value={insuranceExpiry}
                    onChange={(e) => setInsuranceExpiry(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Driver Modal */}
      {assignModalVehicle && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900">Assign Driver</h3>
                <p className="text-xs text-slate-500">{assignModalVehicle.registrationNumber}</p>
              </div>
              <button onClick={() => setAssignModalVehicle(null)} className="rounded-lg p-1.5 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignDriverSubmit} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-700">Driver Full Name</span>
                <input
                  value={newDriverName}
                  onChange={(e) => setNewDriverName(e.target.value)}
                  placeholder="Enter driver name (leave blank to unassign)"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-700">Driver Mobile Number</span>
                <input
                  value={newDriverPhone}
                  onChange={(e) => setNewDriverPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignModalVehicle(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Update Driver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string
  value: number
  icon: typeof Truck
  color: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`inline-flex rounded-xl p-3 ${color}`}>
        <Icon size={20} />
      </div>
      <p className="mt-4 text-xs font-medium text-slate-500">{title}</p>
      <h3 className="mt-1 text-2xl font-bold text-slate-900">{value}</h3>
    </div>
  )
}

function StatusPill({ status }: { status: VehicleStatus }) {
  const styles: Record<VehicleStatus, string> = {
    Available: 'bg-emerald-50 text-emerald-700',
    'On Trip': 'bg-blue-50 text-blue-700',
    Maintenance: 'bg-red-50 text-red-700',
  }
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${styles[status]}`}>
      {status}
    </span>
  )
}
