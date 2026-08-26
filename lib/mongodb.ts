import mongoose from "mongoose";

type MongooseCache = {
  connection: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalWithMongoose = global as typeof globalThis & { mongooseCache?: MongooseCache };
const cache = globalWithMongoose.mongooseCache || { connection: null, promise: null };
globalWithMongoose.mongooseCache = cache;

export function getMongoUri() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Copy .env.example to .env.local and add your MongoDB connection string.");
  }
  return uri;
}

export async function connectToDatabase() {
  const uri = getMongoUri();
  if (cache.connection) return cache.connection;
  if (!cache.promise) {
    cache.promise = mongoose.connect(uri, { bufferCommands: false });
  }
  cache.connection = await cache.promise;
  return cache.connection;
}
