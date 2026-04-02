/**
 * Alignment calculation utility for label editor.
 */

const SNAP_THRESHOLD = 8;

/**
 * Calculates the snapping points and active guidelines for a dragging element.
 * 
 * @param {Object} draggingEl - The element currently being dragged.
 * @param {Array} allElements - All elements in the artboard.
 * @param {number} canvasWidth - Width of the artboard.
 * @param {number} canvasHeight - Height of the artboard.
 * @param {Object} options - { snapToGrid: boolean, gridSize: number, snapToGuides: boolean }
 * @returns {Object} { snappedPos: {x, y}, activeGuides: [] }
 */
export function calculateAlignmentGuides(draggingEl, allElements, canvasWidth, canvasHeight, options = {}) {
  const { snapToGrid = false, gridSize = 20, snapToGuides = true } = options;
  
  if (!draggingEl) return { snappedPos: null, activeGuides: [] };

  const guides = [];
  let snappedX = draggingEl.x;
  let snappedY = draggingEl.y;

  // 1. Grid Snapping (Internal priority)
  if (snapToGrid) {
    snappedX = Math.round(snappedX / gridSize) * gridSize;
    snappedY = Math.round(snappedY / gridSize) * gridSize;
  }

  if (!snapToGuides) {
      return { snappedPos: { x: snappedX, y: snappedY }, activeGuides: [] };
  }

  const dragRect = {
    id: draggingEl.id,
    left: snappedX,
    right: snappedX + (draggingEl.width || 0),
    top: snappedY,
    bottom: snappedY + (draggingEl.height || 0),
    centerX: snappedX + (draggingEl.width || 0) / 2,
    centerY: snappedY + (draggingEl.height || 0) / 2,
    width: draggingEl.width || 0,
    height: draggingEl.height || 0
  };

  const otherElements = allElements
      .filter(el => el.id !== draggingEl.id)
      .map(el => ({
        id: el.id,
        left: el.x,
        right: el.x + (el.width || 0),
        top: el.y,
        bottom: el.y + (el.height || 0),
        centerX: el.x + (el.width || 0) / 2,
        centerY: el.y + (el.height || 0) / 2,
        width: el.width || 0,
        height: el.height || 0
      }));

  // Reference lines (Canvas center, edges)
  const verticalRefs = [
      { pos: 0, type: 'edge', id: 'canvas-left' },
      { pos: canvasWidth, type: 'edge', id: 'canvas-right' },
      { pos: canvasWidth / 2, type: 'canvas-center', id: 'canvas-center-x' }
  ];
  const horizontalRefs = [
      { pos: 0, type: 'edge', id: 'canvas-top' },
      { pos: canvasHeight, type: 'edge', id: 'canvas-bottom' },
      { pos: canvasHeight / 2, type: 'canvas-center', id: 'canvas-center-y' }
  ];

  otherElements.forEach(el => {
      verticalRefs.push({ pos: el.left, type: 'edge', id: el.id });
      verticalRefs.push({ pos: el.right, type: 'edge', id: el.id });
      verticalRefs.push({ pos: el.centerX, type: 'center', id: el.id });
      
      horizontalRefs.push({ pos: el.top, type: 'edge', id: el.id });
      horizontalRefs.push({ pos: el.bottom, type: 'edge', id: el.id });
      horizontalRefs.push({ pos: el.centerY, type: 'center', id: el.id });
  });

  let xSnapped = false;
  let ySnapped = false;

  // Vertical Snapping
  for (const ref of verticalRefs) {
      const matchLeft = Math.abs(dragRect.left - ref.pos) < SNAP_THRESHOLD;
      const matchRight = Math.abs(dragRect.right - ref.pos) < SNAP_THRESHOLD;
      const matchCenter = Math.abs(dragRect.centerX - ref.pos) < SNAP_THRESHOLD;

      if (matchLeft || matchRight || matchCenter) {
          if (matchLeft) snappedX = ref.pos;
          else if (matchRight) snappedX = ref.pos - dragRect.width;
          else if (matchCenter) snappedX = ref.pos - dragRect.width / 2;

          guides.push({ 
              orientation: 'vertical', 
              pos: ref.pos, 
              type: ref.type, 
              sourceId: ref.id,
              // Add distance lines if it's an element match
              distLines: getDistLines(dragRect, otherElements, 'vertical', ref.pos)
          });
          xSnapped = true;
          break;
      }
  }

  // Horizontal Snapping
  for (const ref of horizontalRefs) {
      const matchTop = Math.abs(dragRect.top - ref.pos) < SNAP_THRESHOLD;
      const matchBottom = Math.abs(dragRect.bottom - ref.pos) < SNAP_THRESHOLD;
      const matchCenter = Math.abs(dragRect.centerY - ref.pos) < SNAP_THRESHOLD;

      if (matchTop || matchBottom || matchCenter) {
          if (matchTop) snappedY = ref.pos;
          else if (matchBottom) snappedY = ref.pos - dragRect.height;
          else if (matchCenter) snappedY = ref.pos - dragRect.height / 2;

          guides.push({ 
              orientation: 'horizontal', 
              pos: ref.pos, 
              type: ref.type, 
              sourceId: ref.id,
              distLines: getDistLines(dragRect, otherElements, 'horizontal', ref.pos)
          });
          ySnapped = true;
          break;
      }
  }

  return {
    snappedPos: { x: snappedX, y: snappedY },
    activeGuides: guides
  };
}

/**
 * Calculates distance lines for horizontal/vertical spacing.
 */
function getDistLines(dragRect, others, orientation, guidePos) {
    const distLines = [];
    const isVertical = orientation === 'vertical';

    others.forEach(other => {
        // Only show distance if aligned on the same axis (roughly)
        if (isVertical) {
            // Check if vertical edges or center align
            if (other.left === guidePos || other.right === guidePos || other.centerX === guidePos) {
                // Calculate vertical distance between them
                if (dragRect.bottom < other.top) {
                    distLines.push({ start: dragRect.bottom, end: other.top, value: other.top - dragRect.bottom, centerPos: guidePos });
                } else if (dragRect.top > other.bottom) {
                    distLines.push({ start: other.bottom, end: dragRect.top, value: dragRect.top - other.bottom, centerPos: guidePos });
                }
            }
        } else {
            // Horizontal
            if (other.top === guidePos || other.bottom === guidePos || other.centerY === guidePos) {
                if (dragRect.right < other.left) {
                    distLines.push({ start: dragRect.right, end: other.left, value: other.left - dragRect.right, centerPos: guidePos });
                } else if (dragRect.left > other.right) {
                    distLines.push({ start: other.right, end: dragRect.left, value: dragRect.left - other.right, centerPos: guidePos });
                }
            }
        }
    });
    return distLines;
}
