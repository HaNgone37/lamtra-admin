import { useEffect } from 'react'

interface ToastProps {
  message: string
  type: 'success' | 'error'
  onClose: () => void
  duration?: number
}

export default function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [onClose, duration])

  const bgColor = type === 'success' ? '#EDFCF3' : '#FFF0F0'
  const textColor = type === 'success' ? '#00A869' : '#ED2939'
  const borderColor = type === 'success' ? '#00A869' : '#ED2939'

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: '12px',
        padding: '16px 20px',
        boxShadow: 'rgba(0, 0, 0, 0.1) 0px 4px 12px',
        zIndex: 9999,
        animation: 'slideIn 0.3s ease-out'
      }}
    >
      <p style={{ fontSize: '14px', fontWeight: '500', color: textColor, margin: 0 }}>
        {message}
      </p>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
