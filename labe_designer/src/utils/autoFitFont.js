/**
 * autoFitFont.js
 * Detects the dominant Unicode script in `text` and returns
 * calibrated { avgCharWidth, lineHeightMultiplier } values.
 *
 * Key insight: Indic scripts (Malayalam, Devanagari, etc.) place
 * vowel matras BOTH above and below the base glyph, so the actual
 * rendered line height is 1.7–2.0× the nominal font size — not
 * the CSS default of 1.2–1.25.  Using the wrong multiplier causes
 * massive underestimation of vertical space and text overflow.
 */
function detectScriptMetrics(text) {
  if (!text || text.length === 0) {
    return { avgCharWidth: 0.58, lineHeightMult: 1.3 };
  }

  const total = text.replace(/\s/g, '').length || 1; // ignore whitespace for ratios

  // Devanagari, Bengali, Gurmukhi, Gujarati, Oriya, Tamil, Telugu, Kannada, Malayalam
  const indicCount  = (text.match(/[\u0900-\u0D7F]/g) || []).length;
  // Thai / Lao  (also complex stacked glyphs)
  const thaiCount   = (text.match(/[\u0E00-\u0EFF]/g) || []).length;
  // Arabic / Hebrew (cursive, RTL, medium width)
  const arabicCount = (text.match(/[\u0600-\u06FF\u0750-\u07FF]/g) || []).length;
  // CJK unified ideographs (square glyphs, ~1em wide)
  const cjkCount    = (text.match(/[\u3000-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF]/g) || []).length;

  const latinCount  = Math.max(0, total - indicCount - thaiCount - arabicCount - cjkCount);

  // Dominant script (by character count)
  const dominant = Math.max(indicCount, thaiCount, arabicCount, cjkCount, latinCount);

  if (dominant === indicCount && indicCount > 0) {
    // Indic scripts: wide glyphs + tall stacked diacritics
    return { avgCharWidth: 1.05, lineHeightMult: 1.9 };
  }
  if (dominant === thaiCount && thaiCount > 0) {
    return { avgCharWidth: 0.85, lineHeightMult: 1.75 };
  }
  if (dominant === arabicCount && arabicCount > 0) {
    return { avgCharWidth: 0.70, lineHeightMult: 1.5 };
  }
  if (dominant === cjkCount && cjkCount > 0) {
    return { avgCharWidth: 1.05, lineHeightMult: 1.5 };
  }
  // Latin / default
  return { avgCharWidth: 0.58, lineHeightMult: 1.3 };
}

/**
 * Computes the largest integer font size (px) that allows `text`
 * to render inside a container of `width × height` pixels without
 * overflowing, for ANY script / language.
 *
 * @param {string}  text         - The text to fit (may contain \n).
 * @param {number}  width        - Container width in unscaled px.
 * @param {number}  height       - Container height in unscaled px.
 * @param {number}  originalSize - Designer's chosen font size.
 * @param {number}  [minSize=5]  - Hard floor (never goes below this).
 * @returns {number} Adjusted font size in px.
 */
export function calcAutoFitFontSize(text, width, height, originalSize, minSize = 5) {
  if (!text || !width || !height || !originalSize) return originalSize;

  const { avgCharWidth, lineHeightMult } = detectScriptMetrics(text);

  // Safety margin: shrink effective box by 10% to account for
  // variable glyph widths and sub-pixel rendering differences.
  const effectiveW = width  * 0.90;
  const effectiveH = height * 0.88;

  let size = originalSize;

  while (size > minSize) {
    const charsPerLine = Math.max(1, Math.floor(effectiveW / (size * avgCharWidth)));

    // Count lines: honour explicit \n, then estimate word-wrap
    let lineCount = 0;
    text.split('\n').forEach(segment => {
      const segLen = segment.length || 1;
      lineCount += Math.max(1, Math.ceil(segLen / charsPerLine));
    });

    const heightNeeded = lineCount * size * lineHeightMult;

    if (heightNeeded <= effectiveH) break; // ✓ fits

    // Use smaller steps near the bottom for precision
    size -= size > 12 ? 1 : 0.5;
  }

  return Math.max(minSize, Math.floor(size));
}
