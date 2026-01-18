interface DistanceFilterProps {
  maxDistance: number | null;
  onMaxDistanceChange: (distance: number | null) => void;
}

const DISTANCE_STEPS = [
  { value: 0, label: 'All' },
  { value: 1, label: '1km' },
  { value: 2, label: '2km' },
  { value: 4, label: '4km' },
  { value: 8, label: '8km' },
  { value: 16, label: '16km' },
];

export default function DistanceFilter({
  maxDistance,
  onMaxDistanceChange
}: DistanceFilterProps) {
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
    <div className="flex flex-col gap-2 mt-1">
      <div className="flex justify-between items-center text-sm font-medium text-gray-700">
        <span>Show decisions within...</span>
        <span className="text-blue-600">
          {maxDistance ? `${maxDistance}km` : 'All'}
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
  );
}
