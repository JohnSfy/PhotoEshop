const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const DatabaseManager = require('./database/dbManager');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize database
const dbManager = new DatabaseManager();

// Middleware
app.use(cors({ origin: true, credentials: false }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Initialize database connection
dbManager.init().then(() => {
  console.log('Database initialized successfully');
}).catch(err => {
  console.error('Failed to initialize database:', err);
});

// Create uploads directories if they don't exist
const uploadsDir = path.join(__dirname, 'uploads');
const cleanDir = path.join(uploadsDir, 'clean');
const watermarkedDir = path.join(uploadsDir, 'watermarked');

fs.ensureDirSync(uploadsDir);
fs.ensureDirSync(cleanDir);
fs.ensureDirSync(watermarkedDir);

// Load categories
const categoriesPath = path.join(__dirname, 'categories.json');
let categories = [];

try {
  if (fs.existsSync(categoriesPath)) {
    categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));
  } else {
    categories = ['nature', 'portrait', 'landscape', 'abstract', 'other'];
    fs.writeFileSync(categoriesPath, JSON.stringify(categories, null, 2));
  }
} catch (error) {
  console.error('Error loading categories:', error);
  categories = ['nature', 'portrait', 'landscape', 'abstract', 'other'];
}

// Function to convert Greek letters to Greeklish (Latin characters)
function convertGreekToGreeklish(text) {
  if (!text) return `photo_${Date.now()}`;
  
  const greekToLatin = {
    // Uppercase Greek letters
    'Α': 'A', 'Β': 'B', 'Γ': 'G', 'Δ': 'D', 'Ε': 'E', 'Ζ': 'Z', 'Η': 'H', 'Θ': 'TH',
    'Ι': 'I', 'Κ': 'K', 'Λ': 'L', 'Μ': 'M', 'Ν': 'N', 'Ξ': 'X', 'Ο': 'O', 'Π': 'P',
    'Ρ': 'R', 'Σ': 'S', 'Τ': 'T', 'Υ': 'Y', 'Φ': 'F', 'Χ': 'CH', 'Ψ': 'PS', 'Ω': 'O',
    
    // Lowercase Greek letters
    'α': 'a', 'β': 'b', 'γ': 'g', 'δ': 'd', 'ε': 'e', 'ζ': 'z', 'η': 'h', 'θ': 'th',
    'ι': 'i', 'κ': 'k', 'λ': 'l', 'μ': 'm', 'ν': 'n', 'ξ': 'x', 'ο': 'o', 'π': 'p',
    'ρ': 'r', 'σ': 's', 'τ': 't', 'υ': 'u', 'φ': 'f', 'χ': 'ch', 'ψ': 'ps', 'ω': 'o',
    
    // Greek accents and special characters
    'ά': 'a', 'έ': 'e', 'ή': 'h', 'ί': 'i', 'ό': 'o', 'ύ': 'u', 'ώ': 'o',
    'Ά': 'A', 'Έ': 'E', 'Ή': 'H', 'Ί': 'I', 'Ό': 'O', 'Ύ': 'U', 'Ώ': 'O',
    'ϊ': 'i', 'ϋ': 'u', 'ΐ': 'i', 'ΰ': 'u',
    'Ϊ': 'I', 'Ϋ': 'U'
  };
  
  let result = text;
  
  // Convert Greek letters to Latin
  for (const [greek, latin] of Object.entries(greekToLatin)) {
    result = result.replace(new RegExp(greek, 'g'), latin);
  }
  
  // Clean up any remaining problematic characters
  result = result
    .replace(/[<>:"/\\|?*]/g, '_')  // Replace forbidden characters
    .replace(/\s+/g, '_')           // Replace spaces with underscores
    .replace(/_{2,}/g, '_')         // Replace multiple underscores with single
    .replace(/^_|_$/g, '');         // Remove leading/trailing underscores
  
  return result || `photo_${Date.now()}`;
}

// Function to create watermarked image with diagonal repeating watermarks
async function createWatermarkedImage(inputBuffer, outputPath, watermarkText = 'Προστατευμένη Εικόνα') {
  try {
    // Get image metadata
    const metadata = await sharp(inputBuffer).metadata();
    const { width: originalWidth, height: originalHeight } = metadata;
    
    // Calculate target dimensions for watermarked version
    const targetWidth = 800;
    const targetHeight = 600;
    
    // Calculate final dimensions while maintaining aspect ratio
    let finalWidth, finalHeight;
    const aspectRatio = originalWidth / originalHeight;
    
    if (aspectRatio > targetWidth / targetHeight) {
      finalWidth = targetWidth;
      finalHeight = Math.round(targetWidth / aspectRatio);
    } else {
      finalHeight = targetHeight;
      finalWidth = Math.round(targetHeight * aspectRatio);
    }
    
    // Create a single watermark tile - adjust size based on image dimensions
    const tileWidth = Math.max(80, Math.floor(finalWidth * 0.1)); // 10% of image width, minimum 80px
    const tileHeight = Math.max(30, Math.floor(finalHeight * 0.05)); // 5% of image height, minimum 30px
    
    // Create the main canvas SVG with diagonal repeating watermarks
    // Make canvas exactly match the final image dimensions
    const diagonalWatermarkSvg = `
      <svg width="${finalWidth}" height="${finalHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="diagonalWatermark" patternUnits="userSpaceOnUse" width="${tileWidth * 2}" height="${tileHeight * 2}" patternTransform="rotate(45)">
            <use href="#watermarkTile" x="0" y="0"/>
            <use href="#watermarkTile" x="${tileWidth}" y="${tileHeight}"/>
          </pattern>
        </defs>
        
        <!-- Define the watermark tile -->
        <g id="watermarkTile">
          <text x="${tileWidth/2}" y="${tileHeight * 0.6}" font-family="Arial, sans-serif" font-size="${Math.max(8, Math.floor(tileHeight * 0.25))}" fill="white" text-anchor="middle" font-weight="bold">
          ${watermarkText}
        </text>
          <text x="${tileWidth/2}" y="${tileHeight * 0.85}" font-family="Arial, sans-serif" font-size="${Math.max(6, Math.floor(tileHeight * 0.2))}" fill="white" text-anchor="middle">
            -------------------------
        </text>
        </g>
        
        <!-- Fill the entire canvas with diagonal watermarks -->
        <rect width="${finalWidth}" height="${finalHeight}" fill="url(#diagonalWatermark)"/>
      </svg>
    `;
    
    // Create watermarked image with diagonal repeating watermarks
    await sharp(inputBuffer)
      .resize(finalWidth, finalHeight, { fit: 'inside', withoutEnlargement: true })
      .composite([{
        input: Buffer.from(diagonalWatermarkSvg),
        top: 0, // Position at top-left corner (0,0)
        left: 0
      }])
      .jpeg({ quality: 80 })
      .toFile(outputPath);
    
    console.log(`Diagonal watermarked image created: ${outputPath}`);
    return true;
  } catch (error) {
    console.error('Error creating watermarked image:', error);
    throw error;
  }
}

// ==================== PHOTO MANAGEMENT APIs ====================

// GET /api/photos - Get all photos (watermarked for display)
app.get('/api/photos', async (req, res) => {
  try {
    const photos = await dbManager.getWatermarkedPhotos();
    res.json(photos);
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({ error: 'Failed to fetch photos' });
  }
});

// GET /api/photos/:id - Get specific photo
app.get('/api/photos/:id', async (req, res) => {
  try {
    const photo = await dbManager.getPhotoById(req.params.id);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    res.json(photo);
  } catch (error) {
    console.error('Error fetching photo:', error);
    res.status(500).json({ error: 'Failed to fetch photo' });
  }
});

// GET /api/photos/category/:category - Get photos by category
app.get('/api/photos/category/:category', async (req, res) => {
  try {
    const photos = await dbManager.getPhotosByCategory(req.params.category);
    res.json(photos);
  } catch (error) {
    console.error('Error fetching photos by category:', error);
    res.status(500).json({ error: 'Failed to fetch photos by category' });
  }
});

// GET /api/categories - Get all categories
app.get('/api/categories', (req, res) => {
  res.json(categories);
});

// POST /api/categories - Create new category
app.post('/api/categories', (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    
    const categoryName = name.trim();
    
    // Check if category already exists
    if (categories.includes(categoryName)) {
      return res.status(400).json({ error: 'Category already exists' });
    }
    
    // Add to memory array first
    categories.push(categoryName);
    
    // Then write to file
    fs.writeFileSync(categoriesPath, JSON.stringify(categories, null, 2));
    
    console.log(`New category created: ${categoryName}`);
    
    res.json({ 
      message: 'Category created successfully',
      category: categoryName
    });
    
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// DELETE /api/categories/:categoryName - Delete category
app.delete('/api/categories/:categoryName', async (req, res) => {
  try {
    const { categoryName } = req.params;
    
    if (!categoryName) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    
    if (!categories.includes(categoryName)) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Remove category from memory array first
    categories = categories.filter(c => c !== categoryName);
    
    // Then write to file
    fs.writeFileSync(categoriesPath, JSON.stringify(categories, null, 2));
    
    console.log(`Category '${categoryName}' deleted successfully`);
    
    res.json({ 
      message: `Category '${categoryName}' deleted successfully`
    });
    
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// POST /api/photos/upload - Upload new photo
app.post('/api/photos/upload', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No photo uploaded' });
    }

    const { price = 5.99, category = 'other' } = req.body;
    const photoId = uuidv4();
    
    // Convert Greek filename to Greeklish to prevent corruption
    const originalFilename = req.file.originalname;
    const extension = path.extname(originalFilename);
    const baseName = path.basename(originalFilename, extension);
    const filename = convertGreekToGreeklish(originalFilename);

    // Generate file paths
    const cleanFileName = `${photoId}-${baseName}-clean${extension}`;
    const watermarkedFileName = `${photoId}-${baseName}-watermark${extension}`;
    
    const cleanPath = path.join('clean', cleanFileName);
    const watermarkedPath = path.join('watermarked', watermarkedFileName);
    
    const fullCleanPath = path.join(cleanDir, cleanFileName);
    const fullWatermarkedPath = path.join(watermarkedDir, watermarkedFileName);

    // Save clean version (original quality - no resizing or compression)
    await sharp(req.file.buffer)
      .toFile(fullCleanPath);

    // Create watermarked version with high quality
    await createWatermarkedImage(req.file.buffer, fullWatermarkedPath, 'Προστατευμένη Εικόνα');

    // Save to database
    const photoData = {
      id: photoId,
      filename,
      path_to_clean: cleanPath,
      path_to_watermark: watermarkedPath,
      price: parseFloat(price),
      category
    };

    await dbManager.addPhoto(photoData);

    res.json({
      message: 'Photo uploaded successfully',
      photo: {
        id: photoId,
        filename,
        path_to_watermark: watermarkedPath,
        price: parseFloat(price),
        category
      }
    });

  } catch (error) {
    console.error('Error uploading photo:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to upload photo', details: error.message });
  }
});

// POST /api/photos/upload-multiple - Upload multiple photos
app.post('/api/photos/upload-multiple', upload.array('photos'), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No photos uploaded' });
    }

    const { price = 5.99, category = 'other' } = req.body;
    const results = [];

    for (const file of req.files) {
              try {
          const photoId = uuidv4();
          
          // Convert Greek filename to Greeklish to prevent corruption
          const originalFilename = file.originalname;
          const extension = path.extname(originalFilename);
          const baseName = path.basename(originalFilename, extension);
          const filename = convertGreekToGreeklish(originalFilename);

        // Generate file paths
        const cleanFileName = `${photoId}-${baseName}-clean${extension}`;
        const watermarkedFileName = `${photoId}-${baseName}-watermark${extension}`;
        
        const cleanPath = path.join('clean', cleanFileName);
        const watermarkedPath = path.join('watermarked', watermarkedFileName);
        
        const fullCleanPath = path.join(cleanDir, cleanFileName);
        const fullWatermarkedPath = path.join(watermarkedDir, watermarkedFileName);

        // Save clean version (original quality - no resizing or compression)
        await sharp(file.buffer)
          .toFile(fullCleanPath);

        // Create watermarked version with high quality
        await createWatermarkedImage(file.buffer, fullWatermarkedPath, 'Προστατευμένη Εικόνα');

        // Save to database
        const photoData = {
            id: photoId,
          filename,
          path_to_clean: cleanPath,
          path_to_watermark: watermarkedPath,
          price: parseFloat(price),
          category
        };

           await dbManager.addPhoto(photoData);

        results.push({
          id: photoId,
          filename,
          path_to_watermark: watermarkedPath,
          price: parseFloat(price),
          category,
          status: 'success'
        });

  } catch (error) {
        console.error(`Error processing photo ${file.originalname}:`, error);
        results.push({
          filename: file.originalname,
          status: 'error',
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    res.json({
      message: `Multiple photos processed: ${successCount} successful, ${errorCount} failed`,
      results,
      summary: {
        total: req.files.length,
        successful: successCount,
        failed: errorCount
      }
    });

  } catch (error) {
    console.error('Error uploading multiple photos:', error);
    res.status(500).json({ error: 'Failed to upload multiple photos', details: error.message });
  }
});

// PUT /api/photos/:id - Update photo
app.put('/api/photos/:id', async (req, res) => {
  try {
    const { price, category } = req.body;
    const updates = {};
    
    if (price !== undefined) updates.price = parseFloat(price);
    if (category !== undefined) updates.category = category;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid updates provided' });
    }

    const result = await dbManager.updatePhoto(req.params.id, updates);
    
    if (result === 0) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    res.json({ message: 'Photo updated successfully' });
  } catch (error) {
    console.error('Error updating photo:', error);
    res.status(500).json({ error: 'Failed to update photo' });
  }
});

// DELETE /api/photos/:id - Delete photo (also supports multiple IDs via query parameter)
app.delete('/api/photos/:id', async (req, res) => {
  try {
    const { multiple_ids } = req.query;
    
    // If multiple_ids query parameter is provided, handle bulk delete
    if (multiple_ids) {
      const photoIds = multiple_ids.split(',').map(id => id.trim());
      console.log('Bulk delete via query parameter - Photo IDs:', photoIds);
      
      const results = [];
     let successCount = 0;
     let errorCount = 0;
     
      for (const photoId of photoIds) {
        try {
          const photo = await dbManager.getPhotoById(photoId);
          if (!photo) {
            results.push({ id: photoId, status: 'error', error: 'Photo not found' });
            errorCount++;
          continue;
        }
        
          // Delete files
          if (photo.path_to_clean) {
            const fullCleanPath = path.join(__dirname, 'uploads', photo.path_to_clean);
            if (fs.existsSync(fullCleanPath)) {
              fs.unlinkSync(fullCleanPath);
            }
          }

          if (photo.path_to_watermark) {
            const fullWatermarkedPath = path.join(__dirname, 'uploads', photo.path_to_watermark);
            if (fs.existsSync(fullWatermarkedPath)) {
              fs.unlinkSync(fullWatermarkedPath);
            }
          }

          // Delete from database
          await dbManager.deletePhoto(photoId);

          results.push({ id: photoId, status: 'success' });
        successCount++;
        
      } catch (error) {
          console.error(`Error deleting photo ${photoId}:`, error);
          results.push({ id: photoId, status: 'error', error: error.message });
        errorCount++;
        }
      }

      return res.json({
        message: `Bulk delete completed: ${successCount} successful, ${errorCount} failed`,
        results,
        summary: {
          total: photoIds.length,
          successful: successCount,
          failed: errorCount
        }
      });
    }

    // Original single photo delete logic
    const photo = await dbManager.getPhotoById(req.params.id);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    // Delete files
    if (photo.path_to_clean) {
      const fullCleanPath = path.join(__dirname, 'uploads', photo.path_to_clean);
      if (fs.existsSync(fullCleanPath)) {
        fs.unlinkSync(fullCleanPath);
      }
    }

    if (photo.path_to_watermark) {
      const fullWatermarkedPath = path.join(__dirname, 'uploads', photo.path_to_watermark);
      if (fs.existsSync(fullWatermarkedPath)) {
        fs.unlinkSync(fullWatermarkedPath);
      }
    }

    // Delete from database
    await dbManager.deletePhoto(req.params.id);

    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

// DELETE /api/photos/bulk - Delete multiple photos
app.delete('/api/photos/bulk', async (req, res) => {
  try {
    const { photo_ids } = req.body;
    
    console.log('Bulk delete request body:', req.body);
    console.log('Photo IDs received:', photo_ids);
    console.log('Photo IDs type:', typeof photo_ids);
    console.log('Photo IDs is array:', Array.isArray(photo_ids));
    
    if (!photo_ids || !Array.isArray(photo_ids) || photo_ids.length === 0) {
      console.log('Validation failed - photo_ids:', photo_ids);
      return res.status(400).json({ error: 'photo_ids array is required' });
    }

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const photoId of photo_ids) {
      console.log(`Processing photo ID: ${photoId} (type: ${typeof photoId})`);
      try {
        const photo = await dbManager.getPhotoById(photoId);
        console.log(`Photo lookup result for ${photoId}:`, photo ? 'Found' : 'Not found');
        
        if (!photo) {
          results.push({ id: photoId, status: 'error', error: 'Photo not found' });
          errorCount++;
          continue;
        }

        // Delete files
        if (photo.path_to_clean) {
          const fullCleanPath = path.join(__dirname, 'uploads', photo.path_to_clean);
          if (fs.existsSync(fullCleanPath)) {
            fs.unlinkSync(fullCleanPath);
          }
        }

        if (photo.path_to_watermark) {
          const fullWatermarkedPath = path.join(__dirname, 'uploads', photo.path_to_watermark);
          if (fs.existsSync(fullWatermarkedPath)) {
            fs.unlinkSync(fullWatermarkedPath);
          }
        }

        // Delete from database
        await dbManager.deletePhoto(photoId);

        results.push({ id: photoId, status: 'success' });
        successCount++;
        
      } catch (error) {
        console.error(`Error deleting photo ${photoId}:`, error);
        results.push({ id: photoId, status: 'error', error: error.message });
        errorCount++;
      }
    }

    console.log('Bulk delete completed. Results:', results);

      res.json({ 
      message: `Bulk delete completed: ${successCount} successful, ${errorCount} failed`,
      results,
      summary: {
        total: photo_ids.length,
        successful: successCount,
        failed: errorCount
      }
    });
    
  } catch (error) {
    console.error('Error in bulk delete:', error);
    res.status(500).json({ error: 'Failed to perform bulk delete' });
  }
});

// ==================== ORDER MANAGEMENT APIs ====================

// POST /api/orders - Create new order
app.post('/api/orders', async (req, res) => {
  try {
    const { photo_ids, total_amount, email, status = 'pending', mypos_order_id } = req.body;
    
    if (!photo_ids || !total_amount || !email) {
      return res.status(400).json({ 
        error: 'Missing required fields: photo_ids, total_amount, email' 
      });
    }

    const orderId = uuidv4();
    const orderData = {
      id: orderId,
      photo_ids: Array.isArray(photo_ids) ? photo_ids.join(',') : photo_ids,
      total_amount: parseFloat(total_amount),
      email,
      status: status || 'pending',
      mypos_order_id: mypos_order_id || null
    };

    await dbManager.createOrder(orderData);

    res.json({
      message: 'Order created successfully',
      order: {
        id: orderId,
        photo_ids: orderData.photo_ids,
        total_amount: orderData.total_amount,
        email,
        status: orderData.status,
        mypos_order_id: orderData.mypos_order_id
      }
    });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// GET /api/orders/:id - Get order by ID
app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = await dbManager.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// GET /api/orders - Get all orders
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await dbManager.getAllOrders();
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// PUT /api/orders/:id - Update order
app.put('/api/orders/:id', async (req, res) => {
  try {
    const { status, mypos_order_id, email, photo_ids, total_amount } = req.body;
    
    if (!status && !mypos_order_id && !email && !photo_ids && !total_amount) {
      return res.status(400).json({ error: 'At least one field to update is required' });
    }

    const updates = {};
    if (status !== undefined) updates.status = status;
    if (mypos_order_id !== undefined) updates.mypos_order_id = mypos_order_id;
    if (email !== undefined) updates.email = email;
    if (photo_ids !== undefined) updates.photo_ids = Array.isArray(photo_ids) ? photo_ids.join(',') : photo_ids;
    if (total_amount !== undefined) updates.total_amount = parseFloat(total_amount);

    const result = await dbManager.updateOrder(req.params.id, updates);
    
    if (result === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ message: 'Order updated successfully' });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// PUT /api/orders/:id/status - Update order status
app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { status, mypos_order_id } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const result = await dbManager.updateOrderStatus(req.params.id, status, mypos_order_id);
    
    if (result === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// DELETE /api/orders/:id - Delete order
app.delete('/api/orders/:id', async (req, res) => {
  try {
    const result = await dbManager.deleteOrder(req.params.id);
    
    if (result === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

// ==================== UTILITY APIs ====================

// GET /api/health - Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: dbManager.db ? 'connected' : 'disconnected'
  });
});

// GET /api/stats - Get basic statistics
app.get('/api/stats', async (req, res) => {
  try {
    const photos = await dbManager.getAllPhotos();
    const orders = await dbManager.getAllOrders();
    
    const stats = {
      total_photos: photos.length,
      total_orders: orders.length,
      pending_orders: orders.filter(o => o.status === 'pending').length,
      completed_orders: orders.filter(o => o.status === 'completed').length,
      categories: categories.length
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
  console.log(`Uploads available at http://localhost:${PORT}/uploads`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await dbManager.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  await dbManager.close();
  process.exit(0);
});
