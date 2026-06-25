import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

let useMockDb = false;

export const connectDB = async () => {
  try {
    mongoose.set('strictQuery', false);
    // Connect to MongoDB with a 2 second timeout
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/srimaan_solar', {
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
