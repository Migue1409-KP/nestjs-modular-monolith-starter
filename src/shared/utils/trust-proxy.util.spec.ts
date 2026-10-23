import { parseTrustProxy } from './trust-proxy.util';

describe('parseTrustProxy', () => {
  it.each([
    [undefined, undefined],
    ['', undefined],
    ['true', true],
    ['false', false],
    ['1', 1],
    ['loopback', 'loopback'],
    ['10.0.0.0/8, 172.16.0.0/12', '10.0.0.0/8, 172.16.0.0/12'],
  ])('parses %p', (input, expected) => {
    expect(parseTrustProxy(input)).toBe(expected);
  });
});
