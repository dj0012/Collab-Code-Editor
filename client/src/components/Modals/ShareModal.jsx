import { FaCopy, FaWhatsapp, FaEnvelope } from "react-icons/fa6";

function ShareModal({ isOpen, onClose, roomId }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
      <div className="auth-panel" onClick={(e) => e.stopPropagation()} style={{ position: 'relative', width: '420px', maxWidth: '90%', padding: '32px' }}>
        <button className="modern-chip chip-button icon-only" onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px' }}>
          ✕
        </button>
        
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div className="panel-badge" style={{ margin: '0 auto 12px auto' }}>Share Room</div>
          <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Invite Team Members</h2>
          <p className="auth-description" style={{ marginTop: '8px' }}>Send this link to anyone you want to collaborate with in real-time.</p>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Room Code</span>
            <span style={{ background: 'rgba(0, 212, 255, 0.1)', color: '#00d4ff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>Active</span>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', letterSpacing: '1px', color: 'var(--text)', wordBreak: 'break-all' }}>
            {roomId}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button className="primary-btn" onClick={() => {
            const link = `${window.location.origin}/?roomId=${roomId}`;
            navigator.clipboard.writeText(link);
            alert("Invite link copied to clipboard!");
          }} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px', fontSize: '1rem', background: 'linear-gradient(135deg, #00d4ff, #9b59b6)' }}>
            <FaCopy /> Copy Invite Link
          </button>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="secondary-btn" onClick={() => {
              const link = `${window.location.origin}/?roomId=${roomId}`;
              window.open(`https://wa.me/?text=Join my live coding session!%0A%0ARoom ID: ${roomId}%0ALink: ${encodeURIComponent(link)}`);
            }} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', background: 'rgba(37, 211, 102, 0.1)', color: '#25D366', border: '1px solid rgba(37, 211, 102, 0.2)' }}>
              <FaWhatsapp size={18} /> WhatsApp
            </button>
            <button className="secondary-btn" onClick={() => {
              const link = `${window.location.origin}/?roomId=${roomId}`;
              window.open(`mailto:?subject=Join my coding session&body=Hey! Join my live coding session on Collab Code Editor.%0A%0ARoom ID: ${roomId}%0ALink: ${encodeURIComponent(link)}`);
            }} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <FaEnvelope size={18} /> Email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShareModal;
