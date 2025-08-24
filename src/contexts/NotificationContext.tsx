import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string;
  actionText?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
  loadNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const addNotification = (notificationData: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notificationData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      isRead: false,
      createdAt: new Date()
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    
    // Persist to localStorage
    const stored = JSON.parse(localStorage.getItem(`notifications_${user?.Id}`) || '[]');
    stored.unshift(newNotification);
    localStorage.setItem(`notifications_${user?.Id}`, JSON.stringify(stored.slice(0, 50))); // Keep only 50 latest
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
    
    // Update localStorage
    const stored = JSON.parse(localStorage.getItem(`notifications_${user?.Id}`) || '[]');
    const updated = stored.map((n: Notification) => n.id === id ? { ...n, isRead: true } : n);
    localStorage.setItem(`notifications_${user?.Id}`, JSON.stringify(updated));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, isRead: true }))
    );
    
    // Update localStorage
    const stored = JSON.parse(localStorage.getItem(`notifications_${user?.Id}`) || '[]');
    const updated = stored.map((n: Notification) => ({ ...n, isRead: true }));
    localStorage.setItem(`notifications_${user?.Id}`, JSON.stringify(updated));
  };

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    
    // Update localStorage
    const stored = JSON.parse(localStorage.getItem(`notifications_${user?.Id}`) || '[]');
    const updated = stored.filter((n: Notification) => n.id !== id);
    localStorage.setItem(`notifications_${user?.Id}`, JSON.stringify(updated));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    localStorage.removeItem(`notifications_${user?.Id}`);
  };

  const loadNotifications = async () => {
    try {
      // Load from localStorage first
      const stored = JSON.parse(localStorage.getItem(`notifications_${user?.Id}`) || '[]');
      setNotifications(stored.map((n: any) => ({
        ...n,
        createdAt: new Date(n.createdAt)
      })));

      // TODO: In future, load from backend API
      // const response = await fetch(`/api/notifications/${user?.Id}`);
      // const serverNotifications = await response.json();
      // setNotifications(serverNotifications);
      
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  useEffect(() => {
    if (user?.Id) {
      loadNotifications();
    }
  }, [user?.Id]);

  // Simulate some system notifications for demo
  useEffect(() => {
    if (user?.Id && notifications.length === 0) {
      // Add some sample notifications on first load
      setTimeout(() => {
        addNotification({
          title: 'Welcome to IMS',
          message: 'Your inventory management system is ready to use.',
          type: 'success',
          actionUrl: '/dashboard',
          actionText: 'Go to Dashboard'
        });
        
        if (user.Role === 'Admin' || user.Role === 'Manager') {
          addNotification({
            title: 'Pending Approvals',
            message: 'You have 3 stock issuance requests awaiting approval.',
            type: 'warning',
            actionUrl: '/approval-manager',
            actionText: 'Review Now'
          });
          
          addNotification({
            title: 'Low Stock Alert',
            message: 'Office supplies inventory is running low. Consider restocking.',
            type: 'warning',
            actionUrl: '/dashboard/inventory-alerts',
            actionText: 'View Details'
          });
        }
        
        // Add role-specific notifications
        if (user.Role === 'User') {
          addNotification({
            title: 'Request Approved',
            message: 'Your stock issuance request #12345 has been approved.',
            type: 'success',
            actionUrl: '/stock-issuance',
            actionText: 'View Request'
          });
        }
        
        // General system notification
        addNotification({
          title: 'System Maintenance',
          message: 'Scheduled maintenance will occur tonight from 2 AM to 4 AM.',
          type: 'info',
          actionUrl: '/notifications',
          actionText: 'Learn More'
        });
        
      }, 2000);
    }
  }, [user]);

  // Simulate new notifications over time (for demo purposes)
  useEffect(() => {
    if (!user?.Id) return;
    
    const interval = setInterval(() => {
      // Randomly add new notifications to simulate real-time updates
      if (Math.random() < 0.3) { // 30% chance every 30 seconds
        const sampleNotifications = [
          {
            title: 'New Stock Request',
            message: `New stock request submitted by ${user.Role === 'Admin' ? 'John Doe' : 'Team Member'}.`,
            type: 'info' as const,
            actionUrl: '/approval-manager',
            actionText: 'Review'
          },
          {
            title: 'Delivery Received',
            message: 'New inventory items have been delivered and added to stock.',
            type: 'success' as const,
            actionUrl: '/dashboard/stock-operations',
            actionText: 'View Details'
          },
          {
            title: 'Approval Required',
            message: 'High-value stock request requires your approval.',
            type: 'warning' as const,
            actionUrl: '/approval-manager',
            actionText: 'Approve Now'
          }
        ];
        
        const randomNotification = sampleNotifications[Math.floor(Math.random() * sampleNotifications.length)];
        addNotification(randomNotification);
      }
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [user?.Id]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    loadNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
