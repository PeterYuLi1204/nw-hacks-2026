import { useState } from 'react';
import { IoClose, IoStopOutline, IoOptionsOutline } from 'react-icons/io5';

interface SidebarHeaderProps {
  decisionsCount: number;
  loading: boolean;
  showCancel: boolean;
  onCancel?: () => void;
  maxDistance: number | null;
  onMaxDistanceChange: (distance: number | null) => void;
}

const DISTANCE_STEPS = [
  { value: 0, label: 'All' },
  { value: 2, label: '2km' },
  { value: 4, label: '4km' },
  { value: 6, label: '6km' },
  { value: 8, label: '8km' },
  { value: 10, label: '10km' },
];

export default function SidebarHeader({
  decisionsCount,
  loading,
  showCancel,
  onCancel,
  maxDistance,
  onMaxDistanceChange
}: SidebarHeaderProps) {
  const [showFilters, setShowFilters] = useState(false);

  // Convert current distance to slider index
  // default to index 0 (All/null) if maxDistance is null
  const currentIndex = maxDistance
    ? DISTANCE_STEPS.findIndex(s => s.value === maxDistance)
    : 0;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(e.target.value);
    const step = DISTANCE_STEPS[index];
    onMaxDistanceChange(step.value === 0 ? null : step.value);
  };

  return (
    <div className="relative bg-white border-b-2 border-blue-200 p-5 transition-all duration-300">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">
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

        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-all group ${showFilters || maxDistance ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100 text-gray-500'
              }`}
            title="Filter by distance"
          >
            <IoOptionsOutline className="w-6 h-6" />
          </button>

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
                <IoStopOutline className="w-6 h-6 text-red-400 group-hover:text-red-600 transition-colors" />
              ) : (
                <IoClose className="w-6 h-6 text-gray-500 group-hover:text-gray-700 transition-colors" />
              )}
            </button>
          )}
        </div>
      </div>

      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showFilters ? 'max-h-24 opacity-100 mt-4' : 'max-h-0 opacity-0'
        }`}>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center text-sm font-medium text-gray-700">
            <span>Distance</span>
            <span className="text-blue-600">
              {maxDistance ? `Within ${maxDistance}km` : 'Everything'}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max={DISTANCE_STEPS.length - 1}
            step="1"
            value={currentIndex === -1 ? 0 : currentIndex}
            onChange={handleSliderChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="relative h-4 mt-2 mb-2 w-full">
            {DISTANCE_STEPS.map((step, idx) => {
              // Calculate position percentage
              // idx 0 -> 0%, idx last -> 100%
              const totalSteps = DISTANCE_STEPS.length - 1;
              const percent = (idx / totalSteps) * 100;

              let transformClass = '-translate-x-1/2';
              // Standard range slider thumbs are shifted inwards as they approach the edges.
              // We need to shift our labels similarly to match the thumb center.
              // Estimated thumb width ~16px.
              // Offset = (ThumbWidth/2) - (ThumbWidth * Percent)
              //        = 8 - (16 * percent/100)
              const offset = 8 - (16 * percent / 100);
              let style: React.CSSProperties = { left: `calc(${percent}% + ${offset}px)` };

              if (idx === 0) {
                transformClass = 'translate-x-0';
                style = { left: '0' };
              } else if (idx === totalSteps) {
                transformClass = '-translate-x-full';
                style = { left: '100%' };
              }

              return (
                <span
                  key={step.value}
                  className={`absolute text-xs text-gray-400 whitespace-nowrap transform ${transformClass} ${step.value === (maxDistance || 0) ? 'font-bold text-blue-600' : ''
                    }`}
                  style={style}
                >
                  {step.label}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
