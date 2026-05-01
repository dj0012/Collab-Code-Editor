import { motion, AnimatePresence } from "framer-motion";
import { FaCrown, FaLock, FaSync, FaTimes, FaBullhorn, FaBroom, FaUnlock, FaCode, FaEye, FaCommentSlash, FaComment, FaStopCircle, FaDownload } from "react-icons/fa";
import { useState } from "react";

function AdminControlsModal({ 
  isOpen, onClose, 
  isLocked, isReadOnly, isChatMuted, 
  onToggleLock, onToggleReadOnly, onToggleChatMute, 
  onKickAll, onDownloadChat, onForceSync, onMakeAnnouncement, onClearOutput, onResetCode 
}) {
  const [announcementMsg, setAnnouncementMsg] = useState("");

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="modal-overlay" onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
        <motion.div
          className="modal-content"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          style={{ background: 'var(--panel-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '600px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', color: 'var(--text)', maxHeight: '90vh', overflowY: 'auto' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#f1c40f' }}>
              <FaCrown /> Admin Controls
            </h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '4px' }}>
              <FaTimes size={20} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            
            {/* Room Lock */}
            <div className="admin-feature-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: isLocked ? 'rgba(231, 76, 60, 0.2)' : 'rgba(46, 204, 113, 0.2)', color: isLocked ? '#e74c3c' : '#2ecc71', padding: '10px', borderRadius: '10px' }}>
                  {isLocked ? <FaLock size={20} /> : <FaUnlock size={20} />}
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem' }}>Room Access</h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted)' }}>
                    {isLocked ? "Locked. No new joins." : "Open. Anyone can join."}
                  </p>
                </div>
              </div>
              <button 
                className={isLocked ? "secondary-btn" : "primary-btn"} 
                onClick={onToggleLock}
                style={{ width: '100%', padding: '6px', fontSize: '0.85rem', background: isLocked ? 'transparent' : '#e74c3c', borderColor: '#e74c3c', color: isLocked ? '#e74c3c' : '#fff' }}
              >
                {isLocked ? "Unlock Room" : "Lock Room"}
              </button>
            </div>

            {/* Read-Only Mode */}
            <div className="admin-feature-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: isReadOnly ? 'rgba(231, 76, 60, 0.2)' : 'rgba(52, 152, 219, 0.2)', color: isReadOnly ? '#e74c3c' : '#3498db', padding: '10px', borderRadius: '10px' }}>
                  {isReadOnly ? <FaEye size={20} /> : <FaCode size={20} />}
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem' }}>Read-Only Mode</h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted)' }}>
                    {isReadOnly ? "Code is frozen." : "Users can edit code."}
                  </p>
                </div>
              </div>
              <button 
                className={isReadOnly ? "secondary-btn" : "primary-btn"} 
                onClick={onToggleReadOnly}
                style={{ width: '100%', padding: '6px', fontSize: '0.85rem', background: isReadOnly ? 'transparent' : '#e74c3c', borderColor: '#e74c3c', color: isReadOnly ? '#e74c3c' : '#fff' }}
              >
                {isReadOnly ? "Allow Editing" : "Freeze Code"}
              </button>
            </div>

            {/* Mute Chat */}
            <div className="admin-feature-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: isChatMuted ? 'rgba(231, 76, 60, 0.2)' : 'rgba(46, 204, 113, 0.2)', color: isChatMuted ? '#e74c3c' : '#2ecc71', padding: '10px', borderRadius: '10px' }}>
                  {isChatMuted ? <FaCommentSlash size={20} /> : <FaComment size={20} />}
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem' }}>Team Chat</h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted)' }}>
                    {isChatMuted ? "Chat is muted." : "Users can chat."}
                  </p>
                </div>
              </div>
              <button 
                className={isChatMuted ? "secondary-btn" : "primary-btn"} 
                onClick={onToggleChatMute}
                style={{ width: '100%', padding: '6px', fontSize: '0.85rem', background: isChatMuted ? 'transparent' : '#e74c3c', borderColor: '#e74c3c', color: isChatMuted ? '#e74c3c' : '#fff' }}
              >
                {isChatMuted ? "Unmute Chat" : "Mute Chat"}
              </button>
            </div>

            {/* Force Sync */}
            <div className="admin-feature-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'rgba(155, 89, 182, 0.2)', color: '#9b59b6', padding: '10px', borderRadius: '10px' }}>
                  <FaSync size={20} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem' }}>Force Sync</h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted)' }}>Force users to your tab.</p>
                </div>
              </div>
              <button className="primary-btn" onClick={onForceSync} style={{ width: '100%', padding: '6px', fontSize: '0.85rem', background: '#9b59b6' }}>Sync View</button>
            </div>

            {/* End Session */}
            <div className="admin-feature-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'rgba(231, 76, 60, 0.2)', color: '#e74c3c', padding: '10px', borderRadius: '10px' }}>
                  <FaStopCircle size={20} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem' }}>End Session</h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted)' }}>Kick all other users.</p>
                </div>
              </div>
              <button 
                className="primary-btn" 
                onClick={() => {
                  if(window.confirm("Are you sure you want to end the session and kick everyone else?")) {
                    onKickAll();
                  }
                }} 
                style={{ width: '100%', padding: '6px', fontSize: '0.85rem', background: '#e74c3c' }}
              >
                End Session
              </button>
            </div>

            {/* Chat History */}
            <div className="admin-feature-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'rgba(26, 188, 156, 0.2)', color: '#1abc9c', padding: '10px', borderRadius: '10px' }}>
                  <FaDownload size={20} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem' }}>Chat Log</h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted)' }}>Download full history.</p>
                </div>
              </div>
              <button className="primary-btn" onClick={onDownloadChat} style={{ width: '100%', padding: '6px', fontSize: '0.85rem', background: '#1abc9c' }}>Download Log</button>
            </div>

            {/* Clear Data */}
            <div className="admin-feature-card" style={{ gridColumn: '1 / -1', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: 'rgba(149, 165, 166, 0.2)', color: '#95a5a6', padding: '12px', borderRadius: '12px' }}>
                <FaBroom size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 4px 0' }}>Clear Data</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)' }}>Clear terminal output or reset code completely.</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="secondary-btn" onClick={onClearOutput} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                   Clear Output
                </button>
                <button className="secondary-btn" onClick={onResetCode} style={{ padding: '8px 16px', fontSize: '0.85rem', color: '#e74c3c', borderColor: 'rgba(231, 76, 60, 0.3)' }}>
                  <FaCode /> Reset Code
                </button>
              </div>
            </div>

            {/* Global Announcement */}
            <div className="admin-feature-card" style={{ gridColumn: '1 / -1', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ background: 'rgba(241, 196, 15, 0.2)', color: '#f1c40f', padding: '12px', borderRadius: '12px' }}>
                  <FaBullhorn size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 4px 0' }}>Global Announcement</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)' }}>Send an alert to everyone in the room.</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  value={announcementMsg} 
                  onChange={(e) => setAnnouncementMsg(e.target.value)}
                  placeholder="Type message here..." 
                  className="auth-input" 
                  style={{ flex: 1, padding: '8px 12px', fontSize: '0.9rem' }}
                />
                <button 
                  className="primary-btn" 
                  onClick={() => {
                    if(announcementMsg.trim()) {
                      onMakeAnnouncement(announcementMsg);
                      setAnnouncementMsg("");
                    }
                  }} 
                  style={{ padding: '8px 16px', fontSize: '0.85rem', background: '#f39c12' }}
                >
                  Send
                </button>
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default AdminControlsModal;
