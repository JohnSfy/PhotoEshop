import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const PhotoContext = createContext();

export const usePhotos = () => {
  const context = useContext(PhotoContext);
  if (!context) {
    throw new Error('usePhotos must be used within a PhotoProvider');
  }
  return context;
};

export const PhotoProvider = ({ children }) => {
  const [photos, setPhotos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Fetch photos from API
  const fetchPhotos = async (category = null) => {
    try {
      console.log('PhotoContext: Fetching watermarked photos from /api/photos/watermarked');
      setLoading(true);
      const url = category && category !== 'all' 
        ? `/api/photos/watermarked?category=${encodeURIComponent(category)}`
        : '/api/photos/watermarked';
      const response = await axios.get(url);
      console.log('PhotoContext: Watermarked photos fetched successfully:', response.data);
      setPhotos(response.data);
      setError(null);
      
      // Also refresh categories to keep them in sync
      await fetchCategories();
    } catch (err) {
      console.error('PhotoContext: Error fetching watermarked photos:', err);
      console.error('PhotoContext: Error response:', err.response);
      setError('Failed to load photos');
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      console.log('PhotoContext: Fetching categories from /api/categories');
      const response = await axios.get('/api/categories');
      console.log('PhotoContext: Categories fetched successfully:', response.data);
      setCategories(response.data);
    } catch (err) {
      console.error('PhotoContext: Error fetching categories:', err);
      console.error('PhotoContext: Error response:', err.response);
    }
  };

  // Upload photos (admin only)
  const uploadPhotos = async (formData) => {
    try {
      console.log('PhotoContext: Starting upload...');
      console.log('PhotoContext: FormData received:', formData);
      console.log('PhotoContext: FormData entries:');
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value.name, value.type, value.size);
      }
      
      console.log('PhotoContext: Making API call to /api/photos/upload');
      const response = await axios.post('/api/photos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('PhotoContext: API response received:', response);
      console.log('PhotoContext: Refreshing photos and categories...');
      await fetchPhotos();
      await fetchCategories(); // Refresh categories after upload
      console.log('PhotoContext: Upload completed successfully');
      return response.data;
    } catch (err) {
      console.error('PhotoContext: Upload error:', err);
      console.error('PhotoContext: Error response:', err.response);
      throw new Error(err.response?.data?.error || 'Failed to upload photos');
    }
  };

  // Fetch clean photos by IDs (for after payment)
  const fetchCleanPhotos = async (photoIds) => {
    try {
      console.log('PhotoContext: Fetching clean photos for IDs:', photoIds);
      const idsParam = Array.isArray(photoIds) ? photoIds.join(',') : photoIds;
      const response = await axios.get(`/api/photos/clean?ids=${idsParam}`);
      console.log('PhotoContext: Clean photos fetched successfully:', response.data);
      return response.data;
    } catch (err) {
      console.error('PhotoContext: Error fetching clean photos:', err);
      console.error('PhotoContext: Error response:', err.response);
      throw new Error(err.response?.data?.error || 'Failed to fetch clean photos');
    }
  };

  // Filter photos
  const filteredPhotos = photos.filter(photo => {
    if (filter === 'all') return true;
    if (filter === 'recent') {
      const photoDate = new Date(photo.updated);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return photoDate > weekAgo;
    }
    return true;
  });

  useEffect(() => {
    fetchPhotos();
    fetchCategories();
  }, []);

  const value = {
    photos: filteredPhotos,
    allPhotos: photos,
    categories,
    loading,
    error,
    filter,
    setFilter,
    selectedCategory,
    setSelectedCategory,
    fetchPhotos,
    uploadPhotos,
    fetchCleanPhotos,
    fetchCategories,
  };

  return (
    <PhotoContext.Provider value={value}>
      {children}
    </PhotoContext.Provider>
  );
};
