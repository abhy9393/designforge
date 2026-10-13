import mongoose from 'mongoose';
import { env } from './env.js';

export const memoryStore = {
  users: [] as any[],
  problems: [] as any[],
  attempts: [] as any[],
  evaluations: [] as any[],
};

export let dbMode: 'mongo' | 'memory' = 'mongo';

export async function connectDatabase(uri = env.MONGO_URI) {
  if (!uri) {
    dbMode = 'memory';
    console.warn('MONGO_URI not configured. Using in-memory fallback store. Configure MongoDB for production use.');
    return;
  }

  try {
    await mongoose.connect(uri);
    dbMode = 'mongo';
    console.log('Connected to MongoDB');
  } catch (error) {
    dbMode = 'memory';
    console.warn('MongoDB connection failed. Falling back to in-memory store.', error);
  }
}

export function isMemoryMode() {
  return dbMode === 'memory';
}
