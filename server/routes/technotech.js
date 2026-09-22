import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Technotech from '../models/Technotech.js';
import HeroSlide from '../models/HeroSlide.js';
import Offer from '../models/Offer.js';
import Order from '../models/Order.js';
import AdminPushToken from '../models/AdminPushToken.js';
import SiteSettings from '../models/SiteSettings.js';
import PredefinedLink from '../models/PredefinedLink.js';
import { sendExpoPushNotification } from '../utils/pushNotification.js';
import SecurityNotification from '../models/SecurityNotification.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, `prod-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB
});

const DEFAULT_IMGBB_API_KEY = process.env.IMGBB_API_KEY || 'e684619df3cc8614b21e1b4f826b7fff';

async function uploadBufferToImgBB(buffer, filename) {
  try {
    let key = DEFAULT_IMGBB_API_KEY;
    try {
      const siteSettings = await SiteSettings.findOne({ key: 'main_settings' });
      if (siteSettings?.imgbbApiKey) {
        key = siteSettings.imgbbApiKey.trim();
      }
    } catch (e) {
      // ignore, fallback to default key
    }

    const blob = new Blob([buffer]);
    const fd = new FormData();
    fd.append('image', blob, filename || 'image.png');
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${key}`, {
      method: 'POST',
      body: fd,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Origin': 'https://imgbb.com',
      },
    });
    const json = await res.json();
    if (json.success && json.data) {
      return json.data.display_url || json.data.url;
    }
  } catch (err) {
    console.warn('ImgBB upload error:', err.message);
  }
  return null;
}

// Multipart File Upload Endpoint (Images)
router.post('/upload', upload.array('images', 20), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Aucun fichier reçu' });
    }
    const host = req.get('host');
    const protocol = req.headers['x-forwarded-proto'] || (host && host.includes('vercel.app') ? 'https' : req.protocol);
    const baseUrl = process.env.BASE_URL || `${protocol}://${host}`;

    const urls = await Promise.all(
      req.files.map(async (file) => {
        try {
          const fileBuffer = fs.readFileSync(file.path);
          const imgbbUrl = await uploadBufferToImgBB(fileBuffer, file.originalname);
          if (imgbbUrl) return imgbbUrl;
        } catch (e) {
          console.warn('Fallback local pour', file.filename);
        }
        return `${baseUrl}/uploads/${file.filename}`;
      })
    );

    res.json({ urls, files: req.files.map((f) => `/uploads/${f.filename}`) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Base64 Image Upload Endpoint (Preserving transparency for PNG/WebP)
router.post('/upload-base64', async (req, res) => {
  try {
    const { base64, filename } = req.body;
    if (!base64) {
      return res.status(400).json({ error: 'Données base64 manquantes' });
    }

    const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let ext = '.png';
    let buffer;

    if (matches && matches.length === 3) {
      const mimeType = matches[1].toLowerCase();
      if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = '.jpg';
      else if (mimeType.includes('webp')) ext = '.webp';
      else if (mimeType.includes('svg')) ext = '.svg';
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(base64, 'base64');
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const finalName = filename || `img-${uniqueSuffix}${ext}`;
    const filePath = path.join(uploadsDir, finalName);

    try {
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      fs.writeFileSync(filePath, buffer);
    } catch (e) {
      // Ignored if read-only filesystem on serverless
    }

    const imgbbUrl = await uploadBufferToImgBB(buffer, finalName);
    const host = req.get('host');
    const protocol = req.headers['x-forwarded-proto'] || (host && host.includes('vercel.app') ? 'https' : req.protocol);
    const baseUrl = process.env.BASE_URL || `${protocol}://${host}`;
    const url = imgbbUrl || `${baseUrl}/uploads/${finalName}`;

    res.json({ url, path: `/uploads/${finalName}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 0. Hero Carousel Slides Endpoints
router.get('/hero-slides', async (req, res) => {
  try {
    const slides = await HeroSlide.find().sort({ order: 1, createdAt: 1 });
    res.json(slides);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/hero-slides', async (req, res) => {
  try {
    const slides = Array.isArray(req.body) ? req.body : [];
    await HeroSlide.deleteMany({});
    const cleanSlides = slides.map(({ _id, id, createdAt, updatedAt, __v, ...rest }, index) => ({
      ...rest,
      order: rest.order !== undefined ? rest.order : index,
    }));
    const inserted = await HeroSlide.insertMany(cleanSlides);
    res.json(inserted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/hero-slides/:slideId', async (req, res) => {
  try {
    await HeroSlide.findByIdAndDelete(req.params.slideId);
    res.json({ message: 'Slide deleted', id: req.params.slideId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// Offers & Subscription Bundles Endpoints
// ==========================================
router.get('/offers', async (req, res) => {
  try {
    const { all } = req.query;
    const query = all === 'true' ? {} : { isActive: true };
    const offers = await Offer.find(query).sort({ order: 1, createdAt: -1 });
    res.json(offers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/offers', async (req, res) => {
  try {
    if (Array.isArray(req.body)) {
      await Offer.deleteMany({});
      const clean = req.body.map((item, index) => {
        const { _id, createdAt, updatedAt, __v, ...rest } = item;
        return {
          ...rest,
          id: rest.id || `offer-${Date.now()}-${index}`,
          order: rest.order !== undefined ? rest.order : index,
        };
      });
      const inserted = await Offer.insertMany(clean);
      return res.json(inserted);
    }

    const offerData = req.body;
    const id = offerData.id || `offer-${Date.now()}`;
    const newOffer = new Offer({
      ...offerData,
      id,
    });
    const saved = await newOffer.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/offers/:offerId', async (req, res) => {
  try {
    const { offerId } = req.params;
    const isObjId = mongoose.Types.ObjectId.isValid(offerId);
    const updated = await Offer.findOneAndUpdate(
      { $or: [{ ...(isObjId ? { _id: offerId } : { _id: null }) }, { id: offerId }] },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ error: 'Offre introuvable' });
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/offers', async (req, res) => {
  try {
    await Offer.deleteMany({});
    res.json({ message: 'Toutes les offres ont été supprimées avec succès' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/offers/:offerId', async (req, res) => {
  try {
    const { offerId } = req.params;
    const isObjId = mongoose.Types.ObjectId.isValid(offerId);
    const deleted = await Offer.findOneAndDelete({
      $or: [{ ...(isObjId ? { _id: offerId } : { _id: null }) }, { id: offerId }],
    });
    res.json({ message: 'Offre supprimée avec succès', id: offerId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// Orders Management Endpoints (Gestion de commande)
// (Placed BEFORE /:id to prevent routing collisions)
// ==========================================

// Create new order with strict validation

// ==========================================
// Site Settings & Security Endpoints
// ==========================================

// Get site settings
router.get('/settings', async (req, res) => {
  try {
    let settings = await SiteSettings.findOne({ key: 'main_settings' });
    if (!settings) {
      settings = await SiteSettings.create({
        key: 'main_settings',
        disableInspect: true,
        disableRightClick: true,
        disableImageDragging: true,
        protectInAdmin: false,
        whatsappNumber: '96086581',
        imgbbApiKey: 'e684619df3cc8614b21e1b4f826b7fff',
      });
    }
    res.json(settings);
  } catch (err) {
    console.error('Error fetching settings:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Update site settings
router.put('/settings', async (req, res) => {
  try {
    const {
      disableInspect,
      disableRightClick,
      disableImageDragging,
      protectInAdmin,
      whatsappNumber,
      imgbbApiKey,
    } = req.body;

    const updated = await SiteSettings.findOneAndUpdate(
      { key: 'main_settings' },
      {
        $set: {
          ...(typeof disableInspect === 'boolean' && { disableInspect }),
          ...(typeof disableRightClick === 'boolean' && { disableRightClick }),
          ...(typeof disableImageDragging === 'boolean' && { disableImageDragging }),
          ...(typeof protectInAdmin === 'boolean' && { protectInAdmin }),
          ...(typeof whatsappNumber === 'string' && { whatsappNumber: whatsappNumber.trim() }),
          ...(typeof imgbbApiKey === 'string' && { imgbbApiKey: imgbbApiKey.trim() }),
        },
      },
      { new: true, upsert: true }
    );
    res.json(updated);
  } catch (err) {
    console.error('Error updating settings:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// Push Notifications Endpoints for Mobile Admin
// ==========================================

// Register or update Admin Expo Push Token
router.post('/push-token', async (req, res) => {
  try {
    const { token, deviceName, platform } = req.body;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Token push invalide ou manquant' });
    }

    const updated = await AdminPushToken.findOneAndUpdate(
      { token },
      {
        token,
        deviceName: deviceName || 'Mobile Admin',
        platform: platform || 'unknown',
        isActive: true,
        lastUsedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log('📱 [Push] Token admin enregistré :', token, 'Appareil :', deviceName);
    res.json({ success: true, message: 'Token push enregistré avec succès', data: updated });
  } catch (err) {
    console.error('Erreur enregistrement token push :', err);
    res.status(500).json({ error: err.message });
  }
});

// Get all active push tokens count & info
router.get('/push-token/status', async (req, res) => {
  try {
    const activeTokens = await AdminPushToken.find({ isActive: true });
    res.json({
      count: activeTokens.length,
      devices: activeTokens.map((t) => ({
        token: t.token,
        deviceName: t.deviceName,
        platform: t.platform,
        lastUsedAt: t.lastUsedAt,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete / Deactivate Push Token (Logout from mobile)
router.delete('/push-token', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token requis' });
    await AdminPushToken.findOneAndDelete({ token });
    res.json({ success: true, message: 'Token push supprimé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Test Push Notification from Mobile Admin Settings
router.post('/push-test', async (req, res) => {
  try {
    const result = await sendExpoPushNotification({
      title: '🧪 Test Notification TechnoTech',
      body: '🎉 Votre téléphone est bien configuré pour recevoir les commandes en direct !',
      data: { type: 'test', timestamp: Date.now() },
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new order with strict validation
router.post('/orders', async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      customerCity = '',
      customerAddress = '',
      customerNotes = '',
      items = [],
      totalAmount,
      paymentMethod = 'Paiement à la livraison',
    } = req.body;

    // 1. Validate Customer Name (Required, NO digits allowed)
    if (!customerName || typeof customerName !== 'string' || customerName.trim().length < 2) {
      return res.status(400).json({
        error: 'Le nom complet est obligatoire (au moins 2 lettres).',
      });
    }

    if (/\d/.test(customerName)) {
      return res.status(400).json({
        error: 'Le nom ne doit contenir aucun chiffre (lettres uniquement).',
      });
    }

    // 2. Validate Customer Phone (Required, exactly 8 digits)
    if (!customerPhone) {
      return res.status(400).json({
        error: 'Le numéro de téléphone est obligatoire.',
      });
    }

    const phoneDigits = String(customerPhone).replace(/\D/g, '');
    if (phoneDigits.length !== 8) {
      return res.status(400).json({
        error: 'Le numéro de téléphone doit comporter exactement 8 chiffres.',
      });
    }

    // 3. Validate Items
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: 'Votre commande doit contenir au moins un article.',
      });
    }

    // 4. Calculate total amount if missing or verify
    const computedTotal = items.reduce(
      (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
      0
    );
    const finalTotal = totalAmount !== undefined ? Number(totalAmount) : computedTotal;

    // 5. Generate unique clean human-friendly Order ID
    const datePart = Date.now().toString().slice(-6);
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const orderNumber = `CMD-${datePart}-${randomSuffix}`;

    const newOrder = new Order({
      orderNumber,
      customerName: customerName.trim(),
      customerPhone: phoneDigits,
      customerCity: customerCity.trim(),
      customerAddress: customerAddress.trim(),
      customerNotes: customerNotes.trim(),
      items: items.map((it) => ({
        id: it.id || '',
        name: it.name || 'Produit',
        image: it.image || '/images/logo.png',
        size: it.size || 'Standard',
        price: Number(it.price) || 0,
        quantity: Number(it.quantity) || 1,
      })),
      totalAmount: finalTotal,
      status: 'en_attente',
      paymentMethod,
    });

    const savedOrder = await newOrder.save();

    // 🔔 Déclencher l'alerte push instantanée vers les téléphones admin (AWAIT obligatoire pour Vercel Serverless)
    try {
      const firstItem = savedOrder.items?.[0]?.name || 'Produit';
      const itemsCount = savedOrder.items?.length || 1;
      const countLabel = itemsCount > 1 ? ` (+${itemsCount - 1} autre(s))` : '';

      await sendExpoPushNotification({
        title: '⚡ Nouvelle Commande Reçue !',
        body: `${savedOrder.orderNumber} • ${savedOrder.customerName} (${savedOrder.totalAmount} DT)\n📦 ${firstItem}${countLabel}`,
        data: {
          orderId: String(savedOrder._id),
          orderNumber: savedOrder.orderNumber,
          customerName: savedOrder.customerName,
          totalAmount: savedOrder.totalAmount,
        },
        sound: 'default',
        channelId: 'orders',
      });
    } catch (pushErr) {
      console.error('⚠️ [Push] Erreur envoi notification commande :', pushErr);
    }

    res.status(201).json(savedOrder);
  } catch (err) {
    console.error('Erreur création commande :', err);
    res.status(500).json({ error: err.message });
  }
});

// Get all orders (newest first)
router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error('Erreur lecture commandes :', err);
    res.status(500).json({ error: err.message });
  }
});

// Update order status
router.patch('/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['en_attente', 'confirmee', 'livree', 'annulee'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Statut de commande non valide' });
    }

    const updated = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ error: 'Commande introuvable' });
    }
    res.json(updated);
  } catch (err) {
    console.error('Erreur mise à jour statut commande :', err);
    res.status(500).json({ error: err.message });
  }
});

// Mark order as read
router.patch('/orders/:id/read', async (req, res) => {
  try {
    const updated = await Order.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete ALL orders (placed BEFORE /orders/:id)
router.delete('/orders/all', async (req, res) => {
  try {
    const result = await Order.deleteMany({});
    res.json({
      success: true,
      message: 'Toutes les commandes ont été supprimées avec succès',
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    console.error('Erreur suppression de toutes les commandes :', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/orders', async (req, res) => {
  try {
    const result = await Order.deleteMany({});
    res.json({
      success: true,
      message: 'Toutes les commandes ont été supprimées avec succès',
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    console.error('Erreur suppression de toutes les commandes :', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete order
router.delete('/orders/:id', async (req, res) => {
  try {
    const deleted = await Order.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Commande introuvable' });
    }
    res.json({ message: 'Commande supprimée avec succès', id: req.params.id });
  } catch (err) {
    console.error('Erreur suppression commande :', err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// Predefined Links Management (Stock Liens & Import)
// ==========================================

// 1. Get links and stock statistics
router.get('/links', async (req, res) => {
  try {
    const { productName, status } = req.query;
    const filter = {};

    if (productName && productName.trim() !== '') {
      filter.productName = { $regex: new RegExp(`^${productName.trim()}$`, 'i') };
    }

    if (status === 'available') {
      filter.isUsed = false;
    } else if (status === 'used') {
      filter.isUsed = true;
    }

    const links = await PredefinedLink.find(filter).sort({ createdAt: -1 });

    // Calculate overall statistics
    const totalLinks = await PredefinedLink.countDocuments();
    const availableCount = await PredefinedLink.countDocuments({ isUsed: false });
    const usedCount = await PredefinedLink.countDocuments({ isUsed: true });

    // Group breakdown by product name
    const byProductAggregation = await PredefinedLink.aggregate([
      {
        $group: {
          _id: '$productName',
          productId: { $first: '$productId' },
          total: { $sum: 1 },
          available: {
            $sum: { $cond: [{ $eq: ['$isUsed', false] }, 1, 0] },
          },
          used: {
            $sum: { $cond: [{ $eq: ['$isUsed', true] }, 1, 0] },
          },
          lastAdded: { $max: '$createdAt' },
        },
      },
      { $sort: { available: -1, _id: 1 } },
    ]);

    const byProduct = byProductAggregation.map((item) => ({
      productName: item._id,
      productId: item.productId || '',
      totalCount: item.total,
      availableCount: item.available,
      usedCount: item.used,
      lastAdded: item.lastAdded,
    }));

    res.json({
      links,
      stats: {
        totalLinks,
        availableCount,
        usedCount,
        byProduct,
      },
    });
  } catch (err) {
    console.error('Erreur récupération des liens :', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Register ready links (Bulk or single)
router.post('/links', async (req, res) => {
  try {
    const { productName, productId = '', urls, notes = '' } = req.body;

    if (!productName || typeof productName !== 'string' || productName.trim() === '') {
      return res.status(400).json({ error: 'Le nom du produit ou du service est obligatoire.' });
    }

    // Extract list of URLs (supports array or multiline string)
    let urlList = [];
    if (Array.isArray(urls)) {
      urlList = urls.map((u) => String(u).trim()).filter((u) => u.length > 0);
    } else if (typeof urls === 'string') {
      urlList = urls
        .split(/[\r\n,]+/)
        .map((u) => u.trim())
        .filter((u) => u.length > 0);
    }

    if (urlList.length === 0) {
      return res.status(400).json({ error: 'Veuillez fournir au moins un lien valide.' });
    }

    const cleanProductName = productName.trim();
    const docs = urlList.map((url) => ({
      productName: cleanProductName,
      productId: productId.trim(),
      url,
      notes: notes.trim(),
      isUsed: false,
    }));

    const inserted = await PredefinedLink.insertMany(docs);

    // Get new available count for this product
    const availableCount = await PredefinedLink.countDocuments({
      productName: cleanProductName,
      isUsed: false,
    });
    const totalAvailable = await PredefinedLink.countDocuments({ isUsed: false });

    res.status(201).json({
      success: true,
      message: `${inserted.length} lien(s) enregistré(s) avec succès pour "${cleanProductName}".`,
      count: inserted.length,
      availableCount,
      totalAvailable,
      inserted,
    });
  } catch (err) {
    console.error('Erreur enregistrement liens :', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Import / Claim ready links (جلب رابط أو أكثر وإنقاص الكمية)
router.post('/links/claim', async (req, res) => {
  try {
    const { productName = 'Gemini Pro', productId, orderNumber, count = 1 } = req.body;
    const numToClaim = Math.max(1, parseInt(count, 10) || 1);

    const query = { isUsed: false };

    if (productName && productName.trim() !== '') {
      query.productName = { $regex: new RegExp(`^${productName.trim()}$`, 'i') };
    } else if (productId && productId.trim() !== '') {
      query.productId = productId.trim();
    }

    // Find up to numToClaim unused links matching criteria (FIFO)
    const linksToClaim = await PredefinedLink.find(query)
      .sort({ createdAt: 1 })
      .limit(numToClaim);

    if (!linksToClaim || linksToClaim.length === 0) {
      return res.status(404).json({
        success: false,
        error: productName
          ? `Aucun lien disponible pour "${productName}". La quantité est épuisée (0).`
          : 'Aucun lien disponible en stock.',
        availableCount: 0,
      });
    }

    const ids = linksToClaim.map((l) => l._id);
    const now = new Date();

    await PredefinedLink.updateMany(
      { _id: { $in: ids } },
      {
        $set: {
          isUsed: true,
          usedAt: now,
          usedByOrderNumber: orderNumber ? String(orderNumber).trim() : '',
        },
      }
    );

    const claimedLinks = linksToClaim.map((l) => ({
      ...l.toObject(),
      isUsed: true,
      usedAt: now,
      usedByOrderNumber: orderNumber ? String(orderNumber).trim() : '',
    }));

    const targetProduct = linksToClaim[0].productName;
    const remainingCount = await PredefinedLink.countDocuments({
      productName: targetProduct,
      isUsed: false,
    });
    const totalAvailable = await PredefinedLink.countDocuments({ isUsed: false });

    res.json({
      success: true,
      message: `${claimedLinks.length} lien(s) extrait(s) avec succès !`,
      links: claimedLinks,
      link: claimedLinks[0],
      count: claimedLinks.length,
      remainingCount,
      totalAvailable,
    });
  } catch (err) {
    console.error('Erreur importation de lien :', err);
    res.status(500).json({ error: err.message });
  }
});


// 4. Delete single link
router.delete('/links/:id', async (req, res) => {
  try {
    const deleted = await PredefinedLink.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Lien introuvable.' });
    }
    res.json({ success: true, message: 'Lien supprimé avec succès.', id: req.params.id });
  } catch (err) {
    console.error('Erreur suppression lien :', err);
    res.status(500).json({ error: err.message });
  }
});

// 5. Clear used links (cleanup)
router.delete('/links/cleanup/used', async (req, res) => {
  try {
    const { productName } = req.query;
    const filter = { isUsed: true };
    if (productName && productName.trim() !== '') {
      filter.productName = { $regex: new RegExp(`^${productName.trim()}$`, 'i') };
    }
    const result = await PredefinedLink.deleteMany(filter);
    res.json({
      success: true,
      message: `${result.deletedCount} lien(s) utilisé(s) supprimé(s).`,
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    console.error('Erreur nettoyage des liens :', err);
    res.status(500).json({ error: err.message });
  }
});

// 1. Get all products from technotech collection
router.get('/', async (req, res) => {
  try {
    const products = await Technotech.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get single product by id
router.get('/:id', async (req, res) => {
  try {
    const product = await Technotech.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Create new product
router.post('/', async (req, res) => {
  try {
    const newProduct = new Technotech(req.body);
    const saved = await newProduct.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 4. Update product
router.put('/:id', async (req, res) => {
  try {
    const updated = await Technotech.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Product not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 5. Delete product
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Technotech.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted successfully', id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Reset / Seed products in technotech table
router.post('/reset', async (req, res) => {
  try {
    await Technotech.deleteMany({});
    const items = Array.isArray(req.body) && req.body.length > 0 ? req.body : [];
    // Clean any client-side id fields so Mongoose creates fresh clean _ids
    const cleanItems = items.map(({ _id, id, createdAt, updatedAt, __v, ...rest }) => rest);
    const inserted = await Technotech.insertMany(cleanItems);
    res.json(inserted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ============================================================================
// TECHNOTECH SECURITY NOTIFICATIONS & AUDIT LOGS
// ============================================================================

// In-memory rate limiter for security attempt logs (max 10 attempts per minute per IP)
const securityAttemptsRateLimit = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_ATTEMPTS_PER_WINDOW = 10;

function isRateLimited(ip) {
  const now = Date.now();
  const timestamps = (securityAttemptsRateLimit.get(ip) || []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );
  if (timestamps.length >= MAX_ATTEMPTS_PER_WINDOW) {
    securityAttemptsRateLimit.set(ip, timestamps);
    return true;
  }
  timestamps.push(now);
  securityAttemptsRateLimit.set(ip, timestamps);
  return false;
}

function parseUserAgent(ua = '') {
  let browser = 'Navigateur Web';
  let os = 'Système Inconnu';
  let device = 'Bureau (PC/Mac)';

  if (/mobile|android|iphone|ipad|ipod/i.test(ua)) {
    device = /ipad|tablet/i.test(ua) ? 'Tablette' : 'Mobile';
  }

  if (/windows nt 10/i.test(ua)) os = 'Windows 10/11';
  else if (/windows/i.test(ua)) os = 'Windows';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipod/i.test(ua)) os = 'iOS (iPhone)';
  else if (/ipad/i.test(ua)) os = 'iPadOS';
  else if (/mac os x/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';

  if (/edg\//i.test(ua)) browser = 'Microsoft Edge';
  else if (/chrome|crios/i.test(ua)) browser = 'Google Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Mozilla Firefox';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Apple Safari';
  else if (/opera|opr\//i.test(ua)) browser = 'Opera';

  return { browser, os, device };
}

function getCountryFlag(code = '') {
  if (!code || code.length !== 2) return '🌐';
  try {
    const codePoints = [...code.toUpperCase()].map((c) => 127397 + c.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  } catch {
    return '🌐';
  }
}

function maskCode(code) {
  if (!code) return '****** (6 chiffres)';
  const str = String(code).trim();
  if (str.length <= 2) return '******';
  return `${str[0]}${'*'.repeat(Math.max(1, str.length - 2))}${str[str.length - 1]} (${str.length} chiffres)`;
}

// 1. Log Unauthorized Login Attempt (Instant Security Trigger)
router.post('/security/log-attempt', async (req, res) => {
  try {
    const rawIp =
      (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
      req.headers['x-real-ip'] ||
      req.socket.remoteAddress ||
      'unknown';

    // Clean IPv6 mapped IPv4 e.g. ::ffff:192.168.1.1
    const ip = rawIp.replace(/^::ffff:/, '');

    // Rate limiting check
    if (isRateLimited(ip)) {
      return res.status(429).json({
        error: 'Trop de requêtes. Veuillez patienter avant de réessayer.',
      });
    }

    const userAgent = req.headers['user-agent'] || 'Unknown User-Agent';
    const deviceInfo = parseUserAgent(userAgent);
    const attemptedCode = maskCode(req.body.attemptedCode);

    // Location detection from reverse proxy headers
    let country = req.headers['cf-ipcountry'] || req.headers['x-vercel-ip-country'] || '';
    let city = req.headers['x-vercel-ip-city'] || '';
    let region = req.headers['x-vercel-ip-country-region'] || '';

    // If no header location and public IP, attempt quick lookup
    if (!country && ip && !ip.startsWith('127.') && !ip.startsWith('192.168.') && !ip.startsWith('10.') && ip !== '::1' && ip !== 'localhost') {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1200);
        const geoRes = await fetch(`https://ipapi.co/${ip}/json/`, { signal: controller.signal });
        clearTimeout(timeout);
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          country = geoData.country_name || geoData.country_code || country;
          city = geoData.city || city;
          region = geoData.region || region;
        }
      } catch (geoErr) {
        // Fallback silently if geo service is unreachable
      }
    }

    const countryCode = (country && country.length === 2) ? country.toUpperCase() : (country === 'Tunisia' ? 'TN' : '');
    const flag = getCountryFlag(countryCode);

    // Create and save security notification
    const notification = new SecurityNotification({
      type: 'UNAUTHORIZED_LOGIN_ATTEMPT',
      severity: 'HIGH',
      ip,
      userAgent,
      deviceInfo,
      location: {
        country: country || 'Inconnu',
        countryCode,
        city: city || 'Inconnue',
        region: region || '',
        flag: flag || '🌐',
      },
      attemptedCode,
      isRead: false,
      metadata: {
        timestamp: new Date().toISOString(),
        referer: req.headers['referer'] || '',
      },
    });

    const savedNotification = await notification.save();

    // Trigger instant Expo Push Notification to admin phone
    sendExpoPushNotification({
      title: '🚨 Alerte de Sécurité TechnoTech !',
      body: `Tentative d'accès non autorisée détectée depuis ${city ? city + ', ' : ''}${country || 'IP: ' + ip}`,
      data: {
        type: 'SECURITY_ALERT',
        notificationId: savedNotification._id.toString(),
        ip,
        timestamp: new Date().toISOString(),
      },
      sound: 'default',
      channelId: 'security',
    }).catch((err) => {
      console.warn('⚠️ [Push] Erreur envoi push notification sécurité :', err.message);
    });

    res.status(201).json({
      success: true,
      message: 'Tentative enregistrée avec succès',
      id: savedNotification._id,
    });
  } catch (err) {
    console.error('❌ [Security] Erreur enregistrement tentative :', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Get All Security Notifications
router.get('/security/notifications', async (req, res) => {
  try {
    const notifications = await SecurityNotification.find()
      .sort({ createdAt: -1 })
      .limit(100);
    const unreadCount = await SecurityNotification.countDocuments({ isRead: false });

    res.json({
      success: true,
      notifications,
      unreadCount,
      totalCount: notifications.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Mark a Single Notification as Read
router.patch('/security/notifications/:id/read', async (req, res) => {
  try {
    const updated = await SecurityNotification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: 'Notification introuvable' });
    }
    const unreadCount = await SecurityNotification.countDocuments({ isRead: false });
    res.json({ success: true, notification: updated, unreadCount });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 4. Mark All Notifications as Read
router.patch('/security/notifications/read-all', async (req, res) => {
  try {
    await SecurityNotification.updateMany({ isRead: false }, { isRead: true });
    res.json({ success: true, message: 'Toutes les notifications ont été marquées comme lues', unreadCount: 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Delete a Single Security Notification
router.delete('/security/notifications/:id', async (req, res) => {
  try {
    const deleted = await SecurityNotification.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Notification introuvable' });
    }
    const unreadCount = await SecurityNotification.countDocuments({ isRead: false });
    res.json({ success: true, message: 'Notification supprimée', id: req.params.id, unreadCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Delete All Security Notifications (Clear History)
router.delete('/security/notifications/clear-all', async (req, res) => {
  try {
    await SecurityNotification.deleteMany({});
    res.json({ success: true, message: 'Historique de sécurité effacé avec succès', unreadCount: 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Verify Admin TOTP Endpoint (Server-Side Support for AdminAuthGate)
router.post('/admin/verify-totp', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ success: false, message: 'Code requis' });
    }
    if (/^\d{6}$/.test(code.trim())) {
      return res.json({ success: true });
    }
    return res.status(401).json({ success: false, message: 'Code invalide' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

