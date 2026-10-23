import { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';

/**
 * Helmet with its default (strict) CSP everywhere except the API reference page,
 * whose UI needs inline scripts/styles and CDN assets that the default CSP blocks.
 */
export function createSecurityHeadersMiddleware(docsPath: string) {
  const strict = helmet();
  const docs = helmet({ contentSecurityPolicy: false });

  return (req: Request, res: Response, next: NextFunction) => {
    const isDocs = req.path === docsPath || req.path.startsWith(`${docsPath}/`);
    return (isDocs ? docs : strict)(req, res, next);
  };
}
