import { useNavigate } from "react-router-dom";

function ProfileModal({ isOpen, onClose, username, currentAvatar, avatarColor, isAdmin, handleAvatarChange }) {
  const navigate = useNavigate();
  
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
      <div className="auth-panel" onClick={(e) => e.stopPropagation()} style={{ position: 'relative', width: '320px', maxWidth: '90%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <button className="modern-chip chip-button icon-only" onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px' }}>
          ✕
        </button>
        <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '50%', background: currentAvatar ? 'rgba(255,255,255,0.1)' : avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.1)' }}>
            {currentAvatar ? (
              <img src={currentAvatar} alt="User Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '36px', fontWeight: 'bold', color: '#fff' }}>{username?.charAt(0).toUpperCase()}</span>
            )}
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', background: 'rgba(0,0,0,0.5)', padding: '2px 0', fontSize: '10px', color: '#fff', textAlign: 'center' }}>Edit</div>
          </div>
          <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
        </label>
        <h2 style={{ marginBottom: '4px', marginTop: '8px' }}>{username}</h2>
        <p className="auth-description" style={{ marginBottom: '24px' }}>
          {isAdmin ? "Room Administrator" : "Room Member"}
        </p>
        <button className="primary-btn" onClick={() => navigate("/")} style={{ width: '100%', background: 'var(--accent-strong)' }}>
          Leave Room
        </button>
      </div>
    </div>
  );
}

export default ProfileModal;
