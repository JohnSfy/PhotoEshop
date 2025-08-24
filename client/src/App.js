import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import PhotoGallery from './components/PhotoGallery';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import AdminPanel from './components/AdminPanel';
import { CartProvider } from './context/CartContext';
import { PhotoProvider } from './context/PhotoContext';

function App() {
  const [isAdmin, setIsAdmin] = useState(false);

  // Simple admin check (in production, use proper authentication)
  useEffect(() => {
    const adminKey = localStorage.getItem('adminKey');
    if (adminKey === 'your-secret-admin-key') {
      setIsAdmin(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <PhotoProvider>
        <CartProvider>
          <Header isAdmin={isAdmin} setIsAdmin={setIsAdmin} />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<PhotoGallery />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              {isAdmin && <Route path="/admin" element={<AdminPanel />} />}
            </Routes>
          </main>
        </CartProvider>
      </PhotoProvider>
    </div>
  );
}

export default App;
