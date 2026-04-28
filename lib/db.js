import mongoose from "mongoose";

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  console.log("ENV CHECK:", uri);

  if (!uri) {
    throw new Error("❌ MONGODB_URI is missing in environment variables");
  }

  if (mongoose.connections[0].readyState) return;

  await mongoose.connect(uri);
};

export default connectDB;
