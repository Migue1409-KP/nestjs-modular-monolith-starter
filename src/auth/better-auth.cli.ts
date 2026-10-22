import { betterAuth } from 'better-auth';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { emailOTP, lastLoginMethod, magicLink, openAPI } from 'better-auth/plugins';
import { passkey } from 'better-auth/plugins/passkey';
import { parseFrontendUrls } from '../shared/utils/frontend-url.util';

// Cargar variables de entorno manualmente
dotenv.config();
const trustedOrigins = parseFrontendUrls(process.env.FRONTEND_URL);

export const auth = betterAuth({
  url: `${process.env.HOST}:${process.env.PORT}` || 'http://localhost:3000',
  basePath: `${process.env.API_PREFIX}/better-auth` || '/api/v1/better-auth',
  secret: process.env.BETTER_AUTH_SECRET || 'supersecret',

  database: new Pool({
    connectionString: process.env.DATABASE_URL!,
  }),

  trustedOrigins: trustedOrigins,

  emailAndPassword: {
    enabled: false,
    requireEmailVerification: true,
  },

  user: {
    modelName: 'users',
    changeEmail: {
      enabled: true,
      sendChangeEmailVerification: async ({ user, newEmail, url, token }, request) => {},
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
      prompt: 'select_account consent',
      accessType: 'offline',
      scope: [
        'https://www.googleapis.com/auth/user.gender.read',
        'https://www.googleapis.com/auth/user.birthday.read',
        'https://www.googleapis.com/auth/user.addresses.read',
        'https://www.googleapis.com/auth/profile.language.read',
      ],
    },
  },

  plugins: [
    openAPI(),
    magicLink({
      sendMagicLink: async ({ email, token, url }, request) => {
        // send email to user
      },
    }),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        if (type === 'sign-in') {
          // Send the OTP for sign in
        } else if (type === 'email-verification') {
          // Send the OTP for email verification
        } else {
          // Send the OTP for password reset
        }
      },
    }),
  ],
});
