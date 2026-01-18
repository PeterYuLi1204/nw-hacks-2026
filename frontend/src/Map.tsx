import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default marker icon in React-Leaflet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

interface Location {
  id: string
  name: string
  position: [number, number]
  description?: string
}

interface MapProps {
  center?: [number, number]
  zoom?: number
  markers?: Location[]
}

export default function Map({ 
  center = [49.2827, -123.1207], 
  zoom = 13,
  markers = [
    { id: '1', name: 'Vancouver', position: [49.2827, -123.1207], description: 'Downtown Vancouver' },
    { id: '2', name: 'Stanley Park', position: [49.3017, -123.1417], description: 'Beautiful park' },
    { id: '3', name: 'UBC', position: [49.2606, -123.2460], description: 'University of British Columbia' },
  ]
}: MapProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />

      {markers.map((marker) => (
        <Marker key={marker.id} position={marker.position} />
      ))}
    </MapContainer>
  )
}
