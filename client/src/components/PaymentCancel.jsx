import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useOrder } from '../context/OrderContext.jsx';
import { XCircle, RefreshCw, Home, ShoppingCart } from 'lucide-react';

const PaymentCancel = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { cancelPayment, currentOrder, clearCurrentOrder } = useOrder();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  // Get parameters from URL (myPOS redirects with these)
  const urlOrderId = searchParams.get('orderId');
  const reason = searchParams.get('reason') || 'Payment was cancelled';

  useEffect(() => {
    if (urlOrderId) {
      setOrderId(urlOrderId);
      setCancelReason(reason);
    }
  }, [urlOrderId, reason]);

  const handleRetryPayment = () => {
    // Navigate back to checkout to retry
    navigate('/checkout');
  };

  const handleReturnHome = () => {
    clearCurrentOrder();
    navigate('/');
  };

  const handleReturnToCart = () => {
    clearCurrentOrder();
    navigate('/cart');
  };

  const handleCancelOrder = async () => {
    if (!orderId) return;
    
    setIsProcessing(true);
    try {
      await cancelPayment(orderId);
      // Order cancelled successfully
    } catch (error) {
      console.error('Error cancelling order:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-16">
      {/* Cancel Header */}
      <div className="text-center mb-12">
        <XCircle className="h-20 w-20 text-red-500 mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Payment Cancelled</h1>
        <p className="text-xl text-gray-600">
          Your payment was not completed. Don't worry, your photos are still in your cart.
        </p>
      </div>

      {/* Order Information */}
      {orderId && (
        <div className="card p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Order ID:</span>
              <span className="font-medium">{orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="text-red-600 font-medium">Cancelled</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Reason:</span>
              <span className="font-medium">{cancelReason}</span>
            </div>
          </div>
        </div>
      )}

      {/* What Happened */}
      <div className="card p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">What Happened?</h3>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="font-medium text-gray-900">Payment Not Completed</p>
              <p className="text-sm text-gray-600">
                The payment process was interrupted or cancelled before completion.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="font-medium text-gray-900">Photos Still Available</p>
              <p className="text-sm text-gray-600">
                Your selected photos are still in your cart and ready for purchase.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="font-medium text-gray-900">No Charges Made</p>
              <p className="text-sm text-gray-600">
                No money was charged to your account. You can try again anytime.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-4">
        <button
          onClick={handleRetryPayment}
          className="w-full btn-primary py-3 flex items-center justify-center space-x-2"
        >
          <RefreshCw className="h-5 w-5" />
          <span>Try Payment Again</span>
        </button>
        
        <button
          onClick={handleReturnToCart}
          className="w-full btn-secondary py-3 flex items-center justify-center space-x-2"
        >
          <ShoppingCart className="h-5 w-5" />
          <span>Return to Cart</span>
        </button>
        
        <button
          onClick={handleReturnHome}
          className="w-full btn-outline py-3 flex items-center justify-center space-x-2"
        >
          <Home className="h-5 w-5" />
          <span>Return to Gallery</span>
        </button>
      </div>

      {/* Cancel Order Option */}
      {orderId && (
        <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Cancel Order Completely?</h4>
          <p className="text-sm text-gray-600 mb-3">
            If you want to cancel this order entirely, you can do so here.
          </p>
          <button
            onClick={handleCancelOrder}
            disabled={isProcessing}
            className="text-sm text-red-600 hover:text-red-800 underline disabled:opacity-50"
          >
            {isProcessing ? 'Cancelling...' : 'Cancel Order'}
          </button>
        </div>
      )}

      {/* Help Information */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500 mb-2">
          Need help? Contact our support team
        </p>
        <p className="text-sm text-gray-500">
          Email: support@imagebuyapp.com
        </p>
      </div>
    </div>
  );
};

export default PaymentCancel;
