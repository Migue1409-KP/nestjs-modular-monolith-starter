import { escapeHtml, renderTemplate } from './render-template.util';

describe('renderTemplate', () => {
  it('replaces every occurrence of a placeholder', () => {
    expect(renderTemplate('{{a}}-{{a}}', { a: 'x' })).toBe('x-x');
  });

  it('tolerates spaces inside the braces', () => {
    expect(renderTemplate('Hi {{ name }}', { name: 'Ana' })).toBe('Hi Ana');
  });

  it('leaves unknown placeholders untouched', () => {
    expect(renderTemplate('{{known}} {{unknown}}', { known: 'ok' })).toBe('ok {{unknown}}');
  });

  it('does not treat keys as regular expressions', () => {
    expect(renderTemplate('{{a.b}} {{axb}}', { 'a.b': '1', axb: '2' })).toBe('1 2');
  });

  it('does not expand placeholders found inside substituted values', () => {
    expect(renderTemplate('{{a}} {{b}}', { a: '{{b}}', b: 'secret' })).toBe('{{b}} secret');
  });

  it('does not resolve prototype properties as params', () => {
    expect(renderTemplate('{{constructor}}', {})).toBe('{{constructor}}');
  });

  it('escapes HTML in values only when asked to', () => {
    const params = { name: '<script>alert("x")</script>' };
    expect(renderTemplate('<p>{{name}}</p>', params)).toBe(`<p>${params.name}</p>`);
    expect(renderTemplate('<p>{{name}}</p>', params, { escape: true })).toBe(
      '<p>&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;</p>',
    );
  });

  it('escapes ampersands so URLs stay valid inside href attributes', () => {
    expect(
      renderTemplate('<a href="{{url}}">', { url: 'https://a.io/?x=1&y=2' }, { escape: true }),
    ).toBe('<a href="https://a.io/?x=1&amp;y=2">');
  });
});

describe('escapeHtml', () => {
  it('escapes the five special characters', () => {
    expect(escapeHtml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#39;');
  });
});
