    import dotenv from "dotenv";
    import path from "path";
    dotenv.config({ path: path.resolve(__dirname, "../../.env") });

    import mongoose from "mongoose";
    import { SettingsModel } from "../models/settings.model";

    async function run() {
      if (!process.env.MONGO_URI) throw new Error("MONGO_URI missing from .env");
      await mongoose.connect(process.env.MONGO_URI);
      console.log("Seeding DB:", mongoose.connection.host, "/", mongoose.connection.name);

      const updated = await SettingsModel.findOneAndUpdate(
        {},
        {
          $set: {
            storeName: "Furnixo",
            storeLogo: "furnixo-logo.png",
            storeEmail: "support@furnixo.com",
            storeAddress: "Kathmandu, Nepal",
          },
        },
        { new: true, upsert: true }
      );

      console.log("Settings updated:", {
        storeName: updated.storeName,
        storeLogo: updated.storeLogo,
      });

      await mongoose.disconnect();
      console.log("Done ✔");
    }

    run().catch((e) => { console.error(e); process.exit(1); });