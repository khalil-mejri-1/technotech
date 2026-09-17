import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Technotech from '../models/Technotech.js';
import HeroSlide from '../models/HeroSlide.js';

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

const IMGBB_API_KEY = process.env.IMGBB_API_KEY || 'e684619df3cc8614b21e1b4f826b7fff';

async function uploadBufferToImgBB(buffer, filename) {
  try {
    const blob = new Blob([buffer]);
    const fd = new FormData();
    fd.append('image', blob, filename || 'image.png');
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
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

export default router;

