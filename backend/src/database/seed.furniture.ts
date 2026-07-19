/**
 * Run from backend/:  npx ts-node src/database/seed.furniture.ts
 * Replaces seed-era categories/products with Furnixo furniture data.
 * Images: place files in backend/public/product_images/ with the names below,
 * or update the arrays to your real filenames.
 */
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") }); // always backend/.env, regardless of cwd
import mongoose from "mongoose";
import { CategoryModel } from "../models/category.model";
import { ProductModel } from "../models/product.model";
import { toSlug } from "../utils/slug";

const CATEGORIES = ["Chairs", "Armchairs", "Sofas", "Tables", "Cabinets", "Decor"];

const PRODUCTS = [
  { name: "Coffee Table",    cat: "Tables",    price: 150, color: "brown", material: "wood",        img: "coffee-table.jpg" },
  { name: "Papasan Chair",   cat: "Chairs",    price: 250, discountPrice: 210, color: "grey",  material: "fabric",  img: "papasan-chair.jpg" },
  { name: "Classic Chair",   cat: "Chairs",    price: 99,  color: "black", material: "wood",        img: "classic-chair.jpg" },
  
  { name: "Classic Armchair",cat: "Armchairs", price: 180, color: "grey",  material: "fabric",      img: "classic-armchair.jpg" },
  { name: "Bar Stool",       cat: "Chairs",    price: 250, color: "brown", material: "wood",        img: "bar-stool.jpg" },
  { name: "Nightstand",      cat: "Cabinets",  price: 80,  color: "white", material: "wood",        img: "nightstand.jpg" },
  { name: "White Table",     cat: "Tables",    price: 250, color: "white", material: "marble",      img: "white-table.jpg" },
  { name: "Egg Chair",       cat: "Armchairs", price: 280, color: "black", material: "leather",     img: "egg-chair.jpg" },
  { name: "Modern Armchair", cat: "Armchairs", price: 230, isNewArrival: true, color: "black", material: "metal",  img: "modern-armchair.jpg" },
  { name: "Chaise Lounge",   cat: "Sofas",     price: 450, isNewArrival: true, color: "grey", material: "leatherette", img: "chaise-lounge.jpg" },
  { name: "Modern Bed",      cat: "Decor",     price: 680, color: "brown", material: "wood",        img: "modern-bed.jpg" },
  { name: "Folding Table",   cat: "Tables",    price: 160, discountPrice: 130, color: "black", material: "metal", img: "folding-table.jpg" },
];

async function run() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI missing from .env");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Seeding DB:", mongoose.connection.host, "/", mongoose.connection.name);

  // 1) wipe old domain data (products + categories only — users/orders untouched)
  await ProductModel.deleteMany({});
  await CategoryModel.deleteMany({});
  console.log("Old products & categories removed");

  // 2) categories
  const catMap = new Map<string, mongoose.Types.ObjectId>();
  for (const name of CATEGORIES) {
    const c = await CategoryModel.create({ name, slug: toSlug(name) });
    catMap.set(name, c._id as mongoose.Types.ObjectId);
  }
  console.log(`Seeded ${CATEGORIES.length} categories`);

  // 3) products
  for (const [i, p] of PRODUCTS.entries()) {
    await ProductModel.create({
      name: p.name,
      slug: toSlug(p.name),
      sku: `FRX-${String(i + 1).padStart(4, "0")}`,
      description: `${p.name} — crafted in ${p.material}, finished in ${p.color}.`,
      price: p.price,
      discountPrice: p.discountPrice ?? null,
      stock: 25,
      images: [p.img],
      category: catMap.get(p.cat),
      color: p.color,
      material: p.material,
      isNewArrival: p.isNewArrival ?? false,
      status: "active",
    });
  }
  console.log(`Seeded ${PRODUCTS.length} products`);

  await mongoose.disconnect();
  console.log("Done ✔");
}

run().catch((e) => { console.error(e); process.exit(1); });