import React, { useMemo } from 'react';
import { UNITS, PX_PER_UNIT, getTickIntervals } from '../../utils/units';

/**
 * A highly accurate ruler component for professional editors.
 * Supports mm, cm, in, and px measurements.
 */
export default function Ruler({ 
  orientation, 
  length, 
  zoomLevel, 
  unit = UNITS.MM,
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

  const pxFactor = PX_PER_UNIT[unit] || 1;
  const { major, medium, minor } = getTickIntervals(unit);

  // Calculate markers
  const markers = useMemo(() => {
    const list = [];
    const totalUnits = length / pxFactor;
    
    // We iterate by the minor interval
    const step = minor;
    for (let i = 0; i <= totalUnits + step; i += step) {
        const pos = i * pxFactor;
        if (pos > length + 1) break;

        let tickSize = 4;
        let showLabel = false;
        let label = null;

        // Check if i is close to major/medium/minor
        const isMajor = Math.abs(i % major) < 0.001 || Math.abs((i % major) - major) < 0.001;
        const isMedium = !isMajor && (Math.abs(i % medium) < 0.001 || Math.abs((i % medium) - medium) < 0.001);

        if (isMajor) {
            tickSize = 12;
            showLabel = true;
            label = Number(i.toFixed(1)).toString(); // avoid long decimals
        } else if (isMedium) {
            tickSize = 8;
        }

        list.push({ pos, tickSize, label: showLabel ? label : null });
    }
    return list;
  }, [length, pxFactor, major, medium, minor]);

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
        width={isHorizontal ? length : 100} 
        height={isHorizontal ? 100 : length}
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
        {markers.map((m, idx) => {
          // Skip logic: if major ticks are too close, skip every second label
          // (Distance between major ticks = pxFactor * major)
          const majorDist = pxFactor * major;
          const shouldSkipLabel = majorDist < 40 && (Math.round(m.pos / majorDist) % 2 !== 0);

          return (
            <React.Fragment key={idx}>
              <line
                x1={isHorizontal ? m.pos : 32 - m.tickSize}
                y1={isHorizontal ? 32 - m.tickSize : m.pos}
                x2={isHorizontal ? m.pos : 32}
                y2={isHorizontal ? 32 : m.pos}
                stroke={strokeColor}
                strokeWidth="1"
              />
              {m.label !== null && !shouldSkipLabel && (
                <text
                  x={isHorizontal ? m.pos + 2 : 2}
                  y={isHorizontal ? 10 : m.pos + 8}
                  fontSize="8"
                  fontWeight="600"
                  fill={textColor}
                  fontFamily="Inter, sans-serif"
                  style={{ 
                    shapeRendering: 'auto',
                    transform: isHorizontal ? 'none' : 'rotate(-90deg)', 
                    transformOrigin: `${isHorizontal ? 0 : 2}px ${isHorizontal ? 0 : m.pos + 8}px` 
                  }}
                >
                  {m.label}
                </text>
              )}
            </React.Fragment>
          );
        })}

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
          <div className="absolute top-1 left-[-26px] text-[8px] font-black uppercase text-blue-600/70 leading-none">
            {unit}
          </div>
      )}
    </div>
  );
}
