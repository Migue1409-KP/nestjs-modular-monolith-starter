const PLACEHOLDER = /\{\{\s*([\w.-]+)\s*\}\}/g;

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

/**
 * Replaces `{{key}}` placeholders in a single pass, so a value that itself contains `{{other}}`
 * is never expanded again and keys need no regex escaping. Unknown keys are left untouched.
 * Pass `escape: true` for HTML bodies so user-controlled params cannot inject markup.
 */
export function renderTemplate(
  template: string,
  params: Record<string, string>,
  options: { escape?: boolean } = {},
): string {
  return template.replace(PLACEHOLDER, (match, key: string) => {
    if (!Object.prototype.hasOwnProperty.call(params, key)) return match;
    const value = String(params[key] ?? '');
    return options.escape ? escapeHtml(value) : value;
  });
}
