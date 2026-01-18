import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import type { MeetingDecision, DecisionContext, ChatResponse } from '../types/gemini.js';

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

    private makeChatPrompt(message: string, decisions: DecisionContext[]): string {
        const decisionsContext = decisions.map(d => 
            `[ID: ${d.decisionId}] "${d.title}" (${d.meetingType}, ${d.meetingDate}): ${d.summary}`
        ).join('\n');

        return `
You are a helpful AI assistant for a Vancouver city council decisions app. You help users understand council meeting decisions.

Here are the currently displayed decisions that the user can see:
${decisionsContext}

USER QUESTION: ${message}

INSTRUCTIONS:
1. Answer the user's question based on the decisions provided above.
2. Be helpful, concise, and informative.
3. If the question is about decisions affecting a specific area or topic, identify relevant decisions from the list.
4. In the "references" array, include the decision IDs (e.g., "1-0", "2-1") of any decisions you mention or that are relevant to your answer.
5. If no decisions are relevant, provide a helpful response and leave references empty.
6. Keep your answer focused and easy to understand for regular citizens.
7. Format your answer using proper markdown syntax (use **bold**, *italic*, lists, etc. where appropriate).
8. Use markdown formatting to make your response clear and readable.

Respond with JSON containing:
- "answer": Your helpful response to the user (formatted with markdown)
- "references": Array of decision IDs that are relevant to your answer
`;
    }

    async chatWithDecisions(message: string, decisions: DecisionContext[]): Promise<ChatResponse> {
        if (!message || typeof message !== 'string' || message.trim() === '') {
            throw new Error('Please provide a valid message');
        }

        const prompt = this.makeChatPrompt(message, decisions);
        const result = await this.chatModel.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const chatResponse: ChatResponse = JSON.parse(text);
        return chatResponse;
    }
}
