import { useState } from 'react'
import { IoMdNavigate } from 'react-icons/io'
import AddressSearch from '../AddressSearch'

export default function Splash({setUserLocation}: {setUserLocation: (location: [number, number]) => void}) {
  const [error, setError] = useState<string | null>(null)

  const handleLocationSelect = (location: [number, number]) => {
    setUserLocation(location)
    setError(null)
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
  }

  return (
    <div
      className="relative h-screen w-screen overflow-hidden bg-center bg-cover bg-no-repeat"
      style={{ backgroundImage: "url('/background.png')" }}
    >
      <div className="relative z-10 h-full w-full flex items-center justify-center gap-8 lg:gap-16 px-8 py-8">
        {/* Left side - Panel */}
        <div className="shrink-0 max-w-xl w-full">
          <div className="bg-white/80 backdrop-blur-sm p-10 rounded-2xl shadow-2xl border border-white/20">
          {/* Header section */}
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-gray-900 mb-4 leading-tight">
              Welcome to
              <br />
              <span className="text-blue-400 font-medium italic font-serif" style={{ fontFamily: 'Georgia, serif' }}>
                Town Square
              </span>
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Discover civic decisions and community developments in your neighborhood. 
              Stay informed about what's happening around you.
            </p>
          </div>
          
          {/* Search section */}
          <div className="space-y-4">
            <AddressSearch 
              onLocationSelect={handleLocationSelect}
              onError={handleError}
            />

            {error && (
              <div className="p-4 bg-red-50/80 border border-red-200 rounded-xl backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3 py-2">
              <div className="flex-1 h-px bg-linear-to-r from-transparent via-gray-300 to-transparent"></div>
              <span className="text-xs text-gray-500 font-medium">OR</span>
              <div className="flex-1 h-px bg-linear-to-r from-transparent via-gray-300 to-transparent"></div>
            </div>

            {/* Quick action button */}
            <button
              onClick={() => setUserLocation([49.2827, -123.1207])}
              className="w-full py-3 px-4 bg-linear-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-700 rounded-xl border border-gray-200 transition-all duration-200 flex items-center justify-center gap-2 group shadow-sm hover:shadow-md"
            >
              <IoMdNavigate className="text-lg group-hover:rotate-45 transition-transform duration-300" />
              <span className="font-medium">Skip and explore Vancouver, BC</span>
            </button>
          </div>

          {/* Footer hint */}
          <p className="mt-6 text-xs text-gray-500 text-center">
            Your address is used only to show relevant local civic information
          </p>
        </div>
      </div>

      {/* Right side - Large logo */}
      <div className="hidden lg:flex shrink-0 items-center justify-center">
        <img 
          src="/logo.png" 
          alt="Town Square Logo" 
          className="max-w-2xl w-full h-auto object-contain drop-shadow-2xl"
        />
      </div>
    </div>
    </div>
  )
}
