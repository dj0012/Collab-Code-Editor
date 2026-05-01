import { useEffect, useRef } from "react";
import { FaChevronRight } from "react-icons/fa";

function Output({ executions = [] }) {
  const outputRef = useRef();

  // 🔥 Auto scroll to bottom
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [executions]);

  return (
    <div ref={outputRef} className="output-console" style={{ padding: '16px', background: 'rgba(0, 0, 0, 0.2)', borderTop: '1px solid rgba(255, 255, 255, 0.05)', flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {executions.length === 0 ? (
        <span style={{ color: 'var(--muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>No executions yet. Run code to see output.</span>
      ) : (
        executions.map((exec, idx) => (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderBottom: idx !== executions.length - 1 ? '1px dashed rgba(255, 255, 255, 0.05)' : 'none', paddingBottom: idx !== executions.length - 1 ? '12px' : '0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted)', fontSize: '0.8rem', fontWeight: 600 }}>
              <FaChevronRight size={10} color="#00d4ff" />
              <span style={{ textTransform: "uppercase", letterSpacing: "1px" }}>{exec.language}</span>
            </div>
            <pre style={{ margin: 0, paddingLeft: '18px', color: exec.isError ? '#ff4757' : '#f1f5f9', fontFamily: '"Fira Code", monospace', fontSize: '0.9rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {exec.output || "Program finished with no output."}
            </pre>
          </div>
        ))
      )}
    </div>
  );
}

export default Output;
