import { useState } from 'react';
import { IoClose, IoStopOutline, IoOptionsOutline } from 'react-icons/io5';
import DistanceFilter from './DistanceFilter';

interface SidebarHeaderProps {
  decisionsCount: number;
  loading: boolean;
  showCancel: boolean;
  onCancel?: () => void;
  maxDistance: number | null;
  onMaxDistanceChange: (distance: number | null) => void;
}

export default function SidebarHeader({
  decisionsCount,
  loading,
  showCancel,
  onCancel,
  maxDistance,
  onMaxDistanceChange
}: SidebarHeaderProps) {
  const [showFilters, setShowFilters] = useState(false);

  // Only show filter button when there's at least one decision
  const hasDecisions = decisionsCount > 0;

  return (
    <div className="relative bg-white border-b border-gray-200 p-5 transition-all duration-300">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>
            What's Happening
          </h2>
          <div className="flex items-center gap-2 mt-1">
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            )}
            <p className="text-sm text-gray-600">
              {loading
                ? decisionsCount > 0
                  ? `Still looking... ${decisionsCount} so far`
                  : `Looking around...`
                : decisionsCount === 0
                  ? `Ready when you are`
                  : `We found ${decisionsCount} thing${decisionsCount !== 1 ? 's' : ''} nearby`}
            </p>
          </div>
        </div>

        <div className="flex">
          {hasDecisions && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-all -mr-1 group ${showFilters || maxDistance ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100 text-gray-500'
                }`}
              title="Filter by distance"
            >
              <IoOptionsOutline className="w-6 h-6" />
            </button>
          )}

          {showCancel && onCancel && (
            <button
              onClick={onCancel}
              className={`p-2 rounded-lg transition-all group ${loading
                ? 'hover:bg-red-50'
                : 'hover:bg-gray-100'
                }`}
              title={loading ? "Stop search" : "Clear results"}
            >
              {loading ? (
                <IoStopOutline className="w-6 h-6 text-red-500 group-hover:text-red-600 transition-colors" />
              ) : (
                <IoClose className="w-6 h-6 text-gray-500 group-hover:text-gray-700 transition-colors" />
              )}
            </button>
          )}
        </div>
      </div>

      {hasDecisions && (
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showFilters ? 'max-h-24 opacity-100 mt-4' : 'max-h-0 opacity-0'
          }`}>
          <DistanceFilter
            maxDistance={maxDistance}
            onMaxDistanceChange={onMaxDistanceChange}
          />
        </div>
      )}
    </div>
  );
}
