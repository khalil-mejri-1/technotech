import mongoose from 'mongoose';

const siteSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'main_settings',
      unique: true,
    },
    disableInspect: {
      type: Boolean,
      default: true,
    },
    disableRightClick: {
      type: Boolean,
      default: true,
    },
    disableImageDragging: {
      type: Boolean,
      default: true,
    },
    protectInAdmin: {
      type: Boolean,
      default: false,
    },
    whatsappNumber: {
      type: String,
      default: '96086581',
    },
    imgbbApiKey: {
      type: String,
      default: '***REDACTED***',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.SiteSettings || mongoose.model('SiteSettings', siteSettingsSchema);
