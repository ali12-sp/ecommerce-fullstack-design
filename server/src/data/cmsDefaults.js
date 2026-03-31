const defaultSiteSettings = {
  singletonKey: "site-settings",
  brandName: "Brand",
  brandDescription:
    "A full-service B2B marketplace with live product sourcing, secure checkout, and order tracking.",
  footerBottomText: "Copyright 2026 Brand Ecommerce. All rights reserved.",
  localeLabel: "English | USD",
  socialLinks: [
    { label: "Facebook", url: "https://facebook.com" },
    { label: "X", url: "https://x.com" },
    { label: "LinkedIn", url: "https://linkedin.com" },
    { label: "Instagram", url: "https://instagram.com" },
    { label: "YouTube", url: "https://youtube.com" }
  ],
  appBadges: [
    {
      label: "App Store",
      subtitle: "Download on the",
      url: "https://www.apple.com/app-store/"
    },
    {
      label: "Google Play",
      subtitle: "Get it on",
      url: "https://play.google.com/store"
    }
  ],
  headerLinks: [
    { label: "Hot offers", type: "route", value: "/products?sort=rating_desc", openInNewTab: false },
    { label: "Blog", type: "blog_index", value: "", openInNewTab: false },
    { label: "Sell with us", type: "content", value: "sell-with-us", openInNewTab: false },
    { label: "Partnership", type: "content", value: "become-a-partner", openInNewTab: false },
    { label: "Help center", type: "content", value: "help-center", openInNewTab: false }
  ],
  heroSlides: [
    {
      eyebrow: "Welcome to Brand marketplace",
      title: "Source products with an Alibaba-style storefront that stays dynamic.",
      description:
        "Search, category highlights, featured products, and deal sections all update from your live product catalog instead of hardcoded homepage cards.",
      image: "/products/laptop.jpg",
      ctaLabel: "Explore products",
      ctaHref: "/products"
    },
    {
      eyebrow: "Managed from admin",
      title: "Rotate homepage banners with real CMS slides and uploaded images.",
      description:
        "Add two or three hero images in the content admin screen and the homepage slider will cycle through them every few seconds.",
      image: "/products/camera-gopro.jpg",
      ctaLabel: "Open content admin",
      ctaHref: "/admin/content"
    },
    {
      eyebrow: "Built for growth",
      title: "Connect products, blog, footer pages, and homepage visuals in one system.",
      description:
        "Your footer, hero area, and category sections are now tied to real backend-managed content and product images.",
      image: "/products/watch.jpg",
      ctaLabel: "Read the blog",
      ctaHref: "/blog"
    }
  ],
  categoryHighlights: [],
  serviceTileImages: [],
  quoteSectionImage: "",
  footerSections: [
    {
      title: "About",
      links: [
        { label: "About us", type: "content", value: "about-us", openInNewTab: false },
        { label: "Find store", type: "content", value: "find-store", openInNewTab: false },
        { label: "Categories", type: "route", value: "/products", openInNewTab: false },
        { label: "Blog", type: "blog_index", value: "", openInNewTab: false }
      ]
    },
    {
      title: "Partnership",
      links: [
        { label: "Sell with us", type: "content", value: "sell-with-us", openInNewTab: false },
        {
          label: "Become a partner",
          type: "content",
          value: "become-a-partner",
          openInNewTab: false
        },
        {
          label: "Shipping partners",
          type: "content",
          value: "shipping-partners",
          openInNewTab: false
        },
        {
          label: "Affiliate info",
          type: "content",
          value: "affiliate-info",
          openInNewTab: false
        }
      ]
    },
    {
      title: "Information",
      links: [
        { label: "Help center", type: "content", value: "help-center", openInNewTab: false },
        { label: "Money refund", type: "content", value: "money-refund", openInNewTab: false },
        {
          label: "Shipping",
          type: "content",
          value: "shipping-information",
          openInNewTab: false
        },
        { label: "Contact us", type: "content", value: "contact-us", openInNewTab: false }
      ]
    },
    {
      title: "For users",
      links: [
        { label: "Login", type: "route", value: "/auth/login", openInNewTab: false },
        { label: "Register", type: "route", value: "/auth/signup", openInNewTab: false },
        { label: "My cart", type: "route", value: "/cart", openInNewTab: false },
        { label: "My orders", type: "route", value: "/orders", openInNewTab: false }
      ]
    }
  ]
};

const defaultContentPages = [
  {
    title: "About us",
    slug: "about-us",
    summary: "Learn how our marketplace connects buyers with dependable wholesale supply.",
    content:
      "Brand is built to feel like a wholesale marketplace front-end while staying connected to a working ecommerce backend.\n\nWe focus on live inventory, clean product discovery, secure checkout, and a clear admin workflow so teams can test a realistic sourcing experience.\n\nOur goal is simple: keep the Alibaba-inspired browsing experience while making every product, order, and content section manageable from the system itself.",
    status: "published"
  },
  {
    title: "Find store",
    slug: "find-store",
    summary: "See how to navigate suppliers, categories, and order-ready collections.",
    content:
      "Use the product catalog to browse every active category in the marketplace.\n\nEach section is connected to the real product database, so category counts, pricing, and inventory are always based on current backend data.\n\nIf you are looking for a specific supplier experience, start with the homepage category rail or use the search bar to jump directly into matching products.",
    status: "published"
  },
  {
    title: "Sell with us",
    slug: "sell-with-us",
    summary: "Understand how suppliers and catalog managers can publish products on the platform.",
    content:
      "Suppliers and internal catalog teams can manage the storefront through the admin panel.\n\nProducts can be created, updated, assigned pricing, stock, ratings, badges, and uploaded images. Once saved, those products appear throughout the public marketplace automatically.\n\nThis structure gives sellers a fast path from admin entry to marketplace visibility without needing manual homepage edits.",
    status: "published"
  },
  {
    title: "Become a partner",
    slug: "become-a-partner",
    summary: "Explore partnership opportunities for fulfillment, sourcing, and logistics.",
    content:
      "Brand is designed for collaboration across product teams, sourcing teams, and logistics partners.\n\nPartnership content can be updated from the admin content system, letting you tailor this page for wholesale onboarding, regional expansion, or marketplace service information.\n\nThat means the footer, content pages, and blog all stay manageable without code edits for every copy update.",
    status: "published"
  },
  {
    title: "Shipping partners",
    slug: "shipping-partners",
    summary: "Review how shipping information and delivery processes are communicated to buyers.",
    content:
      "Shipping details shown in the storefront are meant to support a marketplace-style buying flow.\n\nOrders remain tied to real checkout records, while this page can explain fulfillment promises, supported regions, packaging standards, and delivery timelines.\n\nBecause the page is managed in the CMS layer, your team can update shipping copy without touching the layout code.",
    status: "published"
  },
  {
    title: "Affiliate info",
    slug: "affiliate-info",
    summary: "Share referral, partner, and campaign information in a maintainable way.",
    content:
      "Affiliate and referral guidance belongs in the same content system as your footer and blog.\n\nThat keeps marketplace support content, partner documentation, and public informational pages together in one admin workflow.\n\nYou can adapt this page for commission programs, referral terms, or promotion guidelines at any time.",
    status: "published"
  },
  {
    title: "Help center",
    slug: "help-center",
    summary: "Provide customers with a clear starting point for account, order, and product questions.",
    content:
      "The help center page can answer the most common buyer questions about browsing products, logging in, checking out, and tracking orders.\n\nSince this page is part of the content management layer, your support copy can evolve without frontend redeployment.\n\nPair it with blog articles for deeper guides or announcements whenever needed.",
    status: "published"
  },
  {
    title: "Money refund",
    slug: "money-refund",
    summary: "Explain refund handling, protection policies, and order resolution steps.",
    content:
      "Use this page to explain how refunds, cancellations, and issue resolution work for customers.\n\nThe ecommerce flow already stores orders and statuses, and this page gives you a dynamic place to publish the business policy behind those actions.\n\nThat combination makes the footer link fully functional instead of acting as placeholder navigation.",
    status: "published"
  },
  {
    title: "Shipping information",
    slug: "shipping-information",
    summary: "Publish current delivery guidelines, timelines, and packaging expectations.",
    content:
      "This shipping information page is managed from the same CMS system as the footer and blog.\n\nYou can describe delivery regions, processing timelines, packaging methods, and order update expectations here.\n\nCustomers still use the real cart and checkout flow, but this page supports them with the policy and logistics context they need.",
    status: "published"
  },
  {
    title: "Contact us",
    slug: "contact-us",
    summary: "Give buyers and partners a clear communication path.",
    content:
      "Use this page to provide contact guidance for sales, support, sourcing, or partnership requests.\n\nBecause the page is dynamic, you can keep phone numbers, emails, office hours, and support instructions current without rewriting the footer.\n\nIt works as a real destination page inside the marketplace instead of a dead link.",
    status: "published"
  }
];

const defaultBlogPosts = [
  {
    title: "How to build a marketplace homepage without hardcoded sections",
    slug: "build-marketplace-homepage-with-live-data",
    excerpt:
      "A live homepage feels more credible when categories, featured products, and stock-driven promotions come directly from backend data.",
    coverImage: "/products/laptop.jpg",
    content:
      "A marketplace homepage should guide discovery, but it should not depend on static demo cards forever.\n\nWhen categories, featured product grids, and deal sections are connected to the product database, the homepage evolves with the catalog automatically.\n\nThat approach keeps the public experience closer to a real B2B marketplace and reduces maintenance whenever admins update products.",
    tags: ["marketplace", "homepage", "catalog"],
    status: "published",
    publishedAt: new Date("2026-03-10T10:00:00.000Z")
  },
  {
    title: "Why footer content deserves a real CMS instead of placeholder links",
    slug: "why-footer-content-needs-a-real-cms",
    excerpt:
      "Support pages, partnership content, and blog destinations should be editable, routable, and meaningful instead of just decorative navigation.",
    coverImage: "/products/watch.jpg",
    content:
      "Footer links often start as placeholders, but that creates a mismatch between a polished interface and a limited content system.\n\nBy turning footer destinations into managed content pages and blog routes, every link becomes useful for real visitors.\n\nThat also gives admins control over support copy, partnership messaging, and marketplace information without code changes.",
    tags: ["cms", "footer", "content"],
    status: "published",
    publishedAt: new Date("2026-03-16T12:30:00.000Z")
  },
  {
    title: "Designing admin tools that actually support storefront growth",
    slug: "designing-admin-tools-for-storefront-growth",
    excerpt:
      "A storefront becomes easier to scale when products, images, content pages, and blog posts all share one admin workflow.",
    coverImage: "/products/camera-gopro.jpg",
    content:
      "The best admin tools are not isolated to product CRUD.\n\nAs soon as a marketplace wants dynamic landing pages, footer destinations, help center content, or blog updates, the admin panel needs a content workflow too.\n\nBringing those pieces together helps the storefront stay polished without sacrificing the flexibility of a working ecommerce stack.",
    tags: ["admin", "storefront", "content-ops"],
    status: "published",
    publishedAt: new Date("2026-03-22T09:15:00.000Z")
  }
];

module.exports = {
  defaultSiteSettings,
  defaultContentPages,
  defaultBlogPosts
};
