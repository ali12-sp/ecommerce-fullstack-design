const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

function getApiOrigin() {
  try {
    return new URL(API_URL).origin;
  } catch {
    return "";
  }
}

const API_ORIGIN = getApiOrigin();

export function getProductImage(name?: string, category?: string) {
  const n = (name || "").toLowerCase();
  const c = (category || "").toLowerCase();

  if (n.includes("canon")) return "/products/camera-canon.jpg";
  if (n.includes("gopro")) return "/products/camera-gopro.jpg";
  if (n.includes("headphone")) return "/products/headphone.jpg";
  if (n.includes("watch")) return "/products/watch.jpg";
  if (n.includes("laptop")) return "/products/laptop.jpg";

  if (n.includes("camera")) return "/products/camera.svg";
  if (n.includes("smartphone")) return "/products/phone.svg";
  if (n.includes("phone")) return "/products/phone.svg";
  if (n.includes("jacket")) return "/products/jacket.svg";
  if (n.includes("bag")) return "/products/bag.svg";
  if (n.includes("kettle")) return "/products/kettle.svg";

  if (n.includes("sofa")) return "/products/placeholder.svg";
  if (n.includes("chair")) return "/products/placeholder.svg";
  if (n.includes("kitchen")) return "/products/kettle.svg";
  if (n.includes("blender")) return "/products/kettle.svg";
  if (n.includes("home appliance")) return "/products/kettle.svg";
  if (n.includes("coffee maker")) return "/products/kettle.svg";
  if (n.includes("gaming")) return "/products/headphone.jpg";

  if (c.includes("camera")) return "/products/camera.svg";
  if (c.includes("headphone")) return "/products/headphone.jpg";
  if (c.includes("laptop")) return "/products/laptop.jpg";
  if (c.includes("smartphone")) return "/products/phone.svg";
  if (c.includes("watch")) return "/products/watch.jpg";

  return "/products/placeholder.svg";
}

export function resolveProductImage(image?: string, name?: string, category?: string) {
  const trimmedImage = image?.trim();

  if (trimmedImage) {
    if (/^https?:\/\//i.test(trimmedImage) || trimmedImage.startsWith("data:")) {
      return trimmedImage;
    }

    if (trimmedImage.startsWith("/uploads/") && API_ORIGIN) {
      return `${API_ORIGIN}${trimmedImage}`;
    }

    return trimmedImage;
  }

  return getProductImage(name, category);
}

export function getProductGallery(image?: string, name?: string, category?: string) {
  const main = resolveProductImage(image, name, category);

  return Array.from(
    new Set([
      main,
      "/products/headphone.jpg",
      "/products/watch.jpg",
      "/products/laptop.jpg",
      "/products/camera-canon.jpg",
      "/products/camera-gopro.jpg"
    ])
  );
}
