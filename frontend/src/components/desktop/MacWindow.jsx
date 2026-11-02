import React, { useState, useRef, useEffect } from 'react';
import { Minus, Square, X, Maximize2, Minimize2 } from 'lucide-react';

export default function MacWindow({
  id,
  title,
  icon: Icon,
  isOpen,
  isMinimized,
  isMaximized,
  zIndex,
  initialPosition = { x: 80, y: 50 },
  initialSize = { width: 850, height: 560 },
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  children
}) {
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState(initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const dragRef = useRef({ startX: 0, startY: 0, initPosX: 0, initPosY: 0 });
  const resizeRef = useRef({ startX: 0, startY: 0, initWidth: 0, initHeight: 0 });

  // Handle Dragging
  const handleMouseDownHeader = (e) => {
    if (isMaximized) return;
    onFocus();
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initPosX: position.x,
      initPosY: position.y
    };
  };

  // Handle Resizing
  const handleMouseDownResizer = (e) => {
    if (isMaximized) return;
    e.stopPropagation();
    onFocus();
    setIsResizing(true);
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initWidth: size.width,
      initHeight: size.height
    };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        const deltaX = e.clientX - dragRef.current.startX;
        const deltaY = e.clientY - dragRef.current.startY;
        setPosition({
          x: Math.max(10, Math.min(window.innerWidth - 200, dragRef.current.initPosX + deltaX)),
          y: Math.max(30, Math.min(window.innerHeight - 100, dragRef.current.initPosY + deltaY))
        });
      } else if (isResizing) {
        const deltaX = e.clientX - resizeRef.current.startX;
        const deltaY = e.clientY - resizeRef.current.startY;
        setSize({
          width: Math.max(500, Math.min(window.innerWidth - 20, resizeRef.current.initWidth + deltaX)),
          height: Math.max(350, Math.min(window.innerHeight - 80, resizeRef.current.initHeight + deltaY))
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing]);

  if (!isOpen || isMinimized) return null;

  return (
    <div
      onMouseDown={onFocus}
      style={{
        transform: isMaximized
          ? 'none'
          : `translate3d(${position.x}px, ${position.y}px, 0)`,
        width: isMaximized ? '100%' : `${size.width}px`,
        height: isMaximized ? 'calc(100vh - 1.75rem - 4.5rem)' : `${size.height}px`,
        top: isMaximized ? '1.75rem' : 0,
        left: isMaximized ? 0 : 0,
        zIndex: zIndex
      }}
      className={`fixed transition-all duration-150 rounded-2xl flex flex-col overflow-hidden backdrop-blur-3xl bg-[#141724]/95 border border-white/15 shadow-[0_30px_90px_rgba(0,0,0,0.65)] ring-1 ring-black/50 ${
        isDragging ? 'opacity-95 shadow-[0_40px_110px_rgba(0,0,0,0.8)]' : ''
      }`}
    >
      {/* macOS Traffic Lights & Title Bar */}
      <div
        onMouseDown={handleMouseDownHeader}
        onDoubleClick={onMaximize}
        className="h-10 bg-slate-900/80 border-b border-white/10 px-4 flex items-center justify-between select-none cursor-default shrink-0"
      >
        {/* Left Traffic Lights */}
        <div className="flex items-center gap-2 group/lights">
          {/* Close - Red */}
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="w-3 h-3 rounded-full bg-[#ff5f56] hover:bg-[#ff4339] border border-[#e0443e] flex items-center justify-center transition-all text-transparent group-hover/lights:text-black/75 shadow-inner"
            title="Close"
          >
            <X className="w-2 h-2 stroke-[3]" />
          </button>

          {/* Minimize - Yellow */}
          <button
            onClick={(e) => { e.stopPropagation(); onMinimize(); }}
            className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:bg-[#e8aa25] border border-[#dea123] flex items-center justify-center transition-all text-transparent group-hover/lights:text-black/75 shadow-inner"
            title="Minimize"
          >
            <Minus className="w-2 h-2 stroke-[3]" />
          </button>

          {/* Maximize - Green */}
          <button
            onClick={(e) => { e.stopPropagation(); onMaximize(); }}
            className="w-3 h-3 rounded-full bg-[#27c93f] hover:bg-[#1fb334] border border-[#1aab29] flex items-center justify-center transition-all text-transparent group-hover/lights:text-black/75 shadow-inner"
            title={isMaximized ? 'Restore' : 'Zoom'}
          >
            {isMaximized ? (
              <Minimize2 className="w-2 h-2 stroke-[3]" />
            ) : (
              <Maximize2 className="w-2 h-2 stroke-[3]" />
            )}
          </button>
        </div>

        {/* Center Title */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
          {Icon && <Icon className="w-3.5 h-3.5 text-blue-400" />}
          <span>{title}</span>
        </div>

        {/* Right Placeholder to balance spacing */}
        <div className="w-14" />
      </div>

      {/* Window Content */}
      <div className="flex-1 overflow-hidden relative">
        {children}
      </div>

      {/* Bottom Right Resizer Corner */}
      {!isMaximized && (
        <div
          onMouseDown={handleMouseDownResizer}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-center justify-center z-20 group"
        >
          <div className="w-2 h-2 border-r-2 border-b-2 border-slate-500/60 group-hover:border-cyan-400" />
        </div>
      )}
    </div>
  );
}
