const mongoose = require("mongoose");

const contentPageSchema = new mongoose.Schema(
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
    summary: {
      type: String,
      required: true,
      trim: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "published"
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

contentPageSchema.set("toJSON", {
  virtuals: true,
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  }
});

module.exports = mongoose.model("ContentPage", contentPageSchema);
