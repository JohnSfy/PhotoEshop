import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ArrowLeft, CreditCard, Mail, User, CheckCircle, AlertCircle, ExternalLink, Clock } from 'lucide-react';
import axios from 'axios';

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, cartTotal, clearCart } = useCart();
  
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [orderId, setOrderId] = useState(null);
  const [orderStatus, setOrderStatus] = useState('pending');
  const [checkoutUrl, setCheckoutUrl] = useState('');

  // Redirect if cart is empty
  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/cart');
    }
  }, [cartItems, navigate]);

  // Poll order status if order is created
  useEffect(() => {
    if (!orderId) return;

    const checkStatus = async () => {
      try {
        const response = await axios.get(`/api/order-status/${orderId}`);
        const { status } = response.data;
        
        if (status === 'completed') {
          setOrderStatus('completed');
          clearCart();
          // Stop polling
          return;
        } else if (status === 'failed') {
          setOrderStatus('failed');
          setPaymentError('Payment failed. Please try again.');
          // Stop polling
          return;
        }
        
        // Continue polling if still pending
        setTimeout(checkStatus, 3000);
      } catch (error) {
        console.error('Error checking order status:', error);
      }
    };

    // Start polling after 5 seconds
    const timer = setTimeout(checkStatus, 5000);
    return () => clearTimeout(timer);
  }, [orderId, clearCart]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!customerEmail || !customerName) {
      setPaymentError('Please fill in all required fields');
      return;
    }

    setIsProcessing(true);
    setPaymentError('');

    try {
      // Create checkout session
      const { data } = await axios.post('/api/create-checkout', {
        photoIds: cartItems.map(item => item.id),
        customerEmail,
        customerName
      });

      setOrderId(data.orderId);
      setCheckoutUrl(data.checkoutUrl);
      
      // Redirect to Viva Wallet
      window.location.href = data.checkoutUrl;
      
    } catch (error) {
      setPaymentError(error.response?.data?.error || 'Failed to create checkout. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (orderStatus === 'completed') {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful! 🎉</h1>
        <p className="text-lg text-gray-600 mb-6">
          Thank you for your purchase! Your clean photos have been sent to your email.
        </p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-800">
            <strong>Email:</strong> {customerEmail}
          </p>
          <p className="text-green-800">
            <strong>Photos purchased:</strong> {cartItems.length}
          </p>
          <p className="text-green-800">
            <strong>Total amount:</strong> ${cartTotal.toFixed(2)}
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="btn-primary"
        >
          Return to Gallery
        </button>
      </div>
    );
  }

  if (orderStatus === 'failed') {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Failed</h1>
        <p className="text-lg text-gray-600 mb-6">
          Your payment was not completed. Please try again.
        </p>
        <button
          onClick={() => {
            setOrderStatus('pending');
            setOrderId(null);
            setCheckoutUrl('');
          }}
          className="btn-primary"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <button
          onClick={() => navigate('/cart')}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-1">Complete your purchase to receive clean photos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Checkout Form */}
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Customer Information</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Information */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="h-4 w-4 inline mr-2" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="input-field"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="h-4 w-4 inline mr-2" />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="input-field"
                    placeholder="Enter your email address"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Clean photos will be sent to this email address
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {paymentError && (
                <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="h-5 w-5" />
                  <span>{paymentError}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Creating Checkout...' : `Proceed to Payment - $${cartTotal.toFixed(2)}`}
              </button>
            </form>
          </div>

          {/* Viva Wallet Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Secure External Payment</p>
                <p>You'll be redirected to Viva Wallet's secure checkout page for payment. Your payment information is never stored on our servers.</p>
              </div>
            </div>
          </div>

          {/* Order Status */}
          {orderId && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Order Created</p>
                  <p>Order ID: {orderId}</p>
                  <p>Redirecting to Viva Wallet...</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Photos ({cartItems.length})</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-sm text-gray-600">
                <span>Processing fee</span>
                <span>Free</span>
              </div>
              
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-primary-600">${cartTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Selected Photos */}
          <div className="card p-6">
            <h4 className="font-medium text-gray-900 mb-4">Selected Photos</h4>
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center space-x-3">
                  <img
                    src={item.watermarkedUrl}
                    alt={item.filename}
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.filename}
                    </p>
                    <p className="text-xs text-gray-500">
                      Qty: {item.quantity} × ${item.price}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* What You'll Get */}
          <div className="card p-6">
            <h4 className="font-medium text-gray-900 mb-4">What You'll Get</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>High-resolution clean versions</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>No watermarks or logos</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Instant email delivery</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Professional quality photos</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
