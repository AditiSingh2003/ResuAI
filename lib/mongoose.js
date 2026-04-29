import mongoose from "mongoose";

let cached = global.mongoose || { conn: null, promise: null };
global.mongoose = cached;

export async function connectDB() {
  if (cached.conn) return cached.conn;

  let uri = process.env.MONGODB_URI;

  if (!uri) {
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    if (!global.__mongoServer) {
      global.__mongoServer = await MongoMemoryServer.create();
    }
    uri = global.__mongoServer.getUri();
    console.log("Using in-memory MongoDB for local dev");
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, { bufferCommands: false });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}