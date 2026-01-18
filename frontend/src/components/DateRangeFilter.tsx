import { useState, useImperativeHandle, forwardRef } from 'react';

interface DateRangeFilterProps {
  onFilter: (startDate: string, endDate: string) => void;
  loading?: boolean;
}

export interface DateRangeFilterRef {
  clearDates: () => void;
}

const DateRangeFilter = forwardRef<DateRangeFilterRef, DateRangeFilterProps>(
  ({ onFilter, loading = false }, ref) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isFiltered, setIsFiltered] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const handleApplyFilter = () => {
    // Only search if both dates are provided
    if (loading || !startDate || !endDate) return;
    onFilter(startDate, endDate);
    setIsFiltered(true);
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    setIsFiltered(false);
    // Don't trigger search when clearing
  };

  // Expose clearDates method to parent via ref
  useImperativeHandle(ref, () => ({
    clearDates: handleClear
  }));

  return (
    <div className="absolute top-4 right-[420px] z-[1000]">
      {/* Date selector box */}
      <div className="bg-white rounded-lg shadow-sm px-4 py-3 border border-gray-200">
        <p className="text-sm text-slate-500 mb-2">
          <strong>Find council decisions from...</strong>
        </p>
        <div className="flex items-center gap-3">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          placeholder="Start date"
          max={endDate || today}
          className="px-3 py-1.5 border border-gray-300 rounded text-sm text-black bg-white min-w-[140px] focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        
        <span className="text-gray-400 text-sm font-medium">to</span>
        
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          placeholder="End date"
          min={startDate || undefined}
          max={today}
          className="px-3 py-1.5 border border-gray-300 rounded text-sm text-black bg-white focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />

        {isFiltered ? (
          <button
            onClick={handleClear}
            disabled={loading}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm bg-white text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            title="Clear filters"
          >
            Clear
          </button>
        ) : (
          <button
            onClick={handleApplyFilter}
            disabled={loading || !startDate || !endDate}
            className="px-4 py-1.5 border border-blue-300 rounded text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            title="Apply filter"
          >
            Go
          </button>
        )}
        </div>
      </div>
    </div>
  );
});

DateRangeFilter.displayName = 'DateRangeFilter';

export default DateRangeFilter;
