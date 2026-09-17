import mongoose from 'mongoose';

const AdminPushTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    deviceName: {
      type: String,
      default: 'Admin Device',
    },
    platform: {
      type: String,
      enum: ['android', 'ios', 'web', 'unknown'],
      default: 'unknown',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'admin_push_tokens',
  }
);

export default mongoose.models.AdminPushToken || mongoose.model('AdminPushToken', AdminPushTokenSchema);
