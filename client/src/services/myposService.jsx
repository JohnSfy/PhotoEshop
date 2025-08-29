import axios from 'axios';

// Base API URL - adjust this to match your backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// myPOS configuration - these should come from environment variables in production
const MYPOS_CONFIG = {
  // myPOS Sandbox/Live configuration
  // These values should be provided by myPOS
  merchantId: import.meta.env.VITE_MYPOS_MERCHANT_ID || 'demo',
  posId: import.meta.env.VITE_MYPOS_POS_ID || 'demo',
  clientId: import.meta.env.VITE_MYPOS_CLIENT_ID || 'demo',
  clientSecret: import.meta.env.VITE_MYPOS_CLIENT_SECRET || 'demo',
  
  // myPOS API endpoints
  apiUrl: import.meta.env.VITE_MYPOS_API_URL || 'https://mypos.com/v2/',
  
  // Currency and language
  currency: 'EUR',
  language: 'en',
  
  // Callback URLs
  successUrl: import.meta.env.VITE_MYPOS_SUCCESS_URL || 'http://localhost:5173/payment/success',
  cancelUrl: import.meta.env.VITE_MYPOS_CANCEL_URL || 'http://localhost:5173/payment/cancel',
  notifyUrl: import.meta.env.VITE_MYPOS_NOTIFY_URL || 'http://localhost:5000/mypos/notify',
};

class MyPOSService {
  constructor() {
    this.axios = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
    });
  }

  // Create a new order in our database
  async createOrder(photoIds, totalAmount, customerInfo) {
    try {
      const response = await this.axios.post('/api/orders', {
        photoIds,
        totalAmount,
        customerInfo
      });
      
      return response.data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw new Error(error.response?.data?.error || 'Failed to create order');
    }
  }

  // Get order status from our database
  async getOrderStatus(orderId) {
    try {
      const response = await this.axios.get(`/api/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching order status:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch order status');
    }
  }

  // Get signature from our backend for myPOS payment
  async getPaymentSignature(paymentParams) {
    try {
      const response = await this.axios.post('/mypos/sign', paymentParams);
      return response.data.signature;
    } catch (error) {
      console.error('Error getting payment signature:', error);
      throw new Error(error.response?.data?.error || 'Failed to get payment signature');
    }
  }

  // Create myPOS payment parameters
  createPaymentParams(orderId, amount, customerInfo) {
    const timestamp = Math.floor(Date.now() / 1000);
    
    return {
      // Required myPOS parameters
      merchantId: MYPOS_CONFIG.merchantId,
      posId: MYPOS_CONFIG.posId,
      clientId: MYPOS_CONFIG.clientId,
      clientSecret: MYPOS_CONFIG.clientSecret,
      
      // Order details
      orderId: orderId,
      amount: amount.toFixed(2),
      currency: MYPOS_CONFIG.currency,
      language: MYPOS_CONFIG.language,
      
      // Customer information
      customerName: customerInfo.name,
      customerEmail: customerInfo.email,
      
      // Callback URLs
      successUrl: MYPOS_CONFIG.successUrl,
      cancelUrl: MYPOS_CONFIG.cancelUrl,
      notifyUrl: MYPOS_CONFIG.notifyUrl,
      
      // Timestamp for security
      timestamp: timestamp.toString(),
      
      // Additional parameters
      description: `Photo purchase - Order ${orderId}`,
      items: `Photos (${customerInfo.photoCount})`,
    };
  }

  // Process payment with myPOS
  async processPayment(orderId, amount, customerInfo) {
    try {
      // Step 1: Create order in our database
      const order = await this.createOrder(
        customerInfo.photoIds, 
        amount, 
        customerInfo
      );
      
      // Step 2: Create myPOS payment parameters
      const paymentParams = this.createPaymentParams(orderId, amount, customerInfo);
      
      // Step 3: Get signature from our backend
      const signature = await this.getPaymentSignature(paymentParams);
      
      // Step 4: Add signature to payment parameters
      const finalParams = {
        ...paymentParams,
        signature: signature
      };
      
      // Step 5: Redirect to myPOS checkout
      this.redirectToMyPOS(finalParams);
      
      return {
        success: true,
        orderId: order.orderId,
        message: 'Redirecting to payment...'
      };
      
    } catch (error) {
      console.error('Payment processing error:', error);
      throw error;
    }
  }

  // Redirect to myPOS checkout page
  redirectToMyPOS(paymentParams) {
    try {
      // Create form data for POST request to myPOS
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = `${MYPOS_CONFIG.apiUrl}checkout`;
      form.target = '_self';
      
      // Add all payment parameters as hidden fields
      Object.entries(paymentParams).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });
      
      // Submit the form
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
      
    } catch (error) {
      console.error('Error redirecting to myPOS:', error);
      throw new Error('Failed to redirect to payment page');
    }
  }

  // Check if payment was successful (called from success page)
  async verifyPayment(orderId, paymentId) {
    try {
      // Get order status from our database
      const order = await this.getOrderStatus(orderId);
      
      // In a real implementation, you might also verify with myPOS API
      // For now, we'll rely on the notify callback to update the status
      
      return {
        success: true,
        order: order,
        paymentId: paymentId
      };
      
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  }

  // Handle payment cancellation
  async cancelPayment(orderId) {
    try {
      // Update order status to cancelled
      const response = await this.axios.patch(`/api/orders/${orderId}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Error cancelling payment:', error);
      throw new Error(error.response?.data?.error || 'Failed to cancel payment');
    }
  }
}

// Export singleton instance
export const myPOSService = new MyPOSService();

// Export configuration for external use
export { MYPOS_CONFIG };
