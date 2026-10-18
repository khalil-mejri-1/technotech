import mongoose from 'mongoose';

const reviewMessageSchema = new mongoose.Schema({
  id: {
    type: String,
    default: '',
  },
  sender: {
    type: String,
    enum: ['customer', 'store'],
    default: 'customer',
  },
  text: {
    type: String,
    required: true,
  },
  time: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    default: 'read',
  },
});

const reviewSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    platform: {
      type: String,
      enum: ['whatsapp', 'facebook'],
      default: 'whatsapp',
    },
    customerName: {
      type: String,
      required: true,
    },
    customerCity: {
      type: String,
      default: '',
    },
    customerPhone: {
      type: String,
      default: '',
    },
    avatar: {
      type: String,
      default: '',
    },
    productName: {
      type: String,
      default: '',
    },
    productDuration: {
      type: String,
      default: '',
    },
    productPrice: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 5,
    },
    date: {
      type: String,
      default: '',
    },
    timeStr: {
      type: String,
      default: '',
    },
    verified: {
      type: Boolean,
      default: true,
    },
    badgeText: {
      type: String,
      default: 'Avis Vérifié ✅',
    },
    screenshotUrl: {
      type: String,
      default: null,
    },
    messages: {
      type: [reviewMessageSchema],
      default: [],
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'reviews',
  }
);

export default mongoose.models.Review || mongoose.model('Review', reviewSchema, 'reviews');
