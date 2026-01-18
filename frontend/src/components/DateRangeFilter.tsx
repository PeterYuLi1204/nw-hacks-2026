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
    <div className="absolute top-4 right-[420px] z-[1000] bg-white rounded-lg shadow-md px-4 py-2 flex items-center gap-3">
      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        placeholder="Start date"
        max={endDate || today}
        className="px-3 py-1.5 border border-gray-300 rounded text-sm text-black bg-white min-w-[140px]"
      />
      
      <span className="text-gray-400 text-sm">to</span>
      
      <input
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        placeholder="End date"
        min={startDate || undefined}
        max={today}
        className="px-3 py-1.5 border border-gray-300 rounded text-sm text-black bg-white"
      />

      {isFiltered ? (
        <button
          onClick={handleClear}
          disabled={loading}
          className="px-3 py-1.5 border border-gray-300 rounded text-sm bg-white text-black"
          title="Clear filters"
        >
          ✕
        </button>
      ) : (
        <button
          onClick={handleApplyFilter}
          disabled={loading || !startDate || !endDate}
          className="px-3 py-1.5 border border-gray-300 rounded text-sm bg-white text-black disabled:opacity-50"
          title="Apply filter"
        >
          Filter
        </button>
      )}
    </div>
  );
});

DateRangeFilter.displayName = 'DateRangeFilter';

export default DateRangeFilter;
