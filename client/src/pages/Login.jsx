import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { FaArrowRight, FaBolt, FaCodeBranch, FaUsers, FaUserPlus, FaSignInAlt, FaUserSecret } from "react-icons/fa";
import { loginUser, registerUser } from "../services/api";

function Login() {
  const [activeTab, setActiveTab] = useState("guest"); // "guest", "login", "register"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [roomId, setRoomId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomId, setNewRoomId] = useState("");
  const [logoPreview, setLogoPreview] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If already logged in, go to dashboard unless they have a roomId query param
    const token = localStorage.getItem("collab_token");
    const params = new URLSearchParams(location.search);
    const roomParam = params.get("roomId");
    
    if (roomParam) {
      setRoomId(roomParam);
    } else if (token) {
      navigate("/dashboard");
    }
  }, [location.search, navigate]);

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

  const createRoom = () => {
    let finalUsername = username.trim();
    if (!finalUsername) {
      alert("Display Name is compulsory to create a room.");
      return;
    }

    let finalRoomId = newRoomId.trim();
    if (!finalRoomId || finalRoomId.length !== 16) {
      finalRoomId = generateRoomCode();
    }
    
    localStorage.setItem("collab_username", finalUsername);
    navigate(`/room/${finalRoomId}`, { state: { username: finalUsername, logo: logoPreview } });
  };

  const openCreateModal = () => {
    if (activeTab !== "guest") {
      // Direct them to dashboard instead if they try to create from login/register tabs
      alert("Please login first to create saved rooms, or switch to Guest mode.");
      return;
    }
    setNewRoomId(generateRoomCode());
    setShowCreateModal(true);
  };

  const joinGuestRoom = () => {
    const normalizedRoomId = roomId.trim();
    if (!normalizedRoomId || !username) return alert("Enter details");
    localStorage.setItem("collab_username", username);
    navigate(`/room/${normalizedRoomId}`, { state: { username } });
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!username || !password) return setError("Fill all fields");
    
    setLoading(true);
    setError("");
    try {
      let data;
      if (activeTab === "register") {
        data = await registerUser(username, password);
      } else {
        data = await loginUser(username, password);
      }
      
      localStorage.setItem("collab_token", data.token);
      localStorage.setItem("collab_username", data.username);
      localStorage.setItem("collab_userId", data.userId);
      
      if (roomId) {
        navigate(`/room/${roomId}`, { state: { username: data.username } });
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
          <div className="auth-panel" onClick={(e) => e.stopPropagation()} style={{ position: 'relative', width: '400px', maxWidth: '90%' }}>
            <button className="modern-chip chip-button icon-only" onClick={() => setShowCreateModal(false)} style={{ position: 'absolute', top: '16px', right: '16px' }}>
              ✕
            </button>
            <h2 style={{ marginBottom: '8px' }}>Create New Room</h2>
            <p className="auth-description" style={{ marginBottom: '24px' }}>
              Enter details for your new collaborative session.
            </p>
            <div className="auth-form">
              <label className="field">
                <span>Display Name (Required)</span>
                <input
                  value={username}
                  placeholder="e.g. Alice"
                  onChange={(e) => setUsername(e.target.value)}
                />
              </label>
              <label className="field">
                <span>16-Digit Room Code (Auto-generated)</span>
                <input
                  value={newRoomId}
                  readOnly
                  style={{ opacity: 0.8 }}
                />
              </label>
              <label className="field">
                <span>Workspace Logo (Optional)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setLogoPreview(URL.createObjectURL(file));
                    }
                  }}
                  style={{ padding: '8px' }}
                />
              </label>
              <button className="primary-btn" onClick={createRoom} style={{ marginTop: '12px' }}>
                Launch Room
              </button>
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
      >
        <section className="auth-copy">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0px', marginBottom: '24px' }}>
            <img src="/logo.png" alt="Collab Code Editor" style={{ width: '56px', height: '56px', objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0, 212, 255, 0.4))', transform: 'scale(2.2) translateY(1px)', marginRight: '-4px' }} />
            <span style={{ fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1, background: 'linear-gradient(180deg, #ffffff 0%, #a5b4fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Collab Code Editor
            </span>
          </div>
          <span className="eyebrow">Realtime collaboration studio</span>
          <h1>Build together in a workspace made for momentum.</h1>
          <p className="auth-description">
            Code, run, chat, and ask AI questions in one shared room designed
            to keep teams moving without context switching.
          </p>

          <div className="feature-grid">
            <div className="feature-card">
              <FaUsers />
              <div>
                <strong>Shared rooms</strong>
                <p>Jump into live sessions with your team instantly.</p>
              </div>
            </div>

            <div className="feature-card">
              <FaCodeBranch />
              <div>
                <strong>Live editing</strong>
                <p>Collaborate on the same code without losing flow.</p>
              </div>
            </div>

            <div className="feature-card">
              <FaBolt />
              <div>
                <strong>Run and learn</strong>
                <p>Execute code and ask the built-in assistant for help.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="auth-panel" style={{ height: 'fit-content' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '12px' }}>
            <button 
              onClick={() => { setActiveTab("guest"); setError(""); }}
              style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: activeTab === "guest" ? 'rgba(255,255,255,0.1)' : 'transparent', color: activeTab === "guest" ? '#fff' : 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s', fontWeight: activeTab === "guest" ? '600' : '400' }}
            >
              <FaUserSecret /> Guest
            </button>
            <button 
              onClick={() => { setActiveTab("login"); setError(""); }}
              style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: activeTab === "login" ? 'rgba(255,255,255,0.1)' : 'transparent', color: activeTab === "login" ? '#fff' : 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s', fontWeight: activeTab === "login" ? '600' : '400' }}
            >
              <FaSignInAlt /> Login
            </button>
            <button 
              onClick={() => { setActiveTab("register"); setError(""); }}
              style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: activeTab === "register" ? 'rgba(255,255,255,0.1)' : 'transparent', color: activeTab === "register" ? '#fff' : 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s', fontWeight: activeTab === "register" ? '600' : '400' }}
            >
              <FaUserPlus /> Register
            </button>
          </div>

          <div className="panel-badge">{activeTab === "guest" ? "Start a session" : (activeTab === "login" ? "Welcome back" : "Create an account")}</div>
          <h2>
            {activeTab === "guest" && "Enter your collaborative workspace"}
            {activeTab === "login" && "Sign in to your dashboard"}
            {activeTab === "register" && "Join the platform"}
          </h2>
          <p className="panel-description">
            {activeTab === "guest" && "Pick a username, join an existing room, or spin up a fresh one."}
            {activeTab === "login" && "Access your saved rooms and settings."}
            {activeTab === "register" && "Create an account to save your rooms permanently."}
          </p>

          {error && (
            <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}

          {activeTab === "guest" ? (
            <div className="auth-form">
              <label className="field">
                <span>Display name</span>
                <input
                  value={username}
                  placeholder="e.g. Dhananjay"
                  onChange={(e) => setUsername(e.target.value)}
                />
              </label>

              <label className="field">
                <span>Room code</span>
                <input
                  value={roomId}
                  placeholder="Enter 16-digit room code"
                  inputMode="text"
                  maxLength={16}
                  onChange={(e) => setRoomId(e.target.value.slice(0, 16))}
                />
              </label>

              <div className="auth-actions">
                <button className="primary-btn" onClick={joinGuestRoom}>
                  Join room
                  <FaArrowRight />
                </button>

                <button className="secondary-btn" onClick={openCreateModal}>
                  Create new room
                </button>
              </div>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleAuth}>
              <label className="field">
                <span>Username</span>
                <input
                  value={username}
                  placeholder="e.g. dj_coder"
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </label>

              <label className="field">
                <span>Password</span>
                <input
                  type="password"
                  value={password}
                  placeholder="••••••••"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>
              
              {roomId && (
                <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaBolt color="#f1c40f" /> You will join room <strong>{roomId}</strong> after {activeTab}
                </div>
              )}

              <button type="submit" className="primary-btn" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
                {loading ? "Processing..." : (activeTab === "login" ? "Sign In" : "Create Account")}
              </button>
            </form>
          )}
        </section>
      </motion.div>
    </div>
  );
}

export default Login;
