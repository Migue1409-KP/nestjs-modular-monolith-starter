import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Reads the application version from `package.json` so the OpenAPI document never drifts
 * from the released version. Resolved against the working directory, like `config/authorization.yaml`
 * (the Docker image copies `package*.json` next to `dist/`).
 */
export function getAppVersion(cwd: string = process.cwd()): string {
  try {
    const pkg = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8')) as {
      version?: unknown;
    };
    return typeof pkg.version === 'string' && pkg.version.length > 0 ? pkg.version : '0.0.0';
  } catch {
    return '0.0.0';
  }
}
