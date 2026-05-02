import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo, useRef } from "react";
import JSZip from "jszip";
import socket from "../services/socket";
import CodeEditor from "../components/Editor";
import Whiteboard from "../components/Whiteboard";
import Output from "../components/Output";
import { runCode, saveVersion, getVersions } from "../services/api";
import Chat from "../components/Chat";
import UserList from "../components/UserList";
import { FaPlay, FaRobot, FaTerminal, FaCrown, FaBullhorn, FaHistory, FaSave, FaClock, FaUsers } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import AIChat from "../components/AIChat";
import AdminControlsModal from "../components/AdminControlsModal";
import {
  FaCode,
  FaDownload,
  FaEraser,
  FaMoon,
  FaPaperPlane,
  FaRotateLeft,
  FaSun,
  FaWhatsapp,
  FaEnvelope,
  FaCopy,
  FaPen,
} from "react-icons/fa6";

const LANGUAGE_OPTIONS = [
  { label: "JavaScript", value: "javascript", judge0Id: 63 },
  { label: "Python", value: "python", judge0Id: 71 },
  { label: "Java", value: "java", judge0Id: 62 },
  { label: "C++", value: "cpp", judge0Id: 54 },
  { label: "C", value: "c", judge0Id: 50 },
  { label: "Whiteboard", value: "whiteboard", judge0Id: -1 },
];

function Room() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const username = location.state?.username || sessionStorage.getItem("collab_username");
  
  const [myUserId] = useState(() => {
    let id = sessionStorage.getItem("collab_userId");
    if (!id) {
      id = "user_" + Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem("collab_userId", id);
    }
    return id;
  });

  useEffect(() => {
    if (username) {
      sessionStorage.setItem("collab_username", username);
    }
  }, [username]);

  const [files, setFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState("");
  const activeFile = files.find(f => f.id === activeFileId) || files[0] || {};
  const code = activeFile.content || "";
  const language = activeFile.language ? LANGUAGE_OPTIONS.find(l => l.value === activeFile.language) : null;


  const [users, setUsers] = useState([]);
  const [adminId, setAdminId] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [currentSocketId, setCurrentSocketId] = useState("");
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  const [showShareModal, setShowShareModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCreateFileModal, setShowCreateFileModal] = useState(false);
  const [showCreateWhiteboardModal, setShowCreateWhiteboardModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [createFileError, setCreateFileError] = useState("");
  const [activeRightTab, setActiveRightTab] = useState("team");
  const [activeTab, setActiveTab] = useState("files"); 
  const [versions, setVersions] = useState([]);
  const [isSavingVersion, setIsSavingVersion] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isChatMuted, setIsChatMuted] = useState(false);
  const [announcement, setAnnouncement] = useState(null);

  const avatarColors = ["#ff4757", "#2ed573", "#1e90ff", "#ffa502", "#ff6b81", "#7bed9f", "#70a1ff", "#eccc68", "#ff7f50", "#9b59b6", "#3498db", "#1abc9c", "#e74c3c"];
  const avatarColor = useMemo(() => {
    let hash = 0;
    const nameStr = username || "Guest";
    for (let i = 0; i < nameStr.length; i++) {
      hash = nameStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    return avatarColors[Math.abs(hash) % avatarColors.length];
  }, [username]);

  useEffect(() => {
    if (!username) {
      navigate("/");
      return;
    }

    const syncSocketId = () => setCurrentSocketId(socket.id || "");
    const handleRoomState = (roomState) => {
      setUsers(roomState.users || []);
      setAdminId(roomState.adminId || "");
      setAdminUsername(roomState.adminUsername || "");
      setIsLocked(roomState.isLocked || false);
      setIsReadOnly(roomState.isReadOnly || false);
      setIsChatMuted(roomState.isChatMuted || false);

      if (roomState.files) {
        setFiles(roomState.files);
        if (roomState.files.length > 0) {
          setActiveFileId(prev => roomState.files.find(f => f.id === prev) ? prev : roomState.files[0].id);
        }
      }
    };
    
    const handleVersionSaved = (version) => {
      setVersions(prev => [version, ...prev]);
    };

    const handleFileExecution = ({ fileId, execution }) => {
      setFiles(prev => prev.map(f => {
        if (f.id === fileId) {
          return { ...f, executions: [...(f.executions || []), execution] };
        }
        return f;
      }));
    };
    const handleFileExecutionsCleared = ({ fileId }) => {
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, executions: [] } : f));
    };
    const handleFileCreated = (file) => setFiles(prev => [...prev, file]);
    const handleFileDeleted = (fileId) => {
      setFiles(prev => prev.filter(f => f.id !== fileId));
      setActiveFileId(prev => prev === fileId ? "" : prev); 
    };
    const handleFileRenamed = ({ fileId, newName }) => setFiles(prev => prev.map(f => f.id === fileId ? { ...f, name: newName } : f));
    const handleFileUpdate = ({ fileId, content }) => setFiles(prev => prev.map(f => f.id === fileId ? { ...f, content } : f));
    const handleLanguageUpdated = ({ fileId, language }) => setFiles(prev => prev.map(f => f.id === fileId ? { ...f, language } : f));
    const handleRemoved = () => {
      alert("You were removed from this room by the admin.");
      navigate("/");
    };
    const handleJoinRejected = ({ reason }) => {
      alert(reason);
      navigate("/");
    };
    const handleForceTabSwitch = (fileId) => {
      setActiveFileId(fileId);
    };
    const handleAnnouncement = ({ message, sender }) => {
      setAnnouncement({ message, sender });
      setTimeout(() => setAnnouncement(null), 7000);
    };

    syncSocketId();
    socket.on("connect", syncSocketId);
    socket.on("receive_file_execution", handleFileExecution);
    socket.on("file_executions_cleared", handleFileExecutionsCleared);
    socket.on("room_state", handleRoomState);
    socket.on("removed_from_room", handleRemoved);
    socket.on("file_created", handleFileCreated);
    socket.on("file_deleted", handleFileDeleted);
    socket.on("file_renamed", handleFileRenamed);
    socket.on("file_update", handleFileUpdate);
    socket.on("language_updated", handleLanguageUpdated);
    socket.on("join_rejected", handleJoinRejected);
    socket.on("force_tab_switch", handleForceTabSwitch);
    socket.on("receive_announcement", handleAnnouncement);
    socket.on("version_saved", handleVersionSaved);

    const savedAvatar = localStorage.getItem(`avatar_${username}`);
    const initialAvatar = location.state?.logo || savedAvatar;
    
    if (location.state?.logo) {
      localStorage.setItem(`avatar_${username}`, location.state.logo);
    }

    const initialFiles = location.state?.initialFiles;

    socket.emit("join_room", { 
      roomId, 
      username, 
      avatar: initialAvatar, 
      userId: myUserId,
      initialFiles
    });

    return () => {
      socket.off("connect", syncSocketId);
      socket.off("receive_file_execution", handleFileExecution);
      socket.off("file_executions_cleared", handleFileExecutionsCleared);
      socket.off("room_state", handleRoomState);
      socket.off("removed_from_room", handleRemoved);
      socket.off("file_created", handleFileCreated);
      socket.off("file_deleted", handleFileDeleted);
      socket.off("file_renamed", handleFileRenamed);
      socket.off("file_update", handleFileUpdate);
      socket.off("language_updated", handleLanguageUpdated);
      socket.off("join_rejected", handleJoinRejected);
      socket.off("force_tab_switch", handleForceTabSwitch);
      socket.off("receive_announcement", handleAnnouncement);
      socket.off("version_saved", handleVersionSaved);
    };
  }, [navigate, roomId, username, myUserId]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (activeTab === "history") {
      loadVersions();
    }
  }, [activeTab]);

  const loadVersions = async () => {
    try {
      const data = await getVersions(roomId);
      setVersions(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveVersion = async () => {
    const name = prompt("Enter a name for this version snapshot:");
    if (!name) return;
    setIsSavingVersion(true);
    try {
      await saveVersion(roomId, name, username, files);
    } catch (err) {
      alert("Failed to save version");
    } finally {
      setIsSavingVersion(false);
    }
  };

  const handleRestoreVersion = (version) => {
    if (confirm(`Are you sure you want to restore "${version.name}"? This will overwrite the current code.`)) {
      setFiles(version.files);
      if (version.files.length > 0) setActiveFileId(version.files[0].id);
      socket.emit("file_change", { roomId, fileId: version.files[0]?.id, content: version.files[0]?.content });
    }
  };

  const isAdmin = myUserId === adminId;

  const updateLanguage = (languageValue) => {
    if (!isAdmin || !activeFile.id) return;
    socket.emit("set_language", { roomId, fileId: activeFile.id, language: languageValue });
  };

  const clearOutput = () => {
    if (!isAdmin || !activeFileId) return;
    socket.emit("clear_file_executions", { roomId, fileId: activeFileId });
  };

  const resetCode = () => {
    if (!isAdmin || !activeFile.id) return;
    socket.emit("reset_code", { roomId, fileId: activeFile.id });
  };

  const promptCreateFile = () => {
    if (!isAdmin) return;
    setNewFileName("");
    setCreateFileError("");
    setShowCreateFileModal(true);
  };

  const handleCreateFileSubmit = (e) => {
    e.preventDefault();
    if (!newFileName) {
      setCreateFileError("File name cannot be empty!");
      return;
    }

    const trimmedName = newFileName.trim();
    if (!trimmedName) {
      setCreateFileError("File name cannot be empty!");
      return;
    }

    const parts = trimmedName.split('.');
    if (parts.length < 2 || !parts[parts.length - 1] || !parts[0]) {
      setCreateFileError("Please provide both a valid file name and an extension (e.g. script.js, app.py).");
      return;
    }

    const ext = parts.pop().toLowerCase();
    const validExtensions = ['js', 'jsx', 'py', 'java', 'cpp', 'cc', 'cxx', 'c'];

    if (!validExtensions.includes(ext)) {
      setCreateFileError("Unsupported file extension! Supported: .js, .py, .java, .cpp, .c");
      return;
    }

    let language = "javascript";
    if (ext === 'py') language = 'python';
    else if (ext === 'java') language = 'java';
    else if (ext === 'cpp' || ext === 'cc' || ext === 'cxx') language = 'cpp';
    else if (ext === 'c') language = 'c';

    socket.emit("create_file", { roomId, name: trimmedName, language });
    setShowCreateFileModal(false);
    setNewFileName("");
    setCreateFileError("");
  };

  const promptCreateWhiteboard = () => {
    if (!isAdmin) return;
    setNewFileName("diagram");
    setCreateFileError("");
    setShowCreateWhiteboardModal(true);
  };

  const handleCreateWhiteboardSubmit = (e) => {
    e.preventDefault();
    if (!newFileName) {
      setCreateFileError("Whiteboard name cannot be empty!");
      return;
    }

    let trimmedName = newFileName.trim();
    if (!trimmedName) {
      setCreateFileError("Whiteboard name cannot be empty!");
      return;
    }

    if (!trimmedName.endsWith('.board')) {
      trimmedName += '.board';
    }

    socket.emit("create_file", { roomId, name: trimmedName, language: "whiteboard" });
    setShowCreateWhiteboardModal(false);
    setNewFileName("");
    setCreateFileError("");
  };

  const kickUser = (targetSocketId) => {
    if (!isAdmin) return;
    socket.emit("kick_user", { roomId, targetSocketId });
  };

  const assignAdmin = (newAdminId) => {
    if (!isAdmin) return;
    socket.emit("assign_admin", { roomId, newAdminId });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        
        setUsers(prev => prev.map(u => u.socketId === currentSocketId ? { ...u, avatar: base64String } : u));
        
        socket.emit("update_avatar", { roomId, avatar: base64String });
        localStorage.setItem(`avatar_${username}`, base64String);
        if (location.state) location.state.logo = base64String;
      };
      reader.readAsDataURL(file);
    }
  };

  const savedAvatar = localStorage.getItem(`avatar_${username}`);
  const currentUser = users.find(u => u.socketId === currentSocketId) || { username, avatar: location.state?.logo || savedAvatar };
  const currentAvatar = currentUser.avatar || location.state?.logo || savedAvatar;
  const hasAccess = isAdmin || currentUser.canEdit;

  const usersWithFallback = users.map(u => 
    (u.socketId === currentSocketId || u.username === username) ? { ...u, avatar: currentAvatar } : u
  );

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  };

  const handleDownloadCurrent = () => {
    if (!activeFile.id) return;
    const blob = new Blob([code || ""], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = activeFile.name;
    link.click();
    URL.revokeObjectURL(url);
    setShowDownloadModal(false);
  };

  const handleDownloadZip = async () => {
    if (files.length === 0) return;
    const zip = new JSZip();
    files.forEach(file => {
      zip.file(file.name, file.content || "");
    });
    
    try {
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `room-${roomId}-files.zip`;
      link.click();
      URL.revokeObjectURL(url);
      setShowDownloadModal(false);
    } catch (err) {
      alert("Failed to generate ZIP file.");
    }
  };

  const handleRun = async () => {
    if (!code) {
      const exec = { timestamp: Date.now(), language: "Unknown", output: "No code to run.", isError: true };
      socket.emit("add_file_execution", { roomId, fileId: activeFileId, execution: exec });
      return;
    }

    if (!language || language.judge0Id === -1) {
      const exec = { timestamp: Date.now(), language: "Unknown", output: "Please select a valid language.", isError: true };
      socket.emit("add_file_execution", { roomId, fileId: activeFileId, execution: exec });
      return;
    }

    setIsRunning(true);

    try {
      const result = await runCode(code, language.judge0Id);
      const outputData =
        result.stdout ||
        result.stderr ||
        result.compile_output ||
        "Program finished with no output.";

      const isErrorResult = !!(result.stderr || result.compile_output);
      
      const exec = { timestamp: Date.now(), language: language.label, output: outputData, isError: isErrorResult };
      socket.emit("add_file_execution", { roomId, fileId: activeFileId, execution: exec });
    } catch (err) {
      const exec = { timestamp: Date.now(), language: language.label, output: "Error running code: " + err.message, isError: true };
      socket.emit("add_file_execution", { roomId, fileId: activeFileId, execution: exec });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="workspace-shell modern-shell">
      <AnimatePresence>
        {announcement && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 20, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            style={{
              position: 'fixed',
              top: 0,
              left: '50%',
              zIndex: 10000,
              background: 'rgba(20, 20, 30, 0.85)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(241, 196, 15, 0.4)',
              borderRadius: '12px',
              padding: '16px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5), 0 0 20px rgba(241, 196, 15, 0.1)',
              color: 'var(--text)',
              minWidth: '350px',
              maxWidth: '90vw'
            }}
          >
            <div style={{ background: 'rgba(241, 196, 15, 0.2)', padding: '12px', borderRadius: '50%', color: '#f1c40f', display: 'flex' }}>
              <FaBullhorn size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 4px 0', color: '#f1c40f', fontSize: '0.95rem' }}>Announcement from {announcement.sender}</h4>
              <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.4 }}>{announcement.message}</p>
            </div>
            <button 
              onClick={() => setAnnouncement(null)} 
              style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '4px', fontSize: '1.2rem' }}
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <AdminControlsModal 
        isOpen={showAdminModal} 
        onClose={() => setShowAdminModal(false)} 
        isLocked={isLocked}
        isReadOnly={isReadOnly}
        isChatMuted={isChatMuted}
        onToggleLock={() => socket.emit("toggle_room_lock", { roomId, isLocked: !isLocked })}
        onToggleReadOnly={() => socket.emit("toggle_read_only", { roomId, isReadOnly: !isReadOnly })}
        onToggleChatMute={() => socket.emit("toggle_chat_mute", { roomId, isChatMuted: !isChatMuted })}
        onKickAll={() => socket.emit("kick_all_users", { roomId })}
        onDownloadChat={() => {
          window.dispatchEvent(new CustomEvent('download_chat'));
        }}
        onForceSync={() => socket.emit("force_sync_tab", { roomId, fileId: activeFileId })}
        onMakeAnnouncement={(message) => socket.emit("global_announcement", { roomId, message })}
        onClearOutput={clearOutput}
        onResetCode={resetCode}
      />
      {showCreateFileModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateFileModal(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
          <div className="auth-panel" onClick={(e) => e.stopPropagation()} style={{ position: 'relative', width: '400px', maxWidth: '90%', padding: '32px' }}>
            <button className="modern-chip chip-button icon-only" onClick={() => setShowCreateFileModal(false)} style={{ position: 'absolute', top: '16px', right: '16px' }}>
              ✕
            </button>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.4rem', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><FaCode color="var(--accent)" /> Create New File</h2>
              <p className="auth-description" style={{ marginTop: '8px' }}>Enter a file name with a valid extension (e.g., .js, .py, .cpp).</p>
            </div>
            <form onSubmit={handleCreateFileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <input
                  type="text"
                  placeholder="e.g. index.js"
                  value={newFileName}
                  onChange={(e) => {
                    setNewFileName(e.target.value);
                    setCreateFileError("");
                  }}
                  className="auth-input"
                  autoFocus
                  style={{ width: '100%' }}
                />
                {createFileError && <div style={{ color: '#ff4757', fontSize: '0.85rem', marginTop: '8px', textAlign: 'center' }}>{createFileError}</div>}
              </div>
              <button type="submit" className="primary-btn" style={{ width: '100%' }}>Create File</button>
            </form>
          </div>
        </div>
      )}

      {showCreateWhiteboardModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateWhiteboardModal(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
          <div className="auth-panel" onClick={(e) => e.stopPropagation()} style={{ position: 'relative', width: '400px', maxWidth: '90%', padding: '32px' }}>
            <button className="modern-chip chip-button icon-only" onClick={() => setShowCreateWhiteboardModal(false)} style={{ position: 'absolute', top: '16px', right: '16px' }}>
              ✕
            </button>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.4rem', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><FaPen color="var(--accent)" /> Create Whiteboard</h2>
              <p className="auth-description" style={{ marginTop: '8px' }}>Give your new collaborative whiteboard a name.</p>
            </div>
            <form onSubmit={handleCreateWhiteboardSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <input
                  type="text"
                  placeholder="e.g. architecture"
                  value={newFileName}
                  onChange={(e) => {
                    setNewFileName(e.target.value);
                    setCreateFileError("");
                  }}
                  className="auth-input"
                  autoFocus
                  style={{ width: '100%' }}
                />
                {createFileError && <div style={{ color: '#ff4757', fontSize: '0.85rem', marginTop: '8px', textAlign: 'center' }}>{createFileError}</div>}
              </div>
              <button type="submit" className="primary-btn" style={{ width: '100%' }}>Create Whiteboard</button>
            </form>
          </div>
        </div>
      )}

      {showDownloadModal && (
        <div className="modal-backdrop" onClick={() => setShowDownloadModal(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
          <div className="auth-panel" onClick={(e) => e.stopPropagation()} style={{ position: 'relative', width: '400px', maxWidth: '90%', padding: '32px' }}>
            <button className="modern-chip chip-button icon-only" onClick={() => setShowDownloadModal(false)} style={{ position: 'absolute', top: '16px', right: '16px' }}>
              ✕
            </button>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.4rem', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><FaDownload color="var(--accent)" /> Download Options</h2>
              <p className="auth-description" style={{ marginTop: '8px' }}>Choose how you want to download your project files.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                className="secondary-btn" 
                onClick={handleDownloadCurrent}
                disabled={!activeFile.id}
                style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px', fontSize: '1rem', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text)', border: '1px solid rgba(255, 255, 255, 0.1)', opacity: !activeFile.id ? 0.5 : 1, cursor: !activeFile.id ? 'not-allowed' : 'pointer' }}
              >
                <FaCode /> Download Current File ({activeFile.name || "None"})
              </button>
              
              <button 
                className="primary-btn" 
                onClick={handleDownloadZip}
                disabled={files.length === 0}
                style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px', fontSize: '1rem', background: 'linear-gradient(135deg, #00d4ff, #9b59b6)', opacity: files.length === 0 ? 0.5 : 1, cursor: files.length === 0 ? 'not-allowed' : 'pointer' }}
              >
                <FaDownload /> Download All as ZIP ({files.length} files)
              </button>
            </div>
          </div>
        </div>
      )}

      {showShareModal && (
        <div className="modal-backdrop" onClick={() => setShowShareModal(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
          <div className="auth-panel" onClick={(e) => e.stopPropagation()} style={{ position: 'relative', width: '420px', maxWidth: '90%', padding: '32px' }}>
            <button className="modern-chip chip-button icon-only" onClick={() => setShowShareModal(false)} style={{ position: 'absolute', top: '16px', right: '16px' }}>
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
      )}

      {showProfileModal && (
        <div className="modal-backdrop" onClick={() => setShowProfileModal(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
          <div className="auth-panel" onClick={(e) => e.stopPropagation()} style={{ position: 'relative', width: '320px', maxWidth: '90%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <button className="modern-chip chip-button icon-only" onClick={() => setShowProfileModal(false)} style={{ position: 'absolute', top: '16px', right: '16px' }}>
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
      )}

      <header className="modern-topbar">
        <div className="topbar-title">
          <img src="/logo.png" alt="Collab Code Editor" className="topbar-logo" style={{ objectFit: 'contain' }} />
          <h1>Collab Code Editor</h1>
        </div>

        <div className="topbar-right">
          <div className="topbar-actions">

          {isAdmin && (
            <button className="modern-chip chip-button icon-only" onClick={() => setShowAdminModal(true)} title="Admin Controls" style={{ color: '#f1c40f', borderColor: 'rgba(241, 196, 15, 0.3)', background: 'rgba(241, 196, 15, 0.1)' }}>
              <FaCrown />
            </button>
          )}

          <button className="modern-chip chip-button icon-only" onClick={promptCreateWhiteboard} title="Create Whiteboard">
            <FaPen />
          </button>
          <button className="modern-chip chip-button icon-only" onClick={toggleTheme} title="Toggle Theme">
            {theme === "dark" ? <FaSun /> : <FaMoon />}
          </button>
          <button className="modern-chip chip-button icon-only" onClick={() => setShowDownloadModal(true)} title="Download Code">
            <FaDownload />
          </button>
          <button
            className="modern-chip chip-button icon-only"
            onClick={() => setShowShareModal(true)}
            title="Share Room"
          >
            <FaPaperPlane />
          </button>

        </div>

        <div className="topbar-presence">
          <div className="modern-chip strong" onClick={() => setShowProfileModal(true)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: currentAvatar ? '4px' : '0', borderRadius: '50%', width: '36px', height: '36px', background: currentAvatar ? undefined : avatarColor, color: '#fff', border: 'none' }} title={username || "Guest"}>
            {currentAvatar ? (
              <img src={currentAvatar} alt="User Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold', lineHeight: 1 }}>
                {(username || "G").charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>

      <aside className="modern-sidebar panel">
        <div className="panel-header" style={{ justifyContent: 'center', padding: '16px 12px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <span style={{ color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.85rem', fontWeight: 700 }}>Workspace</span>
        </div>
        
        {activeTab === "files" && (
            <UserList
              users={usersWithFallback}
              adminUsername={adminUsername}
              currentUsername={username}
              isAdmin={isAdmin}
              onKickUser={kickUser}
              onAssignAdmin={assignAdmin}
              onToggleAccess={(targetSocketId) => socket.emit("toggle_user_access", { roomId, targetSocketId })}
            />
        )}

        {activeTab === "history" && (
            <div className="tab-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--muted)' }}>Version History</h3>
                {isAdmin && (
                  <button onClick={handleSaveVersion} disabled={isSavingVersion} style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FaSave /> {isSavingVersion ? "Saving..." : "Save Snapshot"}
                  </button>
                )}
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {versions.length === 0 ? (
                  <p className="empty-state">No saved versions yet. Admins can save snapshots of the code to restore later.</p>
                ) : (
                  versions.map(version => (
                    <div key={version._id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <strong style={{ color: 'var(--text)', fontSize: '0.95rem' }}>{version.name}</strong>
                        {isAdmin && (
                          <button onClick={() => handleRestoreVersion(version)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>
                            Restore
                          </button>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--muted)' }}>
                        <FaClock size={10} />
                        {new Date(version.createdAt).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '4px' }}>
                        Saved by: <span style={{ color: '#a5b4fc' }}>{version.savedBy}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
      </aside>

      <main className="modern-main">
        <section className="modern-editor panel">
          <div className="panel-header" style={{ justifyContent: "flex-start", padding: "0", background: "rgba(0,0,0,0.2)", borderBottom: "1px solid var(--border)", overflowX: "auto", display: "flex" }}>
            {files.map(file => (
              <div
                key={file.id}
                onClick={() => setActiveFileId(file.id)}
                style={{
                  padding: "10px 16px",
                  cursor: "pointer",
                  background: activeFileId === file.id ? "rgba(255,255,255,0.05)" : "transparent",
                  borderBottom: activeFileId === file.id ? "2px solid var(--accent)" : "2px solid transparent",
                  borderRight: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "0.85rem",
                  color: activeFileId === file.id ? "var(--text)" : "var(--muted)"
                }}
              >
                {file.name}
                {isAdmin && files.length > 1 && (
                  <span
                    onClick={(e) => { e.stopPropagation(); socket.emit("delete_file", { roomId, fileId: file.id }); }}
                    style={{ color: "var(--muted)", cursor: "pointer", display: "inline-flex", width: "16px", height: "16px", alignItems: "center", justifyContent: "center", borderRadius: "50%" }}
                    onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                    onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    ×
                  </span>
                )}
              </div>
            ))}
            {isAdmin && (
              <button
                onClick={promptCreateFile}
                style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", padding: "0 16px", fontSize: "1.2rem" }}
              >
                +
              </button>
            )}
            
            {language && (
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", paddingRight: "12px" }}>
                <div className="modern-chip" style={{ margin: 0, padding: "4px 8px", fontSize: "0.8rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", gap: "6px", cursor: "default" }}>
                  <FaCode />
                  <span style={{ color: "var(--text)" }}>{language.label}</span>
                </div>
              </div>
            )}
          </div>
          <div className="modern-editor-frame" style={{ display: "flex", flexDirection: "column", flex: 1, position: "relative" }}>
            {activeFile?.language === "whiteboard" && (
              <div style={{ display: "flex", width: "100%", height: "100%" }}>
                <Whiteboard roomId={roomId} fileId={activeFile.id} isAdmin={isAdmin} initialLines={activeFile.whiteboard} />
              </div>
            )}
            <div style={{ display: activeFile?.language !== "whiteboard" ? "flex" : "none", flexDirection: "column", flex: 1, width: "100%", height: "100%", minHeight: 0 }}>
              {files.length === 0 ? (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
                  <FaCode size={48} style={{ marginBottom: "16px", opacity: 0.5 }} />
                  <h3 style={{ margin: "0 0 8px 0", color: "var(--text)" }}>No files yet</h3>
                  {isAdmin ? (
                    <>
                      <p style={{ margin: "0 0 16px 0" }}>Create a file to start coding.</p>
                      <button className="primary-btn" onClick={promptCreateFile}>
                        Create File
                      </button>
                    </>
                  ) : (
                    <p style={{ margin: 0 }}>Waiting for the admin to create a file...</p>
                  )}
                </div>
              ) : (
                <CodeEditor
                  roomId={roomId}
                  activeFileId={activeFile.id}
                  code={code}
                  setCode={(newContent) => {
                    setFiles(prev => prev.map(f => f.id === activeFile.id ? { ...f, content: newContent } : f));
                  }}
                  language={language?.value || "javascript"}
                  users={users}
                  currentSocketId={currentSocketId}
                  isReadOnly={isReadOnly && !hasAccess}
                />
              )}
            </div>
          </div>
        </section>

        <section className="modern-output panel" style={{ display: activeFile?.language === "whiteboard" ? 'none' : 'flex' }}>
          <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'transparent', borderBottom: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaTerminal size={14} color="var(--muted)" />
              <span style={{ color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.85rem', fontWeight: 700 }}>Console Output</span>
            </div>
            
            <button
              onClick={handleRun}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'rgba(16, 185, 129, 0.15)', color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '6px 12px', borderRadius: '8px',
                fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.25)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)'}
            >
              <FaPlay size={10} /> Run Code
            </button>
          </div>
          <Output executions={activeFile?.executions || []} />
        </section>
      </main>

      <aside className="modern-right panel">
        <div className="tab-header">
            <button className={`tab-btn ${activeTab === "users" ? "active" : ""}`} onClick={() => setActiveTab("users")} title="Team Members">
              <FaUsers />
              {users.length > 0 && <span className="tab-badge">{users.length}</span>}
            </button>
            <button className={`tab-btn ${activeTab === "history" ? "active" : ""}`} onClick={() => setActiveTab("history")} title="Version History">
              <FaHistory />
            </button> 
          <button 
            className={`tab-btn ${activeRightTab === "ai" ? "active" : ""}`}
            onClick={() => setActiveRightTab("ai")}
          >
            AI Assistant
          </button>
        </div>
        <div className="tab-content" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div style={{ display: activeRightTab === "team" ? "flex" : "none", flexDirection: "column", flex: 1, minHeight: 0, height: "100%" }}>
            <Chat roomId={roomId} username={username} isMuted={isChatMuted && !hasAccess} />
          </div>
          <div style={{ display: activeRightTab === "ai" ? "flex" : "none", flexDirection: "column", flex: 1, minHeight: 0, height: "100%" }}>
            <AIChat roomId={roomId} code={code} />
          </div>
        </div>
      </aside>
    </div>
  );
}

export default Room;
