import { parseGoogleScopes } from './google-scopes.util';

describe('parseGoogleScopes', () => {
  it('returns no extra scopes when unset or blank', () => {
    expect(parseGoogleScopes(undefined)).toEqual([]);
    expect(parseGoogleScopes('')).toEqual([]);
    expect(parseGoogleScopes(' , ')).toEqual([]);
  });

  it('splits and trims a comma separated list', () => {
    expect(
      parseGoogleScopes(
        ' https://www.googleapis.com/auth/user.birthday.read , https://www.googleapis.com/auth/profile.language.read ',
      ),
    ).toEqual([
      'https://www.googleapis.com/auth/user.birthday.read',
      'https://www.googleapis.com/auth/profile.language.read',
    ]);
  });
});
