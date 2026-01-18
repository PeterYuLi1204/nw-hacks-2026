import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { useEffect, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import type { DecisionWithContext } from '../../App'
import { userLocationIcon } from '../../mapIcons'
import { AIChatButton, AIChatInterface } from '../Chat'
import { IoNavigate } from 'react-icons/io5'

// Fix for default marker icon in React-Leaflet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

interface DateRangeContext {
  startDate: string | null
  endDate: string | null
}

interface MapProps {
  userLocation?: [number, number]
  zoom?: number
  decisions?: DecisionWithContext[]
  onMarkerClick?: (decision: DecisionWithContext) => void
  onSelectDecision?: (decision: DecisionWithContext) => void
  currentDateRange?: DateRangeContext
  onTriggerSearch?: (startDate: string, endDate: string) => void
  isSearching?: boolean
}

// Component to handle automatic bounds adjustment
function MapBoundsHandler({ 
  userLocation, 
  decisions 
}: { 
  userLocation: [number, number], 
  decisions: DecisionWithContext[] 
}) {
  const map = useMap()

  useEffect(() => {
    // Filter decisions that have valid locations
    const decisionsWithLocations = decisions.filter(
      (d): d is DecisionWithContext & { location: [number, number] } => 
        d.location !== null && Array.isArray(d.location) && d.location.length === 2
    )

    // If we have decisions with locations, adjust bounds to fit all points
    if (decisionsWithLocations.length > 0) {
      const bounds = L.latLngBounds([userLocation])
      
      // Add all decision locations to bounds
      decisionsWithLocations.forEach(decision => {
        bounds.extend(decision.location)
      })

      // Fit the map to show all markers with some padding
      map.fitBounds(bounds, { 
        padding: [0, 0],
        maxZoom: 14
      })
    }
  }, [decisions, userLocation, map])

  return null
}

// Component to add custom map controls
function MapControls({ userLocation }: { userLocation: [number, number] }) {
  const map = useMap()

  useEffect(() => {
    // Add zoom control to bottom left
    const zoomControl = L.control.zoom({ position: 'bottomleft' }).addTo(map)

    // Cleanup function to remove the control when component unmounts
    return () => {
      map.removeControl(zoomControl)
    }
  }, [map])

  const flyToUserLocation = () => {
    map.flyTo(userLocation, 15, {
      duration: 1.5
    })
  }

  return (
    <div className="leaflet-bottom leaflet-left" style={{ marginBottom: '80px', marginLeft: '10px' }}>
      <div className="leaflet-control leaflet-bar !m-0">
        <button
          onClick={flyToUserLocation}
          className="bg-white hover:bg-gray-50 w-[30px] h-[30px] flex items-center justify-center border-0 cursor-pointer text-gray-700 hover:text-blue-600 transition-colors"
          style={{
            fontSize: '18px',
            lineHeight: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Fly to your location"
        >
          <IoNavigate />
        </button>
      </div>
    </div>
  )
}

export default function Map({ 
  userLocation = [49.2827, -123.1207], 
  zoom = 13,
  decisions = [],
  onMarkerClick,
  onSelectDecision,
  currentDateRange,
  onTriggerSearch,
  isSearching = false
}: MapProps) {
  const [isChatOpen, setIsChatOpen] = useState(false)

  // Filter decisions that have valid locations
  const decisionsWithLocations = decisions.filter(
    (d): d is DecisionWithContext & { location: [number, number] } => 
      d.location !== null && Array.isArray(d.location) && d.location.length === 2
  )

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No date';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const handleSelectDecision = (decision: DecisionWithContext) => {
    if (onSelectDecision) {
      onSelectDecision(decision)
    }
  }

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      {/* Logo and App Name - Top Left */}
      <div className="absolute top-5 left-4 z-[1000] flex items-center gap-2">
        <img 
          src="/logo.png" 
          alt="Town Square Logo" 
          className="h-10 w-auto object-contain"
        />
        <div className="text-xl font-medium text-gray-800 leading-tight">
          <span className="text-blue-400 italic underline underline-offset-4 decoration-dashed decoration-2" style={{ fontFamily: 'Georgia, serif' }}>
            Town Square
          </span>
        </div>
      </div>

      <MapContainer
        center={userLocation}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        
        {/* Component to handle automatic bounds adjustment */}
        <MapBoundsHandler userLocation={userLocation} decisions={decisions} />
        
        {/* Custom map controls */}
        <MapControls userLocation={userLocation} />
        
        {/* User location marker at center */}
        <Marker position={userLocation} icon={userLocationIcon} interactive={false} />

        {decisionsWithLocations.map((decision) => (
          <Marker 
            key={decision.decisionId} 
            position={decision.location}
            eventHandlers={{
              click: () => {
                if (onMarkerClick) {
                  onMarkerClick(decision)
                }
              }
            }}
          >
            <Popup>
              <div className="max-w-[250px]">
                <h3 className="font-semibold text-sm mb-1">{decision.title}</h3>
                <p className="text-xs text-gray-500 mb-2">
                  {decision.meetingType} • {formatDate(decision.meetingDate)}
                </p>
                <p className="text-xs text-gray-600 line-clamp-3">{decision.summary}</p>
                <button
                  onClick={() => onMarkerClick && onMarkerClick(decision)}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  View details →
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* AI Chat Overlay */}
      {isChatOpen ? (
        <AIChatInterface
          onClose={() => setIsChatOpen(false)}
          decisions={decisions}
          onSelectDecision={handleSelectDecision}
          currentDateRange={currentDateRange}
          onTriggerSearch={onTriggerSearch}
          isSearching={isSearching}
        />
      ) : (
        <AIChatButton onClick={() => setIsChatOpen(true)} />
      )}
    </div>
  )
}
