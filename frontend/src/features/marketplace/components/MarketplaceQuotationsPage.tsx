import { useState, useMemo, useEffect } from 'react'
import {
  Package,
  Search,
  MapPin,
  Truck,
  IndianRupee,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  X,
  Navigation,
} from 'lucide-react'
import { getMarketplaceLoads } from '../../../utils/loadStorage'
import type { LoadQuotation, QuotationStatus } from '../../../utils/quotationStorage'
import { apiClient, getAuthToken } from '../../../services/apiClient'
import {
  getStoredQuotations,
  submitLoadQuotation,
  updateQuotationDecision,
} from '../../../utils/quotationStorage'

interface MarketplaceLoadItem {
  id: string
  from: string
  to: string
  stops?: string[]
  material: string
  vehicle: string
  weight: string
  budget: string
  status: string
}

const fallbackMarketplaceLoads: MarketplaceLoadItem[] = [
  {
    id: 'LD1001',
    from: 'Hyderabad',
    to: 'Bangalore',
    stops: ['Kurnool', 'Anantapur'],
    material: 'Electronics',
    vehicle: '32 FT Container',
    weight: '8 Ton',
    budget: 'Ã¢â€šÂ¹28,000',
    status: 'Open',
  },
  {
    id: 'LD1005',
    from: 'Guntur',
    to: 'Mumbai',
    stops: ['Hyderabad', 'Solapur', 'Pune'],
    material: 'Spices & Agro',
    vehicle: '32 FT Multi-Axle',
    weight: '16 Ton',
    budget: 'Ã¢â€šÂ¹52,000',
    status: 'Open',
  },
]

export default function MarketplaceQuotationsPage() {
  const [activeTab, setActiveTab] = useState<'MARKETPLACE' | 'QUOTATIONS'>('MARKETPLACE')
  const [searchQuery, setSearchQuery] = useState('')
    const [quotations, setQuotations] = useState<LoadQuotation[]>(() => (getAuthToken() ? [] : getStoredQuotations()))

  useEffect(() => {
    if (!getAuthToken()) return
    apiClient
      .getMyQuotations()
      .then((list) => {
        if (Array.isArray(list)) {
          setQuotations(
            list.map((q: any) => ({
              id: String(q.id),
              loadId: String(q.loadId),
              from: q.from,
              to: q.to,
              vehicleType: q.vehicleType || 'Truck',
              truckOwner: q.truckOwner || 'Transporter',
              truckNumber: q.truckNumber || '',
              amount: Number(q.amount || 0),
              etaDays: q.etaDays || '2 Days',
              notes: q.notes || '',
              status: q.status || 'PENDING',
              submittedAt: q.submittedAt || new Date().toISOString(),
            })),
          )
        }
      })
      .catch(() => {})
  }, [])

  // Submit Quote Modal State
  const [quoteModalLoad, setQuoteModalLoad] = useState<MarketplaceLoadItem | null>(null)
  const [truckOwnerName, setTruckOwnerName] = useState('Sai Transport Agency')
  const [truckNumber, setTruckNumber] = useState('TS 09 AB 1234')
  const [quoteAmount, setQuoteAmount] = useState('')
  const [etaDays, setEtaDays] = useState('2 Days')
  const [notes, setNotes] = useState('')

  const marketplaceLoads = useMemo<MarketplaceLoadItem[]>(() => {
    const stored = getMarketplaceLoads()
    if (!stored || stored.length === 0) return fallbackMarketplaceLoads
    return stored.map((item: any) => ({
      id: item.id,
      from: item.from,
      to: item.to,
      stops: item.stops || [],
      material: item.material || 'General Cargo',
      vehicle: item.vehicle || 'Truck',
      weight: String(item.weight || '10 Ton'),
      budget: String(item.budget || 'Negotiable'),
      status: item.status || 'Open',
    }))
  }, [])

  const filteredLoads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return marketplaceLoads.filter((load) => {
      if (!q) return true
      const stopsStr = (load.stops || []).join(' ')
      return `${load.id} ${load.from} ${load.to} ${stopsStr} ${load.material} ${load.vehicle}`
        .toLowerCase()
        .includes(q)
    })
  }, [marketplaceLoads, searchQuery])

  const filteredQuotations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return quotations.filter((qt) => {
      if (!q) return true
      return `${qt.id} ${qt.loadId} ${qt.from} ${qt.to} ${qt.truckOwner} ${qt.truckNumber}`
        .toLowerCase()
        .includes(q)
    })
  }, [quotations, searchQuery])

  const handleOpenQuoteModal = (load: MarketplaceLoadItem) => {
    setQuoteModalLoad(load)
    const numericBudget = load.budget.replace(/[^0-9]/g, '')
    setQuoteAmount(numericBudget || '')
    setNotes('')
  }

  const handleQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!quoteModalLoad || !quoteAmount) return

    const updated = submitLoadQuotation({
      loadId: quoteModalLoad.id,
      from: quoteModalLoad.from,
      to: quoteModalLoad.to,
      vehicleType: quoteModalLoad.vehicle,
      truckOwner: truckOwnerName.trim() || 'Fleet Partner',
      truckNumber: truckNumber.trim().toUpperCase() || 'TS 09 AB 1234',
      amount: Number(quoteAmount),
      etaDays,
      notes: notes.trim() || undefined,
    })

    setQuotations(updated)
    setQuoteModalLoad(null)
    setActiveTab('QUOTATIONS')
  }

  const handleDecision = (quotationId: string, status: QuotationStatus) => {
    setQuotations(updateQuotationDecision(quotationId, status))
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      {/* Header & Mode Switch */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Load Marketplace & Quotations</h2>
          <p className="mt-1 text-xs text-slate-500">
            Browse live customer loads, submit competitive freight quotes, and manage approvals.
          </p>
        </div>

        <div className="flex rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
          <button
            onClick={() => setActiveTab('MARKETPLACE')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'MARKETPLACE'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package size={15} /> Available Loads ({marketplaceLoads.length})
          </button>
          <button
            onClick={() => setActiveTab('QUOTATIONS')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'QUOTATIONS'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText size={15} /> Quotations ({quotations.length})
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="relative max-w-xl">
          <Search size={17} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'MARKETPLACE'
                ? 'Search loads by city, stop, material or vehicle...'
                : 'Search quotations by quote ID, load ID, route or owner...'
            }
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>
      </div>

      {/* TAB 1: MARKETPLACE LOADS */}
      {activeTab === 'MARKETPLACE' && (
        <div className="grid gap-5 md:grid-cols-2">
          {filteredLoads.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <Package size={38} className="mx-auto text-slate-300" />
              <h4 className="mt-3 font-bold text-slate-800">No loads found</h4>
              <p className="mt-1 text-xs text-slate-500">Try clearing your search filter.</p>
            </div>
          ) : (
            filteredLoads.map((load) => (
              <div
                key={load.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                      {load.id}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                      {load.status}
                    </span>
                  </div>

                  {/* Route & Stops */}
                  <div className="mt-4">
                    <div className="flex items-center gap-2 text-base font-bold text-slate-900">
                      <MapPin size={16} className="shrink-0 text-blue-600" />
                      <span>{load.from}</span>
                      <span className="text-slate-400">Ã¢â€ â€™</span>
                      <span>{load.to}</span>
                    </div>
                    {load.stops && load.stops.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap items-center gap-1 text-xs text-slate-500">
                        <Navigation size={12} className="text-slate-400" />
                        <span>Via: {load.stops.join(' Ã‚Â· ')}</span>
                      </div>
                    )}
                  </div>

                  {/* Specs */}
                  <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-xs">
                    <div>
                      <p className="text-slate-400">Material</p>
                      <p className="mt-0.5 truncate font-semibold text-slate-800">{load.material}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Vehicle</p>
                      <p className="mt-0.5 truncate font-semibold text-slate-800">{load.vehicle}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Weight</p>
                      <p className="mt-0.5 font-semibold text-slate-800">{load.weight}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <div>
                    <p className="text-[11px] text-slate-400">Expected Freight</p>
                    <p className="text-lg font-extrabold text-slate-900">{load.budget}</p>
                  </div>
                  <button
                    onClick={() => handleOpenQuoteModal(load)}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700"
                  >
                    <Send size={14} /> Submit Quote
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: QUOTATIONS LIST */}
      {activeTab === 'QUOTATIONS' && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {filteredQuotations.length === 0 ? (
            <div className="p-12 text-center">
              <FileText size={38} className="mx-auto text-slate-300" />
              <h4 className="mt-3 font-bold text-slate-800">No quotations submitted yet</h4>
              <p className="mt-1 text-xs text-slate-500">
                Switch to Available Loads and submit a quote to see it here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredQuotations.map((qt) => (
                <div
                  key={qt.id}
                  className="flex flex-col justify-between gap-4 p-5 hover:bg-slate-50/60 md:flex-row md:items-center"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-blue-600">{qt.id}</span>
                      <span className="text-xs text-slate-400">Ã‚Â· Load: {qt.loadId}</span>
                      <QuoteStatusBadge status={qt.status} />
                    </div>
                    <h4 className="text-base font-bold text-slate-900">
                      {qt.from} Ã¢â€ â€™ {qt.to}
                    </h4>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <Truck size={14} className="text-blue-600" /> {qt.truckOwner} ({qt.truckNumber})
                      </span>
                      <span>Ã‚Â·</span>
                      <span>{qt.vehicleType}</span>
                      <span>Ã‚Â·</span>
                      <span className="flex items-center gap-1">
                        <Clock size={13} /> ETA: {qt.etaDays}
                      </span>
                    </div>
                    {qt.notes && (
                      <p className="text-xs italic text-slate-500">"{qt.notes}"</p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <div className="text-left md:text-right">
                      <p className="text-[11px] text-slate-400">Quoted Price</p>
                      <p className="text-lg font-extrabold text-slate-900">
                        Ã¢â€šÂ¹{qt.amount.toLocaleString('en-IN')}
                      </p>
                    </div>

                    {qt.status === 'PENDING' ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDecision(qt.id, 'ACCEPTED')}
                          className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          <CheckCircle2 size={14} /> Accept
                        </button>
                        <button
                          onClick={() => handleDecision(qt.id, 'REJECTED')}
                          className="flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400">
                        {qt.status === 'ACCEPTED' ? 'Booking Confirmed' : 'Declined'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Submit Quotation Modal */}
      {quoteModalLoad && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900">Submit Freight Quotation</h3>
                <p className="text-xs text-slate-500">
                  {quoteModalLoad.id}: {quoteModalLoad.from} Ã¢â€ â€™ {quoteModalLoad.to}
                </p>
              </div>
              <button
                onClick={() => setQuoteModalLoad(null)}
                className="rounded-lg p-1.5 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleQuoteSubmit} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Your Transport / Fleet Name *
                </span>
                <input
                  required
                  value={truckOwnerName}
                  onChange={(e) => setTruckOwnerName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Vehicle Number *
                  </span>
                  <input
                    required
                    value={truckNumber}
                    onChange={(e) => setTruckNumber(e.target.value)}
                    placeholder="TS 09 AB 1234"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm uppercase outline-none focus:border-blue-500"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Estimated Transit Time
                  </span>
                  <select
                    value={etaDays}
                    onChange={(e) => setEtaDays(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-500"
                  >
                    <option>Same Day</option>
                    <option>1 Day</option>
                    <option>2 Days</option>
                    <option>3 Days</option>
                    <option>4+ Days</option>
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Your Offer Price (Ã¢â€šÂ¹) *
                </span>
                <div className="relative">
                  <IndianRupee size={15} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    required
                    type="number"
                    value={quoteAmount}
                    onChange={(e) => setQuoteAmount(e.target.value)}
                    placeholder="e.g. 26500"
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-4 text-sm font-bold outline-none focus:border-blue-500"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Notes / Terms (Optional)
                </span>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Immediate pickup available, GPS tracking included"
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-500"
                />
              </label>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setQuoteModalLoad(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Send Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function QuoteStatusBadge({ status }: { status: QuotationStatus }) {
  const styles: Record<QuotationStatus, string> = {
    PENDING: 'bg-amber-50 text-amber-700',
    ACCEPTED: 'bg-emerald-50 text-emerald-700',
    REJECTED: 'bg-red-50 text-red-700',
  }
  const labels: Record<QuotationStatus, string> = {
    PENDING: 'Pending Review',
    ACCEPTED: 'Accepted',
    REJECTED: 'Rejected',
  }
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}
