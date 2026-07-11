import React, { useEffect, useState, useRef } from 'react';
import { MovableModal } from './MovableModal';

interface LogViewerModalProps {
  onClose: () => void;
}

const LogViewerModal: React.FC<LogViewerModalProps> = ({ onClose }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    // Open EventSource to SSE stream
    const eventSource = new EventSource('/api/logs/extraction/stream');

    eventSource.onmessage = (event) => {
      setLogs((prev) => [...prev, event.data]);
    };

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      // EventSource automatically attempts reconnection, so we can just log
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // Auto-scroll to bottom on new logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <MovableModal
      title="Extraction Logs"
      subtitle="Live streaming view of backend processing"
      onClose={onClose}
      width="w-[600px]"
      height="h-[450px]"
      testId="log-viewer-modal"
    >
      <div className="flex h-full w-full flex-col">
        <pre
          ref={scrollRef}
          data-testid="log-viewer-output"
          className="flex-1 overflow-y-auto whitespace-pre-wrap p-5 font-mono text-sm text-green-400"
        >
          {logs.length === 0 ? 'Waiting for logs...' : logs.join('\n')}
        </pre>
      </div>
    </MovableModal>
  );
};

export default LogViewerModal;
