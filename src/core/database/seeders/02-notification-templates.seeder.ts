import { DataSource } from 'typeorm';

interface TemplateSeed {
  code: string;
  description: string;
  params: string[];
  translations: Record<'en' | 'es', { subject: string; html: string }>;
}

const layout = (title: string, body: string, cta: string, ctaLabel: string, footer: string) => `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1f2933">
  <h2 style="margin:0 0 16px">${title}</h2>
  <p style="line-height:1.5">${body}</p>
  <p style="margin:24px 0">
    <a href="${cta}" style="background:#2563eb;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block">${ctaLabel}</a>
  </p>
  <p style="font-size:12px;color:#6b7280;line-height:1.5">${footer}</p>
</div>`;

// Placeholders use the {{param}} syntax resolved by NotificationService.buildNotification.
const TEMPLATES: TemplateSeed[] = [
  {
    code: 'MAGIC_LINK',
    description: 'Sign-in link sent by the Better Auth magicLink plugin',
    params: ['url', 'token'],
    translations: {
      en: {
        subject: 'Your sign-in link',
        html: layout(
          'Sign in to your account',
          'Click the button below to sign in. This link expires in 5 minutes and can only be used once.',
          '{{url}}',
          'Sign in',
          "If you didn't request this email you can safely ignore it.",
        ),
      },
      es: {
        subject: 'Tu enlace de acceso',
        html: layout(
          'Inicia sesión en tu cuenta',
          'Haz clic en el botón para iniciar sesión. El enlace expira en 5 minutos y solo puede usarse una vez.',
          '{{url}}',
          'Iniciar sesión',
          'Si no solicitaste este correo, puedes ignorarlo.',
        ),
      },
    },
  },
  {
    code: 'CHANGE_EMAIL',
    description: 'Confirmation / verification link for an email address change',
    params: ['url', 'token', 'newEmail'],
    translations: {
      en: {
        subject: 'Confirm your email change',
        html: layout(
          'Confirm your email change',
          'We received a request to change the email of your account to <strong>{{newEmail}}</strong>. Click the button to confirm.',
          '{{url}}',
          'Confirm change',
          "If you didn't request this change, ignore this email and your account will stay as it is.",
        ),
      },
      es: {
        subject: 'Confirma el cambio de tu correo',
        html: layout(
          'Confirma el cambio de correo',
          'Recibimos una solicitud para cambiar el correo de tu cuenta a <strong>{{newEmail}}</strong>. Haz clic en el botón para confirmar.',
          '{{url}}',
          'Confirmar cambio',
          'Si no solicitaste este cambio, ignora este correo y tu cuenta no se modificará.',
        ),
      },
    },
  },
];

export async function seedNotificationTemplates(dataSource: DataSource): Promise<void> {
  console.log('🌱 Seeding notification templates...');

  for (const tpl of TEMPLATES) {
    const [{ id: templateId }] = await dataSource.query(
      `
      INSERT INTO notification_templates (code, description, params, is_active)
      VALUES ($1, $2, $3::jsonb, true)
      ON CONFLICT (code) DO UPDATE
        SET description = EXCLUDED.description, params = EXCLUDED.params
      RETURNING id;
      `,
      [tpl.code, tpl.description, JSON.stringify(tpl.params)],
    );

    for (const [languageCode, t] of Object.entries(tpl.translations)) {
      await dataSource.query(
        `
        INSERT INTO notification_template_translations (template, language, subject, html_template)
        SELECT $1, l.id, $3, $4 FROM languages l WHERE l.code = $2
        ON CONFLICT (template, language)
        DO UPDATE SET subject = EXCLUDED.subject, html_template = EXCLUDED.html_template;
        `,
        [templateId, languageCode, t.subject, t.html],
      );
    }
  }

  console.log('✅ Notification templates seeded');
}
