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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  // Fetch photos from API
  const fetchPhotos = async () => {
    try {
      console.log('PhotoContext: Fetching photos from /api/photos');
      setLoading(true);
      const response = await axios.get('/api/photos');
      console.log('PhotoContext: Photos fetched successfully:', response.data);
      setPhotos(response.data);
      setError(null);
    } catch (err) {
      console.error('PhotoContext: Error fetching photos:', err);
      console.error('PhotoContext: Error response:', err.response);
      setError('Failed to load photos');
    } finally {
      setLoading(false);
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
      console.log('PhotoContext: Refreshing photos...');
      await fetchPhotos();
      console.log('PhotoContext: Upload completed successfully');
      return response.data;
    } catch (err) {
      console.error('PhotoContext: Upload error:', err);
      console.error('PhotoContext: Error response:', err.response);
      throw new Error(err.response?.data?.error || 'Failed to upload photos');
    }
  };

  // Filter photos
  const filteredPhotos = photos.filter(photo => {
    if (filter === 'all') return true;
    if (filter === 'recent') {
      const photoDate = new Date(photo.uploadedAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return photoDate > weekAgo;
    }
    return true;
  });

  useEffect(() => {
    fetchPhotos();
  }, []);

  const value = {
    photos: filteredPhotos,
    allPhotos: photos,
    loading,
    error,
    filter,
    setFilter,
    fetchPhotos,
    uploadPhotos,
  };

  return (
    <PhotoContext.Provider value={value}>
      {children}
    </PhotoContext.Provider>
  );
};
