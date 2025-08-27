import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useOrder } from '../context/OrderContext';
import { ArrowLeft, CreditCard, Mail, User, CheckCircle, AlertCircle, ExternalLink, Clock, Loader2 } from 'lucide-react';

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, cartTotal, clearCart } = useCart();
  const { 
    createOrder, 
    processPayment, 
    currentOrder, 
    isProcessing, 
    paymentError, 
    paymentSuccess,
    clearPaymentError,
    clearCurrentOrder
  } = useOrder();
  
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [orderStep, setOrderStep] = useState('form'); // 'form', 'processing', 'redirecting'

  // Redirect if cart is empty
  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/cart');
    }
  }, [cartItems, navigate]);

  // Handle payment success
  useEffect(() => {
    if (paymentSuccess && currentOrder) {
      setOrderStep('redirecting');
      // The myPOS service will handle the redirect
    }
  }, [paymentSuccess, currentOrder]);

  // Handle payment errors
  useEffect(() => {
    if (paymentError) {
      setOrderStep('form');
    }
  }, [paymentError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOrderStep('processing');
    clearPaymentError();

    try {
      // Step 1: Create order in our database
      const order = await createOrder(
        cartItems.map(item => item.id),
        cartTotal,
        {
          name: customerName,
          email: customerEmail,
          photoCount: cartItems.length
        }
      );

      // Step 2: Process payment with myPOS
      await processPayment(
        order.orderId,
        cartTotal,
        {
          name: customerName,
          email: customerEmail,
          photoIds: cartItems.map(item => item.id),
          photoCount: cartItems.length
        }
      );

      // Step 3: Clear cart and redirect to payment
      clearCart();
      
    } catch (error) {
      console.error('Checkout error:', error);
      setOrderStep('form');
    }
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    if (field === 'email') {
      setCustomerEmail(value);
    } else if (field === 'name') {
      setCustomerName(value);
    }
  };

  // Reset checkout process
  const resetCheckout = () => {
    setOrderStep('form');
    clearPaymentError();
    clearCurrentOrder();
  };

  // Show processing state
  if (orderStep === 'processing') {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <Loader2 className="h-16 w-16 text-blue-500 mx-auto mb-6 animate-spin" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Processing Your Order</h1>
        <p className="text-lg text-gray-600 mb-6">
          Please wait while we create your order and prepare payment...
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">
            <strong>Order Details:</strong>
          </p>
          <p className="text-blue-800">Photos: {cartItems.length}</p>
          <p className="text-blue-800">Total: €{cartTotal.toFixed(2)}</p>
        </div>
      </div>
    );
  }

  // Show redirecting state
  if (orderStep === 'redirecting') {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <ExternalLink className="h-16 w-16 text-green-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Redirecting to Payment</h1>
        <p className="text-lg text-gray-600 mb-6">
          You will be redirected to myPOS secure payment page in a moment...
        </p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-800">
            <strong>Order ID:</strong> {currentOrder?.orderId}
          </p>
          <p className="text-green-800">
            <strong>Amount:</strong> €{cartTotal.toFixed(2)}
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm">
            If you are not redirected automatically, please wait a moment or contact support.
          </p>
        </div>
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
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="input-field"
                    placeholder="Enter your full name"
                    required
                    disabled={isProcessing}
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
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="input-field"
                    placeholder="Enter your email address"
                    required
                    disabled={isProcessing}
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
                  <button
                    type="button"
                    onClick={clearPaymentError}
                    className="ml-auto text-red-400 hover:text-red-600"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isProcessing || !customerName.trim() || !customerEmail.trim()}
                className="w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  `Proceed to Payment - €${cartTotal.toFixed(2)}`
                )}
              </button>
            </form>
          </div>

          {/* myPOS Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CreditCard className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Secure myPOS Payment</p>
                <p>You'll be redirected to myPOS's secure checkout page for payment. Your payment information is never stored on our servers.</p>
              </div>
            </div>
          </div>

          {/* Order Information */}
          {currentOrder && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Order Created</p>
                  <p>Order ID: {currentOrder.orderId}</p>
                  <p>Status: {currentOrder.status}</p>
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
                <span>€{cartTotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-sm text-gray-600">
                <span>Processing fee</span>
                <span>Free</span>
              </div>
              
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-primary-600">€{cartTotal.toFixed(2)}</span>
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
                    src={item.path_to_watermark}
                    alt={item.filename}
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.filename}
                    </p>
                    <p className="text-xs text-gray-500">
                      Qty: {item.quantity} × €{item.price}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    €{(item.price * item.quantity).toFixed(2)}
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
