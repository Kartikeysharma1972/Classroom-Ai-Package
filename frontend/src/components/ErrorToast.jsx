import React, { useEffect, useState } from 'react';
import './ErrorToast.css';

const ErrorToast = ({ message, duration = 5000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className="error-toast">
      <div className="error-toast-content">
        <span className="error-icon">⚠️</span>
        <span className="error-message">{message}</span>
        <button
          className="error-close"
          onClick={() => {
            setIsVisible(false);
            if (onClose) onClose();
          }}
        >
          ✕
        </button>
      </div>
      <div className="error-progress" style={{ animationDuration: `${duration}ms` }} />
    </div>
  );
};

export default ErrorToast;
