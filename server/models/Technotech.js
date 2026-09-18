import mongoose from 'mongoose';

const technotechSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      required: true,
    },
    originalPrice: {
      type: Number,
      default: null,
    },
    badge: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: 'ai-tools',
    },
    images: [{
      type: String,
    }],
    plans: [
      {
        duration: String,
        price: Number,
      },
    ],
    sourceBot: {
      type: String,
      default: '',
    },
    displayMode: {
      type: String,
      enum: ['carousel', 'single'],
      default: 'carousel',
    },
    selectedImageIndex: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: 'technotech',
  }
);

export default mongoose.model('Technotech', technotechSchema, 'technotech');
