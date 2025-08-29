import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useOrder } from '../context/OrderContext.jsx';
import { CheckCircle, Download, Mail, Home, Receipt } from 'lucide-react';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verifyPayment, currentOrder, clearCurrentOrder } = useOrder();
  
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationError, setVerificationError] = useState('');
  const [orderDetails, setOrderDetails] = useState(null);

  // Get parameters from URL (myPOS redirects with these)
  const orderId = searchParams.get('orderId');
  const paymentId = searchParams.get('paymentId');
  const status = searchParams.get('status');

  useEffect(() => {
    const verifyPaymentStatus = async () => {
      if (!orderId) {
        setVerificationError('No order ID found');
        setIsVerifying(false);
        return;
      }

      try {
        // Verify payment with our backend
        const result = await verifyPayment(orderId, paymentId);
        setOrderDetails(result.order);
        setIsVerifying(false);
      } catch (error) {
        console.error('Payment verification error:', error);
        setVerificationError(error.message);
        setIsVerifying(false);
      }
    };

    verifyPaymentStatus();
  }, [orderId, paymentId, verifyPayment]);

  const handleReturnHome = () => {
    clearCurrentOrder();
    navigate('/');
  };

  const handleDownloadPhotos = () => {
    // This would typically trigger a download or email delivery
    // For now, we'll just show a message
    alert('Your clean photos will be sent to your email shortly!');
  };

  if (isVerifying) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-6"></div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Verifying Payment</h1>
        <p className="text-lg text-gray-600">
          Please wait while we verify your payment...
        </p>
      </div>
    );
  }

  if (verificationError) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-red-800 mb-4">Payment Verification Failed</h1>
          <p className="text-red-600 mb-4">{verificationError}</p>
          <p className="text-sm text-red-500">
            Please contact support if you believe this is an error.
          </p>
        </div>
        <button
          onClick={handleReturnHome}
          className="btn-primary"
        >
          Return to Gallery
        </button>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-yellow-800 mb-4">Order Not Found</h1>
          <p className="text-yellow-600">
            We couldn't find your order details. Please contact support.
          </p>
        </div>
        <button
          onClick={handleReturnHome}
          className="btn-primary"
        >
          Return to Gallery
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-16">
      {/* Success Header */}
      <div className="text-center mb-12">
        <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Payment Successful! 🎉</h1>
        <p className="text-xl text-gray-600">
          Thank you for your purchase! Your clean photos are being processed.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order Details */}
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Receipt className="h-5 w-5 mr-2" />
              Order Details
            </h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-medium">{orderDetails.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment ID:</span>
                <span className="font-medium">{paymentId || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="text-green-600 font-medium capitalize">{orderDetails.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-medium">€{orderDetails.total_amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Photos:</span>
                <span className="font-medium">{JSON.parse(orderDetails.photo_ids).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">
                  {new Date(orderDetails.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <span className="text-gray-600">Email: {orderDetails.customerEmail || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-gray-600">Name: {orderDetails.customerName || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">What Happens Next?</h3>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-gray-900">Processing</p>
                  <p className="text-sm text-gray-600">Your order is being processed by our team</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-gray-900">Email Delivery</p>
                  <p className="text-sm text-gray-600">Clean photos will be sent to your email within 24 hours</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-gray-900">Download</p>
                  <p className="text-sm text-gray-600">You can download your photos from the email link</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleDownloadPhotos}
              className="w-full btn-primary py-3 flex items-center justify-center space-x-2"
            >
              <Download className="h-5 w-5" />
              <span>Download Photos</span>
            </button>
            
            <button
              onClick={handleReturnHome}
              className="w-full btn-secondary py-3 flex items-center justify-center space-x-2"
            >
              <Home className="h-5 w-5" />
              <span>Return to Gallery</span>
            </button>
          </div>

          {/* Support Information */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Need Help?</h4>
            <p className="text-sm text-gray-600 mb-3">
              If you have any questions about your order, please contact our support team.
            </p>
            <div className="text-sm text-gray-500">
              <p>Email: support@imagebuyapp.com</p>
              <p>Order ID: {orderDetails.id}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
