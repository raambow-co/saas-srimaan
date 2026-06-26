import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

let useMockDb = false;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true' || process.env.NOW_BUILDER === '1';
  const isLocalhost = !uri || uri.includes('localhost') || uri.includes('127.0.0.1');

  if (isVercel && isLocalhost) {
    console.log('ℹ️ Running on Vercel without a remote MongoDB URI. Falling back to Local JSON Database immediately.');
    useMockDb = true;
    return;
  }

  try {
    mongoose.set('strictQuery', false);
    // Connect to MongoDB with a 2 second timeout
    const conn = await mongoose.connect(uri || 'mongodb://localhost:27017/srimaan_solar', {
      serverSelectionTimeoutMS: 2000
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    useMockDb = false;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.log('⚠️  Falling back to Local JSON File Database storage under backend/data/...');
    useMockDb = true;
  }
};

export const getDbMode = () => useMockDb;
export const setDbMode = (val) => { useMockDb = val; };
