import React, { useState, useRef } from 'react';
import { Upload, Image, Package, Users, DollarSign, Trash2, Eye } from 'lucide-react';
import { usePhotos } from '../context/PhotoContext';
import axios from 'axios';

const AdminPanel = () => {
  const { photos, uploadPhotos, fetchPhotos } = usePhotos();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('upload');
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  const cleanFileInputRef = useRef();

  const handlePhotoUpload = async (event) => {
    event.preventDefault();
    
    const cleanFiles = cleanFileInputRef.current.files;
    
    if (cleanFiles.length === 0) {
      setUploadError('Please select clean photo files');
      return;
    }

    setIsUploading(true);
    setUploadError('');
    setUploadSuccess('');
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      console.log('=== UPLOAD START ===');
      console.log('Clean files:', Array.from(cleanFiles));
      console.log('File count:', cleanFiles.length);
      
      // Create FormData for the API call
      const formData = new FormData();
      
      console.log('Building FormData...');
      Array.from(cleanFiles).forEach((file, index) => {
        console.log(`Adding clean file ${index}:`, file.name, file.type, file.size);
        formData.append('clean', file);
      });

      console.log('FormData built successfully');
      console.log('FormData entries:');
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value.name, value.type, value.size);
      }

      console.log('Calling uploadPhotos API with FormData...');
      const response = await uploadPhotos(formData);
      console.log('Upload API response:', response);
      console.log('=== UPLOAD SUCCESS ===');
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadSuccess(`Successfully uploaded and watermarked ${cleanFiles.length} photos!`);
      
      // Reset form
      cleanFileInputRef.current.value = '';
      
      setTimeout(() => {
        setUploadSuccess('');
        setUploadProgress(0);
      }, 3000);
      
    } catch (error) {
      console.error('=== UPLOAD ERROR ===');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      console.error('Error stack:', error.stack);
      
      let errorMessage = 'Failed to upload photos';
      if (error.response?.data?.error) {
        errorMessage += ': ' + error.response.data.error;
      } else if (error.message) {
        errorMessage += ': ' + error.message;
      }
      
      setUploadError(errorMessage);
      console.log('=== UPLOAD END ===');
    } finally {
      setIsUploading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      // In a real app, you'd fetch from an admin endpoint
      // For now, we'll use mock data
      const mockOrders = [
        {
          id: '1',
          customerEmail: 'john@example.com',
          customerName: 'John Doe',
          totalAmount: 29.95,
          photoCount: 5,
          status: 'completed',
          createdAt: new Date().toISOString(),
          photos: photos.slice(0, 5)
        }
      ];
      setOrders(mockOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const deletePhoto = async (photoId) => {
    if (window.confirm('Are you sure you want to delete this photo?')) {
      try {
        // In a real app, you'd call an API endpoint
        // For now, we'll just refresh the photos
        await fetchPhotos();
      } catch (error) {
        console.error('Error deleting photo:', error);
      }
    }
  };

  const tabs = [
    { id: 'upload', label: 'Upload Photos', icon: Upload },
    { id: 'gallery', label: 'Manage Gallery', icon: Image },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'analytics', label: 'Analytics', icon: DollarSign }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-600 mt-2">Manage your photo gallery and monitor sales</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 inline mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'upload' && (
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload New Photos</h2>
          
          <form onSubmit={handlePhotoUpload} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clean Photos *
              </label>
              <input
                ref={cleanFileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="input-field"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Select your clean, high-quality photos. Watermarks will be added automatically.
              </p>
            </div>

            {uploadError && (
              <div className="text-red-600 bg-red-50 p-3 rounded-lg">
                {uploadError}
              </div>
            )}

            {uploadSuccess && (
              <div className="text-green-600 bg-green-50 p-3 rounded-lg">
                {uploadSuccess}
              </div>
            )}

            {isUploading && (
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600">Uploading... {uploadProgress}%</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isUploading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Uploading...' : 'Upload Photos'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'gallery' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Photo Gallery</h2>
            <p className="text-gray-600">{photos.length} photos total</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {photos.map((photo) => (
              <div key={photo.id} className="card overflow-hidden">
                <div className="relative aspect-square">
                  <img
                    src={photo.watermarkedUrl}
                    alt={photo.filename}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-primary-600 text-white px-2 py-1 rounded-full text-xs">
                    ${photo.price}
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 truncate mb-2">
                    {photo.filename}
                  </h3>
                  <p className="text-sm text-gray-500 mb-3">
                    {new Date(photo.uploadedAt).toLocaleDateString()}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => window.open(photo.watermarkedUrl, '_blank')}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      <Eye className="h-4 w-4 inline mr-1" />
                      View
                    </button>
                    
                    <button
                      onClick={() => deletePhoto(photo.id)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      <Trash2 className="h-4 w-4 inline mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Order History</h2>
            <button onClick={fetchOrders} className="btn-secondary">
              Refresh Orders
            </button>
          </div>

          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Order #{order.id}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {order.customerName} ({order.customerEmail})
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-lg font-semibold text-primary-600">
                      ${order.totalAmount}
                    </p>
                    <p className="text-sm text-gray-500">
                      {order.photoCount} photo{order.photoCount !== 1 ? 's' : ''}
                    </p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      order.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            {orders.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No orders yet
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6 text-center">
            <Users className="h-8 w-8 text-primary-600 mx-auto mb-2" />
            <h3 className="text-2xl font-bold text-gray-900">{photos.length}</h3>
            <p className="text-gray-600">Total Photos</p>
          </div>
          
          <div className="card p-6 text-center">
            <Package className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <h3 className="text-2xl font-bold text-gray-900">{orders.length}</h3>
            <p className="text-gray-600">Total Orders</p>
          </div>
          
          <div className="card p-6 text-center">
            <DollarSign className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <h3 className="text-2xl font-bold text-gray-900">
              ${orders.reduce((sum, order) => sum + order.totalAmount, 0).toFixed(2)}
            </h3>
            <p className="text-gray-600">Total Revenue</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
