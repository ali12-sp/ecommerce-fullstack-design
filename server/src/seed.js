require("dotenv").config();

const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const mongoose = require("mongoose");
const connectDb = require("./config/db");
const Order = require("./models/Order");
const Product = require("./models/Product");
const User = require("./models/User");
const SiteSettings = require("./models/SiteSettings");
const ContentPage = require("./models/ContentPage");
const BlogPost = require("./models/BlogPost");
const seedProducts = require("./data/seedProducts");
const {
  defaultSiteSettings,
  defaultContentPages,
  defaultBlogPosts
} = require("./data/cmsDefaults");

function getSeedValue(name, fallback = "") {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function generatePassword() {
  return crypto.randomBytes(12).toString("base64url");
}

async function runSeed() {
  try {
    await connectDb();

    await Promise.all([
      Order.deleteMany({}),
      Product.deleteMany({}),
      User.deleteMany({}),
      SiteSettings.deleteMany({}),
      ContentPage.deleteMany({}),
      BlogPost.deleteMany({})
    ]);

    await Product.insertMany(seedProducts);
    await SiteSettings.create(defaultSiteSettings);
    await ContentPage.insertMany(defaultContentPages);
    await BlogPost.insertMany(defaultBlogPosts);

    const adminEmail = getSeedValue("SEED_ADMIN_EMAIL", "admin@brand.local");
    const userEmail = getSeedValue("SEED_USER_EMAIL", "user@brand.local");
    const adminPlainPassword = getSeedValue("SEED_ADMIN_PASSWORD", generatePassword());
    const userPlainPassword = getSeedValue("SEED_USER_PASSWORD", generatePassword());

    const adminPassword = await bcrypt.hash(adminPlainPassword, 10);
    const userPassword = await bcrypt.hash(userPlainPassword, 10);

    await User.create({
      name: "Admin",
      email: adminEmail,
      password: adminPassword,
      role: "admin"
    });

    await User.create({
      name: "Test User",
      email: userEmail,
      password: userPassword,
      role: "user"
    });

    console.log(
      `Seed completed successfully with ${seedProducts.length} products, 2 users, CMS defaults, and cleared demo orders.`
    );
    console.log("Seeded account credentials:");
    console.log(`Admin email: ${adminEmail}`);
    console.log(`Admin password: ${adminPlainPassword}`);
    console.log(`User email: ${userEmail}`);
    console.log(`User password: ${userPlainPassword}`);
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  }
}

runSeed();
