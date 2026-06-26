import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { connectDB, getDbMode } from './config/db.js';
import { seedMongooseDB } from './models/dbClient.js';

import authRoutes from './routes/authRoutes.js';
import agentRoutes from './routes/agentRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';

// Load Env variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize DB Connection asynchronously (non-blocking for serverless cold start)
connectDB().then(() => {
  if (!getDbMode()) {
    return seedMongooseDB();
  } else {
    console.log('Using Local File Mock Database. Seeding is managed automatically.');
  }
}).catch(err => {
  console.error('DB Connection/Seeding Error:', err);
});

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded documents statically
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);

// Base route for API check
app.get('/', (req, res) => {
  res.send('Srimaan Solar API is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? {} : err
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

export default app;

