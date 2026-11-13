import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { getAppVersion } from './app-version.util';

describe('getAppVersion', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'app-version-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('reads the version from package.json', () => {
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ version: '2.3.4' }));
    expect(getAppVersion(dir)).toBe('2.3.4');
  });

  it('falls back to 0.0.0 when package.json is missing', () => {
    expect(getAppVersion(dir)).toBe('0.0.0');
  });

  it('falls back to 0.0.0 when package.json is invalid or has no version', () => {
    writeFileSync(join(dir, 'package.json'), '{ not json');
    expect(getAppVersion(dir)).toBe('0.0.0');
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'x' }));
    expect(getAppVersion(dir)).toBe('0.0.0');
  });

  it('matches the real package.json of the project', () => {
    expect(getAppVersion()).toMatch(/^\d+\.\d+\.\d+/);
  });
});
