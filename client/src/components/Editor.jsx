import { useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import socket from "../services/socket";
import { motion } from "framer-motion";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";

const avatarColors = ["#ff4757", "#2ed573", "#1e90ff", "#ffa502", "#ff6b81", "#7bed9f", "#70a1ff", "#eccc68", "#ff7f50", "#9b59b6", "#3498db", "#1abc9c", "#e74c3c"];

function CodeEditor({ roomId, activeFileId, code, setCode, language, users = [], currentSocketId, isReadOnly = false }) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const ydocRef = useRef(null);
  const providerRef = useRef(null);
  const bindingRef = useRef(null);
  const yfilesRef = useRef(null);

  useEffect(() => {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";
    const wsUrl = BACKEND_URL.replace(/^http/, 'ws') + '/yjs';
    
    ydocRef.current = new Y.Doc();
    providerRef.current = new WebsocketProvider(wsUrl, roomId, ydocRef.current);
    yfilesRef.current = ydocRef.current.getMap("files");

    return () => {
      if (bindingRef.current) bindingRef.current.destroy();
      if (providerRef.current) providerRef.current.destroy();
      if (ydocRef.current) ydocRef.current.destroy();
    };
  }, [roomId]);

  // Update awareness when user data changes
  useEffect(() => {
    if (providerRef.current && users.length > 0) {
      const user = users.find(u => u.socketId === currentSocketId);
      if (user) {
        providerRef.current.awareness.setLocalStateField('user', {
          name: user.username,
          color: avatarColors[Math.abs(user.username.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)) % avatarColors.length]
        });
      }
    }
  }, [users, currentSocketId]);

  const setupBinding = () => {
    if (!editorRef.current || !yfilesRef.current || !providerRef.current || !activeFileId) return;
    
    if (bindingRef.current) {
      bindingRef.current.destroy();
    }

    let ytext = yfilesRef.current.get(activeFileId);
    if (!ytext) {
      // If the backend hasn't populated it yet, we start with the code string we have locally
      ytext = new Y.Text(code || "");
      yfilesRef.current.set(activeFileId, ytext);
    }

    bindingRef.current = new MonacoBinding(
      ytext, 
      editorRef.current.getModel(), 
      new Set([editorRef.current]), 
      providerRef.current.awareness
    );

    // Sync initial code to parent for Run Code feature
    setCode(ytext.toString());
  };

  useEffect(() => {
    activeFileIdRef.current = activeFileId;
    setupBinding();
  }, [activeFileId]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setupBinding();
  };

  const handleChange = (value) => {
    // Keep Room.jsx state updated for Run Code/Download, but do NOT emit socket events! Yjs handles it.
    setCode(value);
  };

  return (
    <motion.div
      className="editor-surface"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, width: "100%", height: "100%" }}
    >
      <Editor
        height="100%"
        language={language}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          readOnly: isReadOnly,
          minimap: { enabled: false },
          fontSize: 15,
          lineHeight: 24,
          padding: { top: 18 },
          scrollBeyondLastLine: false,
          roundedSelection: true,
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
        }}
      />
    </motion.div>
  );
}

export default CodeEditor;
