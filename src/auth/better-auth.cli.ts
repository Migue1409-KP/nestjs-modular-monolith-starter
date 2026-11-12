import { betterAuth } from 'better-auth';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { magicLink, openAPI } from 'better-auth/plugins';
import { parseFrontendUrls } from '../shared/utils/frontend-url.util';
import { parseGoogleScopes } from './google-scopes.util';

// Cargar variables de entorno manualmente
dotenv.config();

// No insecure fallback: the CLI loads the same .env as the app.
const authSecret = process.env.BETTER_AUTH_SECRET;
if (!authSecret) {
  throw new Error('BETTER_AUTH_SECRET is required to run the Better Auth CLI');
}
const trustedOrigins = parseFrontendUrls(process.env.FRONTEND_URL);

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  basePath: `/${process.env.API_PREFIX ?? 'api/v1'}/auth`,
  secret: authSecret,

  database: new Pool({
    connectionString: process.env.DATABASE_URL!,
  }),

  trustedOrigins: trustedOrigins,

  emailAndPassword: {
    enabled: false,
    requireEmailVerification: true,
  },

  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }) => {},
  },

  user: {
    modelName: 'users',
    changeEmail: {
      enabled: true,
      sendChangeEmailConfirmation: async ({ user, newEmail, url, token }, request) => {},
    },
  },

  account: {
    modelName: 'accounts',
  },

  session: {
    modelName: 'sessions',
  },

  verification: {
    modelName: 'verifications',
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      prompt: 'select_account',
      scope: parseGoogleScopes(process.env.GOOGLE_SCOPES),
    },
  },

  plugins: [
    openAPI(),
    magicLink({
      sendMagicLink: async ({ email, token, url }, ctx) => {
        // send email to user
      },
    }),
  ],
});
