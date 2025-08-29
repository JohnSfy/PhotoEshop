import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header.jsx';
import PhotoGallery from './components/PhotoGallery.jsx';
import Cart from './components/Cart.jsx';
import Checkout from './components/Checkout.jsx';
import PaymentSuccess from './components/PaymentSuccess.jsx';
import PaymentCancel from './components/PaymentCancel.jsx';
import AdminPanel from './components/AdminPanel.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { PhotoProvider } from './context/PhotoContext.jsx';
import { OrderProvider } from './context/OrderContext.jsx';

function App() {
  const [isAdmin, setIsAdmin] = useState(false);

  // Simple admin check (in production, use proper authentication)
  useEffect(() => {
    const adminKey = localStorage.getItem('adminKey');
    if (adminKey === 'your-secret-admin-key') {
      setIsAdmin(true);
    }
    
    // For development/testing, also check URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('admin') === 'true') {
      setIsAdmin(true);
      localStorage.setItem('adminKey', 'your-secret-admin-key');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <PhotoProvider>
        <CartProvider>
          <OrderProvider>
            <Header isAdmin={isAdmin} setIsAdmin={setIsAdmin} />
            <main className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<PhotoGallery />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/payment/success" element={<PaymentSuccess />} />
                <Route path="/payment/cancel" element={<PaymentCancel />} />
                {isAdmin && <Route path="/admin" element={<AdminPanel />} />}
              </Routes>
            </main>
          </OrderProvider>
        </CartProvider>
      </PhotoProvider>
    </div>
  );
}

export default App;
