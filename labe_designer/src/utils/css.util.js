/**
 * Helper pure functions following the Architectural rules
 */

/**
 * Combines CSS classes safely
 * @param  {...string} classes - class names to combine
 * @returns {string} combined class string
 */
export function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}
