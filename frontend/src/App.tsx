import { useState } from 'react'
import Map from './Map'
import DateRangeFilter from './components/DateRangeFilter'
import MeetingsSidebar from './components/MeetingsSidebar'
import './App.css'

interface MeetingRecord {
  id: number;
  meetingType: string;
  eventDate: string;
  meetingUrl: string;
  pdfText?: string;
}

const API_BASE_URL = 'http://localhost:3001';

function App() {
  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilter = async (startDate: string, endDate: string) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const url = `${API_BASE_URL}/api/meetings${params.toString() ? `?${params.toString()}` : ''}`;
      console.log('Fetching meetings from:', url);

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setMeetings(data.meetings || []);
        console.log(`Loaded ${data.meetings?.length || 0} meetings`);
      } else {
        throw new Error(data.message || 'Failed to fetch meetings');
      }
    } catch (err: any) {
      console.error('Error fetching meetings:', err);
      setError(err.message || 'Failed to fetch meetings');
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative' }}>
      <Map center={[49.2827, -123.1207]} zoom={13} />
      
      <DateRangeFilter onFilter={handleFilter} loading={loading} />
      
      <MeetingsSidebar meetings={meetings} loading={loading} />

      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1001] bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg max-w-md">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
