import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { useEffect, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import type { DecisionWithContext } from '../App'
import { userLocationIcon } from '../mapIcons'
import AIChatButton from './AIChatButton'
import AIChatInterface from './AIChatInterface'

// Fix for default marker icon in React-Leaflet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

interface MapProps {
  userLocation?: [number, number]
  zoom?: number
  decisions?: DecisionWithContext[]
  onMarkerClick?: (decision: DecisionWithContext) => void
  onSelectDecision?: (decision: DecisionWithContext) => void
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
        maxZoom: 10
      })
    }
  }, [decisions, userLocation, map])

  return null
}

export default function Map({ 
  userLocation = [49.2827, -123.1207], 
  zoom = 13,
  decisions = [],
  onMarkerClick,
  onSelectDecision
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
      <MapContainer
        center={userLocation}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        
        {/* Component to handle automatic bounds adjustment */}
        <MapBoundsHandler userLocation={userLocation} decisions={decisions} />
        
        {/* User location marker at center */}
        <Marker position={userLocation} icon={userLocationIcon} />

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
        />
      ) : (
        <AIChatButton onClick={() => setIsChatOpen(true)} />
      )}
    </div>
  )
}
