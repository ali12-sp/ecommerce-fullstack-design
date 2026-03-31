require("dotenv").config();

const bcrypt = require("bcryptjs");
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

    const adminPassword = await bcrypt.hash("admin123", 10);
    const userPassword = await bcrypt.hash("user123", 10);

    await User.create({
      name: "Admin",
      email: "admin@brand.com",
      password: adminPassword,
      role: "admin"
    });

    await User.create({
      name: "Test User",
      email: "user@brand.com",
      password: userPassword,
      role: "user"
    });

    console.log(
      `Seed completed successfully with ${seedProducts.length} products, 2 users, CMS defaults, and cleared demo orders.`
    );
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
