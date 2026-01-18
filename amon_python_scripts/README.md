# Vancouver Council Meeting Minutes Scraper

This project scrapes Vancouver City Council meeting records and extracts text from meeting minutes PDFs.

## Overview

The system consists of three main scripts:

1. **scrape_council_meetings.py** - Fetches meeting metadata from the API
2. **extract_meeting_text.py** - Extracts text from a single meeting's PDF
3. **orchestrate_extraction.py** - Orchestrates parallel extraction of all meetings

## Installation

Install required dependencies:

```bash
pip install -r requirements.txt
```

## Usage

### Quick Start (Complete Pipeline)

Run the entire pipeline with a single command:

```bash
python orchestrate_extraction.py
```

This will:
1. **Automatically scrape** all meeting metadata from the API
2. Extract text from all meeting PDFs in parallel
3. Save results to JSON files and text files

### Date Filtering

Extract only meetings from a specific date range:

```bash
# Extract only 2025 meetings
python orchestrate_extraction.py --start-date 2025-01-01 --end-date 2025-12-31

# Extract recent meetings (last 6 months)
python orchestrate_extraction.py --start-date 2025-07-01

# Extract meetings up to a specific date
python orchestrate_extraction.py --end-date 2024-12-31
```

### Custom Options

```bash
python orchestrate_extraction.py \
  --output-dir my_meetings \
  --workers 8 \
  --start-date 2025-01-01 \
  --end-date 2025-12-31
```

**Available Options:**
- `--start-date YYYY-MM-DD` - Filter meetings from this date (inclusive)
- `--end-date YYYY-MM-DD` - Filter meetings to this date (inclusive)
- `--input FILE` - Input JSON file (default: council_meetings.json)
- `--output FILE` - Output JSON file (default: council_meetings_with_text.json)
- `--failed FILE` - Failed meetings log (default: failed_meetings.json)
- `--output-dir DIR` - Text files directory (default: previous_meetings_extracted)
- `--workers N` - Number of parallel workers (default: CPU count)

### Manual Scraping (Optional)

If you need to run the scraper separately:

```bash
python scrape_council_meetings.py
```

This will:
- Test API key formats
- Fetch all 3,284+ meeting records
- Transform and clean the data
- Save to `council_meetings.json`

**Output format:**
```json
[
  {
    "id": 0,
    "meetingType": "Public Hearing",
    "status": "Completed",
    "eventDate": "2026-01-15T18:00:00",
    "meetingUrl": "https://council.vancouver.ca/20260115/phea20260115ag.htm"
  }
]
```

**Progress output:**
```
Progress: 150/3284 (4%) | Success: 142 | Failed: 8 | Rate: 2.5/s | ETA: 20.9m
```

### Step 3: Extract Single Meeting (Optional)

To extract text from a single meeting, provide either the meeting ID or URL:

```bash
# By ID
python extract_meeting_text.py 0

# By URL
python extract_meeting_text.py https://council.vancouver.ca/20260115/phea20260115ag.htm
```

The script will automatically look up the meeting in `council_meetings.json`.

## Output Files

### council_meetings.json
Raw meeting metadata with cleaned fields and full URLs.

### council_meetings_with_text.json
Meeting metadata with `text_filename` field pointing to extracted text:

```json
[
  {
    "id": 0,
    "meetingType": "Public Hearing",
    "status": "Completed",
    "eventDate": "2026-01-15T18:00:00",
    "meetingUrl": "https://council.vancouver.ca/20260115/phea20260115ag.htm",
    "text_filename": "previous_meetings_extracted/0.txt"
  }
]
```

### failed_meetings.json
Records that failed extraction with error messages:

```json
[
  {
    "id": 123,
    "meetingType": "Business Licence Hearing - CANCELLED",
    "status": "Completed",
    "eventDate": "2025-12-17T09:30:00",
    "meetingUrl": "",
    "error_message": "Meeting 123: Empty or missing meetingUrl"
  }
]
```

### previous_meetings_extracted/
Directory containing extracted text files named by meeting ID:
- `0.txt`
- `1.txt`
- `2.txt`
- etc.

## Error Handling

The system handles various failure scenarios:

- **Empty meetingUrl** - Skipped (common for cancelled meetings)
- **404 errors** - Logged as failed (page deleted)
- **No "read the minutes" link** - Logged as failed (no PDF available)
- **PDF download failures** - Logged as failed
- **PDF extraction errors** - Logged as failed

All failures are logged to `failed_meetings.json` for manual review.

## Performance

- **Parallel processing** - Uses all CPU cores by default
- **Typical rate** - 2-5 meetings/second (depends on network and PDF size)
- **Estimated time** - 10-30 minutes for 3,284 meetings

## Notes

- The API returns all meetings in a single request (no pagination needed)
- Meeting IDs are reassigned starting from 0 for consistency
- Full URLs are included in the output for direct access
- Text extraction preserves page breaks with double newlines
- Rate limiting may be needed if the server blocks rapid requests
