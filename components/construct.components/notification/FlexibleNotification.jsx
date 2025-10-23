import {
    faCheckCircle,
    faClock,
    faExclamationTriangle,
    faInfoCircle,
    faTimes,
    faUsers
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';

/**
 * Flexible Notification Component
 * @param {Object} props
 * @param {boolean} props.show - Show/hide notification
 * @param {function} props.onClose - Close callback
 * @param {string} props.type - notification type: 'success', 'error', 'warning', 'info', 'pending'
 * @param {string} props.title - Notification title
 * @param {string} props.message - Notification message
 * @param {string} props.actionText - Action button text (optional)
 * @param {function} props.onAction - Action button callback (optional)
 * @param {number} props.autoClose - Auto close after ms (optional)
 * @param {string} props.position - Position: 'center', 'top', 'bottom'
 * @param {string} props.size - Size: 'sm', 'md', 'lg'
 */
export default function FlexibleNotification({
  show = false,
  onClose,
  type = 'info',
  title,
  message,
  actionText,
  onAction,
  autoClose,
  position = 'center',
  size = 'md'
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      setTimeout(() => setIsAnimating(true), 10);
      
      if (autoClose) {
        const timer = setTimeout(() => {
          handleClose();
        }, autoClose);
        return () => clearTimeout(timer);
      }
    } else {
      setIsAnimating(false);
      setTimeout(() => setIsVisible(false), 200);
    }
  }, [show, autoClose]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 200);
  };

  if (!isVisible) return null;

  // Icon configuration
  const iconConfig = {
    success: { icon: faCheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    error: { icon: faExclamationTriangle, color: 'text-red-600', bg: 'bg-red-100' },
    warning: { icon: faExclamationTriangle, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    info: { icon: faInfoCircle, color: 'text-blue-600', bg: 'bg-blue-100' },
    pending: { icon: faClock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    join: { icon: faUsers, color: 'text-primary', bg: 'bg-primary/10' }
  };

  const currentIcon = iconConfig[type] || iconConfig.info;

  // Position classes
  const positionClasses = {
    center: 'items-center justify-center',
    top: 'items-start justify-center pt-20',
    bottom: 'items-end justify-center pb-20'
  };

  // Size classes
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg'
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex ${positionClasses[position]} px-4`}
      style={{ 
        backgroundColor: isAnimating ? 'rgba(0, 0, 0, 0.5)' : 'transparent',
        transition: 'background-color 200ms ease-in-out'
      }}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div 
        className={`
          bg-white rounded-2xl shadow-2xl p-6 w-full ${sizeClasses[size]} mx-auto
          transform transition-all duration-200 ease-out
          ${isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
        `}
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`
              w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0
              ${currentIcon.bg}
            `}>
              <FontAwesomeIcon 
                icon={currentIcon.icon} 
                className={`text-lg ${currentIcon.color}`} 
              />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 leading-tight">
                {title}
              </h3>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors flex-shrink-0 ml-2"
          >
            <FontAwesomeIcon icon={faTimes} className="text-slate-400" />
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className="mb-6">
            <p className="text-slate-600 leading-relaxed">
              {message}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 py-3 px-4 border border-slate-300 rounded-xl font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Tutup
          </button>
          {actionText && onAction && (
            <button
              onClick={() => {
                onAction();
                handleClose();
              }}
              className="flex-1 py-3 px-4 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              {actionText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Toast notification variant for quick messages
export function useToastNotification() {
  const [notifications, setNotifications] = useState([]);

  const showToast = (config) => {
    const id = Date.now();
    const notification = {
      id,
      ...config,
      autoClose: config.autoClose || 3000
    };
    
    setNotifications(prev => [...prev, notification]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, notification.autoClose + 500);
  };

  const ToastContainer = () => (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map(notification => (
        <ToastItem
          key={notification.id}
          {...notification}
          onClose={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
        />
      ))}
    </div>
  );

  return { showToast, ToastContainer };
}

function ToastItem({ type, title, message, onClose, autoClose }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 200);
      }, autoClose);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  const iconConfig = {
    success: { icon: faCheckCircle, color: 'text-green-600', bg: 'bg-green-100', border: 'border-green-200' },
    error: { icon: faExclamationTriangle, color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200' },
    warning: { icon: faExclamationTriangle, color: 'text-yellow-600', bg: 'bg-yellow-100', border: 'border-yellow-200' },
    info: { icon: faInfoCircle, color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200' },
    pending: { icon: faClock, color: 'text-yellow-600', bg: 'bg-yellow-100', border: 'border-yellow-200' }
  };

  const currentIcon = iconConfig[type] || iconConfig.info;

  return (
    <div
      className={`
        bg-white border rounded-lg shadow-lg p-4 min-w-80 max-w-sm
        transform transition-all duration-200 ease-out
        ${currentIcon.border}
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className="flex items-start gap-3">
        <div className={`
          w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
          ${currentIcon.bg}
        `}>
          <FontAwesomeIcon 
            icon={currentIcon.icon} 
            className={`text-sm ${currentIcon.color}`} 
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-slate-800 text-sm leading-tight">
            {title}
          </h4>
          {message && (
            <p className="text-slate-600 text-sm mt-1 leading-relaxed">
              {message}
            </p>
          )}
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 200);
          }}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100 transition-colors flex-shrink-0"
        >
          <FontAwesomeIcon icon={faTimes} className="text-slate-400 text-xs" />
        </button>
      </div>
    </div>
  );
}