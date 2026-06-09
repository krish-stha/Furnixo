import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "./app";
import { verifyEmailTransport } from "./services/mail.service";

dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/furnixo";

async function startServer() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected");

    await verifyEmailTransport();

    app.listen(Number(PORT), "0.0.0.0", () => {
      console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server start error:", error);
    process.exit(1);
  }
}

startServer();