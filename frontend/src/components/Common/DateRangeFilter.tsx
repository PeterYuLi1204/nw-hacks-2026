import { useState, useImperativeHandle, forwardRef } from 'react';

interface DateRangeFilterProps {
  onFilter: (startDate: string, endDate: string) => void;
  loading?: boolean;
}

export interface DateRangeFilterRef {
  clearDates: () => void;
  setDates: (startDate: string, endDate: string) => void;
}

const DateRangeFilter = forwardRef<DateRangeFilterRef, DateRangeFilterProps>(
  ({ onFilter, loading = false }, ref) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const handleApplyFilter = () => {
    // Only search if both dates are provided
    if (loading || !startDate || !endDate) return;
    onFilter(startDate, endDate);
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    // Don't trigger search when clearing
  };

  const handlePresetRange = (days: number) => {
    if (loading) return;
    
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    
    const endDateStr = end.toISOString().split('T')[0];
    const startDateStr = start.toISOString().split('T')[0];
    
    setStartDate(startDateStr);
    setEndDate(endDateStr);
    onFilter(startDateStr, endDateStr);
  };

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    clearDates: handleClear,
    setDates: (start: string, end: string) => {
      setStartDate(start);
      setEndDate(end);
    }
  }));

  return (
    <div className="absolute top-4 right-4 z-1000">
      {/* Date selector box */}
      <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm px-4 py-3 border border-gray-200">
        <p className="text-sm text-slate-500 mb-2">
          <strong>Find council decisions from...</strong>
        </p>
        
        {/* Preset buttons */}
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => handlePresetRange(7)}
            disabled={loading}
            className="px-3 py-1.5 text-xs bg-gray-200/50 hover:bg-gray-200 text-gray-700 rounded transition-colors disabled:opacity-7a0 disabled:cursor-not-allowed"
          >
            Last week
          </button>
          <button
            onClick={() => handlePresetRange(30)}
            disabled={loading}
            className="px-3 py-1.5 text-xs bg-gray-200/50 hover:bg-gray-200 text-gray-700 rounded transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            Last month
          </button>
          <button
            onClick={() => handlePresetRange(90)}
            disabled={loading}
            className="px-3 py-1.5 text-xs bg-gray-200/50 hover:bg-gray-200 text-gray-700 rounded transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            Last 3 months
          </button>
        </div>

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

        <button
          onClick={handleApplyFilter}
          disabled={loading}
          className="px-4 py-1.5 border border-blue-300 rounded text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          title="Apply filter"
        >
          Go
        </button>
        </div>
      </div>
    </div>
  );
});

DateRangeFilter.displayName = 'DateRangeFilter';

export default DateRangeFilter;
