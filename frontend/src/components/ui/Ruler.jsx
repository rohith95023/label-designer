import React, { useMemo } from 'react';

/**
 * A highly accurate ruler component for professional editors.
 * Supports mm and px measurements.
 */
const PX_PER_MM = 3.7795275591;

export default function Ruler({ 
  orientation, 
  length, 
  zoomLevel, 
  cursorPos = null, 
  selection = null,
  isDark = false,
  onAddGuide
}) {
  const isHorizontal = orientation === 'horizontal';
  const strokeColor = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.3)';
  const textColor = isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)';
  const highlightColor = isDark ? 'rgba(37, 99, 235, 0.5)' : 'rgba(37, 99, 235, 0.25)';
  const cursorColor = isDark ? '#60a5fa' : '#2563eb';

  // Calculate markers
  const markers = useMemo(() => {
    const list = [];
    const totalMm = Math.round(length / PX_PER_MM);
    
    for (let i = 0; i <= totalMm; i++) {
        const pos = i * PX_PER_MM;
        if (pos > length + 1) break;
        let tickSize = 4;
        let showLabel = false;

        if (i % 10 === 0) {
            tickSize = 12;
            showLabel = true;
        } else if (i % 5 === 0) {
            tickSize = 8;
        }

        list.push({ pos, tickSize, label: showLabel ? i : null });
    }
    return list;
  }, [length]);

  return (
    <div 
      className={`absolute ${isHorizontal ? 'top-[-32px] left-0 right-0 h-8 flex' : 'top-0 left-[-32px] bottom-0 w-8 inline-flex'}`}
      onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const pos = isHorizontal ? (e.clientX - rect.left) / zoomLevel : (e.clientY - rect.top) / zoomLevel;
          if (onAddGuide) onAddGuide(pos);
      }}
      style={{ 
          pointerEvents: 'auto',
          cursor: 'crosshair',
          userSelect: 'none',
          backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          borderTopLeftRadius: '4px',
          borderTopRightRadius: isHorizontal ? '4px' : '0px',
          borderBottomLeftRadius: isHorizontal ? '0px' : '4px',
          [isHorizontal ? 'borderBottom' : 'borderRight']: `1.5px solid ${strokeColor}`
      }}
    >
      <svg 
        width={isHorizontal ? length : 32} 
        height={isHorizontal ? 32 : length}
        style={{ overflow: 'visible', shapeRendering: 'crispEdges' }}
      >
        {/* Selection Highlight */}
        {selection && (
          <rect
            x={isHorizontal ? selection.start : 0}
            y={isHorizontal ? 0 : selection.start}
            width={isHorizontal ? (selection.end - selection.start) : 32}
            height={isHorizontal ? 32 : (selection.end - selection.start)}
            fill={highlightColor}
          />
        )}

        {/* Ticks & Labels */}
        {markers.map((m, idx) => (
          <React.Fragment key={idx}>
            <line
              x1={isHorizontal ? m.pos : 32 - m.tickSize}
              y1={isHorizontal ? 32 - m.tickSize : m.pos}
              x2={isHorizontal ? m.pos : 32}
              y2={isHorizontal ? 32 : m.pos}
              stroke={strokeColor}
              strokeWidth="1.5"
            />
            {m.label !== null && (
              <text
                x={isHorizontal ? m.pos + 3 : 6}
                y={isHorizontal ? 12 : m.pos + 9}
                fontSize="9"
                fontWeight="800"
                fill={textColor}
                fontFamily="Inter, sans-serif"
                style={{ 
                  shapeRendering: 'auto',
                  transform: isHorizontal ? 'none' : 'rotate(-90deg)', 
                  transformOrigin: `${isHorizontal ? 0 : 6}px ${isHorizontal ? 0 : m.pos + 9}px` 
                }}
              >
                {m.label}
              </text>
            )}
          </React.Fragment>
        ))}

        {/* Cursor Position Indicator */}
        {cursorPos !== null && cursorPos >= 0 && cursorPos <= length && (
          <line
            x1={isHorizontal ? cursorPos : 0}
            y1={isHorizontal ? 0 : cursorPos}
            x2={isHorizontal ? cursorPos : 32}
            y2={isHorizontal ? 32 : cursorPos}
            stroke={cursorColor}
            strokeWidth="2"
            strokeDasharray="4,2"
          />
        )}
      </svg>
      
      {/* Unit Indicator */}
      {isHorizontal && (
          <div className="absolute top-1 left-[-28px] text-[7px] font-black uppercase text-blue-500/50 transform -rotate-90">mm</div>
      )}
    </div>
  );
}
