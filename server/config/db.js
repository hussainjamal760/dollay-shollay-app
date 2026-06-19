const mongoose = require('mongoose');

// Global cache for serverless environments (Vercel)
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    console.log('Using cached MongoDB connection');
    return cached.conn;
  }

  if (!cached.promise) {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri) {
      throw new Error("MongoDB URI is not defined in Environment Variables");
    }

    console.log('Establishing new MongoDB connection...');
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false, // Prevent hanging
      serverSelectionTimeoutMS: 5000, // Fail fast if no connection
    }).then((mongoose) => {
      console.log('MongoDB connected successfully');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    console.error('MongoDB connection error:', error.message);
    throw error;
  }

  return cached.conn;
};

module.exports = connectDB;
