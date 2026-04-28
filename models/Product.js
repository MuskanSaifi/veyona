import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    price: { type: Number }, // Discounted/selling price - required only for leaf products (buyable)
    originalPrice: { type: Number }, // Original price before discount (optional, shown struck when set)
    image: String,
    public_id: String,
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    parentProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    order: { type: Number, default: 0 }, // For sorting products
    active: { type: Boolean, default: true },
  },
  { timestamps: true, strictPopulate: false }
);

productSchema.index({ category: 1, active: 1 });
productSchema.index({ category: 1, active: 1, parentProduct: 1 });
productSchema.index({ parentProduct: 1 });
productSchema.index({ order: 1, createdAt: -1 });

export default mongoose.models.Product ||
  mongoose.model("Product", productSchema);

