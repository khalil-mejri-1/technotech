import mongoose from 'mongoose';

const SecurityNotificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      default: 'UNAUTHORIZED_LOGIN_ATTEMPT',
      trim: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'HIGH',
      index: true,
    },
    ip: {
      type: String,
      required: true,
      trim: true,
      default: 'unknown',
    },
    userAgent: {
      type: String,
      default: 'Unknown User-Agent',
    },
    deviceInfo: {
      browser: { type: String, default: 'Inconnu' },
      os: { type: String, default: 'Inconnu' },
      device: { type: String, default: 'Bureau/Mobile' },
    },
    location: {
      country: { type: String, default: 'Inconnu' },
      countryCode: { type: String, default: '' },
      city: { type: String, default: '' },
      region: { type: String, default: '' },
      flag: { type: String, default: '🌐' },
    },
    attemptedCode: {
      type: String,
      default: '******',
    },
    attemptCount: {
      type: Number,
      default: 1,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'security_notifications',
  }
);

SecurityNotificationSchema.index({ createdAt: -1 });

export default mongoose.models.SecurityNotification ||
  mongoose.model('SecurityNotification', SecurityNotificationSchema);