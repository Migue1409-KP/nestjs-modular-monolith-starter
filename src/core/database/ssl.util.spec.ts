import { resolveDbSsl } from './ssl.util';

describe('resolveDbSsl', () => {
  it('disables SSL unless DB_SSL=true', () => {
    expect(resolveDbSsl({})).toBe(false);
    expect(resolveDbSsl({ DB_SSL: 'false' })).toBe(false);
  });

  it('verifies the server certificate by default', () => {
    expect(resolveDbSsl({ DB_SSL: 'true' })).toEqual({ rejectUnauthorized: true });
  });

  it('allows opting out of verification explicitly', () => {
    expect(resolveDbSsl({ DB_SSL: 'true', DB_SSL_REJECT_UNAUTHORIZED: 'false' })).toEqual({
      rejectUnauthorized: false,
    });
  });

  it('keeps verification on for any value other than "false"', () => {
    expect(resolveDbSsl({ DB_SSL: 'true', DB_SSL_REJECT_UNAUTHORIZED: '0' })).toEqual({
      rejectUnauthorized: true,
    });
  });

  it('passes a custom CA and expands escaped newlines', () => {
    const result = resolveDbSsl({
      DB_SSL: 'true',
      DB_SSL_CA: '-----BEGIN CERTIFICATE-----\\nABC\\n-----END CERTIFICATE-----',
    });

    expect(result).toEqual({
      rejectUnauthorized: true,
      ca: '-----BEGIN CERTIFICATE-----\nABC\n-----END CERTIFICATE-----',
    });
  });

  it('ignores a blank CA', () => {
    expect(resolveDbSsl({ DB_SSL: 'true', DB_SSL_CA: '  ' })).toEqual({ rejectUnauthorized: true });
  });
});
