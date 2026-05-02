import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaPlus, FaSignOutAlt, FaFolderOpen, FaCode, FaTimes } from "react-icons/fa";
import { getUserRooms, getTemplates } from "../services/api";

function Dashboard() {
  const [rooms, setRooms] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const navigate = useNavigate();
  const username = localStorage.getItem("collab_username");

  useEffect(() => {
    if (!localStorage.getItem("collab_token")) {
      navigate("/");
      return;
    }
    
    loadRooms();
    loadTemplates();
  }, [navigate]);

  const loadTemplates = async () => {
    try {
      const data = await getTemplates();
      setTemplates(data);
    } catch (err) {
      console.error("Failed to load templates", err);
    }
  };

  const loadRooms = async () => {
    try {
      const data = await getUserRooms();
      setRooms(data);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        handleLogout();
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("collab_token");
    localStorage.removeItem("collab_username");
    localStorage.removeItem("collab_userId");
    navigate("/");
  };

  const generateRoomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@*_-";
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    let code = "";
    for (let i = 0; i < 16; i++) {
      code += chars[array[i] % chars.length];
    }
    return code;
  };

  const openTemplateModal = () => {
    setShowTemplateModal(true);
  };

  const createRoom = (template) => {
    const newRoomId = generateRoomCode();
    // Pass the selected template files via state so the Room component can initialize it
    navigate(`/room/${newRoomId}`, { state: { username, initialFiles: template?.files || [] } });
  };

  const joinRoom = (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    navigate(`/room/${joinCode.trim()}`, { state: { username } });
  };

  return (
    <div className="auth-shell">
      {showTemplateModal && (
        <div className="modal-backdrop" onClick={() => setShowTemplateModal(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
          <div className="auth-panel" onClick={(e) => e.stopPropagation()} style={{ position: 'relative', width: '500px', maxWidth: '90%' }}>
            <button className="modern-chip chip-button icon-only" onClick={() => setShowTemplateModal(false)} style={{ position: 'absolute', top: '16px', right: '16px' }}>
              <FaTimes />
            </button>
            <h2 style={{ marginBottom: '8px' }}>Select a Template</h2>
            <p className="auth-description" style={{ marginBottom: '24px' }}>
              Choose a starting point for your new collaborative session.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
              {templates.map(template => (
                <button 
                  key={template._id || template.name}
                  onClick={() => createRoom(template)}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    padding: '16px',
                    borderRadius: '12px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    color: 'white'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >
                  <strong style={{ display: 'block', fontSize: '1.1rem', marginBottom: '4px' }}>{template.name}</strong>
                  <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{template.description}</span>
                </button>
              ))}
              {templates.length === 0 && (
                <button onClick={() => createRoom({ files: [] })} className="primary-btn">
                  Create Blank Project
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="auth-backdrop auth-backdrop-one"></div>
      <div className="auth-backdrop auth-backdrop-two"></div>

      <motion.div
        className="auth-layout"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        style={{ maxWidth: '1000px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column' }}
      >
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <img src="/logo.png" alt="Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
            <div>
              <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Welcome, {username}</h2>
              <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Your collaborative workspace</span>
            </div>
          </div>
          <button className="secondary-btn" onClick={handleLogout} style={{ padding: '8px 16px', gap: '8px' }}>
            <FaSignOutAlt /> Sign Out
          </button>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '32px' }}>
          <section className="dashboard-main">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3><FaFolderOpen style={{ marginRight: '10px' }} /> My Recent Rooms</h3>
              <button className="primary-btn" onClick={openTemplateModal} style={{ padding: '8px 24px' }}>
                <FaPlus /> New Room
              </button>
            </div>

            {rooms.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                <FaCode size={48} color="rgba(255,255,255,0.1)" style={{ marginBottom: '16px' }} />
                <h4>No saved rooms yet</h4>
                <p className="auth-description">Rooms you create will automatically appear here.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                {rooms.map(room => (
                  <div 
                    key={room.roomId}
                    onClick={() => navigate(`/room/${room.roomId}`, { state: { username } })}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      padding: '20px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <h4 style={{ margin: '0 0 8px 0', fontFamily: 'var(--mono)', fontSize: '0.9rem', color: '#a5b4fc' }}>
                      {room.roomId}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)' }}>
                      Last active: {new Date(room.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <aside className="auth-panel" style={{ height: 'fit-content' }}>
            <h3 style={{ marginBottom: '16px' }}>Join a Room</h3>
            <form onSubmit={joinRoom} className="auth-form">
              <label className="field">
                <span>Room Code</span>
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="Enter 16-digit code"
                  required
                />
              </label>
              <button type="submit" className="primary-btn" style={{ width: '100%', marginTop: '8px' }}>
                Join
              </button>
            </form>
          </aside>
        </div>
      </motion.div>
    </div>
  );
}

export default Dashboard;
