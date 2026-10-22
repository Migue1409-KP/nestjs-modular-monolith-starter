import { Injectable, Logger } from '@nestjs/common';
import { APIError, betterAuth } from 'better-auth';
import { Pool } from 'pg';
import {
  createAuthMiddleware,
  customSession,
  emailOTP,
  lastLoginMethod,
  magicLink,
  openAPI,
} from 'better-auth/plugins';
import { UsersService } from '@/users/services/users.service';
import { ConfigService } from '@nestjs/config';
import { NotificationService } from '@/core/notification/notification.service';
import { auth } from '../better-auth.cli';
import { passkey } from 'better-auth/plugins/passkey';
import { parseFrontendUrls } from '@/shared/utils/frontend-url.util';
import * as crypto from 'crypto';

@Injectable()
export class AuthConfigFactory {
  private readonly logger = new Logger(AuthConfigFactory.name);
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly mailService: NotificationService,
  ) {}

  create() {
    const trustedOrigins = parseFrontendUrls(this.configService.get<string>('FRONTEND_URL'));
    const crossSiteCookies = this.configService.get<string>('COOKIE_CROSS_SITE') === 'true';
    const cookieDomain = this.configService.get<string>('DOMAIN') || undefined;

    return betterAuth({
      url:
        `${this.configService.get<string>('HOST')}:${this.configService.get<string>('PORT')}` ||
        'http://localhost:3000',
      basePath: `${this.configService.get<string>('API_PREFIX')}/auth` || '/api/v1/auth',
      secret: this.configService.get<string>('BETTER_AUTH_SECRET') || 'supersecret',

      database: new Pool({
        connectionString: this.configService.get<string>('DATABASE_URL')!,
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
          sendChangeEmailVerification: async ({ user, newEmail, url, token }, request) => {
            await this.mailService.buildAndSendNotification({
              email: user.email,
              templateCode: 'CHANGE_EMAIL',
              params: {
                url,
                token,
                newEmail,
              },
            });
          },
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
          clientId: this.configService.get<string>('GOOGLE_CLIENT_ID')!,
          clientSecret: this.configService.get<string>('GOOGLE_CLIENT_SECRET')!,
          prompt: 'select_account consent',
          accessType: 'offline',
          scope: [
            'https://www.googleapis.com/auth/user.gender.read',
            'https://www.googleapis.com/auth/user.birthday.read',
            'https://www.googleapis.com/auth/user.addresses.read',
            'https://www.googleapis.com/auth/profile.language.read',
          ],
          mapProfileToUser: (profile) => {
            this.logger.log('Google profile data:', profile);
            return profile;
          },
        },
      },

      // Opt-in via COOKIE_CROSS_SITE=true when the frontend lives on another site/subdomain.
      // SameSite=None requires Secure, so only enable it over HTTPS (or localhost).
      ...(crossSiteCookies && {
        advanced: {
          cookies: {
            session_token: {
              attributes: {
                sameSite: 'none' as const,
                secure: true,
              },
            },
          },
          crossSubDomainCookies: {
            enabled: !!cookieDomain,
            domain: cookieDomain,
          },
        },
      }),

      plugins: [
        openAPI(),
        customSession(async ({ user, session }) => {
          const profile = await this.usersService.findByAuthUserId(user.id);
          return {
            user: {
              ...user,
              roles: profile?.roles?.length ? profile.roles : ['USER'],
            },
            session,
          };
        }),
        magicLink({
          sendMagicLink: async ({ email, token, url }, request) => {
            await this.mailService.buildAndSendNotification({
              email: email,
              templateCode: 'MAGIC_LINK',
              params: {
                url,
                token,
              },
            });
          },
          generateToken: async (email: string) => {
            const tokenLength = parseInt(process.env.MAGIC_LINK_TOKEN_LENGTH ?? '32', 10);
            const secretKey = process.env.MAGIC_LINK_SECRET || 'default-magic-secret';

            const randomBytes = crypto.randomBytes(32);
            const hash = crypto
              .createHmac('sha256', secretKey)
              .update(email + randomBytes.toString('hex'))
              .digest('base64');

            const token = hash.replace(/[^a-zA-Z0-9]/g, '').slice(0, tokenLength);
            return token;
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
  }
}
