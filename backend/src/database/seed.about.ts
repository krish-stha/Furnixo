import dotenv from "dotenv";
dotenv.config();
 
import mongoose from "mongoose";
import { AboutModel } from "../models/about.model";
 
async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI is not set in .env");
 
  await mongoose.connect(uri);
  console.log(`Seeding DB: ${mongoose.connection.host}/${mongoose.connection.name}`);
 
  const content = {
    heroTitle: "About Furnixo",
    heroDescription:
      "Furnixo is a furniture studio for contemporary homes — timeless silhouettes, honest materials, and fair prices. Every piece is chosen to be lived with for years, not seasons.",
 
    missionTitle: "Our Mission",
    missionBody:
      "To make well-crafted furniture accessible. We work directly with skilled makers, use materials that age gracefully — solid wood, real leather, durable fabrics — and keep our pricing honest, so a beautifully made home is within reach.",
    missionImage: "furnixo-mission.jpg",
 
    visionTitle: "Our Vision",
    visionBody:
      "A home in every city where traditional craft and modern design sit comfortably side by side. We want Furnixo pieces to be the ones you keep — repaired, re-covered, and passed on, never thrown away.",
    visionImage: "furnixo-vision.jpg",
 
    socials: [
      { label: "Facebook", url: "https://facebook.com/furnixo" },
      { label: "Instagram", url: "https://instagram.com/furnixo" },
      { label: "TikTok", url: "https://tiktok.com/@furnixo" },
    ],
 
    published: true,
  };
 
  const existing = await AboutModel.findOne({});
  if (existing) {
    await AboutModel.updateOne({ _id: existing._id }, { $set: content });
    console.log("✅ Updated existing About document with Furnixo content");
  } else {
    await AboutModel.create(content);
    console.log("✅ Created About document with Furnixo content");
  }
 
  await mongoose.disconnect();
  console.log("Done ✔");
}
 
run().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});