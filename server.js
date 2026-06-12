/**
 * AgenticSDLC Backend Server
 *
 * Main Express server for handling workflow API requests
 */

// Load env FIRST — must be before any other import that reads process.env
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import workflowRoutes from './routes/workflow.routes.js';
import repositoryRoutes from './routes/repository.routes.js';
import executionRoutes from './routes/execution.routes.js';
import { environment } from './config/database.config.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    environment: environment,
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/workflows', workflowRoutes);
app.use('/api/workflows/:id', executionRoutes);
app.use('/api/repositories', repositoryRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════╗');
  console.log('║   AgenticSDLC Backend Server Started   ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('');
  console.log(`🚀 Server running on: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${environment}`);
  console.log(`📡 API endpoint: http://localhost:${PORT}/api/workflows`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
  console.log('');
  console.log('Press Ctrl+C to stop the server');
  console.log('');
});

export default app;
