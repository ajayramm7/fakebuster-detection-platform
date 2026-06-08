import mongoose from "mongoose";

export async function connectMongo() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.log("MongoDB not configured. Using in-memory history for local demo.");
    return false;
  }

  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected.");
    return true;
  } catch (error) {
    console.warn(`MongoDB connection failed. Using in-memory history. ${error.message}`);
    return false;
  }
}

export function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}
