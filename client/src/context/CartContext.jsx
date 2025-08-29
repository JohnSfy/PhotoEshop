import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('photoCart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('photoCart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Add photo to cart
  const addToCart = (photo) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === photo.id);
      if (existingItem) {
        return prevItems; // Already in cart
      }
      return [...prevItems, { ...photo, quantity: 1 }];
    });
  };

  // Remove photo from cart
  const removeFromCart = (photoId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== photoId));
  };

  // Update photo quantity
  const updateQuantity = (photoId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(photoId);
      return;
    }
    
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === photoId ? { ...item, quantity } : item
      )
    );
  };

  // Clear cart
  const clearCart = () => {
    setCartItems([]);
  };

  // Check if photo is in cart
  const isInCart = (photoId) => {
    return cartItems.some(item => item.id === photoId);
  };

  // Calculate cart total
  const cartTotal = cartItems.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);

  // Get cart count
  const cartCount = cartItems.length;

  const value = {
    cartItems,
    cartTotal,
    cartCount,
    isCartOpen,
    setIsCartOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isInCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
