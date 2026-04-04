import React from 'react';

/**
 * GridOverlay Component
 */
export default function GridOverlay({ 
  width, 
  height, 
  spacing = 20, 
  visible = true,
  artboardBgColor = '#ffffff'
}) {
  if (!visible) return null;

  const strokeColor = 'rgba(0, 0, 0, 0.12)';
  const majorStrokeColor = 'rgba(0, 0, 0, 0.22)';

  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="smallGrid" width={spacing} height={spacing} patternUnits="userSpaceOnUse">
            <path d={`M ${spacing} 0 L 0 0 0 ${spacing}`} fill="none" stroke={strokeColor} strokeWidth="1" />
          </pattern>
          <pattern id="grid" width={spacing * 5} height={spacing * 5} patternUnits="userSpaceOnUse">
            <rect width={spacing * 5} height={spacing * 5} fill="url(#smallGrid)" />
            <path d={`M ${spacing * 5} 0 L 0 0 0 ${spacing * 5}`} fill="none" stroke={majorStrokeColor} strokeWidth="1.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
}
