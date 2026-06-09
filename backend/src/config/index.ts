import dotenv from "dotenv";
dotenv.config();

export const PORT: number =
  process.env.PORT ? parseInt(process.env.PORT) : 5000;

export const MONGODB_URI: string = (() => {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is not set in .env");
  return process.env.MONGO_URI;
})();

export const JWT_SECRET: string = (() => {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not set in .env");
  return process.env.JWT_SECRET;
})();