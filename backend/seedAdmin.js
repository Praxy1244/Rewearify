import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectDB } from "./src/config/db.js";
import User from "./src/models/User.js";

async function run() {
  await connectDB(process.env.MONGO_URI);
  const email = "admin@rewearify.com";
  const exists = await User.findOne({ email });
  if (exists) {
    console.log("Admin already exists");
    process.exit(0);
  }
  const hashed = await bcrypt.hash("admin123", 10);
  await User.create({
    name: "Platform Admin",
    email,
    password: hashed,
    role: "admin",
    location: "HQ",
    organization: "ReWearify"
  });
  console.log("✅ Admin created:", email, "password: admin123");
  process.exit(0);
}
run();
