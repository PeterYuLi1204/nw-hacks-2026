# Council Meetings Backend

Backend service for fetching Vancouver City Council meeting records and extracting PDF text.

## Features

- Fetch meeting records from Vancouver Council API
- Filter meetings by date range
- Extract text from meeting PDF minutes
- AI-powered decision extraction using Google Gemini 2.5 Flash Lite
- Server-Sent Events (SSE) for real-time data streaming
- AI chat interface with autonomous search capabilities
- RESTful API endpoints
- CORS enabled for frontend integration

## Installation

```bash
cd backend
npm install
```

## Environment Variables

Create a `.env` file in the backend directory (optional, defaults are provided):

```env
PORT=3001
VANCOUVER_API_KEY=19B5C94F2AA4BFEADA1806F16481A5E6B303A94A10668BF04C0058C8E98286CE
VANCOUVER_API_BASE_URL=https://api.vancouver.ca/App/CouncilMeetings/CouncilMeetings.API/api
GEMINI_API_KEY=your_gemini_api_key_here
```

## Running the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

The server will start on `http://localhost:3001`

## API Endpoints

### GET /health
Health check endpoint

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-17T12:00:00.000Z"
}
```

### GET /api/meetings
Fetch and filter council meetings with PDF text extraction and AI decision extraction. Returns a Server-Sent Events (SSE) stream.

**Query Parameters:**
- `startDate` (optional): Start date in YYYY-MM-DD format
- `endDate` (optional): End date in YYYY-MM-DD format

**Example:**
```bash
curl "http://localhost:3001/api/meetings?startDate=2025-01-01&endDate=2025-12-31"
```

**Response Format:** Server-Sent Events stream

**Event Types:**
- `meeting`: A meeting with extracted decisions
- `complete`: All meetings processed
- `error`: An error occurred

**Meeting Event Data:**
```json
{
  "id": 0,
  "meetingType": "Public Hearing",
  "status": "Completed",
  "eventDate": "2025-12-15T18:00:00",
  "meetingUrl": "https://council.vancouver.ca/...",
  "pdfText": "Full extracted text from PDF...",
  "decisions": [
    {
      "title": "Decision title",
      "content": "Full decision content",
      "location": [49.2827, -123.1207],
      "summary": "Brief summary"
    }
  ]
}
```

**Complete Event Data:**
```json
{
  "count": 150
}
```

**Note:** This endpoint streams data in real-time as meetings are processed. Processing is done concurrently with a worker pool of 5 workers.

### GET /api/meetings/test
Test endpoint that fetches meetings without PDF extraction (faster)

**Query Parameters:**
- `startDate` (optional): Start date in YYYY-MM-DD format
- `endDate` (optional): End date in YYYY-MM-DD format

**Response:**
```json
{
  "success": true,
  "totalCount": 3284,
  "sampleCount": 10,
  "meetings": [...]
}
```

### POST /api/gemini/extract-decisions
Extract decisions from meeting minutes text using Gemini AI

**Request Body:**
```json
{
  "prompt": "Full meeting minutes text..."
}
```

**Response:**
```json
{
  "success": true,
  "decisions": [
    {
      "title": "Decision title",
      "content": "Full decision content",
      "location": [49.2827, -123.1207],
      "summary": "Brief summary"
    }
  ]
}
```

### POST /api/gemini/chat
AI chat interface with decisions context and autonomous search capabilities

**Request Body:**
```json
{
  "message": "What decisions affect my neighborhood?",
  "decisions": [...],
  "difficultyLevel": "simple",
  "currentDateRange": {
    "startDate": "2025-01-01",
    "endDate": "2025-12-31"
  }
}
```

**Response:**
```json
{
  "success": true,
  "answer": "AI response text...",
  "references": ["decision-id-1", "decision-id-2"],
  "suggestedDateRange": {
    "startDate": "2025-01-01",
    "endDate": "2025-12-31",
    "reason": "Reason for suggestion"
  }
}
```

**Note:** The `difficultyLevel` can be either `"simple"` or `"detailed"`. The AI can autonomously suggest date ranges when no relevant data exists.

## Architecture

### Services

#### councilMeetingsService.ts
- Fetches meetings from Vancouver API
- Tests different API key authentication methods
- Filters meetings by date range
- Sorts meetings by date

#### pdfExtractorService.ts
- Scrapes meeting pages to find PDF links
- Downloads PDF files
- Extracts text using pdf-parse library
- Caches extracted text in memory to avoid re-processing

#### gemini.service.ts
- Extracts decisions from meeting minutes using Google Gemini 2.5 Flash Lite
- Provides chat interface with decisions context
- Supports simple and detailed explanation modes
- Autonomous date range suggestions when no data exists
- Geocodes decision locations

### Routes

#### meetings.ts
- `GET /api/meetings` - Main endpoint with SSE streaming, PDF extraction, and AI decision extraction
- `GET /api/meetings/test` - Test endpoint without PDF extraction

#### gemini.ts
- `POST /api/gemini/extract-decisions` - Extract decisions from meeting text
- `POST /api/gemini/chat` - AI chat interface with decisions context

## Performance Notes

- PDF extraction and AI processing are done in parallel with a worker pool of 5 concurrent workers
- Extracted PDF text is cached in memory to avoid re-processing
- Results are sent via SSE in sequential order (buffered to maintain meeting order)
- Large date ranges may take several minutes to process
- Use the `/api/meetings/test` endpoint for quick testing without PDF extraction
- Gemini API calls are made for each meeting with PDF text, adding processing time

## Dependencies

- **express**: Web framework
- **axios**: HTTP client for API calls
- **pdf-parse**: PDF text extraction
- **cheerio**: HTML parsing for scraping PDF links
- **@google/generative-ai**: Google Gemini AI integration
- **cors**: Cross-origin resource sharing
- **dotenv**: Environment variable management

## Development

The backend is written in TypeScript and uses ES modules. The source code is in `src/` and compiles to `dist/`.

To add new features:
1. Add services in `src/services/`
2. Add routes in `src/routes/`
3. Register routes in `src/index.ts`
