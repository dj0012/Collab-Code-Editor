import { motion, AnimatePresence } from "framer-motion";
import { FaCrown, FaTimes, FaPen } from "react-icons/fa";

function UserList({
  users = [],
  adminUsername,
  currentUsername,
  isAdmin,
  onKickUser,
  onAssignAdmin,
  onToggleAccess,
}) {
  const getUserColor = (username) => {
    const colors = ["#ff4757", "#2ed573", "#1e90ff", "#ffa502", "#ff6b81", "#7bed9f", "#70a1ff", "#eccc68", "#ff7f50", "#9b59b6", "#3498db", "#1abc9c", "#e74c3c"];
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };
  return (
    <div className="user-list-panel" style={{ padding: '16px', flex: 1, overflowY: 'auto' }}>
      <div className="user-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {users.length === 0 && <p className="empty-state">No users connected yet.</p>}

        <AnimatePresence>
          {users.map((user) => (
            <motion.div 
              key={user.socketId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: user.avatar ? 'transparent' : getUserColor(user.username),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: '1.2rem',
                  overflow: 'hidden'
                }}>
                  {user.avatar ? (
                    <img src={user.avatar} alt={`${user.username}'s avatar`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    user.username.slice(0, 1).toUpperCase()
                  )}
                </div>
                <div style={{
                  position: 'absolute',
                  bottom: '-2px',
                  right: '-2px',
                  width: '12px',
                  height: '12px',
                  background: '#10b981',
                  borderRadius: '50%',
                  boxShadow: '0 0 0 2px rgba(0, 0, 0, 0.2), 0 2px 4px rgba(0,0,0,0.5)'
                }} />
              </div>
              
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontWeight: '600', color: 'var(--text)', fontSize: '0.95rem' }}>
                  {user.username}
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {user.username === currentUsername && (
                    <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', color: 'var(--muted)' }}>You</span>
                  )}
                  {user.username === adminUsername && (
                    <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'rgba(124, 164, 255, 0.15)', borderRadius: '4px', color: '#7ca4ff' }}>Admin</span>
                  )}
                  {user.canEdit && user.username !== adminUsername && (
                    <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'rgba(241, 196, 15, 0.15)', borderRadius: '4px', color: '#f1c40f' }}>Editor</span>
                  )}
                </div>
              </div>
              
              {isAdmin && user.username !== currentUsername && user.username !== adminUsername && (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    title={user.canEdit ? "Revoke Access" : "Grant Access"}
                    onClick={() => onToggleAccess(user.socketId)}
                    style={{
                      background: user.canEdit ? 'rgba(241, 196, 15, 0.25)' : 'rgba(241, 196, 15, 0.15)',
                      color: '#f1c40f',
                      border: 'none',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(241, 196, 15, 0.35)'}
                    onMouseOut={(e) => e.currentTarget.style.background = user.canEdit ? 'rgba(241, 196, 15, 0.25)' : 'rgba(241, 196, 15, 0.15)'}
                  >
                    <FaPen size={12} />
                  </button>
                  <button
                    title="Make Admin"
                    onClick={() => onAssignAdmin(user.userId)}
                    style={{
                      background: 'rgba(124, 164, 255, 0.15)',
                      color: '#7ca4ff',
                      border: 'none',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(124, 164, 255, 0.25)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(124, 164, 255, 0.15)'}
                  >
                    <FaCrown size={14} />
                  </button>
                  <button
                    title="Remove from Room"
                    onClick={() => onKickUser(user.socketId)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      color: '#ef4444',
                      border: 'none',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
                  >
                    <FaTimes size={14} />
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default UserList;
