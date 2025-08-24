import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';

const Cart = () => {
  const { cartItems, cartTotal, removeFromCart, updateQuantity, clearCart } = useCart();

  if (cartItems.length === 0) {
    return (
      <div className="text-center py-16">
        <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-600 mb-6">Add some photos from the gallery to get started!</p>
        <Link to="/" className="btn-primary">
          Browse Photos
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link to="/" className="text-gray-500 hover:text-gray-700 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
            <p className="text-gray-600 mt-1">
              {cartItems.length} photo{cartItems.length !== 1 ? 's' : ''} selected
            </p>
          </div>
        </div>
        
        <button
          onClick={clearCart}
          className="text-red-600 hover:text-red-700 font-medium transition-colors"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <CartItem
              key={item.id}
              item={item}
              onRemove={() => removeFromCart(item.id)}
              onUpdateQuantity={(quantity) => updateQuantity(item.id, quantity)}
            />
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Photos ({cartItems.length})</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-sm text-gray-600">
                <span>Processing fee</span>
                <span>Free</span>
              </div>
              
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-primary-600">${cartTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <Link
              to="/checkout"
              className="w-full btn-primary text-center py-3 text-lg"
            >
              Proceed to Checkout
            </Link>

            <div className="mt-4 text-xs text-gray-500 text-center">
              <p>Secure payment powered by Stripe</p>
              <p>Clean photos delivered via email after payment</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CartItem = ({ item, onRemove, onUpdateQuantity }) => {
  return (
    <div className="card p-4">
      <div className="flex items-center space-x-4">
        {/* Photo thumbnail */}
        <img
          src={item.watermarkedUrl}
          alt={item.filename}
          className="w-20 h-20 object-cover rounded-lg"
        />

        {/* Photo details */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate mb-1">
            {item.filename}
          </h3>
          <p className="text-sm text-gray-500">
            Uploaded: {new Date(item.uploadedAt).toLocaleDateString()}
          </p>
          <p className="text-lg font-semibold text-primary-600">
            ${item.price}
          </p>
        </div>

        {/* Quantity controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onUpdateQuantity(item.quantity - 1)}
            className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
            disabled={item.quantity <= 1}
          >
            <Minus className="h-4 w-4" />
          </button>
          
          <span className="w-12 text-center font-medium text-gray-900">
            {item.quantity}
          </span>
          
          <button
            onClick={() => onUpdateQuantity(item.quantity + 1)}
            className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Remove button */}
        <button
          onClick={onRemove}
          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          title="Remove from cart"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>

      {/* Subtotal */}
      <div className="mt-3 pt-3 border-t border-gray-100 text-right">
        <span className="text-sm text-gray-600">
          Subtotal: <span className="font-semibold text-gray-900">
            ${(item.price * item.quantity).toFixed(2)}
          </span>
        </span>
      </div>
    </div>
  );
};

export default Cart;
