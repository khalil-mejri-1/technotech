import mongoose from 'mongoose';

const predefinedLinkSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: [true, 'Le nom du produit ou service est obligatoire'],
      trim: true,
      index: true,
    },
    productId: {
      type: String,
      default: '',
      index: true,
    },
    url: {
      type: String,
      required: [true, 'Le lien est obligatoire'],
      trim: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
      index: true,
    },
    usedAt: {
      type: Date,
      default: null,
    },
    usedByOrderNumber: {
      type: String,
      default: '',
      trim: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'predefined_links',
  }
);

export default mongoose.model('PredefinedLink', predefinedLinkSchema, 'predefined_links');
