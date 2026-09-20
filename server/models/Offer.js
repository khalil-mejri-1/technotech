import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    subtitle: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['bundle', 'promo'],
      default: 'bundle',
    },
    badge: {
      type: String,
      default: 'Pack Économique 🔥',
    },
    items: {
      type: [String],
      default: [],
    },
    itemImages: {
      type: [String],
      default: [],
    },
    price: {
      type: Number,
      required: true,
    },
    originalPrice: {
      type: Number,
      default: null,
    },
    image: {
      type: String,
      default: '',
    },
    bgColor: {
      type: String,
      default: '#ff7828',
    },
    duration: {
      type: String,
      default: '1 Mois',
    },
    features: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Offer || mongoose.model('Offer', offerSchema);
