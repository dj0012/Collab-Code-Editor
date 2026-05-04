import { FaCode, FaDownload } from "react-icons/fa6";

function DownloadModal({ isOpen, onClose, activeFile, files, onDownloadCurrent, onDownloadZip }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
      <div className="auth-panel" onClick={(e) => e.stopPropagation()} style={{ position: 'relative', width: '400px', maxWidth: '90%', padding: '32px' }}>
        <button className="modern-chip chip-button icon-only" onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px' }}>
          ✕
        </button>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.4rem', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><FaDownload color="var(--accent)" /> Download Options</h2>
          <p className="auth-description" style={{ marginTop: '8px' }}>Choose how you want to download your project files.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button 
            className="secondary-btn" 
            onClick={onDownloadCurrent}
            disabled={!activeFile?.id}
            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px', fontSize: '1rem', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text)', border: '1px solid rgba(255, 255, 255, 0.1)', opacity: !activeFile?.id ? 0.5 : 1, cursor: !activeFile?.id ? 'not-allowed' : 'pointer' }}
          >
            <FaCode /> Download Current File ({activeFile?.name || "None"})
          </button>
          
          <button 
            className="primary-btn" 
            onClick={onDownloadZip}
            disabled={files.length === 0}
            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px', fontSize: '1rem', background: 'linear-gradient(135deg, #00d4ff, #9b59b6)', opacity: files.length === 0 ? 0.5 : 1, cursor: files.length === 0 ? 'not-allowed' : 'pointer' }}
          >
            <FaDownload /> Download All as ZIP ({files.length} files)
          </button>
        </div>
      </div>
    </div>
  );
}

export default DownloadModal;
