import axios from 'axios';
import * as cheerio from 'cheerio';
import pdfParse from 'pdf-parse';
import { MeetingRecord } from '../types/meeting.js';

// Cache for extracted PDF texts to avoid re-processing
const pdfTextCache = new Map<string, string>();

/**
 * Extract text from a single meeting's PDF minutes
 */
export async function extractMeetingText(meeting: MeetingRecord): Promise<string | null> {
  const { id, meetingUrl } = meeting;

  // Validate inputs
  if (!meetingUrl) {
    console.log(`Meeting ${id}: Empty or missing meetingUrl`);
    return null;
  }

  // Check cache first
  if (pdfTextCache.has(meetingUrl)) {
    console.log(`Meeting ${id}: Using cached PDF text`);
    return pdfTextCache.get(meetingUrl)!;
  }

  try {
    // Step 1: Fetch the meeting page HTML
    console.log(`Meeting ${id}: Fetching page...`);
    const pageResponse = await axios.get(meetingUrl, { timeout: 30000 });

    if (pageResponse.status === 404) {
      console.log(`Meeting ${id}: Page not found (404)`);
      return null;
    }

    if (pageResponse.status !== 200) {
      console.log(`Meeting ${id}: HTTP ${pageResponse.status}`);
      return null;
    }

    // Step 2: Parse HTML and find "read the minutes" link
    const $ = cheerio.load(pageResponse.data);
    let minutesLink: string | null = null;

    $('a').each((_, element) => {
      const linkText = $(element).text().trim().toLowerCase();
      if (linkText.includes('read the minutes')) {
        minutesLink = $(element).attr('href') || null;
        return false; // Break the loop
      }
    });

    if (!minutesLink) {
      console.log(`Meeting ${id}: No 'read the minutes' link found`);
      return null;
    }

    // Step 3: Construct full PDF URL
    let pdfUrl: string;
    const link = minutesLink as string;
    if (link.startsWith('http')) {
      pdfUrl = link;
    } else if (link.startsWith('/')) {
      pdfUrl = `https://council.vancouver.ca${link}`;
    } else {
      // Relative URL - construct from meeting URL base
      const baseUrl = meetingUrl.substring(0, meetingUrl.lastIndexOf('/'));
      pdfUrl = `${baseUrl}/${minutesLink}`;
    }

    console.log(`Meeting ${id}: Downloading PDF from ${pdfUrl}`);

    // Step 4: Download PDF
    const pdfResponse = await axios.get(pdfUrl, {
      timeout: 60000,
      responseType: 'arraybuffer'
    });

    if (pdfResponse.status !== 200) {
      console.log(`Meeting ${id}: PDF download failed (HTTP ${pdfResponse.status})`);
      return null;
    }

    // Step 5: Extract text from PDF using pdf-parse
    console.log(`Meeting ${id}: Extracting text from PDF...`);
    const pdfBuffer = Buffer.from(pdfResponse.data);
    const pdfData = await pdfParse(pdfBuffer);

    if (!pdfData.text || pdfData.text.trim().length === 0) {
      console.log(`Meeting ${id}: No text extracted from PDF`);
      return null;
    }

    const extractedText = pdfData.text.trim();
    console.log(`Meeting ${id}: Successfully extracted ${pdfData.numpages} pages, ${extractedText.length} characters`);

    // Cache the result
    pdfTextCache.set(meetingUrl, extractedText);

    return extractedText;

  } catch (error: any) {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.log(`Meeting ${id}: Request timeout`);
    } else if (error.response) {
      console.log(`Meeting ${id}: HTTP error ${error.response.status}`);
    } else {
      console.log(`Meeting ${id}: Error - ${error.message}`);
    }
    return null;
  }
}

/**
 * Extract text from multiple meetings in parallel (with concurrency limit)
 */
export async function extractMultipleMeetingsText(
  meetings: MeetingRecord[],
  concurrencyLimit: number = 5
): Promise<MeetingRecord[]> {
  console.log(`\nExtracting PDF text from ${meetings.length} meetings (concurrency: ${concurrencyLimit})...`);

  const results: MeetingRecord[] = [];
  const queue = [...meetings];
  let completed = 0;

  // Process in batches with concurrency limit
  while (queue.length > 0) {
    const batch = queue.splice(0, concurrencyLimit);

    const batchResults = await Promise.all(
      batch.map(async (meeting) => {
        const pdfText = await extractMeetingText(meeting);
        completed++;

        if (completed % 10 === 0 || completed === meetings.length) {
          console.log(`Progress: ${completed}/${meetings.length} (${Math.round(completed * 100 / meetings.length)}%)`);
        }

        return {
          ...meeting,
          pdfText: pdfText || undefined
        };
      })
    );

    results.push(...batchResults);
  }

  const successCount = results.filter(r => r.pdfText).length;
  console.log(`✓ Extraction complete: ${successCount}/${meetings.length} successful`);

  return results;
}

/**
 * Clear the PDF text cache
 */
export function clearCache(): void {
  pdfTextCache.clear();
  console.log('PDF text cache cleared');
}
