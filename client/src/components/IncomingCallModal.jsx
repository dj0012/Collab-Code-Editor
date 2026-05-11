import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPhoneAlt } from 'react-icons/fa';

const IncomingCallModal = ({ incomingCall, onAccept, onDecline }) => {
  return (
    <AnimatePresence>
      {incomingCall && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9, x: '-50%' }}
          animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
          exit={{ opacity: 0, y: -50, scale: 0.9, x: '-50%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={{
            position: 'fixed',
            top: '30px',
            left: '50%',
            background: 'rgba(30, 41, 59, 0.95)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
            zIndex: 10000,
            width: '320px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
            <motion.div 
              animate={{ rotate: [0, -15, 15, -15, 15, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, repeatDelay: 1 }}
              style={{ 
                width: '48px', height: '48px', borderRadius: '50%', 
                background: 'linear-gradient(135deg, #10b981, #059669)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
              }}
            >
              <FaPhoneAlt color="white" size={18} />
            </motion.div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 4px 0', color: 'white', fontSize: '1.1rem', fontWeight: 600 }}>Team Call</h3>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>{incomingCall.callerName} is calling...</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
            <button 
              onClick={onDecline}
              style={{
                flex: 1, padding: '12px', borderRadius: '12px', border: 'none',
                background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444',
                fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s',
                fontSize: '0.95rem'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.25)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.15)'}
            >
              Decline
            </button>
            <button 
              onClick={onAccept}
              style={{
                flex: 1, padding: '12px', borderRadius: '12px', border: 'none',
                background: '#10b981', color: 'white',
                fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                fontSize: '0.95rem'
              }}
              onMouseEnter={(e) => e.target.style.background = '#059669'}
              onMouseLeave={(e) => e.target.style.background = '#10b981'}
            >
              Accept
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IncomingCallModal;
