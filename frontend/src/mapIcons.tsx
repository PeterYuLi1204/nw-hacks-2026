import L from 'leaflet'
import { renderToStaticMarkup } from 'react-dom/server'
import { FaPerson, FaComments } from 'react-icons/fa6'

// Render icons to static markup with background circles
const personIconWithBackground = renderToStaticMarkup(
  <div style={{
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  }}>
    <div style={{
      width: '28px',
      height: '28px',
      borderRadius: '50%',
      backgroundColor: '#10B981',
      border: '1px solid white',
      boxShadow: '2px 2px 4px rgba(16, 185, 129, 0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <FaPerson 
        style={{ 
          width: '15px', 
          height: '15px', 
          color: 'white',
        }} 
      />
    </div>
  </div>
)

const commentsIconWithBackground = renderToStaticMarkup(
  <div style={{
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  }}>
    <div style={{
      width: '28px',
      height: '28px',
      borderRadius: '50%',
      backgroundColor: '#3B82F6',
      border: '1px solid white',
      boxShadow: '2px 2px 4px rgba(59, 130, 246, 0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <FaComments 
        style={{ 
          width: '15px', 
          height: '15px', 
          color: 'white',
        }} 
      />
    </div>
  </div>
)

// User location icon - Person silhouette to show "You are here"
export const userLocationIcon = new L.DivIcon({
  className: 'user-location-marker',
  html: personIconWithBackground,
  iconSize: [28, 28],
  iconAnchor: [14, 14]
})

// Decision marker icon - Two speech bubbles for community/neighborhood discussions
export const decisionMarkerIcon = new L.DivIcon({
  className: 'decision-marker',
  html: commentsIconWithBackground,
  iconSize: [28, 28],
  iconAnchor: [14, 14]
})
