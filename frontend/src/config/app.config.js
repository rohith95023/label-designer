/**
 * Configuration module loading
 * Using feature flags as requested in RULES.md
 */

// In Vite, we use import.meta.env
const env = import.meta.env || {};

export const appConfig = Object.freeze({
  features: {
    mockTranslation: env.VITE_FEATURE_MOCK_TRANSLATION !== 'false', // Default true
    pdfExport: true
  },
  api: {
    baseUrl: env.VITE_API_BASE_URL || '/api/v1'
  }
});
