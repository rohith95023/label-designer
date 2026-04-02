import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * SmartGuides Component
 * Renders alignment lines and distance indicators.
 */
export default function SmartGuides({ 
  activeGuides = [], 
  zoomLevel = 1, 
  isDark = false,
  canvasWidth,
  canvasHeight,
  onRemoveManualCenter
}) {
  if (!activeGuides || activeGuides.length === 0) return null;

  const guideColor = isDark ? '#a78bfa' : '#6366f1'; // Purple/Blue glow
  const labelBg = isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)';
  const labelTextColor = isDark ? '#e2e8f0' : '#1e293b';

  return (
    <div className="absolute inset-0 pointer-events-none z-[80] overflow-visible">
      <AnimatePresence>
        {activeGuides.map((guide, idx) => {
          const isVertical = guide.orientation === 'vertical';
          const isCanvasCenter = guide.type === 'canvas-center';
          const isManual = guide.type === 'manual';
          
          return (
            <React.Fragment key={`${guide.type}-${idx}`}>
              {/* Alignment Line */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute"
                onContextMenu={(e) => {
                  if (isManual && onRemoveManualCenter) {
                    e.preventDefault();
                    onRemoveManualCenter(guide.pos, guide.orientation);
                  }
                }}
                style={{
                  left: isVertical ? `${guide.pos}px` : 0,
                  top: isVertical ? 0 : `${guide.pos}px`,
                  width: isVertical ? (isCanvasCenter ? '2px' : '1px') : '100%',
                  height: isVertical ? '100%' : (isCanvasCenter ? '2px' : '1px'),
                  backgroundColor: isCanvasCenter ? '#8b5cf6' : (isManual ? '#3b82f6' : guideColor),
                  boxShadow: isCanvasCenter ? `0 0 12px #8b5cf6` : (isManual ? 'none' : `0 0 8px ${guideColor}80`),
                  zIndex: 100,
                  cursor: isManual ? 'crosshair' : 'default'
                }}
              />

              {/* Distance Indicators / Labels */}
              {guide.distLines && guide.distLines.map((dist, dIdx) => (
                <DistanceLine 
                  key={dIdx}
                  dist={dist}
                  isVertical={isVertical}
                  guideColor={guideColor}
                  labelBg={labelBg}
                  labelTextColor={labelTextColor}
                  zoomLevel={zoomLevel}
                />
              ))}
            </React.Fragment>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function DistanceLine({ dist, isVertical, guideColor, labelBg, labelTextColor, zoomLevel }) {
  // dist = { start, end, value, centerPos }
  const length = Math.abs(dist.end - dist.start);
  if (length < 2) return null;

  const style = isVertical ? {
    left: `${dist.centerPos}px`,
    top: `${Math.min(dist.start, dist.end)}px`,
    width: '1px',
    height: `${length}px`,
    borderLeft: `1px dashed ${guideColor}`,
  } : {
    left: `${Math.min(dist.start, dist.end)}px`,
    top: `${dist.centerPos}px`,
    width: `${length}px`,
    height: '1px',
    borderTop: `1px dashed ${guideColor}`,
  };

  const labelStyle = isVertical ? {
    top: '50%',
    left: '8px',
    transform: 'translateY(-50%)'
  } : {
    left: '50%',
    top: '8px',
    transform: 'translateX(-50%)'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute flex items-center justify-center"
      style={{ ...style, zIndex: 101 }}
    >
      {/* Small T-ends for the distance line */}
      <div className="absolute" style={{ 
        [isVertical ? 'top' : 'left']: 0, 
        [isVertical ? 'left' : 'top']: '-3px',
        [isVertical ? 'width' : 'height']: '7px',
        [isVertical ? 'height' : 'width']: '1px',
        backgroundColor: guideColor
      }} />
      <div className="absolute" style={{ 
        [isVertical ? 'bottom' : 'right']: 0, 
        [isVertical ? 'left' : 'top']: '-3px',
        [isVertical ? 'width' : 'height']: '7px',
        [isVertical ? 'height' : 'width']: '1px',
        backgroundColor: guideColor
      }} />

      {/* Spacing Label Chip */}
      <div 
        className="absolute px-1.5 py-0.5 rounded-md text-[9px] font-bold shadow-sm border border-white/20 backdrop-blur-md"
        style={{ 
          ...labelStyle,
          backgroundColor: labelBg,
          color: labelTextColor,
          transform: `${labelStyle.transform} scale(${1/zoomLevel})`
        }}
      >
        {Math.round(dist.value)}px
      </div>
    </motion.div>
  );
}
