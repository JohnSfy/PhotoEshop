const fs = require('fs-extra');
const path = require('path');

async function setupUploads() {
  try {
    const backendDir = __dirname;
    const uploadsDir = path.join(backendDir, 'uploads');
    const cleanDir = path.join(uploadsDir, 'clean');
    const watermarkedDir = path.join(uploadsDir, 'watermarked');

    // Create directories if they don't exist
    await fs.ensureDir(cleanDir);
    await fs.ensureDir(watermarkedDir);

    console.log('✅ Uploads directory structure created:');
    console.log(`   Clean photos: ${cleanDir}`);
    console.log(`   Watermarked photos: ${watermarkedDir}`);

    // Check if there are photos in the root uploads folder
    const rootUploadsDir = path.join(backendDir, '..', 'uploads');
    if (fs.existsSync(rootUploadsDir)) {
      console.log('\n📁 Found photos in root uploads folder:');
      
      const rootCleanDir = path.join(rootUploadsDir, 'clean');
      const rootWatermarkedDir = path.join(rootUploadsDir, 'watermarked');
      
      if (fs.existsSync(rootCleanDir)) {
        const cleanFiles = fs.readdirSync(rootCleanDir);
        console.log(`   Clean photos: ${cleanFiles.length} files`);
      }
      
      if (fs.existsSync(rootWatermarkedDir)) {
        const watermarkedFiles = fs.readdirSync(rootWatermarkedDir);
        console.log(`   Watermarked photos: ${watermarkedFiles.length} files`);
      }
      
      console.log('\n💡 You can now move photos from the root uploads folder to backend/uploads/');
      console.log('   Or use the /api/photos/scan-existing endpoint to populate the database');
    }

  } catch (error) {
    console.error('❌ Error setting up uploads directory:', error);
  }
}

setupUploads();
