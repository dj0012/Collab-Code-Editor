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
          <div className="auth-panel" onClick={(e) => e.stopPropagation()} style={{ position: 'relative', width: '550px', maxWidth: '90%', padding: '40px', background: 'var(--panel-strong)', border: '1px solid var(--border)', boxShadow: '0 24px 48px rgba(0,0,0,0.4)', borderRadius: 'var(--radius-xl)' }}>
            <button className="modern-chip chip-button icon-only" onClick={() => setShowTemplateModal(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'var(--panel)', border: '1px solid var(--border)' }}>
              <FaTimes />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                <FaCode size={24} />
              </div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--heading)' }}>Select a Template</h2>
            </div>
            <p className="auth-description" style={{ marginBottom: '32px', fontSize: '1rem', color: 'var(--muted)' }}>
              Choose a starting point for your new collaborative session.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {templates.map(template => (
                <button 
                  key={template._id || template.name}
                  onClick={() => createRoom(template)}
                  style={{
                    background: 'var(--panel)',
                    border: '1px solid var(--border)',
                    padding: '20px',
                    borderRadius: 'var(--radius-lg)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex', flexDirection: 'column', gap: '8px'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'var(--panel-strong)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.borderColor = 'var(--accent)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'var(--panel)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                >
                  <strong style={{ display: 'block', fontSize: '1.1rem', color: 'var(--heading)' }}>{template.name}</strong>
                  <span style={{ color: 'var(--muted)', fontSize: '0.85rem', lineHeight: 1.4 }}>{template.description}</span>
                </button>
              ))}
              {templates.length === 0 && (
                <button onClick={() => createRoom({ files: [] })} className="primary-btn" style={{ gridColumn: '1 / -1', padding: '16px' }}>
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
        <header style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', padding: '24px 32px', 
          background: 'var(--panel)', backdropFilter: 'var(--glass-blur)', 
          borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)',
          boxShadow: 'var(--shadow)' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <img src="/logo.png" alt="Logo" style={{ width: '48px', height: '48px', objectFit: 'contain', filter: 'drop-shadow(0 4px 8px var(--accent-soft))' }} />
            <div>
              <h2 style={{ margin: 0, fontSize: '1.6rem', color: 'var(--heading)' }}>Welcome back, <span style={{ color: 'var(--accent)' }}>{username}</span></h2>
              <span style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>Your collaborative workspace</span>
            </div>
          </div>
          <button className="secondary-btn" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', gap: '10px', borderRadius: 'var(--radius-md)' }}>
            <FaSignOutAlt /> Sign Out
          </button>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '32px' }}>
          <section className="dashboard-main" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px' }}>
              <h3 style={{ fontSize: '1.3rem', color: 'var(--heading)', display: 'flex', alignItems: 'center' }}><FaFolderOpen style={{ marginRight: '12px', color: 'var(--accent)' }} /> My Recent Rooms</h3>
              <button className="primary-btn" onClick={openTemplateModal} style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: 'var(--radius-md)' }}>
                <FaPlus /> New Room
              </button>
            </div>

            {rooms.length === 0 ? (
              <div style={{ 
                padding: '64px', textAlign: 'center', background: 'var(--panel)', backdropFilter: 'var(--glass-blur)',
                borderRadius: 'var(--radius-xl)', border: '1px dashed rgba(255,255,255,0.15)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
              }}>
                <div style={{ background: 'var(--accent-soft)', padding: '24px', borderRadius: '50%', marginBottom: '24px' }}>
                  <FaCode size={48} color="var(--accent)" />
                </div>
                <h4 style={{ fontSize: '1.2rem', color: 'var(--heading)', marginBottom: '8px' }}>No saved rooms yet</h4>
                <p style={{ color: 'var(--muted)', maxWidth: '300px', lineHeight: 1.6 }}>Rooms you create or join will automatically appear here for easy access.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {rooms.map(room => (
                  <div 
                    key={room.roomId}
                    onClick={() => navigate(`/room/${room.roomId}`, { state: { username } })}
                    style={{
                      background: 'var(--panel)',
                      backdropFilter: 'var(--glass-blur)',
                      border: '1px solid var(--border)',
                      padding: '24px',
                      borderRadius: 'var(--radius-lg)',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      display: 'flex', flexDirection: 'column', gap: '12px',
                      boxShadow: 'var(--shadow)'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = 'var(--panel-strong)';
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.borderColor = 'var(--border-glow)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'var(--panel)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = 'var(--border)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                        <FaCode size={20} />
                      </div>
                      <h4 style={{ margin: 0, fontFamily: 'var(--mono)', fontSize: '1.05rem', color: 'var(--heading)' }}>
                        {room.roomId}
                      </h4>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)' }}>
                        Last active: <span style={{ color: 'var(--text)' }}>{new Date(room.updatedAt).toLocaleDateString()}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <aside className="auth-panel" style={{ height: 'fit-content', position: 'sticky', top: '24px', padding: '32px' }}>
            <div style={{ display: 'inline-flex', padding: '8px 16px', background: 'var(--accent-soft)', color: 'var(--accent)', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '24px' }}>Quick Join</div>
            <h3 style={{ marginBottom: '12px', fontSize: '1.4rem' }}>Join a Workspace</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.95rem', marginBottom: '24px', lineHeight: 1.5 }}>Have an invite code? Enter it below to immediately jump into a collaborative session.</p>
            <form onSubmit={joinRoom} className="auth-form">
              <label className="field">
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Room Code</span>
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="e.g. A1B2C3D4E5F6G7H8"
                  style={{ padding: '14px 16px', fontSize: '1rem', letterSpacing: '2px', fontFamily: 'var(--mono)' }}
                  required
                />
              </label>
              <button type="submit" className="primary-btn" style={{ width: '100%', marginTop: '16px', padding: '14px', fontSize: '1.05rem', borderRadius: 'var(--radius-md)' }}>
                Enter Room
              </button>
            </form>
          </aside>
        </div>
      </motion.div>
    </div>
  );
}

export default Dashboard;
