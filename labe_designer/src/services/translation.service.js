/**
 * Translation Service
 * Uses the MyMemory free translation API (no key required).
 * Supports all major ISO 639-1 language codes.
 * Rate limit: ~1000 words/day on anonymous access.
 */

const MYMEMORY_API = 'https://api.mymemory.translated.net/get';

/**
 * Translate a single text string.
 * @param {string} text - Source text (English)
 * @param {string} targetLangCode - ISO 639-1 code e.g. 'hi', 'kn', 'fr'
 * @returns {Promise<string>} - Translated text
 */
export async function translateText(text, targetLangCode) {
  if (!text || !text.trim()) return '';
  if (targetLangCode === 'en') return text;

  try {
    const url = `${MYMEMORY_API}?q=${encodeURIComponent(text)}&langpair=en|${targetLangCode}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return data.responseData.translatedText;
    }
    throw new Error(data.responseDetails || 'Translation failed');
  } catch (err) {
    console.warn(`[TranslationService] Failed for "${text}" → ${targetLangCode}:`, err.message);
    return text; // Graceful fallback: return original
  }
}

/**
 * Translate multiple texts in parallel with concurrency control.
 * @param {Array<{id, text}>} items - Items to translate
 * @param {string} targetLangCode - Target language code
 * @param {function} onProgress - Progress callback(completed, total)
 * @returns {Promise<Object>} - Map of {id: translatedText}
 */
export async function translateBatch(items, targetLangCode, onProgress) {
  const results = {};
  const CONCURRENCY = 3; // max parallel requests to avoid rate limits

  for (let i = 0; i < items.length; i += CONCURRENCY) {
    const chunk = items.slice(i, i + CONCURRENCY);
    const settled = await Promise.allSettled(
      chunk.map(item => translateText(item.text, targetLangCode))
    );
    settled.forEach((result, j) => {
      const item = chunk[j];
      results[item.id] = result.status === 'fulfilled'
        ? result.value
        : item.text; // fallback original
    });
    if (onProgress) onProgress(Math.min(i + CONCURRENCY, items.length), items.length);
  }

  return results;
}
