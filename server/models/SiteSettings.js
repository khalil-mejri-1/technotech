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
      default: 'e684619df3cc8614b21e1b4f826b7fff',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.SiteSettings || mongoose.model('SiteSettings', siteSettingsSchema);
