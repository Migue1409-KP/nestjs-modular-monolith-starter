import { Injectable, Logger } from '@nestjs/common';
import { betterAuth } from 'better-auth';
import { Pool } from 'pg';
import { customSession, magicLink, openAPI } from 'better-auth/plugins';
import { UsersService } from '@/users/services/users.service';
import { ConfigService } from '@nestjs/config';
import { NotificationService } from '@/core/notification/notification.service';
import { parseFrontendUrls } from '@/shared/utils/frontend-url.util';
import { parseGoogleScopes } from '@/auth/google-scopes.util';
import * as crypto from 'crypto';

@Injectable()
export class AuthConfigFactory {
  private readonly logger = new Logger(AuthConfigFactory.name);
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly mailService: NotificationService,
  ) {}

  // HOST may come without scheme (e.g. "localhost"); Better Auth needs an absolute URL.
  private resolveBaseUrl(): string {
    const explicit = this.configService.get<string>('BETTER_AUTH_URL');
    if (explicit) return new URL(explicit).origin; // path comes from basePath
    const host = this.configService.get<string>('HOST', 'http://localhost');
    const port = this.configService.get<string>('PORT', '3000');
    const withScheme = /^https?:\/\//.test(host) ? host : `http://${host}`;
    return `${withScheme}:${port}`;
  }

  create() {
    const trustedOrigins = parseFrontendUrls(this.configService.get<string>('FRONTEND_URL'));
    const crossSiteCookies = this.configService.get<string>('COOKIE_CROSS_SITE') === 'true';
    const cookieDomain = this.configService.get<string>('DOMAIN') || undefined;
    // No insecure fallbacks: a missing secret must stop the bootstrap (see env.validation.ts).
    const authSecret = this.configService.getOrThrow<string>('BETTER_AUTH_SECRET');
    const magicLinkSecret = this.configService.getOrThrow<string>('MAGIC_LINK_SECRET');
    const magicLinkTokenLength = Number(
      this.configService.get<number>('MAGIC_LINK_TOKEN_LENGTH', 32),
    );

    const googleScopes = parseGoogleScopes(this.configService.get<string>('GOOGLE_SCOPES'));

    return betterAuth({
      baseURL: this.resolveBaseUrl(),
      basePath: `/${this.configService.get<string>('API_PREFIX', 'api/v1')}/auth`,
      secret: authSecret,

      database: new Pool({
        connectionString: this.configService.get<string>('DATABASE_URL')!,
      }),

      trustedOrigins: trustedOrigins,

      emailAndPassword: {
        enabled: false,
        requireEmailVerification: true,
      },

      // Since 1.4 changeEmail needs emailVerification.sendVerificationEmail: it delivers the
      // link to the NEW address, while user.changeEmail.sendChangeEmailConfirmation goes to the current one.
      emailVerification: {
        sendVerificationEmail: async ({ user, url, token }) => {
          await this.mailService.notify({
            email: user.email,
            templateCode: 'CHANGE_EMAIL',
            params: {
              url,
              token,
              newEmail: user.email,
            },
          });
        },
      },

      user: {
        modelName: 'users',
        changeEmail: {
          enabled: true,
          sendChangeEmailConfirmation: async ({ user, newEmail, url, token }, request) => {
            await this.mailService.notify({
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
          prompt: 'select_account',
          // Only the basic scopes by default; sensitive ones are opt-in via GOOGLE_SCOPES.
          scope: googleScopes,
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
          sendMagicLink: async ({ email, token, url }, ctx) => {
            await this.mailService.notify({
              email: email,
              templateCode: 'MAGIC_LINK',
              params: {
                url,
                token,
              },
            });
          },
          generateToken: async (email: string) => {
            const randomBytes = crypto.randomBytes(32);
            const hash = crypto
              .createHmac('sha256', magicLinkSecret)
              .update(email + randomBytes.toString('hex'))
              .digest('base64');

            const token = hash.replace(/[^a-zA-Z0-9]/g, '').slice(0, magicLinkTokenLength);
            return token;
          },
        }),
      ],
    });
  }
}
