const fs = require('fs-extra');
const path = require('path');
const DatabaseManager = require('./database/dbManager');

async function setupPhotos() {
  const dbManager = new DatabaseManager();
  
  try {
    await dbManager.init();
    console.log('Database initialized');
    
    const uploadPaths = {
      clean: path.join(__dirname, '..', 'uploads', 'clean'),
      watermarked: path.join(__dirname, '..', 'uploads', 'watermarked')
    };
    
    // Check if directories exist
    if (!fs.existsSync(uploadPaths.watermarked)) {
      console.log('Watermarked directory does not exist');
      return;
    }
    
    const watermarkedFiles = fs.readdirSync(uploadPaths.watermarked);
    console.log(`Found ${watermarkedFiles.length} watermarked files`);
    
    for (const filename of watermarkedFiles) {
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
          filename: filename,
          watermark_path: `uploads/watermarked/${filename}`,
          clean_path: hasCleanVersion ? `uploads/clean/${cleanFilename}` : null,
          price: 5.99,
          category: 'event_photos',
          updated: new Date().toISOString()
        };
        
        // Check if photo already exists in database
        const existingPhotos = await dbManager.getPhotosByCategory('event_photos');
        const exists = existingPhotos.some(p => p.id === photoId);
        
        if (!exists) {
          await dbManager.addPhoto(photo);
          console.log(`✅ Added photo: ${filename}`);
        } else {
          console.log(`⏭️ Photo already exists: ${filename}`);
        }
      }
    }
    
    console.log('Setup completed!');
    
  } catch (error) {
    console.error('Setup error:', error);
  } finally {
    await dbManager.close();
  }
}

setupPhotos();
