import React, { useState } from 'react';
import { Heart, ShoppingCart, Eye, Filter } from 'lucide-react';
import { usePhotos } from '../context/PhotoContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import PhotoModal from './PhotoModal.jsx';

const PhotoGallery = () => {
  const { 
    photos, 
    loading, 
    error, 
    filter, 
    setFilter, 
    categories, 
    selectedCategory, 
    setSelectedCategory,
    fetchPhotos 
  } = usePhotos();
  const { addToCart, isInCart } = useCart();
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // grid or list

  // Handle category change
  const handleCategoryChange = async (category) => {
    setSelectedCategory(category);
    await fetchPhotos(category);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg mb-4">{error}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="btn-primary"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-4">No photos available yet</div>
        <p className="text-gray-400">Check back later for new event photos!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Event Photo Gallery</h1>
          {selectedCategory !== 'all' && (
            <div className="mt-2">
              <span className="inline-block bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium">
                Category: {selectedCategory}
              </span>
            </div>
          )}
          <p className="text-gray-600 mt-2">
            Browse watermarked preview photos. Add your favorites to cart to purchase clean, high-resolution versions.
          </p>
          <p className="text-sm text-gray-500 mt-1">
            💡 All photos shown are watermarked previews. Clean versions are delivered after payment.
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Showing {photos.length} photo{photos.length !== 1 ? 's' : ''}
            {selectedCategory !== 'all' ? ` in ${selectedCategory}` : ''}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Category Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="input-field py-1 px-2 text-sm"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <button
              onClick={fetchCategories}
              className="text-primary-600 hover:text-primary-700 text-xs font-medium ml-2"
              title="Refresh categories"
            >
              🔄
            </button>
          </div>

          {/* Time Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input-field py-1 px-2 text-sm"
            >
              <option value="all">All Time</option>
              <option value="recent">Recent (7 days)</option>
            </select>
          </div>

          {/* View Mode */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-500'
              }`}
            >
              <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
              </div>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-500'
              }`}
            >
              <div className="w-4 h-4 flex flex-col gap-0.5">
                <div className="bg-current rounded-sm h-1"></div>
                <div className="bg-current rounded-sm h-1"></div>
                <div className="bg-current rounded-sm h-1"></div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Photo Grid */}
      <div className={`${
        viewMode === 'grid' 
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
          : 'space-y-4'
      }`}>
        {photos.map((photo) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            viewMode={viewMode}
            onView={() => setSelectedPhoto(photo)}
            onAddToCart={() => addToCart(photo)}
            isInCart={isInCart(photo.id)}
          />
        ))}
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <PhotoModal
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          onAddToCart={() => {
            addToCart(selectedPhoto);
            setSelectedPhoto(null);
          }}
          isInCart={isInCart(selectedPhoto.id)}
        />
      )}
    </div>
  );
};

const PhotoCard = ({ photo, viewMode, onView, onAddToCart, isInCart }) => {
  const isList = viewMode === 'list';

  if (isList) {
    return (
      <div className="card p-4 flex items-center space-x-4">
        <img
          src={photo.path_to_watermark}
          alt={photo.filename}
          className="w-24 h-24 object-cover rounded-lg"
          loading="lazy"
        />
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 truncate">{photo.filename}</h3>
          <p className="text-sm text-gray-500">
            Updated: {new Date(photo.updated).toLocaleDateString()}
          </p>
          <p className="text-lg font-semibold text-primary-600">${photo.price}</p>
          <span className="inline-block bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium mt-1">
            PREVIEW
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onView}
            className="p-2 text-gray-500 hover:text-primary-600 transition-colors"
            title="View full size"
          >
            <Eye className="h-5 w-5" />
          </button>
          <button
            onClick={onAddToCart}
            disabled={isInCart}
            className={`p-2 rounded-lg transition-colors ${
              isInCart
                ? 'bg-green-100 text-green-600 cursor-not-allowed'
                : 'bg-primary-100 text-primary-600 hover:bg-primary-200'
            }`}
            title={isInCart ? 'Already in cart' : 'Add to cart'}
          >
            {isInCart ? (
              <Heart className="h-5 w-5 fill-current" />
            ) : (
              <ShoppingCart className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card group overflow-hidden">
      <div className="relative aspect-square overflow-hidden">
        <img
          src={photo.path_to_watermark}
          alt={photo.filename}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300">
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="flex space-x-2">
              <button
                onClick={onView}
                className="p-3 bg-white bg-opacity-90 rounded-full text-gray-700 hover:bg-opacity-100 transition-all duration-200"
                title="View full size"
              >
                <Eye className="h-5 w-5" />
              </button>
              <button
                onClick={onAddToCart}
                disabled={isInCart}
                className={`p-3 rounded-full transition-all duration-200 ${
                  isInCart
                    ? 'bg-green-500 text-white cursor-not-allowed'
                    : 'bg-white bg-opacity-90 text-gray-700 hover:bg-opacity-100'
                }`}
                title={isInCart ? 'Already in cart' : 'Add to cart'}
              >
                {isInCart ? (
                  <Heart className="h-5 w-5 fill-current" />
                ) : (
                  <ShoppingCart className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Price badge */}
        <div className="absolute top-3 right-3 bg-primary-600 text-white px-3 py-1 rounded-full text-sm font-medium">
          ${photo.price}
        </div>

        {/* Watermark indicator */}
        <div className="absolute top-3 left-3 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
          PREVIEW
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-medium text-gray-900 truncate mb-1">{photo.filename}</h3>
        <p className="text-sm text-gray-500">
          {new Date(photo.updated).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

export default PhotoGallery;
