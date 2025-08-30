const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test data
const testPhoto = {
  price: 9.99,
  category: 'test'
};

const testOrder = {
  photo_ids: ['test-photo-1', 'test-photo-2'],
  total_amount: 19.98,
  email: 'test@example.com'
};

async function testAPI() {
  console.log('🧪 Testing Image Buy App Backend APIs...\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Check...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check:', health.data);
    console.log('');

    // Test 2: Get Categories
    console.log('2️⃣ Testing Get Categories...');
    const categories = await axios.get(`${BASE_URL}/categories`);
    console.log('✅ Categories:', categories.data);
    console.log('');

    // Test 3: Get Stats
    console.log('3️⃣ Testing Get Stats...');
    const stats = await axios.get(`${BASE_URL}/stats`);
    console.log('✅ Stats:', stats.data);
    console.log('');

    // Test 4: Get Photos (should be empty initially)
    console.log('4️⃣ Testing Get Photos...');
    const photos = await axios.get(`${BASE_URL}/photos`);
    console.log('✅ Photos:', photos.data);
    console.log('');

    // Test 5: Get Orders (should be empty initially)
    console.log('5️⃣ Testing Get Orders...');
    const orders = await axios.get(`${BASE_URL}/orders`);
    console.log('✅ Orders:', orders.data);
    console.log('');

    // Test 6: Create Order
    console.log('6️⃣ Testing Create Order...');
    const newOrder = await axios.post(`${BASE_URL}/orders`, testOrder);
    console.log('✅ Order Created:', newOrder.data);
    const orderId = newOrder.data.order.id;
    console.log('');

    // Test 7: Get Order by ID
    console.log('7️⃣ Testing Get Order by ID...');
    const order = await axios.get(`${BASE_URL}/orders/${orderId}`);
    console.log('✅ Order Retrieved:', order.data);
    console.log('');

    // Test 8: Update Order Status
    console.log('8️⃣ Testing Update Order Status...');
    const updatedOrder = await axios.put(`${BASE_URL}/orders/${orderId}/status`, {
      status: 'completed',
      mypos_order_id: 'test-payment-123'
    });
    console.log('✅ Order Status Updated:', updatedOrder.data);
    console.log('');

    // Test 9: Get Orders Again (should show the new order)
    console.log('9️⃣ Testing Get Orders (after creation)...');
    const ordersAfter = await axios.get(`${BASE_URL}/orders`);
    console.log('✅ Orders After Creation:', ordersAfter.data);
    console.log('');

    // Test 10: Get Photos by Category
    console.log('🔟 Testing Get Photos by Category...');
    const photosByCategory = await axios.get(`${BASE_URL}/photos/category/test`);
    console.log('✅ Photos by Category:', photosByCategory.data);
    console.log('');

    // Test 11: Delete Order
    console.log('1️⃣1️⃣ Testing Delete Order...');
    const deletedOrder = await axios.delete(`${BASE_URL}/orders/${orderId}`);
    console.log('✅ Order Deleted:', deletedOrder.data);
    console.log('');

    console.log('🎉 All API tests completed successfully!');
    console.log('\n📋 Summary of tested endpoints:');
    console.log('   ✅ GET /api/health');
    console.log('   ✅ GET /api/categories');
    console.log('   ✅ GET /api/stats');
    console.log('   ✅ GET /api/photos');
    console.log('   ✅ GET /api/orders');
    console.log('   ✅ POST /api/orders');
    console.log('   ✅ GET /api/orders/:id');
    console.log('   ✅ PUT /api/orders/:id/status');
    console.log('   ✅ DELETE /api/orders/:id');
    console.log('   ✅ GET /api/photos/category/:category');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

// Run tests
testAPI();
