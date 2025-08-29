import React, { useState, useRef, useEffect } from 'react';
import { Upload, Image, Package, Users, DollarSign, Trash2, Eye } from 'lucide-react';
import { usePhotos } from '../context/PhotoContext.jsx';
import axios from 'axios';

const AdminPanel = () => {
  console.log('AdminPanel: Component rendering...');
  
  try {
    const { photos, uploadPhotos, fetchPhotos, fetchCategories } = usePhotos();
    console.log('AdminPanel: usePhotos hook result:', { photos: photos?.length, hasUploadPhotos: !!uploadPhotos, hasFetchPhotos: !!fetchPhotos, hasFetchCategories: !!fetchCategories });
  } catch (error) {
    console.error('AdminPanel: Error in usePhotos hook:', error);
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Admin Panel</h1>
          <p className="text-gray-600 mb-4">There was an error initializing the component.</p>
          <pre className="text-sm text-red-500 bg-red-50 p-4 rounded-lg overflow-auto">{error.message}</pre>
        </div>
      </div>
    );
  }
  
  const { photos, uploadPhotos, fetchPhotos, fetchCategories } = usePhotos();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('upload');
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState('');
  
  // Category management state
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  
  const cleanFileInputRef = useRef();

  // Fetch events and categories on component mount
  useEffect(() => {
    try {
      fetchCategories();
    } catch (error) {
      console.error('Error in useEffect:', error);
    }
  }, [fetchCategories]);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data);
      console.log('Categories refreshed:', response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Refresh both photos and categories
  const refreshAll = async () => {
    try {
      await Promise.all([fetchPhotos(), fetchCategories()]);
      console.log('Photos and categories refreshed');
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  // Create new category
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    
    if (!newCategory.trim()) {
      return;
    }
    
    setIsCreatingCategory(true);
    
    try {
      const response = await axios.post('/api/categories', { name: newCategory });
      console.log('Category created:', response.data);
      
      // Reset form and close modal
      setNewCategory('');
      setShowCategoryForm(false);
      
      // Immediately add to local state for instant UI update
      const newCategoryName = response.data.category;
      setCategories(prev => [...prev, newCategoryName]);
      
      // Auto-select the new category
      setSelectedCategory(newCategoryName);
      
      // Also refresh from server to ensure consistency
      setTimeout(() => fetchCategories(), 100);
      
    } catch (error) {
      console.error('Error creating category:', error);
      alert(error.response?.data?.error || 'Failed to create category');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  // Delete category
  const handleDeleteCategory = async (categoryName) => {
    if (!window.confirm(`Are you sure you want to delete the category "${categoryName}"? This will also delete ALL photos in this category!`)) {
      return;
    }
    
    try {
      const response = await axios.delete(`/api/categories/${encodeURIComponent(categoryName)}`);
      console.log('Category deleted:', response.data);
      
      // Immediately remove from local state for instant UI update
      setCategories(prev => prev.filter(cat => cat !== categoryName));
      
      // Clear selection if deleted category was selected
      if (selectedCategory === categoryName) {
        const remainingCategories = categories.filter(cat => cat !== categoryName);
        setSelectedCategory(remainingCategories.length > 0 ? remainingCategories[0] : '');
      }
      
      // Also refresh photos and server data
      setTimeout(async () => {
        await fetchCategories();
        await fetchPhotos();
      }, 100);
      
      alert(`Category "${categoryName}" deleted successfully with ${response.data.deletedPhotos} photos`);
      
    } catch (error) {
      console.error('Error deleting category:', error);
      alert(error.response?.data?.error || 'Failed to delete category');
    }
  };

  // Handle photo selection
  const handlePhotoSelection = (photoId) => {
    setSelectedPhotos(prev => 
      prev.includes(photoId) 
        ? prev.filter(id => id !== photoId)
        : [...prev, photoId]
    );
  };

  // Handle select all photos
  const handleSelectAll = () => {
    const filteredPhotos = photos.filter(photo => selectedCategory === 'all' || photo.category === selectedCategory);
    if (selectedPhotos.length === filteredPhotos.length) {
      setSelectedPhotos([]);
    } else {
      setSelectedPhotos(filteredPhotos.map(photo => photo.id));
    }
  };

  // Delete selected photos
  const handleDeletePhotos = async () => {
    if (selectedPhotos.length === 0) {
      setDeleteError('Please select photos to delete');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedPhotos.length} photo(s)? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    setDeleteError('');
    setDeleteSuccess('');

    try {
      const response = await axios.delete('/api/photos/delete', {
        data: { photoIds: selectedPhotos }
      });

      console.log('Delete response:', response.data);
      
      if (response.data.partial) {
        setDeleteSuccess(`${response.data.deletedCount} photos deleted successfully, ${response.data.failedCount} failed.`);
      } else {
        setDeleteSuccess(`All ${response.data.deletedCount} photos deleted successfully!`);
      }

      // Clear selection and refresh photos
      setSelectedPhotos([]);
      await fetchPhotos();

      // Show success message
      setTimeout(() => {
        setDeleteSuccess('');
      }, 5000);

    } catch (error) {
      console.error('Delete error:', error);
      setDeleteError(error.response?.data?.error || 'Failed to delete photos');
      
      // Show error message
      setTimeout(() => {
        setDeleteError('');
      }, 5000);
    } finally {
      setIsDeleting(false);
    }
  };

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

      // Add category
      formData.append('category', selectedCategory);
      console.log('Category added to FormData:', selectedCategory);

      console.log('FormData built successfully');
      console.log('FormData entries:');
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value.name || value);
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

  // Add error boundary
  if (!photos || !categories) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading Admin Panel...</h1>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Initializing components...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-600 mt-2">Manage your photo gallery and monitor sales</p>
        <p className="text-sm text-gray-500 mt-1">Debug: Photos: {photos?.length || 0}, Categories: {categories?.length || 0}</p>
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
          <h2 className="text-xl font-semibold text-gray-900">Upload New Photos</h2>
          
          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <div className="flex space-x-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="flex-1 input-field"
              >
                {categories.length > 0 ? (
                  categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))
                ) : (
                  <option value="">No categories available</option>
                )}
              </select>
              <button
                type="button"
                onClick={() => setShowCategoryForm(true)}
                className="btn-secondary px-3"
                title="Add New Category"
              >
                +
              </button>
            </div>
            
            {/* Category Confirmation */}
            {selectedCategory && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-700">
                  🎯 <strong>All photos</strong> in this upload will be assigned to category: <strong>"{selectedCategory}"</strong>
                </p>
              </div>
            )}
            
            {/* Custom Categories with Delete Buttons */}
            <div className="mt-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Available Categories:</p>
                <button
                  type="button"
                  onClick={fetchCategories}
                  className="text-primary-600 hover:text-primary-700 text-xs font-medium"
                  title="Refresh categories"
                >
                  🔄 Refresh
                </button>
              </div>
              {categories.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <div key={category} className="flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full">
                      <span className="text-sm text-gray-700">{category}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(category)}
                        className="text-red-500 hover:text-red-700 text-xs"
                        title={`Delete category "${category}"`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No categories available</p>
              )}
            </div>
          </div>

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
            <div className="flex items-center space-x-4">
              <button
                onClick={refreshAll}
                className="btn-primary text-sm"
                title="Refresh all data"
              >
                🔄 Refresh All
              </button>
              <button
                onClick={fetchPhotos}
                className="btn-secondary text-sm"
                title="Refresh photos"
              >
                🔄 Refresh Photos
              </button>
              {/* Category Filter */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Category:</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="input-field py-1 px-2 text-sm"
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={fetchCategories}
                  className="text-primary-600 hover:text-primary-700 text-xs font-medium"
                  title="Refresh categories"
                >
                  🔄 Refresh Categories
                </button>
                <p className="text-gray-600">
                  {photos.filter(photo => selectedCategory === 'all' || photo.category === selectedCategory).length} photos
                  {selectedCategory !== 'all' ? ` in ${selectedCategory}` : ' total'}
                </p>
              </div>
            </div>
          </div>

          {/* Selection Controls */}
          {photos.filter(photo => selectedCategory === 'all' || photo.category === selectedCategory).length > 0 && (
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedPhotos.length === photos.filter(photo => selectedCategory === 'all' || photo.category === selectedCategory).length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {selectedPhotos.length === photos.filter(photo => selectedCategory === 'all' || photo.category === selectedCategory).length ? 'Deselect All' : 'Select All'}
                  </span>
                </label>
                <span className="text-sm text-gray-500">
                  {selectedPhotos.length} of {photos.filter(photo => selectedCategory === 'all' || photo.category === selectedCategory).length} selected
                </span>
              </div>
              
              {selectedPhotos.length > 0 && (
                <button
                  onClick={handleDeletePhotos}
                  disabled={isDeleting}
                  className="btn-danger disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? 'Deleting...' : `Delete ${selectedPhotos.length} Photo${selectedPhotos.length > 1 ? 's' : ''}`}
                </button>
              )}
            </div>
          )}

          {/* Success/Error Messages */}
          {deleteSuccess && (
            <div className="text-green-600 bg-green-50 p-3 rounded-lg">
              {deleteSuccess}
            </div>
          )}

          {deleteError && (
            <div className="text-red-600 bg-red-50 p-3 rounded-lg">
              {deleteError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {photos
              .filter(photo => selectedCategory === 'all' || photo.category === selectedCategory)
              .map((photo) => (
              <div key={photo.id} className="card overflow-hidden">
                <div className="relative aspect-square">
                  <img
                    src={photo.path_to_watermark}
                    alt={photo.filename}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-primary-600 text-white px-2 py-1 rounded-full text-xs">
                    ${photo.price}
                  </div>
                  
                  {/* Selection Checkbox */}
                  <div className="absolute top-2 left-2">
                    <input
                      type="checkbox"
                      checked={selectedPhotos.includes(photo.id)}
                      onChange={() => handlePhotoSelection(photo.id)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-5 h-5"
                    />
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 truncate mb-2">
                    {photo.filename}
                  </h3>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-gray-500">
                      {new Date(photo.updated).toLocaleDateString()}
                    </p>
                    <span className="inline-block bg-primary-100 text-primary-800 px-2 py-1 rounded-full text-xs font-medium">
                      {photo.category || 'No Category'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => window.open(photo.path_to_watermark, '_blank')}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      <Eye className="h-4 w-4 inline mr-1" />
                      View
                    </button>
                    
                    <button
                      onClick={() => handlePhotoSelection(photo.id)}
                      className={`text-sm font-medium px-3 py-1 rounded ${
                        selectedPhotos.includes(photo.id)
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-500 hover:text-primary-600'
                      }`}
                    >
                      {selectedPhotos.includes(photo.id) ? 'Selected' : 'Select'}
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

      {/* Category Creation Modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Category</h3>
            
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Enter category name..."
                  className="input-field w-full"
                  required
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={isCreatingCategory || !newCategory.trim()}
                  className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingCategory ? 'Creating...' : 'Create Category'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryForm(false);
                    setNewCategory('');
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
