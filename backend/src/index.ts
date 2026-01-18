import dotenv from 'dotenv';
// Load environment variables immediately
dotenv.config();

// Debug log to verify loading
console.log('Environment loaded check: GEMINI_API_KEY is key present?', !!process.env.GEMINI_API_KEY);

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import meetingsRouter from './routes/meetings.js';
import geminiRouter from './routes/gemini.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Vite default port
  credentials: true
}));
app.use(express.json());

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', meetingsRouter);
app.use('/api/gemini', geminiRouter);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n=================================');
  console.log('Council Meetings Backend Server');
  console.log('=================================');
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API endpoint: http://localhost:${PORT}/api/meetings`);
  console.log(`Gemini endpoints: http://localhost:${PORT}/api/gemini/extract-decisions`);
  console.log(`                  http://localhost:${PORT}/api/gemini/chat`);
  console.log('=================================\n');
});
