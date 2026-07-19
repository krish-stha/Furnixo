// Copies every collection from "furnixo" to "furnixo".
// Run once: npx ts-node src/database/migrate.to-furnixo.ts
import { MongoClient } from "mongodb";

async function run() {
  const client = new MongoClient("mongodb://localhost:27017");
  await client.connect();

  const src = client.db("furnixo");
  const dst = client.db("furnixo");

  const collections = await src.listCollections().toArray();
  for (const c of collections) {
    const docs = await src.collection(c.name).find().toArray();
    if (docs.length > 0) {
      await dst.collection(c.name).deleteMany({}); // idempotent re-runs
      await dst.collection(c.name).insertMany(docs);
    }
    console.log(`✅ ${c.name}: ${docs.length} docs copied`);
  }

  await client.close();
  console.log("Done ✔  Now set MONGO_URI to .../furnixo and restart the backend.");
}

run().catch((e) => {
  console.error("❌ Migration failed:", e);
  process.exit(1);
});