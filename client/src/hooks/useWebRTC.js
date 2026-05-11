import { useEffect, useRef, useState } from 'react';
import socket from '../services/socket';

export const useWebRTC = () => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({}); // { socketId: MediaStream }
  const peersRef = useRef({}); // { socketId: RTCPeerConnection }
  const localStreamRef = useRef(null);

  const config = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' }
    ]
  };

  const createPeer = (peerSocketId, stream, isInitiator) => {
    const peer = new RTCPeerConnection(config);
    
    if (stream) {
      stream.getTracks().forEach(track => peer.addTrack(track, stream));
    }

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtc_signal', {
          to: peerSocketId,
          signal: { type: 'candidate', candidate: event.candidate }
        });
      }
    };

    peer.ontrack = (event) => {
      setRemoteStreams(prev => ({
        ...prev,
        [peerSocketId]: event.streams[0]
      }));
    };

    peer.oniceconnectionstatechange = () => {
      if (peer.iceConnectionState === 'disconnected' || peer.iceConnectionState === 'failed' || peer.iceConnectionState === 'closed') {
        removePeer(peerSocketId);
      }
    };

    if (isInitiator) {
      peer.createOffer()
        .then(offer => peer.setLocalDescription(offer))
        .then(() => {
          socket.emit('webrtc_signal', {
            to: peerSocketId,
            signal: peer.localDescription
          });
        });
    }

    return peer;
  };

  const removePeer = (socketId) => {
    if (peersRef.current[socketId]) {
      peersRef.current[socketId].close();
      delete peersRef.current[socketId];
    }
    setRemoteStreams(prev => {
      const newStreams = { ...prev };
      delete newStreams[socketId];
      return newStreams;
    });
  };

  const startCall = async (users) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      localStreamRef.current = stream;

      users.forEach(user => {
        if (user.socketId !== socket.id) {
          const peer = createPeer(user.socketId, stream, true);
          peersRef.current[user.socketId] = peer;
        }
      });
    } catch (err) {
      console.error("Error accessing media devices", err);
      alert("Could not access camera/microphone. Please ensure permissions are granted.");
    }
  };

  const endCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    setLocalStream(null);
    localStreamRef.current = null;
    
    Object.keys(peersRef.current).forEach(removePeer);
    setRemoteStreams({});
  };

  useEffect(() => {
    const handleSignal = async ({ from, signal }) => {
      // If we aren't in the call, ignore signals
      if (!localStreamRef.current) return;

      let peer = peersRef.current[from];

      if (signal.type === 'offer') {
        if (!peer) {
          peer = createPeer(from, localStreamRef.current, false);
          peersRef.current[from] = peer;
        }
        await peer.setRemoteDescription(new RTCSessionDescription(signal));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.emit('webrtc_signal', { to: from, signal: peer.localDescription });
      } else if (signal.type === 'answer') {
        if (peer) {
          await peer.setRemoteDescription(new RTCSessionDescription(signal));
        }
      } else if (signal.type === 'candidate') {
        if (peer) {
          try {
            await peer.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } catch (e) {
            console.error('Error adding received ice candidate', e);
          }
        }
      }
    };

    const handleCursorRemove = ({ socketId }) => {
      removePeer(socketId);
    };

    socket.on('webrtc_signal', handleSignal);
    socket.on('cursor_remove', handleCursorRemove);

    return () => {
      socket.off('webrtc_signal', handleSignal);
      socket.off('cursor_remove', handleCursorRemove);
    };
  }, []);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      endCall();
    };
  }, []);

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setLocalStream(new MediaStream(localStream.getTracks()));
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setLocalStream(new MediaStream(localStream.getTracks()));
      }
    }
  };

  return {
    localStream,
    remoteStreams,
    startCall,
    endCall,
    toggleVideo,
    toggleAudio,
    isVideoEnabled: localStream?.getVideoTracks()[0]?.enabled ?? false,
    isAudioEnabled: localStream?.getAudioTracks()[0]?.enabled ?? false,
  };
};
