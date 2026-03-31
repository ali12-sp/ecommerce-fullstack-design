const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    image: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    stock: {
      type: Number,
      required: true,
      min: 0
    },
    rating: {
      type: Number,
      default: 4.5,
      min: 0,
      max: 5
    },
    badge: {
      type: String,
      trim: true,
      default: ""
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

productSchema.set("toJSON", {
  virtuals: true,
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  }
});

module.exports = mongoose.model("Product", productSchema);