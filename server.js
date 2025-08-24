const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const multer = require('multer');
// Viva Wallet configuration
const VIVA_WALLET_MERCHANT_ID = process.env.VIVA_WALLET_MERCHANT_ID;
const VIVA_WALLET_API_KEY = process.env.VIVA_WALLET_API_KEY;
const VIVA_WALLET_SMART_CHECKOUT_URL = 'https://www.vivapayments.com/web/checkout';
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = file.fieldname === 'clean' ? 'uploads/clean' : 'uploads/watermarked';
    fs.ensureDirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    console.log('Processing file:', file.originalname, 'Type:', file.mimetype);
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Watermarking function
async function addWatermark(inputPath, outputPath, watermarkText = 'EVENT PHOTOS') {
  try {
    await sharp(inputPath)
      .resize(1200, 800, { fit: 'inside', withoutEnlargement: true })
      .composite([{
        input: Buffer.from(`
          <svg width="400" height="100">
            <rect width="400" height="100" fill="rgba(0,0,0,0.5)"/>
            <text x="200" y="60" font-family="Arial" font-size="24" fill="white" text-anchor="middle">
              ${watermarkText}
            </text>
            <text x="200" y="85" font-family="Arial" font-size="14" fill="white" text-anchor="middle">
              PREVIEW ONLY
            </text>
          </svg>
        `),
        top: 50,
        left: 50
      }])
      .jpeg({ quality: 80 })
      .toFile(outputPath);
    
    console.log(`Watermark added to: ${outputPath}`);
  } catch (error) {
    console.error('Watermarking error:', error);
    throw error;
  }
}

// In-memory storage for demo (use database in production)
let photos = [];
let orders = [];

// Routes

// Get all photos
app.get('/api/photos', (req, res) => {
  res.json(photos);
});

// Upload photos (admin only)
app.post('/api/photos/upload', upload.fields([
  { name: 'clean', maxCount: 100 }
]), async (req, res) => {
  try {
    console.log('Upload request received');
    console.log('Files:', req.files);
    console.log('Body:', req.body);
    
    const cleanFiles = req.files.clean || [];
    
    console.log('Clean files count:', cleanFiles.length);
    
    if (cleanFiles.length === 0) {
      return res.status(400).json({ 
        error: 'Clean photos are required',
        cleanCount: cleanFiles.length
      });
    }
    
    console.log('Processing photos and adding watermarks...');
    
    for (let i = 0; i < cleanFiles.length; i++) {
      const cleanFile = cleanFiles[i];
      const cleanPath = path.join(__dirname, 'uploads', 'clean', cleanFile.filename);
      const watermarkedFilename = `watermarked-${cleanFile.filename}`;
      const watermarkedPath = path.join(__dirname, 'uploads', 'watermarked', watermarkedFilename);
      
      console.log(`Processing photo ${i + 1}/${cleanFiles.length}: ${cleanFile.originalname}`);
      
      // Add watermark to create watermarked version
      await addWatermark(cleanPath, watermarkedPath, 'EVENT PHOTOS');
      
      // Create photo record
      const photo = {
        id: uuidv4(),
        watermarkedUrl: `/uploads/watermarked/${watermarkedFilename}`,
        cleanUrl: `/uploads/clean/${cleanFile.filename}`,
        filename: cleanFile.originalname,
        price: 5.99, // Default price per photo
        uploadedAt: new Date().toISOString()
      };
      photos.push(photo);
      console.log('Photo added:', photo.filename);
    }
    
    console.log('Total photos in gallery:', photos.length);
    res.json({ message: 'Photos uploaded and watermarked successfully', count: cleanFiles.length });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create Viva Wallet checkout session
app.post('/api/create-checkout', async (req, res) => {
  try {
    const { photoIds, customerEmail, customerName } = req.body;
    
    if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
      return res.status(400).json({ error: 'Photo IDs are required' });
    }
    
    const selectedPhotos = photos.filter(photo => photoIds.includes(photo.id));
    const totalAmount = selectedPhotos.reduce((sum, photo) => sum + photo.price, 0);
    
    // Create unique order ID for tracking
    const orderId = uuidv4();
    
    // Store pending order (will be completed when webhook received)
    const pendingOrder = {
      id: orderId,
      photoIds,
      customerEmail,
      customerName,
      photos: selectedPhotos,
      totalAmount,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    orders.push(pendingOrder);
    
    // Create Viva Wallet checkout URL
    const checkoutUrl = `${VIVA_WALLET_SMART_CHECKOUT_URL}?ref=${orderId}&amount=${Math.round(totalAmount * 100)}&email=${encodeURIComponent(customerEmail)}&name=${encodeURIComponent(customerName)}`;
    
    res.json({
      checkoutUrl,
      orderId,
      totalAmount,
      photoCount: photoIds.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Viva Wallet webhook handler
app.post('/api/viva-webhook', async (req, res) => {
  try {
    const { orderId, status, transactionId } = req.body;
    
    console.log('Viva Wallet webhook received:', { orderId, status, transactionId });
    
    // Find the pending order
    const orderIndex = orders.findIndex(order => order.id === orderId);
    if (orderIndex === -1) {
      console.error('Order not found:', orderId);
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = orders[orderIndex];
    
    if (status === 'success' || status === 'completed') {
      // Update order status
      order.status = 'completed';
      order.transactionId = transactionId;
      order.completedAt = new Date().toISOString();
      
      console.log('Payment completed for order:', orderId);
      
      // Send email with clean photos
      await sendCleanPhotosEmail(order.customerEmail, order.photos);
      
      res.json({ message: 'Webhook processed successfully' });
    } else if (status === 'failed' || status === 'cancelled') {
      // Update order status
      order.status = 'failed';
      order.failedAt = new Date().toISOString();
      
      console.log('Payment failed for order:', orderId);
      
      res.json({ message: 'Webhook processed successfully' });
    } else {
      console.log('Unknown payment status:', status);
      res.json({ message: 'Webhook processed successfully' });
    }
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check order status (for frontend polling)
app.get('/api/order-status/:orderId', (req, res) => {
  const { orderId } = req.params;
  const order = orders.find(o => o.id === orderId);
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  res.json({
    status: order.status,
    completedAt: order.completedAt,
    failedAt: order.failedAt
  });
});

// Email configuration and sending function
async function sendCleanPhotosEmail(email, photos) {
  // Configure email transporter (use your email service credentials)
  const transporter = nodemailer.createTransporter({
    service: 'gmail', // or your preferred email service
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  
  const photoLinks = photos.map(photo => 
    `<li><a href="${process.env.BASE_URL}${photo.cleanUrl}" target="_blank">${photo.filename}</a></li>`
  ).join('');
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your Clean Event Photos Are Ready! 📸',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Thank you for your purchase! 🎉</h2>
        <p>Your clean, high-quality event photos are ready for download.</p>
        <p><strong>Photos purchased:</strong></p>
        <ul>${photoLinks}</ul>
        <p>Total amount: $${photos.reduce((sum, photo) => sum + photo.price, 0).toFixed(2)}</p>
        <p>Click on each photo link above to download your clean versions.</p>
        <p>These links will expire in 7 days for security reasons.</p>
        <hr style="margin: 20px 0;">
        <p style="font-size: 12px; color: #666;">
          If you have any questions, please contact our support team.
        </p>
      </div>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log(`Clean photos email sent to ${email}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

// Get order history
app.get('/api/orders/:email', (req, res) => {
  const { email } = req.params;
  const userOrders = orders.filter(order => order.customerEmail === email);
  res.json(userOrders);
});

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
  });
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Global error:', error);
  console.error('Error stack:', error.stack);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 50MB.' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files. Maximum is 100 files per type.' });
    }
    return res.status(400).json({ error: `Upload error: ${error.message}` });
  }
  
  res.status(500).json({ error: error.message || 'Something went wrong!' });
});

// Create necessary directories
fs.ensureDirSync('uploads/watermarked');
fs.ensureDirSync('uploads/clean');
fs.ensureDirSync('public');

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Photo upload directory: ${path.join(__dirname, 'uploads')}`);
});
