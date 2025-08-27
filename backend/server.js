const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const sharp = require('sharp');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const Database = require('better-sqlite3');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const crypto = require('crypto');

// ─────────── ENV ───────────
// .env:
// PORT=5000 (or keep your existing PORT)
// ALLOWED_ORIGIN=http://localhost:3000 (or your frontend URL)
// MYPOS_PRIVATE_KEY_PEM="-----BEGIN PRIVATE KEY-----\n..."
// (προαιρετικά) MYPOS_PUBLIC_CERT_PEM="-----BEGIN CERTIFICATE-----\n..."  // για verify notify
const {
  PORT = 5000,
  ALLOWED_ORIGIN = "http://localhost:3000",
  MYPOS_PRIVATE_KEY_PEM,
  MYPOS_PUBLIC_CERT_PEM, // sandbox public cert (μόνο για επαλήθευση)
} = process.env;

if (!MYPOS_PRIVATE_KEY_PEM) {
  console.error(" Missing MYPOS_PRIVATE_KEY_PEM in env");
  console.log(" myPOS payment functionality will be disabled");
}

// Load categories from JSON file
const categoriesPath = path.join(__dirname, 'categories.json');
let categories = [];

try {
  if (fs.existsSync(categoriesPath)) {
    categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));
  } else {
    // Create empty categories file if it doesn't exist
    categories = [];
    fs.writeFileSync(categoriesPath, JSON.stringify(categories, null, 2));
  }
} catch (error) {
  console.error('Error loading categories:', error);
  categories = []; // Start with empty categories
}

const app = express();
app.set("trust proxy", true);

// Initialize SQLite database
const dbPath = path.join(__dirname, 'database', 'photos.db');
const db = new Database(dbPath);

// Create photos table if it doesn't exist (simplified without events)
db.exec(`
  CREATE TABLE IF NOT EXISTS photos (
    id TEXT PRIMARY KEY,
    filename TEXT,
    path_to_watermark TEXT,
    path_to_clean TEXT,
    updated TEXT,
    price REAL,
    category TEXT
  )
`);

// Create orders table for payment tracking
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    photo_ids TEXT,
    total_amount REAL,
    status TEXT DEFAULT 'pending',
    mypos_order_id TEXT,
    created_at TEXT,
    updated_at TEXT
  )
`);

// Middleware
app.use(cors({ origin: ALLOWED_ORIGIN, credentials: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: false })); // For myPOS notify
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use('/api', express.json());

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Use memory storage to avoid temp files

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

// Helper function to get upload paths
function getUploadPaths() {
  const rootDir = path.join(__dirname, '..'); // Go up to root project directory
  return {
    clean: path.join(rootDir, 'uploads', 'clean'),
    watermarked: path.join(rootDir, 'uploads', 'watermarked')
  };
}

// Watermarking function
async function addWatermark(inputPath, outputPath, watermarkText = 'WaterMarked Preview') {
  try {
    console.log(`Starting watermarking: ${inputPath} -> ${outputPath}`);
    
    // Get image metadata first
    const metadata = await sharp(inputPath).metadata();
    const { width: originalWidth, height: originalHeight } = metadata;
    
    console.log(`Original image dimensions: ${originalWidth}x${originalHeight}`);
    
    // Calculate target dimensions
    const targetWidth = 1200;
    const targetHeight = 800;
    
    // Calculate actual final dimensions while maintaining aspect ratio
    let finalWidth, finalHeight;
    const aspectRatio = originalWidth / originalHeight;
    
    if (aspectRatio > targetWidth / targetHeight) {
      // Image is wider than target ratio
      finalWidth = targetWidth;
      finalHeight = Math.round(targetWidth / aspectRatio);
    } else {
      // Image is taller than target ratio
      finalHeight = targetHeight;
      finalWidth = Math.round(targetHeight * aspectRatio);
    }
    
    console.log(`Calculated final dimensions: ${finalWidth}x${finalHeight}`);
    
    // Calculate watermark size - make it significantly smaller than the image
    const watermarkWidth = Math.floor(finalWidth * 0.95); // 95% of image width
    const watermarkHeight = Math.floor(finalHeight * 0.12); // 12% of image height
    
    console.log(`Watermark dimensions: ${watermarkWidth}x${watermarkHeight}`);
    
    // Ensure watermark is smaller than image
    if (watermarkWidth >= finalWidth || watermarkHeight >= finalHeight) {
      throw new Error(`Watermark too large: ${watermarkWidth}x${watermarkHeight} vs image ${finalWidth}x${finalHeight}`);
    }
    
    // Create watermark SVG
    const watermarkSvg = `
      <svg width="${watermarkWidth}" height="${watermarkHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${watermarkWidth}" height="${watermarkHeight}" fill="rgba(0,0,0,0.8)"/>
        <text x="${watermarkWidth/2}" y="${watermarkHeight * 0.6}" font-family="Arial, sans-serif" font-size="28" fill="white" text-anchor="middle" font-weight="bold">
          ${watermarkText}
        </text>
        <text x="${watermarkWidth/2}" y="${watermarkHeight * 0.85}" font-family="Arial, sans-serif" font-size="18" fill="white" text-anchor="middle">
          PREVIEW ONLY
        </text>
      </svg>
    `;
    
    console.log('SVG watermark created, starting image processing...');
    
    // Create watermark buffer
    const watermarkBuffer = Buffer.from(watermarkSvg);
    console.log('Watermark buffer created, size:', watermarkBuffer.length);
    
    // Calculate watermark position to center it
    const watermarkTop = Math.floor(finalHeight * 0.60); // 60% from top
    const watermarkLeft = Math.floor((finalWidth - watermarkWidth) / 2); // Center horizontally
    
    console.log(`Watermark position: top=${watermarkTop}, left=${watermarkLeft}`);
    
    // Process image: resize and add watermark in one pipeline
    await sharp(inputPath)
      .resize(finalWidth, finalHeight, { fit: 'inside', withoutEnlargement: true })
      .composite([{
        input: watermarkBuffer,
        top: watermarkTop,
        left: watermarkLeft
      }])
      .jpeg({ quality: 80 })
      .toFile(outputPath);
    
    console.log(`✅ Watermark successfully added to: ${outputPath}`);
    console.log(`Watermark spans ${watermarkWidth}px width (95% of image width)`);
    
    // Verify the file was created
    const outputExists = fs.existsSync(outputPath);
    const outputStats = outputExists ? fs.statSync(outputPath) : null;
    console.log(`Output file exists: ${outputExists}, size: ${outputStats ? outputStats.size : 'N/A'} bytes`);
    
  } catch (error) {
    console.error('❌ Watermarking error:', error);
    console.error('Error stack:', error.stack);
    
    // Don't use fallback - throw error to see what's wrong
    throw new Error(`Watermarking failed: ${error.message}`);
  }
}

// Routes

// API Helper - List all available endpoints
app.get('/api/helper', (req, res) => {
  try {
    const apiEndpoints = [
      {
        method: 'GET',
        endpoint: '/api/helper',
        description: 'List all available API endpoints (this endpoint)',
        parameters: 'None',
        response: 'JSON array of all API endpoints',
        example: 'GET /api/helper'
      },
      {
        method: 'GET',
        endpoint: '/api/categories',
        description: 'Get all available categories',
        parameters: 'None',
        response: 'JSON array of category names',
        example: 'GET /api/categories'
      },
      {
        method: 'POST',
        endpoint: '/api/categories',
        description: 'Create a new category',
        parameters: 'JSON body: { "name": "category_name" }',
        response: 'JSON with success message and category name',
        example: 'POST /api/categories\nBody: { "name": "Wedding Photos" }'
      },
      {
        method: 'DELETE',
        endpoint: '/api/categories/:categoryName',
        description: 'Delete a category and all its photos',
        parameters: 'URL parameter: categoryName',
        response: 'JSON with success message and deleted photo count',
        example: 'DELETE /api/categories/Wedding%20Photos'
      },
      {
        method: 'GET',
        endpoint: '/api/photos',
        description: 'Get all photos from database',
        parameters: 'None',
        response: 'JSON array of all photos with details',
        example: 'GET /api/photos'
      },
      {
        method: 'GET',
        endpoint: '/api/photos/watermarked',
        description: 'Get watermarked photos for gallery display',
        parameters: 'Query: ?category=category_name (optional)',
        response: 'JSON array of watermarked photos',
        example: 'GET /api/photos/watermarked?category=Wedding%20Photos'
      },
      {
        method: 'POST',
        endpoint: '/api/photos/upload',
        description: 'Upload and watermark multiple photos',
        parameters: 'FormData: clean files + category',
        response: 'JSON with upload results and counts',
        example: 'POST /api/photos/upload\nFormData: clean files + category field'
      },
      {
        method: 'DELETE',
        endpoint: '/api/photos/delete',
        description: 'Delete multiple photos by IDs',
        parameters: 'JSON body: { "photoIds": ["id1", "id2"] }',
        response: 'JSON with deletion results and counts',
        example: 'DELETE /api/photos/delete\nBody: { "photoIds": ["abc123", "def456"] }'
      },
      {
        method: 'GET',
        endpoint: '/uploads/*',
        description: 'Serve static files (watermarked/clean photos)',
        parameters: 'File path in uploads directory',
        response: 'Image file or 404 if not found',
        example: 'GET /uploads/watermarked/1-abc123-watermark.jpg'
      }
    ];

    const serverInfo = {
      server: 'IMAGE BUY APP Backend',
      version: '1.0.0',
      description: 'Photo management system with watermarking and category organization',
      totalEndpoints: apiEndpoints.length,
      endpoints: apiEndpoints,
      database: 'SQLite (photos.db)',
      categories: 'JSON file (categories.json)',
      uploads: 'uploads/clean and uploads/watermarked directories',
      features: [
        'Photo upload with automatic watermarking',
        'Category-based organization',
        'Batch operations (upload/delete)',
        'Static file serving',
        'SQLite database storage'
      ]
    };

    res.json(serverInfo);
  } catch (error) {
    console.error('Error in API helper:', error);
    res.status(500).json({ error: 'Failed to generate API helper' });
  }
});

// Get available categories
app.get('/api/categories', (req, res) => {
  try {
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Create new category
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
    
    // Then write to file asynchronously to avoid blocking
    fs.writeFile(categoriesPath, JSON.stringify(categories, null, 2), (err) => {
      if (err) {
        console.error('Error writing categories file:', err);
        // Remove from memory if file write failed
        categories = categories.filter(c => c !== categoryName);
      } else {
        console.log(`Categories file updated successfully`);
      }
    });
    
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

// Delete category
app.delete('/api/categories/:categoryName', (req, res) => {
  try {
    const { categoryName } = req.params;
    
    if (!categoryName) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    
    if (!categories.includes(categoryName)) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Count photos in this category before deletion
    const photoCount = db.prepare('SELECT COUNT(*) FROM photos WHERE category = ?').get(categoryName)['COUNT(*)'];
    
    // Delete all photos in this category from database
    db.prepare('DELETE FROM photos WHERE category = ?').run(categoryName);
    
    // Remove category from memory array first
    categories = categories.filter(c => c !== categoryName);
    
    // Then write to file asynchronously
    fs.writeFile(categoriesPath, JSON.stringify(categories, null, 2), (err) => {
      if (err) {
        console.error('Error writing categories file:', err);
        // Revert memory change if file write failed
        categories.push(categoryName);
      } else {
        console.log(`Categories file updated successfully`);
      }
    });
    
    console.log(`Category '${categoryName}' deleted with ${photoCount} photos`);
    
    res.json({ 
      message: `Category '${categoryName}' deleted successfully`,
      deletedPhotos: photoCount
    });
    
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// Get all photos
app.get('/api/photos', (req, res) => {
  const stmt = db.prepare('SELECT * FROM photos ORDER BY updated DESC');
  const photos = stmt.all();
  res.json(photos);
});

// Get watermarked photos (for display in gallery)
app.get('/api/photos/watermarked', (req, res) => {
  try {
    const { category } = req.query;
    console.log('Fetching watermarked photos from database...');
    console.log('Category filter:', category);
    
    let stmt, watermarkedPhotos;
    
    if (category) {
      // Filter by category
      stmt = db.prepare(`
        SELECT id, filename, path_to_watermark, price, category, updated
        FROM photos 
        WHERE path_to_watermark IS NOT NULL AND category = ?
        ORDER BY updated DESC
      `);
      watermarkedPhotos = stmt.all(category);
    } else {
      // Get all photos
      stmt = db.prepare(`
        SELECT id, filename, path_to_watermark, price, category, updated
        FROM photos 
        WHERE path_to_watermark IS NOT NULL
        ORDER BY updated DESC
      `);
      watermarkedPhotos = stmt.all();
    }
    
    console.log(`Found ${watermarkedPhotos.length} photos in database`);
    
    // Verify files exist and add full URLs
    const verifiedPhotos = watermarkedPhotos.map(photo => {
      const fullPath = path.join(__dirname, '..', photo.path_to_watermark);
      const fileExists = fs.existsSync(fullPath);
      
      console.log(`Photo ${photo.id}: ${photo.path_to_watermark} - Exists: ${fileExists}`);
      
      return {
        ...photo,
        path_to_watermark: `/${photo.path_to_watermark}`, // Add leading slash for proper URL
        fileExists
      };
    });
    
    const existingPhotos = verifiedPhotos.filter(photo => photo.fileExists);
    console.log(`Returning ${existingPhotos.length} verified watermarked photos`);
    console.log('Sample photo data:', existingPhotos[0]);
    
    res.json(existingPhotos);
  } catch (error) {
    console.error('Error fetching watermarked photos:', error);
    res.status(500).json({ error: 'Failed to fetch watermarked photos' });
  }
});

// Function to scan existing watermarked photos and populate database
function scanExistingWatermarkedPhotos() {
  try {
    const uploadPaths = getUploadPaths();
    const watermarkedDir = uploadPaths.watermarked;
    
    if (!fs.existsSync(watermarkedDir)) {
      console.log('Watermarked directory does not exist');
      return;
    }
    
    const files = fs.readdirSync(watermarkedDir);
    console.log(`Found ${files.length} files in watermarked directory:`, files);
    
    const imageFiles = files.filter(file => {
      const filePath = path.join(watermarkedDir, file);
      const stats = fs.statSync(filePath);
      return stats.isFile() && /\.(jpg|jpeg|png|gif|webp)$/i.test(file);
    });
    
    console.log(`Found ${imageFiles.length} image files:`, imageFiles);
    
    imageFiles.forEach((filename, index) => {
      // Check if this photo is already in the database
      const stmt = db.prepare('SELECT * FROM photos WHERE path_to_watermark = ?');
      const existingPhoto = stmt.get(`uploads/watermarked/${filename}`);
      
      if (!existingPhoto) {
        // Extract photo number and ID from filename
        // Expected format: "1-a1b2c3d4-watermark.jpg"
        const match = filename.match(/^(\d+)-([a-f0-9]+)-watermark\.(.+)$/);
        
        if (match) {
          const photoNumber = parseInt(match[1]);
          const photoId = match[2];
          const extension = match[3];
          
          // Check if clean version exists
          const cleanFilename = `${photoNumber}-${photoId}-clean.${extension}`;
          const cleanPath = path.join(uploadPaths.clean, cleanFilename);
          const hasCleanVersion = fs.existsSync(cleanPath);
          
          const photo = {
            id: photoId,
            filename: `${photoNumber}-${photoId}-watermark.${extension}`,
            path_to_watermark: `uploads/watermarked/${filename}`,
            path_to_clean: hasCleanVersion ? `uploads/clean/${cleanFilename}` : null,
            price: 5.99,
            category: 'event_photos',
            updated: new Date().toISOString()
          };
          
          const stmt = db.prepare('INSERT INTO photos (id, filename, path_to_watermark, path_to_clean, price, category, updated) VALUES (?, ?, ?, ?, ?, ?, ?)');
          stmt.run(photo.id, photo.filename, photo.path_to_watermark, photo.path_to_clean, photo.price, photo.category, photo.updated);
          console.log(`Added existing photo to database: ${photo.filename} (ID: ${photo.id})`);
        } else {
          console.log(`Skipping file with unexpected format: ${filename}`);
        }
      }
    });
    
    console.log(`Database now contains ${db.prepare('SELECT COUNT(*) FROM photos').get()['COUNT(*)']} photos`);
  } catch (error) {
    console.error('Error scanning existing watermarked photos:', error);
  }
}

// Get clean photos by IDs (for purchase/download)
app.get('/api/photos/clean', (req, res) => {
  try {
    const { ids } = req.query;
    
    if (!ids) {
      return res.status(400).json({ error: 'Photo IDs are required' });
    }
    
    // Parse IDs from query string (can be comma-separated or array)
    const photoIds = Array.isArray(ids) ? ids : ids.split(',');
    
    console.log('Requested clean photos for IDs:', photoIds);
    
    // Get clean photos from database
    const stmt = db.prepare('SELECT id, filename, path_to_clean, price, category FROM photos WHERE id IN (' + photoIds.map(() => '?').join(',') + ') ORDER BY updated DESC');
    const cleanPhotos = stmt.all(...photoIds);
    
    if (cleanPhotos.length === 0) {
      return res.status(404).json({ error: 'No photos found with the provided IDs' });
    }
    
    console.log(`Returning ${cleanPhotos.length} clean photos from database`);
    res.json(cleanPhotos);
    
  } catch (error) {
    console.error('Error fetching clean photos:', error);
    res.status(500).json({ error: 'Failed to fetch clean photos' });
  }
});

// Manual scan of existing photos
app.get('/api/photos/scan-existing', (req, res) => {
  try {
    console.log('Manual scan of existing photos requested');
    const beforeCount = db.prepare('SELECT COUNT(*) FROM photos').get()['COUNT(*)'];
    scanExistingWatermarkedPhotos();
    const afterCount = db.prepare('SELECT COUNT(*) FROM photos').get()['COUNT(*)'];
    const addedCount = afterCount - beforeCount;
    
    console.log(`Scan completed. Before: ${beforeCount}, After: ${afterCount}, Added: ${addedCount}`);
    
    res.json({ 
      message: 'Scan completed successfully', 
      beforeCount, 
      afterCount, 
      addedCount,
      totalPhotos: afterCount
    });
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({ error: 'Failed to scan existing photos' });
  }
});

// Re-watermark existing photos
app.post('/api/photos/re-watermark', async (req, res) => {
  try {
    console.log('Re-watermarking existing photos requested');
    
    // Get all photos that have clean versions
    const stmt = db.prepare('SELECT * FROM photos WHERE path_to_clean IS NOT NULL');
    const photos = stmt.all();
    
    console.log(`Found ${photos.length} photos to re-watermark`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const photo of photos) {
      try {
        // Get the clean file path
        const cleanPath = path.join(__dirname, '..', photo.path_to_clean);
        const watermarkedPath = path.join(__dirname, '..', photo.path_to_watermark);
        
        // Check if clean file exists
        if (!fs.existsSync(cleanPath)) {
          console.log(`Clean file not found for photo ${photo.id}: ${cleanPath}`);
          continue;
        }
        
        console.log(`Re-watermarking photo ${photo.id}: ${photo.filename}`);
        
        // Re-create watermarked version
        await addWatermark(cleanPath, watermarkedPath, 'WaterMarked Preview');
        
        successCount++;
        console.log(`✅ Successfully re-watermarked photo ${photo.id}`);
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Failed to re-watermark photo ${photo.id}:`, error.message);
      }
    }
    
    console.log(`Re-watermarking completed. Success: ${successCount}, Errors: ${errorCount}`);
    
    res.json({ 
      message: 'Re-watermarking completed', 
      totalPhotos: photos.length,
      successCount,
      errorCount
    });
    
  } catch (error) {
    console.error('Re-watermarking error:', error);
    res.status(500).json({ error: 'Failed to re-watermark photos' });
  }
});

// Delete photos (admin only)
app.delete('/api/photos/delete', async (req, res) => {
  try {
    const { photoIds } = req.body;
    
    if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
      return res.status(400).json({ 
        error: 'Photo IDs array is required and must not be empty' 
      });
    }
    
    console.log(`Delete request received for ${photoIds.length} photos:`, photoIds);
    
    // Get photo details from database
    const placeholders = photoIds.map(() => '?').join(',');
    const stmt = db.prepare(`SELECT id, filename, path_to_watermark, path_to_clean FROM photos WHERE id IN (${placeholders})`);
    const photosToDelete = stmt.all(...photoIds);
    
    if (photosToDelete.length === 0) {
      return res.status(404).json({ error: 'No photos found with the provided IDs' });
    }
    
    console.log(`Found ${photosToDelete.length} photos to delete`);
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    const deletedFiles = [];
    
    for (const photo of photosToDelete) {
      try {
        console.log(`\n--- Deleting photo: ${photo.filename} (ID: ${photo.id}) ---`);
        
        // Delete watermarked file
        if (photo.path_to_watermark) {
          const watermarkedPath = path.join(__dirname, '..', photo.path_to_watermark);
          if (fs.existsSync(watermarkedPath)) {
            fs.unlinkSync(watermarkedPath);
            deletedFiles.push(`Watermarked: ${photo.path_to_watermark}`);
            console.log(`✅ Deleted watermarked file: ${photo.path_to_watermark}`);
          } else {
            console.log(`⚠️ Watermarked file not found: ${watermarkedPath}`);
          }
        }
        
        // Delete clean file
        if (photo.path_to_clean) {
          const cleanPath = path.join(__dirname, '..', photo.path_to_clean);
          if (fs.existsSync(cleanPath)) {
            fs.unlinkSync(cleanPath);
            deletedFiles.push(`Clean: ${photo.path_to_clean}`);
            console.log(`✅ Deleted clean file: ${photo.path_to_clean}`);
          } else {
            console.log(`⚠️ Clean file not found: ${cleanPath}`);
          }
        }
        
        // Delete from database
        const deleteStmt = db.prepare('DELETE FROM photos WHERE id = ?');
        deleteStmt.run(photo.id);
        console.log(`✅ Deleted from database: ${photo.id}`);
        
        successCount++;
        console.log(`✅ Photo ${photo.filename} deleted successfully`);
        
      } catch (error) {
        errorCount++;
        const errorMsg = `Failed to delete photo ${photo.filename} (${photo.id}): ${error.message}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
        console.error('Error details:', error);
      }
    }
    
    console.log(`\n--- Deletion Summary ---`);
    console.log(`Total photos requested: ${photoIds.length}`);
    console.log(`Successfully deleted: ${successCount}`);
    console.log(`Failed: ${errorCount}`);
    console.log(`Files deleted: ${deletedFiles.length}`);
    
    if (errors.length > 0) {
      console.log('Errors encountered:');
      errors.forEach(error => console.log(`- ${error}`));
    }
    
    const totalPhotosInDB = db.prepare('SELECT COUNT(*) FROM photos').get()['COUNT(*)'];
    console.log(`Remaining photos in database: ${totalPhotosInDB}`);
    
    if (errorCount === 0) {
      res.json({ 
        message: `All ${successCount} photos deleted successfully!`, 
        deletedCount: successCount,
        deletedFiles: deletedFiles
      });
    } else {
      res.json({ 
        message: `${successCount} photos deleted successfully, ${errorCount} failed.`, 
        deletedCount: successCount,
        failedCount: errorCount,
        deletedFiles: deletedFiles,
        errors: errors,
        partial: true
      });
    }
    
  } catch (error) {
    console.error('Delete photos error:', error);
    res.status(500).json({ error: `Failed to delete photos: ${error.message}` });
  }
});

// Upload photos (admin only) - simplified for categories only
app.post('/api/photos/upload', upload.fields([
  { name: 'clean', maxCount: 100 }
]), async (req, res) => {
  try {
    console.log('Upload request received');
    console.log('Files:', req.files);
    console.log('Body:', req.body);
    
    const cleanFiles = req.files.clean || [];
    const category = req.body.category || 'general';
    
    console.log('Clean files count:', cleanFiles.length);
    console.log('Category for ALL photos:', category);
    console.log('=== ALL PHOTOS WILL USE THE SAME CATEGORY ===');
    
    if (cleanFiles.length === 0) {
      return res.status(400).json({ 
        error: 'Clean photos are required',
        cleanCount: cleanFiles.length
      });
    }
    
    console.log('Processing photos and adding watermarks...');
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (let i = 0; i < cleanFiles.length; i++) {
      try {
        const cleanFile = cleanFiles[i];
        console.log(`\n--- Processing photo ${i + 1}/${cleanFiles.length}: ${cleanFile.originalname} ---`);
        console.log(`📸 Photo ${i + 1} will be assigned to category: "${category}"`);
        
        const photoNumber = db.prepare('SELECT COUNT(*) FROM photos').get()['COUNT(*)'] + 1; // Sequential numbering starting from 1
        const fullUuid = uuidv4();
        const shortId = fullUuid.split('-')[0]; // Use first 8 characters of UUID
        
        // Get upload paths (simple structure)
        const uploadPaths = getUploadPaths();
        
        // Create structured filenames
        const cleanFilename = `${photoNumber}-${shortId}-clean${path.extname(cleanFile.originalname)}`;
        const watermarkedFilename = `${photoNumber}-${shortId}-watermark${path.extname(cleanFile.originalname)}`;
        
        const cleanPath = path.join(uploadPaths.clean, cleanFilename);
        const watermarkedPath = path.join(uploadPaths.watermarked, watermarkedFilename);
        
        console.log(`Clean filename: ${cleanFilename}`);
        console.log(`Watermarked filename: ${watermarkedFilename}`);
        console.log(`Upload paths:`, uploadPaths);
        console.log(`🎯 Category for this photo: "${category}" (same for all photos)`);
        
        // Ensure directories exist
        fs.ensureDirSync(uploadPaths.clean);
        fs.ensureDirSync(uploadPaths.watermarked);
        
        // Save the clean file with new name (from memory buffer)
        await fs.writeFile(cleanPath, cleanFile.buffer);
        console.log('Clean file saved successfully');
        
        // Add watermark to create watermarked version
        console.log('Starting watermarking process...');
        await addWatermark(cleanPath, watermarkedPath, 'WaterMarked Preview');
        console.log('Watermarking completed successfully');
        
        // Create photo record with category only
        const stmt = db.prepare('INSERT INTO photos (id, filename, path_to_watermark, path_to_clean, price, category, updated) VALUES (?, ?, ?, ?, ?, ?, ?)');
        const currentDate = new Date().toISOString();
        stmt.run(shortId, watermarkedFilename, `uploads/watermarked/${watermarkedFilename}`, `uploads/clean/${cleanFilename}`, 5.99, category, currentDate);
        console.log(`✅ Photo added to database with category: "${category}"`);
        
        successCount++;
        console.log(`✅ Photo ${i + 1} completed successfully: ${cleanFile.originalname} (ID: ${shortId}) - Category: "${category}"`);
        
      } catch (error) {
        errorCount++;
        const errorMsg = `Photo ${i + 1} (${cleanFiles[i].originalname}): ${error.message}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
        console.error('Error details:', error);
        
        // Continue processing other photos instead of stopping
        console.log('Continuing with next photo...');
      }
    }
    
    console.log(`\n--- Upload Summary ---`);
    console.log(`Total photos: ${cleanFiles.length}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Failed: ${errorCount}`);
    console.log(`🎯 ALL photos were assigned to category: "${category}"`);
    
    if (errors.length > 0) {
      console.log('Errors encountered:');
      errors.forEach(error => console.log(`- ${error}`));
    }
    
    const totalPhotosInDB = db.prepare('SELECT COUNT(*) FROM photos').get()['COUNT(*)'];
    console.log(`Total photos in database: ${totalPhotosInDB}`);
    
    if (errorCount === 0) {
      res.json({ 
        message: `All ${successCount} photos uploaded and watermarked successfully!`, 
        count: successCount,
        category: category
      });
    } else {
      res.json({ 
        message: `${successCount} photos uploaded successfully, ${errorCount} failed.`, 
        count: successCount,
        errors: errors,
        category: category,
        partial: true
      });
      }
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────
// myPOS Payment Functions
// ─────────────────────────────────────────────────────────

// Βοηθητικό: φτιάχνει το canonical string που θα υπογράψουμε
function buildCanonical(params) {
  // 1) πετάμε το 'signature'
  const entries = Object.entries(params).filter(([k]) => k.toLowerCase() !== "signature");

  // 2) ταξινόμηση αλφαβητικά με βάση το key
  entries.sort(([a], [b]) => a.localeCompare(b));

  // 3) join ως key=value με & (χωρίς επιπλέον spaces)
  // (αν κάποια τιμή έχει & ή = άφησέ τη raw, το myPOS SDK περιμένει raw values)
  return entries.map(([k, v]) => `${k}=${v}`).join("&");
}

// ─────────────────────────────────────────────────────────
// 1) Υπογραφή για Embedded Checkout
// Frontend: POST /mypos/sign με το αντικείμενο παραμέτρων ΧΩΡΙΣ signature
// Επιστρέφουμε { signature }
app.post("/mypos/sign", (req, res) => {
  try {
    if (!MYPOS_PRIVATE_KEY_PEM) {
      return res.status(503).json({ error: "mypos_not_configured" });
    }

    const params = req.body || {};
    const canonical = buildCanonical(params);

    const signer = crypto.createSign("RSA-SHA256");
    signer.update(Buffer.from(canonical, "utf8"));
    const signature = signer.sign(MYPOS_PRIVATE_KEY_PEM, "base64");

    return res.json({ signature });
  } catch (err) {
    console.error("sign error:", err);
    return res.status(500).json({ error: "sign_failed" });
  }
});

// ─────────────────────────────────────────────────────────
// 2) Notify URL από myPOS (ΠΡΕΠΕΙ να είναι https/public στο sandbox/live)
// myPOS απαιτεί: απάντηση 200 με body ακριβώς "OK"
app.post("/mypos/notify", (req, res) => {
  try {
    // Τα πεδία έρχονται form-url-encoded στο req.body
    console.log(" myPOS notify payload:", req.body);

    // (Προαιρετικά) verify signature του notify:
    // Αν το payload περιέχει 'signature', φτιάχνεις canonical και επαληθεύεις:
    if (MYPOS_PUBLIC_CERT_PEM && req.body && req.body.signature) {
      const { signature, ...rest } = req.body;
      const canonical = buildCanonical(rest);
      const verifier = crypto.createVerify("RSA-SHA256");
      verifier.update(Buffer.from(canonical, "utf8"));
      const isValid = verifier.verify(MYPOS_PUBLIC_CERT_PEM, signature, "base64");
      if (!isValid) {
        console.warn(" notify signature INVALID");
        // Δεν απαντάμε με error για να μη ξανα-χτυπάει αέναα, απλά log
      } else {
        console.log(" notify signature OK");
      }
    }

    // Update order status based on myPOS response
    if (req.body && req.body.orderId) {
      const orderId = req.body.orderId;
      const status = req.body.status || 'unknown';
      
      // Update order in database
      const stmt = db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE mypos_order_id = ?');
      stmt.run(status, new Date().toISOString(), orderId);
      
      console.log(` Order ${orderId} status updated to: ${status}`);
    }

    // Απάντηση που απαιτείται από myPOS:
    return res.status(200).send("OK");
  } catch (err) {
    console.error("notify error:", err);
    // Παρόλα αυτά προτείνεται να απαντήσεις "OK" για να μη γίνει retry storm
    return res.status(200).send("OK");
  }
});

// ─────────────────────────────────────────────────────────
// 3) Create order for photos (before payment)
app.post("/api/orders", (req, res) => {
  try {
    const { photoIds, totalAmount } = req.body;
    
    if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
      return res.status(400).json({ error: 'Photo IDs array is required' });
    }
    
    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({ error: 'Valid total amount is required' });
    }
    
    const orderId = uuidv4();
    const currentDate = new Date().toISOString();
    
    // Create order in database
    const stmt = db.prepare('INSERT INTO orders (id, photo_ids, total_amount, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)');
    stmt.run(orderId, JSON.stringify(photoIds), totalAmount, 'pending', currentDate, currentDate);
    
    console.log(`Order created: ${orderId} for ${photoIds.length} photos, total: €${totalAmount}`);
    
    res.json({ 
      orderId,
      message: 'Order created successfully',
      totalAmount,
      photoCount: photoIds.length
    });
    
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// ─────────────────────────────────────────────────────────
// 4) Get order status
app.get("/api/orders/:orderId", (req, res) => {
  try {
    const { orderId } = req.params;
    
    const stmt = db.prepare('SELECT * FROM orders WHERE id = ?');
    const order = stmt.get(orderId);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Parse photo IDs back to array
    order.photo_ids = JSON.parse(order.photo_ids);
    
    res.json(order);
    
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// ─────────────────────────────────────────────────────────
// 5) Health check endpoint
app.get("/health", (_req, res) => res.json({ ok: true }));

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

app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
  console.log(` Photo upload directory: ${path.join(__dirname, '..', 'uploads')}`);
  console.log(` myPOS payment endpoints: ${MYPOS_PRIVATE_KEY_PEM ? 'ENABLED' : 'DISABLED'}`);
  console.log(` Allowed origin: ${ALLOWED_ORIGIN}`);
  console.log(` Health check: http://localhost:${PORT}/health`);
  console.log(` API helper: http://localhost:${PORT}/api/helper`);
});