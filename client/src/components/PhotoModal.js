import React from 'react';
import { X, ShoppingCart, Heart, Download, Calendar, DollarSign } from 'lucide-react';

const PhotoModal = ({ photo, onClose, onAddToCart, isInCart }) => {
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 truncate">
            {photo.filename}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row">
          {/* Photo */}
          <div className="flex-1 p-4">
            <div className="relative">
              <img
                src={photo.watermarkedUrl}
                alt={photo.filename}
                className="w-full h-auto max-h-[60vh] object-contain rounded-lg"
              />
              
              {/* Watermark notice */}
              <div className="absolute top-4 left-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                Watermarked Preview
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="w-full lg:w-80 p-4 border-l border-gray-200 space-y-4">
            {/* Photo info */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Photo Details</h3>
              
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>
                  Uploaded: {new Date(photo.uploadedAt).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <DollarSign className="h-4 w-4" />
                <span className="text-lg font-semibold text-primary-600">
                  ${photo.price}
                </span>
              </div>
            </div>

            {/* What you get */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">What You'll Get</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>High-resolution clean version</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>No watermarks or logos</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Professional quality</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Instant email delivery</span>
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-4">
              {isInCart ? (
                <div className="flex items-center justify-center space-x-2 text-green-600 bg-green-50 p-3 rounded-lg">
                  <Heart className="h-5 w-5 fill-current" />
                  <span className="font-medium">Added to Cart</span>
                </div>
              ) : (
                <button
                  onClick={onAddToCart}
                  className="w-full btn-primary flex items-center justify-center space-x-2"
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span>Add to Cart</span>
                </button>
              )}

              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = photo.watermarkedUrl;
                  link.download = photo.filename;
                  link.click();
                }}
                className="w-full btn-secondary flex items-center justify-center space-x-2"
              >
                <Download className="h-5 w-5" />
                <span>Download Preview</span>
              </button>
            </div>

            {/* Note */}
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
              <p>
                <strong>Note:</strong> This is a watermarked preview. 
                Purchase to receive the clean, high-resolution version via email.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoModal;
