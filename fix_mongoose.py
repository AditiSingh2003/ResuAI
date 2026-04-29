files = {
"lib/mongoose.js": '''\
import mongoose from "mongoose";

let cached = global.mongoose || { conn: null, promise: null };
global.mongoose = cached;

export async function connectDB() {
  if (cached.conn) return cached.conn;

  let uri = process.env.MONGODB_URI;

  // In development, use in-memory MongoDB if Atlas is unreachable
  if (process.env.NODE_ENV !== "production" && !process.env.MONGODB_URI) {
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    if (!global.__mongoServer) {
      global.__mongoServer = await MongoMemoryServer.create();
    }
    uri = global.__mongoServer.getUri();
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, { bufferCommands: false });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
'''
}

import os
for path, content in files.items():
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Written: {path}")
print("Done!")