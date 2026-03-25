/**
 * Mock Translation Service
 * In a real application, this would call an external API (e.g. Google Translate).
 */

export async function translateText(text, targetLang) {
  if (!text) return '';
  if (targetLang === 'en') return text; // Assuming base is English

  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      // Mock translation logic: just prefix the text for demo purposes
      resolve(`[${targetLang.toUpperCase()}] ${text}`);
    }, 600);
  });
}
