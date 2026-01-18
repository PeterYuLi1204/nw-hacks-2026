import express, { Request, Response } from 'express';
import { GeminiService } from '../services/gemini.service.js';
import type { PromptRequest, ChatRequest } from '../types/gemini.js';

const router = express.Router();

// Initialize Gemini service lazily
let geminiService: GeminiService | null = null;

const getGeminiService = () => {
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

// POST endpoint to process meeting minutes with Gemini
router.post('/extract-decisions', async (req: Request, res: Response) => {
    try {
        const { prompt } = req.body as PromptRequest;

        // Validate prompt
        if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
            return res.status(400).json({
                error: 'Invalid request',
                message: 'Please provide a valid prompt string in the request body'
            });
        }

        // Check if Gemini service is initialized
        const service = getGeminiService();
        if (!service) {
            return res.status(500).json({
                error: 'Server configuration error',
                message: 'GEMINI_API_KEY is not configured'
            });
        }

        // Extract meeting decisions
        const decisions = await service.extractMeetingDecisions(prompt);

        // Return the extracted decisions
        res.json({
            success: true,
            decisions
        });

    } catch (error) {
        console.error('Error processing prompt:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to process the meeting minutes with Gemini API',
            details: errorMessage
        });
    }
});

// POST endpoint for AI chat with decisions context
router.post('/chat', async (req: Request, res: Response) => {
    try {
        const { message, decisions } = req.body as ChatRequest;

        // Validate message
        if (!message || typeof message !== 'string' || message.trim() === '') {
            return res.status(400).json({
                error: 'Invalid request',
                message: 'Please provide a valid message string in the request body'
            });
        }

        // Validate decisions array
        if (!Array.isArray(decisions)) {
            return res.status(400).json({
                error: 'Invalid request',
                message: 'Please provide a decisions array in the request body'
            });
        }

        // Check if Gemini service is initialized
        const service = getGeminiService();
        if (!service) {
            return res.status(500).json({
                error: 'Server configuration error',
                message: 'GEMINI_API_KEY is not configured'
            });
        }

        // Get chat response
        const chatResponse = await service.chatWithDecisions(message, decisions);

        // Return the response
        res.json({
            success: true,
            ...chatResponse
        });

    } catch (error) {
        console.error('Error processing chat:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to process chat with Gemini API',
            details: errorMessage
        });
    }
});

export default router;
