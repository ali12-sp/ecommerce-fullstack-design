const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    productId: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    image: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0
    }
  },
  {
    _id: false
  }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    addressLine1: {
      type: String,
      required: true,
      trim: true
    },
    addressLine2: {
      type: String,
      trim: true,
      default: ""
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      trim: true,
      default: ""
    },
    postalCode: {
      type: String,
      trim: true,
      default: ""
    },
    country: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    _id: false
  }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    customerName: {
      type: String,
      required: true,
      trim: true
    },
    customerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    items: {
      type: [orderItemSchema],
      default: []
    },
    itemCount: {
      type: Number,
      required: true,
      min: 1
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    discount: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    shippingFee: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    tax: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    },
    couponCode: {
      type: String,
      trim: true,
      default: ""
    },
    paymentMethod: {
      type: String,
      enum: ["cash_on_delivery", "card", "bank_transfer"],
      default: "cash_on_delivery"
    },
    notes: {
      type: String,
      trim: true,
      default: ""
    },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending"
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

orderSchema.set("toJSON", {
  virtuals: true,
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  }
});

module.exports = mongoose.model("Order", orderSchema);
