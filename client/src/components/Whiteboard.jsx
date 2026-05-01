import { useEffect, useState, useRef } from "react";
import socket from "../services/socket";
import { Excalidraw, WelcomeScreen } from "@excalidraw/excalidraw";
import { motion } from "framer-motion";
import "@excalidraw/excalidraw/index.css";

function Whiteboard({ roomId, fileId, isAdmin, initialLines = [] }) {
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const isUpdatingFromSocket = useRef(false);
  const elementsRef = useRef(initialLines);

  useEffect(() => {
    if (!excalidrawAPI) return;

    const handleReceiveExcalidraw = ({ fileId: incomingFileId, elements }) => {
      if (incomingFileId !== fileId) return;
      
      // Prevent echoing back
      isUpdatingFromSocket.current = true;
      elementsRef.current = elements;
      
      // Excalidraw handles merging elements based on version nonces
      excalidrawAPI.updateScene({ elements });
      
      setTimeout(() => {
        isUpdatingFromSocket.current = false;
      }, 100);
    };

    socket.on("receive_excalidraw", handleReceiveExcalidraw);

    // Load initial data for the current fileId
    isUpdatingFromSocket.current = true;
    if (initialLines && initialLines.length > 0 && initialLines[0].type && initialLines[0].type !== 'line') {
       excalidrawAPI.updateScene({ elements: initialLines });
       elementsRef.current = initialLines;
    } else {
       // It's a new or empty whiteboard, so clear it when switching tabs
       excalidrawAPI.updateScene({ elements: [] });
       elementsRef.current = [];
    }
    
    setTimeout(() => {
      isUpdatingFromSocket.current = false;
    }, 100);

    return () => {
      socket.off("receive_excalidraw", handleReceiveExcalidraw);
    };
  }, [fileId, excalidrawAPI]);

  const onChange = (elements, appState, files) => {
    if (isUpdatingFromSocket.current) return;
    
    // Simple deep equality check to avoid emitting exact same elements repeatedly
    // Excalidraw calls onChange even on simple pointer moves
    const stringifiedNew = JSON.stringify(elements);
    const stringifiedOld = JSON.stringify(elementsRef.current);
    
    if (stringifiedNew !== stringifiedOld) {
      elementsRef.current = elements;
      socket.emit("update_excalidraw", { roomId, fileId, elements });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      <Excalidraw 
        excalidrawAPI={(api) => setExcalidrawAPI(api)}
        onChange={onChange}
        theme="dark"
        UIOptions={{
          canvasActions: {
            clearCanvas: isAdmin,
            export: { saveFileToDisk: true },
            loadScene: false,
            saveToActiveFile: false,
            toggleTheme: false,
            saveAsImage: true
          }
        }}
      >
        <WelcomeScreen>
          <WelcomeScreen.Hints.ToolbarHint />
          <WelcomeScreen.Hints.MenuHint />
          <WelcomeScreen.Hints.HelpHint />
        </WelcomeScreen>
      </Excalidraw>
    </motion.div>
  );
}

export default Whiteboard;
