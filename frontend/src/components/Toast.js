import { useEffect, useState } from 'react';

export default function Toast({ message, type = 'success', visible }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!visible) {
      setShow(false);
      return;
    }

    setShow(true);
    const t = setTimeout(() => setShow(false), 3000);
    return () => clearTimeout(t);
  }, [visible]);

  if (!show || !message) return null;

  const bg = type === 'error' ? '#b91c1c' : '#16a34a';

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        left: '50%',
        bottom: 24,
        transform: 'translateX(-50%)',
        zIndex: 9999,
        background: bg,
        color: '#fff',
        padding: '10px 14px',
        borderRadius: 12,
        boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
        maxWidth: 'min(92vw, 520px)',
        textAlign: 'center',
        fontSize: 14,
        lineHeight: 1.3,
      }}
    >
      {message}
    </div>
  );
}

