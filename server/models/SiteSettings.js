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
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.SiteSettings || mongoose.model('SiteSettings', siteSettingsSchema);
