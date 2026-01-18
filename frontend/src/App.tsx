import { useState, useRef } from 'react'
import Map from './components/Map'
import { Splash, DateRangeFilter } from './components/Common'
import type { DateRangeFilterRef } from './components/Common/DateRangeFilter'
import { MeetingsSidebar } from './components/Meetings'
import { SIDEBAR_WIDTH } from './constants/layout'
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
  const [currentStartDate, setCurrentStartDate] = useState<string | null>(null);
  const [currentEndDate, setCurrentEndDate] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const dateFilterRef = useRef<DateRangeFilterRef | null>(null);
  const [maxDistance, setMaxDistance] = useState<number | null>(null);

  // Helper to calculate distance
  const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const filteredDecisions = decisions.filter(d => {
    if (!maxDistance || !userLocation || !d.location) return true;
    const dist = getDistanceFromLatLonInKm(
      userLocation[0], userLocation[1],
      d.location[0], d.location[1]
    );
    return dist <= maxDistance;
  });

  const handleFilter = (startDate: string, endDate: string) => {
    // Close any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setLoading(true);
    setError(null);
    setDecisions([]);
    setSelectedDecision(null);
    setCurrentStartDate(startDate);
    setCurrentEndDate(endDate);

    // Update the date filter component to reflect the selected dates
    if (dateFilterRef.current) {
      dateFilterRef.current.setDates(startDate, endDate);
    }

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

    // If search is active (loading), just stop it and keep current results
    if (loading) {
      setLoading(false);
      return;
    }

    // Otherwise, clear everything
    setLoading(false);
    setDecisions([]);
    setSelectedDecision(null);
    setError(null);
    setCurrentStartDate(null);
    setCurrentEndDate(null);
    setMaxDistance(null); // Reset distance filter
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
              decisions={filteredDecisions}
              onMarkerClick={handleMarkerClick}
              onSelectDecision={setSelectedDecision}
              currentDateRange={{ startDate: currentStartDate, endDate: currentEndDate }}
              onTriggerSearch={handleFilter}
              isSearching={loading}
            />

            <DateRangeFilter ref={dateFilterRef} onFilter={handleFilter} loading={loading} />

            {error && (
              <div className="absolute bottom-4 left-4 z-1001 bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded shadow-lg max-w-md">
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
          <div style={{ width: `${SIDEBAR_WIDTH}px`, height: '100%', flexShrink: 0 }}>
            <MeetingsSidebar
              decisions={filteredDecisions}
              loading={loading}
              selectedDecision={selectedDecision}
              onDecisionClick={handleDecisionClick}
              onBack={handleBack}
              onCancel={handleCancel}
              maxDistance={maxDistance}
              onMaxDistanceChange={setMaxDistance}
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
