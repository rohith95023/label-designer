import { BASE_URL } from '../services/api';

export const resolveUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('http') || url.startsWith('blob:')) return url;
  return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};
