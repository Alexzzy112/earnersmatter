const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    description: {
      type: String,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    dailyEarnings: {
      type: Number,
      required: [true, 'Daily earnings is required'],
      min: 0,
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: 1,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    image: {
      type: String,
    },
    minPurchase: {
      type: Number,
      default: 1,
      min: 1,
    },
    maxPurchase: {
      type: Number,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

productSchema.index({ status: 1, price: 1 });

productSchema.virtual('totalReturn').get(function () {
  return this.dailyEarnings * this.duration;
});

module.exports = mongoose.model('Product', productSchema);
