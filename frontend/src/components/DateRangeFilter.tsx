import { useState } from 'react';

interface DateRangeFilterProps {
  onFilter: (startDate: string, endDate: string) => void;
  loading?: boolean;
}

export default function DateRangeFilter({ onFilter, loading = false }: DateRangeFilterProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    onFilter(value, endDate);
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    onFilter(startDate, value);
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    onFilter('', '');
  };

  return (
    <div className="absolute top-4 right-[420px] z-[1000] bg-white rounded-lg shadow-md px-4 py-2 flex items-center gap-3">
      <input
        type="date"
        value={startDate}
        onChange={(e) => handleStartDateChange(e.target.value)}
        placeholder="Start date"
        className="px-3 py-1.5 border border-gray-300 rounded text-sm text-black bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[140px]"
        style={{ colorScheme: 'light' }}
        disabled={loading}
      />
      
      <span className="text-gray-400 text-sm">to</span>
      
      <input
        type="date"
        value={endDate}
        onChange={(e) => handleEndDateChange(e.target.value)}
        placeholder="End date"
        className="px-3 py-1.5 border border-gray-300 rounded text-sm text-black bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[140px]"
        style={{ colorScheme: 'light' }}
        disabled={loading}
      />

      {(startDate || endDate) && (
        <button
          onClick={handleClear}
          disabled={loading}
          className="!px-3 !py-1.5 border !border-gray-300 rounded text-sm !bg-white !text-black"
          title="Clear filters"
        >
          ✕
        </button>
      )}
    </div>
  );
}
