require("dotenv").config();

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const connectDb = require("./config/db");
const Product = require("./models/Product");
const User = require("./models/User");
const Order = require("./models/Order");
const SiteSettings = require("./models/SiteSettings");
const ContentPage = require("./models/ContentPage");
const BlogPost = require("./models/BlogPost");
const { authRequired, adminRequired } = require("./middleware/auth");
const {
  MAX_UPLOAD_SIZE_BYTES,
  parseBase64Image,
  buildUploadFileName
} = require("./utils/upload");
const {
  defaultSiteSettings,
  defaultContentPages,
  defaultBlogPosts
} = require("./data/cmsDefaults");

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;
const uploadsDir = path.join(__dirname, "..", "uploads");
const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set in server/.env");
}

fs.mkdirSync(uploadsDir, { recursive: true });

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: false
  })
);

app.use(express.json({ limit: "12mb" }));
app.use("/uploads", express.static(uploadsDir));

function roundCurrency(value) {
  return Math.round(value * 100) / 100;
}

function calculateOrderTotals(subtotal, couponCode = "") {
  const normalizedCoupon = couponCode.trim().toUpperCase();
  const discount = normalizedCoupon === "SAVE10" ? roundCurrency(subtotal * 0.1) : 0;
  const shippingFee = subtotal >= 100 ? 0 : subtotal > 0 ? 15 : 0;
  const tax = roundCurrency((subtotal - discount) * 0.08);
  const total = roundCurrency(subtotal - discount + shippingFee + tax);

  return {
    discount,
    shippingFee,
    tax,
    total,
    normalizedCoupon
  };
}

function buildOrderNumber() {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORD-${datePart}-${randomPart}`;
}

function createToken(user) {
  return jwt.sign(
    {
      id: user.id || user._id?.toString(),
      email: user.email,
      role: user.role,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function cleanString(value, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function slugify(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) {
    return tags
      .map((tag) => cleanString(tag))
      .filter(Boolean);
  }

  if (typeof tags === "string") {
    return tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
}

async function buildUniqueSlug(Model, rawValue, fallbackValue, excludeId) {
  const base = slugify(rawValue) || slugify(fallbackValue) || "item";
  let nextSlug = base;
  let counter = 2;

  while (
    await Model.findOne({
      slug: nextSlug,
      ...(excludeId ? { _id: { $ne: excludeId } } : {})
    })
  ) {
    nextSlug = `${base}-${counter}`;
    counter += 1;
  }

  return nextSlug;
}

function normalizeFooterLink(link) {
  const label = cleanString(link?.label);
  const type = cleanString(link?.type, "route");
  const value = cleanString(link?.value);

  if (!label) {
    return null;
  }

  return {
    label,
    type: ["route", "content", "blog_index", "blog_post", "external"].includes(type)
      ? type
      : "route",
    value,
    openInNewTab: Boolean(link?.openInNewTab)
  };
}

function normalizeHeroSlide(slide) {
  const eyebrow = cleanString(slide?.eyebrow);
  const title = cleanString(slide?.title);
  const description = cleanString(slide?.description);
  const image = cleanString(slide?.image);
  const ctaLabel = cleanString(slide?.ctaLabel);
  const ctaHref = cleanString(slide?.ctaHref);

  if (!eyebrow || !title || !description || !image || !ctaLabel || !ctaHref) {
    return null;
  }

  return {
    eyebrow,
    title,
    description,
    image,
    ctaLabel,
    ctaHref
  };
}

function normalizeCategoryHighlight(highlight) {
  const category = cleanString(highlight?.category);
  const image = cleanString(highlight?.image);

  if (!category || !image) {
    return null;
  }

  return {
    category,
    image
  };
}

function normalizeSiteSettingsPayload(payload = {}, fallback = defaultSiteSettings) {
  const fallbackSocialLinks = fallback.socialLinks || defaultSiteSettings.socialLinks;
  const fallbackAppBadges = fallback.appBadges || defaultSiteSettings.appBadges;
  const fallbackHeaderLinks = fallback.headerLinks || defaultSiteSettings.headerLinks;
  const fallbackHeroSlides = fallback.heroSlides || defaultSiteSettings.heroSlides;
  const fallbackCategoryHighlights =
    fallback.categoryHighlights || defaultSiteSettings.categoryHighlights;
  const fallbackServiceTileImages =
    fallback.serviceTileImages || defaultSiteSettings.serviceTileImages;
  const fallbackQuoteSectionImage =
    fallback.quoteSectionImage || defaultSiteSettings.quoteSectionImage;
  const fallbackFooterSections = fallback.footerSections || defaultSiteSettings.footerSections;

  const socialLinks = Array.isArray(payload.socialLinks)
    ? payload.socialLinks
        .map((link) => ({
          label: cleanString(link?.label),
          url: cleanString(link?.url)
        }))
        .filter((link) => link.label && link.url)
    : fallbackSocialLinks;

  const appBadges = Array.isArray(payload.appBadges)
    ? payload.appBadges
        .map((badge) => ({
          label: cleanString(badge?.label),
          subtitle: cleanString(badge?.subtitle),
          url: cleanString(badge?.url)
        }))
        .filter((badge) => badge.label && badge.subtitle && badge.url)
    : fallbackAppBadges;

  const footerSections = Array.isArray(payload.footerSections)
    ? payload.footerSections
        .map((section) => ({
          title: cleanString(section?.title),
          links: Array.isArray(section?.links)
            ? section.links.map(normalizeFooterLink).filter(Boolean)
            : []
        }))
        .filter((section) => section.title)
    : fallbackFooterSections;

  const headerLinks = Array.isArray(payload.headerLinks)
    ? payload.headerLinks.map(normalizeFooterLink).filter(Boolean)
    : fallbackHeaderLinks;

  const heroSlides = Array.isArray(payload.heroSlides)
    ? payload.heroSlides.map(normalizeHeroSlide).filter(Boolean)
    : fallbackHeroSlides;

  const categoryHighlights = Array.isArray(payload.categoryHighlights)
    ? payload.categoryHighlights.map(normalizeCategoryHighlight).filter(Boolean)
    : fallbackCategoryHighlights;

  const serviceTileImages = Array.isArray(payload.serviceTileImages)
    ? payload.serviceTileImages.map((image) => cleanString(image)).filter(Boolean)
    : fallbackServiceTileImages;

  const quoteSectionImage = cleanString(
    payload.quoteSectionImage,
    fallbackQuoteSectionImage
  );

  return {
    singletonKey: "site-settings",
    brandName: cleanString(payload.brandName, fallback.brandName),
    brandDescription: cleanString(payload.brandDescription, fallback.brandDescription),
    footerBottomText: cleanString(payload.footerBottomText, fallback.footerBottomText),
    localeLabel: cleanString(payload.localeLabel, fallback.localeLabel),
    socialLinks,
    appBadges,
    headerLinks,
    heroSlides,
    categoryHighlights,
    serviceTileImages,
    quoteSectionImage,
    footerSections
  };
}

async function ensureCmsDefaults() {
  await SiteSettings.findOneAndUpdate(
    { singletonKey: "site-settings" },
    { $setOnInsert: defaultSiteSettings },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  if ((await ContentPage.countDocuments()) === 0) {
    await ContentPage.insertMany(defaultContentPages);
  }

  if ((await BlogPost.countDocuments()) === 0) {
    await BlogPost.insertMany(defaultBlogPosts);
  }
}

app.get("/api/health", (_, res) => {
  res.json({ ok: true });
});

app.get("/api/site-settings", async (_, res) => {
  try {
    const siteSettings = await SiteSettings.findOne({ singletonKey: "site-settings" });
    return res.json(siteSettings ? siteSettings.toJSON() : defaultSiteSettings);
  } catch (error) {
    return res.status(500).send("Failed to fetch site settings");
  }
});

app.get("/api/content-pages", async (req, res) => {
  try {
    const limit = Math.max(0, Number(req.query.limit) || 0);
    const query = ContentPage.find({ status: "published" }).sort({ updatedAt: -1 });

    if (limit > 0) {
      query.limit(limit);
    }

    const pages = await query;
    return res.json(pages);
  } catch (error) {
    return res.status(500).send("Failed to fetch content pages");
  }
});

app.get("/api/content-pages/:slug", async (req, res) => {
  try {
    const page = await ContentPage.findOne({
      slug: req.params.slug,
      status: "published"
    });

    if (!page) {
      return res.status(404).send("Content page not found");
    }

    return res.json(page);
  } catch (error) {
    return res.status(500).send("Failed to fetch content page");
  }
});

app.get("/api/blog-posts", async (req, res) => {
  try {
    const limit = Math.max(0, Number(req.query.limit) || 0);
    const query = BlogPost.find({ status: "published" }).sort({ publishedAt: -1, createdAt: -1 });

    if (limit > 0) {
      query.limit(limit);
    }

    const posts = await query;
    return res.json(posts);
  } catch (error) {
    return res.status(500).send("Failed to fetch blog posts");
  }
});

app.get("/api/blog-posts/:slug", async (req, res) => {
  try {
    const post = await BlogPost.findOne({
      slug: req.params.slug,
      status: "published"
    });

    if (!post) {
      return res.status(404).send("Blog post not found");
    }

    return res.json(post);
  } catch (error) {
    return res.status(500).send("Failed to fetch blog post");
  }
});

app.get("/api/auth/me", authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).send("User not found");
    }

    return res.json(user.toJSON());
  } catch (error) {
    return res.status(500).send("Failed to fetch user");
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send("Email and password are required");
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(401).send("Invalid email or password");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).send("Invalid email or password");
    }

    const token = createToken(user);
    const safeUser = user.toJSON();

    return res.json({ token, user: safeUser });
  } catch (error) {
    return res.status(500).send("Login failed");
  }
});

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).send("Name, email and password are required");
    }

    if (password.length < 6) {
      return res.status(400).send("Password must be at least 6 characters");
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).send("Email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "user"
    });

    const token = createToken(user);
    const safeUser = user.toJSON();

    return res.status(201).json({ token, user: safeUser });
  } catch (error) {
    return res.status(500).send("Signup failed");
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const q = (req.query.q || "").toString().trim();
    const category = (req.query.category || "").toString().trim();

    const filter = {};

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } }
      ];
    }

    if (category) {
      filter.category = { $regex: `^${category}$`, $options: "i" };
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });
    return res.json(products);
  } catch (error) {
    return res.status(500).send("Failed to fetch products");
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).send("Product not found");
    }

    return res.json(product);
  } catch (error) {
    return res.status(404).send("Product not found");
  }
});

app.post("/api/uploads", authRequired, adminRequired, async (req, res) => {
  try {
    const { fileName, contentType, data } = req.body;

    if (!fileName || !contentType || !data) {
      return res.status(400).send("fileName, contentType and data are required");
    }

    const { buffer, extension } = parseBase64Image(data, contentType);
    const storedFileName = buildUploadFileName(fileName, extension);
    const storedFilePath = path.join(uploadsDir, storedFileName);

    await fs.promises.writeFile(storedFilePath, buffer);

    return res.status(201).json({
      imagePath: `/uploads/${storedFileName}`,
      imageUrl: `${req.protocol}://${req.get("host")}/uploads/${storedFileName}`,
      maxUploadSizeBytes: MAX_UPLOAD_SIZE_BYTES
    });
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .send(error.message || "Failed to upload image");
  }
});

app.put("/api/site-settings", authRequired, adminRequired, async (req, res) => {
  try {
    const currentSettings =
      (await SiteSettings.findOne({ singletonKey: "site-settings" })) || defaultSiteSettings;
    const normalizedSettings = normalizeSiteSettingsPayload(req.body, currentSettings);

    if (!normalizedSettings.brandName || !normalizedSettings.brandDescription) {
      return res.status(400).send("Brand name and brand description are required");
    }

    if (!normalizedSettings.footerBottomText || !normalizedSettings.localeLabel) {
      return res.status(400).send("Footer bottom text and locale label are required");
    }

    const updatedSettings = await SiteSettings.findOneAndUpdate(
      { singletonKey: "site-settings" },
      normalizedSettings,
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return res.json(updatedSettings);
  } catch (error) {
    return res.status(500).send("Failed to update site settings");
  }
});

app.get("/api/admin/content-pages", authRequired, adminRequired, async (_, res) => {
  try {
    const pages = await ContentPage.find().sort({ updatedAt: -1, createdAt: -1 });
    return res.json(pages);
  } catch (error) {
    return res.status(500).send("Failed to fetch admin content pages");
  }
});

app.post("/api/admin/content-pages", authRequired, adminRequired, async (req, res) => {
  try {
    const title = cleanString(req.body.title);
    const summary = cleanString(req.body.summary);
    const content = cleanString(req.body.content);
    const status = cleanString(req.body.status, "published");

    if (!title || !summary || !content) {
      return res.status(400).send("title, summary and content are required");
    }

    const slug = await buildUniqueSlug(ContentPage, req.body.slug, title);

    const page = await ContentPage.create({
      title,
      slug,
      summary,
      content,
      status: status === "draft" ? "draft" : "published"
    });

    return res.status(201).json(page);
  } catch (error) {
    return res.status(500).send("Failed to create content page");
  }
});

app.put("/api/admin/content-pages/:id", authRequired, adminRequired, async (req, res) => {
  try {
    const existingPage = await ContentPage.findById(req.params.id);

    if (!existingPage) {
      return res.status(404).send("Content page not found");
    }

    const title = cleanString(req.body.title, existingPage.title);
    const summary = cleanString(req.body.summary, existingPage.summary);
    const content = cleanString(req.body.content, existingPage.content);
    const status = cleanString(req.body.status, existingPage.status);
    const slug = await buildUniqueSlug(
      ContentPage,
      req.body.slug || existingPage.slug,
      title,
      existingPage.id
    );

    existingPage.title = title;
    existingPage.slug = slug;
    existingPage.summary = summary;
    existingPage.content = content;
    existingPage.status = status === "draft" ? "draft" : "published";
    await existingPage.save();

    return res.json(existingPage);
  } catch (error) {
    return res.status(500).send("Failed to update content page");
  }
});

app.delete("/api/admin/content-pages/:id", authRequired, adminRequired, async (req, res) => {
  try {
    const deletedPage = await ContentPage.findByIdAndDelete(req.params.id);

    if (!deletedPage) {
      return res.status(404).send("Content page not found");
    }

    const siteSettings = await SiteSettings.findOne({ singletonKey: "site-settings" });

    if (siteSettings) {
      siteSettings.footerSections = siteSettings.footerSections.map((section) => ({
        ...section.toObject(),
        links: section.links.filter(
          (link) => !(link.type === "content" && link.value === deletedPage.slug)
        )
      }));
      await siteSettings.save();
    }

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).send("Failed to delete content page");
  }
});

app.get("/api/admin/blog-posts", authRequired, adminRequired, async (_, res) => {
  try {
    const posts = await BlogPost.find().sort({ updatedAt: -1, publishedAt: -1 });
    return res.json(posts);
  } catch (error) {
    return res.status(500).send("Failed to fetch admin blog posts");
  }
});

app.post("/api/admin/blog-posts", authRequired, adminRequired, async (req, res) => {
  try {
    const title = cleanString(req.body.title);
    const excerpt = cleanString(req.body.excerpt);
    const content = cleanString(req.body.content);
    const coverImage = cleanString(req.body.coverImage, "/products/placeholder.svg");
    const status = cleanString(req.body.status, "published");
    const publishedAt = req.body.publishedAt ? new Date(req.body.publishedAt) : new Date();

    if (!title || !excerpt || !content) {
      return res.status(400).send("title, excerpt and content are required");
    }

    if (Number.isNaN(publishedAt.getTime())) {
      return res.status(400).send("publishedAt must be a valid date");
    }

    const slug = await buildUniqueSlug(BlogPost, req.body.slug, title);

    const post = await BlogPost.create({
      title,
      slug,
      excerpt,
      coverImage,
      content,
      tags: normalizeTags(req.body.tags),
      status: status === "draft" ? "draft" : "published",
      publishedAt
    });

    return res.status(201).json(post);
  } catch (error) {
    return res.status(500).send("Failed to create blog post");
  }
});

app.put("/api/admin/blog-posts/:id", authRequired, adminRequired, async (req, res) => {
  try {
    const existingPost = await BlogPost.findById(req.params.id);

    if (!existingPost) {
      return res.status(404).send("Blog post not found");
    }

    const title = cleanString(req.body.title, existingPost.title);
    const excerpt = cleanString(req.body.excerpt, existingPost.excerpt);
    const content = cleanString(req.body.content, existingPost.content);
    const coverImage = cleanString(req.body.coverImage, existingPost.coverImage);
    const status = cleanString(req.body.status, existingPost.status);
    const publishedAt = req.body.publishedAt
      ? new Date(req.body.publishedAt)
      : existingPost.publishedAt;

    if (Number.isNaN(new Date(publishedAt).getTime())) {
      return res.status(400).send("publishedAt must be a valid date");
    }

    const slug = await buildUniqueSlug(
      BlogPost,
      req.body.slug || existingPost.slug,
      title,
      existingPost.id
    );

    existingPost.title = title;
    existingPost.slug = slug;
    existingPost.excerpt = excerpt;
    existingPost.content = content;
    existingPost.coverImage = coverImage || "/products/placeholder.svg";
    existingPost.tags = normalizeTags(req.body.tags);
    existingPost.status = status === "draft" ? "draft" : "published";
    existingPost.publishedAt = publishedAt;
    await existingPost.save();

    return res.json(existingPost);
  } catch (error) {
    return res.status(500).send("Failed to update blog post");
  }
});

app.delete("/api/admin/blog-posts/:id", authRequired, adminRequired, async (req, res) => {
  try {
    const deletedPost = await BlogPost.findByIdAndDelete(req.params.id);

    if (!deletedPost) {
      return res.status(404).send("Blog post not found");
    }

    const siteSettings = await SiteSettings.findOne({ singletonKey: "site-settings" });

    if (siteSettings) {
      siteSettings.footerSections = siteSettings.footerSections.map((section) => ({
        ...section.toObject(),
        links: section.links.filter(
          (link) => !(link.type === "blog_post" && link.value === deletedPost.slug)
        )
      }));
      await siteSettings.save();
    }

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).send("Failed to delete blog post");
  }
});

app.get("/api/orders", authRequired, async (req, res) => {
  try {
    const filter = req.user.role === "admin" ? {} : { user: req.user.id };
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .populate("user", "name email role");

    return res.json(orders);
  } catch (error) {
    return res.status(500).send("Failed to fetch orders");
  }
});

app.post("/api/orders", authRequired, async (req, res) => {
  const reservedItems = [];

  try {
    const { items, shippingAddress, paymentMethod, notes, couponCode } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).send("At least one order item is required");
    }

    if (!shippingAddress) {
      return res.status(400).send("Shipping address is required");
    }

    const requiredAddressFields = [
      "fullName",
      "email",
      "phone",
      "addressLine1",
      "city",
      "country"
    ];

    for (const field of requiredAddressFields) {
      if (!shippingAddress[field] || !String(shippingAddress[field]).trim()) {
        return res.status(400).send(`Shipping field "${field}" is required`);
      }
    }

    const normalizedItems = items.reduce((accumulator, item) => {
      const productId = String(item.productId || "").trim();
      const quantity = Number(item.quantity);
      const existingItem = accumulator.find((entry) => entry.productId === productId);

      if (existingItem) {
        existingItem.quantity += quantity;
        return accumulator;
      }

      accumulator.push({ productId, quantity });
      return accumulator;
    }, []);

    if (
      normalizedItems.some(
        (item) =>
          !item.productId || !Number.isInteger(item.quantity) || item.quantity <= 0
      )
    ) {
      return res.status(400).send("Each order item must include a valid productId and quantity");
    }

    const productIds = normalizedItems.map((item) => item.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map((product) => [product.id, product]));

    if (products.length !== normalizedItems.length) {
      return res.status(400).send("One or more products could not be found");
    }

    const orderItems = normalizedItems.map((item) => {
      const product = productMap.get(item.productId);

      if (!product) {
        throw new Error("One or more products could not be found");
      }

      if (product.stock < item.quantity) {
        const error = new Error(`${product.name} does not have enough stock`);
        error.statusCode = 409;
        throw error;
      }

      return {
        product,
        quantity: item.quantity,
        lineTotal: roundCurrency(product.price * item.quantity)
      };
    });

    for (const item of orderItems) {
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: item.product.id, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );

      if (!updatedProduct) {
        const error = new Error(`${item.product.name} does not have enough stock`);
        error.statusCode = 409;
        throw error;
      }

      reservedItems.push({
        productId: item.product.id,
        quantity: item.quantity
      });
    }

    const subtotal = roundCurrency(
      orderItems.reduce((sum, item) => sum + item.lineTotal, 0)
    );
    const totals = calculateOrderTotals(subtotal, couponCode || "");

    const order = await Order.create({
      orderNumber: buildOrderNumber(),
      user: req.user.id,
      customerName: shippingAddress.fullName.trim(),
      customerEmail: shippingAddress.email.toLowerCase().trim(),
      items: orderItems.map((item) => ({
        product: item.product.id,
        productId: item.product.id,
        name: item.product.name,
        image: item.product.image,
        category: item.product.category,
        price: item.product.price,
        quantity: item.quantity,
        lineTotal: item.lineTotal
      })),
      itemCount: orderItems.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      discount: totals.discount,
      shippingFee: totals.shippingFee,
      tax: totals.tax,
      total: totals.total,
      couponCode: totals.normalizedCoupon,
      paymentMethod:
        paymentMethod && ["cash_on_delivery", "card", "bank_transfer"].includes(paymentMethod)
          ? paymentMethod
          : "cash_on_delivery",
      notes: notes ? String(notes).trim() : "",
      shippingAddress: {
        fullName: shippingAddress.fullName.trim(),
        email: shippingAddress.email.toLowerCase().trim(),
        phone: shippingAddress.phone.trim(),
        addressLine1: shippingAddress.addressLine1.trim(),
        addressLine2: shippingAddress.addressLine2
          ? String(shippingAddress.addressLine2).trim()
          : "",
        city: shippingAddress.city.trim(),
        state: shippingAddress.state ? String(shippingAddress.state).trim() : "",
        postalCode: shippingAddress.postalCode
          ? String(shippingAddress.postalCode).trim()
          : "",
        country: shippingAddress.country.trim()
      }
    });

    return res.status(201).json(order);
  } catch (error) {
    if (reservedItems.length > 0) {
      await Promise.all(
        reservedItems.map((item) =>
          Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } })
        )
      );
    }

    return res
      .status(error.statusCode || 500)
      .send(error.message || "Failed to create order");
  }
});

app.patch("/api/orders/:id/status", authRequired, adminRequired, async (req, res) => {
  try {
    const nextStatus = String(req.body.status || "").trim().toLowerCase();

    if (!ORDER_STATUSES.includes(nextStatus)) {
      return res.status(400).send("Invalid order status");
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: nextStatus },
      { new: true, runValidators: true }
    ).populate("user", "name email role");

    if (!order) {
      return res.status(404).send("Order not found");
    }

    return res.json(order);
  } catch (error) {
    return res.status(500).send("Failed to update order status");
  }
});

app.post("/api/products", authRequired, adminRequired, async (req, res) => {
  try {
    const { name, price, image, description, category, stock, rating, badge } = req.body;

    if (!name || price === undefined || !image || !description || !category || stock === undefined) {
      return res
        .status(400)
        .send("name, price, image, description, category and stock are required");
    }

    const product = await Product.create({
      name: name.trim(),
      price: Number(price),
      image: image.trim(),
      description: description.trim(),
      category: category.trim(),
      stock: Number(stock),
      rating: rating !== undefined ? Number(rating) : 4.5,
      badge: badge || ""
    });

    return res.status(201).json(product);
  } catch (error) {
    return res.status(500).send("Failed to create product");
  }
});

app.put("/api/products/:id", authRequired, adminRequired, async (req, res) => {
  try {
    const { name, price, image, description, category, stock, rating, badge } = req.body;

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(price !== undefined ? { price: Number(price) } : {}),
        ...(image !== undefined ? { image: image.trim() } : {}),
        ...(description !== undefined ? { description: description.trim() } : {}),
        ...(category !== undefined ? { category: category.trim() } : {}),
        ...(stock !== undefined ? { stock: Number(stock) } : {}),
        ...(rating !== undefined ? { rating: Number(rating) } : {}),
        ...(badge !== undefined ? { badge } : {})
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).send("Product not found");
    }

    return res.json(updated);
  } catch (error) {
    return res.status(500).send("Failed to update product");
  }
});

app.delete("/api/products/:id", authRequired, adminRequired, async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).send("Product not found");
    }

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).send("Failed to delete product");
  }
});

connectDb()
  .then(async () => {
    await ensureCmsDefaults();
    app.listen(PORT, () => {
      console.log(`API running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  });
