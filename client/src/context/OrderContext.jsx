import React, { createContext, useContext, useState, useEffect } from 'react';
import { myPOSService } from '../services/myposService.jsx';

const OrderContext = createContext();

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};

export const OrderProvider = ({ children }) => {
  const [currentOrder, setCurrentOrder] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Load order history from localStorage on mount
  useEffect(() => {
    const savedOrders = localStorage.getItem('orderHistory');
    if (savedOrders) {
      try {
        setOrderHistory(JSON.parse(savedOrders));
      } catch (error) {
        console.error('Error loading order history:', error);
      }
    }
  }, []);

  // Save order history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('orderHistory', JSON.stringify(orderHistory));
  }, [orderHistory]);

  // Create a new order
  const createOrder = async (photoIds, totalAmount, customerInfo) => {
    setIsProcessing(true);
    setPaymentError('');
    setPaymentSuccess(false);

    try {
      // Generate a unique order ID
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create order in our database
      const order = await myPOSService.createOrder(photoIds, totalAmount, customerInfo);
      
      // Set current order
      setCurrentOrder({
        ...order,
        orderId: orderId,
        photoIds,
        totalAmount,
        customerInfo,
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      // Add to order history
      setOrderHistory(prev => [order, ...prev]);

      return order;
    } catch (error) {
      setPaymentError(error.message);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // Process payment with myPOS
  const processPayment = async (orderId, amount, customerInfo) => {
    setIsProcessing(true);
    setPaymentError('');
    setPaymentSuccess(false);

    try {
      // Process payment through myPOS
      const result = await myPOSService.processPayment(orderId, amount, customerInfo);
      
      setPaymentSuccess(true);
      return result;
    } catch (error) {
      setPaymentError(error.message);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // Get order status
  const getOrderStatus = async (orderId) => {
    try {
      const order = await myPOSService.getOrderStatus(orderId);
      
      // Update current order if it matches
      if (currentOrder && currentOrder.orderId === orderId) {
        setCurrentOrder(prev => ({ ...prev, ...order }));
      }
      
      // Update order in history
      setOrderHistory(prev => 
        prev.map(o => o.orderId === orderId ? { ...o, ...order } : o)
      );
      
      return order;
    } catch (error) {
      console.error('Error fetching order status:', error);
      throw error;
    }
  };

  // Verify payment (called from success page)
  const verifyPayment = async (orderId, paymentId) => {
    try {
      const result = await myPOSService.verifyPayment(orderId, paymentId);
      
      // Update order status
      if (currentOrder && currentOrder.orderId === orderId) {
        setCurrentOrder(prev => ({ ...prev, status: 'completed' }));
      }
      
      // Update order in history
      setOrderHistory(prev => 
        prev.map(o => o.orderId === orderId ? { ...o, status: 'completed' } : o)
      );
      
      setPaymentSuccess(true);
      return result;
    } catch (error) {
      setPaymentError(error.message);
      throw error;
    }
  };

  // Cancel payment
  const cancelPayment = async (orderId) => {
    try {
      const result = await myPOSService.cancelPayment(orderId);
      
      // Update order status
      if (currentOrder && currentOrder.orderId === orderId) {
        setCurrentOrder(prev => ({ ...prev, status: 'cancelled' }));
      }
      
      // Update order in history
      setOrderHistory(prev => 
        prev.map(o => o.orderId === orderId ? { ...o, status: 'cancelled' } : o)
      );
      
      return result;
    } catch (error) {
      setPaymentError(error.message);
      throw error;
    }
  };

  // Clear current order
  const clearCurrentOrder = () => {
    setCurrentOrder(null);
    setPaymentError('');
    setPaymentSuccess(false);
  };

  // Clear payment error
  const clearPaymentError = () => {
    setPaymentError('');
  };

  // Clear payment success
  const clearPaymentSuccess = () => {
    setPaymentSuccess(false);
  };

  // Get order by ID
  const getOrderById = (orderId) => {
    return orderHistory.find(order => order.orderId === orderId);
  };

  // Get orders by status
  const getOrdersByStatus = (status) => {
    return orderHistory.filter(order => order.status === status);
  };

  // Get pending orders
  const getPendingOrders = () => {
    return getOrdersByStatus('pending');
  };

  // Get completed orders
  const getCompletedOrders = () => {
    return getOrdersByStatus('completed');
  };

  // Get cancelled orders
  const getCancelledOrders = () => {
    return getOrdersByStatus('cancelled');
  };

  const value = {
    // State
    currentOrder,
    orderHistory,
    isProcessing,
    paymentError,
    paymentSuccess,
    
    // Actions
    createOrder,
    processPayment,
    getOrderStatus,
    verifyPayment,
    cancelPayment,
    clearCurrentOrder,
    clearPaymentError,
    clearPaymentSuccess,
    
    // Queries
    getOrderById,
    getOrdersByStatus,
    getPendingOrders,
    getCompletedOrders,
    getCancelledOrders,
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};
