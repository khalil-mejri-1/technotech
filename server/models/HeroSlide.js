import mongoose from 'mongoose';

const heroSlideSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true,
    },
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
    image: {
      type: String,
      required: true,
    },
    bgColor: {
      type: String,
      default: '#e25816',
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: 'hero_slides',
  }
);

export default mongoose.model('HeroSlide', heroSlideSchema, 'hero_slides');
