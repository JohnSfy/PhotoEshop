import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Camera, User, LogOut } from 'lucide-react';
import { useCart } from '../context/CartContext';

const Header = ({ isAdmin, setIsAdmin }) => {
  const { cartCount } = useCart();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('adminKey');
    setIsAdmin(false);
  };

  const isActive = (path) => {
    return location.pathname === path ? 'text-primary-600' : 'text-gray-600';
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Camera className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">Event Photos</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`font-medium hover:text-primary-600 transition-colors ${isActive('/')}`}
            >
              Gallery
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className={`font-medium hover:text-primary-600 transition-colors ${isActive('/admin')}`}
              >
                Admin Panel
              </Link>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            <Link
              to="/cart"
              className="relative p-2 text-gray-600 hover:text-primary-600 transition-colors"
            >
              <ShoppingCart className="h-6 w-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Admin/User */}
            {isAdmin ? (
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  const adminKey = prompt('Enter admin key:');
                  if (adminKey === 'your-secret-admin-key') {
                    localStorage.setItem('adminKey', adminKey);
                    setIsAdmin(true);
                  }
                }}
                className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors"
              >
                <User className="h-5 w-5" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
