import React, { useState, useEffect, useCallback } from 'react';

interface Toast {
  id: number;
  message: string;
  exiting: boolean;
}

let toastId = 0;
let showToastFn: ((msg: string) => void) | null = null;

export function showToast(msg: string) {
  showToastFn?.(msg);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string) => {
    const id = ++toastId;
    setToasts(prev => [...prev.slice(-2), { id, message, exiting: false }]);
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 300);
    }, 2000);
  }, []);

  useEffect(() => {
    showToastFn = addToast;
    return () => { showToastFn = null; };
  }, [addToast]);

  return (
    <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 200, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
      {toasts.map(t => (
        <div
          key={t.id}
          className={`font-mono-code ${t.exiting ? 'toast-exit' : 'toast-enter'}`}
          style={{
            background: 'var(--pe-card)',
            border: '1px solid var(--pe-border2)',
            borderRadius: 8,
            padding: '8px 20px',
            fontSize: 13,
            color: 'var(--pe-text)',
            boxShadow: '0 4px 20px rgba(0,0,0,.5)',
            whiteSpace: 'nowrap',
          }}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
