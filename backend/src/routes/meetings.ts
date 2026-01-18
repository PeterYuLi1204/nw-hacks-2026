import express, { Request, Response } from 'express';
import { fetchAllMeetings, filterMeetingsByDate, sortMeetingsByDate } from '../services/councilMeetingsService.js';
import { extractMultipleMeetingsText } from '../services/pdfExtractorService.js';

const router = express.Router();

/**
 * GET /api/meetings
 * Query params:
 *   - startDate: YYYY-MM-DD (optional)
 *   - endDate: YYYY-MM-DD (optional)
 * 
 * Returns: Array of meeting records with PDF text
 */
router.get('/meetings', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    console.log('\n=== Fetching Meetings ===');
    console.log(`Date range: ${startDate || 'any'} to ${endDate || 'any'}`);

    // Step 1: Fetch all meetings from Vancouver API
    const allMeetings = await fetchAllMeetings('previous');

    // Step 2: Filter by date range
    const filteredMeetings = filterMeetingsByDate(
      allMeetings,
      startDate as string | undefined,
      endDate as string | undefined
    );

    console.log(`Filtered to ${filteredMeetings.length} meetings`);

    // Step 3: Sort by date descending
    const sortedMeetings = sortMeetingsByDate(filteredMeetings);

    // Step 4: Extract PDF text for each meeting
    const meetingsWithText = await extractMultipleMeetingsText(sortedMeetings);

    console.log('=== Request Complete ===\n');

    res.json({
      success: true,
      count: meetingsWithText.length,
      meetings: meetingsWithText
    });

  } catch (error: any) {
    console.error('Error in /api/meetings:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch meetings',
      message: error.message
    });
  }
});

/**
 * GET /api/meetings/test
 * Test endpoint to verify API connectivity without PDF extraction
 */
router.get('/meetings/test', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    console.log('\n=== Test Endpoint ===');
    
    const allMeetings = await fetchAllMeetings('previous');
    const filteredMeetings = filterMeetingsByDate(
      allMeetings,
      startDate as string | undefined,
      endDate as string | undefined
    );
    const sortedMeetings = sortMeetingsByDate(filteredMeetings);

    // Return only first 10 meetings without PDF extraction
    const sampleMeetings = sortedMeetings.slice(0, 10);

    res.json({
      success: true,
      totalCount: sortedMeetings.length,
      sampleCount: sampleMeetings.length,
      meetings: sampleMeetings
    });

  } catch (error: any) {
    console.error('Error in /api/meetings/test:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch meetings',
      message: error.message
    });
  }
});

export default router;
