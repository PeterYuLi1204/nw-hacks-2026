import axios from 'axios';
import { MeetingRecord, VancouverAPIMeeting } from '../types/meeting.js';

const API_BASE_URL = process.env.VANCOUVER_API_BASE_URL || 'https://api.vancouver.ca/App/CouncilMeetings/CouncilMeetings.API/api';
const API_KEY = process.env.VANCOUVER_API_KEY || '19B5C94F2AA4BFEADA1806F16481A5E6B303A94A10668BF04C0058C8E98286CE';
const ENDPOINT = `${API_BASE_URL}/CouncilMeetings`;

// Common API key header formats to try
const API_KEY_HEADERS: Record<string, string>[] = [
  { 'X-API-Key': API_KEY },
  { 'Api-Key': API_KEY },
  { 'API-Key': API_KEY },
  { 'X-API-KEY': API_KEY },
  { 'Authorization': `Bearer ${API_KEY}` },
  { 'Authorization': API_KEY },
  { 'apikey': API_KEY },
];

/**
 * Test different API key header formats to find the correct one
 */
async function testApiKeyFormat(): Promise<Record<string, string> | null> {
  const params = { type: 'previous' };

  console.log('Testing API key formats...');

  // Try each header format
  for (const headers of API_KEY_HEADERS) {
    try {
      const headerName = Object.keys(headers)[0];
      console.log(`Trying header: ${headerName}`);

      const response = await axios.get(ENDPOINT, { params, headers, timeout: 10000 });

      if (response.status === 200) {
        console.log(`✓ Success! Working header: ${headerName}`);
        return headers;
      }
    } catch (error: any) {
      if (error.response) {
        console.log(`  ✗ Status code: ${error.response.status}`);
      } else {
        console.log(`  ✗ Error: ${error.message}`);
      }
    }
  }

  // Try as query parameter
  console.log('\nTrying API key as query parameter...');
  try {
    const paramsWithKey = { ...params, apiKey: API_KEY };
    const response = await axios.get(ENDPOINT, { params: paramsWithKey, timeout: 10000 });

    if (response.status === 200) {
      console.log('✓ Success! API key works as query parameter');
      return null; // Return null to indicate query param should be used
    }
  } catch (error: any) {
    console.log(`  ✗ Error: ${error.message}`);
  }

  return null;
}

/**
 * Fetch all meetings from the Vancouver API
 */
export async function fetchAllMeetings(
  meetingType: string = 'previous'
): Promise<MeetingRecord[]> {
  try {
    // Test API key format first
    const workingHeaders = await testApiKeyFormat();
    const useQueryParam = workingHeaders === null;

    const params: any = { type: meetingType };

    // If API key should be in query params, add it
    if (useQueryParam) {
      params.apiKey = API_KEY;
    }

    console.log(`\nFetching all ${meetingType} meetings...`);

    const response = await axios.get(ENDPOINT, {
      params,
      headers: workingHeaders || undefined,
      timeout: 30000
    });

    if (response.status !== 200) {
      throw new Error(`API returned status ${response.status}`);
    }

    let rawMeetings: VancouverAPIMeeting[] = [];

    // API returns a list directly or wrapped in an object
    if (Array.isArray(response.data)) {
      rawMeetings = response.data;
    } else if (typeof response.data === 'object') {
      rawMeetings = response.data.data || response.data.items || response.data.results || response.data.meetings || [];
    }

    // Transform the meetings to desired format
    const transformedMeetings: MeetingRecord[] = rawMeetings.map((meeting, idx) => {
      let meetingUrl = meeting.relatedURL || '';
      if (meetingUrl && !meetingUrl.startsWith('http')) {
        meetingUrl = `https://council.vancouver.ca${meetingUrl}`;
      }

      return {
        id: idx,
        meetingType: meeting.eventTitle || '',
        status: meeting.locationStatus || '',
        eventDate: meeting.eventDateStart || '',
        meetingUrl
      };
    });

    console.log(`✓ Successfully fetched ${transformedMeetings.length} meetings`);
    return transformedMeetings;

  } catch (error: any) {
    console.error('Error fetching meetings:', error.message);
    throw error;
  }
}

/**
 * Filter meetings by date range
 */
export function filterMeetingsByDate(
  meetings: MeetingRecord[],
  startDate?: string,
  endDate?: string
): MeetingRecord[] {
  if (!startDate && !endDate) {
    return meetings;
  }

  return meetings.filter(meeting => {
    if (!meeting.eventDate) return false;

    try {
      // Parse ISO format date (e.g., "2026-01-15T18:00:00")
      const eventDate = new Date(meeting.eventDate);
      const eventDateOnly = eventDate.toISOString().split('T')[0];

      // Check start date
      if (startDate && eventDateOnly < startDate) {
        return false;
      }

      // Check end date
      if (endDate && eventDateOnly > endDate) {
        return false;
      }

      return true;
    } catch (error) {
      // Skip meetings with invalid dates
      return false;
    }
  });
}

/**
 * Sort meetings by date descending (most recent first)
 */
export function sortMeetingsByDate(meetings: MeetingRecord[]): MeetingRecord[] {
  return [...meetings].sort((a, b) => {
    const dateA = new Date(a.eventDate).getTime();
    const dateB = new Date(b.eventDate).getTime();
    return dateB - dateA; // Descending order
  });
}
