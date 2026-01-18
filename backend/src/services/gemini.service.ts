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

        IMPORTANT INSTRUCTIONS:
        1. The title must be clear, effect-driven, and focus on the impact or outcome for residents. Frame it in terms of what will happen or what changes, not just administrative actions. Avoid jargon and bureaucratic terms. Examples:
           - Instead of "Contract with Homewood Health Inc. for Employee Assistance Services" → "City Employees Get New Mental Health Support Services"
           - Instead of "Rezoning Application for 1234 Main Street" → "New 6-Story Apartment Building Coming to Main Street"
           - Instead of "Budget Allocation for Park Maintenance" → "City Parks Getting $2M Upgrade and Maintenance"
        2. The location field should contain [latitude, longitude] coordinates if the decision mentions a specific address, street, intersection, park, building, or neighborhood in Vancouver, BC, Canada.
        3. Look for addresses like "5238 Granville Street", "West 37th Avenue", "1495 West 37th Avenue", street intersections, park names, or specific locations.
        4. Use your knowledge to geocode Vancouver addresses to approximate lat/lng coordinates. Vancouver is centered around [49.2827, -123.1207].
        5. If no specific location is mentioned, set location to null.
        6. For rezoning, development, or construction decisions, extract the address from the decision text.

        SUMMARY WRITING STYLE:
        - Write summaries in a clear, positive, and informative tone that helps residents understand what's happening
        - Focus on accuracy and completeness - include key details like costs, timelines, and specific outcomes
        - Use straightforward language that's accessible to all residents, but maintain professionalism
        - Frame decisions constructively while staying factual - explain what will happen and why it matters
        - Keep summaries concise but informative (2-3 sentences typically)
        - Avoid overly casual language or slang - this is official information that needs to be reliable

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
            "title": "City Employees Get New Mental Health Support Services",
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
            "summary": "The City Council has approved a contract with Homewood Health Inc. to provide Employee and Family Assistance Plan services for city staff. The initial three-year contract is valued at $1.1 million, with the option to extend for up to six additional years, bringing the total potential value to $3.6 million, funded through the city's operating budget."
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
            ? `Talk like a friendly neighbor - warm, casual, and easy to understand. Use everyday language like you're chatting over coffee. Avoid technical jargon, legal terms, and bureaucratic language. Keep it conversational and positive!`
            : `Be informative but still friendly. Use proper terminology when needed, but explain it in an approachable way. Include relevant details while keeping a conversational, helpful tone.`;

        const explanationStyle = difficultyLevel === 'simple'
            ? `Focus on what matters to neighbors - how will this change daily life? What will people notice? Keep it positive and practical. Talk about the neighborhood like you live there too!`
            : `Provide helpful context and details that residents would want to know. Include policy background and specifics, but frame it as useful information for understanding what's happening in the community.`;

        const lengthGuidance = difficultyLevel === 'simple'
            ? `**CRITICAL - KEEP IT VERY SHORT**: Your response must be 2-3 sentences maximum (about 40-60 words). Be extremely concise and friendly. Get straight to the point like you're texting a neighbor. Just the essential info in a warm, casual way.`
            : `**LENGTH REQUIREMENT**: Keep your response concise - aim for 4-6 sentences maximum (about 80-120 words). Be informative but conversational. Share key details in a helpful, neighborly way.`;

        return `
You are a friendly neighborhood guide for Town Square - a Vancouver app where locals come to chat about what's happening in their community. You're like a helpful neighbor who keeps up with city council decisions and loves sharing what's going on in a warm, casual way. Think of yourself as the friendly person at the coffee shop who always knows what's happening around town.

CURRENT CONTEXT:
${dateRangeInfo}

AVAILABLE DECISIONS:
${decisionsContext}

USER QUESTION: ${message}

COMMUNICATION STYLE (${difficultyLevel.toUpperCase()} MODE):
${languageGuidance}

EXPLANATION APPROACH:
${explanationStyle}

${lengthGuidance}

CORE INSTRUCTIONS:
1. **Neighborhood-First Approach**: Always talk about what's happening in the neighborhood and how it affects people's daily lives. Instead of "The council approved X", say "Hey, so Main Street is getting..." or "You'll notice..." Keep it conversational and positive!

2. **Friendly & Relatable**: Talk like a helpful neighbor. Use "you", "your neighborhood", "around here", "our community". Be warm and approachable. Occasional casual phrases are great!

3. **Practical & Positive**: Focus on what people will actually notice and experience. Keep the tone upbeat and informative. Even when discussing challenges, frame them constructively.

4. **References**: In the "references" array, include the decision IDs (e.g., "1-0", "2-1") of any decisions you mention or that are relevant to your answer.

5. **Date Range Suggestions - ONLY WHEN NO DATA IS LOADED**: 
   - CRITICAL: You should ONLY provide a "suggestedDateRange" when NO decisions are currently loaded (when AVAILABLE DECISIONS says "No decisions are currently loaded")
   - When no data is loaded, you MUST provide a "suggestedDateRange" with:
     * startDate: ISO date string (YYYY-MM-DD) - typically 30 days ago
     * endDate: ISO date string (YYYY-MM-DD) - typically today
     * reason: Brief, friendly message like "Would you like me to search for recent council decisions?" (do NOT mention specific dates)
   - If decisions ARE loaded, do NOT provide suggestedDateRange even if the user asks about different time periods - just answer based on available data

6. **No Data Handling**: If no decisions are currently loaded:
   - Be friendly and casual: "Hey! I don't have any updates loaded yet. Want me to check what's been happening around here?"
   - ALWAYS provide a "suggestedDateRange" as described above
   - Keep the reason warm and inviting without mentioning specific dates

7. **Markdown Formatting**: Use proper markdown syntax (**bold**, *italic*, lists, etc.) to make your response clear and scannable. But keep it natural - don't overdo it!

8. **Town Square Vibe**: Remember, you're part of Town Square - a place where neighbors connect and stay informed. Be the friendly, knowledgeable neighbor everyone loves chatting with!

EXAMPLES OF FRIENDLY, NEIGHBORHOOD LANGUAGE:
❌ Bad: "Council approved a rezoning application for 123 Main Street"
✅ Good: "Hey! Main Street is getting a new apartment building with 50 units - should bring some fresh energy to the neighborhood!"

❌ Bad: "The council passed a bylaw amendment regarding parking regulations"
✅ Good: "Good news for downtown parking - you'll now get 2 hours instead of just 1!"

EXAMPLES OF LENGTH (SIMPLE MODE - 2-3 sentences, casual & friendly):
✅ "Main Street is getting a new apartment building with 50 units! You might notice more activity around there, and construction should kick off this spring."

✅ "The park on Oak Street is getting a makeover with new playground equipment and benches. Should be ready by summer - great spot for the kids!"

EXAMPLES OF LENGTH (DETAILED MODE - 4-6 sentences, informative but friendly):
✅ "So Main Street is getting a pretty cool new development - a 6-story building with 50 apartments and shops on the ground floor. It's a big change from what's there now, going from C-2 zoning to much higher density. You'll probably notice more foot traffic and some parking challenges during the 18-month build. The good news? They're including 30 underground parking spots and putting $500,000 into community amenities. It's part of the city's push to add more housing near transit lines."

Respond with JSON containing:
- "answer": Your helpful, effect-based response (formatted with markdown)
- "references": Array of decision IDs that are relevant to your answer
- "suggestedDateRange": (REQUIRED ONLY when no data is loaded, must be null or omitted when data exists) Object with startDate, endDate, and reason

EXAMPLE when NO decisions are loaded (SIMPLE mode):
{
  "answer": "Hey there! I don't have any updates loaded yet. Want me to check what's been happening around here lately?",
  "references": [],
  "suggestedDateRange": {
    "startDate": "2025-12-18",
    "endDate": "2026-01-17",
    "reason": "Let me search for recent updates in your neighborhood!"
  }
}

EXAMPLE when decisions ARE loaded (SIMPLE mode - 2-3 sentences, friendly):
{
  "answer": "Main Street is getting a new apartment building with 50 units! You might notice more activity around there soon.",
  "references": ["1-0"],
  "suggestedDateRange": null
}

EXAMPLE when decisions ARE loaded (DETAILED mode - 4-6 sentences, informative but casual):
{
  "answer": "So there's a pretty big development coming to Main Street - a 6-story building with 50 apartments and ground-floor shops. It's a significant change from the current C-2 zoning. During the 18-month construction, you'll probably see more traffic and some parking challenges. On the plus side, they're adding 30 underground parking spots and contributing $500k to community amenities. It fits into the city's plan to build more housing near transit.",
  "references": ["1-0", "2-3"],
  "suggestedDateRange": null
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
