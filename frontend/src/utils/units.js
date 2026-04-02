
export const UNITS = {
  PX: 'px',
  MM: 'mm',
  CM: 'cm',
  IN: 'in'
};

const DPI = 96;
const MM_PER_IN = 25.4;

export const PX_PER_UNIT = {
  [UNITS.PX]: 1,
  [UNITS.MM]: DPI / MM_PER_IN,
  [UNITS.CM]: (DPI / MM_PER_IN) * 10,
  [UNITS.IN]: DPI
};

/**
 * Converts a value from one unit to pixels.
 */
export const toPx = (value, unit) => {
  return value * (PX_PER_UNIT[unit] || 1);
};

/**
 * Converts pixels to a target unit.
 */
export const fromPx = (px, unit) => {
  return px / (PX_PER_UNIT[unit] || 1);
};

/**
 * Formats a value for display with the unit.
 */
export const formatUnit = (px, unit, precision = 2) => {
  const value = fromPx(px, unit);
  if (unit === UNITS.PX) return `${Math.round(value)} px`;
  return `${value.toFixed(precision)} ${unit}`;
};

/**
 * Returns appropriate major/minor tick intervals for a given unit.
 */
export const getTickIntervals = (unit) => {
  switch (unit) {
    case UNITS.MM:
      return { major: 10, medium: 5, minor: 1 }; // Every 10mm labeling, 5mm half, 1mm marks
    case UNITS.CM:
      return { major: 1, medium: 0.5, minor: 0.1 }; // Every 1cm labeling, 0.5cm half, 0.1cm marks
    case UNITS.IN:
      return { major: 1, medium: 0.5, minor: 0.125 }; // Every 1in labeling, 0.5in half, 1/8in marks
    case UNITS.PX:
    default:
      return { major: 100, medium: 50, minor: 10 }; // Every 100px labeling, 50px half, 10px marks
  }
};
