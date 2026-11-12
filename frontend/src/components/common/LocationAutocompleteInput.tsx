import { useState, useRef, useEffect } from 'react'
import { MapPin, Search, Loader2 } from 'lucide-react'

const POPULAR_HUBS = [
  'Hyderabad, Telangana',
  'Visakhapatnam, Andhra Pradesh',
  'Vijayawada, Andhra Pradesh',
  'Warangal, Telangana',
  'Guntur, Andhra Pradesh',
  'Bengaluru, Karnataka',
  'Chennai, Tamil Nadu',
  'Mumbai, Maharashtra',
  'Pune, Maharashtra',
  'Delhi NCR, New Delhi',
  'Haryana, India',
]

interface NominatimResult {
  place_id: number
  display_name: string
  namedetails?: {
    'name:en'?: string
    name?: string
  }
  address?: {
    village?: string
    hamlet?: string
    suburb?: string
    town?: string
    city?: string
    county?: string
    state_district?: string
    state?: string
  }
}

interface LocationAutocompleteInputProps {
  label?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  className?: string
}

function cleanEnglishText(text: string): string {
  return text
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^[,.\s-]+|[,.\s-]+$/g, '')
    .trim()
}

export default function LocationAutocompleteInput({
  label,
  value,
  onChange,
  placeholder = 'Type any village, town, city or state...',
  required = false,
  className = '',
}: LocationAutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [remoteSuggestions, setRemoteSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const query = value.trim()
    if (query.length < 2) return

    const controller = new AbortController()
    const debounceTimer = setTimeout(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          q: query,
          format: 'jsonv2',
          addressdetails: '1',
          namedetails: '1',
          countrycodes: 'in',
          'accept-language': 'en',
          limit: '10',
        })

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?${params.toString()}`,
          {
            signal: controller.signal,
            headers: {
              Accept: 'application/json',
              'Accept-Language': 'en-US,en;q=0.9',
            },
          }
        )

        if (!response.ok) throw new Error('Location search failed')

        const data: NominatimResult[] = await response.json()

        const formattedPlaces = data
          .map((item) => {
            const addr = item.address || {}
            const rawLocality =
              item.namedetails?.['name:en'] ||
              addr.village ||
              addr.hamlet ||
              addr.town ||
              addr.city ||
              addr.suburb ||
              item.display_name.split(',')[0]

            const locality = cleanEnglishText(rawLocality || '')
            const district = cleanEnglishText(addr.state_district || addr.county || '')
            const state = cleanEnglishText(addr.state || '')

            const parts = [locality, district, state].filter(
              (part, idx, arr) => Boolean(part) && arr.indexOf(part) === idx
            )

            if (parts.length >= 2) return parts.join(', ')
            return cleanEnglishText(item.display_name)
          })
          .filter((place) => place.length > 2)

        setRemoteSuggestions(Array.from(new Set(formattedPlaces)))
      } catch (err: unknown) {
        if (!(err instanceof DOMException && err.name === 'AbortError')) {
          const fallback = POPULAR_HUBS.filter((hub) =>
            hub.toLowerCase().includes(query.toLowerCase())
          )
          setRemoteSuggestions(fallback)
        }
      } finally {
        setLoading(false)
      }
    }, 350)

    return () => {
      clearTimeout(debounceTimer)
      controller.abort()
    }
  }, [value])

  const trimmed = value.trim()
  const suggestions =
    trimmed.length === 0
      ? POPULAR_HUBS.slice(0, 7)
      : trimmed.length < 2
        ? POPULAR_HUBS.filter((hub) =>
            hub.toLowerCase().startsWith(trimmed.toLowerCase())
          )
        : remoteSuggestions

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-slate-700">
          {label} {required && '*'}
        </span>
      )}

      <div className="relative">
        <MapPin
          size={16}
          className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400"
        />
        <input
          type="text"
          required={required}
          value={value}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            onChange(e.target.value)
            setIsOpen(true)
          }}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
        {loading && trimmed.length >= 2 && (
          <Loader2
            size={16}
            className="animate-spin absolute right-3.5 top-3.5 text-blue-600"
          />
        )}
      </div>

      {isOpen && (suggestions.length > 0 || (loading && trimmed.length >= 2)) && (
        <ul className="absolute z-50 mt-1.5 max-h-64 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white py-1.5 shadow-xl">
          {loading && suggestions.length === 0 ? (
            <li className="px-4 py-3 text-xs text-slate-500">
              Searching villages & towns across India...
            </li>
          ) : (
            suggestions.map((location) => (
              <li key={location}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(location)
                    setIsOpen(false)
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                >
                  <Search size={13} className="shrink-0 text-slate-400" />
                  <span className="truncate font-medium">{location}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}