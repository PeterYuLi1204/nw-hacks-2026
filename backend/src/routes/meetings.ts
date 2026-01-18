import express, { Request, Response } from 'express';
import { fetchAllMeetings, filterMeetingsByDate, sortMeetingsByDate } from '../services/councilMeetingsService.js';

import { extractMultipleMeetingsText } from '../services/pdfExtractorService.js';
import { GeminiService } from '../services/gemini.service.js';
import type { MeetingRecord } from '../types/meeting.js';

const router = express.Router();

// Initialize Gemini service lazily
let geminiService: GeminiService | null = null;

const getGeminiService = (): GeminiService | null => {
  if (geminiService) return geminiService;

  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (geminiApiKey) {
    try {
      geminiService = new GeminiService(geminiApiKey);
    } catch (error) {
      console.error('Failed to initialize Gemini service:', error);
    }
  }
  return geminiService;
};

/**
 * GET /api/meetings
 * Query params:
 *   - startDate: YYYY-MM-DD (optional)
 *   - endDate: YYYY-MM-DD (optional)
 * 
 * Returns: Server-Sent Events stream with meeting decisions
 * Events:
 *   - meeting: A meeting with its AI-extracted decisions
 *   - complete: All meetings processed
 *   - error: An error occurred
 */
router.get('/meetings', async (req: Request, res: Response) => {
  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const { startDate, endDate } = req.query;

    console.log('\n=== Fetching Meetings (SSE) ===');
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

    // Step 5: Process each meeting with Gemini and stream results
    const service = getGeminiService();

    // Helper for concurrency control
    const runConcurrent = async <T>(
      items: T[],
      concurrency: number,
      fn: (item: T) => Promise<void>
    ) => {
      const iterator = items.entries();
      const workers = Array(Math.min(concurrency, items.length))
        .fill(null)
        .map(async () => {
          for (const [_, item] of iterator) {
            await fn(item);
          }
        });
      await Promise.all(workers);
    };

    // State for re-sequencing events
    let nextIndexToSend = 0;
    const pendingResults = new Map<number, MeetingRecord>();

    // Helper to send buffered results in order
    const sendPendingResults = () => {
      while (pendingResults.has(nextIndexToSend)) {
        const meeting = pendingResults.get(nextIndexToSend)!;
        pendingResults.delete(nextIndexToSend);

        // Send the meeting event
        sendEvent('meeting', meeting);
        console.log(`  -> Sent meeting ${meeting.id} (index ${nextIndexToSend})`);

        nextIndexToSend++;
      }
    };

    await runConcurrent(meetingsWithText, 3, async (meeting) => {
      // Find the original index of this meeting in the sorted list
      // This assumes meetingsWithText is sorted and we want to preserve that order
      // We can use the meeting.id if it corresponds to the index, 
      // but explicitly passing the index or finding it is safer if IDs aren't sequential 0..N
      const index = meetingsWithText.findIndex(m => m.id === meeting.id);

      try {
        let meetingWithDecisions: MeetingRecord = { ...meeting };

        if (service && meeting.pdfText) {
          console.log(`Processing meeting ${meeting.id} (index ${index}) with Gemini...`);
          const decisions = await service.extractMeetingDecisions(meeting.pdfText);
          meetingWithDecisions.decisions = decisions;
          console.log(`  Extracted ${decisions.length} decisions from meeting ${meeting.id}`);
        }

        // Buffer the result instead of sending immediately
        pendingResults.set(index, meetingWithDecisions);

        // Try to send pending results
        sendPendingResults();

      } catch (error: any) {
        console.error(`Error processing meeting ${meeting.id}:`, error.message);

        // Even on error, we must account for this index to not block the stream
        pendingResults.set(index, meeting);
        sendPendingResults();
      }
    });

    // Send completion event
    sendEvent('complete', { count: meetingsWithText.length });
    console.log('=== SSE Stream Complete ===\n');

  } catch (error: any) {
    console.error('Error in /api/meetings:', error.message);
    sendEvent('error', { message: error.message });
  } finally {
    res.end();
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
