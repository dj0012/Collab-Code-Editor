import { FaCode } from "react-icons/fa6";

function CreateFileModal({ isOpen, onClose, onSubmit, newFileName, setNewFileName, error, setError }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
      <div className="auth-panel" onClick={(e) => e.stopPropagation()} style={{ position: 'relative', width: '400px', maxWidth: '90%', padding: '32px' }}>
        <button className="modern-chip chip-button icon-only" onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px' }}>
          ✕
        </button>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.4rem', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><FaCode color="var(--accent)" /> Create New File</h2>
          <p className="auth-description" style={{ marginTop: '8px' }}>Enter a file name with a valid extension (e.g., .js, .py, .cpp).</p>
        </div>
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <input
              type="text"
              placeholder="e.g. index.js"
              value={newFileName}
              onChange={(e) => {
                setNewFileName(e.target.value);
                if (setError) setError("");
              }}
              className="auth-input"
              autoFocus
              style={{ width: '100%' }}
            />
            {error && <div style={{ color: '#ff4757', fontSize: '0.85rem', marginTop: '8px', textAlign: 'center' }}>{error}</div>}
          </div>
          <button type="submit" className="primary-btn" style={{ width: '100%' }}>Create File</button>
        </form>
      </div>
    </div>
  );
}

export default CreateFileModal;
