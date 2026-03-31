const path = require("path");
const { randomBytes } = require("crypto");

const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg"
};

function sanitizeFileName(value = "") {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

function parseBase64Image(data, expectedContentType = "") {
  if (typeof data !== "string") {
    const error = new Error("Image data is required");
    error.statusCode = 400;
    throw error;
  }

  const matches = data.match(/^data:([^;]+);base64,(.+)$/);

  if (!matches) {
    const error = new Error("Image data must be a base64 data URL");
    error.statusCode = 400;
    throw error;
  }

  const contentType = matches[1].toLowerCase();
  const base64Payload = matches[2];

  if (!ALLOWED_IMAGE_TYPES[contentType]) {
    const error = new Error("Only JPG, PNG, WEBP, GIF, and SVG images are allowed");
    error.statusCode = 400;
    throw error;
  }

  if (expectedContentType && expectedContentType.toLowerCase() !== contentType) {
    const error = new Error("Uploaded file type does not match the file data");
    error.statusCode = 400;
    throw error;
  }

  const buffer = Buffer.from(base64Payload, "base64");

  if (!buffer.length) {
    const error = new Error("Image file is empty");
    error.statusCode = 400;
    throw error;
  }

  if (buffer.length > MAX_UPLOAD_SIZE_BYTES) {
    const error = new Error("Image must be 5 MB or smaller");
    error.statusCode = 400;
    throw error;
  }

  return {
    buffer,
    contentType,
    extension: ALLOWED_IMAGE_TYPES[contentType]
  };
}

function buildUploadFileName(originalName = "", extension) {
  const safeBaseName =
    sanitizeFileName(path.basename(originalName, path.extname(originalName))) ||
    "product-image";

  return `${Date.now()}-${randomBytes(6).toString("hex")}-${safeBaseName}${extension}`;
}

module.exports = {
  MAX_UPLOAD_SIZE_BYTES,
  parseBase64Image,
  buildUploadFileName
};
