export type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  category: string;
  stock: number;
  badge?: string;
  rating?: number;
};

export type CartItem = Product & {
  quantity: number;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
};

export type AuthState = {
  token: string | null;
  user: User | null;
};

export type AuthResponse = {
  token: string;
  user: User;
};

export type ShippingAddress = {
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type PaymentMethod = "cash_on_delivery" | "card" | "bank_transfer";

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type OrderItem = {
  productId: string;
  name: string;
  image: string;
  category: string;
  price: number;
  quantity: number;
  lineTotal: number;
};

export type Order = {
  id: string;
  orderNumber: string;
  user?: User | string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  itemCount: number;
  subtotal: number;
  discount: number;
  shippingFee: number;
  tax: number;
  total: number;
  couponCode: string;
  paymentMethod: PaymentMethod;
  notes: string;
  status: OrderStatus;
  shippingAddress: ShippingAddress;
  createdAt: string;
  updatedAt: string;
};

export type SiteLinkType =
  | "route"
  | "content"
  | "blog_index"
  | "blog_post"
  | "external";

export type SiteLink = {
  id?: string;
  label: string;
  type: SiteLinkType;
  value: string;
  openInNewTab: boolean;
};

export type FooterSection = {
  id?: string;
  title: string;
  links: SiteLink[];
};

export type SocialLink = {
  id?: string;
  label: string;
  url: string;
};

export type AppBadge = {
  id?: string;
  label: string;
  subtitle: string;
  url: string;
};

export type HeroSlide = {
  id?: string;
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  ctaLabel: string;
  ctaHref: string;
};

export type CategoryHighlight = {
  id?: string;
  category: string;
  image: string;
};

export type SiteSettings = {
  id: string;
  brandName: string;
  brandDescription: string;
  footerBottomText: string;
  localeLabel: string;
  socialLinks: SocialLink[];
  appBadges: AppBadge[];
  headerLinks: SiteLink[];
  heroSlides: HeroSlide[];
  categoryHighlights: CategoryHighlight[];
  serviceTileImages: string[];
  quoteSectionImage: string;
  footerSections: FooterSection[];
};

export type ContentPage = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
};

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  content: string;
  tags: string[];
  status: "draft" | "published";
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
};
