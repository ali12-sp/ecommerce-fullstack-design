const mongoose = require("mongoose");

const footerLinkSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ["route", "content", "blog_index", "blog_post", "external"],
      required: true,
      default: "route"
    },
    value: {
      type: String,
      trim: true,
      default: ""
    },
    openInNewTab: {
      type: Boolean,
      default: false
    }
  },
  {
    _id: true
  }
);

const footerSectionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    links: {
      type: [footerLinkSchema],
      default: []
    }
  },
  {
    _id: true
  }
);

const socialLinkSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true
    },
    url: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    _id: true
  }
);

const appBadgeSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true
    },
    subtitle: {
      type: String,
      required: true,
      trim: true
    },
    url: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    _id: true
  }
);

const heroSlideSchema = new mongoose.Schema(
  {
    eyebrow: {
      type: String,
      required: true,
      trim: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    image: {
      type: String,
      required: true,
      trim: true
    },
    ctaLabel: {
      type: String,
      required: true,
      trim: true
    },
    ctaHref: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    _id: true
  }
);

const categoryHighlightSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      trim: true
    },
    image: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    _id: true
  }
);

const siteSettingsSchema = new mongoose.Schema(
  {
    singletonKey: {
      type: String,
      required: true,
      unique: true,
      default: "site-settings",
      trim: true
    },
    brandName: {
      type: String,
      required: true,
      trim: true
    },
    brandDescription: {
      type: String,
      required: true,
      trim: true
    },
    footerBottomText: {
      type: String,
      required: true,
      trim: true
    },
    localeLabel: {
      type: String,
      required: true,
      trim: true
    },
    socialLinks: {
      type: [socialLinkSchema],
      default: []
    },
    appBadges: {
      type: [appBadgeSchema],
      default: []
    },
    headerLinks: {
      type: [footerLinkSchema],
      default: []
    },
    heroSlides: {
      type: [heroSlideSchema],
      default: []
    },
    categoryHighlights: {
      type: [categoryHighlightSchema],
      default: []
    },
    serviceTileImages: {
      type: [{ type: String, trim: true }],
      default: []
    },
    quoteSectionImage: {
      type: String,
      trim: true,
      default: ""
    },
    footerSections: {
      type: [footerSectionSchema],
      default: []
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

siteSettingsSchema.set("toJSON", {
  virtuals: true,
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  }
});

module.exports = mongoose.model("SiteSettings", siteSettingsSchema);
