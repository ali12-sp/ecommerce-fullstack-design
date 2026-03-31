const mongoose = require("mongoose");

const blogPostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    excerpt: {
      type: String,
      required: true,
      trim: true
    },
    coverImage: {
      type: String,
      trim: true,
      default: "/products/placeholder.svg"
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    tags: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "published"
    },
    publishedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

blogPostSchema.set("toJSON", {
  virtuals: true,
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  }
});

module.exports = mongoose.model("BlogPost", blogPostSchema);
