import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import type { MeetingDecision, DecisionContext, ChatResponse, DateRangeContext } from '../types/gemini.js';

export class GeminiService {
    private genAI: GoogleGenerativeAI;
    private model: any;
    private chatModel: any;

    constructor(apiKey: string) {
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not configured');
        }

        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({
            model: 'gemini-2.5-flash-lite',
            generationConfig: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: SchemaType.ARRAY,
                    items: {
                        type: SchemaType.OBJECT,
                        properties: {
                            title: { type: SchemaType.STRING },
                            content: { type: SchemaType.STRING },
                            location: {
                                type: SchemaType.ARRAY,
                                items: { type: SchemaType.NUMBER },
                                nullable: true
                            },
                            summary: { type: SchemaType.STRING }
                        },
                        required: ['title', 'content', 'location', 'summary']
                    }
                }
            }
        });

        // Chat model with different schema
        this.chatModel = this.genAI.getGenerativeModel({
            model: 'gemini-2.5-flash-lite',
            generationConfig: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        answer: { type: SchemaType.STRING },
                        references: {
                            type: SchemaType.ARRAY,
                            items: { type: SchemaType.STRING }
                        },
                        suggestedDateRange: {
                            type: SchemaType.OBJECT,
                            properties: {
                                startDate: { type: SchemaType.STRING },
                                endDate: { type: SchemaType.STRING },
                                reason: { type: SchemaType.STRING }
                            },
                            nullable: true
                        }
                    },
                    required: ['answer', 'references']
                }
            }
        });
    }

    private makePrompt(meetingMinutes: string): string {
        return `
        You are a smart summarization program for council meeting decisions. Extract all of the meeting decisions given the council meeting minutes as plain text and output a JSON containing the decisions formatted as described below.

        Format to write the JSON in:
        {
            "title": string,
            "content": string,
            "location": [number, number] | null,
            "summary": string
        }

        The title must be understandable in layman language. The location, if it exists, must be included as a latitude and a longitude.

        IMPORTANT INSTRUCTIONS:
        1. The title must be understandable in layman language.
        2. The location field should contain [latitude, longitude] coordinates if the decision mentions a specific address, street, intersection, park, building, or neighborhood in Vancouver, BC, Canada.
        3. Look for addresses like "5238 Granville Street", "West 37th Avenue", "1495 West 37th Avenue", street intersections, park names, or specific locations.
        4. Use your knowledge to geocode Vancouver addresses to approximate lat/lng coordinates. Vancouver is centered around [49.2827, -123.1207].
        5. If no specific location is mentioned, set location to null.
        6. For rezoning, development, or construction decisions, extract the address from the decision text.

        For example, given the following text:
        THAT Council authorize City staff to negotiate to the satisfaction of the City's
        Chief Human Resources Officer, City's Director of Legal Services, and the City's
        Chief Procurement Officer and enter into a contract with Homewood Health Inc.
        ("HHI") under which HHI will provide Employee and Family Assistance Plan
        services for an initial term of (3) three-years with an estimated contract value of
        $1,122,076 plus applicable taxes, with the option to extend for (6) six additional
        (1) one- year terms, with an estimated contract value of $3,570,983, plus
        applicable taxes over the entire term of the contract to be funded through the
        operating budget

        You would output:
        {
            "title": "Decision on the contract with Homewood Health Inc.",
            "content": "THAT Council authorize City staff to negotiate to the satisfaction of the City's
        Chief Human Resources Officer, City's Director of Legal Services, and the City's
        Chief Procurement Officer and enter into a contract with Homewood Health Inc.
        ("HHI") under which HHI will provide Employee and Family Assistance Plan
        services for an initial term of (3) three-years with an estimated contract value of
        $1,122,076 plus applicable taxes, with the option to extend for (6) six additional
        (1) one- year terms, with an estimated contract value of $3,570,983, plus
        applicable taxes over the entire term of the contract to be funded through the
        operating budget",
            "location": null,
            "summary": "The City Council is going to start negotiations for a multi-year contract with Homewood Health Inc. to provide Employee and Family Assistance Plan services, with options to extend, funded through the city's operating budget."
        }

        Extract all of the meeting decisions in the following text:
        ${meetingMinutes}
    `;
    }

    async extractMeetingDecisions(meetingMinutes: string): Promise<MeetingDecision[]> {
        if (!meetingMinutes || typeof meetingMinutes !== 'string' || meetingMinutes.trim() === '') {
            throw new Error('Please provide valid meeting minutes text');
        }

        const prompt = this.makePrompt(meetingMinutes);
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Parse the JSON response
        const decisions: MeetingDecision[] = JSON.parse(text);
        return decisions;
    }

    private makeChatPrompt(
        message: string, 
        decisions: DecisionContext[], 
        difficultyLevel: 'simple' | 'detailed' = 'simple',
        currentDateRange?: DateRangeContext
    ): string {
        const decisionsContext = decisions.length > 0 
            ? decisions.map(d => 
                `[ID: ${d.decisionId}] "${d.title}" (${d.meetingType}, ${d.meetingDate}): ${d.summary}`
              ).join('\n')
            : 'No decisions are currently loaded.';

        const dateRangeInfo = currentDateRange?.startDate && currentDateRange?.endDate
            ? `The user is currently viewing decisions from ${currentDateRange.startDate} to ${currentDateRange.endDate}.`
            : 'No specific date range is currently selected.';

        const languageGuidance = difficultyLevel === 'simple'
            ? `Use simple, everyday language that a 5th grader could understand. Avoid technical jargon, legal terms, and bureaucratic language. Use short sentences and common words.`
            : `Use precise, technical language with proper terminology. Include relevant legal, administrative, and procedural details. Be thorough and accurate in your explanations.`;

        const explanationStyle = difficultyLevel === 'simple'
            ? `Focus on practical, real-world impacts. Explain "what this means for you" in concrete terms - how it affects daily life, neighborhoods, services, or local areas.`
            : `Provide comprehensive analysis including policy implications, procedural context, and detailed administrative impacts. Include specific regulations, bylaws, and technical specifications where relevant.`;

        return `
You are a helpful AI assistant for a Vancouver city council decisions app. Your purpose is to make complicated council data accessible to the public by explaining decisions in terms of their EFFECTS on local residents and communities.

CURRENT CONTEXT:
${dateRangeInfo}

AVAILABLE DECISIONS:
${decisionsContext}

USER QUESTION: ${message}

COMMUNICATION STYLE (${difficultyLevel.toUpperCase()} MODE):
${languageGuidance}

EXPLANATION APPROACH:
${explanationStyle}

CORE INSTRUCTIONS:
1. **Effect-Based Explanations**: Always explain decisions in terms of their impact on people, neighborhoods, and daily life. Instead of "The council approved X", say "This means your neighborhood will..." or "Residents can expect..."

2. **User-Centric Language**: Frame everything from the perspective of how it affects the user. Use "you", "your neighborhood", "local residents", etc.

3. **Practical Impact**: Focus on tangible outcomes - what changes, what stays the same, what people need to know or do.

4. **References**: In the "references" array, include the decision IDs (e.g., "1-0", "2-1") of any decisions you mention or that are relevant to your answer.

5. **Date Range Detection**: If the user asks about a time period different from the current date range (e.g., "last month", "this year", "recent decisions", specific dates), provide a "suggestedDateRange" with:
   - startDate: ISO date string (YYYY-MM-DD)
   - endDate: ISO date string (YYYY-MM-DD)
   - reason: Brief, friendly message like "Would you like me to search for council decisions?" (do NOT mention specific dates in the reason)

6. **No Data Handling**: IMPORTANT - If no decisions are currently loaded (the AVAILABLE DECISIONS says "No decisions are currently loaded"), you MUST:
   - In your answer, politely explain that no decisions are loaded yet and ask if they'd like you to search
   - ALWAYS provide a "suggestedDateRange" with today's date as endDate and a reasonable past date as startDate (e.g., 30 days ago)
   - Keep the reason generic like "Would you like me to search for recent council decisions?" without mentioning specific dates

7. **Markdown Formatting**: Use proper markdown syntax (**bold**, *italic*, lists, etc.) to make your response clear and scannable.

EXAMPLES OF EFFECT-BASED LANGUAGE:
❌ Bad: "Council approved a rezoning application for 123 Main Street"
✅ Good: "A new apartment building will be built at 123 Main Street, bringing more housing to your neighborhood"

❌ Bad: "The council passed a bylaw amendment regarding parking regulations"
✅ Good: "Parking rules in downtown will change - you'll now be able to park for 2 hours instead of 1 hour"

Respond with JSON containing:
- "answer": Your helpful, effect-based response (formatted with markdown)
- "references": Array of decision IDs that are relevant to your answer
- "suggestedDateRange": (REQUIRED when no data is loaded, optional otherwise) Object with startDate, endDate, and reason

EXAMPLE when no decisions are loaded:
{
  "answer": "I don't have any council decisions loaded yet to tell you about their effects on your neighborhood. Would you like me to search for some decisions?",
  "references": [],
  "suggestedDateRange": {
    "startDate": "2025-12-18",
    "endDate": "2026-01-17",
    "reason": "Would you like me to search for recent council decisions?"
  }
}
`;
    }

    async chatWithDecisions(
        message: string, 
        decisions: DecisionContext[], 
        difficultyLevel: 'simple' | 'detailed' = 'simple',
        currentDateRange?: DateRangeContext
    ): Promise<ChatResponse> {
        if (!message || typeof message !== 'string' || message.trim() === '') {
            throw new Error('Please provide a valid message');
        }

        const prompt = this.makeChatPrompt(message, decisions, difficultyLevel, currentDateRange);
        const result = await this.chatModel.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const chatResponse: ChatResponse = JSON.parse(text);
        return chatResponse;
    }
}
