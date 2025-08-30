const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000/api';

async function testPhotoUpload() {
  console.log('📸 Testing Photo Upload API...\n');

  try {
    // Create a simple test image (1x1 pixel PNG)
    const testImagePath = path.join(__dirname, 'test-image.png');
    
    // Create a minimal PNG file for testing
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
      0x49, 0x48, 0x44, 0x52, // IHDR
      0x00, 0x00, 0x00, 0x01, // width: 1
      0x00, 0x00, 0x00, 0x01, // height: 1
      0x08, 0x02, 0x00, 0x00, // bit depth, color type, compression, filter, interlace
      0x00, 0x00, 0x00, 0x0C, // IDAT chunk length
      0x49, 0x44, 0x41, 0x54, // IDAT
      0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, // compressed data
      0x00, 0x00, 0x00, 0x00, // IEND chunk length
      0x49, 0x45, 0x4E, 0x44, // IEND
      0xAE, 0x42, 0x60, 0x82  // CRC
    ]);
    
    fs.writeFileSync(testImagePath, pngBuffer);
    console.log('✅ Test image created');

    // Test 1: Upload photo
    console.log('\n1️⃣ Testing Photo Upload...');
    
    const formData = new FormData();
    formData.append('photo', fs.createReadStream(testImagePath));
    formData.append('price', '15.99');
    formData.append('category', 'test');

    const uploadResponse = await axios.post(`${BASE_URL}/photos/upload`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    console.log('✅ Photo Upload Response:', uploadResponse.data);
    const photoId = uploadResponse.data.photo.id;
    console.log('');

    // Test 2: Get the uploaded photo
    console.log('2️⃣ Testing Get Photo by ID...');
    const photoResponse = await axios.get(`${BASE_URL}/photos/${photoId}`);
    console.log('✅ Photo Retrieved:', photoResponse.data);
    console.log('');

    // Test 3: Update photo
    console.log('3️⃣ Testing Update Photo...');
    const updateResponse = await axios.put(`${BASE_URL}/photos/${photoId}`, {
      price: 19.99,
      category: 'updated-test'
    });
    console.log('✅ Photo Updated:', updateResponse.data);
    console.log('');

    // Test 4: Get updated photo
    console.log('4️⃣ Testing Get Updated Photo...');
    const updatedPhotoResponse = await axios.get(`${BASE_URL}/photos/${photoId}`);
    console.log('✅ Updated Photo:', updatedPhotoResponse.data);
    console.log('');

    // Test 5: Get photos by category
    console.log('5️⃣ Testing Get Photos by Category...');
    const categoryResponse = await axios.get(`${BASE_URL}/photos/category/updated-test`);
    console.log('✅ Photos by Category:', categoryResponse.data);
    console.log('');

    // Test 6: Get all photos
    console.log('6️⃣ Testing Get All Photos...');
    const allPhotosResponse = await axios.get(`${BASE_URL}/photos`);
    console.log('✅ All Photos:', allPhotosResponse.data);
    console.log('');

    // Test 7: Delete photo
    console.log('7️⃣ Testing Delete Photo...');
    const deleteResponse = await axios.delete(`${BASE_URL}/photos/${photoId}`);
    console.log('✅ Photo Deleted:', deleteResponse.data);
    console.log('');

    // Clean up test image
    fs.unlinkSync(testImagePath);
    console.log('✅ Test image cleaned up');

    console.log('🎉 Photo Upload API tests completed successfully!');
    console.log('\n📋 Summary of tested endpoints:');
    console.log('   ✅ POST /api/photos/upload');
    console.log('   ✅ GET /api/photos/:id');
    console.log('   ✅ PUT /api/photos/:id');
    console.log('   ✅ GET /api/photos/category/:category');
    console.log('   ✅ GET /api/photos');
    console.log('   ✅ DELETE /api/photos/:id');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

// Run photo upload tests
testPhotoUpload();
