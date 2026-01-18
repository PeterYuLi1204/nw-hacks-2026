# Town Square Frontend

React frontend application for visualizing and interacting with Vancouver City Council meeting decisions on an interactive map.

## Features

- Interactive map with Leaflet displaying geocoded council decisions
- Real-time data streaming via Server-Sent Events (SSE)
- Date range filtering for council meetings
- Distance-based filtering from user location
- AI chat interface with autonomous search capabilities
- Progressive loading with smooth animations
- Responsive sidebar with meeting lists and details

## Installation

```bash
cd frontend
npm install
```

## Running the Application

### Development Mode
```bash
npm run dev
```

The application will start on `http://localhost:5173` (or the next available port)

### Production Build
```bash
npm run build
npm preview
```

## Configuration

The frontend expects the backend API to be running at `http://localhost:3001`. The API base URL is configured in `src/App.tsx`:

```typescript
const API_BASE_URL = 'http://localhost:3001';
```

## Architecture

### Main Application

#### App.tsx
- Main application component managing global state
- Handles user location, decisions, selected decision, and loading states
- Manages Server-Sent Events connection for real-time meeting data
- Implements distance filtering using Haversine formula
- Coordinates between map, sidebar, and date filter components

**Key State:**
- `userLocation`: User's geolocation coordinates
- `decisions`: Array of council decisions with context
- `selectedDecision`: Currently selected decision for detail view
- `loading`: Loading state for meeting data fetch
- `maxDistance`: Maximum distance filter in kilometers

### Components

#### Map (components/Map/)
- Interactive Leaflet map component
- Displays user location and decision markers
- Handles marker clicks to show decision details
- Automatically adjusts bounds to show all visible decisions
- Integrates AI chat button and interface

#### Sidebar (components/Sidebar/)
- **MeetingsSidebar**: Main sidebar container
- **MeetingsList**: Scrollable list of all decisions
- **MeetingCard**: Individual decision card with summary
- **MeetingDetail**: Detailed view of selected decision
- **DistanceFilter**: Slider for filtering by distance
- **FunFacts**: Local trivia displayed during loading
- **SidebarHeader**: Header with title and cancel button

#### Chat (components/Chat/)
- **AIChatInterface**: Full chat interface with message history
- **AIChatButton**: Floating button to open chat
- **DifficultyToggle**: Switch between simple and detailed AI responses
- Handles autonomous search triggering when needed
- Supports decision references in chat responses

#### Common (components/Common/)
- **DateRangeFilter**: Date picker for filtering meetings by date range
- **AddressSearch**: Address search component (if used)

### Data Flow

1. User selects date range via `DateRangeFilter`
2. `App.tsx` opens Server-Sent Events connection to `/api/meetings`
3. Backend streams meeting data with decisions
4. Decisions are progressively added to state with randomized delays
5. Map and sidebar update in real-time as decisions arrive
6. User can filter by distance, click markers, or use AI chat

### Server-Sent Events Integration

The application uses SSE for real-time data streaming:

```typescript
const eventSource = new EventSource(url);

eventSource.addEventListener('meeting', (event) => {
  const meeting: MeetingRecord = JSON.parse(event.data);
  // Process and add decisions
});

eventSource.addEventListener('complete', (event) => {
  // Close connection when complete
});
```

**Event Types:**
- `meeting`: Individual meeting with decisions
- `complete`: All meetings processed
- `error`: Connection or processing error

### API Integration

#### Meetings Endpoint
- **Endpoint**: `GET /api/meetings?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
- **Method**: Server-Sent Events stream
- **Response**: Stream of meeting events with decisions

#### Chat Endpoint
- **Endpoint**: `POST /api/gemini/chat`
- **Method**: HTTP POST
- **Request Body**:
```json
{
  "message": "user message",
  "decisions": [...],
  "difficultyLevel": "simple" | "detailed",
  "currentDateRange": { "startDate": "...", "endDate": "..." }
}
```

## Performance Notes

- Decisions are progressively loaded with randomized delays (~1000ms average) for better UX
- Distance filtering uses Haversine formula calculated client-side
- Map bounds automatically adjust to show all visible decisions
- SSE connection is properly closed when component unmounts or new search starts
- Large decision sets may impact map rendering performance

## Dependencies

- **react**: UI framework (v19)
- **react-dom**: React DOM rendering
- **react-leaflet**: React bindings for Leaflet maps
- **leaflet**: Interactive mapping library
- **react-markdown**: Markdown rendering for AI responses
- **react-icons**: Icon library
- **tailwindcss**: Utility-first CSS framework
- **vite**: Build tool and dev server
- **typescript**: Type safety

## Development

The frontend is written in TypeScript with React 19. The source code is in `src/` and uses Vite for building.

**Key Files:**
- `src/App.tsx`: Main application component
- `src/main.tsx`: Application entry point
- `src/components/`: All React components
- `src/constants/`: Layout and configuration constants
- `src/App.css`: Global styles

**To add new features:**
1. Add components in `src/components/`
2. Update state management in `App.tsx` if needed
3. Add API calls using fetch or EventSource
4. Update TypeScript interfaces in `App.tsx` for new data types

## Type Definitions

**MeetingDecision**:
```typescript
{
  title: string;
  content: string;
  location: [number, number] | null;
  summary: string;
}
```

**DecisionWithContext**: Extends MeetingDecision with:
```typescript
{
  decisionId: string;
  meetingId: number;
  meetingType: string;
  meetingDate: string;
  meetingUrl: string;
}
```
