import { useEffect } from 'react'

interface ToastProps {
  message: string
  type?: string
  onClose?: () => void
}

const Toast = ({ message, type = 'success', onClose }: ToastProps) => {
  useEffect(() => {
    if (!onClose) return
    const timer = setTimeout(() => {
      onClose()
    }, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  const styles: Record<string, React.CSSProperties> = {
    container: {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px 24px',
      borderRadius: '8px',
      backgroundColor: type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#ef4444',
      color: 'white',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      zIndex: 10000,
      fontWeight: 600,
      animation: 'slideIn 0.3s ease-out',
    },
    closeBtn: {
      background: 'transparent',
      border: 'none',
      color: 'white',
      cursor: 'pointer',
      marginLeft: '10px',
      fontSize: '1.2rem',
    },
  }

  return (
    <div role="status" aria-live="polite" aria-atomic="true" style={styles.container}>
      <span>{type === 'success' ? '✅' : '❌'}</span>
      {message}
      <button onClick={onClose} style={styles.closeBtn}>&times;</button>
      <style>
        {`
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `}
      </style>
    </div>
  )
}

export default Toast
