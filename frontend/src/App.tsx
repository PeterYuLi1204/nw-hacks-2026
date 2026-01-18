import { useState, useRef } from 'react'
import Map from './components/Map'
import Splash from './components/Splash'
import DateRangeFilter from './components/DateRangeFilter'
import MeetingsSidebar from './components/MeetingsSidebar'
import './App.css'

export interface MeetingDecision {
  title: string;
  content: string;
  location: [number, number] | null;
  summary: string;
}

export interface MeetingRecord {
  id: number;
  meetingType: string;
  eventDate: string;
  meetingUrl: string;
  pdfText?: string;
  decisions?: MeetingDecision[];
}

// Extended decision with meeting context for display
export interface DecisionWithContext extends MeetingDecision {
  decisionId: string;
  meetingId: number;
  meetingType: string;
  meetingDate: string;
  meetingUrl: string;
}

const API_BASE_URL = 'http://localhost:3001';

function App() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [decisions, setDecisions] = useState<DecisionWithContext[]>([]);
  const [selectedDecision, setSelectedDecision] = useState<DecisionWithContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const dateFilterRef = useRef<{ clearDates: () => void } | null>(null);

  const handleFilter = (startDate: string, endDate: string) => {
    // Close any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setLoading(true);
    setError(null);
    setDecisions([]);
    setSelectedDecision(null);

    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const url = `${API_BASE_URL}/api/meetings${params.toString() ? `?${params.toString()}` : ''}`;
    console.log('Connecting to SSE:', url);

    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener('meeting', (event) => {
      const meeting: MeetingRecord = JSON.parse(event.data);
      console.log(`Received meeting ${meeting.id} with ${meeting.decisions?.length || 0} decisions`);

      // Extract decisions with meeting context
      if (meeting.decisions && meeting.decisions.length > 0) {
        const newDecisions: DecisionWithContext[] = meeting.decisions.map((decision, index) => ({
          ...decision,
          decisionId: `${meeting.id}-${index}`,
          meetingId: meeting.id,
          meetingType: meeting.meetingType,
          meetingDate: meeting.eventDate,
          meetingUrl: meeting.meetingUrl,
        }));

        setDecisions(prev => [...prev, ...newDecisions]);
      }
    });

    eventSource.addEventListener('complete', (event) => {
      const data = JSON.parse(event.data);
      console.log(`SSE complete: ${data.count} meetings processed`);
      setLoading(false);
      eventSource.close();
    });

    eventSource.addEventListener('error', (event) => {
      console.error('SSE error:', event);
      setError('Connection error while fetching meetings');
      setLoading(false);
      eventSource.close();
    });

    eventSource.onerror = () => {
      if (eventSource.readyState === EventSource.CLOSED) {
        console.log('SSE connection closed');
      } else {
        setError('Connection error while fetching meetings');
        setLoading(false);
      }
      eventSource.close();
    };
  };

  const handleDecisionClick = (decision: DecisionWithContext) => {
    setSelectedDecision(decision);
  };

  const handleBack = () => {
    setSelectedDecision(null);
  };

  const handleMarkerClick = (decision: DecisionWithContext) => {
    setSelectedDecision(decision);
  };

  const handleCancel = () => {
    // Close any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    // Clear state
    setLoading(false);
    setDecisions([]);
    setSelectedDecision(null);
    setError(null);
    
    // Clear date fields
    if (dateFilterRef.current) {
      dateFilterRef.current.clearDates();
    }
  };

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative' }}>
      {userLocation ? (
        <div style={{ display: 'flex', height: '100%', width: '100%' }}>
          {/* Left side: Map with DateRangeFilter and error on top */}
          <div style={{ flex: 1, position: 'relative' }}>
            <Map
              userLocation={userLocation}
              zoom={13}
              decisions={decisions}
              onMarkerClick={handleMarkerClick}
            />

            <DateRangeFilter ref={dateFilterRef} onFilter={handleFilter} loading={loading} />

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

          {/* Right side: Sidebar */}
          <div style={{ width: '400px', height: '100%', flexShrink: 0 }}>
            <MeetingsSidebar
              decisions={decisions}
              loading={loading}
              selectedDecision={selectedDecision}
              onDecisionClick={handleDecisionClick}
              onBack={handleBack}
              onCancel={handleCancel}
            />
          </div>
        </div>
      ) : (
        <Splash setUserLocation={setUserLocation} />
      )}
    </div>
  )
}

export default App
