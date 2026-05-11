import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaPhoneSlash } from 'react-icons/fa';

const VideoPlayer = ({ stream, isLocal, muted }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '8px', overflow: 'hidden', background: '#000' }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        style={{ width: '100%', height: '100%', objectFit: 'cover', transform: isLocal ? 'scaleX(-1)' : 'none' }}
      />
    </div>
  );
};

const VideoChat = ({ rtcParams, users }) => {
  const { localStream, remoteStreams, startCall, endCall, toggleVideo, toggleAudio, isVideoEnabled, isAudioEnabled } = rtcParams;
  const [isMinimized, setIsMinimized] = useState(false);

  if (!localStream) {
    return (
      <div style={{ position: 'fixed', bottom: '20px', left: '20px', zIndex: 1000 }}>
        <button className="primary-btn" onClick={() => startCall(users)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}>
          <FaVideo /> Join Call
        </button>
      </div>
    );
  }

  const remoteUsers = Object.keys(remoteStreams);

  return (
    <motion.div
      drag
      dragMomentum={false}
      style={{
        position: 'fixed',
        top: '80px',
        right: '20px',
        width: isMinimized ? '200px' : (remoteUsers.length > 0 ? '340px' : '220px'),
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        zIndex: 9999,
        cursor: 'grab'
      }}
      whileDrag={{ cursor: 'grabbing', scale: 1.02 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', cursor: 'pointer' }} onClick={() => setIsMinimized(!isMinimized)}>
        <span style={{ fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2ed573' }}></div>
          Team Call ({remoteUsers.length + 1})
        </span>
        <span style={{ color: 'var(--muted)' }}>{isMinimized ? '+' : '-'}</span>
      </div>

      {!isMinimized && (
        <div style={{ display: 'grid', gridTemplateColumns: remoteUsers.length > 0 ? '1fr 1fr' : '1fr', gap: '8px', marginBottom: '12px' }}>
          {/* Local User */}
          <div style={{ aspectRatio: '4/3' }}>
            <VideoPlayer stream={localStream} isLocal={true} muted={true} />
          </div>

          {/* Remote Users */}
          {remoteUsers.map(socketId => (
            <div key={socketId} style={{ aspectRatio: '4/3' }}>
              <VideoPlayer stream={remoteStreams[socketId]} isLocal={false} muted={false} />
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
        <button onClick={toggleAudio} style={{ background: isAudioEnabled ? 'rgba(255,255,255,0.1)' : '#ff4757', border: 'none', color: '#fff', padding: '10px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isAudioEnabled ? <FaMicrophone /> : <FaMicrophoneSlash />}
        </button>
        <button onClick={toggleVideo} style={{ background: isVideoEnabled ? 'rgba(255,255,255,0.1)' : '#ff4757', border: 'none', color: '#fff', padding: '10px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isVideoEnabled ? <FaVideo /> : <FaVideoSlash />}
        </button>
        <button onClick={endCall} style={{ background: '#ff4757', border: 'none', color: '#fff', padding: '10px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FaPhoneSlash />
        </button>
      </div>
    </motion.div>
  );
};

export default VideoChat;
