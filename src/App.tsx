import Map from './Map'
import './App.css'

function App() {
  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      <Map center={[49.2827, -123.1207]} zoom={13} />
    </div>
  )
}

export default App
