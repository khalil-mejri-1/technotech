import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    id: { type: String, default: '' },
    name: { type: String, required: true },
    image: { type: String, default: '/images/logo.png' },
    size: { type: String, default: 'Standard' },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customerName: {
      type: String,
      required: [true, 'Le nom complet est obligatoire'],
      trim: true,
    },
    customerPhone: {
      type: String,
      required: [true, 'Le numéro de téléphone est obligatoire'],
      trim: true,
    },
    customerCity: {
      type: String,
      default: '',
      trim: true,
    },
    customerAddress: {
      type: String,
      default: '',
      trim: true,
    },
    customerNotes: {
      type: String,
      default: '',
      trim: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: [
        (val) => Array.isArray(val) && val.length > 0,
        'La commande doit contenir au moins un article',
      ],
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['en_attente', 'confirmee', 'livree', 'annulee'],
      default: 'en_attente',
      index: true,
    },
    paymentMethod: {
      type: String,
      default: 'Paiement à la livraison',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'orders',
  }
);

export default mongoose.model('Order', orderSchema, 'orders');
