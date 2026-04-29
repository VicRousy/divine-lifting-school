import React from 'react';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Delete", type = "danger" }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(4px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
    }}>
      <div style={{
        backgroundColor: '#0f172a', padding: '24px', borderRadius: '12px',
        border: '1px solid #1e293b', width: '90%', maxWidth: '400px', textAlign: 'center'
      }}>
        <h3 style={{ color: '#f8fafc', marginBottom: '12px' }}>{title}</h3>
        <p style={{ color: '#94a3b8', marginBottom: '24px', fontSize: '0.95rem' }}>{message}</p>
        
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button onClick={onCancel} style={{
            padding: '10px 20px', borderRadius: '6px', border: '1px solid #334155',
            background: 'transparent', color: '#f8fafc', cursor: 'pointer'
          }}>
            Cancel
          </button>
          <button onClick={onConfirm} style={{
            padding: '10px 20px', borderRadius: '6px', border: 'none',
            background: type === 'danger' ? '#ef4444' : '#3b82f6', color: 'white', cursor: 'pointer', fontWeight: '600'
          }}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;