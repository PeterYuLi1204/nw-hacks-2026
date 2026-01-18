import { useState, useEffect, useRef } from 'react'
import { MdMyLocation, MdLocationOn } from 'react-icons/md'
import { IoMdSearch } from 'react-icons/io'

// Photon API response types
interface PhotonProperties {
  name?: string
  street?: string
  housenumber?: string
  city?: string
  state?: string
  country?: string
  postcode?: string
  countrycode?: string
  osm_key?: string
  osm_value?: string
  osm_type?: string
}

interface PhotonFeature {
  type: 'Feature'
  geometry: {
    type: 'Point'
    coordinates: [number, number] // [longitude, latitude]
  }
  properties: PhotonProperties
}

interface PhotonResponse {
  type: 'FeatureCollection'
  features: PhotonFeature[]
}

interface AddressSearchProps {
  onLocationSelect: (location: [number, number]) => void
  onError?: (error: string) => void
}

export default function AddressSearch({ onLocationSelect, onError }: AddressSearchProps) {
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [isLoadingSearch, setIsLoadingSearch] = useState(false)
  const [address, setAddress] = useState('')
  const [suggestions, setSuggestions] = useState<PhotonFeature[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Debounced search with Photon API
  useEffect(() => {
    if (address.trim().length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      setIsLoadingSearch(false)
      return
    }

    setIsLoadingSearch(true)

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://photon.komoot.io/api?q=${encodeURIComponent(address)}&limit=5`
        )
        const data: PhotonResponse = await response.json()
        setSuggestions(data.features || [])
        setShowSuggestions(true)
        setIsLoadingSearch(false)
      } catch {
        setSuggestions([])
        setIsLoadingSearch(false)
      }
    }, 300) // Photon can handle faster debouncing than Nominatim

    return () => {
      clearTimeout(timer)
      setIsLoadingSearch(false)
    }
  }, [address])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const formatSuggestionPrimary = (feature: PhotonFeature): string => {
    const props = feature.properties
    const parts: string[] = []

    // Build street address
    if (props.housenumber && props.street) {
      parts.push(`${props.housenumber} ${props.street}`)
    } else if (props.street) {
      parts.push(props.street)
    } else if (props.name) {
      parts.push(props.name)
    }

    // Add city
    if (props.city) {
      parts.push(props.city)
    }

    return parts.join(', ') || 'Unknown location'
  }

  const formatSuggestionSecondary = (feature: PhotonFeature): string => {
    const props = feature.properties
    const parts: string[] = []

    // For secondary, show state and country
    if (props.state) {
      parts.push(props.state)
    }
    if (props.country) {
      parts.push(props.country)
    }

    return parts.join(', ')
  }

  const selectSuggestion = (feature: PhotonFeature) => {
    // Photon returns [longitude, latitude] so we need to swap
    const [lon, lat] = feature.geometry.coordinates
    const location: [number, number] = [lat, lon]
    onLocationSelect(location)
    setShowSuggestions(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        selectSuggestion(suggestions[selectedIndex])
        setAddress(formatSuggestionPrimary(suggestions[selectedIndex]))
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setSelectedIndex(-1)
    }
  }

  const requestLocation = () => {
    if (!navigator.geolocation) {
      onError?.('Geolocation is not supported by your browser')
      return
    }

    setIsLoadingLocation(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: [number, number] = [
          position.coords.latitude,
          position.coords.longitude
        ]
        onLocationSelect(location)
        setIsLoadingLocation(false)
      },
      (error) => {
        setIsLoadingLocation(false)
        switch (error.code) {
          case error.PERMISSION_DENIED:
            onError?.('Location access denied. Please enable location permissions.')
            break
          case error.POSITION_UNAVAILABLE:
            onError?.('Location information unavailable.')
            break
          case error.TIMEOUT:
            onError?.('Location request timed out.')
            break
          default:
            onError?.('An unknown error occurred.')
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  return (
    <div className="space-y-3">
      {/* Search Input with Location Button */}
      <div className="relative">
        <IoMdSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl pointer-events-none z-10" />
        <input
          ref={inputRef}
          type="text"
          value={address}
          onChange={(e) => {
            setAddress(e.target.value)
            setSelectedIndex(-1)
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true)
            }
          }}
          placeholder="Enter your address..."
          className="w-full pl-12 pr-14 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-base shadow-sm hover:border-gray-300 transition-all duration-200 bg-white"
        />
        
        {/* Location Button */}
        <button
          onClick={requestLocation}
          disabled={isLoadingLocation}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-blue-100 hover:bg-blue-200 disabled:bg-gray-200 text-blue-600 disabled:text-gray-400 rounded-lg transition-all duration-200 group"
          title="Use my current location"
        >
          {isLoadingLocation ? (
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <MdMyLocation className="text-xl group-hover:scale-110 transition-transform duration-200" />
          )}
        </button>

        {/* Autocomplete Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-2xl max-h-80 overflow-y-auto"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => {
                  selectSuggestion(suggestion)
                  setAddress(formatSuggestionPrimary(suggestion))
                }}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full px-4 py-3.5 text-left flex items-start gap-3 border-b border-gray-100 last:border-b-0 transition-all duration-150 ${
                  selectedIndex === index 
                    ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                    : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                }`}
              >
                <MdLocationOn className={`text-xl mt-0.5 shrink-0 transition-colors ${
                  selectedIndex === index ? 'text-blue-500' : 'text-gray-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium truncate transition-colors ${
                    selectedIndex === index ? 'text-blue-900' : 'text-gray-900'
                  }`}>
                    {formatSuggestionPrimary(suggestion)}
                  </div>
                  {formatSuggestionSecondary(suggestion) && (
                    <div className="text-xs text-gray-500 truncate mt-0.5">
                      {formatSuggestionSecondary(suggestion)}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Empty State */}
        {showSuggestions && !isLoadingSearch && suggestions.length === 0 && address.trim().length >= 3 && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg p-4"
          >
            <p className="text-sm text-gray-500 text-center">No locations found. Try a different search.</p>
          </div>
        )}
      </div>
    </div>
  )
}
