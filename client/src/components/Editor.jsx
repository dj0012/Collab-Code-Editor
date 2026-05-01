import { useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import socket from "../services/socket";
import { motion } from "framer-motion";

const avatarColors = ["#ff4757", "#2ed573", "#1e90ff", "#ffa502", "#ff6b81", "#7bed9f", "#70a1ff", "#eccc68", "#ff7f50", "#9b59b6", "#3498db", "#1abc9c", "#e74c3c"];

function CodeEditor({ roomId, activeFileId, code, setCode, language, users = [], currentSocketId, isReadOnly = false }) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef({});
  const activeFileIdRef = useRef(activeFileId);

  useEffect(() => {
    activeFileIdRef.current = activeFileId;
  }, [activeFileId]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Send local cursor position to others
    editor.onDidChangeCursorSelection((e) => {
      const selection = e.selection;
      const cursorData = {
        fileId: activeFileIdRef.current,
        position: e.position,
        selection: {
          startLineNumber: selection.startLineNumber,
          startColumn: selection.startColumn,
          endLineNumber: selection.endLineNumber,
          endColumn: selection.endColumn,
        }
      };
      socket.emit("cursor_change", { roomId, cursorData });
    });
  };

  useEffect(() => {
    // Clear decorations when switching files
    Object.keys(decorationsRef.current).forEach(socketId => {
      decorationsRef.current[socketId].clear();
      delete decorationsRef.current[socketId];
    });
  }, [activeFileId]);

  useEffect(() => {
    const handleCursorUpdate = ({ socketId, cursorData }) => {
      if (!editorRef.current || !monacoRef.current || socketId === currentSocketId || cursorData.fileId !== activeFileId) return;

      const user = users.find(u => u.socketId === socketId);
      if (!user) return;

      const monaco = monacoRef.current;
      
      // Hash the socketId to pick a consistent color
      const colorIndex = Math.abs(socketId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)) % avatarColors.length;
      const color = avatarColors[colorIndex];

      const newDecorations = [];
      const className = `cursor-${socketId}`;
      
      // Inject CSS dynamically for the cursor styling if it doesn't exist
      let styleEl = document.getElementById(`style-${socketId}`);
      if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = `style-${socketId}`;
        styleEl.innerHTML = `
          .${className} {
            border-left: 2px solid ${color};
            position: relative;
            z-index: 99;
          }
          .${className}::before {
            content: '${user.username}';
            position: absolute;
            top: -20px;
            left: -2px;
            background-color: ${color};
            color: #fff;
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 4px;
            white-space: nowrap;
            pointer-events: none;
            font-family: var(--sans);
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          }
          .selection-${socketId} {
            background-color: ${color}40;
          }
        `;
        document.head.appendChild(styleEl);
      }

      // Selection decoration
      if (
        cursorData.selection &&
        (cursorData.selection.startLineNumber !== cursorData.selection.endLineNumber ||
         cursorData.selection.startColumn !== cursorData.selection.endColumn)
      ) {
        newDecorations.push({
          range: new monaco.Range(
            cursorData.selection.startLineNumber,
            cursorData.selection.startColumn,
            cursorData.selection.endLineNumber,
            cursorData.selection.endColumn
          ),
          options: {
            className: `selection-${socketId}`,
          }
        });
      }

      // Cursor position decoration
      newDecorations.push({
        range: new monaco.Range(
          cursorData.position.lineNumber,
          cursorData.position.column,
          cursorData.position.lineNumber,
          cursorData.position.column
        ),
        options: {
          className: className,
        }
      });

      if (!decorationsRef.current[socketId]) {
         decorationsRef.current[socketId] = editorRef.current.createDecorationsCollection(newDecorations);
      } else {
         decorationsRef.current[socketId].set(newDecorations);
      }
    };

    const handleCursorRemove = ({ socketId }) => {
      if (decorationsRef.current[socketId]) {
        decorationsRef.current[socketId].clear();
        delete decorationsRef.current[socketId];
      }
      const styleEl = document.getElementById(`style-${socketId}`);
      if (styleEl) styleEl.remove();
    };

    socket.on("cursor_update", handleCursorUpdate);
    socket.on("cursor_remove", handleCursorRemove);

    return () => {
      socket.off("cursor_update", handleCursorUpdate);
      socket.off("cursor_remove", handleCursorRemove);
    };
  }, [users, currentSocketId]);

  const handleChange = (value) => {
    setCode(value);
    socket.emit("file_change", { roomId, fileId: activeFileId, content: value });
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
        value={code}
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
