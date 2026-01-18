# Council Meetings Backend

Backend service for fetching Vancouver City Council meeting records and extracting PDF text.

## Features

- Fetch meeting records from Vancouver Council API
- Filter meetings by date range
- Extract text from meeting PDF minutes
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
Fetch and filter council meetings with PDF text extraction

**Query Parameters:**
- `startDate` (optional): Start date in YYYY-MM-DD format
- `endDate` (optional): End date in YYYY-MM-DD format

**Example:**
```bash
curl "http://localhost:3001/api/meetings?startDate=2025-01-01&endDate=2025-12-31"
```

**Response:**
```json
{
  "success": true,
  "count": 150,
  "meetings": [
    {
      "id": 0,
      "meetingType": "Public Hearing",
      "status": "Completed",
      "eventDate": "2025-12-15T18:00:00",
      "meetingUrl": "https://council.vancouver.ca/...",
      "pdfText": "Full extracted text from PDF..."
    }
  ]
}
```

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
- Caches extracted text to avoid re-processing

### Routes

#### meetings.ts
- `/api/meetings` - Main endpoint with full PDF extraction
- `/api/meetings/test` - Test endpoint without PDF extraction

## Performance Notes

- PDF extraction is done in parallel with a concurrency limit of 5
- Extracted PDF text is cached in memory
- Large date ranges may take several minutes to process
- Use the `/api/meetings/test` endpoint for quick testing without PDF extraction

## Dependencies

- **express**: Web framework
- **axios**: HTTP client for API calls
- **pdf-parse**: PDF text extraction
- **cheerio**: HTML parsing for scraping PDF links
- **cors**: Cross-origin resource sharing
- **dotenv**: Environment variable management

## Development

The backend is written in TypeScript and uses ES modules. The source code is in `src/` and compiles to `dist/`.

To add new features:
1. Add services in `src/services/`
2. Add routes in `src/routes/`
3. Register routes in `src/index.ts`
