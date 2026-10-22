import { getPrimaryFrontendUrl, parseFrontendUrls } from './frontend-url.util';

describe('frontend-url.util', () => {
  describe('parseFrontendUrls', () => {
    it('returns an empty array for empty values', () => {
      expect(parseFrontendUrls(undefined)).toEqual([]);
      expect(parseFrontendUrls(null)).toEqual([]);
      expect(parseFrontendUrls('')).toEqual([]);
    });

    it('parses a single origin', () => {
      expect(parseFrontendUrls('http://localhost:3001')).toEqual(['http://localhost:3001']);
    });

    it('parses a comma-separated list, trimming spaces and dropping empty entries', () => {
      expect(parseFrontendUrls(' http://a.com , https://b.com ,, ')).toEqual([
        'http://a.com',
        'https://b.com',
      ]);
    });
  });

  describe('getPrimaryFrontendUrl', () => {
    it('returns the first origin', () => {
      expect(getPrimaryFrontendUrl('http://a.com,https://b.com')).toBe('http://a.com');
    });

    it('returns an empty string when there is none', () => {
      expect(getPrimaryFrontendUrl(undefined)).toBe('');
    });
  });
});
