import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface MovableModalProps {
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: string;
  height?: string;
  testId?: string;
}

export const MovableModal: React.FC<MovableModalProps> = ({ 
  onClose, 
  title, 
  subtitle, 
  children, 
  width = 'w-[600px]',
  height = 'max-h-[85vh]',
  testId = 'movable-modal'
}) => {
  // Drag logic
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const offsetStart = useRef({ x: 0, y: 0 });

  const clampOffset = (nextOffset: { x: number; y: number }) => {
    const modal = modalRef.current;
    if (!modal) return nextOffset;

    const margin = 16;
    const maxX = Math.max(0, (window.innerWidth - modal.offsetWidth) / 2 - margin);
    const maxY = Math.max(0, (window.innerHeight - modal.offsetHeight) / 2 - margin);

    return {
      x: Math.min(maxX, Math.max(-maxX, nextOffset.x)),
      y: Math.min(maxY, Math.max(-maxY, nextOffset.y)),
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    offsetStart.current = { ...offset };
    e.preventDefault(); // prevent text selection while dragging
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setOffset(clampOffset({
          x: offsetStart.current.x + (e.clientX - dragStart.current.x),
          y: offsetStart.current.y + (e.clientY - dragStart.current.y),
        }));
      }
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        ref={modalRef}
        className={`relative flex min-h-0 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-gray-600 bg-[#151527] shadow-2xl ${width} ${height}`} 
        style={{
          maxHeight: 'calc(100vh - 2rem)',
          transform: `translate(${offset.x}px, ${offset.y}px)`,
          transition: isDragging ? 'none' : 'transform 0.1s ease-out',
        }}
        data-testid={testId}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
      <div className="flex min-h-0 w-full flex-col overflow-hidden rounded-xl">
        <div 
          className="flex items-center justify-between border-b border-gray-700 p-4 bg-[#1a1a2e] cursor-move select-none shrink-0"
          onMouseDown={handleMouseDown}
        >
          <div>
            <h3 className="text-lg font-semibold text-white pointer-events-none">{title}</h3>
            {subtitle && <p className="mt-1 text-xs text-gray-400 pointer-events-none">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            onMouseDown={(e) => e.stopPropagation()}
            aria-label={`Close ${title}`}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto bg-[#0a0a14] relative">
          {children}
        </div>
      </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
